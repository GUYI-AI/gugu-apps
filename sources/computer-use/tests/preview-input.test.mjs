import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewInput } from '../program-src/preview-input.mjs';

const caller = { agent: 'user:33333333-3333-4333-8333-333333333333', session: '11111111-1111-4111-8111-111111111111' };
function fixture() {
  const calls = [], refreshed = [], lifetime = new AbortController();
  const state = { caller, abort: lifetime, epoch: 1, target: { pid: 44, window_id: 77 },
    frames: [{ sequence: 1, width: 800, height: 400, epoch: 1, at: new Date(1000).toISOString(),
      inputReady: true, target: { pid: 44, window_id: 77 }, captureId: 'capture-1' }] };
  let stopped = null, result = { content: [] };
  const handler = createPreviewInput({ state: () => state, valid: () => !lifetime.signal.aborted,
    tools: { async call(name, args, who) { calls.push({ name, args, who });
      if (name === 'get_window_state') return { structuredContent: { pid: 44, window_id: 77, screenshot_width: 800, screenshot_height: 400, capture_id: 'viewer-capture' } };
      return typeof result === 'function' ? result(who) : result; } },
    control: { stoppedFor: () => stopped }, refresh: () => refreshed.push(true), now: () => 1000 });
  const context = (viewer = 'viewer-a', sequence = 1) => ({ viewer, frame: { sequence, width: 800, height: 400 }, signal: new AbortController().signal });
  const pointer = (action, x = .25, y = .5, button = 'left') => ({ kind: 'pointer', action, x, y, button });
  return { state, calls, refreshed, lifetime, handler, context, pointer,
    stop() { stopped = 'The person pressed Stop.'; }, result(value) { result = value; } };
}

test('a click uses the acknowledged frame pixels and exact window; down/move never hold native buttons', async () => {
  const f = fixture(), ctx = f.context();
  assert.equal((await f.handler.input(f.pointer('down'), ctx)).status, 'applied');
  assert.equal(f.calls.length, 0);
  assert.equal((await f.handler.input(f.pointer('up'), ctx)).status, 'applied');
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].name, 'get_window_state');
  assert.equal(f.calls[1].name, 'click');
  assert.deepEqual(f.calls[1].args, { target: { kind: 'window', pid: 44, window_id: 77 }, delivery_mode: 'background',
    x: 200, y: 200, button: 'left', capture_id: 'viewer-capture' });
  assert.equal(f.calls[1].who.agent, caller.agent);
  assert.equal(f.calls[1].who.session, caller.session);
  assert.equal(f.calls[1].who.humanViewer, 'viewer-a');
  assert.equal(f.calls[1].who.preview, true);
  assert.equal(f.refreshed.length, 1);
});
test('Chinese IME commits and pasted Unicode use one text operation without clipboard or keyboard replay', async () => {
  const f = fixture();
  for (const source of ['ime', 'paste', 'typing']) {
    assert.equal((await f.handler.input({ kind: 'text', text: '你好🌏\n世界', source }, f.context())).status, 'applied');
  }
  assert.deepEqual(f.calls.map(c => [c.name, c.args.text]), Array(3).fill(['type_text', '你好🌏\n世界']));
});
test('special keys are atomic and modifier/up events cannot leave a key held', async () => {
  const f = fixture();
  await f.handler.input({ kind: 'key', action: 'down', key: 'Control', modifiers: ['control'] }, f.context());
  await f.handler.input({ kind: 'key', action: 'down', key: 'a', modifiers: ['control'] }, f.context());
  await f.handler.input({ kind: 'key', action: 'up', key: 'a', modifiers: ['control'] }, f.context());
  await f.handler.input({ kind: 'key', action: 'down', key: 'ArrowLeft' }, f.context());
  assert.deepEqual(f.calls.map(c => [c.name, c.args.key, c.args.modifiers]), [['press_key', 'a', ['ctrl']], ['press_key', 'left', undefined]]);
});
test('drag and wheel stay window scoped, with encoded density independent coordinates', async () => {
  const f = fixture(), ctx = f.context();
  await f.handler.input(f.pointer('down'), ctx);
  await f.handler.input(f.pointer('move', .75, .75), ctx);
  await f.handler.input(f.pointer('up', .75, .75), ctx);
  assert.equal(f.calls[1].name, 'drag');
  assert.deepEqual([f.calls[1].args.from_x, f.calls[1].args.from_y, f.calls[1].args.to_x, f.calls[1].args.to_y], [200, 200, 600, 300]);
  await f.handler.input({ kind: 'wheel', x: .5, y: .5, deltaX: 0, deltaY: 240 }, ctx);
  assert.equal(f.calls[3].name, 'scroll');
  assert.deepEqual([f.calls[3].args.direction, f.calls[3].args.amount], ['down', 3]);
});
test('missing, stale, resized, mismatched or uncalibrated frames never dispatch input', async () => {
  for (const change of [
    f => { f.state.frames = []; }, f => { f.state.epoch++; },
    f => { f.state.target = { pid: 55, window_id: 88 }; },
    f => { f.state.frames[0].inputReady = false; },
    f => { f.state.frames[0].width = 900; },
    f => { f.state.frames[0].at = new Date(-30000).toISOString(); },
  ]) {
    const f = fixture(); change(f);
    assert.equal((await f.handler.input({ kind: 'text', text: 'x' }, f.context())).status, 'rejected');
    assert.equal(f.calls.length, 0);
  }
});
test('Stop, revoked lifetime and an aborted input reject before native dispatch', async () => {
  for (const change of [f => f.stop(), f => f.lifetime.abort(), (_f, c) => { c.signal = AbortSignal.abort(); }]) {
    const f = fixture(), c = f.context(); change(f, c);
    assert.equal((await f.handler.input({ kind: 'text', text: 'x' }, c)).status, 'rejected');
    assert.equal(f.calls.length, 0);
  }
});
test('disconnect discards an unfinished gesture and cancels only that viewer input', async () => {
  const f = fixture();
  await f.handler.input(f.pointer('down'), f.context());
  f.handler.disconnect('viewer-a');
  assert.equal((await f.handler.input(f.pointer('up'), f.context())).status, 'rejected');
  assert.equal(f.calls.length, 0);
  const inputs = new Map();
  f.result(who => new Promise(resolve => { inputs.set(who.humanViewer, { signal: who.signal, resolve }); }));
  const a = f.handler.input({ kind: 'text', text: 'A' }, f.context());
  const b = f.handler.input({ kind: 'text', text: 'B' }, f.context('viewer-b'));
  await new Promise(resolve => setImmediate(resolve));
  f.handler.disconnect('viewer-a');
  assert.equal(inputs.get('viewer-a').signal.aborted, true);
  assert.equal(inputs.get('viewer-b').signal.aborted, false);
  inputs.get('viewer-a').resolve({ content: [] }); inputs.get('viewer-b').resolve({ content: [] });
  assert.equal((await a).status, 'unknown'); assert.equal((await b).status, 'applied');
});
test('retargeting between down and up discards the gesture rather than clicking the new window', async () => {
  const f = fixture();
  await f.handler.input(f.pointer('down'), f.context());
  f.state.epoch = 2; f.state.frames[0].epoch = 2;
  assert.equal((await f.handler.input(f.pointer('up'), f.context())).status, 'rejected');
  assert.equal(f.calls.length, 0);
});
test('an uncertain or throwing native operation is never automatically retried', async () => {
  const f = fixture();
  f.result({ isError: true, content: [{ type: 'text', text: 'Native reply lost after dispatch' }] });
  assert.equal((await f.handler.input({ kind: 'text', text: 'once' }, f.context())).status, 'unknown');
  f.result(() => { throw new Error('socket closed'); });
  assert.equal((await f.handler.input({ kind: 'text', text: 'twice' }, f.context())).status, 'unknown');
  assert.equal(f.calls.length, 2);
  f.result({ isError: true, structuredContent: { code: 'os_permission' }, content: [{ type: 'text', text: 'Missing Accessibility' }] });
  assert.equal((await f.handler.input({ kind: 'text', text: 'blocked' }, f.context())).status, 'rejected');
  assert.equal(f.calls.length, 3);
});

test('move and release cannot reuse a down from a different picture coordinate space', async () => {
  for (const action of ['move', 'up']) {
    const f = fixture();
    await f.handler.input(f.pointer('down'), f.context());
    f.state.frames.push({ ...f.state.frames[0], sequence: 2, width: 1600 });
    const context = { ...f.context(), frame: { sequence: 2, width: 1600, height: 400 } };
    const result = await f.handler.input(f.pointer(action), context);
    assert.equal(result.status, 'rejected');
    assert.match(result.reason, /picture|coordinates|gesture/i);
    assert.equal(f.calls.length, 0, 'coordinate-space rejection must happen before native calibration');
  }
});

test('resizing away and back cannot revive a gesture from an earlier coordinate revision', async () => {
  const f = fixture();
  f.state.frames[0].coordinateRevision = 1;
  await f.handler.input(f.pointer('down'), f.context());
  f.state.frames.push({ ...f.state.frames[0], sequence: 2, width: 1600, coordinateRevision: 2 },
    { ...f.state.frames[0], sequence: 3, coordinateRevision: 3 });
  assert.equal((await f.handler.input(f.pointer('up'), f.context('viewer-a', 3))).status, 'rejected');
  assert.equal(f.calls.length, 0);
});

test('a new capture in the same coordinate space preserves a valid gesture', async () => {
  const f = fixture();
  f.state.frames[0].coordinateRevision = 1;
  await f.handler.input(f.pointer('down'), f.context());
  f.state.frames.push({ ...f.state.frames[0], sequence: 2 });
  assert.equal((await f.handler.input(f.pointer('up'), f.context('viewer-a', 2))).status, 'applied');
  assert.equal(f.calls[1].name, 'click');
});

test('wheel, keys, IME and paste all reject an acknowledged frame from a superseded coordinate space', async () => {
  for (const input of [
    { kind: 'wheel', x: .5, y: .5, deltaX: 0, deltaY: 240 },
    { kind: 'key', action: 'down', key: 'ArrowLeft' },
    { kind: 'text', text: '中文', source: 'ime' },
    { kind: 'text', text: '中文粘贴', source: 'paste' },
  ]) {
    const f = fixture();
    f.state.frames.push({ ...f.state.frames[0], sequence: 2, width: 1600 });
    assert.equal((await f.handler.input(input, f.context())).status, 'rejected');
    assert.equal(f.calls.length, 0);
  }
});

test('a coordinate-space change during native calibration refuses dispatch even if dimensions return', async () => {
  const f = fixture();
  f.state.frames[0].coordinateRevision = 1;
  const pending = Promise.withResolvers();
  const original = f.handler;
  // Use the real adapter with a held viewer-lane observation to exercise its dispatch boundary.
  const calls = [];
  const handler = createPreviewInput({ state: () => f.state, valid: () => true, now: () => 1000, refresh() {},
    tools: { async call(name, args) { calls.push(name); return name === 'get_window_state' ? pending.promise : { content: [] }; } } });
  try {
    await handler.input(f.pointer('down'), f.context());
    const input = handler.input(f.pointer('up'), f.context());
    await new Promise(resolve => setImmediate(resolve));
    f.state.frames.push({ ...f.state.frames[0], sequence: 2, coordinateRevision: 2 });
    pending.resolve({ structuredContent: { pid: 44, window_id: 77, screenshot_width: 800, screenshot_height: 400 } });
    assert.equal((await input).status, 'rejected');
    assert.deepEqual(calls, ['get_window_state']);
  } finally { handler.close(); original.close(); }
});

test('native calibration rejects changed window scale even when PNG dimensions match', async () => {
  const f = fixture(), calls = [];
  f.state.frames[0].coordinateKey = JSON.stringify([800, 400, 800, 400]);
  const handler = createPreviewInput({ state: () => f.state, valid: () => true, now: () => 1000, refresh() {},
    tools: { async call(name) { calls.push(name); return { structuredContent: {
      pid: 44, window_id: 77, screenshot_width: 800, screenshot_height: 400,
      window_bounds: { x: 0, y: 0, width: 1600, height: 800 } } }; } } });
  try {
    await handler.input(f.pointer('down'), f.context());
    assert.equal((await handler.input(f.pointer('up'), f.context())).status, 'rejected');
    assert.deepEqual(calls, ['get_window_state']);
  } finally { handler.close(); }
});

test('an invalidated gesture keeps rejecting remaining moves and its release until a new down', async () => {
  const f = fixture();
  await f.handler.input(f.pointer('down'), f.context());
  f.handler.invalidate();
  for (const action of ['move', 'move', 'up']) {
    assert.equal((await f.handler.input(f.pointer(action), f.context())).status, 'rejected');
  }
  assert.equal(f.calls.length, 0);
  await f.handler.input(f.pointer('down'), f.context());
  assert.equal((await f.handler.input(f.pointer('up'), f.context())).status, 'applied');
});
