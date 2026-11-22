/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 咕咕办公's own page (the `home` tab: it claims no file, so it is the App's page — the desktop's rail, the phone's 「App」
// page, 「在本群打开」 in a chat). It lists only the decks and workbooks this person opened lately (`gugu.files.recent`: one
// ask, kept by gugu for every device), never a chat's whole folder: a folder of hundreds of files is the host's to page
// through, so a page drawn for a chat has a way into that chat's own folder (the Files App), and 「新建」 a blank file there
// — handed to an agent through the host's sheet when nothing was opened yet. A file opens where it lives (`gugu.files.openWith`).
//
// Built only on the public App API: getContext / onContextChanged, files.recent / upload / openWith, linkTo / openLink, dispatch.

const $ = (id) => document.getElementById(id)

const STRINGS = {
  zh: {
    title: '咕咕办公',
    folder: '群文件',
    recent: '最近打开',
    noRecent: '还没有打开过演示稿或表格',
    noRecentHint: '打开过的演示稿和表格会出现在这里，手机和电脑上是同一份。别的文件在群文件里。',
    noRecentStart: '从一份空白文件开始，或者让 agent 做一份。别的文件在群文件里。',
    askAgent: '让 agent 做一份',
    ask: '用咕咕办公做这份演示稿，内容：',
    noRead: '咕咕办公没有 files:read,读不了群文件。',
    oldGugu: '这个版本的咕咕还不能列出最近打开的文件，请更新咕咕。',
    failed: '出错了：{e}',
    dm: '私聊',
    new: '新建',
    create: { pptx: '空白演示稿', xlsx: '空白表格' },
    untitled: { pptx: '未命名演示稿', xlsx: '未命名表格' },
  },
  en: {
    title: 'Gugu Office',
    folder: 'Chat files',
    recent: 'Opened lately',
    noRecent: 'No deck or workbook opened yet',
    noRecentHint: 'Decks and workbooks you open show here — the same on your phone and computer. Other files are in the chat\'s files.',
    noRecentStart: 'Start from a blank file, or ask an agent for one. Other files are in the chat\'s files.',
    askAgent: 'Ask an agent for one',
    ask: 'With Gugu Office, make this deck. Content: ',
    noRead: 'Gugu Office has no files:read, so it cannot read chats\' files.',
    oldGugu: 'This gugu cannot list the files opened lately yet: update gugu.',
    failed: 'Something went wrong: {e}',
    dm: 'Private chat',
    new: 'New',
    create: { pptx: 'Blank deck', xlsx: 'Blank workbook' },
    untitled: { pptx: 'Untitled deck', xlsx: 'Untitled workbook' },
  },
}

/** What is listed: the files this App opens (its `opensFiles.chat`). */
const SUFFIXES = ['.pptx', '.xlsx', '.xlsm']
/** How many files opened lately are asked for: a deck or workbook among them is listed. */
const RECENT = 100
/** A file's mark is the host's file tile (App API 56), the same as in the Files App and on the host's cards. */
const fileMark = (name, mime) => {
  const mark = document.createElement('gugu-file-mark')
  mark.setAttribute('name', name)
  if (mime) mark.setAttribute('mime', mime)
  mark.toggleAttribute('tile', true)
  return mark
}
/** What 「新建」 makes: a copy of the App's own blank file (one empty 16:9 slide; one empty sheet), as the folder's next file. */
const BLANKS = {
  pptx: { file: 'blank.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  xlsx: { file: 'blank.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
}

/** `here`: the id of the chat the page is drawn for, null on the rail; `able`: the files opened lately can be asked. */
const state = { t: STRINGS.zh, here: null, asked: 0, able: false, writable: false }

const fmt = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
const suffixOf = (entry) => (entry.suffix || entry.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase()

function show(id, on) {
  $(id).hidden = !on
}

function sayError(error) {
  $('error').textContent = fmt(state.t.failed, { e: error?.message ?? String(error) })
  show('error', true)
}

// ─── context ────────────────────────────────────────────────────────────────

async function applyContext(ctx) {
  const zh = String(ctx.locale || '').toLowerCase().startsWith('zh')
  state.t = zh ? STRINGS.zh : STRINGS.en
  document.documentElement.lang = zh ? 'zh-CN' : 'en'
  document.title = state.t.title
  state.here = ctx.chat?.id ?? null
  state.able = false
  state.writable = !!ctx.capabilities?.includes('files:write')
  $('folder-label').textContent = state.t.folder
  show('bar', state.here !== null)
  drawCreate()
  if (!ctx.capabilities?.includes('files:read')) return say(state.t.noRead)
  // An older gugu has no files.recent: said, not an empty list.
  if (typeof gugu.files.recent !== 'function') return say(state.t.oldGugu)
  state.able = true
  say(null)
  await refresh()
}

function say(text) {
  $('note').textContent = text ?? ''
  show('note', !!text)
}

/**
 * 「新建」: on a page drawn for a chat, when this App may write its files — the bar's button and its menu (a narrow
 * page), and the same choices as cards (a wide page, or nothing opened yet: home.css says which).
 */
function drawCreate() {
  const on = state.here !== null && state.writable
  const choice = (kind, className) => {
    const button = Object.assign(document.createElement('button'), { type: 'button', className })
    button.dataset.create = kind
    button.onclick = () => {
      closeMenu()
      void createBlank(kind, button)
    }
    return button
  }
  show('new', on)
  $('new-label').textContent = state.t.new
  document.body.classList.toggle('has-blanks', on)
  closeMenu()
  $('create').replaceChildren(...(!on ? [] : Object.keys(BLANKS).map((kind) => {
    const item = choice(kind, 'plain')
    item.setAttribute('role', 'menuitem')
    item.append(fileMark(BLANKS[kind].file), state.t.create[kind])
    return item
  })))
  show('blanks', on)
  $('blanks').replaceChildren(...(!on ? [] : Object.keys(BLANKS).map((kind) => {
    const card = choice(kind, 'blank')
    const face = Object.assign(document.createElement('div'), { className: 'face' })
    if (kind === 'pptx') face.append(fileMark(BLANKS.pptx.file))
    card.append(face, Object.assign(document.createElement('span'), { textContent: state.t.create[kind] }))
    return card
  })))
}

function closeMenu() {
  show('create', false)
  $('new').setAttribute('aria-expanded', 'false')
}

/**
 * A blank file of the kind, made at the top of this chat's folder and opened: 「未命名演示稿 10-25 2207.pptx」 (a name the
 * folder has already gets the host's ` (2)`). `ask`: handed to an agent in the host's sheet too.
 */
async function createBlank(kind, button, ask = false) {
  show('error', false)
  button.disabled = true
  try {
    const bytes = await (await fetch(new URL(BLANKS[kind].file, import.meta.url))).arrayBuffer()
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const name = `${state.t.untitled[kind]} ${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}.${kind}`
    const [entry] = await gugu.files.upload({ chat: state.here }, new File([bytes], name, { type: BLANKS[kind].type }))
    // Open while the click is still active; the dispatch sheet may wait on the person for much longer.
    await Promise.all([ask ? gugu.dispatch(state.t.ask, { refs: [{ file: entry }] }) : undefined, gugu.files.openWith(entry)])
  } catch (error) {
    sayError(error)
  } finally {
    button.disabled = false
  }
}

// ─── what is listed ─────────────────────────────────────────────────────────

/** The decks and workbooks opened lately, the latest first. The answer to the latest ask wins. */
async function refresh() {
  if (!state.able) return
  const asked = ++state.asked
  show('error', false)
  try {
    const recent = (await gugu.files.recent({ limit: RECENT })).filter((entry) => SUFFIXES.includes(suffixOf(entry)))
    if (asked !== state.asked) return
    const start = state.here !== null && state.writable
    drawFiles(recent, start ? state.t.noRecentStart : state.t.noRecentHint, start ? askAgent() : null)
  } catch (error) {
    if (asked === state.asked) sayError(error)
  }
}

/** Make a blank deck first, then let the person hand that file to an agent in the host's sheet. */
function askAgent() {
  const button = Object.assign(document.createElement('button'), { type: 'button', textContent: state.t.askAgent })
  button.dataset.ask = ''
  button.onclick = () => {
    void createBlank('pptx', button, true)
  }
  return button
}

function drawFiles(entries, emptyHint, emptyAction) {
  $('files-title').textContent = state.t.recent
  $('files').replaceChildren(...entries.map(row))
  show('files', entries.length > 0)
  const empty = $('empty')
  empty.replaceChildren()
  if (entries.length === 0) {
    const box = document.createElement('gugu-empty')
    box.setAttribute('icon', 'history')
    box.append(Object.assign(document.createElement('strong'), { textContent: state.t.noRecent }))
    box.append(Object.assign(document.createElement('small'), { textContent: emptyHint }))
    if (emptyAction) box.append(emptyAction)
    empty.append(box)
  }
  show('empty', entries.length === 0)
  // Nothing opened yet: the blank cards are the way to start, narrow page or not (home.css).
  document.body.classList.toggle('empty-here', entries.length === 0 && state.here !== null)
}

/** A file's row: what it is, where it is (its chat, its folder), when — opened, or changed. A click opens it where it lives. */
function row(entry) {
  const li = document.createElement('li')
  li.tabIndex = 0
  li.dataset.item = entry.id
  li.append(fileMark(entry.name, entry.contentType))
  const text = document.createElement('div')
  const folder = entry.path.includes('/') ? entry.path.slice(0, entry.path.lastIndexOf('/')) : ''
  text.append(
    Object.assign(document.createElement('strong'), { textContent: entry.name }),
    Object.assign(document.createElement('span'), { className: 'where', textContent: [entry.chatName || state.t.dm, folder].filter(Boolean).join(' · ') }),
  )
  li.append(text)
  const time = document.createElement('gugu-time')
  time.setAttribute('datetime', entry.openedAt ?? entry.updatedAt ?? '')
  li.append(time)
  const open = () => {
    show('error', false)
    gugu.files.openWith(entry).catch(sayError)
  }
  li.onclick = open
  li.onkeydown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
  }
  return li
}

// ─── input ──────────────────────────────────────────────────────────────────

// The chat's own folder, where every file of it is: the host's Files App, opened for this chat.
$('folder').onclick = () => {
  show('error', false)
  gugu.linkTo({ kind: 'app', app: 'workspace', tab: 'main', chat: state.here }).then((link) => gugu.openLink(link)).catch(sayError)
}
$('new').onclick = (event) => {
  event.stopPropagation()
  const open = $('create').hidden
  show('create', open)
  $('new').setAttribute('aria-expanded', String(open))
}
document.addEventListener('click', (event) => {
  if (!$('create').hidden && !$('create').contains(event.target)) closeMenu()
})
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu()
})

// Each context is the whole of where the page is now, never merged into the last one. Another chat (the tab moved), another
// language or grant: drawn again for it. Back on screen (the person opened a file and came back), what was
// opened last has changed: read again.
let last = null
gugu.onContextChanged((next) => {
  const back = next.layout?.visible !== false && last?.layout?.visible === false
  const redraw = next.locale !== last?.locale || next.chat?.id !== last?.chat?.id
    || String(next.capabilities ?? '') !== String(last?.capabilities ?? '')
  last = next
  if (redraw) applyContext(next).catch(sayError)
  else if (back) void refresh()
})
gugu.getContext().then((ctx) => {
  last = ctx
  return applyContext(ctx)
}).catch(sayError)
