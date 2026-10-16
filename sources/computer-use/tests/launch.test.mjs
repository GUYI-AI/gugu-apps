import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { once } from 'node:events';
import { launchConfig, runServer } from '../app/launch.mjs';

test('autodetects the installed macOS client, and fails explicitly when absent or not configured', () => {
  const expected = '/test/.codex/computer-use/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient';
  assert.deepEqual(launchConfig({}, { platform: 'darwin', home: '/test', exists: (path) => path === expected }), { command: expected, args: ['mcp'] });
  assert.throws(() => launchConfig({}, { platform: 'darwin', exists: () => false }), /没有找到/);
  assert.throws(() => launchConfig({}, { platform: 'linux' }), /填写/);
  assert.throws(() => launchConfig({ command: '/missing' }, { exists: () => false }), /找不到/);
  assert.deepEqual(launchConfig({ command: 'native-mcp', arguments: '[]' }), { command: 'native-mcp', args: [] });
  for (const args of ['{}', '[1]', 'not json']) assert.throws(() => launchConfig({ command: 'native-mcp', arguments: args }), /JSON 字符串数组/);
});

test('relays real MCP stdio bytes, argv, stderr and exit status without a shell or inherited Node mode', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gugu-computer-use-'));
  const fixture = join(dir, 'fixture.mjs');
  writeFileSync(fixture, `process.stderr.write('native diagnostic\\n');
process.stdin.on('data', bytes => process.stdout.write(bytes));
process.stdin.on('end', () => { process.stdout.write(JSON.stringify({args:process.argv.slice(2), nodeMode:process.env.ELECTRON_RUN_AS_NODE ?? null})+'\\n'); process.exitCode=7; });`);
  const input = new PassThrough(), output = new PassThrough(), error = new PassThrough();
  let received = '', diagnostics = '', code;
  output.on('data', (data) => { received += data; });
  error.on('data', (data) => { diagnostics += data; });
  try {
    const args = [fixture, 'space value', 'literal; $(unchanged)'];
    const child = runServer({ command: process.execPath, arguments: JSON.stringify(args) }, {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, input, output, error, onExit: (value) => { code = value; },
    });
    const closed = once(child, 'close');
    const request = '{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n';
    input.end(request);
    await closed;
    assert.equal(code, 7);
    assert.ok(received.startsWith(request));
    assert.deepEqual(JSON.parse(received.trim().split('\n').at(-1)), { args: args.slice(1), nodeMode: null });
    assert.match(diagnostics, /native diagnostic/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
