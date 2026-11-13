// src/core/types.ts
var DeskError = class extends Error {
};

// src/core/text.ts
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

// hosts/gugu/tools.ts
var PAGE = { type: "string", format: "gugu-file", description: "The page: the id in the gugu-file:// pill of the whisper that woke you." };
async function deskOf(page, { agent }) {
  if (!agent) throw new Error("These tools are for agents: gugu did not say which agent is calling.");
  const f = await gugu.files.open({ id: page });
  if (f.data?.v !== 1) throw new Error(`${f.entry?.name ?? page} is not a type and memory page.`);
  const { members } = await gugu.chats.members({ chat: f.entry.chat });
  const me = members.find((m) => m.id === agent);
  if (!me) throw new Error("You are not a member of the chat this page is in.");
  const desk = openDesk(
    {
      text: () => String(f.data.text ?? ""),
      marks: () => Object.values(f.toJSON().marks ?? {}),
      put: (mark) => f.data.marks[mark.id] = { ...mark, by: mark.by ?? agent },
      drop: (id) => delete f.data.marks[id]
    },
    // The caller speaks under its own name; `as` lets it speak as a persona instead.
    [{ id: agent, name: me.name, hue: hueOf(agent) }]
  );
  return { desk, saved: () => whenSaved(f) };
}
function whenSaved(f) {
  if (f.saved) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => (off(), reject(new Error("The page was not saved within 10 s; check the chat is reachable and call again."))), 1e4);
    const off = f.onStatus(() => {
      if (f.status === "gone") clearTimeout(timer), off(), reject(new Error("The page file is gone."));
      else if (f.saved) clearTimeout(timer), off(), resolve();
    });
  });
}
var read = {
  description: "Read a type and memory page: what the writer has written and the notes already in its margin.",
  inputSchema: { type: "object", required: ["page"], properties: { page: PAGE } },
  async run({ page }, call) {
    const { desk } = await deskOf(page, call);
    const { text, marks } = desk.read();
    return {
      text,
      notes: marks.map((m) => ({ id: m.id, voice: m.voice, quote: m.quote || null, note: m.note, thread: m.thread ?? [] }))
    };
  }
};
var annotate = {
  description: "Leave a note in the margin of a type and memory page (one call per note), pinned to a short phrase quoted exactly from it. Without a quote it is a whisper under the last line, for a writer who is stuck.",
  inputSchema: {
    type: "object",
    required: ["page", "note"],
    properties: {
      page: PAGE,
      quote: { type: "string", description: "A few words copied character for character from one line of the page." },
      note: { type: "string", description: "One or two sentences, spoken to the writer, in the language of the page." },
      as: { type: "string", description: "A persona to speak as, instead of your own name." }
    }
  },
  async run({ page, quote, note, as }, call) {
    const { desk, saved } = await deskOf(page, call);
    const mark = desk.annotate({ quote, note, as });
    await saved();
    return mark.quote ? `Noted on "${mark.quote}" (note ${mark.id}).` : `Whispered (note ${mark.id}).`;
  }
};
var reply = {
  description: "Answer the writer under a note of a type and memory page, when they replied to it.",
  inputSchema: {
    type: "object",
    required: ["page", "mark", "text"],
    properties: {
      page: PAGE,
      mark: { type: "string", description: "The note id, from read." },
      text: { type: "string", description: "One to three sentences, in the language of the page." }
    }
  },
  async run({ page, mark, text }, call) {
    const { desk, saved } = await deskOf(page, call);
    desk.reply({ mark, text });
    await saved();
    return "Answered.";
  }
};
export {
  annotate,
  read,
  reply
};
