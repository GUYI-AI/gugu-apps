import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mach, tar } from '../tests/native-fixtures.mjs';

const runtime = await import(process.argv[2] ? pathToFileURL(path.resolve(process.argv[2])).href : new URL('../app/program/native-runtime.mjs', import.meta.url).href);
let failures = 0;
async function check(name, work) {
  try { await work(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.name}: ${error.message}`); }
}
await check('revocation aborts the current operation before accepting another', () => {
  const control = runtime.createComputerControl({ view: { show() {}, hide() {} } });
  const handle = control.begin({ pid: 44 }); control.dispose();
  assert.equal(handle.signal.aborted, true, 'revocation must abort the in-flight native operation');
  assert('refused' in control.begin({ pid: 44 }), 'revocation must refuse the next operation');
});
await check('two bound tasks never share a native input owner', async () => {
  const owners = [];
  const tools = runtime.createComputerTools({ platform: 'darwin', protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }), permissions: async () => ({ permissions: { accessibility: true, screen: true } }),
    specs: runtime.TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    cua: { callTool: async (_name, args) => { owners.push(args.session); return { content: [] }; } } });
  await tools.call('click', { pid: 44 }, { agent: 'agent-a', session: 'task-a' });
  await tools.call('click', { pid: 44 }, { agent: 'agent-a', session: 'task-b' });
  assert.notEqual(owners[0], owners[1], 'different bound tasks must have different native owners');
});
await check('a well-formed foreign archive cannot pass the pinned checksum', async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'cu-checksum-'));
  try {
    const good = tar([{ name: 'cua-driver', bytes: mach() }]);
    const changed = mach(); changed[63] = 17;
    const foreign = tar([{ name: 'cua-driver', bytes: changed }]);
    const release = { platform: 'darwin', arch: 'arm64', version: '0.36.0', revision: 'test', member: 'cua-driver', format: 'tar.gz', url: 'https://example.invalid/pinned', sha256: createHash('sha256').update(good).digest('hex') };
    let verified = 0;
    await assert.rejects(runtime.prepareDriver({ dataDir, platform: 'darwin', arch: 'arm64', releases: { 'darwin-arm64': release }, fetchArchive: async () => foreign, verify: async () => { verified++; } }), /integrity/, 'a foreign archive must be refused before execution');
    assert.equal(verified, 0, 'an unpinned executable must not reach signature/version execution');
  } finally { await rm(dataDir, { recursive: true, force: true }); }
});
process.exitCode = failures ? 1 : 0;
