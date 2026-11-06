import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { createComputerProgram } from '../app/program/program-core.mjs';
import { createComputerControl } from '../app/program/native-runtime.mjs';
const { tools: specs } = JSON.parse(await readFile(new URL('../native/tool-specs.json', import.meta.url), 'utf8'));
const task = '11111111-1111-4111-8111-111111111111';
const agent = 'user:33333333-3333-4333-8333-333333333333';
for (const [name, input, holdAt] of [
  ['IME', { kind: 'text', text: '\u4f60\u597d', source: 'ime' }, 1],
  ['paste', { kind: 'text', text: 'committed paste', source: 'paste' }, 1],
  ['key', { kind: 'key', action: 'down', key: 'Enter' }, 1],
  ['click after calibration', null, 2],
]) test(`a changed picture fences ${name} while the real policy is awaiting permission admission`, async t => {
  let width = 800, driver, humanChecks = 0;
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  const calls = [];
  const shot = () => ({ content: [{ type: 'image', mimeType: 'image/png',
    data: PNG.sync.write(new PNG({ width, height: 400 })).toString('base64') }], structuredContent: {
      pid: 44, window_id: 77, screenshot_width: width, screenshot_height: 400,
      window_bounds: { x: 10, y: 20, width, height: 400 }, capture_id: 'this-viewer-capture' } });
  const control = createComputerControl({ view: { show() {}, hide() {} } });
  const program = createComputerProgram({ specs, platform: 'darwin', control,
    protectedHost: () => ({ pids: new Set([999]), names: new Set(['gugu']) }),
    projection: { async create(value) { driver = value; let sequence = 0; return { id: 'source',
      async publish() { return ++sequence; }, async close() {} }; } },
    native: { dispose() {}, async callTool(tool, args, options) {
      calls.push({ name: tool, args });
      if (tool === 'check_permissions') {
        if (options.lane.includes('-human-') && ++humanChecks === holdAt) {
          entered.resolve(); await release.promise;
        }
        return { structuredContent: { accessibility: true, screen_recording: true } };
      }
      return tool === 'get_window_state' ? shot() : { content: [] };
    } }, log: { warn() {} } });
  t.after(() => program.dispose());
  const read = async live => structuredClone((await program.call({ name: 'preview_state', arguments: { live },
    _meta: { 'gugu/caller': 'app', 'gugu/sessionId': task } })).structuredContent);
  await program.call({ name: 'get_window_state', arguments: { pid: 44, window_id: 77 },
    _meta: { 'gugu/agent': agent, 'gugu/sessionId': task } });
  await new Promise(resolve => setImmediate(resolve));
  const before = await read(false);
  const context = { viewer: 'same-viewer', signal: new AbortController().signal, frame: before.frames.at(-1) };
  if (!input) await driver.input({ kind: 'pointer', action: 'down', button: 'left', x: .25, y: .5 }, context);
  const work = driver.input(input ?? { kind: 'pointer', action: 'up', button: 'left', x: .25, y: .5 }, context);
  try {
    await entered.promise;
    width = 1200;
    const after = await read(true);
    assert.notEqual(after.frames.at(-1).coordinateRevision, before.frames.at(-1).coordinateRevision);
  } finally { release.resolve(); }
  const outcome = await work;
  const mutations = calls.filter(c => ['type_text', 'press_key', 'click', 'drag'].includes(c.name));
  console.log(JSON.stringify({ name, outcome, mutations }));
  assert.deepEqual(mutations, [], 'obsolete input must be fenced before native mutation, including asynchronous policy checks');
  assert.notEqual(outcome.status, 'applied');
});
