const DAY = 86400000

export async function sessionIndex(host) {
  if (!host?.sessions?.index) return { rows: [], complete: false, reason: '宿主尚未提供任务索引（需要 App API 17）' }
  const rows = [], seenOffsets = new Set()
  let offset = 0
  while (true) {
    if (seenOffsets.has(offset)) throw new Error('任务索引分页没有前进')
    seenOffsets.add(offset)
    const page = await host.sessions.index({ offset, limit: 100 })
    rows.push(...page.rows)
    if (page.pending || page.stale) return { rows, complete: false, reason: '宿主任务索引仍在更新，请稍后刷新', total: page.total }
    if (page.nextOffset === null || page.nextOffset === undefined) return { rows: [...new Map(rows.map((r) => [`${r.source}:${r.providerSessionId}`, r])).values()], complete: true, total: page.total }
    offset = page.nextOffset
  }
}

export async function observe(host, rows, { sample = 300, now = Date.now() } = {}) {
  if (!host?.sessions?.read) return { complete: false, reason: '宿主尚未提供上下文读数（需要 App API 17）', sessions: [], hot: null }
  const selected = rows.toSorted((a, b) => b.updatedAt - a.updatedAt)
  const observations = [], starts = [], unknownStarts = []
  for (let i = 0; i < selected.length; i++) {
    const row = selected[i]
    if (i < sample) observations.push({ ...row, ...await host.sessions.read({ source: row.source, filePath: row.filePath, view: 'context' }) })
    if (row.updatedAt >= now - 7 * DAY) {
      const page = await host.sessions.read({ source: row.source, filePath: row.filePath, offset: 0, limit: 1 })
      const start = page.turns[0]?.createdAt
      if (start && Number.isFinite(Date.parse(start))) starts.push({ id: `${row.source}:${row.providerSessionId}`, source: row.source, at: start })
      else unknownStarts.push(`${row.source}:${row.providerSessionId}`)
    }
  }
  const hot = starts.filter((s) => Date.parse(s.at) >= now - 7 * DAY && Date.parse(s.at) <= now)
  return {
    complete: true, sessions: observations, sample: observations.length, total: rows.length,
    since: selected.length ? new Date(selected[Math.min(selected.length, sample) - 1].updatedAt).toISOString() : null,
    hot: unknownStarts.length ? null : hot.length, unknownStarts,
    hotTasks: hot.map((s) => s.id),
    sources: Object.fromEntries(['claude-code', 'codex'].map((source) => [source, hot.filter((s) => s.source === source).length])),
  }
}

export function summarizeHistory(history, files, now = Date.now()) {
  const mentions = new Map(files.map((f) => [f.file, new Set()]))
  const loaded = [], nested = [], initial = []
  for (const task of history?.sessions || []) {
    const id = `${task.source}:${task.providerSessionId}`
    for (const ref of new Set(task.refs || [])) for (const file of files) if (ref === file.file || ref.endsWith(`/${file.file}`)) mentions.get(file.file).add(id)
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
