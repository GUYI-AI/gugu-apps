import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerControl, createComputerTools, TOOLS } from '../app/program/native-runtime.mjs';

const caller = { agent: 'user:agent-a', session: 'task-a' };
function setup(dispatch) {
  const shown = [], calls = [];
  const control = createComputerControl({ view: { show(value) { shown.push(value); }, hide() {} } });
  const tools = createComputerTools({ platform: 'darwin', control,
    protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }),
    specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    cua: { async callTool(name, args, options) {
      if (name === 'check_permissions') return { structuredContent: { accessibility: true, screen_recording: true } };
      calls.push({ name, args, options });
      return dispatch(name, args, options, shown);
    } },
  });
  return { tools, control, shown, calls };
}

test('a cold launch dispatches without a foreground lookup and attaches only to the returned app', async t => {
  const f = setup((name, _args, _options, shown) => {
    assert.equal(name, 'launch_app');
    assert.equal(shown.length, 0);
    return { content: [], structuredContent: { pid: 44, app_name: 'Calculator', windows: [
      { pid: 44, window_id: 3, is_on_screen: true, bounds: { x: 50, y: 50, width: 400, height: 300 } },
    ] } };
  });
  t.after(() => f.control.dispose());
  await f.tools.call('launch_app', { name: 'Calculator' }, caller);
  assert.equal(f.shown[0].app.pid, 44);
  assert.equal(f.shown[0].app.windowId, 3);
});

test('a global person Stop cannot be bypassed by deferring a cold launch', async t => {
  const f = setup(() => { throw new Error('Native launch must not execute'); });
  t.after(() => f.control.dispose());
  f.control.begin({}); f.control.stop();
  assert.equal((await f.tools.call('launch_app', { name: 'Calculator' }, caller)).structuredContent.code, 'revoked');
  assert.equal(f.calls.length, 0);
});

test('a mixed app batch cannot bypass any participating target Stop', async t => {
  const f = setup(() => { throw new Error('Native batch must not execute'); });
  t.after(() => f.control.dispose());
  f.control.begin({ pid: 44 }); f.control.stop();
  const result = await f.tools.call('run_steps', { steps: [{ click: { pid: 77 } }, { click: { pid: 44 } }] }, caller);
  assert.equal(result.structuredContent.code, 'revoked');
  assert.equal(f.calls.length, 0);
});

test('Stop on a participating App cancels an already executing mixed App batch', { timeout: 3_000 }, async t => {
  let began, signal;
  const ready = new Promise(resolve => { began = resolve; });
  const f = setup((_name, _args, options) => {
    signal = options.signal; began();
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Stopped')), { once: true }));
  });
  t.after(() => f.control.dispose());
  const pending = f.tools.call('run_steps', { steps: [{ click: { pid: 77 } }, { click: { pid: 44 } }] }, caller);
  await ready;
  f.control.begin({ pid: 44 }); f.control.stop();
  assert.equal(signal.aborted, true);
  assert.equal((await pending).structuredContent.code, 'revoked');
});

for (const lookup of ['offline', 'replaced']) {
  test(`app-name targeting preserves a Stop on lookup ${lookup} without addressing a stale pid`, async t => {
    const f = setup((name, args) => {
      if (name === 'get_window_state') return { content: [], structuredContent: { pid: 44, app_name: 'Calculator' } };
      if (name === 'list_windows') {
        if (lookup === 'offline') throw new Error('Lookup unavailable');
        return { structuredContent: { windows: [{ pid: 77, window_id: 8, app_name: 'Calculator', is_on_screen: true, bounds: { x: 0, y: 0, width: 400, height: 300 } }] } };
      }
      if (name === 'list_apps') throw new Error('Lookup unavailable');
      assert.equal(name, 'click'); assert.equal(args.pid, undefined); assert.equal(args.app, 'Calculator');
      return { content: [], structuredContent: { ok: true } };
    });
    t.after(() => f.control.dispose());
    await f.tools.call('get_window_state', { pid: 44 }, caller);
    f.control.begin({ pid: 44 }); f.control.stop();
    const result = await f.tools.call('click', { app: 'Calculator' }, caller);
    if (lookup === 'offline') {
      assert.equal(result.structuredContent.code, 'revoked');
      assert(!f.calls.some(call => call.name === 'click'));
    } else {
      assert.notEqual(result.isError, true);
      assert.equal(f.shown.at(-1).app.pid, 77);
    }
  });
}
