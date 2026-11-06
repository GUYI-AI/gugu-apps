const targetKey = target => target ? `${target.pid}:${target.window_id}` : '';
const point = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const rejected = reason => ({ status: 'rejected', reason });
const applied = () => ({ status: 'applied' });
const uncertain = reason => ({ status: 'unknown', reason: `Input may have been applied. Check the target before trying again. ${reason}` });
const modifiers = values => values?.map(value => ({ meta: 'cmd', control: 'ctrl', alt: 'alt', shift: 'shift' })[value]);
const keyNames = { Enter: 'return', Escape: 'escape', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  Backspace: 'backspace', Delete: 'delete', Tab: 'tab', Home: 'home', End: 'end', PageUp: 'pageup', PageDown: 'pagedown' };
const modifierKeys = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'NumLock']);
const preflightFailures = new Set(['not_found', 'not_granted', 'unsupported', 'invalid_args', 'needs_confirmation', 'os_permission']);
// The target epoch alone is insufficient: a live capture can change its coordinate
// space without retargeting. The revision also prevents resize-away-and-back reuse.
const frameSpace = frame => frame && JSON.stringify([frame.coordinateRevision ?? null, frame.width, frame.height]);
export const pictureCoordinateKey = (width, height, bounds) => JSON.stringify([width, height,
  Number.isFinite(bounds?.width) && bounds.width > 0 ? bounds.width : null,
  Number.isFinite(bounds?.height) && bounds.height > 0 ? bounds.height : null]);

/** Human input uses the same App policy, real native permission check and Stop as tools.
 * Gestures become atomic click/drag/key operations: no native key/button stays held across packets.
 * Identity and target come from the source's task and its actually published frame, never page arguments.
 */
export function createPreviewInput({ state: readState, valid, tools, control, refresh, now = Date.now }) {
  const gestures = new Map(), operations = new Map();
  let closed = false;
  function disconnect(viewer) {
    gestures.delete(viewer);
    for (const controller of operations.get(viewer) ?? []) controller.abort(new Error('Viewer disconnected'));
    operations.delete(viewer);
  }
  function invalidate() {
    // Retain a bounded rejected intent until release/new down. Clearing it here
    // would make subsequent drag moves look like harmless hover events.
    for (const gesture of gestures.values()) gesture.invalidated = true;
    for (const pending of operations.values()) for (const controller of pending) controller.abort(new Error('View changed'));
    operations.clear();
  }
  return {
    disconnect, invalidate,
    close() { closed = true; invalidate(); gestures.clear(); },
    async input(input, context) {
      const state = readState(), viewer = context?.viewer;
      const down = gestures.get(viewer);
      if (input?.kind === 'pointer' && input.action === 'up') gestures.delete(viewer);
      if (closed || !valid(state) || state.abort.signal.aborted || context?.signal?.aborted) return rejected('This view is no longer active. Refresh it before sending input.');
      if (typeof viewer !== 'string' || !viewer || viewer.length > 256) return rejected('The input viewer is unavailable.');
      const frame = state.frames.findLast(frame => frame.sequence === context.frame?.sequence);
      const age = frame ? now() - Date.parse(frame.at) : NaN;
      const space = frameSpace(frame);
      const currentSpace = () => space === frameSpace(state.frames.at(-1))
        && (state.coordinateRevision === undefined || frame?.coordinateRevision === state.coordinateRevision);
      if (!frame || !frame.inputReady || frame.epoch !== state.epoch || targetKey(frame.target) !== targetKey(state.target)
        || frame.width !== context.frame.width || frame.height !== context.frame.height || !currentSpace()
        || !Number.isFinite(age) || age < 0 || age > 15_000) {
        if (input?.kind === 'pointer' && down) down.invalidated = true;
        return rejected('The window picture is stale or its coordinates are unavailable. Refresh the view before sending input.');
      }
      const stopped = control?.stoppedFor(frame.target.pid);
      if (stopped) return rejected(stopped);
      if (input?.modifiers !== undefined && (!Array.isArray(input.modifiers) || input.modifiers.length > 4
        || input.modifiers.some(value => !['alt', 'control', 'meta', 'shift'].includes(value)))) return rejected('Invalid modifiers.');
      const target = { kind: 'window', pid: frame.target.pid, window_id: frame.target.window_id };
      const at = () => ({ x: Math.min(frame.width - 1, Math.round(input.x * frame.width)),
        y: Math.min(frame.height - 1, Math.round(input.y * frame.height)) });
      let name, args = { target, delivery_mode: 'background' };
      if (input?.kind === 'pointer') {
        if (!point(input.x) || !point(input.y) || !['left', 'middle', 'right'].includes(input.button)) return rejected('Invalid pointer coordinates.');
        if (input.action === 'down') {
          if (gestures.size >= 32 && !gestures.has(viewer)) return rejected('Too many pending gestures.');
          gestures.set(viewer, { ...at(), button: input.button, epoch: state.epoch, target: targetKey(frame.target),
            space, frameSequence: frame.sequence });
          return applied();
        }
        if (down && (down.invalidated || down.space !== space || down.epoch !== state.epoch
          || down.target !== targetKey(frame.target) || frame.sequence < down.frameSequence)) {
          return rejected('The gesture picture coordinates changed. Start a new gesture on the refreshed view.');
        }
        if (input.action === 'move') return applied();
        if (input.action !== 'up' || !down || down.button !== input.button || down.epoch !== state.epoch || down.target !== targetKey(frame.target)) {
          return rejected('The gesture ended or its window changed. No click was sent.');
        }
        const to = at(), moved = Math.hypot(to.x - down.x, to.y - down.y) > 2;
        name = moved ? 'drag' : 'click';
        args = { ...args, button: input.button,
          ...(moved ? { from_x: down.x, from_y: down.y, to_x: to.x, to_y: to.y } : to),
          ...(input.modifiers?.length ? { modifier: modifiers(input.modifiers) } : {}) };
      } else if (input?.kind === 'text') {
        if (typeof input.text !== 'string' || input.text.length > 64 * 1024) return rejected('Invalid committed text.');
        if (!input.text) return applied();
        name = 'type_text'; args.text = input.text;
      } else if (input?.kind === 'key') {
        if (!['down', 'up'].includes(input.action) || typeof input.key !== 'string') return rejected('Invalid key input.');
        if (input.action === 'up' || modifierKeys.has(input.key)) return applied();
        const key = keyNames[input.key] ?? (/^F(?:[1-9]|1\d|2[0-4])$/.test(input.key) ? input.key.toLowerCase()
          : input.key.length === 1 && input.modifiers?.some(value => ['meta', 'control', 'alt'].includes(value)) ? input.key : null);
        if (!key) return rejected('This key is not supported; committed text must use the text channel.');
        name = 'press_key'; args = { ...args, key, ...(input.modifiers?.length ? { modifiers: modifiers(input.modifiers) } : {}) };
      } else if (input?.kind === 'wheel') {
        if (!point(input.x) || !point(input.y) || !Number.isFinite(input.deltaX) || !Number.isFinite(input.deltaY)
          || Math.abs(input.deltaX) > 10_000 || Math.abs(input.deltaY) > 10_000) return rejected('Invalid wheel input.');
        if (input.modifiers?.length) return rejected('Modified wheel input is not supported. No scroll was sent.');
        const horizontal = Math.abs(input.deltaX) > Math.abs(input.deltaY), delta = horizontal ? input.deltaX : input.deltaY;
        if (!delta) return applied();
        name = 'scroll'; args = { ...args, ...at(), direction: horizontal ? delta > 0 ? 'right' : 'left' : delta > 0 ? 'down' : 'up',
          amount: Math.min(50, Math.max(1, Math.ceil(Math.abs(delta) / 100))) };
      } else return rejected('Unsupported picture input.');

      const controller = new AbortController(), epoch = state.epoch;
      const pending = operations.get(viewer) ?? new Set(); pending.add(controller); operations.set(viewer, pending);
      const signal = AbortSignal.any([state.abort.signal, controller.signal, ...(context.signal ? [context.signal] : [])]);
      const who = { ...state.caller, preview: true, humanViewer: viewer, signal };
      try {
        if (signal.aborted || !valid(state) || !currentSpace()) return rejected('Input was cancelled or its picture coordinates changed before dispatch.');
        if (input.kind === 'pointer' || input.kind === 'wheel') {
          // The displayed picture may have come from another native lane. Calibrate this
          // viewer lane and obtain its own capture token; never borrow another session's token.
          const fresh = await tools.call('get_window_state', { target, include_screenshot: true, include_accessibility_tree: false,
            display_only: true, max_dimension: 1280 }, who);
          const raw = fresh?.structuredContent, actual = raw?.target ?? raw;
          if (fresh?.isError || actual?.pid !== target.pid || actual?.window_id !== target.window_id
            || raw?.screenshot_width !== frame.width || raw?.screenshot_height !== frame.height
            || (frame.coordinateKey !== undefined && frame.coordinateKey !== pictureCoordinateKey(raw?.screenshot_width, raw?.screenshot_height, raw?.window_bounds))) {
            return rejected('The window or its picture size changed. Refresh the view before sending input.');
          }
          if (signal.aborted || !valid(state) || state.epoch !== epoch || !currentSpace() || control?.stoppedFor(target.pid)) return rejected('Input was cancelled or its picture coordinates changed before dispatch.');
          if (name === 'click' && typeof raw.capture_id === 'string') args.capture_id = raw.capture_id;
        }
        const result = await tools.call(name, args, who);
        if (signal.aborted || !valid(state) || state.epoch !== epoch || !currentSpace()) return uncertain('The view changed while input was in flight.');
        if (result?.isError) {
          const reason = String(result.content?.find(block => block.type === 'text')?.text ?? 'The native operation was not confirmed.').slice(0, 1000);
          return preflightFailures.has(result.structuredContent?.code) ? rejected(reason) : uncertain(reason);
        }
        try { void Promise.resolve(refresh()).catch(() => {}); } catch { /* Display is advisory. */ }
        return applied();
      } catch (error) { return uncertain(String(error).slice(0, 1000)); }
      finally {
        pending.delete(controller);
        if (!pending.size && operations.get(viewer) === pending) operations.delete(viewer);
      }
    },
  };
}
