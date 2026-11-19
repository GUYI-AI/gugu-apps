import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * A stand-in for Gugu's task-page lease over a real Chromium: one page target, flattened child sessions, and the
 * host's two rules — `send` only inside a tool call (`withCall`), `maintain` only for connection maintenance.
 */
const call = new AsyncLocalStorage();

const empty = new Set(['Page.enable', 'Page.getFrameTree', 'Log.enable', 'Runtime.enable', 'Runtime.runIfWaitingForDebugger', 'Network.enable']);
const only = (params, keys) => Object.keys(params).every((key) => keys.includes(key));
/** The host's maintenance check (page-protocol-maintenance.ts), loosened only where it validates frame identity. */
function hostMaintenance(method, params) {
  if (empty.has(method)) return only(params, []);
  if (method === 'Page.setLifecycleEventsEnabled') return only(params, ['enabled']) && params.enabled === true;
  if (method === 'Page.addScriptToEvaluateOnNewDocument') return only(params, ['source', 'worldName']) && params.source === '' && typeof params.worldName === 'string';
  if (method === 'Page.createIsolatedWorld') return only(params, ['frameId', 'worldName', 'grantUniveralAccess']) && (params.grantUniveralAccess === undefined || params.grantUniveralAccess === true);
  if (method === 'Target.setAutoAttach') return only(params, ['autoAttach', 'waitForDebuggerOnStart', 'flatten']) && params.autoAttach === true && params.waitForDebuggerOnStart === true && params.flatten === true;
  if (method === 'Target.detachFromTarget') return only(params, ['sessionId']);
  if (method === 'Emulation.setEmulatedMedia') return only(params, ['media', 'features']) && params.media === '' && Array.isArray(params.features);
  return false;
}

export async function connectChromium(endpoint) {
  const version = await (await fetch(`${endpoint}/json/version`)).json();
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let next = 0;
  const pending = new Map();
  const listeners = new Set();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id !== undefined) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter?.reject(new Error(message.error.message)); else waiter?.resolve(message.result);
    } else for (const listener of listeners) listener(message);
  };
  const raw = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++next;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  return { raw, listeners, close: () => socket.close(), product: version.Browser };
}

export function withCall(meta, work) {
  return call.run(meta?.['gugu/call'] ?? 'call', work);
}

/** `gugu.pages` for one Chromium: each acquire opens a fresh page target. */
export function chromiumPages(chromium, log = []) {
  return {
    async acquire({ url } = {}) {
      if (!call.getStore()) throw new Error('A task page needs a current task program call');
      const { targetId } = await chromium.raw('Target.createTarget', { url: url ?? 'about:blank' });
      const { sessionId: page } = await chromium.raw('Target.attachToTarget', { targetId, flatten: true });
      const children = new Set();
      const messages = new Set();
      const closures = new Set();
      let closed = null;
      const onEvent = (message) => {
        if (message.method === 'Target.detachedFromTarget' && message.params.targetId === targetId) return finish('the page was closed');
        if (message.sessionId !== page && !children.has(message.sessionId)) return;
        if (message.method === 'Target.attachedToTarget') {
          // The host's backstop: only iframes become addressable.
          if (message.params.targetInfo?.type !== 'iframe') return;
          children.add(message.params.sessionId);
        }
        for (const listener of messages) listener(message.method, message.params, message.sessionId === page ? undefined : message.sessionId);
      };
      chromium.listeners.add(onEvent);
      function finish(reason) {
        if (closed) return;
        closed = reason;
        chromium.listeners.delete(onEvent);
        for (const listener of closures) listener(reason);
      }
      const dispatch = (method, params = {}, sessionId) => {
        if (closed) return Promise.reject(new Error(closed));
        if (sessionId && !children.has(sessionId)) return Promise.reject(new Error('unknown session'));
        const native = method === 'Target.setAutoAttach' ? { ...params, filter: [{ type: 'iframe', exclude: false }, { exclude: true }] } : params;
        return chromium.raw(method, native, sessionId ?? page);
      };
      return {
        id: targetId, title: '', url: url ?? 'about:blank',
        send(method, params = {}, sessionId) {
          log.push(['send', method, !!call.getStore()]);
          if (!call.getStore()) return Promise.reject(new Error(`${method} needs a current task program call`));
          return dispatch(method, params, sessionId);
        },
        maintain(method, params = {}, sessionId) {
          log.push(['maintain', method, !!call.getStore()]);
          if (!hostMaintenance(method, params)) return Promise.reject(new Error(`${method} is not connection maintenance`));
          return dispatch(method, params, sessionId);
        },
        onMessage(listener) { messages.add(listener); return () => messages.delete(listener); },
        onClose(listener) { closures.add(listener); return () => closures.delete(listener); },
        async close() { finish('Released by its App'); await chromium.raw('Target.detachFromTarget', { sessionId: page }).catch(() => undefined); },
        targetId,
      };
    },
  };
}
