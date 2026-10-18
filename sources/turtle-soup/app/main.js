// 海龟汤's page. In a chat's side panel it is the lobby (this chat's rounds, and a new one); opened for a round file
// (`.turtle-soup.json`) it is that round. Players ask here; the host is an agent in the chat with this App's tools,
// woken by a whisper (gugu.send) when a question waits — the round file is what everyone sees, live.
import {
  FILE_SUFFIX, VERDICT_LABEL, MAX_QUESTION,
  newRound, questionsInOrder, pendingQuestions, checkQuestion, giveUpNeeded,
} from './game.js'

const $ = (sel) => document.querySelector(sel)
const status = $('#status')

/** An element with text (never markup: others wrote it) and children. */
function h(tag, props = {}, ...children) {
  const el = Object.assign(document.createElement(tag), props)
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c)
  return el
}

function say(message, kind = 'status') {
  status.setAttribute('role', kind)
  status.textContent = message ?? ''
}

function fail(what, e) {
  const message = `${what}：${e?.message ?? e}`
  say(message, 'alert')
  window.gugu.reportError(message).catch((err) => console.error('reportError failed', err)) // the line above shows it already
}

let ctx = await window.gugu.getContext()
window.gugu.onContextChanged((next) => {
  ctx = next
  if (current) drawRound()
})

const agentsHere = () => (ctx.chat?.members ?? []).filter((m) => m.kind === 'agent')
const nameOf = (id) => (ctx.chat?.members ?? []).find((m) => m.id === id)?.name ?? '已离开的成员'

// ── the lobby ────────────────────────────────────────────────────────────────────────────────────────────────────

let bank = null
async function loadBank() {
  bank ??= await fetch('bank/index.json').then((r) => {
    if (!r.ok) throw new Error(`题库读不到（HTTP ${r.status}）`)
    return r.json()
  })
  return bank
}

async function showLobby() {
  $('#round').hidden = true
  const lobby = $('#lobby')
  lobby.hidden = false
  lobby.replaceChildren(h('p', { className: 'muted', textContent: '正在读这个群的牌局…' }))
  if (!ctx.chat) {
    lobby.replaceChildren(h('gugu-empty', { icon: 'users' }, h('strong', { textContent: '海龟汤在聊天里玩' }), h('small', { textContent: '在群或和 agent 的私聊右栏打开它' })))
    return
  }
  let rounds = []
  try {
    const entries = await window.gugu.files.list({ chat: ctx.chat.id })
    rounds = entries.filter((e) => e.type !== 'folder' && e.name.endsWith(FILE_SUFFIX)).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
  } catch (e) {
    fail('读不到这个群的文件', e)
  }
  let puzzles = []
  try {
    puzzles = (await loadBank()).puzzles
  } catch (e) {
    fail('题库读不到', e)
  }
  lobby.replaceChildren(
    h('h2', { textContent: '海龟汤' }),
    h('p', { className: 'muted', textContent: '主持人知道汤底，只回答「是 / 不是 / 无关 / 是也不是」。问出关键，还原整个故事。' }),
    newRoundForm(puzzles),
    rounds.length ? h('h5', { textContent: '这个群的牌局' }) : null,
    rounds.length
      ? h('ul', { className: 'list' }, rounds.map((entry) => h('li', { tabIndex: 0, onclick: () => openRound(entry), onkeydown: (ev) => ev.key === 'Enter' && openRound(entry) },
          h('gugu-icon', { name: 'message-circle-question' }),
          h('div', {}, h('strong', { textContent: entry.name.slice(0, -FILE_SUFFIX.length) }), h('span', { textContent: entry.createdBy?.name ? `${entry.createdBy.name} 开的` : '' })),
          h('gugu-time', { datetime: entry.updatedAt ?? entry.createdAt }))))
      : null,
  )
}

function newRoundForm(puzzles) {
  const agents = agentsHere()
  const form = h('form', { className: 'card stack' })
  form.append(h('h3', { textContent: '新开一局' }))
  if (!agents.length) {
    form.append(h('p', { className: 'muted', textContent: '需要一个 agent 当主持人：把装了海龟汤的 agent 拉进群，或在和你自己的 agent 的私聊里玩。' }))
    return form
  }
  const pick = h('select', { name: 'puzzle', required: true },
    h('option', { value: '', textContent: '随机一题' }),
    puzzles.map((p) => h('option', { value: p.id, textContent: `${p.title} · ${'★'.repeat(p.difficulty ?? 1)}` })))
  const hostPick = h('select', { name: 'host' }, agents.map((a) => h('option', { value: a.id, textContent: a.name })))
  const go = h('button', { type: 'submit', className: 'primary', textContent: '开汤' })
  form.append(
    h('label', {}, '题目', pick),
    h('label', {}, '主持人', hostPick),
    h('p', { className: 'muted', textContent: '主持人看得到汤底：别让要一起猜的人的 agent 主持。' }),
    h('div', { className: 'row' }, go),
  )
  form.onsubmit = async (ev) => {
    ev.preventDefault()
    go.disabled = true
    try {
      const puzzle = pick.value ? puzzles.find((p) => p.id === pick.value) : puzzles[Math.floor(Math.random() * puzzles.length)]
      if (!puzzle) throw new Error('题库是空的')
      await startRound(puzzle, hostPick.value)
    } catch (e) {
      fail('没开成', e)
    } finally {
      go.disabled = false
    }
  }
  return form
}

async function startRound(puzzle, hostId) {
  const at = Date.now()
  const stamp = new Date(at).toISOString().slice(5, 16).replace('T', ' ').replace(':', '')
  const entry = await window.gugu.files.create({ chat: ctx.chat.id, name: `${puzzle.title} ${stamp}${FILE_SUFFIX}` }, newRound({ puzzle, host: hostId, at }))
  await window.gugu.send(hostId, `请主持这局海龟汤「${puzzle.title}」：先调用 turtle-soup__host。`, { refs: [{ file: entry }] })
  await openRound(entry)
}

// Who this person is: the chat's server stamps it on the round's presence (empty for a moment after opening).
let myId = null
async function whoAmI() {
  if (current?.presence.self.userId) myId = current.presence.self.userId
  if (!myId) throw new Error('还在连上这一局，稍等一下再点')
  return myId
}

// ── a round ──────────────────────────────────────────────────────────────────────────────────────────────────────

let current = null
let offs = []

async function openRound(entry) {
  for (const off of offs) off()
  offs = []
  current?.close()
  current = null
  try {
    current = await window.gugu.files.open(entry)
  } catch (e) {
    fail('打不开这一局', e)
    return
  }
  const f = current
  offs.push(f.onChange(() => drawRound()), f.onStatus(() => drawRound()), f.presence.onChange(() => {
    if (f.presence.self.userId) myId = f.presence.self.userId
    drawRound()
  }))
  if (f.presence.self.userId) myId = f.presence.self.userId
  $('#lobby').hidden = true
  $('#round').hidden = false
  drawControls()
  drawRound()
}

const ended = (round) => round.status === 'solved' || round.status === 'revealed'

function drawRound() {
  const f = current
  if (!f) return
  const round = f.data
  say(f.status === 'offline' ? '离线了：问题会在连回来后发出' : f.status === 'gone' ? '这一局的文件不在了' : '')
  document.body.dataset.file = f.status
  window.gugu.setTabTitle(round.puzzle?.title ?? '海龟汤').catch((e) => console.warn('setTabTitle', e)) // only the tab's name
  const found = Object.entries(round.found ?? {}).sort(([a], [b]) => a - b)
  const questions = questionsInOrder(round)
  const statusLine = {
    waiting: `等 ${nameOf(round.host)} 接手主持…`,
    playing: `主持：${nameOf(round.host)} · 已找到关键 ${found.length}/${round.puzzle.keyCount}`,
    solved: '汤底还原了！',
    revealed: '汤底已揭晓',
  }[round.status] ?? round.status
  $('#board').replaceChildren(
    h('div', { className: 'row' },
      ctx.file ? null : h('button', { type: 'button', ariaLabel: '回到大厅', onclick: leaveRound }, h('gugu-icon', { name: 'chevron-left' })),
      h('h2', { textContent: round.puzzle.title })),
    h('article', { className: 'card stack' }, h('h5', { textContent: '汤面' }), h('p', { textContent: round.puzzle.surface })),
    h('p', { className: 'muted', textContent: statusLine }),
    round.bottom ? h('article', { className: 'card stack bottom' }, h('h5', { textContent: '汤底' }), h('p', { textContent: round.bottom })) : null,
    found.length ? h('details', { open: !ended(round) }, h('summary', { textContent: `已找到的关键（${found.length}）` }),
      h('ul', {}, found.map(([, k]) => h('li', { textContent: `${k.text} — ${nameOf(k.by)}` })))) : null,
    Object.keys(round.hints ?? {}).length ? h('details', { open: true }, h('summary', { textContent: '提示' }),
      h('ul', {}, Object.values(round.hints).sort((a, b) => a.at - b.at).map((x) => h('li', { textContent: x.text })))) : null,
    questions.length
      ? h('ul', { className: 'list qa' }, questions.map((q) => h('li', { dataset: { key: q.id } },
          h('gugu-avatar', { user: q.by }),
          h('div', {}, h('strong', { textContent: (q.kind === 'guess' ? '猜：' : '') + q.text }), h('span', { textContent: answerLine(q) })),
          h('mark', { className: `verdict v-${q.verdict ?? (q.judged ? 'judged' : 'pending')}`, textContent: badge(q) }))))
      : h('gugu-empty', { icon: 'message-circle-question' }, h('strong', { textContent: '还没有人提问' }), h('small', { textContent: '问一个能用「是 / 不是」回答的问题' })),
  )
  drawGiveUp()
  for (const el of $('#controls').querySelectorAll('input, button')) el.disabled = ended(round) || f.status === 'gone'
}

function badge(q) {
  if (q.kind === 'guess') return q.judged ? `中 ${q.found?.length ?? 0} 条` : '…'
  return q.verdict ? VERDICT_LABEL[q.verdict] : '…'
}

function answerLine(q) {
  const who = nameOf(q.by)
  return q.reply ? `${who} · 主持：${q.reply}` : who
}

let ask, giveUpRow
function drawControls() {
  ask = h('input', { type: 'text', maxLength: MAX_QUESTION, placeholder: '他是自己选择这样做的吗？', ariaLabel: '问题' })
  const askBtn = h('button', { type: 'submit', className: 'primary', textContent: '提问' })
  const guessBtn = h('button', { type: 'button', textContent: '猜汤底', onclick: () => submit('guess') })
  const form = h('form', { className: 'stack' }, ask, h('div', { className: 'row' }, askBtn, guessBtn))
  form.onsubmit = (ev) => { ev.preventDefault(); submit('ask') }
  giveUpRow = h('div', { className: 'row' })
  $('#controls').replaceChildren(form, giveUpRow)
}

function drawGiveUp() {
  const round = current.data
  if (ended(round)) {
    giveUpRow.replaceChildren(ctx.file ? h('span') : h('button', { type: 'button', className: 'primary', textContent: '再来一局', onclick: leaveRound }))
    return
  }
  const votes = Object.keys(round.giveUp ?? {}).length
  const mine = myId && round.giveUp?.[myId]
  giveUpRow.replaceChildren(
    h('button', { type: 'button', className: mine ? '' : 'danger', textContent: mine ? '收回放弃' : '放弃，看汤底', onclick: toggleGiveUp }),
    h('small', { className: 'muted', textContent: votes ? `${votes}/${giveUpNeeded(round)} 人同意揭晓` : '' }),
  )
}

async function submit(kind) {
  const f = current
  try {
    const text = checkQuestion(ask.value)
    const me = await whoAmI()
    const round = f.data
    if (round.status !== 'playing' && round.status !== 'waiting') throw new Error('这一局已经结束了')
    // The host was told already when something still waits: it judges everything pending before it stops.
    const tell = pendingQuestions(round).length === 0
    f.data.questions[crypto.randomUUID()] = { by: me, kind, text, at: Date.now() }
    ask.value = ''
    if (tell && round.status === 'playing') await window.gugu.send(round.host, kind === 'guess' ? '海龟汤有人猜汤底了' : '海龟汤有新问题', { refs: [{ file: f.entry }] })
  } catch (e) {
    fail(kind === 'guess' ? '没猜成' : '没问成', e)
  }
}

async function toggleGiveUp() {
  const f = current
  try {
    const me = await whoAmI()
    if (f.data.giveUp[me]) {
      delete f.data.giveUp[me]
      return
    }
    f.data.giveUp[me] = Date.now()
    if (Object.keys(f.data.giveUp).length >= giveUpNeeded(f.data)) {
      await window.gugu.send(f.data.host, '海龟汤的玩家投票放弃了，请调用 turtle-soup__reveal 揭晓汤底', { refs: [{ file: f.entry }] })
    }
  } catch (e) {
    fail('没投成', e)
  }
}

function leaveRound() {
  for (const off of offs) off()
  offs = []
  current?.close()
  current = null
  showLobby()
}

if (ctx.file) await openRound(ctx.file)
else await showLobby()
