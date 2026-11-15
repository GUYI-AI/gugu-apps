// 协作看板 in a message: the board's counts and the first question waiting on the owner, read from the board file when
// shown — the message's own data names only the file (`{ board: <file id> }`), so a card sent this morning shows the
// board as it is now. A card sent by 1.x carries the same data. A click opens the board.
import { asCurrent, groups } from './lib/core.js'
import { findBoard } from './lib/chat-board.js'

const g = window.gugu
const $ = (id) => document.getElementById(id)
const ctx = await g.getContext()
const WORDS = {
  zh: { title: '协作看板', owner: '等你', progress: '进行中', waiting: '等别的', none: '还没有卡片', gone: '这块看板已不可用', asks: (c) => `等你：${c.title} — ${c.wait.question}` },
  en: { title: 'Teamboard', owner: 'Waiting on you', progress: 'In progress', waiting: 'Waiting', none: 'No cards yet', gone: 'This board is no longer available', asks: (c) => `Waiting on you: ${c.title} — ${c.wait.question}` },
}
const wordsFor = (locale) => WORDS[String(locale ?? '').startsWith('zh') ? 'zh' : 'en']
let t = wordsFor(ctx.locale)
let shown = null

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) if (key === 'text') el.textContent = value; else el.setAttribute(key, String(value))
  for (const kid of kids) el.append(kid)
  return el
}

// Anyone in the chat can send a card with any data: only a file id is taken from it, and only to open it.
const named = typeof ctx.widget?.data?.board === 'string' && /^[\w-]{1,80}$/.test(ctx.widget.data.board) ? ctx.widget.data.board : null
let boardId = named

function draw(board) {
  shown = board
  $('title').textContent = t.title
  const gr = groups(board)
  const num = (n, label, cls) => h('span', { class: `num ${cls}${n ? '' : ' zero'}` }, h('b', { text: String(n) }), label)
  $('nums').replaceChildren(num(gr.owner.length, t.owner, 'owner'), num(gr.progress.length, t.progress, 'progress'), num(gr.waiting.length, t.waiting, 'waiting'))
  $('first').textContent = gr.owner[0] ? t.asks(gr.owner[0]) : Object.keys(board.cards).length ? '' : t.none
  $('card').setAttribute('aria-label', `${t.title} · ${gr.owner.length} ${t.owner} · ${gr.progress.length} ${t.progress} · ${gr.waiting.length} ${t.waiting}`)
}

$('card').addEventListener('click', async () => {
  try {
    await g.openLink(await g.linkTo({ kind: 'app', tab: 'board', ...(ctx.chat ? { chat: ctx.chat.id } : {}), ...(boardId ? { query: { board: boardId } } : {}) }))
  } catch (error) {
    $('sub').textContent = error?.message ?? String(error)
    g.reportError?.(error?.message ?? String(error))
  }
})

draw(asCurrent(null))
try {
  // Read only: a card shown in a chat with no board makes none.
  const entry = named ? { id: named, ...(ctx.chat ? { chat: ctx.chat.id } : {}) } : ctx.chat ? await findBoard(g.files, ctx.chat.id) : null
  if (entry) {
    const f = await g.files.open(entry)
    boardId = f.entry.id
    draw(asCurrent(f.toJSON()))
    f.onChange(() => draw(asCurrent(f.toJSON())))
  }
} catch (error) {
  $('card').classList.add('problem')
  $('sub').textContent = error?.code === 'not-found' || error?.code === 'denied' ? t.gone : error?.message ?? String(error)
}

g.onContextChanged?.(async () => {
  t = wordsFor((await g.getContext()).locale)
  if (shown) draw(shown)
})
