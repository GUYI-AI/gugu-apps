import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { readFile } from 'node:fs/promises';
import { createComputerProgram } from '../app/program/program-core.mjs';
import { createComputerControl } from '../app/program/native-runtime.mjs';
const { tools: specs } = JSON.parse(await readFile(new URL('../native/tool-specs.json', import.meta.url), 'utf8'));

test('a new picture coordinate system cannot convert an old pointer-down into a native drag', async t => {
  const task = '11111111-1111-4111-8111-111111111111';
  const agent = 'user:33333333-3333-4333-8333-333333333333';
  let width = 800, time = 1000, driver;
  const published = [], calls = [];
  const shot = () => ({ content: [{ type: 'image', mimeType: 'image/png',
    data: PNG.sync.write(new PNG({ width, height: 400 })).toString('base64') }],
    structuredContent: { pid: 44, window_id: 77, screenshot_width: width, screenshot_height: 400, capture_id: 'current-lane-capture' } });
  const control = createComputerControl({ view: { show() {}, hide() {} } });
  const program = createComputerProgram({ specs, platform: 'darwin', control,
    protectedHost: () => ({ pids: new Set([999]), names: new Set(['gugu']) }),
    projection: { async create(value) { driver = value; return { id: 'own-source',
      async publish(frame) { published.push(frame); return published.length; }, async close() {} }; } },
    native: { dispose() {}, async callTool(name, args) { calls.push({ name, args });
      return name === 'check_permissions' ? { structuredContent: { accessibility: true, screen_recording: true } }
        : name === 'get_window_state' ? shot() : { content: [] }; } }, log: { warn() {} } });
  t.after(() => program.dispose());
  const read = async live => structuredClone((await program.call({ name: 'preview_state', arguments: { live },
    _meta: { 'gugu/caller': 'app', 'gugu/sessionId': task } })).structuredContent);
  const observed = await program.call({ name: 'get_window_state', arguments: { pid: 44, window_id: 77 },
    _meta: { 'gugu/agent': agent, 'gugu/sessionId': task } });
  assert.notEqual(observed.isError, true);
  await new Promise(resolve => setImmediate(resolve));
  const before = await read(false);
  const context = frame => ({ viewer: 'same-native-viewer', signal: new AbortController().signal, frame });
  const point = action => ({ kind: 'pointer', action, button: 'left', x: .25, y: .5 });
  assert.equal((await driver.input(point('down'), context(before.frames.at(-1)))).status, 'applied');
  assert.equal(calls.filter(call => ['click', 'drag'].includes(call.name)).length, 0, 'down records intent without holding a native button');

  width = 1600; time = 2000;
  const after = await read(true);
  assert.equal(after.targetRevision, before.targetRevision, 'ordinary live capture preserves the target epoch');
  assert.equal(before.frames.at(-1).width, 800);
  assert.equal(after.frames.at(-1).width, 1600);
  const result = await driver.input(point('up'), context(after.frames.at(-1)));
  const mutations = calls.filter(call => ['click', 'drag'].includes(call.name));
  console.log(JSON.stringify({ result, mutations }));
  assert.deepEqual(mutations, [], 'a cancelled old coordinate intent must not become an unintended native drag');
  assert.equal(result.status, 'rejected');
});
