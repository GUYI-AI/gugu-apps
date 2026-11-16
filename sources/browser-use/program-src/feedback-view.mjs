import { AsyncResource } from 'node:async_hooks';

const measured = value => value?.space === 'screen-dip' && value.relativeTo && typeof value.relativeTo.windowId === 'string'
  && value.relativeTo.windowId.length > 0 && Number.isFinite(value.zoomFactor) && value.zoomFactor > 0
  && [value.bounds, value.clip].every(box => box && [box.x, box.y, box.width, box.height].every(Number.isFinite) && box.width > 0 && box.height > 0);

/** App-owned, passive feedback above its own opaque page lease. No input forwarding or target enumeration. */
export function createBrowserFeedbackViews({ surfaces, log = () => {} }) {
  // Created at program startup, before a task call lends its temporary authority.
  const background = new AsyncResource('BrowserUseFeedback');
  const detached = work => background.runInAsyncScope(work);
  const report = error => { try { log({ error: String(error) }, 'Browser feedback could not be displayed'); } catch {} };
  const attempt = work => { try { void Promise.resolve(work()).catch(report); } catch (error) { report(error); } };
  const views = new Set();
  return {
    attach(lease) {
      let disposed = false, handle, placement = null, cursor = null, action = null, serial = 0, revision = 0;
      let gesture, off = () => {}, placementVersion = 0;
      const visible = () => !disposed && placement?.space === 'screen-dip' && placement.clip.width > 0 && placement.clip.height > 0;
      const update = () => {
        if (!handle || disposed) return;
        if (!visible()) { attempt(() => handle.update({ visible: false })); return; }
        const { bounds, clip, zoomFactor, relativeTo } = placement;
        const point = cursor && { x: bounds.x + cursor.x * zoomFactor - clip.x, y: bounds.y + cursor.y * zoomFactor - clip.y,
          ...(cursor.click ? { click: cursor.click } : {}) };
        const shown = point && point.x >= 0 && point.y >= 0 && point.x < clip.width && point.y < clip.height ? point : null;
        attempt(() => handle.update({ bounds: clip, relativeTo, visible: !!shown || !!action,
          data: { revision, cursor: shown, action } }));
      };
      const current = value => detached(() => {
        if (disposed) return;
        placementVersion++;
        const next = measured(value) ? value : null;
        if (!next || placement && (next.zoomFactor !== placement.zoomFactor
          || next.bounds.width !== placement.bounds.width || next.bounds.height !== placement.bounds.height)) {
          revision++; serial++; cursor = null; gesture = undefined;
        }
        placement = next; update();
      });
      const view = {
        observe(method, params, native, child = false) {
          if (disposed || method !== 'Input.dispatchMouseEvent') return;
          const operation = ++serial, target = revision;
          if (child || params.type === 'mousePressed') gesture = undefined;
          cursor = null; detached(update);
          if (child) return;
          void native.then(() => detached(() => {
            if (disposed || target !== revision || operation !== serial) return;
            if (![params.x, params.y].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)) return;
            if (params.type === 'mousePressed') gesture = `click-${operation}`;
            else if (params.type !== 'mouseReleased') gesture = undefined;
            cursor = { x: params.x, y: params.y, ...(gesture ? { click: gesture } : {}) }; update();
          }), () => detached(() => { if (!disposed && operation === serial) { cursor = null; update(); } }));
        },
        activity(label, phase) { if (disposed) return; action = label ? { label, phase } : null; detached(update); },
        clear() { revision++; serial++; cursor = action = null; gesture = undefined; detached(update); },
        close() {
          if (disposed) return; disposed = true; off(); views.delete(view);
          if (handle) detached(() => attempt(() => handle.close()));
        },
      };
      views.add(view);
      if (!surfaces?.open || !lease.presentation || !lease.onPresentation) return view;
      try {
        off = lease.onPresentation(current);
        // Creation alone borrows the actual live call. Later layout updates use this held lease.
        const opening = surfaces.open({ entry: 'feedback.html', decorative: true, bounds: { x: 0, y: 0, width: 1, height: 1 }, visible: false });
        void Promise.resolve(opening).then(value => detached(() => {
          if (disposed) { attempt(() => value.close()); return; }
          handle = value;
          handle.onEvent(event => { if (event.type === 'closed') view.close(); if (event.type === 'display' && event.reason) report(event.reason); });
          update();
        })).catch(report);
        // A placement event overtaking this read is newer than its reply.
        const snapshot = placementVersion;
        void Promise.resolve(lease.presentation()).then(value => { if (placementVersion === snapshot) current(value); }).catch(report);
      } catch (error) { report(error); }
      return view;
    },
    dispose() { for (const view of [...views]) view.close(); background.emitDestroy(); },
  };
}
