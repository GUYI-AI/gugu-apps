import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import readline from 'node:readline';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { KEY, startFakeGateway } from './fake-gateway.mjs';

const SERVER = fileURLToPath(new URL('../app/server.mjs', import.meta.url));
let gateway;
let dataDir;
let program;
let nextId = 0;
const waiting = new Map();

const setKey = (settings) => writeFileSync(join(dataDir, 'settings.json'), JSON.stringify(settings));
const rpc = (method, params) => new Promise((resolve) => {
  const id = ++nextId;
  waiting.set(id, resolve);
  program.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
});
const tool = async (name, args = {}) => (await rpc('tools/call', { name, arguments: args })).result;

before(async () => {
  gateway = await startFakeGateway();
  dataDir = mkdtempSync(join(tmpdir(), 'weread-app-'));
  program = spawn(process.execPath, [SERVER], { env: { ...process.env, GUGU_EXTENSION_DATA_DIR: dataDir }, stdio: ['pipe', 'pipe', 'inherit'] });
  readline.createInterface({ input: program.stdout }).on('line', (line) => {
    const message = JSON.parse(line);
    waiting.get(message.id)?.(message);
    waiting.delete(message.id);
  });
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } });
  assert.equal(init.result.serverInfo.name, 'weread');
  assert.match(init.result.instructions, /weread_recent_notes/);
});

after(async () => {
  program.kill();
  await gateway.close();
  rmSync(dataDir, { recursive: true, force: true });
});

test('agents get the reading tools; the page tools are marked for the page only', async () => {
  const { tools } = (await rpc('tools/list', {})).result;
  const names = tools.map((t) => t.name);
  for (const name of ['weread_reading', 'weread_recent_notes', 'weread_notebooks', 'weread_book_notes', 'weread_progress', 'weread_shelf', 'weread_api']) {
    assert.ok(names.includes(name), name);
  }
  for (const name of ['page_home', 'page_book', 'page_status']) {
    assert.deepEqual(tools.find((t) => t.name === name)._meta.ui.visibility, ['app']);
  }
  assert.ok(tools.every((t) => t.annotations.readOnlyHint));
});

test('without a key every tool says how to connect', async () => {
  setKey({});
  const result = await tool('weread_reading');
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /API Key/);
  assert.deepEqual((await tool('page_status')).structuredContent.connected, false);
});

test('a key WeRead refuses is said as such', async () => {
  setKey({ key: 'wrk-wrong', gateway_url: gateway.url });
  const result = await tool('page_status');
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.code, 'auth');
});

test('recent notes: newest first across books, with the person\'s thought on the highlight', async () => {
  setKey({ key: KEY, gateway_url: gateway.url });
  const { items } = (await tool('weread_recent_notes', { limit: 4 })).structuredContent;
  assert.equal(items.length, 4);
  assert.equal(items[0].book.title, '思考，快与慢');
  assert.equal(items[0].chapter, '第 11 章 锚定效应');
  assert.match(items[0].thoughts[0].text, /谈薪/);
  const times = items.map((i) => i.at);
  assert.deepEqual([...times].sort().reverse(), times);
});

test('a book by title: chapters in reading order, thoughts under their highlights, the book review apart', async () => {
  const notes = (await tool('weread_book_notes', { title: '《思考，快与慢》' })).structuredContent;
  assert.equal(notes.book.title, '思考，快与慢');
  assert.deepEqual(notes.chapters.map((c) => c.idx), [1, 2, 11]);
  const anchoring = notes.chapters.at(-1);
  assert.deepEqual(anchoring.items.map((i) => i.range), ['2210-2266', '2402-2440']);
  assert.equal(anchoring.items[0].thoughts.length, 1);
  assert.equal(anchoring.items[1].thoughts.length, 0);
  assert.equal(notes.bookReviews.length, 1);
  assert.equal(notes.bookReviews[0].star, 5);
});

test('reading: unfinished books, most recent first, with the chapter named from the table of contents', async () => {
  const { items } = (await tool('weread_reading')).structuredContent;
  assert.deepEqual(items.map((b) => b.title), ['思考，快与慢', '深入理解计算机系统', '置身事内', '人类简史']);
  assert.equal(items[0].progress, 37);
  assert.equal(items[0].chapter.title, '第 11 章 锚定效应');
  assert.ok(items[0].readingSeconds > 0);
});

test('page_home is the page\'s one round; notebooks and progress answer too', async () => {
  const home = (await tool('page_home')).structuredContent;
  assert.equal(home.connected, true);
  assert.equal(home.reading[0].title, '思考，快与慢');
  assert.ok(home.recent.length > 0);
  const { items } = (await tool('weread_notebooks')).structuredContent;
  assert.equal(items.length, 4);
  assert.equal((await tool('weread_progress', { title: '三体' })).structuredContent.finished, true);
  assert.equal((await tool('weread_book_notes', { title: '不存在的书' })).isError, true);
});

test('every gateway call carries skill_version with its parameters flat, as the official docs require', async () => {
  await tool('weread_api', { api_name: '/_list' });
  assert.ok(gateway.calls.length > 5);
  for (const body of gateway.calls) {
    assert.equal(body.skill_version, '1.0.6');
    assert.equal(body.params, undefined);
  }
  assert.ok(gateway.calls.some((b) => b.api_name === '/review/list/mine' && b.bookid));
});
