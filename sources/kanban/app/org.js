// 舰队 — the fleet's org chart: the person, each machine's supervisor, the lanes under it, on one page across every
// computer. Read from gugu's agent list (every computer's, `agents:read:all-machines`) and joined with a chat's board
// (the lanes' cards: what they wait on, where they go, their pull request) and its decision ledger. Built in layers
// (owner 11-07): first what waits on the person, then who waits on what else, then the chart; a lane opens to its
// essentials and its actions, the rest one click further.
import { openChatBoard, applyToFile, filled, BOARD_SUFFIX, CHAT_BOARD_NAME } from './lib/chat-board.js'
import { decisionsInOrder, prNumber } from './lib/core.js'
import { fleetOf, archiveChecks, parentChoices, decisionsFor, prOf, WAIT_ORDER } from './lib/fleet.js'
import { wordsFor, engineOf } from './lib/fleet-text.js'

const g = window.gugu
const $ = (id) => document.getElementById(id)

let ctx = await g.getContext()
let t = wordsFor(ctx.locale)
let home = null // { f, entry } — the board shown, a chat's board file
let board = null
let report = null // listAgents({ report: true })
let view = 'org'
let focus = null // a wait kind the chart is narrowed to
let selected = null // the open lane's agentId
let fleet = null
let more = false // the open lane's second layer
let pane = null // which action form is open under it: 'parent' | 'handoff' | 'archive'
const openEnded = new Set() // machines whose ended lanes are unfolded
let visible = ctx.layout?.visible ?? true
let wanted = null // a board named by a link (query.board)

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value)
    else if (key === 'text') el.textContent = value
    else el.setAttribute(key, value === true ? '' : String(value))
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid)
  return el
}
const icon = (name) => h('gugu-icon', { name })
const time = (iso) => (iso ? h('gugu-time', { datetime: iso }) : null)

function showAlert(message) {
  $('alert').replaceChildren(...(message ? [h('span', { text: message }), h('button', { class: 'plain', 'aria-label': 'close', onclick: () => showAlert(null) }, icon('x'))] : []))
  $('alert').hidden = !message
}
const said = (error) => showAlert(error?.message ?? String(error))

const me = () => home?.f.presence?.self?.userId ?? 'person'
function change(op) {
  if (!home) return Promise.reject(new Error(t.noBoard))
  return new Promise((resolve) => resolve(applyToFile(home.f, op, me()))).catch((error) => { said(error); throw error })
}
const quietly = (p) => p.catch(() => {})

/** Tell an agent something, from the person's click. Resolves true when sent. */
async function tell(agentId, text) {
  try {
    await g.dispatch(text, { to: { agent: agentId } })
    return true
  } catch (error) {
    said(error)
    return false
  }
}

// ── reading ──────────────────────────────────────────────────────────────────

let asking = null
function askAgents() {
  if (typeof g.listAgents !== 'function') return null
  if (asking) return asking
  asking = g.listAgents({ report: true }).then((answer) => {
    report = Array.isArray(answer) ? { agents: answer, devices: [], unreached: [] } : answer
  }).catch(said).finally(() => {
    asking = null
    render()
  })
  return asking
}

async function showBoard(open) {
  home?.f.close()
  home = null
  board = null
  try {
    const f = filled(await open())
    home = { f, entry: f.entry }
    board = f.toJSON()
    f.onChange(({ local }) => {
      board = f.toJSON()
      render()
      if (!local) askAgents()
    })
    f.onStatus((status) => { if (status === 'gone') showAlert(t.cardGone) })
  } catch (error) {
    said(error)
  }
  render()
}

/** Which board: one a link named, the chat's own, or — outside a chat — the first fleet board the person can reach. */
async function chooseBoard() {
  if (wanted) return showBoard(() => g.files.open({ id: wanted, ...(ctx.chat ? { chat: ctx.chat.id } : {}) }))
  if (ctx.chat && !ctx.workspace) return showBoard(() => openChatBoard(g.files, ctx.chat.id))
  const found = (await g.files.search({ query: BOARD_SUFFIX, suffixes: ['.json'], limit: 50 }).catch(() => []))
    .filter((e) => e.type !== 'folder' && e.name.endsWith(BOARD_SUFFIX))
  const select = $('where')
  select.replaceChildren(...found.map((e) => h('option', { value: e.id, text: [e.chatName, e.name === CHAT_BOARD_NAME ? null : e.name.slice(0, -BOARD_SUFFIX.length)].filter(Boolean).join(' · ') })))
  select.hidden = found.length < 2
  select.setAttribute('aria-label', t.pickBoard)
  select.onchange = () => { const e = found.find((x) => x.id === select.value); if (e) showBoard(() => g.files.open(e)) }
  if (found.length) await showBoard(() => g.files.open(found[0]))
  else render()
}

// ── drawing ──────────────────────────────────────────────────────────────────

const laneName = (lane) => lane.agent.title ?? lane.card?.title ?? lane.agent.sessionId.slice(0, 8)
const machineName = (m) => m?.label ?? (m?.thisMachine ? 'this computer' : '?')
const engineTag = (agent) => { const e = engineOf(agent); return e ? h('span', { class: `engine ${e.toLowerCase()}`, text: e }) : null }
const findLane = (agentId) => fleet?.all.find((x) => x.lane.agent.agentId === agentId) ?? fleet?.machines.flatMap((m) => (m.supervisor?.agent.agentId === agentId ? [{ lane: m.supervisor.lane, machine: m }] : []))[0] ?? null

function render() {
  if (!report) return
  fleet = fleetOf(report, board)
  const c = fleet.counts
  $('heading').textContent = t.title
  $('summary').textContent = [t.machines(c.online, c.machines), home ? null : t.noBoard].filter(Boolean).join(' · ')
  g.setTabBadge(c.owner || null).catch((error) => g.reportError(`setTabBadge: ${error?.message ?? error}`))
  const pending = decisionsInOrder(board ?? {}).filter((d) => d.status === 'pending').length
  $('views').replaceChildren(...['org', 'ledger'].map((key) => h('button', { role: 'tab', 'aria-selected': view === key ? 'true' : 'false', onclick: () => { view = key; render() } },
    t.views[key], key === 'ledger' && pending ? h('small', { class: 'attn', text: String(pending) }) : null)))
  const scroll = $('content').scrollTop
  $('content').replaceChildren(...(view === 'ledger' ? ledgerView() : [asksView(), waitsStrip(), orgView()]))
  $('content').scrollTop = scroll
  if (selected) {
    const found = findLane(selected)
    if (found) drawLane(found)
    else closeLane()
  }
}

/** Layer 0: what only the person can unblock, each with its answer one click away. */
function asksView() {
  const asks = fleet.waits.filter(({ lane }) => lane.wait.kind === 'owner')
  const head = h('h2', { class: 'section' }, t.asksTitle, asks.length ? h('small', { class: 'attn', text: String(asks.length) }) : null)
  if (!asks.length) return h('section', { class: 'asks empty' }, head, h('p', { class: 'muted', text: t.asksNone }))
  return h('section', { class: 'asks' }, head, h('ul', {}, ...asks.map(({ lane, machine }) => h('li', { class: 'ask' }, askBody(lane, machine)))))
}

function askBody(lane, machine) {
  const decision = lane.wait.decision ? board?.decisions?.[lane.wait.decision] : null
  const top = h('div', { class: 'ask-top' },
    h('button', { class: 'linkish', onclick: () => openLane(lane.agent.agentId), text: laneName(lane) }),
    h('small', { class: 'muted', text: machineName(machine) }), time(lane.wait.since))
  if (decision) {
    const free = h('input', { type: 'text', placeholder: t.say, 'aria-label': t.say })
    const decide = (answer) => decideAsk(decision, lane, answer)
    free.addEventListener('keydown', (e) => { if (e.key === 'Enter' && free.value.trim()) decide(free.value.trim()) })
    return [top, h('p', { class: 'q', text: decision.question }),
      h('div', { class: 'opts' }, ...decision.options.map((o) => h('button', { text: o, onclick: () => decide(o) })), free)]
  }
  if (lane.wait.from === 'task') return [top, h('p', { class: 'q', text: t.states[lane.state.key] }), h('div', { class: 'opts' }, h('button', { class: 'primary', text: t.toTask, onclick: () => g.showSession(lane.agent.sessionId).catch(said) }))]
  const free = h('input', { type: 'text', placeholder: t.say, 'aria-label': t.reply })
  const send = async () => { if (free.value.trim() && (await tell(lane.agent.agentId, free.value.trim()))) { free.value = ''; showAlert(t.sent) } }
  free.addEventListener('keydown', (e) => { if (e.key === 'Enter') send() })
  return [top, lane.wait.text ? h('p', { class: 'q', text: lane.wait.text }) : null, h('div', { class: 'opts' }, free, h('button', { text: t.reply, onclick: send }))]
}

/** The person's answer: recorded in the ledger first (it holds even if the lane cannot be told), then told to the lane. */
async function decideAsk(decision, lane, answer) {
  try {
    await change({ type: 'decision.decide', decision: decision.id, answer })
  } catch { return }
  const done = board.decisions[decision.id]
  if (await tell(lane.agent.agentId, t.toDecision(done))) showAlert(t.decidedNote(done.n))
}

/** Layer 1: everyone else's waits, as counts; a click narrows the chart to that kind. */
function waitsStrip() {
  const kinds = WAIT_ORDER.filter((k) => k !== 'owner').map((k) => [k, fleet.waits.filter(({ lane }) => lane.wait.kind === k).length]).filter(([, n]) => n)
  const c = fleet.counts
  return h('nav', { class: 'strip', 'aria-label': t.others },
    h('button', { class: `chip${focus === null ? ' on' : ''}`, onclick: () => { focus = null; render() } }, t.allLanes, h('small', { text: String(c.lanes) })),
    h('button', { class: `chip tone-run${focus === 'run' ? ' on' : ''}`, onclick: () => { focus = focus === 'run' ? null : 'run'; render() } }, h('i', { class: 'dot' }), t.counts.running, h('small', { text: String(c.running) })),
    ...kinds.map(([k, n]) => h('button', { class: `chip tone-${k}${focus === k ? ' on' : ''}`, onclick: () => { focus = focus === k ? null : k; render() } }, h('i', { class: 'dot' }), t.waits[k], h('small', { text: String(n) }))))
}

/** Layer 2: the chart. The person, then one column per machine: its supervisor and the lanes under it. */
function orgView() {
  const person = h('div', { class: 'person' }, h('strong', { text: t.you }))
  const columns = h('div', { class: 'machines' }, ...fleet.machines.map(machineView))
  const loose = fleet.loose.length
    ? h('section', { class: 'loose' }, h('h3', { text: t.loose }), h('ul', {}, ...fleet.loose.map(({ card }) => h('li', { class: 'muted', text: card.title }))))
    : null
  return h('section', { class: 'org' }, person, h('div', { class: 'stem', 'aria-hidden': 'true' }), columns, loose)
}

function machineView(m) {
  const sup = m.supervisor
  const lanes = m.lanes
  const ended = (l) => l.tone === 'idle' && !l.wait && !l.children.length && (l.state.key === 'done' || l.state.key === 'stopped' || l.state.key === 'gone')
  const active = lanes.filter((l) => !ended(l))
  const rest = lanes.filter(ended)
  const key = m.deviceId ?? 'here'
  const head = h('button', { class: 'sup', onclick: () => sup && openLane(sup.agent.agentId), disabled: !sup },
    h('span', { class: 'row' }, h('strong', { text: sup ? sup.agent.title ?? t.supervisor : m.online ? t.noSupervisor : machineName(m) }), sup ? engineTag(sup.agent) : null, sup ? h('span', { class: 'lock', title: t.locked }, icon('lock')) : null),
    h('small', { class: 'mach' }, h('i', { class: `dot ${m.online ? 'on' : 'off'}` }), machineName(m), m.online ? ` · ${t.lanes(m.counts.lanes)}` : ` · ${t.offline} · ${t.offlineSince}`))
  return h('section', { class: `machine${m.online ? '' : ' offline'}`, 'aria-label': machineName(m) },
    head,
    h('ul', { class: 'lanes' }, ...active.flatMap((l) => laneItems(l))),
    rest.length ? h('button', { class: 'plain fold', 'aria-expanded': openEnded.has(key) ? 'true' : 'false', onclick: () => { openEnded.has(key) ? openEnded.delete(key) : openEnded.add(key); render() } },
      icon(openEnded.has(key) ? 'chevron-down' : 'chevron-right'), t.ended(rest.length)) : null,
    rest.length && openEnded.has(key) ? h('ul', { class: 'lanes ended' }, ...rest.flatMap((l) => laneItems(l))) : null)
}

function laneItems(lane) {
  const dim = focus !== null && lane.tone !== focus
  const wait = lane.wait
  const line = wait
    ? h('span', { class: `wait tone-${wait.kind}` }, h('i', { class: 'dot' }), [t.waitShort[wait.kind], wait.from === 'decision' ? null : wait.text].filter(Boolean).join(' · '), wait.drift ? h('span', { class: 'drift', title: t.drift, text: ' ⚠' }) : null)
    : lane.card?.next ? h('span', { class: 'next', text: lane.card.next }) : h('span', { class: 'next muted', text: t.states[lane.state.key] })
  const item = h('li', { class: `lane tone-${lane.tone}${lane.stale ? ' stale' : ''}${dim ? ' dim' : ''}${selected === lane.agent.agentId ? ' selected' : ''}`, style: lane.depth ? `--depth:${lane.depth}` : null },
    h('button', { class: 'lane-card', onclick: () => openLane(lane.agent.agentId), title: lane.stale ? t.stale : undefined },
      h('span', { class: 'top' }, h('strong', { text: laneName(lane) }), engineTag(lane.agent),
        lane.unplaced ? h('span', { class: 'flag', title: t.unplaced }, icon('unlink')) : null,
        lane.crossMachine ? h('span', { class: 'flag', title: t.crossMachine }, icon('shuffle')) : null),
      line,
      lane.card?.dest ? h('span', { class: 'dest', text: lane.card.dest }) : null))
  return [item, ...lane.children.flatMap(laneItems)]
}

// ── one lane, opened ─────────────────────────────────────────────────────────

function openLane(agentId) {
  if (selected !== agentId) { more = false; pane = null }
  selected = agentId
  $('shell').classList.add('open')
  render()
}

function closeLane() {
  selected = null
  $('drawer').hidden = true
  $('drawer').replaceChildren()
  $('shell').classList.remove('open')
  $('content').before($('alert'))
}

function drawLane({ lane, machine }) {
  const a = lane.agent
  const card = lane.card
  const pr = card ? prOf(card) : null
  const parent = report.agents.find((x) => x.agentId === a.parentAgentId)
  const sub = parent ? t.on(machineName(machine), parent.title ?? parent.sessionId.slice(0, 8)) : t.rootOn(machineName(machine))
  const head = h('header', { class: 'head' },
    h('div', {}, h('h2', { id: 'd-title' }, laneName(lane), engineTag(a), lane.supervisor ? h('span', { class: 'lock', title: t.locked }, icon('lock')) : null), h('small', { class: 'muted', text: sub })),
    h('button', { class: 'plain', 'aria-label': 'close', onclick: () => { closeLane(); render() } }, icon('x')))
  const wait = lane.wait
  const essentials = h('div', { class: 'essentials' },
    wait ? h('p', { class: `big-wait tone-${wait.kind}` }, h('i', { class: 'dot' }), h('strong', { text: t.waits[wait.kind] }), wait.text ? h('span', { text: ` · ${wait.text}` }) : null, time(wait.since))
      : h('p', { class: `big-wait tone-${lane.tone}` }, h('i', { class: 'dot' }), h('strong', { text: t.states[lane.state.key] })),
    card?.next ? h('p', { text: card.next }) : null,
    h('p', { class: 'facts' },
      card?.dest ? h('span', { class: 'dest', text: card.dest }) : null,
      pr ? h('span', { class: 'chip' }, `#${prNumber(pr.url)}`, prState(pr, card)) : null,
      card?.head ? h('code', { text: card.head.slice(0, 7) }) : null))
  const askHere = wait?.kind === 'owner' ? h('div', { class: 'ask here' }, askBody(lane, machine)) : null

  const box = h('textarea', { rows: 2, placeholder: t.messagePlaceholder(laneName(lane)), 'aria-label': t.message })
  const send = h('button', { class: 'primary', text: t.send, onclick: async () => { if (box.value.trim() && (await tell(a.agentId, box.value.trim()))) { box.value = ''; showAlert(t.sent) } } })
  const acts = h('div', { class: 'acts' },
    h('div', { class: 'compose' }, box, send),
    h('div', { class: 'row' },
      h('button', { onclick: () => g.showSession(a.sessionId, { peek: true }).catch(said) }, icon('messages-square'), t.transcript),
      pr ? h('button', { onclick: () => g.openBrowserTab(pr.url).catch(said) }, icon('git-pull-request'), t.openPr(prNumber(pr.url))) : null,
      h('button', { class: 'plain', 'aria-expanded': more ? 'true' : 'false', onclick: () => { more = !more; pane = null; render() } }, icon(more ? 'chevron-up' : 'chevron-down'), more ? t.less : t.more)))

  const kids = [head, essentials, askHere, acts]
  if (more) kids.push(...moreLayer(lane, machine, pr))
  // Keep the person's half-written message across a re-draw.
  const old = $('drawer').querySelector('textarea')
  if (old?.value) box.value = old.value
  $('drawer').replaceChildren($('alert'), ...kids.filter(Boolean))
  $('drawer').hidden = false
}

function prState(pr, card) {
  const parts = []
  if (pr.merged) parts.push(t.pr.merged)
  else if (pr.closed) parts.push(t.pr.closed)
  else {
    if (pr.ci) parts.push(t.pr[pr.ci])
    if (pr.review) parts.push(t.pr[pr.review])
  }
  const mismatch = pr.head && card?.head && !pr.head.startsWith(card.head) && !card.head.startsWith(pr.head)
  return [parts.length ? h('span', { text: ` · ${parts.join(' · ')}` }) : null, mismatch ? h('span', { class: 'drift', title: t.pr.mismatch, text: ' ⚠' }) : null]
}

/** Layer 3: every field with where it comes from, the decisions on this lane, and the actions that change the fleet. */
function moreLayer(lane, machine, pr) {
  const a = lane.agent
  const card = lane.card
  const row = (label, value, from) => (value ? [h('dt', { text: label }), h('dd', {}, value, from ? h('small', { class: 'src', text: t.from[from] }) : null)] : [])
  const details = h('dl', { class: 'fields' },
    ...row(t.fields.state, t.states[lane.state.key], 'task'),
    ...row(t.fields.wait, lane.wait ? `${t.waits[lane.wait.kind]}${lane.wait.text ? ` · ${lane.wait.text}` : ''}` : null, lane.wait?.from),
    ...row(t.fields.engine, [engineOf(a), a.modelLabel ?? a.model].filter(Boolean).join(' · '), 'task'),
    ...row(t.fields.machine, machineName(machine), 'task'),
    ...row(t.fields.head, card?.head ?? null, 'lane'),
    ...row(t.fields.pr, pr ? `#${prNumber(pr.url)}${pr.syncedAt ? '' : ' · ?'}` : null, pr?.syncedAt ? 'pr' : 'lane'),
    ...row(t.fields.dest, card?.dest ?? null, 'lane'),
    ...row(t.fields.next, card?.next ?? null, 'lane'),
    ...row(t.fields.updated, card?.updatedAt ? time(card.updatedAt) : time(a.updatedAt), card ? 'lane' : 'task'))
  const ds = card ? decisionsFor(board, { card: card.id, machine: machine.label }) : decisionsFor(board, { machine: machine.label })
  const decisions = h('section', { class: 'here-decisions' }, h('h3', { text: t.decisionsHere }),
    ds.length ? h('ul', {}, ...ds.map((d) => h('li', {}, h('code', { text: `D-${d.n}` }), ` ${d.question}`, d.answer ? h('strong', { text: ` → ${d.answer}` }) : h('em', { class: 'attn', text: ` · ${t.statuses.pending}` })))) : h('p', { class: 'muted', text: t.none }))

  const supOf = machine.supervisor?.agent ?? null
  const handoffState = card?.handoff
    ? h('p', { class: 'muted' }, card.handoff.acceptedAt ? t.handoffDone(card.handoff.to.title ?? card.handoff.to.session.slice(0, 8)) : t.handoffWait(card.handoff.to.title ?? card.handoff.to.session.slice(0, 8)),
      !card.handoff.acceptedAt ? h('button', { class: 'plain', text: t.cancelHandoff, onclick: () => quietly(change({ type: 'handoff.cancel', card: card.id })) }) : null)
    : null
  const buttons = h('div', { class: 'row' },
    !lane.supervisor ? h('button', { 'aria-expanded': pane === 'parent' ? 'true' : 'false', onclick: () => { pane = pane === 'parent' ? null : 'parent'; render() } }, icon('git-fork'), t.reparent) : null,
    !lane.supervisor ? h('button', { 'aria-expanded': pane === 'handoff' ? 'true' : 'false', onclick: () => { pane = pane === 'handoff' ? null : 'handoff'; render() } }, icon('arrow-right-left'), t.handoff) : null,
    lane.supervisor ? null : h('button', { class: 'danger', 'aria-expanded': pane === 'archive' ? 'true' : 'false', onclick: () => { pane = pane === 'archive' ? null : 'archive'; render() } }, icon('archive'), t.archive),
    supervisorToggle(lane))
  const form = pane === 'parent' ? parentForm(lane, supOf) : pane === 'handoff' ? handoffForm(lane) : pane === 'archive' ? archiveForm(lane, supOf) : null
  return [h('h3', { text: t.details }), details, decisions, handoffState, buttons, form]
}

function supervisorToggle(lane) {
  const a = lane.agent
  const named = Boolean(board?.fleet?.supervisors?.[a.sessionId])
  if (!home || (!lane.supervisor && a.parentAgentId && report.agents.some((x) => x.agentId === a.parentAgentId && (x.deviceId ?? null) === (a.deviceId ?? null)))) return null
  return h('button', { class: 'plain', onclick: () => quietly(change({ type: 'fleet.supervisor', session: a.sessionId, title: a.title ?? undefined, on: !named })) }, icon('crown'), named ? t.unmarkSupervisor : lane.supervisor ? t.pinSupervisor : t.markSupervisor)
}

function parentForm(lane, supOf) {
  const choices = parentChoices(fleet, lane)
  let pick = choices.find((c) => c.current)?.agent.agentId ?? null
  const go = h('button', { class: 'primary', text: t.reparentGo, disabled: true })
  const list = h('ul', { class: 'choices' }, ...choices.map((c) => h('li', {}, h('label', {},
    h('input', { type: 'radio', name: 'parent', value: c.agent.agentId, checked: c.current, onchange: () => { pick = c.agent.agentId; go.disabled = c.current } }),
    ` ${c.agent.title ?? c.agent.sessionId.slice(0, 8)}`, c.supervisor ? h('small', { class: 'muted', text: ` · ${t.supervisor}` }) : null, c.current ? h('small', { class: 'muted', text: ` · ${t.current}` }) : null))))
  go.addEventListener('click', async () => {
    const parent = choices.find((c) => c.agent.agentId === pick)?.agent
    if (!parent || !supOf) return
    if (await tell(supOf.agentId, t.toSupervisorParent(lane.agent, parent, t.cardNote(home?.entry.id, lane.card?.id)))) { pane = null; showAlert(t.asked(supOf.title ?? '')); render() }
  })
  return h('section', { class: 'pane' }, h('p', { class: 'muted', text: t.reparentHint }), supOf ? list : h('p', { class: 'attn', text: t.noSup }), supOf ? go : null)
}

function handoffForm(lane) {
  if (!lane.card || !home) return h('section', { class: 'pane' }, h('p', { class: 'attn', text: t.noCard }))
  const others = report.agents.filter((x) => x.agentId !== lane.agent.agentId)
    .sort((x, y) => Number((y.deviceId ?? null) === (lane.agent.deviceId ?? null)) - Number((x.deviceId ?? null) === (lane.agent.deviceId ?? null)))
  const select = h('select', { 'aria-label': t.handoffTo }, ...others.map((x) => h('option', { value: x.agentId, text: `${x.title ?? x.sessionId.slice(0, 8)} · ${x.deviceLabel ?? ''}` })))
  const go = h('button', { class: 'primary', text: t.handoffGo, onclick: async () => {
    const to = others.find((x) => x.agentId === select.value)
    if (!to) return
    try {
      await change({ type: 'handoff.offer', card: lane.card.id, to: { session: to.sessionId, agent: to.agentId, title: to.title ?? undefined } })
    } catch { return }
    if (await tell(to.agentId, t.toHandoff(lane.agent, lane.card.id, home.entry.id))) { pane = null; showAlert(t.asked(to.title ?? '')); render() }
  } })
  return h('section', { class: 'pane' }, h('label', { class: 'stack' }, t.handoffTo, select), go)
}

function archiveForm(lane, supOf) {
  const checks = archiveChecks(lane)
  const name = laneName(lane)
  const typed = h('input', { type: 'text', placeholder: name, 'aria-label': t.archiveType })
  const go = h('button', { class: 'danger', text: t.archiveGo, disabled: true })
  const ready = () => checks.every((c) => c.ok) && supOf && typed.value.trim() === name
  typed.addEventListener('input', () => { go.disabled = !ready() })
  go.addEventListener('click', async () => {
    if (!ready()) return
    if (!(await tell(supOf.agentId, t.toSupervisorArchive(lane.agent, t.cardNote(home?.entry.id, lane.card?.id))))) return
    if (lane.card && home) quietly(change({ type: 'comment.add', card: lane.card.id, text: t.asked(supOf.title ?? '') + ` · ${t.archive}` }))
    pane = null
    showAlert(t.asked(supOf.title ?? ''))
    render()
  })
  return h('section', { class: 'pane archive' },
    h('p', { class: 'attn', text: t.archiveWarn }),
    h('ul', { class: 'checks' }, ...checks.map((c) => h('li', { class: c.ok ? 'ok' : 'no' }, icon(c.ok ? 'check' : 'x'), ` ${t.checks[c.key]}${c.pr ? ` (#${c.pr})` : ''}`))),
    supOf ? null : h('p', { class: 'attn', text: t.noSup }),
    h('label', { class: 'stack' }, t.archiveType, typed), go)
}

// ── the ledger ───────────────────────────────────────────────────────────────

let ledgerFilter = 'pending'
function ledgerView() {
  if (!home) return [h('p', { class: 'muted', text: t.noBoard })]
  const all = decisionsInOrder(board)
  const shown = all.filter((d) => ledgerFilter === 'all' || (ledgerFilter === 'pending' ? d.status === 'pending' : d.status === 'decided')).reverse()
  const tabs = h('div', { class: 'strip' }, ...['pending', 'live', 'all'].map((k) => h('button', { class: `chip${ledgerFilter === k ? ' on' : ''}`, onclick: () => { ledgerFilter = k; render() } }, t.ledger[k])))
  const scopeLabel = (d) => {
    const s = d.scope ?? { kind: 'fleet' }
    const ref = s.kind === 'lane' ? board.cards[s.ref]?.title ?? s.ref : s.ref
    return `${t.scopes[s.kind]}${ref ? ` · ${ref}` : ''}`
  }
  const row = (d) => h('li', { class: `decision ${d.status}` },
    h('div', { class: 'top' }, h('code', { text: `D-${d.n}` }), h('span', { class: 'scope', text: scopeLabel(d) }), h('small', { class: `status ${d.status}`, text: t.statuses[d.status] }), time(d.decidedAt ?? d.at)),
    h('p', {}, h('span', { text: d.question }), d.answer ? h('strong', { text: ` → ${d.answer}` }) : null),
    h('div', { class: 'row' },
      d.message ? h('button', { class: 'plain', onclick: () => g.showMessage(`msg:${d.message}`).catch(said) }, icon('message-square'), t.ledger.source) : null,
      d.status === 'pending' ? decideInline(d) : null,
      d.status === 'pending' || d.status === 'decided' ? h('button', { class: 'plain', text: t.ledger.withdraw, onclick: () => quietly(change({ type: 'decision.close', decision: d.id, status: 'withdrawn' })) }) : null))
  return [tabs, addDecisionForm(), shown.length ? h('ul', { class: 'ledger' }, ...shown.map(row)) : h('p', { class: 'muted', text: t.ledger.none })]
}

function decideInline(d) {
  const input = h('input', { type: 'text', placeholder: t.ledger.answer, 'aria-label': t.ledger.decide })
  const lane = d.card ? fleet.all.find(({ lane: l }) => l.card?.id === d.card)?.lane : null
  const decide = async (answer) => {
    if (!answer) return
    if (lane) return decideAsk(d, lane, answer)
    quietly(change({ type: 'decision.decide', decision: d.id, answer }))
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') decide(input.value.trim()) })
  return h('span', { class: 'opts' }, ...(d.options ?? []).map((o) => h('button', { text: o, onclick: () => decide(o) })), input)
}

function addDecisionForm() {
  const question = h('input', { type: 'text', 'aria-label': t.ledger.question, placeholder: t.ledger.question })
  const answer = h('input', { type: 'text', 'aria-label': t.ledger.answer, placeholder: t.ledger.answer })
  const scope = h('select', { 'aria-label': t.ledger.scope }, ...['fleet', 'machine', 'release', 'lane'].map((k) => h('option', { value: k, text: t.scopes[k] })))
  const ref = h('input', { type: 'text', 'aria-label': t.ledger.ref, placeholder: t.ledger.ref, list: 'refs' })
  const refs = h('datalist', { id: 'refs' }, ...fleet.machines.map((m) => h('option', { value: machineName(m) })), ...Object.values(board.cards).filter((c) => c.dest).map((c) => h('option', { value: c.dest })))
  const save = h('button', { class: 'primary', text: t.ledger.save, onclick: () => {
    if (!question.value.trim()) return
    const kind = scope.value
    const cardId = kind === 'lane' ? Object.values(board.cards).find((c) => c.title === ref.value.trim() || c.id === ref.value.trim())?.id : null
    quietly(change({ type: 'decision.create', question: question.value, answer: answer.value, scope: kind === 'fleet' ? { kind } : { kind, ref: cardId ?? ref.value }, ...(cardId ? { card: cardId } : {}) })
      .then(() => { question.value = ''; answer.value = '' }))
  } })
  return h('details', { class: 'add-decision' }, h('summary', { text: t.ledger.add }), h('div', { class: 'stack' }, question, answer, h('div', { class: 'row' }, scope, ref, refs), save))
}

// ── where the page is ───────────────────────────────────────────────────────

g.onLink?.(({ query }) => {
  if (query?.board && query.board !== home?.entry.id) {
    wanted = query.board
    chooseBoard()
  }
  if (query?.lane) openLane(query.lane)
})

g.onContextChanged(async () => {
  ctx = await g.getContext()
  t = wordsFor(ctx.locale)
  const now = ctx.layout?.visible ?? visible
  if (now && !visible) askAgents()
  visible = now
  render()
})

if (typeof g.onAgentsChanged === 'function') g.onAgentsChanged(() => askAgents())
// Other computers' agents are not pushed (onAgentsChanged is this computer's): read them again while the page is seen.
setInterval(() => { if (visible) askAgents() }, 60_000)

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selected && !event.target.closest?.('input, textarea, select')) { closeLane(); render() }
})

// Opened by the message card or a link, the board comes in its query; otherwise the chat's board (or the first found).
await chooseBoard()
await askAgents()
