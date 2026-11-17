import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applySet, blockers, emptyBoard, encodeTicket, issueTicket, prepareSweep, LIST } from '../app/lib/core.js'
import { mutate } from '../app/lib/chat-board.js'
import { live } from './live.mjs'
const now = '2026-11-17T12:00:00.000Z'
const a = { id: 'user:a', kind: 'agent', session: 'session:a', model: 'model-a', name: 'Requester' }
const b = { id: 'user:b', kind: 'agent', session: 'session:b', model: 'model-b', name: 'Reviewer' }
const subject = `GUYI-AI/project@${'a'.repeat(40)}`
const source = ['https://example.com/change']
const create = (board, fields) => applySet(board, { title: '前提', check: '读回配置', source, ...fields }, a, now).item
const done = { evidence: '读到配置已启用；比对了 2 个 PR、1 个迁移、0 个新环境变量；没有漏项。', links: source }
const finishSweep = (board) => { const id = prepareSweep(board, subject, a, { id: b.id }, now); applySet(board, { item: id, done }, b, now); return id }
const issue = (board, at = now, who = a) => issueTicket(board, subject, who, at, { chat: 'group', id: 'file' })

test('complete release loop: refusal, evidence, independent sweep, ticket, immutable follow-up deadline', () => {
  const board = emptyBoard()
  const before = create(board)
  const after = create(board, { when: '后', title: '上线后核对' })
  const sweep = prepareSweep(board, subject, a, { id: b.id }, now)
  assert.equal(board.items[sweep].owner, b.id)
  assert.equal(issue(board).ok, false)
  assert.throws(() => applySet(board, { item: before, done: { evidence: '', links: source } }, a, now), /evidence/)
  assert.throws(() => applySet(board, { item: sweep, done }, a, now), /other than/)
  assert.throws(() => applySet(board, { item: sweep, drop: { reason: 'skip' } }, b, now), /cannot be dropped/)
  applySet(board, { item: before, done }, a, now)
  finishSweep(board)
  const result = issue(board)
  assert.equal(result.ok, true)
  assert.equal(result.payload.expiresAt, '2026-11-17T12:30:00.000Z')
  assert.equal(result.payload.after[0].due, '2026-11-18T12:00:00.000Z')
  assert.equal(result.payload.signature, undefined)
  const encoded = encodeTicket(result.payload)
  const decoded = JSON.parse(Buffer.from(encoded.slice(5), 'base64url').toString())
  assert.equal(decoded.list, LIST)
  assert.equal(JSON.stringify(decoded).includes(done.evidence), false, 'evidence stays in the chat')
  assert.equal(Object.keys(board.tickets).length, 1)
  assert.equal(issue(board, '2026-11-17T12:10:00.000Z').ok, true)
  assert.equal(board.items[after].due, '2026-11-18T12:00:00.000Z')
  assert.throws(() => applySet(board, { item: after, due: '2026-11-20T00:00:00Z' }, a, now), /original 24-hour/)
  assert.equal(issue(board, '2026-11-18T12:00:01.000Z').ok, false)
  applySet(board, { item: after, done }, a, '2026-11-18T12:00:02.000Z')
  assert.equal(issue(board, '2026-11-18T12:00:03.000Z').ok, true)
})
test('drop reasons, human answers and no self-review when requester changes', () => {
  const board = emptyBoard()
  const id = create(board)
  assert.throws(() => applySet(board, { item: id, drop: { reason: '' } }, a, now), /drop reason/)
  applySet(board, { item: id, ask: { question: '批准？', options: ['批准', '以后'] } }, a, now)
  assert.throws(() => applySet(board, { item: id, answer: '批准' }, a, now), /Only a person/)
  assert.throws(() => applySet(board, { item: id, done }, a, now), /question/)
  applySet(board, { item: id, answer: '批准' }, { id: 'user:human', kind: 'person' }, now)
  applySet(board, { item: id, drop: { reason: '本批明确接受，另行处理' } }, a, now)
  finishSweep(board)
  const result = issue(board)
  assert.equal(result.payload.dropped[0].reason, '本批明确接受，另行处理')
  assert.equal(issue(board, now, b).ok, false)
  prepareSweep(board, subject, b, { id: a.id }, now)
  const sw = Object.values(board.items).find((i) => i.sweep)
  assert.equal(sw.status, 'pending')
  assert.throws(() => applySet(board, { item: sw.id, done }, b, now), /other than/)
})
test('live-file operations keep unrelated fields, duplicate-source hints and independent item additions', () => {
  const target = emptyBoard()
  const file = { data: live(target), toJSON: () => JSON.parse(JSON.stringify(target)), transact: (fn) => fn() }
  const add = (fields) => mutate(file, (board) => applySet(board, { title: '要求', check: '读配置', source, ...fields }, a, now))
  const first = add({ owner: a.id }).item
  const second = add({ when: null })
  assert.deepEqual(second.sameSource, [first])
  assert.equal(Object.keys(target.items).length, 2)
  const before = JSON.stringify(target)
  assert.throws(() => mutate(file, (board) => applySet(board, { item: first, title: 'invalid partial', done: { evidence: '', links: [] } }, b, now)))
  assert.equal(JSON.stringify(target), before)
  assert.throws(() => mutate(file, (board) => applySet(board, { item: first, hold: true }, b, now)), /assigned/)
  mutate(file, (board) => applySet(board, { item: first, title: '改标题' }, a, now))
  assert.equal(target.items[first].owner, a.id)
  assert.equal(target.items[first].title, '改标题')
  assert.equal(blockers(target, now, subject).length, 1)
})
