import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPreviewInput } from '../program-src/preview-input.mjs';
import { createComputerTools, createComputerControl } from '../app/program/native-runtime.mjs';
const { tools: specs } = JSON.parse(await readFile(new URL('../native/tool-specs.json', import.meta.url), 'utf8'));
function setup({ permission = true, protectedPid = 999, width = 800 } = {}) {
  const native = [], control = createComputerControl({ view: { show() {}, hide() {} } });
  const caller = { agent: 'user:33333333-3333-4333-8333-333333333333', session: '11111111-1111-4111-8111-111111111111' };
  const tools = createComputerTools({ specs, platform: 'darwin', control,
    protectedHost: () => ({ pids: new Set([protectedPid]), names: new Set(['gugu']) }),
    cua: { async callTool(name, args, options) {
      native.push({ name, args, options });
      if (name === 'check_permissions') return { structuredContent: { accessibility: permission, screen_recording: permission } };
      if (name === 'get_window_state') return { structuredContent: { pid: 44, window_id: 77, screenshot_width: width,
        screenshot_height: 400, capture_id: options.lane + '-capture' } };
      return { content: [] };
    } } });
  const state = { caller, abort: new AbortController(), epoch: 1, target: { pid: 44, window_id: 77 }, frames: [{ sequence: 1,
    width: 800, height: 400, epoch: 1, target: { pid: 44, window_id: 77 }, inputReady: true, at: new Date(1000).toISOString() }] };
  const input = createPreviewInput({ state: () => state, valid: () => true, tools, control, refresh() {}, now: () => 1000 });
  const context = viewer => ({ viewer, signal: new AbortController().signal, frame: { sequence: 1, width: 800, height: 400 } });
  const point = action => ({ kind: 'pointer', action, x: .5, y: .5, button: 'left' });
  return { native, control, tools, caller, input, context, point };
}
test('actual App policy calibrates and applies pointer input on the same viewer lane, isolated from agent and other viewers', async t => {
  const f = setup(); t.after(() => f.control.dispose());
  await f.input.input(f.point('down'), f.context('A'));
  assert.equal((await f.input.input(f.point('up'), f.context('A'))).status, 'applied');
  await f.input.input({ kind: 'text', text: '中文粘贴' }, f.context('B'));
  await f.tools.call('type_text', { pid: 44, window_id: 77, text: 'agent' }, f.caller);
  const capture = f.native.find(c => c.name === 'get_window_state'), click = f.native.find(c => c.name === 'click');
  const text = f.native.filter(c => c.name === 'type_text');
  assert.equal(click.options.lane, capture.options.lane);
  assert.equal(click.args.capture_id, click.options.lane + '-capture');
  assert.equal(click.args.session, click.options.lane);
  assert.notEqual(text[0].options.lane, click.options.lane);
  assert.notEqual(text[1].options.lane, click.options.lane);
  assert.notEqual(text[0].options.lane, text[1].options.lane);
});
test('actual driver permission refusal does not send text or request permission', async t => {
  const f = setup({ permission: false }); t.after(() => f.control.dispose());
  const result = await f.input.input({ kind: 'text', text: 'never' }, f.context('A'));
  assert.equal(result.status, 'rejected');
  assert.match(result.reason, /permission is missing/);
  assert.deepEqual(f.native.map(c => c.name), ['check_permissions']);
  assert.equal(f.native[0].args.prompt, false);
});
test('actual protected-host and changed native dimensions refuse pointer input without mutation', async t => {
  for (const options of [{ protectedPid: 44 }, { width: 900 }]) {
    const f = setup(options); t.after(() => f.control.dispose());
    await f.input.input(f.point('down'), f.context('A'));
    assert.equal((await f.input.input(f.point('up'), f.context('A'))).status, 'rejected');
    assert.equal(f.native.some(c => c.name === 'click'), false);
  }
});
test('the real Stop state refuses later picture input while a different application remains operable', async t => {
  const f = setup(); t.after(() => f.control.dispose());
  const current = f.control.begin({ pid: 44, windowId: 77 });
  f.control.stop();
  assert.equal(current.signal.aborted, true);
  assert.equal((await f.input.input({ kind: 'text', text: 'blocked' }, f.context('A'))).status, 'rejected');
  assert.equal(f.native.length, 0);
  const other = await f.tools.call('type_text', { pid: 55, window_id: 88, text: 'other app' }, f.caller);
  assert.notEqual(other.isError, true);
  current.end();
});
