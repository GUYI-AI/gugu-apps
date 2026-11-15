import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { asCurrent, logOf, stateOf } from '../app/lib/core.js'
import { applyToFile } from '../app/lib/chat-board.js'
// 1.6.1 as it shipped (tools.js and lib/, copied unchanged): members of one chat can be on different versions.
import { filled as oldFilled } from './fixtures/kanban-1.6.1/lib/chat-board.js'
import { cardFlags, taskState } from './fixtures/kanban-1.6.1/lib/core.js'

// Made with 1.6.1's own applyOp: a custom column and a renamed one, a review card, pending, decided, withdrawn and
// superseded decisions of every scope (one on a card deleted later), all 7 link kinds with a synced PR, comments, an
// accepted and an open handoff, waits of each kind, progress / due / dest / head, a supervisor mark.
const v1 = JSON.parse(await readFile(new URL('./fixtures/v1-board.json', import.meta.url), 'utf8'))
const byTitle = (b, title) => Object.values(b.cards).find((c) => c.title === title)
const everything = (card) => [card.note, card.next, card.wait?.question, card.wait?.what, ...(card.wait?.options ?? []), ...logOf(card).map((l) => `${l.what} ${l.text ?? ''} ${l.by}`)].join('\n')

test('a 1.x board converts with no card, comment, link or decision lost', () => {
  const b = asCurrent(v1)
  assert.equal(b.version, 2)
  assert.equal(b.comments, undefined)
  assert.equal(b.decisions, undefined)
  assert.equal(b.fleet, undefined, 'supervisor marks are dropped')
  for (const id of Object.keys(v1.cards)) assert.ok(b.cards[id], `card ${id} kept`)
  const all = Object.values(b.cards).map(everything).join('\n')
  for (const c of Object.values(v1.comments)) assert.ok(all.includes(c.text), `comment "${c.text}"`)
  for (const d of Object.values(v1.decisions)) {
    assert.ok(all.includes(d.question), `decision "${d.question}"`)
    if (d.answer) assert.ok(all.includes(d.answer), `answer "${d.answer}"`)
  }
  for (const card of Object.values(v1.cards)) {
    for (const l of Object.values(card.links)) {
      const key = l.url ?? l.path ?? l.file ?? l.message ?? l.session
      assert.ok(all.includes(key) || Object.values(b.cards).some((c) => c.holder?.session === key), `${l.kind} link ${key}`)
    }
  }
})

test('each 1.x state lands where the design says', () => {
  const b = asCurrent(v1)
  const push = byTitle(b, 'sidebar push #2771')
  assert.deepEqual(push.holder, { session: 'sess-new-2', agent: 'user:00000000-0000-0000-0000-0000000000a1', name: 'push v2' })
  assert.ok(logOf(push).some((l) => l.what === 'held by' && l.text.includes('sess-old-1')), 'older task link is a log line')
  assert.equal(push.next, '4 arms on mac1')
  assert.match(push.note, /^progress: 60% · due: 16:30 · dest: → 18:00 Beta · head: abcdef1234567\n\nArms on mac1\./)
  assert.match(push.note, /\[PR #2771\]\(https:\/\/github\.com\/GUYI-AI\/gugu\/pull\/2771\) — CI green, review approved/)
  assert.match(push.note, /\[report\.html\]\(gugu-file:\/\/file-123\)/)
  assert.ok(logOf(push).some((l) => l.what === 'said' && l.text === 'arm 3 flaky' && l.by === 'user:00000000-0000-0000-0000-0000000000b2'))
  const review = byTitle(b, 'phone task-file open #2798')
  assert.deepEqual([review.wait.on, review.wait.question, review.wait.options], ['owner', '验收？', ['通过', '打回']])
  const colour = byTitle(b, 'colour PR2 #2189')
  assert.equal(colour.wait.question, '边框对比度定 3:1 吗？', 'a pending decision wins over waitKind owner')
  assert.ok(logOf(colour).some((l) => l.what === 'column' && l.text === '本周'), 'custom column title kept')
  assert.ok(logOf(colour).some((l) => l.what === 'answered' && l.text === 'Ship in beta? → yes'))
  assert.equal(byTitle(b, 'prompt v2 #2187').wait.question, '要不要先合？')
  const scroll = byTitle(b, 'scroll pull #2714')
  assert.deepEqual([scroll.wait.on, scroll.wait.what], ['other', 'P4 receipt · lane · session:p4'])
  const notes = byTitle(b, 'release notes')
  assert.equal(stateOf(notes), 'done')
  assert.ok(logOf(notes).some((l) => l.what === 'took' && l.text.includes('sess-rn2')), 'accepted handoff is a log line')
  const record = byTitle(b, '决策记录（1.x）')
  assert.equal(stateOf(record), 'done')
  for (const q of ['Lanes report only on done/blocked?', 'gpu: heavy builds only in cx slots?', 'Ship 18:00 beta with #2771?', 'old rule', 'new rule', 'about a deleted card']) assert.ok(record.note.includes(q), q)
  assert.match(record.note, /\[machine gpu\]/)
  assert.ok(logOf(record).some((l) => l.text?.includes('comment on deleted card')))
})

test('reading a 1.x chat board writes nothing; the first 2.0 write converts the file in one change', () => {
  const data = JSON.parse(JSON.stringify(v1))
  let transactions = 0
  const f = { get data() { return data }, toJSON: () => JSON.parse(JSON.stringify(data)), transact: (fn) => { transactions++; fn() } }
  asCurrent(f.toJSON())
  assert.equal(data.version, 1)
  assert.equal(transactions, 0)
  const id = Object.keys(v1.cards)[0]
  applyToFile(f, { type: 'set', card: id, log: 'hello from 2.0' }, 'user:me', {}, 'Me')
  assert.equal(transactions, 1)
  assert.equal(data.version, 2)
  assert.equal(data.comments, undefined)
  assert.ok(data.columns.todo)
  assert.equal(logOf(data.cards[id]).at(-1).text, 'hello from 2.0')
})

// ── 1.6.1 on a 2.0 board ─────────────────────────────────────────────────────

let dir
let old
let board
const files = new Map()
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kanban-161-'))
  process.env.GUGU_EXTENSION_DATA_DIR = dir
  board = asCurrent(v1)
  files.set('f1', { entry: { id: 'f1', chat: 'chat-1', name: '协作看板.board.json', path: '协作看板.board.json' }, data: board })
  globalThis.gugu = {
    files: {
      async list({ chat }) { return [...files.values()].filter((f) => f.entry.chat === chat).map((f) => ({ ...f.entry, type: 'json' })) },
      async open(ref) {
        const file = files.get(ref.id)
        return { entry: file.entry, data: file.data, saved: true, transact: (fn) => fn(), toJSON: () => JSON.parse(JSON.stringify(file.data)), onStatus: () => () => {}, close() {} }
      },
    },
  }
  old = await import('./fixtures/kanban-1.6.1/tools.js')
})
after(() => rm(dir, { recursive: true, force: true }))

test("1.6.1's page and tools open a 2.0 chat board without losing a card", async () => {
  const cards = JSON.stringify(board.cards)
  // The page's only write on opening: filled(). It must leave a 2.0 file alone.
  oldFilled({ data: board, transact: (fn) => fn() })
  assert.equal(JSON.stringify(board.cards), cards)
  assert.equal(board.version, 2)
  // What its page draws for each card does not throw on a 2.0 card.
  for (const card of Object.values(board.cards)) cardFlags(board, card, () => taskState(null), Date.now())
  const AGENT = { agent: 'user:00000000-0000-0000-0000-0000000000c3', session: 'sess-old-client' }
  const list = await old.list.run({ chat: 'chat-1' }, AGENT)
  assert.ok(Array.isArray(list.columns))
  // A 1.6.1 agent adding a card: it lands as a 1.x card, and 2.0 reads it as a card like any other.
  await old.create.run({ chat: 'chat-1', title: 'added by an old client' }, AGENT)
  assert.equal(JSON.stringify(Object.fromEntries(Object.entries(board.cards).filter(([id]) => JSON.parse(cards)[id]))), cards)
  const now = asCurrent(board)
  assert.ok(byTitle(now, 'added by an old client').log)
  assert.equal(Object.keys(now.cards).length, Object.keys(JSON.parse(cards)).length + 1)
})
