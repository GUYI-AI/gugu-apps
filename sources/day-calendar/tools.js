// The calendar's program: the only writer of journal.json. Agents call `record`; the page calls
// all three through callProgram, so agents and the person never overwrite each other's entries.
import { readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const pad = (n) => String(n).padStart(2, '0')
const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const PAGE_ONLY = { ui: { visibility: ['app'] } }
// 00:00–23:59: compared as text, two such clocks order as their times do.
const isClock = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s))

// A day that is on the calendar: 2026-02-31 parses, but no month shows it.
function checkDay(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date))
  if (!m || dayOf(new Date(+m[1], +m[2] - 1, +m[3])) !== date) throw new Error(`date must be a real day as YYYY-MM-DD, got ${JSON.stringify(date)}`)
  return date
}

const pause = new Int32Array(new SharedArrayBuffer(4))
// Windows refuses a rename over a file being read at that instant (the page's readData): try again shortly.
function replace(tmp, file) {
  for (let attempt = 0; ; attempt++) {
    try {
      return renameSync(tmp, file)
    } catch (e) {
      if (attempt >= 9 || !['EPERM', 'EACCES', 'EBUSY'].includes(e.code)) {
        try { unlinkSync(tmp) } catch {}
        throw e
      }
      Atomics.wait(pause, 0, 0, 20)
    }
  }
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
  try {
    writeFileSync(tmp, JSON.stringify(journal))
  } catch (e) {
    try { unlinkSync(tmp) } catch {}
    throw e
  }
  replace(tmp, file)
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
      end: { type: 'string', description: 'HH:MM, after `time`: when it ends, for something that lasts (a meeting from 14:00 to 15:00). Needs `time`.' },
    },
  },
  async run({ kind, title, detail, tags, date, time, end }, { agent, session }) {
    if (kind !== 'todo' && kind !== 'memory') throw new Error("kind must be 'todo' or 'memory'")
    const line = String(title || '').trim()
    if (!line) throw new Error('title is empty')
    const now = new Date()
    const day = checkDay(date || dayOf(now))
    const at = time || (kind === 'memory' ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : undefined)
    if (at !== undefined && !isClock(at)) throw new Error(`time must be HH:MM, got ${JSON.stringify(time)}`)
    if (end !== undefined && end !== null && end !== '') {
      if (!isClock(end)) throw new Error(`end must be HH:MM, got ${JSON.stringify(end)}`)
      if (at === undefined) throw new Error('end needs a time to start from')
      if (end <= at) throw new Error(`end must be after time (${at}), got ${end}`)
    } else end = undefined
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
      if (end) entry.end = end
      if (detail) entry.detail = String(detail)
      if (Array.isArray(tags) && tags.length) entry.tags = tags.map(String).slice(0, 5)
      list.push(entry)
      return `Recorded ${kind} on ${day}${at ? ` ${at}` : ''}${end ? `–${end}` : ''}: ${line}`
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
