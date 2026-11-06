import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { PNG } from 'pngjs';
import { createComputerPreview, projectionPng, createComputerProgram } from '../app/program/program-core.mjs';
import { TOOLS, createComputerTools } from '../app/program/native-runtime.mjs';
const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222';
const agent = 'user:33333333-3333-4333-8333-333333333333';
const caller = session => ({ agent, session, name: 'Codex' });
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const png = (width = 8, height = 4) => PNG.sync.write(new PNG({ width, height })).toString('base64');
const shot = () => ({ content: [{ type: 'image', mimeType: 'image/png', data: png() }], structuredContent: {
  pid: 44, window_id: 77, window_bounds: { x: 10, y: 20, width: 80, height: 40 }, screenshot_width: 8, screenshot_height: 4 } });
function fixture(extra = {}) {
  const sources = [], notices = [], calls = [], contexts = [];
  const context = new AsyncLocalStorage();
  let time = 1000, stopped = false;
  const preview = createComputerPreview({
    projection: { async create(driver) {
      const source = { id: `source-${sources.length}`, driver, frames: [], closed: 0,
        async publish(frame) { contexts.push(context.getStore()); this.frames.push(frame); return this.frames.length; },
        async close() { this.closed++; await driver.close(); } };
      sources.push(source); return source;
    } },
    native: { async cursorState(owner) { calls.push({ owner }); return { structuredContent: {
      enabled: true, session: 'real-native-session', position: { x: 30, y: 30 }, visual_state: { requested_action: 'click' } } }; } },
    tools: { async call(name, args, who) { calls.push({ name, args, who }); return shot(); } },
    control: { stoppedFor: () => stopped ? 'The person pressed Stop.' : null },
    now: () => time, notify: async notification => { notices.push(notification); }, log: { warn() {} }, ...extra,
  });
  const observe = (session = a, result = shot()) => preview.observed({ caller: caller(session), owner: `native-${session}`, name: 'get_window_state', args: { pid: 44, window_id: 77 }, pid: 44, windowId: 77, result });
  return { preview, sources, notices, calls, contexts, context, observe,
    time(value) { time = value; }, stop() { stopped = true; } };
}
test('preview metadata is task-private and never contains screenshot bytes or identities in notifications', async t => {
  const f = fixture(); t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'get_window_state', { text: 'private-a' })(shot()); f.observe();
  for (let i = 0; i < 4; i++) await tick();
  const state = await f.preview.read(a);
  assert.equal(state.projection, 'source-0'); assert.equal(state.frames.length, 1);
  assert.equal(state.actions[0].args.text, 'private-a');
  assert.equal(JSON.stringify(state).includes(png()), false);
  assert.equal((await f.preview.read(b)).actions.length, 0);
  assert.equal((await f.preview.read(b)).projection, null);
  assert.equal((await f.preview.read(null)).session, false);
  assert(f.notices.every(value => JSON.stringify(value) === '{"method":"notifications/computer-use/changed"}'));
});
test('creation failure or a pending projection cannot delay an agent operation; late acquisition is closed after disposal', async () => {
  const pending = deferred(); let closed = 0;
  const f = fixture({ projection: { create: () => pending.promise } });
  const end = f.preview.begin(caller(a), 'click', {});
  end({ content: [] });
  assert.equal((await f.preview.read(a)).actions[0].status, 'done');
  f.preview.dispose();
  pending.resolve({ close: async () => { closed++; } });
  await tick(); assert.equal(closed, 1);
  const rejected = fixture({ projection: { create() { throw new Error('Unavailable'); } } });
  rejected.preview.begin(caller(a), 'click', {})({ content: [] });
  assert.equal((await rejected.preview.read(a)).actions[0].status, 'done'); rejected.preview.dispose();
});
test('live capture uses its own native lane, exact target and actual cursor samples; Stop prevents capture', async t => {
  const f = fixture(); t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'get_window_state', {})(shot()); f.observe(); await tick();
  const state = await f.preview.read(a, { live: true });
  assert.deepEqual(state.frames.at(-1).cursor, { x: 2, y: 1, revision: 'real-native-session:30:30:click:undefined', click: true });
  const capture = f.calls.find(value => value.name);
  assert.equal(capture.who.preview, true); assert.equal(capture.who.session, a);
  assert.equal(capture.args.pid, 44); assert.equal(capture.args.window_id, 77);
  assert.equal(capture.args.display_only, true);
  const count = f.calls.length;
  await f.preview.read(a, { live: true }); assert.equal(f.calls.length, count, 'capture is throttled');
  f.time(2000); f.stop();
  assert.match((await f.preview.read(a, { live: true })).liveProblem, /Stop/);
  assert.equal(f.calls.length, count);
});

test('live capture scale changes advance the picture coordinate revision without changing the target epoch', async t => {
  let windowWidth = 80;
  const f = fixture({ tools: { async call() {
    const result = shot(); result.structuredContent.window_bounds.width = windowWidth;
    return result;
  } } });
  t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'get_window_state', {})(shot()); f.observe(); await tick();
  const before = structuredClone(await f.preview.read(a)), context = frame => ({ viewer: 'scale-viewer', frame });
  const point = action => ({ kind: 'pointer', action, button: 'left', x: .25, y: .5 });
  const driver = f.sources[0].driver;
  assert.equal((await driver.input(point('down'), context(before.frames.at(-1)))).status, 'applied');
  windowWidth = 160;
  const resized = await f.preview.read(a, { live: true });
  assert.equal(resized.targetRevision, before.targetRevision);
  assert.equal(resized.frames.at(-1).width, before.frames.at(-1).width, 'equal PNG dimensions do not imply equal native scale');
  assert.notEqual(resized.frames.at(-1).coordinateRevision, before.frames.at(-1).coordinateRevision);
  assert.equal((await driver.input(point('move'), context(resized.frames.at(-1)))).status, 'rejected');
  assert.equal((await driver.input(point('up'), context(resized.frames.at(-1)))).status, 'rejected');
  windowWidth = 80; f.time(2000);
  const restored = await f.preview.read(a, { live: true });
  assert.notEqual(restored.frames.at(-1).coordinateRevision, before.frames.at(-1).coordinateRevision,
    'returning to an old size creates a new coordinate revision');
});

test('publishing a new coordinate space revokes pending input but permits fresh input on the same viewer', async t => {
  let windowWidth = 80, heldSignal;
  const pending = deferred();
  const f = fixture({ tools: { async call(name, args, who) {
    if (name === 'type_text') {
      if (args.text === 'old') { heldSignal = who.signal; return pending.promise; }
      assert.equal(who.signal.aborted, false, 'new work must not inherit the old revision cancellation');
      return { content: [] };
    }
    const result = shot(); result.structuredContent.window_bounds.width = windowWidth;
    return result;
  } } });
  t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'get_window_state', {})(shot()); f.observe(); await tick();
  const before = structuredClone(await f.preview.read(a)), driver = f.sources[0].driver;
  const context = frame => ({ viewer: 'same-viewer', frame });
  const old = driver.input({ kind: 'text', text: 'old' }, context(before.frames.at(-1)));
  await tick();
  assert.equal(heldSignal.aborted, false);
  windowWidth = 160;
  const current = structuredClone(await f.preview.read(a, { live: true }));
  assert.equal(heldSignal.aborted, true, 'coordinate revision publication cancels already admitted old work');
  assert.equal((await driver.input({ kind: 'text', text: 'new' }, context(current.frames.at(-1)))).status, 'applied');
  pending.resolve({ content: [] });
  assert.equal((await old).status, 'unknown', 'an already dispatched boundary remains explicitly uncertain');
});
test('a target change discards late capture and decorations from the old window', async t => {
  const pending = deferred();
  const f = fixture({ tools: { call: () => pending.promise } }); t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'click', {})({ content: [] }); f.observe(); await tick();
  const read = f.preview.read(a, { live: true }); await tick();
  f.preview.observed({ caller: caller(a), owner: 'native-a', name: 'click', args: {}, pid: 55, windowId: 88, result: { content: [], structuredContent: { pid: 55, window_id: 88 } } });
  pending.resolve(shot()); await read;
  assert.equal(f.sources[0].frames.length, 1, 'only the original operation frame was published');
  assert.equal((await f.preview.read(a)).target.pid, 55);
});
test('a new observation of the same window supersedes an old capture and switches to the actual latest agent', async t => {
  const pending = deferred(), captured = [];
  const f = fixture({ tools: { call: (_name, _args, who) => { captured.push(who); return pending.promise; } } });
  t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'click', {})({ content: [] }); f.observe(); await tick();
  const read = f.preview.read(a, { live: true }); await tick();
  const next = { ...caller(a), agent: 'user:44444444-4444-4444-8444-444444444444' };
  f.preview.observed({ caller: next, owner: 'second-agent', name: 'get_window_state', args: {}, pid: 44, windowId: 77, result: shot() });
  pending.resolve(shot()); await read; await tick();
  assert.equal(f.sources[0].frames.length, 2, 'late live capture cannot overwrite the newer operation image');
  f.time(2000); await f.preview.read(a, { live: true });
  assert.equal(captured.at(-1).agent, next.agent);
});
test('failed acquisition retries only inside a later real call; all preview pixels stay unavailable while denied', async t => {
  let creates = 0;
  const f = fixture({ projection: { create() { creates++; throw new Error('Not available'); } } });
  t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'click', {})({ content: [] });
  f.preview.begin(caller(a), 'click', {})({ content: [] });
  f.time(100_000); await f.preview.read(a, { live: true }); assert.equal(creates, 1);
  f.preview.begin(caller(a), 'click', {})({ content: [] }); assert.equal(creates, 2);
  assert.equal((await f.preview.read(a)).projection, null);
});
test('held preview refresh/publish does not inherit an ended or concurrent task call', async t => {
  const f = fixture(); t.after(() => f.preview.dispose());
  f.context.run('original-call', () => { f.preview.begin(caller(a), 'click', {})({ content: [] }); f.observe(); });
  await tick();
  await f.context.run('unrelated-call', () => f.sources[0].driver.refresh());
  assert(f.contexts.length >= 1); assert(f.contexts.every(value => value === undefined));
  const frame = (await f.preview.read(a)).frames.at(-1);
  const result = await f.context.run('unrelated-call', () => f.sources[0].driver.input({ kind: 'text', text: '你好', source: 'ime' }, {
    viewer: 'person-a', frame, signal: new AbortController().signal,
  }));
  assert.equal(result.status, 'applied');
  const typed = f.calls.find(value => value.name === 'type_text');
  assert.equal(typed.who.session, a); assert.equal(typed.who.humanViewer, 'person-a');
  assert(f.contexts.every(value => value === undefined));
});
test('revocation aborts in-flight preview and retires private resources; LRU bounds task state', async t => {
  let signal; const pending = deferred();
  const f = fixture({ tools: { call: (_name, _args, who) => { signal = who.signal; return pending.promise; } } });
  t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'click', {})({ content: [] }); f.observe(); await tick();
  const read = f.preview.read(a, { live: true }); await tick();
  await f.sources[0].driver.close(); assert.equal(signal.aborted, true);
  pending.resolve(shot()); const retired = await read;
  assert.equal(retired.projection, null); assert.equal(retired.actions.length, 0);
  assert.equal((await f.preview.read(a)).projection, null);
  for (let i = 0; i < 17; i++) f.preview.begin(caller(`task-${i}`), 'click', {})({ content: [] });
  await tick(); assert.equal((await f.preview.read('task-0')).actions.length, 0);
  assert.equal((await f.preview.read('task-16')).actions.length, 1);
});
test('open task pages once after success, retry only after failure and never wait for display', async t => {
  let opens = 0;
  const f = fixture({ showTaskPages() { opens++; if (opens === 1) throw new Error('Not loaded'); return new Promise(() => {}); } });
  t.after(() => f.preview.dispose());
  f.preview.begin(caller(a), 'click', {})({ content: [] }); f.observe();
  f.observe(); assert.equal(opens, 1);
  f.time(61_000); f.observe(); assert.equal(opens, 2);
  f.time(121_000); f.observe(); assert.equal(opens, 2, 'pending request is not duplicated');
  assert.equal((await f.preview.read(a)).actions[0].status, 'done');
});
test('transport compression preserves source coordinates and enforces malformed/oversized capture boundaries', () => {
  const image = new PNG({ width: 512, height: 512 });
  let seed = 17;
  for (let i = 0; i < image.data.length; i++) { seed = Math.imul(seed, 1664525) + 1013904223 | 0; image.data[i] = seed >>> 24; }
  const frame = projectionPng(PNG.sync.write(image).toString('base64'));
  assert.equal(frame.width, 512); assert.equal(frame.height, 512);
  assert(Buffer.from(frame.data, 'base64').length <= 512 * 1024);
  assert(PNG.sync.read(Buffer.from(frame.data, 'base64')).width < frame.width);
  assert.throws(() => projectionPng('bad'), /not a PNG/);
  const bad = Buffer.from(png(), 'base64'); bad.writeUInt32BE(8193, 16);
  assert.throws(() => projectionPng(bad.toString('base64')), /dimensions/);
});
test('page tools trust only the bound task and do not expose pixels through the MCP protocol', async t => {
  const native = { async callTool(name) { return name === 'check_permissions' ? { structuredContent: { accessibility: true, screen_recording: true } } : shot(); }, dispose() {} };
  const f = fixture();
  const program = createComputerProgram({ specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    native, platform: 'darwin', projection: { create: async driver => ({ id: 'private-source', publish: async () => 1, close: async () => driver.close() }) },
    protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }) });
  t.after(() => { program.dispose(); f.preview.dispose(); });
  await program.call({ name: 'get_window_state', arguments: { pid: 44, window_id: 77 }, _meta: { 'gugu/agent': agent, 'gugu/sessionId': a } });
  await tick();
  const page = session => ({ 'gugu/caller': 'app', 'gugu/sessionId': session });
  const own = await program.call({ name: 'preview_state', _meta: page(a) });
  assert.equal(own.structuredContent.projection, 'private-source'); assert.equal(own.content.some(b => b.type === 'image'), false);
  assert.equal((await program.call({ name: 'preview_state', _meta: page(b) })).structuredContent.projection, null);
  assert.equal((await program.call({ name: 'preview_state', arguments: { session: a }, _meta: page(b) })).structuredContent.code, 'invalid_args');
});
test('real preview dispatch preserves permission and host guards while isolating its lane from agent input', async () => {
  const calls = []; let controls = 0;
  const tools = createComputerTools({ specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    platform: 'darwin', protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }),
    control: { begin() { controls++; }, stoppedFor() { return null; } },
    cua: { async callTool(name, args, options) { calls.push({ name, args, options }); return name === 'check_permissions'
      ? { structuredContent: { accessibility: true, screen_recording: true } } : shot(); } } });
  await tools.call('get_window_state', { pid: 44, window_id: 77 }, caller(a));
  await tools.call('get_window_state', { pid: 44, window_id: 77, display_only: true }, { ...caller(a), preview: true });
  const [agentCall, previewCall] = calls.filter(call => call.name === 'get_window_state');
  assert.notEqual(agentCall.options.lane, previewCall.options.lane);
  assert.equal(previewCall.options.lane, agentCall.options.lane + '-preview');
  assert.equal(previewCall.args.session, previewCall.options.lane);
  assert.equal(controls, 0, 'viewing never registers a control action');
  const count = calls.length;
  assert.equal((await tools.call('get_window_state', { pid: 10, window_id: 77 }, { ...caller(a), preview: true })).structuredContent.code, 'invalid_args');
  assert.equal(calls.length, count);
});
