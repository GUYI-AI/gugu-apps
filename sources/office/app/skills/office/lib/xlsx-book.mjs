// A .xlsx as the skill's scripts open it (node): the package (ooxml-zip.mjs openPackage) read as a workbook
// (xlsx-read.js) with each sheet read when asked, an address resolved on it, a sheet's tables. What changes a workbook
// (xlsx-ooxml.mjs) and what calculates one (xlsx-calc.mjs) both open it with this — neither imports the other.
import { OoxmlError, relationships, relsOf, scanXml, unescape } from './ooxml-read.js'
import { openPackage } from './ooxml-zip.mjs'
import { parseCell, parseRange, quoteSheet, readBook, readSheet } from './xlsx-read.js'

// ─── the package ────────────────────────────────────────────────────────────

/** What a package's XML comes to unpacked, by its zip's directory: nothing inflated for it. */
export const xmlBytes = (pkg) => pkg.zip.entries.reduce((n, e) => n + (/\.xml$/i.test(e.name) ? e.size : 0), 0)
export const mb = (n) => `${Math.round(n / 1e6)} MB`
/** What a refusal for size adds: what saving the workbook back another way costs (the 10-15 A/B: agents did). */
export const NOT_RECALCULATED = "if it is saved back another way that does not recalculate formulas (openpyxl, say), the formulas' results are left empty or stale"

/**
 * The workbook of a package (xlsx-read.js), with each sheet's XML read when asked. Refused, nothing of it read, when its
 * XML unpacked is more than `limit` bytes (SIZE_LIMIT_BYTES).
 */
export async function openBook(bytes, limit = Infinity) {
  const pkg = openPackage(bytes)
  if (xmlBytes(pkg) > limit) throw new OoxmlError(`the workbook is ${Math.ceil(xmlBytes(pkg) / 1e6)} MB of XML unpacked, more than this script reads or changes (${mb(limit)}): use Excel or WPS; ${NOT_RECALCULATED}`)
  const book = await readBook(pkg.textAsync)
  const sheets = new Map()
  book.pkg = pkg
  book.sheet = (info) => {
    if (!sheets.has(info.name)) {
      const xml = pkg.text(info.part)
      if (xml === null) throw new OoxmlError(`${info.part} is missing from the file`)
      sheets.set(info.name, readSheet(xml, book))
    }
    return sheets.get(info.name)
  }
  return book
}

/** The sheets with cells (a chartsheet has none). */
export const worksheets = (book) => book.sheets.filter((s) => s.part)

/** A sheet by its name (as Excel matches them: case aside); refused, naming the sheets there are, when none is. */
function sheetNamed(book, name) {
  const all = worksheets(book)
  if (name === null) {
    if (all.length === 1) return all[0]
    throw new OoxmlError(`say which sheet — this workbook has ${all.length}: ${all.map((s) => quoteSheet(s.name)).join(', ')} (write 销售!A1:C5)`)
  }
  const found = all.find((s) => s.name === name) ?? all.find((s) => s.name.toLowerCase() === name.toLowerCase())
  if (!found) throw new OoxmlError(`no sheet ${JSON.stringify(name)} — this workbook has ${all.map((s) => quoteSheet(s.name)).join(', ')}`)
  return found
}

/** The cells a sheet uses: A1 to its last row and column (A1 alone when it is empty). */
export const usedBox = (sheet) => ({ r0: 0, c0: 0, r1: Math.max(0, sheet.rowCount - 1), c1: Math.max(0, sheet.colCount - 1) })

/** An address resolved on the workbook: its sheet, and the box of cells it means (a whole column: the rows in use). */
export function resolve(book, text) {
  const range = parseRange(text)
  const info = sheetNamed(book, range.sheet)
  const sheet = book.sheet(info)
  const used = usedBox(sheet)
  let box = range
  if (range.kind === 'sheet') box = used
  else if (range.kind === 'cols') box = { r0: 0, c0: range.c0, r1: used.r1, c1: range.c1 }
  else if (range.kind === 'rows') box = { r0: range.r0, c0: 0, r1: range.r1, c1: used.c1 }
  return { info, sheet, kind: range.kind, box: { r0: box.r0, c0: box.c0, r1: box.r1, c1: box.c1 } }
}

// ─── tables (ListObjects) ───────────────────────────────────────────────────

/**
 * A sheet's tables: name, box, header rows, totals rows, columns (with where each name sits in the table part, to rename
 * it).
 */
export function tablesOf(book, info) {
  if (!info.tables) {
    info.tables = []
    for (const { target: part } of relationships(book.pkg.text(relsOf(info.part)), info.part).filter((r) => r.type === 'table')) {
      const xml = book.pkg.text(part)
      if (!xml) continue
      const els = scanXml(xml)
      const root = els.find((e) => e.local === 'table')
      const [a, b] = (root?.attrs.ref ?? '').split(':').map(parseCell)
      if (!root || !a || !b) continue
      const columns = els.filter((e) => e.local === 'tableColumn').map((e) => ({ name: unescape(e.attrs.name ?? ''), el: e }))
      info.tables.push({ part, xml, name: unescape(root.attrs.displayName ?? root.attrs.name ?? ''), box: { r0: a.r, c0: a.c, r1: b.r, c1: b.c }, header: Number(root.attrs.headerRowCount ?? 1), totals: Number(root.attrs.totalsRowCount ?? 0), columns })
    }
  }
  return info.tables
}
