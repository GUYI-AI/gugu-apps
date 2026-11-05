// A whole-table overview for an agent's first look at a file: what each column holds, how numbers spread, which
// values stand out and which measures move together. Exact, over every row, through the same read-only SQLite engine.
import { query, quote, DataError } from './engine.js'

const one = (db, sql) => query(db, sql, { limit: 1 }).rows[0]
const round = (x) => (x === null || x === undefined ? x : Number(x.toPrecision(4)))

function numeric(db, from, c, present) {
  const isNumber = `typeof(${c}) IN ('integer','real')`
  const [n, min, max, sum, squares] = one(db, `SELECT count(*), min(${c}), max(${c}), total(${c}), total(${c} * ${c}) FROM ${from} WHERE ${isNumber}`)
  if (n === 0 || n !== present) return null // text or mixed: no numeric summary
  const at = (p) => one(db, `SELECT ${c} FROM ${from} WHERE ${isNumber} ORDER BY ${c} LIMIT 1 OFFSET ${Math.floor((n - 1) * p)}`)[0]
  const [q1, median, q3] = [at(0.25), at(0.5), at(0.75)]
  const mean = sum / n
  const sd = n > 1 ? Math.sqrt(Math.max(0, (squares - n * mean * mean) / (n - 1))) : null
  const fence = 1.5 * (q3 - q1)
  const [outliers] = one(db, `SELECT count(*) FROM ${from} WHERE ${isNumber} AND (${c} < ${q1 - fence} OR ${c} > ${q3 + fence})`)
  return { min, q1, median, q3, max, mean: round(mean), sd: round(sd), outliers }
}

/** Pearson r for every pair of numeric columns, over rows where both are present; strongest first. */
function correlations(db, from, names) {
  const pairs = []
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const [a, b] = [quote(names[i]), quote(names[j])]
      const [n, x, y, xx, yy, xy] = one(db, `SELECT count(*), total(${a}), total(${b}), total(${a}*${a}), total(${b}*${b}), total(${a}*${b})
        FROM ${from} WHERE typeof(${a}) IN ('integer','real') AND typeof(${b}) IN ('integer','real')`)
      const spread = Math.sqrt((n * xx - x * x) * (n * yy - y * y))
      if (n > 2 && spread > 0) pairs.push({ a: names[i], b: names[j], r: round((n * xy - x * y) / spread), n })
    }
  }
  return pairs.sort((p, q) => Math.abs(q.r) - Math.abs(p.r)).slice(0, 10)
}

export function profile(db, tables, name = tables.find((t) => t.name === 't')?.name ?? tables[0]?.name) {
  const table = tables.find((t) => t.name === name)
  if (!table) throw new DataError('no-table', `no table ${JSON.stringify(name)}`)
  const from = quote(table.name)
  const columns = table.columns.map(({ name, type }) => {
    const c = quote(name)
    const [present, distinct] = one(db, `SELECT count(${c}), count(DISTINCT ${c}) FROM ${from}`)
    const numbers = present ? numeric(db, from, c, present) : null
    const top = !numbers && distinct > 0 && distinct < present
      ? query(db, `SELECT ${c}, count(*) AS n FROM ${from} WHERE ${c} IS NOT NULL GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 5`).rows
      : undefined
    return { name, type, missing: table.rows - present, distinct, ...(numbers ?? {}), ...(top ? { top } : {}) }
  })
  const measures = columns.filter((c) => c.mean !== undefined).map((c) => c.name).slice(0, 12)
  return { table: table.name, rows: table.rows, columns, correlations: correlations(db, from, measures) }
}
