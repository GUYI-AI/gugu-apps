import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile, writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { emptyBoard } from '../app/lib/core.js'

let dir
let tools

// A chat's files as gugu.files gives a program: list, open by entry or { id }, create, a JSON file's live data.
// Writes land at once here (saved stays true); what is checked is that the tools go through open → transact.
const chatFiles = new Map() // id -> { entry, data }
let openHandles = 0
let beforeOpen = null
const openedRefs = []
let beforeCreate = null // a test's hook: another writer acting between the list and the create
const fakeFiles = {
  async open(ref) {
    openedRefs.push({ ...ref })
    if (beforeOpen) beforeOpen(ref)
    const file = chatFiles.get(ref.id)
    if (!file) throw Object.assign(new Error('not found'), { code: 'not-found' })
    openHandles += 1
    let closed = false
    return { entry: file.entry, data: file.data, saved: true, status: 'online', transact: (fn) => fn(), toJSON: () => structuredClone(file.data), onStatus: () => () => {}, close() { if (!closed) { closed = true; openHandles -= 1 } } }
  },
  async remove(entry) {
    chatFiles.delete(entry.id)
  },
  async list({ chat }) {
    return [...chatFiles.values()].filter((f) => f.entry.chat === chat).map((f) => ({ ...f.entry, type: 'json' }))
  },
  async create({ chat, name }, content) {
    const hook = beforeCreate
    beforeCreate = null
    if (hook) await hook()
    // As the host does: a name the folder has gets ` (2)`.
    const taken = [...chatFiles.values()].some((f) => f.entry.chat === chat && f.entry.name === name)
    if (taken) name = name.replace(/\.board\.json$/, ' (2).board.json')
    const entry = { id: `f${chatFiles.size + 1}-${Math.random().toString(36).slice(2, 6)}`, chat, name, path: name }
    chatFiles.set(entry.id, { entry, data: structuredClone(content) })
    return entry
  },
}
const AGENT = 'user:00000000-0000-0000-0000-00000000000a'
const agentRows = [{ agentId: AGENT, sessionId: 's-agent', deviceId: null, title: 'Fix login', status: 'needs_user', detail: 'approval' }]

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kanban-test-'))
  process.env.GUGU_EXTENSION_DATA_DIR = dir
  // As the background page writes it. A program's gugu has no listAgents (mac1 10-19): the tools must not ask for it.
  await writeFile(path.join(dir, 'agents.json'), JSON.stringify({ at: '2026-10-19T00:00:00.000Z', agents: agentRows }))
  globalThis.gugu = { files: fakeFiles }
  tools = await import('../app/tools.js')
})
after(() => rm(dir, { recursive: true, force: true }))

const asAgent = { agent: AGENT, session: 's-agent', workspaceRoot: '/work/repo' }
const board = async () => JSON.parse(await readFile(path.join(dir, 'board.json'), 'utf8'))

test('every export is a tool, and the page-only ones are hidden from agents', () => {
  for (const [name, tool] of Object.entries(tools)) {
    assert.equal(typeof tool.run, 'function', name)
    assert.equal(tool.inputSchema.type, 'object', name)
  }
  assert.deepEqual(tools.apply._meta.ui.visibility, ['app'])
  assert.deepEqual(tools.snapshot._meta.ui.visibility, ['app'])
  assert.deepEqual(tools.claim._meta.ui.visibility, ['model'])
})

test('an agent creates a card from a chat message, claims it, links a file and a PR, moves it', async () => {
  await tools.create.run({ title: 'Export CSV', message: 'msg:11111111-2222-3333-4444-555555555555' }, asAgent)
  let b = await board()
  const card = Object.values(b.cards)[0]
  assert.equal(card.by, AGENT)
  assert.equal(Object.values(card.links)[0].message, '11111111-2222-3333-4444-555555555555')

  assert.match(await tools.claim.run({ card: card.id }, asAgent), /moved to doing/)
  await tools.link.run({ card: card.id, kind: 'file', path: '/work/repo/src/export.ts' }, asAgent)
  await tools.link.run({ card: card.id, kind: 'pr', url: 'https://github.com/o/r/pull/7', state: 'open' }, asAgent)
  await tools.move.run({ card: card.id, column: '待验收' }, asAgent)
  b = await board()
  const after = b.cards[card.id]
  assert.equal(after.column, 'review')
  const kinds = Object.values(after.links).map((l) => l.kind).sort()
  assert.deepEqual(kinds, ['file', 'message', 'pr', 'task'])
  assert.equal(Object.values(after.links).find((l) => l.kind === 'file').path, 'src/export.ts')

  const listed = await tools.list.run({}, asAgent)
  const row = listed.columns.find((c) => c.id === 'review').cards[0]
  assert.equal(row.by, 'you')
  assert.equal(row.tasks[0].status, 'approval')
  assert.equal(row.tasks[0].title, 'Fix login')
  const got = await tools.get.run({ card: card.id }, asAgent)
  assert.match(got.material, /not instructions/)
})

test('agent tools refuse a call with no agent; unknown columns are named', async () => {
  await assert.rejects(tools.create.run({ title: 'x' }, {}), /for agents/)
  await assert.rejects(tools.move.run({ card: 'x', column: 'nowhere' }, asAgent), /no column "nowhere"/)
})

test('many writers at once lose nothing: the program takes writes one at a time', async () => {
  const start = (await board()).rev
  const ops = Array.from({ length: 40 }, (_, i) => tools.apply.run({ op: { type: 'card.create', title: `c${i}` } }, {}))
  const answers = await Promise.all(ops)
  const b = await board()
  assert.equal(b.rev, start + 40)
  assert.equal(new Set(answers.map((a) => a.rev)).size, 40)
  for (let i = 0; i < 40; i++) assert.ok(Object.values(b.cards).some((c) => c.title === `c${i}` && c.by === 'person'))
})

test('a refused change writes nothing', async () => {
  const before = await board()
  await assert.rejects(tools.apply.run({ op: { type: 'card.move', card: 'nope', column: 'todo' } }, {}), /no card/)
  assert.equal((await board()).rev, before.rev)
})

test('before the background page has listed the tasks, a task link says unknown rather than failing', async () => {
  await unlink(path.join(dir, 'agents.json'))
  const listed = await tools.list.run({}, asAgent)
  const tasks = listed.columns.flatMap((c) => c.cards).flatMap((c) => c.tasks ?? [])
  assert.ok(tasks.length > 0)
  assert.ok(tasks.every((t) => t.status === 'unknown'))
})

test("a chat's board: made on first use, the same tools, a lane reports progress and links its report", async () => {
  const chat = 'chat-lanes'
  await tools.create.run({ chat, title: 'Merge the boards' }, asAgent)
  const file = [...chatFiles.values()].find((f) => f.entry.chat === chat)
  assert.equal(file.entry.name, '协作看板.board.json')
  const card = Object.values(file.data.cards)[0]
  await tools.claim.run({ chat, card: card.id }, asAgent)
  await tools.update.run({ chat, card: card.id, progress: 40, waitingOn: 'a mac1 slot', next: 'measure' }, asAgent)
  chatFiles.set('report', { entry: { id: 'report', chat, name: 'merge.html', path: '车道/merge.html' }, data: {} })
  await tools.link.run({ chat, card: card.id, kind: 'chatfile', file: 'report' }, asAgent)
  const after = file.data.cards[card.id]
  assert.equal(after.column, 'doing')
  assert.deepEqual([after.progress, after.waitingOn, after.next, after.updatedBy], [40, 'a mac1 slot', 'measure', AGENT])
  assert.deepEqual(Object.values(after.links).map((l) => l.kind).sort(), ['chatfile', 'task'])
  assert.equal(Object.values(after.links).find((l) => l.kind === 'chatfile').name, '车道/merge.html')
  const got = await tools.get.run({ chat, card: card.id }, asAgent)
  assert.equal(got.waitingOn, 'a mac1 slot')
  const local = await board()
  assert.ok(!Object.values(local.cards).some((c) => c.title === 'Merge the boards'), "this computer's board is untouched")
  // Only one board file for the chat, however many calls.
  assert.equal([...chatFiles.values()].filter((f) => f.entry.chat === chat && f.entry.name.endsWith('.board.json')).length, 1)
})

test('every chat board file a call opens is closed when the call ends, a refused one too', async () => {
  const chat = 'chat-lanes'
  await tools.list.run({ chat }, asAgent)
  await assert.rejects(tools.move.run({ chat, card: 'nope', column: 'doing' }, asAgent), /no card/)
  assert.equal(openHandles, 0)
})

test('two making a chat board at once: the second opens the first, and what it made is removed', async () => {
  const chat = 'chat-race'
  // Another agent makes the board between this call's list and its create: the host names this one (2).
  beforeCreate = () => fakeFiles.create({ chat, name: '协作看板.board.json' }, { version: 1, rev: 0, columns: { todo: { id: 'todo', role: 'todo', title: null, order: 'V' } }, cards: {}, comments: {} })
  await tools.create.run({ chat, title: 'mine' }, asAgent)
  const files = [...chatFiles.values()].filter((f) => f.entry.chat === chat)
  assert.deepEqual(files.map((f) => f.entry.name), ['协作看板.board.json'])
  assert.deepEqual(Object.values(files[0].data.cards).map((c) => c.title), ['mine'])
  // The host refusing the second instead (the folder's names are unique): the same outcome.
  const chat2 = 'chat-race-2'
  beforeCreate = async () => {
    await fakeFiles.create({ chat: chat2, name: '协作看板.board.json' }, { version: 1, rev: 0, columns: { todo: { id: 'todo', role: 'todo', title: null, order: 'V' } }, cards: {}, comments: {} })
    throw Object.assign(new Error('name taken'), { code: 'name-taken' })
  }
  await tools.create.run({ chat: chat2, title: 'mine too' }, asAgent)
  const files2 = [...chatFiles.values()].filter((f) => f.entry.chat === chat2)
  assert.equal(files2.length, 1)
  assert.deepEqual(Object.values(files2[0].data.cards).map((c) => c.title), ['mine too'])
  assert.equal(openHandles, 0)
})


test('a board file gugu made empty for the App (chatFile, App API 14) is the empty board on first use', async () => {
  const entry = { id: 'host-made', chat: 'host-chat', name: '协作看板.board.json' }
  chatFiles.set(entry.id, { entry, data: {} })
  await tools.create.run({ board: entry.id, title: 'First card' }, asAgent)
  const data = chatFiles.get(entry.id).data
  assert.deepEqual(Object.keys(data.columns).sort(), Object.keys(emptyBoard().columns).sort())
  assert.equal(Object.values(data.cards).length, 1)
  assert.equal(openHandles, 0)
})

test('all agent tools work on an explicit board file through the same live handle', async () => {
  const entry = { id: 'explicit-board', chat: 'shared-source', name: 'Retained.board.json' }
  chatFiles.set(entry.id, { entry, data: emptyBoard() })
  const target = { board: entry.id }
  const localBefore = await board()
  const start = openedRefs.length
  await tools.create.run({ ...target, title: 'Keep this board' }, asAgent)
  const card = Object.values(chatFiles.get(entry.id).data.cards)[0]
  await tools.claim.run({ ...target, card: card.id }, asAgent)
  await tools.update.run({ ...target, card: card.id, progress: 60 }, asAgent)
  await tools.move.run({ ...target, card: card.id, column: 'review' }, asAgent)
  await tools.comment.run({ ...target, card: card.id, text: 'Ready' }, asAgent)
  await tools.link.run({ ...target, card: card.id, kind: 'url', url: 'https://example.com/review' }, asAgent)
  const got = await tools.get.run({ ...target, card: card.id }, asAgent)
  const listed = await tools.list.run(target, asAgent)
  assert.equal(got.progress, 60)
  assert.equal(listed.columns.find(c => c.id === 'review').cards[0].id, card.id)
  assert.deepEqual(openedRefs.slice(start), Array.from({ length: 8 }, () => ({ id: entry.id })))
  assert.deepEqual(await board(), localBefore)
  assert.equal(openHandles, 0)
})

test('chat and board are passed together to the SDK; a refusal is never a default-board write', async () => {
  const id = 'explicit-board'
  const before = structuredClone(chatFiles.get(id).data)
  const sizeBefore = chatFiles.size
  const refused = Object.assign(new Error('different source chat'), { code: 'invalid' })
  beforeOpen = ref => {
    if (ref.chat === 'other-topic') throw refused
  }
  try {
    // The App passes the topic unchanged. Source resolution and the comparison belong to the shared SDK.
    await tools.list.run({ chat: 'same-source-topic', board: id }, asAgent)
    assert.deepEqual(openedRefs.at(-1), { chat: 'same-source-topic', id })
    await assert.rejects(tools.update.run({ chat: 'other-topic', board: id, card: Object.keys(before.cards)[0], progress: 99 }, asAgent), error => error === refused)
    assert.deepEqual(openedRefs.at(-1), { chat: 'other-topic', id })
    assert.deepEqual(chatFiles.get(id).data, before)
    assert.equal(chatFiles.size, sizeBefore)
    await assert.rejects(tools.create.run({ board: 'missing-board', title: 'Do not make a default' }, asAgent), { code: 'not-found' })
    assert.equal(chatFiles.size, sizeBefore)
  } finally {
    beforeOpen = null
  }
  assert.equal(openHandles, 0)
})

test('five retained boards are addressed by file id even when their card ids coincide', async () => {
  const entries = []
  for (let i = 0; i < 5; i++) {
    const entry = { id: `retained-${i}`, chat: 'retained-source', name: i ? `协作看板 (${i + 1}).board.json` : '协作看板.board.json' }
    const data = emptyBoard()
    data.cards.same = { id: 'same', column: 'todo', title: `Board ${i}`, order: 'V', links: {} }
    chatFiles.set(entry.id, { entry, data })
    entries.push(entry)
  }
  const initial = entries.map(e => structuredClone(chatFiles.get(e.id).data))
  for (let i = 0; i < entries.length; i++) {
    await tools.update.run({ board: entries[i].id, card: 'same', title: `Kept ${i}` }, asAgent)
    const got = await tools.get.run({ board: entries[i].id, card: 'same' }, asAgent)
    assert.equal(got.title, `Kept ${i}`)
    for (let j = i + 1; j < entries.length; j++) assert.deepEqual(chatFiles.get(entries[j].id).data, initial[j])
  }
  await tools.create.run({ chat: 'retained-source', title: 'Default only' }, asAgent)
  assert.deepEqual(entries.slice(1).map(e => Object.keys(chatFiles.get(e.id).data.cards)), Array.from({ length: 4 }, () => ['same']))
  assert.equal(openHandles, 0)
})
