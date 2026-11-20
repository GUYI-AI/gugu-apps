// 协作看板 · one card in a message (the `card` widget). The message's data names only the board file and the card
// ({ board, card }); everything shown is read from the board file and redrawn on each change, so the card in the chat
// follows the board. A click opens the board on that card, as a cited card's pill does.
import { asCurrent, stateOf, checksOf, holderName } from './lib/core.js'

const g = window.gugu
const $ = (id) => document.getElementById(id)
let ctx = await g.getContext()
const WORDS = {
  zh: { board: '协作看板', state: { owner: '等你', progress: '进行中', waiting: '等别的', unclaimed: '没人接', done: '完成' },
    next: '下一步：', asks: '问你：', wait: '等：', doneAt: '完成于 ', person: '成员', gone: '这张卡已不在看板上', lost: '这块看板已不可用' },
  en: { board: 'Teamboard', state: { owner: 'Waiting on you', progress: 'In progress', waiting: 'Waiting', unclaimed: 'Unclaimed', done: 'Done' },
    next: 'Next: ', asks: 'Asks you: ', wait: 'Waiting on: ', doneAt: 'Done ', person: 'A member', gone: 'This card is no longer on the board', lost: 'This board is no longer available' },
}
const wordsFor = (locale) => WORDS[String(locale ?? '').startsWith('zh') ? 'zh' : 'en']
let t = wordsFor(ctx.locale)

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) if (k === 'text') el.textContent = v; else if (k === 'class') el.className = v; else el.setAttribute(k, String(v))
  for (const kid of kids) if (kid) el.append(kid)
  return el
}
const pad = (n) => String(n).padStart(2, '0')
const when = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}` }

function sub(card, state) {
  if (state === 'owner') return `${t.asks}${card.wait.question}`
  if (state === 'waiting') return `${t.wait}${card.wait.what}`
  if (state === 'done') return `${t.doneAt}${when(card.doneAt)}`
  return card.next ? `${t.next}${card.next}` : null
}
function holder(card) {
  if (!card.holder) return null
  // The name only: the machine the board page adds would crowd out the checklist on one line.
  const name = card.holder === 'person' ? t.person : holderName({ ...card.holder, machine: undefined })
  return h('span', { class: 'row holder' }, h('span', { class: 'av', text: [...name][0]?.toUpperCase() ?? '?' }), h('span', { class: 'cap ell', text: name }))
}
function progress(card) {
  const all = checksOf(card)
  if (!all.length) return h('span', { class: 'grow' })
  const done = all.filter((c) => c.done).length
  const fill = h('i')
  fill.style.width = `${Math.round((100 * done) / all.length)}%`
  return h('span', { class: 'row grow' }, h('span', { class: 'bar' }, fill), h('span', { class: 'cap muted', text: `${done}/${all.length}` }))
}

// Anyone in the chat can send a card with any data: only ids are taken from it, and only to read and open.
const data = ctx.widget?.data ?? {}
const id = (v) => (typeof v === 'string' && /^[\w-]{1,80}$/.test(v) ? v : null)
const boardId = id(data.board), cardId = id(data.card)
let file = null, shown = null

function draw(board) {
  shown = board
  const el = $('card')
  const card = board?.cards[cardId]
  if (!card) {
    document.body.className = 'card-widget'
    el.replaceChildren(h('span', { class: 'gone muted', text: board ? t.gone : t.lost }))
    return
  }
  const state = stateOf(card)
  document.body.className = `card-widget s-${state}`
  el.setAttribute('aria-label', `${t.board} · ${card.title} · ${t.state[state]}`)
  const line = sub(card, state)
  el.replaceChildren(
    h('span', { class: 'row cap muted' }, h('img', { class: 'icon', src: 'icon.png', alt: '' }),
      h('span', { class: 'grow ell', text: ctx.chat?.name ? `${t.board} · ${ctx.chat.name}` : t.board }),
      h('span', { class: 'id', text: card.id }), h('span', { class: 'chip', text: t.state[state] })),
    h('span', { class: 'title', text: card.title }),
    h('span', { class: 'spacer' }),
    h('span', { class: 'row' }, holder(card), progress(card)),
    line ? h('span', { class: 'cap muted ell', text: line }) : null)
}

async function open() {
  if (!file) return
  try {
    await g.openLink(await g.linkTo({ kind: 'file', file: file.entry, at: { card: cardId } }))
  } catch (error) {
    g.reportError?.(error?.message ?? String(error))
  }
}
$('card').addEventListener('click', open)
$('card').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } })

try {
  if (!boardId || !cardId) throw Object.assign(new Error('no board'), { code: 'not-found' })
  file = await g.files.open({ id: boardId, ...(ctx.chat ? { chat: ctx.chat.id } : {}) })
  draw(asCurrent(file.toJSON()))
  file.onChange(() => draw(asCurrent(file.toJSON())))
} catch (error) {
  draw(null)
  if (error?.code !== 'not-found' && error?.code !== 'denied') g.reportError?.(error?.message ?? String(error))
}

g.onContextChanged?.(async () => {
  ctx = await g.getContext()
  t = wordsFor(ctx.locale)
  if (shown !== undefined) draw(shown)
})
