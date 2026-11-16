import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { createBrowserUse } from '../program-src/core.mjs';
import { createBrowserFeedbackViews } from '../program-src/feedback-view.mjs';

const tick = async () => { await new Promise(setImmediate); await new Promise(setImmediate); };

for (const first of [0, 1]) for (const rejected of [false, true]) {
  test(`native tool entry retains an overlapping call when ${first} ${rejected ? 'rejects' : 'resolves'}`, async t => {
    const updates = [], entered = [], pending = [Promise.withResolvers(), Promise.withResolvers()];
    const factory = createBrowserFeedbackViews({ surfaces: { open: async () => ({
      update: value => updates.push(value), close() {}, onEvent() {},
    }) } });
    const feedback = factory.attach({
      presentation: async () => ({ space: 'screen-dip', bounds: { x: 0, y: 0, width: 400, height: 300 },
        clip: { x: 0, y: 0, width: 400, height: 300 }, zoomFactor: 1, relativeTo: { windowId: 'owned-page' } }),
      onPresentation: () => () => {},
    });
    t.after(() => factory.dispose()); await tick();
    const browserUse = createBrowserUse({ playwright: {}, dataDir: tmpdir(), settings: {}, log() {},
      gugu: { withCall: async (_meta, work) => work() } });
    // Only page execution is fake: exercise createBrowserUse.callTool's real completion/error handling.
    browserUse.browsers.set('owned-session', { outputDir: tmpdir(), feedback,
      connect: async () => ({ callTool: ({ name }) => { entered.push(name); return pending[Number(name.at(-1))].promise; } }),
      close: async () => feedback.close(),
    });
    t.after(() => browserUse.closeAll());
    const results = [0, 1].map(i => browserUse.callTool({ name: `browser_action_${i}`, arguments: {},
      _meta: { 'gugu/sessionId': 'owned-session' } }));
    await tick(); assert.deepEqual(entered, ['browser_action_0', 'browser_action_1']);
    if (rejected) pending[first].reject(new Error('one-tool-failed'));
    else pending[first].resolve({ content: [] });
    const completed = await results[first];
    assert.equal(!!completed.isError, rejected);
    assert.deepEqual(updates.at(-1).data.action, { label: '正在操作网页', phase: 'running' });
    pending[1 - first].resolve({ content: [] }); await results[1 - first];
    assert.equal(updates.at(-1).data.action, null);
    assert.equal(updates.at(-1).visible, false);
  });
}
