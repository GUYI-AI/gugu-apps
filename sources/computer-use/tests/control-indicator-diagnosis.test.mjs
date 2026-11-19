import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerSurfaceView } from '../program-src/control-view.mjs';

const tick = async () => { await new Promise(setImmediate); await new Promise(setImmediate); };
const target = { pid: 44, window_id: 7, is_on_screen: true, bounds: { x: 100, y: 100, width: 800, height: 600 } };
const view = { sessionId: 'owned-fixture', callerName: 'Fixture', state: 'driving', app: { pid: 44, windowId: 7 } };

function fixture(windows, failure) {
  const updates = [], logs = [], events = [], calls = [];
  const presenter = createComputerSurfaceView({ platform: 'darwin',
    native: { async callTool(name, args) { calls.push({ name, args }); return { structuredContent: { windows } }; } },
    surfaces: {
      async open() { return { update(value) { updates.push(value); }, onEvent(fn) { events.push(fn); return () => {}; }, close() {} }; },
      async screen({ bounds }) { if (failure) throw new Error(failure); return { bounds, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }; },
    },
    log: { warn(...args) { logs.push(args); } }, onStop() { throw new Error('No control request is allowed'); },
    onResume() { throw new Error('No control request is allowed'); }, later: () => ({ unref() {} }), clear() {},
  });
  return { presenter, updates, logs, events, calls };
}

test('the same owned target is shown and an absent/wrong/off-screen target hides the bar', async t => {
  for (const [reason, windows] of [['matched', [target]], ['absent', []],
    ['wrong-window', [{ ...target, window_id: 8 }]], ['wrong-process', [{ ...target, pid: 77 }]],
    ['off-screen', [{ ...target, is_on_screen: false }]], ['other-space', [{ ...target, on_current_space: false }]]]) {
    await t.test(reason, async () => {
      const f = fixture(windows); try {
        f.presenter.show(view); await tick();
        assert.deepEqual(f.calls, [{ name: 'list_windows', args: { pid: 44, on_screen_only: true } }]);
        assert.equal(f.updates.some(value => value.visible === true), reason === 'matched');
        if (reason !== 'matched') assert(f.updates.some(value => value.visible === false));
        assert.equal(f.logs.length, 0, 'these deliberate target hides are currently silent');
      } finally { f.presenter.dispose(); }
    });
  }
});

test('display conversion failure hides and logs, while native display refusal is reported by its held surface', async () => {
  const f = fixture([target], 'display-unavailable'); try {
    f.presenter.show(view); await tick();
    assert(f.updates.some(value => value.visible === false));
    assert(f.logs.some(args => args[0].error.includes('display-unavailable')));
    assert(f.logs.some(args => args[1] === 'Computer Use indicator could not be displayed'));
    f.events[0]({ type: 'display', reason: 'native-attachment-unavailable' });
    assert(f.logs.some(args => args[0].error.includes('native-attachment-unavailable')));
    assert(!f.updates.some(value => value.visible === true));
  } finally { f.presenter.dispose(); }
});
