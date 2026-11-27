// A stand-in for WeRead's Agent API gateway, answering in the shapes Tencent/WeChatReading's skills/*.md document.
// Used by the tests, and by hand (`node test/fake-gateway.mjs 8787`) to see the page without a real key: point
// settings.json's "gateway_url" at it. Texts are written for this fixture, not taken from the books.
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

export const KEY = 'wrk-fixture';
const now = () => Math.floor(Date.now() / 1000);
const min = 60;

const BOOKS = [
  { bookId: '3300001', title: '思考，快与慢', author: '丹尼尔·卡尼曼', category: '心理', read: 4 * min, progress: 37, chapterUid: 13, seconds: 9 * 3600 + 25 * min, finished: 0 },
  { bookId: '3300002', title: '深入理解计算机系统', author: 'Randal E. Bryant 等', category: '计算机', read: 30 * min, progress: 22, chapterUid: 92, seconds: 14 * 3600, finished: 0 },
  { bookId: '3300003', title: '置身事内', author: '兰小欢', category: '经济', read: 20 * 3600, progress: 64, chapterUid: 5, seconds: 6 * 3600 + 40 * min, finished: 0 },
  { bookId: '3300004', title: '人类简史', author: '尤瓦尔·赫拉利', category: '历史', read: 3 * 86400, progress: 12, chapterUid: 3, seconds: 2 * 3600, finished: 0 },
  { bookId: '3300005', title: '三体', author: '刘慈欣', category: '科幻', read: 40 * 86400, progress: 100, chapterUid: 36, seconds: 21 * 3600, finished: 1 },
];

const CHAPTERS = {
  3300001: [[1, 1, '第 1 章 一个故事中的两个角色'], [2, 2, '第 2 章 注意力和努力'], [13, 11, '第 11 章 锚定效应'], [14, 12, '第 12 章 可得性的科学']],
  3300002: [[90, 9, '9.1 物理和虚拟寻址'], [92, 11, '9.3 虚拟内存作为缓存的工具'], [93, 12, '9.4 虚拟内存作为内存管理的工具']],
  3300003: [[4, 4, '第 4 章 招商引资'], [5, 5, '第 5 章 债务与风险']],
  3300004: [[3, 3, '第 3 章 亚当和夏娃的一天']],
  3300005: [[36, 36, '第 36 章']],
};

// [bookId, chapterUid, range, text, age in seconds, thought or null]
const MARKS = [
  ['3300001', 13, '2210-2266', '先看到的一个数字，会把之后的估计悄悄拉向它，哪怕那个数字明显是随手给的。', 3 * min, '谈薪的时候是不是也这样？谁先报价谁占便宜？'],
  ['3300001', 13, '2402-2440', '从锚点往外调整，人们总是在还没走远时就停下了。', 9 * min, null],
  ['3300001', 1, '310-352', '系统 1 快速、自动、几乎不费力；系统 2 缓慢、需要专注，负责复杂的计算。', 2 * 86400, null],
  ['3300001', 2, '980-1031', '我们以为自己在用系统 2 做决定，很多时候只是在替系统 1 的结论找理由。', 2 * 86400 - 600, '这条想多读几遍'],
  ['3300002', 92, '5120-5190', '虚拟内存把磁盘上的页缓存在主存里，页表记录每个虚拟页此刻在哪里。', 28 * min, null],
  ['3300002', 92, '5301-5366', '缺页时由内核选一个牺牲页换出，再把需要的页读进来，然后重新执行那条指令。', 26 * min, '为什么是重新执行而不是接着执行？'],
  ['3300002', 90, '4400-4452', 'CPU 生成的是虚拟地址，地址翻译由 MMU 查页表完成。', 1 * 86400, null],
  ['3300003', 5, '8800-8861', '很多地方投资不是靠税收，而是用土地作抵押撬动的融资。', 20 * 3600, '和美国的市政债比有什么不同？'],
  ['3300003', 4, '6120-6170', '招商引资的竞争，本质上是地方政府在土地和税收上的竞价。', 22 * 3600, null],
  ['3300004', 3, '1500-1544', '狩猎采集者的一天，可能比后来的农民更轻松。', 3 * 86400, null],
];

const notebookRows = () => BOOKS.filter((b) => MARKS.some((m) => m[0] === b.bookId))
  .map((b) => {
    const marks = MARKS.filter((m) => m[0] === b.bookId);
    return {
      bookId: b.bookId,
      book: { bookId: b.bookId, title: b.title, author: b.author, cover: '' },
      reviewCount: marks.filter((m) => m[5]).length + (b.bookId === '3300001' ? 1 : 0),
      noteCount: marks.length,
      bookmarkCount: 1,
      readingProgress: b.progress,
      markedStatus: b.finished,
      sort: now() - Math.min(...marks.map((m) => m[4])),
    };
  })
  .sort((a, b) => b.sort - a.sort);

function answer(api, body) {
  const book = BOOKS.find((b) => b.bookId === String(body.bookId ?? body.bookid ?? ''));
  switch (api) {
    case '/shelf/sync':
      return { books: BOOKS.map((b) => ({ bookId: b.bookId, title: b.title, author: b.author, cover: '', category: b.category,
        readUpdateTime: now() - b.read, finishReading: b.finished, readerLink: `https://weread.qq.com/web/reader/${b.bookId}` })), albums: [], bookCount: BOOKS.length };
    case '/user/notebooks': {
      const rows = notebookRows();
      const start = body.lastSort ? rows.findIndex((r) => r.sort < body.lastSort) : 0;
      const page = start < 0 ? [] : rows.slice(start, start + (body.count ?? 20));
      return { totalBookCount: rows.length, totalNoteCount: rows.reduce((n, r) => n + r.noteCount + r.reviewCount + r.bookmarkCount, 0),
        hasMore: start >= 0 && start + page.length < rows.length ? 1 : 0, books: page };
    }
    case '/book/bookmarklist':
      if (!book) return { errcode: -2003, errmsg: '书籍不存在' };
      return { book: { bookId: book.bookId, title: book.title, author: book.author },
        chapters: CHAPTERS[book.bookId].map(([chapterUid, chapterIdx, title]) => ({ chapterUid, chapterIdx, title })),
        updated: MARKS.filter((m) => m[0] === book.bookId).map((m, i) => ({ bookmarkId: `${book.bookId}_${i}`, bookId: book.bookId, chapterUid: m[1], markText: m[3], createTime: now() - m[4], type: 1, range: m[2], colorStyle: 1 })) };
    case '/review/list/mine': {
      if (!book) return { errcode: -2003, errmsg: '书籍不存在' };
      const reviews = MARKS.filter((m) => m[0] === book.bookId && m[5]).map((m, i) => {
        const [uid, idx, name] = CHAPTERS[book.bookId].find((c) => c[0] === m[1]);
        return { review: { reviewId: `r${book.bookId}_${i}`, content: m[5], abstract: m[3], range: m[2], chapterUid: uid, chapterIdx: idx, chapterName: name, createTime: now() - m[4] + 30, star: -1 } };
      });
      if (book.bookId === '3300001') reviews.push({ review: { reviewId: 'r-book', content: '把「直觉」和「推理」分开看，是这本书最有用的一点。', createTime: now() - 86400, star: 5 } });
      return { reviews, totalCount: reviews.length, hasMore: 0, synckey: 1 };
    }
    case '/book/getprogress':
      if (!book) return { errcode: -2003, errmsg: '书籍不存在' };
      return { bookId: book.bookId, book: { chapterUid: book.chapterUid, chapterOffset: 1200, progress: book.progress, updateTime: now() - book.read,
        recordReadingTime: book.seconds, isStartReading: 1, ...(book.finished ? { finishTime: now() - book.read } : {}) }, timestamp: now() };
    case '/book/chapterinfo':
      if (!book) return { errcode: -2003, errmsg: '书籍不存在' };
      return { bookId: book.bookId, chapters: CHAPTERS[book.bookId].map(([chapterUid, chapterIdx, title]) => ({ chapterUid, chapterIdx, title, level: 1 })) };
    case '/_list':
      return { apis: ['/shelf/sync', '/user/notebooks', '/book/bookmarklist', '/review/list/mine', '/book/getprogress', '/book/chapterinfo'] };
    default:
      return { errcode: -1, errmsg: `fixture has no ${api}` };
  }
}

/** Starts the fake gateway; resolves to { url, calls, close }. */
export function startFakeGateway(port = 0) {
  const calls = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const body = JSON.parse(raw || '{}');
      calls.push(body);
      res.setHeader('Content-Type', 'application/json');
      if (req.headers.authorization !== `Bearer ${KEY}`) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ errcode: -2012, errmsg: '登录超时' }));
      }
      res.end(JSON.stringify(answer(body.api_name, body)));
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}/api/agent/gateway`, calls, close: () => new Promise((r) => server.close(r)),
  })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startFakeGateway(Number(process.argv[2] ?? 8787));
  console.log(`fake WeRead gateway on ${url} (key ${KEY})`);
}
