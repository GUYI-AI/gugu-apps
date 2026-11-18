/** Cursor decorations belong only to a frame the shared viewer actually painted. */
export function createPaintedCursor({ show, hide }) {
  let frames = [], painted = null, clicked = '';
  const apply = () => {
    const frame = painted && frames.find(frame => frame.sequence === painted.sequence
      && frame.width === painted.width && frame.height === painted.height);
    if (!frame?.cursor) { hide(); return; }
    const cursor = frame.cursor;
    if (![cursor.x, cursor.y].every(Number.isFinite) || cursor.x < 0 || cursor.y < 0
      || cursor.x >= frame.width || cursor.y >= frame.height) { hide(); return; }
    const click = cursor.click === true && cursor.revision !== clicked;
    if (click) clicked = cursor.revision;
    show(cursor, frame, click);
  };
  return {
    frames(next, current) {
      next = Array.isArray(next) ? next : [];
      frames = current ? next.filter(frame => Number.isSafeInteger(current.revision) && current.revision > 0
        && frame.epoch === current.revision && current.target?.pid > 0 && current.target?.window_id > 0
        && frame.target?.pid === current.target.pid && frame.target?.window_id === current.target.window_id) : next;
      apply();
    },
    painted(next) { painted = next; apply(); },
    resize: apply,
    reset() { frames = []; painted = null; clicked = ''; hide(); },
  };
}
