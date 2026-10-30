// 海龟汤's page. In a chat's side panel it is the lobby (a new round on the stage, and this chat's rounds); opened for a
// round file (`.turtle-soup.json`) it is that round's board. Players act here — ask, guess the story, ask for a hint,
// give up — and talk in the chat as usual. The host is an agent in the chat with this App's tools, woken by a whisper
// (gugu.dispatch) when something waits for it; the round file is what everyone sees, live.
import {
  FILE_SUFFIX, VERDICT_LABEL, DIFFICULTY_LABEL, STATUS_LABEL, MAX_QUESTION, MAX_GUESS,
  newRound, ended, questionsInOrder, hintsGiven, hintWaiting, checkQuestion, giveUpNeeded, somethingWaits, playersOf,
  askedCount, summaryOf,
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
const roundName = (entry) => entry.name.slice(0, -FILE_SUFFIX.length)

/** Faces of who played, overlapping; a few, then the count of the rest. */
function faces(ids, max = 5) {
  if (!ids.length) return null
  return h('span', { className: 'faces', ariaLabel: `${ids.length} 人在玩` },
    ids.slice(0, max).map((id) => h('gugu-avatar', { user: id, size: 'sm' })),
    ids.length > max ? h('small', { textContent: `+${ids.length - max}` }) : null)
}

// ── the lobby ────────────────────────────────────────────────────────────────────────────────────────────────────

let bank = null
async function loadBank() {
  bank ??= await fetch('bank/index.json').then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
  return bank
}

// A lobby drawn later than another wins: a round read for an older one lands nowhere.
let lobbyDrawn = 0

async function showLobby() {
  $('#round').hidden = true
  const lobby = $('#lobby')
  lobby.hidden = false
  document.body.dataset.view = 'lobby'
  window.gugu.setTabTitle('海龟汤').catch((e) => console.warn('setTabTitle', e)) // only the tab's name
  const drawn = ++lobbyDrawn
  if (!ctx.chat) {
    await showEveryRound(lobby, drawn)
    return
  }
  put(lobby, h('p', { className: 'muted', textContent: '正在读这个群的牌局…' }))
  const [puzzles, rounds] = await Promise.all([
    loadBank().then((b) => b.puzzles, (e) => { fail('题库读不到', e); return [] }),
    window.gugu.files.list({ chat: ctx.chat.id }).then(
      (entries) => entries.filter((e) => e.type !== 'folder' && e.name.endsWith(FILE_SUFFIX)).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      (e) => { fail('读不到这个群的文件', e); return [] }),
  ])
  if (drawn !== lobbyDrawn) return
  put(lobby,
    newRoundForm(puzzles),
    h('section', { className: 'stack', ariaLabel: '这个群的牌局' },
      h('h5', { textContent: '这个群的牌局' }),
      rounds.length
        ? history(rounds, drawn, (entry) => openRound(entry), (entry) => (entry.createdBy?.name ? `${entry.createdBy.name} 开的` : ''))
        : h('gugu-empty', { icon: 'message-circle' }, h('strong', { textContent: '这个群还没开过汤' }), h('small', { textContent: '在上面选好题，点「开汤」' }))),
  )
}

/**
 * Outside a chat (the App's own page): the rounds of every chat the person is in, each opening in its own chat. A new round
 * starts in a chat — the App opened there, where the chat is already known — not from a list of chats drawn here.
 */
async function showEveryRound(lobby, drawn) {
  put(lobby, h('p', { className: 'muted', textContent: '正在找你的牌局…' }))
  let rounds = []
  try {
    rounds = await window.gugu.files.search({ query: FILE_SUFFIX, suffixes: ['.json'], limit: 50 })
    rounds = rounds.filter((e) => e.name.endsWith(FILE_SUFFIX))
  } catch (e) {
    fail('找不到牌局', e)
  }
  if (drawn !== lobbyDrawn) return
  const go = (entry) => window.gugu.files.openWith(entry).catch((e) => fail('打不开这一局', e))
  put(lobby,
    h('header', { className: 'stage' },
      h('h2', { textContent: '海龟汤' }),
      h('p', { className: 'lead', textContent: '主持人知道汤底，只回答「是 / 不是 / 无关 / 是也不是」。问出关键，还原整个故事。' })),
    h('section', { className: 'stack', ariaLabel: '我的牌局' },
      h('h5', { textContent: '我的牌局' }),
      rounds.length
        ? history(rounds, drawn, go, (entry) => entry.chatName ?? '')
        : h('gugu-empty', { icon: 'message-circle' },
            h('strong', { textContent: '牌局在聊天里开' }),
            h('small', { textContent: '在群聊或和 agent 的私聊里打开海龟汤，选好题点「开汤」，大家就在那里一起猜。' }))),
  )
}

/**
 * Rounds as rows, drawn at once from what the list knows (name, who, when); then each of the latest ones is read once,
 * in the background, for its status, questions and players — the lobby never waits for them.
 */
function history(entries, drawn, open, whoLine) {
  const subOf = (entry, s) => {
    const words = [whoLine(entry), s ? `已问 ${s.asked}` : ''].filter(Boolean).join(' · ')
    return [words, words ? ' · ' : null, h('gugu-time', { datetime: entry.updatedAt ?? entry.createdAt })]
  }
  const rows = entries.map((entry) => {
    const title = h('strong', { textContent: roundName(entry) })
    const sub = h('span', {}, subOf(entry))
    const side = h('span', { className: 'side' })
    const row = h('li', { tabIndex: 0, role: 'button', ariaLabel: roundName(entry), onclick: () => open(entry), onkeydown: (ev) => ev.key === 'Enter' && open(entry) },
      h('div', {}, title, sub),
      side)
    return { entry, title, sub, side, row }
  })
  for (const r of rows.slice(0, 20)) {
    readSummary(r.entry).then((s) => {
      if (drawn !== lobbyDrawn) return
      if (s.title) r.title.textContent = s.title // the file's name carries when it began; the row says that already
      put(r.sub, subOf(r.entry, s))
      put(r.side, faces(s.players, 3), h('mark', { className: `chip st-${s.status}`, textContent: STATUS_LABEL[s.status] ?? s.status }))
    }, (e) => console.warn('round summary', r.entry.name, e)) // the row still opens; it only shows less
  }
  return h('ul', { className: 'list games' }, rows.map((r) => r.row))
}

/** A round file read once, for the lobby's row: never kept open. */
async function readSummary(entry) {
  const f = await window.gugu.files.open(entry)
  try {
    return summaryOf(f.toJSON())
  } finally {
    f.close()
  }
}

/** A choice of a few, as a row of pills: radios underneath, so keys and screen readers work as on any radio group. */
function pills(legend, name, options, value) {
  return h('fieldset', { className: 'pills' },
    h('legend', { textContent: legend }),
    options.map(([v, label]) => h('label', {}, h('input', { type: 'radio', name, value: v, checked: v === value }), h('span', { textContent: label }))))
}

/** A new round in this chat, on the stage. Its host is picked in gugu's dispatch sheet, among the agents in the chat. */
function newRoundForm(puzzles) {
  const form = h('form', { className: 'stage', ariaLabel: '新开一局' })
  const pick = h('select', { name: 'puzzle', ariaLabel: '指定的题目', hidden: true })
  const randomLabel = h('span')
  const shownNow = () => puzzles.filter((p) => p.lang === form.elements.lang.value && (!form.elements.difficulty.value || p.difficulty === form.elements.difficulty.value))
  const fill = () => {
    const shown = shownNow()
    randomLabel.textContent = `随机一题 · ${shown.length} 道`
    const kept = pick.value
    put(pick, shown.map((p) => h('option', { value: p.id, textContent: `${p.title} · ${DIFFICULTY_LABEL[p.difficulty] ?? ''}` })))
    if (shown.some((p) => p.id === kept)) pick.value = kept
    pick.hidden = form.elements.which.value !== 'pick'
  }
  const which = h('fieldset', { className: 'pills' },
    h('legend', { textContent: '题目' }),
    h('label', {}, h('input', { type: 'radio', name: 'which', value: 'random', checked: true }), randomLabel),
    h('label', {}, h('input', { type: 'radio', name: 'which', value: 'pick' }), h('span', { textContent: '指定一题…' })))
  const go = h('button', { type: 'submit', className: 'start', textContent: '开汤' })
  form.append(...kids([
    h('h2', { textContent: '新开一局' }),
    h('p', { className: 'lead', textContent: '主持人知道汤底，只回答「是 / 不是 / 无关 / 是也不是」。问出关键，还原整个故事。' }),
    pills('语言', 'lang', Object.entries(LANGS), defaultLang()),
    pills('难度', 'difficulty', [['', '全部'], ...Object.entries(DIFFICULTY_LABEL)], ''),
    which,
    pick,
    h('div', { className: 'go' }, go, h('small', { textContent: '主持人的主人看得到汤底：别让要一起猜的人的 agent 主持。' })),
  ]))
  form.onchange = (ev) => { if (ev.target !== pick) fill() }
  fill()
  form.onsubmit = async (ev) => {
    ev.preventDefault()
    go.disabled = true
    try {
      const shown = shownNow()
      const puzzle = form.elements.which.value === 'pick' ? puzzles.find((p) => p.id === pick.value) : shown[Math.floor(Math.random() * shown.length)]
      if (!puzzle) throw new Error('没有这个难度的题')
      await startRound(puzzle)
    } catch (e) {
      fail('没开成', e)
    } finally {
      go.disabled = false
    }
  }
  return form
}

/** The round file in this chat, its host woken; it opens here. */
async function startRound(puzzle) {
  const at = Date.now()
  const d = new Date(at)
  const stamp = `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
  const entry = await window.gugu.files.create({ chat: ctx.chat.id, name: `${puzzle.title} ${stamp}${FILE_SUFFIX}` }, newRound({ puzzle, host: null, at }))
  const result = await window.gugu.dispatch(`请主持这局海龟汤「${puzzle.title}」。`, { refs: [{ file: entry }], offer: ['agent-in-chat'] })
  if (result.cancelled) {
    await window.gugu.files.remove(entry)
    return
  }
  await openRound(entry)
  current.data.host = result.to.member
  drawRound()
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
  lobbyDrawn++
  $('#lobby').hidden = true
  $('#round').hidden = false
  document.body.dataset.view = 'round'
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

/** A verdict as a stamp; one still waiting for the host is a dashed outline. */
function stamp(q) {
  if (!q.verdict) return { text: '判定中', cls: 'pending' }
  if (q.verdict === 'close') return { text: `接近 ${q.hits ?? 0}/${current.data.puzzle.requiredCount}`, cls: 'close' }
  return { text: VERDICT_LABEL[q.verdict] ?? q.verdict, cls: q.verdict }
}

/** Under the case: who hosts, how far along, who plays — or how it ended. */
function statusBar(round) {
  const p = round.puzzle
  const asked = askedCount(round)
  const given = hintsGiven(round)
  const solver = round.solvedBy && round.questions[round.solvedBy]?.by
  const lead = {
    waiting: h('span', { className: 'host' }, `等 ${nameOf(round.host)} 接手主持…`),
    playing: h('span', { className: 'host' }, h('gugu-avatar', { user: round.host, size: 'sm' }), `主持 ${nameOf(round.host)}`),
    solved: h('span', { className: 'host' }, solver ? h('gugu-avatar', { user: solver, size: 'sm' }) : null, `${solver ? nameOf(solver) : ''} 还原成功`),
    revealed: h('span', { className: 'host' }, '大家放弃了，汤底揭晓'),
  }[round.status] ?? h('span', { className: 'host', textContent: round.status })
  return h('div', { className: 'statusbar', role: 'group', ariaLabel: '这一局' },
    lead,
    h('span', { textContent: `${ended(round) ? '共问' : '已问'} ${asked}` }),
    p.hintCount ? h('span', { className: 'hints', ariaLabel: `提示 ${given}/${p.hintCount}` },
      '提示', h('span', { className: 'cells' }, Array.from({ length: p.hintCount }, (_, i) => h('i', { className: i < given ? 'on' : '' })))) : null,
    h('span', { className: 'grow' }),
    faces(playersOf(round)))
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
  const given = hintsGiven(round)
  put($('#board'),
    // Opened for its file the panel or tab is the round's own; from the lobby, a way back to it.
    ctx.file ? null : h('div', {}, h('button', { type: 'button', className: 'link back', onclick: () => { closeRound(); showLobby() } }, h('gugu-icon', { name: 'chevron-left' }), '回到大厅')),
    h('article', { className: 'stage case', ariaLabel: '汤面' },
      h('small', { className: 'kicker', textContent: '汤面' }),
      h('h2', { textContent: p.title }),
      h('p', { className: 'surface', textContent: p.surface }),
      h('div', { className: 'tags' }, h('span', { textContent: LANGS[p.lang] ?? p.lang }), DIFFICULTY_LABEL[p.difficulty] ? h('span', { textContent: DIFFICULTY_LABEL[p.difficulty] }) : null)),
    statusBar(round),
    round.bottom ? h('article', { className: `card stack bottom st-${round.status}`, ariaLabel: '汤底' }, h('h5', { textContent: '汤底' }), h('p', { className: 'surface', textContent: round.bottom }), credit(p)) : null,
    given ? h('details', { open: !ended(round) }, h('summary', { textContent: `提示（${given}）` }),
      h('ol', {}, Object.keys(round.hints).sort((a, b) => a - b).map((k) => h('li', { textContent: round.hints[k].text })))) : null,
    questions.length
      ? h('ul', { className: 'qa', ariaLabel: '问答' }, questions.map((q) => {
          const s = stamp(q)
          return h('li', { dataset: { key: q.id }, className: q.kind === 'guess' ? 'guess' : '' },
            h('gugu-avatar', { user: q.by }),
            h('div', {}, h('div', { className: 'q', textContent: (q.kind === 'guess' ? '还原：' : '') + q.text }), h('small', { className: 'muted', textContent: nameOf(q.by) })),
            h('mark', { className: `stamp s-${s.cls}`, textContent: s.text }))
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

// The box people type in is drawn once per round and never redrawn: a draft, its caret and IME survive every update.
let input, askBtn, guessBtn, actions
function drawControls() {
  input = h('textarea', { rows: 2, maxLength: MAX_GUESS, placeholder: '问一个能用是 / 不是回答的问题；想通了就写下整个故事，点「还原」', ariaLabel: '问题或还原' })
  askBtn = h('button', { type: 'submit', className: 'primary', textContent: '提问' })
  guessBtn = h('button', { type: 'button', textContent: '还原', onclick: () => submit('guess') })
  actions = h('span', { className: 'actions' })
  const form = h('form', { className: 'ask' }, input, h('div', { className: 'bar' }, actions, h('span', { className: 'grow' }), guessBtn, askBtn))
  form.onsubmit = (ev) => { ev.preventDefault(); submit('ask') }
  input.onkeydown = (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); submit('ask') }
  }
  put($('#controls'), form)
}

function drawActions() {
  const f = current
  const round = f.data
  const over = ended(round) || f.status === 'gone'
  for (const el of [input, askBtn, guessBtn]) el.disabled = over
  for (const el of [input, askBtn, guessBtn]) el.hidden = ended(round)
  if (ended(round)) {
    put(actions, ctx.file
      ? h('small', { className: 'muted', textContent: '这一局结束了' })
      : h('button', { type: 'button', className: 'primary', textContent: '再来一局', onclick: () => { closeRound(); showLobby() } }))
    return
  }
  const given = hintsGiven(round)
  const votes = Object.keys(round.giveUp ?? {}).length
  const mine = myId && round.giveUp?.[myId]
  put(actions,
    h('button', {
      type: 'button',
      className: 'link',
      disabled: over || given >= round.puzzle.hintCount || hintWaiting(round),
      textContent: hintWaiting(round) ? '等主持给提示…' : given >= round.puzzle.hintCount ? '没有提示了' : `要提示（${given}/${round.puzzle.hintCount}）`,
      onclick: askHint,
    }),
    h('button', { type: 'button', className: mine ? 'link' : 'link danger', disabled: over, textContent: mine ? '收回放弃' : '放弃，看汤底', onclick: toggleGiveUp }),
    votes ? h('small', { className: 'muted', textContent: `${votes}/${giveUpNeeded(round)} 人同意揭晓` }) : null,
  )
}

/** Wake the host — unless something already waits for it: it handles everything waiting before it stops. */
async function tellHost(round, before, text) {
  if (round.status !== 'playing' || before) return
  await window.gugu.dispatch(text, { to: { chat: current.entry.chat, member: round.host }, refs: [{ file: current.entry }] })
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
      await window.gugu.dispatch(`海龟汤「${f.data.puzzle.title}」的玩家投票放弃了，请揭晓汤底。`, { to: { chat: f.entry.chat, member: f.data.host }, refs: [{ file: f.entry }] })
    }
  } catch (e) {
    fail('没投成', e)
  }
}

if (ctx.file) await openRound(ctx.file)
else await showLobby()
