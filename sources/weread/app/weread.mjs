// WeRead's official Agent API (the 「微信读书 Skill」, github.com/Tencent/WeChatReading): one POST gateway, the person's own
// key (wrk-…, from 我 › 设置 › 微信读书 Skill or weread.qq.com/r/weread-skills). Field meanings follow that repository's
// skills/*.md; this file only reads and reshapes them into what a reader and an agent need.

export const GATEWAY = 'https://i.weread.qq.com/api/agent/gateway';
export const SKILL_VERSION = '1.0.6';
export const KEY_PAGE = 'https://weread.qq.com/r/weread-skills';
export const SETTINGS_FILE = 'settings.json';

export function parseSettings(text) {
  if (!text) return {};
  try { return JSON.parse(text) ?? {}; } catch { return {}; }
}

export class WereadError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

/** One gateway call: business parameters flat beside api_name (the docs' rule), errcode ≠ 0 is an error. */
export async function call(settings, apiName, params = {}) {
  const key = typeof settings.key === 'string' ? settings.key.trim() : '';
  if (!key) throw new WereadError('还没连上微信读书：在微信读书 App 的页面里贴上 API Key（wrk- 开头）。', 'no_key');
  const response = await fetch(settings.gateway_url || GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_name: apiName, ...params, skill_version: SKILL_VERSION }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new WereadError(`微信读书返回了看不懂的内容（HTTP ${response.status}）`, 'bad_body'); }
  const errcode = body?.errcode ?? body?.errCode ?? 0;
  if (!response.ok || errcode) {
    const said = body?.errmsg ?? body?.errMsg ?? body?.message ?? `HTTP ${response.status}`;
    const auth = response.status === 401 || errcode === -2012 || errcode === -2010;
    throw new WereadError(auth ? `微信读书不认这个 API Key（${said}）：重新获取一个贴上` : `微信读书：${said}（${errcode || response.status}）`, auth ? 'auth' : 'api');
  }
  // Some answers wrap their fields in `data`; the documented ones are flat. Either way the caller sees the fields.
  return body.data && typeof body.data === 'object' && !Array.isArray(body.data) && !('books' in body) ? { ...body.data } : body;
}

const iso = (seconds) => (Number(seconds) > 0 ? new Date(Number(seconds) * 1000).toISOString() : null);
const rangeStart = (range) => Number(String(range ?? '').split('-')[0]) || 0;

function bookOf(raw = {}) {
  const b = raw.book ?? raw;
  return {
    bookId: String(raw.bookId ?? b.bookId ?? ''),
    title: b.title ?? '',
    author: b.author ?? '',
    cover: b.cover ?? null,
    readerLink: raw.readerLink ?? b.readerLink ?? null,
  };
}

/** The shelf, most recently read first (books only; audiobooks are albums and have no highlights). */
export async function shelf(settings) {
  const answer = await call(settings, '/shelf/sync');
  return (answer.books ?? [])
    .map((b) => ({ ...bookOf(b), category: b.category ?? null, lastRead: iso(b.readUpdateTime), finished: b.finishReading === 1 }))
    .sort((a, b) => String(b.lastRead ?? '').localeCompare(String(a.lastRead ?? '')));
}

/** Every book with notes, newest note first. `noteCount` is highlights, `reviewCount` thoughts and reviews (notes.md). */
export async function notebooks(settings, { limit = Infinity } = {}) {
  const books = [];
  let lastSort;
  for (let page = 0; page < 30 && books.length < limit; page++) {
    const answer = await call(settings, '/user/notebooks', { count: 50, ...(lastSort ? { lastSort } : {}) });
    const rows = answer.books ?? [];
    for (const row of rows) {
      books.push({
        ...bookOf(row),
        highlights: row.noteCount ?? 0,
        thoughts: row.reviewCount ?? 0,
        bookmarks: row.bookmarkCount ?? 0,
        progress: row.readingProgress ?? null,
        finished: row.markedStatus === 1,
        lastNote: iso(row.sort),
      });
    }
    if (answer.hasMore !== 1 || rows.length === 0) break;
    lastSort = rows.at(-1).sort;
  }
  return books.slice(0, limit);
}

async function allReviews(settings, bookId) {
  const reviews = [];
  let synckey = 0;
  for (let page = 0; page < 20; page++) {
    const answer = await call(settings, '/review/list/mine', { bookid: bookId, synckey, count: 50 });
    reviews.push(...(answer.reviews ?? []).map((r) => r.review ?? r));
    if (answer.hasMore !== 1 || !answer.synckey || answer.synckey === synckey) break;
    synckey = answer.synckey;
  }
  return reviews;
}

/**
 * One book's highlights and thoughts, in reading order and grouped by chapter: a thought written on a highlight hangs
 * under it (same range, or its `abstract` is the highlight's text); chapter and whole-book reviews stand on their own.
 */
export async function bookNotes(settings, bookId) {
  const [marks, reviews] = await Promise.all([call(settings, '/book/bookmarklist', { bookId }), allReviews(settings, bookId)]);
  const chapters = new Map();
  const chapter = (uid, idx, title) => {
    const key = String(uid ?? idx ?? 'book');
    if (!chapters.has(key)) chapters.set(key, { chapterUid: uid ?? null, idx: idx ?? null, title: title ?? '', items: [] });
    const c = chapters.get(key);
    if (!c.title && title) c.title = title;
    if (c.idx == null && idx != null) c.idx = idx;
    return c;
  };
  for (const c of marks.chapters ?? []) chapter(c.chapterUid, c.chapterIdx, c.title);
  const highlights = [];
  for (const m of marks.updated ?? []) {
    const item = { kind: 'highlight', id: String(m.bookmarkId ?? ''), text: m.markText ?? '', range: m.range ?? null, at: iso(m.createTime), thoughts: [] };
    highlights.push(item);
    chapter(m.chapterUid).items.push(item);
  }
  const bookReviews = [];
  for (const r of reviews) {
    const thought = { text: r.content ?? '', at: iso(r.createTime) };
    const on = highlights.find((h) => (r.range && h.range === r.range) || (r.abstract && h.text === r.abstract));
    if (on) { on.thoughts.push(thought); continue; }
    if (r.abstract || r.chapterUid != null || r.chapterName) {
      chapter(r.chapterUid, r.chapterIdx, r.chapterName).items.push({ kind: r.abstract ? 'highlight' : 'chapter_review', id: String(r.reviewId ?? ''), text: r.abstract ?? '', range: r.range ?? null, at: thought.at, thoughts: [thought] });
    } else {
      bookReviews.push({ ...thought, star: r.star ?? -1 });
    }
  }
  const ordered = [...chapters.values()]
    .filter((c) => c.items.length)
    .sort((a, b) => (a.idx ?? 1e9) - (b.idx ?? 1e9));
  for (const c of ordered) c.items.sort((a, b) => rangeStart(a.range) - rangeStart(b.range));
  return { book: bookOf(marks.book ?? { bookId }), chapters: ordered, bookReviews };
}

/** Where the person is in a book: percent, the chapter they are in (named from the table of contents), time spent. */
export async function progress(settings, bookId) {
  const [answer, toc] = await Promise.all([
    call(settings, '/book/getprogress', { bookId }),
    call(settings, '/book/chapterinfo', { bookId }).catch(() => null),
  ]);
  const p = answer.book ?? {};
  const ch = (toc?.chapters ?? []).find((c) => c.chapterUid === p.chapterUid);
  return {
    bookId,
    progress: p.progress ?? 0,
    chapter: ch ? { idx: ch.chapterIdx, title: ch.title } : null,
    readingSeconds: p.recordReadingTime ?? 0,
    lastRead: iso(p.updateTime),
    finished: p.progress === 100 && Boolean(p.finishTime),
  };
}

/** The newest highlights and thoughts across the books noted most recently: "the line I just marked". */
export async function recentNotes(settings, { limit = 10, books = 3 } = {}) {
  const recent = await notebooks(settings, { limit: books });
  const perBook = await Promise.all(recent.map((b) => bookNotes(settings, b.bookId).then((notes) => ({ b, notes }))));
  const items = [];
  for (const { b, notes } of perBook) {
    for (const c of notes.chapters) {
      for (const item of c.items) {
        const at = [item.at, ...item.thoughts.map((t) => t.at)].filter(Boolean).sort().at(-1) ?? null;
        items.push({ ...item, at, book: { bookId: b.bookId, title: b.title, author: b.author }, chapter: c.title });
      }
    }
  }
  return items.sort((x, y) => String(y.at ?? '').localeCompare(String(x.at ?? ''))).slice(0, limit);
}

/** What is being read: unfinished books, most recently read first, each with its chapter and progress. */
export async function reading(settings, { count = 4 } = {}) {
  const books = (await shelf(settings)).filter((b) => !b.finished).slice(0, count);
  return Promise.all(books.map((b) => progress(settings, b.bookId)
    .then((p) => ({ ...b, ...p, lastRead: p.lastRead ?? b.lastRead }))
    .catch(() => ({ ...b, progress: null, chapter: null }))));
}

/** A book named by id or by (part of) its title, looked up among books with notes, then the shelf. */
export async function resolveBook(settings, { bookId, title } = {}) {
  if (bookId) return String(bookId);
  const name = String(title ?? '').replace(/[《》\s]/g, '');
  if (!name) throw new WereadError('要给 bookId 或书名（title）', 'args');
  const pools = [() => notebooks(settings), () => shelf(settings)];
  for (const pool of pools) {
    const hit = (await pool()).find((b) => b.title.replace(/\s/g, '').includes(name));
    if (hit) return hit.bookId;
  }
  throw new WereadError(`书架和笔记里没找到《${name}》`, 'not_found');
}
