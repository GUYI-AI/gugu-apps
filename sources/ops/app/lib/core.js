// The ledger's contract is shared by the tools and the human page. Collections are keyed by id so independent
// additions merge through gugu.files. No counter, local cache, timer or second copy of the group's ledger.
export const LIST = '生产发布'
export const emptyBoard = () => ({ version: 1, items: {}, log: {}, tickets: {} })
export function asBoard(value) {
  if (!value || !Object.keys(value).length) return emptyBoard()
  if (value.version !== 1 || !value.items || !value.log || !value.tickets) throw new Error('Unsupported ledger format')
  return value
}
const copy = (v) => JSON.parse(JSON.stringify(v))
const text = (v, name, max = 4000) => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new Error(`${name} needs 1–${max} characters`)
  return v.trim()
}
const links = (v, name) => {
  if (!Array.isArray(v) || !v.length || v.length > 30) throw new Error(`${name} needs 1–30 links`)
  return [...new Set(v.map((s) => {
    const url = text(s, name, 2000)
    if (!/^(https:\/\/|gugu-(?:chat|file|widget):\/\/)/.test(url)) throw new Error(`${name} uses https or gugu resource links`)
    return url
  }))]
}
const closed = (i) => i.status === 'done' || i.status === 'dropped'
export const rows = (b) => Object.values(asBoard(b).items).sort((a, z) => a.createdAt.localeCompare(z.createdAt) || a.id.localeCompare(z.id, undefined, { numeric: true }))
export const logRows = (b) => Object.values(b.log).sort((a, z) => z.at.localeCompare(a.at) || z.id.localeCompare(a.id))
export function subjectOf(raw) {
  const s = text(raw, 'subject', 250)
  const match = /^(GUYI-AI\/[a-zA-Z0-9-]+)@([a-f0-9]{40})$/.exec(s)
  if (!match) throw new Error('subject is GUYI-AI/<repository>@<full 40-hex sha>')
  return { repo: match[1], sha: match[2] }
}
export function actorOf(call = {}, self) {
  const id = call.agent || self?.userId
  if (!id) throw new Error('gugu supplied no caller identity')
  return { id, kind: call.agent ? 'agent' : 'person',
    ...(call.session ? { session: call.session } : {}),
    ...(call.model ? { model: call.model } : {}),
    ...(call.agentName || call.taskTitle || self?.name ? { name: call.agentName || call.taskTitle || self.name } : {}) }
}
function log(b, actor, now, what, item, detail = '') {
  const id = crypto.randomUUID()
  b.log[id] = { id, at: now, actor: copy(actor), what, ...(item ? { item } : {}), detail }
}
export function itemOf(b, id) {
  if (!b.items[id]) throw new Error(`No item ${id}`)
  return b.items[id]
}
function ownerOf(value) {
  if (value === null) return null
  const id = text(value, 'owner', 100)
  if (!/^user:[\w-]+$/.test(id)) throw new Error('owner is a chat member user:<uuid>')
  return id
}
export function applySet(b, fields, actor, now) {
  asBoard(b)
  const fresh = fields.item === undefined
  if (fields.id !== undefined && (!fresh || !/^PP-\d+$/.test(fields.id))) throw new Error('id only preserves an existing PP-number during import')
  const id = fresh ? fields.id ?? `PP-${crypto.randomUUID().slice(0, 8)}` : fields.item
  if (fresh && b.items[id]) throw new Error(`Item ${id} already exists; read it before changing it`)
  const item = fresh ? { id, list: LIST, title: '', when: '前', check: '', source: [], owner: null,
    status: 'pending', evidence: null, reason: null, ask: null, due: null, createdAt: now, updatedAt: now, createdBy: copy(actor) } : itemOf(b, id)
  // Plan on a copy first. A rejected operation must never leave half an edit in the live file.
  const next = copy(item)
  if (fields.list !== undefined && fields.list !== LIST) throw new Error(`v1 has one list: ${LIST}`)
  for (const key of ['title', 'check']) if (fields[key] !== undefined) next[key] = text(fields[key], key)
  if (fields.when !== undefined) {
    if (!['前', '后', null].includes(fields.when)) throw new Error('when is 前, 后, or null (not tied to a release)')
    if (item.sweep) throw new Error('A sweep remains a release prerequisite')
    next.when = fields.when
  }
  if (fields.source !== undefined) next.source = links(fields.source, 'source')
  if (fields.note !== undefined) next.note = text(fields.note, 'note', 12000)
  if (fields.owner !== undefined) next.owner = ownerOf(fields.owner)
  if (fields.hold === true) {
    if (item.owner && item.owner !== actor.id) throw new Error(`Item ${id} is assigned to ${item.owner}; ask them or a person to reassign it`)
    next.owner = actor.id
  }
  if (fields.due !== undefined) {
    if (item.release && fields.due !== item.due) throw new Error('A release follow-up keeps its original 24-hour deadline')
    if (fields.due !== null && !Number.isFinite(Date.parse(fields.due))) throw new Error('due is an ISO timestamp or null')
    next.due = fields.due === null ? null : new Date(fields.due).toISOString()
  }
  if (fields.ask !== undefined) {
    const a = fields.ask
    if (a === null) next.ask = null
    else {
      if (!Array.isArray(a.options) || !a.options.length || a.options.length > 6) throw new Error('ask needs 1–6 answer options')
      next.ask = { question: text(a.question, 'question', 1000), options: a.options.map((o) => text(o, 'option', 100)), by: actor.id }
    }
  }
  if (fields.answer !== undefined) {
    if (actor.kind !== 'person') throw new Error('Only a person can answer a question on the ledger page')
    if (!item.ask) throw new Error('This item has no question')
    const answer = text(fields.answer, 'answer', 2000)
    next.ask = null
    next.answer = { question: item.ask.question, text: answer, actor: copy(actor), at: now }
  }
  if ([fields.done && typeof fields.done === 'object', fields.drop !== undefined, fields.done === false].filter(Boolean).length > 1) throw new Error('Use done, drop, or reopen, one at a time')
  if (fields.done && typeof fields.done === 'object') {
    if (next.ask) throw new Error('Answer or withdraw the pending question before completing the item')
    if (item.sweep && (actor.kind !== 'agent' || actor.id === item.sweep.requester)) throw new Error('The sweep must be completed by an agent other than the ticket requester')
    const evidence = { reading: text(fields.done.evidence, 'evidence', 12000), links: links(fields.done.links, 'evidence links'), actor: copy(actor), at: now }
    next.status = 'done'; next.evidence = evidence; next.reason = null
  } else if (fields.drop !== undefined) {
    if (item.sweep) throw new Error('A sweep must be completed by another agent; it cannot be dropped')
    next.status = 'dropped'; next.reason = text(fields.drop?.reason, 'drop reason'); next.evidence = null; next.ask = null
  } else if (fields.done === false) {
    next.status = 'pending'; next.evidence = null; next.reason = null
  }
  if (next.ask && next.status !== 'pending') throw new Error('Reopen a closed item before asking a question')
  if (fields.review !== undefined) throw new Error('Evidence review is not part of v1; complete the independent sweep with done and evidence')
  if (!next.title || !next.check || !next.source.length) throw new Error('An item requires title, check and source links')
  next.updatedAt = now
  if (fresh) b.items[id] = next
  else for (const key of Object.keys(next)) if (JSON.stringify(item[key]) !== JSON.stringify(next[key])) item[key] = next[key]
  log(b, actor, now, fresh ? 'created' : fields.answer !== undefined ? 'answered' : fields.done ? 'done' : fields.drop ? 'dropped' : 'changed', id,
    fields.done?.evidence || fields.drop?.reason || fields.answer || next.title)
  const duplicates = rows(b).filter((other) => other.id !== id && other.source.some((s) => next.source.includes(s))).map((i) => i.id)
  return { item: id, ...(duplicates.length ? { sameSource: duplicates } : {}) }
}
export function blockers(b, now, subject) {
  return rows(b).filter((i) => !closed(i) && ((i.when === '前' && (!i.sweep || i.sweep.subject === subject)) || (i.when === '后' && i.release && i.due && i.due <= now)))
}
// A deterministic sweep key means two computers requesting the same subject add one shared item.
export function prepareSweep(b, subject, actor, reviewer, now) {
  const parsed = subjectOf(subject)
  const id = `SW-${parsed.repo.split('/')[1]}-${parsed.sha}`
  let item = b.items[id]
  if (!item) {
    item = { id, list: LIST, title: `扫漏 ${parsed.sha.slice(0, 7)}`, when: '前',
      check: '比较上次发布与本批改动，记录 PR、迁移、环境变量和配置的读数；遗漏的前提逐项登记并引用编号。',
      source: [`https://github.com/${parsed.repo}/commit/${parsed.sha}`], owner: reviewer?.id ?? null,
      status: 'pending', evidence: null, reason: null, ask: null, due: null, createdAt: now, updatedAt: now,
      createdBy: copy(actor), sweep: { subject, requester: actor.id } }
    b.items[id] = item
    log(b, actor, now, 'sweep created', id, subject)
  } else if (item.status === 'done' && item.evidence?.actor?.id === actor.id) {
    item.status = 'pending'; item.evidence = null; item.owner = reviewer?.id ?? null
    item.sweep.requester = actor.id
    log(b, actor, now, 'sweep reopened', id, 'The requester cannot use their own sweep')
  } else if (!item.owner && reviewer) item.owner = reviewer.id
  return id
}
export function issueTicket(b, subject, actor, now, file) {
  if (actor.kind !== 'agent') throw new Error('Request release tickets through ops__ticket as an agent')
  const before = rows(b).filter((i) => i.when === '前' && (!i.sweep || i.sweep.subject === subject))
  const blocked = blockers(b, now, subject)
  const sweep = before.find((i) => i.sweep?.subject === subject)
  if (!sweep || sweep.status !== 'done' || sweep.evidence?.actor?.kind !== 'agent' || sweep.evidence.actor.id === actor.id) {
    if (sweep && !blocked.some((i) => i.id === sweep.id)) blocked.push(sweep)
  }
  if (!sweep) throw new Error('Request the independent sweep before issuing a ticket')
  if (blocked.length) {
    log(b, actor, now, 'ticket refused', null, `${subject}: ${blocked.map((i) => i.id).join(', ')}`)
    return { ok: false, subject, blockers: blocked.map((i) => ({ id: i.id, title: i.title, overdue: i.when === '后' })) }
  }
  const id = crypto.randomUUID()
  const due = new Date(Date.parse(now) + 24 * 3600_000).toISOString()
  const after = rows(b).filter((i) => i.when === '后' && !closed(i))
  for (const item of after) {
    // An earlier ticket's deadline must never be extended by requesting another ticket.
    if (!item.release) { item.release = id; item.due = due }
  }
  const entry = (i) => ({ id: i.id, title: i.title.slice(0, 80) })
  const payload = { version: 1, id, chat: file.chat, list: LIST, subject: subjectOf(subject),
    issuedAt: now, expiresAt: new Date(Date.parse(now) + 30 * 60_000).toISOString(), requestedBy: copy(actor),
    board: { file: file.id }, open: [],
    done: before.filter((i) => i.status === 'done').map(entry),
    dropped: before.filter((i) => i.status === 'dropped').map((i) => ({ ...entry(i), reason: i.reason })),
    after: after.map((i) => ({ ...entry(i), due: b.items[i.id].due })),
    sweep: { id: sweep.id, by: copy(sweep.evidence.actor) } }
  b.tickets[id] = payload
  log(b, actor, now, 'ticket issued', null, `${subject} · ${id}`)
  return { ok: true, payload }
}
export function encodeTicket(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `ops1.${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`
}
export function boardText(b, { item, mine, due, offset = 0, limit = 25 } = {}, actor, now) {
  const bytes = (s) => new TextEncoder().encode(s).length
  if (item) {
    const full = JSON.stringify({ ...itemOf(b, item), log: logRows(b).filter((l) => l.item === item) }, null, 2)
    let end = Math.min(full.length, offset + 6500)
    while (bytes(full.slice(offset, end)) > 6500) end -= 100
    return full.slice(offset, end) + (end < full.length ? `\n[Continue this record: item=${item}, offset=${end}]` : '')
  }
  const selected = rows(b).filter((i) => !closed(i) && (!mine || i.owner === actor.id) && (!due || (i.due && i.due <= now)))
  const page = []
  for (const i of selected.slice(offset, offset + limit)) {
    const line = `${i.id} [${i.when ?? '不绑批次'}] ${i.title.slice(0, 120)}${i.ask ? ' · 等你' : ''}${i.due && i.due <= now ? ' · 过期' : ''} · ${i.owner ?? '没人接'}`
    if (bytes([...page, line].join('\n')) > 4500) break
    page.push(line)
  }
  const recent = logRows(b).slice(0, 10).map((l) => `${l.at} ${(l.actor.name ?? l.actor.id).slice(0, 40)} ${l.what} ${l.item ?? ''}`)
  return [`${LIST}: ${selected.length} open; ${offset + 1}–${offset + page.length}`, ...page,
    ...(offset + page.length < selected.length ? [`More: offset=${offset + page.length}`] : []), 'Recent changes:', ...recent].join('\n')
}
