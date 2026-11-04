import { AsyncResource } from 'node:async_hooks';
import { PNG } from 'pngjs';
import { cursorOnWindow, resolveComputerWindow } from '../app/program/native-runtime.mjs';

const record = value => value && typeof value === 'object' && !Array.isArray(value);
const positive = value => Number.isSafeInteger(value) && value > 0;
const key = target => target ? `${target.pid}:${target.window_id}` : '';
const line = value => String(value).split('\n')[0].slice(0, 200);
const imageOf = result => result?.content?.findLast(block => block.type === 'image' && block.mimeType === 'image/png');
const argsForDisplay = args => Object.fromEntries(Object.entries(args).filter(([key]) =>
  ['app', 'name', 'bundle_id', 'text', 'key', 'keys', 'value', 'direction'].includes(key)).map(([key, value]) =>
  [key, typeof value === 'string' ? value.slice(0, 160) : Array.isArray(value) ? value.slice(0, 8).map(v => String(v).slice(0, 32)) : value]));

/** The encoded density may shrink; source coordinates stay those of this actual capture. */
export function projectionPng(base64) {
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47) throw new Error('The window capture is not a PNG.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (!positive(width) || !positive(height) || width > 8192 || height > 8192 || width * height > 16_777_216) throw new Error('The window capture dimensions are unsupported.');
  const original = PNG.sync.read(bytes, { checkCRC: true });
  if (bytes.length <= 512 * 1024) return { width, height, mime: 'image/png', data: bytes.toString('base64') };
  for (let scale = Math.min(.75, 1280 / Math.max(width, height)); scale >= 1 / Math.max(width, height); scale *= .7) {
    const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
    const image = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const at = (Math.min(height - 1, Math.floor(y * height / h)) * width + Math.min(width - 1, Math.floor(x * width / w))) * 4;
      image.data.set(original.data.subarray(at, at + 4), (y * w + x) * 4);
    }
    const encoded = PNG.sync.write(image);
    if (encoded.length <= 512 * 1024) return { width, height, mime: 'image/png', data: encoded.toString('base64') };
  }
  throw new Error('The window capture could not fit the preview transport.');
}

/** Task-private metadata and resources; pixels only enter the host's authorized projection transport. */
export function createComputerPreview({ projection, native, tools, control, showTaskPages, notify = async () => {}, log = console, now = Date.now }) {
  const tasks = new Map();
  const shown = new Set(), showing = new Set(), failedAt = new Map();
  const background = new AsyncResource('ComputerUsePreview');
  const detached = work => background.runInAsyncScope(work);
  let disposed = false;
  const report = error => { try { log.warn({ error: String(error) }, 'Computer Use preview failed'); } catch {} };
  const attempt = work => { try { void Promise.resolve(work()).catch(report); } catch (error) { report(error); } };
  const changed = () => attempt(() => notify({ method: 'notifications/computer-use/changed' }));
  const valid = state => !disposed && !state.abort.signal.aborted && tasks.get(state.session) === state;
  const retire = state => {
    state.abort.abort();
    state.frames.length = 0;
    if (tasks.get(state.session) === state) tasks.delete(state.session);
  };
  const close = state => {
    retire(state);
    if (state.source) detached(() => attempt(() => state.source.close()));
  };
  function open(caller) {
    let state = tasks.get(caller.session);
    if (state) {
      tasks.delete(caller.session); tasks.set(caller.session, state);
      if (!state.source && !state.opening && now() - state.acquireAt >= 60_000) acquire(state);
      return state;
    }
    state = { session: caller.session, caller: { ...caller, signal: undefined, remainingMs: undefined },
      abort: new AbortController(), actions: [], frames: [], target: null, epoch: 0,
      lastAt: -Infinity, took: 0, capture: null, publishing: Promise.resolve(), source: null, opening: true, problem: null };
    tasks.set(caller.session, state);
    if (tasks.size > 16) close(tasks.values().next().value);
    acquire(state);
    return state;
  }
  function acquire(state) {
    state.opening = true; state.acquireAt = now();
    // Only acquisition uses the actual live call. Later refresh/publish uses this held resource.
    try {
      const opening = projection.create({
        input: async () => ({ status: 'rejected', reason: 'This task preview is read-only. No input was sent.' }),
        disconnect: async () => {},
        refresh: () => detached(() => capture(state)),
        close: async () => { retire(state); changed(); },
      });
      state.sourceReady = Promise.resolve(opening).then(source => detached(() => {
        state.opening = false;
        if (!valid(state)) { attempt(() => source.close()); return; }
        state.source = source; changed();
      })).catch(error => detached(() => {
        if (valid(state)) { state.opening = false; state.problem = line(error); changed(); }
      }));
    } catch (error) { state.opening = false; state.problem = line(error); }
  }
  function publish(state, result, cursor, epoch) {
    const image = imageOf(result);
    if (!image) return;
    const at = new Date(now()).toISOString();
    // The queue keeps publications ordered even when tool calls finish together.
    state.publishing = state.publishing.catch(report).then(() => detached(async () => {
      await state.sourceReady;
      if (!valid(state) || state.epoch !== epoch || !state.source) return;
      const frame = projectionPng(image.data);
      if (result.structuredContent?.screenshot_width !== frame.width || result.structuredContent?.screenshot_height !== frame.height) cursor = null;
      const target = state.target && { ...state.target };
      const sequence = await state.source.publish(frame);
      if (!valid(state) || state.epoch !== epoch) return;
      state.frames.push({ sequence, width: frame.width, height: frame.height, cursor,
        at, target });
      state.frames = state.frames.slice(-32);
      state.problem = null; changed();
    })).catch(error => { if (valid(state) && state.epoch === epoch) { state.problem = line(error); changed(); } });
  }
  async function capture(state) {
    if (!valid(state) || !state.source || !state.target) return;
    if (state.capture) return state.capture;
    if (now() - state.lastAt < Math.max(500, state.took)) return;
    const target = { ...state.target }, epoch = state.epoch, caller = state.caller, owner = state.owner;
    const stopped = control?.stoppedFor(target.pid);
    if (stopped) { state.problem = line(stopped); return; }
    const started = now();
    state.capture = (async () => {
      const signal = state.abort.signal;
      const before = await native.cursorState?.(owner, signal).catch(() => null) ?? null;
      const result = await tools.call('get_window_state', { pid: target.pid, window_id: target.window_id,
        include_screenshot: true, include_accessibility_tree: false, display_only: true, max_dimension: 1280 },
      { ...caller, signal, preview: true });
      const after = await native.cursorState?.(owner, signal).catch(() => null) ?? null;
      if (!valid(state) || state.epoch !== epoch || key(state.target) !== key(target)) return;
      const stopped = control?.stoppedFor(target.pid);
      if (stopped) { state.problem = line(stopped); return; }
      if (result.isError || !imageOf(result)) throw new Error(result.content?.find(b => b.type === 'text')?.text ?? 'The window returned no picture.');
      const cursor = cursorOnWindow(before, after, result);
      publish(state, result, cursor, epoch);
      await state.publishing;
    })().catch(error => { if (valid(state) && state.epoch === epoch) { state.problem = line(error); changed(); } })
      .finally(() => { state.lastAt = now(); state.took = now() - started; state.capture = null; });
    return state.capture;
  }
  return {
    begin(caller, name, args) {
      if (disposed) return () => {};
      const state = open(caller);
      const action = { tool: name, args: argsForDisplay(args), at: new Date(now()).toISOString(), status: 'running' };
      state.actions.push(action); state.actions = state.actions.slice(-30);
      return result => {
        if (!valid(state)) return;
        if (result?.structuredContent?.code === 'needs_confirmation') state.actions = state.actions.filter(a => a !== action);
        else action.status = result?.isError === true ? 'failed' : 'done';
        changed();
      };
    },
    observed({ caller, owner, name, args, pid, windowId, result }) {
      const state = tasks.get(caller.session);
      if (!state || result.isError || !valid(state)) return;
      const raw = record(result.structuredContent) ? result.structuredContent : {};
      // A new actual observation supersedes a live capture started earlier,
      // even when both pictures describe the same window.
      state.epoch++;
      state.caller = { ...caller, signal: undefined, remainingMs: undefined };
      const returned = record(raw.target) ? raw.target : raw;
      const nextPid = positive(returned.pid) ? returned.pid : pid;
      const window = positive(nextPid) ? resolveComputerWindow(raw, { pid: nextPid, windowId }) : null;
      const nextWindow = positive(returned.window_id) ? returned.window_id : window?.windowId ?? windowId;
      const samePid = nextPid === state.target?.pid;
      const target = positive(nextPid) ? { pid: nextPid,
        ...(positive(nextWindow) ? { window_id: nextWindow } : samePid && state.target.window_id ? { window_id: state.target.window_id } : {}),
        ...((typeof raw.app_name === 'string' || typeof args.app === 'string') ? { app: raw.app_name ?? args.app } : samePid && state.target.app ? { app: state.target.app } : {}) } : null;
      if (target) {
        if (key(target) !== key(state.target)) state.problem = 'Waiting for a fresh picture of this window.';
        state.target = target;
      }
      state.owner = owner;
      if (showTaskPages && !shown.has(caller.session) && !showing.has(caller.session)
        && now() - (failedAt.get(caller.session) ?? -Infinity) >= 60_000) {
        showing.add(caller.session);
        try {
          void Promise.resolve(showTaskPages()).then(() => { shown.add(caller.session); failedAt.delete(caller.session); },
            error => { failedAt.set(caller.session, now()); report(error); }).finally(() => showing.delete(caller.session));
        } catch (error) { showing.delete(caller.session); failedAt.set(caller.session, now()); report(error); }
      }
      // Only a get_window_state image is known to describe this exact window.
      // Crops/zoom/list output must not masquerade as a full target frame.
      if (name === 'get_window_state' && state.target?.window_id && imageOf(result)) publish(state, result, null, state.epoch);
    },
    async read(session, { live = false } = {}) {
      let state = typeof session === 'string' ? tasks.get(session) : null;
      if (state && live) await detached(() => capture(state));
      if (state && !valid(state)) state = null;
      const target = state?.target ?? null;
      return { session: typeof session === 'string', actions: state?.actions ?? [], target,
        projection: state?.source?.id ?? null, frames: state?.frames ?? [],
        live: !!(state?.source && positive(target?.pid) && positive(target?.window_id)),
        liveProblem: state?.problem ?? null };
    },
    dispose() { if (disposed) return; disposed = true; for (const state of [...tasks.values()]) close(state); background.emitDestroy(); },
  };
}
