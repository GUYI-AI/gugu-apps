// 协作看板's people side, drawn inside the board page: who holds which card, how the agents are organised (the person,
// each machine's supervisor, the lanes under it) and what waits on the person. One page with the board (owner 11-08):
// the 团队 and 决策 views, the "who" filter, the "waiting on you" strip and an agent's panel all read the same board and
// the same agent list as the 看板 view, and every click leads to the card or the agent it names. No page of its own:
// `page` (board.js) gives the state and the actions; nothing here keeps any.
import { decisionsInOrder, decisionLabel, prNumber } from './lib/core.js'
import { waitOf, prOf, archiveChecks, parentChoices, decisionsFor } from './lib/fleet.js'
import { wordsFor, engineOf } from './lib/fleet-text.js'

/** The task that holds a card: the newest task linked to it, as gugu lists it (or as the link remembers it). */
export function holderOf(page, card) {
  const tasks = Object.values(card.links).filter((l) => l.kind === 'task').sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
  for (const l of tasks) {
    const row = page.agents.find((a) => a.sessionId === l.session)
    if (row) return row
    if (l.agent) return { agentId: l.agent, sessionId: l.session, title: l.title ?? null, status: null, gone: true }
  }
  return null
}
export const nameOf = (a) => a?.title ?? a?.sessionId?.slice(0, 8) ?? ''
const isDone = (page, card) => page.board.columns[card.column]?.role === 'done'

/** A card's wait, read the same way the fleet reads a lane's: its question, its task, its own word, its pull request. */
export function waitOfCard(page, card) {
  const a = holderOf(page, card)
  return waitOf(page.board, card, a && !a.gone ? a : null)
}

/** Everything that waits on the person: a card's question or owner-kind wait (not done), and questions no card holds. */
export function asksOf(page) {
  if (!page.board) return []
  const out = []
  for (const card of Object.values(page.board.cards)) {
    if (isDone(page, card)) continue
    const wait = waitOfCard(page, card)
    if (wait?.kind === 'owner') out.push({ card, agent: holderOf(page, card), wait, decision: wait.decision ? page.board.decisions?.[wait.decision] : null })
  }
  const held = new Set(out.map((x) => x.decision?.id).filter(Boolean))
  for (const d of decisionsInOrder(page.board)) {
    if (d.status !== 'pending' || held.has(d.id) || (d.card && page.board.cards[d.card] && isDone(page, page.board.cards[d.card]))) continue
    if (d.card && out.some((x) => x.card.id === d.card)) continue
    out.push({ card: d.card ? page.board.cards[d.card] ?? null : null, agent: page.agents.find((a) => a.agentId === d.by) ?? null, wait: { kind: 'owner', text: d.question, since: d.at, from: 'decision', decision: d.id }, decision: d })
  }
  return out.sort((x, y) => String(x.wait.since ?? '').localeCompare(String(y.wait.since ?? '')))
}

/** A wait in words: the lane's own words if it gave any, else its kind; a wait on the person says so first. */
export const waitWords = (F, w) => (w.kind === 'owner' ? [F.waits.owner, w.text] : [w.text || F.waits[w.kind]]).filter(Boolean).join(' · ')

/** A task's colour on a face: what it waits on, else whether it runs. */
export function toneOf(page, a) {
  const lane = a ? laneOf(page, a.agentId) : null
  if (lane) return lane.tone
  if (!a || a.gone) return 'idle'
  return a.status === 'needs_user' ? 'owner' : a.status === 'working' || a.status === 'running' ? 'run' : 'idle'
}
export function laneOf(page, agentId) {
  const f = page.fleet
  if (!f) return null
  return f.all.find((x) => x.lane.agent.agentId === agentId)?.lane ?? f.machines.find((m) => m.supervisor?.agent.agentId === agentId)?.supervisor.lane ?? null
}
const machineOf = (page, agentId) => page.fleet?.machines.find((m) => m.supervisor?.agent.agentId === agentId) ?? page.fleet?.all.find((x) => x.lane.agent.agentId === agentId)?.machine ?? null
const machineName = (m) => m?.label ?? (m?.thisMachine ? 'this computer' : '?')
export const cardsHeldBy = (page, agentId) => Object.values(page.board?.cards ?? {}).filter((c) => holderOf(page, c)?.agentId === agentId)

/** A face with its task's colour: a dot at the corner says waiting on you / running. */
export function face(page, a, size = 'xs') {
  const { h } = page
  return h('span', { class: `presence tone-${toneOf(page, a)}` }, h('gugu-avatar', { user: a.agentId, size, label: nameOf(a) }))
}

/** Whether a card passes the "who" filter: everyone, one holder, or nobody's. */
export function shownBy(page, card) {
  if (page.who === null) return true
  const a = holderOf(page, card)
  return page.who === 'none' ? !a : a?.agentId === page.who
}

// ── the strip: who, and what waits on you ────────────────────────────────────

export function peopleRow(page) {
  const { h, icon, t } = page
  const cards = Object.values(page.board.cards)
  const holders = new Map()
  for (const c of cards) { const a = holderOf(page, c); if (a && !holders.has(a.agentId)) holders.set(a.agentId, a) }
  const open = (c) => !isDone(page, c)
  const chip = (id, label, lead, n) => h('button', { class: `face-chip${page.who === id ? ' on' : ''}`, 'aria-pressed': String(page.who === id), title: label, onclick: () => page.setWho(page.who === id ? null : id) },
    lead, h('span', { class: 'label', text: label }), n ? h('small', { text: String(n) }) : null)
  return [
    h('button', { class: `face-chip${page.who === null ? ' on' : ''}`, 'aria-pressed': String(page.who === null), onclick: () => page.setWho(null) }, h('span', { class: 'label', text: t.everyone })),
    ...[...holders.values()].map((a) => chip(a.agentId, nameOf(a), face(page, a), cards.filter((c) => open(c) && holderOf(page, c)?.agentId === a.agentId).length)),
    chip('none', t.unclaimed, icon('user-plus'), cards.filter((c) => open(c) && !holderOf(page, c)).length),
  ]
}

/** The first thing waiting on the person, answered right here; the rest one click away (决策). */
export function asksStrip(page, list) {
  const { h, icon, t } = page
  const F = wordsFor(page.locale)
  const first = list[0]
  return [
    h('span', { class: 'asks-head' }, h('i', { class: 'dot tone-owner' }), h('strong', { text: t.asks(list.length) })),
    first.card ? h('button', { class: 'linkish', onclick: () => page.openCard(first.card.id), text: first.card.title }) : null,
    h('span', { class: 'q', text: first.decision?.question ?? first.wait.text ?? '' }),
    answerRow(page, first, F),
    list.length > 1 ? h('button', { class: 'plain', onclick: () => page.setView('decisions') }, t.allAsks, icon('chevron-right')) : null,
  ].filter(Boolean)
}

/**
 * Answer what waits on the person. A question (ask): its answers as buttons, or a line; recorded in the ledger first
 * (it holds even if the lane cannot be told), then sent to the agent that asked. A wait without a question: the line
 * goes to the card's agent and the card stops waiting on the person.
 */
export function answerRow(page, ask, F = wordsFor(page.locale)) {
  const { h, t } = page
  const input = h('input', { type: 'text', placeholder: F.say, 'aria-label': F.reply })
  const answer = async (text) => {
    if (!text) return
    if (ask.decision) return decide(page, ask.decision, ask.agent, text, F).then(() => { input.value = '' })
    if (!ask.agent) return
    const card = ask.card
    if (await page.tell(ask.agent.agentId, t.toReply(card, text, page.boardRef()))) {
      input.value = ''
      if (card && (card.waitKind === 'owner' || card.waitingOn)) page.quietly(page.change({ type: 'card.update', card: card.id, waitingOn: '' }))
      page.note(F.sent)
    }
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) answer(input.value.trim()) })
  const options = ask.decision?.options ?? []
  return h('span', { class: 'answer' }, ...options.map((o) => h('button', { text: o, onclick: () => answer(o) })), input,
    options.length ? null : h('button', { class: 'primary', text: F.reply, onclick: () => answer(input.value.trim()) }))
}

async function decide(page, decision, agent, answer, F) {
  try {
    await page.change({ type: 'decision.decide', decision: decision.id, answer })
  } catch { return }
  const done = page.board.decisions[decision.id]
  const label = decisionLabel(page.board, done)
  const to = agent?.agentId ?? done.by
  if (to?.startsWith?.('user:') && (await page.tell(to, page.t.toDecision(done, label, page.boardRef())))) page.note(F.decidedNote(label))
}

// ── 团队: the person, each machine, its supervisor and lanes, each lane with the cards it holds ───────────────────

export function teamView(page) {
  const { h, icon, t } = page
  const F = wordsFor(page.locale)
  const f = page.fleet
  const unclaimed = Object.values(page.board.cards).filter((c) => !holderOf(page, c) && !isDone(page, c))
  const c = f.counts
  const tree = h('div', { class: 'tree' },
    h('div', { class: 'root' }, h('span', { class: 'you', text: F.you }),
      h('small', { class: 'muted', text: [F.machines(c.online, c.machines), `${F.counts.running} ${c.running}`, `${F.counts.owner} ${c.owner}`].join(' · ') })),
    ...f.machines.map((m) => machineView(page, m, F)),
    f.loose.length ? h('section', { class: 'loose' }, h('h3', { text: F.loose }), h('ul', { class: 'cards' }, ...f.loose.filter(({ card }) => shownBy(page, card)).map(({ card }) => h('li', {}, miniCard(page, card))))) : null)
  // Nobody on this board yet: say how agents come to be here, rather than an empty machine.
  if (!f.all.length && !f.machines.some((m) => m.supervisor) && !f.loose.length) {
    return h('gugu-empty', { icon: 'users' }, h('strong', { text: t.teamEmpty }), h('small', { text: t.teamEmptyHint }))
  }
  const pool = h('aside', { class: 'pool' }, h('h3', {}, icon('user-plus'), t.unclaimed, h('small', { text: String(unclaimed.length) })),
    unclaimed.length ? h('ul', { class: 'cards' }, ...unclaimed.filter((x) => page.who === null || page.who === 'none').map((x) => h('li', {}, miniCard(page, x)))) : h('p', { class: 'muted', text: t.noneUnclaimed }))
  return h('div', { class: 'team' }, tree, pool)
}

function machineView(page, m, F) {
  const { h, icon } = page
  const sup = m.supervisor?.lane
  // A lane has ended when its task has and it holds no open card: a lane whose turn is over but whose card is in
  // progress is still at work as far as the board goes.
  const ended = (l) => !l.wait && !l.children.length && ['done', 'stopped', 'gone'].includes(l.state.key) && !cardsHeldBy(page, l.agent.agentId).some((c) => !isDone(page, c))
  const live = m.lanes.filter((l) => !ended(l))
  const rest = m.lanes.filter(ended)
  const key = m.deviceId ?? 'here'
  return h('section', { class: `machine${m.online ? '' : ' offline'}`, 'aria-label': machineName(m) },
    h('header', {}, h('i', { class: `dot ${m.online ? 'on' : 'off'}` }), h('strong', { text: machineName(m) }),
      h('small', { class: 'muted', text: m.online ? F.lanes(m.counts.lanes) : `${F.offline} · ${F.offlineSince}` })),
    sup ? memberRow(page, sup, F, true) : h('p', { class: 'muted no-sup', text: F.noSupervisor }),
    h('ul', { class: 'lanes' }, ...live.flatMap((l) => laneRows(page, l, F))),
    rest.length ? h('button', { class: 'plain fold', 'aria-expanded': page.unfolded.has(key) ? 'true' : 'false', onclick: () => { page.unfolded.has(key) ? page.unfolded.delete(key) : page.unfolded.add(key); page.render() } },
      icon(page.unfolded.has(key) ? 'chevron-down' : 'chevron-right'), F.ended(rest.length)) : null,
    rest.length && page.unfolded.has(key) ? h('ul', { class: 'lanes ended' }, ...rest.flatMap((l) => laneRows(page, l, F))) : null)
}
const laneRows = (page, l, F) => [page.h('li', { style: `--depth:${l.depth}` }, memberRow(page, l, F, false)), ...l.children.flatMap((c) => laneRows(page, c, F))]

function memberRow(page, lane, F, isSup) {
  const { h, icon } = page
  const a = lane.agent
  const held = cardsHeldBy(page, a.agentId).filter((c) => !isDone(page, c))
  const openCard = page.opened?.kind === 'card' ? page.board.cards[page.opened.id] : null
  const selected = (page.opened?.kind === 'member' && page.opened.agentId === a.agentId) || (openCard && holderOf(page, openCard)?.agentId === a.agentId)
  const dim = page.who !== null && page.who !== a.agentId
  return h('div', { class: `member tone-${lane.tone}${isSup ? ' sup' : ''}${dim ? ' dim' : ''}${selected ? ' selected' : ''}${lane.stale ? ' stale' : ''}` },
    h('button', { class: 'who', onclick: () => page.openMember(a.agentId), title: lane.stale ? F.stale : undefined },
      face(page, a, 'sm'),
      h('span', { class: 'id' },
        h('strong', {}, h('span', { class: 'name', text: nameOf(a) }), engineTag(page, a), isSup ? h('span', { class: 'badge', text: F.supervisor }) : null,
          lane.unplaced ? h('span', { class: 'flag', title: F.unplaced }, icon('unlink')) : null, lane.crossMachine ? h('span', { class: 'flag', title: F.crossMachine }, icon('shuffle')) : null),
        h('small', { class: 'status-line', text: lane.wait ? waitWords(F, lane.wait) : F.states[lane.state.key] }))),
    h('span', { class: 'held' }, ...held.map((c) => h('button', { class: `pill${openCard?.id === c.id ? ' on' : ''}`, onclick: () => page.openCard(c.id) },
      page.ring(page.board.columns[c.column]?.role), h('span', { class: 'name', text: c.title }), typeof c.progress === 'number' ? h('small', { text: `${c.progress}%` }) : null))))
}
const engineTag = (page, a) => { const e = engineOf(a); return e ? page.h('span', { class: `engine ${e.toLowerCase()}`, text: e }) : null }

/** A card as one line: its column's ring, its title, what it waits on. Opens the card. */
export function miniCard(page, card) {
  const { h } = page
  const F = wordsFor(page.locale)
  const wait = isDone(page, card) ? null : waitOfCard(page, card)
  return h('button', { class: `mini${page.opened?.kind === 'card' && page.opened.id === card.id ? ' on' : ''}`, onclick: () => page.openCard(card.id) },
    h('span', { class: 'line' }, page.ring(page.board.columns[card.column]?.role), h('span', { class: 'name', text: card.title }), typeof card.progress === 'number' ? h('small', { text: `${card.progress}%` }) : null),
    wait ? h('span', { class: `wait tone-${wait.kind}` }, h('i', { class: 'dot' }), waitWords(F, wait)) : null)
}

// ── an agent, opened (the panel beside any view) ─────────────────────────────

export function memberPanel(page, agentId) {
  const { h, icon, t } = page
  const F = wordsFor(page.locale)
  const lane = laneOf(page, agentId)
  const a = lane?.agent ?? page.agents.find((x) => x.agentId === agentId)
  if (!a) return null
  const machine = machineOf(page, agentId)
  const parent = page.agents.find((x) => x.agentId === a.parentAgentId)
  const sub = machine ? (parent ? F.on(machineName(machine), nameOf(parent)) : F.rootOn(machineName(machine))) : (a.deviceLabel ?? '')
  const held = cardsHeldBy(page, agentId)
  const card = lane?.card ?? held.find((c) => !isDone(page, c)) ?? null
  const pr = card ? prOf(card) : null
  const wait = lane?.wait ?? null

  const head = h('div', { class: 'head' },
    h('small', { class: 'muted crumb' }, icon('users'), ` ${t.views.team}`), h('span', { class: 'spacer' }),
    h('button', { class: 'plain', 'aria-label': t.close, onclick: page.closePanel }, icon('x')))
  const who = h('div', { class: 'p-who' }, face(page, a, 'md'),
    h('div', {}, h('h2', { id: 'd-title' }, h('span', { text: nameOf(a) }), engineTag(page, a), lane?.supervisor ? h('span', { class: 'badge', title: F.locked, text: F.supervisor }) : null),
      h('small', { class: 'muted', text: [sub, lane ? F.states[lane.state.key] : null].filter(Boolean).join(' · ') })))
  const ask = wait?.kind === 'owner' && card ? { card, agent: a, wait, decision: wait.decision ? page.board.decisions?.[wait.decision] : null } : null
  const callout = wait ? h('div', { class: `callout tone-${wait.kind}` }, h('strong', {}, h('i', { class: 'dot' }), F.waits[wait.kind], wait.since ? h('gugu-time', { datetime: wait.since }) : null),
    (ask?.decision?.question ?? wait.text) ? h('p', { text: ask?.decision?.question ?? wait.text }) : null, ask ? answerRow(page, ask, F) : null) : null

  const heldList = h('section', { class: 'p-sec' }, h('h3', {}, t.holds, h('small', { text: String(held.length) })),
    held.length ? h('ul', { class: 'cards' }, ...held.map((c) => h('li', {}, miniCard(page, c)))) : h('p', { class: 'muted', text: F.noCard }))

  const box = h('textarea', { rows: 2, placeholder: F.messagePlaceholder(nameOf(a)), 'aria-label': F.message })
  const send = h('button', { class: 'primary', text: F.send, onclick: async () => { if (box.value.trim() && (await page.tell(a.agentId, box.value.trim()))) { box.value = ''; page.note(F.sent) } } })
  const acts = h('div', { class: 'compose' }, box, h('div', { class: 'row' },
    h('button', { onclick: () => page.g.showSession(a.sessionId, { peek: true }).catch(page.said) }, icon('message-square'), F.transcript),
    pr ? h('button', { onclick: () => page.g.openBrowserTab(pr.url).catch(page.said) }, icon('git-pull-request'), F.openPr(prNumber(pr.url))) : null,
    h('button', { class: page.who === agentId ? 'on' : '', onclick: () => { page.setWho(agentId); page.setView('board') } }, icon('layout-grid'), t.onlyTheirs),
    h('span', { class: 'spacer' }), send))
  const moreToggle = lane ? h('button', { class: 'plain more-toggle', 'aria-expanded': page.more ? 'true' : 'false', onclick: () => { page.more = !page.more; page.pane = null; page.render() } }, icon(page.more ? 'chevron-up' : 'chevron-down'), page.more ? F.less : F.more) : null
  const kids = [head, who, callout, heldList, acts, moreToggle]
  if (lane && page.more) kids.push(...moreLayer(page, lane, machine, card, pr, F))
  return kids.filter(Boolean)
}

/** Every field with where it comes from, the decisions on this lane, and the actions that change the fleet. */
function moreLayer(page, lane, machine, card, pr, F) {
  const { h, icon } = page
  const a = lane.agent
  const row = (label, value, from) => (value ? [h('dt', { text: label }), h('dd', {}, value, from ? h('small', { class: 'src', text: F.from[from] }) : null)] : [])
  const time = (iso) => (iso ? h('gugu-time', { datetime: iso }) : null)
  const details = h('dl', { class: 'fields' },
    ...row(F.fields.state, F.states[lane.state.key], 'task'),
    ...row(F.fields.wait, lane.wait ? waitWords(F, lane.wait) : null, lane.wait?.from),
    ...row(F.fields.engine, [engineOf(a), a.modelLabel ?? a.model].filter(Boolean).join(' · '), 'task'),
    ...row(F.fields.machine, machine ? machineName(machine) : null, 'task'),
    ...row(F.fields.head, card?.head ?? null, 'lane'),
    ...row(F.fields.pr, pr ? `#${prNumber(pr.url)}${pr.syncedAt ? '' : ' · ?'}` : null, pr?.syncedAt ? 'pr' : 'lane'),
    ...row(F.fields.dest, card?.dest ?? null, 'lane'),
    ...row(F.fields.next, card?.next ?? null, 'lane'),
    ...row(F.fields.updated, card?.updatedAt ? time(card.updatedAt) : time(a.updatedAt), card ? 'lane' : 'task'))
  const ds = decisionsFor(page.board, { card: card?.id ?? null, machine: machine?.label ?? null })
  const decisions = h('section', { class: 'here-decisions' }, h('h3', { text: F.decisionsHere }),
    ds.length ? h('ul', {}, ...ds.map((d) => h('li', {}, h('code', { text: decisionLabel(page.board, d) }), ` ${d.question}`, d.answer ? h('strong', { text: ` → ${d.answer}` }) : h('em', { class: 'attn', text: ` · ${F.statuses.pending}` })))) : h('p', { class: 'muted', text: F.none }))
  const supOf = machine?.supervisor?.agent ?? null
  const handoffState = card?.handoff
    ? h('p', { class: 'muted' }, card.handoff.acceptedAt ? F.handoffDone(card.handoff.to.title ?? card.handoff.to.session.slice(0, 8)) : F.handoffWait(card.handoff.to.title ?? card.handoff.to.session.slice(0, 8)),
      !card.handoff.acceptedAt ? h('button', { class: 'plain', text: F.cancelHandoff, onclick: () => page.quietly(page.change({ type: 'handoff.cancel', card: card.id })) }) : null)
    : null
  const toggle = (key) => () => { page.pane = page.pane === key ? null : key; page.render() }
  const buttons = h('div', { class: 'row' },
    !lane.supervisor ? h('button', { 'aria-expanded': String(page.pane === 'parent'), onclick: toggle('parent') }, icon('git-fork'), F.reparent) : null,
    !lane.supervisor ? h('button', { 'aria-expanded': String(page.pane === 'handoff'), onclick: toggle('handoff') }, icon('arrow-right-left'), F.handoff) : null,
    lane.supervisor ? null : h('button', { class: 'danger', 'aria-expanded': String(page.pane === 'archive'), onclick: toggle('archive') }, icon('archive'), F.archive),
    supervisorToggle(page, lane, F))
  const form = page.pane === 'parent' ? parentForm(page, lane, supOf, F) : page.pane === 'handoff' ? handoffForm(page, lane, card, F) : page.pane === 'archive' ? archiveForm(page, lane, supOf, machine, F) : null
  return [h('h3', { text: F.details }), details, decisions, handoffState, buttons, form]
}

function supervisorToggle(page, lane, F) {
  const { h, icon } = page
  const a = lane.agent
  const named = Boolean(page.board?.fleet?.supervisors?.[a.sessionId])
  if (!lane.supervisor && a.parentAgentId && page.agents.some((x) => x.agentId === a.parentAgentId && (x.deviceId ?? null) === (a.deviceId ?? null))) return null
  return h('button', { class: 'plain', onclick: () => page.quietly(page.change({ type: 'fleet.supervisor', session: a.sessionId, title: a.title ?? undefined, on: !named })) }, icon('crown'), named ? F.unmarkSupervisor : lane.supervisor ? F.pinSupervisor : F.markSupervisor)
}

function parentForm(page, lane, supOf, F) {
  const { h } = page
  const choices = parentChoices(page.fleet, lane)
  let pick = choices.find((c) => c.current)?.agent.agentId ?? null
  const go = h('button', { class: 'primary', text: F.reparentGo, disabled: true })
  const list = h('ul', { class: 'choices' }, ...choices.map((c) => h('li', {}, h('label', {},
    h('input', { type: 'radio', name: 'parent', value: c.agent.agentId, checked: c.current, onchange: () => { pick = c.agent.agentId; go.disabled = c.current } }),
    ` ${nameOf(c.agent)}`, c.supervisor ? h('small', { class: 'muted', text: ` · ${F.supervisor}` }) : null, c.current ? h('small', { class: 'muted', text: ` · ${F.current}` }) : null))))
  go.addEventListener('click', async () => {
    const parent = choices.find((c) => c.agent.agentId === pick)?.agent
    if (!parent || !supOf) return
    if (await page.tell(supOf.agentId, F.toSupervisorParent(lane.agent, parent, F.cardNote(page.boardRef().id, lane.card?.id)))) { page.pane = null; page.note(F.asked(supOf.title ?? '')); page.render() }
  })
  return h('section', { class: 'pane' }, h('p', { class: 'muted', text: F.reparentHint }), supOf ? list : h('p', { class: 'attn', text: F.noSup }), supOf ? go : null)
}

function handoffForm(page, lane, card, F) {
  const { h } = page
  if (!card) return h('section', { class: 'pane' }, h('p', { class: 'attn', text: F.noCard }))
  const others = page.agents.filter((x) => x.agentId !== lane.agent.agentId)
    .sort((x, y) => Number((y.deviceId ?? null) === (lane.agent.deviceId ?? null)) - Number((x.deviceId ?? null) === (lane.agent.deviceId ?? null)))
  const select = h('select', { 'aria-label': F.handoffTo }, ...others.map((x) => h('option', { value: x.agentId, text: `${nameOf(x)} · ${x.deviceLabel ?? ''}` })))
  const go = h('button', { class: 'primary', text: F.handoffGo, onclick: async () => {
    const to = others.find((x) => x.agentId === select.value)
    if (!to) return
    try {
      await page.change({ type: 'handoff.offer', card: card.id, to: { session: to.sessionId, agent: to.agentId, title: to.title ?? undefined } })
    } catch { return }
    if (await page.tell(to.agentId, F.toHandoff(lane.agent, card.id, page.boardRef().id))) { page.pane = null; page.note(F.asked(to.title ?? '')); page.render() }
  } })
  return h('section', { class: 'pane' }, h('label', { class: 'stack' }, F.handoffTo, select), go)
}

function archiveForm(page, lane, supOf, machine, F) {
  const { h, icon } = page
  const checks = archiveChecks(lane, machine)
  const name = nameOf(lane.agent)
  const typed = h('input', { type: 'text', placeholder: name, 'aria-label': F.archiveType })
  const go = h('button', { class: 'danger', text: F.archiveGo, disabled: true })
  const ready = () => checks.every((c) => c.ok) && supOf && typed.value.trim() === name
  typed.addEventListener('input', () => { go.disabled = !ready() })
  go.addEventListener('click', async () => {
    if (!ready()) return
    if (!(await page.tell(supOf.agentId, F.toSupervisorArchive(lane.agent, F.cardNote(page.boardRef().id, lane.card?.id))))) return
    if (lane.card) page.quietly(page.change({ type: 'comment.add', card: lane.card.id, text: `${F.asked(supOf.title ?? '')} · ${F.archive}` }))
    page.pane = null
    page.note(F.asked(supOf.title ?? ''))
    page.render()
  })
  return h('section', { class: 'pane archive' },
    h('p', { class: 'attn', text: F.archiveWarn }),
    h('ul', { class: 'checks' }, ...checks.map((c) => h('li', { class: c.ok ? 'ok' : 'no' }, icon(c.ok ? 'check' : 'x'), ` ${F.checks[c.key]}${c.pr ? ` (#${c.pr})` : ''}`))),
    supOf ? null : h('p', { class: 'attn', text: F.noSup }),
    h('p', { class: 'muted', text: F.archiveRecheck }),
    h('label', { class: 'stack' }, F.archiveType, typed), go)
}

// ── 决策: what waits on the person, then the ledger ──────────────────────────

export function decisionsView(page) {
  const { h, t } = page
  const F = wordsFor(page.locale)
  const board = page.board
  const asks = asksOf(page).filter((x) => !x.card || shownBy(page, x.card))
  const waiting = h('section', { class: 'asking' }, h('h2', {}, F.asksTitle, h('small', { text: String(asks.length) })),
    asks.length ? h('ul', { class: 'ask-list' }, ...asks.map((x) => h('li', { class: 'ask' },
      h('div', { class: 'ask-top' }, x.agent ? face(page, x.agent) : null, x.agent ? h('button', { class: 'linkish', onclick: () => page.openMember(x.agent.agentId), text: nameOf(x.agent) }) : null,
        x.card ? h('button', { class: 'plain', onclick: () => page.openCard(x.card.id), text: x.card.title }) : h('code', { text: decisionLabel(board, x.decision) }),
        x.wait.since ? h('gugu-time', { datetime: x.wait.since }) : null),
      h('p', { class: 'q', text: x.decision?.question ?? x.wait.text ?? '' }), answerRow(page, x, F)))) : h('p', { class: 'muted', text: F.asksNone }))

  const all = decisionsInOrder(board)
  const filter = page.ledgerFilter
  const shown = all.filter((d) => filter === 'all' || (filter === 'pending' ? d.status === 'pending' : d.status === 'decided')).reverse()
  const tabs = h('div', { class: 'strip' }, ...['live', 'pending', 'all'].map((k) => h('button', { class: `chip${filter === k ? ' on' : ''}`, onclick: () => { page.ledgerFilter = k; page.render() } }, F.ledger[k])))
  const scopeLabel = (d) => {
    const s = d.scope ?? { kind: 'fleet' }
    const ref = s.kind === 'lane' ? board.cards[s.ref]?.title ?? s.ref : s.ref
    return `${F.scopes[s.kind]}${ref ? ` · ${ref}` : ''}`
  }
  const row = (d) => h('li', { class: `decision ${d.status}` },
    h('div', { class: 'top' }, h('code', { text: decisionLabel(board, d) }), h('span', { class: 'scope', text: scopeLabel(d) }), h('small', { class: `status ${d.status}`, text: F.statuses[d.status] }), h('gugu-time', { datetime: d.decidedAt ?? d.at })),
    h('p', {}, h('span', { text: d.question }), d.answer ? h('strong', { text: ` → ${d.answer}` }) : null),
    h('div', { class: 'row' },
      d.card && board.cards[d.card] ? h('button', { class: 'plain', onclick: () => page.openCard(d.card), text: board.cards[d.card].title }) : null,
      d.message ? h('button', { class: 'plain', onclick: () => page.g.showMessage(`msg:${d.message}`).catch(page.said) }, page.icon('message-square'), F.ledger.source) : null,
      d.status === 'pending' || d.status === 'decided' ? h('button', { class: 'plain', text: F.ledger.withdraw, onclick: () => page.quietly(page.change({ type: 'decision.close', decision: d.id, status: 'withdrawn' })) }) : null))
  const ledger = h('section', { class: 'ledger-sec' }, h('h2', {}, t.ledgerTitle), tabs, addDecisionForm(page, F),
    shown.length ? h('ul', { class: 'ledger' }, ...shown.map(row)) : h('p', { class: 'muted', text: F.ledger.none }))
  return h('div', { class: 'decisions' }, waiting, ledger)
}

function addDecisionForm(page, F) {
  const { h } = page
  const board = page.board
  const question = h('input', { type: 'text', 'aria-label': F.ledger.question, placeholder: F.ledger.question })
  const answer = h('input', { type: 'text', 'aria-label': F.ledger.answer, placeholder: F.ledger.answer })
  const scope = h('select', { 'aria-label': F.ledger.scope }, ...['fleet', 'machine', 'release', 'lane'].map((k) => h('option', { value: k, text: F.scopes[k] })))
  const ref = h('input', { type: 'text', 'aria-label': F.ledger.ref, placeholder: F.ledger.ref, list: 'refs' })
  const refs = h('datalist', { id: 'refs' }, ...(page.fleet?.machines ?? []).map((m) => h('option', { value: machineName(m) })), ...Object.values(board.cards).filter((c) => c.dest).map((c) => h('option', { value: c.dest })))
  const save = h('button', { class: 'primary', text: F.ledger.save, onclick: () => {
    if (!question.value.trim()) return
    const kind = scope.value
    const cardId = kind === 'lane' ? Object.values(board.cards).find((c) => c.title === ref.value.trim() || c.id === ref.value.trim())?.id : null
    page.quietly(page.change({ type: 'decision.create', question: question.value, answer: answer.value, scope: kind === 'fleet' ? { kind } : { kind, ref: cardId ?? ref.value }, ...(cardId ? { card: cardId } : {}) })
      .then(() => { question.value = ''; answer.value = '' }))
  } })
  return h('details', { class: 'add-decision' }, h('summary', { text: F.ledger.add }), h('div', { class: 'stack' }, question, answer, h('div', { class: 'row' }, scope, ref, refs), save))
}
