// 舰队 in a message: four numbers and the machines, read when the card is shown — the message's own data is fixed
// when sent and names only the board (`{ board: <file id> }`), so a card sent this morning still shows the fleet as it
// is now. Its text (previews, quotes) keeps the counts of the moment it was sent. A click opens the org chart.
import { filled, openChatBoard } from './lib/chat-board.js'
import { fleetOf } from './lib/fleet.js'
import { wordsFor } from './lib/fleet-text.js'

const g = window.gugu
const $ = (id) => document.getElementById(id)
const ctx = await g.getContext()
const t = wordsFor(ctx.locale)

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'text') el.textContent = value
    else el.setAttribute(key, String(value))
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid)
  return el
}

// Anyone in the chat can send a card with any data: only a file id is taken from it, and only to open it.
const named = typeof ctx.widget?.data?.board === 'string' && /^[\w-]{1,80}$/.test(ctx.widget.data.board) ? ctx.widget.data.board : null
let boardId = named
let board = null
let report = null
let boardProblem = null

function problem(text, ofBoard = false) {
  if (ofBoard) boardProblem = text
  $('card').classList.add('problem')
  $('sub').textContent = text
}

function draw() {
  $('title').textContent = t.title
  if (!report) return
  const fleet = fleetOf(report, board)
  const c = fleet.counts
  $('card').classList.remove('problem')
  $('sub').textContent = boardProblem ?? ''
  $('when').replaceChildren(h('span', { text: t.live }))
  const num = (n, label, tone) => h('span', { class: `num ${n ? `tone-${tone}` : 'zero'}` }, h('b', { text: String(n) }), label)
  $('nums').replaceChildren(
    num(c.running, t.counts.running, 'run'),
    num(c.owner, t.counts.owner, 'owner'),
    num(c.external, t.counts.external, 'ci'),
    num(c.error, t.counts.error, 'error'))
  // The machines in one line: how many, and only the ones that do not answer by name.
  const off = fleet.machines.filter((m) => !m.online)
  $('machines').replaceChildren(
    h('span', {}, h('i', { class: `dot ${off.length ? 'off' : 'on'}` }), t.machines(c.online, c.machines)),
    off.length ? h('span', { class: 'off', text: `${t.offline} ${off.map((m) => m.label ?? '?').join('、')}` }) : null,
    h('span', { class: 'go', text: `${t.open} ›` }))
  // The full count for screen readers and the right-click description: the same line the message's text would say.
  $('card').setAttribute('aria-label', `${t.title} · ${c.running} ${t.counts.running} · ${c.owner} ${t.counts.owner} · ${c.external} ${t.counts.external} · ${c.error} ${t.counts.error}`)
}

$('card').addEventListener('click', async () => {
  try {
    const link = await g.linkTo({ kind: 'app', tab: 'org', ...(ctx.chat ? { chat: ctx.chat.id } : {}), query: boardId ? { board: boardId } : {} })
    await g.openLink(link)
  } catch (error) {
    g.reportError?.(error?.message ?? String(error))
  }
})

draw()
try {
  const f = named
    ? filled(await g.files.open({ id: named, ...(ctx.chat ? { chat: ctx.chat.id } : {}) }))
    : ctx.chat ? await openChatBoard(g.files, ctx.chat.id) : null
  if (f) {
    boardId = f.entry.id
    board = f.toJSON()
    f.onChange(() => { board = f.toJSON(); draw() })
  }
} catch (error) {
  // The board gone or out of reach: the sessions still draw; say why the lanes' own words are missing.
  problem(error?.code === 'not-found' || error?.code === 'denied' ? t.cardGone : error?.message ?? String(error), true)
}
try {
  const answer = await g.listAgents({ report: true })
  report = Array.isArray(answer) ? { agents: answer, devices: [], unreached: [] } : answer
  draw()
} catch (error) {
  problem(error?.message ?? String(error))
}
