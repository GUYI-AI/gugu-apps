import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createComputerControl } from '../app/program/native-runtime.mjs';
import { createComputerProgram } from '../app/program/program-core.mjs';
const { tools: specs } = JSON.parse(await readFile(new URL('../native/tool-specs.json', import.meta.url), 'utf8'));
const task = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
const agent = 'user:33333333-3333-4333-8333-333333333333';
test('page Pause targets its App even if another task showed the latest bar; Continue affects only that App', t => {
  const views = [], control = createComputerControl({ view: { show: v => views.push(v), hide() {} } });
  t.after(() => control.dispose());
  const a = control.begin({ pid: 44, sessionId: task }), b = control.begin({ pid: 55, sessionId: other });
  control.setTargetPaused({ pid: 44, sessionId: task, appName: 'A' }, true);
  assert.equal(a.signal.aborted, true); assert.equal(b.signal.aborted, false);
  assert.equal(views.at(-1).app.pid, 44);
  assert(control.stoppedFor(44)); assert.equal(control.stoppedFor(55), null);
  control.setTargetPaused({ pid: 55, sessionId: other }, true);
  assert.equal(control.setTargetPaused({ pid: 44, sessionId: task }, false), null);
  assert(control.stoppedFor(55)); assert.equal(control.stoppedFor(44), null);
  a.end(); b.end();
});
test('a task-specific page control neither releases nor hides the whole-computer Stop', t => {
  const views = [], control = createComputerControl({ view: { show: v => views.push(v), hide() {} } });
  t.after(() => control.dispose());
  const all = control.begin({ sessionId: task }); control.stop();
  for (const pause of [true, false]) assert(control.setTargetPaused({ pid: 44, sessionId: task }, pause));
  assert.equal(views.at(-1).app, undefined);
  control.resume(); assert.equal(control.stoppedFor(44), null); all.end();
});
function fixture() {
  const requests = [], control = createComputerControl({ view: { show() {}, hide() {} } });
  const program = createComputerProgram({ specs, platform: 'darwin', control,
    protectedHost: () => ({ pids: new Set([999]), names: new Set(['gugu']) }),
    native: { dispose() {}, async callTool(name, args) {
      requests.push({ name, args });
      return name === 'check_permissions' ? { structuredContent: { accessibility: true, screen_recording: true } }
        : { content: [], structuredContent: { pid: 44, window_id: 77, app_name: 'A' } };
    } },
    projection: { async create() { return { id: 'source-A', async close() {}, async publish() { return 1; } }; } }, log: { warn() {} },
  });
  const owner = { 'gugu/caller': 'app', 'gugu/sessionId': task };
  const read = () => program.call({ name: 'preview_state', arguments: {}, _meta: owner });
  const act = (args, meta = owner) => program.call({ name: 'preview_control', arguments: args, _meta: meta });
  const observe = () => program.call({ name: 'get_window_state', arguments: { pid: 44, window_id: 77 },
    _meta: { 'gugu/agent': agent, 'gugu/sessionId': task } });
  return { program, control, requests, owner, read, act, observe };
}
test('person page control is task-bound, rejects identity arguments and stale picture/target revisions', async t => {
  const f = fixture(); t.after(() => f.program.dispose());
  await f.observe();
  const snapshot = (await f.read()).structuredContent;
  const args = { action: 'pause', projection: snapshot.projection, targetRevision: snapshot.targetRevision };
  assert.equal((await f.act({ ...args, pid: 55 })).isError, true);
  assert.equal((await f.act(args, { ...f.owner, 'gugu/agent': agent })).isError, true);
  assert.equal((await f.act(args, { ...f.owner, 'gugu/sessionId': other })).isError, true);
  assert.equal((await f.act({ ...args, projection: 'source-B' })).isError, true);
  assert.equal(f.control.stoppedFor(44), null);
  assert.equal((await f.act(args)).structuredContent.paused, true);
  assert(f.control.stoppedFor(44));
  assert.equal((await f.act({ ...args, action: 'resume' })).structuredContent.paused, false);
  await f.observe();
  assert.equal((await f.act(args)).isError, true, 'a later target observation invalidates an old button intent');
  assert.equal(f.control.stoppedFor(44), null);
});
