// The explore page: a chat's data file opened with Data Lens (its claim on .csv / .xlsx / .sqlite …). Every table and
// column, a query box, and the same views a card draws. A person who likes a view asks an agent to send it as a card:
// the draft carries the exact card data, the person presses Send.
import { checkView, viewOf, VIEW_KINDS } from './lib/spec.js'
import { Lens } from './lib/lens.js'
import { draw, el, show } from './lib/view.js'
import { readFile } from './lib/files.js'
import { quote } from './lib/sql-text.js'
import { setLocale, t } from './lib/text.js'

const root = document.body
const lens = new Lens()
let ctx
let entry
let version
let tables = []
let result = null

const sqlBox = el('textarea', { rows: '4', spellcheck: 'false', 'aria-label': 'SQL' })
const kindPick = el('select', { 'aria-label': 'View' }, ...VIEW_KINDS.map((k) => el('option', { value: k, text: k })))
const fields = Object.fromEntries(['x', 'y', 'color', 'value'].map((f) => [f, el('select', { 'aria-label': f })]))
const stage = el('div', { class: 'stage explore-stage' })
const status = el('p', { role: 'status', class: 'muted' })
const schema = el('details', {}, el('summary', { text: t('table') }))

function say(text, role = 'status') {
  status.setAttribute('role', role)
  status.textContent = text
}

function currentView() {
  const view = { kind: kindPick.value }
  for (const [f, select] of Object.entries(fields)) if (select.value) view[f] = select.value
  return viewOf(view)
}

function fillFields(columns) {
  for (const [f, select] of Object.entries(fields)) {
    const was = select.value
    select.replaceChildren(el('option', { value: '', text: `${f}: —` }), ...columns.map((c) => el('option', { value: c, text: `${f}: ${c}` })))
    select.value = columns.includes(was) ? was : ''
  }
  if (!fields.x.value && columns[0]) fields.x.value = columns[0]
  if (!fields.y.value && columns[1]) fields.y.value = columns[1]
}

function repaint() {
  if (!result) return
  try {
    draw(stage, checkView(currentView(), result.columns), result, { width: stage.clientWidth, height: Math.max(280, stage.clientHeight) })
  } catch (error) {
    stage.replaceChildren(el('p', { role: 'alert', text: error.message }))
  }
}

async function run() {
  say(t('querying'))
  try {
    result = await lens.query(sqlBox.value)
    fillFields(result.columns)
    say([t('rows', show(result.rows.length)), result.truncated ? t('truncated', show(result.rows.length)) : null].filter(Boolean).join(' · '))
    repaint()
  } catch (error) {
    result = null
    stage.replaceChildren()
    say(error.message, 'alert')
  }
}

function askForCard() {
  const data = { file: `gugu-file://${entry.id}?v=${version}`, sql: sqlBox.value.trim(), view: currentView() }
  gugu.dispatch(t('cardDraft', entry.name, JSON.stringify(data)), { draft: true, to: { chat: ctx.chat.id }, refs: [{ file: entry }] })
    .catch((error) => say(error.message, 'alert'))
}

function drawSchema() {
  schema.replaceChildren(el('summary', { text: `${t('table')} (${tables.length})` }), el('ul', { class: 'list' }, ...tables.map((table) =>
    el('li', {}, el('button', { type: 'button', onclick: () => { sqlBox.value = `SELECT * FROM ${quote(table.name)} LIMIT 200`; run() } },
      el('div', {}, el('strong', { text: `${table.name} · ${t('rows', show(table.rows))}` }),
        el('span', { text: table.columns.map((c) => `${c.name} ${c.type}`).join(', ') })))))))
}

try {
  ctx = await gugu.getContext()
  setLocale(ctx.locale)
  if (!ctx.file) throw new Error(t('pick'))
  say(t('loading'))
  root.replaceChildren(el('div', { class: 'stack explore' }, schema,
    el('label', {}, t('sql'), sqlBox),
    el('div', { class: 'row' }, el('button', { type: 'button', class: 'primary', onclick: run }, t('run')), kindPick, ...Object.values(fields)),
    status, stage,
    el('div', { class: 'row' }, el('button', { type: 'button', onclick: askForCard }, el('gugu-icon', { name: 'send' }), t('send')))))
  const read = await readFile(ctx.file)
  entry = read.entry
  version = read.version
  tables = await lens.load(entry.name, read.content)
  drawSchema()
  const first = tables.find((x) => x.name === 't') ?? tables[0]
  sqlBox.value = first ? `SELECT * FROM ${quote(first.name)} LIMIT 200` : ''
  kindPick.addEventListener('change', repaint)
  for (const select of Object.values(fields)) select.addEventListener('change', repaint)
  new ResizeObserver(() => repaint()).observe(stage)
  if (first) await run()
} catch (error) {
  say(error.message ?? String(error), 'alert')
}
