// A .xlsx as the page draws it and as the skill's script reads and writes it (the sheet
// design note §2, §4): the workbook's sheets, styles and strings, and a sheet's rows
// found by where they lie in its XML — a row's cells are read only when someone asks for that row (the page: the rows
// on screen; the script: the range it was given). Plain JS, the page and the script import it alike; numbers are
// shown with numfmt (MIT, vendor/, built by sources/office/vendor/build.mjs) — the only library 咕咕办公 bundles for a
// workbook.
//
// - Addresses are Excel's: 销售!B2:D9, '2024 预算'!A1, 销售!C:C, 销售!3:5 — what people put in the composer and agents
//   pass to the script.
// - A cell is { r, c, t, s, v, f } read from the file as it is: `v` its stored value (a formula's stored result —
//   nothing is calculated here), `f` its formula as Excel shows it (a shared formula's followers expanded), and where
//   its element lies in the sheet's XML (start, end) for the writer.
// - Dates read and write as { date: 'YYYY-MM-DD' | 'YYYY-MM-DDTHH:MM[:SS]' | 'HH:MM[:SS]' }: a number with a date format
//   (148 定 10-13; a duration format like [h]:mm stays a number).

import { OoxmlError, relationships, relsOf, scanXml, unescape } from './ooxml-read.js'
import { MAX_COLS, MAX_ROWS, colIndex, colName, shift, shown } from './xlsx-formula.js'
import * as numfmt from '../vendor/numfmt.js'

export { MAX_COLS, MAX_ROWS, colIndex, colName } from './xlsx-formula.js'

// ─── addresses ──────────────────────────────────────────────────────────────

/** A1 → { r: 0, c: 0 } (a $ allowed); null if it is not one cell. */
export function parseCell(text) {
  const m = /^\$?([A-Za-z]{1,3})\$?([0-9]+)$/.exec(text)
  if (!m) return null
  const c = colIndex(m[1])
  const r = Number(m[2]) - 1
  return c < 0 || r < 0 || r >= MAX_ROWS ? null : { r, c }
}

export const addr = (r, c) => `${colName(c)}${r + 1}`

/** A sheet name as an address writes it: quoted when Excel quotes it (spaces, symbols, a leading digit, a cell-like name). */
export function quoteSheet(name) {
  const plain = /^[\p{L}_][\p{L}\p{N}_.]*$/u.test(name) && !/^[A-Za-z]{1,3}[0-9]+$/.test(name) && !/^(R|C)([0-9]*)$/i.test(name) && !/^R[0-9]*C[0-9]*$/i.test(name)
  return plain ? name : `'${name.replace(/'/g, "''")}'`
}

/**
 * An address as people and agents write it: [sheet!]A1, A1:C5, C:E, 3:5, or a sheet's name alone (all of it it uses).
 * → { sheet (its name as written, or null), kind: 'cells' | 'cols' | 'rows' | 'sheet', r0, c0, r1, c1 } (rows and
 * columns 0-based; a whole column's rows and a whole row's columns span the sheet). Throws OoxmlError when it is none.
 */
export function parseRange(text) {
  const s = String(text ?? '').trim()
  const fail = () => new OoxmlError(`${JSON.stringify(text)} is not an address: write it as Excel does — 销售!B2:D9, 销售!C:C, 销售!3:5, or a sheet's name`)
  const whole = (name) => ({ sheet: name, kind: 'sheet', r0: 0, c0: 0, r1: MAX_ROWS - 1, c1: MAX_COLS - 1 })
  // A quoted name alone is a whole sheet, whatever is in it ('A!B' is not A's B).
  const alone = /^'((?:[^']|'')+)'$/.exec(s)
  if (alone) return whole(alone[1].replace(/''/g, "'"))
  let sheet = null
  let rest = s
  const quoted = /^'((?:[^']|'')+)'!(.*)$/.exec(s)
  const bare = !quoted && /^([^!]+)!(.*)$/.exec(s)
  if (quoted) [sheet, rest] = [quoted[1].replace(/''/g, "'"), quoted[2]]
  else if (bare) [sheet, rest] = [bare[1], bare[2]]
  rest = rest.trim()
  if (!rest) {
    if (sheet) return whole(sheet)
    throw fail()
  }
  const [a, b = a, extra] = rest.split(':')
  if (extra !== undefined) throw fail()
  const ca = parseCell(a)
  const cb = parseCell(b)
  if (ca && cb) return { sheet, kind: 'cells', r0: Math.min(ca.r, cb.r), c0: Math.min(ca.c, cb.c), r1: Math.max(ca.r, cb.r), c1: Math.max(ca.c, cb.c) }
  const col = (x) => colIndex(x.replace(/^\$/, ''))
  if (rest.includes(':') && col(a) >= 0 && col(b) >= 0) return { sheet, kind: 'cols', r0: 0, c0: Math.min(col(a), col(b)), r1: MAX_ROWS - 1, c1: Math.max(col(a), col(b)) }
  const row = (x) => (/^\$?[0-9]+$/.test(x) ? Number(x.replace('$', '')) - 1 : -1)
  if (rest.includes(':') && row(a) >= 0 && row(b) >= 0 && row(a) < MAX_ROWS && row(b) < MAX_ROWS)
    return { sheet, kind: 'rows', r0: Math.min(row(a), row(b)), c0: 0, r1: Math.max(row(a), row(b)), c1: MAX_COLS - 1 }
  // A sheet's name with no ! (and not an address): that sheet.
  if (sheet === null && !rest.includes(':')) return whole(/^'(.+)'$/.test(rest) ? rest.slice(1, -1).replace(/''/g, "'") : rest)
  throw fail()
}

/** A range as an address: 销售!B2:D9, 销售!C, 销售!C:E, 销售!3:5, 销售!A1. */
export function formatRange(sheet, { kind = 'cells', r0, c0, r1, c1 }) {
  const prefix = sheet ? `${quoteSheet(sheet)}!` : ''
  if (kind === 'cols') return `${prefix}${colName(c0)}:${colName(c1)}`
  if (kind === 'rows') return `${prefix}${r0 + 1}:${r1 + 1}`
  if (kind === 'sheet') return sheet ? quoteSheet(sheet) : ''
  const a = addr(r0, c0)
  return r0 === r1 && c0 === c1 ? `${prefix}${a}` : `${prefix}${a}:${addr(r1, c1)}`
}

// ─── the workbook ───────────────────────────────────────────────────────────

const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

/**
 * The workbook: its part (xl/workbook.xml, as every writer names it), sheets (name, state, part, sheetId, and the parts
 * each points to), date system, defined names, shared strings and styles. `text(name)` resolves to a part's text, or
 * null (the page: inflated as asked; the script: from the zip).
 */
export async function readBook(text) {
  const part = 'xl/workbook.xml'
  const xml = await text(part)
  if (!xml) throw new OoxmlError('not a workbook: no xl/workbook.xml')
  const els = scanXml(xml)
  const rels = relationships(await text(relsOf(part)), part)
  const relById = new Map(rels.map((r) => [r.id, r]))
  const sheets = []
  for (const e of els.filter((x) => x.local === 'sheet' && els[x.parent]?.local === 'sheets')) {
    const rid = Object.entries(e.attrs).find(([k]) => k === 'r:id' || (k.endsWith(':id') && xml.includes(`xmlns:${k.slice(0, -3)}="${REL}"`)))?.[1]
    const rel = relById.get(rid)
    // A chartsheet or a dialog sheet has no cells: listed, not opened.
    sheets.push({ name: unescape(e.attrs.name ?? ''), state: e.attrs.state ?? 'visible', sheetId: Number(e.attrs.sheetId), part: rel?.type === 'worksheet' ? rel.target : null, kind: rel?.type ?? 'missing' })
  }
  const pr = els.find((x) => x.local === 'workbookPr')
  const date1904 = pr ? /^(1|true)$/.test(pr.attrs.date1904 ?? '') : false
  const names = els
    .filter((x) => x.local === 'definedName')
    .map((x) => ({ name: unescape(x.attrs.name ?? ''), scope: x.attrs.localSheetId !== undefined ? Number(x.attrs.localSheetId) : null, hidden: x.attrs.hidden === '1', ref: shown(unescape(xml.slice(x.innerStart, x.innerEnd))) }))
  const target = (type) => rels.find((r) => r.type === type)?.target ?? null
  const [sstText, stylesText, themeText] = await Promise.all([target('sharedStrings'), target('styles'), target('theme')].map((p) => (p ? text(p) : null)))
  return { part, xml, rels, sheets, date1904, names, sst: readSst(sstText), styles: readStyles(stylesText, themeText), stylesPart: target('styles'), calcChainPart: target('calcChain') }
}

/** The shared strings: each <si>'s text — its runs joined, its phonetic guides (rPh) left out. */
function readSst(text) {
  const out = []
  if (!text) return out
  const re = /<(?:[\w.-]+:)?si\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?si>)/g
  for (let m = re.exec(text); m; m = re.exec(text)) out.push(runText(m[1] ?? ''))
  return out
}

/** The text of a run list (<si> or <is>): every <t> outside <rPh>, unescaped. */
function runText(inner) {
  let s = ''
  const body = inner.includes('rPh') ? inner.replace(/<(?:[\w.-]+:)?rPh\b[\s\S]*?<\/(?:[\w.-]+:)?rPh>/g, '') : inner
  for (const m of body.matchAll(/<(?:[\w.-]+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?t>)/g)) s += unescape(m[1] ?? '')
  return s
}

// ─── styles ─────────────────────────────────────────────────────────────────

// Excel's built-in number formats (ECMA-376 18.8.30) by id; 14 and 22 (the short date) as Excel shows them in English
// — a Chinese viewer gets SHORT_DATE's (display) — the locale-dependent CJK ones as zh-CN Excel does.
const BUILTIN = {
  0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 11: '0.00E+00', 12: '# ?/?', 13: '# ??/??',
  14: 'm/d/yyyy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss',
  22: 'm/d/yyyy h:mm', 37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)',
  45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mmss.0', 48: '##0.0E+0', 49: '@',
  27: 'yyyy"年"m"月"', 28: 'm"月"d"日"', 29: 'm"月"d"日"', 30: 'm-d-yy', 31: 'yyyy"年"m"月"d"日"', 32: 'h"时"mm"分"', 33: 'h"时"mm"分"ss"秒"',
  34: '上午/下午h"时"mm"分"', 35: '上午/下午h"时"mm"分"ss"秒"', 36: 'yyyy"年"m"月"', 50: 'yyyy"年"m"月"', 51: 'm"月"d"日"', 52: 'yyyy"年"m"月"',
  53: 'm"月"d"日"', 54: 'm"月"d"日"', 55: '上午/下午h"时"mm"分"', 56: '上午/下午h"时"mm"分"ss"秒"', 57: 'yyyy"年"m"月"', 58: 'm"月"d"日"',
}
const INDEXED = ['000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF', '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF', '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080', '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF', '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF', '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99', '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696', '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333']

/** A colour with a tint (−1 darker … 1 lighter), as Excel applies it: in HLS, to the lightness. */
function tinted(hex, tint) {
  if (!tint) return hex
  let [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h /= 6
  }
  l = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint
  const f = (p, q, x) => {
    const t = (x + 1) % 1
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
  }
  if (s === 0) r = g = b = l
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = f(p, q, h + 1 / 3)
    g = f(p, q, h)
    b = f(p, q, h - 1 / 3)
  }
  return [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
}

/** A <color>'s CSS colour: rgb (ARGB), theme + tint, or the indexed palette; undefined for automatic. */
function colorOf(el, theme) {
  if (!el) return undefined
  const { rgb, theme: th, indexed, tint } = el.attrs
  let hex
  if (rgb) hex = rgb.slice(-6)
  else if (th !== undefined) hex = theme[[1, 0, 3, 2][Number(th)] ?? Number(th)] ?? theme[Number(th)]
  else if (indexed !== undefined && Number(indexed) < INDEXED.length) hex = INDEXED[Number(indexed)]
  return hex && /^[0-9A-Fa-f]{6}$/.test(hex) ? `#${tinted(hex, Number(tint ?? 0)).toLowerCase()}` : undefined
}

/** Each cellXfs entry: its number format and what the page draws it with (font, fill, borders, alignment). */
function readStyles(text, themeText) {
  const theme = []
  if (themeText) {
    const els = scanXml(themeText)
    const scheme = els.find((e) => e.local === 'clrScheme')
    if (scheme)
      for (const slot of els.filter((e) => e.parent === scheme.index)) {
        const c = els.find((e) => e.parent === slot.index)
        theme.push(c?.attrs.val && c.local === 'srgbClr' ? c.attrs.val : (c?.attrs.lastClr ?? undefined))
      }
  }
  if (!text) return { xfs: [{ fmt: 'General' }], theme, count: 1 }
  const els = scanXml(text)
  const kids = (parent, local) => els.filter((e) => e.parent === parent?.index && (!local || e.local === local))
  const one = (parent, local) => els.find((e) => e.parent === parent.index && e.local === local)
  const section = (local) => els.find((e) => e.local === local && els[e.parent]?.local === 'styleSheet')
  const fmts = new Map(kids(section('numFmts'), 'numFmt').map((e) => [Number(e.attrs.numFmtId), unescape(e.attrs.formatCode ?? 'General')]))
  const on = (el) => !!el && !/^(0|false)$/.test(el.attrs.val ?? '1')
  const fonts = kids(section('fonts'), 'font').map((f) => ({
    b: on(one(f, 'b')), i: on(one(f, 'i')), u: !!one(f, 'u') && one(f, 'u').attrs.val !== 'none', strike: on(one(f, 'strike')),
    sz: Number(one(f, 'sz')?.attrs.val ?? 11), name: one(f, 'name')?.attrs.val, color: colorOf(one(f, 'color'), theme),
  }))
  const fills = kids(section('fills'), 'fill').map((f) => {
    const p = one(f, 'patternFill')
    if (p && p.attrs.patternType && p.attrs.patternType !== 'none') return colorOf(one(p, 'fgColor'), theme) ?? (p.attrs.patternType === 'solid' ? undefined : colorOf(one(p, 'bgColor'), theme))
    const g = one(f, 'gradientFill')
    return g ? colorOf(els.find((e) => e.local === 'color' && e.start > g.start && e.end <= g.end), theme) : undefined
  })
  const borders = kids(section('borders'), 'border').map((b) => {
    const side = (local) => {
      const el = one(b, local)
      const style = el?.attrs.style
      if (!style || style === 'none') return undefined
      const width = /thick/.test(style) ? 3 : /medium/i.test(style) ? 2 : 1
      const line = style === 'double' ? 'double' : /dash|dot/i.test(style) ? (style === 'dotted' || style === 'hair' ? 'dotted' : 'dashed') : 'solid'
      return `${style === 'double' ? 3 : width}px ${line} ${colorOf(one(el, 'color'), theme) ?? '#000'}`
    }
    return { l: side('left') ?? side('start'), r: side('right') ?? side('end'), t: side('top'), b: side('bottom') }
  })
  const xfs = kids(section('cellXfs'), 'xf').map((x) => {
    const id = Number(x.attrs.numFmtId ?? 0)
    const al = one(x, 'alignment')?.attrs ?? {}
    return {
      numFmtId: id, fmt: fmts.get(id) ?? BUILTIN[id] ?? 'General', font: fonts[Number(x.attrs.fontId ?? 0)], fill: fills[Number(x.attrs.fillId ?? 0)],
      border: borders[Number(x.attrs.borderId ?? 0)], h: al.horizontal, v: al.vertical, wrap: /^(1|true)$/.test(al.wrapText ?? ''), indent: Number(al.indent ?? 0),
    }
  })
  return { xfs: xfs.length ? xfs : [{ fmt: 'General' }], theme, count: xfs.length, fmts }
}

// ─── a sheet ────────────────────────────────────────────────────────────────

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`).exec(tag)
  return m ? (m[2] ?? m[3]) : undefined
}

/**
 * A sheet's XML, its rows found: where each row lies, its height and whether it is hidden; the columns' widths; the
 * frozen panes; the merged cells. A row's cells are read by `row(r)` when asked.
 */
export function readSheet(xml, book) {
  const open = /<(?:[\w.-]+:)?sheetData\b[^>]*?(\/?)>/.exec(xml)
  if (!open) throw new OoxmlError('not a worksheet: no <sheetData>')
  const dataStart = open.index
  const empty = open[1] === '/'
  const innerStart = open.index + open[0].length
  const close = empty ? null : new RegExp(`</(?:[\\w.-]+:)?sheetData>`, 'g')
  if (close) close.lastIndex = innerStart
  const closeAt = close ? close.exec(xml) : null
  if (!empty && !closeAt) throw new OoxmlError('a worksheet whose <sheetData> is never closed')
  const innerEnd = empty ? innerStart : closeAt.index
  const dataEnd = empty ? innerStart : closeAt.index + closeAt[0].length
  const head = xml.slice(0, dataStart)
  const tail = xml.slice(dataEnd)

  const fmtPr = /<(?:[\w.-]+:)?sheetFormatPr\b[^>]*>/.exec(head)?.[0] ?? ''
  const defaultHeight = Number(attr(fmtPr, 'defaultRowHeight') ?? 15)
  const defaultWidth = Number(attr(fmtPr, 'defaultColWidth') ?? Number(attr(fmtPr, 'baseColWidth') ?? 8) + 0.43)
  const cols = []
  for (const m of head.matchAll(/<(?:[\w.-]+:)?col\b[^>]*>/g)) {
    const t = m[0]
    cols.push({ min: Number(attr(t, 'min')) - 1, max: Math.min(Number(attr(t, 'max')) - 1, MAX_COLS - 1), width: attr(t, 'width') !== undefined ? Number(attr(t, 'width')) : undefined, hidden: /^(1|true)$/.test(attr(t, 'hidden') ?? ''), style: attr(t, 'style') !== undefined ? Number(attr(t, 'style')) : undefined })
  }
  const pane = /<(?:[\w.-]+:)?pane\b[^>]*>/.exec(head)?.[0]
  const frozen = pane && /frozen/.test(attr(pane, 'state') ?? '') ? { rows: Number(attr(pane, 'ySplit') ?? 0), cols: Number(attr(pane, 'xSplit') ?? 0) } : { rows: 0, cols: 0 }
  const dimension = attr(/<(?:[\w.-]+:)?dimension\b[^>]*>/.exec(head)?.[0] ?? '', 'ref')
  const merges = []
  for (const m of tail.matchAll(/<(?:[\w.-]+:)?mergeCell\b[^>]*>/g)) {
    const [a, b] = (attr(m[0], 'ref') ?? '').split(':')
    const ca = parseCell(a ?? '')
    const cb = parseCell(b ?? a ?? '')
    if (ca && cb) merges.push({ r0: Math.min(ca.r, cb.r), c0: Math.min(ca.c, cb.c), r1: Math.max(ca.r, cb.r), c1: Math.max(ca.c, cb.c) })
  }

  // The rows: start of each <row>, its number (one without r is the one after the last), height, hidden, style.
  const starts = []
  const nums = []
  const heights = new Map()
  const rowStyle = new Map()
  let maxCol = -1
  let prev = -1
  const seen = new Set()
  const re = /<(?:[\w.-]+:)?row\b([^>]*?)(\/?)>/g
  re.lastIndex = innerStart
  for (let m = re.exec(xml); m && m.index < innerEnd; m = re.exec(xml)) {
    const a = m[1]
    const rAttr = attr(a, 'r')
    const r = rAttr !== undefined ? Number(rAttr) - 1 : prev + 1
    if (!(r >= 0) || r >= MAX_ROWS) throw new OoxmlError(`the sheet has a row numbered ${rAttr}`)
    // Out of order is read as it is (some writers do it, Excel opens them); the same row twice is not.
    if (r <= prev && seen.has(r)) throw new OoxmlError(`the sheet gives row ${r + 1} twice`)
    seen.add(r)
    prev = r
    starts.push(m.index)
    nums.push(r)
    if (/^(1|true)$/.test(attr(a, 'hidden') ?? '')) heights.set(r, 0)
    else if (a.includes('ht') && /^(1|true)$/.test(attr(a, 'customHeight') ?? '') && attr(a, 'ht') !== undefined) heights.set(r, Number(attr(a, 'ht')))
    if (/^(1|true)$/.test(attr(a, 'customFormat') ?? '') && attr(a, 's') !== undefined) rowStyle.set(r, Number(attr(a, 's')))
    const spans = attr(a, 'spans')
    if (spans) for (const part of spans.split(/\s+/)) maxCol = Math.max(maxCol, Number(part.split(':')[1] ?? 0) - 1)
  }
  const at = new Map(nums.map((r, k) => [r, k]))
  // By number, for whoever goes through the rows in order; rowSpan finds a row's end by the next one in the file.
  const sorted = nums.slice().sort((a, b) => a - b)
  const dimEnd = dimension ? parseCell(dimension.split(':').pop() ?? '') : null
  const sheet = {
    xml, dataStart, innerStart, innerEnd, dataEnd, defaultHeight, defaultWidth, cols, frozen, merges, heights, rowStyle, rowNums: sorted, dimension,
    tail,
    /** Where row r's element lies: { start, openEnd (after its start tag), end (after </row>), selfClosing }; null if none. */
    rowSpan(r) {
      const k = at.get(r)
      if (k === undefined) return null
      const start = starts[k]
      const next = k + 1 < starts.length ? starts[k + 1] : innerEnd
      const tag = /^<(?:[\w.-]+:)?row\b[^>]*?(\/?)>/.exec(xml.slice(start, Math.min(next, start + 4096)))
      if (!tag) throw new OoxmlError(`row ${r + 1}'s start tag is damaged`)
      if (tag[1] === '/') return { start, openEnd: start + tag[0].length, end: start + tag[0].length, selfClosing: true, next }
      const closeTag = xml.lastIndexOf('</', next - 1)
      const end = closeTag >= start ? xml.indexOf('>', closeTag) + 1 : -1
      if (end <= 0) throw new OoxmlError(`row ${r + 1} is never closed`)
      return { start, openEnd: start + tag[0].length, end, closeStart: closeTag, selfClosing: false, next }
    },
    row: (r) => rowCells(sheet, r, book),
    /** The width of column c, in Excel's character units (undefined: the sheet's default), and whether it is hidden. */
    col(c) {
      const col = cols.find((x) => c >= x.min && c <= x.max)
      return { width: col?.hidden ? 0 : (col?.width ?? defaultWidth), style: col?.style }
    },
    merged(r, c) {
      return merges.find((m) => r >= m.r0 && r <= m.r1 && c >= m.c0 && c <= m.c1) ?? null
    },
    shared: null,
    cache: new Map(),
  }
  sheet.rowCount = Math.max((sorted.at(-1) ?? -1) + 1, dimEnd ? dimEnd.r + 1 : 0, ...merges.map((m) => m.r1 + 1))
  sheet.colCount = Math.max(maxCol + 1, dimEnd ? dimEnd.c + 1 : 0, ...merges.map((m) => m.c1 + 1))
  return sheet
}

/** Row r's cells: Map c → cell. Cached (a few thousand rows) — the page scrolls back and forth over the same ones. */
function rowCells(sheet, r, book) {
  const hit = sheet.cache.get(r)
  if (hit) return hit
  const out = new Map()
  const span = sheet.rowSpan(r)
  if (span && !span.selfClosing) {
    const seg = sheet.xml.slice(span.openEnd, span.closeStart)
    const re = /<(?:[\w.-]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?c>)/g
    let prev = -1
    for (let m = re.exec(seg); m; m = re.exec(seg)) {
      const a = m[1]
      const ref = attr(a, 'r')
      const c = ref ? (parseCell(ref)?.c ?? -1) : prev + 1
      if (c < 0 || out.has(c)) throw new OoxmlError(`row ${r + 1} gives ${ref ?? 'a cell'} ${c < 0 ? 'in no column' : 'twice'}`)
      prev = c
      out.set(c, cellOf(sheet, book, r, c, a, m[2] ?? '', span.openEnd + m.index, span.openEnd + m.index + m[0].length))
    }
  }
  if (sheet.cache.size > 3000) sheet.cache.clear()
  sheet.cache.set(r, out)
  return out
}

function cellOf(sheet, book, r, c, a, body, start, end) {
  const t = attr(a, 't') ?? 'n'
  const s = Number(attr(a, 's') ?? 0)
  const cell = { r, c, t, s, start, end, v: undefined, f: undefined }
  const v = /<(?:[\w.-]+:)?v\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?v>)/.exec(body)
  const raw = v?.[1] !== undefined ? unescape(v[1]) : undefined
  if (t === 's') cell.v = raw !== undefined ? (book.sst[Number(raw)] ?? '') : undefined
  else if (t === 'inlineStr') {
    const is = /<(?:[\w.-]+:)?is\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?is>)/.exec(body)
    cell.v = is ? runText(is[1] ?? '') : (raw ?? '')
  } else if (t === 'str') cell.v = raw
  else if (t === 'b') cell.v = raw === undefined ? undefined : raw === '1' || raw === 'true'
  else if (t === 'e') cell.v = raw === undefined ? undefined : { error: raw }
  else if (t === 'd') cell.v = raw === undefined ? undefined : isoToSerial(raw, book.date1904)
  else cell.v = raw === undefined || raw === '' ? undefined : Number(raw)
  const fm = /<(?:[\w.-]+:)?f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?f>)/.exec(body)
  if (fm) {
    const fa = fm[1]
    cell.fType = attr(fa, 't') ?? 'normal'
    cell.fRef = attr(fa, 'ref')
    cell.si = attr(fa, 'si')
    const text = fm[2] !== undefined ? unescape(fm[2]) : ''
    if (cell.fType === 'shared' && !text) {
      const master = sharedMaster(sheet, cell.si)
      cell.f = master ? shown(shift(master.text, r - master.r, c - master.c)) : undefined
    } else if (text) cell.f = shown(text)
    if (cell.fType === 'shared' && text) cell.master = true
  }
  return cell
}

/** A shared formula's master (the cell whose <f t="shared" si> has the text), by its si: found once per sheet. */
function sharedMaster(sheet, si) {
  if (!sheet.shared) {
    sheet.shared = new Map()
    // (?<!\/)> — not a self-closing <c …/>, or the next cell's formula would be taken for this one's.
    const re = /<(?:[\w.-]+:)?c\b([^>]*?)(?<!\/)>(?:(?!<\/(?:[\w.-]+:)?c>)[\s\S])*?<(?:[\w.-]+:)?f\b([^>]*?\bt="shared"[^>]*?)>([^<]+)<\/(?:[\w.-]+:)?f>/g
    re.lastIndex = sheet.innerStart
    for (let m = re.exec(sheet.xml); m && m.index < sheet.innerEnd; m = re.exec(sheet.xml)) {
      const at = parseCell(attr(m[1], 'r') ?? '')
      const id = attr(m[2], 'si')
      if (at && id !== undefined) sheet.shared.set(id, { ...at, text: unescape(m[3]), ref: attr(m[2], 'ref') })
    }
  }
  return sheet.shared.get(si) ?? null
}

/** Every shared formula group of the sheet: si → its master ({ r, c, text, ref }). */
export function sharedMasters(sheet) {
  sharedMaster(sheet, '')
  return sheet.shared
}

// ─── what a cell shows ──────────────────────────────────────────────────────

const COLORS = { red: '#ff0000', black: '#000000', blue: '#0000ff', green: '#00ff00', white: '#ffffff', yellow: '#ffff00', magenta: '#ff00ff', cyan: '#00ffff' }

/** The number format a cell is shown with. */
export const formatOf = (book, cell) => book.styles.xfs[cell?.s ?? 0]?.fmt ?? 'General'

/** Built-in 14 and 22, the short date, follow the viewer's language as in Excel and WPS: zh 2024/3/1, en 3/1/2024. */
const SHORT_DATE = { zh: { 14: 'yyyy/m/d', 22: 'yyyy/m/d h:mm' } }
const shownFormat = (book, cell, locale) => {
  const xf = book.styles.xfs[cell?.s ?? 0]
  const local = SHORT_DATE[String(locale).slice(0, 2).toLowerCase()]?.[xf?.numFmtId]
  return local && xf.fmt === BUILTIN[xf.numFmtId] ? local : (xf?.fmt ?? 'General')
}

/** A number's format is a date or time (not a duration: [h]:mm stays a number). */
export const isDate = (fmt) => !!fmt && numfmt.isDateFormat(fmt) && !/\[(h|m|s)+\]/i.test(fmt)

/**
 * What the cell shows, as the file stores it (nothing calculated): { text, color?, pending? } — a formula with no
 * stored result is its formula, `pending`.
 */
export function display(book, cell, locale = 'en') {
  if (!cell) return { text: '' }
  if (cell.v === undefined) return cell.f !== undefined ? { text: `=${cell.f}`, pending: true } : { text: '' }
  const v = cell.v
  if (typeof v === 'boolean') return { text: v ? 'TRUE' : 'FALSE' }
  if (typeof v === 'object') return { text: v.error }
  const fmt = shownFormat(book, cell, locale)
  const options = { date1904: book.date1904, locale, throws: false, nbsp: false, leap1900: true }
  if (typeof v === 'number' && !Number.isFinite(v)) return { text: '#NUM!' }
  let text
  try {
    text = numfmt.format(fmt, v, options)
  } catch {
    text = String(v)
  }
  let color
  try {
    const c = numfmt.formatColor(fmt, v, options)
    color = typeof c === 'string' ? (COLORS[c.toLowerCase()] ?? (c.startsWith('#') ? c : undefined)) : undefined
  } catch {
    color = undefined
  }
  return color ? { text, color } : { text }
}

// ─── values as agents read and write them ───────────────────────────────────

const pad = (n, w = 2) => String(n).padStart(w, '0')

/** An Excel serial (days; 1900 or 1904 system) as { date: 'YYYY-MM-DD' | '…THH:MM[:SS]' | 'HH:MM[:SS]' }. */
export function serialToDate(serial, date1904) {
  const days = Math.floor(serial)
  const secs = Math.round((serial - days) * 86400)
  const time = secs ? `${pad(Math.floor(secs / 3600))}:${pad(Math.floor(secs / 60) % 60)}${secs % 60 ? `:${pad(secs % 60)}` : ''}` : ''
  if (days === 0 && !date1904 && time) return { date: time }
  // 1900 system: serial 60 is 1900-02-29, which never was (Lotus's leap-year bug Excel keeps); days after it are one off.
  const base = date1904 ? Date.UTC(1904, 0, 1) : days < 60 ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30)
  const d = new Date(base + days * 86400000)
  const day = days === 60 && !date1904 ? '1900-02-29' : `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  return { date: time ? `${day}T${time}` : day }
}

/** { date } as an Excel serial; throws OoxmlError for anything but YYYY-MM-DD[THH:MM[:SS]] or HH:MM[:SS]. */
export function dateToSerial(value, date1904) {
  const s = String(value.date ?? '')
  const m = /^(?:(\d{4})-(\d{2})-(\d{2}))?(?:(?:^|T)(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s)
  if (!s || !m || (!m[1] && m[4] === undefined)) throw new OoxmlError(`{ date: ${JSON.stringify(s)} } is not a date: write YYYY-MM-DD, YYYY-MM-DDTHH:MM, or HH:MM`)
  const time = m[4] !== undefined ? (Number(m[4]) * 3600 + Number(m[5]) * 60 + Number(m[6] ?? 0)) / 86400 : 0
  if (!m[1]) return time
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const ms = Date.UTC(y, mo - 1, d)
  const check = new Date(ms)
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) throw new OoxmlError(`{ date: ${JSON.stringify(s)} } is not a day of the calendar`)
  let days
  if (date1904) days = (ms - Date.UTC(1904, 0, 1)) / 86400000
  else {
    days = (ms - Date.UTC(1899, 11, 30)) / 86400000
    if (days < 61) days -= 1 // before 1900-03-01: Excel's serials count the day that never was
  }
  if (days < 0) throw new OoxmlError(`{ date: ${JSON.stringify(s)} } is before the workbook's first day`)
  return days + time
}

const isoToSerial = (iso, date1904) => {
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}(?::\d{2})?))?/.exec(iso)
  try {
    return m ? dateToSerial({ date: m[2] ? `${m[1]}T${m[2].slice(0, 8)}` : m[1] }, date1904) : undefined
  } catch {
    return undefined
  }
}

/**
 * A cell as an agent reads it — what a person would type into Excel: a number, text, true/false, null (empty), a
 * formula ('=…'), text that starts with = or ' written with a leading ' (Excel's own rule), { date } for a number with
 * a date format, { error } for an error value.
 */
export function agentValue(book, cell) {
  if (!cell) return null
  if (cell.f !== undefined) return `=${cell.f}`
  const v = cell.v
  if (v === undefined) return null
  if (typeof v === 'string') return /^[=']/.test(v) ? `'${v}` : v
  if (typeof v === 'number' && isDate(formatOf(book, cell))) return serialToDate(v, book.date1904)
  return v
}
