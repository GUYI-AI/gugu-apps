// Drawing a query's result as a view (spec.js): Observable Plot for charts, a plain table, or the KPI figures.
// Values are untrusted: they only ever become text (textContent, SVG text through Plot), never markup.
import { Plot } from '../vendor/plot.js'
import { t } from './text.js'

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })

export const show = (v) => (v === null || v === undefined ? '' : typeof v === 'number' ? number.format(v) : String(v))

export function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') node.textContent = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value)
  }
  node.append(...kids.filter((k) => k !== null && k !== undefined))
  return node
}

/** Rows as objects keyed by column, ISO dates as Dates (so a line over time reads as time). */
function objectsOf({ columns, rows }, dateColumns) {
  return rows.map((row) => Object.fromEntries(columns.map((c, i) => [c, dateColumns.has(c) ? new Date(row[i]) : row[i]])))
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/
function datesIn({ columns, rows }, candidates) {
  return new Set(candidates.filter((c) => {
    if (!c) return false
    const i = columns.indexOf(c)
    const values = rows.map((r) => r[i]).filter((v) => v !== null)
    return values.length > 0 && values.every((v) => typeof v === 'string' && ISO_DATE.test(v))
  }))
}

/** Draws into `host` (emptied first). `size`: { width, height } of the room the view has. */
export function draw(host, view, result, size) {
  host.replaceChildren()
  if (!result.rows.length) {
    host.append(el('gugu-empty', { icon: 'table' }, el('strong', { text: t('noRows') }), el('small', { text: t('noRowsHint') })))
    return
  }
  if (view.kind === 'table') return host.append(table(result))
  if (view.kind === 'kpi') return host.append(kpi(result))
  host.append(chart(view, result, size, inks(host)))
}

/**
 * gugu's colours as values: Plot draws with them and interpolates between them, which a CSS variable cannot do. Read on
 * every draw, so a theme change is followed on the next paint. One ink ramp, no hues of the App's own (the owner decides
 * on data hues for every App: --em-data-* does not exist yet).
 */
function inks(host) {
  const css = getComputedStyle(host)
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback
  return {
    fg: v('--em-foreground', 'currentColor'), muted: v('--em-foreground-muted', 'currentColor'), passive: v('--em-foreground-passive', 'currentColor'),
    border: v('--em-border', 'currentColor'), bg: v('--em-background', 'white'), low: v('--em-background-3', '#eee'),
    font: v('--em-font-caption', '12px'),
  }
}

/** Series beyond these three inks are not told apart: the view says so instead of drawing them alike. */
const SERIES = 3

function table({ columns, rows }) {
  let sorted = rows
  let by = -1
  let dir = 1
  const body = el('tbody')
  // An identifier or a year is a number but no amount: no digit grouping (59900, not 59,900), still right-aligned.
  const plain = columns.map((c) => /(^|_)(id|no|year)$|id$|号$|编号|年份?$/i.test(c))
  const fill = () => body.replaceChildren(...sorted.map((row) => el('tr', {}, ...row.map((v, i) =>
    el('td', { text: plain[i] && Number.isInteger(v) ? String(v) : show(v), class: typeof v === 'number' ? 'num' : '' })))))
  const heads = columns.map((c, i) => {
    const arrow = el('gugu-icon', { name: 'arrow-up', 'aria-hidden': 'true' })
    const th = el('th', { scope: 'col', 'aria-sort': 'none' }, el('button', { type: 'button', class: 'sort', onclick: () => {
      dir = by === i ? -dir : 1
      by = i
      sorted = [...rows].sort((a, b) => compare(a[i], b[i]) * dir)
      for (const h of heads) h.setAttribute('aria-sort', 'none')
      th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending')
      arrow.setAttribute('name', dir > 0 ? 'arrow-up' : 'arrow-down')
      fill()
    } }, c, arrow))
    return th
  })
  fill()
  return el('div', { class: 'table-scroll' }, el('table', {}, el('thead', {}, el('tr', {}, ...heads)), body))
}

function compare(a, b) {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
}

function kpi({ columns, rows }) {
  const [first] = rows
  return el('div', { class: 'kpis' }, ...columns.map((c, i) =>
    el('div', { class: 'kpi' }, el('small', { class: 'muted', text: c }), el('strong', { text: typeof first[i] === 'number' ? compact.format(first[i]) : show(first[i]), title: show(first[i]) }))))
}

function chart(view, result, { width, height }, ink) {
  const dates = datesIn(result, [view.x, view.y])
  const data = objectsOf(result, dates)
  const { x, y, color, value } = view
  const categories = new Set(data.map((d) => d[x])).size
  const longLabels = data.some((d) => String(d[x]).length > 6)
  if (color && view.kind !== 'heatmap' && new Set(data.map((d) => d[color])).size > SERIES) {
    return el('gugu-empty', { icon: 'table' }, el('strong', { text: t('manySeries', SERIES) }), el('small', { text: t('manySeriesHint') }))
  }
  const base = { width, height, style: { background: 'transparent', color: ink.muted, fontSize: ink.font }, marginLeft: 48, marginBottom: 32 }
  const mark = color ?? ink.muted
  const tip = { tip: true }
  // Categories in the order the query returned them (its ORDER BY), not alphabetical; numbers in short form (25万, 250K)
  // so a 420 px card never clips an axis label.
  const ordinal = (key) => (dates.has(key) || data.every((d) => typeof d[key] === 'number' || d[key] === null) ? {} : { domain: [...new Set(data.map((d) => d[key]))] })
  const amount = { grid: true, tickFormat: (v) => compact.format(v) }
  const rule = { stroke: ink.border }
  let marks
  let options = {}
  if (view.kind === 'bar') {
    const horizontal = !dates.has(x) && (categories > 8 || longLabels)
    if (horizontal) {
      options = { marginLeft: Math.min(140, 12 + 7 * Math.max(...data.map((d) => String(d[x]).length))), x: { ...amount, label: y }, y: { ...ordinal(x), label: null } }
      marks = [Plot.barX(data, { y: x, x: y, fill: mark, ...tip }), Plot.ruleX([0], rule)]
    } else {
      options = { y: { ...amount, label: y }, x: { ...ordinal(x), label: null } }
      marks = [Plot.barY(data, { x, y, fill: mark, ...tip }), Plot.ruleY([0], rule)]
    }
  } else if (view.kind === 'line') {
    options = { y: { ...amount, label: y }, x: { ...ordinal(x), label: x } }
    // Dots while each point can be told apart; past ~30 only the line (the tip still names each point).
    marks = [Plot.lineY(data, { x, y, stroke: color ?? ink.fg, ...tip }), data.length <= 30 ? Plot.dotY(data, { x, y, fill: color ?? ink.fg, r: 2 }) : null]
  } else if (view.kind === 'scatter') {
    options = { grid: true, x: { label: x, tickFormat: amount.tickFormat }, y: { label: y, tickFormat: amount.tickFormat } }
    marks = [Plot.dot(data, { x, y, fill: color ?? ink.fg, r: 3, ...tip })]
  } else if (view.kind === 'heatmap') {
    // Every cell carries its value, so no legend: in a fixed-height card it would push the grid out of view.
    const values = data.map((d) => d[value]).filter((v) => typeof v === 'number')
    const middle = (Math.min(...values) + Math.max(...values)) / 2
    // A row at most 44 px high: a few rows stay cells, not slabs, and sit in the middle of the card.
    const rows = new Set(data.map((d) => d[y])).size
    options = { height: Math.min(height, 32 + 44 * rows), marginTop: 28, marginBottom: 4, padding: 0.05,
      marginLeft: Math.min(120, 16 + 7 * Math.max(...data.map((d) => String(d[y]).length))),
      x: { ...ordinal(x), label: null, axis: 'top' }, y: { ...ordinal(y), label: null }, color: { range: [ink.low, ink.fg], interpolate: 'rgb' } }
    const label = (d) => (typeof d[value] === 'number' ? compact.format(d[value]) : show(d[value]))
    marks = [Plot.cell(data, { x, y, fill: value, inset: 0.5, ...tip }),
      Plot.text(data.filter((d) => d[value] > middle), { x, y, text: label, fill: ink.bg }),
      Plot.text(data.filter((d) => !(d[value] > middle)), { x, y, text: label, fill: ink.fg })]
  }
  if (color && view.kind !== 'heatmap') {
    options.color = { legend: true, range: [ink.fg, ink.muted, ink.passive] }
    // Lines told apart by dash as well as ink: three inks are close in a light theme.
    if (view.kind === 'line') marks[0] = [...new Set(data.map((d) => d[color]))].map((series, i) =>
      Plot.lineY(data.filter((d) => d[color] === series), { x, y, stroke: color, strokeDasharray: [null, '6 3', '2 3'][i], ...tip }))
  }
  const plot = Plot.plot({ ...base, ...options, marks: marks.flat().filter(Boolean) })
  // Grid lines at the border's ink: Plot draws them in currentColor at a set opacity.
  for (const line of plot.querySelectorAll('g[aria-label$="grid"]')) line.setAttribute('stroke', ink.border), line.setAttribute('stroke-opacity', '1')
  return plot
}
