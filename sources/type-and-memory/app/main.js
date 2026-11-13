// src/core/types.ts
var DeskError = class extends Error {
};

// src/core/text.ts
var SENTENCE_END = /[.!?。！？\n]/;
var CJK = /[぀-ヿ㐀-鿿]/;
function weigh(text) {
  let w = 0;
  for (const ch of text) w += SENTENCE_END.test(ch) ? 4 : ch === "\uFF0C" ? 0 : CJK.test(ch) ? 2 : 1;
  return w;
}
function fold(text) {
  const lower = text.toLowerCase();
  return (lower.length === text.length ? lower : text).replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, "-");
}
function hueOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = h * 31 + id.charCodeAt(i) >>> 0;
  const hue = h % 300;
  return hue < 60 ? hue : hue + 60;
}
function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// src/core/anchor.ts
function firstFree(text, quote, taken) {
  return firstFreeFolded(fold(text), fold(quote), taken);
}
function firstFreeFolded(text, quote, taken) {
  let at = quote ? text.indexOf(quote) : -1;
  if (at < 0) return -1;
  const clash = (i) => taken.some(([a, b]) => i < b && i + quote.length > a);
  while (at >= 0 && clash(at)) at = text.indexOf(quote, at + 1);
  return at < 0 ? -2 : at;
}
function locate(text, marks) {
  const spans = /* @__PURE__ */ new Map();
  const taken = [];
  const folded = fold(text);
  for (const m of [...marks].sort((a, b) => a.at - b.at)) {
    if (!m.quote) continue;
    const at = firstFreeFolded(folded, fold(m.quote), taken);
    if (at < 0) continue;
    const span = [at, at + m.quote.length];
    spans.set(m.id, span);
    taken.push(span);
  }
  return spans;
}

// src/core/desk.ts
var MAX_QUOTE = 80;
function openDesk(sheet, voices = [], now = Date.now) {
  const speaker = (as) => {
    const key = as?.trim().toLowerCase();
    const known = key ? voices.find((v) => v.id.toLowerCase() === key || v.name.toLowerCase() === key) : voices[0];
    const name = known?.name ?? as?.trim() ?? "agent";
    return { name, hue: known?.hue ?? hueOf(known?.id ?? name) };
  };
  return {
    read: () => ({ text: sheet.text(), marks: sheet.marks() }),
    annotate({ quote, note, as }) {
      note = note?.trim();
      if (!note) throw new DeskError("The note is empty.");
      const live = sheet.marks();
      const voice = speaker(as);
      const mark = { id: newId(), quote: "", note, voice: voice.name, hue: voice.hue, at: now() };
      if (!quote?.trim()) {
        for (const m of live) if (!m.quote) sheet.drop(m.id);
        sheet.put(mark);
        return mark;
      }
      quote = quote.trim();
      if (quote.includes("\n")) throw new DeskError("Quote a phrase from a single line.");
      if (quote.length > MAX_QUOTE) throw new DeskError(`Quote a shorter phrase (at most ${MAX_QUOTE} characters).`);
      const text = sheet.text();
      const taken = [...locate(text, live).values()];
      const at = firstFree(text, quote, taken);
      if (at === -1) throw new DeskError(`"${quote}" is not in the text. Quote a phrase exactly as written.`);
      if (at === -2) throw new DeskError(`"${quote}" overlaps a phrase that already has a note. Pick another phrase.`);
      mark.quote = text.slice(at, at + quote.length);
      sheet.put(mark);
      return mark;
    },
    reply({ mark: id, text, as }) {
      text = text?.trim();
      if (!text) throw new DeskError("The reply is empty.");
      const mark = sheet.marks().find((m) => m.id === id);
      if (!mark) throw new DeskError(`There is no note "${id}". Read the page for the current notes.`);
      const from = as ? speaker(as).name : mark.voice;
      sheet.put({ ...mark, thread: [...mark.thread ?? [], { from, text, at: now() }] });
    }
  };
}

// src/core/pace.ts
function createEnergy({ cost = 50, stride = 0 } = {}) {
  let earned = 0;
  let spent = 0;
  let sinceAsk = 0;
  let fresh = false;
  const unspent = () => Math.max(0, earned - spent);
  return {
    cost,
    earn(weight) {
      if (weight <= 0) return;
      earned += weight;
      sinceAsk += weight;
      fresh = true;
    },
    restore(textWeight, shown) {
      spent = shown * cost;
      earned = Math.max(textWeight, spent);
    },
    canShow: () => unspent() >= cost,
    show() {
      spent += cost;
      if (!stride) fresh = true;
    },
    shouldAsk: (held) => fresh && held === 0 && sinceAsk >= stride,
    asked() {
      fresh = false;
      sinceAsk = 0;
    },
    level: () => Math.floor(unspent() / cost),
    progress: () => unspent() % cost / cost
  };
}

// src/editor/surface.ts
var SENTENCE_TYPED = /[.!?。！？，]$/;
var NATIVE_PASTE_LINES = 200;
function createSurface(placeholder) {
  const root = document.createElement("div");
  root.className = "tm-text";
  root.contentEditable = "true";
  root.spellcheck = false;
  root.dataset.placeholder = placeholder;
  const weights = /* @__PURE__ */ new WeakMap();
  const listeners = [];
  let cached = "";
  let composing = false;
  let unreported = 0;
  const para = (text = "", far = false) => {
    const p = document.createElement("p");
    if (far) p.className = "tm-far";
    if (text) p.textContent = text;
    else p.append(document.createElement("br"));
    return p;
  };
  const paraOf = (node) => {
    while (node && node.parentNode !== root) node = node.parentNode;
    return node;
  };
  function reshape(changed, structural) {
    let added = false;
    if (structural) {
      for (const node of [...root.childNodes]) {
        if (node instanceof HTMLParagraphElement) continue;
        const caret = caretWithin(node);
        const p = para(node.textContent ?? "");
        node.replaceWith(p);
        changed.add(p);
        if (caret !== null) placeCaret(p, caret);
      }
      if (!root.firstChild) {
        const p = para();
        root.append(p);
        changed.add(p);
        if (document.activeElement === root) placeCaret(p, 0);
      }
    }
    for (const p of [...changed]) {
      const kids = p.childNodes;
      const text = p.textContent ?? "";
      const plain = [...kids].every((k, i) => k.nodeType === Node.TEXT_NODE || k.nodeName === "BR" && i === kids.length - 1);
      if (plain && kids.length && !text.includes("\n")) continue;
      const [first, ...rest] = text.split("\n");
      const caret = caretWithin(p);
      p.replaceChildren(first || document.createElement("br"));
      const more = rest.map((line2) => para(line2));
      added ||= more.length > 0;
      p.after(...more);
      for (const q of more) changed.add(q);
      if (caret === null) continue;
      let at = caret;
      const line = [p, ...more].find((q) => at <= (q.textContent?.length ?? 0) || (at -= (q.textContent?.length ?? 0) + 1, false));
      placeCaret(line ?? p, line ? at : 0);
    }
    return added;
  }
  function digest(records) {
    if (!records.length) return;
    const changed = /* @__PURE__ */ new Set();
    let structural = false;
    let weight = 0;
    for (const r of records) {
      if (r.target === root) {
        structural = true;
        for (const n of r.removedNodes) weight -= weights.get(n) ?? 0;
        for (const n of r.addedNodes) if (n.parentNode === root && n instanceof HTMLElement) changed.add(n);
      } else {
        const p = paraOf(r.target);
        if (p) changed.add(p);
      }
    }
    if (!composing && reshape(changed, structural)) structural = true;
    observer.takeRecords();
    for (const p of changed) {
      if (p.parentNode !== root) {
        changed.delete(p);
        continue;
      }
      const w = weigh(p.textContent ?? "");
      weight += w - (weights.get(p) ?? 0);
      weights.set(p, w);
    }
    cached = null;
    root.classList.toggle("tm-empty", root.childNodes.length === 1 && !root.firstChild.textContent);
    unreported += weight;
    const change = { changed, structural, typed: null };
    for (const l of listeners) l(change);
  }
  function typed(sentenceEnd) {
    digest(observer.takeRecords());
    const change = { changed: /* @__PURE__ */ new Set(), structural: false, typed: { weight: Math.max(0, unreported), sentenceEnd } };
    unreported = 0;
    for (const l of listeners) l(change);
  }
  const observer = new MutationObserver(digest);
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  root.addEventListener("compositionstart", () => composing = true);
  root.addEventListener("compositionend", (e) => {
    composing = false;
    typed(SENTENCE_TYPED.test(e.data ?? ""));
  });
  root.addEventListener("input", (e) => {
    if (composing) return;
    const { inputType, data } = e;
    typed(inputType === "insertParagraph" || SENTENCE_TYPED.test(data ?? ""));
  });
  root.addEventListener("beforeinput", (e) => {
    if (e.inputType.startsWith("format")) e.preventDefault();
    else if (e.inputType === "insertLineBreak") {
      e.preventDefault();
      document.execCommand("insertParagraph");
    } else if (e.inputType === "insertFromDrop") {
      e.preventDefault();
      insert(e.dataTransfer?.getData("text/plain") ?? "");
    }
  });
  root.addEventListener("paste", (e) => {
    e.preventDefault();
    insert(e.clipboardData?.getData("text/plain") ?? "");
  });
  function insert(text) {
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    if (lines.length <= NATIVE_PASTE_LINES) {
      lines.forEach((line, i) => {
        if (i) document.execCommand("insertParagraph");
        if (line) document.execCommand("insertText", false, line);
      });
      return;
    }
    const sel = selection();
    if (!sel) return;
    const [from, to] = [Math.min(sel.anchor, sel.head), Math.max(sel.anchor, sel.head)];
    const now = read();
    render(now.slice(0, from) + lines.join("\n") + now.slice(to), { anchor: from + text.length, head: from + text.length });
    unreported = weigh(text);
    typed(true);
  }
  function read() {
    digest(observer.takeRecords());
    if (cached === null) {
      const lines = [];
      for (let p = root.firstChild; p; p = p.nextSibling) lines.push(p.textContent ?? "");
      cached = lines.join("\n");
    }
    return cached;
  }
  function render(text, sel) {
    const lines = text.split("\n");
    const old = [...root.children];
    let head = 0;
    while (head < old.length && head < lines.length && old[head].textContent === lines[head]) head++;
    let tail = 0;
    while (tail < old.length - head && tail < lines.length - head && old[old.length - 1 - tail].textContent === lines[lines.length - 1 - tail])
      tail++;
    const fresh = document.createDocumentFragment();
    for (let i = head; i < lines.length - tail; i++) fresh.append(para(lines[i], true));
    for (let i = head; i < old.length - tail; i++) old[i].remove();
    root.insertBefore(fresh, old[old.length - tail] ?? null);
    digest(observer.takeRecords());
    unreported = 0;
    if (sel) select(sel);
  }
  function selection() {
    const s = getSelection();
    if (!s?.anchorNode || !root.contains(s.anchorNode) || !root.contains(s.focusNode)) return null;
    return { anchor: offsetOf(s.anchorNode, s.anchorOffset), head: offsetOf(s.focusNode, s.focusOffset) };
  }
  function offsetOf(node, offset) {
    if (node === root) {
      let total2 = 0;
      for (let i = 0; i < offset; i++) total2 += (root.childNodes[i].textContent?.length ?? 0) + 1;
      return Math.max(0, Math.min(total2, read().length));
    }
    const p = paraOf(node);
    let total = offsetIn(p, node, offset);
    for (let q = p.previousSibling; q; q = q.previousSibling) total += (q.textContent?.length ?? 0) + 1;
    return total;
  }
  function select({ anchor, head }) {
    const point = (offset) => {
      let p = root.firstChild;
      while (p.nextSibling && offset > (p.textContent?.length ?? 0)) {
        offset -= (p.textContent?.length ?? 0) + 1;
        p = p.nextSibling;
      }
      return pointIn(p, offset);
    };
    getSelection()?.setBaseAndExtent(...point(anchor), ...point(head));
  }
  const near = () => {
    const s = getSelection();
    if (!s?.focusNode || !root.contains(s.focusNode)) return;
    paraOf(s.focusNode)?.classList.remove("tm-far");
    if (!s.isCollapsed) paraOf(s.anchorNode)?.classList.remove("tm-far");
  };
  document.addEventListener("selectionchange", near);
  root.append(para());
  observer.takeRecords();
  root.classList.add("tm-empty");
  return {
    element: root,
    read,
    render,
    selection,
    onChange: (l) => void listeners.push(l),
    destroy() {
      observer.disconnect();
      document.removeEventListener("selectionchange", near);
    }
  };
}
function offsetIn(p, node, offset) {
  if (node === p) {
    let total2 = 0;
    for (let i = 0; i < offset; i++) total2 += p.childNodes[i].textContent?.length ?? 0;
    return total2;
  }
  let total = offset;
  for (let n = node.previousSibling; n; n = n.previousSibling) total += n.textContent?.length ?? 0;
  return total;
}
function pointIn(p, offset) {
  for (let n = p.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== Node.TEXT_NODE) continue;
    const len = n.length;
    if (offset <= len) return [n, offset];
    offset -= len;
  }
  return [p, 0];
}
function caretWithin(node) {
  const s = getSelection();
  if (!s?.focusNode || !(node === s.focusNode || node.contains(s.focusNode))) return null;
  const r = document.createRange();
  r.selectNodeContents(node);
  r.setEnd(s.focusNode, s.focusOffset);
  return r.toString().length;
}
function placeCaret(p, offset) {
  getSelection()?.collapse(...pointIn(p, offset));
}

// src/editor/marks.ts
var instances = 0;
var marker = (color) => `text-decoration:underline ${color};text-decoration-thickness:.58em;text-underline-offset:-.4em;text-decoration-skip-ink:none`;
function createMarks(surface, root) {
  const name = `tm${++instances}`;
  const pins = /* @__PURE__ */ new Map();
  const hues = /* @__PURE__ */ new Set();
  const sheet = document.createElement("style");
  const activeRule = document.createElement("style");
  root.append(sheet, activeRule);
  let marks = [];
  let active = null;
  const paint = "highlights" in CSS;
  const pin = (p, start, end) => {
    const range = document.createRange();
    range.setStart(...pointIn(p, start));
    range.setEnd(...pointIn(p, end));
    return { p, start, end, range };
  };
  function relocate() {
    pins.clear();
    const spans = [...locate(surface.read(), marks)].sort((a, b) => a[1][0] - b[1][0]);
    let p = surface.element.firstChild;
    let base = 0;
    for (const [id, [start, end]] of spans) {
      while (p && start > base + (p.textContent?.length ?? 0)) {
        base += (p.textContent?.length ?? 0) + 1;
        p = p.nextSibling;
      }
      if (p) pins.set(id, pin(p, start - base, end - base));
    }
    wash();
  }
  function follow({ changed, structural }) {
    const adrift = marks.filter((m) => m.quote && !pins.has(m.id));
    const here = marks.filter((m) => {
      const at = pins.get(m.id);
      return at && (changed.has(at.p) || !at.p.isConnected);
    });
    if (!here.length && !adrift.length) return;
    const lineOf = new Map(here.map((m) => [m, pins.get(m.id).p]));
    let lost = here.some((m) => !lineOf.get(m).isConnected);
    for (const p of changed) {
      const group = [...here.filter((m) => lineOf.get(m) === p), ...adrift.filter((m) => !pins.has(m.id))];
      if (!group.length) continue;
      const spans = locate(p.textContent ?? "", group);
      for (const m of group) {
        const span = spans.get(m.id);
        if (span) pins.set(m.id, pin(p, span[0], span[1]));
        else if (pins.delete(m.id)) lost = true;
      }
    }
    if (lost || structural && pins.size < quoted()) relocate();
    else wash();
  }
  const quoted = () => marks.reduce((n, m) => n + (m.quote ? 1 : 0), 0);
  function wash() {
    if (!paint) return;
    const byHue = /* @__PURE__ */ new Map();
    for (const m of marks) {
      const at2 = pins.get(m.id);
      if (!at2) continue;
      byHue.set(m.hue, [...byHue.get(m.hue) ?? [], at2.range]);
      if (!hues.has(m.hue)) {
        hues.add(m.hue);
        sheet.textContent += `.tm-text p::highlight(${name}-${m.hue}){${marker(`hsl(${m.hue} 90% 84%)`)}}.tm-dark .tm-text p::highlight(${name}-${m.hue}){${marker(`hsl(${m.hue} 50% 30%)`)}}`;
      }
    }
    for (const hue2 of hues) {
      const ranges = byHue.get(hue2);
      if (ranges) CSS.highlights.set(`${name}-${hue2}`, new Highlight(...ranges));
      else CSS.highlights.delete(`${name}-${hue2}`);
    }
    const at = active ? pins.get(active) : void 0;
    const hue = marks.find((m) => m.id === active)?.hue;
    if (at) {
      const h = new Highlight(at.range);
      h.priority = 1;
      CSS.highlights.set(`${name}-active`, h);
      activeRule.textContent = `.tm-text p::highlight(${name}-active){${marker(`hsl(${hue} 95% 72%)`)}}.tm-dark .tm-text p::highlight(${name}-active){${marker(`hsl(${hue} 65% 42%)`)}}`;
    } else CSS.highlights.delete(`${name}-active`);
  }
  surface.onChange(follow);
  return {
    set(next) {
      marks = next;
      relocate();
    },
    pinOf: (id) => pins.get(id),
    /** The note whose phrase holds the caret. */
    under(p, offset) {
      for (const [id, at] of pins) if (at.p === p && offset >= at.start && offset <= at.end) return id;
      return null;
    },
    activate(id) {
      if (active === id) return;
      active = id;
      wash();
    },
    destroy() {
      if (!paint) return;
      for (const hue of hues) CSS.highlights.delete(`${name}-${hue}`);
      CSS.highlights.delete(`${name}-active`);
    }
  };
}

// src/editor/notes.ts
var defaultNote = (mark, actions) => {
  const el = document.createElement("article");
  el.className = "tm-note";
  const make = (tag, className, props = {}) => Object.assign(document.createElement(tag), { className, ...props });
  const x = make("button", "tm-x", { textContent: "\xD7", title: "Dismiss" });
  const voice = make("b", "tm-voice");
  const say2 = make("span", "tm-say");
  const body = make("p", "tm-body");
  body.append(voice, say2);
  const thread = make("div", "tm-thread");
  const answer = make("input", "tm-answer", { placeholder: "\u2026" });
  el.append(x, body, thread, answer);
  x.onclick = () => actions.dismiss();
  el.onclick = (e) => e.target !== x && !e.target.closest(".tm-more") && answer.focus();
  answer.onkeydown = (e) => {
    if (e.key !== "Enter" || e.isComposing || !answer.value.trim()) return;
    actions.reply(answer.value.trim());
    answer.value = "";
  };
  const update = (m) => {
    el.style.setProperty("--tm-h", String(m.hue));
    voice.textContent = m.voice;
    say2.textContent = m.note;
    el.classList.toggle("tm-threaded", !!m.thread?.length);
    thread.replaceChildren(
      ...(m.thread ?? []).map((t) => make("div", t.from === "writer" ? "tm-turn tm-me" : "tm-turn", { textContent: t.text }))
    );
  };
  update(mark);
  return { el, update };
};
var GAP = 5;
var LAST = 6;
var PAD = 5;
var SAME_LINE = 6;
function createNotes(opts) {
  const { margin, tray, marks } = opts;
  const cards = /* @__PURE__ */ new Map();
  const order = /* @__PURE__ */ new Map();
  const chosen = /* @__PURE__ */ new Map();
  let active = null;
  let queued = false;
  function place() {
    queued = false;
    if (opts.narrow()) {
      const card = active ? cards.get(active) : void 0;
      if (card) {
        card.el.style.transform = "";
        card.el.style.removeProperty("--tm-lines");
        card.el.classList.remove("tm-behind", "tm-lost");
        card.el.querySelector(".tm-more")?.remove();
      }
      if (card && card.el.parentNode !== tray) tray.replaceChildren(card.el);
      else if (!card) tray.replaceChildren();
      return;
    }
    const rows = [];
    for (const [id, { el }] of cards) {
      if (el.parentNode !== margin) margin.append(el);
      const pin = marks.pinOf(id);
      el.classList.toggle("tm-lost", !pin);
      if (!pin) continue;
      const line = pin.range.getBoundingClientRect();
      const inLine = line.height ? line.top - pin.p.getBoundingClientRect().top : 0;
      rows.push({ id, el, y: pin.p.offsetTop + inLine - margin.offsetTop });
    }
    rows.sort((a, b) => a.y - b.y || order.get(a.id) - order.get(b.id));
    const lines = [];
    for (const row of rows) {
      const last = lines.at(-1);
      if (last && row.y - last[0].y < SAME_LINE) last.push(row);
      else lines.push([row]);
    }
    const pitch = parseFloat(getComputedStyle(margin).lineHeight);
    const stacks = [];
    lines.forEach((line, i) => {
      const key = line[0].id;
      const room = i + 1 < lines.length ? lines[i + 1][0].y - line[0].y - GAP : LAST * (pitch + PAD);
      const together = line.length * (pitch + PAD) <= room;
      const shown = together ? null : line.find((r) => r.id === active) ?? line.find((r) => r.id === chosen.get(key)) ?? line.reduce((a, b) => order.get(b.id) > order.get(a.id) ? b : a);
      const each = together ? room / line.length : room;
      for (const row of line) {
        row.el.classList.toggle("tm-behind", !together && row !== shown);
        row.el.style.setProperty("--tm-lines", String(Math.min(LAST, Math.max(1, Math.floor((each - PAD) / pitch)))));
        let more = row.el.querySelector(".tm-more");
        if (together || line.length === 1) {
          more?.remove();
          continue;
        }
        if (!more) row.el.prepend(more = Object.assign(document.createElement("button"), { className: "tm-more" }));
        const at = line.indexOf(row);
        more.textContent = `${at + 1}/${line.length}`;
        more.onclick = () => {
          const next = line[(at + 1) % line.length].id;
          chosen.set(key, next);
          opts.onPick(next);
        };
      }
      stacks.push({ rows: together ? line : [shown], y: line[0].y });
    });
    const heights = stacks.map(
      (stack) => stack.rows.map(
        (row) => row.id === active || row.el.matches(":hover") ? Number(row.el.style.getPropertyValue("--tm-lines")) * pitch + PAD : row.el.offsetHeight
      )
    );
    stacks.forEach((stack, i) => {
      let y = stack.y;
      stack.rows.forEach((row, j) => {
        row.el.style.transform = `translateY(${y}px)`;
        y += heights[i][j] + 2;
        if (!row.el.classList.contains("tm-placed")) requestAnimationFrame(() => row.el.classList.add("tm-placed"));
      });
    });
  }
  const layout = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(place);
  };
  new ResizeObserver(layout).observe(margin);
  return {
    layout,
    sync(next) {
      const seen = /* @__PURE__ */ new Set();
      for (const m of next) {
        if (!m.quote) continue;
        seen.add(m.id);
        const card = cards.get(m.id);
        if (card) card.update(m);
        else {
          const made = opts.part(m, opts.actions(m.id));
          made.el.addEventListener("pointerdown", (e) => !e.target.closest(".tm-more") && opts.onPick(m.id));
          cards.set(m.id, made);
          order.set(m.id, m.at + order.size / 1e6);
        }
      }
      for (const [id, card] of cards) {
        if (seen.has(id)) continue;
        card.el.remove();
        cards.delete(id);
        order.delete(id);
      }
      layout();
    },
    activate(id) {
      if (active) cards.get(active)?.el.classList.remove("tm-active");
      active = id;
      if (id) cards.get(id)?.el.classList.add("tm-active");
      layout();
    },
    holds: (node) => !!node && (margin.contains(node) || tray.contains(node))
  };
}

// src/editor/styles.ts
var styles = (
  /* css */
  `
.tm-root {
  --tm-paper: #fbfaf6;
  --tm-ink: #2a2926;
  --tm-faint: #9a968c;
  --tm-rule: #e9e5db;
  --tm-serif: "Iowan Old Style", "Palatino Linotype", "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", Georgia, serif;
  --tm-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  --tm-size: 18px;
  --tm-measure: 34em;
  --tm-note-l: 38%;
  --tm-note-bg-l: 96%;
  position: relative;
  height: 100%;
  background: var(--tm-paper);
  color: var(--tm-ink);
  font: var(--tm-size)/1.85 var(--tm-serif);
  -webkit-font-smoothing: antialiased;
}
.tm-root.tm-dark {
  --tm-paper: #1a1917;
  --tm-ink: #e4e0d6;
  --tm-faint: #77736a;
  --tm-rule: #2e2c28;
  --tm-note-l: 72%;
  --tm-note-bg-l: 15%;
}
.tm-root *, .tm-root *::before { box-sizing: border-box; }
.tm-scroll { height: 100%; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--tm-rule) transparent; }
.tm-page {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, var(--tm-measure)) minmax(14em, 21em);
  column-gap: 3.5em;
  justify-content: center;
  padding: 14vh 2em 45vh;
}
.tm-narrow .tm-page { grid-template-columns: minmax(0, var(--tm-measure)); padding: 2.2em 1.3em 55vh; }

.tm-text { outline: none; white-space: pre-wrap; overflow-wrap: break-word; caret-color: var(--tm-ink); min-height: 1.85em; }
.tm-text p { margin: 0; }
.tm-text p.tm-far { content-visibility: auto; contain-intrinsic-size: auto 1.85em; }
.tm-text.tm-empty::before { content: attr(data-placeholder); color: var(--tm-faint); pointer-events: none; position: absolute; }
.tm-text ::selection { background: color-mix(in srgb, var(--tm-ink) 16%, transparent); }

.tm-foot { min-height: 1.85em; margin-top: 1.1em; color: var(--tm-faint); font-style: italic; }
.tm-whisper { animation: tm-rise .6s ease both; }
.tm-whisper b { font: 600 .68em/1 var(--tm-sans); font-style: normal; letter-spacing: .09em; text-transform: uppercase; color: hsl(var(--tm-h) 45% var(--tm-note-l)); margin-right: .9em; }
.tm-busy { display: inline-flex; gap: .32em; padding: .7em 0; }
.tm-busy i { width: .26em; height: .26em; border-radius: 50%; background: var(--tm-faint); animation: tm-breathe 1.4s ease-in-out infinite; }
.tm-busy i:nth-child(2) { animation-delay: .18s; }
.tm-busy i:nth-child(3) { animation-delay: .36s; }
.tm-flash { font: .72em/1.5 var(--tm-sans); font-style: normal; color: #b4482f; cursor: pointer; }

.tm-margin { position: relative; font: .76em/1.6 var(--tm-sans); }
.tm-narrow .tm-margin { display: none; }
.tm-tray { display: none; }
.tm-narrow .tm-tray {
  display: block; position: absolute; left: 0; right: 0; bottom: 0; padding: 0 .8em .8em;
  font: .8em/1.6 var(--tm-sans); pointer-events: none;
}
.tm-narrow .tm-tray .tm-note {
  position: static; pointer-events: auto; background: var(--tm-paper);
  box-shadow: 0 6px 28px rgb(0 0 0 / .14), 0 0 0 1px var(--tm-rule); border-radius: 10px; padding: .9em 2.2em .9em 1.1em;
  max-height: 55vh; overflow-y: auto;
  animation: tm-rise .3s ease both;
}

.tm-note {
  position: absolute; left: 0; right: 0; top: 0; z-index: 1;
  padding: .1em 1.7em .15em .9em;
  border-left: 2px solid hsl(var(--tm-h) 60% var(--tm-note-l) / .55);
  border-radius: 0 6px 6px 0;
  color: color-mix(in srgb, var(--tm-ink) 78%, var(--tm-paper));
  transition: background-color .2s;
  animation: tm-arrive .5s ease both;
  cursor: default;
}
.tm-note.tm-placed { transition: transform .28s cubic-bezier(.2,.8,.2,1), background-color .2s; }
.tm-note.tm-lost, .tm-note.tm-behind { display: none; }
.tm-body { margin: 0; white-space: pre-wrap; overflow-wrap: break-word; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--tm-lines, none); }
.tm-voice { font-weight: 600; font-size: .86em; letter-spacing: .09em; text-transform: uppercase; margin-right: .8em; color: hsl(var(--tm-h) 45% var(--tm-note-l)); }
.tm-threaded .tm-say::after { content: " \u21A9"; color: var(--tm-faint); }
.tm-thread, .tm-answer { display: none; }
/* Read in full: laid over the notes below, never pushing them. */
.tm-note:hover, .tm-note.tm-active, .tm-tray .tm-note {
  z-index: 3; background: hsl(var(--tm-h) 55% var(--tm-note-bg-l)); color: var(--tm-ink);
  border-left-color: hsl(var(--tm-h) 60% var(--tm-note-l));
  box-shadow: 0 4px 18px rgb(0 0 0 / .08);
}
.tm-note.tm-active { z-index: 4; }
.tm-note:hover .tm-body, .tm-note.tm-active .tm-body, .tm-tray .tm-body { -webkit-line-clamp: none; }
.tm-note:hover .tm-thread, .tm-note.tm-active .tm-thread, .tm-tray .tm-thread { display: block; max-height: 40vh; overflow-y: auto; }
.tm-note.tm-active .tm-answer { display: block; }
.tm-turn { margin-top: .5em; white-space: pre-wrap; overflow-wrap: break-word; }
.tm-turn.tm-me { color: var(--tm-faint); padding-left: .9em; border-left: 1px solid var(--tm-rule); }
.tm-answer {
  width: 100%; margin-top: .6em; padding: .25em 0; border: 0; border-bottom: 1px solid var(--tm-rule);
  background: none; color: var(--tm-ink); font: inherit; outline: none;
}
.tm-answer::placeholder { color: var(--tm-faint); }
.tm-x, .tm-more {
  position: absolute; top: .1em; right: .25em; height: 1.5em; border: 0; background: none; color: var(--tm-faint);
  font: inherit; line-height: 1; cursor: pointer; border-radius: 4px; padding: 0 .2em;
}
.tm-x { opacity: 0; }
/* Several notes on one line take turns; the count says so and a click brings the next. */
.tm-more { font-size: .82em; font-variant-numeric: tabular-nums; }
.tm-note:hover .tm-more, .tm-note.tm-active .tm-more { right: 1.7em; }
.tm-note:has(.tm-more) { padding-right: 3em; }
.tm-note:hover .tm-x, .tm-note.tm-active .tm-x, .tm-tray .tm-x { opacity: 1; }
.tm-x:hover, .tm-more:hover { color: var(--tm-ink); }

/* How far along the next note is. */
.tm-energy { position: absolute; left: 1.2em; bottom: .9em; width: 4.5em; height: 3px; border-radius: 3px; background: color-mix(in srgb, var(--tm-ink) 10%, transparent); overflow: hidden; pointer-events: none; }
.tm-narrow .tm-energy { bottom: auto; top: .8em; left: auto; right: 1.2em; }
.tm-energy-fill { height: 100%; width: 0; border-radius: 3px; background: color-mix(in srgb, var(--tm-ink) 38%, transparent); transition: width .25s ease; }
.tm-energy.tm-pulse { animation: tm-pulse .6s ease-out; }
@keyframes tm-pulse { 0% { transform: scaleY(1); } 30% { transform: scaleY(2.6); } 100% { transform: scaleY(1); } }

@keyframes tm-arrive { from { opacity: 0; translate: .6em 0; } }
@keyframes tm-rise { from { opacity: 0; translate: 0 .4em; } }
@keyframes tm-breathe { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .tm-root * { animation: none !important; transition: none !important; } }
`
);

// src/editor/mount.ts
var SAVE_AFTER = 500;
var NARROW = 760;
var LULL_MIN = 10;
function mount(host, options) {
  const { store } = options;
  const pace = { batch: 1, lull: 2e3, ...options.pace };
  const energy = createEnergy(pace);
  if (!document.getElementById("tm-styles")) {
    document.head.append(Object.assign(document.createElement("style"), { id: "tm-styles", textContent: styles }));
  }
  const el = (className, ...kids) => {
    const d = Object.assign(document.createElement("div"), { className });
    d.append(...kids);
    return d;
  };
  const surface = createSurface(options.placeholder ?? "");
  const foot = el("tm-foot");
  const margin = el("tm-margin");
  const tray = el("tm-tray");
  const scroll = el("tm-scroll", el("tm-page", el("tm-main", surface.element, foot), margin));
  const bar = el("tm-energy", el("tm-energy-fill"));
  const root = el("tm-root", scroll, tray, ...options.energyBar === false ? [] : [bar]);
  host.append(root);
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = () => root.classList.toggle("tm-dark", options.theme === "dark" || options.theme !== "light" && dark.matches);
  applyTheme();
  dark.addEventListener("change", applyTheme);
  let narrow = root.clientWidth < NARROW;
  root.classList.toggle("tm-narrow", narrow);
  const sized = new ResizeObserver(() => {
    narrow = root.clientWidth < NARROW;
    root.classList.toggle("tm-narrow", narrow);
    notes.layout();
  });
  const marks = /* @__PURE__ */ new Map();
  const anchors = createMarks(surface, root);
  let loaded = false;
  let active = null;
  let heldUntil = 0;
  const notes = createNotes({
    margin,
    tray,
    marks: anchors,
    part: options.parts?.note ?? defaultNote,
    narrow: () => narrow,
    onPick: (id) => activate(id),
    actions: (id) => ({
      dismiss: () => sheet.drop(id),
      reply(text) {
        const mark = marks.get(id);
        if (!mark) return;
        const next = { ...mark, thread: [...mark.thread ?? [], { from: "writer", text, at: Date.now() }] };
        sheet.put(next);
        void ask({ kind: "reply", mark: next, text });
      }
    })
  });
  sized.observe(root);
  const held = /* @__PURE__ */ new Set();
  let lullText = null;
  const sheet = {
    text: surface.read,
    marks: () => [...marks.values()],
    put(mark) {
      if (!mark.quote && lullText !== null && surface.read() !== lullText) return;
      const fresh = !marks.has(mark.id);
      marks.set(mark.id, mark);
      if (fresh && mark.quote) admit(mark.id);
      marksChanged();
      save();
      flush();
    },
    drop(id) {
      if (!marks.delete(id)) return;
      held.delete(id);
      if (active === id) activate(null);
      marksChanged();
      save();
      flush();
    }
  };
  const desk = openDesk(sheet, options.voices);
  const link = options.agent?.(desk);
  function admit(id) {
    if (!energy.canShow()) return void held.add(id);
    energy.show();
    drawEnergy();
    requestAnimationFrame(() => announce(id));
  }
  function release() {
    let shown = false;
    while (held.size && energy.canShow()) {
      const id = [...held].at(-1);
      held.delete(id);
      energy.show();
      shown = true;
      requestAnimationFrame(() => announce(id));
    }
    if (shown) marksChanged();
    return shown;
  }
  function marksChanged() {
    const shown = sheet.marks().filter((m) => !held.has(m.id));
    anchors.set(shown);
    notes.sync(shown);
    drawFoot();
  }
  function announce(id) {
    if (!narrow) return;
    heldUntil = Date.now() + 8e3;
    activate(id);
  }
  function activate(id) {
    if (active === id) return;
    active = id;
    anchors.activate(id);
    notes.activate(id);
  }
  let asking = 0;
  let flash = "";
  let whisperId = "";
  function drawFoot() {
    const whisper = sheet.marks().find((m) => !m.quote);
    whisperId = whisper?.id ?? "";
    if (flash) {
      const f = el("tm-flash");
      f.textContent = flash;
      f.onclick = () => (flash = "", drawFoot());
      foot.replaceChildren(f);
    } else if (whisper) {
      const w = el("tm-whisper", Object.assign(document.createElement("b"), { textContent: whisper.voice }), new Text(whisper.note));
      w.style.setProperty("--tm-h", String(whisper.hue));
      if (foot.firstElementChild?.textContent !== w.textContent) foot.replaceChildren(w);
    } else if (asking) {
      if (!foot.querySelector(".tm-busy")) foot.replaceChildren(el("tm-busy", ...[0, 1, 2].map(() => document.createElement("i"))));
    } else foot.replaceChildren();
  }
  let lastLevel = 0;
  function drawEnergy() {
    const level = energy.level();
    const fill = bar.firstElementChild;
    if (level > lastLevel) {
      fill.style.width = "100%";
      bar.classList.remove("tm-pulse");
      void bar.offsetWidth;
      bar.classList.add("tm-pulse");
      setTimeout(() => fill.style.width = `${Math.round(energy.progress() * 100)}%`, 200);
    } else fill.style.width = `${Math.round(energy.progress() * 100)}%`;
    lastLevel = level;
  }
  async function ask(a) {
    if (!link) return;
    flush();
    asking++;
    flash = "";
    drawFoot();
    try {
      await link.ask(a);
    } catch (error) {
      flash = error instanceof Error ? error.message : String(error);
    } finally {
      asking--;
      drawFoot();
    }
  }
  let saveTimer = 0;
  function save() {
    if (!loaded) return;
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flush, SAVE_AFTER);
  }
  function flush() {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = 0;
    store.save({
      // Lazy: a store that binds the text itself never pays for joining it.
      get text() {
        return surface.read();
      },
      marks: sheet.marks()
    }).catch((error) => {
      flash = `Not saved: ${error instanceof Error ? error.message : error}`;
      drawFoot();
    });
  }
  const onHide = () => document.visibilityState === "hidden" && flush();
  document.addEventListener("visibilitychange", onHide);
  addEventListener("pagehide", flush);
  let lullTimer = 0;
  surface.onChange(({ typed }) => {
    if (marks.size) notes.layout();
    if (!typed) return;
    save();
    if (marks.size && !surface.read().trim()) {
      marks.clear();
      held.clear();
      activate(null);
      energy.restore(0, 0);
      marksChanged();
      flush();
    }
    energy.earn(typed.weight);
    if (whisperId && marks.has(whisperId)) sheet.drop(whisperId);
    lullText = null;
    release();
    drawEnergy();
    if (typed.sentenceEnd) lookAhead();
    clearTimeout(lullTimer);
    if (pace.lull !== false && link) {
      lullTimer = window.setTimeout(() => {
        const text = surface.read();
        if (text.trim().length < LULL_MIN) return;
        lullText = text;
        void ask({ kind: "lull" });
      }, pace.lull);
    }
  });
  function lookAhead() {
    if (asking || !energy.shouldAsk(held.size) || !surface.read().trim()) return;
    energy.asked();
    void ask({ kind: "glance", want: pace.batch }).then(() => {
      if (release() || !held.size) lookAhead();
    });
  }
  const onSelect = () => {
    const s = getSelection();
    if (!s?.focusNode || notes.holds(s.focusNode)) return;
    if (Date.now() < heldUntil) return;
    let p = s.focusNode;
    while (p && p.parentNode !== surface.element) p = p.parentNode;
    activate(p && s.isCollapsed ? anchors.under(p, offsetIn(p, s.focusNode, s.focusOffset)) : null);
  };
  document.addEventListener("selectionchange", onSelect);
  scroll.addEventListener("mousedown", (e) => {
    if (surface.element.contains(e.target) || notes.holds(e.target) || surface.element.contentEditable !== "true") return;
    e.preventDefault();
    surface.element.focus();
    getSelection()?.selectAllChildren(surface.element);
    getSelection()?.collapseToEnd();
  });
  const glance = (focus) => void ask({ kind: "glance", focus: focus?.trim() || void 0 });
  surface.element.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      glance(getSelection()?.toString());
    }
  });
  function take(doc) {
    if (doc.text !== void 0 && doc.text !== surface.read()) surface.render(doc.text, surface.selection());
    if (doc.marks) {
      const arrived = loaded ? doc.marks.filter((m) => m.quote && !marks.has(m.id)) : [];
      marks.clear();
      for (const m of doc.marks) marks.set(m.id, m);
      for (const id of held) if (!marks.has(id)) held.delete(id);
      if (active && !marks.has(active)) activate(null);
      for (const m of arrived) admit(m.id);
      if (!loaded) energy.restore(weigh(surface.read()), doc.marks.filter((m) => m.quote).length);
      marksChanged();
      drawEnergy();
    }
  }
  surface.element.contentEditable = "false";
  let unwatch;
  const ready = store.load().then(
    (doc) => {
      if (doc) take(doc);
      loaded = true;
      surface.element.contentEditable = "true";
      unwatch = store.watch?.(take);
    },
    (error) => {
      flash = `Could not open the page: ${error instanceof Error ? error.message : error}`;
      drawFoot();
      throw error;
    }
  );
  return {
    text: surface,
    desk,
    glance,
    ready,
    destroy() {
      flush();
      unwatch?.();
      link?.close?.();
      clearTimeout(lullTimer);
      sized.disconnect();
      dark.removeEventListener("change", applyTheme);
      document.removeEventListener("visibilitychange", onHide);
      document.removeEventListener("selectionchange", onSelect);
      removeEventListener("pagehide", flush);
      anchors.destroy();
      surface.destroy();
      root.remove();
    }
  };
}

// hosts/gugu/main.ts
var ctx = await gugu.getContext();
var zh = String(ctx.locale ?? "").startsWith("zh");
var say = (en, cn) => zh ? cn : en;
try {
  const PAGE = "page.tam.json";
  if (!ctx.file && !ctx.chat) throw new Error(say("Open type and memory in a chat.", "\u8BF7\u5728\u4E00\u4E2A\u804A\u5929\u91CC\u6253\u5F00 type and memory\u3002") + " " + JSON.stringify({ ...ctx, capabilities: void 0 }).slice(0, 600));
  const entry = ctx.file ?? (await gugu.files.list({ chat: ctx.chat.id, folder: "" })).find((e) => e.name === PAGE) ?? await gugu.files.create({ chat: ctx.chat.id, name: PAGE }, {});
  const f = await gugu.files.open(entry);
  const chat = f.entry.chat;
  if (f.data.v === void 0) {
    f.transact(() => {
      f.data.v = 1;
      f.data.text = gugu.text("");
      f.data.marks = {};
    });
  }
  const marksNow = () => Object.values(f.toJSON().marks ?? {});
  let seen = JSON.stringify(marksNow());
  let heard = null;
  const store = {
    load: async () => ({ marks: marksNow() }),
    async save(doc) {
      const stored = f.toJSON().marks ?? {};
      const next = new Map(doc.marks.map((m) => [m.id, m]));
      f.transact(() => {
        for (const id of Object.keys(stored)) if (!next.has(id)) delete f.data.marks[id];
        for (const [id, m] of next) if (JSON.stringify(stored[id]) !== JSON.stringify(m)) f.data.marks[id] = m;
      });
      seen = JSON.stringify(marksNow());
    },
    watch: (onChange) => f.onChange(() => {
      const marks = marksNow();
      const now = JSON.stringify(marks);
      if (now === seen) return;
      seen = now;
      onChange({ marks });
      heard?.();
    })
  };
  const agentsHere = async () => (await gugu.chats.members({ chat })).members.filter((m) => m.kind === "agent").map((m) => m.id);
  const pill = { refs: [{ file: f.entry }] };
  const WAIT = 12e4;
  async function reader() {
    const here = await agentsHere();
    if (!here.length) throw new Error(say("There is no agent in this chat to read along.", "\u8FD9\u4E2A\u804A\u5929\u91CC\u8FD8\u6CA1\u6709 agent \u53EF\u4EE5\u8BFB\u8FD9\u9875\u7EB8\u3002"));
    return here.includes(f.data.reader) ? f.data.reader : here[0];
  }
  const agent = () => ({
    async ask(ask) {
      if (ask.kind === "lull") return;
      const to = ask.kind === "reply" && ask.mark.by ? ask.mark.by : await reader();
      const many = ask.kind === "glance" && (ask.want ?? 1) > 1;
      const text = ask.kind === "reply" ? say(`I answered your note on \u201C${ask.mark.quote}\u201D: ${ask.text}`, `\u6211\u5728\u4F60\u90A3\u6761\u5173\u4E8E\u300C${ask.mark.quote}\u300D\u7684\u6279\u6CE8\u4E0B\u56DE\u4E86\u8BDD\uFF1A${ask.text}`) : ask.focus ? say(`Have a look at my page, at \u201C${ask.focus}\u201D.`, `\u770B\u4E00\u773C\u6211\u8FD9\u9875\u7EB8\uFF0C\u5C24\u5176\u662F\u300C${ask.focus}\u300D\u3002`) : many ? say(`I wrote some more on my page. Have a look; this time up to ${ask.want} new notes, each on a phrase that has none yet.`, `\u6211\u5728\u8FD9\u9875\u7EB8\u4E0A\u53C8\u5199\u4E86\u4E00\u4E9B\uFF0C\u6765\u770B\u4E00\u773C\u3002\u8FD9\u4E00\u6B21\u6700\u591A\u65B0\u7559 ${ask.want} \u6761\u6279\u6CE8\uFF0C\u5404\u9489\u5728\u8FD8\u6CA1\u6709\u6279\u6CE8\u7684\u8BDD\u4E0A\u3002`) : say("I wrote some more on my page. Have a look.", "\u6211\u5728\u8FD9\u9875\u7EB8\u4E0A\u53C8\u5199\u4E86\u4E00\u4E9B\uFF0C\u6765\u770B\u4E00\u773C\u3002");
      const answered = new Promise((resolve) => {
        heard = resolve;
        setTimeout(resolve, WAIT);
      });
      await gugu.dispatch(text, { to: { chat, member: to }, ...pill });
      await answered;
    }
  });
  const page = mount(document.getElementById("page"), {
    store,
    agent,
    // The same energy as everywhere: a note costs 50. But a look here is a whole turn of a real agent, so the page
    // asks once per note's worth of writing instead of at every clause, takes up to three notes from one look and
    // shows them one by one as the writer earns them. No nudges at pauses: each would be a turn too.
    pace: { cost: 50, stride: 50, batch: 3, lull: false },
    placeholder: say("Write something\u2026", "\u5199\u70B9\u4EC0\u4E48\u2026"),
    theme: ctx.themeMode === "dark" ? "dark" : "light"
  });
  await page.ready;
  gugu.bind.text(page.text, f.textAt(["text"]));
  gugu.onCommand(async (id) => {
    if (id !== "glance") return;
    const here = await agentsHere();
    if (here.length > 1 && !getSelection()?.toString()) {
      const picked = await gugu.dispatch(say("Read along as I write on this page.", "\u6211\u5728\u8FD9\u9875\u7EB8\u4E0A\u5199\u4E1C\u897F\uFF0C\u8BF7\u4F60\u5728\u9875\u8FB9\u8BFB\u3002"), { ...pill, offer: ["agent-in-chat"] });
      if (picked.cancelled) return;
      f.data.reader = picked.to.member;
      return;
    }
    page.glance(getSelection()?.toString());
  });
} catch (error) {
  gugu.reportError(error instanceof Error ? error.message : String(error));
  throw error;
}
