// The fleet, as data: the person's agents on every computer, laid out the way the fleet runs — each machine's
// supervisor, the lanes under it — joined with the board's cards (a lane is the card its task is linked to). What
// each lane waits on, read from the card, its task and its pull request. No DOM: the org page, the message card and
// the tools read the same file.
import { taskState, pendingAsk, prNumber, decisionsInOrder, STALE_MS } from './core.js'

/** The order the waits are shown in: what only the person can unblock first. */
export const WAIT_ORDER = ['owner', 'review', 'merge', 'ci', 'lane', 'quota', 'error', 'other']
/** The waits outside the fleet that are not the person's: counted together on the message card. */
export const EXTERNAL = new Set(['review', 'merge', 'ci'])

const taskLinks = (card) => Object.values(card.links).filter((l) => l.kind === 'task')
const prLinks = (card) => Object.values(card.links).filter((l) => l.kind === 'pr')

/** The newest pr link on a card, or null. */
export function prOf(card) {
  const prs = prLinks(card)
  return prs.length ? prs.reduce((a, b) => ((b.at ?? '') > (a.at ?? '') ? b : a)) : null
}

/**
 * What a lane waits on, and where that was read: `{ kind, text, since, from }` or null. `from` is 'decision' (a
 * question the lane asked), 'lane' (its card says so), 'task' (gugu says it waits on the person), 'pr' (its pull
 * request's state) — the lane's own word comes before what the pull request suggests. `drift` is set when the pull
 * request says the lane's word is out of date (it waits on CI that has finished).
 */
export function waitOf(board, card, agent) {
  const ask = card ? pendingAsk(board, card.id) : null
  if (ask) return { kind: 'owner', text: ask.question, since: ask.at, from: 'decision', decision: ask.id }
  const state = agent ? taskState(agent) : null
  if (agent?.rateLimit?.status === 'rejected') return { kind: 'quota', text: '', since: null, until: agent.rateLimit.resetsAt ?? null, from: 'task' }
  if (state?.key === 'error') return { kind: 'error', text: agent.failure?.message ?? '', since: null, from: 'task' }
  const pr = card ? prOf(card) : null
  if (card && (card.waitKind || card.waitingOn)) {
    const kind = card.waitKind || 'other'
    const drift = pr && ((kind === 'ci' && pr.ci && pr.ci !== 'pending') || ((kind === 'merge' || kind === 'review') && pr.merged))
    return { kind, text: card.waitingOn ?? '', who: card.waitWho || null, since: card.waitSince ?? null, from: 'lane', ...(drift ? { drift: true } : {}) }
  }
  if (state?.waiting) return { kind: 'owner', text: '', since: agent.lastActionAt ?? null, from: 'task' }
  if (pr && !pr.merged && !pr.closed) {
    if (pr.ci === 'pending') return { kind: 'ci', text: '', since: pr.syncedAt ?? null, from: 'pr' }
    if (pr.ci === 'green' && pr.devReview && pr.review !== 'approved') return { kind: 'review', text: '', since: pr.syncedAt ?? null, from: 'pr' }
    if (pr.ci === 'green' && (pr.review === 'approved' || !pr.devReview)) return { kind: 'merge', text: '', who: pr.mergedBy ?? null, since: pr.syncedAt ?? null, from: 'pr' }
  }
  return null
}

/** A lane's colour: what it waits on, else how its task runs. */
export function toneOf(lane) {
  if (lane.wait) return lane.wait.kind
  const key = lane.state?.key
  if (key === 'running' || key === 'parked') return 'run'
  if (key === 'error') return 'error'
  return 'idle'
}

/**
 * The fleet from what gugu lists (`listAgents({ report: true })`: agents, devices) and a board. Returns
 * `{ machines, loose, counts, waits, unreached }`:
 * - machines: one per computer gugu knows, this one first; each with its supervisor (or null), its lanes as a tree,
 *   and whether it answers;
 * - loose: cards on the board whose task gugu does not list (finished elsewhere, or on a computer that did not answer);
 * - waits: every lane that waits, most urgent kind first, longest wait first;
 * - counts: running, owner, external, error, lanes, machines online.
 */
export function fleetOf({ agents = [], devices = [], unreached = [] } = {}, board = null, now = Date.now()) {
  const cards = Object.values(board?.cards ?? {})
  const cardBySession = new Map()
  for (const card of cards) for (const l of taskLinks(card)) cardBySession.set(l.session, card)
  const named = board?.fleet?.supervisors ?? {}
  const byAgent = new Map(agents.map((a) => [a.agentId, a]))
  const children = new Map()
  for (const a of agents) {
    const parent = a.parentAgentId && byAgent.has(a.parentAgentId) ? a.parentAgentId : null
    if (!parent) continue
    if (!children.has(parent)) children.set(parent, [])
    children.get(parent).push(a)
  }
  const here = devices.find((d) => d.thisMachine)?.deviceId ?? null
  const deviceOf = (a) => a.deviceId ?? here
  const descendants = (a) => (children.get(a.agentId) ?? []).reduce((n, c) => n + 1 + descendants(c), 0)

  // The machines: the host's directory, plus any a listed agent names that the directory left out.
  const machines = new Map()
  const machine = (deviceId, label, online = true, thisMachine = false) => {
    const key = deviceId ?? 'here'
    if (!machines.has(key)) machines.set(key, { deviceId, label: label ?? null, online, thisMachine, supervisor: null, lanes: [], counts: null })
    return machines.get(key)
  }
  for (const d of devices) machine(d.deviceId, d.label, d.online !== false, Boolean(d.thisMachine))
  for (const u of unreached) if (u.deviceId) Object.assign(machine(u.deviceId, u.label, false), { online: false, detail: u.detail ?? null })
  for (const a of agents) {
    const m = machine(deviceOf(a), a.deviceLabel)
    if (!m.label && a.deviceLabel) m.label = a.deviceLabel
  }

  // Each machine's supervisor: the one the board names, else the root there with the most sessions under it.
  for (const m of machines.values()) {
    const roots = agents.filter((a) => deviceOf(a) === m.deviceId && (!a.parentAgentId || !byAgent.has(a.parentAgentId) || deviceOf(byAgent.get(a.parentAgentId)) !== m.deviceId))
    const chosen = roots.find((a) => named[a.sessionId]) ?? agents.find((a) => deviceOf(a) === m.deviceId && named[a.sessionId])
      ?? roots.filter((a) => descendants(a) > 0).sort((x, y) => descendants(y) - descendants(x))[0] ?? null
    if (chosen) m.supervisor = { agent: chosen, named: Boolean(named[chosen.sessionId]) }
  }
  const supervisors = new Set([...machines.values()].flatMap((m) => (m.supervisor ? [m.supervisor.agent.agentId] : [])))

  const offline = new Set([...machines.values()].filter((m) => !m.online).map((m) => m.deviceId))
  const laneOf = (a, depth) => {
    const card = cardBySession.get(a.sessionId) ?? null
    // A machine that does not answer has only its last reading: its tasks' states are unknown, its cards still speak.
    const seen = offline.has(deviceOf(a)) ? null : a
    const state = seen ? taskState(a) : { key: 'gone', waiting: false }
    const lane = {
      agent: a, card, state, depth,
      supervisor: supervisors.has(a.agentId),
      named: Boolean(named[a.sessionId]),
      // Every session under it, on any machine: what archiving must not orphan.
      childCount: (children.get(a.agentId) ?? []).length,
      crossMachine: Boolean(a.parentAgentId && byAgent.has(a.parentAgentId) && deviceOf(byAgent.get(a.parentAgentId)) !== deviceOf(a)),
      stale: Boolean(card && (state.key === 'running' || state.key === 'parked' || card.waitKind || card.waitingOn) && now - Date.parse(card.updatedAt) > STALE_MS),
      children: [],
    }
    lane.wait = waitOf(board, card, seen)
    lane.tone = toneOf(lane)
    lane.children = (children.get(a.agentId) ?? []).filter((c) => deviceOf(c) === deviceOf(a) && !supervisors.has(c.agentId)).map((c) => laneOf(c, depth + 1))
    return lane
  }
  const placed = new Set()
  const walk = (lanes) => { for (const l of lanes) { placed.add(l.agent.agentId); walk(l.children) } }
  for (const m of machines.values()) {
    const sup = m.supervisor?.agent
    m.lanes = sup ? (children.get(sup.agentId) ?? []).filter((c) => deviceOf(c) === m.deviceId && !supervisors.has(c.agentId)).map((c) => laneOf(c, 0)) : []
    if (sup) {
      placed.add(sup.agentId)
      // The supervisor opens like a lane (its card, its wait), with the machine's lanes as its children.
      const card = cardBySession.get(sup.sessionId) ?? null
      const seen = m.online ? sup : null
      const lane = { agent: sup, card, state: seen ? taskState(sup) : { key: 'gone', waiting: false }, depth: -1, supervisor: true, named: m.supervisor.named, childCount: (children.get(sup.agentId) ?? []).length, crossMachine: false, stale: false, children: m.lanes }
      lane.wait = waitOf(board, card, seen)
      lane.tone = toneOf(lane)
      m.supervisor.lane = lane
    }
    walk(m.lanes)
  }
  // A lane on a card, or under a supervisor elsewhere, that the walk did not reach: shown on its own machine, marked.
  for (const a of agents) {
    if (placed.has(a.agentId)) continue
    const underSupervisor = a.parentAgentId && supervisors.has(a.parentAgentId)
    if (!cardBySession.has(a.sessionId) && !underSupervisor) continue
    const lane = laneOf(a, 0)
    lane.unplaced = true
    machine(deviceOf(a), a.deviceLabel).lanes.push(lane)
    walk([lane])
  }

  const listed = new Set(agents.map((a) => a.sessionId))
  const loose = cards.filter((c) => taskLinks(c).length && !taskLinks(c).some((l) => listed.has(l.session)) && board.columns[c.column]?.role !== 'done')
    .map((card) => ({ card, wait: waitOf(board, card, null), tone: 'gone' }))

  const all = []
  const flat = (lanes, m) => { for (const l of lanes) { all.push({ lane: l, machine: m }); flat(l.children, m) } }
  for (const m of machines.values()) flat(m.lanes, m)
  const waits = all.filter(({ lane }) => lane.wait).sort((a, b) =>
    WAIT_ORDER.indexOf(a.lane.wait.kind) - WAIT_ORDER.indexOf(b.lane.wait.kind) || String(a.lane.wait.since ?? '9').localeCompare(String(b.lane.wait.since ?? '9')))
  const counts = {
    lanes: all.length,
    // One rule for every count: a lane's tone (an offline machine's tasks read as unknown, never as running).
    running: all.filter(({ lane }) => lane.tone === 'run').length,
    // A remote agent's live counters are null, but its status (needs_user) is not: a waiting task is counted either way.
    owner: all.filter(({ lane }) => lane.wait?.kind === 'owner').length,
    external: all.filter(({ lane }) => EXTERNAL.has(lane.wait?.kind)).length,
    error: all.filter(({ lane }) => lane.wait?.kind === 'error' || lane.wait?.kind === 'quota').length,
    machines: machines.size,
    online: [...machines.values()].filter((m) => m.online).length,
    pending: decisionsInOrder(board ?? {}).filter((d) => d.status === 'pending').length,
  }
  for (const m of machines.values()) {
    const mine = all.filter((x) => x.machine === m)
    m.counts = { lanes: mine.length, waiting: mine.filter(({ lane }) => lane.wait).length }
  }
  const order = [...machines.values()].sort((a, b) => Number(b.thisMachine) - Number(a.thisMachine) || Number(b.online) - Number(a.online) || String(a.label).localeCompare(String(b.label)))
  return { machines: order, loose, counts, waits, all }
}

/**
 * The decisions in force for a lane: the fleet's, its machine's, its own and its release's (`release` the label on
 * its card, `dest`). Superseded and withdrawn ones are left out unless `all`.
 */
export function decisionsFor(board, { card = null, machine = null, release = null, all = false } = {}) {
  const lane = card ? board?.cards?.[card] : null
  const dest = release ?? lane?.dest ?? null
  return decisionsInOrder(board ?? {}).filter((d) => {
    if (!all && (d.status === 'superseded' || d.status === 'withdrawn')) return false
    const s = d.scope ?? { kind: 'fleet' }
    if (s.kind === 'fleet') return true
    if (s.kind === 'lane') return card !== null && (s.ref === card || d.card === card)
    if (s.kind === 'machine') return machine !== null && s.ref.toLowerCase() === String(machine).toLowerCase()
    if (s.kind === 'release') return dest !== null && String(dest).includes(s.ref)
    return false
  })
}

/**
 * What the page checks before it asks a supervisor to archive a lane. These are a hint, not the gate: the supervisor
 * checks again itself (skill kanban) and refuses what does not hold. Archived sessions never come back.
 * - notSupervisor: not a supervisor, named or guessed, and not a root session (an unnamed root may be a supervisor);
 * - supervisorNamed: its machine's supervisor is named on the board, so it is known who carries this out;
 * - handedOver: a handoff accepted on the card, or a pull request the last sync saw (not one closed unmerged) — an
 *   agent's pr link that no sync has seen does not count;
 * - noChildren: no session under it, on any machine.
 */
export function archiveChecks(lane, machine) {
  const card = lane.card
  const pr = card ? prOf(card) : null
  const prSeen = Boolean(pr?.syncedAt) && !(pr.closed && !pr.merged)
  return [
    { key: 'notSupervisor', ok: !lane.supervisor && !lane.named && Boolean(lane.agent.parentAgentId) },
    { key: 'supervisorNamed', ok: Boolean(machine?.supervisor?.named) },
    { key: 'handedOver', ok: Boolean(card?.handoff?.acceptedAt) || prSeen, pr: prSeen ? prNumber(pr.url) : null },
    { key: 'noChildren', ok: (lane.childCount ?? lane.children.length) === 0 },
  ]
}

/** The sessions a lane may be moved under: on its own machine, not itself or anything under it. */
export function parentChoices(fleet, lane) {
  const own = fleet.machines.find((m) => m.lanes.some(function has(l) { return l === lane || l.children.some(has) }))
  if (!own) return []
  const below = new Set()
  const mark = (l) => { below.add(l.agent.agentId); l.children.forEach(mark) }
  mark(lane)
  const out = own.supervisor ? [{ agent: own.supervisor.agent, supervisor: true }] : []
  const visit = (lanes) => { for (const l of lanes) { if (!below.has(l.agent.agentId)) out.push({ agent: l.agent, supervisor: false }); visit(l.children) } }
  visit(own.lanes)
  return out.map((c) => ({ ...c, current: c.agent.agentId === lane.agent.parentAgentId }))
}

/** The line a message card's text says (previews, quotes, notifications): the counts when it was sent. */
export function cardLine(counts, zh = true) {
  const owner = counts.owner
  return zh
    ? `舰队 · ${counts.running} 条在跑 · ${owner} 条等你拍板${counts.external ? ` · ${counts.external} 条等 CI/审/合` : ''}${counts.error ? ` · ${counts.error} 条出错` : ''}`
    : `Fleet · ${counts.running} running · ${owner} waiting on you${counts.external ? ` · ${counts.external} on CI/review/merge` : ''}${counts.error ? ` · ${counts.error} failing` : ''}`
}
