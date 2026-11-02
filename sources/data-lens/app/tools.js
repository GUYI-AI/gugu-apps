// Data Lens for agents: look at a chat's data file, try a query, and get a card's data checked before widget_send.
// The same engine as the card (lib/engine.js), so what an agent sees here is what the card will draw.
import { createRequire } from 'node:module'

// sql.js's asm.js build reaches for `require` when it finds itself in Node; an ES module has none of its own.
globalThis.require ??= createRequire(import.meta.url)
const { load, query, DataError } = await import('./lib/engine.js')
const { cardOf, checkView, dataBytes, DATA_BYTES, viewOf } = await import('./lib/spec.js')

/** The last few files opened, by id@version: a schema, then a query, then a card read the file once. */
const opened = new Map()
const KEEP = 3

async function open(file, version, sheet) {
  const f = await gugu.files.open({ id: file })
  try {
    const entry = f.entry
    const v = version ?? entry.version
    const key = `${entry.id}@${v}#${sheet ?? ''}`
    if (!opened.has(key)) {
      let content
      if (v !== entry.version) {
        const kept = await gugu.files.readVersion({ id: file }, v)
        content = typeof kept === 'string' ? kept : new Uint8Array(await kept.arrayBuffer())
      } else if (typeof f.blob === 'function') {
        content = new Uint8Array(await (await f.blob()).arrayBuffer())
      } else {
        for (let n = 0; typeof f.text !== 'string' && n < 100; n++) await new Promise((done) => setTimeout(done, 50))
        content = f.text
      }
      opened.set(key, { entry: { id: entry.id, name: entry.name, latest: entry.version }, version: v, ...(await load(entry.name, content, { sheet })) })
      while (opened.size > KEEP) {
        const [oldest] = opened.keys()
        opened.get(oldest).db.close()
        opened.delete(oldest)
      }
    }
    return opened.get(key)
  } finally {
    f.close?.()
  }
}

/** Rows until the answer is about 6 KB: agents keep only so much of a tool's answer. */
function fit(result, max) {
  const rows = []
  let bytes = JSON.stringify(result.columns).length
  for (const row of result.rows.slice(0, max)) {
    bytes += JSON.stringify(row).length + 1
    if (bytes > 6000) break
    rows.push(row)
  }
  return { columns: result.columns, rows, shown: rows.length, more: result.truncated || rows.length < result.rows.length }
}

const fileParam = { type: 'string', format: 'gugu-file', description: 'The chat data file (.csv .tsv .xlsx .xls .ods .sqlite .db)' }
const sheetParam = { type: 'string', description: 'Workbook only: which sheet the view `t` is (default the first). Every sheet is also a table by its own name.' }
const versionParam = { type: 'integer', minimum: 1, description: 'A kept version of the file (default the current one)' }

export const data_schema = {
  description: 'List the tables and columns of a chat data file, with each table\'s row count and first 3 rows. A CSV is table t; a workbook has a table per sheet plus view t (the first sheet); a SQLite file its own tables.',
  inputSchema: { type: 'object', required: ['file'], properties: { file: fileParam, sheet: sheetParam, version: versionParam } },
  async run({ file, sheet, version }) {
    const { entry, version: v, db, tables } = await open(file, version, sheet)
    return JSON.stringify({
      file: `gugu-file://${entry.id}?v=${v}`, name: entry.name, version: v, latestVersion: entry.latest,
      tables: tables.map((table) => ({ ...table, sample: fit(query(db, `SELECT * FROM "${table.name.replaceAll('"', '""')}" LIMIT 3`), 3).rows })),
    })
  },
}

export const data_query = {
  description: 'Run one read-only SQL query (SELECT / WITH, SQLite dialect) over a chat data file and see the result, as a card would compute it.',
  inputSchema: { type: 'object', required: ['file', 'sql'], properties: {
    file: fileParam, sql: { type: 'string' }, sheet: sheetParam, version: versionParam,
    limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Rows to show (default 50)' },
  } },
  async run({ file, sql, sheet, version, limit = 50 }) {
    const { db } = await open(file, version, sheet)
    return JSON.stringify(fit(query(db, sql), Math.min(200, limit)))
  },
}

export const data_card = {
  description: 'Check a Data Lens card before sending it: runs the query, checks the view against its columns, pins the file version, and returns the exact `data` for widget_send { chat_id, app: "data-lens", view: "card", text, data }. view.kind: table | bar | line | scatter (x, y, optional color) | heatmap (x, y, value) | kpi (first row); optional view.title.',
  inputSchema: { type: 'object', required: ['file', 'sql'], properties: {
    file: fileParam, sql: { type: 'string' }, sheet: sheetParam, version: versionParam,
    view: { type: 'object', description: '{ kind, x?, y?, color?, value?, title? } — x/y/color/value are column names of the query result' },
  } },
  async run({ file, sql, sheet, version, view }) {
    const { entry, version: v, db } = await open(file, version, sheet)
    const result = query(db, sql)
    const data = { file: `gugu-file://${entry.id}?v=${v}`, ...(sheet ? { sheet } : {}), sql, view: checkView(viewOf(view), result.columns) }
    cardOf(data)
    const bytes = dataBytes(data)
    if (bytes > DATA_BYTES) throw new DataError('too-large', `the card data is ${bytes} bytes; widget_send takes at most ${DATA_BYTES}. Shorten the sql.`)
    return JSON.stringify({ data, bytes, rows: result.rows.length, truncated: result.truncated, preview: fit(result, 10) })
  },
}
