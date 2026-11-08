import { el, character, sprite, bar, button, toneFor } from './pixel-kit.js'
import { wordsFor } from './words.js'

const g = window.gugu
const root = document.getElementById('app')
const dialog = document.getElementById('dialog')
let ctx = await g.getContext()
// The language is fixed when the page opens; the program is told the same one with each call.
const lang = String(ctx.locale ?? '').startsWith('zh') ? 'zh' : 'en'
const t = wordsFor(lang)
document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
document.title = t.app
for (const line of root.querySelectorAll('[role=status]')) line.textContent = t.finding
const settingsLink = await g.linkTo({ kind: 'app', tab: 'settings' })
let machines = []
let entries = []
let selected = null
let loading = false
let problem = ''

const address = (id) => id ? `device:${id.replace(/^device:/, '')}` : undefined
async function call(machine, tool, args = {}) {
  // Same MCP result contract and error handling as Teamboard's program calls.
  const answer = await g.callProgram(tool, { ...args, locale: lang }, { device: address(machine.id) })
  const text = answer.content?.find((part) => part.type === 'text')?.text || ''
  if (answer.isError) throw new Error(text || t.programFailed)
  return JSON.parse(text)
}
// A program call stops at its read budget and says how far it got; call again until it finishes.
async function settle(machine, tool, args, label) {
  machine.progress = { label }; render()
  for (let round = 0; ; round++) {
    const answer = await call(machine, tool, args)
    const progress = tool === 'discover' ? answer.history?.progress : answer.progress
    if (!progress || round >= 40) { machine.progress = null; return answer }
    machine.progress = { label, ...progress }; render()
  }
}
// Saved results carry the program's words, so each language keeps its own.
const SNAPSHOT = lang === 'zh' ? 'context-snapshot-v1' : 'context-snapshot-v1-en'
let lastAt = null
function saveSnapshot() {
  lastAt = Date.now()
  const plain = (m) => ({ id: m.id, name: m.name, online: m.online, thisMachine: m.thisMachine, unmapped: m.unmapped, error: m.error || null })
  try { localStorage.setItem(SNAPSHOT, JSON.stringify({ at: lastAt, machines: machines.map(plain), entries: entries.map((e) => ({ machine: e.machine.id, project: e.project, report: e.report, activity: e.activity })) })) } catch { /* A full store only costs the next open a recalculation. */ }
}
function loadSnapshot() {
  try {
    const saved = JSON.parse(localStorage.getItem(SNAPSHOT) || 'null')
    if (!saved) return false
    machines = saved.machines
    const byId = new Map(machines.map((m) => [m.id, m]))
    entries = saved.entries.filter((e) => byId.has(e.machine)).map((e) => ({ ...e, machine: byId.get(e.machine) }))
    lastAt = saved.at
    return true
  } catch { return false }
}
const harnesses = (entry) => [...new Set([...(entry.report?.capacities || []).map((c) => c.harness === 'claude' ? 'Claude' : 'Codex'), ...(entry.report?.instructions || []).flatMap((p) => /\/AGENTS(?:\.override)?\.md$/.test(p) ? ['Codex'] : /\/CLAUDE(?:\.local)?\.md$/.test(p) ? ['Claude'] : []), ...Object.entries(entry.activity?.sources || entry.report?.history?.sources || {}).filter(([, n]) => n > 0 || n === null).map(([s]) => s === 'claude-code' ? 'Claude' : 'Codex')])]
const groupKey = (entry) => entry.project.repositoryUrl ? entry.project.repositoryUrl : `${entry.machine.id || 'local'}:${entry.project.key}`

function combine(key, items) {
  const reports = items.map((e) => e.report).filter(Boolean)
  const ruleHits = new Map()
  for (const report of reports) for (const rule of report.rules) if (rule.count) ruleHits.set(rule.id, rule)
  const red = [...ruleHits.values()].filter((r) => r.severity === 'red').length
  const yellow = [...ruleHits.values()].filter((r) => r.severity === 'yellow').length
  const complete = reports.length === items.length && reports.every((r) => r.bars.health.complete)
  const hotKnown = items.every((e) => e.activity && e.activity.hot !== null)
  const hot = hotKnown ? new Set(items.flatMap((e) => e.activity.hotTasks)).size : null
  const capacity = reports.length === items.length ? Math.max(0, ...reports.map((r) => r.bars.capacity.ratio)) : null
  return { key, items, project: items[0].report?.project || items[0].project, bars: {
    hot: { count: hot, cells: hot === null ? null : Math.min(10, Math.ceil(Math.log2(hot + 1))) },
    health: { value: Math.max(0, 10 - red * 3 - yellow), red, yellow, complete },
    capacity: { ratio: capacity, percent: capacity === null ? null : Math.round(capacity * 100), cells: capacity === null ? null : Math.min(10, Math.max(capacity > 0 ? 1 : 0, Math.round(capacity * 10))) },
  } }
}
function groups() {
  return [...Map.groupBy(entries.filter((e) => !e.project.global), groupKey)]
    .map(([key, items]) => combine(key, items))
    .toSorted((a, b) => (b.bars.hot.count ?? -1) - (a.bars.hot.count ?? -1) || a.project.name.localeCompare(b.project.name))
}
const mainGroups = (all = groups()) => all.filter((group) => group.items.some((e) => e.project.hasContext || e.activity?.hot > 0)).slice(0, 8)

const icon = (name) => el('gugu-icon', { name })
const SEV = { red: 'alert-circle', yellow: 'alert-triangle', clean: 'sparkles', ok: 'check', none: 'circle' }
const machinePills = (items) => el('div', { class: 'machines' }, items.map((e) => el('span', { class: 'pill' }, icon('monitor'), e.machine.name, el('span', { class: 'h' }, harnesses(e).join(' · ')))))
function worst(group) {
  const hits = group.items.flatMap((e) => e.report?.rules || []).filter((r) => r.count)
  return hits.find((r) => r.severity === 'red') || hits.find((r) => r.severity === 'yellow') || null
}
function issueCell(group) {
  const first = worst(group)
  if (!first && !group.bars.health.complete) return el('div', { class: 'issue' }, el('span', { class: 'sev none' }, icon('circle')), el('span', { class: 'txt' }, t.readingHealth))
  if (first) return el('div', { class: 'issue' }, el('span', { class: `sev ${first.severity}` }, icon(SEV[first.severity])), el('span', { class: 'txt' }, `${first.title}${first.count > 1 ? t.spots(first.count) : ''}`))
  const clean = group.items.flatMap((e) => e.report?.rules || []).filter((r) => r.severity === 'clean' && r.count).reduce((n, r) => n + r.count, 0)
  return el('div', { class: 'issue ok' }, el('span', { class: `sev ${clean ? 'clean' : 'ok'}` }, icon(clean ? 'sparkles' : 'check')), el('span', { class: 'txt' }, clean ? t.noDeductions(clean) : t.noProblems))
}
function metric(kind, cells, text) { return el('div', { class: `metric ${toneFor(kind, cells)}` }, el('b', {}, text), bar(kind, cells)) }
function metrics(b) {
  return [
    metric('hot', b.hot.cells, b.hot.count === null ? t.notYet : t.perWeek(b.hot.count)),
    metric('health', b.health.complete ? b.health.value : null, b.health.complete ? `${b.health.value} / 10` : t.partlyMeasured),
    metric('capacity', b.capacity.cells, b.capacity.percent === null ? t.notYet : `${b.capacity.percent}%`),
  ]
}
function card(group) {
  return el('button', { type: 'button', class: 'prow', onclick: () => { void openGroup(group) }, 'aria-label': t.open(group.project.name) },
    character(el('div', { class: 'who' }, sprite(group.project.name, 30), el('div', {}, el('div', { class: 'name' }, group.project.name), el('div', { class: 'path px-mono' }, group.project.root))), group.project.name),
    el('div', { class: 'iss' }, issueCell(group), machinePills(group.items)),
    ...metrics(group.bars))
}
function tile(k, v, unit, n, tone = '', extra = null) { return el('div', { class: `tile ${tone}` }, el('div', { class: 'k' }, k), el('div', { class: 'v' }, v, unit ? el('small', {}, unit) : null), n ? el('div', { class: 'n' }, n) : null, extra) }

function listView() {
  const all = groups(), grouped = mainGroups(all), shown = new Set(grouped.map((group) => group.key))
  const when = lastAt ? (() => { const t = document.createElement('gugu-time'); t.setAttribute('datetime', new Date(lastAt).toISOString()); return t })() : null
  root.append(el('header', { class: 'top' }, el('h1', { tabindex: '-1' }, t.app), el('span', { class: 'sub' }, t.summary(all.length, machines.length), when),
    el('div', { class: 'acts' }, button(t.settings, (event) => runAction(event.currentTarget, () => g.openLink(settingsLink)), { class: 'px-button', 'aria-label': t.settings }), button(loading ? t.computing : t.recompute, refresh, { disabled: loading, class: 'px-button primary' }))))
  for (const machine of machines.filter((m) => m.progress)) {
    const { label, done, total, pending } = machine.progress
    root.append(el('div', { class: 'progress', role: 'status' }, el('span', { class: 'note' }, `${machine.name}${t.colon}${label}${total ? ` · ${done} / ${total}` : pending ? t.left(pending) : ''}`), total ? el('progress', { value: String(done), max: String(total) }) : el('progress')))
  }
  if (loading && !machines.some((m) => m.progress)) root.append(el('div', { class: 'progress', role: 'status' }, el('span', { class: 'note' }, t.readingMachines), el('progress')))
  if (problem) root.append(el('p', { role: 'alert' }, problem))
  for (const machine of machines.filter((m) => m.error)) root.append(el('p', { role: 'alert' }, `${machine.name}${t.colon}${machine.error}`))
  if (grouped.length) {
    const need = grouped.filter((gr) => worst(gr))
    const reds = grouped.filter((gr) => worst(gr)?.severity === 'red').length
    const top = grouped.toSorted((x, y) => (y.bars.capacity.percent ?? 0) - (x.bars.capacity.percent ?? 0))[0]
    const tasks = grouped.some((gr) => gr.bars.hot.count === null) ? null : grouped.reduce((n, gr) => n + gr.bars.hot.count, 0)
    const clean = grouped.flatMap((gr) => gr.items.flatMap((e) => e.report?.rules || [])).filter((r) => r.severity === 'clean').reduce((n, r) => n + (r.count || 0), 0)
    root.append(el('div', { class: 'tiles' },
      tile(t.toFix, String(need.length), t.projectsUnit, t.reds(reds), reds ? 'red' : need.length ? 'yellow' : ''),
      tile(t.fullest, top.bars.capacity.percent === null ? t.notYet : `${top.bars.capacity.percent}%`, '', top.project.name, toneFor('capacity', top.bars.capacity.cells), bar('capacity', top.bars.capacity.cells)),
      tile(t.tasks7, tasks === null ? t.notYet : String(tasks), tasks === null ? '' : t.timesUnit, t.projects(grouped.length)),
      tile(t.canClean, String(clean), t.spotsUnit, t.noHealthCost)))
  }
  root.append(el('div', { class: 'sect' }, t.projectsSect, el('small', {}, t.byActivity)))
  if (!grouped.length) root.append(el('gugu-empty', { icon: 'layers' }, el('strong', {}, loading ? t.readingRecent : t.noProjects), el('small', {}, t.noProjectsHint)))
  else root.append(el('div', { class: 'plist' }, el('div', { class: 'phead' }, t.columns.map((name) => el('span', {}, name))), grouped.map((group) => card(group))))
  const globals = entries.filter((e) => e.project.global)
  if (globals.length) {
    root.append(el('div', { class: 'sect' }, t.shared, el('small', {}, t.sharedHint)))
    const group = combine('@global', globals)
    const counts = globals.map((e) => e.report?.rules.find((r) => r.id === 'R20')?.metrics)
    const states = counts.reduce((n, m) => n + (m?.codexStates || 0), 0), memories = counts.reduce((n, m) => n + (m?.unmappedMemoryDirectories || 0), 0)
    const row = card(group)
    const measured = globals.every((e) => e.report)
    row.classList.add('global')
    // The unassigned tasks are the 热度 column; the global rules have no memory index of their own, so 容量 stays empty.
    row.querySelector('.issue').replaceWith(el('div', { class: 'issue ok' }, el('span', { class: 'sev clean' }, icon('sparkles')), el('span', { class: 'txt' }, measured ? t.globalClean(states, memories) : t.globalChecking)))
    row.querySelectorAll('.metric')[2].replaceWith(el('span', { class: 'metric', 'aria-hidden': 'true' }))
    root.append(el('div', { class: 'plist' }, row))
  }
  const other = all.filter((group) => !shown.has(group.key)).flatMap((group) => group.items.flatMap((entry) => entry.project.locations.map((directory) => ({ entry, directory }))))
  if (other.length) {
    const details = el('details', { class: 'fold' }, el('summary', {}, t.otherDirs(other.length)))
    const list = el('ul', { class: 'directory-list' })
    for (const { entry, directory } of other) list.append(el('li', {}, button(entry.project.name, () => { void openGroup(all.find((group) => group.items.includes(entry))) }, { class: 'px-text-link' }), el('code', { class: 'path px-mono' }, directory), el('span', { class: 'path' }, t.lastActive(entry.machine.name, entry.project.lastActiveAt === null ? t.unknown : new Date(entry.project.lastActiveAt).toLocaleString()))))
    details.append(list)
    root.append(details)
  }
}

function explanation(rule) {
  if (rule.id === 'R20' && rule.metrics) return t.r20(rule.metrics)
  if (rule.id === 'R17' && rule.metrics) return t.r17(rule.metrics)
  return t.explain[rule.id] || ''
}

async function runAction(control, action) {
  control.disabled = true
  try { await action() } catch (e) {
    const message = e.message || String(e)
    const status = control.closest('dialog')?.querySelector('[role=status], [role=alert]')
    if (status) { status.textContent = message; status.setAttribute('role', 'alert') }
    else { problem = message; render() }
  }
  finally { control.disabled = false }
}

function showDialog(title, content, controls = []) {
  const previous = document.activeElement
  dialog.replaceChildren(el('section', { class: 'px-panel', 'aria-labelledby': 'dialog-title' }, el('h2', { id: 'dialog-title' }, title), content, el('div', { class: 'dialog-actions' }, button(t.close, () => { dialog.close(); previous?.focus() }), ...controls)))
  if (!dialog.open) dialog.showModal()
}

async function showPrompt(entry, id) {
  const answer = await call(entry.machine, 'agent_prompt', { report: entry.report.id, rule: id })
  const status = el('p', { role: 'status' })
  const copy = button(t.copyForAgent, async (event) => runAction(event.currentTarget, async () => { await g.clipboard.writeText(answer.prompt); status.textContent = t.copied }))
  showDialog(t.promptTitle, el('div', {}, el('pre', { class: 'px-mono' }, answer.prompt), status), [copy])
}

async function showPreview(entry, id) {
  const preview = await call(entry.machine, 'preview', { report: entry.report.id, rule: id })
  const pre = el('pre', { class: 'px-mono', tabindex: '0' })
  const status = el('p', { role: 'status' })
  const check = el('input', { type: 'checkbox' })
  const confirm = button(t.confirmWrite, async (event) => runAction(event.currentTarget, async () => {
    const result = await call(entry.machine, 'apply', { preview: preview.id, digest: preview.digest, confirmed: check.checked })
    status.textContent = t.applied(result.applied.length, result.snapshot)
    check.disabled = true
    confirm.remove()
    await reloadEntry(entry)
    render()
  }), { disabled: true })
  let next = 0, complete = false
  const more = button(t.moreChanges, async (event) => runAction(event.currentTarget, load))
  async function load() {
    const result = await call(entry.machine, 'preview_read', { preview: preview.id, offset: next })
    pre.append(result.text)
    next = result.nextOffset
    complete = next === null
    more.hidden = complete
    status.textContent = t.previewStatus(preview.changes, complete)
    confirm.disabled = !complete || !check.checked
  }
  check.addEventListener('change', () => { confirm.disabled = !complete || !check.checked })
  showDialog(t.previewTitle, el('div', {}, el('p', { class: 'note' }, t.previewNote), pre, more, status, el('label', {}, check, t.agree)), [confirm])
  await load()
}

function ruleRow(entry, rule) {
  const evidence = el('details', {}, el('summary', {}, t.showEvidence(rule.evidenceCount ?? rule.count)))
  let offset = 0
  const pre = el('pre', { class: 'evidence px-mono' })
  const more = button(t.moreEvidence, async (event) => runAction(event.currentTarget, load))
  async function load() {
    const page = await call(entry.machine, 'findings', { report: entry.report.id, rule: rule.id, offset })
    for (const row of page.rows) pre.append(JSON.stringify(row, null, 2) + '\n')
    offset = page.nextOffset
    more.hidden = offset === null
  }
  evidence.addEventListener('toggle', () => { if (evidence.open && !pre.textContent) void runAction(more, load) })
  evidence.append(pre, more)
  const action = button(rule.fixable ? t.seeChanges : t.copyForAgent, (event) => runAction(event.currentTarget, () => rule.fixable ? showPreview(entry, rule.id) : showPrompt(entry, rule.id)))
  const pts = ['red', 'yellow'].includes(rule.severity) ? el('span', { class: `pts sev ${rule.severity}` }, `−${rule.severity === 'red' ? 3 : 1}`) : null
  return el('article', { class: 'irow', 'aria-label': `${entry.machine.name} ${rule.title}` }, el('span', { class: `sev ${rule.severity}` }, icon(SEV[rule.severity])),
    el('div', {}, el('div', { class: 't' }, rule.title, el('span', { class: 'cnt' }, t.count(rule.count, rule.id === 'R17')), pts), el('div', { class: 'd' }, explanation(rule)), el('div', { class: 'w' }, t.checkedBy(entry.machine.name)), evidence), action)
}

function detailView(group) {
  root.append(el('nav', { class: 'crumb' }, el('button', { type: 'button', onclick: () => { selected = null; render(); root.querySelector('h1')?.focus() } }, t.app), '/', el('span', {}, group.project.name)))
  root.append(el('header', { class: 'hero' }, sprite(group.project.name, 48), el('div', {}, el('h1', { tabindex: '-1' }, group.project.name), el('div', { class: 'path px-mono' }, group.project.root), machinePills(group.items)), el('div', { class: 'acts' }, button(loading ? t.computing : t.recompute, refresh, { disabled: loading }))))
  const b = group.bars
  const fc = group.items.flatMap((e) => e.report?.capacityForecasts || [])
  root.append(el('div', { class: 'tiles tiles3' },
    tile(t.activity7, b.hot.count === null ? '—' : String(b.hot.count), t.taskUnit, null, '', bar('hot', b.hot.cells, { big: true })),
    tile(t.health, b.health.complete ? String(b.health.value) : '—', '/ 10', t.healthNote(b.health.red, b.health.yellow, b.health.complete), toneFor('health', b.health.complete ? b.health.value : null), bar('health', b.health.complete ? b.health.value : null, { big: true })),
    tile(t.capacity, b.capacity.percent === null ? '—' : `${b.capacity.percent}%`, '', fc.length ? t.fullIn(Math.min(...fc.map((f) => f.daysLeft))) : t.capacityNote, toneFor('capacity', b.capacity.cells), bar('capacity', b.capacity.cells, { big: true }))))
  if (problem) root.append(el('p', { role: 'alert' }, problem))
  const sev = ['red', 'yellow']
  for (const [title, severities, hint] of [[t.costing, sev, t.costingHint], [t.canClean, ['clean'], t.noHealthCost]]) {
    const rows = group.items.flatMap((e) => e.report?.rules.filter((r) => (r.evidenceCount ?? r.count) && severities.includes(r.severity)).map((r) => ruleRow(e, r)) || [])
    rows.sort((x, y) => (x.querySelector('.sev.red') ? 0 : 1) - (y.querySelector('.sev.red') ? 0 : 1))
    root.append(el('div', { class: 'sect' }, title, el('small', {}, t.items(rows.length, hint))))
    root.append(rows.length ? el('div', { class: 'box' }, rows) : el('p', { class: 'note' }, group.bars.health.complete ? t.noHits : t.noHitsPartial))
  }
  const pending = group.items.flatMap((e) => e.report?.rules.filter((r) => r.pending).map((r) => `${e.machine.name} · ${r.id}${t.colon}${r.pending}`) || [])
  if (pending.length) root.append(el('p', { class: 'note', role: 'status' }, pending.join(t.sep)))
  root.append(el('div', { class: 'sect' }, t.whereSect))
  const body = el('tbody')
  for (const entry of group.items) {
    if (entry.error) { body.append(el('tr', {}, el('td', { colspan: '4' }, `${entry.machine.name}${t.colon}${entry.error}`))); continue }
    for (const harness of harnesses(entry)) {
      const cap = (entry.report?.capacities || []).filter((c) => c.harness === (harness === 'Claude' ? 'claude' : 'codex')).toSorted((a, b) => b.ratio - a.ratio)[0]
      const paths = cap ? cap.harness === 'claude' ? [cap.path] : cap.files : entry.report?.instructions?.filter((p) => harness === 'Codex' ? /AGENTS(?:\.override)?\.md$/.test(p) : /CLAUDE(?:\.local)?\.md$/.test(p)) || []
      const count = entry.report?.history?.sources?.[harness === 'Claude' ? 'claude-code' : 'codex']
      body.append(el('tr', {}, el('td', {}, el('span', { class: 'pill' }, icon('monitor'), entry.machine.name, el('span', { class: 'h' }, harness))), el('td', {}, el('span', {}, cap ? cap.harness === 'claude' ? t.claudeCap(cap.chars.toLocaleString(), cap.lines) : t.codexCap(cap.bytes.toLocaleString()) : t.noMemoryIndex), el('div', { class: 'p px-mono' }, paths.join(' · '))), el('td', {}, count === undefined ? t.notYet : count === null ? t.startUnknown : t.per7(count)), el('td', {}, cap ? bar('capacity', Math.min(10, Math.max(cap.ratio > 0 ? 1 : 0, Math.round(cap.ratio * 10)))) : '—')))
    }
  }
  root.append(el('div', { class: 'box table-scroll' }, el('table', { class: 'mt' }, el('thead', {}, el('tr', {}, t.tableHead.map((name) => el('th', {}, name)))), body)))
  root.append(el('div', { class: 'sect' }, t.agentSect, el('small', {}, t.agentSectHint)))
  root.append(el('div', { class: 'box' }, group.items.flatMap((entry) => (entry.report?.agents || []).map((rule) => el('article', { class: 'irow', 'aria-label': rule.title }, el('span', { class: 'sev none' }, icon('sparkles')), el('div', {}, el('div', { class: 't' }, rule.title), el('p', { class: 'd' }, t.agentRow(entry.machine.name))), button(t.copyForAgent, (event) => runAction(event.currentTarget, () => showPrompt(entry, rule.id))))))))
  root.append(el('p', { class: 'note' }, group.items.map((e) => t.sampleNote(e.machine.name, e.report?.history?.sample ?? 0)).join(' · ')))
}

function render() {
  root.replaceChildren()
  const globals = entries.filter((entry) => entry.project.global)
  const group = selected === '@global' && globals.length ? combine('@global', globals) : groups().find((p) => p.key === selected)
  if (group?.project && group.bars) detailView(group)
  else listView()
}
async function reloadEntry(entry) {
  entry.request ||= settle(entry.machine, 'diagnose', { project: entry.project.global ? '@global' : entry.project.root }, t.readingProject(entry.project.name))
  try { entry.report = await entry.request; entry.error = null } finally { entry.request = null }
}
async function openGroup(group) {
  selected = group.key; render(); root.querySelector('h1')?.focus()
  for (const entry of group.items.filter((e) => !e.report)) {
    try { await reloadEntry(entry) } catch (e) { entry.error = e.message || String(e); problem = entry.error }
    render()
  }
}
async function refresh() {
  if (loading) return
  // Keep the last results on screen; each machine's part is replaced in place as it is recalculated.
  loading = true; problem = ''; render()
  try {
    // The host owns device discovery. No App network client or second device directory.
    const report = await g.listAgents({ report: true })
    if (!Array.isArray(report.devices)) throw new Error(t.noDevices)
    const previous = new Map(machines.map((m) => [m.id, m]))
    machines = report.devices.map((device) => Object.assign(previous.get(device.deviceId) || {}, { id: device.deviceId, name: device.label, online: device.online, thisMachine: device.thisMachine, checkedAt: device.checkedAt, error: null }))
    entries = entries.filter((e) => machines.includes(e.machine))
    render()
    await Promise.all(machines.map(refreshMachine))
    saveSnapshot()
  } catch (e) { problem = e.message || String(e) }
  finally { loading = false; render() }
}
async function refreshMachine(machine) {
  if (!machine.online && !machine.thisMachine) { machine.error = t.offline; render(); return }
  try {
    const found = await settle(machine, 'discover', {}, t.updatingIndex)
    machine.name ||= found.machine.name
    machine.unmapped = found.unmappedMemories.length
    const old = new Map(entries.filter((e) => e.machine === machine).map((e) => [e.project.key, e]))
    const fresh = [...found.projects, { key: 'global', name: t.globalName, root: t.shared, global: true }]
      .map((project) => ({ machine, project, report: old.get(project.key)?.report || null, activity: old.get(project.key)?.activity || null }))
    entries = [...entries.filter((e) => e.machine !== machine), ...fresh]
    render()
    const activity = await settle(machine, 'activity', {}, t.readingStarts)
    const byKey = new Map(activity.projects.map((row) => [row.key, row]))
    for (const entry of fresh) entry.activity = entry.project.global ? activity.unassigned || null : byKey.get(entry.project.key)
    if (!activity.complete) machine.error = activity.reason || t.indexIncomplete
    render()
    const wanted = new Set(mainGroups().map((group) => group.key))
    if (selected) wanted.add(selected)
    const queue = fresh.filter((entry) => entry.project.global || wanted.has(groupKey(entry)))
      .toSorted((a, b) => Number((b.project.global ? '@global' : groupKey(b)) === selected) - Number((a.project.global ? '@global' : groupKey(a)) === selected))
    for (const entry of queue) {
      try { await reloadEntry(entry) } catch (e) { entry.error = e.message || String(e); machine.error = `${entry.project.name}${t.colon}${entry.error}` }
      render()
    }
  } catch (e) { machine.error = e.message || String(e); machine.progress = null; render() }
}
g.onContextChanged(async () => {
  const previous = ctx
  ctx = await g.getContext()
  // Coming back to the tab shows what is already here; recalculating is the person's 「重新计算」.
  if (previous.workspace?.deviceId !== ctx.workspace?.deviceId) render()
})
if (loadSnapshot()) render()
else await refresh()
