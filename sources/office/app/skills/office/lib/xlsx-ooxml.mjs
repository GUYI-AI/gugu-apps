// A .xlsx as an agent reads and changes it (方案 gugu-base notes/2026-10-10-ppt-office/表格-设计说明.html §4–§7):
// by sheet and range; the cells written in place — nothing else in the file touched.
//
// - The package: every zip entry not changed is copied as it was (ooxml-zip.mjs). Changed: the sheets written to — and
//   only when they must be, workbook.xml (calcPr fullCalcOnLoad, so Excel and WPS calculate every formula on opening),
//   calcChain.xml (a cell that is no longer a formula leaves it), styles.xml (a date into a cell with no date format
//   gets one, as typing a date in Excel does), a table's part (its header cell renamed renames its column).
// - A sheet: each changed row's element is found by where it lies and only the written cells in it are replaced or put
//   in; every other byte of the sheet stays. Text is written inline (inlineStr): sharedStrings.xml is not touched.
// - A formula is written without a stored result: nothing here calculates. Future functions get their prefix
//   (_xlfn.XLOOKUP). A shared formula's master overwritten: its followers get their own formula. Part of an array
//   formula, a cell inside a merged area but its top-left, a table column a formula names (Table1[单价]) renamed — refused.
// - Each read range carries `was`: '<sheet>!<range>@<8 hex>', a fingerprint of the cells in it (their values and
//   formulas, not their styles). An edit gives it back; the range as it is now has another — refused (content-changed),
//   read it again. Writing into cells that are all empty needs no was.
// - Checked before anything is written: the cells read back as written, the rebuilt rows are well-formed XML.
//   Anything else is refused, said why — the file keeps the content it has.
// Node only (scripts/xlsx.mjs runs it on gugu-node).
import { OoxmlError, scanXml } from './ooxml-read.js'
import { fingerprint, plainUtf8, rewriteZip } from './ooxml-zip.mjs'
import { NOT_RECALCULATED, mb, openBook, resolve, tablesOf, usedBox, worksheets, xmlBytes } from './xlsx-book.mjs'
import { FormulaError, check, refs as refsOf, shift, shown, stored, structColumns } from './xlsx-formula.js'
import { MAX_ROWS, addr, agentValue, dateToSerial, display, formatRange, isDate, parseCell, quoteSheet, readSheet, sharedMasters } from './xlsx-read.js'
import { CALC_LIMIT_BYTES, CALC_TIMEOUT_MS, formulaResults } from './xlsx-calc.mjs'

export { OoxmlError } from './ooxml-read.js'
export { readZip } from './ooxml-zip.mjs'
export { openBook, tablesOf } from './xlsx-book.mjs'

/** How many cells one read gives at most; the rest is `more`. */
const READ_LIMIT = 2000
/**
 * Workbooks too big to work on here — what it takes in the script's process, on the person's computer — by their XML
 * unpacked (sheets, shared strings, the rest), as the zip's directory says before any of it is read (openBook):
 * `values` refused to read and to change; `formulas`, a workbook with formulas, refused to change — past the calculation
 * limit (CALC_LIMIT_BYTES) it is indexed whole to find what the edit reaches. The peaks (measured 10-13, XML → the
 * process running this code): changing, with formulas 26 MB 608 MB, 41 MB 800 MB, 62 MB 1,362 MB; values only 58 MB 673 MB,
 * 80 MB 642 MB, 117 MB 1,157 MB, 197 MB (184 of it shared strings) 920 MB; reading 20 cells, 117 MB 590 MB, the 197 MB
 * 544 MB. Each line about a gigabyte to change.
 */
export const SIZE_LIMIT_BYTES = { formulas: 50e6, values: 100e6 }

// ─── was ────────────────────────────────────────────────────────────────────

/** The fingerprint of a box of cells: every non-empty cell's place, type, value and formula — not its style. */
function boxPrint(sheet, box) {
  const lines = []
  for (const r of sheet.rowNums) {
    if (r < box.r0 || r > box.r1) continue
    for (const [c, cell] of sheet.row(r)) {
      if (c < box.c0 || c > box.c1 || (cell.v === undefined && cell.f === undefined)) continue
      lines.push(`${r},${c},${cell.t},${JSON.stringify(cell.v)},${cell.f ?? ''}`)
    }
  }
  return fingerprint(lines.join('\n'))
}

const wasOf = (info, sheet, box) => `${formatRange(info.name, box)}@${boxPrint(sheet, box)}`

/** A `was` as given back: its sheet and box, and its fingerprint. */
function parseWas(book, was) {
  const m = /^(.+)@([0-9a-f]{8})$/.exec(String(was ?? ''))
  if (!m) throw new OoxmlError(`was ${JSON.stringify(was)} is not one read gives (like 销售!A1:D20@3fa9c2d1) — pass it exactly as read`)
  const { info, box } = resolve(book, m[1])
  return { info, box, print: m[2], text: was }
}

// ─── reading, as an agent does ──────────────────────────────────────────────

/** The workbook at a glance: each sheet's used range, frozen panes, merged cells, tables, first row; its names. */
export function outline(book) {
  const sheets = book.sheets.map((info) => {
    if (!info.part) return { name: info.name, kind: info.kind === 'chartsheet' ? 'chart sheet (no cells)' : `${info.kind} (no cells)` }
    const sheet = book.sheet(info)
    const empty = sheet.rowCount === 0
    const head = []
    if (!empty) {
      const first = sheet.rowNums.find((r) => [...sheet.row(r).values()].some((c) => c.v !== undefined || c.f !== undefined))
      if (first !== undefined) for (const [c, cell] of sheet.row(first)) if (c < 12) head.push({ cell: addr(first, c), value: agentValue(book, cell) })
    }
    const tables = tablesOf(book, info).map((t) => `${t.name} ${formatRange(null, t.box)}`)
    return {
      name: info.name,
      ...(info.state !== 'visible' ? { hidden: true } : {}),
      used: empty ? null : formatRange(null, usedBox(sheet)),
      rows: sheet.rowCount,
      columns: sheet.colCount,
      ...(sheet.frozen.rows || sheet.frozen.cols ? { frozen: addr(sheet.frozen.rows, sheet.frozen.cols) } : {}),
      ...(sheet.merges.length ? { merged: sheet.merges.length } : {}),
      ...(tables.length ? { tables } : {}),
      ...(/<(?:[\w.-]+:)?sheetProtection\b/.test(sheet.xml.slice(sheet.dataEnd)) ? { protected: true } : {}),
      head,
    }
  })
  const names = Object.fromEntries(book.names.filter((n) => !n.hidden && !n.name.startsWith('_xlnm.')).map((n) => [n.scope === null ? n.name : `${worksheets(book)[n.scope]?.name ?? n.scope}!${n.name}`, n.ref]))
  return { sheets, ...(Object.keys(names).length ? { names } : {}) }
}

/**
 * A range as an agent reads it: `cells` (what a person would type), `shown` (what the sheet shows, where that differs),
 * the merged areas in it, its `was`, and `more` — the next range to read when it held more than READ_LIMIT cells.
 */
export function readRange(book, text, { limit = READ_LIMIT, locale = 'en' } = {}) {
  const { info, sheet, box } = resolve(book, text)
  const width = box.c1 - box.c0 + 1
  if (width > limit) throw new OoxmlError(`${formatRange(info.name, box)} is ${width} columns wide: read at most ${limit} cells at a time — fewer columns`)
  const rows = Math.max(1, Math.floor(limit / width))
  const page = { ...box, r1: Math.min(box.r1, box.r0 + rows - 1) }
  const cells = []
  const differs = {}
  for (let r = page.r0; r <= page.r1; r++) {
    const row = sheet.row(r)
    const line = []
    for (let c = page.c0; c <= page.c1; c++) {
      const cell = row.get(c)
      const value = agentValue(book, cell)
      line.push(value)
      if (!cell) continue
      const { text: seen, pending } = display(book, cell, locale)
      if (pending || !seen) continue
      const plain = value === null ? '' : typeof value === 'object' ? (value.date ?? value.error) : String(value)
      if (seen !== plain) differs[addr(r, c)] = seen
    }
    cells.push(line)
  }
  const merged = sheet.merges.filter((m) => m.r1 >= page.r0 && m.r0 <= page.r1 && m.c1 >= page.c0 && m.c0 <= page.c1).map((m) => formatRange(null, m))
  const out = { range: formatRange(info.name, page), was: wasOf(info, sheet, page), cells }
  if (Object.keys(differs).length) out.shown = differs
  if (merged.length) out.merged = merged
  if (page.r1 < box.r1) out.more = formatRange(info.name, { ...box, r0: page.r1 + 1 })
  return out
}

// ─── writing ────────────────────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s) => esc(s).replace(/"/g, '&quot;')
/** A character XML 1.0 has no place for: a control one but tab, line feed, carriage return; U+FFFE, U+FFFF. */
function hasBadChar(text) {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if ((c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) || c === 0xfffe || c === 0xffff) return true
  }
  return false
}

/** One value as the agent gives it → what is written: { kind: clear | number | text | bool | formula | date, … }. */
function valueOf(value, where) {
  if (value === null || value === undefined) return { kind: 'clear' }
  if (typeof value === 'boolean') return { kind: 'bool', v: value }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new OoxmlError(`${where}: ${value} is not a number Excel stores`)
    return { kind: 'number', v: value }
  }
  if (typeof value === 'string') {
    if (hasBadChar(value)) throw new OoxmlError(`${where}: the text has a control character XML cannot hold`)
    if (value.startsWith('=') && value.length > 1) {
      const formula = value.slice(1)
      if (formula.length > 8192) throw new OoxmlError(`${where}: a formula is at most 8,192 characters`)
      try {
        check(formula)
      } catch (error) {
        if (error instanceof FormulaError) throw new OoxmlError(`${where}: the formula ${value} cannot be read — ${error.message}`)
        throw error
      }
      return { kind: 'formula', f: formula }
    }
    const text = value.startsWith("'") ? value.slice(1) : value
    if (text.length > 32767) throw new OoxmlError(`${where}: a cell holds at most 32,767 characters`)
    return { kind: 'text', v: text }
  }
  if (typeof value === 'object' && 'date' in value) return { kind: 'date', date: value }
  throw new OoxmlError(`${where}: ${JSON.stringify(value)} is not a value — a number, text, true/false, null, "=formula", or { "date": "YYYY-MM-DD" }`)
}

/**
 * Every cell an edit writes: [{ r, c, w }] — `cells` a 2-D array the range's shape, or one value for all of it (a
 * formula moved cell by cell as Excel's Ctrl+Enter moves it).
 */
function writesOf(edit, box, sheetName) {
  const h = box.r1 - box.r0 + 1
  const w = box.c1 - box.c0 + 1
  const where = formatRange(sheetName, box)
  if (h * w > 200000) throw new OoxmlError(`${where} is ${h * w} cells: write at most 200,000 in one edit`)
  const out = []
  if (Array.isArray(edit.cells)) {
    if (edit.cells.length !== h || edit.cells.some((row) => !Array.isArray(row) || row.length !== w))
      throw new OoxmlError(`${where} is ${h} rows × ${w} columns: cells must be ${h} arrays of ${w} values (or one value for all of it)`)
    edit.cells.forEach((row, i) => row.forEach((value, j) => out.push({ r: box.r0 + i, c: box.c0 + j, w: valueOf(value, addr(box.r0 + i, box.c0 + j)) })))
    return out
  }
  if (!('cells' in edit)) throw new OoxmlError(`${where}: give cells — a ${h} × ${w} array, or one value for all of it (null clears)`)
  const one = valueOf(edit.cells, where)
  for (let r = box.r0; r <= box.r1; r++)
    for (let c = box.c0; c <= box.c1; c++) out.push({ r, c, w: one.kind === 'formula' ? { kind: 'formula', f: shift(one.f, r - box.r0, c - box.c0) } : one })
  return out
}

/** The ranges of a sheet's array (and data table) formulas: [{ box, kind }]. */
function arrayFormulas(sheet) {
  const out = []
  const re = /<(?:[\w.-]+:)?f\b([^>]*?\bt="(array|dataTable)"[^>]*?)(?:\/>|>)/g
  re.lastIndex = sheet.innerStart
  for (let m = re.exec(sheet.xml); m && m.index < sheet.innerEnd; m = re.exec(sheet.xml)) {
    const ref = /\bref="([^"]+)"/.exec(m[1])?.[1]
    const [a, b] = (ref ?? '').split(':').map(parseCell)
    if (a) out.push({ box: { r0: a.r, c0: a.c, r1: (b ?? a).r, c1: (b ?? a).c }, kind: m[2] })
  }
  return out
}

/** Every formula of a sheet, as [{ sheet, r, c, f }] — as the reader gives them, shared followers expanded. */
function formulasOf(book, info) {
  const sheet = book.sheet(info)
  const out = []
  for (const r of sheet.rowNums) for (const [c, cell] of sheet.row(r)) if (cell.f) out.push({ sheet: info.name, r, c, f: cell.f })
  return out
}

/** What a formula reads (xlsx-formula.js refs); [] for one this reader cannot parse — an edit is not stopped by it. */
function readsOf(formula) {
  try {
    return refsOf(formula)
  } catch (error) {
    if (error instanceof FormulaError) return []
    throw error
  }
}

const inBox = (box, r, c) => r >= box.r0 && r <= box.r1 && c >= box.c0 && c <= box.c1

/** A date's xf: the cell's own with a date number format (14 a day, 22 with a time, 21 a time) — found, or added. */
function dateStyle(state, s, value) {
  const iso = value.date.date
  const id = /^\d{2}:/.test(iso) ? 21 : iso.includes('T') ? 22 : 14
  const key = `${s}:${id}`
  if (state.dateXfs.has(key)) return state.dateXfs.get(key)
  if (!state.styles) {
    const part = state.book.stylesPart
    const xml = part && state.book.pkg.text(part)
    if (!xml) throw new OoxmlError('a date into a cell with no date format needs a style, and this workbook has no styles part')
    state.styles = { part, xml, added: [] }
  }
  const els = scanXml(state.styles.xml)
  const cellXfs = els.find((e) => e.local === 'cellXfs')
  const xfs = els.filter((e) => e.parent === cellXfs?.index && e.local === 'xf')
  const base = xfs[s]
  if (!cellXfs || !base) throw new OoxmlError(`style ${s} is not in this workbook's styles`)
  const same = xfs.findIndex((x) => Number(x.attrs.numFmtId ?? 0) === id && ['fontId', 'fillId', 'borderId', 'xfId'].every((k) => (x.attrs[k] ?? '0') === (base.attrs[k] ?? '0')))
  let index = same
  if (index < 0) {
    const tag = state.styles.xml.slice(base.start, base.end)
    let xf = tag.replace(/\snumFmtId="[^"]*"/, '').replace(/\sapplyNumberFormat="[^"]*"/, '')
    xf = xf.replace(/^<([\w.:-]+)/, `<$1 numFmtId="${id}" applyNumberFormat="1"`)
    index = xfs.length + state.styles.added.length
    state.styles.added.push(xf)
  }
  state.dateXfs.set(key, index)
  return index
}

/** The workbook's styles.xml with the added xfs at the end of cellXfs (its count with them). */
function stylesWithAdded(styles) {
  const els = scanXml(styles.xml)
  const cellXfs = els.find((e) => e.local === 'cellXfs')
  const n = els.filter((e) => e.parent === cellXfs.index && e.local === 'xf').length + styles.added.length
  const open = styles.xml.slice(cellXfs.start, cellXfs.innerStart)
  const counted = /\scount="\d+"/.test(open) ? open.replace(/\scount="\d+"/, ` count="${n}"`) : open.replace(/^<([\w.:-]+)/, `<$1 count="${n}"`)
  return styles.xml.slice(0, cellXfs.start) + counted + styles.xml.slice(cellXfs.innerStart, cellXfs.innerEnd) + styles.added.join('') + styles.xml.slice(cellXfs.innerEnd)
}

/**
 * Apply `edits` ([{ range, was?, cells }]) to the package `bytes`. Resolves to { bytes, changed (the ranges written),
 * was (each read range's fingerprint now), recalc (the formulas the edit changes: recalculated, and those that could not
 * be — xlsx-calc.mjs), notes, parts (changed), unchangedEntries }. Throws OoxmlError, nothing written, for anything
 * refused. `calcTimeoutMs`: how long calculating may take before the results it would change are taken away instead
 * (CALC_TIMEOUT_MS); `calcLimitBytes`: how much sheet XML a workbook may be to be calculated at all (CALC_LIMIT_BYTES);
 * `sizeLimitBytes`: to be read and changed at all (SIZE_LIMIT_BYTES).
 */
export async function applyEdits(bytes, edits, { macro = false, calcTimeoutMs = CALC_TIMEOUT_MS, calcLimitBytes = CALC_LIMIT_BYTES, sizeLimitBytes = SIZE_LIMIT_BYTES } = {}) {
  if (macro) throw new OoxmlError('a macro-enabled workbook (.xlsm) is read only here: save it as .xlsx to change it with this script')
  if (!Array.isArray(edits) || !edits.length) throw new OoxmlError('give at least one edit: { range, cells }')
  const book = await openBook(bytes, sizeLimitBytes.values)
  // Whether a sheet has formulas: from its bytes — its text not read for this and kept (a big sheet's is the file's size
  // again and more).
  const formulaParts = new Map()
  const hasFormulas = (info) => {
    if (!formulaParts.has(info.part)) {
      const raw = book.pkg.raw(info.part)
      formulaParts.set(info.part, !!raw && ['<f>', '<f ', '<f/', ':f>', ':f ', ':f/'].some((tag) => raw.includes(tag)))
    }
    return formulaParts.get(info.part)
  }
  if (xmlBytes(book.pkg) > sizeLimitBytes.formulas && worksheets(book).some(hasFormulas)) throw new OoxmlError(`the workbook is ${Math.ceil(xmlBytes(book.pkg) / 1e6)} MB of XML unpacked, more than this script changes in a workbook with formulas (${mb(sizeLimitBytes.formulas)}): change it in Excel or WPS — nothing was written; ${NOT_RECALCULATED}`)
  const state = { book, dateXfs: new Map(), styles: null }
  const bySheet = new Map()
  const notes = []
  for (const [i, edit] of edits.entries()) {
    const where = `edit ${i + 1}`
    const { info, sheet, kind, box } = resolve(book, edit.range)
    if (kind === 'sheet') throw new OoxmlError(`${where}: ${edit.range} is a whole sheet — give the range to write (销售!A1:D20)`)
    // The range as it was read: unchanged since, or refused.
    if (edit.was !== undefined && edit.was !== null && edit.was !== '') {
      const was = parseWas(book, edit.was)
      if (was.info !== info) throw new OoxmlError(`${where}: was is for ${was.text.split('@')[0]}, the edit writes ${formatRange(info.name, box)} — read the range you change`)
      if (!(box.r0 >= was.box.r0 && box.r1 <= was.box.r1 && box.c0 >= was.box.c0 && box.c1 <= was.box.c1))
        throw new OoxmlError(`${where}: ${formatRange(info.name, box)} is not inside ${formatRange(info.name, was.box)}, the range its was is for — read the range you change`)
      const now = boxPrint(sheet, was.box)
      if (now !== was.print)
        throw new OoxmlError(`content-changed — ${formatRange(info.name, was.box)} was changed after you read it (was ${was.print}, now ${now}): read it again (read) and make your change on what is there now`, 'content-changed')
      edit.wasBox = was.box
    }
    const writes = writesOf(edit, box, info.name)
    if (!edit.wasBox) {
      const taken = writes.find(({ r, c }) => {
        const cell = sheet.row(r).get(c)
        return cell && (cell.v !== undefined || cell.f !== undefined)
      })
      if (taken) throw new OoxmlError(`${where}: ${formatRange(info.name, { r0: taken.r, c0: taken.c, r1: taken.r, c1: taken.c })} is not empty — read the range (read) and give its was to change what is there`)
    }
    if (!bySheet.has(info)) bySheet.set(info, { info, sheet, writes: new Map(), boxes: [], wasBoxes: [] })
    const group = bySheet.get(info)
    for (const one of writes) group.writes.set(`${one.r}:${one.c}`, one)
    group.boxes.push(box)
    group.wasBoxes.push(edit.wasBox ?? box)
  }

  const changed = new Map()
  const calcGone = []
  let wroteFormula = false
  let tableEdits = []
  for (const group of bySheet.values()) {
    const { info, sheet } = group
    const merges = sheet.merges
    const arrays = arrayFormulas(sheet)
    for (const { r, c, w } of group.writes.values()) {
      const m = merges.find((x) => inBox(x, r, c))
      if (m && (m.r0 !== r || m.c0 !== c) && w.kind !== 'clear')
        throw new OoxmlError(`${addr(r, c)} is inside the merged area ${formatRange(null, m)} — write its top-left cell, ${addr(m.r0, m.c0)}`)
      if (w.kind === 'formula') wroteFormula = true
    }
    for (const a of arrays) {
      const hit = [...group.writes.values()].filter(({ r, c }) => inBox(a.box, r, c))
      const all = (a.box.r1 - a.box.r0 + 1) * (a.box.c1 - a.box.c0 + 1)
      if (hit.length && hit.length < all)
        throw new OoxmlError(`${addr(hit[0].r, hit[0].c)} is part of the ${a.kind === 'array' ? 'array formula' : 'data table'} ${formatRange(null, a.box)} — change all of it (range ${formatRange(info.name, a.box)}) or none`)
    }
    // A table's header cell renames its column (as in Excel) — unless a formula names that column.
    for (const table of tablesOf(book, info)) {
      if (!table.header) continue
      for (const { r, c, w } of group.writes.values()) {
        if (r !== table.box.r0 || c < table.box.c0 || c > table.box.c1) continue
        const column = table.columns[c - table.box.c0]
        if (!column) continue
        if (w.kind === 'clear' || w.kind === 'formula')
          throw new OoxmlError(`${addr(r, c)} is the header of column ${JSON.stringify(column.name)} of table ${table.name}: give it a name (text), not ${w.kind === 'clear' ? 'nothing' : 'a formula'}`)
        const name = w.kind === 'date' ? w.date.date : String(w.v)
        if (name === column.name) continue
        if (table.columns.some((x, j) => j !== c - table.box.c0 && x.name.toLowerCase() === name.toLowerCase()))
          throw new OoxmlError(`table ${table.name} has a column ${JSON.stringify(name)} already: two columns cannot share a name`)
        tableEdits.push({ table, column, name, at: addr(r, c) })
      }
    }
  }
  if (tableEdits.length) {
    // A formula naming the renamed column (Table1[单价], or [@单价] inside the table): not rewritten here — refused.
    const everyFormula = worksheets(book).flatMap((info) => formulasOf(book, info))
    for (const { table, column, at } of tableEdits) {
      const reader = everyFormula.find((x) =>
        readsOf(x.f).some((ref) => ref.table !== undefined && (ref.table.toLowerCase() === table.name.toLowerCase() || (ref.table === '' && inBox(table.box, x.r, x.c))) && structColumns(ref.spec).some((n) => n.toLowerCase() === column.name.toLowerCase())),
      )
      if (reader)
        throw new OoxmlError(`${at} renames column ${JSON.stringify(column.name)} of table ${table.name}, and ${quoteSheet(reader.sheet)}!${addr(reader.r, reader.c)} =${reader.f} names that column — this script does not rewrite such formulas: leave the header, or change that formula first`)
      if (table.xml.includes(`[${column.name}]`)) throw new OoxmlError(`${at} renames column ${JSON.stringify(column.name)} of table ${table.name}, and a calculated column of that table names it — leave the header`)
    }
  }

  // The sheets, row by row.
  for (const group of bySheet.values()) {
    const { info, sheet } = group
    const xml = sheet.xml
    if (!plainUtf8(book.pkg, info.part, xml)) throw new OoxmlError(`${info.part} is not plain UTF-8: this script does not rewrite it`)
    const prefix = /<([\w.-]+:)?sheetData\b/.exec(xml)?.[1] ?? ''
    const masters = sharedMasters(sheet)
    // A shared formula's master overwritten: each follower not overwritten too gets its own formula.
    const followers = new Map()
    for (const { r, c } of group.writes.values()) {
      const cell = sheet.row(r).get(c)
      if (!cell?.master) continue
      const master = masters.get(cell.si)
      const ref = master?.ref?.split(':').map(parseCell)
      if (!master || !ref?.[0]) continue
      const area = { r0: ref[0].r, c0: ref[0].c, r1: (ref[1] ?? ref[0]).r, c1: (ref[1] ?? ref[0]).c }
      for (let rr = area.r0; rr <= area.r1; rr++)
        for (const [cc, f] of sheet.row(rr)) {
          if (inBox(area, rr, cc) && f.si === cell.si && !f.master && !group.writes.has(`${rr}:${cc}`)) followers.set(`${rr}:${cc}`, { r: rr, c: cc, f: shift(master.text, rr - master.r, cc - master.c) })
        }
    }
    const rows = new Map()
    for (const one of [...group.writes.values(), ...followers.values()]) {
      if (!rows.has(one.r)) rows.set(one.r, [])
      rows.get(one.r).push(one)
    }
    const splices = []
    let newRows = ''
    let newRowsAt = -1
    const pending = []
    for (const r of [...rows.keys()].sort((a, b) => a - b)) {
      const items = rows.get(r).sort((a, b) => a.c - b.c)
      const span = sheet.rowSpan(r)
      const old = sheet.row(r)
      const cellXml = (one) => {
        const cell = old.get(one.c)
        if (!one.w) {
          // A follower: its own formula in place of the shared one, the rest of the cell as it is.
          const text = xml.slice(cell.start, cell.end)
          // A function, not a replacement string: a formula's $A$1 holds "$1".
          return text.replace(/<((?:[\w.-]+:)?f)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/, () => `<${prefix}f>${esc(stored(one.f))}</${prefix}f>`)
        }
        if (cell?.f !== undefined && one.w.kind !== 'formula') calcGone.push({ sheetId: info.sheetId, ref: addr(r, one.c) })
        return newCell(state, sheet, prefix, r, one.c, cell, one.w)
      }
      if (span) {
        let seg = xml.slice(span.start, span.end)
        const base = span.start
        const edits = []
        for (const one of items) {
          const cell = old.get(one.c)
          const next = cellXml(one)
          if (cell) edits.push({ at: cell.start - base, end: cell.end - base, text: next, c: one.c })
          else if (next) {
            const after = [...old.values()].find((x) => x.c > one.c)
            edits.push({ at: after ? after.start - base : span.selfClosing ? -1 : span.closeStart - base, end: null, text: next, c: one.c })
          }
        }
        if (span.selfClosing) {
          // <row …/> with cells now: opened and closed.
          const open = seg.replace(/\s*\/>$/, '>')
          const inserted = edits.map((e) => e.text).join('')
          seg = inserted ? `${open}${inserted}</${prefix}row>` : seg
        } else {
          // From the end back; at one place a replaced cell first, then the cells put in before it, the last column first
          // (each lands before the one put in after it).
          const order = (a, b) => b.at - a.at || (a.end === null) - (b.end === null) || b.c - a.c
          for (const e of edits.sort(order)) seg = seg.slice(0, e.at) + e.text + seg.slice(e.end ?? e.at)
        }
        seg = withSpans(seg, items.map((x) => x.c))
        splices.push({ at: span.start, end: span.end, text: seg })
      } else {
        const body = items.map((one) => cellXml(one)).filter(Boolean).join('')
        if (!body) continue
        const text = `<${prefix}row r="${r + 1}">${body}</${prefix}row>`
        const after = sheet.rowNums.find((x) => x > r)
        if (after !== undefined) splices.push({ at: sheet.rowSpan(after).start, end: sheet.rowSpan(after).start, text, r })
        else {
          newRows += text
          newRowsAt = sheet.innerEnd
        }
      }
      pending.push(...items)
    }
    if (newRows) splices.push({ at: newRowsAt, end: newRowsAt, text: newRows, r: MAX_ROWS })
    let out = xml
    // From the end back. At one place: a row rewritten first (its offsets are the old text's), then the rows put in
    // before it, the last first (each lands before the one put in after it).
    const put = (s) => Number(s.end === s.at)
    for (const s of splices.sort((a, b) => b.at - a.at || put(a) - put(b) || (b.r ?? 0) - (a.r ?? 0))) out = out.slice(0, s.at) + s.text + out.slice(s.end)
    // An empty sheet's <sheetData/>, given rows.
    if (newRows && xml.slice(sheet.dataStart, sheet.innerStart).endsWith('/>')) {
      const tag = xml.slice(sheet.dataStart, sheet.innerStart)
      out = out.replace(tag + newRows, () => `${tag.replace(/\s*\/>$/, '>')}${newRows}</${prefix}sheetData>`)
    }
    out = withDimension(out, sheet, group.writes)
    // The rows rebuilt are well-formed, and the sheet reads back as written.
    const check = readSheet(out, book)
    for (const one of pending) {
      const cell = check.row(one.r).get(one.c)
      if (!readsBack(book, cell, one, state)) throw new OoxmlError(`${addr(one.r, one.c)} did not read back as written — nothing was written (this is a bug in the script: say so)`)
    }
    for (const s of splices) scanXml(`<x>${s.text}</x>`, { strict: true })
    group.out = out
    group.check = check
    changed.set(info.part, Buffer.from(out, 'utf8'))
  }

  // Formula results the edit changes: calculated and stored (xlsx-calc.mjs), or taken away where they cannot be — the
  // sheet then shows the formula, and Excel or WPS calculate it on opening. Never a result left that may be wrong.
  const anyFormula = wroteFormula || worksheets(book).some(hasFormulas)
  let recalc = null
  if (anyFormula) {
    // Each written cell with what it held (the model holds that before the edit, the book as it was not opened again).
    const seeds = [...bySheet.values()].flatMap((g) =>
      [...g.writes.values()].map(({ r, c }) => {
        const cell = g.sheet.row(r).get(c)
        return { sheet: g.info.name, r, c, was: cell ? { v: cell.v, f: cell.f, fType: cell.fType, fRef: cell.fRef } : null }
      }),
    )
    const after = rewriteZip(book.pkg.zip, new Map([...changed].map(([name, buf]) => [book.pkg.byName.get(name).name, buf])))
    const answer = await formulaResults(book, after, seeds, { timeoutMs: calcTimeoutMs, limitBytes: calcLimitBytes })
    const bySheetName = new Map()
    for (const x of answer.cells) {
      // Text XML has no place for: not stored — taken away instead.
      const value = x.value?.t === 'str' && hasBadChar(x.value.v) ? null : x.value
      if (!bySheetName.has(x.sheet)) bySheetName.set(x.sheet, [])
      bySheetName.get(x.sheet).push({ ...x, value })
    }
    for (const [name, list] of bySheetName) {
      const info = worksheets(book).find((i) => i.name === name)
      const group = bySheet.get(info)
      const xml = group ? group.out : book.pkg.text(info.part)
      const sheet = group ? group.check : book.sheet(info)
      const out = withResults(xml, sheet, list)
      // Each result reads back as stored, its formula as it was.
      const check = readSheet(out, book)
      for (const x of list) {
        const was = sheet.row(x.r).get(x.c)
        const cell = check.row(x.r).get(x.c)
        const v = cell?.v
        const ok = x.value === null ? v === undefined : x.value.t === 'e' ? v?.error === x.value.v : v === x.value.v
        if (!ok || cell?.f !== was?.f) throw new OoxmlError(`${quoteSheet(name)}!${addr(x.r, x.c)}: its calculated result did not read back as stored — nothing was written (this is a bug in the script: say so)`)
      }
      changed.set(info.part, Buffer.from(out, 'utf8'))
    }
    recalc = answer.skipped
      ? { skipped: answer.skipped, cleared: answer.cleared }
      : { recalculated: answer.recalculated, uncomputed: answer.uncomputed.length, ...(answer.uncomputed.length ? { notCalculated: answer.uncomputed.slice(0, 20) } : {}), ms: answer.ms.total }
  }

  // calcChain: a cell no longer a formula leaves it (a dangling entry makes Excel offer to repair the file).
  if (calcGone.length && book.calcChainPart && book.pkg.text(book.calcChainPart)) changed.set(book.calcChainPart, Buffer.from(prunedCalcChain(book.pkg.text(book.calcChainPart), calcGone), 'utf8'))
  // fullCalcOnLoad: a formula written or removed, or values a formula may read changed — Excel and WPS calculate all.
  if (anyFormula || calcGone.length || book.calcChainPart) {
    const wb = fullCalcOnLoad(book.xml)
    if (wb !== book.xml) changed.set(book.part, Buffer.from(wb, 'utf8'))
  }
  if (state.styles?.added.length) changed.set(state.styles.part, Buffer.from(stylesWithAdded(state.styles), 'utf8'))
  for (const { table, column, name } of tableEdits) {
    const tag = table.xml.slice(column.el.start, column.el.innerStart)
    const renamed = tag.replace(/\sname="[^"]*"/, () => ` name="${escAttr(name)}"`)
    table.xml = table.xml.slice(0, column.el.start) + renamed + table.xml.slice(column.el.innerStart)
    changed.set(table.part, Buffer.from(table.xml, 'utf8'))
    notes.push(`${quoteSheet(worksheets(book).find((i) => i.tables?.includes(table)).name)}! header renames column ${JSON.stringify(column.name)} of table ${table.name} to ${JSON.stringify(name)}`)
  }
  if (state.styles?.added.length) notes.push('a date went into a cell with no date format: that cell now has one (as typing a date in Excel does)')
  for (const group of bySheet.values()) if (/<(?:[\w.-]+:)?sheetProtection\b/.test(group.sheet.xml.slice(group.sheet.dataEnd))) notes.push(`${quoteSheet(group.info.name)} is protected: in Excel the cells you wrote may be locked`)

  const out = rewriteZip(book.pkg.zip, new Map([...changed].map(([name, buf]) => [book.pkg.byName.get(name).name, buf])))
  const after = await openBook(out)
  const was = {}
  for (const group of bySheet.values()) {
    const info = worksheets(after).find((i) => i.name === group.info.name)
    for (const box of group.wasBoxes) was[formatRange(info.name, box)] = wasOf(info, after.sheet(info), box)
  }
  return {
    bytes: out,
    changed: [...bySheet.values()].flatMap((g) => g.boxes.map((box) => formatRange(g.info.name, box))),
    was,
    ...(recalc ? { recalc } : {}),
    ...(notes.length ? { notes } : {}),
    parts: [...changed.keys()],
    unchangedEntries: book.pkg.zip.entries.length - changed.size,
  }
}

/** A sheet's XML with formula cells' stored results ([{ r, c, value: { t, v } }]) put in, or taken away (value null). */
function withResults(xml, sheet, results) {
  const splices = []
  for (const { r, c, value } of results) {
    const cell = sheet.row(r).get(c)
    if (!cell) continue
    const text = xml.slice(cell.start, cell.end)
    const open = /^<((?:[\w.-]+:)?c)\b([^>]*?)(\/?)>/.exec(text)
    const name = open[1]
    const p = name.slice(0, -1).replace(/\./g, '\\.')
    const attrs = open[2].replace(/\st="[^"]*"/, '')
    let inner = open[3] ? '' : text.slice(open[0].length, text.length - `</${name}>`.length)
    inner = inner.replace(new RegExp(`<${p}v\\b[^>]*?(?:/>|>[\\s\\S]*?</${p}v>)`), '')
    let t = ''
    if (value) {
      const v = value.t === 'n' ? String(value.v) : value.t === 'b' ? (value.v ? '1' : '0') : esc(value.v)
      t = value.t === 'n' ? '' : ` t="${value.t}"`
      const f = new RegExp(`<${p}f\\b[^>]*?(?:/>|>[\\s\\S]*?</${p}f>)`).exec(inner)
      const at = f ? f.index + f[0].length : 0
      inner = inner.slice(0, at) + `<${name.slice(0, -1)}v>${v}</${name.slice(0, -1)}v>` + inner.slice(at)
    }
    splices.push({ at: cell.start, end: cell.end, text: inner ? `<${name}${attrs}${t}>${inner}</${name}>` : `<${name}${attrs}/>` })
  }
  // One pass, front to back: a recalculation may change every formula of a long sheet.
  const parts = []
  let from = 0
  for (const s of splices.sort((a, b) => a.at - b.at)) {
    parts.push(xml.slice(from, s.at), s.text)
    from = s.end
  }
  parts.push(xml.slice(from))
  return parts.join('')
}

/** A cell's new element: its style kept (a new cell takes its row's or column's), its value written as given. */
function newCell(state, sheet, prefix, r, c, old, w) {
  const at = addr(r, c)
  let s = old?.s ?? sheet.rowStyle.get(r) ?? sheet.col(c).style ?? 0
  if (w.kind === 'clear') return s ? `<${prefix}c r="${at}" s="${s}"/>` : ''
  if (w.kind === 'date') {
    w.v = dateToSerial(w.date, state.book.date1904)
    if (!isDate(state.book.styles.xfs[s]?.fmt)) s = dateStyle(state, s, w)
  }
  const sa = s ? ` s="${s}"` : ''
  if (w.kind === 'number' || w.kind === 'date') return `<${prefix}c r="${at}"${sa}><${prefix}v>${String(w.v)}</${prefix}v></${prefix}c>`
  if (w.kind === 'bool') return `<${prefix}c r="${at}"${sa} t="b"><${prefix}v>${w.v ? 1 : 0}</${prefix}v></${prefix}c>`
  if (w.kind === 'formula') return `<${prefix}c r="${at}"${sa}><${prefix}f>${esc(stored(w.f))}</${prefix}f></${prefix}c>`
  const space = /^\s|\s$|\n/.test(w.v) ? ' xml:space="preserve"' : ''
  return `<${prefix}c r="${at}"${sa} t="inlineStr"><${prefix}is><${prefix}t${space}>${esc(w.v)}</${prefix}t></${prefix}is></${prefix}c>`
}

function readsBack(book, cell, one, state) {
  const same = (f, want) => f !== undefined && f.replace(/\s/g, '').toLowerCase() === shown(want).replace(/\s/g, '').toLowerCase()
  if (!one.w) return same(cell?.f, one.f)
  const w = one.w
  if (w.kind === 'clear') return !cell || (cell.v === undefined && cell.f === undefined)
  if (!cell) return false
  if (w.kind === 'formula') return same(cell.f, w.f) && cell.v === undefined
  if (w.kind === 'text') return cell.v === w.v && cell.f === undefined
  if (w.kind === 'date') return cell.v === dateToSerial(w.date, book.date1904) && cell.f === undefined
  return cell.v === w.v && cell.f === undefined && state !== null
}

/** A row's start tag with its spans (a hint of its first and last column) taking in the columns written. */
function withSpans(seg, cols) {
  const m = /^(<(?:[\w.-]+:)?row\b[^>]*?\sspans=")([0-9]+):([0-9]+)(")/.exec(seg)
  if (!m) return seg
  const lo = Math.min(Number(m[2]), ...cols.map((c) => c + 1))
  const hi = Math.max(Number(m[3]), ...cols.map((c) => c + 1))
  return lo === Number(m[2]) && hi === Number(m[3]) ? seg : `${m[1]}${lo}:${hi}${m[4]}${seg.slice(m[0].length)}`
}

/** The sheet's <dimension ref> taking in the cells written (a hint, kept true). */
function withDimension(xml, sheet, writes) {
  const m = /(<(?:[\w.-]+:)?dimension\b[^>]*?\sref=")([^"]*)(")/.exec(xml.slice(0, sheet.dataStart + 64))
  if (!m) return xml
  const [a, b] = m[2].split(':').map(parseCell)
  if (!a) return xml
  const box = { r0: a.r, c0: a.c, r1: (b ?? a).r, c1: (b ?? a).c }
  const empty = sheet.rowCount === 0 && m[2] === 'A1'
  for (const { r, c, w } of writes.values()) {
    if (w.kind === 'clear') continue
    if (empty) Object.assign(box, { r0: r, c0: c, r1: r, c1: c })
    box.r0 = Math.min(box.r0, r)
    box.c0 = Math.min(box.c0, c)
    box.r1 = Math.max(box.r1, r)
    box.c1 = Math.max(box.c1, c)
  }
  const ref = box.r0 === box.r1 && box.c0 === box.c1 ? addr(box.r0, box.c0) : `${addr(box.r0, box.c0)}:${addr(box.r1, box.c1)}`
  return ref === m[2] ? xml : xml.slice(0, m.index) + m[1] + ref + m[3] + xml.slice(m.index + m[0].length)
}

/** calcChain.xml without the cells that are no longer formulas; an entry's sheet (i) carried to the next that omits it. */
export function prunedCalcChain(xml, gone) {
  const drop = new Set(gone.map((g) => `${g.sheetId}:${g.ref}`))
  let sheetId = null
  let carry = null
  return xml.replace(/<((?:[\w.-]+:)?c)\b([^>]*?)\/>/g, (whole, name, attrs) => {
    const i = /\si="(\d+)"/.exec(attrs)?.[1]
    if (i !== undefined) sheetId = Number(i)
    const ref = /\sr="([^"]+)"/.exec(attrs)?.[1]
    if (drop.has(`${sheetId}:${ref}`)) {
      if (i !== undefined) carry = i
      return ''
    }
    if (carry !== null && i === undefined) {
      const kept = `<${name}${attrs} i="${carry}"/>`
      carry = null
      return kept
    }
    carry = null
    return whole
  })
}

/** workbook.xml with calcPr fullCalcOnLoad="1": added to calcPr, or a calcPr put where the schema has it. */
export function fullCalcOnLoad(xml) {
  const calc = /<((?:[\w.-]+:)?calcPr)\b([^>]*?)(\/?)>/.exec(xml)
  if (calc) {
    if (/\sfullCalcOnLoad="(1|true)"/.test(calc[2])) return xml
    const attrs = calc[2].replace(/\sfullCalcOnLoad="[^"]*"/, '')
    return xml.slice(0, calc.index) + `<${calc[1]}${attrs} fullCalcOnLoad="1"${calc[3]}>` + xml.slice(calc.index + calc[0].length)
  }
  // After definedNames, externalReferences, functionGroups or sheets — the last of them there is (CT_Workbook's order).
  const prefix = /<([\w.-]+:)?sheets\b/.exec(xml)?.[1] ?? ''
  for (const local of ['definedNames', 'externalReferences', 'functionGroups', 'sheets']) {
    const end = new RegExp(`</(?:[\\w.-]+:)?${local}>|<(?:[\\w.-]+:)?${local}\\b[^>]*/>`).exec(xml)
    if (end) {
      const at = end.index + end[0].length
      return `${xml.slice(0, at)}<${prefix}calcPr fullCalcOnLoad="1"/>${xml.slice(at)}`
    }
  }
  throw new OoxmlError('workbook.xml has no <sheets>')
}
