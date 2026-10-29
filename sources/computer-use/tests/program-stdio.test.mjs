import { test } from 'node:test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const fixture = fileURLToPath(new URL('./program-stdio-fixture.mjs', import.meta.url));
const meta = { 'gugu/agent': 'user:33333333-3333-4333-8333-333333333333', 'gugu/sessionId': '11111111-1111-4111-8111-111111111111' };
for (const event of ['stdin:close', 'stdin:error', 'stdout:error']) test(`stdio cleanup runs on ${event}`, async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cu-stream-end-')), report = path.join(dir, 'events');
  t.after(() => rm(dir, { recursive: true, force: true }));
  const child = spawn(process.execPath, [fixture], { env: { CU_TEST_REPORT: report, CU_TEST_STREAM_END: event }, stdio: 'pipe' });
  let stderr = '', timer;
  child.stdin.on('error', () => {}); // the child may have closed its read end before cleanup sends EOF
  child.stderr.on('data', chunk => { stderr += chunk; });
  const closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  try {
    // Keep stdin open: an automatic EOF would hide a missing close/error handler.
    const result = await Promise.race([closed, new Promise(resolve => { timer = setTimeout(() => resolve(null), 2_000); })]);
    assert(result, 'stream failure must dispose and exit without waiting for EOF');
    assert.equal(result.code, 0, stderr);
    const events = (await readFile(report, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(events.filter(event => event.event === 'disposed').length, 1);
  } finally {
    clearTimeout(timer);
    child.stdin.end();
    await closed;
  }
});
async function until(check) {
  const end = Date.now() + 2000;
  while (Date.now() < end) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.fail('The protocol event did not arrive.');
}
test('real MCP stdio preserves images, routes cancellation and disposes pending work on EOF', { timeout: 8_000 }, async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cu-program-wire-')), report = path.join(dir, 'events');
  t.after(() => rm(dir, { recursive: true, force: true }));
  const client = new Client({ name: 'program-wire-test', version: '1' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [fixture], env: { PATH: process.env.PATH ?? '', CU_TEST_REPORT: report }, stderr: 'pipe' });
  t.after(() => client.close());
  await client.connect(transport);
  const definitions = (await client.listTools()).tools;
  assert(definitions.some(tool => tool.name === 'get_window_state'));
  assert(definitions.find(tool => tool.name === 'permissions_state')._meta.ui.visibility.includes('app'));
  const image = await client.callTool({ name: 'get_window_state', arguments: { pid: 44 }, _meta: meta });
  assert.equal(image.content[0].type, 'image'); assert.equal(image.structuredContent.fixture, true);
  const events = async () => (await readFile(report, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  const stop = new AbortController();
  const rejected = assert.rejects(client.callTool({ name: 'click', arguments: { pid: 44 }, _meta: meta }, undefined, { signal: stop.signal }));
  await until(async () => (await events()).some(event => event.event === 'native' && event.pid === 44));
  stop.abort(); await rejected;
  await until(async () => (await events()).some(event => event.event === 'cancelled' && event.pid === 44));
  assert.equal((await client.callTool({ name: 'get_window_state', arguments: { pid: 77 }, _meta: meta })).content[0].type, 'image');
  const pending = assert.rejects(client.callTool({ name: 'click', arguments: { pid: 88 }, _meta: meta }));
  await until(async () => (await events()).some(event => event.event === 'native' && event.pid === 88));
  await client.close(); await pending;
  await until(async () => (await events()).some(event => event.event === 'disposed'));
  assert((await events()).some(event => event.event === 'cancelled' && event.pid === 88));
  assert.equal((await events()).filter(event => event.event === 'disposed').length, 1);
});
