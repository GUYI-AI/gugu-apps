import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPaintedCursor } from '../app/painted-cursor.js';

test('same-size retained pixels from a previous target or epoch cannot revive its cursor', () => {
  const shown = [], hidden = [];
  const view = createPaintedCursor({ show(...args) { shown.push(args); }, hide() { hidden.push(true); } });
  const target = { pid: 44, window_id: 7 };
  const frame = { sequence: 1, width: 80, height: 40, epoch: 1, target, cursor: { x: 20, y: 10, revision: 'click', click: true } };
  view.painted(frame);
  view.frames([frame], { revision: 2, target });
  assert.equal(shown.length, 0);
  view.frames([frame], { revision: 1, target: { pid: 44, window_id: 8 } });
  assert.equal(shown.length, 0);
  view.frames([frame], { revision: 1, target });
  assert.equal(shown.length, 1);
  view.frames([frame], { revision: 1, target: null });
  assert.equal(shown.length, 1); assert(hidden.length > 0);
});
