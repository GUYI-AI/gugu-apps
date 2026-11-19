/**
 * Playwright's `connectOverCDP(transport)` over one Gugu task-page lease (`gugu.pages.acquire()`, App API 36).
 *
 * The host lends exactly one page through a restricted CDP channel. Playwright expects a whole browser, so the
 * browser-level half is answered here and never forwarded: one virtual browser target, one page target, no other
 * targets, contexts or windows. Page commands go to the lease:
 *
 * - connection maintenance (enable domains, read the frame tree, auto-attach iframes, …) through `lease.maintain`,
 *   which the host accepts outside a tool call — Playwright sends these on its own when frames appear;
 * - every other command through `lease.send`, which the host only accepts inside the current tool call.
 *
 * The host re-checks every command; the routing here only picks the channel that can carry it.
 */

export const PAGE_SESSION = 'gugu-agent-page';
export const BROWSER_TARGET_ID = 'gugu-agent-browser';

/** Commands that reach other targets or the whole browser: refused on the page session as well. */
const PAGE_DENIED = /^(Target\.(attachToTarget|attachToBrowserTarget|getTargets|setDiscoverTargets|createTarget|closeTarget|activateTarget|exposeDevToolsProtocol|createBrowserContext|disposeBrowserContext|getBrowserContexts)|Browser\.|SystemInfo\.)/;

/** The host's connection-maintenance commands (it validates their exact parameters). */
const MAINTENANCE = new Set([
  'Page.enable', 'Page.getFrameTree', 'Log.enable', 'Runtime.enable', 'Runtime.runIfWaitingForDebugger',
  'Page.setLifecycleEventsEnabled', 'Page.addScriptToEvaluateOnNewDocument', 'Page.createIsolatedWorld',
  'Network.enable', 'Target.setAutoAttach', 'Target.detachFromTarget', 'Emulation.setEmulatedMedia',
]);

/** Whether a page command is connection maintenance (`maintain`) rather than a tool's action (`send`). */
export function isMaintenance(method, params = {}) {
  if (!MAINTENANCE.has(method)) return false;
  // An init script with content, or an isolated world without access, is a tool's script — not maintenance.
  if (method === 'Page.addScriptToEvaluateOnNewDocument') return params.source === '' && Object.keys(params).every(k => k === 'source' || k === 'worldName');
  if (method === 'Emulation.setEmulatedMedia') return params.media === '' && Array.isArray(params.features);
  return true;
}

const INPUT = /^Input\.(dispatchMouseEvent|dispatchTouchEvent|dispatchKeyEvent|insertText|imeSetComposition)$/;

/**
 * @param {object} lease  the object `gugu.pages.acquire()` resolved to
 * @param {{ userAgent: string, product: string }} browser  what `Browser.getVersion` reports (the real page's Chrome)
 * @param {{ onInput?: (method: string, params: object) => Promise<void> | void, log?: (fields: object, message: string) => void }} [hooks]
 */
export function createLeaseTransport(lease, browser, hooks = {}) {
  const children = new Set();
  let targetInfo = null;
  let closed = false;
  let closeReason;
  let closeHandler;
  let closeNotified = false;
  let dispatchGate = Promise.resolve();

  const notifyClose = () => {
    if (!closed || closeNotified || !closeHandler) return;
    closeNotified = true;
    closeHandler(closeReason);
  };
  const transport = {
    onmessage: undefined,
    send,
    close,
    get onclose() { return closeHandler; },
    set onclose(handler) { closeHandler = handler; queueMicrotask(notifyClose); },
  };
  // Playwright does not accept a reply while its own send() has not returned.
  const emit = (message) => setImmediate(() => { if (!closed) transport.onmessage?.(message); });

  const offMessage = lease.onMessage((method, params, childSession) => {
    if (method === 'Target.attachedToTarget') children.add(String(params?.sessionId));
    if (method === 'Target.detachedFromTarget') children.delete(String(params?.sessionId));
    emit({ method, params, sessionId: childSession || PAGE_SESSION });
  });
  const offClose = lease.onClose((reason) => finish(reason));

  function finish(reason) {
    if (closed) return;
    closed = true;
    closeReason = reason;
    offMessage(); offClose();
    notifyClose();
  }

  const forward = (method, params, session) => {
    const target = session === PAGE_SESSION ? undefined : session;
    return isMaintenance(method, params) ? lease.maintain(method, params, target) : lease.send(method, params, target);
  };

  async function send(raw) {
    const { id, method, params = {}, sessionId: session } = raw;
    const reply = (result) => emit({ id, sessionId: session, result });
    const fail = (message) => emit({ id, sessionId: session, error: { message } });
    try {
      if (closed) return fail('the browser tab was closed');
      if (!session) {
        // Browser level: answered here, never forwarded.
        if (method === 'Browser.getVersion') {
          return reply({ protocolVersion: '1.3', product: browser.product, revision: '', userAgent: browser.userAgent, jsVersion: '' });
        }
        if (method === 'Target.setAutoAttach') {
          const info = await lease.send('Target.getTargetInfo', {});
          targetInfo = info.targetInfo;
          reply({});
          return emit({ method: 'Target.attachedToTarget',
            params: { sessionId: PAGE_SESSION, targetInfo: { ...targetInfo, type: 'page', attached: true }, waitingForDebugger: false } });
        }
        if (method === 'Target.getTargetInfo') {
          return reply({ targetInfo: { targetId: BROWSER_TARGET_ID, type: 'browser', title: '', url: '', attached: true, canAccessOpener: false } });
        }
        if (method === 'Target.getBrowserContexts') return reply({ browserContextIds: [] });
        if (/^Browser\.(setDownloadBehavior|grantPermissions|resetPermissions)$/.test(method)) return reply({});
        hooks.log?.({ method }, 'refused a browser-level command');
        return fail(`Browser Use: browser-level ${method} is not available (this connection drives one tab)`);
      }
      if (session !== PAGE_SESSION && !children.has(session)) return fail('unknown session');
      if (PAGE_DENIED.test(method)) {
        hooks.log?.({ method }, 'refused a command');
        return fail(`Browser Use: ${method} is not available (this connection drives one tab)`);
      }
      if (method === 'Target.getTargetInfo' && session === PAGE_SESSION && targetInfo) {
        return reply({ targetInfo: { ...targetInfo, type: 'page' } });
      }
      // Playwright fires a click as move / press / release without waiting for replies: deliver them in that order,
      // each after the visible pointer (if any) has reached its target.
      const prior = dispatchGate;
      let release = () => {};
      dispatchGate = new Promise((resolve) => { release = resolve; });
      let result;
      try {
        await prior;
        if (closed) return fail('the browser tab was closed');
        if (INPUT.test(method) && hooks.onInput) {
          await hooks.onInput(method, params);
          if (closed) return fail('the browser connection was closed');
        }
        if (method === 'Page.getFrameTree' && session === PAGE_SESSION) {
          reply(await initialFrameTree());
          return;
        }
        result = forward(method, params, session);
      } finally {
        release();
      }
      reply(await result);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Chromium's initial document exists before any navigation commits; its frame metadata has no URL while
   * document.URL reports about:blank. Report that document so attaching does not wait for a navigation.
   */
  async function initialFrameTree() {
    const tree = await lease.maintain('Page.getFrameTree', {});
    const url = tree?.frameTree?.frame?.url;
    if (url !== '' && url !== ':') return tree;
    const document = await lease.send('Runtime.evaluate', { expression: 'document.URL', returnByValue: true, silent: true });
    const documentUrl = document?.result?.value;
    if (document?.exceptionDetails || typeof documentUrl !== 'string' || !documentUrl || documentUrl === ':') {
      throw new Error('could not read the browser tab\'s initial document URL');
    }
    if (documentUrl === 'about:blank') return { ...tree, frameTree: { ...tree.frameTree, frame: { ...tree.frameTree.frame, url: documentUrl } } };
    // A real navigation committed during the lookup: use its whole frame tree.
    const fresh = await lease.maintain('Page.getFrameTree', {});
    const freshUrl = fresh?.frameTree?.frame?.url;
    if (!freshUrl || freshUrl === ':') throw new Error('the browser tab\'s initial document changed before it could be read');
    return fresh;
  }

  function close() {
    if (closed) return;
    finish('closed by the agent');
  }

  return transport;
}

/** What the page's own Chrome reports, read inside the first tool call. */
export async function pageBrowserVersion(lease) {
  const read = await lease.send('Runtime.evaluate', { expression: 'navigator.userAgent', returnByValue: true, silent: true });
  const userAgent = read?.result?.value;
  if (typeof userAgent !== 'string' || !userAgent) throw new Error('could not read the browser tab\'s user agent');
  // Playwright branches on the major version; a non-numeric product takes neither branch.
  const chrome = /(?:Chrome|HeadlessChrome)\/(\d+[.\d]*)/.exec(userAgent)?.[1];
  if (!chrome) throw new Error(`the browser tab is not Chromium (${userAgent})`);
  return { userAgent, product: `Chrome/${chrome}` };
}
