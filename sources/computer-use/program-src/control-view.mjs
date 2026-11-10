import { computerBarBounds, resolveComputerWindow } from '../app/program/native-runtime.mjs';
import { AsyncResource } from 'node:async_hooks';

const record = value => value && typeof value === 'object' && !Array.isArray(value);

/** All native target selection and Stop content stay in this App. The host only presents its document. */
export function createComputerSurfaceView({ surfaces, native, platform = process.platform, onStop, onResume, log = console,
  later = setTimeout, clear = clearTimeout }) {
  let current, disposed = false, generation = 0;
  // Constructed at program startup, outside any agent call. Owned presentation
  // updates must not retain an ended MCP call's AsyncLocalStorage authority.
  const background = new AsyncResource('ComputerUsePresentation');
  const present = work => background.runInAsyncScope(work);
  const report = error => { try { log.warn({ error: String(error) }, 'Computer Use indicator could not be displayed'); } catch {} };
  const attempt = work => { try { void Promise.resolve(work()).catch(report); } catch (error) { report(error); } };
  const data = intent => ({ generation: intent.generation, ...intent.view });
  const live = intent => !disposed && current === intent && !intent.abort.signal.aborted;
  const cancel = intent => {
    if (!intent) return;
    intent.abort.abort(); intent.refresh?.abort();
    if (intent.timer) clear(intent.timer);
    intent.off?.();
    if (intent.handle) present(() => attempt(() => intent.handle.close()));
    if (current === intent) current = undefined;
  };
  async function target(view, signal) {
    const options = { signal, timeoutMs: 2_000, lane: 'computer-use-indicator-' + view.sessionId };
    if (view.app) {
      const result = await native.callTool('list_windows', { pid: view.app.pid, on_screen_only: true }, options);
      return result.isError ? null : resolveComputerWindow(result.structuredContent, { pid: view.app.pid, windowId: view.app.windowId });
    }
    const apps = await native.callTool('list_apps', {}, options);
    const active = !apps.isError && Array.isArray(apps.structuredContent?.apps)
      ? apps.structuredContent.apps.find(app => record(app) && app.active === true) : null;
    if (!record(active) || !Number.isSafeInteger(active.pid) || active.pid <= 0) return null;
    const windows = await native.callTool('list_windows', { pid: active.pid, on_screen_only: true }, options);
    const front = !windows.isError && Array.isArray(windows.structuredContent?.windows)
      ? windows.structuredContent.windows.find(win => record(win) && win.pid === active.pid && win.is_on_screen === true && win.on_current_space !== false && (win.layer ?? 0) === 0) : null;
    return front ? resolveComputerWindow(windows.structuredContent, { pid: active.pid, windowId: front.window_id }) : null;
  }
  async function refresh(intent) {
    if (!live(intent) || !intent.handle) return;
    if (intent.timer) clear(intent.timer);
    intent.timer = undefined;
    intent.refresh?.abort();
    const refresh = new AbortController(); intent.refresh = refresh;
    const signal = AbortSignal.any([intent.abort.signal, refresh.signal]);
    try {
      const matched = await target(intent.view, signal);
      if (!live(intent) || signal.aborted) return;
      if (!matched) { await intent.handle.update({ visible: false }); return; }
      const display = await surfaces.screen({ bounds: matched.bounds, space: platform === 'win32' ? 'windows-screen-pixels' : 'screen-dip' });
      if (!live(intent) || signal.aborted) return;
      const bounds = computerBarBounds(display.bounds, display.workArea);
      await intent.handle.update(bounds ? { bounds, visible: true, relativeTo: { windowId: String(matched.windowId) },
        data: { ...data(intent), attachment: bounds.y < display.bounds.y ? 'above' : 'inside' } } : { visible: false });
    } catch (error) {
      if (live(intent) && !signal.aborted) {
        report(error); attempt(() => intent.handle.update({ visible: false }));
      }
    } finally {
      if (live(intent) && !signal.aborted) {
        intent.timer = later(() => { intent.timer = undefined; void refreshView(intent); }, 250);
        intent.timer?.unref?.();
      }
    }
  }
  const refreshView = intent => refresh(intent).catch(report);
  return {
    show(view) {
      if (disposed) return;
      const key = JSON.stringify([view.sessionId, view.app?.pid ?? null]);
      if (current?.key === key && !current.abort.signal.aborted) {
        current.view = view;
        if (current.handle) {
          present(() => {
            attempt(() => current.handle.update({ data: data(current) }));
            void refreshView(current);
          });
        }
        return;
      }
      cancel(current);
      const intent = { key, view, generation: ++generation, abort: new AbortController() };
      current = intent;
      // Creation happens synchronously in the real task call. Geometry and all
      // later visibility updates use the already-held lease, never action admission.
      try {
        const opening = surfaces.open({ entry: 'control.html', bounds: { x: 0, y: 0, width: 236, height: 44 }, visible: false, data: data(intent) });
        void Promise.resolve(opening).then(handle => present(() => {
          if (!live(intent)) { attempt(() => handle.close()); return; }
          intent.handle = handle;
          intent.off = handle.onEvent(event => present(() => {
            if (!live(intent)) return;
            if (event.type === 'closed') { cancel(intent); return; }
            if (event.type === 'display' && event.reason) report(event.reason);
            if (event.type !== 'message' || !record(event.message) || event.message.generation !== intent.generation) return;
            if (event.message.action === 'stop' && intent.view.state === 'driving') onStop();
            if (event.message.action === 'resume' && intent.view.state === 'paused') onResume();
          }));
          return refreshView(intent);
        })).catch(error => { if (live(intent)) { report(error); cancel(intent); } });
      } catch (error) { report(error); cancel(intent); }
    },
    hide() { cancel(current); },
    dispose() { disposed = true; cancel(current); },
  };
}
