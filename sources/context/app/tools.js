import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import { createHash, randomUUID } from 'node:crypto'
import { discover as findProjects, discoverRoots, projectIdentity, exists, expand } from './lib/discovery.js'
import { sessionIndex, observe } from './lib/history.js'
import { diagnose as measure, promptFor } from './lib/diagnose.js'
import { makePreview, readPreview, applyPreview } from './lib/repairs.js'

const dataDir = () => { const value = process.env.GUGU_EXTENSION_DATA_DIR; if (!value) throw new Error('宿主没有提供 App 数据夹'); return value }
const settings = () => JSON.parse(process.env.GUGU_APP_SETTINGS || '{}')
const host = () => globalThis.gugu
const pageOnly = { ui: { visibility: ['app'] } }
const object = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const text = { type: 'string' }
const page = { offset: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 25 } }
const projectArg = { type: 'string', description: 'Project root or an explicit memory directory; discover lists projects.' }
let inventory = null

async function projectFor(target, rows = [], discovered = null) {
  if (target === '@global') { const roots = await discoverRoots(settings()); return { key: 'global', name: '全局规矩', root: os.homedir(), locations: [], memories: [], codexRoots: roots.codex, claudeRoots: roots.claude, global: true } }
  const full = expand(target)
  const listed = discovered?.projects.find((p) => p.root === full || p.locations.includes(full) || p.memories.includes(full))
  if (listed) return listed
  const info = await findProjects({ settings: settings(), sessions: rows, extraPaths: [target] })
  if (inventory?.rows === rows) inventory.discovered = info
  if (await exists(path.join(full, 'MEMORY.md'))) {
    const real = await fs.realpath(full)
    const known = info.projects.find((p) => p.memories.includes(real))
    return known || { key: `memory:${real}`, name: path.basename(path.dirname(full)), root: real, locations: [], memories: [real], codexRoots: [], claudeRoots: [] }
  }
  const project = info.projects.find((p) => p.root === full || p.locations.includes(full))
  if (project) return project
  const identity = await projectIdentity(full)
  if (!identity) throw new Error(`没有找到项目：${target}`)
  const roots = await discoverRoots(settings())
  return { ...identity, locations: [identity.cwd], memories: [], codexRoots: roots.codex, claudeRoots: roots.claude }
}
async function saveReport(report) {
  const key = createHash('sha256').update(report.project.key).digest('hex'), version = randomUUID()
  const dir = path.join(dataDir(), 'reports')
  await fs.mkdir(dir, { recursive: true, mode: 0o700 })
  const stored = { ...report, version }
  // One current report per project; history belongs to the host, not a second App cache.
  await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(stored), { mode: 0o600 })
  return `${key}:${version}`
}
async function reportFor(id) {
  if (!/^[a-f0-9]{64}:[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid report id')
  const [key, version] = id.split(':')
  const report = JSON.parse(await fs.readFile(path.join(dataDir(), 'reports', `${key}.json`), 'utf8'))
  if (report.version !== version) throw new Error('诊断已刷新，请重新打开项目')
  return report
}
function summary(report, id) {
  return { id, project: report.project, bars: report.bars, capacities: report.capacities, capacityForecasts: report.rules.find((r) => r.id === 'R3').findings, instructions: report._instructions.map((f) => f.path), history: report.history, measuredAt: report.measuredAt, agents: report.agents,
    rules: report.rules.map(({ findings, ...rule }) => ({ ...rule, count: findings.length, fixable: findings.some((f) => f.repair) })) }
}
function onlyPerson(call) { if (call?.agent) throw new Error('文件写入只能由人在 App 页面查看预览并确认') }

export const discover = {
  description: 'Find this computer’s Claude/Codex configuration roots and projects. Merge worktrees and realpath aliases. Activity uses the host session index only.',
  inputSchema: object(), annotations: { readOnlyHint: true },
  async run() {
    inventory = await sessionIndex(host())
    const found = await findProjects({ settings: settings(), sessions: inventory.rows })
    inventory.discovered = found
    return { ...found, history: { complete: inventory.complete, reason: inventory.reason, total: inventory.total } }
  },
}
export const diagnose = {
  description: 'Measure 21 deterministic context checks, activity, health and loading capacity for a project. Semantic checks produce prompts only. Missing host observations remain pending.',
  inputSchema: object({ project: projectArg }, ['project']), annotations: { readOnlyHint: true },
  async run({ project }) {
    // A page refresh calls discover once, then diagnoses its projects against that
    // same index. Do not rescan every historical config root for every role card.
    inventory ||= await sessionIndex(host())
    const found = await projectFor(project, inventory.rows, inventory.discovered)
    const rows = inventory.rows.filter((row) => found.locations.includes(row.cwd) || row.cwd === found.root)
    const history = found.global ? { complete: true, sessions: [], hot: 0, sample: 0, total: 0 } : inventory.complete ? await observe(host(), rows, { sample: Number(settings().sample || 300) }) : { complete: false, reason: inventory.reason, sessions: [], hot: null }
    const report = await measure(found, history)
    return summary(report, await saveReport(report))
  },
}
export const findings = {
  description: 'Page the evidence for a diagnosed rule; all paths and counts come from the same report.',
  inputSchema: object({ report: text, rule: text, ...page }, ['report', 'rule']), annotations: { readOnlyHint: true },
  async run({ report, rule, offset = 0, limit = 15 }) {
    const result = (await reportFor(report)).rules.find((r) => r.id === rule)
    if (!result) throw new Error('Unknown rule')
    const end = Math.min(result.findings.length, offset + limit)
    return { rows: result.findings.slice(offset, end), total: result.findings.length, nextOffset: end < result.findings.length ? end : null }
  },
}
export const preview = {
  description: 'Generate a deterministic repair preview; writes no project files. A person reviews it in the App before applying.',
  inputSchema: object({ report: text, rule: text }, ['report', 'rule']), _meta: pageOnly,
  async run({ report, rule }, call) { onlyPerson(call); return makePreview(await reportFor(report), rule, dataDir()) },
}
export const preview_read = {
  description: 'Read every page of a saved repair preview before confirming it.',
  inputSchema: object({ preview: text, offset: { type: 'integer', minimum: 0 } }, ['preview']), annotations: { readOnlyHint: true }, _meta: pageOnly,
  async run({ preview, offset = 0 }) { return readPreview(dataDir(), preview, offset) },
}
export const apply = {
  description: 'Apply a person-confirmed preview after rechecking every source hash, realpath and modification time. Save originals in the App data folder first.',
  inputSchema: object({ preview: text, digest: text, confirmed: { type: 'boolean' } }, ['preview', 'digest', 'confirmed']), _meta: pageOnly,
  async run({ preview, digest, confirmed }, call) { onlyPerson(call); return applyPreview(dataDir(), preview, digest, confirmed) },
}
export const agent_prompt = {
  description: 'Prepare a copyable prompt for one semantic check or a rule needing judgment. Does not dispatch an agent or change files.',
  inputSchema: object({ report: text, rule: text }, ['report', 'rule']), annotations: { readOnlyHint: true },
  async run({ report, rule }) { return { prompt: promptFor(await reportFor(report), rule) } },
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2]
  if (command === '--diagnose' && process.argv[3]) {
    try {
      const historyIndex = process.argv.indexOf('--context-export')
      const exported = historyIndex < 0 ? null : JSON.parse(await fs.readFile(process.argv[historyIndex + 1], 'utf8'))
      const sessions = exported ? Array.isArray(exported) ? exported : exported.sessions || [exported] : []
      const history = exported ? { ...(!Array.isArray(exported) ? exported : {}), sessions, complete: true, hot: exported.hot ?? null, sample: sessions.length } : null
      const project = await projectFor(process.argv[3], history?.sessions || [])
      const report = await measure(project, history)
      for (const rule of report.rules) {
        if (rule.id !== 'R17') for (const finding of rule.findings) console.log(JSON.stringify({ type: 'finding', rule: rule.id, ...finding }))
        console.log(JSON.stringify({ type: 'rule', rule: rule.id, title: rule.title, count: rule.findings.length, pending: rule.pending, ...(rule.metrics ? { metrics: rule.metrics } : {}) }))
      }
      console.log(JSON.stringify({ type: 'summary', project: report.project, bars: report.bars, capacities: report.capacities }))
    } catch (e) { console.error(e.message); process.exitCode = 1 }
  } else { console.error('Usage: node tools.js --diagnose <memory-directory|project-root> [--context-export <host-context-summary.json>]'); process.exitCode = 1 }
}
