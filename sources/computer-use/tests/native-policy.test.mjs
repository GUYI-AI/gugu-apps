import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerControl, createComputerTools, TOOLS, cuaEnvironment } from '../app/program/native-runtime.mjs';

const self = { pids: new Set([10]), names: new Set(['咕咕', 'gugu']) };
const caller = { agent: 'user:agent-a', session: 'session-a' };
function fixture(extra = {}) {
  const calls = [];
  const tools = createComputerTools({ platform: 'darwin', protectedHost: () => self, permissions: async () => ({ permissions: { accessibility: true, screen: true } }),
    cua: { callTool: async (name, args, options) => { calls.push({ name, args, options }); return { content: [{ type: 'image', mimeType: 'image/png', data: 'png-data' }], structuredContent: { snapshot_id: 'shot', pid: 44, window_id: 3 } }; } },
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
  // Regression trap: the removed App-specific waiting callback must never be invoked.
  const { tools, calls } = fixture({ requestHuman: () => { throw new Error('An App must not wait for a person in a tool call.'); } });
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
  const control = createComputerControl({ view: { show() {}, hide() {} } });
  const other = control.begin({ pid: 77 }); const active = control.begin({ pid: 44 });
  control.stop(); assert.equal(active.signal.aborted, true); assert.equal(other.signal.aborted, false);
  control.resume(); const continued = control.begin({ pid: 44 });
  control.dispose(); assert.equal(continued.signal.aborted, true); assert.equal(other.signal.aborted, true);
  assert('refused' in control.begin({ pid: 88 }));
});
test('the native environment keeps system variables and disables telemetry and updates', () => {
  const value = cuaEnvironment({ home: '/app-data/driver', source: { PATH: '/bin', HOME: '/person', OPENAI_API_KEY: 'secret', GUGU_MCP_TOKEN: 'secret' } });
  assert.equal(value.CUA_DRIVER_RS_HOME, '/app-data/driver'); assert.equal(value.CUA_DRIVER_RS_UPDATE_CHECK, 'false');
  assert.equal(value.CUA_DRIVER_RS_TELEMETRY_ENABLED, 'false'); assert.equal(value.OPENAI_API_KEY, undefined); assert.equal(value.GUGU_MCP_TOKEN, undefined);
});
