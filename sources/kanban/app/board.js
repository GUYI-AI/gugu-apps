// 协作看板 — the board page. The same page wherever it opens (the dock, a task's tab, a chat's panel, a board file), on
// one of two homes of a board: this computer's (from the background page; every change goes back through it to the
// App's program, its only writer) or a chat's (its board file, opened here live; a change is applied to the file).
// Everything below the home — cards, columns, the open card — is one page for both.
import { columnsInOrder, cardsIn, taskState, cardFlags } from './lib/core.js'
import { openChatBoard, applyToFile, BOARD_SUFFIX, CHAT_BOARD_NAME } from './lib/chat-board.js'

const g = window.gugu

const WORDS = {
  zh: {
    newCard: '新建卡片', cardTitle: '标题', title: '协作看板', local: '本机看板', addCard: '添加卡片', newPlaceholder: '卡片标题，按回车添加', attach: '关联当前任务',
    roles: { todo: '待办', doing: '进行中', review: '待验收', done: '完成' },
    states: { running: '运行中', parked: '后台运行', approval: '待批准', answer: '待回复', done: '本轮完成', stopped: '已停止', error: '出错', gone: '任务不可用', none: '无状态' },
    all: '全部', attention: '需要处理', count: (n) => `${n} 张卡片`, waitingCount: (n) => `${n} 张等待`, where: '看板',
    addColumn: '添加列', columnName: '列名', back: '返回', close: '关闭', more: '更多', del: '删除卡片', delAgain: '再次点击确认删除',
    column: '状态', progress: '进度', waitingOn: '等待', next: '下一步', due: '截止日期', owner: '负责人', props: '属性', unset: '未填写',
    addNote: '添加说明…', editNote: '编辑说明', addLink: '添加', noLinks: '暂无关联', messageLink: '群消息', waiting: (w) => `等待：${w}`, stale: '超过 45 分钟未更新',
    updated: '更新时间', toggle: '展开或收起',
    tasks: '任务', links: '文件与链接', noteH: '说明', comments: '评论', edit: '编辑', done: '完成',
    noteEmpty: '暂无说明', open: '打开任务', handTo: '转给任务', remove: '移除',
    attachCurrent: '关联当前任务', pickTask: '关联任务…', start: '新建任务', starting: '正在新建任务…',
    pickFile: '关联任务文件…', pickChatFile: '关联群文件…', addUrl: '添加链接', urlPlaceholder: 'https://…', ok: '确定', cancel: '取消',
    filter: '筛选', chooseTask: '选择任务', noTasks: '暂无任务', noFiles: '未找到文件。输入文件名可搜索全部对话。',
    show: '查看', openBeside: '在旁边打开', pickProjectFile: '关联项目文件…', chooseProject: '选择项目', noProjects: '暂无项目', browser: '打开', message: '查看消息',
    comment: '添加评论', send: '发表', byPerson: '我',
    desktopOnly: '本机看板仅支持在电脑上使用。', phoneHint: '在群或私聊的右栏打开协作看板，可查看该对话的看板。',
    noStatus: (e) => `无法读取任务状态：${e}`, noBoard: (e) => `无法读取看板：${e}`, gone: '看板文件已删除，或你已不在该对话中。',
    taskUnavailable: '任务已不存在，或当前不可用。', taskFilesUnavailable: '这个任务的工作副本或文件不在这台电脑上，或已不存在。',
    handText: (c, chat) => `请处理协作看板上的卡片（id ${c.id}）：${c.title}${c.note ? `\n\n${c.note}` : ''}\n\n` +
      `${chat ? `这张卡片在对话「${chat.name}」的看板上，调用看板工具时传 chat: "${chat.id}"。` : ''}` +
      '开始时用 claim 认领，进展用 update 更新，完成后用 move 移到「待验收」，并用 link 关联产出。',
  },
  en: {
    newCard: 'New card', cardTitle: 'Title', title: 'Teamboard', local: 'This computer', addCard: 'Add card', newPlaceholder: 'Card title, press Enter to add', attach: 'Link current task',
    roles: { todo: 'To do', doing: 'In progress', review: 'Review', done: 'Done' },
    states: { running: 'Running', parked: 'Running in background', approval: 'Awaiting approval', answer: 'Awaiting reply', done: 'Turn complete', stopped: 'Stopped', error: 'Error', gone: 'Task unavailable', none: 'No status' },
    all: 'All', attention: 'Needs attention', count: (n) => `${n} ${n === 1 ? 'card' : 'cards'}`, waitingCount: (n) => `${n} waiting`, where: 'Board',
    addColumn: 'Add column', columnName: 'Column name', back: 'Back', close: 'Close', more: 'More', del: 'Delete card', delAgain: 'Click again to confirm',
    column: 'Column', progress: 'Progress', waitingOn: 'Waiting on', next: 'Next step', due: 'Due', owner: 'Assignee', props: 'Properties', unset: 'Not set',
    addNote: 'Add a note…', editNote: 'Edit note', addLink: 'Add', noLinks: 'Nothing linked yet', messageLink: 'Chat message', waiting: (w) => `Waiting on ${w}`, stale: 'Not updated for over 45 minutes',
    updated: 'Updated', toggle: 'Expand or collapse',
    tasks: 'Tasks', links: 'Files and links', noteH: 'Note', comments: 'Comments', edit: 'Edit', done: 'Done',
    noteEmpty: 'No note', open: 'Open task', handTo: 'Send to task', remove: 'Remove',
    attachCurrent: 'Link current task', pickTask: 'Link task…', start: 'New task', starting: 'Creating task…',
    pickFile: 'Link task file…', pickChatFile: 'Link chat file…', addUrl: 'Add link', urlPlaceholder: 'https://…', ok: 'OK', cancel: 'Cancel',
    filter: 'Filter', chooseTask: 'Select task', noTasks: 'No tasks', noFiles: 'No files found. Enter a file name to search all chats.',
    show: 'View', openBeside: 'Open beside', pickProjectFile: 'Link project file…', chooseProject: 'Select project', noProjects: 'No projects', browser: 'Open', message: 'View message',
    comment: 'Add a comment', send: 'Post', byPerson: 'Me',
    desktopOnly: "This computer's board is only available on a computer.", phoneHint: "Open Teamboard in a chat's side panel to see that chat's board.",
    noStatus: (e) => `Unable to read task status: ${e}`, noBoard: (e) => `Unable to read the board: ${e}`, gone: 'The board file was deleted, or you are no longer in that chat.',
    taskUnavailable: 'This task no longer exists or is currently unavailable.', taskFilesUnavailable: 'This task’s working copy or file is not on this computer, or no longer exists.',
    handText: (c, chat) => `Please handle this card from Teamboard (id ${c.id}): ${c.title}${c.note ? `\n\n${c.note}` : ''}\n\n` +
      `${chat ? `It is on the board of the chat "${chat.name}": pass chat: "${chat.id}" to the board's tools. ` : ''}` +
      'Claim it with claim when you start, report progress with update; when finished, move it to Review and link the output with link.',
  },
}

const $ = (id) => document.getElementById(id)
// The page is moved between places (the dock, a chat's panel, a task's tab) and told by onContextChanged: where it
// is now — its session or chat — is read again on every change, never kept from the first load.
let ctx = await g.getContext()
let t = WORDS[String(ctx.locale ?? '').startsWith('zh') ? 'zh' : 'en']
// The same App page in the host dialog, with its own document and the same board writer.
const creating = ctx.modal?.data?.newCard
if (creating) document.body.classList.add('creating-card')
// This computer's board is read and written only through the background page and the App's program, and a phone has
// neither (its `gugu` has no onBackgroundMessage — the host's way of saying so). A chat's board needs neither.
const desktop = typeof g.onBackgroundMessage === 'function'

/** Where the board shown is kept: this computer (`{ kind: 'local' }`) or a chat's board file (`{ kind: 'chat', f }`). */
let home = null
let board = null
let localBoard = null
let agents = []
let agentsKnown = false // false on a phone, and until the background page has listed them: no status is drawn then
let filter = 'all'
let selected = null
let visible = ctx.layout?.visible ?? true
const collapsed = new Map() // column id -> collapsed, in the narrow layout; todo and done start collapsed
const waiting = new Map()
let stateProblem = ''

/** Element maker: text goes in as text (others wrote it), never as markup. */
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
const narrow = () => $('shell').clientWidth <= 640

function showAlert(message) {
  $('alert').replaceChildren(...(message ? [h('span', { text: message }), h('button', { class: 'plain', 'aria-label': t.close, onclick: () => showAlert(null) }, icon('x'))] : []))
  $('alert').hidden = !message
}

/** A missing task or working copy is a state of that link, rather than a failure of the board. */
async function taskAction(run, status, message) {
  try {
    await run()
  } catch (error) {
    if (error?.code === 'not-found') status.textContent = message
    else showAlert(error?.message ?? String(error))
  }
}

/** Who a change on this board is by: the person on this computer's board; on a chat's, their own id (others see it). */
const me = () => (home?.kind === 'chat' ? home.f.presence.self.userId : 'person')

/** One change to the board shown; resolves the result, rejects with the reason (already said in #alert). */
function change(op) {
  let done
  if (home?.kind === 'chat') {
    done = new Promise((resolve) => resolve(applyToFile(home.f, op, me())))
  } else {
    const id = crypto.randomUUID()
    done = new Promise((resolve, reject) => {
      waiting.set(id, { resolve, reject })
      g.sendToBackground({ type: 'op', id, op }).catch((error) => {
        waiting.delete(id)
        reject(error)
      })
    })
  }
  return done.catch((error) => {
    showAlert(error?.message ?? String(error))
    throw error
  })
}

// A change refused is already said in #alert; the click that asked for it has nothing more to do.
const quietly = (promise) => promise.catch(() => {})

if (desktop) g.onBackgroundMessage((message) => {
  if (message?.type === 'refused') {
    waiting.get(message.id)?.reject(new Error(message.message))
    waiting.delete(message.id)
    return
  }
  if (message?.type !== 'state') return
  localBoard = message.board
  agents = message.agents ?? []
  agentsKnown = !message.failure?.agents
  // Clears only what it said itself: another failure on the page (the switcher's) stays until it is fixed.
  const problems = [home?.kind === 'local' && message.failure?.board && t.noBoard(message.failure.board), message.failure?.agents && t.noStatus(message.failure.agents)].filter(Boolean)
  const problem = problems.join(' · ')
  if (problem && problem !== stateProblem) showAlert(problem)
  else if (!problem && stateProblem && !message.done) showAlert(null)
  stateProblem = problem
  if (message.done) {
    waiting.get(message.done.id)?.resolve(message.done.result)
    waiting.delete(message.done.id)
  }
  if (home?.kind === 'local') board = localBoard
  render()
})

const agentBySession = (session) => agents.find((a) => a.sessionId === session) ?? null
const agentById = (id) => agents.find((a) => a.agentId === id) ?? null
const stateOf = (session) => (agentsKnown ? taskState(agentBySession(session)) : null)
const columnTitle = (column) => column.title ?? t.roles[column.role] ?? column.id
const taskLinks = (card) => Object.entries(card.links).filter(([, l]) => l.kind === 'task')
const otherLinks = (card) => Object.entries(card.links).filter(([, l]) => l.kind !== 'task')
const flagsOf = (card) => cardFlags(board, card, stateOf, Date.now())
const chatOfBoard = () => (home?.kind === 'chat' ? { id: home.f.entry.chat, name: home.name } : null)

/** A task's status, as gugu states it; nothing where the statuses are not known (a phone). */
function stateBadge(link) {
  const state = stateOf(link.session)
  return state ? h('span', { class: `state ${state.key}`, text: t.states[state.key] }) : null
}

function byLabel(by) {
  if (by === 'person' || by === me()) return t.byPerson
  return ctx.chat?.members?.find((m) => m.id === by)?.name ?? agentById(by)?.title ?? by.slice(5, 13)
}

// ── the board ────────────────────────────────────────────────────────────────

function render() {
  if (!board) return
  if (creating) { renderNewCard(); return }
  const columns = columnsInOrder(board)
  const cards = Object.values(board.cards)
  const flags = new Map(cards.map((c) => [c.id, flagsOf(c)]))
  const attention = cards.filter((c) => flags.get(c.id).attention).length
  g.setTabBadge(attention || null).catch((error) => g.reportError(`setTabBadge: ${error?.message ?? error}`))

  const waitingCount = cards.filter((c) => flags.get(c.id).waiting).length
  $('summary').textContent = [t.count(cards.length), waitingCount ? t.waitingCount(waitingCount) : null].filter(Boolean).join(' · ')
  $('filters').replaceChildren(
    ...[['all', t.all], ['attention', attention ? `${t.attention} ${attention}` : t.attention]].map(([key, label]) =>
      h('button', { role: 'tab', 'aria-selected': filter === key ? 'true' : 'false', onclick: () => { filter = key; render() } }, label)),
  )

  // Wide: one track per column and the add-column button at its own width (no 240 px track for it).
  $('board').style.gridTemplateColumns = `repeat(${columns.length}, minmax(240px, 1fr)) max-content`
  $('board').replaceChildren(
    ...columns.map((c) => columnView(c, flags)),
    h('div', { class: 'add-column' }, h('button', { onclick: addColumn, text: t.addColumn })),
  )
  if (selected && !board.cards[selected]) closeCard()
  else if (selected) updateDrawer()
}

function columnView(column, flags) {
  const all = cardsIn(board, column.id)
  const cards = filter === 'attention' ? all.filter((c) => flags.get(c.id).attention) : all
  if (!collapsed.has(column.id)) collapsed.set(column.id, column.role === 'todo' || column.role === 'done')
  const list = h('ul', { class: 'cards', 'data-col': column.id })
  list.append(...cards.map((card) => h('li', {}, cardView(card, flags.get(card.id)))))
  list.addEventListener('dragover', (event) => {
    event.preventDefault()
    list.classList.add('over')
  })
  list.addEventListener('dragleave', () => list.classList.remove('over'))
  list.addEventListener('drop', (event) => {
    event.preventDefault()
    list.classList.remove('over')
    const id = event.dataTransfer.getData('text/plain')
    if (!board.cards[id]) return
    // Dropped above the first card whose middle is below the pointer; by its id, never by an index (others move too).
    const below = [...list.querySelectorAll('.card')].find((el) => el.dataset.card !== id && el.getBoundingClientRect().top + el.offsetHeight / 2 > event.clientY)
    quietly(change({ type: 'card.move', card: id, column: column.id, ...(below ? { before: below.dataset.card } : {}) }))
  })
  const title = h('span', { text: columnTitle(column), title: t.columnName, ondblclick: () => renameColumn(column, title) })
  const toggle = h('button', { class: 'toggle', 'aria-label': `${columnTitle(column)} · ${t.toggle}`, 'aria-expanded': collapsed.get(column.id) ? 'false' : 'true', onclick: () => { collapsed.set(column.id, !collapsed.get(column.id)); render() } },
    icon(collapsed.get(column.id) ? 'chevron-right' : 'chevron-down'))
  return h('section', { class: `col${collapsed.get(column.id) ? ' collapsed' : ''}`, 'data-role': column.role ?? '', 'aria-label': columnTitle(column) },
    h('h2', {}, toggle, title, h('small', { text: String(cards.length) })),
    list,
    h('button', { class: 'add', 'data-add-card': column.id, onclick: () => openAdd(column.id) }, icon('plus'), t.addCard),
  )
}

function cardView(card, flags) {
  const tasks = taskLinks(card)
  const others = otherLinks(card).length
  const machines = [...new Set(tasks.map(([, l]) => agentBySession(l.session)?.deviceLabel).filter(Boolean))]
  const titleId = `c-${card.id}`
  const el = h('button', { class: `card${flags.stale ? ' stale' : ''}`, draggable: 'true', 'data-card': card.id, 'aria-labelledby': titleId, 'aria-selected': card.id === selected ? 'true' : 'false', onclick: () => openCard(card.id) },
    h('strong', { id: titleId, text: card.title }),
    card.waitingOn ? h('span', { class: 'waiting' }, icon('clock'), h('span', { text: t.waiting(card.waitingOn) })) : null,
    typeof card.progress === 'number' ? h('span', { class: 'bar', role: 'img', 'aria-label': `${t.progress} ${card.progress}%`, style: `--p:${card.progress}%` }) : null,
    h('span', { class: 'meta' },
      tasks.map(([, l]) => (l.agent ? h('gugu-avatar', { user: l.agent, size: 'xs', label: agentBySession(l.session)?.title ?? undefined }) : null)),
      tasks.map(([, l]) => stateBadge(l)),
      machines.map((m) => h('span', { text: m })),
      others ? h('span', {}, icon('paperclip'), ` ${others}`) : null,
      h('span', { class: 'spacer' }),
      card.updatedAt ? h('gugu-time', { datetime: card.updatedAt, title: flags.stale ? t.stale : undefined }) : null),
  )
  el.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', card.id)
    el.classList.add('dragging')
  })
  el.addEventListener('dragend', () => el.classList.remove('dragging'))
  return el
}

function renameColumn(column, span) {
  const input = h('input', { type: 'text', value: columnTitle(column), 'aria-label': t.columnName })
  const done = (save) => {
    if (save && input.value.trim() !== columnTitle(column)) quietly(change({ type: 'column.update', column: column.id, title: input.value }))
    else render()
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false) })
  input.addEventListener('blur', () => done(true))
  span.replaceWith(input)
  input.focus()
  input.select()
}

function addColumn(event) {
  const button = event.currentTarget
  const input = h('input', { type: 'text', placeholder: t.columnName, 'aria-label': t.columnName })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) quietly(change({ type: 'column.create', title: input.value }))
    if (e.key === 'Escape') render()
  })
  button.replaceWith(input)
  input.focus()
}

// ── a new card: at the bottom of its column ─────────────────────────────────

async function openAdd(column) {
  const fromPage = document.hasFocus()
  try {
    await g.modal.open({ entry: 'board.html', title: t.newCard, data: { newCard: {
      column, file: home?.kind === 'chat' ? { chat: home.f.entry.chat, id: home.f.entry.id } : null,
    } } })
  } catch (error) { showAlert(error?.message ?? String(error)) }
  finally {
    // Live board updates can replace the original control while the dialog is open.
    if (fromPage) [...$('board').querySelectorAll('[data-add-card]')].find((button) => button.dataset.addCard === column)?.focus()
  }
}

function renderNewCard() {
  if ($('new-card-form')) return // Incoming board/status changes keep the person's draft and IME composition intact.
  const title = h('input', { id: 'new-card-title', name: 'title', required: true, autofocus: true, placeholder: t.newPlaceholder, autocomplete: 'off' })
  const column = h('select', { id: 'new-card-column', name: 'column' }, ...columnsInOrder(board).map((c) => h('option', { value: c.id, text: columnTitle(c) })))
  column.value = creating.column
  const note = h('textarea', { id: 'new-card-note', name: 'note', rows: 4 })
  const attach = ctx.session ? h('input', { type: 'checkbox', checked: true }) : null
  const submit = h('button', { type: 'submit', text: t.addCard })
  const root = h('form', { id: 'new-card-form', class: 'stack new-card' },
    h('label', { class: 'stack' }, t.cardTitle, title), h('label', { class: 'stack' }, t.column, column),
    h('label', { class: 'stack' }, t.noteH, note), attach ? h('label', {}, attach, ` ${t.attach}`) : null,
    h('footer', {}, h('button', { type: 'button', text: t.cancel, onclick: () => g.modal.close().catch((error) => showAlert(error.message)) }), submit),
  )
  root.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!title.value.trim() || submit.disabled) return
    submit.disabled = true
    try {
      const links = attach?.checked ? [{ kind: 'task', session: ctx.session.id, ...(ctx.session.agentId ? { agent: ctx.session.agentId } : {}) }] : []
      const result = await change({ type: 'card.create', title: title.value.trim(), note: note.value, links, column: column.value })
      await g.modal.close(result)
    } catch (error) { showAlert(error?.message ?? String(error)) }
    finally { submit.disabled = false }
  })
  $('board').append(root)
  title.focus()
}

g.onCommand((id) => {
  if (id !== 'new' || !board) return
  const columns = columnsInOrder(board)
  // Narrow, the first column that is open; wide, the first.
  openAdd((narrow() && columns.find((c) => !collapsed.get(c.id))?.id) || columns[0].id)
})

// ── a card, opened ───────────────────────────────────────────────────────────

let drawer = null // the open card's live parts: { card, title, fields, noteView, noteEdit, viewing, ... }

function openCard(id) {
  selected = id
  closeView()
  drawer = buildDrawer(id)
  $('drawer').replaceChildren(drawer.root)
  $('drawer').hidden = false
  $('shell').classList.add('open')
  render()
}

function closeCard() {
  closeView()
  selected = null
  drawer = null
  $('drawer').hidden = true
  $('drawer').replaceChildren()
  $('shell').classList.remove('open')
  render()
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selected && !event.target.closest?.('input, textarea, .cm-editor')) closeCard()
})

/**
 * The open card reads as a page, and changes one thing at a time (owner 10-22, after Linear's issue view): the title and
 * the note are edited where they stand once clicked; each property is a value until clicked, then its own editor, saved
 * on Enter or leaving it, put back on Esc. Nothing is an input until it is asked to be one.
 */
function inlineEditor(d, key, start, make, save) {
  if (d.editing && d.editing !== key) d.finish?.()
  d.editing = key
  const editor = make()
  const done = (keep) => {
    if (d.editing !== key) return
    d.editing = null
    d.finish = null
    if (keep) save(editor.value)
    updateDrawer(true)
  }
  d.finish = () => done(true)
  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !(editor.tagName === 'TEXTAREA' && !(event.metaKey || event.ctrlKey))) { event.preventDefault(); done(true) }
    if (event.key === 'Escape') { event.stopPropagation(); done(false) }
  })
  editor.addEventListener('blur', () => done(true))
  if (editor.tagName === 'SELECT') editor.addEventListener('change', () => done(true))
  start.replaceWith(editor)
  editor.focus()
  if (editor.select && editor.tagName === 'INPUT') editor.select()
}

const PROPS = ['column', 'progress', 'waitingOn', 'next', 'due']

/** A property's value as text, or null when it has none. */
function propText(card, key) {
  if (key === 'column') return columnTitle(board.columns[card.column])
  if (key === 'progress') return typeof card.progress === 'number' ? `${card.progress}%` : null
  return card[key] || null
}

function buildDrawer(id) {
  let armed = false
  const del = h('button', { class: 'danger', text: t.del, onclick: () => {
    if (!armed) { armed = true; del.textContent = t.delAgain; return }
    quietly(change({ type: 'card.delete', card: id }))
  } })
  const more = h('details', { class: 'more' }, h('summary', { 'aria-label': t.more }, icon('ellipsis')), h('div', { class: 'menu' }, del))
  const back = h('button', { class: 'plain', 'aria-label': narrow() ? t.back : t.close, onclick: closeCard }, icon(narrow() ? 'chevron-left' : 'x'))
  const crumb = h('small', { class: 'muted crumb' })

  const title = h('div', { class: 'title-slot' })
  const props = h('dl', { class: 'props', 'aria-label': t.props })
  const note = h('div', { class: 'note-slot' })
  const links = h('ul', { class: 'links' })
  const addMenu = h('details', { class: 'add-menu' }, h('summary', {}, icon('plus'), ` ${t.addLink}`), h('div', { class: 'menu' }))
  const picker = h('div')
  const view = h('div')
  const comments = h('ul', { class: 'comments' })
  const commentBox = h('textarea', { rows: '2', placeholder: t.comment, 'aria-label': t.comment })
  const commentSend = h('button', { text: t.send, onclick: () => {
    const text = commentBox.value.trim()
    if (text) quietly(change({ type: 'comment.add', card: id, text }).then(() => { commentBox.value = '' }))
  } })

  const root = h('div', { class: 'detail' },
    h('div', { class: 'head' }, back, crumb, h('span', { class: 'spacer' }), more),
    title,
    props,
    h('section', {}, h('h5', { text: t.noteH }), note),
    h('section', {}, h('div', { class: 'section-head' }, h('h5', { text: t.links }), addMenu), links, picker, view),
    h('section', {}, h('h5', { text: t.comments }), comments, h('div', { class: 'comment-box' }, commentBox, h('div', {}, commentSend))),
  )
  return { id, root, crumb, title, props, note, links, addMenu, picker, view, comments, editing: null, finish: null, viewing: null, file: null, shownNote: null }
}

async function updateDrawer(force = false) {
  const d = drawer
  const card = d && board.cards[d.id]
  if (!card) return
  d.crumb.textContent = home?.kind === 'chat' ? home.name : t.local

  // The title: a heading until clicked.
  if (d.editing !== 'title') {
    const heading = h('h2', { class: 'editable', tabindex: '0', role: 'button', 'aria-label': `${t.title}: ${card.title}`, text: card.title })
    const edit = () => inlineEditor(d, 'title', heading, () => h('input', { type: 'text', class: 'title-input', value: card.title, 'aria-label': t.title }),
      (value) => { if (value.trim() && value !== card.title) quietly(change({ type: 'card.update', card: card.id, title: value })) })
    heading.addEventListener('click', edit)
    heading.addEventListener('keydown', (e) => { if (e.key === 'Enter') edit() })
    d.title.replaceChildren(heading)
  }

  // The properties: values; one of them an editor while it is being changed.
  const rows = []
  const tasks = taskLinks(card)
  const propRow = (key, valueNode, editable) => {
    rows.push(h('div', { class: 'prop' }, h('dt', { text: t[key] }), h('dd', { 'data-prop': key }, valueNode)))
    if (!editable || d.editing === key) return
    valueNode.addEventListener('click', () => {
      inlineEditor(d, key, valueNode, () => {
        if (key === 'column') return h('select', { 'aria-label': t.column }, ...columnsInOrder(board).map((c) => h('option', { value: c.id, selected: c.id === card.column, text: columnTitle(c) })))
        if (key === 'progress') return h('input', { type: 'number', min: '0', max: '100', step: '1', inputmode: 'numeric', value: card.progress ?? '', 'aria-label': t.progress })
        return h('input', { type: 'text', value: card[key] ?? '', 'aria-label': t[key] })
      }, (value) => {
        if (key === 'column') { if (value !== card.column) quietly(change({ type: 'card.move', card: card.id, column: value })); return }
        const next = key === 'progress' ? (value === '' ? null : Number(value)) : value
        if ((card[key] ?? (key === 'progress' ? null : '')) !== next) quietly(change({ type: 'card.update', card: card.id, [key]: next }))
      })
    })
  }
  const valueButton = (key) => {
    const text = propText(card, key)
    return h('button', { class: `prop-value${text ? '' : ' empty'}${key === 'waitingOn' && text ? ' waiting' : ''}`, 'aria-label': `${t[key]}: ${text ?? t.unset}` },
      key === 'progress' && text ? h('span', { class: 'bar', style: `--p:${card.progress}%` }) : null,
      text ?? t.unset)
  }
  propRow('column', valueButton('column'), true)
  propRow('owner', h('div', { class: 'owners' }, ...(tasks.length ? tasks.map(([, l]) => h('span', { class: 'owner' },
    l.agent ? h('gugu-avatar', { user: l.agent, size: 'xs', label: agentBySession(l.session)?.title ?? undefined }) : null,
    stateBadge(l),
    h('span', { class: 'muted', text: agentBySession(l.session)?.deviceLabel ?? '' }))) : [h('span', { class: 'muted', text: t.unset })])), false)
  for (const key of ['progress', 'waitingOn', 'next', 'due']) propRow(key, valueButton(key), true)
  if (card.updatedAt) rows.push(h('div', { class: 'prop' }, h('dt', { text: t.updated }), h('dd', { class: 'muted' }, h('gugu-time', { datetime: card.updatedAt }), card.updatedBy ? ` · ${byLabel(card.updatedBy)}` : '', flagsOf(card).stale ? h('div', { class: 'stale-note', text: t.stale }) : null)))
  // A property being edited keeps its editor (and its half-typed value): the properties are drawn again after it.
  if (!PROPS.includes(d.editing)) d.props.replaceChildren(...rows)

  // The note: rendered; clicked, a textarea that saves when left.
  if (d.editing !== 'note' && (force || d.shownNote !== card.note || !d.note.firstChild)) {
    d.shownNote = card.note
    const shown = h('div', { class: `note-view editable${card.note ? '' : ' empty'}`, tabindex: '0', role: 'button', 'aria-label': t.editNote })
    if (card.note) {
      const md = await g.markdown()
      if (drawer !== d) return
      md.render(shown, card.note, { density: 'comfortable' })
    } else shown.textContent = t.addNote
    const edit = (event) => {
      if (event.target.closest?.('a')) return // a link in the note opens; it does not start editing
      inlineEditor(d, 'note', shown, () => h('textarea', { rows: '10', class: 'note-input', 'aria-label': t.noteH }, card.note ?? ''),
        (value) => { if (value !== (card.note ?? '')) quietly(change({ type: 'card.update', card: card.id, note: value })) })
    }
    shown.addEventListener('click', edit)
    shown.addEventListener('keydown', (e) => { if (e.key === 'Enter') edit(e) })
    d.note.replaceChildren(shown)
  }

  // Links: the card's tasks first, then its files and pages; what can be done to one shows on the row it is about.
  d.links.replaceChildren(
    ...tasks.map(([lid, link]) => {
      const row = agentBySession(link.session)
      const missing = agentsKnown && !row
      const status = h('span', { class: 'muted', role: 'status', text: missing ? t.taskUnavailable : '' })
      return h('li', {},
        link.agent ? h('gugu-avatar', { user: link.agent, size: 'xs', label: row?.title ?? undefined }) : icon('bot'),
        h('span', { class: 'what', text: [row?.title ?? link.title ?? link.session, row?.deviceLabel].filter(Boolean).join(' · ') }),
        stateBadge(link),
        status,
        h('span', { class: 'acts' },
          h('button', { class: 'plain', text: t.open, disabled: missing, onclick: () => taskAction(() => g.showSession(link.session, { peek: true }), status, t.taskUnavailable) }),
          h('button', { class: 'plain', text: t.handTo, disabled: missing, onclick: () => taskAction(() => g.compose(t.handText(card, chatOfBoard()), { session: link.session }), status, t.taskUnavailable) }),
          h('button', { class: 'plain', 'aria-label': t.remove, onclick: () => quietly(change({ type: 'link.remove', card: card.id, link: lid })) }, icon('x'))),
      )
    }),
    ...otherLinks(card).map(([lid, link]) => linkRow(card, lid, link)),
  )
  if (!d.links.childElementCount) d.links.append(h('li', { class: 'muted empty-row', text: t.noLinks }))

  const appState = await g.getAppState().catch(() => null) // the current task is a convenience: without it the item is not offered
  if (drawer !== d) return
  const current = appState?.activeSessionId
  const linked = new Set(tasks.map(([, l]) => l.session))
  const item = (text, run) => h('button', { class: 'plain', text, onclick: (e) => { d.addMenu.open = false; run(e) } })
  d.addMenu.querySelector('.menu').replaceChildren(...[
    current && !linked.has(current)
      ? item(t.attachCurrent, () => quietly(change({ type: 'link.add', card: card.id, link: { kind: 'task', session: current, ...(agentBySession(current)?.agentId ? { agent: agentBySession(current).agentId } : {}) } })))
      : null,
    desktop ? item(t.pickTask, () => pickTask(card)) : null,
    desktop ? item(t.start, (e) => startTask(card, e.currentTarget, appState?.activeProjectId)) : null,
    desktop ? item(t.pickFile, () => pickTaskFile(card)) : null,
    item(t.pickChatFile, () => pickChatFile(card)),
    // A gugu without project folders for Apps has no gugu.projects: the item is not offered there.
    typeof g.projects?.list === 'function' ? item(t.pickProjectFile, () => pickProjectFile(card)) : null,
    item(t.addUrl, () => addUrl(card)),
  ].filter(Boolean))

  const said = Object.values(board.comments).filter((c) => c.card === card.id).sort((a, b) => a.at.localeCompare(b.at))
  d.comments.replaceChildren(...said.map((c) => h('li', { class: 'comment' },
    h('div', { class: 'comment-head' }, h('strong', { text: byLabel(c.by) }), h('small', { class: 'muted' }, h('gugu-time', { datetime: c.at }))),
    h('div', { text: c.text }))))
}

function linkRow(card, lid, link) {
  const remove = h('button', { class: 'plain', 'aria-label': t.remove, onclick: () => quietly(change({ type: 'link.remove', card: card.id, link: lid })) }, icon('x'))
  const current = drawer.viewing === lid ? 'true' : 'false'
  switch (link.kind) {
    case 'file':
    case 'project':
    case 'chatfile': {
      const name = nameOf(link)
      const status = h('span', { class: 'muted', role: 'status' })
      // Drawn in the card when the App can (md, text, images, video); every file also opens beside the board, in the
      // App that opens it or gugu's own preview.
      return h('li', { 'aria-current': current }, icon('file-text'), h('span', { class: 'what', text: name, title: name }),
        status,
        h('span', { class: 'acts' },
          drawable(name) ? h('button', { class: 'plain', text: t.show, onclick: () => showFile(lid, link) }) : null,
          h('button', { class: 'plain', text: t.openBeside, onclick: () => taskAction(() => g.files.openWith(refOf(link), { peek: true }), status, link.kind === 'file' ? t.taskFilesUnavailable : t.noFiles) }),
          remove))
    }
    case 'message':
      return h('li', {}, icon('message-square'), h('span', { class: 'what', text: link.excerpt ?? t.messageLink }),
        h('span', { class: 'acts' }, h('button', { class: 'plain', text: t.message, onclick: () => g.showMessage(link.message).catch((e) => showAlert(e.message)) }), remove))
    default:
      return h('li', {}, icon(link.kind === 'pr' ? 'git-pull-request' : 'link'), h('span', { class: 'what', text: `${link.title ?? link.url}${link.state ? ` · ${link.state}` : ''}`, title: link.url }),
        h('span', { class: 'acts' }, h('button', { class: 'plain', text: t.browser, onclick: () => g.openBrowserTab(link.url).catch((e) => showAlert(e.message)) }), remove))
  }
}

// ── a linked file, shown in the card ─────────────────────────────────────────

const IMAGE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i
const VIDEO = /\.(mp4|webm|mov|m4v)$/i
const MARKDOWN = /\.(md|markdown|mdx)$/i
const TEXT = /\.(txt|json|jsonc|ya?ml|toml|csv|tsv|log|ini|env|xml|js|mjs|cjs|ts|tsx|jsx|css|scss|py|rb|go|rs|java|kt|swift|c|h|cc|cpp|hpp|sh|zsh|bash|sql|vue|svelte)$/i

const drawable = (name) => IMAGE.test(name) || VIDEO.test(name) || MARKDOWN.test(name) || TEXT.test(name)
const nameOf = (link) => (link.kind === 'chatfile' ? (link.name ?? link.file) : link.path)
function refOf(link) {
  if (link.kind === 'file') return { session: link.session, id: link.path }
  if (link.kind === 'project') return { project: link.project, id: link.path }
  return { id: link.file }
}

function closeView() {
  if (!drawer) return
  drawer.unbind?.()
  drawer.file?.close()
  if (drawer.url) URL.revokeObjectURL(drawer.url)
  Object.assign(drawer, { file: null, unbind: null, url: null, viewing: null })
  drawer.view.replaceChildren()
}

async function showFile(lid, link) {
  const d = drawer
  if (d.viewing === lid) return closeView()
  closeView()
  d.viewing = lid
  updateDrawer()
  const ref = refOf(link)
  const name = nameOf(link)
  const box = h('div', { class: 'view' })
  d.view.replaceChildren(box)
  try {
    const f = await g.files.open(ref)
    if (drawer !== d || d.viewing !== lid) return f.close()
    d.file = f
    if (IMAGE.test(name) || VIDEO.test(name)) {
      d.url = URL.createObjectURL(await f.blob())
      box.replaceChildren(IMAGE.test(name) ? h('img', { src: d.url, alt: name }) : h('video', { src: d.url, controls: true }))
      return
    }
    const cm = await g.codemirror()
    const editor = (parent) => {
      const view = new cm.EditorView({ parent, extensions: [cm.basicSetup, ...(MARKDOWN.test(name) ? [cm.markdown()] : [])] })
      d.unbind = g.bind.codemirror(view, f)
    }
    if (!MARKDOWN.test(name)) return editor(box)
    // Markdown reads rendered; 编辑 swaps in the editor, bound to the file (others' typing stays).
    const md = await g.markdown()
    const shown = h('div')
    const draw = () => md.render(shown, f.text, { density: 'comfortable', file: f.entry })
    draw()
    const off = f.onChange(draw)
    const edit = h('button', { text: t.edit, onclick: () => {
      off()
      edit.remove()
      shown.remove()
      editor(box)
    } })
    box.replaceChildren(h('div', { class: 'row' }, edit), shown)
  } catch (error) {
    box.replaceChildren(h('p', { role: error?.code === 'not-found' ? 'status' : 'alert', text: error?.code === 'not-found' && link.kind === 'file' ? t.taskFilesUnavailable : error?.message ?? String(error) }))
  }
}

// ── pickers ──────────────────────────────────────────────────────────────────

function openPicker(title, fill) {
  const list = h('ul', { class: 'list' })
  const filter = h('input', { type: 'search', placeholder: t.filter, 'aria-label': t.filter })
  const box = h('div', { class: 'picker' }, h('div', { class: 'row' }, h('strong', { text: title }), h('button', { text: t.cancel, onclick: () => box.remove() })), filter, list)
  drawer.picker.replaceChildren(box)
  filter.focus()
  const done = () => box.remove()
  fill({ list, filter, done }).catch((error) => list.replaceChildren(h('li', { role: 'alert', text: error?.message ?? String(error) })))
}

const recentFirst = (rows) => [...rows].sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))

function taskRows(list, filter, onPick) {
  const draw = () => {
    const q = filter.value.trim().toLowerCase()
    const rows = recentFirst(agents).filter((a) => !q || (a.title ?? '').toLowerCase().includes(q)).slice(0, 50)
    list.replaceChildren(...(rows.length
      ? rows.map((a) => h('li', {}, h('button', { class: 'card', onclick: () => onPick(a) }, h('strong', { text: a.title ?? a.sessionId }), h('span', { class: 'meta' }, stateBadge({ session: a.sessionId }), h('span', { text: a.providerId ?? '' })))))
      : [h('li', { class: 'muted', text: t.noTasks })]))
  }
  filter.addEventListener('input', draw)
  draw()
}

function pickTask(card) {
  openPicker(t.pickTask, async ({ list, filter, done }) => {
    taskRows(list, filter, (a) => quietly(change({ type: 'link.add', card: card.id, link: { kind: 'task', session: a.sessionId, agent: a.agentId, ...(a.title ? { title: a.title } : {}) } }).then(done)))
  })
}

function pickTaskFile(card) {
  openPicker(t.chooseTask, async ({ list, filter, done }) => {
    taskRows(list, filter, async (a) => {
      const entries = await g.files.list({ session: a.sessionId }).catch((error) => {
        if (error?.code === 'not-found') list.replaceChildren(h('li', { class: 'muted', role: 'status', text: t.taskFilesUnavailable }))
        else showAlert(error?.message ?? String(error))
        return null
      })
      if (!entries) return
      const files = entries.filter((e) => e.type !== 'folder')
      // The same box now filters this task's files (a fresh input: the task list's listener goes with the old one).
      const fileFilter = h('input', { type: 'search', placeholder: t.filter, 'aria-label': t.filter })
      filter.replaceWith(fileFilter)
      fileFilter.focus()
      const draw = () => {
        const q = fileFilter.value.trim().toLowerCase()
        const rows = files.filter((e) => !q || e.path.toLowerCase().includes(q)).slice(0, 80)
        list.replaceChildren(...(rows.length
          ? rows.map((e) => h('li', {}, h('button', { class: 'card', onclick: () => quietly(change({ type: 'link.add', card: card.id, link: { kind: 'file', session: a.sessionId, path: e.path } }).then(done)) }, h('span', { text: e.path }))))
          : [h('li', { class: 'muted', text: t.noFiles })]))
      }
      fileFilter.addEventListener('input', draw)
      draw()
    })
  })
}

function pickProjectFile(card) {
  openPicker(t.chooseProject, async ({ list, filter, done }) => {
    const { projects } = await g.projects.list()
    const drawProjects = () => {
      const q = filter.value.trim().toLowerCase()
      const rows = projects.filter((p) => !q || p.name.toLowerCase().includes(q))
      list.replaceChildren(...(rows.length
        ? rows.map((p) => h('li', {}, h('button', { class: 'card', onclick: () => pickIn(p) }, h('strong', { text: p.name }))))
        : [h('li', { class: 'muted', text: t.noProjects })]))
    }
    filter.addEventListener('input', drawProjects)
    drawProjects()
    const pickIn = async (project) => {
      const entries = await g.files.list({ project: project.id }).catch((error) => { showAlert(error.message); return null })
      if (!entries) return
      const files = entries.filter((e) => e.type !== 'folder')
      // The same box now filters this project's files (a fresh input: the project list's listener goes with the old one).
      const fileFilter = h('input', { type: 'search', placeholder: t.filter, 'aria-label': t.filter })
      filter.replaceWith(fileFilter)
      fileFilter.focus()
      const draw = () => {
        const q = fileFilter.value.trim().toLowerCase()
        const rows = files.filter((e) => !q || e.path.toLowerCase().includes(q)).slice(0, 80)
        list.replaceChildren(...(rows.length
          ? rows.map((e) => h('li', {}, h('button', { class: 'card', onclick: () => quietly(change({ type: 'link.add', card: card.id, link: { kind: 'project', project: project.id, path: e.path, title: project.name } }).then(done)) }, h('span', { text: `${project.name} / ${e.path}` }))))
          : [h('li', { class: 'muted', text: t.noFiles })]))
      }
      fileFilter.addEventListener('input', draw)
      draw()
    }
  })
}

function pickChatFile(card) {
  openPicker(t.pickChatFile, async ({ list, filter, done }) => {
    const pick = (e) => quietly(change({ type: 'link.add', card: card.id, link: { kind: 'chatfile', file: e.id, name: e.path ?? e.name, ...(e.chat ? { chat: e.chat } : {}) } }).then(done))
    const draw = (entries) => list.replaceChildren(...(entries.length
      ? entries.filter((e) => e.type !== 'folder').map((e) => h('li', {}, h('button', { class: 'card', onclick: () => pick(e) }, h('strong', { text: e.path ?? e.name }), h('span', { class: 'meta', text: e.chatName ?? '' }))))
      : [h('li', { class: 'muted', text: t.noFiles })]))
    // Before anything is typed: this chat's files when the board is open in one, then the ones opened lately; typing
    // searches every chat the person is in.
    const start = async () => {
      const [here, recent] = await Promise.all([ctx.chat ? g.files.list({ chat: ctx.chat.id }) : [], g.files.recent({ limit: 30 })])
      const seen = new Set()
      return [...here, ...recent].filter((e) => !seen.has(e.id) && seen.add(e.id))
    }
    draw(await start())
    let asked = 0
    filter.addEventListener('input', async () => {
      const q = filter.value.trim()
      const mine = ++asked
      const entries = q ? await g.files.search({ query: q, limit: 30 }) : await start()
      if (mine === asked) draw(entries)
    })
  })
}

function addUrl(card) {
  const input = h('input', { type: 'url', placeholder: t.urlPlaceholder, 'aria-label': t.addUrl })
  const add = () => {
    const url = input.value.trim()
    if (!url) return
    const kind = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url) ? 'pr' : 'url'
    quietly(change({ type: 'link.add', card: card.id, link: { kind, url } }).then(() => box.remove()))
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add() })
  const box = h('div', { class: 'row picker' }, input, h('button', { class: 'primary', text: t.ok, onclick: add }), h('button', { text: t.cancel, onclick: () => box.remove() }))
  drawer.picker.replaceChildren(box)
  input.focus()
}

/** 新建任务: a new task of the person's, on this card, started only by their click; it is linked and the card moves to doing. */
async function startTask(card, button, project) {
  button.disabled = true
  button.textContent = t.starting
  try {
    const { agentId } = await g.spawnAgent(t.handText(card, chatOfBoard()), { title: card.title, ...(project ? { project } : {}) })
    const row = (await g.listAgents()).find((a) => a.agentId === agentId)
    if (!row) throw new Error(`the new task (${agentId}) is not in the task list`)
    await change({ type: 'link.add', card: card.id, link: { kind: 'task', session: row.sessionId, agent: agentId, title: card.title } })
    const doing = columnsInOrder(board).find((c) => c.role === 'doing')
    if (doing && card.column !== doing.id) await change({ type: 'card.move', card: card.id, column: doing.id })
  } catch (error) {
    showAlert(error?.message ?? String(error))
  } finally {
    button.disabled = false
    button.textContent = t.start
  }
}

// ── which board: this computer's, or a chat's board file ─────────────────────

/** A board file's name, shown next to its chat's name when it is not the chat's own board. */
const fileLabel = (entry) => [entry.chatName ?? ctx.chat?.name, entry.name === CHAT_BOARD_NAME ? null : entry.name.slice(0, -BOARD_SUFFIX.length)].filter(Boolean).join(' · ')

async function showChatBoard(open) {
  leaveHome()
  try {
    const f = await open()
    const name = ctx.chat?.id === f.entry.chat ? ctx.chat.name : fileLabel(f.entry)
    home = { kind: 'chat', f, name }
    board = f.toJSON()
    f.onChange(({ local }) => {
      board = f.toJSON()
      render()
      // Someone else's change — an agent's on another computer, say — may come with that agent moving: ask for the
      // statuses again (the background page hears only this computer's agents move).
      if (!local && desktop) askAgents()
    })
    f.onStatus((status) => { if (status === 'gone') showAlert(t.gone) })
    showAlert(null)
  } catch (error) {
    home = null
    board = null
    showAlert(t.noBoard(error?.message ?? String(error)))
  }
  if (selected) closeCard()
  render()
}

function showLocalBoard() {
  leaveHome()
  home = { kind: 'local' }
  board = localBoard
  if (selected) closeCard()
  render()
}

function leaveHome() {
  if (home?.kind === 'chat') home.f.close()
  home = null
}

let asking = null
function askAgents() {
  if (asking) return
  asking = g.sendToBackground({ type: 'agents' }).catch((e) => showAlert(e.message)).finally(() => { asking = null })
}

/**
 * Opened in a chat (its panel, or one of its board files): that chat's board, nothing to pick. Anywhere else (the dock,
 * a task's tab): this computer's board, and the chats' boards the person can reach, to switch to.
 */
async function fillSwitcher() {
  const select = $('where')
  // A suffix is one extension (.json): the board's double one is matched by the path instead.
  const found = await g.files.search({ query: BOARD_SUFFIX, suffixes: ['.json'], limit: 50 }).catch((error) => {
    showAlert(error?.message ?? String(error))
    return []
  })
  const boards = found.filter((e) => e.type !== 'folder' && e.name.endsWith(BOARD_SUFFIX))
  select.replaceChildren(
    h('option', { value: '', text: t.local }),
    ...boards.map((e) => h('option', { value: e.id, text: fileLabel(e) })),
  )
  select.value = home?.kind === 'chat' ? home.f.entry.id : ''
  select.hidden = boards.length === 0
  select.onchange = () => {
    const entry = boards.find((e) => e.id === select.value)
    if (entry) showChatBoard(() => g.files.open(entry))
    else showLocalBoard()
  }
}

function placed() {
  $('heading').textContent = t.title
  $('where').setAttribute('aria-label', t.where)
}

g.onContextChanged(async () => {
  ctx = await g.getContext()
  const words = WORDS[String(ctx.locale ?? '').startsWith('zh') ? 'zh' : 'en']
  // The language changed: the open card's fixed parts (headings, buttons) were worded once, when it was built.
  if (words !== t && selected) {
    t = words
    openCard(selected)
  }
  t = words
  placed()
  const now = ctx.layout?.visible ?? visible
  // Back on screen: read again what may have moved meanwhile (an agent's tool call, a task elsewhere, a chat's new board).
  if (desktop && now && !visible) {
    g.sendToBackground({ type: 'hello' }).catch((e) => showAlert(e.message))
    if (!ctx.chat && !ctx.file) fillSwitcher()
  }
  visible = now
  render()
})

placed()
if (desktop) g.sendToBackground({ type: 'hello' }).catch((error) => showAlert(error?.message ?? String(error)))
if (creating?.file) await showChatBoard(() => g.files.open(creating.file))
else if (creating && desktop) showLocalBoard()
else if (ctx.file) await showChatBoard(() => g.files.open(ctx.file))
else if (ctx.chat) await showChatBoard(() => openChatBoard(g.files, ctx.chat.id))
else if (desktop) {
  showLocalBoard()
  fillSwitcher()
} else {
  // style, not `hidden`: the page's own rules give #bar a display, and that wins over the attribute.
  for (const el of $('main').children) el.style.display = 'none'
  $('main').append(h('gugu-empty', { id: 'desktop-only', icon: 'layout-grid' }, h('strong', { text: t.desktopOnly }), h('small', { text: t.phoneHint })))
}
