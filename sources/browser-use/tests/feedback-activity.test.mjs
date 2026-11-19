import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBrowserFeedbackViews } from '../program-src/feedback-view.mjs';

const tick = async () => { await new Promise(setImmediate); await new Promise(setImmediate); };
function fixture(t) {
  const updates = [];
  const factory = createBrowserFeedbackViews({ surfaces: { open: async () => ({
    update: value => updates.push(value), close() {}, onEvent() {},
  }) } });
  t.after(() => factory.dispose());
  const view = factory.attach({
    presentation: async () => ({ space: 'screen-dip', bounds: { x: 0, y: 0, width: 400, height: 300 },
      clip: { x: 0, y: 0, width: 400, height: 300 }, zoomFactor: 1, relativeTo: { windowId: 'owned-page' } }),
    onPresentation: () => () => {},
  });
  return { view, updates };
}

for (const first of [0, 1]) {
  test(`finishing call ${first + 1} keeps the other native browser call visible`, async t => {
    const { view, updates } = fixture(t); await tick();
    const calls = [Symbol('first'), Symbol('second')];
    calls.forEach((call, i) => view.activity(`action-${i}`, 'running', call));
    view.activity(null, undefined, calls[first]);
    assert.deepEqual(updates.at(-1).data.action, { label: `action-${1 - first}`, phase: 'running' });
    view.activity(null, undefined, calls[first]); // A duplicate completion cannot clear the surviving call.
    assert.equal(updates.at(-1).visible, true);
    view.activity(null, undefined, calls[1 - first]);
    assert.equal(updates.at(-1).visible, false);
    assert.equal(updates.at(-1).data.action, null);
  });
}

test('a rejected call cannot clear an overlapping call or revive a closed surface', async t => {
  const { view, updates } = fixture(t); await tick();
  const active = Symbol('active'), rejected = Symbol('rejected');
  view.activity('still-running', 'running', active);
  const failed = (async () => {
    view.activity('failing', 'running', rejected);
    try { await Promise.reject(new Error('native-call-failed')); }
    finally { view.activity(null, undefined, rejected); }
  })();
  await assert.rejects(failed, /native-call-failed/);
  assert.deepEqual(updates.at(-1).data.action, { label: 'still-running', phase: 'running' });
  view.close(); const before = updates.length;
  view.activity(null, undefined, active); view.activity('late', 'running', Symbol('late'));
  assert.equal(updates.length, before);
});

test('navigation clears the old pointer while the real page call is still active', async t => {
  const { view, updates } = fixture(t); await tick();
  const call = Symbol('navigate');
  view.activity('正在操作网页', 'running', call);
  view.observe('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 10, y: 20 }, Promise.resolve());
  await tick(); assert(updates.at(-1).data.cursor);
  view.clear();
  assert.equal(updates.at(-1).data.cursor, null);
  assert.deepEqual(updates.at(-1).data.action, { label: '正在操作网页', phase: 'running' });
  view.activity(null, undefined, call);
  assert.equal(updates.at(-1).visible, false);
});
