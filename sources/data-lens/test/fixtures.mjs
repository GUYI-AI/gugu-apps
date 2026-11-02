// Test data made in the test, not stored: a workbook (SheetJS, a dev dependency) and a SQLite database (the App's own
// sql.js build), with Chinese names, dates, blanks and a sheet that is not the first.
import { createRequire } from 'node:module'
import * as XLSX from 'xlsx'

globalThis.require ??= createRequire(import.meta.url)
const { initSqlJs } = await import('../app/vendor/sql.js')

export const CSV = '﻿区域,季度,金额,日期\n华东,Q1,120.5,2026-01-15\n华东,Q2,80,2026-04-02\n华北,Q1,200,2026-02-01\n华北,Q2,,2026-05-20\n'

export function workbook() {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['区域', '销售额', '下单日'],
    ['华东', 100, new Date(Date.UTC(2026, 0, 3))],
    ['华南', 250.25, new Date(Date.UTC(2026, 1, 4))],
    ['华北', null, new Date(Date.UTC(2026, 2, 5))],
  ], { cellDates: true }), '销售 2026')
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['name', 'n'], ['a', 1], ['b', 2]]), 'Other')
  return new Uint8Array(XLSX.write(book, { type: 'array', bookType: 'xlsx' }))
}

export async function sqlite(rows = 3) {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  db.run('CREATE TABLE orders (id INTEGER PRIMARY KEY, region TEXT, amount REAL, day TEXT)')
  db.run('CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT)')
  const insert = db.prepare('INSERT INTO orders (region, amount, day) VALUES (?, ?, ?)')
  for (let i = 0; i < rows; i++) insert.run([['east', 'west', 'north'][i % 3], (i % 7) * 10 + 1, `2026-0${(i % 9) + 1}-01`])
  insert.free()
  db.run("INSERT INTO customers (name) VALUES ('甲'), ('乙')")
  const bytes = db.export()
  db.close()
  return bytes
}
