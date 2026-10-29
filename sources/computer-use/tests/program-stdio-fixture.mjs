import { appendFileSync } from 'node:fs';
import { startComputerStdio } from '../app/program/program-core.mjs';
import { TOOLS } from '../app/program/native-runtime.mjs';
const record = event => appendFileSync(process.env.CU_TEST_REPORT, JSON.stringify(event) + '\n');
const active = await startComputerStdio({ version: 'test', platform: 'darwin',
  specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' }, pid: { type: 'number' } } } })),
  protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }), settings: { openSettings() { throw new Error('No real settings in a protocol fixture.'); } },
  native: { async callTool(name, args, options) {
    if (name === 'check_permissions') return { content: [], structuredContent: { accessibility: true, screen_recording: true } };
    record({ event: 'native', pid: args.pid, lane: options.lane });
    if (name === 'click') return new Promise((_, reject) => options.signal.addEventListener('abort', () => { record({ event: 'cancelled', pid: args.pid }); reject(new Error('cancelled')); }, { once: true }));
    return { content: [{ type: 'image', mimeType: 'image/png', data: 'iVBORw0KGgo=' }], structuredContent: { fixture: true } };
  }, dispose() { record({ event: 'disposed' }); } } });
