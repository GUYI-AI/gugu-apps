import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

globalThis.require ??= createRequire(import.meta.url)
const { load } = await import('../app/lib/engine.js')
const { profile } = await import('../app/lib/profile.js')
const { initSqlJs } = await import('../app/vendor/sql.js')

test('a profile covers every row: spread, outliers, common values and correlations', async () => {
  // 210 rows: y = 2x (r = 1), z falls as x rises (r = -1), one x missing, one huge outlier in w.
  const lines = Array.from({ length: 210 }, (_, i) => `${i % 3 ? 'north' : 'south'},${i === 209 ? '' : i},${2 * i},${-i},${i === 0 ? 10000 : i % 7},`)
  const { db, tables } = await load('data.csv', 'region,x,y,z,w,blank\n' + lines.join('\n'))
  try {
    const out = profile(db, tables)
    const col = Object.fromEntries(out.columns.map((c) => [c.name, c]))
    assert.equal(out.rows, 210)
    assert.deepEqual(col.region.top, [['north', 140], ['south', 70]])
    assert.equal(col.region.mean, undefined)
    assert.deepEqual([col.x.missing, col.x.min, col.x.median, col.x.max, col.x.mean], [1, 0, 104, 208, 104])
    assert.equal(col.x.sd, 60.48)
    assert.equal(col.x.outliers, 0)
    assert.equal(col.w.outliers, 1)
    assert.equal(col.blank.missing, 210)
    assert.equal(col.blank.top, undefined)
    const r = Object.fromEntries(out.correlations.map((p) => [`${p.a}~${p.b}`, p]))
    assert.deepEqual([r['x~y'].r, r['x~y'].n], [1, 209])
    assert.equal(r['y~z'].r, -1)
    assert.ok(Math.abs(out.correlations[0].r) >= Math.abs(out.correlations.at(-1).r))
  } finally { db.close() }
})

test('quoted names, mixed storage and empty tables get no invented numbers', async () => {
  const SQL = await initSqlJs()
  const source = new SQL.Database()
  source.run('CREATE TABLE "a""b" ("x""y", n); INSERT INTO "a""b" VALUES (12, 1), (\'12%\', 1), (NULL, 2)')
  source.run('CREATE TABLE zero (n REAL)')
  const { db, tables } = await load('quoted.sqlite', source.export())
  source.close()
  try {
    const p = profile(db, tables, 'a"b')
    assert.deepEqual(p.columns[0], { name: 'x"y', type: 'ANY', missing: 1, distinct: 2 })
    assert.deepEqual(p.correlations, [])
    assert.deepEqual(profile(db, tables, 'zero'), { table: 'zero', rows: 0, columns: [{ name: 'n', type: 'REAL', missing: 0, distinct: 0 }], correlations: [] })
    assert.throws(() => profile(db, tables, 'missing'), { code: 'no-table' })
  } finally { db.close() }
})
