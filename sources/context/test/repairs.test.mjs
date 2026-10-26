import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { diagnose } from '../app/lib/diagnose.js'
import { makePreview, readPreview, applyPreview } from '../app/lib/repairs.js'

async function fixture(t) {
  const prefix = path.join(os.tmpdir(), 'context-repair-'), root = await fs.mkdtemp(prefix), memory = path.join(root, 'memory'), data = path.join(root, 'data')
  await fs.mkdir(memory); await fs.mkdir(data)
  await fs.writeFile(path.join(memory, 'MEMORY.md'), '- [one](one.md) — obsolete description\n[[absent]]\n')
  await fs.writeFile(path.join(memory, 'one.md'), '---\nname: one\ndescription: authoritative description\ntype: feedback\n---\nHello\n')
  t.after(async () => { const target = root; console.log(`cleanup fixture: ${target}`); assert.ok(target.startsWith(prefix)); await fs.rm(target, { recursive: true, force: true }) })
  const project = { key: root, root, locations: [], memories: [memory], codexRoots: [], claudeRoots: [] }
  return { root, memory, data, project, report: await diagnose(project) }
}

test('preview changes no files; confirmation snapshots then rewrites description', async (t) => {
  const f = await fixture(t), p = path.join(f.memory, 'MEMORY.md'), original = await fs.readFile(p, 'utf8')
  const preview = await makePreview(f.report, 'R12', f.data)
  assert.equal(await fs.readFile(p, 'utf8'), original)
  const view = await readPreview(f.data, preview.id)
  assert.match(view.text, /authoritative description/)
  await assert.rejects(applyPreview(f.data, preview.id, preview.digest, false), /确认/)
  const result = await applyPreview(f.data, preview.id, preview.digest, true)
  assert.match(await fs.readFile(p, 'utf8'), /— authoritative description/)
  const snapshot = JSON.parse(await fs.readFile(result.snapshot, 'utf8'))
  assert.equal(Buffer.from(snapshot.changes[0].before.data, 'base64').toString(), original)
  await assert.rejects(applyPreview(f.data, preview.id, preview.digest, true), /已使用/)
})

test('SHA and mtime checks refuse changed sources, including same contents with a new mtime', async (t) => {
  const f = await fixture(t), p = path.join(f.memory, 'MEMORY.md')
  const preview = await makePreview(f.report, 'R12', f.data)
  await fs.utimes(p, new Date('2020-01-01'), new Date('2020-01-01'))
  await assert.rejects(applyPreview(f.data, preview.id, preview.digest, true), /文件已改变/)
  assert.match(await fs.readFile(p, 'utf8'), /obsolete description/)
})

test('realpath changes refuse a symlink swap', async (t) => {
  const f = await fixture(t), p = path.join(f.memory, 'MEMORY.md')
  const preview = await makePreview(f.report, 'R12', f.data)
  await fs.rename(p, path.join(f.memory, 'other.md'))
  await fs.symlink(path.join(f.memory, 'other.md'), p)
  await assert.rejects(applyPreview(f.data, preview.id, preview.digest, true), /文件已改变/)
})

test('a preview refuses sources changed since diagnosis', async (t) => {
  const f = await fixture(t)
  await fs.appendFile(path.join(f.memory, 'MEMORY.md'), 'concurrent edit\n')
  await assert.rejects(makePreview(f.report, 'R12', f.data), /诊断后文件已改变/)
})

test('archive snapshots non-memory bytes and does not drop referenced Markdown links', async (t) => {
  const f = await fixture(t), lock = path.join(f.memory, 'old.lock')
  const bytes = Buffer.from([0, 255, 12, 3]); await fs.writeFile(lock, bytes)
  const report = await diagnose(f.project)
  const preview = await makePreview(report, 'R21', f.data)
  await applyPreview(f.data, preview.id, preview.digest, true)
  assert.deepEqual(await fs.readFile(path.join(f.memory, 'archive/old.lock')), bytes)
  await assert.rejects(fs.access(lock), { code: 'ENOENT' })
})

test('preview digest mismatch never writes', async (t) => {
  const f = await fixture(t), preview = await makePreview(f.report, 'R8', f.data)
  await assert.rejects(applyPreview(f.data, preview.id, 'wrong', true), /不匹配/)
  assert.match(await fs.readFile(path.join(f.memory, 'MEMORY.md'), 'utf8'), /\[\[absent\]\]/)
})
