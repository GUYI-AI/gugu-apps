import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FramePlayback } from '../app/frame-playback.js';

const frame = (seq, cursor = { x: seq * 10, y: 20, click: true }) => ({ seq, mimeType: 'image/png', data: String(seq), width: 460, height: 816, cursor });
function fixture() {
  const events = [];
  const view = { decode: async () => {}, move: async cursor => { events.push(['move', cursor.x]); }, commit: async (_src, f) => { events.push(['frame', f.seq]); }, place: cursor => events.push(['place', cursor.x]), click: () => events.push(['click']), hide: () => events.push(['hide']) };
  return { events, view, player: new FramePlayback(view) };
}

test('the new frame and click cannot run ahead of the actual sampled cursor presentation', async () => {
  const { events, view, player } = fixture();
  await player.show(frame(1));
  events.length = 0;
  let arrive;
  view.move = () => new Promise(resolve => { arrive = resolve; });
  const showing = player.show(frame(2));
  await Promise.resolve();
  assert.deepEqual(events, []);
  arrive();
  await showing;
  assert.deepEqual(events, [['frame', 2], ['place', 20], ['click']]);
});

test('a frame without a native cursor never plays planned or stale clicks', async () => {
  const { events, player } = fixture();
  await player.show(frame(1, null));
  assert.deepEqual(events, [['frame', 1], ['hide']]);
});

test('a new window size uses the new coordinate frame rather than flying across the old layout', async () => {
  const { events, player } = fixture();
  await player.show(frame(1));
  events.length = 0;
  await player.show({ ...frame(2), width: 916 });
  assert.deepEqual(events, [['frame', 2], ['place', 20], ['click']]);
});

test('reset while decoding prevents a previous task picture from appearing in the new task', async () => {
  const { events, view, player } = fixture();
  let decoded;
  view.decode = () => new Promise(resolve => { decoded = resolve; });
  const showing = player.show(frame(1));
  player.reset();
  decoded();
  await showing;
  assert.deepEqual(events, [['hide']]);
});
