import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createBrowserFeedbackViews } from '../program-src/feedback-view.mjs';

const tick = async () => { await new Promise(setImmediate); await new Promise(setImmediate); };
const placement = { space: 'screen-dip', bounds: { x: 100, y: 100, width: 400, height: 300 },
  clip: { x: 110, y: 120, width: 380, height: 280 }, zoomFactor: 2, relativeTo: { windowId: 'owned-window' } };
function fixture(extra = {}) {
  const contexts = new AsyncLocalStorage(), opens = [], updates = [], closes = [], logs = [];
  let event = () => {};
  const lease = { title: 'Owned page', onPresentation(fn) { event = fn; return () => { event = () => {}; }; },
    async presentation() { return extra.presentation ? extra.presentation() : placement; } };
  const handle = { update(value) { updates.push({ value, context: contexts.getStore() }); }, close() { closes.push(true); }, onEvent() {} };
  const factory = createBrowserFeedbackViews({ surfaces: { open(options) {
    opens.push({ options, context: contexts.getStore() }); return extra.open ? extra.open(handle) : Promise.resolve(handle);
  } }, log: (...args) => logs.push(args) });
  const view = contexts.run('real-call', () => factory.attach(lease));
  return { view, factory, opens, updates, closes, logs, placement(value) { event(value); } };
}

test('creates a passive surface inside the real call and updates its owned placement outside call authority', async t => {
  const f = fixture(); t.after(() => f.factory.dispose()); await tick();
  assert.equal(f.opens[0].options.decorative, true); assert.equal(f.opens[0].options.visible, false);
  assert.equal(f.opens[0].context, 'real-call');
  f.view.activity('正在操作网页', 'running');
  const pending = Promise.withResolvers(); f.view.observe('Input.dispatchMouseEvent', { type: 'mousePressed', x: 10, y: 20 }, pending.promise);
  assert(!f.updates.at(-1).value.data.cursor);
  pending.resolve({}); await tick();
  const update = f.updates.at(-1);
  assert.equal(update.context, undefined); assert.deepEqual(update.value.bounds, placement.clip);
  assert.deepEqual(update.value.relativeTo, { windowId: 'owned-window' });
  assert.deepEqual(update.value.data.cursor, { x: 10, y: 20, click: 'click-1' });
});

test('unknown coordinates, hidden placement and closed leases never revive a decoration', async t => {
  const f = fixture(); t.after(() => f.factory.dispose()); await tick();
  f.view.observe('Input.dispatchMouseEvent', { x: 10, y: 20 }, Promise.resolve(), true); await tick();
  assert(!f.updates.at(-1).value.data.cursor);
  f.placement(null); assert.equal(f.updates.at(-1).value.visible, false);
  f.view.observe('Input.dispatchMouseEvent', { x: 10, y: 20 }, Promise.resolve()); await tick();
  assert.equal(f.updates.at(-1).value.visible, false);
  f.view.close(); f.placement(placement); await tick();
  assert.equal(f.closes.length, 1); assert.equal(f.updates.at(-1).value.visible, false);
});

test('malformed placement and a changed coordinate scale clear old native feedback', async t => {
  const f = fixture(); t.after(() => f.factory.dispose()); await tick();
  f.view.observe('Input.dispatchMouseEvent', { x: 10, y: 20 }, Promise.resolve()); await tick();
  assert(f.updates.at(-1).value.data.cursor);
  f.placement({ ...placement, zoomFactor: 3 });
  assert(!f.updates.at(-1).value.data.cursor);
  f.placement({ ...placement, relativeTo: null });
  assert.equal(f.updates.at(-1).value.visible, false);
});

test('a newer placement event wins over an initial read and failed display never authorizes input', async t => {
  const initial = Promise.withResolvers();
  const f = fixture({ presentation: () => initial.promise }); t.after(() => f.factory.dispose()); await tick();
  f.placement(null); initial.resolve(placement); await tick();
  assert.equal(f.updates.at(-1).value.visible, false);
  const failed = fixture({ open: () => Promise.reject(new Error('display-unavailable')) });
  t.after(() => failed.factory.dispose()); await tick();
  assert(failed.logs.length > 0);
  assert.doesNotThrow(() => failed.view.observe('Input.dispatchMouseEvent', { x: 1, y: 1 }, Promise.resolve()));
  assert.equal(failed.updates.length, 0);
});

test('late results after a target reset and a surface opening after closure are discarded', async t => {
  const f = fixture(); t.after(() => f.factory.dispose()); await tick();
  const native = Promise.withResolvers(); f.view.observe('Input.dispatchMouseEvent', { x: 10, y: 20 }, native.promise);
  f.view.clear(); native.resolve({}); await tick();
  assert(!f.updates.at(-1).value.data.cursor);
  const opening = Promise.withResolvers(); let handle;
  const late = fixture({ open: value => { handle = value; return opening.promise; } });
  late.view.close(); opening.resolve(handle); await tick();
  assert.equal(late.closes.length, 1); assert.equal(late.updates.length, 0); late.factory.dispose();
});
