// What a Data Lens card says, checked the same way where it is made (tools.js data_card) and where it is drawn (card.js).
// A card's data is a reference and a question, never the data itself:
//   { file: "gugu-file://<id>?v=<n>", sheet?, sql, view: { kind, x?, y?, color?, value?, title? } }
// It is untrusted input from any chat member: every field is checked here, and nothing in it is ever run but the SQL,
// which engine.js only runs as one read-only query over the viewer's own in-memory copy.
import { DataError } from './errors.js'

export const VIEW_KINDS = ['table', 'bar', 'line', 'scatter', 'heatmap', 'kpi']
/** widget_send refuses data over 4096 UTF-8 bytes. */
export const DATA_BYTES = 4096

/** "gugu-file://<id>?v=<n>", "gugu-file://<id>" or a bare id → { id, version|null }. */
export function fileOf(value, version) {
  if (typeof value !== 'string' || !value.trim()) throw new DataError('bad-card', 'file is a chat file: gugu-file://<id>?v=<n>')
  const match = /^(?:gugu-file:\/\/)?([^?#/\s]+)(?:\?v=(\d+))?$/.exec(value.trim())
  if (!match) throw new DataError('bad-card', `file ${JSON.stringify(value)} is not a chat file reference`)
  const pinned = match[2] !== undefined ? Number(match[2]) : version ?? null
  if (pinned !== null && !(Number.isInteger(pinned) && pinned > 0)) throw new DataError('bad-card', 'version is a positive whole number')
  return { id: match[1], version: pinned }
}

const text = (value, field, max) => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || value.length > max) throw new DataError('bad-card', `${field} is text of at most ${max} characters`)
  return value
}

/** A card's data, checked: { id, version, sheet, sql, view }. */
export function cardOf(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new DataError('bad-card', 'the card has no data')
  const { id, version } = fileOf(data.file, data.version)
  const sql = text(data.sql, 'sql', 4000)
  if (!sql) throw new DataError('bad-card', 'the card has no sql')
  return { id, version, sheet: text(data.sheet, 'sheet', 120), sql, view: viewOf(data.view) }
}

/** A view's shape alone (its columns are checked against a result by checkView). */
export function viewOf(view = { kind: 'table' }) {
  if (!view || typeof view !== 'object' || Array.isArray(view)) throw new DataError('bad-view', 'view is an object: { kind, x, y, … }')
  const kind = view.kind ?? 'table'
  if (!VIEW_KINDS.includes(kind)) throw new DataError('bad-view', `view.kind is one of ${VIEW_KINDS.join(', ')}`)
  const out = { kind }
  for (const field of ['x', 'y', 'color', 'value', 'title']) {
    const v = text(view[field], `view.${field}`, field === 'title' ? 80 : 120)
    if (v !== undefined) out[field] = v
  }
  return out
}

const NEEDS = { bar: ['x', 'y'], line: ['x', 'y'], scatter: ['x', 'y'], heatmap: ['x', 'y', 'value'], table: [], kpi: [] }

/** The view against what its query returned: every column it names must be one of `columns`. */
export function checkView(view, columns) {
  for (const field of NEEDS[view.kind]) {
    if (view[field] === undefined) throw new DataError('bad-view', `a ${view.kind} view needs view.${field}: one of the query's columns (${columns.join(', ')})`)
  }
  for (const field of ['x', 'y', 'color', 'value']) {
    if (view[field] !== undefined && !columns.includes(view[field])) {
      throw new DataError('bad-view', `view.${field} ${JSON.stringify(view[field])} is not a column of the query; it returns ${columns.join(', ')}`)
    }
  }
  return view
}

/** The bytes widget_send counts. */
export const dataBytes = (data) => new TextEncoder().encode(JSON.stringify(data)).byteLength
