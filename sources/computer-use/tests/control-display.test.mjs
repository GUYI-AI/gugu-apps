import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerControl, createComputerTools, TOOLS } from '../app/program/native-runtime.mjs';

const caller = { agent: 'user:agent-a', session: 'task-a', name: 'Codex' };
function toolsFor(control) {
  const calls = [];
  const tools = createComputerTools({
    platform: 'darwin', control,
    protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }),
    specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    cua: { async callTool(name, args, options) {
      if (name === 'check_permissions') return { structuredContent: { accessibility: true, screen_recording: true } };
      calls.push({ name, args, options });
      return { content: [], structuredContent: { pid: 44, window_id: 3, app_name: 'Calculator' } };
    } },
  });
  return { tools, calls };
}

test('inspection neither displays nor refreshes an activity bar; actions retain the learned target', async () => {
  const shown = [];
  const control = createComputerControl({ view: { show(value) { shown.push(value); }, hide() {} } });
  const { tools } = toolsFor(control);
  try {
    await tools.call('get_window_state', { pid: 44, window_id: 3 }, caller);
    await tools.call('list_apps', {}, caller);
    assert.equal(shown.length, 0);
    await tools.call('click', { pid: 44, window_id: 3 }, caller);
    assert.equal(shown.length, 1);
    assert.equal(shown[0].callerName, 'Codex');
    assert.equal(shown[0].app.name, 'Calculator');
    await tools.call('get_window_state', { pid: 44 }, caller);
    assert.equal(shown.length, 1);
  } finally { control.dispose(); }
});

test('an untargeted action replaces the previous subject so Stop cancels the current work', () => {
  const shown = [];
  const control = createComputerControl({ view: { show(value) { shown.push(value); }, hide() {} } });
  try {
    const targeted = control.begin({ pid: 44 });
    const current = control.begin({ callerName: 'Codex' });
    assert.equal(shown.at(-1).app, undefined);
    control.stop();
    assert.equal(current.signal.aborted, true);
    assert.equal(targeted.signal.aborted, true);
    assert('refused' in control.begin({ pid: 77 }));
    control.resume();
    assert(!('refused' in control.begin({ pid: 77 })));
  } finally { control.dispose(); }
});

for (const failure of ['throw', 'reject', 'false', 'pending']) {
  test(`a ${failure} display outcome cannot block native input or change explicit Stop semantics`, { timeout: 2_000 }, async () => {
    const errors = [];
    const control = createComputerControl({ onViewError(error) { errors.push(error); }, view: {
      show() {
        if (failure === 'throw') throw new Error('No display');
        if (failure === 'reject') return Promise.reject(new Error('No display'));
        if (failure === 'pending') return new Promise(() => {});
        return false;
      },
      hide() { throw new Error('Display was already closed'); },
    } });
    const { tools, calls } = toolsFor(control);
    try {
      const result = await tools.call('click', { pid: 44 }, caller);
      assert.notEqual(result.isError, true);
      assert.equal(calls.length, 1);
      control.stop();
      assert.equal((await tools.call('click', { pid: 44 }, caller)).structuredContent.code, 'revoked');
      assert.equal(calls.length, 1, 'an explicit Stop remains authoritative even if its display failed');
      control.resume();
      await tools.call('click', { pid: 44 }, caller);
      assert.equal(calls.length, 2);
      if (failure === 'throw' || failure === 'reject') assert(errors.length > 0);
    } finally { control.dispose(); }
  });
}

test('a broken display and reporter cannot prevent disposal from aborting in-flight work', () => {
  const control = createComputerControl({
    onViewError() { throw new Error('Reporter failed'); },
    view: { show() { throw new Error('No display'); }, hide() { throw new Error('No display'); } },
  });
  const first = control.begin({ pid: 44 });
  const second = control.begin({ pid: 77 });
  assert.doesNotThrow(() => control.dispose());
  assert.equal(first.signal.aborted, true);
  assert.equal(second.signal.aborted, true);
  assert('refused' in control.begin({ pid: 44 }));
});
