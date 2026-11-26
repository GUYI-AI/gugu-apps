import { test } from 'node:test';
import assert from 'node:assert/strict';

// The control bar's page (control.js) in a minimal document: a click on the agent's name opens where that agent works —
// its session, or its private chat when that session is not on this computer (host API 66 `orChatWith`).
function element() {
  const listeners = {};
  return { hidden: false, disabled: false, textContent: '', title: '', dataset: {}, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(type, fn) { listeners[type] = fn; },
    click() { return listeners.click?.(); } };
}
const ui = { '.bar': element(), '.identity': element(), '.agent': element(), '.task': element(), 'button:not(.agent)': element(),
  '.button-label': element(), '.stop-icon': element(), '.resume-icon': element() };
const calls = [];
let context = null;
globalThis.document = { querySelector: selector => ui[selector], documentElement: { style: { setProperty() {} }, lang: '' }, body: { dataset: {} } };
globalThis.window = { gugu: {
  getContext: async () => context,
  onContextChanged() {},
  showSession: async (...args) => { calls.push(['showSession', ...args]); },
  surfaces: { post: async message => { calls.push(['post', message]); } },
} };
const task = '11111111-1111-4111-8111-111111111111', agent = 'user:33333333-3333-4333-8333-333333333333';
context = { locale: 'zh-CN', surface: { data: { generation: 1, state: 'driving', sessionId: task, agentId: agent, callerName: 'Codex' } } };
await import('../app/control.js');
await new Promise(resolve => setImmediate(resolve));

test('the name opens its session, naming the agent whose private chat opens when the session is not here', async () => {
  assert.equal(ui['.agent'].textContent, 'Codex');
  assert.equal(ui['.agent'].disabled, false);
  calls.length = 0;
  await ui['.agent'].click();
  assert.deepEqual(calls, [['showSession', task, { orChatWith: agent }]]);
  // Control: the Stop button still posts Stop to the program, and does not open anything.
  calls.length = 0;
  await ui['button:not(.agent)'].click();
  assert.deepEqual(calls, [['post', { generation: 1, action: 'stop' }]]);
});
