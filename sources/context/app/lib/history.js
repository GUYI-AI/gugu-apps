import path from 'node:path'
import { canonicalPath } from './discovery.js'

const DAY = 86400000

// Each index call hydrates one time-budgeted round; the host leaves further rounds to the caller.
const INDEX_ROUNDS = 20

export async function sessionIndex(host, { deadline = Infinity } = {}) {
  if (!host?.sessions?.index) return { rows: [], complete: false, reason: '宿主尚未提供任务索引（需要 App API 17）' }
  let rows = [], seenOffsets = new Set(), rounds = 1
  let offset = 0
  while (true) {
    if (seenOffsets.has(offset)) throw new Error('任务索引分页没有前进')
    seenOffsets.add(offset)
    const page = await host.sessions.index({ offset, limit: 100 })
    if (page.rows.some((row) => !row.group || !Object.hasOwn(row.group, 'key'))) throw new Error('宿主尚未提供任务归属，请更新支持 App API 17 的宿主。')
    rows.push(...page.rows)
    if (page.pending && rounds < INDEX_ROUNDS && Date.now() < deadline) { rows = []; seenOffsets = new Set(); offset = 0; rounds++; continue }
    if (page.pending || page.stale) return { rows, complete: false, reason: '宿主任务索引仍在更新，请稍后刷新', total: page.total, progress: page.pending ? { pending: page.pending } : null }
    if (page.nextOffset === null || page.nextOffset === undefined) return { rows: [...new Map(rows.map((r) => [`${r.source}:${r.providerSessionId}`, r])).values()], complete: true, total: page.total }
    offset = page.nextOffset
  }
}

export function taskActivity(rows, firstTurns, now = Date.now()) {
  const starts = [], unknownStarts = []
  for (const row of rows) {
    if (row.updatedAt < now - 7 * DAY) continue
    const id = `${row.source}:${row.providerSessionId}`, at = firstTurns.get(id)
    if (at && Number.isFinite(Date.parse(at))) starts.push({ id, source: row.source, at })
    else unknownStarts.push(id)
  }
  const hot = starts.filter((s) => Date.parse(s.at) >= now - 7 * DAY && Date.parse(s.at) <= now)
  return { hot: unknownStarts.length ? null : hot.length, unknownStarts, hotTasks: hot.map((s) => s.id),
    sources: Object.fromEntries(['claude-code', 'codex'].map((source) => [source, unknownStarts.some((id) => id.startsWith(`${source}:`)) ? null : hot.filter((s) => s.source === source).length])) }
}

// contexts and firstTurns carry over between calls, so a call that hits its deadline leaves the next call less to read.
export async function observe(host, rows, { sample = 300, now = Date.now(), firstTurns = new Map(), contexts = new Map(), deadline = Infinity } = {}) {
  if (!host?.sessions?.read) return { complete: false, reason: '宿主尚未提供上下文读数（需要 App API 17）', sessions: [], hot: null }
  const selected = rows.toSorted((a, b) => b.updatedAt - a.updatedAt)
  const contextKey = (row) => `${row.source}:${row.providerSessionId}:${row.updatedAt}`
  const owed = (row, i) => (i < sample && !contexts.has(contextKey(row))) || (row.updatedAt >= now - 7 * DAY && !firstTurns.has(`${row.source}:${row.providerSessionId}`))
  let next = 0
  // Match discovery's bounded I/O concurrency. Both views use the same host reader;
  // one slow transcript must not serialize every unrelated task in the sample.
  await Promise.all(Array.from({ length: Math.min(8, selected.length) }, async () => {
    while (next < selected.length && Date.now() < deadline) {
      const i = next++, row = selected[i], id = `${row.source}:${row.providerSessionId}`
      const [context, page] = await Promise.all([
        i < sample && !contexts.has(contextKey(row)) ? host.sessions.read({ source: row.source, filePath: row.filePath, view: 'context' }) : null,
        row.updatedAt >= now - 7 * DAY && !firstTurns.has(id) ? host.sessions.read({ source: row.source, filePath: row.filePath, offset: 0, limit: 1 }) : null,
      ])
      if (context) contexts.set(contextKey(row), context)
      if (page) {
        const start = page.turns[0]?.createdAt
        firstTurns.set(id, start && Number.isFinite(Date.parse(start)) ? start : null)
      }
    }
  }))
  const left = selected.filter(owed).length
  if (left) return { complete: false, reason: '正在读取任务记录', progress: { done: selected.length - left, total: selected.length }, sessions: [], hot: null }
  const observations = selected.slice(0, sample).map((row) => ({ ...row, ...contexts.get(contextKey(row)) }))
  return {
    complete: true, sessions: observations, sample: observations.length, total: rows.length,
    since: selected.length && sample > 0 ? new Date(selected[Math.min(selected.length, sample) - 1].updatedAt).toISOString() : null,
    ...taskActivity(rows, firstTurns, now),
  }
}

export async function summarizeHistory(history, files, now = Date.now()) {
  const mentions = new Map(files.map((f) => [f.path, new Set()]))
  const names = Map.groupBy(files, (f) => f.file)
  const refs = [...new Set((history?.sessions || []).flatMap((task) => task.refs || []))].filter((ref) => names.has(path.basename(ref)))
  const realRefs = new Map(await Promise.all(refs.map(async (ref) => [ref, path.isAbsolute(ref) ? await canonicalPath(ref) : ref])))
  const loaded = [], nested = [], initial = []
  for (const task of history?.sessions || []) {
    const id = `${task.source}:${task.providerSessionId}`
    for (const ref of new Set(task.refs || [])) for (const file of files) {
      const relative = !path.isAbsolute(ref) && names.get(file.file).length === 1 && (ref === file.file || ref.endsWith(`/${file.file}`))
      if (realRefs.get(ref) === file.path || relative) mentions.get(file.path).add(id)
    }
    loaded.push(...(task.loaded || []))
    nested.push(...(task.nested || []))
    const first = (task.loaded || []).find((f) => f.kind === 'rendered-total')
    if (first) initial.push(first.chars)
    else if (task.source === 'codex') {
      const base = (task.loaded || []).find((f) => f.kind === 'base-instructions')
      const project = (task.loaded || []).find((f) => f.kind === 'instruction-file' && f.scope === 'Project')
      if (base || project) initial.push((base?.chars || 0) + (project?.chars || 0))
    }
  }
  const injections = loaded.filter((l) => l.path?.endsWith('/MEMORY.md') && l.at && !l.truncated)
  // Regress per-day maxima so many reloads on one day do not dominate the trend.
  const byDay = new Map()
  for (const row of injections) { const day = row.at.slice(0, 10); byDay.set(day, Math.max(byDay.get(day) || 0, row.chars)) }
  const points = [...byDay].map(([day, chars]) => ({ x: Date.parse(day) / DAY, y: chars }))
  const meanX = points.reduce((s, p) => s + p.x, 0) / points.length
  const meanY = points.reduce((s, p) => s + p.y, 0) / points.length
  const denominator = points.reduce((s, p) => s + (p.x - meanX) ** 2, 0)
  const growthPerDay = denominator ? points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0) / denominator : null
  const sortedInitial = initial.toSorted((a, b) => a - b)
  const middle = Math.floor(sortedInitial.length / 2)
  const initialMedian = sortedInitial.length ? sortedInitial.length % 2 ? sortedInitial[middle] : (sortedInitial[middle - 1] + sortedInitial[middle]) / 2 : null
  return { mentions, loaded, nested, growthPerDay, days: points.length, initialMedian, now }
}
