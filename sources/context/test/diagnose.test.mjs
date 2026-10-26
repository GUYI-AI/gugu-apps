import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { capacity, bars, diagnose } from '../app/lib/diagnose.js'
import { frontmatter, links, indexEntries } from '../app/lib/markdown.js'
import { discover, projectIdentity, remoteIdentity, pathStatus } from '../app/lib/discovery.js'
import { missingPaths } from '../app/lib/path-check.js'
import { candidates } from '../app/lib/semantic.js'
import { sessionIndex, observe, summarizeHistory } from '../app/lib/history.js'
import { execFileSync } from 'node:child_process'

const NOW = Date.parse('2026-10-26T08:00:00Z')
const fm = (name, body = '', type = 'feedback', description = name) => `---\nname: ${name}\ndescription: ${description}\nmetadata:\n  type: ${type}\n---\n${body}\n`

async function fixture(t, underCheckout = false) {
  const prefix = underCheckout ? path.resolve('test/.context-fixture-') : path.join(os.tmpdir(), 'context-fixture-')
  const dir = await fs.mkdtemp(prefix)
  t.after(async () => {
    const target = dir
    console.log(`cleanup fixture: ${target}`)
    assert.ok(target.startsWith(prefix), 'only remove this test lane fixture')
    await fs.rm(target, { recursive: true, force: true })
  })
  return dir
}

test('capacity follows UTF-16 rather than UTF-8, and takes the larger line ratio', () => {
  const c = capacity('中'.repeat(20000), 'claude')
  assert.equal(c.ratio, .8)
  assert.equal(capacity('😀'.repeat(10000), 'claude').chars, 20000)
  assert.equal(capacity(Array(180).fill('a').join('\n'), 'claude').ratio, .9)
  assert.equal(capacity('中'.repeat(100), 'codex').bytes, 300)
  assert.equal(capacity('  \n\n ', 'claude').ratio, 0)
})

test('health deducts once per rule and cleanup does not deduct', () => {
  const result = bars([{ id: 'R4', severity: 'red', findings: Array(200).fill({}) }, ...Array.from({ length: 4 }, (_, i) => ({ id: `Y${i}`, severity: 'yellow', findings: [{}] })), { id: 'clean', severity: 'clean', findings: [{}] }], [], 144)
  assert.equal(result.health.value, 3)
  assert.equal(result.hot.cells, 8)
  assert.equal(bars([], [], null).hot.cells, null)
  assert.equal(bars([], [{ ratio: .804 }], 0).capacity.cells, 8)
  assert.equal(bars([], [{ ratio: .001 }], 0).capacity.cells, 1)
  assert.equal(bars([], [{ ratio: 0 }], 0).capacity.cells, 0)
})

test('memory links ignore shell/JSON expressions and parse frontmatter metadata', () => {
  assert.deepEqual(links('[[:space:]] [["v8", 2]] [[real]] [title](other.md)').map((x) => x.target), ['real.md', 'other.md'])
  assert.equal(frontmatter(fm('one')).fields.type, 'feedback')
})

test('diagnoses the case-study combination without counting individual occurrences twice', async (t) => {
  const root = await fixture(t), memory = path.join(root, 'memory')
  await fs.mkdir(memory)
  await fs.mkdir(path.join(root, 'legacy'))
  await fs.writeFile(path.join(root, 'AGENTS.md'), '`legacy/` 只读，不作依据\n')
  await fs.writeFile(path.join(root, 'CLAUDE.md'), '@AGENTS.md\n')
  await fs.writeFile(path.join(memory, 'MEMORY.md'), '- [old](old.md) — old\n- [new](new.md) — new\n[[missing]]\n' + '中'.repeat(19930))
  await fs.writeFile(path.join(memory, 'old.md'), fm('old'))
  await fs.writeFile(path.join(memory, 'new.md'), fm('new', '取代 [[old]]'))
  await fs.writeFile(path.join(memory, 'hot.md'), fm('hot'))
  const sessions = Array.from({ length: 5 }, (_, i) => ({ source: 'claude-code', providerSessionId: String(i), refs: [path.join(memory, 'hot.md')], loaded: [], nested: i ? [] : [{ path: path.join(root, 'legacy/AGENTS.md'), at: '2026-10-26T01:00:00Z' }] }))
  const report = await diagnose({ key: 'fixture', root, locations: [root], memories: [memory], codexRoots: [], claudeRoots: [] }, { complete: true, sessions, hot: 144, sample: 5 }, { now: NOW })
  assert.deepEqual(report.rules.filter((r) => r.findings.length && ['red', 'yellow'].includes(r.severity)).map((r) => r.id), ['R1', 'R4', 'R6', 'R7', 'R8'])
  assert.equal(report.bars.health.value, 3)
  assert.equal(report.rules.length, 21)
  assert.equal(report.agents.length, 3)
})

test('missing history remains pending; missing Claude import is separately red', async (t) => {
  const root = await fixture(t)
  await fs.writeFile(path.join(root, 'AGENTS.md'), 'rule')
  await fs.writeFile(path.join(root, 'CLAUDE.md'), 'other')
  const report = await diagnose({ key: 'fixture', root, locations: [root], memories: [], codexRoots: [], claudeRoots: [] }, null, { now: NOW })
  assert.equal(report.rules.find((r) => r.id === 'R5').findings.length, 1)
  assert.equal(report.bars.health.complete, false)
  assert.equal(report.bars.hot.count, null)
})

test('worktrees and symlink roots merge, temporary directories are excluded', async (t) => {
  const root = await fixture(t, true), repo = path.join(root, 'repo'), wt = path.join(root, 'branch')
  await fs.mkdir(repo)
  execFileSync('git', ['init', '-q', repo])
  execFileSync('git', ['-C', repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture'])
  execFileSync('git', ['-C', repo, 'remote', 'add', 'origin', 'git@github.com:example/repo.git'])
  execFileSync('git', ['-C', repo, 'worktree', 'add', '-qb', 'fixture', wt])
  const alias = path.join(root, 'alias'); await fs.symlink(repo, alias)
  const found = await discover({ home: root, env: {}, extraPaths: [repo, wt, alias] })
  assert.equal(found.projects.length, 1)
  assert.equal(found.projects[0].locations.length, 2)
  assert.equal((await projectIdentity(repo)).commonDir, (await projectIdentity(wt)).commonDir)
  assert.equal(remoteIdentity('https://user:secret@github.com/example/repo.git?token=secret'), 'github.com/example/repo')
  assert.equal(await projectIdentity(await fixture(t)), null)
})

test('host pagination and hydration are not interpreted as complete zero', async () => {
  const pending = await sessionIndex({ sessions: { index: async () => ({ rows: [], total: 50, pending: true, stale: false, nextOffset: null }) } })
  assert.equal(pending.complete, false)
  let calls = 0
  const result = await sessionIndex({ sessions: { index: async ({ offset }) => { calls++; return { rows: [{ source: 'codex', providerSessionId: String(offset) }], total: 2, pending: false, stale: false, nextOffset: offset === 0 ? 1 : null } } } })
  assert.equal(calls, 2); assert.equal(result.rows.length, 2)
})

test('activity counts starts, not recent updates; context reads are projections only', async () => {
  const args = []
  const result = await observe({ sessions: { read: async (arg) => { args.push(arg); return arg.view ? { loaded: [], nested: [], refs: [] } : { turns: [{ createdAt: arg.filePath === 'new' ? '2026-10-25T10:00:00Z' : '2026-10-01T10:00:00Z' }] } } } }, ['new', 'old'].map((filePath) => ({ source: 'codex', providerSessionId: filePath, filePath, updatedAt: Date.parse('2026-10-26T01:00:00Z') })), { now: NOW })
  assert.equal(result.hot, 1)
  assert.equal(args.filter((a) => a.view === 'context').length, 2)
})

test('Codex instruction length uses one initial base and Project snapshot', () => {
  const result = summarizeHistory({ sessions: [{ source: 'codex', loaded: [{ kind: 'base-instructions', chars: 100 }, { kind: 'instruction-file', scope: 'Project', chars: 200 }, { kind: 'instruction-file', scope: 'Project', chars: 800 }], refs: [] }] }, [])
  assert.equal(result.initialMedian, 300)
})

test('EACCES and EPERM remain unverifiable rather than missing', async (t) => {
  for (const code of ['EACCES', 'EPERM']) assert.equal(await pathStatus('/unreadable', async () => { throw Object.assign(new Error(code), { code }) }), 'unverifiable')
  const root = await fixture(t), locked = path.join(root, 'locked')
  await fs.mkdir(locked)
  await fs.chmod(locked, 0o000)
  try {
    const { findings: rows } = await missingPaths([{ file: 'one.md', path: path.join(root, 'one.md'), body: `${locked}/file.md` }], { root })
    if (process.getuid?.() !== 0) assert.equal(rows[0].kind, 'unverifiable')
  } finally { await fs.chmod(locked, 0o700) }
})

test('path evidence deduplicates file × path and does not repeat long source lines', async (t) => {
  const root = await fixture(t), body = `${'long output '.repeat(2000)} src/gone.ts src/gone.ts\nagain src/gone.ts\n`
  const raw = fm('one', body)
  const result = await missingPaths([{ file: 'one.md', path: path.join(root, 'one.md'), body, raw }, { file: 'two.md', path: path.join(root, 'two.md'), body: 'src/gone.ts\nsrc/other.ts' }], { root })
  assert.equal(result.findings.length, 3)
  assert.equal(result.metrics.missingPaths, 2)
  assert.equal(result.metrics.affectedFiles, 2)
  assert.equal(result.metrics.classes.missing.paths, 2)
  assert.ok(result.findings.every((row) => row.evidence === undefined))
  assert.equal(result.findings[0].line, 7)
})

test('Codex project budget excludes global instructions and selects project override', async (t) => {
  const root = await fixture(t), codex = path.join(root, 'codex')
  await fs.mkdir(path.join(root, 'project')); await fs.mkdir(codex)
  const project = await fs.realpath(path.join(root, 'project'))
  await fs.writeFile(path.join(codex, 'AGENTS.md'), 'global'.repeat(6000))
  await fs.writeFile(path.join(project, 'AGENTS.md'), 'default')
  await fs.writeFile(path.join(project, 'AGENTS.override.md'), 'override')
  const report = await diagnose({ root: project, locations: [project], memories: [], codexRoots: [codex] })
  assert.equal(report.capacities[0].bytes, 8)
  assert.deepEqual(report.capacities[0].files, [path.join(project, 'AGENTS.override.md')])
  assert.ok(report._instructions.some((f) => f.path === path.join(project, '../codex/AGENTS.md')))
})

test('a supersession warning in the old index entry prevents R4', async (t) => {
  const root = await fixture(t)
  await fs.writeFile(path.join(root, 'MEMORY.md'), '- [old](old.md) — ⚠️已被 10-25 new 取代\n- [new](new.md) — new\n')
  await fs.writeFile(path.join(root, 'old.md'), fm('old'))
  await fs.writeFile(path.join(root, 'new.md'), fm('new', '覆盖 10-22 [[old]]'))
  const report = await diagnose({ root, locations: [], memories: [root] })
  assert.equal(report.rules.find((r) => r.id === 'R4').findings.length, 0)
  await fs.writeFile(path.join(root, 'old.md'), fm('old', '已并入 [[new]]'))
  await fs.writeFile(path.join(root, 'new.md'), fm('new'))
  const merged = await diagnose({ root, locations: [], memories: [root] })
  assert.equal(merged.rules.find((r) => r.id === 'R4').findings.length, 0, 'a merged stub never reverses old and new')
})

test('R19 anchors bounded groups to rare index words without transitive topic chaining', () => {
  const descriptions = ['lanes move to ThinkPad harness opus', 'new lanes ThinkPad session_spawn', 'hard tasks ThinkPad session_spawn harness claude', 'simple tasks session_spawn harness codex', 'unrelated garden water', 'lanes ThinkPad session_spawn', 'build a compiler pipeline', 'build deployment staging', 'build preview styles']
  const docs = descriptions.map((description, i) => ({ file: `${i}.md`, path: String(i), body: description, fields: { description, type: 'feedback' } }))
  const raw = docs.filter((_, i) => i !== 5).map((f) => `- [${f.file}](${f.file}) — ${f.fields.description}`).join('\n')
  docs.push({ file: 'MEMORY.md', path: 'index', body: raw, fields: {}, entries: indexEntries('MEMORY.md', raw) })
  const result = candidates(docs).scattered
  assert.ok(result.some((group) => group.keywords.includes('session_spawn') && group.members.join() === '1,2,3'))
  assert.ok(result.every((group) => group.members.length === 3 && !group.members.includes('5')))
  assert.ok(result.every((group) => group.keywords !== 'build'))
})

test('path checks exclude prose, model names, branches, PRs and repository slugs', async (t) => {
  const root = await fixture(t)
  await fs.mkdir(path.join(root, 'docs'))
  await fs.mkdir(path.join(root, 'src')); await fs.mkdir(path.join(root, '100'))
  const machine = os.hostname().toLowerCase().includes('chole') ? 'mac1' : 'Chole'
  const body = ['tools/list GREEN/MERGEABLE/behind Claude/Codex 100/100 try/catch Asia/Shanghai feat/project-page fix/small-batch-1006 shuxueshuxue/gugu-apps 6532/#6531 s/62.5k src/truncated-', '`docs/removed-folder` and `src/deleted.ts`', `${machine}: ~/Codebase/context-removed/file.ts`].join('\n')
  const result = await missingPaths([{ file: 'one.md', path: path.join(root, 'one.md'), body }], { root })
  assert.deepEqual(result.findings.filter((row) => row.kind !== 'unverifiable').map((row) => row.target), ['docs/removed-folder', 'src/deleted.ts'])
  assert.equal(result.findings.find((row) => row.target.startsWith('~/')).kind, 'unverifiable')
})

test('global card diagnoses stale Codex project and hook state', async (t) => {
  const root = await fixture(t), missing = path.join(root, 'missing')
  await fs.writeFile(path.join(root, 'config.toml'), `[projects.${JSON.stringify(missing)}]\ntrust_level = "trusted"\n`)
  await fs.writeFile(path.join(root, 'hooks.json'), JSON.stringify({ [missing]: {} }))
  const report = await diagnose({ key: 'global', global: true, root, locations: [], memories: [], codexRoots: [root] }, { complete: true, sessions: [], hot: 0 })
  assert.equal(report.rules.find((r) => r.id === 'R20').findings.length, 2)
})

test('CLI emits JSONL ending in summary, with R17 counts only', async (t) => {
  const root = await fixture(t)
  await fs.writeFile(path.join(root, 'MEMORY.md'), '- [one](one.md) — one\n')
  await fs.writeFile(path.join(root, 'one.md'), fm('one', 'src/deleted.ts src/deleted.ts'))
  const output = execFileSync(process.execPath, [path.resolve('app/tools.js'), '--diagnose', root], { encoding: 'utf8', env: { ...process.env, HOME: root, CLAUDE_CONFIG_DIR: root, CODEX_HOME: root, GUGU_APP_SETTINGS: '{}' } })
  const rows = output.trim().split('\n').map((line) => JSON.parse(line))
  assert.equal(rows.at(-1).type, 'summary')
  assert.equal(rows.filter((row) => row.rule === 'R17').length, 1)
  assert.equal(rows.find((row) => row.rule === 'R17').metrics.missingPaths, 1)
})

test('literal prefix filtering agrees with exhaustive Jaccard, including common-vocabulary pairs', () => {
  const bodies = ['alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu', 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda nu', '完全相同的中文规矩，第二次。', '完全相同的中文规矩，第二次。', '0123456789abcdefghijklmnop', '0123456789abcdefghijklmnopqrstuvwxyz', '0123456789abcdefghijklmnopXYZ', 'XYZ0123456789abcdefghijklmnop']
  let seed = 7
  for (let i = 0; i < 30; i++) { let text = ''; for (let j = 0; j < 150; j++) { seed = Math.imul(seed, 1664525) + 1013904223; text += String.fromCharCode(97 + ((seed >>> 0) % 26)) } bodies.push(text) }
  const docs = bodies.map((body, i) => ({ file: `${i}.md`, path: String(i), body, fields: { description: body, type: 'feedback' } }))
  const grams = (text) => { const t = text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); return new Set(Array.from({ length: Math.max(0, t.length - 4) }, (_, i) => t.slice(i, i + 5))) }
  const expected = []
  for (let a = 0; a < docs.length; a++) for (let b = a + 1; b < docs.length; b++) { const x = grams(bodies[a]), y = grams(bodies[b]), intersect = [...x].filter((g) => y.has(g)).length; if (intersect / (x.size + y.size - intersect) > .5) expected.push(`${a}:${b}`) }
  assert.deepEqual(candidates(docs).duplicates.map((r) => `${r.a}:${r.b}`).sort(), expected.sort())
})
