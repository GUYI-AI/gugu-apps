import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

// Dates read the same in every time zone: a CSV date and Excel day serials (46023 is 2026-01-01).
const probe = `
const { createRequire } = await import('node:module')
globalThis.require ??= createRequire(process.cwd() + '/')
const XLSX = await import('xlsx')
const { load, query } = await import(${JSON.stringify(new URL('../app/lib/engine.js', import.meta.url).href)})
const csv = await load('d.csv', 'd\\n2026-01-01\\n2026-03-15\\n')
const book = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['d'], [{ t: 'n', v: 46023, z: 'yyyy-mm-dd' }], [{ t: 'n', v: 46023.5, z: 'yyyy-mm-dd hh:mm' }]]), 's')
const xlsx = await load('d.xlsx', new Uint8Array(XLSX.write(book, { type: 'array', bookType: 'xlsx' })))
console.log(JSON.stringify([query(csv.db, 'SELECT d FROM t').rows.flat(), query(xlsx.db, 'SELECT d FROM t').rows.flat()]))
`

for (const TZ of ['UTC', 'Asia/Shanghai', 'America/Los_Angeles']) {
  test(`dates are the same calendar day and time in ${TZ}`, () => {
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { env: { ...process.env, TZ }, encoding: 'utf8', cwd: new URL('..', import.meta.url) })
    assert.equal(run.status, 0, run.stderr)
    assert.deepEqual(JSON.parse(run.stdout.trim().split('\n').pop()), [['2026-01-01', '2026-03-15'], ['2026-01-01', '2026-01-01 12:00:00']])
  })
}
