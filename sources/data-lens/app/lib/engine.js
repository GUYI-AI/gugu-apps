// The one query engine, shared by the card, the explore page (both through worker.js) and the agent's tools (tools.js):
// a data file becomes an in-memory SQLite database, and every view is one read-only SELECT over it.
//   .sqlite / .sqlite3 / .db   opened as it is
//   .xlsx / .xlsm / .xls / .ods every sheet a table named as the sheet, plus a view `t` of the chosen (or first) sheet
//   .csv / .tsv                one table `t`
import { initSqlJs } from '../vendor/sql.js'
import { read, utils } from '../vendor/xlsx.js'
import { SUFFIXES, kindOf } from './kinds.js'
import { DataError } from './errors.js'
import { quote } from './sql-text.js'

export { DataError, SUFFIXES, kindOf, quote }

export const LIMITS = Object.freeze({ bytes: 25 * 1024 * 1024, rows: 5000, sql: 4000 })


let engine
const sqlite = () => (engine ??= initSqlJs())

/**
 * Opens a data file: `content` is its bytes (Uint8Array / ArrayBuffer) or, for a CSV opened as text, its text.
 * Returns { db, tables: [{ name, columns: [{ name, type }], rows }] } with the database read-only.
 */
export async function load(name, content, { sheet } = {}) {
  const kind = kindOf(name)
  if (!kind) throw new DataError('unsupported', `Data Lens reads ${SUFFIXES.join(' ')} files, not ${JSON.stringify(name)}`)
  const size = typeof content === 'string' ? content.length : content.byteLength
  if (size > LIMITS.bytes) throw new DataError('too-large', `${name} is ${(size / 1048576).toFixed(1)} MB; Data Lens reads up to ${LIMITS.bytes / 1048576} MB`)
  const SQL = await sqlite()
  let db
  if (kind === 'sqlite') {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content)
    if (new TextDecoder().decode(bytes.subarray(0, 15)) !== 'SQLite format 3') throw new DataError('unreadable', `${name} is not a SQLite database`)
    db = new SQL.Database(bytes)
  } else {
    db = new SQL.Database()
    const sheets = kind === 'csv' ? [['t', rowsOfCsv(name, content)]] : rowsOfWorkbook(content)
    if (!sheets.length) throw new DataError('empty', `${name} has no sheets with data`)
    for (const [table, rows] of sheets) loadTable(db, table, rows)
    if (kind === 'workbook') {
      const names = sheets.map(([table]) => table)
      const chosen = sheet === undefined ? names[0] : names.find((n) => n === sheet)
      if (chosen === undefined) throw new DataError('no-sheet', `${name} has no sheet ${JSON.stringify(sheet)}; it has ${names.map((n) => JSON.stringify(n)).join(', ')}`)
      if (!names.includes('t')) db.run(`CREATE VIEW t AS SELECT * FROM ${quote(chosen)}`)
    }
  }
  db.run('PRAGMA query_only = ON')
  return { db, tables: tablesOf(db) }
}

function rowsOfCsv(name, content) {
  const text = typeof content === 'string' ? content : new TextDecoder().decode(content)
  const book = read(text.replace(/^﻿/, ''), { type: 'string', cellDates: true, dense: true, FS: name.toLowerCase().endsWith('.tsv') ? '\t' : undefined })
  return utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1, raw: true, defval: null, blankrows: false })
}

function rowsOfWorkbook(content) {
  const book = read(content instanceof Uint8Array ? content : new Uint8Array(content), { type: 'array', cellDates: true, dense: true })
  return book.SheetNames
    .map((sheet) => [sheet, utils.sheet_to_json(book.Sheets[sheet], { header: 1, raw: true, defval: null, blankrows: false })])
    .filter(([, rows]) => rows.length > 0)
}

/** First row the header; every column typed by what its values are (all numbers: INTEGER or REAL, else TEXT). */
function loadTable(db, table, rows) {
  const [head = [], ...body] = rows
  const width = body.reduce((w, r) => Math.max(w, r.length), head.length)
  const names = []
  for (let i = 0; i < width; i++) {
    const base = String(head[i] ?? '').trim() || `col_${i + 1}`
    let n = base
    for (let k = 2; names.includes(n); k++) n = `${base}_${k}`
    names.push(n)
  }
  const cells = body.map((row) => names.map((_, i) => cell(row[i])))
  const types = names.map((_, i) => {
    const values = cells.map((r) => r[i]).filter((v) => v !== null)
    if (values.length && values.every((v) => typeof v === 'number')) return values.every(Number.isInteger) ? 'INTEGER' : 'REAL'
    return 'TEXT'
  })
  db.run(`CREATE TABLE ${quote(table)} (${names.map((n, i) => `${quote(n)} ${types[i]}`).join(', ')})`)
  if (!cells.length) return
  db.run('BEGIN')
  const insert = db.prepare(`INSERT INTO ${quote(table)} VALUES (${names.map(() => '?').join(', ')})`)
  for (const row of cells) insert.run(row.map((v, i) => (v !== null && types[i] === 'TEXT' ? String(v) : v)))
  insert.free()
  db.run('COMMIT')
}

function cell(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    // SheetJS builds dates in the reader's local time (a CSV's 2026-01-01 is local midnight), so they are written out in
    // local time too: UTC would move them by the time zone, across midnight east of Greenwich.
    const two = (n) => String(n).padStart(2, '0')
    const day = `${value.getFullYear()}-${two(value.getMonth() + 1)}-${two(value.getDate())}`
    const [h, m, s] = [value.getHours(), value.getMinutes(), value.getSeconds()]
    return h || m || s ? `${day} ${two(h)}:${two(m)}:${two(s)}` : day
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  return String(value)
}

function tablesOf(db) {
  const [list] = db.exec("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name")
  return (list?.values ?? []).map(([name]) => {
    const [cols] = db.exec(`SELECT name, type FROM pragma_table_info(${literal(name)})`)
    const [count] = db.exec(`SELECT count(*) FROM ${quote(name)}`)
    return { name, columns: (cols?.values ?? []).map(([n, type]) => ({ name: n, type: type || 'ANY' })), rows: count.values[0][0] }
  })
}

const literal = (text) => `'${String(text).replaceAll("'", "''")}'`

/**
 * One read-only statement: SELECT, WITH or VALUES, alone. The database is also `query_only`, so a write hidden in a
 * WITH still fails in SQLite itself. Throws DataError('bad-sql').
 */
export function checkSql(db, sql) {
  if (typeof sql !== 'string' || !sql.trim()) throw new DataError('bad-sql', 'sql is empty')
  if (sql.length > LIMITS.sql) throw new DataError('bad-sql', `sql is ${sql.length} characters; at most ${LIMITS.sql}`)
  const head = sql.replace(/^(\s+|--[^\n]*\n?|\/\*[\s\S]*?\*\/)+/, '')
  if (!/^(select|with|values)\b/i.test(head)) throw new DataError('bad-sql', 'only one read-only query: SELECT, WITH or VALUES')
  let count = 0
  try {
    for (const statement of db.iterateStatements(sql)) {
      statement.free()
      count++
    }
  } catch (error) {
    throw new DataError('bad-sql', error.message)
  }
  if (count !== 1) throw new DataError('bad-sql', `one statement only; this has ${count}`)
}

/** Runs a checked query: { columns, rows, truncated } with at most `limit` rows. */
export function query(db, sql, { limit = LIMITS.rows } = {}) {
  checkSql(db, sql)
  const max = Math.max(1, Math.min(LIMITS.rows, Math.floor(limit)))
  let statement
  try {
    statement = db.prepare(sql)
    const columns = statement.getColumnNames()
    const rows = []
    let truncated = false
    while (statement.step()) {
      if (rows.length === max) {
        truncated = true
        break
      }
      rows.push(statement.get().map((v) => (v instanceof Uint8Array ? `[${v.byteLength} bytes]` : v)))
    }
    return { columns, rows, truncated }
  } catch (error) {
    throw error instanceof DataError ? error : new DataError('bad-sql', error.message)
  } finally {
    statement?.free()
  }
}
