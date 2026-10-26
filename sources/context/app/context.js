import { el, character, sprite, bar, button, section, badge, stats } from './pixel-kit.js'

const g = window.gugu
const root = document.getElementById('app')
const dialog = document.getElementById('dialog')
let ctx = await g.getContext()
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
const harnesses = (entry) => [...new Set([...(entry.report?.capacities || []).map((c) => c.harness === 'claude' ? 'Claude' : 'Codex'), ...(entry.report?.instructions || []).flatMap((p) => /\/AGENTS(?:\.override)?\.md$/.test(p) ? ['Codex'] : /\/CLAUDE(?:\.local)?\.md$/.test(p) ? ['Claude'] : []), ...Object.entries(entry.report?.history?.sources || {}).filter(([, n]) => n > 0).map(([s]) => s === 'claude-code' ? 'Claude' : 'Codex')])]
const tags = (items) => el('div', { class: 'px-tags' }, items.map((e) => badge(e.machine.name, harnesses(e))))
const groupKey = (entry) => entry.project.remote ? entry.project.key : `${entry.machine.id || 'local'}:${entry.project.key}`

function groups() {
  return [...Map.groupBy(entries.filter((e) => !e.project.global), groupKey)].map(([key, items]) => {
    const reports = items.map((e) => e.report).filter(Boolean)
    const ruleHits = new Map()
    for (const report of reports) for (const r of report.rules) if (r.count) ruleHits.set(r.id, r)
    const red = [...ruleHits.values()].filter((r) => r.severity === 'red').length
    const yellow = [...ruleHits.values()].filter((r) => r.severity === 'yellow').length
    const all = reports.length === items.length && reports.every((r) => r.bars.health.complete)
    const hotKnown = reports.length === items.length && reports.every((r) => r.bars.hot.count !== null)
    const hot = hotKnown ? new Set(reports.flatMap((r) => r.history.hotTasks)).size : null
    const capacity = reports.length === items.length ? Math.max(0, ...reports.map((r) => r.bars.capacity.ratio)) : null
    return { key, items, project: items[0].project, bars: { hot: { count: hot, cells: hot === null ? null : Math.min(10, Math.ceil(Math.log2(hot + 1))) }, health: { value: Math.max(0, 10 - red * 3 - yellow), red, yellow, complete: all }, capacity: { ratio: capacity, percent: capacity === null ? null : Math.round(capacity * 100), cells: capacity === null ? null : Math.min(10, Math.max(capacity > 0 ? 1 : 0, Math.round(capacity * 10))) } } }
  }).toSorted((a, b) => (b.bars.hot.count ?? -1) - (a.bars.hot.count ?? -1) || a.project.name.localeCompare(b.project.name))
}

function say(group) {
  const hits = group.items.flatMap((e) => e.report?.rules || [])
  const first = hits.find((r) => r.count && r.severity === 'red') || hits.find((r) => r.count && r.severity === 'yellow')
  if (first) return `${first.title}${first.count > 1 ? ` · ${first.count} 处` : ''}${group.bars.capacity.percent >= 70 ? `；记忆索引用到 ${group.bars.capacity.percent}%` : ''}`
  if (!group.bars.health.complete) return '正在读取上下文，健康尚未全测'
  const clean = hits.filter((r) => r.severity === 'clean' && r.count).reduce((sum, r) => sum + r.count, 0)
  return clean ? `没有扣分项 · ${clean} 处可以清理` : '没有需要处理的上下文问题'
}

function card(group, rank) {
  const node = button('', () => { selected = group.key; render(); root.querySelector('h1')?.focus() }, { class: 'px-card', 'aria-label': `打开 ${group.project.name}` })
  character(node, group.project.name)
  node.append(el('div', { class: 'px-card-top' }, sprite(group.project.name), el('div', { class: 'project-copy' }, el('div', { class: 'px-name' }, group.project.name), el('div', { class: 'px-path px-mono' }, group.project.root)), el('span', { class: 'px-rank px-label' }, `#${rank}`)), tags(group.items), el('p', { class: 'px-say' }, say(group)), stats(group.bars))
  return node
}

function listView() {
  const grouped = groups()
  const header = el('header', { class: 'page-header' }, el('h1', { tabindex: '-1' }, '上下文'), el('span', { class: 'px-notice' }, `${grouped.length} 个项目 · 按 7 天热度排 · 打开时由程序重算`), el('div', { class: 'page-actions' }, button(loading ? '正在计算…' : '重新计算', refresh, { disabled: loading })))
  root.append(header)
  if (problem) root.append(el('p', { class: 'px-error', role: 'alert' }, problem))
  const incomplete = machines.filter((m) => m.error)
  for (const machine of incomplete) root.append(el('p', { class: 'px-error', role: 'alert' }, `${machine.name}：${machine.error}`))
  for (const machine of machines.filter((m) => m.unmapped)) root.append(el('p', { class: 'px-notice' }, `${machine.name}：${machine.unmapped} 份记忆尚未关联项目，请在设置补充对应项目路径。`))
  root.append(section('项目'))
  if (!grouped.length) root.append(el('div', { class: 'px-empty', role: 'status' }, loading ? '正在发现本机项目…' : '还没有找到项目。在 App 的「设置」页补充项目或配置根路径，再重新计算。'))
  else root.append(el('div', { class: 'project-grid' }, grouped.map((group, i) => card(group, i + 1))))
  const globals = entries.filter((e) => e.project.global && e.report)
  if (globals.length) {
    root.append(section('所有项目共用'))
    const report = globals[0].report
    const globalGroup = { key: '@global', project: report.project, items: globals, bars: report.bars }
    const node = card(globalGroup, 0)
    node.querySelector('.px-rank')?.remove()
    const count = globals.reduce((n, e) => n + (e.report.rules.find((r) => r.id === 'R20')?.count || 0), 0)
    node.querySelector('.px-say').textContent = count ? `Codex 配置里有 ${count} 个已不存在目录的状态，可以清理` : '全局规矩和配置状态已检查'
    node.querySelector('.px-stats').replaceWith(el('dl', { class: 'px-stats' }, el('dt', { class: 'px-label' }, '健康'), el('dd', {}, bar('health', 10)), el('dd', { class: 'px-stat-value px-mono' }, '10/10')))
    root.append(el('div', { class: 'global-grid' }, node))
  }
}

function explanation(rule) {
  if (rule.id === 'R17' && rule.metrics) {
    const m = rule.metrics
    const names = { 'deleted-worktree': '已删 worktree', temporary: '临时', 'moved-or-shorthand': '改名或简写', missing: '缺失', unverifiable: '无法核实' }
    return `检查 ${m.checkedPaths} 条唯一路径，缺失 ${m.missingPaths} 条，涉及 ${m.affectedFiles} 个文件；非临时类涉及 ${m.nonTemporaryFiles} 个文件。` + Object.entries(m.classes).map(([kind, count]) => `${names[kind]} ${count.paths} 路径 / ${count.files} 文件`).join('；') + '。证据按文件和路径去重，展开后分页读取。'
  }
  const text = {
    R1: '按 UTF-16 字符数 / 25,000 和行数 / 200 取较大值；Codex 按项目 AGENTS.md 合计 / 32 KiB，全局指令不占项目预算。',
    R2: '当前已到加载上限，或最近一次宿主注入记录有截断警告。', R3: '根据每日注入长度的增长预测，提示并入容量，不另扣健康。',
    R4: '新记忆明确取代旧记忆，旧的仍挂在索引里；旧正文有回链或索引行已标明取代时不命中。',
    R5: '存在 CLAUDE.md / CLAUDE.local.md，但 @import 链没有引入同目录 AGENTS.md。',
    R6: '至少 5 个任务用过，但 MEMORY.md 和一层 hub 里没有链接。', R7: '宿主记录显示，声明为只读、不作依据的目录仍注入了规矩。',
    R8: '链接指向不存在的记忆；孤儿不在索引里；不可达指从 MEMORY.md 出发走不到。',
    R9: '补 name 可直接修；description 和 type 缺失仍需判断。', R10: 'Claude 首份渲染总长；Codex 首份 base-instructions 加 Project 指令文本；不累计后续快照。',
    R11: '只处理超过 14 天、近期任务摘要没有引用过的 project 类记忆。规则类不会按年龄归档。',
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
  try { await action() } catch (e) { problem = e.message || String(e); render() }
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
  showDialog('改动预览', el('div', {}, el('p', { class: 'px-notice' }, '确认后先保存改前快照，再核对文件哈希和修改时间；文件被别人改过就拒绝写入。'), pre, more, status, el('label', {}, check, ' 我已查看完整改动，同意写入这些文件')), [confirm])
  await load()
}

function ruleRow(entry, rule) {
  const evidence = el('details', {}, el('summary', {}, `查看 ${rule.count} 条证据`))
  let offset = 0
  const pre = el('pre', { class: 'px-row-where px-mono' })
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
  return el('article', { class: 'px-row', 'aria-label': `${entry.machine.name} ${rule.title}` }, el('span', { class: 'px-pip', 'data-tone': rule.severity }), el('div', {}, el('div', { class: 'px-row-title' }, `${rule.title} · ${rule.count} 处`, el('span', { class: 'px-who px-label' }, '程序'), ['red', 'yellow'].includes(rule.severity) ? ` −${rule.severity === 'red' ? 3 : 1}` : ''), el('div', { class: 'px-row-sub' }, explanation(rule)), el('div', { class: 'px-row-where px-mono' }, entry.machine.name), evidence), action)
}

function detailView(group) {
  root.append(button('‹ 全部项目', () => { selected = null; render() }, { class: 'px-back' }))
  root.append(character(el('section', { class: 'px-sheet' }, sprite(group.project.name, 96), el('div', {}, el('header', { class: 'page-header' }, el('h1', { tabindex: '-1' }, group.project.name), el('span', { class: 'px-path px-mono' }, group.project.root)), tags(group.items), stats(group.bars, true), el('p', { class: 'px-notice' }, `红 ${group.bars.health.red} · 黄 ${group.bars.health.yellow}${group.bars.health.complete ? '' : ' · 尚有未测规则'}`))), group.project.name))
  if (problem) root.append(el('p', { class: 'px-error', role: 'alert' }, problem))
  root.append(section('在哪些机器上'))
  const body = el('tbody')
  for (const entry of group.items) {
    if (entry.error) { body.append(el('tr', {}, el('td', { colspan: '4' }, `${entry.machine.name}：${entry.error}`))); continue }
    for (const harness of harnesses(entry)) {
      const cap = (entry.report?.capacities || []).filter((c) => c.harness === (harness === 'Claude' ? 'claude' : 'codex')).toSorted((a, b) => b.ratio - a.ratio)[0]
      const paths = entry.report?.instructions?.filter((p) => harness === 'Codex' ? /AGENTS(?:\.override)?\.md$/.test(p) : /CLAUDE(?:\.local)?\.md$/.test(p)) || []
      const count = entry.report?.history?.sources?.[harness === 'Claude' ? 'claude-code' : 'codex']
      body.append(el('tr', {}, el('td', {}, badge(entry.machine.name, [harness])), el('td', {}, el('span', {}, cap ? cap.harness === 'claude' ? `${cap.chars.toLocaleString()} / 25,000 字符 · ${cap.lines} / 200 行` : `${cap.bytes.toLocaleString()} / 32,768 字节` : '没有常驻记忆索引'), el('div', { class: 'px-path px-mono' }, paths.join(' · '))), el('td', {}, count === undefined ? '待计算' : `${count} / 7天`), el('td', {}, cap ? bar('capacity', Math.min(10, Math.max(cap.ratio > 0 ? 1 : 0, Math.round(cap.ratio * 10)))) : '—')))
    }
  }
  root.append(el('div', { class: 'table-scroll' }, el('table', { class: 'px-table machine-table' }, el('thead', {}, el('tr', {}, ['机器 · harness', '开工时拿到的规矩', '热度', '容量'].map((t) => el('th', { class: 'px-label' }, t)))), body)))
  for (const [title, severities] of [['扣了健康的', ['red', 'yellow']], ['可以清理 · 不扣健康', ['clean']]]) {
    root.append(section(title))
    const rows = group.items.flatMap((e) => e.report?.rules.filter((r) => r.count && severities.includes(r.severity)).map((r) => ruleRow(e, r)) || [])
    root.append(rows.length ? el('div', { class: 'px-rows' }, rows) : el('p', { class: 'px-notice' }, group.bars.health.complete ? '没有命中' : '已测范围内没有命中'))
  }
  const pending = group.items.flatMap((e) => e.report?.rules.filter((r) => r.pending).map((r) => `${e.machine.name} · ${r.id}：${r.pending}`) || [])
  if (pending.length) root.append(el('p', { class: 'px-notice', role: 'status' }, pending.join('；')))
  root.append(section('要 agent 判断'))
  root.append(el('div', { class: 'px-rows' }, group.items.flatMap((entry) => (entry.report?.agents || []).map((rule) => el('article', { class: 'px-row', 'aria-label': rule.title }, el('span', { class: 'px-pip' }), el('div', {}, el('div', { class: 'px-row-title' }, rule.title, el('span', { class: 'px-who px-label' }, 'agent')), el('p', { class: 'px-row-sub' }, `${entry.machine.name} · 程序只提供候选，复制后由你交给 agent。`)), button('复制给 agent', (event) => runAction(event.currentTarget, () => showPrompt(entry, rule.id))))))))
  root.append(el('p', { class: 'px-notice' }, group.items.map((e) => `${e.machine.name}：${e.report?.history?.sample ?? 0} 个任务的上下文样本；最近 7 天热度查完整索引`).join(' · ')))
}

function render() {
  root.replaceChildren()
  const group = selected === '@global' ? { key: '@global', items: entries.filter((e) => e.project.global && e.report), project: entries.find((e) => e.project.global)?.project, bars: entries.find((e) => e.project.global)?.report?.bars } : groups().find((p) => p.key === selected)
  if (group?.project && group.bars) detailView(group)
  else listView()
}
async function reloadEntry(entry) { entry.report = await call(entry.machine, 'diagnose', { project: entry.project.global ? '@global' : entry.project.root }); entry.error = null }
async function refresh() {
  if (loading) return
  loading = true; problem = ''; entries = []; machines = []; render()
  try {
    // The host owns device discovery. No App network client or second device directory.
    const report = await g.listAgents({ report: true })
    if (!Array.isArray(report.devices)) throw new Error('宿主尚未提供完整机器目录，请更新支持 App API 17 的宿主。')
    machines = report.devices.map((device) => ({ id: device.deviceId, name: device.label, online: device.online, thisMachine: device.thisMachine, checkedAt: device.checkedAt }))
    render()
    for (const machine of machines) {
      if (!machine.online && !machine.thisMachine) { machine.error = '机器离线，尚未读取上下文'; render(); continue }
      try {
        const found = await call(machine, 'discover')
        machine.name ||= found.machine.name
        machine.unmapped = found.unmappedMemories.length
        for (const project of found.projects) entries.push({ machine, project, report: null })
        entries.push({ machine, project: { key: 'global', name: '全局规矩', root: '@global', global: true }, report: null })
        render()
        for (const entry of entries.filter((e) => e.machine === machine)) {
          try { await reloadEntry(entry) } catch (e) { entry.error = e.message || String(e); machine.error = `${entry.project.name}：${entry.error}` }
          render()
        }
      } catch (e) { machine.error = e.message || String(e); render() }
    }
  } catch (e) { problem = e.message || String(e) }
  finally { loading = false; render() }
}
g.onContextChanged(async () => {
  const previous = ctx
  ctx = await g.getContext()
  if (previous.session?.deviceId !== ctx.session?.deviceId || (previous.layout?.visible === false && ctx.layout?.visible === true)) await refresh()
})
g.onCommand((id) => { if (id === 'refresh') void refresh() })
await refresh()
