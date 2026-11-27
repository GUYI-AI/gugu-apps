// The App's program: a small MCP server over stdio that gives gugu's agents the person's WeRead reading — what they are
// reading, their highlights and thoughts — and gives the App's own page the same data (tools only the page sees).
// The key lives in settings.json in this App's data folder (the page writes it); it is read again on every call, so a
// new key works at once.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import * as weread from './weread.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = join(process.env.GUGU_EXTENSION_DATA_DIR ?? here, weread.SETTINGS_FILE);
const VERSION = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8')).version;

const settings = () => {
  try { return weread.parseSettings(readFileSync(SETTINGS_PATH, 'utf8')); } catch { return {}; }
};

const BOOK_ARGS = {
  type: 'object',
  properties: {
    bookId: { type: 'string', description: 'WeRead bookId (from weread_notebooks / weread_reading).' },
    title: { type: 'string', description: 'Or the book title, or part of it.' },
  },
};
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const PAGE = { _meta: { ui: { visibility: ['app'] } } };

const TOOLS = [
  { name: 'weread_reading', description: 'What the person is reading in WeRead now: unfinished books, most recently read first, each with progress (%), the chapter they are in and time spent reading it in seconds (readingSeconds; null when WeRead does not report it).',
    inputSchema: { type: 'object', properties: { count: { type: 'integer', minimum: 1, maximum: 10, description: 'How many books (default 4).' } } },
    run: (s, a) => weread.reading(s, { count: a.count ?? 4 }) },
  { name: 'weread_recent_notes', description: 'The newest highlights (划线) and thoughts (想法) across the books noted most recently — use it for "the line I just marked" / "what I was reading". Each item has the highlighted text, the book, the chapter and the person\'s own thoughts on it.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 50, description: 'How many items (default 10).' } } },
    run: (s, a) => weread.recentNotes(s, { limit: a.limit ?? 10 }) },
  { name: 'weread_notebooks', description: 'Every book the person has notes in, newest note first: counts of highlights and thoughts, reading progress, finished or not.',
    inputSchema: { type: 'object', properties: {} },
    run: (s) => weread.notebooks(s) },
  { name: 'weread_book_notes', description: 'All highlights and thoughts in one book, grouped by chapter in reading order; a thought written on a highlight is under it; whole-book reviews separately. Use it to organise reading notes or discuss a book.',
    inputSchema: BOOK_ARGS,
    run: async (s, a) => weread.bookNotes(s, await weread.resolveBook(s, a)) },
  { name: 'weread_book_context', description: 'Everything WeRead can tell about one book, for understanding it before explaining a line or discussing it: intro, publisher, rating, table of contents (the current chapter marked), the person\'s own highlights and thoughts, the passages most readers highlighted, and a few public reviews. No book text.',
    inputSchema: BOOK_ARGS,
    run: async (s, a) => weread.bookContext(s, await weread.resolveBook(s, a)) },
  { name: 'weread_progress', description: 'Reading progress in one book: percent (0–100; 1 means 1%), the current chapter, last read. readingSeconds here is only the read-aloud time (null when none); time spent reading is in weread_reading or weread_api /readdata/detail.',
    inputSchema: BOOK_ARGS,
    run: async (s, a) => weread.progress(s, await weread.resolveBook(s, a)) },
  { name: 'weread_shelf', description: 'The person\'s WeRead shelf (e-books), most recently read first, with finished or not.',
    inputSchema: { type: 'object', properties: {} },
    run: (s) => weread.shelf(s) },
  { name: 'weread_api', description: 'Any other official WeRead Agent API call (popular highlights /book/bestbookmarks, reading stats /readdata/detail, search /store/search, recommendations /book/recommend, public reviews /review/list …). Send {"api_name":"/_list"} to list them all with their parameters. Parameters go flat in `params`.',
    inputSchema: { type: 'object', required: ['api_name'], properties: { api_name: { type: 'string' }, params: { type: 'object' } } },
    run: (s, a) => weread.call(s, a.api_name, a.params ?? {}) },
  // The page's own: what it draws, in one round each.
  { name: 'page_home', description: 'The App page: connection, what is being read, newest notes.', inputSchema: { type: 'object', properties: {} }, ...PAGE,
    run: async (s) => {
      const [nowReading, recent] = await Promise.all([weread.reading(s, { count: 4 }), weread.recentNotes(s, { limit: 5 })]);
      return { connected: true, reading: nowReading, recent };
    } },
  { name: 'page_book', description: 'The App page: one book\'s notes.', inputSchema: BOOK_ARGS, ...PAGE,
    run: async (s, a) => weread.bookNotes(s, await weread.resolveBook(s, a)) },
  { name: 'page_status', description: 'The App page: is a key set and does WeRead accept it.', inputSchema: { type: 'object', properties: {} }, ...PAGE,
    run: async (s) => {
      if (!s.key) return { connected: false, settingsPath: SETTINGS_PATH };
      await weread.call(s, '/user/notebooks', { count: 1 });
      return { connected: true, settingsPath: SETTINGS_PATH };
    } },
];

const INSTRUCTIONS = `The person's WeRead (微信读书) reading through WeRead's official API: weread_reading (what they read now), weread_recent_notes (the line they just marked), weread_book_notes (a book's highlights and thoughts), weread_book_context (the book itself: intro, contents, popular highlights, reviews — read it before explaining a line), weread_notebooks, weread_progress, weread_shelf, weread_api (anything else). No book text: discuss from the highlight, chapter and their thought. The key is set in the 微信读书 App page; its settings file is ${SETTINGS_PATH} ("key").`;

const send = (message) => process.stdout.write(JSON.stringify(message) + '\n');
const listed = TOOLS.map(({ run, ...tool }) => ({ annotations: READ_ONLY, ...tool }));

async function handle(message) {
  const { id, method, params } = message;
  if (id === undefined) return; // notifications
  if (method === 'initialize') {
    return send({ jsonrpc: '2.0', id, result: {
      protocolVersion: params?.protocolVersion ?? '2025-06-18',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'weread', version: VERSION },
      instructions: INSTRUCTIONS,
    } });
  }
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: listed } });
  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) return send({ jsonrpc: '2.0', id, error: { code: -32602, message: `no tool ${params?.name}` } });
    try {
      const value = await tool.run(settings(), params.arguments ?? {});
      const structured = Array.isArray(value) ? { items: value } : value;
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(structured) }], structuredContent: structured } });
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }], structuredContent: { error: text, code: error?.code ?? null }, isError: true } });
    }
  }
  send({ jsonrpc: '2.0', id, error: { code: -32601, message: `unknown method ${method}` } });
}

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  handle(message).catch((error) => message.id !== undefined && send({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: String(error?.message ?? error) } }));
});
process.stdin.on('end', () => process.exit(0));
