import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPageContext } from '../app/page-context.js';

test('a page that was unbound at boot accepts its later binding without reloading', async () => {
  const events = [];
  let receive;
  await startPageContext({
    read: async () => { throw new Error('This page is not bound yet'); },
    subscribe: (listener) => { receive = listener; },
    accept: (context) => events.push(['context', context.workspace.sessionId]),
    reject: (error) => events.push(['error', error.message]),
  });
  assert.deepEqual(events, [['error', 'This page is not bound yet']]);
  receive({ workspace: { sessionId: 'own-session' } });
  assert.deepEqual(events.at(-1), ['context', 'own-session']);
});

test('the initial read cannot overwrite a newer context event', async () => {
  let finish;
  let receive;
  const accepted = [];
  const started = startPageContext({
    read: () => new Promise((resolve) => { finish = resolve; }),
    subscribe: (listener) => { receive = listener; },
    accept: (context) => accepted.push(context.workspace.sessionId),
    reject: assert.fail,
  });
  receive({ workspace: { sessionId: 'new' } });
  finish({ workspace: { sessionId: 'old' } });
  await started;
  assert.deepEqual(accepted, ['new']);
});

test('a late initial read rejection does not replace a working page with an error', async () => {
  let fail;
  let receive;
  const started = startPageContext({
    read: () => new Promise((_resolve, reject) => { fail = reject; }),
    subscribe: (listener) => { receive = listener; },
    accept: () => {},
    reject: assert.fail,
  });
  receive({ workspace: { sessionId: 'own-session' } });
  fail(new Error('old read timed out'));
  await started;
});

test('a normally bound page initializes once from its first read', async () => {
  const accepted = [];
  await startPageContext({
    read: async () => ({ workspace: { sessionId: 'own-session' } }),
    subscribe: () => {},
    accept: (context) => accepted.push(context.workspace.sessionId),
    reject: assert.fail,
  });
  assert.deepEqual(accepted, ['own-session']);
});
