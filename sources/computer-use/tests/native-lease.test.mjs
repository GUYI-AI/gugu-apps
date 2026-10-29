import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { openCuaDaemonLease } from '../app/program/native-runtime.mjs';

async function daemon(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cu-lease-'));
  const socket = path.join(root, 's'), controls = new Map(), connections = new Set(), batches = new Map(), calls = [];
  const server = net.createServer(connection => {
    connections.add(connection); connection.once('close', () => connections.delete(connection));
    readline.createInterface({ input: connection }).on('line', line => {
      const request = JSON.parse(line);
      const send = result => { if (!connection.destroyed) connection.write(JSON.stringify({ ok: true, result }) + '\n'); };
      if (request.method === 'metadata') send({ embedded: true, driver_version: '0.36.0' });
      else if (request.method === 'session_begin') { controls.set(request.session_id, connection); send({ session_begin: true }); }
      else if (request.method === 'call') {
        calls.push(request);
        if (request.name === 'run_steps') batches.set(request.session_id, () => send({ content: [], structuredContent: { executed: 3 } }));
        else if (request.name === 'get_agent_cursor_state') send({ content: [], structuredContent: { position: { x: 12, y: 34 } } });
        else if (request.name !== 'get_window_state') connection.write(JSON.stringify({ ok: false, error: 'native refusal', exit_code: 1 }) + '\n');
      }
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(socket, resolve); });
  t.after(async () => { for (const connection of connections) connection.destroy(); await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  return { socket, calls, controls, finish: owner => batches.get(owner)?.() };
}
async function until(check) {
  for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.fail('The expected native protocol event did not occur.');
}
test('native reads and cursor sampling do not queue behind an active same-owner batch', async t => {
  const host = await daemon(t), lease = await openCuaDaemonLease({ socket: host.socket, owner: 'a', timeoutMs: 1000, onClosed() {} });
  t.after(() => lease.close());
  let completed = false;
  const batch = lease.call('run_steps', { session: 'a' }).then(value => { completed = true; return value; });
  const cursor = await lease.call('get_agent_cursor_state', { session: 'a', _transport_session_id: 'forged' });
  assert.deepEqual(cursor.structuredContent.position, { x: 12, y: 34 }); assert.equal(completed, false);
  assert(host.calls.every(call => call.session_id === 'a'));
  assert.deepEqual(host.calls[1].args, { session: 'a' });
  host.finish('a'); assert.equal((await batch).structuredContent.executed, 3);
});
test('cancelling an input retires only that owner and never replays it', async t => {
  const host = await daemon(t), stop = new AbortController();
  const a = await openCuaDaemonLease({ socket: host.socket, owner: 'a', timeoutMs: 1000, onClosed() {} });
  const b = await openCuaDaemonLease({ socket: host.socket, owner: 'b', timeoutMs: 1000, onClosed() {} });
  t.after(() => { a.close(); b.close(); });
  const batchA = a.call('run_steps', { steps: [{ click: { pid: 44 } }] }, { signal: stop.signal, timeoutMs: 1000 });
  const rejected = assert.rejects(batchA, /可能部分执行.*结果未确认/);
  const batchB = b.call('run_steps', { steps: [{ click: { pid: 77 } }] });
  await until(() => host.calls.length === 2); stop.abort(); await rejected;
  assert.deepEqual((await b.call('get_agent_cursor_state', {})).structuredContent.position, { x: 12, y: 34 });
  host.finish('b'); assert.equal((await batchB).structuredContent.executed, 3);
  assert.equal(host.calls.filter(call => call.name === 'run_steps' && call.session_id === 'a').length, 1);
});
test('cancelling a read leaves its owner able to send the next operation', async t => {
  const host = await daemon(t), stop = new AbortController();
  const lease = await openCuaDaemonLease({ socket: host.socket, owner: 'a', timeoutMs: 1000, onClosed() {} });
  t.after(() => lease.close());
  const read = lease.call('get_window_state', {}, { signal: stop.signal }); const rejected = assert.rejects(read);
  await until(() => host.calls.length === 1); stop.abort(); await rejected;
  assert.deepEqual((await lease.call('get_agent_cursor_state', {})).structuredContent.position, { x: 12, y: 34 });
});
