import { el, character, sprite, bar, button, toneFor } from './pixel-kit.js'

const g = window.gugu
const root = document.getElementById('app')
const dialog = document.getElementById('dialog')
let ctx = await g.getContext()
const settingsLink = await g.linkTo({ kind: 'app', tab: 'settings' })
let machines = []
let entries = []
let selected = null
let loading = false
let problem = ''

const address = (id) => id ? `device:${id.replace(/^device:/, '')}` : undefined
async function call(machine, tool, args = {}) {
  // Same MCP result contract and error handling as Teamboard's program calls.
  const answer = await g.callProgram(tool, args, { device: address(machine.id) })
  const text = answer.content?.find((part) => part.type === 'text')?.text || ''
  if (answer.isError) throw new Error(text || '上下文程序执行失败')
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
const SNAPSHOT = 'context-snapshot-v1'
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
  if (!first && !group.bars.health.complete) return el('div', { class: 'issue' }, el('span', { class: 'sev none' }, icon('circle')), el('span', { class: 'txt' }, '正在读取上下文，健康尚未全测'))
  if (first) return el('div', { class: 'issue' }, el('span', { class: `sev ${first.severity}` }, icon(SEV[first.severity])), el('span', { class: 'txt' }, `${first.title}${first.count > 1 ? ` · ${first.count} 处` : ''}`))
  const clean = group.items.flatMap((e) => e.report?.rules || []).filter((r) => r.severity === 'clean' && r.count).reduce((n, r) => n + r.count, 0)
  return el('div', { class: 'issue ok' }, el('span', { class: `sev ${clean ? 'clean' : 'ok'}` }, icon(clean ? 'sparkles' : 'check')), el('span', { class: 'txt' }, clean ? `没有扣分项 · ${clean} 处可清理` : '没有问题'))
}
function metric(kind, cells, text) { return el('div', { class: `metric ${toneFor(kind, cells)}` }, el('b', {}, text), bar(kind, cells)) }
function metrics(b) {
  return [
    metric('hot', b.hot.cells, b.hot.count === null ? '待计算' : `${b.hot.count} 次 / 7天`),
    metric('health', b.health.complete ? b.health.value : null, b.health.complete ? `${b.health.value} / 10` : '未全测'),
    metric('capacity', b.capacity.cells, b.capacity.percent === null ? '待计算' : `${b.capacity.percent}%`),
  ]
}
function card(group) {
  return el('button', { type: 'button', class: 'prow', onclick: () => { void openGroup(group) }, 'aria-label': `打开 ${group.project.name}` },
    character(el('div', { class: 'who' }, sprite(group.project.name, 30), el('div', {}, el('div', { class: 'name' }, group.project.name), el('div', { class: 'path px-mono' }, group.project.root))), group.project.name),
    el('div', { class: 'iss' }, issueCell(group), machinePills(group.items)),
    ...metrics(group.bars))
}
function tile(k, v, unit, n, tone = '', extra = null) { return el('div', { class: `tile ${tone}` }, el('div', { class: 'k' }, k), el('div', { class: 'v' }, v, unit ? el('small', {}, unit) : null), n ? el('div', { class: 'n' }, n) : null, extra) }

function listView() {
  const all = groups(), grouped = mainGroups(all), shown = new Set(grouped.map((group) => group.key))
  const when = lastAt ? (() => { const t = document.createElement('gugu-time'); t.setAttribute('datetime', new Date(lastAt).toISOString()); return t })() : null
  root.append(el('header', { class: 'top' }, el('h1', { tabindex: '-1' }, '上下文'), el('span', { class: 'sub' }, `${all.length} 个项目 · ${machines.length} 台电脑 · 上次计算 `, when),
    el('div', { class: 'acts' }, button('设置', (event) => runAction(event.currentTarget, () => g.openLink(settingsLink)), { class: 'px-button', 'aria-label': '设置' }), button(loading ? '正在计算…' : '重新计算', refresh, { disabled: loading, class: 'px-button primary' }))))
  for (const machine of machines.filter((m) => m.progress)) {
    const { label, done, total, pending } = machine.progress
    root.append(el('div', { class: 'progress', role: 'status' }, el('span', { class: 'note' }, `${machine.name}：${label}${total ? ` · ${done} / ${total}` : pending ? ` · 还有 ${pending} 个` : ''}`), total ? el('progress', { value: String(done), max: String(total) }) : el('progress')))
  }
  if (loading && !machines.some((m) => m.progress)) root.append(el('div', { class: 'progress', role: 'status' }, el('span', { class: 'note' }, '正在读取机器列表'), el('progress')))
  if (problem) root.append(el('p', { role: 'alert' }, problem))
  for (const machine of machines.filter((m) => m.error)) root.append(el('p', { role: 'alert' }, `${machine.name}：${machine.error}`))
  if (grouped.length) {
    const need = grouped.filter((gr) => worst(gr))
    const reds = grouped.filter((gr) => worst(gr)?.severity === 'red').length
    const top = grouped.toSorted((x, y) => (y.bars.capacity.percent ?? 0) - (x.bars.capacity.percent ?? 0))[0]
    const tasks = grouped.some((gr) => gr.bars.hot.count === null) ? null : grouped.reduce((n, gr) => n + gr.bars.hot.count, 0)
    const clean = grouped.flatMap((gr) => gr.items.flatMap((e) => e.report?.rules || [])).filter((r) => r.severity === 'clean').reduce((n, r) => n + (r.count || 0), 0)
    root.append(el('div', { class: 'tiles' },
      tile('要处理', String(need.length), '个项目', `${reds} 个有红色问题`, reds ? 'red' : need.length ? 'yellow' : ''),
      tile('最满的记忆索引', top.bars.capacity.percent === null ? '待计算' : `${top.bars.capacity.percent}%`, '', top.project.name, toneFor('capacity', top.bars.capacity.cells), bar('capacity', top.bars.capacity.cells)),
      tile('7 天任务', tasks === null ? '待计算' : String(tasks), tasks === null ? '' : '次', `${grouped.length} 个项目`),
      tile('可以清理', String(clean), '处', '不扣健康')))
  }
  root.append(el('div', { class: 'sect' }, '项目', el('small', {}, '按 7 天热度排')))
  if (!grouped.length) root.append(el('gugu-empty', { icon: 'layers' }, el('strong', {}, loading ? '正在读取近期任务和项目规矩…' : '还没有项目'), el('small', {}, '这台电脑最近没有 Claude / Codex 任务，也没有项目级规矩。可在设置里补充项目目录。')))
  else root.append(el('div', { class: 'plist' }, el('div', { class: 'phead' }, el('span', {}, '项目'), el('span', {}, '最该处理的'), el('span', {}, '热度'), el('span', {}, '健康'), el('span', {}, '容量')), grouped.map((group) => card(group))))
  const globals = entries.filter((e) => e.project.global)
  if (globals.length) {
    root.append(el('div', { class: 'sect' }, '所有项目共用', el('small', {}, '全局规矩、未归属项目的任务')))
    const group = combine('@global', globals)
    const counts = globals.map((e) => e.report?.rules.find((r) => r.id === 'R20')?.metrics)
    const states = counts.reduce((n, m) => n + (m?.codexStates || 0), 0), memories = counts.reduce((n, m) => n + (m?.unmappedMemoryDirectories || 0), 0)
    const row = card(group)
    const measured = globals.every((e) => e.report)
    const activity = group.bars.hot.count
    row.classList.add('global')
    row.querySelector('.issue').replaceWith(el('div', { class: 'issue ok' }, el('span', { class: 'sev clean' }, icon('sparkles')), el('span', { class: 'txt' }, measured ? `可清理：${states} 条失效的 Codex 项目信任 / hook 配置 · ${memories} 个无项目的记忆目录；未归属项目的任务：${activity === null ? '待读取' : `${activity} / 7天`}` : '正在检查全局规矩、未归属任务和可清理项…')))
    const health = metrics(group.bars)[1]
    row.querySelectorAll('.metric').forEach((m) => m.remove())
    row.append(health)
    root.append(el('div', { class: 'plist' }, row))
  }
  const other = all.filter((group) => !shown.has(group.key)).flatMap((group) => group.items.flatMap((entry) => entry.project.locations.map((directory) => ({ entry, directory }))))
  if (other.length) {
    const details = el('details', { class: 'fold' }, el('summary', {}, `其余 ${other.length} 个目录（没有近期任务或项目级上下文）`))
    const list = el('ul', { class: 'directory-list' })
    for (const { entry, directory } of other) list.append(el('li', {}, button(entry.project.name, () => { void openGroup(all.find((group) => group.items.includes(entry))) }, { class: 'px-text-link' }), el('code', { class: 'path px-mono' }, directory), el('span', { class: 'path' }, `${entry.machine.name} · 最后活跃：${entry.project.lastActiveAt === null ? '未知' : new Date(entry.project.lastActiveAt).toLocaleString()}`)))
    details.append(list)
    root.append(details)
  }
}

function explanation(rule) {
  if (rule.id === 'R20' && rule.metrics) return `${rule.metrics.codexStates} 项 Codex 状态指向已不存在目录；${rule.metrics.unmappedMemoryDirectories} 个记忆目录未关联项目。清理不扣健康，目录归档前需核对内容和所属项目。`
  if (rule.id === 'R17' && rule.metrics) {
    const m = rule.metrics
    const names = { 'deleted-worktree': '已删 worktree', temporary: '临时', 'moved-or-shorthand': '改名或简写', missing: '缺失', unverifiable: '无法核实' }
    return `已核查 ${m.checkedPaths} 条唯一路径；确认失效 ${m.missingPaths} 条，涉及 ${m.affectedFiles} 个文件。无法核实 ${m.classes.unverifiable.paths} 条、临时路径 ${m.classes.temporary.paths} 条，均不计入失效。` + Object.entries(m.classes).map(([kind, count]) => `${names[kind]} ${count.paths} 路径 / ${count.files} 文件`).join('；') + '。证据按文件和路径去重，展开后分页读取。'
  }
  const text = {
    R1: '按 UTF-16 字符数 / 25,000 和行数 / 200 取较大值；Codex 按项目 AGENTS.md 合计 / 32 KiB，全局指令不占项目预算。',
    R2: '当前已到加载上限，或最近一次宿主注入记录有截断警告。', R3: '根据每日注入长度的增长预测，提示并入容量，不另扣健康。',
    R4: '新记忆明确取代旧记忆，旧的仍挂在索引里；旧正文有回链或索引行已标明取代时不命中。',
    R5: '存在 CLAUDE.md / CLAUDE.local.md，但 @import 链没有引入同目录 AGENTS.md。',
    R6: '至少 5 个任务用过，但 MEMORY.md 和一层 hub 里没有链接。', R7: '宿主记录显示，声明为只读、不作依据的目录仍注入了规矩。',
    R8: '链接指向不存在的记忆；孤儿不在索引里；不可达指从 MEMORY.md 出发走不到。',
    R9: '补 name 可直接修；description 和 type 缺失仍需判断。', R10: 'Claude 首份渲染总长；Codex 首份 base-instructions 加 Project 指令文本；不累计后续快照。',
    R11: '列出近期任务样本未引用的记忆；只有超过 14 天且 type=project 的项可归档。规则类不会按年龄归档。',
    R12: '索引描述和文件 description 不一致，前缀截断另行保留；修复以文件为准。',
    R13: '同一目标有多条索引行，确定修复保留第一处。', R14: '非空索引行超过 200 个字符；改写需要保持规则原意。',
    R15: 'description 超过 250 个字符。', R16: '单个记忆超过 20 KB；归档预览同时处理相关索引和引用。',
    R17: '核对本地文件和当前 git tree；外机绝对路径不算失效。已删 worktree 与临时路径单列。',
    R18: '正文 5 字符 shingle Jaccard 大于 0.5；只有正文完全相同的候选可直接合并。',
    R19: '只检查 MEMORY.md 直接收录的 feedback：去停用词和高频词，3–8 条共同出现的稀有词组，或一个明确代码标识符；不跨组传递合并。相关常驻指令同时列为证据，是否合并由 agent 判断。',
    R20: 'Codex config.toml 的项目信任或 hooks 状态指向已不存在的目录。', R21: '记忆目录里出现非 .md 文件；可移进 archive/。',
  }
  return text[rule.id] || ''
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
  dialog.replaceChildren(el('section', { class: 'px-panel', 'aria-labelledby': 'dialog-title' }, el('h2', { id: 'dialog-title' }, title), content, el('div', { class: 'dialog-actions' }, button('关闭', () => { dialog.close(); previous?.focus() }), ...controls)))
  if (!dialog.open) dialog.showModal()
}

async function showPrompt(entry, id) {
  const answer = await call(entry.machine, 'agent_prompt', { report: entry.report.id, rule: id })
  const status = el('p', { role: 'status' })
  const copy = button('复制给 agent', async (event) => runAction(event.currentTarget, async () => { await g.clipboard.writeText(answer.prompt); status.textContent = '已复制' }))
  showDialog('给 agent 的话', el('div', {}, el('pre', { class: 'px-mono' }, answer.prompt), status), [copy])
}

async function showPreview(entry, id) {
  const preview = await call(entry.machine, 'preview', { report: entry.report.id, rule: id })
  const pre = el('pre', { class: 'px-mono', tabindex: '0' })
  const status = el('p', { role: 'status' })
  const check = el('input', { type: 'checkbox' })
  const confirm = button('确认写入', async (event) => runAction(event.currentTarget, async () => {
    const result = await call(entry.machine, 'apply', { preview: preview.id, digest: preview.digest, confirmed: check.checked })
    status.textContent = `已改 ${result.applied.length} 个文件。改前快照：${result.snapshot}`
    check.disabled = true
    confirm.remove()
    await reloadEntry(entry)
    render()
  }), { disabled: true })
  let next = 0, complete = false
  const more = button('继续看改动', async (event) => runAction(event.currentTarget, load))
  async function load() {
    const result = await call(entry.machine, 'preview_read', { preview: preview.id, offset: next })
    pre.append(result.text)
    next = result.nextOffset
    complete = next === null
    more.hidden = complete
    status.textContent = `${preview.changes} 个文件 · ${complete ? '完整预览已加载' : '还有改动，请继续查看'}`
    confirm.disabled = !complete || !check.checked
  }
  check.addEventListener('change', () => { confirm.disabled = !complete || !check.checked })
  showDialog('改动预览', el('div', {}, el('p', { class: 'note' }, '确认后先保存改前快照，再核对文件哈希和修改时间；文件被别人改过就拒绝写入。'), pre, more, status, el('label', {}, check, ' 我已查看完整改动，同意写入这些文件')), [confirm])
  await load()
}

function ruleRow(entry, rule) {
  const evidence = el('details', {}, el('summary', {}, `查看 ${rule.evidenceCount ?? rule.count} 条证据`))
  let offset = 0
  const pre = el('pre', { class: 'evidence px-mono' })
  const more = button('更多证据', async (event) => runAction(event.currentTarget, load))
  async function load() {
    const page = await call(entry.machine, 'findings', { report: entry.report.id, rule: rule.id, offset })
    for (const row of page.rows) pre.append(JSON.stringify(row, null, 2) + '\n')
    offset = page.nextOffset
    more.hidden = offset === null
  }
  evidence.addEventListener('toggle', () => { if (evidence.open && !pre.textContent) void runAction(more, load) })
  evidence.append(pre, more)
  const action = button(rule.fixable ? '看改动' : '复制给 agent', (event) => runAction(event.currentTarget, () => rule.fixable ? showPreview(entry, rule.id) : showPrompt(entry, rule.id)))
  const pts = ['red', 'yellow'].includes(rule.severity) ? el('span', { class: `pts sev ${rule.severity}` }, `−${rule.severity === 'red' ? 3 : 1}`) : null
  return el('article', { class: 'irow', 'aria-label': `${entry.machine.name} ${rule.title}` }, el('span', { class: `sev ${rule.severity}` }, icon(SEV[rule.severity])),
    el('div', {}, el('div', { class: 't' }, rule.title, el('span', { class: 'cnt' }, `${rule.count} ${rule.id === 'R17' ? '条' : '处'}`), pts), el('div', { class: 'd' }, explanation(rule)), el('div', { class: 'w' }, `${entry.machine.name} · 程序检查`), evidence), action)
}

function detailView(group) {
  root.append(el('nav', { class: 'crumb' }, el('button', { type: 'button', onclick: () => { selected = null; render(); root.querySelector('h1')?.focus() } }, '上下文'), '/', el('span', {}, group.project.name)))
  root.append(el('header', { class: 'hero' }, sprite(group.project.name, 48), el('div', {}, el('h1', { tabindex: '-1' }, group.project.name), el('div', { class: 'path px-mono' }, group.project.root), machinePills(group.items)), el('div', { class: 'acts' }, button(loading ? '正在计算…' : '重新计算', refresh, { disabled: loading }))))
  const b = group.bars
  const fc = group.items.flatMap((e) => e.report?.capacityForecasts || [])
  root.append(el('div', { class: 'tiles tiles3' },
    tile('7 天热度', b.hot.count === null ? '—' : String(b.hot.count), '次任务', null, '', bar('hot', b.hot.cells, { big: true })),
    tile('健康', b.health.complete ? String(b.health.value) : '—', '/ 10', `红 ${b.health.red} · 黄 ${b.health.yellow}${b.health.complete ? '' : ' · 尚有未测规则'}`, toneFor('health', b.health.complete ? b.health.value : null), bar('health', b.health.complete ? b.health.value : null, { big: true })),
    tile('容量', b.capacity.percent === null ? '—' : `${b.capacity.percent}%`, '', fc.length ? `按当前增长约 ${Math.min(...fc.map((f) => f.daysLeft))} 天触顶` : '记忆索引占加载上限', toneFor('capacity', b.capacity.cells), bar('capacity', b.capacity.cells, { big: true }))))
  if (problem) root.append(el('p', { role: 'alert' }, problem))
  const sev = ['red', 'yellow']
  for (const [title, severities, hint] of [['扣了健康的', sev, '红 −3 · 黄 −1'], ['可以清理', ['clean'], '不扣健康']]) {
    const rows = group.items.flatMap((e) => e.report?.rules.filter((r) => (r.evidenceCount ?? r.count) && severities.includes(r.severity)).map((r) => ruleRow(e, r)) || [])
    rows.sort((x, y) => (x.querySelector('.sev.red') ? 0 : 1) - (y.querySelector('.sev.red') ? 0 : 1))
    root.append(el('div', { class: 'sect' }, title, el('small', {}, `${rows.length} 项 · ${hint}`)))
    root.append(rows.length ? el('div', { class: 'box' }, rows) : el('p', { class: 'note' }, group.bars.health.complete ? '没有命中' : '已测范围内没有命中'))
  }
  const pending = group.items.flatMap((e) => e.report?.rules.filter((r) => r.pending).map((r) => `${e.machine.name} · ${r.id}：${r.pending}`) || [])
  if (pending.length) root.append(el('p', { class: 'note', role: 'status' }, pending.join('；')))
  root.append(el('div', { class: 'sect' }, '在哪些电脑上'))
  const body = el('tbody')
  for (const entry of group.items) {
    if (entry.error) { body.append(el('tr', {}, el('td', { colspan: '4' }, `${entry.machine.name}：${entry.error}`))); continue }
    for (const harness of harnesses(entry)) {
      const cap = (entry.report?.capacities || []).filter((c) => c.harness === (harness === 'Claude' ? 'claude' : 'codex')).toSorted((a, b) => b.ratio - a.ratio)[0]
      const paths = cap ? cap.harness === 'claude' ? [cap.path] : cap.files : entry.report?.instructions?.filter((p) => harness === 'Codex' ? /AGENTS(?:\.override)?\.md$/.test(p) : /CLAUDE(?:\.local)?\.md$/.test(p)) || []
      const count = entry.report?.history?.sources?.[harness === 'Claude' ? 'claude-code' : 'codex']
      body.append(el('tr', {}, el('td', {}, el('span', { class: 'pill' }, icon('monitor'), entry.machine.name, el('span', { class: 'h' }, harness))), el('td', {}, el('span', {}, cap ? cap.harness === 'claude' ? `${cap.chars.toLocaleString()} / 25,000 字符 · ${cap.lines} / 200 行` : `${cap.bytes.toLocaleString()} / 32,768 字节` : '没有常驻记忆索引'), el('div', { class: 'p px-mono' }, paths.join(' · '))), el('td', {}, count === undefined ? '待计算' : count === null ? '起始时间未知' : `${count} / 7天`), el('td', {}, cap ? bar('capacity', Math.min(10, Math.max(cap.ratio > 0 ? 1 : 0, Math.round(cap.ratio * 10)))) : '—')))
    }
  }
  root.append(el('div', { class: 'box table-scroll' }, el('table', { class: 'mt' }, el('thead', {}, el('tr', {}, ['电脑 · harness', '开工时拿到的规矩', '7 天', '容量'].map((t) => el('th', {}, t)))), body)))
  root.append(el('div', { class: 'sect' }, '要 agent 判断', el('small', {}, '程序只给候选，复制后交给 agent')))
  root.append(el('div', { class: 'box' }, group.items.flatMap((entry) => (entry.report?.agents || []).map((rule) => el('article', { class: 'irow', 'aria-label': rule.title }, el('span', { class: 'sev none' }, icon('sparkles')), el('div', {}, el('div', { class: 't' }, rule.title), el('p', { class: 'd' }, `${entry.machine.name} · 程序只提供候选，复制后由你交给 agent。`)), button('复制给 agent', (event) => runAction(event.currentTarget, () => showPrompt(entry, rule.id))))))))
  root.append(el('p', { class: 'note' }, group.items.map((e) => `${e.machine.name}：${e.report?.history?.sample ?? 0} 个任务的上下文样本；最近 7 天热度查完整索引`).join(' · ')))
}

function render() {
  root.replaceChildren()
  const globals = entries.filter((entry) => entry.project.global)
  const group = selected === '@global' && globals.length ? combine('@global', globals) : groups().find((p) => p.key === selected)
  if (group?.project && group.bars) detailView(group)
  else listView()
}
async function reloadEntry(entry) {
  entry.request ||= settle(entry.machine, 'diagnose', { project: entry.project.global ? '@global' : entry.project.root }, `正在读取 ${entry.project.name} 的任务记录`)
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
    if (!Array.isArray(report.devices)) throw new Error('宿主尚未提供完整机器目录，请更新支持 App API 17 的宿主。')
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
  if (!machine.online && !machine.thisMachine) { machine.error = '机器离线，显示的是上次的结果'; render(); return }
  try {
    const found = await settle(machine, 'discover', {}, '正在更新任务索引')
    machine.name ||= found.machine.name
    machine.unmapped = found.unmappedMemories.length
    const old = new Map(entries.filter((e) => e.machine === machine).map((e) => [e.project.key, e]))
    const fresh = [...found.projects, { key: 'global', name: '全局规矩', root: '所有项目共用', global: true }]
      .map((project) => ({ machine, project, report: old.get(project.key)?.report || null, activity: old.get(project.key)?.activity || null }))
    entries = [...entries.filter((e) => e.machine !== machine), ...fresh]
    render()
    const activity = await settle(machine, 'activity', {}, '正在读取任务开工时间')
    const byKey = new Map(activity.projects.map((row) => [row.key, row]))
    for (const entry of fresh) entry.activity = entry.project.global ? activity.unassigned || null : byKey.get(entry.project.key)
    if (!activity.complete) machine.error = activity.reason || '任务索引尚未完成，热度仍未知'
    render()
    const wanted = new Set(mainGroups().map((group) => group.key))
    if (selected) wanted.add(selected)
    const queue = fresh.filter((entry) => entry.project.global || wanted.has(groupKey(entry)))
      .toSorted((a, b) => Number((b.project.global ? '@global' : groupKey(b)) === selected) - Number((a.project.global ? '@global' : groupKey(a)) === selected))
    for (const entry of queue) {
      try { await reloadEntry(entry) } catch (e) { entry.error = e.message || String(e); machine.error = `${entry.project.name}：${entry.error}` }
      render()
    }
  } catch (e) { machine.error = e.message || String(e); machine.progress = null; render() }
}
g.onContextChanged(async () => {
  const previous = ctx
  ctx = await g.getContext()
  // Coming back to the tab shows what is already here; recalculating is the person's 「重新计算」.
  if (previous.session?.deviceId !== ctx.session?.deviceId) render()
})
if (loadSnapshot()) render()
else await refresh()
