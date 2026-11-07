import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyBoard, applyOp, cardFlags, pendingAsk, prKey } from '../app/lib/core.js'
import { fleetOf, waitOf, archiveChecks, parentChoices, decisionsFor, cardLine } from '../app/lib/fleet.js'

let n = 0
const at = (iso = '2026-11-07T10:00:00.000Z') => ({ by: 'user:lane', now: iso, id: () => `id${++n}` })
const PR = 'https://github.com/acme/app/pull/42'

function laneBoard() {
  const board = emptyBoard()
  const { card } = applyOp(board, { type: 'card.create', title: 'Login page', column: 'doing', links: [{ kind: 'task', session: 's-login', agent: 'user:login' }] }, at())
  return { board, card }
}

test('lane fields: a wait has a kind, a start, and goes away whole', () => {
  const { board, card } = laneBoard()
  applyOp(board, { type: 'card.update', card, waitKind: 'ci', waitingOn: 'e2e 2/3', dest: '→ 18:00 Beta', head: 'A1C9E02' }, at('2026-11-07T10:05:00.000Z'))
  const c = board.cards[card]
  assert.deepEqual([c.waitKind, c.waitingOn, c.waitSince, c.dest, c.head], ['ci', 'e2e 2/3', '2026-11-07T10:05:00.000Z', '→ 18:00 Beta', 'a1c9e02'])
  // The same wait again keeps when it started; another kind starts again.
  applyOp(board, { type: 'card.update', card, waitingOn: 'e2e 3/3' }, at('2026-11-07T10:20:00.000Z'))
  assert.equal(c.waitSince, '2026-11-07T10:05:00.000Z')
  applyOp(board, { type: 'card.update', card, waitKind: 'merge' }, at('2026-11-07T10:30:00.000Z'))
  assert.equal(c.waitSince, '2026-11-07T10:30:00.000Z')
  applyOp(board, { type: 'card.update', card, waitingOn: '' }, at())
  assert.deepEqual([c.waitKind, c.waitingOn, c.waitSince], ['', '', null])
  assert.throws(() => applyOp(board, { type: 'card.update', card, waitKind: 'lunch' }, at()), /waitKind is one of/)
  assert.throws(() => applyOp(board, { type: 'card.update', card, head: 'main' }, at()), /commit sha/)
  // An unchanged field is not written again (a chat's card is live): an update of next touches only next.
  const before = { ...c }
  applyOp(board, { type: 'card.update', card, next: 'rebase' }, at('2026-11-07T12:00:00.000Z'))
  assert.deepEqual(Object.keys(c).filter((k) => c[k] !== before[k]).sort(), ['next', 'updatedAt'])
})

test('a pr sync writes onto every link to that pull request, and nothing else', () => {
  const { board, card } = laneBoard()
  applyOp(board, { type: 'link.add', card, link: { kind: 'pr', url: `${PR}/files` } }, at())
  assert.equal(prKey(`${PR}#x`), 'acme/app#42')
  const r = applyOp(board, { type: 'pr.sync', prs: [{ url: PR, ci: 'green', review: 'approved', head: 'abc1234', devReview: true, extra: 'ignored' }, { url: 'https://github.com/acme/app/pull/7', ci: 'red' }] }, at())
  assert.equal(r.matched, 1)
  const link = Object.values(board.cards[card].links).find((l) => l.kind === 'pr')
  assert.deepEqual([link.ci, link.review, link.head, link.devReview, link.extra, link.syncedAt], ['green', 'approved', 'abc1234', true, undefined, '2026-11-07T10:00:00.000Z'])
  assert.throws(() => applyOp(board, { type: 'pr.sync', prs: [{ url: PR, ci: 'yellow' }] }, at()), /ci is one of/)
  assert.throws(() => applyOp(board, { type: 'pr.sync', prs: [{ url: 'https://example.com' }] }, at()), /pull\/<n> url/)
})

test('decisions: a lane asks, the owner decides; superseded and withdrawn ones leave the ledger in force', () => {
  const { board, card } = laneBoard()
  const ask = applyOp(board, { type: 'decision.create', card, question: 'A or B?', options: ['A', 'B'] }, at())
  assert.equal(ask.n, 1)
  assert.equal(pendingAsk(board, card).id, ask.decision)
  assert.equal(cardFlags(board, board.cards[card], () => null, Date.now()).asks, true)
  assert.throws(() => applyOp(board, { type: 'decision.decide', decision: 'D-1', answer: '' }, at()), /needs its answer/)
  applyOp(board, { type: 'decision.decide', decision: 'D-1', answer: 'B' }, { ...at(), by: 'user:owner' })
  assert.equal(pendingAsk(board, card), null)
  assert.deepEqual([board.decisions[ask.decision].status, board.decisions[ask.decision].decidedBy], ['decided', 'user:owner'])
  assert.throws(() => applyOp(board, { type: 'decision.decide', decision: 'D-1', answer: 'A' }, at()), /decided already/)

  const old = applyOp(board, { type: 'decision.create', question: 'Heavy builds where?', answer: 'machine B', message: 'msg:00000000-0000-0000-0000-000000000001' }, at())
  const now = applyOp(board, { type: 'decision.create', question: 'Heavy builds where?', answer: 'machine E', supersedes: `D-${old.n}` }, at())
  assert.equal(board.decisions[old.decision].status, 'superseded')
  assert.equal(board.decisions[old.decision].supersededBy, now.decision)
  applyOp(board, { type: 'decision.create', question: 'Release notes in English?', answer: 'yes', scope: { kind: 'release', ref: '18:00 Beta' } }, at())
  applyOp(board, { type: 'decision.create', question: 'Machine B only builds', answer: 'yes', scope: { kind: 'machine', ref: 'Machine-B' } }, at())
  applyOp(board, { type: 'card.update', card, dest: '→ 18:00 Beta' }, at())
  const live = (q) => decisionsFor(board, q).map((d) => d.n)
  assert.deepEqual(live({ card, machine: 'machine-b' }), [1, 3, 4, 5])
  assert.deepEqual(live({ card: null, machine: 'machine-a' }), [3])
  assert.deepEqual(live({ card, machine: null, all: true }), [1, 2, 3, 4])
  applyOp(board, { type: 'decision.close', decision: now.decision, status: 'withdrawn' }, at())
  assert.deepEqual(live({ card: null }), [])
  assert.throws(() => applyOp(board, { type: 'decision.create', question: 'x', scope: { kind: 'machine' } }, at()), /names its machine/)
  assert.throws(() => applyOp(board, { type: 'decision.create', question: 'x', message: 'yesterday' }, at()), /message is a chat message id/)
})

test('a handoff is accepted only by the task it was offered to, and then links that task', () => {
  const { board, card } = laneBoard()
  applyOp(board, { type: 'handoff.offer', card, to: { session: 's-new', agent: 'user:new', title: 'Login page 2' } }, at())
  assert.throws(() => applyOp(board, { type: 'handoff.accept', card }, { ...at(), by: 'user:someone' }), /only the task/)
  applyOp(board, { type: 'handoff.accept', card }, { ...at('2026-11-07T11:00:00.000Z'), by: 'user:new' })
  assert.equal(board.cards[card].handoff.acceptedAt, '2026-11-07T11:00:00.000Z')
  assert.ok(Object.values(board.cards[card].links).some((l) => l.kind === 'task' && l.session === 's-new'))
  assert.throws(() => applyOp(board, { type: 'handoff.cancel', card }, at()), /accepted handoff stays/)
  assert.throws(() => applyOp(board, { type: 'handoff.offer', card, to: { session: 's-new', agent: 'user:new' } }, at()), /already on this card/)
})

// ── the fleet ────────────────────────────────────────────────────────────────

const agent = (id, device, parent = null, more = {}) => ({
  agentId: `user:${id}`, sessionId: `s-${id}`, deviceId: device, deviceLabel: device ? `Machine-${device}` : 'Machine-A',
  parentAgentId: parent ? `user:${parent}` : null, title: id, providerId: 'claude', status: 'working', detail: 'running',
  pendingPermissionCount: device ? null : 0, ...more,
})
const devices = [
  { deviceId: 'dA', label: 'Machine-A', online: true, thisMachine: true },
  { deviceId: 'B', label: 'Machine-B', online: true, thisMachine: false },
  { deviceId: 'F', label: 'Machine-F', online: false, thisMachine: false },
]

function fleetFixture() {
  const { board, card } = laneBoard()
  const agents = [
    agent('chief', null), agent('notes', null, 'chief', { status: 'idle', detail: 'done' }),
    agent('desk', 'B'), agent('login', 'B', 'desk', { providerId: 'codex' }), agent('child', 'B', 'login'),
    agent('stray', 'B', 'chief'), // moved under a supervisor on another machine
    agent('lonely', 'B'), // a root with nothing under it: neither supervisor nor lane
  ]
  return { board, card, report: { agents, devices, unreached: [] } }
}

test('the fleet: a column per machine, its supervisor, the lanes under it as a tree', () => {
  const { board, report } = fleetFixture()
  const fleet = fleetOf(report, board)
  assert.deepEqual(fleet.machines.map((m) => [m.label, m.online, m.supervisor?.agent.title ?? null]), [
    ['Machine-A', true, 'chief'], ['Machine-B', true, 'desk'], ['Machine-F', false, null],
  ])
  const b = fleet.machines[1]
  assert.deepEqual(b.lanes.map((l) => l.agent.title), ['login', 'stray'])
  assert.deepEqual(b.lanes[0].children.map((l) => [l.agent.title, l.depth]), [['child', 1]])
  assert.equal(b.lanes[0].card.title, 'Login page')
  assert.equal(b.lanes[1].unplaced, true, 'a lane under another machine’s supervisor shows on its own machine, marked')
  assert.equal(b.lanes[1].crossMachine, true)
  assert.ok(!fleet.all.some(({ lane }) => lane.agent.title === 'lonely'))
  assert.equal(b.supervisor.lane.supervisor, true)
  assert.deepEqual(fleet.counts, { lanes: 4, running: 3, owner: 0, external: 0, error: 0, machines: 3, online: 2, pending: 0 })
})

test('a named supervisor wins over the guess', () => {
  const { board, report } = fleetFixture()
  applyOp(board, { type: 'fleet.supervisor', session: 's-lonely' }, at())
  const b = fleetOf(report, board).machines[1]
  assert.equal(b.supervisor.agent.title, 'lonely')
  assert.equal(b.supervisor.named, true)
})

test('what a lane waits on: its question, then its word, then gugu, then its pull request', () => {
  const { board, card, report } = fleetFixture()
  const login = report.agents.find((a) => a.title === 'login')
  applyOp(board, { type: 'link.add', card, link: { kind: 'pr', url: PR } }, at())
  applyOp(board, { type: 'pr.sync', prs: [{ url: PR, ci: 'pending' }] }, at())
  assert.equal(waitOf(board, board.cards[card], login).kind, 'ci')
  applyOp(board, { type: 'pr.sync', prs: [{ url: PR, ci: 'green', devReview: true, review: 'required' }] }, at())
  assert.equal(waitOf(board, board.cards[card], login).kind, 'review')
  applyOp(board, { type: 'pr.sync', prs: [{ url: PR, review: 'approved', mergedBy: 'owner' }] }, at())
  assert.deepEqual([waitOf(board, board.cards[card], login).kind, waitOf(board, board.cards[card], login).who], ['merge', 'owner'])
  assert.equal(waitOf(board, board.cards[card], { ...login, status: 'needs_user', detail: 'approval' }).kind, 'owner')
  applyOp(board, { type: 'card.update', card, waitKind: 'ci', waitingOn: 'e2e' }, at())
  const lane = waitOf(board, board.cards[card], login)
  assert.deepEqual([lane.kind, lane.from, lane.drift], ['ci', 'lane', true], 'the lane’s word, flagged: CI already finished')
  applyOp(board, { type: 'decision.create', card, question: 'Ship it tonight?', options: ['yes', 'no'] }, at())
  assert.deepEqual([waitOf(board, board.cards[card], login).kind, waitOf(board, board.cards[card], login).from], ['owner', 'decision'])
  assert.equal(waitOf(board, null, { ...login, rateLimit: { status: 'rejected', resetsAt: '2026-11-08T00:00:00Z' } }).kind, 'quota')
  assert.equal(waitOf(board, null, { ...login, failure: { kind: 'adapter-exit' } }).kind, 'error')

  const fleet = fleetOf(report, board)
  assert.equal(fleet.counts.owner, 1)
  assert.equal(fleet.counts.pending, 1)
  assert.equal(fleet.waits[0].lane.agent.title, 'login')
  assert.equal(cardLine(fleet.counts), '舰队 · 2 条在跑 · 1 条等你拍板')
  assert.equal(cardLine({ ...fleet.counts, external: 2, error: 1 }, false), 'Fleet · 2 running · 1 waiting on you · 2 on CI/review/merge · 1 failing')
})

test('a card whose task is not listed shows as loose, not as a lane', () => {
  const { board, report } = fleetFixture()
  applyOp(board, { type: 'card.create', title: 'Gone lane', column: 'doing', links: [{ kind: 'task', session: 's-elsewhere' }] }, at())
  const fleet = fleetOf(report, board)
  assert.deepEqual(fleet.loose.map((l) => l.card.title), ['Gone lane'])
})

test('archive checks: never a supervisor, only after a handoff or an open PR, nothing under it', () => {
  const { board, card, report } = fleetFixture()
  const fleet = fleetOf(report, board)
  const b = fleet.machines[1]
  const ok = (lane) => Object.fromEntries(archiveChecks(lane).map((c) => [c.key, c.ok]))
  assert.deepEqual(ok(b.supervisor.lane), { notSupervisor: false, handedOver: false, noChildren: false })
  assert.deepEqual(ok(b.lanes[0]), { notSupervisor: true, handedOver: false, noChildren: false })
  applyOp(board, { type: 'link.add', card, link: { kind: 'pr', url: PR } }, at())
  assert.deepEqual(ok(fleetOf(report, board).machines[1].lanes[0]), { notSupervisor: true, handedOver: true, noChildren: false })
  assert.equal(archiveChecks(fleetOf(report, board).machines[1].lanes[0])[1].pr, '42')
})

test('a lane moves only under a session on its own machine, never under itself or below it', () => {
  const { board, report } = fleetFixture()
  const fleet = fleetOf(report, board)
  const login = fleet.machines[1].lanes[0]
  const choices = parentChoices(fleet, login)
  assert.deepEqual(choices.map((c) => [c.agent.title, c.supervisor, c.current]), [['desk', true, true], ['stray', false, false]])
  const child = login.children[0]
  assert.deepEqual(parentChoices(fleet, child).map((c) => [c.agent.title, c.current]), [['desk', false], ['login', true], ['stray', false]])
})
