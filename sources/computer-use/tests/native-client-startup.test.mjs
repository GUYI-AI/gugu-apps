import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCuaClient } from '../app/program/native-runtime.mjs';

const fixture = fileURLToPath(new URL('./client-daemon-fixture.mjs', import.meta.url));
async function until(check, message, ms = 600) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.fail(message);
}
async function host(t, phase, platform = 'darwin') {
  const home = await mkdtemp(path.join(os.tmpdir(), 'cu-client-'));
  const socket = path.join(home, 's'), events = [], children = [];
  const client = createCuaClient({ binary: fixture, missingMessage: 'missing fixture', clientVersion: 'test', home, socketPath: socket, platform,
    readyTimeoutMs: 2000, laneIdleMs: 150,
    spawn(_binary, args, options) {
      const mode = args[0];
      const child = spawn(process.execPath, [fixture, JSON.stringify({ mode, socket, phase })], { ...options, stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
      children.push({ mode, child }); child.on('message', event => events.push(event)); return child;
    } });
  t.after(async () => {
    client.dispose();
    await until(() => children.every(({ child }) => child.exitCode !== null || child.signalCode !== null), 'fixture children must exit');
    await rm(home, { recursive: true, force: true });
  });
  return { client, events, children };
}

for (const [phase, platform, event] of [['socket', 'darwin', 'serve-start'], ['metadata', 'darwin', 'metadata'], ['session', 'darwin', 'session-begin'], ['initialize', 'win32', 'initialize']]) {
  test(`startup cancellation closes the ${phase} owner and all unneeded processes`, async t => {
    const { client, events, children } = await host(t, phase, platform);
    const stop = new AbortController();
    const rejected = assert.rejects(client.callTool('list_apps', {}, { lane: 'a', signal: stop.signal, timeoutMs: 1500 }), /取消/);
    await until(() => events.some(value => value.type === event), `fixture reached ${phase}`, 1500);
    stop.abort(); await rejected;
    if (phase === 'metadata' || phase === 'session') await until(() => events.some(value => value.type === 'connection-closed'), 'cancelled startup lease socket must close');
    await until(() => children.every(({ child }) => child.exitCode !== null || child.signalCode !== null), 'cancelled startup must retire its proxy and unused daemon');
    assert.equal(events.filter(value => value.type === 'call').length, 0, 'no native action can follow cancellation');
  });
}
test('startup timeout closes the lease before disposal', async t => {
  const { client, events, children } = await host(t, 'session');
  await assert.rejects(client.callTool('list_apps', {}, { lane: 'a', timeoutMs: 250 }), /没能启动/);
  assert(events.some(event => event.type === 'session-begin'));
  await until(() => children.every(({ child }) => child.exitCode !== null || child.signalCode !== null), 'startup timeout must not leave a daemon');
});
test('one same-lane startup subscriber cancels without ending the other subscriber', async t => {
  const { client, events } = await host(t, 'ready');
  const stop = new AbortController();
  const a = assert.rejects(client.callTool('list_apps', {}, { lane: 'shared', signal: stop.signal }), /取消/);
  const b = client.callTool('list_apps', {}, { lane: 'shared' });
  stop.abort(); await a;
  assert.equal((await b).structuredContent.ok, true);
  // The fixture reports its call over IPC, which can land after the socket reply that resolved `b`.
  await until(() => events.some(value => value.type === 'call'), 'the remaining subscriber reaches the daemon');
  assert.equal(events.filter(value => value.type === 'call').length, 1);
});
test('retiring one initializing owner preserves another live owner and its daemon', async t => {
  const { client, events, children } = await host(t, 'first-session');
  const stop = new AbortController();
  const a = assert.rejects(client.callTool('list_apps', {}, { lane: 'a', signal: stop.signal }), /取消/);
  await until(() => events.some(event => event.type === 'session-begin'), 'first owner begins', 1500);
  const b = await client.callTool('list_apps', {}, { lane: 'b' });
  assert.equal(b.structuredContent.ok, true);
  stop.abort(); await a;
  assert.equal(children[0].child.exitCode, null, 'another live owner retains the daemon');
  assert.equal((await client.callTool('list_apps', {}, { lane: 'b' })).structuredContent.ok, true);
});
