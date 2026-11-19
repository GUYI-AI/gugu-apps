import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createComputerMcpServer } from '../app/program/program-core.mjs';
import { createComputerControl, TOOLS } from '../app/program/native-runtime.mjs';

const meta = { 'gugu/call': 'host-call-a', 'gugu/agent': 'user:33333333-3333-4333-8333-333333333333',
  'gugu/sessionId': '11111111-1111-4111-8111-111111111111', 'gugu/agentName': 'Codex', 'gugu/taskTitle': 'Calculator task' };

test('the stdio MCP handler enters the exact host call and only trusts display names from its metadata', async t => {
  const context = new AsyncLocalStorage(), nativeContexts = [], views = [];
  const control = createComputerControl({ view: { show(view) { views.push(view); }, hide() {} } });
  const active = createComputerMcpServer({ version: 'test', platform: 'darwin', control,
    withCall(stamp, work) { if (stamp?.['gugu/call'] !== 'host-call-a') throw new Error('Unrecognized host call'); return context.run(stamp['gugu/call'], work); },
    specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }),
    native: { async callTool(name) { nativeContexts.push(context.getStore()); return name === 'check_permissions'
      ? { structuredContent: { accessibility: true, screen_recording: true } } : { content: [], structuredContent: { ok: true } }; }, dispose() {} },
  });
  const client = new Client({ name: 'fixture', version: 'test' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await active.server.close(); });
  await Promise.all([active.server.connect(a), client.connect(b)]);
  const result = await client.callTool({ name: 'click', arguments: { pid: 44, callerName: 'Forged display name' }, _meta: meta });
  assert.notEqual(result.isError, true);
  assert(nativeContexts.every(value => value === 'host-call-a'));
  assert.equal(views[0].callerName, 'Codex');
  assert.equal(views[0].taskTitle, 'Calculator task');
  assert.equal(views[0].sessionId, meta['gugu/sessionId']);
  const count = nativeContexts.length;
  await assert.rejects(client.callTool({ name: 'click', arguments: { pid: 44 }, _meta: { ...meta, 'gugu/call': 'invented' } }), /Unrecognized host call/);
  assert.equal(nativeContexts.length, count);
});
