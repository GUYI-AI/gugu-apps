import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createComputerTools, NativeCallError } from '../app/program/native-runtime.mjs';
import { createComputerPreview } from './preview.mjs';

const record = value => value && typeof value === 'object' && !Array.isArray(value);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const failed = (code, text) => ({ isError: true, content: [{ type: 'text', text }], structuredContent: { code } });
const pageTools = [
  { name: 'preview_state', description: 'Read only this page’s host-bound task preview metadata. Pictures travel through its authorized projection resource.', inputSchema: { type: 'object', properties: { live: { type: 'boolean' } }, additionalProperties: false }, _meta: { ui: { visibility: ['app'] } } },
  { name: 'preview_control', description: 'Pause or continue the observed application in this task. Only the person using this task page can call it.', inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['pause', 'resume'] }, projection: { type: 'string' }, targetRevision: { type: 'integer', minimum: 1 } }, required: ['action', 'projection', 'targetRevision'], additionalProperties: false }, _meta: { ui: { visibility: ['app'] } } },
  { name: 'permissions_state', description: 'Read the running driver’s macOS system permission state without requesting permission.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, _meta: { ui: { visibility: ['app'] } } },
  { name: 'open_system_settings', description: 'Open the selected fixed macOS permission settings pane. This does not grant permission; refresh permissions_state afterwards.', inputSchema: { type: 'object', properties: { permission: { type: 'string', enum: ['accessibility', 'screen'] } }, required: ['permission'], additionalProperties: false }, _meta: { ui: { visibility: ['app'] } } },
];

/** Caller metadata is accepted only on the private host-owned MCP transport, never in arguments. */
export function createComputerProgram({ specs, native, platform = process.platform, protectedHost, settings, control, projection, showTaskPages, log = console, notify = async () => {} }) {
  let disposed = false;
  const lifetime = new AbortController();
  let preview;
  const tools = createComputerTools({ cua: native, specs, platform, protectedHost, control,
    observed: value => preview?.observed(value) });
  if (projection) preview = createComputerPreview({ projection, native, tools, control, showTaskPages, notify, log });
  const definitions = tools.list().map(tool => ({ ...tool, _meta: { ui: { visibility: ['model'] } } }));
  return {
    list: () => [...definitions, ...pageTools],
    async call(params, extra = {}) {
      if (disposed) return failed('revoked', 'Computer Use has stopped and cannot accept another operation.');
      const meta = record(params._meta) ? params._meta : {};
      const args = params.arguments ?? {};
      if (!record(args)) return failed('invalid_args', 'Tool arguments must be an object.');
      const fromPage = meta['gugu/caller'] === 'app';
      const pageTool = pageTools.some(tool => tool.name === params.name);
      if (pageTool !== fromPage) return failed('not_granted', 'This tool is not available to this caller.');
      const session = meta['gugu/sessionId'];
      const agent = meta['gugu/agent'];
      if (!fromPage && (typeof session !== 'string' || !uuid.test(session) || typeof agent !== 'string' || !agent.startsWith('user:') || !uuid.test(agent.slice(5)))) {
        return failed('not_granted', 'Computer Use needs the agent and task stamped by the host. Do not supply their identities as tool arguments.');
      }
      const signal = extra.signal ? AbortSignal.any([lifetime.signal, extra.signal]) : lifetime.signal;
      if (signal.aborted) return failed('cancelled', 'This operation was cancelled before it was sent.');
      const token = meta.progressToken;
      let finishPreview, outcome;
      let progress = 0;
      const timer = token !== undefined && extra.sendNotification ? setInterval(() => {
        void extra.sendNotification({ method: 'notifications/progress', params: { progressToken: token, progress: ++progress, message: 'Computer Use is preparing or running this operation.' } }).catch(error => log.warn({ error: String(error) }, 'Could not report Computer Use progress'));
      }, 15_000) : null;
      timer?.unref?.();
      try {
        if (fromPage) {
          if (params.name === 'preview_control') {
            if (meta['gugu/agent']) return failed('not_granted', 'Only the person using this task page may pause or continue its application.');
            if (Object.keys(args).some(key => !['action', 'projection', 'targetRevision'].includes(key)) || !['pause', 'resume'].includes(args.action)
              || typeof args.projection !== 'string' || !Number.isSafeInteger(args.targetRevision) || args.targetRevision < 1) return failed('invalid_args', 'Choose pause or resume for the current picture revision. The host selects this task and its observed application.');
            if (typeof session !== 'string' || !uuid.test(session)) return failed('not_granted', 'Open Computer Use in a task first.');
            const value = preview?.control(session, args.action, args);
            if (!value) return failed('unavailable', 'This task has no active Computer Use picture.');
            return { content: [{ type: 'text', text: value.paused ? 'The application is paused.' : 'The application can continue.' }], structuredContent: value };
          }
          if (params.name === 'preview_state') {
            if (Object.keys(args).some(key => key !== 'live') || (args.live !== undefined && typeof args.live !== 'boolean')) return failed('invalid_args', 'preview_state accepts only live. The host selects the task.');
            const bound = typeof session === 'string' && uuid.test(session) ? session : null;
            const state = await preview?.read(bound, args) ?? { session: bound !== null, actions: [], target: null, projection: null, frames: [], live: false };
            return { content: [{ type: 'text', text: `${state.actions.length} actions` }], structuredContent: state };
          }
          if (params.name === 'permissions_state') {
            if (Object.keys(args).length) return failed('invalid_args', 'permissions_state takes no arguments.');
            if (platform !== 'darwin') return failed('unsupported', 'macOS permission status is not available on this platform.');
            return await native.callTool('check_permissions', { prompt: false }, { signal, lane: 'page-permissions', timeoutMs: 15_000 });
          }
          if (meta['gugu/agent']) return failed('not_granted', 'Only the person using the App page can open system settings. Tell them what permission is missing through the existing conversation.');
          if (Object.keys(args).some(key => key !== 'permission') || !['accessibility', 'screen'].includes(args.permission)) return failed('invalid_args', 'Choose Accessibility or Screen Recording.');
          if (platform !== 'darwin') return failed('unsupported', 'macOS system settings are not available on this platform.');
          const value = await settings.openSettings(args.permission, signal);
          return { content: [{ type: 'text', text: 'System Settings was opened. This call did not grant permission; read permissions_state again after the person finishes.' }], structuredContent: value };
        }
        const caller = { agent, session, signal,
          ...(typeof meta['gugu/agentName'] === 'string' ? { name: meta['gugu/agentName'] } : {}),
          ...(typeof meta['gugu/taskTitle'] === 'string' ? { taskTitle: meta['gugu/taskTitle'] } : {}),
        };
        // Starting or failing a preview is advisory and never delays native input.
        try { finishPreview = preview?.begin(caller, params.name, args); } catch (error) { log.warn({ error: String(error) }, 'Computer Use preview could not start'); }
        outcome = await tools.call(params.name, args, caller);
        return outcome;
      } catch (error) {
        if (signal.aborted) return failed('cancelled', 'The operation was cancelled. It may have partially executed; inspect the target before trying another action.');
        if (error instanceof NativeCallError) return failed(error.code, error.message);
        log.warn({ error: String(error) }, 'Computer Use program call failed');
        return failed('unavailable', 'Computer Use could not complete this operation. Reopen the App and retry; reinstall it if preparation keeps failing.');
      } finally {
        try { finishPreview?.(outcome ?? { isError: true }); } catch (error) { log.warn({ error: String(error) }, 'Computer Use preview could not finish'); }
        if (timer) clearInterval(timer);
        if (!disposed && !fromPage) void Promise.resolve().then(() => notify({ method: 'notifications/tools/called', params: { tool: params.name } })).catch(error => log.warn({ error: String(error) }, 'Could not notify the Computer Use page'));
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      lifetime.abort();
      preview?.dispose();
      control?.dispose();
      native.dispose();
    },
  };
}

export function createComputerMcpServer(options) {
  const server = new Server({ name: 'computer-use', version: options.version }, { capabilities: { tools: {} }, instructions: 'Operate this computer’s apps through the Computer Use tools. Human blockers return immediately; use your existing conversation or AskUserQuestion before retrying an action that needs explicit approval.' });
  const program = createComputerProgram({ ...options, notify: notification => server.notification(notification) });
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: program.list() }));
  const withCall = options.withCall ?? ((_meta, work) => work());
  server.setRequestHandler(CallToolRequestSchema, (request, extra) => withCall(request.params._meta, () => program.call(request.params, extra)));
  server.onclose = () => program.dispose();
  return { server, program };
}

/** Shared by the packaged entry and protocol fixtures: stdin close is immediate revocation. */
export async function startComputerStdio(options) {
  const active = createComputerMcpServer(options);
  let stopping;
  const stop = () => stopping ??= (async () => { active.program.dispose(); await active.server.close(); })();
  const exit = () => void stop().finally(() => process.exit(0));
  process.once('SIGTERM', exit);
  process.once('SIGINT', exit);
  process.stdin.once('end', exit);
  process.stdin.once('close', exit);
  process.stdin.once('error', exit);
  process.stdout.once('error', exit);
  try { await active.server.connect(new StdioServerTransport()); }
  catch (error) { await stop(); throw error; }
  return { ...active, stop };
}
