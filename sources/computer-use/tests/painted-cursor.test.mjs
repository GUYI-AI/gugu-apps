import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPaintedCursor } from '../app/painted-cursor.js';
const frame = sequence => ({ sequence, width: 200, height: 100, cursor: { x: 12, y: 20, revision: `cursor-${sequence}`, click: true } });
test('cursor waits for the exact painted receipt regardless of metadata arrival order', () => {
  const shown = []; let hidden = 0;
  const cursor = createPaintedCursor({ show: (...args) => shown.push(args), hide: () => hidden++ });
  cursor.frames([frame(2)]); cursor.painted({ sequence: 1, width: 200, height: 100 });
  assert.equal(shown.length, 0);
  cursor.painted({ sequence: 2, width: 200, height: 100 }); assert.equal(shown.length, 1); assert.equal(shown[0][2], true);
  cursor.resize(); assert.equal(shown.at(-1)[2], false, 'resize does not replay a click');
  cursor.painted(null); assert(hidden > 0);
  cursor.painted({ sequence: 3, width: 200, height: 100 }); assert.equal(shown.length, 2);
  cursor.frames([frame(3)]); assert.equal(shown.length, 3);
});
test('dimensions, missing sample and reconnect invalidation never decorate a different picture', () => {
  let shows = 0, hides = 0;
  const cursor = createPaintedCursor({ show: () => shows++, hide: () => hides++ });
  cursor.frames([frame(1)]); cursor.painted({ sequence: 1, width: 100, height: 100 }); assert.equal(shows, 0);
  cursor.frames([{ ...frame(1), width: 100, cursor: null }]); assert.equal(shows, 0);
  cursor.reset(); cursor.painted({ sequence: 1, width: 200, height: 100 }); assert.equal(shows, 0); assert(hides >= 4);
});
