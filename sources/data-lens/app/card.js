// The card: one view of a chat's data file, inside a message. Its data (ctx.widget.data) names the file and version, the
// query and how to draw it (lib/spec.js); the card reads the file itself, on the viewer's device, and runs the query
// there. Opened as a tab instead (no ctx.widget), it lists the chat's data files to open one.
import { cardOf, checkView } from './lib/spec.js'
import { Lens } from './lib/lens.js'
import { draw, el, show } from './lib/view.js'
import { readFile } from './lib/files.js'
import { kindOf } from './lib/kinds.js'
import { setLocale, t } from './lib/text.js'

const root = document.body

function say(text, role = 'status') {
  root.replaceChildren(el('p', { role, class: 'notice', text }))
}

function failure(error) {
  if (error?.code === 'not-found' || error?.code === 'denied') return t('gone')
  if (error?.code === 'bad-card' || error?.code === 'bad-view') return `${t('badCard')}: ${error.message}`
  return error?.message ? `${t('failed')}: ${error.message}` : t('failed')
}

async function showCard(ctx) {
  const card = cardOf(ctx.widget.data)
  const ref = { chat: ctx.chat.id, id: card.id }
  say(t('loading'))
  const { entry, version, content } = await readFile(ref, card.version)
  const lens = new Lens()
  await lens.load(entry.name, content, card.sheet)
  say(t('querying'))
  const result = await lens.query(card.sql)
  lens.close()
  const view = checkView(card.view, result.columns)

  const meta = [entry.name, `v${version}`, t('rows', show(result.rows.length))]
  if (result.truncated) meta.push(t('truncated', show(result.rows.length)))
  const stage = el('div', { class: 'stage' })
  const actions = el('div', { class: 'row actions' },
    version !== entry.version ? el('small', { class: 'muted', text: t('newer', entry.version) }) : null,
    el('button', { type: 'button', onclick: () => gugu.files.openWith({ chat: ctx.chat.id, id: card.id }).catch(report) }, el('gugu-icon', { name: 'maximize-2' }), t('open')),
    el('button', { type: 'button', onclick: () => gugu.dispatch(t('askDraft', entry.name, card.sql), { draft: true, to: { chat: ctx.chat.id } }).catch(report) }, el('gugu-icon', { name: 'message-circle' }), t('ask')),
  )
  root.replaceChildren(el('article', { class: 'card-view', 'aria-label': view.title ?? entry.name },
    el('header', {}, el('strong', { text: view.title ?? entry.name }), el('small', { class: 'muted', text: meta.join(' · ') })),
    stage, actions))
  const paint = () => draw(stage, view, result, { width: stage.clientWidth, height: stage.clientHeight })
  paint()
  new ResizeObserver(() => paint()).observe(stage)
}

async function showPicker(ctx) {
  const entries = (await gugu.files.list({ chat: ctx.chat.id })).filter((e) => e.type !== 'folder' && kindOf(e.name))
  if (!entries.length) {
    root.replaceChildren(el('gugu-empty', { icon: 'table' }, el('strong', { text: t('none') }), el('small', { text: t('noneHint') })))
    return
  }
  root.replaceChildren(el('h3', { text: t('pick') }), el('ul', { class: 'list' }, ...entries.map((entry) =>
    el('li', {}, el('button', { type: 'button', onclick: () => gugu.files.openWith(entry).catch(report) },
      el('gugu-icon', { name: 'table' }), el('div', {}, el('strong', { text: entry.name }), el('span', { text: `v${entry.version}` })))))))
}

function report(error) {
  gugu.reportError?.(failure(error))
}

try {
  const ctx = await gugu.getContext()
  setLocale(ctx.locale)
  if (ctx.widget) await showCard(ctx)
  else await showPicker(ctx)
} catch (error) {
  say(failure(error), 'alert')
}
