import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { ZH, wordsFor, programWords } from '../app/words.js'
import { diagnose, promptFor } from '../app/lib/diagnose.js'
import { sessionIndex } from '../app/lib/history.js'
import { makePreview, readPreview } from '../app/lib/repairs.js'

const EN = wordsFor('en-US')
const CJK = /[　-〿一-鿿＀-￯]/

// Same keys at every level, same kind of value, same number of parameters for each function.
function shape(value) {
  if (typeof value === 'function') return `function/${value.length}`
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, shape(value[key])]))
  return typeof value
}
function strings(value) {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

test('the zh and en tables have the same shape, and en has no Chinese', () => {
  assert.deepEqual(shape(EN), shape(ZH))
  assert.deepEqual(strings(EN).filter((text) => CJK.test(text)), [])
  assert.equal(wordsFor('zh-CN'), ZH)
  assert.equal(wordsFor(undefined), EN)
  // The program keeps Chinese for a call without a locale (an agent's).
  assert.equal(programWords(undefined), ZH)
  assert.equal(programWords('en'), EN)
})

test('English counts take a singular for one', () => {
  assert.equal(EN.projects(1), '1 project')
  assert.equal(EN.projects(2), '2 projects')
  assert.match(EN.summary(1, 1), /^1 project · 1 computer · /)
  assert.match(EN.applied(1, 'x'), /^Changed 1 file\./)
  assert.equal(EN.spots(3), ' · 3 places')
})

test('diagnose with English words says its titles, reasons and prompts in English', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'context-words-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.writeFile(path.join(root, 'AGENTS.md'), 'rule')
  await fs.writeFile(path.join(root, 'CLAUDE.md'), 'other')
  const project = { key: 'fixture', root, locations: [root], memories: [], codexRoots: [], claudeRoots: [] }
  const report = await diagnose(project, null, { words: EN })
  assert.equal(report.rules.find((r) => r.id === 'R5').title, "Claude can't read AGENTS.md")
  assert.equal(report.rules.find((r) => r.id === 'R6').pending, EN.noHistory)
  assert.equal(report.rules.find((r) => r.id === 'R2').pending, EN.r2Pending)
  assert.deepEqual(report.agents.map((a) => a.title), Object.values(EN.agents))
  assert.ok(report.rules.every((r) => !CJK.test(r.title) && !CJK.test(r.pending || '')))
  assert.match(promptFor(report, 'A1', EN), /^Project: .*\nCheck: Contradictions/)
  assert.match(promptFor(report, 'R5', EN), /\nCheck: Claude can't read AGENTS\.md\n/)
  // The same report worded for a Chinese caller.
  assert.match(promptFor(report, 'R5', ZH), /\n检查：Claude 读不到 AGENTS\.md\n/)
  // Without words, today's Chinese.
  const chinese = await diagnose(project, null)
  assert.equal(chinese.rules.find((r) => r.id === 'R5').title, ZH.rules.R5)
})

test('the task index keeps a reason key, so each caller can word it', async () => {
  const pending = await sessionIndex({ sessions: { index: async () => ({ rows: [], total: 50, pending: true, stale: false, nextOffset: null }) } }, { deadline: 0, words: EN })
  assert.equal(pending.reasonKey, 'indexUpdating')
  assert.equal(pending.reason, EN.indexUpdating)
  assert.equal(ZH[pending.reasonKey], ZH.indexUpdating)
})

test('a snapshot note is written in the person\'s language, and one already there in either language counts', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'context-words-')), data = path.join(root, 'data')
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(data)
  const fresh = path.join(root, 'fresh'), noted = path.join(root, 'noted')
  await fs.mkdir(fresh); await fs.mkdir(noted)
  await fs.writeFile(path.join(noted, 'CLAUDE.md'), `# old${ZH.snapshotNote}`)
  const reportFor = (directory) => ({ project: { root }, rules: [{ id: 'R7', findings: [{ repair: 'snapshot-note', directory }] }], _memories: [], _instructions: [] })
  const preview = await makePreview(reportFor(fresh), 'R7', data, EN)
  const view = await readPreview(data, preview.id, 0, undefined, EN)
  assert.match(view.text, /read-only history snapshot/)
  assert.match(view.text, /\(new\)/)
  assert.doesNotMatch(view.text, CJK)
  // The Chinese note already in place: nothing to change, said in English.
  await assert.rejects(makePreview(reportFor(noted), 'R7', data, EN), { message: EN.noFix })
})
