// A .xlsx in a chat's folder, opened in 咕咕办公: the sheet drawn, cells and ranges picked the way a spreadsheet picks
// them, and the picks put in the chat's composer as pills for the person to @ an agent with (the sheet
// design note §2, §3; App reference pills).
//
// - Drawn by this page, no table library: only the sheet on screen is inflated, its rows found by where they lie
//   (xlsx-read.js), and only the rows and columns on screen are read and made into elements — a 100k-row sheet opens in
//   0.2 s on the phone's WebView 113 (measured 10-13). Cells sit near the first one on screen and the layer is moved
//   there: a layer whose content reaches millions of px draws nothing on WebView 113.
// - Headers, frozen rows and columns are sticky layers: the browser keeps them in place while the content scrolls.
// - No modes: a click picks a cell, a drag a range; Shift extends the last one, ⌘/Ctrl adds one; a row number or a
//   column letter picks the row or column, the corner the sheet. On a phone a tap adds a cell, a long press then a drag
//   adds a range, the round handle resizes the last one; a finger's drag scrolls.
// - Each waiting pick is outlined and numbered in the order its pill goes; its number takes it back.
// - A pill clicked opens the file here at its place (`reveal`, from the page's onLink): its sheet shown, the range
//   scrolled to and framed until the next press on the sheet.
// - Nothing is written here: an agent changes the file (the skill's script, skills/office/scripts/xlsx.mjs apply); its
//   new version is drawn again by the page, a new
//   view replacing this one at the same sheet and scroll, the cells that changed flashing once.

import { openParts, relationships, relsOf, unescape } from './skills/office/lib/ooxml-read.js'
import { MAX_COLS, MAX_ROWS, colName, display, formatRange, parseCell, parseRange, readBook, readSheet } from './skills/office/lib/xlsx-read.js'

const PT = 4 / 3
const HH = 22
// Half a pick's number badge (style.css .xlsx-badge, 20 px): how far its centre keeps from the edge of what shows.
const BADGE = 10
const LONG_PRESS = 350
const colPx = (width) => (width === 0 ? 0 : Math.round(width * 7 + 5))

/**
 * A pick as the pill the composer gets (App 引用 pill): `at` is `{ range }`, the address as Excel writes it — `销售!B2:D4`,
 * `'2024 预算'!C:E`, `销售!3:5`, a sheet's name alone for all of it; a merged area by its top-left cell, as Excel names it —
 * what the skill's script takes as it is (`xlsx.mjs read <book> '<range>'`) and `reveal` reads back. Its label: the same
 * address.
 */
export function refOf(pick) {
  const range = formatRange(pick.sheet, pick.merged ? { r0: pick.r0, c0: pick.c0, r1: pick.r0, c1: pick.c0 } : pick)
  return { at: { range }, label: range }
}

/** The rows and columns a sheet is drawn with: what it uses and some room past it, within Excel's own limits. */
const extentOf = (sheet) => ({ rows: Math.min(MAX_ROWS, Math.max(sheet.rowCount + 40, 60)), cols: Math.min(MAX_COLS, Math.max(sheet.colCount + 8, 16)) })

/**
 * Draw `bytes` into `host`; `onPicks(picks)` hears the waiting picks change. Resolves to the view's handle: `picks()`,
 * `clear()`, `anchor()`, `dragging()`, `reveal(query)`, `keep()`, `destroy()`. Rejects if the file cannot be read. The bar that gathers the picks,
 * Esc and Enter are the page's (app.js).
 * `wanted()` is asked once more before the sheet replaces what `host` shows: no, and it resolves to null. `previous`:
 * the view of the version before, which this one replaces — its sheet and scroll kept, the cells it showed that read
 * otherwise now flashing once (its `keep()`).
 */
export async function mountXlsx(host, bytes, { t, onPicks, wanted = () => true, previous = null }) {
  const locale = t.xlsxLocale ?? 'en'
  const parts = openParts(bytes)
  const book = await readBook(parts.text)
  const shown = book.sheets.filter((s) => s.state === 'visible' && s.part)
  if (!shown.length) throw new Error(t.xlsxNoSheets)
  // A new version of the file on screen: the same sheet, where the person was.
  const before = previous?.keep?.() ?? null
  const sheets = new Map()
  const loadSheet = async (info) => {
    if (!sheets.has(info.name)) {
      const xml = await parts.text(info.part)
      if (xml === null) throw new Error(`${info.part} is missing`)
      const sheet = readSheet(xml, book)
      const rels = relationships(await parts.text(relsOf(info.part)), info.part)
      sheet.notes = await notesOf(parts.text, rels)
      sheet.notDrawn = await notDrawnOf(parts.text, rels)
      sheet.pending = (xml.match(/<(?:[\w.-]+:)?f\b[^>]*?(?:\/>|>[^<]*<\/(?:[\w.-]+:)?f>)\s*<\/(?:[\w.-]+:)?c>/g) ?? []).length
      sheets.set(info.name, sheet)
    }
    return sheets.get(info.name)
  }
  let current = shown.find((s) => s.name === before?.sheet) ?? shown[0]
  let sheet = await loadSheet(current)
  // Took long enough that another file (or newer picks) came first: nothing of this one is shown.
  if (!wanted()) return null

  let picks = []
  let dragging = false
  /** The place a pill pointed at (reveal), framed until the next press on the sheet: `{ sheet, r0, c0, r1, c1 }`. */
  let found = null
  /** Which reveal is the newest: an older one still loading its sheet frames nothing. */
  let revealing = 0
  const view = {}
  /** What was on screen when last drawn (keep): the sheet, the scroll, each cell's text. */
  let last = null

  const root = document.createElement('div')
  root.className = 'xlsx-book'
  // A sheet that would not open (a tab's): said in a line, not tucked away.
  const note = document.createElement('div')
  note.className = 'xlsx-note'
  note.setAttribute('role', 'alert')
  const gridBox = document.createElement('div')
  gridBox.className = 'xlsx-grid'
  const scroll = document.createElement('div')
  scroll.className = 'xlsx-scroll'
  scroll.tabIndex = 0
  const tabs = document.createElement('div')
  tabs.className = 'xlsx-tabs'
  const tabList = document.createElement('div')
  tabList.className = 'xlsx-tablist'
  // ⓘ at the end of the tabs: what the page has to say about the sheet (formulas with no result, what it does not draw),
  // as gugu's settings pages say theirs — the browser's own popover (a click, a press outside, Escape), opening on hover
  // too. A WebView with no popover (before Chromium 114) shows the words where they are: a line above the tabs.
  const about = document.createElement('button')
  about.type = 'button'
  about.className = 'xlsx-about'
  about.setAttribute('aria-label', t.xlsxAbout)
  const icon = document.createElement('gugu-icon')
  icon.setAttribute('name', 'info')
  about.append(icon)
  const aboutText = document.createElement('div')
  aboutText.className = 'xlsx-about-text'
  aboutText.setAttribute('role', 'dialog')
  aboutText.setAttribute('aria-label', t.xlsxAbout)
  infotip(about, aboutText)
  tabs.append(tabList, about)
  root.append(note, gridBox, aboutText, tabs)
  gridBox.append(scroll)

  // ─── geometry of the sheet on screen ───
  let g = null
  const layout = () => {
    const { rows, cols } = extentOf(sheet)
    const tops = new Float64Array(rows + 1)
    const defH = Math.round(sheet.defaultHeight * PT)
    for (let r = 0; r < rows; r++) {
      const h = sheet.heights.get(r)
      tops[r + 1] = tops[r] + (h === undefined ? defH : Math.round(h * PT))
    }
    const lefts = new Float64Array(cols + 1)
    for (let c = 0; c < cols; c++) lefts[c + 1] = lefts[c] + colPx(sheet.col(c).width)
    const HW = Math.max(36, 10 + 8 * String(rows).length)
    const fr = Math.min(sheet.frozen.rows, rows)
    const fc = Math.min(sheet.frozen.cols, cols)
    g = { rows, cols, tops, lefts, HW, fr, fc, frozenH: tops[fr], frozenW: lefts[fc] }
  }
  const find = (arr, v) => {
    let lo = 0
    let hi = arr.length - 2
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (arr[mid] <= v) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  // ─── layers ───
  const layer = (cls) => {
    const el = document.createElement('div')
    el.className = `xlsx-layer ${cls}`
    return el
  }
  const space = document.createElement('div')
  space.className = 'xlsx-space'
  const main = layer('xlsx-main')
  space.append(main)
  const colHead = layer('xlsx-colhead')
  const rowHead = layer('xlsx-rowhead')
  const frozenTop = layer('xlsx-ftop')
  const frozenLeft = layer('xlsx-fleft')
  const frozenCorner = layer('xlsx-fcorner')
  const corner = layer('xlsx-corner')
  scroll.append(corner, colHead, frozenCorner, frozenTop, rowHead, frozenLeft, space)

  // ─── drawing ───
  let lastTexts = new Map()
  let flash = null
  const cellEl = (r, c, x, y, w, h, row) => {
    const d = row.get(c)
    const el = document.createElement('div')
    el.className = 'xc'
    let css = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`
    const xf = book.styles.xfs[d?.s ?? sheet.rowStyle.get(r) ?? sheet.col(c).style ?? 0]
    const shownText = d ? display(book, d, locale) : { text: '' }
    if (xf?.fill) css += `;background:${xf.fill}`
    else if (shownText.text) css += ';background:#fff'
    const font = xf?.font
    if (font) {
      if (font.b) css += ';font-weight:600'
      if (font.i) css += ';font-style:italic'
      if (font.u || font.strike) css += `;text-decoration:${font.u ? 'underline' : ''} ${font.strike ? 'line-through' : ''}`
      if (font.sz && font.sz !== 11) css += `;font-size:${Math.round(font.sz * PT * 0.9)}px`
    }
    const color = shownText.color ?? font?.color
    if (color) css += `;color:${color}`
    const b = xf?.border
    if (b?.l) css += `;border-left:${b.l}`
    if (b?.t) css += `;border-top:${b.t}`
    if (b?.r) css += `;border-right:${b.r}`
    if (b?.b) css += `;border-bottom:${b.b}`
    const isNumber = typeof d?.v === 'number' && !shownText.pending
    const hz = xf?.h ?? (isNumber ? 'right' : typeof d?.v === 'boolean' || typeof d?.v === 'object' ? 'center' : 'left')
    css += `;justify-content:${hz === 'center' || hz === 'centerContinuous' ? 'center' : hz === 'right' ? 'flex-end' : 'flex-start'}`
    css += `;align-items:${xf?.v === 'top' ? 'flex-start' : xf?.v === 'center' ? 'center' : 'flex-end'}`
    if (xf?.indent) css += `;padding-left:${3 + xf.indent * 9}px`
    if (xf?.wrap) css += ';white-space:pre-wrap;word-break:break-word'
    // Text runs on over the empty cells beside it, as in Excel; a number does not.
    else if (shownText.text && !isNumber) el.classList.add('spill')
    if (shownText.pending) el.classList.add('pending')
    if (sheet.notes.has(`${r}:${c}`)) {
      el.classList.add('noted')
      el.title = sheet.notes.get(`${r}:${c}`)
    }
    el.style.cssText = css
    el.textContent = shownText.text
    lastTexts.set(`${r}:${c}`, shownText.text)
    if (flash && flash.get(`${r}:${c}`) !== undefined && flash.get(`${r}:${c}`) !== shownText.text) el.classList.add('changed')
    return el
  }
  // The cells of rows [ra, rb] × columns [ca, cb] into `into`, placed relative to (ox, oy) in sheet px. A frozen pane is
  // paper under its cells: the row or column half scrolled under it does not show through its empty cells.
  const fillCells = (into, ra, rb, ca, cb, ox, oy) => {
    const frag = document.createDocumentFragment()
    if (into !== main) {
      const back = document.createElement('div')
      back.className = 'xlsx-back'
      back.style.cssText = `left:${g.lefts[ca] - ox}px;top:${g.tops[ra] - oy}px;width:${g.lefts[cb + 1] - g.lefts[ca]}px;height:${g.tops[rb + 1] - g.tops[ra]}px`
      frag.append(back)
    }
    const merges = sheet.merges.filter((m) => m.r1 >= ra && m.r0 <= rb && m.c1 >= ca && m.c0 <= cb)
    for (const m of merges) {
      // A merged area draws once, in the layer its top-left cell belongs to: skipped here only when that cell is frozen
      // and this layer is not (the frozen layer draws it). Its top or left scrolled out of sight, the rest still shows.
      if (m.r0 < g.fr && ra >= g.fr) continue
      if (m.c0 < g.fc && ca >= g.fc) continue
      const w = g.lefts[m.c1 + 1] - g.lefts[m.c0]
      const h = g.tops[m.r1 + 1] - g.tops[m.r0]
      if (w && h) frag.append(cellEl(m.r0, m.c0, g.lefts[m.c0] - ox, g.tops[m.r0] - oy, w, h, sheet.row(m.r0)))
    }
    const covered = (r, c) => merges.some((m) => r >= m.r0 && r <= m.r1 && c >= m.c0 && c <= m.c1)
    for (let r = ra; r <= rb; r++) {
      const h = g.tops[r + 1] - g.tops[r]
      if (!h) continue
      const row = sheet.row(r)
      for (let c = ca; c <= cb; c++) {
        const w = g.lefts[c + 1] - g.lefts[c]
        if (!w || (merges.length && covered(r, c))) continue
        frag.append(cellEl(r, c, g.lefts[c] - ox, g.tops[r] - oy, w, h, row))
      }
    }
    markPicks(frag, ra, rb, ca, cb, ox, oy)
    into.replaceChildren(frag)
  }
  const headerEl = (text, css, picked) => {
    const el = document.createElement('div')
    el.className = picked ? 'xh picked' : 'xh'
    el.style.cssText = css
    el.textContent = text
    return el
  }
  const onSheet = () => picks.filter((p) => p.sheet === current.name)
  const draw = () => {
    if (!g) return
    lastTexts = new Map()
    const st = scroll.scrollTop
    const sl = scroll.scrollLeft
    const W = scroll.clientWidth
    const H = scroll.clientHeight
    const r0 = Math.max(g.fr, find(g.tops, st + g.frozenH))
    const r1 = Math.min(g.rows - 1, find(g.tops, st + H - HH) + 1)
    const c0 = Math.max(g.fc, find(g.lefts, sl + g.frozenW))
    const c1 = Math.min(g.cols - 1, find(g.lefts, sl + W - g.HW) + 1)
    const bx = g.lefts[c0]
    const by = g.tops[r0]
    main.style.transform = `translate(${g.HW + bx}px, ${HH + by}px)`
    fillCells(main, r0, r1, c0, c1, bx, by)
    // A sheet without frozen rows or columns empties those layers: else the last sheet's stay over this one's cells.
    if (g.fr) {
      frozenTop.style.transform = `translate(${g.HW + bx}px, 0)`
      fillCells(frozenTop, 0, g.fr - 1, c0, c1, bx, 0)
    } else frozenTop.replaceChildren()
    if (g.fc) {
      frozenLeft.style.transform = `translate(${g.HW}px, ${HH + by}px)`
      fillCells(frozenLeft, r0, r1, 0, g.fc - 1, 0, by)
    } else frozenLeft.replaceChildren()
    if (g.fr && g.fc) {
      frozenCorner.style.transform = `translate(${g.HW}px, 0)`
      fillCells(frozenCorner, 0, g.fr - 1, 0, g.fc - 1, 0, 0)
    } else frozenCorner.replaceChildren()
    // Headers: letters over the frozen columns and the scrolled ones; numbers likewise.
    const mine = onSheet()
    const colPicked = (c) => mine.some((p) => c >= p.c0 && c <= p.c1)
    const rowPicked = (r) => mine.some((p) => r >= p.r0 && r <= p.r1)
    const ch = document.createDocumentFragment()
    // The frozen ones last: they lie over the scrolled ones passing under them.
    const colsShown = [...Array.from({ length: c1 - c0 + 1 }, (_, i) => c0 + i), ...Array(g.fc).keys()]
    for (const c of colsShown) {
      const w = g.lefts[c + 1] - g.lefts[c]
      if (!w) continue
      const x = c < g.fc ? g.lefts[c] + sl - bx : g.lefts[c] - bx
      ch.append(headerEl(colName(c), `left:${x}px;top:0;width:${w}px;height:${HH}px`, colPicked(c)))
    }
    colHead.style.transform = `translate(${g.HW + bx}px, 0)`
    colHead.replaceChildren(ch)
    const rh = document.createDocumentFragment()
    const rowsShown = [...Array.from({ length: r1 - r0 + 1 }, (_, i) => r0 + i), ...Array(g.fr).keys()]
    for (const r of rowsShown) {
      const h = g.tops[r + 1] - g.tops[r]
      if (!h) continue
      const y = r < g.fr ? g.tops[r] + st - by : g.tops[r] - by
      rh.append(headerEl(String(r + 1), `left:0;top:${y}px;width:${g.HW}px;height:${h}px`, rowPicked(r)))
    }
    rowHead.style.transform = `translate(0, ${HH + by}px)`
    rowHead.replaceChildren(rh)
    last = { sheet: current.name, st, sl, texts: lastTexts }
    flash = null
  }
  let raf = 0
  const redraw = () => {
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0
      draw()
    })
  }
  scroll.addEventListener('scroll', redraw, { passive: true })
  const resized = typeof ResizeObserver === 'function' ? new ResizeObserver(redraw) : null
  resized?.observe(scroll)

  // Each pick on this sheet, as far as it lies in a pane's cells [ra, rb] × [ca, cb] (placed as fillCells places them):
  // outlined, a side it runs on past them unlined; its number on its top-left corner, in the pane that corner is in, kept
  // whole inside what shows of that pane (under a frozen header row, scrolled part way: the number stays to un-pick
  // with); on the last pick, at its bottom-right cell, the round handle that resizes it. In the pane, over its cells: a
  // pick on a frozen cell stays on it.
  const markPicks = (frag, ra, rb, ca, cb, ox, oy) => {
    if (found && found.sheet === current.name) {
      const r0 = Math.max(found.r0, ra)
      const r1 = Math.min(found.r1, rb)
      const c0 = Math.max(found.c0, ca)
      const c1 = Math.min(found.c1, cb)
      if (r0 <= r1 && c0 <= c1) {
        const box = document.createElement('div')
        box.className = 'xlsx-found'
        box.style.cssText = `left:${g.lefts[c0] - ox}px;top:${g.tops[r0] - oy}px;width:${g.lefts[c1 + 1] - g.lefts[c0]}px;height:${g.tops[r1 + 1] - g.tops[r0]}px`
        frag.append(box)
      }
    }
    const lastPick = picks.at(-1)
    const frozenRows = ra < g.fr
    const frozenCols = ca < g.fc
    const showsFromY = frozenRows ? 0 : scroll.scrollTop + g.frozenH
    const showsFromX = frozenCols ? 0 : scroll.scrollLeft + g.frozenW
    for (const p of onSheet()) {
      const r0 = Math.max(p.r0, ra)
      const r1 = Math.min(p.r1, rb)
      const c0 = Math.max(p.c0, ca)
      const c1 = Math.min(p.c1, cb)
      if (r0 > r1 || c0 > c1) continue
      const x0 = g.lefts[c0] - ox
      const x1 = g.lefts[c1 + 1] - ox
      const y0 = g.tops[r0] - oy
      const y1 = g.tops[r1 + 1] - oy
      const box = document.createElement('div')
      box.className = 'xlsx-mark'
      box.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px`
      if (p.c0 < ca) box.style.borderLeftColor = 'transparent'
      if (p.r0 < ra) box.style.borderTopColor = 'transparent'
      if (p.c1 > cb) box.style.borderRightColor = 'transparent'
      if (p.r1 > rb) box.style.borderBottomColor = 'transparent'
      frag.append(box)
      if ((p.r0 < g.fr) === frozenRows && (p.c0 < g.fc) === frozenCols) {
        const n = picks.indexOf(p) + 1
        const badge = document.createElement('button')
        badge.type = 'button'
        badge.className = 'xlsx-badge'
        badge.dataset.n = String(n)
        badge.title = t.unpick
        badge.setAttribute('aria-label', `${t.unpick} ${n}`)
        // On the pick still: a pick mostly scrolled under keeps its number on its last edge, not on the next cell.
        const bx = Math.min(Math.max(g.lefts[p.c0], showsFromX + BADGE), g.lefts[c1 + 1])
        const by = Math.min(Math.max(g.tops[p.r0], showsFromY + BADGE), g.tops[r1 + 1])
        badge.style.cssText = `left:${bx - ox}px;top:${by - oy}px`
        badge.addEventListener('click', (e) => {
          e.stopPropagation()
          // The keys back on the sheet: the badge goes with the redraw (arrows are the sheet's, Enter the page's).
          scroll.focus({ preventScroll: true })
          picks = picks.filter((q) => q !== p)
          changed()
        })
        frag.append(badge)
      }
      if (p === lastPick && p.r1 === r1 && p.c1 === c1) {
        const handle = document.createElement('div')
        handle.className = 'xlsx-handle'
        handle.style.cssText = `left:${x1}px;top:${y1}px`
        frag.append(handle)
      }
    }
  }

  // ─── picks ───
  // The area a pick covers grows to take in every merged area it touches, as Excel's selection does.
  const settle = (p) => {
    let { r0, c0, r1, c1 } = boxOf(p.anchor, p.focus, p.kind)
    if (p.kind === 'cells') {
      for (let grew = true; grew; ) {
        grew = false
        for (const m of sheet.merges) {
          if (m.r1 < r0 || m.r0 > r1 || m.c1 < c0 || m.c0 > c1) continue
          if (m.r0 < r0 || m.r1 > r1 || m.c0 < c0 || m.c1 > c1) {
            r0 = Math.min(r0, m.r0)
            c0 = Math.min(c0, m.c0)
            r1 = Math.max(r1, m.r1)
            c1 = Math.max(c1, m.c1)
            grew = true
          }
        }
      }
    }
    Object.assign(p, { r0, c0, r1, c1 })
    const m = p.kind === 'cells' ? sheet.merged(r0, c0) : null
    p.merged = m && m.r0 === r0 && m.c0 === c0 && m.r1 === r1 && m.c1 === c1 && (m.r0 !== m.r1 || m.c0 !== m.c1) ? formatRange(null, m) : null
    p.key = `${p.sheet}!${p.kind}!${formatRange(null, p)}`
    return p
  }
  const boxOf = (a, f, kind) => {
    if (kind === 'sheet') return { r0: 0, c0: 0, r1: MAX_ROWS - 1, c1: MAX_COLS - 1 }
    if (kind === 'cols') return { r0: 0, c0: Math.min(a.c, f.c), r1: MAX_ROWS - 1, c1: Math.max(a.c, f.c) }
    if (kind === 'rows') return { r0: Math.min(a.r, f.r), c0: 0, r1: Math.max(a.r, f.r), c1: MAX_COLS - 1 }
    return { r0: Math.min(a.r, f.r), c0: Math.min(a.c, f.c), r1: Math.max(a.r, f.r), c1: Math.max(a.c, f.c) }
  }
  const newPick = (kind, at) => settle({ sheet: current.name, kind, anchor: { ...at }, focus: { ...at } })
  const changed = () => {
    draw()
    renderTabs()
    onPicks(picks.slice())
  }
  const sameAs = (p, q) => p.key === q.key
  const toggle = (p) => {
    const at = picks.findIndex((q) => sameAs(q, p))
    if (at >= 0) picks = picks.filter((_, i) => i !== at)
    else picks = [...picks, p]
    changed()
  }

  // ─── where a point is ───
  const hitAt = (clientX, clientY) => {
    const rect = scroll.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const inHeadRow = y < HH
    const inHeadCol = x < g.HW
    const sx = x - g.HW < g.frozenW ? x - g.HW : x - g.HW + scroll.scrollLeft
    const sy = y - HH < g.frozenH ? y - HH : y - HH + scroll.scrollTop
    const c = Math.min(g.cols - 1, find(g.lefts, Math.max(0, sx)))
    const r = Math.min(g.rows - 1, find(g.tops, Math.max(0, sy)))
    if (inHeadRow && inHeadCol) return { zone: 'corner', r: 0, c: 0 }
    if (inHeadRow) return { zone: 'cols', r: 0, c }
    if (inHeadCol) return { zone: 'rows', r, c: 0 }
    return { zone: 'cells', r, c }
  }
  const kindOf = (zone) => (zone === 'corner' ? 'sheet' : zone)
  const moveFocus = (p, hit) => {
    p.focus = { r: hit.r, c: hit.c }
    settle(p)
    draw()
  }
  // Near an edge while dragging: scroll on, the range following.
  let edgeTimer = 0
  const edgeScroll = (e, p) => {
    clearInterval(edgeTimer)
    const rect = scroll.getBoundingClientRect()
    const dx = e.clientX < rect.left + g.HW + 10 ? -20 : e.clientX > rect.right - 10 ? 20 : 0
    const dy = e.clientY < rect.top + HH + 10 ? -20 : e.clientY > rect.bottom - 10 ? 20 : 0
    if (!dx && !dy) return
    edgeTimer = setInterval(() => {
      scroll.scrollBy(dx, dy)
      moveFocus(p, hitAt(e.clientX, e.clientY))
    }, 30)
  }

  // A mouse or pen: down picks (or extends, or adds), a drag stretches, up ends it.
  scroll.addEventListener('pointerdown', () => {
    if (!found) return
    found = null
    draw()
  }, { capture: true })
  scroll.addEventListener('pointerdown', (down) => {
    if (down.pointerType === 'touch' || down.button !== 0 || down.target.closest('.xlsx-badge')) return
    const hit = hitAt(down.clientX, down.clientY)
    const onHandle = !!down.target.closest('.xlsx-handle')
    const last = picks.at(-1)
    let p
    if ((down.shiftKey || onHandle) && last && last.sheet === current.name && (onHandle || kindOf(hit.zone) === last.kind || hit.zone === 'cells')) {
      p = last
      if (!onHandle && kindOf(hit.zone) !== p.kind && p.kind !== 'cells') p.kind = 'cells'
      moveFocus(p, hit)
    } else {
      p = newPick(kindOf(hit.zone), hit)
      if (down.metaKey || down.ctrlKey) picks = [...picks, p]
      else picks = [p]
      draw()
    }
    down.preventDefault()
    scroll.focus({ preventScroll: true })
    dragging = true
    scroll.setPointerCapture?.(down.pointerId)
    const move = (e) => {
      moveFocus(p, hitAt(e.clientX, e.clientY))
      edgeScroll(e, p)
    }
    const end = () => {
      clearInterval(edgeTimer)
      scroll.removeEventListener('pointermove', move)
      scroll.removeEventListener('pointerup', end)
      scroll.removeEventListener('pointercancel', end)
      dragging = false
      changed()
    }
    scroll.addEventListener('pointermove', move)
    scroll.addEventListener('pointerup', end)
    scroll.addEventListener('pointercancel', end)
  })

  // A finger: a tap adds (or takes back) a cell, a row or a column; a long press then a drag adds a range; the round
  // handle resizes the last one; any other drag scrolls, as always.
  scroll.addEventListener(
    'touchstart',
    (start) => {
      if (start.touches.length !== 1 || start.target.closest('.xlsx-badge')) return
      const t0 = start.touches[0]
      const hit = hitAt(t0.clientX, t0.clientY)
      const onHandle = !!start.target.closest('.xlsx-handle')
      let p = null
      let moved = false
      let timer = 0
      const begin = (pick) => {
        p = pick
        dragging = true
        navigator.vibrate?.(10)
      }
      if (onHandle && picks.length && picks.at(-1).sheet === current.name) {
        start.preventDefault()
        begin(picks.at(-1))
      } else
        timer = setTimeout(() => {
          const fresh = newPick(kindOf(hit.zone), hit)
          picks = [...picks, fresh]
          begin(fresh)
          draw()
        }, LONG_PRESS)
      const move = (e) => {
        const touch = e.touches[0]
        if (!p) {
          if (Math.hypot(touch.clientX - t0.clientX, touch.clientY - t0.clientY) > 8) {
            moved = true
            clearTimeout(timer)
          }
          return
        }
        e.preventDefault()
        moveFocus(p, hitAt(touch.clientX, touch.clientY))
      }
      // A touch's events go to the element it started on, even once a redraw took that cell out of the page (the long
      // press draws its pick) — and then they no longer reach the sheet: they are heard on that element itself.
      const on = start.target
      const end = (e) => {
        clearTimeout(timer)
        on.removeEventListener('touchmove', move)
        on.removeEventListener('touchend', end)
        on.removeEventListener('touchcancel', end)
        if (p) {
          dragging = false
          changed()
          return
        }
        if (moved || e.type === 'touchcancel') return
        e.preventDefault()
        toggle(newPick(kindOf(hit.zone), hit))
      }
      on.addEventListener('touchmove', move, { passive: false })
      on.addEventListener('touchend', end)
      on.addEventListener('touchcancel', end)
    },
    { passive: false },
  )

  // Keys, as a spreadsheet's: arrows move, Shift + arrows extend, ⌘/Ctrl + A the sheet (Esc and Enter: the page's).
  scroll.addEventListener('keydown', (e) => {
    const last = picks.at(-1)
    const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key]
    if (step || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a')) found = null
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      picks = [newPick('sheet', { r: 0, c: 0 })]
      changed()
    } else if (step) {
      const from = last && last.sheet === current.name ? last.focus : { r: 0, c: 0 }
      const to = { r: Math.min(g.rows - 1, Math.max(0, from.r + step[0])), c: Math.min(g.cols - 1, Math.max(0, from.c + step[1])) }
      if (e.shiftKey && last && last.sheet === current.name) {
        if (last.kind !== 'cells') last.kind = 'cells'
        last.focus = to
        settle(last)
      } else picks = [newPick('cells', to)]
      scrollToCell(to)
      changed()
    } else return
    e.preventDefault()
  })
  const scrollToCell = ({ r, c }) => {
    const y = g.tops[r]
    const x = g.lefts[c]
    if (y < scroll.scrollTop + g.frozenH) scroll.scrollTop = y - g.frozenH
    else if (g.tops[r + 1] > scroll.scrollTop + scroll.clientHeight - HH) scroll.scrollTop = g.tops[r + 1] - scroll.clientHeight + HH
    if (x < scroll.scrollLeft + g.frozenW) scroll.scrollLeft = x - g.frozenW
    else if (g.lefts[c + 1] > scroll.scrollLeft + scroll.clientWidth - g.HW) scroll.scrollLeft = g.lefts[c + 1] - scroll.clientWidth + g.HW
  }

  // ─── the sheet's surroundings: its ⓘ, the tabs ───
  // {n} the count; {s} English's plural s, gone for 1.
  const counted = (text, n) => text.replace('{n}', String(n)).replace('{s}', n === 1 ? '' : 's')
  const renderNote = () => {
    const said = []
    if (sheet.pending) said.push(counted(t.xlsxPending, sheet.pending))
    const { charts, pictures } = sheet.notDrawn
    const what = [charts && counted(t.xlsxCharts, charts), pictures && counted(t.xlsxPictures, pictures)].filter(Boolean)
    if (what.length) said.push(t.xlsxNotDrawn.replace('{what}', what.join(t.xlsxAnd)))
    const text = said.join(' ')
    if (!text && aboutText.dataset.open) aboutText.hidePopover()
    aboutText.textContent = text
    about.hidden = !text
    note.hidden = true
    // The bar is there for two sheets or more, or for its ⓘ.
    tabs.hidden = shown.length < 2 && about.hidden
  }
  const renderTabs = () => {
    tabList.replaceChildren()
    tabs.hidden = shown.length < 2 && about.hidden
    if (shown.length < 2) return
    const frag = document.createDocumentFragment()
    for (const info of shown) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = info === current ? 'xlsx-tab current' : 'xlsx-tab'
      const n = picks.filter((p) => p.sheet === info.name).length
      b.textContent = n ? `${info.name} ·${n}` : info.name
      b.onclick = () => {
        scroll.focus({ preventScroll: true })
        showSheet(info).catch((error) => {
          note.hidden = false
          note.textContent = error.message
        })
      }
      frag.append(b)
    }
    tabList.replaceChildren(frag)
  }
  const sizeSpace = () => {
    space.style.width = `${g.HW + g.lefts[g.cols]}px`
    space.style.height = `${HH + g.tops[g.rows]}px`
    corner.replaceChildren(headerEl('', `left:0;top:0;width:${g.HW}px;height:${HH}px`, false))
  }
  const showSheet = async (info, at = null) => {
    sheet = await loadSheet(info)
    current = info
    layout()
    sizeSpace()
    renderNote()
    renderTabs()
    scroll.scrollTop = at?.st ?? 0
    scroll.scrollLeft = at?.sl ?? 0
    draw()
  }

  layout()
  sizeSpace()
  renderNote()
  renderTabs()
  if (!wanted()) return null
  // A new version replacing the one on screen: where the person was, and what changed among the cells they saw.
  if (before && before.sheet === current.name) flash = before.texts
  host.classList.add('xlsx-host')
  host.replaceChildren(root)
  scroll.scrollTop = before?.sheet === current.name ? before.st : 0
  scroll.scrollLeft = before?.sheet === current.name ? before.sl : 0
  draw()

  return Object.assign(view, {
    sheets: shown.length,
    picks: () => picks.slice(),
    clear() {
      picks = []
      changed()
    },
    /**
     * No mark for the bar to sit by: a sheet's cells fill the panel, and by a pick the bar covers the cell picked next
     * (the 10-15 A/B: ⌘ on C3 after B2 landed on the bar). The page keeps it at the bottom, in the room left for it.
     */
    anchor: () => null,
    /** A range being dragged right now: replacing the sheet would drop it. */
    dragging: () => dragging,
    /** What a view of the next version takes over (its `previous`): the sheet and scroll on screen, the cells' texts. */
    keep: () => last,
    /**
     * Where a pill points (`query`: its `at` as refOf wrote it, `{ range }`): its sheet shown, the range scrolled to and
     * framed — a merged area whole, cut to what the sheet draws — until the next press or key on the sheet; a sheet's
     * name alone shows that sheet. Resolves to true; false when the address reads as none, this version has no such
     * sheet or the place lies past all the sheet draws; 'hidden' when its sheet is one Excel hides (an agent still reads
     * it). The page says which. A place that came after this one wins: this one then frames nothing.
     */
    async reveal(query) {
      const ticket = ++revealing
      // No such place: the last pill's frame goes too — left up beside "not found", it would read as the answer.
      const none = (said) => {
        found = null
        draw()
        return said
      }
      let place
      try {
        place = parseRange(query?.range)
      } catch {
        return none(false)
      }
      const name = place.sheet ?? current.name
      const info = shown.find((s) => s.name === name)
      // Hidden: a sheet with cells Excel hides (an agent still reads it). A chartsheet, a dialog sheet, a sheet whose part
      // is missing has no cells: not found.
      if (!info) return none(book.sheets.some((s) => s.name === name && s.part) ? 'hidden' : false)
      // A sheet that will not read: said — unless a newer place came meanwhile (that one is the answer now).
      let target
      try {
        target = await loadSheet(info)
      } catch (error) {
        if (ticket !== revealing) return true
        throw error
      }
      if (ticket !== revealing) return true
      const { rows, cols } = extentOf(target)
      if (place.kind !== 'sheet' && (place.r0 >= rows || place.c0 >= cols)) return none(false)
      found = null
      try {
        if (info !== current) await showSheet(info)
      } catch (error) {
        if (ticket !== revealing) return true
        throw error
      }
      if (ticket !== revealing) return true
      if (place.kind !== 'sheet') {
        let box = { r0: place.r0, c0: place.c0, r1: place.r1, c1: place.c1 }
        const m = place.kind === 'cells' && box.r0 === box.r1 && box.c0 === box.c1 ? sheet.merged(box.r0, box.c0) : null
        if (m && m.r0 === box.r0 && m.c0 === box.c0) box = { r0: m.r0, c0: m.c0, r1: m.r1, c1: m.c1 }
        found = { sheet: info.name, ...box }
        scrollToCell({ r: box.r0, c: box.c0 })
      }
      draw()
      return true
    },
    destroy() {
      clearInterval(edgeTimer)
      cancelAnimationFrame(raf)
      resized?.disconnect()
      root.remove()
      if (!host.querySelector('.xlsx-book')) host.classList.remove('xlsx-host')
    },
  })
}

/**
 * `popup` the popover `button` opens: a click, a press outside and Escape are the browser's (popover="auto"); a mouse
 * resting on the button 150 ms opens it too and leaving takes it away again — unless a click made it stay, as gugu's
 * infotip does (the settings pages' ⓘ). Placed by CSS, on the button (style.css .xlsx-about-text).
 */
function infotip(button, popup) {
  popup.popover = 'auto'
  button.popoverTargetElement = popup
  let timer = 0
  let byHover = false
  button.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return
    timer = setTimeout(() => {
      if (popup.dataset.open) return
      popup.showPopover?.()
      byHover = true
    }, 150)
  })
  button.addEventListener('pointerleave', () => {
    clearTimeout(timer)
    if (byHover && popup.dataset.open) popup.hidePopover()
    byHover = false
  })
  // A click on what hover opened keeps it open (no toggle back to closed). A hover still counting down is the click's:
  // left to run, it would open again what the click just closed (review of 2ab5185db2).
  button.addEventListener('click', (event) => {
    clearTimeout(timer)
    if (!byHover) return
    byHover = false
    event.preventDefault()
  })
  // Open or not, as the browser says (a press outside and Escape close it without this code).
  popup.addEventListener('toggle', (event) => {
    if (event.newState === 'open') popup.dataset.open = '1'
    else delete popup.dataset.open
    if (event.newState !== 'open') byHover = false
  })
}

/** The notes (comments) of a sheet: "r:c" → its text. */
async function notesOf(text, rels) {
  const out = new Map()
  const part = rels.find((r) => r.type === 'comments')?.target
  const xml = part ? await text(part) : null
  if (!xml) return out
  for (const m of xml.matchAll(/<(?:[\w.-]+:)?comment\b[^>]*\bref="([^"]+)"[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?comment>/g)) {
    const at = parseCell(m[1])
    if (!at) continue
    out.set(`${at.r}:${at.c}`, [...m[2].matchAll(/<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/g)].map((x) => unescape(x[1])).join(''))
  }
  return out
}

/** What this page does not draw on a sheet, said rather than dropped: its charts and pictures. */
async function notDrawnOf(text, rels) {
  const part = rels.find((r) => r.type === 'drawing')?.target
  const xml = part ? await text(part) : null
  if (!xml) return { charts: 0, pictures: 0 }
  return { charts: (xml.match(/<(?:[\w.-]+:)?chart\b[^>]*\br:id=/g) ?? []).length, pictures: (xml.match(/<(?:[\w.-]+:)?pic\b/g) ?? []).length }
}
