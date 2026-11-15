import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyOp, emptyBoard, boardText, cardText, findCard, stateOf, checksOf, logOf, groups } from '../app/lib/core.js'

const LANE = { agent: 'user:00000000-0000-0000-0000-00000000000a', session: 'sess-lane-1', name: 'scroll-pull' }
const SUP = { agent: 'user:00000000-0000-0000-0000-00000000000b', session: 'sess-sup-1', name: 'supervisor' }
let clock = Date.parse('2026-11-15T06:00:00Z')
const tick = () => new Date(clock += 60_000).toISOString()
const as = (caller) => ({ by: caller.agent, now: tick(), caller })

test('one set makes a card held by the caller with next, a wait and three checks, and logs each part', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'scroll pull #2714', hold: true, next: 'archive after receipt', wait: 'P4 receipt', check: { 'PR merged': '#2785', 'slot cleared': true, 'P4 receipt': false } }, as(LANE))
  const c = b.cards[card]
  assert.equal(card.length, 4)
  assert.deepEqual(c.holder, { session: LANE.session, agent: LANE.agent, name: 'scroll-pull' })
  assert.equal(stateOf(c), 'waiting')
  assert.deepEqual(checksOf(c).map((x) => [x.label, x.done, x.note ?? '']), [['PR merged', true, '#2785'], ['slot cleared', true, ''], ['P4 receipt', false, '']])
  assert.deepEqual(logOf(c).map((l) => l.what), ['created', 'took', 'waits', 'ticked', 'ticked', 'added check'])
  assert.ok(logOf(c).every((l) => l.by === LANE.agent && l.name === 'scroll-pull'))
  const text = cardText(b, c, { caller: LANE })
  for (const part of ['holder: you', 'waits on', 'P4 receipt', 'next: archive after receipt', '[x] PR merged — #2785', '[ ] P4 receipt', 'took it']) assert.match(text, new RegExp(part.replace(/[[\]]/g, '\\$&')))
})

test('done is refused while a check is open or a question is pending, naming what; then it succeeds', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'x', hold: true, check: { 'PR merged': false } }, as(LANE))
  applyOp(b, { type: 'set', card, ask: { question: 'merge?', options: ['yes', 'no'] } }, as(LANE))
  assert.throws(() => applyOp(b, { type: 'set', card, done: true }, as(LANE)), /open checks: PR merged; a question to the owner is pending: merge\?/)
  assert.equal(b.cards[card].doneAt, null)
  applyOp(b, { type: 'set', card, ask: null }, as(LANE))
  assert.throws(() => applyOp(b, { type: 'set', card, done: true }, as(LANE)), /open checks: PR merged$/)
  applyOp(b, { type: 'set', card, check: { 'PR merged': '#1' }, done: true }, as(LANE))
  assert.equal(stateOf(b.cards[card]), 'done')
  applyOp(b, { type: 'set', card, done: false }, as(LANE))
  assert.equal(stateOf(b.cards[card]), 'progress')
})

test('a refused set writes nothing at all', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'x', check: { a: false } }, as(LANE))
  const before = JSON.stringify(b)
  assert.throws(() => applyOp(b, { type: 'set', card, next: 'new next', check: { a: true }, ask: { question: 'q', options: ['1', '2', '3', '4', '5', '6', '7'] } }, as(LANE)), /at most 6/)
  assert.equal(JSON.stringify(b), before)
})

test('only the page answers: the asker cannot, an agent caller cannot; the answer clears the wait and is logged', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'x', hold: true, ask: { question: 'CI green, merge?', options: ['合', '先别合'] } }, as(LANE))
  assert.throws(() => applyOp(b, { type: 'answer', card, answer: '合' }, as(LANE)), /answered by the owner/)
  assert.throws(() => applyOp(b, { type: 'answer', card, answer: '合' }, as(SUP)), /answered by the owner/)
  const r = applyOp(b, { type: 'answer', card, answer: '合' }, { by: 'user:owner', now: tick(), name: 'Owner' })
  assert.deepEqual(r, { card, question: 'CI green, merge?', answer: '合', asker: LANE.agent })
  assert.equal(b.cards[card].wait, null)
  assert.match(logOf(b.cards[card]).at(-1).text, /CI green, merge\? → 合/)
})

test('a supervisor records another session as holder; taking a held card logs whom it was taken from', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'lane' }, as(SUP))
  applyOp(b, { type: 'set', card, hold: 'session:sess-lane-1' }, as(SUP))
  assert.deepEqual(b.cards[card].holder, { session: 'sess-lane-1' })
  assert.match(logOf(b.cards[card]).at(-1).text, /session:sess-lane-1/)
  applyOp(b, { type: 'set', card, hold: true }, as({ ...LANE, session: 'sess-lane-2', name: 'new lane' }))
  const last = logOf(b.cards[card]).at(-1)
  assert.equal(last.what, 'took')
  assert.match(last.text, /from session:sess-lan/)
  applyOp(b, { type: 'set', card, hold: false }, as(SUP))
  assert.equal(stateOf(b.cards[card]), 'unclaimed')
})

test('checks: add open, tick with a note, untick, remove; wait set and cleared', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'x' }, as(LANE))
  applyOp(b, { type: 'set', card, check: { a: false, b: false } }, as(LANE))
  applyOp(b, { type: 'set', card, check: { a: 'done it', b: null } }, as(LANE))
  assert.deepEqual(checksOf(b.cards[card]).map((c) => [c.label, c.done, c.note]), [['a', true, 'done it']])
  applyOp(b, { type: 'set', card, check: { a: false } }, as(LANE))
  assert.equal(checksOf(b.cards[card])[0].done, false)
  assert.throws(() => applyOp(b, { type: 'set', card, check: { zzz: null } }, as(LANE)), /no check "zzz"/)
  applyOp(b, { type: 'set', card, wait: 'quota' }, as(LANE))
  assert.equal(b.cards[card].wait.what, 'quota')
  applyOp(b, { type: 'set', card, wait: '' }, as(LANE))
  assert.equal(b.cards[card].wait, null)
  assert.throws(() => applyOp(b, { type: 'set', card }, as(LANE)), /nothing to change/)
})

test('cards are found by a unique id prefix', () => {
  const b = emptyBoard()
  b.cards.abcd1234 = { id: 'abcd1234', title: 'a', log: {} }
  b.cards.abce9999 = { id: 'abce9999', title: 'b', log: {} }
  assert.equal(findCard(b, 'abcd').id, 'abcd1234')
  assert.throws(() => findCard(b, 'abc'), /ambiguous/)
  assert.throws(() => findCard(b, 'zz'), /no card zz/)
})

test('the board text for 15 open cards with real titles is under 4,000 characters, in page order, done only counted', () => {
  const b = emptyBoard()
  const titles = ['#2798 phone task-file open', 'colour PR2 #2189 border contrast', 'sidebar push #2771', 'restart duplicates images', 'promo s11 online',
    'session address error copy', 'scroll pull #2714', 'prompt v2 #2187', 'gateway cache probe all routes', 'widget apps e2e on devdb', 'fe-perf rig read receipts',
    '西游 0.7.0 diff gate', 'beta queue 313dab8c rerun', 'restart-session lane after merge #2288', 'jianghu real-client gif']
  titles.forEach((title, i) => {
    const caller = { agent: `user:00000000-0000-0000-0000-0000000000${String(i).padStart(2, '0')}`, session: `sess-${i}-abcdef`, name: `lane-${i}` }
    const { card } = applyOp(b, { type: 'create', title, hold: i % 5 !== 4, next: 'reproduce on mac1 with four arms, then report', check: { 'PR merged': false, 'gpu slot cleared': i % 2 === 0, 'P4 receipt': false } }, as(caller))
    if (i < 2) applyOp(b, { type: 'set', card, ask: { question: 'CI green, merge it now?', options: ['合', '先别合'] } }, as(caller))
    else if (i < 5) applyOp(b, { type: 'set', card, wait: 'P4 receipt for both tickets' }, as(caller))
  })
  for (let i = 0; i < 42; i++) b.cards[`d${i}`] = { id: `d${i}`, title: `old ${i}`, holder: null, wait: null, next: '', checks: {}, note: '', log: {}, doneAt: '2026-11-01T00:00:00Z' }
  const text = boardText(b, { name: 'work' })
  assert.ok(text.length < 4000, `${text.length} characters`)
  assert.match(text, /^work · 2 wait on owner · 8 in progress · 3 waiting · 2 unclaimed · 42 done/)
  const order = ["WAIT ON OWNER", "IN PROGRESS", "WAITING", "UNCLAIMED", "LOG"].map((s) => text.indexOf(s))
  assert.deepEqual(order, [...order].sort((x, y) => x - y))
  assert.ok(!text.includes('old 1'))
  for (const title of titles) assert.ok(text.includes(title), title)
})

test('stopped cards sort first in progress', () => {
  const b = emptyBoard()
  const a = applyOp(b, { type: 'create', title: 'a', hold: true }, as(LANE)).card
  const c = applyOp(b, { type: 'create', title: 'c', hold: true }, as(SUP)).card
  assert.deepEqual(groups(b).progress.map((x) => x.id), [c, a])
  assert.deepEqual(groups(b, (x) => x.id === a).progress.map((x) => x.id), [a, c])
})

test('wait over an owner question logs it withdrawn; ask on a done card is refused until reopened', () => {
  const b = emptyBoard()
  const { card } = applyOp(b, { type: 'create', title: 'x', hold: true, ask: { question: 'merge?' } }, as(LANE))
  applyOp(b, { type: 'set', card, wait: 'CI' }, as(LANE))
  assert.deepEqual(logOf(b.cards[card]).slice(-2).map((l) => [l.what, l.text]), [['withdrew', 'merge?'], ['waits', 'CI']])
  applyOp(b, { type: 'set', card, wait: '', done: true }, as(LANE))
  assert.throws(() => applyOp(b, { type: 'set', card, ask: { question: 'again?' } }, as(LANE)), /is done: reopen it/)
  applyOp(b, { type: 'set', card, done: false, ask: { question: 'again?' } }, as(LANE))
  assert.equal(stateOf(b.cards[card]), 'owner')
})
