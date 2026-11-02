// Drawing a query's result as a view (spec.js): Observable Plot for charts, a plain table, or the KPI figures.
// Values are untrusted: they only ever become text (textContent, SVG text through Plot), never markup.
import { Plot } from '../vendor/plot.js'

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
    host.append(el('gugu-empty', { icon: 'table' }, el('strong', { text: 'No rows' }), el('small', { text: 'The query returned nothing' })))
    return
  }
  if (view.kind === 'table') return host.append(table(result))
  if (view.kind === 'kpi') return host.append(kpi(result))
  host.append(chart(view, result, size))
}

function table({ columns, rows }) {
  let sorted = rows
  let by = -1
  let dir = 1
  const body = el('tbody')
  const fill = () => body.replaceChildren(...sorted.map((row) => el('tr', {}, ...row.map((v) => el('td', { text: show(v), class: typeof v === 'number' ? 'num' : '' })))))
  const heads = columns.map((c, i) => {
    const th = el('th', { scope: 'col', 'aria-sort': 'none' }, el('button', { type: 'button', class: 'sort', text: c, onclick: () => {
      dir = by === i ? -dir : 1
      by = i
      sorted = [...rows].sort((a, b) => compare(a[i], b[i]) * dir)
      for (const h of heads) h.setAttribute('aria-sort', 'none')
      th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending')
      fill()
    } }))
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

function chart(view, result, { width, height }) {
  const dates = datesIn(result, [view.x, view.y])
  const data = objectsOf(result, dates)
  const { x, y, color, value } = view
  const categories = new Set(data.map((d) => d[x])).size
  const longLabels = data.some((d) => String(d[x]).length > 6)
  const base = { width, height, style: { background: 'transparent', color: 'var(--em-foreground)', fontSize: '11px' }, marginLeft: 48, marginBottom: 32 }
  const tip = { tip: true }
  let marks
  let options = {}
  if (view.kind === 'bar') {
    const horizontal = !dates.has(x) && (categories > 8 || longLabels)
    if (horizontal) {
      options = { marginLeft: Math.min(140, 12 + 7 * Math.max(...data.map((d) => String(d[x]).length))), x: { grid: true, label: y }, y: { label: null } }
      marks = [Plot.barX(data, { y: x, x: y, fill: color ?? 'currentColor', sort: color ? undefined : { y: '-x' }, ...tip }), Plot.ruleX([0])]
    } else {
      options = { y: { grid: true, label: y }, x: { label: x } }
      marks = [Plot.barY(data, { x, y, fill: color ?? 'currentColor', ...tip }), Plot.ruleY([0])]
    }
  } else if (view.kind === 'line') {
    options = { y: { grid: true, label: y }, x: { label: x } }
    marks = [Plot.lineY(data, { x, y, stroke: color ?? 'currentColor', ...tip }), Plot.dotY(data, { x, y, fill: color ?? 'currentColor', r: 2 })]
  } else if (view.kind === 'scatter') {
    options = { grid: true, x: { label: x }, y: { label: y } }
    marks = [Plot.dot(data, { x, y, fill: color ?? 'currentColor', r: 3, ...tip })]
  } else if (view.kind === 'heatmap') {
    options = { padding: 0.05, x: { label: x }, y: { label: y }, color: { scheme: 'blues', legend: true } }
    marks = [Plot.cell(data, { x, y, fill: value, inset: 0.5, ...tip }), Plot.text(data, { x, y, text: (d) => (typeof d[value] === 'number' ? compact.format(d[value]) : show(d[value])), fill: 'currentColor' })]
  }
  if (color && view.kind !== 'heatmap') options.color = { legend: true }
  return Plot.plot({ ...base, ...options, marks })
}
