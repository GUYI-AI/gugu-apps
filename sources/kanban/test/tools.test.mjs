import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile, writeFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { live } from './live.mjs'

// A chat's files as gugu.files gives a program: list, open (a JSON file's live data), create, remove. Writes land at
// once here (saved stays true).
const chatFiles = new Map() // id -> { entry, data }
export const fakeFiles = {
  async open(ref) {
    const file = chatFiles.get(ref.id)
    if (!file) throw Object.assign(new Error('not found'), { code: 'not-found' })
    return { entry: file.entry, get data() { return live(file.data) }, saved: true, status: 'online', transact: (fn) => fn(), toJSON: () => JSON.parse(JSON.stringify(file.data)), onStatus: () => () => {}, close() {} }
  },
  async remove(entry) { chatFiles.delete(entry.id) },
  async list({ chat }) { return [...chatFiles.values()].filter((f) => f.entry.chat === chat).map((f) => ({ ...f.entry, type: 'json' })) },
  async create({ chat, name }, content) {
    const entry = { id: `f${chatFiles.size + 1}`, chat, name, path: name }
    chatFiles.set(entry.id, { entry, data: JSON.parse(JSON.stringify(content)) })
    return entry
  },
}

let dir
let tools
const LANE = { agent: 'user:00000000-0000-0000-0000-00000000000a', session: 'sess-lane-1', agentName: 'scroll-pull' }
const SUP = { agent: 'user:00000000-0000-0000-0000-00000000000b', session: 'sess-sup-1', agentName: 'supervisor' }
const CHAT = 'chat-1'

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kanban-test-'))
  process.env.GUGU_EXTENSION_DATA_DIR = dir
  globalThis.gugu = { files: fakeFiles }
  tools = await import('../app/tools.js')
})
after(() => rm(dir, { recursive: true, force: true }))
beforeEach(async () => {
  chatFiles.clear()
  await rm(path.join(dir, 'board.json'), { force: true })
})

const idOf = (answer) => /added card (\w+)/.exec(answer)[1]

test('the manifest declares exactly two agent tools, and its instructions fit the client', async () => {
  const manifest = JSON.parse(await readFile(new URL('../app/manifest.json', import.meta.url)))
  const forAgents = Object.entries(tools).filter(([, t]) => t._meta?.ui?.visibility?.includes('model')).map(([name]) => name)
  assert.deepEqual(forAgents.sort(), ['board', 'set'])
  assert.deepEqual(Object.keys(tools).sort(), ['board', 'local', 'set'])
  assert.deepEqual(tools.local._meta.ui.visibility, ['app'])
  assert.ok(manifest.contributes.instructions.length <= 160, `${manifest.contributes.instructions.length} characters`)
  assert.match(manifest.version, /^2\./)
})

test('reading a chat with no board returns an empty board and makes no file', async () => {
  const text = await tools.board.run({ chat: CHAT }, LANE)
  assert.match(text, /0 wait on owner · 0 in progress · 0 waiting · 0 unclaimed · 0 done/)
  assert.equal(chatFiles.size, 0)
})

test("reading this computer's board where no page ever ran makes no file; set works there too", async () => {
  assert.match(await tools.board.run({}, LANE), /this computer · 0 wait on owner/)
  assert.deepEqual((await readdir(dir)).filter((f) => f === 'board.json'), [])
  const id = idOf(await tools.set.run({ title: 'local card', hold: true }, LANE))
  assert.match(await tools.board.run({}, LANE), new RegExp(`${id}  local card \\| you`))
  assert.equal(JSON.parse(await readFile(path.join(dir, 'board.json'), 'utf8')).version, 2)
})

test('one set on a chat board makes the file and a full card; board with card returns all of it', async () => {
  const id = idOf(await tools.set.run({ chat: CHAT, title: 'scroll pull #2714', hold: true, next: 'archive', wait: 'P4 receipt', check: { 'PR merged': '#2785', 'slot cleared': true, 'P4 receipt': false } }, LANE))
  assert.equal(chatFiles.size, 1)
  const file = [...chatFiles.values()][0]
  assert.equal(file.entry.name, '协作看板.board.json')
  assert.equal(file.data.version, 2)
  assert.ok(file.data.columns.todo && file.data.columns.done, 'keeps the inert columns 1.x needs')
  const text = await tools.board.run({ chat: CHAT, card: id.slice(0, 3) }, SUP)
  for (const part of ['holder: scroll-pull', 'waits on', 'P4 receipt', 'next: archive', '[x] PR merged — #2785', '[x] slot cleared', '[ ] P4 receipt', 'scroll-pull: took it', 'scroll-pull: added check: P4 receipt']) assert.ok(text.includes(part), part)
})

test('no tool answers a question: set has no answer, refuses unknown fields, and local refuses agents', async () => {
  const id = idOf(await tools.set.run({ chat: CHAT, title: 'merge?', hold: true, ask: { question: 'CI green, merge?', options: ['合', '先别合'] } }, LANE))
  assert.ok(!('answer' in tools.set.inputSchema.properties))
  await assert.rejects(tools.set.run({ chat: CHAT, card: id, answer: '合' }, SUP), /nothing to change/)
  await assert.rejects(tools.local.run({ op: { type: 'answer', card: id, answer: '合' } }, SUP), /changed by agents with set/)
  await assert.rejects(tools.set.run({ chat: CHAT, card: id, done: true }, LANE), /question to the owner is pending/)
  assert.match(await tools.board.run({ chat: CHAT }, LANE), /WAIT ON OWNER\n\w+ {2}merge\? \| you \| asks: CI green, merge\? \[合 \/ 先别合\]/)
})

test('a supervisor sets another session as holder; the lane taking it logs whom from', async () => {
  const id = idOf(await tools.set.run({ chat: CHAT, title: 'lane card' }, SUP))
  await tools.set.run({ chat: CHAT, card: id, hold: 'session:sess-old-lane' }, SUP)
  await tools.set.run({ chat: CHAT, card: id, hold: true }, LANE)
  const text = await tools.board.run({ chat: CHAT, card: id }, SUP)
  assert.match(text, /you: held by: session:sess-old-lane/)
  assert.match(text, /scroll-pull: took it: from session:sess-old/)
})

test('set without an agent is refused', async () => {
  await assert.rejects(tools.set.run({ chat: CHAT, title: 'x' }, {}), /for agents/)
})

test("this computer's 1.x board reads as 2.0 and stays version 1 until a write", async () => {
  const v1 = await readFile(new URL('./fixtures/v1-board.json', import.meta.url), 'utf8')
  await writeFile(path.join(dir, 'board.json'), v1)
  const text = await tools.board.run({}, LANE)
  assert.match(text, /sidebar push #2771/)
  assert.equal(JSON.parse(await readFile(path.join(dir, 'board.json'), 'utf8')).version, 1)
  await tools.set.run({ card: Object.keys(JSON.parse(v1).cards)[0], log: 'first 2.0 write' }, LANE)
  assert.equal(JSON.parse(await readFile(path.join(dir, 'board.json'), 'utf8')).version, 2)
})
