import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createComputerSurfaceView } from '../app/program/program-core.mjs';

const flush = async () => { await new Promise(setImmediate); await new Promise(setImmediate); };
const view = { sessionId: 'task-a', state: 'driving', callerName: 'Codex', app: { pid: 44, windowId: 7 } };
function fixture(extra = {}) {
  const context = new AsyncLocalStorage();
  const opens = [], updates = [], coordinates = [], callbacks = [], actions = [], errors = [], closes = [];
  const surfaces = {
    open(options) {
      opens.push({ options, context: context.getStore() });
      const index = opens.length;
      const handle = { id: String(index), update(options) { updates.push({ options, context: context.getStore() }); },
        onEvent(callback) { callbacks.push(callback); return () => {}; }, close() { closes.push(index); } };
      return extra.open ? extra.open(handle) : Promise.resolve(handle);
    },
    async screen(options) {
      coordinates.push({ options, context: context.getStore() });
      if (extra.screen) return extra.screen(options);
      return { bounds: options.bounds, workArea: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 };
    },
  };
  const native = { async callTool() { return { structuredContent: { windows: [
    { pid: 44, window_id: 7, is_on_screen: true, bounds: { x: 100, y: 100, width: 800, height: 600 } },
  ] } }; } };
  const presenter = createComputerSurfaceView({ surfaces, native, platform: extra.platform ?? 'darwin',
    onStop() { actions.push({ action: 'stop', context: context.getStore() }); },
    onResume() { actions.push({ action: 'resume', context: context.getStore() }); },
    log: { warn(...args) { errors.push(args); } }, later: () => ({ unref() {} }), clear() {} });
  return { presenter, context, opens, updates, coordinates, callbacks, actions, errors, closes };
}

test('create hidden in the actual call, then place the owned surface outside expired agent authority', async t => {
  const f = fixture(); t.after(() => f.presenter.dispose());
  f.context.run('real-call-a', () => f.presenter.show(view));
  assert.equal(f.opens[0].context, 'real-call-a');
  assert.equal(f.opens[0].options.visible, false);
  await flush();
  assert.equal(f.coordinates[0].context, undefined);
  const update = f.updates.find(update => update.options.visible);
  assert.equal(update.context, undefined);
  assert.deepEqual(update.options.relativeTo, { windowId: '7' });
  assert.equal(update.options.data.callerName, 'Codex');
});

test('Windows native geometry is converted before App placement', async t => {
  const f = fixture({ platform: 'win32', screen: options => ({
    bounds: { x: options.bounds.x / 2, y: options.bounds.y / 2, width: options.bounds.width / 2, height: options.bounds.height / 2 },
    workArea: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 2,
  }) });
  t.after(() => f.presenter.dispose()); f.presenter.show(view); await flush();
  assert.equal(f.coordinates[0].options.space, 'windows-screen-pixels');
  assert.equal(f.updates.find(update => update.options.visible).options.bounds.y, 7);
});

test('a real button updates its held surface without borrowing another simultaneous call', async t => {
  const f = fixture(); t.after(() => f.presenter.dispose());
  f.context.run('call-a', () => f.presenter.show(view)); await flush();
  const generation = f.opens[0].options.data.generation;
  f.context.run('unrelated-call-b', () => f.callbacks[0]({ type: 'message', message: { action: 'stop', generation } }));
  assert.deepEqual(f.actions, [{ action: 'stop', context: undefined }]);
  f.presenter.show({ ...view, state: 'paused' }); await flush();
  assert.equal(f.opens.length, 1, 'a button callback updates an existing lease instead of opening another');
  f.callbacks[0]({ type: 'message', message: { action: 'resume', generation } });
  assert.equal(f.actions.at(-1).action, 'resume');
});

test('events from a released target and late hidden-open results cannot control the current target', async t => {
  const f = fixture(); t.after(() => f.presenter.dispose());
  f.presenter.show(view); await flush();
  const old = f.callbacks[0], generation = f.opens[0].options.data.generation;
  f.presenter.show({ ...view, sessionId: 'task-b', app: { pid: 77 } }); await flush();
  old({ type: 'message', message: { action: 'stop', generation } });
  assert.equal(f.actions.length, 0);
  let finish;
  const late = fixture({ open: handle => new Promise(resolve => { finish = () => resolve(handle); }) });
  late.presenter.show(view); late.presenter.hide(); finish(); await flush();
  assert.deepEqual(late.closes, [1]); assert.equal(late.updates.length, 0); late.presenter.dispose();
});

test('display conversion and page-loading failures stay presentation failures', async t => {
  const f = fixture({ screen: () => { throw new Error('Display unavailable'); } });
  t.after(() => f.presenter.dispose()); f.presenter.show(view); await flush();
  assert(f.errors.length > 0);
  assert(f.updates.some(update => update.options.visible === false));
  assert.equal(f.actions.length, 0);
  const rejected = fixture({ open: () => Promise.reject(new Error('Could not load surface')) });
  rejected.presenter.show(view); await flush();
  assert(rejected.errors.length > 0); assert.equal(rejected.actions.length, 0); rejected.presenter.dispose();
});
