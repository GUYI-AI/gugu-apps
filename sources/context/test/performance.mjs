// Run on the designated test machine, outside unit tests. Durations are measurements, never wall-clock assertions.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { diagnose } from '../app/lib/diagnose.js'

const prefix = path.join(os.tmpdir(), 'context-performance-')
const root = await fs.mkdtemp(prefix), memory = path.join(root, 'memory')
const output = process.argv[2] || path.resolve('performance-report.json')
const git = (repo, args, input) => execFileSync('git', ['-C', repo, ...args], { input, encoding: 'utf8' }).trim()
let seed = 173
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed }
try {
  await fs.mkdir(memory)
  for (let repoNumber = 0; repoNumber < 10; repoNumber++) {
    const repo = path.join(root, `repo-${repoNumber}`)
    await fs.mkdir(repo); git(repo, ['init', '-q'])
    const blob = git(repo, ['hash-object', '-w', '--stdin'], '')
    const index = Array.from({ length: 3000 }, (_, i) => `100644 ${blob}\tsrc/module-${i % 100}/file-${i}.ts\n`).join('')
    git(repo, ['update-index', '--index-info'], index)
    const tree = git(repo, ['write-tree'])
    const commit = git(repo, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit-tree', tree, '-m', 'performance fixture'])
    git(repo, ['update-ref', 'HEAD', commit])
  }
  const indexLines = []
  for (let i = 0; i < 868; i++) {
    const name = `memory-${i}`
    const description = `group${i % 60} configuration reference ${i}`
    const body = Array.from({ length: 400 }, () => { const n = random() % 1800; return `rule${n}topic${n}` }).join(' ') + (i < 745 ? `\n\`src/removed/path-${i}.ts\`\n` : '')
    await fs.writeFile(path.join(memory, `${name}.md`), `---\nname: ${name}\ndescription: ${description}\ntype: ${i < 495 ? 'project' : 'feedback'}\n---\n${body}\n`)
    indexLines.push(`- [${name}](${name}.md) — ${description}`)
  }
  await fs.writeFile(path.join(memory, 'MEMORY.md'), indexLines.join('\n'))
  const start = performance.now()
  const report = await diagnose({ key: root, root, locations: [], memories: [memory], codexRoots: [], claudeRoots: [] })
  const elapsedMs = performance.now() - start
  await fs.writeFile(output, JSON.stringify({ fixture: { memoryFiles: 868, repositories: 10, trackedPaths: 30000, missingPaths: 745 }, elapsedMs, rules: report.rules.map(({ id, findings, pending }) => ({ id, findings, pending })), bars: report.bars }, null, 2))
  console.log(JSON.stringify({ evidence: output, elapsedMs: Math.round(elapsedMs), capacity: report.bars.capacity, missingPathRows: report.rules.find((r) => r.id === 'R17').findings.length }))
} finally {
  const target = root
  console.log(`cleanup fixture: ${target}`)
  assert.ok(target.startsWith(prefix), 'only remove this lane fixture')
  await fs.rm(target, { recursive: true, force: true })
}
