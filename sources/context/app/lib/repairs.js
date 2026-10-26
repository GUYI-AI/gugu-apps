import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { exists } from './discovery.js'
import { slug, lines } from './markdown.js'

const sha = (data) => createHash('sha256').update(data).digest('hex')
const validId = (id) => { if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid preview id'); return id }
let applying = false

async function state(p) {
  if (!await exists(p)) return { path: p, exists: false, parent: await fs.realpath(path.dirname(p)) }
  const real = await fs.realpath(p), stat = await fs.stat(p), data = await fs.readFile(p)
  return { path: p, exists: true, real, sha: sha(data), mtimeMs: stat.mtimeMs, mode: stat.mode, data: data.toString('base64') }
}
async function same(expected) {
  const actual = await state(expected.path)
  if (actual.exists !== expected.exists || (expected.exists ? actual.real !== expected.real || actual.sha !== expected.sha || actual.mtimeMs !== expected.mtimeMs : actual.parent !== expected.parent)) throw new Error(`文件已改变，请重新诊断并预览：${expected.path}`)
}

function editedLines(text, transform) { return lines(text).flatMap((line, i) => transform(line, i + 1)).join('\n') }

export async function makePreview(report, ruleId, dataDir) {
  if (!dataDir) throw new Error('App 数据夹不可用，无法保存预览和快照')
  const rule = report.rules.find((r) => r.id === ruleId)
  if (!rule) throw new Error('Unknown rule')
  const originals = new Map([...report._memories.flatMap((m) => m.files), ...report._instructions].map((f) => [f.path, f]))
  const edits = new Map(), dependencies = new Map(), createdParents = new Set()
  const source = async (p) => {
    if (!dependencies.has(p)) {
      const s = await state(p), prior = originals.get(p)
      if (prior?.raw !== undefined && p.endsWith('.md') && (!s.exists || sha(Buffer.from(prior.raw)) !== s.sha)) throw new Error(`诊断后文件已改变：${p}`)
      dependencies.set(p, s)
    }
    return dependencies.get(p)
  }
  const read = async (p) => { await source(p); return edits.has(p) ? edits.get(p) : Buffer.from(dependencies.get(p).data || '', 'base64').toString('utf8') }
  const write = async (p, text) => { await source(p); edits.set(p, text) }
  const rewriteEntry = async (p, target, fn) => write(p, editedLines(await read(p), (line) => line.includes(`](${target})`) ? fn(line) : line))
  const addIndex = async (filePath) => {
    const file = originals.get(filePath)
    if (!file?.fields?.description) return
    if (file.file.endsWith('-hub.md')) {
      const main = path.join(path.dirname(filePath), 'MEMORY.md'), before = await read(main)
      if (!before.includes(`](${file.file})`)) await write(main, `${before.trimEnd()}\n- [${file.fields.name || slug(file.file)}](${file.file}) — ${file.fields.description}\n`)
      return
    }
    if (!/^[a-z][a-z0-9_-]*$/i.test(file.fields.type || '')) throw new Error(`记忆类型需要判断，无法确定索引：${filePath}`)
    const hubName = `${file.fields.type}-hub.md`
    const index = path.join(path.dirname(filePath), hubName)
    const before = await read(index)
    const heading = before || `---\nname: ${slug(hubName)}\ndescription: ${file.fields.type} 类型的记忆索引\ntype: reference\n---\n`
    if (!before.includes(`](${file.file})`)) await write(index, `${heading.trimEnd()}\n- [${file.fields.name || slug(file.file)}](${file.file}) — ${file.fields.description.replace(/\r?\n/g, ' ')}\n`)
    const memoryIndex = path.join(path.dirname(filePath), 'MEMORY.md')
    const main = await read(memoryIndex)
    if (!main.includes(`](${hubName})`)) await write(memoryIndex, `${main.trimEnd()}\n- [${slug(hubName)}](${hubName}) — ${file.fields.type} 类型的记忆索引\n`)
  }
  const archive = async (p) => {
    const from = await source(p)
    const archiveDir = path.join(path.dirname(p), 'archive')
    // Directory creation belongs to apply, after confirmation; record its existing parent now.
    const dest = path.join(archiveDir, path.basename(p))
    if (await exists(dest)) throw new Error(`归档目标已存在：${dest}`)
    createdParents.add(archiveDir)
    dependencies.set(dest, { path: dest, exists: false, parent: await fs.realpath(path.dirname(archiveDir)), newParent: archiveDir })
    edits.set(dest, { base64: from.data })
    edits.set(p, null)
    for (const memory of report._memories) for (const file of memory.files.filter((f) => f.file.endsWith('.md') && f.path !== p && edits.get(f.path) !== null)) {
      const name = path.basename(p), raw = await read(file.path)
      let next = raw
      if (file.file === 'MEMORY.md' || file.file.endsWith('-hub.md')) next = editedLines(next, (line) => line.includes(`](${name})`) ? [] : line)
      next = next.replaceAll(`](${name})`, `](archive/${name})`).replaceAll(`[[${slug(name)}]]`, `[[archive/${slug(name)}]]`)
      if (next !== raw) await write(file.path, next)
    }
  }
  if (ruleId === 'R13') {
    const remove = new Map()
    for (const row of rule.findings) for (const entry of row.entries.slice(1)) {
      const p = path.join(path.dirname(row.path), entry.file)
      if (!remove.has(p)) remove.set(p, new Set())
      remove.get(p).add(entry.line)
    }
    for (const [p, positions] of remove) await write(p, editedLines(await read(p), (line, n) => positions.has(n) ? [] : line))
  }
  for (const row of rule.findings) {
    if (!row.repair) continue
    if (row.repair === 'import') await write(row.path, `${(await read(row.path)).trimEnd()}\n\n@AGENTS.md\n`)
    else if (row.repair === 'index') await addIndex(row.path)
    else if (row.repair === 'remove-link') {
      const before = await read(row.path)
      await write(row.path, before.replaceAll(row.text, row.text.startsWith('[[') ? slug(row.target) : row.text.slice(1, row.text.indexOf(']'))))
    } else if (row.repair === 'name') {
      const before = await read(row.path), name = slug(row.path)
      if (before.startsWith('---\n') || before.startsWith('---\r\n')) {
        const end = before.indexOf('\n---', 4), fm = before.slice(0, end)
        await write(row.path, (/^name:/m.test(fm) ? fm.replace(/^name:.*$/m, `name: ${name}`) : fm + `\nname: ${name}`) + before.slice(end))
      } else await write(row.path, `---\nname: ${name}\n---\n\n${before}`)
    } else if (row.repair === 'description') {
      await write(row.path, editedLines(await read(row.path), (line) => line === row.text ? line.slice(0, line.length - row.description.length) + row.actual.replace(/\r?\n/g, ' ') : line))
    } else if (row.repair === 'supersede') {
      for (const entry of row.indexedBy) await rewriteEntry(path.join(path.dirname(row.path), entry.file), path.basename(row.path), () => [])
      const before = await read(row.path), note = `> 已被 [[${slug(row.current)}]] 取代。\n\n`
      const boundary = before.startsWith('---') ? before.indexOf('\n---', 4) : -1
      const insertion = boundary < 0 ? 0 : boundary + 5
      await write(row.path, before.slice(0, insertion) + '\n' + note + before.slice(insertion))
    } else if (row.repair === 'archive' || row.repair === 'merged-stub') await archive(row.path)
    else if (row.repair === 'duplicate') {
      // Only identical bodies are mechanically merged; near-duplicates need a person/agent.
      const obsolete = row.b, current = path.basename(row.a)
      for (const memory of report._memories) for (const file of memory.files.filter((f) => f.file.endsWith('.md') && f.path !== obsolete)) {
        const before = await read(file.path)
        const next = before.replaceAll(`](${path.basename(obsolete)})`, `](${current})`).replaceAll(`[[${slug(obsolete)}]]`, `[[${slug(current)}]]`)
        if (next !== before) await write(file.path, next)
      }
      await archive(obsolete)
    } else if (row.repair === 'snapshot-note') {
      const notePath = path.join(row.directory, 'CLAUDE.md')
      const before = await read(notePath)
      const note = '\n此目录是只读历史快照，不作当前规则依据。请返回主项目读取当前规矩。\n'
      if (!before.includes(note.trim())) await write(notePath, before.trimEnd() + note)
    } else if (row.repair === 'config-section') {
      const before = await read(row.path)
      const { projectSections } = await import('./discovery.js')
      const section = projectSections(before).find((s) => s.path === row.target)
      if (section) await write(row.path, before.slice(0, section.start) + before.slice(section.end))
    } else if (row.repair === 'hook-state') {
      const parsed = JSON.parse(await read(row.path)); delete parsed[row.target]
      await write(row.path, JSON.stringify(parsed, null, 2) + '\n')
    } else if (row.repair === 'remove-path-line') await write(row.path, editedLines(await read(row.path), (line) => line === row.evidence ? [] : line))
  }
  const changes = [...edits].filter(([p, after]) => {
    const before = dependencies.get(p)
    return after === null ? before.exists : typeof after === 'string' ? after !== Buffer.from(before.data || '', 'base64').toString('utf8') : true
  }).map(([p, after]) => ({ path: p, before: dependencies.get(p), after: after === null ? null : typeof after === 'string' ? Buffer.from(after).toString('base64') : after.base64 }))
  if (!changes.length) throw new Error('这条规则没有确定的文件改法，请复制提示给 agent 判断')
  const id = randomUUID()
  const preview = { id, rule: ruleId, project: report.project.root, createdAt: new Date().toISOString(), changes, dependencies: [...dependencies.values()], createdParents: [...createdParents], status: 'preview' }
  preview.digest = sha(JSON.stringify(preview))
  await fs.mkdir(path.join(dataDir, 'previews'), { recursive: true, mode: 0o700 })
  await fs.writeFile(path.join(dataDir, 'previews', `${id}.json`), JSON.stringify(preview), { flag: 'wx', mode: 0o600 })
  return { id, digest: preview.digest, changes: changes.length }
}

export async function readPreview(dataDir, id, offset = 0, limit = 6000) {
  const preview = JSON.parse(await fs.readFile(path.join(dataDir, 'previews', `${validId(id)}.json`), 'utf8'))
  const text = preview.changes.map((c) => {
    const before = c.before.exists ? Buffer.from(c.before.data, 'base64').toString('utf8') : ''
    const after = c.after === null ? '' : Buffer.from(c.after, 'base64').toString('utf8')
    if (!c.path.endsWith('.md') && !c.path.endsWith('.toml') && !c.path.endsWith('.json')) return `${c.path}\n移动到 archive/（${Buffer.from(c.before.data || '', 'base64').length} 字节）`
    const a = lines(before), b = lines(after)
    let start = 0
    while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++
    let endA = a.length, endB = b.length
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB-- }
    return `--- ${c.path}${c.before.exists ? '' : '（新建）'}\n+++ ${c.after === null ? '（归档移走）' : c.path}\n@@ ${start + 1} @@\n${a.slice(start, endA).map((s) => '- ' + s).join('\n')}\n${b.slice(start, endB).map((s) => '+ ' + s).join('\n')}`
  }).join('\n\n')
  const end = Math.min(text.length, offset + limit)
  return { id, digest: preview.digest, changes: preview.changes.length, text: text.slice(offset, end), nextOffset: end < text.length ? end : null, totalChars: text.length, status: preview.status }
}

export async function applyPreview(dataDir, id, digest, confirmed) {
  if (confirmed !== true) throw new Error('请先查看改动并确认')
  const file = path.join(dataDir, 'previews', `${validId(id)}.json`)
  // The host runs one tools.js process per App. Serialize its writes without a persistent lock that can outlive it.
  if (applying) throw new Error('另一项修复正在写入，请稍后重试')
  applying = true
  const applied = []
  try {
    const preview = JSON.parse(await fs.readFile(file, 'utf8'))
    if (preview.status !== 'preview' || digest !== preview.digest) throw new Error('预览已使用或确认信息不匹配，请重新预览')
    for (const expected of preview.dependencies) {
      if (expected.newParent) { if (await exists(expected.path) || await fs.realpath(path.dirname(expected.newParent)) !== expected.parent) throw new Error(`归档目标已改变：${expected.path}`) }
      else await same(expected)
    }
    const snapshotDir = path.join(dataDir, 'snapshots', id)
    await fs.mkdir(snapshotDir, { recursive: true, mode: 0o700 })
    await fs.writeFile(path.join(snapshotDir, 'snapshot.json'), JSON.stringify(preview), { flag: 'wx', mode: 0o600 })
    for (const dir of preview.createdParents) await fs.mkdir(dir, { recursive: false, mode: 0o700 }).catch((e) => { if (e.code !== 'EEXIST') throw e })
    preview.status = 'applying'
    await fs.writeFile(file, JSON.stringify(preview), { mode: 0o600 })
    // Create archive copies before removing sources; every changed source is rechecked immediately before replacing it.
    const ordered = preview.changes.toSorted((a, b) => Number(a.after === null) - Number(b.after === null))
    for (const change of ordered) {
      if (change.before.newParent) {
        if (await exists(change.path)) throw new Error(`归档目标已存在：${change.path}`)
        if (await fs.realpath(path.dirname(change.path)) !== path.join(change.before.parent, path.basename(change.before.newParent))) throw new Error('归档目录已改变')
      } else await same(change.before)
      if (change.after === null) await fs.unlink(change.path)
      else {
        const staged = path.join(path.dirname(change.path), `.context-${id}-${randomUUID()}.tmp`)
        try {
          await fs.writeFile(staged, Buffer.from(change.after, 'base64'), { flag: 'wx', mode: change.before.mode || 0o600 })
          if (!change.before.newParent) await same(change.before)
          await fs.rename(staged, change.path)
        } finally { await fs.unlink(staged).catch((e) => { if (e.code !== 'ENOENT') throw e }) }
      }
      applied.push(change.path)
    }
    preview.status = 'applied'
    await fs.writeFile(file, JSON.stringify(preview), { mode: 0o600 })
    return { applied, snapshot: path.join(snapshotDir, 'snapshot.json') }
  } catch (e) { throw new Error(`${e.message}${applied.length ? `；已改动：${applied.join(', ')}。改前快照在 App 数据夹 snapshots/${id}` : ''}`) }
  finally { applying = false }
}
