import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
export const expand = (p, home = os.homedir()) => p === '~' ? home : p.startsWith('~/') ? path.join(home, p.slice(2)) : path.resolve(p)
export async function pathStatus(p, access = fs.access) {
  try { await access(p); return 'present' }
  catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return 'missing'; if (e.code === 'EACCES' || e.code === 'EPERM') return 'unverifiable'; throw e }
}
export async function exists(p) { return await pathStatus(p) !== 'missing' }
export async function canonicalPath(p) {
  if (await pathStatus(p) === 'unverifiable') return path.resolve(p)
  if (await exists(p)) return fs.realpath(p)
  const parent = path.dirname(p)
  return parent === p ? p : path.join(await canonicalPath(parent), path.basename(p))
}
const split = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean)

async function git(cwd, args, optional = false) {
  try { return (await exec('git', ['-C', cwd, ...args], { timeout: 10000, maxBuffer: 1024 * 1024 })).stdout.trim() }
  catch (e) { if (optional && e.code === 1) return null; if (e.code === 128 && /not a git repository/.test(e.stderr)) return null; throw new Error(`Git could not identify ${cwd}: ${e.stderr || e.message}`) }
}

export function remoteIdentity(remote) {
  if (!remote) return null
  // Only canonicalize Git transports; never return credentials/query strings from a remote URL.
  const scp = remote.match(/^(?:[^@/:]+@)?([^/:]+):(.+)$/)
  if (scp && !remote.includes('://')) return `${scp[1].toLowerCase()}/${scp[2].replace(/^\/+|\.git\/?$/g, '')}`
  try { const u = new URL(remote); return u.protocol === 'file:' ? null : `${u.hostname.toLowerCase()}${u.pathname.replace(/\.git\/?$/, '')}` }
  catch { return null }
}

export async function projectIdentity(cwd) {
  if (await pathStatus(cwd) !== 'present') return null
  const real = await fs.realpath(cwd)
  const temporary = await Promise.all([os.tmpdir(), '/tmp', '/private/tmp', '/var/tmp'].map(canonicalPath))
  if (temporary.some((base) => real === base || real.startsWith(`${base}/`))) return null
  if (!(await fs.stat(real)).isDirectory()) return null
  const root = await git(real, ['rev-parse', '--show-toplevel'])
  if (!root) return { key: `directory:${real}`, name: path.basename(real), root: real, cwd: real, checkoutRoot: real, remote: null, commonDir: null }
  const commonDir = await fs.realpath(await git(real, ['rev-parse', '--path-format=absolute', '--git-common-dir']))
  const main = path.basename(commonDir) === '.git' ? path.dirname(commonDir) : root
  const remote = remoteIdentity(await git(real, ['config', '--get', 'remote.origin.url'], true))
  return { key: remote ? `git:${remote}` : `directory:${main}`, name: path.basename(main), root: main, cwd: real, checkoutRoot: root, remote, commonDir }
}

export function projectSections(raw) {
  const headers = [...raw.matchAll(/^\[(projects\."((?:\\.|[^"\\])*)"[^\]]*)\]\s*$/gm)]
  return headers.map((m) => ({ path: JSON.parse(`"${m[2]}"`), start: m.index, end: raw.indexOf('\n[', m.index + m[0].length) + 1 || raw.length, header: m[0] }))
}

export async function discoverRoots(settings = {}, env = process.env, home = os.homedir()) {
  const claude = [env.CLAUDE_CONFIG_DIR, path.join(home, '.claude'), ...split(settings.claudeRoots)].filter(Boolean)
  const accounts = path.join(home, '.rec/claude/accounts')
  if (await exists(accounts)) for (const d of await fs.readdir(accounts, { withFileTypes: true })) if (d.isDirectory()) claude.push(path.join(accounts, d.name, 'config'))
  const codex = [env.CODEX_HOME, path.join(home, '.codex'), ...split(settings.codexRoots)].filter(Boolean)
  async function unique(paths) { const found = new Set(); for (const p of paths) if (await exists(expand(p, home))) found.add(await fs.realpath(expand(p, home))); return [...found] }
  return { claude: await unique(claude), codex: await unique(codex) }
}

export async function discover({ settings = {}, sessions = [], extraPaths = [], env, home = os.homedir() } = {}) {
  const roots = await discoverRoots(settings, env, home)
  const candidates = new Set([...split(settings.projects), ...extraPaths, ...sessions.map((s) => s.cwd).filter(Boolean)].map((p) => expand(p, home)))
  for (const root of roots.claude) {
    for (const config of new Set([path.join(root, '.claude.json'), path.join(root, '..', '.claude.json')])) {
      if (await exists(config)) {
        const parsed = JSON.parse(await fs.readFile(config, 'utf8'))
        for (const p of Object.keys(parsed.projects || {})) candidates.add(expand(p, home))
      }
    }
  }
  for (const root of roots.codex) if (await exists(path.join(root, 'config.toml'))) {
    for (const s of projectSections(await fs.readFile(path.join(root, 'config.toml'), 'utf8'))) candidates.add(expand(s.path, home))
  }
  const projects = new Map()
  // Filesystem and Git subprocess waits are independent. Avoid serially paying the
  // process-start cost for every historical project before diagnosing one project.
  const paths = [...candidates].sort(), identities = new Map()
  let next = 0
  await Promise.all(Array.from({ length: Math.min(8, paths.length) }, async () => {
    while (next < paths.length) { const cwd = paths[next++]; identities.set(cwd, await projectIdentity(cwd)) }
  }))
  for (const cwd of paths) {
    const identity = identities.get(cwd)
    if (!identity) continue
    const project = projects.get(identity.key) || { ...identity, locations: [], instructionRoots: {}, memories: [], codexRoots: roots.codex, claudeRoots: roots.claude }
    if (!project.locations.includes(identity.cwd)) project.locations.push(identity.cwd)
    project.instructionRoots[identity.cwd] = identity.checkoutRoot
    for (const root of roots.claude) {
      // Claude's actual project-directory encoding; no ambiguous reverse decoding.
      for (const alias of new Set([cwd, identity.cwd, identity.root])) {
        const memory = path.join(root, 'projects', alias.replace(/[^a-zA-Z0-9]/g, '-'), 'memory')
        if (await exists(memory)) { const real = await fs.realpath(memory); if (!project.memories.includes(real)) project.memories.push(real) }
      }
    }
    projects.set(identity.key, project)
  }
  const mapped = new Set([...projects.values()].flatMap((p) => p.memories)), unmappedMemories = new Set()
  for (const root of roots.claude) {
    const projectDir = path.join(root, 'projects')
    if (!await exists(projectDir)) continue
    for (const entry of await fs.readdir(projectDir, { withFileTypes: true })) if (entry.isDirectory() || entry.isSymbolicLink()) {
      const memory = path.join(projectDir, entry.name, 'memory')
      if (await exists(memory)) { const real = await fs.realpath(memory); if (!mapped.has(real)) unmappedMemories.add(real) }
    }
  }
  return { machine: { name: os.hostname(), platform: os.platform() }, roots, projects: [...projects.values()], unmappedMemories: [...unmappedMemories] }
}

export async function instructionFiles(project) {
  const paths = new Set()
  for (const cwd of project.locations) {
    let current = cwd
    while (true) {
      for (const name of ['AGENTS.md', 'AGENTS.override.md', 'CLAUDE.md', 'CLAUDE.local.md']) if (await exists(path.join(current, name))) paths.add(await fs.realpath(path.join(current, name)))
      if (current === (project.instructionRoots?.[cwd] || project.root) || path.dirname(current) === current) break
      current = path.dirname(current)
    }
  }
  for (const root of project.codexRoots || []) for (const name of ['AGENTS.override.md', 'AGENTS.md']) if (await exists(path.join(root, name))) { paths.add(await fs.realpath(path.join(root, name))); break }
  for (const root of project.claudeRoots || []) if (await exists(path.join(root, 'CLAUDE.md'))) paths.add(await fs.realpath(path.join(root, 'CLAUDE.md')))
  return Promise.all([...paths].map(async (p) => ({ path: p, raw: await fs.readFile(p, 'utf8') })))
}
