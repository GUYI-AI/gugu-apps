import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { createComputerPreview } from '../program-src/preview.mjs';

const session = '11111111-1111-4111-8111-111111111111';
const caller = () => ({ agent: 'user:33333333-3333-4333-8333-333333333333', session });
const shot = window => ({ content: [{ type: 'image', mimeType: 'image/png', data: PNG.sync.write(new PNG({ width: 8, height: 4 })).toString('base64') }],
  structuredContent: { pid: 44, window_id: window, app_name: 'Editor', screenshot_width: 8, screenshot_height: 4,
    window_bounds: { x: 10, y: 20, width: 80, height: 40 } } });
const tick = async () => { for (let i = 0; i < 6; i++) await new Promise(setImmediate); };
function setup(legacy = false) {
  const frames = [], presentations = [], errors = [];
  let time = 1000;
  const source = { id: 'owned-source', async publish(value) { frames.push(value); return frames.length; }, async close() {},
    ...(legacy ? {} : { async present(value) { presentations.push(structuredClone(value)); } }) };
  const preview = createComputerPreview({ projection: { async create() { return source; } }, now: () => time,
    native: { async cursorState() { return { structuredContent: { enabled: true, session: 'native-session', position: { x: 30, y: 30 },
      visual_state: { requested_action: 'click' } } }; } },
    tools: { async call() { return shot(7); } }, control: { stoppedFor: () => null }, log: { warn(...args) { errors.push(args); } },
  });
  return { preview, frames, presentations, errors, time(value) { time = value; } };
}

test('the real observed target and publication receipt are reused, including actual action completion', async t => {
  const f = setup(); t.after(() => f.preview.dispose()); const who = caller();
  const finish = f.preview.begin(who, 'get_window_state', { pid: 44, window_id: 7 });
  f.preview.observed({ caller: who, owner: 'native-owner', name: 'get_window_state', args: {}, pid: 44, windowId: 7, result: shot(7) });
  await tick();
  const running = f.presentations.findLast(Boolean);
  assert.equal(running.frame.sequence, 1); assert.equal(running.frame.width, 8);
  assert.deepEqual(running.frame.target, f.frames[0].target); assert.equal(running.targetLabel, 'Editor');
  assert.equal(running.action.phase, 'running');
  finish(shot(7)); await tick(); assert.equal(f.presentations.findLast(Boolean).action.phase, 'done');
  await f.preview.read(session, { live: true }); await tick();
  assert.deepEqual(f.presentations.findLast(Boolean).cursor, { x: 2, y: 1, click: 'native-session:30:30:click:undefined' });
  assert.equal(f.errors.length, 0);
});

test('switching the observed target clears before the next target frame is published', async t => {
  const f = setup(); t.after(() => f.preview.dispose());
  for (const windowId of [7, 8]) {
    const who = caller(); f.preview.begin(who, 'get_window_state', { pid: 44, window_id: windowId });
    f.preview.observed({ caller: who, owner: 'native-owner', name: 'get_window_state', args: {}, pid: 44, windowId, result: shot(windowId) });
    await tick();
  }
  const last = f.presentations.findLast(Boolean);
  assert.equal(last.frame.target.id, 'computer:44:8');
  assert(f.presentations.slice(0, -1).includes(null));
  assert.equal(last.frame.sequence, 2);
});

test('a legacy pixel source without present keeps its existing preview path', async t => {
  const f = setup(true); t.after(() => f.preview.dispose()); const who = caller();
  f.preview.begin(who, 'get_window_state', {});
  f.preview.observed({ caller: who, owner: 'native-owner', name: 'get_window_state', args: {}, pid: 44, windowId: 7, result: shot(7) });
  await tick(); assert.equal(f.frames.length, 1); assert.equal(f.presentations.length, 0); assert.equal(f.errors.length, 0);
});

for (const first of [0, 1]) for (const failed of [false, true]) {
  test(`an overlapping target call remains running when call ${first} ${failed ? 'fails' : 'finishes'}`, async t => {
    const f = setup(); t.after(() => f.preview.dispose()); const who = caller();
    const observed = f.preview.begin(who, 'get_window_state', { pid: 44, window_id: 7 });
    f.preview.observed({ caller: who, owner: 'native-owner', name: 'get_window_state', args: {}, pid: 44, windowId: 7, result: shot(7) });
    await tick(); observed(shot(7));
    const finish = ['click', 'type_text'].map(tool => f.preview.begin(caller(), tool, { pid: 44, window_id: 7 }));
    finish[first](failed ? { isError: true, content: [] } : { content: [] }); await tick();
    const presentation = f.presentations.findLast(Boolean);
    assert.equal(presentation.action.phase, 'running');
    assert.equal(presentation.action.id, `action-${3 - first}`);
    finish[1 - first]({ content: [] }); await tick();
    assert.notEqual(f.presentations.findLast(Boolean).action.phase, 'running');
  });
}
