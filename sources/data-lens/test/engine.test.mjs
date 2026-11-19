import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CSV, sqlite, workbook } from './fixtures.mjs'

const { load, query, LIMITS } = await import('../app/lib/engine.js')

const rows = (db, sql) => query(db, sql).rows

test('a CSV is table t, typed by its values, its BOM and blanks handled', async () => {
  const { db, tables } = await load('销售.csv', CSV)
  assert.deepEqual(tables.map((t) => t.name), ['t'])
  assert.deepEqual(tables[0].columns, [{ name: '区域', type: 'TEXT' }, { name: '季度', type: 'TEXT' }, { name: '金额', type: 'REAL' }, { name: '日期', type: 'TEXT' }])
  assert.equal(tables[0].rows, 4)
  assert.deepEqual(rows(db, 'SELECT 区域, sum(金额) FROM t GROUP BY 1 ORDER BY 1'), [['华东', 200.5], ['华北', 200]])
  assert.deepEqual(rows(db, 'SELECT count(*) FROM t WHERE 金额 IS NULL'), [[1]])
})

test('the same CSV read as bytes gives the same table', async () => {
  const { db } = await load('a.csv', new TextEncoder().encode(CSV))
  assert.deepEqual(rows(db, 'SELECT count(*), sum(金额) FROM t'), [[4, 400.5]])
})

test('a workbook: a table per sheet, view t of the first or the chosen one, dates as ISO text', async () => {
  const bytes = workbook()
  const { db, tables } = await load('book.xlsx', bytes)
  assert.deepEqual(tables.map((t) => t.name).sort(), ['Other', 't', '销售 2026'].sort())
  assert.deepEqual(rows(db, 'SELECT 区域, 销售额, 下单日 FROM t ORDER BY 2 DESC'), [['华南', 250.25, '2026-02-04'], ['华东', 100, '2026-01-03'], ['华北', null, '2026-03-05']])
  const other = await load('book.xlsx', bytes, { sheet: 'Other' })
  assert.deepEqual(rows(other.db, 'SELECT sum(n) FROM t'), [[3]])
  await assert.rejects(load('book.xlsx', bytes, { sheet: 'Nope' }), { code: 'no-sheet' })
})

test('a SQLite file opens as it is', async () => {
  const { db, tables } = await load('shop.sqlite', await sqlite(30))
  assert.deepEqual(tables.map((t) => [t.name, t.rows]), [['customers', 2], ['orders', 30]])
  assert.deepEqual(rows(db, 'SELECT region, count(*) FROM orders GROUP BY 1 ORDER BY 1'), [['east', 10], ['north', 10], ['west', 10]])
})

test('only one read-only query runs: writes, two statements, ATTACH and PRAGMA writes are refused', async () => {
  const { db } = await load('shop.db', await sqlite())
  for (const sql of [
    'DELETE FROM orders',
    'SELECT 1; DELETE FROM orders',
    'select 1; select 2',
    "ATTACH DATABASE 'x' AS x",
    'PRAGMA query_only = OFF',
    'WITH x AS (SELECT 1) DELETE FROM orders',
    'WITH x AS (SELECT 1) INSERT INTO customers (name) SELECT 1 FROM x',
    '/* hi */ DROP TABLE orders',
    '',
  ]) {
    assert.throws(() => query(db, sql), { code: 'bad-sql' }, sql)
  }
  assert.deepEqual(rows(db, 'SELECT count(*) FROM orders'), [[3]])
  assert.deepEqual(rows(db, '-- leading comment\nSELECT count(*) FROM customers;'), [[2]])
})

test('results stop at the row limit and say so', async () => {
  const { db } = await load('big.sqlite', await sqlite(LIMITS.rows + 10))
  const result = query(db, 'SELECT * FROM orders')
  assert.equal(result.rows.length, LIMITS.rows)
  assert.equal(result.truncated, true)
  assert.equal(query(db, 'SELECT * FROM orders', { limit: 5 }).rows.length, 5)
})

test('what is not a data file, or too big, is refused with a code', async () => {
  await assert.rejects(load('notes.md', 'x'), { code: 'unsupported' })
  await assert.rejects(load('fake.sqlite', new TextEncoder().encode('not a database at all')), { code: 'unreadable' })
  await assert.rejects(load('huge.csv', 'a'.repeat(LIMITS.bytes + 1)), { code: 'too-large' })
})

test('a sheet with hundreds of thousands of rows loads without running out of stack', async () => {
  const csv = 'n,v\n' + Array.from({ length: 300000 }, (_, i) => `${i},${i % 7}`).join('\n')
  const { db, tables } = await load('long.csv', csv)
  assert.equal(tables[0].rows, 300000)
  assert.deepEqual(rows(db, 'SELECT count(*), max(n) FROM t'), [[300000, 299999]])
})
