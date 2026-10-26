import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expand, pathStatus } from './discovery.js'
import { lines } from './markdown.js'

const exec = promisify(execFile)

export async function missingPaths(files, project) {
  if (!files.some((f) => f.file.endsWith('.md'))) return { findings: [], metrics: { checkedPaths: 0, missingPaths: 0, affectedFiles: 0, nonTemporaryFiles: 0, classes: Object.fromEntries(['deleted-worktree', 'temporary', 'moved-or-shorthand', 'missing', 'unverifiable'].map((kind) => [kind, { paths: 0, files: 0 }])) } }
  const repositories = [project.root]
  for (const e of await fs.readdir(project.root, { withFileTypes: true })) if (e.isDirectory() && !e.name.startsWith('.') && await pathStatus(path.join(project.root, e.name, '.git')) === 'present') repositories.push(path.join(project.root, e.name))
  const trees = new Map()
  const basenames = new Set(), suffixes = new Set(), topDirectories = new Set(repositories.map((repo) => path.basename(repo)))
  for (const repo of repositories) {
    for (const entry of await fs.readdir(repo, { withFileTypes: true })) if (entry.isDirectory()) topDirectories.add(entry.name)
    if (await pathStatus(path.join(repo, '.git')) !== 'present') continue
    const { stdout } = await exec('git', ['-C', repo, 'ls-tree', '-r', '--name-only', 'HEAD'], { maxBuffer: 16 * 1024 * 1024 })
    const tree = new Set(stdout.trim().split('\n'))
    for (const name of [...tree]) { let dir = path.dirname(name); while (dir !== '.') { tree.add(dir); dir = path.dirname(dir) } }
    for (const name of tree) {
      const parts = name.split('/')
      if (parts.length > 1) topDirectories.add(parts[0])
      basenames.add(parts.at(-1))
      for (let i = 0; i < parts.length; i++) suffixes.add(parts.slice(i).join('/'))
    }
    trees.set(repo, tree)
  }
  const repoChoices = repositories.map((root) => ({ root, name: path.basename(root), parent: path.dirname(root) }))
  const treeEntries = [...trees]
  const found = new Map()
  const check = async (p) => {
    if (!found.has(p)) found.set(p, treeEntries.some(([root, tree]) => p.startsWith(`${root}/`) && tree.has(p.slice(root.length + 1))) ? Promise.resolve('present') : pathStatus(p))
    return found.get(p)
  }
  const classified = new Map()
  const classify = async (token) => {
    if (classified.has(token)) return classified.get(token)
    const result = (async () => {
      const absolute = token.startsWith('~') || path.isAbsolute(token)
      const choices = absolute ? [expand(token)] : repoChoices.flatMap(({ root, name, parent }) => [path.join(root, token), ...(token.startsWith(`${name}/`) ? [path.join(parent, token)] : [])])
      const statuses = await Promise.all(choices.map(check))
      if (statuses.includes('present')) return null
      if (statuses.includes('unverifiable')) return { kind: 'unverifiable', reason: '路径存在但当前用户无法核实', repair: null }
      if (path.isAbsolute(token) && !token.startsWith(`${expand('~')}/`) && !token.startsWith(`${project.root}/`) && !/^\/(?:private\/)?tmp\//.test(token)) return { kind: 'unverifiable', reason: '另一台机器的绝对路径，未在本机判为失效', repair: null }
      const kind = /(?:^|\/)\.worktrees\//.test(token) ? 'deleted-worktree' : /(?:^|\/)tmp\/|scratchpad/.test(token) ? 'temporary' : suffixes.has(token) || basenames.has(path.basename(token)) ? 'moved-or-shorthand' : 'missing'
      return { kind }
    })()
    classified.set(token, result)
    return result
  }
  const results = [], seen = new Set(), checked = new Set()
  const localName = os.hostname().toLowerCase().replace(/[ .-]/g, '')
  for (const file of files.filter((f) => f.file.endsWith('.md'))) {
    const firstLine = file.raw ? lines(file.raw.slice(0, file.raw.length - file.body.length)).length : 1
    for (const [i, line] of lines(file.body).entries()) {
      const otherMachine = [...line.matchAll(/\b(?:mac1|juma(?:oyun)?|Chole|mac[ -]?mini|Mac Studio|ThinkPad)\b/gi)].some((hint) => !localName.includes(hint[0].toLowerCase().replace(/[ .-]/g, '')))
      for (const m of line.matchAll(/(?<![\w/.~:-])(?:~\/|\/(?!\/)|(?:[\w.-]+\/)+)[^\s`'"()\[\]<>，。、；：）（「」|*{}$,;]+/g)) {
        const token = m[0].replace(/(?::\d+(?:-\d+)?)+$/, '').replace(/[.,;:!?]+$/, '').replace(/\/$/, '')
        if (token.length < 6 || token.endsWith('-') || /[<>…*#]|\.\.\./.test(token) || /^(?:feat|fix|chore)\//i.test(token) || /^\d+(?:\/\d+)+$/.test(token)) continue
        const absolute = token.startsWith('~/') || path.isAbsolute(token)
        if (!absolute && !topDirectories.has(token.split('/')[0]) && !/\.[a-z][a-z0-9]{0,9}$/i.test(path.basename(token))) continue
        const key = `${file.path}\0${token}`
        if (seen.has(key)) continue
        seen.add(key)
        const lineNumber = firstLine + i
        const foreign = token.startsWith('~/') && /^~\/(?:Codebase|work|gugu-ops-scripts)(?:\/|$)/.test(token) && otherMachine
        results.push((foreign ? Promise.resolve({ kind: 'unverifiable', reason: '同一行注明了另一台机器，无法在本机核实' }) : classify(token)).then((result) => {
          if (result?.kind !== 'unverifiable') checked.add(token)
          if (!result) return null
          const repair = result.kind === 'deleted-worktree' && /^\s*[-*]?\s*`?[^\s`]+`?\s*$/.test(line) ? 'remove-path-line' : null
          // Evidence is a source location, not a copy of an arbitrarily large log line.
          return { path: file.path, target: token, ...result, line: lineNumber, column: m.index + 1, ...(repair ? { evidence: line } : {}), repair }
        }))
      }
    }
  }
  const findings = (await Promise.all(results)).filter(Boolean)
  const classes = Object.fromEntries(['deleted-worktree', 'temporary', 'moved-or-shorthand', 'missing', 'unverifiable'].map((kind) => {
    const rows = findings.filter((row) => row.kind === kind)
    return [kind, { paths: new Set(rows.map((row) => row.target)).size, files: new Set(rows.map((row) => row.path)).size }]
  }))
  const missing = findings.filter((row) => row.kind !== 'unverifiable')
  return { findings, metrics: { checkedPaths: checked.size, missingPaths: new Set(missing.map((row) => row.target)).size, affectedFiles: new Set(missing.map((row) => row.path)).size, nonTemporaryFiles: new Set(missing.filter((row) => !['temporary', 'deleted-worktree'].includes(row.kind)).map((row) => row.path)).size, classes } }
}
