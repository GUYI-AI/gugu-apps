import fs from 'node:fs/promises'
import path from 'node:path'
import { readMemory, normalize, reachable, slug, lines, links } from './markdown.js'
import { exists, expand, instructionFiles, projectSections, canonicalPath } from './discovery.js'
import { summarizeHistory } from './history.js'
import { candidates, tokens } from './semantic.js'
import { missingPaths } from './path-check.js'

const DAY = 86400000
const definitions = [
  ['R1', '记忆索引容量', 'yellow'], ['R2', '正在被截断', 'red'], ['R3', '触顶预测', 'info'],
  ['R4', '被取代的规矩还在加载', 'red'], ['R5', 'Claude 读不到 AGENTS.md', 'red'],
  ['R6', '常用但开工看不到', 'yellow'], ['R7', '读进了声明不可信的规矩', 'yellow'],
  ['R8', '悬空链接 / 孤儿 / 不可达', 'yellow'], ['R9', 'frontmatter 缺项', 'clean'],
  ['R10', '常驻上下文过大', 'clean'], ['R11', '冷记忆', 'clean'], ['R12', '描述漂移', 'clean'],
  ['R13', '多重收录', 'clean'], ['R14', '超长索引行', 'clean'], ['R15', '描述过长', 'clean'],
  ['R16', '超大单文件', 'clean'], ['R17', '失效路径', 'clean'], ['R18', '字面重复', 'clean'],
  ['R19', '规则分散', 'clean'], ['R20', '配置状态垃圾', 'clean'], ['R21', '非记忆文件', 'clean'],
]
export const agentDefinitions = [
  { id: 'A1', title: '没写「取代」的矛盾' }, { id: 'A2', title: '跨语言 / 改写过的重复' }, { id: 'A3', title: '被代码推翻的规矩' },
]

export function capacity(text, harness) {
  if (harness === 'codex') { const bytes = Buffer.byteLength(text); return { harness, bytes, limit: 32768, ratio: bytes / 32768 } }
  const trimmed = text.trim(), count = trimmed ? lines(trimmed).length : 0
  return { harness, chars: trimmed.length, lines: count, limit: 25000, lineLimit: 200, ratio: Math.max(trimmed.length / 25000, count / 200) }
}
export function bars(rules, capacities, hot) {
  const red = rules.filter((r) => r.severity === 'red' && r.findings.length).length
  const yellow = rules.filter((r) => r.severity === 'yellow' && r.findings.length).length
  const pending = rules.filter((r) => r.pending).map((r) => r.id)
  const ratio = Math.max(0, ...capacities.map((c) => c.ratio))
  return { hot: { count: hot, cells: hot === null ? null : Math.min(10, Math.ceil(Math.log2(hot + 1))) }, health: { value: Math.max(0, 10 - 3 * red - yellow), red, yellow, complete: !pending.length, pending }, capacity: { ratio, percent: Math.round(ratio * 100), cells: Math.min(10, Math.max(ratio > 0 ? 1 : 0, Math.round(ratio * 10))) } }
}

async function imports(filePath, seen = new Set()) {
  const real = await fs.realpath(filePath)
  if (seen.has(real)) return seen
  seen.add(real)
  const raw = await fs.readFile(real, 'utf8')
  for (const m of raw.matchAll(/(?:^|\s)@([^\s`"<>]+\.md)\b/gm)) {
    const next = m[1].startsWith('~') ? expand(m[1]) : path.resolve(path.dirname(real), m[1])
    if (await exists(next)) await imports(next, seen)
  }
  return seen
}

function superseded(files, entries) {
  const byName = new Map(files.map((f) => [f.file, f])), rows = [], seen = new Set()
  for (const current of files.filter((f) => f.file !== 'MEMORY.md' && !f.file.endsWith('-hub.md'))) for (const line of lines(current.body)) {
    const refs = links(line)
    // "merged into" / 已并入 describe the current file as obsolete, not its link target.
    // They already declare the destination, so they are handled as R8 merged stubs.
    for (const word of line.matchAll(/覆盖|取代|替代|作废|推翻|已过时|supersed\w*|overrid\w*|replaces/gi)) for (const link of refs) {
      const gap = link.offset >= word.index + word[0].length ? link.offset - word.index - word[0].length : word.index - link.offset - link.text.length
      const obsolete = byName.get(link.target)
      if (!obsolete || obsolete.file === current.file || gap < 0 || gap > 25) continue
      const indexedBy = entries.filter((e) => e.target === obsolete.file)
      if (!indexedBy.length || obsolete.links.some((l) => l.target === current.file) || indexedBy.some((e) => /已被.*(?:取代|替代|覆盖)|已(?:过时|并入)|superseded/i.test(e.text) || links(e.text).some((l) => l.target === current.file))) continue
      const key = `${current.path}:${obsolete.path}`
      if (!seen.has(key)) { seen.add(key); rows.push({ path: obsolete.path, current: current.path, indexedBy, evidence: line, repair: 'supersede' }) }
    }
  }
  return rows
}

export async function diagnose(project, history = null, { now = Date.now() } = {}) {
  const rules = definitions.map(([id, title, severity]) => ({ id, title, severity, findings: [], pending: null }))
  const rule = (id) => rules.find((r) => r.id === id)
  const add = (id, finding) => rule(id).findings.push(finding)
  const memorySets = await Promise.all(project.memories.map(readMemory))
  const instructions = await instructionFiles(project)
  const instructionTerms = instructions.map((f) => ({ path: f.path, terms: new Set(tokens(f.raw.replace(/-/g, ' '))) }))
  const capacities = []
  const files = memorySets.flatMap((m) => m.files)
  const observed = summarizeHistory(history, files, now)
  const completeHistory = history?.complete === true
  for (const id of ['R3', 'R6', 'R7', 'R10', 'R11']) if (!completeHistory) rule(id).pending = history?.reason || '尚未读取宿主上下文摘要'
  if (!completeHistory) rule('R2').pending = '当前容量已检查；历史截断尚未读取'
  for (const memory of memorySets) {
    const md = memory.files.filter((f) => f.file.endsWith('.md'))
    const byName = new Map(md.map((f) => [f.file, f]))
    const mm = byName.get('MEMORY.md')
    if (!mm) rule('R1').pending = `没有索引：${memory.root}/MEMORY.md`
    const cap = mm ? { ...capacity(mm.raw, 'claude'), path: mm.path } : null
    if (cap) capacities.push(cap)
    if (cap?.ratio >= .7) add('R1', { path: mm.path, ...cap })
    if (cap?.ratio >= 1) add('R2', { path: mm.path, reason: '当前索引达到加载上限', ...cap })
    if (cap && observed.growthPerDay > 0) {
      const daysLeft = (25000 - cap.chars) / observed.growthPerDay
      if (daysLeft < 7) add('R3', { path: mm.path, daysLeft: Math.round(daysLeft * 10) / 10, growthPerDay: Math.round(observed.growthPerDay), observedDays: observed.days })
    }
    const entries = md.flatMap((f) => f.entries)
    const graph = new Map(md.map((f) => [f.file, f.links.map((l) => l.target).filter((t) => byName.has(t))]))
    const reach = reachable(graph)
    const indexed = new Set(md.filter((f) => f.file === 'MEMORY.md' || f.file.endsWith('-hub.md')).flatMap((f) => f.links.map((l) => l.target)))
    const oneLayer = new Set(graph.get('MEMORY.md') || [])
    for (const target of [...oneLayer]) if (target.endsWith('-hub.md')) for (const next of graph.get(target) || []) oneLayer.add(next)
    for (const row of superseded(md, entries)) add('R4', row)
    for (const file of md) {
      for (const link of file.links) if (!byName.has(link.target) && !await exists(path.join(memory.root, link.target))) add('R8', { kind: 'dangling', path: file.path, ...link, repair: 'remove-link' })
      if (file.file === 'MEMORY.md') continue
      if (!indexed.has(file.file)) {
        const merged = file.body.match(/(?:已并入|并入了?|merged into)\s*\[\[([^\]]+)\]\]/i)
        add('R8', { kind: 'orphan', path: file.path, repair: merged && byName.has(`${merged[1]}.md`) ? 'merged-stub' : file.fields.description ? 'index' : null })
      }
      if (!reach.has(file.file)) add('R8', { kind: 'unreachable', path: file.path })
      const missing = ['name', 'description', 'type'].filter((k) => !file.fields[k])
      if (missing.length || file.fields.name !== slug(file.file)) add('R9', { path: file.path, missing, name: file.fields.name, expected: slug(file.file), repair: file.fields.name !== slug(file.file) ? 'name' : null })
      if ((file.fields.description || '').length > 250) add('R15', { path: file.path, chars: file.fields.description.length })
      if (file.bytes > 20000) add('R16', { path: file.path, bytes: file.bytes, repair: 'archive' })
      if (completeHistory) {
        const tasks = observed.mentions.get(file.file)?.size || 0
        if (tasks >= 5 && !oneLayer.has(file.file)) add('R6', { path: file.path, tasks, repair: file.fields.description ? 'index' : null })
        const old = now - file.mtimeMs > 14 * DAY
        if (!tasks) add('R11', { path: file.path, ageDays: Math.floor((now - file.mtimeMs) / DAY), repair: old && file.fields.type === 'project' ? 'archive' : null, sample: history.sample, since: history.since })
      }
    }
    for (const [name, copies] of Map.groupBy(entries, (e) => e.target)) {
      const file = byName.get(name)
      if (copies.length > 1) add('R13', { path: file?.path || path.join(memory.root, name), entries: copies, repair: 'deduplicate-index' })
      for (const entry of copies) {
        const actual = normalize(file?.fields.description), description = normalize(entry.description)
        if (actual && description !== actual && !actual.startsWith(description)) add('R12', { path: path.join(memory.root, entry.file), ...entry, actual: file.fields.description, repair: 'description' })
      }
    }
    for (const [i, text] of lines(mm?.raw || '').entries()) if (text.trim() && text.length > 200) add('R14', { path: mm.path, line: i + 1, chars: text.length })
    for (const f of memory.files.filter((f) => !f.file.endsWith('.md'))) add('R21', { path: f.path, bytes: f.bytes, repair: 'archive' })
    const semantic = candidates(md)
    for (const pair of semantic.duplicates) add('R18', { ...pair, repair: pair.identical ? 'duplicate' : null })
    for (const group of semantic.scattered) {
      const anchors = group.keywords.split(' · ')
      const relatedInstructions = instructionTerms.filter((f) => anchors.some((term) => f.terms.has(term))).map((f) => f.path)
      add('R19', { ...group, relatedInstructions })
    }
    memory.semantic = semantic
  }
  for (const cwd of project.locations) {
    const ag = path.join(cwd, 'AGENTS.md')
    if (!await exists(ag)) continue
    const claude = ['CLAUDE.md', 'CLAUDE.local.md'].map((f) => path.join(cwd, f))
    const present = []
    for (const p of claude) if (await exists(p)) present.push(p)
    if (present.length) {
      const imported = new Set()
      for (const p of present) for (const found of await imports(p)) imported.add(found)
      if (!imported.has(await fs.realpath(ag))) add('R5', { path: present[0], agentsPath: ag, repair: 'import' })
    }
  }
  // Codex project_doc_max_bytes applies only to root-to-cwd entries. Global user_instructions
  // are separate and never consume `remaining` in load_project_instructions:
  // https://github.com/openai/codex/blob/970111f6cb62cc02fe36a82ea7d71b37a2889c97/codex-rs/core/src/agents_md.rs#L55
  for (const cwd of project.locations) {
    const root = project.instructionRoots?.[cwd] || project.root
    const relevant = instructions.filter((f) => {
      const parent = path.dirname(f.path)
      return /^AGENTS(?:\.override)?\.md$/.test(path.basename(f.path)) && (parent === root || parent.startsWith(`${root}/`)) && (parent === cwd || cwd.startsWith(`${parent}/`))
    })
    const selected = [...Map.groupBy(relevant, (f) => path.dirname(f.path)).values()].map((group) => group.find((f) => f.path.endsWith('AGENTS.override.md')) || group[0])
    if (selected.length) capacities.push({ ...capacity(selected.map((f) => f.raw).join(''), 'codex'), path: cwd, files: selected.map((f) => f.path) })
  }
  for (const cap of capacities.filter((c) => c.harness === 'codex')) { if (cap.ratio >= .7) add('R1', cap); if (cap.ratio >= 1) add('R2', { ...cap, reason: 'Codex 规矩达到 32 KiB' }) }
  if (completeHistory) {
    // Historical warnings remain evidence; only the latest MEMORY injection can indicate current truncation.
    const latest = observed.loaded.filter((r) => r.path?.endsWith('/MEMORY.md')).toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at))[0]
    if (latest?.truncated) add('R2', { path: latest.path, at: latest.at, reason: '最近一次注入出现截断警告' })
    if (observed.initialMedian > 30000) add('R10', { chars: observed.initialMedian, sample: history.sample })
    for (const instruction of instructions) for (const line of lines(instruction.raw)) {
      if (!/(?:只读|不作依据|read.only|not (?:an? )?(?:authority|source of truth))/i.test(line)) continue
      const paths = [...line.matchAll(/`([^`]+\/?)`/g)].map((m) => m[1]).filter((p) => !p.includes(' ') && !p.startsWith('http'))
      for (const p of paths) {
        const base = await canonicalPath(p.startsWith('~') || path.isAbsolute(p) ? expand(p) : path.resolve(path.dirname(instruction.path), p))
        for (const nested of observed.nested) if ((await canonicalPath(nested.path)).startsWith(`${base.replace(/\/$/, '')}/`)) add('R7', { path: nested.path, at: nested.at, declaredIn: instruction.path, directory: base, repair: 'snapshot-note' })
      }
    }
  }
  for (const root of project.global ? project.codexRoots || [] : []) {
    const configPath = path.join(root, 'config.toml')
    if (await exists(configPath)) for (const section of projectSections(await fs.readFile(configPath, 'utf8'))) if (!await exists(expand(section.path))) add('R20', { path: configPath, target: section.path, start: section.start, end: section.end, repair: 'config-section' })
    const hooksPath = path.join(root, 'hooks.json')
    if (await exists(hooksPath)) {
      const state = JSON.parse(await fs.readFile(hooksPath, 'utf8'))
      for (const key of Object.keys(state)) if (path.isAbsolute(key) && !await exists(key)) add('R20', { path: hooksPath, target: key, repair: 'hook-state' })
    }
  }
  const paths = await missingPaths(files, project)
  rule('R17').findings = paths.findings
  rule('R17').metrics = paths.metrics
  const stats = bars(rules, capacities, completeHistory ? history.hot : null)
  return { project, rules, capacities, bars: stats, history: history ? { complete: history.complete, sample: history.sample, total: history.total, since: history.since, sources: history.sources, hotTasks: history.hotTasks, reason: history.reason, unknownStarts: history.unknownStarts } : null, agents: agentDefinitions, measuredAt: new Date(now).toISOString(), _memories: memorySets, _instructions: instructions }
}

export function promptFor(report, id) {
  const definition = agentDefinitions.find((r) => r.id === id) || report.rules.find((r) => r.id === id)
  if (!definition) throw new Error(`Unknown rule: ${id}`)
  const pairs = report._memories.flatMap((m) => m.semantic?.pairs || [])
  const goal = { A1: '先对照常驻规矩和当前记忆索引，再逐对判断候选规则是否意思相反；没有明确取代关系时给出理由。', A2: '判断中英文或改写后的规则是否表达同一件事；列出重复及各自独有内容。', A3: '去当前项目源码核对记忆里的命令、文件名和做法是否仍成立；给出源码位置。' }[id] || `处理「${definition.title}」，保持规则原意，给出最小改动。`
  const context = [...report._instructions.map((f) => f.path), ...report._memories.map((m) => path.join(m.root, 'MEMORY.md'))]
  return `项目：${report.project.root}\n检查：${definition.title}\n${goal}\n只读取下面的常驻规矩、索引、候选和它们直接引用的证据；只报结论、理由和最小 diff 建议，先不要修改文件。不要派 agent。\n\n常驻规矩与索引：\n${context.join('\n')}\n\n${id.startsWith('A') ? pairs.map((p) => `${p.a}\n${p.b}\ncos=${p.cosine}；共享标识符：${p.shared.join(', ')}`).join('\n\n') || '没有词法候选；请从项目规矩与记忆索引开始，明确说明检查范围。' : JSON.stringify(definition.findings, null, 2)}`
}
