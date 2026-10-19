// A captured picture and its sampled native cursor are one observation. Never
// execute the agent's planned path on this clock: only present real samples.
export class FramePlayback {
  constructor(view) { this.view = view; this.generation = 0; this.frame = null; }

  async show(frame) {
    const generation = ++this.generation;
    const src = `data:${frame.mimeType};base64,${frame.data}`;
    await this.view.decode(src);
    if (generation !== this.generation) return;
    const cursor = frame.cursor;
    const previous = this.frame?.cursor;
    const measurable = cursor && frame.width > 0 && frame.height > 0;
    const sameSize = this.frame?.width === frame.width && this.frame?.height === frame.height;
    const moved = measurable && (!previous || cursor.x !== previous.x || cursor.y !== previous.y);
    // Buffer the corresponding picture during this short presentation move.
    // On arrival, picture and pointer commit together. A resized window has a
    // different coordinate system, so its cursor is placed after the new image.
    if (measurable && previous && sameSize && moved) await this.view.move(cursor, frame);
    if (generation !== this.generation) return;
    await this.view.commit(src, frame);
    if (generation !== this.generation) return;
    this.frame = frame;
    if (!measurable) { this.view.hide(); return; }
    this.view.place(cursor, frame);
    if (moved && cursor.click) this.view.click();
  }

  resize() {
    if (this.frame?.cursor && this.frame.width > 0 && this.frame.height > 0) this.view.place(this.frame.cursor, this.frame);
  }

  reset() { this.generation++; this.frame = null; this.view.hide(); }
}
