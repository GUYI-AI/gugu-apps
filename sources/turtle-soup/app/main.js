// 海龟汤's page. In a chat's side panel it is the lobby (this chat's rounds, and a new one); opened for a round file
// (`.turtle-soup.json`) it is that round. Players act here — ask, guess the story, ask for a hint, give up — and talk
// in the chat as usual. The host is an agent in the chat with this App's tools, woken by a whisper (gugu.send) when
// something waits for it; the round file is what everyone sees, live.
import {
  FILE_SUFFIX, VERDICT_LABEL, DIFFICULTY_LABEL, MAX_QUESTION, MAX_GUESS,
  newRound, ended, questionsInOrder, hintsGiven, hintWaiting, checkQuestion, giveUpNeeded, somethingWaits,
} from './game.js'

const $ = (sel) => document.querySelector(sel)
const status = $('#status')

/** Children as the DOM takes them: arrays flattened, null / undefined / false left out. */
const kids = (children) => children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false)
/** An element with text (never markup: others wrote it) and children. */
// The host's elements (<gugu-icon name>, <gugu-avatar user>, <gugu-time datetime>, <gugu-empty icon>) read attributes.
function h(tag, props = {}, ...children) {
  const { dataset, ...rest } = props
  const el = document.createElement(tag)
  if (tag.includes('-')) for (const [k, v] of Object.entries(rest)) k === 'textContent' ? (el.textContent = v) : el.setAttribute(k, v)
  else Object.assign(el, rest)
  if (dataset) Object.assign(el.dataset, dataset)
  el.append(...kids(children))
  return el
}
/** Replace what `el` holds; never `el.replaceChildren(null)` — that draws the word "null". */
const put = (el, ...children) => el.replaceChildren(...kids(children))

function say(message, kind = 'status') {
  status.setAttribute('role', kind)
  status.textContent = message ?? ''
}

function fail(what, e) {
  const message = `${what}：${e?.message ?? e}`
  say(message, 'alert')
  window.gugu.reportError(message).catch((err) => console.error('reportError failed', err)) // the alert above shows it already
}

let ctx = await window.gugu.getContext()
window.gugu.onContextChanged((next) => {
  ctx = next
  if (current) drawRound()
})

const members = () => ctx.chat?.members ?? []
const nameOf = (id) => members().find((m) => m.id === id)?.name ?? '已离开的成员'
const LANGS = { zh: '中文题', en: 'English' }
const defaultLang = () => (String(ctx.locale ?? '').startsWith('en') ? 'en' : 'zh')

// ── the lobby ────────────────────────────────────────────────────────────────────────────────────────────────────

let bank = null
async function loadBank() {
  bank ??= await fetch('bank/index.json').then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
  return bank
}

async function showLobby() {
  $('#round').hidden = true
  const lobby = $('#lobby')
  lobby.hidden = false
  window.gugu.setTabTitle('海龟汤').catch((e) => console.warn('setTabTitle', e)) // only the tab's name
  if (!ctx.chat) {
    await showEveryRound(lobby)
    return
  }
  put(lobby, h('p', { className: 'muted', textContent: '正在读这个群的牌局…' }))
  let rounds = []
  try {
    const entries = await window.gugu.files.list({ chat: ctx.chat.id })
    rounds = entries.filter((e) => e.type !== 'folder' && e.name.endsWith(FILE_SUFFIX)).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  } catch (e) {
    fail('读不到这个群的文件', e)
  }
  let puzzles = []
  try {
    puzzles = (await loadBank()).puzzles
  } catch (e) {
    fail('题库读不到', e)
  }
  put(lobby, 
    h('h2', { textContent: '海龟汤' }),
    h('p', { className: 'muted', textContent: '主持人知道汤底，只回答「是 / 不是 / 无关 / 是也不是」。问出关键，还原整个故事。' }),
    newRoundForm(puzzles),
    rounds.length ? h('h5', { textContent: '这个群的牌局' }) : null,
    rounds.length
      ? h('ul', { className: 'list' }, rounds.map((entry) => h('li', { tabIndex: 0, role: 'button', ariaLabel: entry.name, onclick: () => openRound(entry), onkeydown: (ev) => ev.key === 'Enter' && openRound(entry) },
          h('gugu-icon', { name: 'message-circle' }),
          h('div', {}, h('strong', { textContent: entry.name.slice(0, -FILE_SUFFIX.length) }), h('span', { textContent: entry.createdBy?.name ? `${entry.createdBy.name} 开的` : '' })),
          h('gugu-time', { datetime: entry.updatedAt ?? entry.createdAt }))))
      : null,
  )
}

/**
 * Outside a chat (the App's own page): a new round in a chat the person picks, and the rounds of every chat they are
 * in. A round opens in its own chat, as one opened there.
 */
async function showEveryRound(lobby) {
  put(lobby, h('p', { className: 'muted', textContent: '正在找你的聊天和牌局…' }))
  let rounds = []
  try {
    rounds = await window.gugu.files.search({ query: FILE_SUFFIX, suffixes: ['.json'], limit: 50 })
    rounds = rounds.filter((e) => e.name.endsWith(FILE_SUFFIX))
  } catch (e) {
    fail('找不到牌局', e)
  }
  let chats = []
  try {
    chats = (await window.gugu.chats.list()).chats
  } catch (e) {
    fail('读不到你的聊天', e)
  }
  let puzzles = []
  try {
    puzzles = (await loadBank()).puzzles
  } catch (e) {
    fail('题库读不到', e)
  }
  put(lobby,
    h('h2', { textContent: '海龟汤' }),
    h('p', { className: 'muted', textContent: '主持人知道汤底，只回答「是 / 不是 / 无关 / 是也不是」。在哪个聊天里开局，大家就在那里一起猜。' }),
    newRoundForm(puzzles, chats),
    rounds.length ? h('h5', { textContent: '我的牌局' }) : null,
    rounds.length
      ? h('ul', { className: 'list', ariaLabel: '我的牌局' }, rounds.map((entry) => {
          const go = () => window.gugu.files.openWith(entry).catch((e) => fail('打不开这一局', e))
          return h('li', { tabIndex: 0, role: 'button', ariaLabel: entry.name, onclick: go, onkeydown: (ev) => ev.key === 'Enter' && go() },
            h('gugu-icon', { name: 'message-circle' }),
            h('div', {}, h('strong', { textContent: entry.name.slice(0, -FILE_SUFFIX.length) }), h('span', { textContent: entry.chatName ?? '' })),
            h('gugu-time', { datetime: entry.updatedAt ?? entry.createdAt }))
        }))
      : null,
  )
}

/** A new round: in this chat, or — given `chats`, on the App's own page — in the one picked, hosted by an agent in it. */
function newRoundForm(puzzles, chats = null) {
  let chatId = ctx.chat?.id ?? chats?.[0]?.id ?? null
  let agents = members().filter((m) => m.kind === 'agent')
  const form = h('form', { className: 'card stack', ariaLabel: '新开一局' })
  form.append(h('h3', { textContent: '新开一局' }))
  if (chats && !chats.length) {
    form.append(h('p', { className: 'muted', textContent: '你还不在任何聊天里：先建一个群，或者和你的 agent 开一个私聊。' }))
    return form
  }
  const language = h('select', { name: 'lang' }, Object.entries(LANGS).map(([value, label]) => h('option', { value, textContent: label, selected: value === defaultLang() })))
  const level = h('select', { name: 'difficulty' },
    h('option', { value: '', textContent: '全部难度' }),
    Object.entries(DIFFICULTY_LABEL).map(([value, label]) => h('option', { value, textContent: label })))
  const pick = h('select', { name: 'puzzle' })
  const shownNow = () => puzzles.filter((p) => p.lang === language.value && (!level.value || p.difficulty === level.value))
  const fill = () => {
    const shown = shownNow()
    put(pick, h('option', { value: '', textContent: `随机一题（${shown.length} 道）` }),
      shown.map((p) => h('option', { value: p.id, textContent: `${p.title} · ${DIFFICULTY_LABEL[p.difficulty] ?? ''}` })))
  }
  level.onchange = fill
  language.onchange = fill
  fill()
  const hostPick = h('select', { name: 'host' })
  const go = h('button', { type: 'submit', className: 'primary', textContent: '开汤' })
  const noHost = h('p', { className: 'muted', textContent: '需要一个 agent 当主持人：把装了海龟汤的 agent 拉进群，或者在和你自己的 agent 的私聊里玩。' })
  const drawHosts = () => {
    put(hostPick, agents.map((a) => h('option', { value: a.id, textContent: a.name })))
    noHost.hidden = agents.length > 0
    go.disabled = !agents.length
  }
  drawHosts()
  // The App's own page: the chat to play in, last spoken first, and its agents as hosts.
  const chatPick = chats && h('select', { name: 'chat' }, chats.map((c) => h('option', { value: c.id, textContent: c.kind === 'dm' ? `和 ${c.name} 的私聊` : c.name })))
  if (chatPick) {
    const loadHosts = async () => {
      chatId = chatPick.value
      agents = []
      drawHosts()
      try {
        agents = (await window.gugu.chats.members({ chat: chatId })).members.filter((m) => m.kind === 'agent')
      } catch (e) {
        fail('读不到这个聊天的成员', e)
      }
      if (chatId === chatPick.value) drawHosts()
    }
    chatPick.onchange = loadHosts
    loadHosts()
  }
  form.append(...kids([
    chatPick ? h('label', {}, '在哪个聊天里', chatPick) : null,
    h('div', { className: 'row' }, h('label', {}, '语言', language), h('label', {}, '难度', level)),
    h('label', {}, '题目', pick),
    h('label', {}, '主持人', hostPick),
    noHost,
    h('p', { className: 'muted', textContent: '主持人的主人看得到汤底：别让要一起猜的人的 agent 主持。' }),
    h('div', { className: 'row' }, go),
  ]))
  form.onsubmit = async (ev) => {
    ev.preventDefault()
    go.disabled = true
    try {
      const shown = shownNow()
      const puzzle = pick.value ? puzzles.find((p) => p.id === pick.value) : shown[Math.floor(Math.random() * shown.length)]
      if (!puzzle) throw new Error('没有这个难度的题')
      await startRound(puzzle, hostPick.value, chatId)
    } catch (e) {
      fail('没开成', e)
    } finally {
      go.disabled = !agents.length
    }
  }
  return form
}

/** The round file in that chat, its host woken; it opens here in a chat, and in its chat from the App's own page. */
async function startRound(puzzle, hostId, chatId) {
  const at = Date.now()
  const d = new Date(at)
  const stamp = `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
  const entry = await window.gugu.files.create({ chat: chatId, name: `${puzzle.title} ${stamp}${FILE_SUFFIX}` }, newRound({ puzzle, host: hostId, at }))
  await window.gugu.send(hostId, `请主持这局海龟汤「${puzzle.title}」：用海龟汤的 host 工具接手。`, { refs: [{ file: entry }] })
  if (ctx.chat) await openRound(entry)
  else await window.gugu.files.openWith(entry)
}

// ── a round ──────────────────────────────────────────────────────────────────────────────────────────────────────

let current = null
let offs = []
// Who this person is: the chat's server stamps it on the round's presence (empty for a moment after opening).
let myId = null

async function openRound(entry) {
  closeRound()
  try {
    current = await window.gugu.files.open(entry)
  } catch (e) {
    fail('打不开这一局', e)
    return
  }
  const f = current
  offs.push(f.onChange(drawRound), f.onStatus(drawRound), f.presence.onChange(drawRound))
  $('#lobby').hidden = true
  $('#round').hidden = false
  drawControls()
  drawRound()
}

function closeRound() {
  for (const off of offs) off()
  offs = []
  current?.close()
  current = null
}

function whoAmI() {
  if (current?.presence.self.userId) myId = current.presence.self.userId
  if (!myId) throw new Error('还在连上这一局，稍等一下再点')
  return myId
}

function badge(q) {
  if (!q.verdict) return { text: '…', cls: 'pending' }
  if (q.verdict === 'close') return { text: `接近 ${q.hits ?? 0}/${current.data.puzzle.requiredCount}`, cls: 'close' }
  return { text: VERDICT_LABEL[q.verdict] ?? q.verdict, cls: q.verdict }
}

function drawRound() {
  const f = current
  if (!f) return
  if (f.presence.self.userId) myId = f.presence.self.userId
  const round = f.data
  const p = round.puzzle
  say(f.status === 'offline' ? '离线了：连回来后再发出' : f.status === 'gone' ? '这一局的文件不在了' : '')
  document.body.dataset.file = f.status
  window.gugu.setTabTitle(p.title).catch((e) => console.warn('setTabTitle', e)) // only the tab's name
  const questions = questionsInOrder(round)
  const asked = questions.filter((q) => q.kind === 'ask').length
  const given = hintsGiven(round)
  const line = {
    waiting: `等 ${nameOf(round.host)} 接手主持…`,
    playing: `主持：${nameOf(round.host)} · 已问 ${asked} · 提示 ${given}/${p.hintCount}`,
    solved: `还原成功${round.solvedBy && round.questions[round.solvedBy] ? ` · ${nameOf(round.questions[round.solvedBy].by)}` : ''} · 共问 ${asked} 次`,
    revealed: `大家放弃了，汤底揭晓 · 共问 ${asked} 次`,
  }[round.status] ?? round.status
  put($('#board'), 
    // The title is the panel's or the tab's own (setTabTitle above); from the lobby, a way back to it.
    ctx.file ? null : h('div', { className: 'row' }, h('button', { type: 'button', textContent: '回到大厅', onclick: () => { closeRound(); showLobby() } })),
    h('article', { className: 'card stack', ariaLabel: '汤面' }, h('h5', { textContent: '汤面' }), h('p', { className: 'surface', textContent: p.surface })),
    h('p', { className: 'muted', textContent: line }),
    round.bottom ? h('article', { className: 'card stack bottom', ariaLabel: '汤底' }, h('h5', { textContent: '汤底' }), h('p', { className: 'surface', textContent: round.bottom }), credit(p)) : null,
    given ? h('details', { open: !ended(round) }, h('summary', { textContent: `提示（${given}）` }),
      h('ol', {}, Object.keys(round.hints).sort((a, b) => a - b).map((k) => h('li', { textContent: round.hints[k].text })))) : null,
    questions.length
      ? h('ul', { className: 'list qa', ariaLabel: '问答' }, questions.map((q) => {
          const b = badge(q)
          return h('li', { dataset: { key: q.id } },
            h('gugu-avatar', { user: q.by }),
            h('div', {}, h('strong', { textContent: (q.kind === 'guess' ? '还原：' : '') + q.text }), h('span', { textContent: nameOf(q.by) })),
            h('mark', { className: `verdict v-${b.cls}`, textContent: b.text }))
        }))
      : h('gugu-empty', { icon: 'message-circle' }, h('strong', { textContent: '还没有人提问' }), h('small', { textContent: '问一个能用「是 / 不是」回答的问题' })),
  )
  drawActions()
}

/** Who wrote the puzzle and under what licence — shown once the solution is (CC BY / BY-SA ask for it). */
function credit(p) {
  const s = p.source
  if (!s || s.kind === 'host') return h('small', { className: 'muted', textContent: '题目：主持人自出' })
  const link = s.url ? h('a', { href: s.url, textContent: '原作', onclick: (ev) => { ev.preventDefault(); window.gugu.openBrowserTab(s.url).catch((e) => fail('打不开链接', e)) } }) : null
  const from = s.collection && s.collection !== s.author ? ` · 收自 ${s.collection}` : ''
  return h('small', { className: 'muted' }, `题目：${s.author ?? ''} · ${s.license}${from}${link ? ' · ' : ''}`, link)
}

let input, askBtn, guessBtn, actions
function drawControls() {
  input = h('textarea', { rows: 2, maxLength: MAX_GUESS, placeholder: '问一个能用是 / 否回答的问题；想通了就写下整个故事，点「还原」', ariaLabel: '问题或还原' })
  askBtn = h('button', { type: 'submit', className: 'primary', textContent: '提问' })
  guessBtn = h('button', { type: 'button', textContent: '还原', onclick: () => submit('guess') })
  const form = h('form', { className: 'stack' }, input, h('div', { className: 'row' }, askBtn, guessBtn))
  form.onsubmit = (ev) => { ev.preventDefault(); submit('ask') }
  input.onkeydown = (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); submit('ask') }
  }
  actions = h('div', { className: 'row' })
  put($('#controls'), form, actions)
}

function drawActions() {
  const f = current
  const round = f.data
  const over = ended(round) || f.status === 'gone'
  for (const el of [input, askBtn, guessBtn]) el.disabled = over
  if (ended(round)) {
    put(actions, ctx.file ? h('span') : h('button', { type: 'button', className: 'primary', textContent: '再来一局', onclick: () => { closeRound(); showLobby() } }))
    return
  }
  const given = hintsGiven(round)
  const votes = Object.keys(round.giveUp ?? {}).length
  const mine = myId && round.giveUp?.[myId]
  put(actions, 
    h('button', {
      type: 'button',
      disabled: over || given >= round.puzzle.hintCount || hintWaiting(round),
      textContent: hintWaiting(round) ? '等主持给提示…' : given >= round.puzzle.hintCount ? '没有提示了' : `要提示（${given + 1}/${round.puzzle.hintCount}）`,
      onclick: askHint,
    }),
    h('button', { type: 'button', className: mine ? '' : 'danger', disabled: over, textContent: mine ? '收回放弃' : '放弃，看汤底', onclick: toggleGiveUp }),
    votes ? h('small', { className: 'muted', textContent: `${votes}/${giveUpNeeded(round)} 人同意揭晓` }) : null,
  )
}

/** Wake the host — unless something already waits for it: it handles everything waiting before it stops. */
async function tellHost(round, before, text) {
  if (round.status !== 'playing' || before) return
  await window.gugu.send(round.host, text, { refs: [{ file: current.entry }] })
}

async function submit(kind) {
  const f = current
  try {
    const text = checkQuestion(kind, input.value)
    if (kind === 'ask' && [...text].length > MAX_QUESTION) throw new Error(`问题最多 ${MAX_QUESTION} 字；整个故事请点「还原」`)
    const me = whoAmI()
    const round = f.data
    if (ended(round)) throw new Error('这一局已经结束了')
    const before = somethingWaits(round)
    f.data.questions[crypto.randomUUID()] = { by: me, kind, text, at: Date.now() }
    input.value = ''
    await tellHost(round, before, kind === 'guess' ? '海龟汤有人提交了还原' : '海龟汤有新问题')
  } catch (e) {
    fail(kind === 'guess' ? '没交上还原' : '没问成', e)
  }
}

async function askHint() {
  const f = current
  try {
    const me = whoAmI()
    const before = somethingWaits(f.data)
    f.data.hintAsks[hintsGiven(f.data)] = { by: me, at: Date.now() }
    await tellHost(f.data, before, '海龟汤的玩家要一条提示')
  } catch (e) {
    fail('没要到提示', e)
  }
}

async function toggleGiveUp() {
  const f = current
  try {
    const me = whoAmI()
    if (f.data.giveUp[me]) {
      delete f.data.giveUp[me]
      return
    }
    f.data.giveUp[me] = Date.now()
    if (Object.keys(f.data.giveUp).length >= giveUpNeeded(f.data) && f.data.status === 'playing') {
      await window.gugu.send(f.data.host, '海龟汤的玩家投票放弃了，请用 reveal 揭晓汤底', { refs: [{ file: f.entry }] })
    }
  } catch (e) {
    fail('没投成', e)
  }
}

if (ctx.file) await openRound(ctx.file)
else await showLobby()
