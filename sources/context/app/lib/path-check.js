import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expand, pathStatus } from './discovery.js'
import { lines } from './markdown.js'

const exec = promisify(execFile)

export async function missingPaths(files, project) {
  const repositories = [project.root]
  for (const e of await fs.readdir(project.root, { withFileTypes: true })) if (e.isDirectory() && !e.name.startsWith('.') && await pathStatus(path.join(project.root, e.name, '.git')) === 'present') repositories.push(path.join(project.root, e.name))
  const trees = new Map()
  const basenames = new Set(), suffixes = new Set()
  for (const repo of repositories) {
    if (await pathStatus(path.join(repo, '.git')) !== 'present') continue
    const { stdout } = await exec('git', ['-C', repo, 'ls-tree', '-r', '--name-only', 'HEAD'], { maxBuffer: 16 * 1024 * 1024 })
    const tree = new Set(stdout.trim().split('\n'))
    for (const name of [...tree]) { let dir = path.dirname(name); while (dir !== '.') { tree.add(dir); dir = path.dirname(dir) } }
    for (const name of tree) {
      const parts = name.split('/')
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
  const results = []
  for (const file of files.filter((f) => f.file.endsWith('.md'))) for (const [i, line] of lines(file.body).entries()) {
    for (const m of line.matchAll(/(?<![\w/.~:-])(?:~\/|\/(?!\/)|(?:[\w.-]+\/)+)[^\s`'"()\[\]<>，。、；：）（「」|*{}$,;]+/g)) {
      const token = m[0].replace(/(?::\d+(?:-\d+)?)+$/, '').replace(/[.,;:!?]+$/, '').replace(/\/$/, '')
      if (token.length < 6 || /[<>…*]|\.\.\./.test(token)) continue
      results.push(classify(token).then((result) => result ? { path: file.path, target: token, ...result, line: i + 1, evidence: line, repair: result.kind === 'deleted-worktree' && /^\s*[-*]?\s*`?[^\s`]+`?\s*$/.test(line) ? 'remove-path-line' : null } : null))
    }
  }
  return (await Promise.all(results)).filter(Boolean)
}
