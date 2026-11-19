// 协作看板 — the board page: one list of cards grouped by what they need (等你, 进行中, 等别的, then 没人接 and 完成
// folded), a card opened in a sheet, and the owner's answer sent to the card's holder. The same page on a phone and a
// desktop, for a chat's board (its file, live) and this computer's (through the background page and the App's program).
import { asCurrent, groups, stateOf, checksOf, openChecks, logOf, age, findCard } from './lib/core.js'
import { CHAT_BOARD_NAME, openChatBoard, findBoard, applyToFile } from './lib/chat-board.js'

const g = window.gugu
const $ = (id) => document.getElementById(id)

const WORDS = {
  zh: {
    title: '协作看板', local: '本机看板', add: '新建卡片', addOk: '添加', cancel: '取消', newTitle: '要做的事',
    groups: { owner: '等你', progress: '进行中', waiting: '等别的', unclaimed: '没人接', done: '完成' },
    summary: (n) => [n.owner && `${n.owner} 等你`, n.running !== null ? `${n.running} 在跑` : `${n.progress} 进行中`, n.stopped && `${n.stopped} 停了`, n.waiting && `${n.waiting} 等别的`].filter(Boolean).join(' · ') || '没有进行中的卡片',
    states: { running: '在跑', stopped: '停了', error: '出错', asking: '等批准' },
    stoppedFor: (a) => `停了 ${a}`, next: '下一步', nextPrefix: '下一步：', waitsOn: (w, a) => `等 ${w} · ${a}`,
    reply: '回复…', send: '发送', undo: '撤销', answered: (a) => `已答「${a}」`, recorded: '答复已记下', notSent: (w) => `答复已记下，但没发到持有者：${w}`,
    holder: '持有', nobody: '没人接', you: '你', wait: '等', question: '问你', checks: '清单', note: '说明', log: '记录', addCheck: '添加一项…',
    editNote: '编辑说明', save: '保存', emptyNote: '还没有说明', earlier: (n) => `更早 ${n} 条`, handTo: '交给…', done: '完成', reopen: '重开',
    cite: '引用', open: '打开', lead: (n) => `主管：${n}`, noLead: '未设主管', leadNone: '不设主管', noAgents: '这个群里还没有 agent',
    leadSetBy: (who, when) => `${who} 设定 · ${when}`,
    leadText: (c, done, who, open, arg) => `协作看板的卡 ${c.id}「${c.title}」被 ${who} ${done ? '标为完成' : '重新打开'}${open.length ? `；还开着的检查项：${open.join('、')}` : `（清单 ${checksOf(c).length ? `${checksOf(c).filter((x) => x.done).length}/${checksOf(c).length}` : '无'}）`}。你是这块看板的主管：用 kanban__board { ${arg}card: "${c.id}" } 读全卡，核对后按 SKILL 里主管的做法处理。`,
    leadNotSent: (w) => `已改，但没告诉主管：${w}`,
    more: '更多', del: '删除卡片', confirmDel: (t) => `删除「${t}」？卡片和它的记录都会删掉。`, close: '关闭', rename: '改标题',
    openRefused: (open) => `还不能完成：${open}`, empty: '还没有卡片', emptyHint: '点「+」添加一张，或让 agent 用 kanban__set 添加。',
    desktopOnly: '本机看板只在电脑上', phoneHint: '在群或私聊里打开协作看板，用的是那个对话的看板。', gone: '这块看板的文件已不可用。',
    noBoard: (e) => `看板读不出来：${e}`, latest: (n) => `最近 ${n} 张`,
    handText: (c, arg) => `请接手协作看板的卡 ${c.id}「${c.title}」：先用 kanban__board { ${arg}card: "${c.id}" } 读全卡，再用 kanban__set { ${arg}card: "${c.id}", hold: true } 认领，照清单推进。`,
    answerText: (c, q, a, arg) => `Owner 在协作看板答复了卡 ${c.id}「${c.title}」：${q} → ${a}。照这个继续；全卡见 kanban__board { ${arg}card: "${c.id}" }。`,
    handed: (who) => `交给 ${who}`, sep: '：', listSep: '、',
    unreached: '没交出去：这个 agent 现在不在你任何一台在线的电脑上。先在那台电脑上打开咕咕，或换一个 agent。',
    notHanded: (why) => `没交出去：${why}`,
    thatAgent: '这个 agent',
    pick: (c) => ({ title: '交给谁', subject: c.title, body: checksOf(c).length ? '它会接手这张卡，按清单做下去。' : '它会接手这张卡。', action: '交给', search: '搜索你的 agent', empty: '没有找到 agent' }),
    verbs: {
      created: '创建', took: '接手', released: '放下', 'held by': '持有者设为', waits: '等', 'no longer waits': '不再等', asks: '问 owner', withdrew: '撤回问题',
      answered: '答复', ticked: '勾上', unticked: '取消勾选', 'added check': '加清单项', 'removed check': '删清单项', done: '完成', reopened: '重开', title: '改标题为',
      next: '下一步', note: '改了说明', said: '', column: '原在列', 'moved from 1.x': '从 1.x 迁移',
    },
  },
  en: {
    title: 'Teamboard', local: 'This computer', add: 'New card', addOk: 'Add', cancel: 'Cancel', newTitle: 'Something to do',
    groups: { owner: 'Waiting on you', progress: 'In progress', waiting: 'Waiting', unclaimed: 'Unclaimed', done: 'Done' },
    summary: (n) => [n.owner && `${n.owner} waiting on you`, n.running !== null ? `${n.running} running` : `${n.progress} in progress`, n.stopped && `${n.stopped} stopped`, n.waiting && `${n.waiting} waiting`].filter(Boolean).join(' · ') || 'Nothing in progress',
    states: { running: 'Running', stopped: 'Stopped', error: 'Error', asking: 'Needs approval' },
    stoppedFor: (a) => `stopped ${a}`, next: 'Next', nextPrefix: 'Next: ', waitsOn: (w, a) => `on ${w} · ${a}`,
    reply: 'Reply…', send: 'Send', undo: 'Undo', answered: (a) => `Answered “${a}”`, recorded: 'Answer recorded', notSent: (w) => `Answer recorded, not delivered to the holder: ${w}`,
    holder: 'Holder', nobody: 'Nobody', you: 'You', wait: 'Waiting on', question: 'Asks you', checks: 'Checklist', note: 'Note', log: 'Log', addCheck: 'Add an item…',
    editNote: 'Edit note', save: 'Save', emptyNote: 'No note yet', earlier: (n) => `${n} earlier`, handTo: 'Hand to…', done: 'Done', reopen: 'Reopen',
    cite: 'Cite', open: 'Open', lead: (n) => `Lead: ${n}`, noLead: 'No lead', leadNone: 'No lead', noAgents: 'No agent in this chat yet',
    leadSetBy: (who, when) => `set by ${who} · ${when}`,
    leadText: (c, done, who, open, arg) => `Teamboard card ${c.id} “${c.title}” was ${done ? 'marked done' : 'reopened'} by ${who}${open.length ? `; open checks: ${open.join(', ')}` : ` (checklist ${checksOf(c).length ? `${checksOf(c).filter((x) => x.done).length}/${checksOf(c).length}` : 'none'})`}. You are this board's lead: read the card with kanban__board { ${arg}card: "${c.id}" }, check it, and act as the skill says a lead does.`,
    leadNotSent: (w) => `Changed, but the lead was not told: ${w}`,
    more: 'More', del: 'Delete card', confirmDel: (t) => `Delete “${t}”? The card and its log go.`, close: 'Close', rename: 'Rename',
    openRefused: (open) => `Not done yet: ${open}`, empty: 'No cards yet', emptyHint: 'Add one with “+”, or ask an agent to add one with kanban__set.',
    desktopOnly: "This computer's board is on the computer", phoneHint: "Open Teamboard in a group or private chat for that chat's board.", gone: 'This board file is no longer available.',
    noBoard: (e) => `Could not read the board: ${e}`, latest: (n) => `latest ${n}`,
    handText: (c, arg) => `Please take Teamboard card ${c.id} “${c.title}”: read it with kanban__board { ${arg}card: "${c.id}" }, take it with kanban__set { ${arg}card: "${c.id}", hold: true }, and work through its checklist.`,
    answerText: (c, q, a, arg) => `The owner answered on Teamboard card ${c.id} “${c.title}”: ${q} → ${a}. Carry on from it; the card: kanban__board { ${arg}card: "${c.id}" }.`,
    handed: (who) => `handed to ${who}`, sep: ': ', listSep: ', ',
    unreached: 'Not handed over: that agent is not on any of your computers that are online. Open gugu on its computer, or pick another agent.',
    notHanded: (why) => `Not handed over: ${why}`,
    thatAgent: 'that agent',
    pick: (c) => ({ title: 'Hand to', subject: c.title, body: checksOf(c).length ? 'It takes this card and works through its checklist.' : 'It takes this card.', action: 'Hand over', search: 'Search your agents', empty: 'No agent found' }),
    verbs: {
      created: 'created', took: 'took it', released: 'released', 'held by': 'held by', waits: 'waits on', 'no longer waits': 'no longer waits on', asks: 'asks the owner',
      withdrew: 'withdrew the question', answered: 'answered', ticked: 'ticked', unticked: 'unticked', 'added check': 'added', 'removed check': 'removed', done: 'done',
      reopened: 'reopened', title: 'renamed to', next: 'next', note: 'edited the note', said: '', column: 'was in column', 'moved from 1.x': 'moved from 1.x',
    },
  },
}

let ctx = await g.getContext()
const wordsFor = (locale) => WORDS[String(locale ?? '').startsWith('zh') ? 'zh' : 'en']
let t = wordsFor(ctx.locale)
// This computer's board lives behind the background page and the program, which a phone has neither of.
const desktop = typeof g.onBackgroundMessage === 'function'

/** Where the board shown is kept: { kind: 'local' } or { kind: 'chat', f, name } (a live board file). */
let home = null
let board = null
let wanted = null // the card a link asked for, until its board is here (openWanted)
let agents = null // the task list by session, or null when the host cannot give it: then no dots, nothing else changes
let thisMachine = null
let selected = null
let noteEditing = false
let logOpen = false
let handFailed = null // { card, text }: the card whose last 交给… did not reach the agent, and why — said in its sheet, where the person is
const pending = new Map() // card id -> { answer, timer }: an answer the owner can still take back
const waiting = new Map() // a local change sent to the background page -> its promise
let visible = ctx.layout?.visible ?? true

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value)
    else if (key === 'text') el.textContent = value
    else el.setAttribute(key, value === true ? '' : String(value))
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid)
  return el
}
const icon = (name) => h('gugu-icon', { name })
const ageWords = (iso) => {
  const a = age(iso)
  return t === WORDS.zh ? a.replace(/m$/, ' 分').replace(/h$/, ' 时').replace(/d$/, ' 天') : a
}

function showAlert(message) {
  $('alert').replaceChildren(...(message ? [h('span', { text: message }), h('button', { type: 'button', class: 'icon', 'aria-label': t.close, onclick: () => showAlert(null) }, icon('x'))] : []))
  $('alert').hidden = !message
}
const said = (error) => showAlert(error?.message ?? String(error))

// ── writing ─────────────────────────────────────────────────────────────────

const self = () => (home?.kind === 'chat' ? home.f.presence?.self ?? null : null)

/** One change to the board shown; resolves its result, rejects with the reason (already said in #alert). */
async function change(op) {
  try {
    // A chat with no board yet: the first change makes its file, and the page follows it from then on.
    if (home?.kind === 'chat-unmade') await showChatBoard(() => openChatBoard(g.files, home.chat.id))
    if (home?.kind === 'chat') return applyToFile(home.f, op, self()?.userId ?? 'person', {}, self()?.name)
    if (home?.kind !== 'local') throw new Error(t.noBoard('—'))
    const id = crypto.randomUUID()
    return await new Promise((resolve, reject) => {
      waiting.set(id, { resolve, reject })
      g.sendToBackground({ type: 'op', id, op }).catch((error) => { waiting.delete(id); reject(error) })
    })
  } catch (error) {
    said(error)
    throw error
  }
}
const quietly = (promise) => promise.catch(() => {}) // a refusal is already in #alert

/** How the tools name this board in a message to an agent: `chat: "…", ` for a chat's, nothing for this computer's. */
const chatArg = () => (home?.kind === 'chat' ? `chat: "${home.f.entry.chat}", ` : '')

// ── the task list: dots, and who to send an answer to ───────────────────────

function liveState(row) {
  // Not in the list: someone else's agent, a machine not reached, or archived — the page cannot tell, so it says nothing.
  if (!row) return null
  if (row.failure || row.status === 'error') return 'error'
  if (row.status === 'working') return 'running'
  if (row.status === 'needs_user') return 'asking'
  return 'stopped'
}
const rowOf = (card) => (agents && card.holder?.session ? agents.get(card.holder.session) ?? null : undefined)
/** running | stopped | error | asking, or null when the page cannot know (no task list, a person holds it, or the
 * holder's session is not in the viewer's list). */
const dotOf = (card) => (agents && card.holder && card.holder !== 'person' ? liveState(rowOf(card)) : null)
const isStopped = (card) => stateOf(card) === 'progress' && ['stopped', 'error'].includes(dotOf(card))

let asking = null
function readAgents() {
  if (typeof g.listAgents !== 'function') return
  if (asking) return asking
  asking = g.listAgents({ report: true }).then((answer) => {
    const report = Array.isArray(answer) ? { agents: answer, devices: [] } : answer
    agents = new Map(report.agents.map((a) => [a.sessionId, a]))
    thisMachine = report.devices?.find((d) => d.thisMachine)?.label ?? thisMachine
    fillHolders()
  }).catch((error) => {
    agents = null
    g.reportError(`协作看板 could not read the task list: ${error?.message ?? error}`)
  }).finally(() => { asking = null; render() })
  return asking
}

/** A tool records a holder by session (and name, when gugu knows it); the page adds its name and machine once. */
function fillHolders() {
  if (!board || !agents) return
  for (const card of Object.values(board.cards)) {
    const row = rowOf(card)
    if (!row || card.doneAt) continue
    // A row from another machine carries its label; this machine's rows carry none, and only they may take its name.
    const machine = row.deviceLabel ?? (row.statusFrom === 'this_machine' ? thisMachine : null)
    const name = row.title
    if ((machine && card.holder.machine !== machine) || (name && !card.holder.name) || (row.agentId && !card.holder.agent)) {
      quietly(change({ type: 'holder.fill', card: card.id, session: card.holder.session, ...(name ? { name } : {}), ...(machine ? { machine } : {}), ...(row.agentId ? { agent: row.agentId } : {}) }))
    }
  }
}

// ── answers ─────────────────────────────────────────────────────────────────

/** One tap answers; for 5 seconds 撤销 takes it back and nothing is sent. Leaving the page sends it at once. */
function answer(card, words) {
  const text = String(words ?? '').trim()
  if (!text || pending.has(card.id)) return
  const timer = setTimeout(() => commit(card.id), 5000)
  pending.set(card.id, { answer: text, timer })
  showUndo()
  render()
}

async function commit(id) {
  const p = pending.get(id)
  if (!p) return
  clearTimeout(p.timer)
  pending.delete(id)
  showUndo()
  const card = board?.cards[id]
  let result
  try {
    result = await change({ type: 'answer', card: id, answer: p.answer })
  } catch {
    render()
    return
  }
  // To whoever holds the card; else to whoever asked. Its agent id is on the card, or found by its session.
  const to = (card?.holder !== 'person' && (card?.holder?.agent ?? rowOf(card)?.agentId)) || (/^user:/.test(result.asker ?? '') ? result.asker : null)
  if (to) await tell(t.answerText(card, result.question, result.answer, chatArg()), { to: { agent: to } }, t.notSent)
  render()
}

/** Words for one agent, after a person's change: an answer to the card's holder, a done or reopen to the board's lead. */
async function tell(text, opts, notSent) {
  if (typeof g.dispatch !== 'function') return
  try {
    await g.dispatch(text, opts)
  } catch (error) {
    showAlert(notSent(error?.message ?? String(error)))
  }
}

/** A person marks a card done or reopens it; the board's lead, when it has one, is told. Agents' own changes tell no one. */
async function finish(card, done) {
  try {
    await change({ type: 'set', card: card.id, done })
  } catch {
    return
  }
  const now = board?.cards[card.id] ?? card
  const lead = home?.kind === 'chat' ? board?.lead?.agent : null
  if (!lead) return
  // In the board's chat, @ the lead, from whoever clicked: the lead is an agent of the chat, maybe another person's, which
  // only a chat message reaches (one of the clicker's own agents is all `{ agent }` reaches).
  await tell(t.leadText(now, done, self()?.name ?? t.you, done ? [] : openChecks(now).map((c) => c.label), chatArg()), { to: { chat: home.f.entry.chat, member: lead }, visible: true }, t.leadNotSent)
}

// ── the board's lead (主管) ─────────────────────────────────────────────────

const leadName = () => board?.lead && (ctx.chat?.members?.find((m) => m.id === board.lead.agent)?.name ?? board.lead.name ?? board.lead.agent.replace(/^user:/, '').slice(0, 8))

function renderLead() {
  const button = $('lead')
  const shown = home?.kind === 'chat' || home?.kind === 'chat-unmade'
  button.hidden = !shown
  if (!shown) return
  button.textContent = board?.lead ? t.lead(leadName()) : t.noLead
  button.classList.toggle('unset', !board?.lead)
  const last = board?.log ? logOf(board).at(-1) : null
  button.title = last ? t.leadSetBy(whoWrote(last), new Date(last.at).toLocaleString()) : ''
}

$('lead').addEventListener('click', async (e) => {
  const agentsHere = (ctx.chat?.members ?? []).filter((m) => m.kind === 'agent')
  const r = e.currentTarget.getBoundingClientRect()
  try {
    const picked = await g.showContextMenu({ x: r.left, y: r.bottom, items: agentsHere.length
      ? [...agentsHere.map((m) => ({ id: m.id, label: m.name, person: m.id, checked: board?.lead?.agent === m.id })), { type: 'separator' }, { id: 'none', label: t.leadNone, checked: !board?.lead }]
      : [{ id: 'none', label: t.noAgents, enabled: false }] })
    if (!picked || (picked === 'none' && !board?.lead) || picked === board?.lead?.agent) return
    const m = agentsHere.find((a) => a.id === picked)
    await change({ type: 'lead', agent: m ? m.id : null, ...(m ? { name: m.name } : {}) })
  } catch (error) {
    said(error)
  }
})

function showUndo() {
  const last = [...pending.entries()].at(-1)
  $('undo').hidden = !last
  if (!last) return $('undo').replaceChildren()
  const [id, p] = last
  $('undo').replaceChildren(h('span', { text: t.answered(p.answer) }), h('button', { type: 'button', text: t.undo, onclick: () => {
    clearTimeout(p.timer)
    pending.delete(id)
    showUndo()
    render()
  } }))
}

addEventListener('pagehide', () => { for (const id of pending.keys()) commit(id) })

// ── the list ────────────────────────────────────────────────────────────────

const holderLine = (card) => {
  const holder = card.holder
  if (!holder) return null
  if (holder === 'person') return t.you
  return [holder.name ?? `session:${holder.session.slice(0, 8)}`, holder.machine].filter(Boolean).join(' · ')
}

function dot(card) {
  const d = dotOf(card)
  return d ? h('i', { class: `dot ${d}`, title: t.states[d], 'aria-label': t.states[d], role: 'img' }) : null
}

function questionBlock(card) {
  const { question, options = [] } = card.wait
  // A question with no answers to pick is answered in words: the box is open from the start.
  const reply = h('form', { class: 'reply', hidden: options.length > 0, onsubmit: (e) => { e.preventDefault(); answer(card, input.value) } })
  const input = h('input', { 'aria-label': t.reply, placeholder: t.reply, maxlength: 2000 })
  reply.append(input, h('button', { class: 'primary', text: t.send }))
  return h('div', { class: 'ask' },
    h('p', { class: 'q', text: question }),
    options.length ? h('div', { class: 'answers' },
      ...options.map((o) => h('button', { type: 'button', class: 'answer', text: o, onclick: () => answer(card, o) })),
      h('button', { type: 'button', class: 'answer plain', text: t.reply, onclick: () => { reply.hidden = false; input.focus() } })) : null,
    reply)
}

function row(card, state) {
  const titleId = `t-${card.id}`
  const open = () => openCard(card.id)
  const sub = []
  if (state === 'owner') sub.push(h('small', { class: 'muted', text: holderLine(card) ?? t.nobody }))
  if (state === 'progress') {
    const d = dotOf(card)
    if (isStopped(card)) sub.push(h('small', { class: `stopped ${d}`, text: d === 'error' ? t.states.error : t.stoppedFor(ageWords(rowOf(card)?.updatedAt ?? logOf(card).at(-1)?.at ?? card.createdAt)) }))
    if (card.next) sub.push(h('small', { class: 'muted', text: `${t.nextPrefix}${card.next}` }))
    else if (!isStopped(card)) sub.push(h('small', { class: 'muted', text: holderLine(card) ?? '' }))
  }
  if (state === 'waiting') sub.push(h('small', { class: 'muted', text: t.waitsOn(card.wait.what, ageWords(card.wait.since)) }))
  if (state === 'unclaimed' && card.next) sub.push(h('small', { class: 'muted', text: `${t.nextPrefix}${card.next}` }))
  if (state === 'done') sub.push(h('gugu-time', { datetime: card.doneAt }))
  const checks = checksOf(card)
  return withMenu(h('article', { class: `card ${state}${selected === card.id ? ' selected' : ''}`, 'aria-labelledby': titleId, 'data-key': card.id },
    h('button', { type: 'button', class: 'head', onclick: open },
      state === 'progress' ? dot(card) : null,
      h('span', { class: 'what' }, h('strong', { id: titleId, text: card.title }), ...sub),
      checks.length && state !== 'done' ? h('small', { class: 'count muted', text: `${checks.filter((c) => c.done).length}/${checks.length}` }) : null),
    state === 'owner' ? questionBlock(card) : null), card)
}

function counts(gr) {
  // 在跑 only when every card in progress has a known state; otherwise the line says how many are in progress.
  const known = agents !== null && gr.progress.every((c) => dotOf(c) !== null)
  const stopped = gr.progress.filter(isStopped).length
  return { owner: gr.owner.length, progress: gr.progress.length, waiting: gr.waiting.length, running: known ? gr.progress.length - stopped : null, stopped }
}

function render() {
  if (!board) return
  const shown = { ...board, cards: Object.fromEntries(Object.entries(board.cards).map(([id, c]) => [id, pending.has(id) ? { ...c, wait: null } : c])) }
  const gr = groups(shown, isStopped)
  const n = counts(gr)
  $('heading').textContent = home?.kind === 'chat' ? home.name : t.local
  $('summary').textContent = t.summary(n)
  renderLead()
  g.setTabBadge?.(gr.owner.length || null)?.catch?.((error) => g.reportError(`setTabBadge: ${error?.message ?? error}`))
  const list = $('list')
  const section = (state, cards) => h('section', { class: `group ${state}`, 'aria-labelledby': `g-${state}` },
    h('h5', { id: `g-${state}` }, t.groups[state], h('small', { class: 'muted', text: ` ${cards.length}` })),
    ...cards.map((c) => row(c, state)))
  const folded = (state, cards, max) => {
    const el = h('details', { class: `group folded ${state}`, 'data-state': state },
      h('summary', {}, h('span', { text: t.groups[state] }), h('small', { class: 'muted', text: ` ${cards.length}${max && cards.length > max ? ` · ${t.latest(max)}` : ''}` })),
      ...cards.slice(0, max ?? cards.length).map((c) => row(c, state)))
    el.open = openFolds.has(state)
    el.addEventListener('toggle', () => (el.open ? openFolds.add(state) : openFolds.delete(state)))
    return el
  }
  const parts = []
  if (gr.owner.length) parts.push(section('owner', gr.owner))
  if (gr.progress.length) parts.push(section('progress', gr.progress))
  if (gr.waiting.length) parts.push(section('waiting', gr.waiting))
  if (!Object.keys(board.cards).length) parts.push(h('gugu-empty', { icon: 'layout-list' }, h('strong', { text: t.empty }), h('small', { text: t.emptyHint })))
  else parts.push(h('div', { class: 'folds' }, folded('unclaimed', gr.unclaimed), folded('done', gr.done, 20)))
  // Keep a reply being typed: the list is redrawn on every change anyone makes.
  const typing = document.activeElement?.closest?.('#list .reply')
  if (typing) return
  list.replaceChildren(...parts)
  if (selected) renderSheet()
}
const openFolds = new Set()

// ── citing a card ───────────────────────────────────────────────────────────

/**
 * 引用: the card as gugu's own 引用 pill in the board's chat composer — "协作看板.board.json · <id> · <title>", the board file
 * at that card — which the person sends themselves, as a file's or a message's. A click on it opens the board on the card
 * (`onLink`, `query.card`); an agent reading it has the id for kanban__board. Only a chat's board: this computer's names no chat.
 */
async function cite(card) {
  try {
    // The pill names its file, and so the chat whose composer it goes into: no `to` beside it (gugu refuses both).
    await g.dispatch('', { draft: true, refs: [{ file: home.f.entry, at: { card: card.id }, label: `${card.id} · ${card.title}` }] })
  } catch (error) {
    said(error)
  }
}
const citable = () => home?.kind === 'chat' && typeof g.dispatch === 'function'

/** A card's menu, gugu's own: right-click, the menu key, or a long press on a phone (as the Files App's rows do). */
function withMenu(el, card) {
  const show = async (x, y) => {
    try {
      const picked = await g.showContextMenu({ x, y, items: [{ id: 'open', label: t.open }, ...(citable() ? [{ id: 'cite', label: t.cite }] : [])] })
      if (picked === 'open') openCard(card.id)
      if (picked === 'cite') await cite(card)
    } catch (error) {
      said(error)
    }
  }
  if (typeof g.showContextMenu !== 'function') return el
  let timer = null
  let held = false
  let from = null
  const cancel = () => { clearTimeout(timer); timer = null }
  const typing = (e) => e.target.closest?.('input, textarea')
  el.addEventListener('contextmenu', (e) => {
    if (typing(e)) return
    e.preventDefault()
    // A long press may fire this as well as run out its timer: the menu opens once, and the tap that ends it opens nothing.
    const holding = timer !== null
    cancel()
    if (held) return
    held = holding
    show(e.clientX, e.clientY)
  })
  el.addEventListener('keydown', (e) => {
    if (typing(e) || !(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return
    e.preventDefault()
    const r = e.target.getBoundingClientRect()
    show(r.left + 16, r.bottom)
  })
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || typing(e)) return
    cancel()
    held = false
    from = { x: e.clientX, y: e.clientY }
    timer = setTimeout(() => { timer = null; if (el.isConnected) { held = true; show(from.x, from.y) } }, 500)
  })
  el.addEventListener('pointermove', (e) => { if (from && timer !== null && (Math.abs(e.clientX - from.x) > 8 || Math.abs(e.clientY - from.y) > 8)) cancel() })
  el.addEventListener('pointerup', cancel)
  el.addEventListener('pointercancel', () => { cancel(); held = false })
  el.addEventListener('click', (e) => { if (!held) return; held = false; e.stopImmediatePropagation(); e.preventDefault() }, true)
  return el
}

// ── a card, opened ──────────────────────────────────────────────────────────

function openCard(id) {
  selected = id
  noteEditing = false
  logOpen = false
  $('sheet').hidden = false
  $('scrim').hidden = false
  document.body.classList.add('sheet-open')
  render()
  $('sheet').querySelector('.close')?.focus()
}

function closeCard() {
  selected = null
  $('sheet').hidden = true
  $('scrim').hidden = true
  $('sheet').replaceChildren()
  document.body.classList.remove('sheet-open')
  render()
}
$('scrim').addEventListener('click', closeCard)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && selected && !e.target.closest?.('input, textarea')) closeCard() })

async function confirm(text, yes) {
  $('confirm-text').textContent = text
  $('confirm-yes').textContent = yes
  $('confirm-no').textContent = t.cancel
  $('confirm').showModal()
  return new Promise((resolve) => $('confirm').addEventListener('close', () => resolve($('confirm').returnValue === 'yes'), { once: true }))
}

let md = null
function renderSheet() {
  const card = board.cards[selected]
  if (!card) return closeCard()
  // Leave a sheet being typed into alone; it is redrawn once the typing is done.
  if ($('sheet').contains(document.activeElement) && document.activeElement.matches('input, textarea')) return
  const set = (fields) => quietly(change({ type: 'set', card: card.id, ...fields }))
  const state = stateOf(card)
  const field = (label, ...body) => h('div', { class: 'field' }, h('h5', { text: label }), ...body)
  const parts = []

  const title = h('h2', { id: 's-title', tabindex: 0, title: t.rename, text: card.title, onclick: () => {
    const input = h('input', { value: card.title, maxlength: 200, 'aria-label': t.rename })
    const done = () => { const v = input.value.trim(); input.replaceWith(title); if (v && v !== card.title) set({ title: v }); else renderSheet() }
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { input.value = card.title; input.blur() } })
    input.addEventListener('blur', done, { once: true })
    title.replaceWith(input)
    input.focus()
  } })
  parts.push(h('header', { class: 'sheet-head' }, title, h('button', { type: 'button', class: 'icon close', 'aria-label': t.close, onclick: closeCard }, icon('x'))))

  const who = holderLine(card)
  const d = dotOf(card)
  parts.push(field(t.holder, h('p', { class: 'holder' }, d ? dot(card) : null, h('span', { text: who ?? t.nobody }), d ? h('small', { class: 'muted', text: ` · ${t.states[d]}` }) : null)))
  if (card.wait?.on === 'owner' && !pending.has(card.id)) parts.push(field(t.question, questionBlock(card)))
  if (card.wait?.on === 'other') parts.push(field(t.wait, h('p', { text: card.wait.what }, h('small', { class: 'muted', text: ` · ${ageWords(card.wait.since)}` }))))
  if (card.next) parts.push(field(t.next, h('p', { text: card.next })))

  const checks = checksOf(card)
  const addCheck = h('input', { class: 'add-check', placeholder: t.addCheck, 'aria-label': t.addCheck, maxlength: 200 })
  addCheck.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !addCheck.value.trim()) return
    const label = addCheck.value.trim()
    addCheck.value = ''
    addCheck.blur()
    set({ check: { [label]: false } })
  })
  parts.push(field(`${t.checks}${checks.length ? ` ${checks.filter((c) => c.done).length}/${checks.length}` : ''}`,
    h('ul', { class: 'checks' }, ...checks.map((c) => h('li', {},
      h('label', {}, h('input', { type: 'checkbox', checked: c.done, onchange: (e) => set({ check: { [c.label]: e.target.checked } }) }), h('span', { text: c.label })),
      c.note ? h('small', { class: 'muted', text: c.note }) : null))),
    addCheck))

  const noteBox = h('div', { class: 'note' })
  if (noteEditing) {
    const area = h('textarea', { rows: 8, 'aria-label': t.note })
    area.value = card.note
    noteBox.append(area, h('div', { class: 'row end' },
      h('button', { type: 'button', text: t.cancel, onclick: () => { noteEditing = false; area.blur(); renderSheet() } }),
      h('button', { type: 'button', class: 'primary', text: t.save, onclick: () => { noteEditing = false; area.blur(); set({ note: area.value }); renderSheet() } })))
  } else {
    const view = h('div', { class: 'md' })
    if (card.note) (md ? Promise.resolve(md) : g.markdown().then((m) => (md = m))).then((m) => m.render(view, card.note)).catch(said)
    else view.append(h('p', { class: 'muted', text: t.emptyNote }))
    noteBox.append(view, h('button', { type: 'button', class: 'plain', text: t.editNote, onclick: () => { noteEditing = true; renderSheet() } }))
  }
  parts.push(field(t.note, noteBox))

  const log = logOf(card).reverse()
  const shownLog = logOpen ? log : log.slice(0, 4)
  parts.push(field(t.log, h('ol', { class: 'log' }, ...shownLog.map((l) => h('li', {},
    h('gugu-time', { datetime: l.at }),
    h('span', {}, h('b', { text: whoWrote(l) }), ' ', [t.verbs[l.what] ?? l.what, l.text].filter(Boolean).join(t.verbs[l.what] && l.text ? t.sep : ''))))),
  log.length > shownLog.length ? h('button', { type: 'button', class: 'plain', text: `${t.earlier(log.length - shownLog.length)} ›`, onclick: () => { logOpen = true; renderSheet() } }) : null))

  // What keeps the card from being done is said here, beside the button, not after a refusal.
  const blocking = [...openChecks(card).map((c) => c.label), card.wait?.on === 'owner' ? card.wait.question : null].filter(Boolean)
  const actions = h('footer', { class: 'sheet-foot' },
    typeof g.dispatch === 'function' && state !== 'done' ? h('button', { type: 'button', text: t.handTo, onclick: () => handTo(card) }) : null,
    citable() ? h('button', { type: 'button', text: t.cite, onclick: () => cite(card) }) : null,
    state === 'done'
      ? h('button', { type: 'button', text: t.reopen, onclick: () => finish(card, false) })
      : h('button', { type: 'button', class: 'primary', text: t.done, disabled: blocking.length > 0, onclick: () => finish(card, true) }),
    h('button', { type: 'button', class: 'icon', 'aria-label': t.del, title: t.del, onclick: async () => {
      if (await confirm(t.confirmDel(card.title), t.del)) quietly(change({ type: 'delete', card: card.id }).then(closeCard))
    } }, icon('trash-2')),
    state !== 'done' && blocking.length ? h('p', { class: 'muted blocking', text: t.openRefused(blocking.join(t.listSep)) }) : null,
    handFailed?.card === card.id ? h('p', { class: 'blocking failed', role: 'alert', text: handFailed.text }) : null)
  parts.push(actions)
  $('sheet').replaceChildren(...parts)
}

/** A log line's author: the name it was written with, else the chat member, else a short id (1.x lines carry no name). */
function whoWrote(l) {
  if (l.by === self()?.userId || l.by === 'person') return t.you
  return l.name ?? ctx.chat?.members?.find((m) => m.id === l.by)?.name ?? l.by.replace(/^user:/, '').slice(0, 8)
}

/**
 * 交给…: gugu's sheet, in the board's words (the card's title and one line), picks one of the person's agents; the page then
 * tells it how to take the card — words for the agent, never shown in the sheet. A host without pickAgent shows its
 * dispatch sheet with those words, as 2.0.0 did.
 */
// The host's refusal names the agent by id; the person picked a name. not-found: no online computer of theirs has it.
function whyNotHanded(error, name) {
  if (error?.code === 'not-found') return t.unreached
  const why = String(error?.message ?? error ?? '').replace(/(user:)?[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi, name ?? t.thatAgent).trim()
  return t.notHanded(why || '?')
}

const nameOf = (id, otherwise) => ctx.chat?.members?.find((m) => m.id === id)?.name ?? [...(agents?.values() ?? [])].find((a) => a.agentId === id)?.title ?? otherwise

async function handTo(card) {
  try {
    let id
    if (handFailed) { handFailed = null; renderSheet() }
    if (typeof g.pickAgent === 'function') {
      const picked = await g.pickAgent(t.pick(card))
      if (!picked?.agent) return
      id = picked.agent.startsWith('user:') ? picked.agent : `user:${picked.agent}`
      const failed = await g.dispatch(t.handText(card, chatArg()), { to: { agent: id } }).then(() => null, (error) => error)
      if (failed) { handFailed = { card: card.id, text: whyNotHanded(failed, nameOf(id, null)) }; return renderSheet() }
    } else {
      const sent = await g.dispatch(t.handText(card, chatArg()), { offer: ['agent-in-chat', 'my-agent'] })
      if (sent?.cancelled) return
      id = sent?.to?.agent ?? sent?.to?.member
    }
    quietly(change({ type: 'set', card: card.id, log: t.handed(nameOf(id, id ?? '?')) }))
  } catch (error) {
    said(error)
  }
}

// ── a new card ──────────────────────────────────────────────────────────────

function newCard() {
  if (!home) return
  $('new').hidden = false
  $('new-title').focus()
}
$('add').addEventListener('click', newCard)
$('new-cancel').addEventListener('click', () => { $('new').hidden = true; $('new-title').value = '' })
$('new').addEventListener('submit', (e) => {
  e.preventDefault()
  const title = $('new-title').value.trim()
  if (!title) return
  quietly(change({ type: 'create', title }).then(() => { $('new-title').value = ''; $('new').hidden = true }))
})

// ── which board ─────────────────────────────────────────────────────────────

function words() {
  $('add').setAttribute('aria-label', t.add)
  $('add').title = t.add
  $('new-title').placeholder = t.newTitle
  $('new-title').setAttribute('aria-label', t.newTitle)
  $('new-ok').textContent = t.addOk
  $('new-cancel').textContent = t.cancel
}

async function showChatBoard(open) {
  if (home?.kind === 'chat') home.f.close()
  home = null
  try {
    const f = await open()
    const name = ctx.chat?.id === f.entry.chat ? ctx.chat.name : `${f.entry.chatName ?? ''}${f.entry.name === CHAT_BOARD_NAME ? '' : ` · ${f.entry.name.replace(/\.board\.json$/, '')}`}`.replace(/^ · /, '')
    home = { kind: 'chat', f, name: name || t.title }
    board = asCurrent(f.toJSON())
    f.onChange(({ local } = {}) => {
      board = asCurrent(f.toJSON())
      render()
      if (!local) readAgents()
    })
    f.onStatus?.((status) => { if (status === 'gone') showAlert(t.gone) })
    showAlert(null)
  } catch (error) {
    board = null
    showAlert(t.noBoard(error?.message ?? String(error)))
  }
  if (selected) closeCard()
  render()
  openWanted()
}

/** A link (a cited card's pill) can come before its board has loaded — it opened the page: the card opens once it is here. */
function openWanted() {
  if (!wanted || !board) return
  const id = wanted
  wanted = null
  try { openCard(findCard(board, id).id) } catch { render() }
}

if (desktop) g.onBackgroundMessage((message) => {
  if (message?.type === 'refused') {
    waiting.get(message.id)?.reject(new Error(message.message))
    waiting.delete(message.id)
    return
  }
  if (message?.type !== 'state') return
  if (message.done) {
    waiting.get(message.done.id)?.resolve(message.done.result)
    waiting.delete(message.done.id)
  }
  if (home?.kind !== 'local') return
  if (message.failure) showAlert(t.noBoard(message.failure))
  if (message.board) board = message.board
  render()
})

// Opened by a link: a message card names the board file; an old link may name a card to open.
g.onLink?.(async ({ query } = {}) => {
  if (!query) return
  if (query.board && !(home?.kind === 'chat' && home.f.entry.id === query.board)) await showChatBoard(() => g.files.open({ id: query.board, ...(ctx.chat ? { chat: ctx.chat.id } : {}) }))
  wanted = query.card ?? null
  if (board && wanted) openWanted()
  else render()
})

g.onContextChanged(async () => {
  ctx = await g.getContext()
  t = wordsFor(ctx.locale)
  words()
  const now = ctx.layout?.visible ?? visible
  if (now && !visible) {
    readAgents()
    if (desktop && home?.kind === 'local') g.sendToBackground({ type: 'hello' }).catch(said)
  }
  visible = now
  render()
})
if (typeof g.onAgentsChanged === 'function') g.onAgentsChanged(() => readAgents())
// Other computers' tasks are not pushed: read them again while the page is seen.
setInterval(() => { if (visible) readAgents() }, 60_000).unref?.()

/** The chat whose board this page shows: a chat's panel. A task's tab shows this computer's board. */
const boardChat = () => (ctx.workspace ? null : ctx.chat)

words()
if (ctx.file) await showChatBoard(() => g.files.open(ctx.file))
else if (boardChat()) {
  // The chat's board when it has one; made only by the first write (opening the page is a read).
  const found = await findBoard(g.files, boardChat().id).catch(() => null)
  if (found) await showChatBoard(() => g.files.open(found))
  else {
    home = { kind: 'chat-unmade', chat: boardChat() }
    board = asCurrent(null)
    $('heading').textContent = boardChat().name
    render()
    renderLead()
  }
} else if (desktop) {
  home = { kind: 'local' }
  board = asCurrent(null)
  g.sendToBackground({ type: 'hello' }).catch(said)
  render()
} else {
  $('main').replaceChildren(h('gugu-empty', { icon: 'layout-list' }, h('strong', { text: t.desktopOnly }), h('small', { text: t.phoneHint })))
}
readAgents()
