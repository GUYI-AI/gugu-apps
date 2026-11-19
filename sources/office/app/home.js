/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 咕咕办公's own page (the `home` tab: it claims no file, so it is the App's page — the desktop's rail, the phone's 「App」
// page, 「在本群打开」 in a chat). Laid out as Office's start page is: one bar (the search, and 「新建」), blank files as
// cards where there is room, then the list — what it lists and which kind it keeps said in the list's own head. Drawn for a chat (`getContext().chat`: its panel), it is that chat's page first: its
// files and a search in them, switched to every chat by one tab; in a chat with none, a blank file is made there and
// handed to an agent through the host's sheet. Drawn for no chat (the rail): the files this person opened last across all their chats, the chats they were in,
// and a search over every chat's files — decks, workbooks and markdown by default. A file opens where it lives, with the App the
// person uses for it (`gugu.files.openWith`): a deck or a workbook here, on its own page; markdown in the folder's editor.
//
// Built only on the public App API: getContext / onContextChanged, files.recent / search / list / upload / openWith, dispatch.

const $ = (id) => document.getElementById(id)

const STRINGS = {
  zh: {
    title: '咕咕办公',
    search: '搜索所有群文件',
    searchHere: '搜索本群文件',
    here: '本群',
    everywhere: '所有群',
    noneHere: '本群文件夹里还没有这类文件',
    noneHereHint: '让 agent 做一份，做好的文件放在本群文件夹里。',
    noneHereStart: '从一份空白文件开始，或者让 agent 做一份。',
    askAgent: '让 agent 做一份',
    asks: { pptx: '用咕咕办公做这份演示稿，内容：', xlsx: '用咕咕办公做这份表格，内容：', md: '写这份 markdown 文档，内容：' },
    kinds: { office: '常用', pptx: '演示稿', xlsx: '表格', md: 'Markdown', all: '全部' },
    kind: '类型',
    recent: '最近打开',
    groups: '最近打开过的群',
    allChats: '所有群',
    results: '搜索结果',
    noRecent: '还没有打开过文件',
    noRecentHint: '在群文件夹里打开的演示稿、表格和 markdown 会出现在这里，手机和电脑上是同一份。',
    noResults: '没有找到',
    noResultsHint: '换个词试试，或者选「全部」。',
    noFiles: '这个群里没有这类文件',
    noRead: '咕咕办公没有 files:read,读不了群文件。',
    oldGugu: '这个版本的咕咕还不能列出全部群的文件，请更新咕咕。',
    failed: '出错了：{e}',
    dm: '私聊',
    new: '新建',
    create: { pptx: '空白演示稿', xlsx: '空白表格' },
    untitled: { pptx: '未命名演示稿', xlsx: '未命名表格', md: '未命名文档' },
  },
  en: {
    title: 'Gugu Office',
    search: 'Search every chat\'s files',
    searchHere: 'Search this chat\'s files',
    here: 'This chat',
    everywhere: 'All chats',
    noneHere: 'No such file in this chat\'s folder yet',
    noneHereHint: 'Ask an agent for one: what it makes is kept in this chat\'s folder.',
    noneHereStart: 'Start from a blank file, or ask an agent for one.',
    askAgent: 'Ask an agent for one',
    asks: { pptx: 'With Gugu Office, make this deck. Content: ', xlsx: 'With Gugu Office, make this workbook. Content: ', md: 'Write this markdown document. Content: ' },
    kinds: { office: 'Usual', pptx: 'Decks', xlsx: 'Workbooks', md: 'Markdown', all: 'All' },
    kind: 'Kind',
    recent: 'Opened lately',
    groups: 'Chats opened lately',
    allChats: 'All chats',
    results: 'Found',
    noRecent: 'No file opened yet',
    noRecentHint: 'Decks, workbooks and markdown opened from a chat\'s folder show here — the same on your phone and computer.',
    noResults: 'Nothing found',
    noResultsHint: 'Try another word, or pick 「All」.',
    noFiles: 'No such file in this chat',
    noRead: 'Gugu Office has no files:read, so it cannot read chats\' files.',
    oldGugu: 'This gugu cannot list every chat\'s files yet: update gugu.',
    failed: 'Something went wrong: {e}',
    dm: 'Private chat',
    new: 'New',
    create: { pptx: 'Blank deck', xlsx: 'Blank workbook' },
    untitled: { pptx: 'Untitled deck', xlsx: 'Untitled workbook', md: 'Untitled document' },
  },
}

/** What each choice keeps, by suffix (null: every file). The usual ones are what this App and the folder's editor open. */
const KINDS = {
  office: ['.pptx', '.xlsx', '.xlsm', '.md'],
  pptx: ['.pptx'],
  xlsx: ['.xlsx', '.xlsm'],
  md: ['.md'],
  all: null,
}
const ICONS = { '.pptx': 'pptx.png', '.xlsx': 'xlsx.png', '.xlsm': 'xlsx.png' }
/** What 「新建」 makes: a copy of the App's own blank file (one empty 16:9 slide; one empty sheet), as the folder's next file. */
const BLANKS = {
  pptx: { file: 'blank.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  xlsx: { file: 'blank.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
}

/**
 * `able`: this gugu and this App's grant can list the chats' files — until then nothing is asked, only said why.
 * `here`: the chat the page is drawn for (`{ chat, name }`), null on the rail; `everywhere`: its 「所有群」 tab is picked.
 */
const state = { t: STRINGS.zh, kind: 'office', query: '', group: null, here: null, everywhere: false, asked: 0, recent: [], able: false, writable: false, names: new Set() }
/** The page lists and searches its own chat's files: drawn for a chat, and not switched to every chat. */
const inHere = () => state.here !== null && !state.everywhere

const fmt = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
const suffixOf = (entry) => (entry.suffix || entry.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase()
const kept = (entry) => entry.type !== 'folder' && (!KINDS[state.kind] || KINDS[state.kind].includes(suffixOf(entry)))

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
  // Another chat (the tab moved, or another chat's panel): its own files first, nothing carried over from the last one.
  const here = ctx.chat ? { chat: ctx.chat.id, name: ctx.chat.name } : null
  if (here?.chat !== state.here?.chat) {
    state.everywhere = false
    state.group = null
  }
  state.here = here
  $('group').setAttribute('aria-label', state.t.groups)
  drawScope()
  drawKinds()
  state.able = false
  state.writable = !!ctx.capabilities?.includes('files:write')
  drawCreate()
  if (!ctx.capabilities?.includes('files:read')) return say(state.t.noRead)
  // An older gugu has no files.search / files.recent: said, not an empty list.
  if (typeof gugu.files.search !== 'function' || typeof gugu.files.recent !== 'function') return say(state.t.oldGugu)
  state.able = true
  say(null)
  await refresh()
}

function say(text) {
  $('note').textContent = text ?? ''
  show('note', !!text)
}

/** 「本群 / 所有群」: only on a page drawn for a chat; the search box says which it searches. */
function drawScope() {
  const label = inHere() ? state.t.searchHere : state.t.search
  $('query').placeholder = label
  $('query').setAttribute('aria-label', label)
  show('scope', state.here !== null)
  if (!state.here) return $('scope').replaceChildren()
  $('scope').replaceChildren(
    ...[[false, state.t.here], [true, state.t.everywhere]].map(([everywhere, text]) => {
      const tab = Object.assign(document.createElement('button'), { type: 'button', textContent: text })
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(everywhere === state.everywhere))
      tab.dataset.scope = everywhere ? 'everywhere' : 'here'
      tab.onclick = () => {
        state.everywhere = everywhere
        state.group = null
        drawScope()
        drawCreate()
        void refresh()
      }
      return tab
    }),
  )
}

/**
 * 「新建」: on a page drawn for a chat, listing that chat's files, when this App may write them — the bar's button and its
 * menu (a narrow page), and the same choices as cards (a wide page, or a chat with nothing yet: home.css says which).
 */
function drawCreate() {
  const on = inHere() && state.writable
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
    item.append(Object.assign(document.createElement('img'), { src: ICONS[`.${kind}`], alt: '' }), state.t.create[kind])
    return item
  })))
  show('blanks', on)
  $('blanks').replaceChildren(...(!on ? [] : Object.keys(BLANKS).map((kind) => {
    const card = choice(kind, 'blank')
    const face = Object.assign(document.createElement('div'), { className: 'face' })
    if (kind === 'pptx') face.append(Object.assign(document.createElement('img'), { src: ICONS['.pptx'], alt: '' }))
    card.append(face, Object.assign(document.createElement('span'), { textContent: state.t.create[kind] }))
    return card
  })))
}

function closeMenu() {
  show('create', false)
  $('new').setAttribute('aria-expanded', 'false')
}

/**
 * A blank file of the kind, made in this chat's folder (its top) under a name no file there has yet, then opened as any
 * listed file is: 「未命名演示稿 10-25 2207.pptx」, then 「… 2.pptx」.
 */
async function createBlank(kind, button, ask = false) {
  const here = state.here
  const text = state.t.asks[kind]
  show('error', false)
  button.disabled = true
  try {
    const blank = kind === 'md' ? { type: 'text/markdown' } : BLANKS[kind]
    const bytes = kind === 'md' ? '' : await (await fetch(new URL(blank.file, import.meta.url))).arrayBuffer()
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const base = `${state.t.untitled[kind]} ${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`
    let name = `${base}.${kind}`
    for (let n = 2; state.names.has(name.toLowerCase()); n++) name = `${base} ${n}.${kind}`
    const [entry] = await gugu.files.upload({ chat: here.chat }, new File([bytes], name, { type: blank.type }))
    void refresh()
    // Open while the click is still active; the dispatch sheet may wait on the person for much longer.
    await Promise.all([ask ? gugu.dispatch(text, { refs: [{ file: entry }] }) : undefined, gugu.files.openWith(entry)])
  } catch (error) {
    sayError(error)
  } finally {
    button.disabled = false
  }
}

/** The kind kept, in the list's head: one choice, as a select (the phone opens its own picker for it). */
function drawKinds() {
  const select = $('kind')
  select.setAttribute('aria-label', state.t.kind)
  select.replaceChildren(...Object.keys(KINDS).map((kind) => Object.assign(document.createElement('option'), { value: kind, textContent: state.t.kinds[kind], selected: kind === state.kind })))
}

// ─── what is listed ─────────────────────────────────────────────────────────

/**
 * What the page shows now: its own chat's files (searched by name), a search, a chat's files, or what was opened last.
 * The answer to the latest ask wins.
 */
async function refresh() {
  if (!state.able) return
  const asked = ++state.asked
  show('error', false)
  try {
    if (inHere()) {
      // The chat's own folder, as listed for it (a topic's is its group's): kept by name, not by each entry's chat.
      const here = state.here
      const query = state.query.toLowerCase()
      const all = await gugu.files.list({ chat: here.chat })
      // The names at the folder's top, where 「新建」 puts a file: a new one takes none of them.
      if (asked === state.asked) state.names = new Set(all.filter((entry) => !entry.path.includes('/')).map((entry) => entry.name.toLowerCase()))
      const listed = all.filter((entry) => kept(entry) && (!query || entry.path.toLowerCase().includes(query)))
      listed.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
      if (asked !== state.asked) return
      const rows = listed.map((entry) => ({ ...entry, chatName: here.name }))
      if (state.query) drawFiles('', rows, state.t.noResults, state.t.noResultsHint)
      else drawFiles('', rows, state.t.noneHere, state.writable ? state.t.noneHereStart : state.t.noneHereHint, state.writable ? askAgent() : null)
      return
    }
    if (state.query) {
      const found = await gugu.files.search({ query: state.query, ...(KINDS[state.kind] ? { suffixes: KINDS[state.kind] } : {}), limit: 100 })
      if (asked === state.asked) drawFiles(state.t.results, found, state.t.noResults, state.t.noResultsHint)
      return
    }
    if (state.group) {
      const group = state.group
      const listed = (await gugu.files.list({ chat: group.chat })).filter(kept)
      listed.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
      if (asked === state.asked) drawFiles(group.name, listed.map((entry) => ({ ...entry, chatName: group.name })), state.t.noFiles, '')
      return
    }
    const recent = await gugu.files.recent({ limit: 200 })
    if (asked !== state.asked) return
    state.recent = recent
    drawFiles(state.t.recent, recent.filter(kept), state.t.noRecent, state.t.noRecentHint)
  } catch (error) {
    if (asked === state.asked) sayError(error)
  }
}

/**
 * Which chat's files, in the list's head beside the kind (every chat's opened lately, or one chat's): the chats of the files
 * opened last, the latest first — a chat is opened lately when a file in it was. Not on a page listing its own chat's.
 */
function drawGroups() {
  const seen = new Map()
  for (const entry of state.recent) if (!seen.has(entry.chat)) seen.set(entry.chat, entry.chatName || state.t.dm)
  const groups = [...seen].slice(0, 12)
  const select = $('group')
  select.replaceChildren(...[['', state.t.allChats], ...groups].map(([chat, name]) =>
    Object.assign(document.createElement('option'), { value: chat, textContent: name, selected: chat === (state.group?.chat ?? '') })))
  show('group-pick', groups.length > 0 && !inHere() && !state.query)
}

/** Make the file first, then let the person hand that file to an agent in the host's sheet. */
function askAgent() {
  const button = Object.assign(document.createElement('button'), { type: 'button', textContent: state.t.askAgent })
  button.dataset.ask = ''
  button.onclick = () => {
    void createBlank(state.kind === 'office' || state.kind === 'all' ? 'pptx' : state.kind, button, true)
  }
  return button
}

function drawFiles(title, entries, emptyTitle, emptyHint, emptyAction = null) {
  $('files-title').textContent = title
  drawGroups()
  $('files').replaceChildren(...entries.map(row))
  show('files', entries.length > 0)
  const empty = $('empty')
  empty.replaceChildren()
  if (entries.length === 0) {
    const box = document.createElement('gugu-empty')
    box.setAttribute('icon', state.query ? 'search' : 'history')
    box.append(Object.assign(document.createElement('strong'), { textContent: emptyTitle }))
    if (emptyHint) box.append(Object.assign(document.createElement('small'), { textContent: emptyHint }))
    if (emptyAction) box.append(emptyAction)
    empty.append(box)
  }
  show('empty', entries.length === 0)
  // A chat with nothing yet: the blank cards are the way to start, narrow page or not (home.css).
  document.body.classList.toggle('empty-here', entries.length === 0 && inHere() && !state.query)
}

/** A file's row: what it is, where it is (its chat, its folder), when — opened, or changed. A click opens it where it lives. */
function row(entry) {
  const li = document.createElement('li')
  li.tabIndex = 0
  li.dataset.item = entry.id
  const image = ICONS[suffixOf(entry)]
  if (image) li.append(Object.assign(document.createElement('img'), { className: 'kind-icon', src: image, alt: '' }))
  else {
    const icon = document.createElement('gugu-icon')
    icon.setAttribute('name', suffixOf(entry) === '.md' ? 'file-text' : 'file')
    li.append(icon)
  }
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

let typing = null
$('query').addEventListener('input', () => {
  clearTimeout(typing)
  typing = setTimeout(() => {
    state.query = $('query').value.trim()
    state.group = null
    void refresh()
  }, 250)
})
$('kind').addEventListener('change', () => {
  state.kind = $('kind').value
  void refresh()
})
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
$('group').addEventListener('change', () => {
  const chat = $('group').value
  state.group = chat ? { chat, name: $('group').selectedOptions[0].textContent } : null
  void refresh()
})

// Each context is the whole of where the page is now, never merged into the last one. Another chat (the tab moved), its new
// name, another language or grant: drawn again for it. Back on screen (the person opened a file and came back), what was
// opened last has changed: read again.
let last = null
gugu.onContextChanged((next) => {
  const back = next.layout?.visible !== false && last?.layout?.visible === false
  const redraw = next.locale !== last?.locale || next.chat?.id !== last?.chat?.id || next.chat?.name !== last?.chat?.name
    || String(next.capabilities ?? '') !== String(last?.capabilities ?? '')
  last = next
  if (redraw) applyContext(next).catch(sayError)
  else if (back) void refresh()
})
gugu.getContext().then((ctx) => {
  last = ctx
  return applyContext(ctx)
}).catch(sayError)
