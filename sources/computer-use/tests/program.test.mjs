import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerProgram, createProgramNative } from '../app/program/program-core.mjs';
import { TOOLS } from '../app/program/native-runtime.mjs';
const taskA = '11111111-1111-4111-8111-111111111111', taskB = '22222222-2222-4222-8222-222222222222';
const agent = 'user:33333333-3333-4333-8333-333333333333';
const meta = session => ({ 'gugu/agent': agent, 'gugu/sessionId': session });
async function within(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('The cancellation result did not arrive.')), 2_000); })]); }
  finally { clearTimeout(timer); }
}
function fixture(extra = {}) {
  const calls = [], settingsCalls = [];
  let disposals = 0;
  const native = { async callTool(name, args, options) { calls.push({ name, args, options }); return name === 'check_permissions' ? { structuredContent: { accessibility: true, screen_recording: true } } : { content: [{ type: 'image', mimeType: 'image/png', data: 'native-image' }] }; }, dispose() { disposals++; } };
  const program = createComputerProgram({ specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    native, platform: 'darwin', protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }),
    settings: { async openSettings(...args) { settingsCalls.push(args); return { permissionGrantedByThisCall: false }; } }, ...extra });
  return { program, calls, settingsCalls, disposals: () => disposals };
}
test('only gateway metadata selects a native owner; arguments cannot forge the caller', async () => {
  const { program, calls } = fixture();
  const forged = await program.call({ name: 'click', arguments: { pid: 44, agent, session: taskA } });
  assert.equal(forged.structuredContent.code, 'not_granted'); assert.equal(calls.length, 0);
  const image = await program.call({ name: 'get_window_state', arguments: { pid: 44 }, _meta: meta(taskA) });
  await program.call({ name: 'get_window_state', arguments: { pid: 44 }, _meta: meta(taskB) });
  assert.equal(image.content[0].type, 'image', 'native pictures must not become JSON text');
  assert.notEqual(calls[1].args.session, calls[3].args.session);
  assert(program.list().filter(tool => tool._meta.ui.visibility.includes('model')).every(tool => !tool.inputSchema.properties.session));
});
test('page permission status is the driver result; agents cannot call page controls or impersonate a page', async () => {
  const { program, calls, settingsCalls } = fixture();
  assert.equal((await program.call({ name: 'permissions_state', _meta: meta(taskA) })).structuredContent.code, 'not_granted');
  assert.equal((await program.call({ name: 'click', arguments: { pid: 44 }, _meta: { ...meta(taskA), 'gugu/caller': 'app' } })).structuredContent.code, 'not_granted');
  await program.call({ name: 'permissions_state', _meta: { 'gugu/caller': 'app' } });
  assert.deepEqual(calls[0].args, { prompt: false });
  await program.call({ name: 'open_system_settings', arguments: { permission: 'screen' }, _meta: { 'gugu/caller': 'app' } });
  assert.equal(settingsCalls[0][0], 'screen');
  assert.equal((await program.call({ name: 'open_system_settings', arguments: { permission: 'screen' }, _meta: { ...meta(taskA), 'gugu/caller': 'app' } })).structuredContent.code, 'not_granted');
  assert.equal(settingsCalls.length, 1, 'an agent working a page cannot open settings as the person');
  assert.equal((await program.call({ name: 'open_system_settings', arguments: { permission: 'screen', session: taskB }, _meta: { 'gugu/caller': 'app' } })).structuredContent.code, 'invalid_args');
});
test('single-call cancellation does not cancel another task; disposal aborts all calls and refuses new work', { timeout: 6_000 }, async t => {
  const active = new Map(); let closed = 0;
  const { program } = fixture({ native: { async callTool(name, args, options) {
    if (name === 'check_permissions') return { structuredContent: { accessibility: true, screen_recording: true } };
    return new Promise((resolve, reject) => { active.set(args.pid, { resolve, signal: options.signal }); options.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }); });
  }, dispose() { closed++; } } });
  t.after(() => program.dispose());
  const stop = new AbortController();
  const a = program.call({ name: 'click', arguments: { pid: 44 }, _meta: meta(taskA) }, { signal: stop.signal });
  const b = program.call({ name: 'click', arguments: { pid: 77 }, _meta: meta(taskB) });
  const deadline = Date.now() + 2_000;
  while (active.size < 2 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(active.size, 2, 'both calls must reach native execution');
  stop.abort(); assert.equal((await within(a)).structuredContent.code, 'cancelled'); assert.equal(active.get(77).signal.aborted, false);
  program.dispose(); assert.equal((await within(b)).structuredContent.code, 'cancelled');
  assert.equal(closed, 1); program.dispose(); assert.equal(closed, 1);
  assert.equal((await program.call({ name: 'click', arguments: { pid: 44 }, _meta: meta(taskA) })).structuredContent.code, 'revoked');
});
test('consent blockers return without preparing a native driver or waiting for a person', async () => {
  const { program, calls } = fixture();
  const result = await Promise.race([program.call({ name: 'click', arguments: { pid: 44, delivery_mode: 'foreground' }, _meta: meta(taskA) }), new Promise((_, reject) => setTimeout(() => reject(new Error('blocked waiting for a person')), 300))]);
  assert.equal(result.structuredContent.code, 'needs_confirmation'); assert.equal(calls.length, 0);
});
test('a cancelled preparation cannot create a late client after program disposal', async () => {
  let finish, created = 0;
  const gate = new Promise(resolve => { finish = resolve; });
  const { native } = createProgramNative({ dataDir: '/test/app-data', bundleDir: '/test/bundle', platform: 'darwin', arch: 'arm64',
    prepare: async () => { await gate; return { binary: '/driver', revision: 'test' }; }, client: () => { created++; return {}; }, settings: () => ({}) });
  const rejected = assert.rejects(native.callTool('list_apps', {}), /stopped/);
  native.dispose(); finish(); await rejected; assert.equal(created, 0);
});

test('one caller cancelling native preparation does not own another caller’s initialization', async () => {
  let finish, created = 0;
  const gate = new Promise(resolve => { finish = resolve; });
  const { native } = createProgramNative({ dataDir: '/test/app-data', bundleDir: '/test/bundle', platform: 'darwin', arch: 'arm64',
    prepare: ({ signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('caller cancelled')), { once: true });
      gate.then(() => resolve({ binary: '/driver', revision: 'test' }));
    }), settings: () => ({}), client: () => { created++; return { async callTool() { return { content: [], structuredContent: { ok: true } }; }, dispose() {} }; } });
  const stop = new AbortController();
  const a = assert.rejects(native.callTool('list_apps', {}, { signal: stop.signal }), /cancelled/);
  const b = native.callTool('list_apps', {});
  stop.abort(); finish(); await a;
  assert.equal((await b).structuredContent.ok, true); assert.equal(created, 1); native.dispose();
});
