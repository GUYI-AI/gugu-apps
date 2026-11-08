import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import { createHash, randomUUID } from 'node:crypto'
import { discover as findProjects, discoverRoots, projectIdentity, exists, expand } from './lib/discovery.js'
import { sessionIndex, observe, taskActivity } from './lib/history.js'
import { diagnose as measure, promptFor } from './lib/diagnose.js'
import { makePreview, readPreview, applyPreview } from './lib/repairs.js'
import { ZH, programWords } from './words.js'

const dataDir = (words = ZH) => { const value = process.env.GUGU_EXTENSION_DATA_DIR; if (!value) throw new Error(words.hostNoDataDir); return value }
const settings = () => JSON.parse(process.env.GUGU_APP_SETTINGS || '{}')
const host = () => globalThis.gugu
const pageOnly = { ui: { visibility: ['app'] } }
// locale: the page's language for the words it shows; a call without one gets Chinese.
const object = (properties = {}, required = []) => ({ type: 'object', properties: { ...properties, locale: { type: 'string', description: 'Language of text shown to a person: zh (default) or en.' } }, required, additionalProperties: false })
const text = { type: 'string' }
const page = { offset: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 25 } }
const projectArg = { type: 'string', description: 'Project root or an explicit memory directory; discover lists projects.' }
let inventory = null
// A page's program call is bounded by the host's 60 s MCP request timeout; the static checks still need their share after reading.
const READ_BUDGET_MS = 25000

async function groupsFor(paths, words) {
  const page = await host().sessions.index({ groupPaths: paths, limit: 1 })
  if (!Array.isArray(page.groups)) throw new Error(words.noGroups)
  return page.groups
}
const find = (options, words = ZH) => findProjects({ ...options, words, groupPaths: host()?.sessions?.index ? (paths) => groupsFor(paths, words) : undefined })

async function projectFor(target, rows = [], discovered = null, words = ZH) {
  if (target === '@global') { const info = discovered || await find({ settings: settings(), sessions: rows }, words); return { key: 'global', name: words.globalName, root: os.homedir(), locations: [], memories: [], unmappedMemories: info.unmappedMemories, codexRoots: info.roots.codex, claudeRoots: info.roots.claude, global: true } }
  const full = expand(target)
  const listed = discovered?.projects.find((p) => p.root === full || p.locations.includes(full) || p.sessionCwds?.includes(full) || p.memories.includes(full))
  if (listed) return listed
  const info = await find({ settings: settings(), sessions: rows, extraPaths: [target] }, words)
  if (inventory?.rows === rows) inventory.discovered = info
  if (await exists(path.join(full, 'MEMORY.md'))) {
    const real = await fs.realpath(full)
    const known = info.projects.find((p) => p.memories.includes(real))
    return known || { key: `memory:${real}`, name: path.basename(path.dirname(full)), root: real, locations: [], memories: [real], codexRoots: [], claudeRoots: [] }
  }
  const project = info.projects.find((p) => p.root === full || p.locations.includes(full) || p.sessionCwds?.includes(full))
  if (project) return project
  const identity = await projectIdentity(full)
  if (!identity) throw new Error(words.noProject(target))
  const roots = await discoverRoots(settings())
  return { ...identity, locations: [identity.cwd], memories: [], codexRoots: roots.codex, claudeRoots: roots.claude }
}
async function saveReport(report, words) {
  const key = createHash('sha256').update(report.project.key).digest('hex'), version = randomUUID()
  const dir = path.join(dataDir(words), 'reports')
  await fs.mkdir(dir, { recursive: true, mode: 0o700 })
  const stored = { ...report, version }
  // One current report per project; history belongs to the host, not a second App cache.
  await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(stored), { mode: 0o600 })
  return `${key}:${version}`
}
async function reportFor(id, words = ZH) {
  if (!/^[a-f0-9]{64}:[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid report id')
  const [key, version] = id.split(':')
  const report = JSON.parse(await fs.readFile(path.join(dataDir(words), 'reports', `${key}.json`), 'utf8'))
  if (report.version !== version) throw new Error(words.reportStale)
  return report
}
function summary(report, id) {
  return { id, project: report.project, bars: report.bars, capacities: report.capacities, capacityForecasts: report.rules.find((r) => r.id === 'R3').findings, instructions: report._instructions.map((f) => f.path), history: report.history, measuredAt: report.measuredAt, agents: report.agents,
    rules: report.rules.map(({ findings, ...rule }) => ({ ...rule, count: rule.count ?? findings.length, fixable: findings.some((f) => f.repair) })) }
}
function onlyPerson(call, words) { if (call?.agent) throw new Error(words.personOnly) }
const rowsFor = (project) => inventory.rows.filter((row) => project.global ? row.group?.key === 'gugu:task-home' : row.group?.key === project.key || project.sessionCwds?.includes(row.cwd) || project.locations.includes(row.cwd) || row.cwd === project.root)

export const discover = {
  description: 'Find this computer’s Claude/Codex roots and context directories. Reuse host task-history grouping and repository identity; deduplicate filesystem aliases.',
  inputSchema: object(), annotations: { readOnlyHint: true },
  async run({ locale } = {}) {
    const words = programWords(locale)
    const carried = inventory
    inventory = await sessionIndex(host(), { deadline: Date.now() + READ_BUDGET_MS, words })
    inventory.firstTurns = carried?.firstTurns || new Map()
    inventory.contexts = carried?.contexts || new Map()
    const found = await find({ settings: settings(), sessions: inventory.rows }, words)
    inventory.discovered = found
    return { ...found, history: { complete: inventory.complete, reason: inventory.reason, total: inventory.total, progress: inventory.progress } }
  },
}
export const activity = {
  description: 'Count seven-day task starts once for the discovered project inventory, using the host history reader. Unknown starts remain unknown.',
  inputSchema: object(), annotations: { readOnlyHint: true },
  async run({ locale } = {}) {
    const words = programWords(locale)
    const deadline = Date.now() + READ_BUDGET_MS
    inventory ||= await sessionIndex(host(), { deadline, words })
    inventory.firstTurns ||= new Map()
    inventory.contexts ||= new Map()
    inventory.discovered ||= await find({ settings: settings(), sessions: inventory.rows }, words)
    const read = inventory.complete ? await observe(host(), inventory.rows, { sample: 0, firstTurns: inventory.firstTurns, deadline, words }) : inventory
    const unknown = { hot: null, hotTasks: [], unknownStarts: [] }
    return { complete: read.complete, reason: read.reason, progress: read.progress, unassigned: read.complete ? taskActivity(rowsFor({ global: true }), inventory.firstTurns) : unknown, projects: inventory.discovered.projects.map((project) => ({ key: project.key, ...(read.complete ? taskActivity(rowsFor(project), inventory.firstTurns) : unknown) })) }
  },
}
export const diagnose = {
  description: 'Measure 21 deterministic context checks, activity, health and loading capacity for a project. Semantic checks produce prompts only. Missing host observations remain pending.',
  inputSchema: object({ project: projectArg }, ['project']), annotations: { readOnlyHint: true },
  async run({ project, locale }) {
    const words = programWords(locale)
    // A page refresh calls discover once, then diagnoses its projects against that
    // same index. Do not rescan every historical config root for every role card.
    const deadline = Date.now() + READ_BUDGET_MS
    inventory ||= await sessionIndex(host(), { deadline, words })
    inventory.firstTurns ||= new Map()
    inventory.contexts ||= new Map()
    const found = await projectFor(project, inventory.rows, inventory.discovered, words)
    const rows = rowsFor(found)
    const history = inventory.complete ? await observe(host(), rows, { sample: Number(settings().sample || 300), firstTurns: inventory.firstTurns, contexts: inventory.contexts, deadline, words }) : { complete: false, reason: inventory.reason, sessions: [], hot: null }
    // Reading stopped at the deadline: say how far it got and let the page call again, rather than outrun the host's request timeout.
    if (history.progress) return { complete: false, reason: history.reason, progress: history.progress, project: found }
    const report = await measure(found, history, { words })
    return summary(report, await saveReport(report, words))
  },
}
export const findings = {
  description: 'Page the evidence for a diagnosed rule; all paths and counts come from the same report.',
  inputSchema: object({ report: text, rule: text, ...page }, ['report', 'rule']), annotations: { readOnlyHint: true },
  async run({ report, rule, offset = 0, limit = 15, locale }) {
    const result = (await reportFor(report, programWords(locale))).rules.find((r) => r.id === rule)
    if (!result) throw new Error('Unknown rule')
    const end = Math.min(result.findings.length, offset + limit)
    return { rows: result.findings.slice(offset, end), total: result.findings.length, nextOffset: end < result.findings.length ? end : null }
  },
}
export const preview = {
  description: 'Generate a deterministic repair preview; writes no project files. A person reviews it in the App before applying.',
  inputSchema: object({ report: text, rule: text }, ['report', 'rule']), _meta: pageOnly,
  async run({ report, rule, locale }, call) { const words = programWords(locale); onlyPerson(call, words); return makePreview(await reportFor(report, words), rule, dataDir(words), words) },
}
export const preview_read = {
  description: 'Read every page of a saved repair preview before confirming it.',
  inputSchema: object({ preview: text, offset: { type: 'integer', minimum: 0 } }, ['preview']), annotations: { readOnlyHint: true }, _meta: pageOnly,
  async run({ preview, offset = 0, locale }) { const words = programWords(locale); return readPreview(dataDir(words), preview, offset, undefined, words) },
}
export const apply = {
  description: 'Apply a person-confirmed preview after rechecking every source hash, realpath and modification time. Save originals in the App data folder first.',
  inputSchema: object({ preview: text, digest: text, confirmed: { type: 'boolean' } }, ['preview', 'digest', 'confirmed']), _meta: pageOnly,
  async run({ preview, digest, confirmed, locale }, call) { const words = programWords(locale); onlyPerson(call, words); return applyPreview(dataDir(words), preview, digest, confirmed, words) },
}
export const agent_prompt = {
  description: 'Prepare a copyable prompt for one semantic check or a rule needing judgment. Does not dispatch an agent or change files.',
  inputSchema: object({ report: text, rule: text }, ['report', 'rule']), annotations: { readOnlyHint: true },
  async run({ report, rule, locale }) { const words = programWords(locale); return { prompt: promptFor(await reportFor(report, words), rule, words) } },
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
        console.log(JSON.stringify({ type: 'rule', rule: rule.id, title: rule.title, count: rule.count ?? rule.findings.length, evidenceCount: rule.evidenceCount, pending: rule.pending, ...(rule.metrics ? { metrics: rule.metrics } : {}) }))
      }
      console.log(JSON.stringify({ type: 'summary', project: report.project, bars: report.bars, capacities: report.capacities }))
    } catch (e) { console.error(e.message); process.exitCode = 1 }
  } else { console.error('Usage: node tools.js --diagnose <memory-directory|project-root> [--context-export <host-context-summary.json>]'); process.exitCode = 1 }
}
