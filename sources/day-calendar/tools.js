// The calendar's program: the only writer of journal.json. Agents call `record`; the page calls
// all three through callProgram, so agents and the person never overwrite each other's entries.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const pad = (n) => String(n).padStart(2, '0')
const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const PAGE_ONLY = { ui: { visibility: ['app'] } }

function checkDay(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || Number.isNaN(Date.parse(date))) throw new Error(`date must be YYYY-MM-DD, got ${JSON.stringify(date)}`)
  return date
}

// Read, change, write in one synchronous step: calls from several agents run one after another.
function change(fn) {
  const dir = process.env.GUGU_EXTENSION_DATA_DIR
  if (!dir) throw new Error('GUGU_EXTENSION_DATA_DIR is not set')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'journal.json')
  let journal
  try {
    journal = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw new Error(`journal.json could not be read: ${e.message}`)
    journal = { version: 1, days: {} }
  }
  const out = fn(journal)
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(journal))
  renameSync(tmp, file)
  return out
}

export const record = {
  description: "Record on the person's calendar (the 日历 tab in the task page's side panel): kind 'todo' is something they plan to do (checkable), 'memory' something that happened. Use it when they ask you to note, remember or plan something for a day.",
  inputSchema: {
    type: 'object',
    required: ['kind', 'title'],
    properties: {
      kind: { type: 'string', enum: ['todo', 'memory'] },
      title: { type: 'string', description: "One line, in the person's words." },
      detail: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      date: { type: 'string', description: 'YYYY-MM-DD; today when left out.' },
      time: { type: 'string', description: 'HH:MM; for a memory, now when left out.' },
    },
  },
  async run({ kind, title, detail, tags, date, time }, { agent, session }) {
    if (kind !== 'todo' && kind !== 'memory') throw new Error("kind must be 'todo' or 'memory'")
    const line = String(title || '').trim()
    if (!line) throw new Error('title is empty')
    const now = new Date()
    const day = checkDay(date || dayOf(now))
    const at = time || (kind === 'memory' ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : undefined)
    if (at !== undefined && !/^\d{2}:\d{2}$/.test(at)) throw new Error(`time must be HH:MM, got ${JSON.stringify(time)}`)
    return change((journal) => {
      const list = journal.days[day] || (journal.days[day] = [])
      // The same line twice on a day is the same entry: a retried call adds nothing.
      if (list.some((e) => e.kind === kind && e.title === line)) return `Already on ${day}: ${line}`
      const entry = { id: randomUUID(), kind, title: line, at: Date.now() }
      // An agent's entry keeps the session it was recorded in (call.session, stamped by gugu): a click takes the person there.
      if (agent) {
        entry.by = agent
        if (session) entry.session = session
      }
      if (kind === 'todo') entry.done = false
      if (at) entry.time = at
      if (detail) entry.detail = String(detail)
      if (Array.isArray(tags) && tags.length) entry.tags = tags.map(String).slice(0, 5)
      list.push(entry)
      return `Recorded ${kind} on ${day}${at ? ` ${at}` : ''}: ${line}`
    })
  },
}

export const set_done = {
  description: 'Check or uncheck a to-do (the calendar page).',
  _meta: PAGE_ONLY,
  inputSchema: {
    type: 'object',
    required: ['date', 'id', 'done'],
    properties: { date: { type: 'string' }, id: { type: 'string' }, done: { type: 'boolean' } },
  },
  async run({ date, id, done }) {
    const day = checkDay(date)
    return change((journal) => {
      const entry = (journal.days[day] || []).find((e) => e.id === id)
      if (!entry) throw new Error(`no entry ${id} on ${day}`)
      entry.done = !!done
      return 'ok'
    })
  },
}

export const remove = {
  description: 'Delete an entry (the calendar page).',
  _meta: PAGE_ONLY,
  inputSchema: {
    type: 'object',
    required: ['date', 'id'],
    properties: { date: { type: 'string' }, id: { type: 'string' } },
  },
  async run({ date, id }) {
    const day = checkDay(date)
    return change((journal) => {
      const list = (journal.days[day] || []).filter((e) => e.id !== id)
      if (list.length) journal.days[day] = list
      else delete journal.days[day]
      return 'ok'
    })
  },
}
