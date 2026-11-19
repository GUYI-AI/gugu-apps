import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { TOOLS } from '../app/program/native-runtime.mjs';
const core = await import(process.argv[2] ? pathToFileURL(path.resolve(process.argv[2])).href : new URL('../app/program/program-core.mjs', import.meta.url).href);
const specs = TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } }));
const meta = task => ({ 'gugu/agent': 'user:33333333-3333-4333-8333-333333333333', 'gugu/sessionId': task });
const taskA = '11111111-1111-4111-8111-111111111111', taskB = '22222222-2222-4222-8222-222222222222';
const base = { specs, platform: 'darwin', protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }) };
let failures = 0;
async function check(name, work) { try { await work(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}: ${error.name}: ${error.message}`); } }
await check('program preserves the calling task in native ownership', async () => {
  const owners = [];
  const program = core.createComputerProgram({ ...base, native: { async callTool(name, args) {
    if (name === 'check_permissions') return { structuredContent: { accessibility: true, screen_recording: true } };
    owners.push(args.session); return { content: [] };
  }, dispose() {} } });
  await program.call({ name: 'click', arguments: { pid: 44 }, _meta: meta(taskA) });
  await program.call({ name: 'click', arguments: { pid: 77 }, _meta: meta(taskB) });
  assert.notEqual(owners[0], owners[1], 'two tasks must have independent native owners'); program.dispose();
});
await check('program forwards the single call cancellation signal', async () => {
  let signal, finish, began;
  const ready = new Promise(resolve => { began = resolve; });
  const program = core.createComputerProgram({ ...base, native: { async callTool(name, _args, options) {
    if (name === 'check_permissions') return { structuredContent: { accessibility: true, screen_recording: true } };
    signal = options.signal; began(); return new Promise(resolve => { finish = resolve; });
  }, dispose() {} } });
  const stop = new AbortController();
  const call = program.call({ name: 'click', arguments: { pid: 44 }, _meta: meta(taskA) }, { signal: stop.signal });
  await ready; stop.abort(); const aborted = signal.aborted;
  finish({ content: [] }); await call; program.dispose();
  assert.equal(aborted, true, 'the native call must observe its caller cancellation');
});
await check('program disposal terminates its native client', () => {
  let disposed = 0;
  const program = core.createComputerProgram({ ...base, native: { dispose() { disposed++; } } });
  program.dispose(); program.dispose(); assert.equal(disposed, 1, 'native client must be disposed exactly once');
});
process.exitCode = failures ? 1 : 0;
