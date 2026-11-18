import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computerPresentation, presentationTarget } from '../program-src/presentation.mjs';

const target = { pid: 44, window_id: 7, app: 'Editor' };
const frame = { sequence: 1, width: 80, height: 40, target: presentationTarget(target, 2) };
test('a native cursor uses the actual publication receipt and target revision', () => {
  const value = computerPresentation(frame, target, { x: 20, y: 10, revision: 'native-click', click: true },
    { tool: 'click', status: 'running' }, 'call-1', false);
  assert.deepEqual(value.frame, frame);
  assert.deepEqual(value.cursor, { x: 20, y: 10, click: 'native-click' });
  assert.deepEqual(value.action, { id: 'call-1', phase: 'running', label: '正在点击' });
});
test('out-of-frame and non-finite native coordinates never create a cursor', () => {
  for (const cursor of [{ x: 80, y: 10 }, { x: 20, y: -1 }, { x: NaN, y: 1 }, null]) {
    assert(!computerPresentation(frame, target, cursor).cursor);
  }
});
test('a missing target or action does not invent an operating state', () => {
  assert.equal(presentationTarget({ pid: 44 }, 2), null);
  assert.equal(computerPresentation({ ...frame, target: null }, target), null);
  assert(!computerPresentation(frame, target, null).action);
  assert.equal(computerPresentation(frame, target, null, { tool: 'click', status: 'done' }, 'call-1', false).action.phase, 'done');
});
