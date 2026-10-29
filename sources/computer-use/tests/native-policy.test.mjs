import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerControl, createComputerTools, TOOLS, cuaEnvironment } from '../app/program/native-runtime.mjs';

const self = { pids: new Set([10]), names: new Set(['咕咕', 'gugu']) };
const caller = { agent: 'user:agent-a', session: 'session-a' };
function fixture(extra = {}) {
  const calls = [];
  const readPermissions = extra.permissions ?? (async () => ({ permissions: { accessibility: true, screen: true } }));
  const tools = createComputerTools({ platform: 'darwin', protectedHost: () => self, permissions: async () => ({ permissions: { accessibility: true, screen: true } }),
    cua: { callTool: async (name, args, options) => { if (name === 'check_permissions') { const state = await readPermissions(); return { structuredContent: { accessibility: state.permissions.accessibility, screen_recording: state.permissions.screen, source: 'cua_driver' } }; } calls.push({ name, args, options }); return { content: [{ type: 'image', mimeType: 'image/png', data: 'png-data' }], structuredContent: { snapshot_id: 'shot', pid: 44, window_id: 3 } }; } },
    specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' }, pid: { type: 'number' } } } })), ...extra });
  return { tools, calls };
}
test('protected host, desktop input and injected owner cannot reach the driver', async () => {
  const { tools, calls } = fixture();
  for (const [tool, args] of [['click', { pid: 10, confirmed: true }], ['click', { scope: 'desktop', confirmed: true }], ['click', {}], ['run_steps', { pid: 10, steps: [{ click: {} }] }], ['click', { pid: 44, session: 'forged' }], ['click', { pid: 44, device: 'elsewhere' }]]) {
    assert.equal((await tools.call(tool, args, caller)).isError, true);
  }
  assert.equal(calls.length, 0);
});
test('foreground tool returns immediately for the agent to ask; explicit retry never forwards its confirmation flag', async () => {
  const { tools, calls } = fixture();
  for (const args of [{ pid: 44, delivery_mode: 'foreground' }, { pid: 44, foreground_fallback: true }, { pid: 44, delivery_mode: 'foreground', confirmed: 'true' }]) {
    const value = await tools.call('click', args, caller);
    assert.equal(value.structuredContent.code, 'needs_confirmation');
    assert(value.content[0].text.includes('AskUserQuestion'));
  }
  assert.equal(calls.length, 0);
  await tools.call('click', { pid: 44, delivery_mode: 'foreground', confirmed: true }, caller);
  assert.equal(calls.length, 1); assert(!('confirmed' in calls[0].args));
  await tools.call('click', { pid: 44 }, caller); assert.equal(calls.length, 2);
});
test('new tasks use independent native owners, and images remain image blocks', async () => {
  const { tools, calls } = fixture();
  const image = await tools.call('get_window_state', { pid: 44, window_id: 3 }, caller);
  await tools.call('get_window_state', { pid: 44, window_id: 3 }, { ...caller, session: 'session-b' });
  assert.notEqual(calls[0].args.session, calls[1].args.session);
  assert.equal(image.content[0].type, 'image');
  assert(tools.list().every(tool => !('session' in tool.inputSchema.properties)));
  assert.equal((await tools.call('click', { pid: 44 }, { agent: '', session: '' })).isError, true);
});
test('missing permissions and missing protected-host identity fail closed without prompting or dispatch', async () => {
  const denied = fixture({ permissions: async () => ({ permissions: { accessibility: false, screen: false } }) });
  assert.equal((await denied.tools.call('click', { pid: 44 }, caller)).structuredContent.code, 'os_permission');
  const message = (await denied.tools.call('click', { pid: 44 }, caller)).content[0].text;
  assert(message.includes('Accessibility and Screen Recording')); assert(message.includes('No permission prompt'));
  assert.equal(denied.calls.length, 0);
  const unknown = fixture({ protectedHost: () => ({ pids: new Set(), names: new Set() }) });
  assert.equal((await unknown.tools.call('click', { pid: 44 }, caller)).structuredContent.code, 'unavailable');
  assert.equal(unknown.calls.length, 0);
});
test('dispose aborts in-flight work and refuses later work; pausing one target leaves others running', () => {
  let shown = 0;
  const control = createComputerControl({ view: { show() { shown++; }, hide() {} } });
  const other = control.begin({ pid: 77 }); const active = control.begin({ pid: 44 });
  control.stop(); assert.equal(active.signal.aborted, true); assert.equal(other.signal.aborted, false);
  control.resume(); const continued = control.begin({ pid: 44 });
  control.dispose(); assert.equal(continued.signal.aborted, true); assert.equal(other.signal.aborted, true);
  assert('refused' in control.begin({ pid: 88 }));
  const final = shown; control.stop(); control.resume(); assert.equal(shown, final, 'late page commands cannot resurrect a disposed control');
  assert(control.stoppedFor(44));
});
test('the native environment keeps system variables and disables telemetry and updates', () => {
  const value = cuaEnvironment({ home: '/app-data/driver', source: { PATH: '/bin', HOME: '/person', OPENAI_API_KEY: 'secret', GUGU_MCP_TOKEN: 'secret' } });
  assert.equal(value.CUA_DRIVER_RS_HOME, '/app-data/driver'); assert.equal(value.CUA_DRIVER_RS_UPDATE_CHECK, 'false');
  assert.equal(value.CUA_DRIVER_RS_TELEMETRY_ENABLED, 'false'); assert.equal(value.OPENAI_API_KEY, undefined); assert.equal(value.GUGU_MCP_TOKEN, undefined);
});

test('both batch step forms require explicit approval for foreground fallback', async () => {
  const { tools, calls } = fixture();
  for (const step of [{ tool: 'click', args: { pid: 44, foreground_fallback: true } }, { click: { pid: 44, foreground_fallback: true } }]) {
    const value = await tools.call('run_steps', { steps: [step] }, caller);
    assert.equal(value.structuredContent?.code, 'needs_confirmation');
    assert.equal(calls.length, 0, 'unapproved batch must not reach the native driver');
    await tools.call('run_steps', { steps: [step], confirmed: true }, caller);
    assert.equal(calls.pop().name, 'run_steps');
  }
});
test('screen-only denial blocks screenshot tools, while an accessibility-only window read remains available', async () => {
  const { tools, calls } = fixture({ permissions: async () => ({ permissions: { accessibility: true, screen: false } }) });
  for (const [name, args] of [['get_desktop_state', {}], ['zoom', { pid: 44 }], ['get_window_state', { pid: 44 }], ['verify_state', { pid: 44, include_screenshot: true }], ['run_steps', { steps: [{ click: { pid: 44 } }], observe: { include_screenshot: true } }]]) {
    const value = await tools.call(name, args, caller);
    assert.equal(value.structuredContent?.code, 'os_permission');
    assert.match(value.content[0].text, /Screen Recording permission is missing/);
    assert.doesNotMatch(value.content[0].text, /Accessibility permission is missing/);
  }
  assert.equal(calls.length, 0);
  await tools.call('get_window_state', { pid: 44, include_screenshot: false }, caller);
  await tools.call('run_steps', { steps: [{ click: { pid: 44 } }], observe: {} }, caller);
  assert.equal(calls.length, 2);
});
test('human blockers settle promptly without any answer, callback or driver dispatch', async () => {
  const { tools, calls } = fixture();
  // There is deliberately no person-answering route. Any style of wait fails the deadline.
  const settled = await Promise.race([
    tools.call('bring_to_front', { pid: 44 }, caller),
    new Promise((_, reject) => setTimeout(() => reject(new Error('human blocker did not return immediately')), 300)),
  ]);
  assert.equal(settled.structuredContent.code, 'needs_confirmation');
  assert.equal(calls.length, 0);
});
test('revocation reaches the native call signal and terminates in-flight dispatch', async () => {
  const control = createComputerControl({ view: { show() {}, hide() {} } });
  let nativeSignal;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const { tools } = fixture({ control, cua: { callTool(_name, _args, options) {
    if (_name === 'check_permissions') return Promise.resolve({ structuredContent: { accessibility: true, screen_recording: true } });
    nativeSignal = options.signal;
    started();
    return new Promise((_, reject) => {
      const abort = () => reject(new Error('native call cancelled'));
      if (nativeSignal.aborted) abort(); else nativeSignal.addEventListener('abort', abort, { once: true });
    });
  } } });
  const rejected = assert.rejects(tools.call('click', { pid: 44 }, caller), /native call cancelled/);
  await ready;
  control.dispose();
  await rejected;
  assert.equal(nativeSignal.aborted, true);
});

test('the native driver permission denial overrides a granted helper status', async () => {
  const probes = [], actions = [];
  const { tools } = fixture({ permissions: async () => ({ permissions: { accessibility: true, screen: true } }), cua: { async callTool(name, args, options) {
    if (name === 'check_permissions') { probes.push({ args, options }); return { structuredContent: { accessibility: true, screen_recording: false, source: 'cua_driver' } }; }
    actions.push(name); return { content: [], structuredContent: { ok: true } };
  } } });
  const result = await tools.call('get_desktop_state', {}, caller);
  assert.equal(result.structuredContent?.code, 'os_permission');
  assert.equal(actions.length, 0, 'helper grants must not authorize native screenshot dispatch');
  assert.equal(probes.length, 1);
  assert.equal(probes[0].args.prompt, false, 'agent path never raises permission dialogs');
});
