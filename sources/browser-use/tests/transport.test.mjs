import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate as tick } from 'node:timers/promises';
import { createLeaseTransport, isMaintenance, PAGE_SESSION } from '../program-src/transport.mjs';
import { agentVisibleTools, answeredLocally, checkFileArguments } from '../program-src/core.mjs';

function fakeLease() {
  const sent = [];
  const messages = new Set();
  const closures = new Set();
  const lease = {
    sent,
    send: async (method, params, session) => { sent.push(['send', method, session]); return method === 'Target.getTargetInfo' ? { targetInfo: { targetId: 'T', type: 'other', url: 'about:blank' } } : { ok: method }; },
    maintain: async (method, params, session) => { sent.push(['maintain', method, session]); return { ok: method }; },
    onMessage(listener) { messages.add(listener); return () => messages.delete(listener); },
    onClose(listener) { closures.add(listener); return () => closures.delete(listener); },
    emit: (method, params, session) => { for (const listener of messages) listener(method, params, session); },
    end: (reason) => { for (const listener of closures) listener(reason); },
  };
  return lease;
}

async function connect(lease = fakeLease()) {
  const transport = createLeaseTransport(lease, { userAgent: 'UA Chrome/155.0.1.2', product: 'Chrome/155.0.1.2' });
  const received = [];
  transport.onmessage = (message) => received.push(message);
  const request = async (id, method, params, sessionId) => { await transport.send({ id, method, params, sessionId }); await tick(); await tick(); };
  return { lease, transport, received, request };
}

test('the browser level is answered here: one browser, one page, nothing forwarded', async () => {
  const { lease, received, request } = await connect();
  await request(1, 'Browser.getVersion');
  assert.deepEqual(received.pop(), { id: 1, sessionId: undefined, result: { protocolVersion: '1.3', product: 'Chrome/155.0.1.2', revision: '', userAgent: 'UA Chrome/155.0.1.2', jsVersion: '' } });
  await request(2, 'Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  assert.deepEqual(received.shift(), { id: 2, sessionId: undefined, result: {} });
  assert.deepEqual(received.shift().params, { sessionId: PAGE_SESSION, targetInfo: { targetId: 'T', type: 'page', url: 'about:blank', attached: true }, waitingForDebugger: false });
  for (const [id, method] of [[3, 'Target.createTarget'], [4, 'Browser.close'], [5, 'Target.getTargets']]) {
    await request(id, method);
    assert.match(received.pop().error.message, /not available/);
  }
  assert.deepEqual(lease.sent, [['send', 'Target.getTargetInfo', undefined]]);
});

test('page commands: maintenance through maintain, actions through send; other targets are refused', async () => {
  const { lease, received, request } = await connect();
  await request(1, 'Runtime.enable', {}, PAGE_SESSION);
  await request(2, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: 1, y: 2 }, PAGE_SESSION);
  await request(3, 'Page.addScriptToEvaluateOnNewDocument', { source: 'evil()', worldName: 'w' }, PAGE_SESSION);
  await request(4, 'Target.attachToTarget', { targetId: 'other' }, PAGE_SESSION);
  await request(5, 'Runtime.evaluate', {}, 'not-a-child');
  assert.deepEqual(lease.sent, [['maintain', 'Runtime.enable', undefined], ['send', 'Input.dispatchMouseEvent', undefined], ['send', 'Page.addScriptToEvaluateOnNewDocument', undefined]]);
  assert.match(received.find((m) => m.id === 4).error.message, /not available/);
  assert.equal(received.find((m) => m.id === 5).error.message, 'unknown session');
  // A child the page attached becomes addressable, under its own session.
  lease.emit('Target.attachedToTarget', { sessionId: 'child-1', targetInfo: { type: 'iframe' } });
  await tick();
  await request(6, 'Runtime.runIfWaitingForDebugger', {}, 'child-1');
  assert.deepEqual(lease.sent.at(-1), ['maintain', 'Runtime.runIfWaitingForDebugger', 'child-1']);
  assert.ok(received.some((m) => m.method === 'Target.attachedToTarget' && m.sessionId === PAGE_SESSION));
});

test('input reaches the page in the order Playwright sent it', async () => {
  const lease = fakeLease();
  const order = [];
  let first = true;
  const transport = createLeaseTransport(lease, { userAgent: '', product: '' }, {
    onInput: async (method, params) => { if (first) { first = false; await new Promise((r) => setTimeout(r, 30)); } order.push(params.type); },
  });
  transport.onmessage = () => {};
  await Promise.all(['mouseMoved', 'mousePressed', 'mouseReleased'].map((type, i) =>
    transport.send({ id: i, method: 'Input.dispatchMouseEvent', params: { type }, sessionId: PAGE_SESSION })));
  assert.deepEqual(order, ['mouseMoved', 'mousePressed', 'mouseReleased']);
  assert.deepEqual(lease.sent.map(([, method]) => method), ['Input.dispatchMouseEvent', 'Input.dispatchMouseEvent', 'Input.dispatchMouseEvent']);
});

test('the lease ending closes the transport once, and later commands fail', async () => {
  const { lease, transport, received, request } = await connect();
  const reasons = [];
  transport.onclose = (reason) => reasons.push(reason);
  lease.end('the page was closed');
  lease.end('again');
  await tick();
  assert.deepEqual(reasons, ['the page was closed']);
  await transport.send({ id: 9, method: 'Runtime.evaluate', params: {}, sessionId: PAGE_SESSION });
  await tick();
  assert.equal(received.length, 0);
  assert.deepEqual(lease.sent, []);
});

test('maintenance is recognised by method and shape, never by an App-supplied script', () => {
  assert.equal(isMaintenance('Page.addScriptToEvaluateOnNewDocument', { source: '', worldName: 'w' }), true);
  assert.equal(isMaintenance('Page.addScriptToEvaluateOnNewDocument', { source: 'x', worldName: 'w' }), false);
  assert.equal(isMaintenance('Runtime.evaluate', {}), false);
  assert.equal(isMaintenance('Emulation.setEmulatedMedia', { media: 'print', features: [] }), false);
});

test('tool policy: run-code and tabs withheld, close answered locally, files stay in the task folder', async () => {
  assert.deepEqual(agentVisibleTools([{ name: 'browser_click' }, { name: 'browser_tabs' }, { name: 'browser_run_code_unsafe' }]).map((t) => t.name), ['browser_click']);
  assert.equal(answeredLocally('browser_run_code_unsafe').isError, true);
  assert.match(answeredLocally('browser_close').content[0].text, /nothing was closed/);
  assert.equal(answeredLocally('browser_click'), null);
  await checkFileArguments({ filename: 'shot.png', paths: ['a/b.txt'] }, ['/work', '/out']);
  await assert.rejects(checkFileArguments({ paths: ['/etc/passwd'] }, ['/work', '/out']), /outside this task's working folder/);
  await assert.rejects(checkFileArguments({ filename: '../escape.png' }, ['/work', '/out']), /outside/);
});
