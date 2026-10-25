/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 咕咕办公's own page (the `home` tab: it claims no file, so it is the App's page — the desktop's rail, the phone's 「App」
// page, 「在本群打开」 in a chat). Drawn for a chat (`getContext().chat`: its panel), it is that chat's page first: its
// files and a search in them, switched to every chat by one tab; in a chat with none, a draft in its composer asks an agent
// for one. Drawn for no chat (the rail): the files this person opened last across all their chats, the chats they were in,
// and a search over every chat's files — decks, workbooks and markdown by default. A file opens where it lives, with the App the
// person uses for it (`gugu.files.openWith`): a deck or a workbook here, on its own page; markdown in the folder's editor.
//
// Built only on the public App API: getContext / onContextChanged, files.recent / search / list / openWith, compose.

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
    askAgent: '让 agent 做一份',
    asks: { office: '用咕咕办公做一份演示稿或表格，放进本群文件夹：', pptx: '用咕咕办公做一份演示稿，放进本群文件夹：', xlsx: '用咕咕办公做一份表格，放进本群文件夹：', md: '写一份 markdown 文档，放进本群文件夹：', all: '用咕咕办公做一份演示稿或表格，放进本群文件夹：' },
    kinds: { office: '常用', pptx: '演示稿', xlsx: '表格', md: 'Markdown', all: '全部' },
    recent: '最近打开',
    groups: '最近打开过的群',
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
    back: '返回最近',
  },
  en: {
    title: 'Gugu Office',
    search: 'Search every chat\'s files',
    searchHere: 'Search this chat\'s files',
    here: 'This chat',
    everywhere: 'All chats',
    noneHere: 'No such file in this chat\'s folder yet',
    noneHereHint: 'Ask an agent for one: what it makes is kept in this chat\'s folder.',
    askAgent: 'Ask an agent for one',
    asks: { office: 'With Gugu Office, make a deck or a workbook in this chat\'s folder: ', pptx: 'With Gugu Office, make a deck in this chat\'s folder: ', xlsx: 'With Gugu Office, make a workbook in this chat\'s folder: ', md: 'Write a markdown document in this chat\'s folder: ', all: 'With Gugu Office, make a deck or a workbook in this chat\'s folder: ' },
    kinds: { office: 'Usual', pptx: 'Decks', xlsx: 'Workbooks', md: 'Markdown', all: 'All' },
    recent: 'Opened lately',
    groups: 'Chats opened lately',
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
    back: 'Back to lately',
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

/**
 * `able`: this gugu and this App's grant can list the chats' files — until then nothing is asked, only said why.
 * `here`: the chat the page is drawn for (`{ chat, name }`), null on the rail; `everywhere`: its 「所有群」 tab is picked.
 */
const state = { t: STRINGS.zh, kind: 'office', query: '', group: null, here: null, everywhere: false, asked: 0, recent: [], able: false }
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
  $('back').setAttribute('aria-label', state.t.back)
  $('groups-title').textContent = state.t.groups
  drawScope()
  drawKinds()
  state.able = false
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
    ...[[false, `${state.t.here} · ${state.here.name}`], [true, state.t.everywhere]].map(([everywhere, text]) => {
      const tab = Object.assign(document.createElement('button'), { type: 'button', textContent: text })
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(everywhere === state.everywhere))
      tab.dataset.scope = everywhere ? 'everywhere' : 'here'
      tab.onclick = () => {
        state.everywhere = everywhere
        state.group = null
        drawScope()
        void refresh()
      }
      return tab
    }),
  )
}

function drawKinds() {
  $('kinds').replaceChildren(
    ...Object.keys(KINDS).map((kind) => {
      const tab = Object.assign(document.createElement('button'), { type: 'button', textContent: state.t.kinds[kind] })
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(kind === state.kind))
      tab.onclick = () => {
        state.kind = kind
        drawKinds()
        void refresh()
      }
      return tab
    }),
  )
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
      const listed = (await gugu.files.list({ chat: here.chat })).filter((entry) => kept(entry) && (!query || entry.path.toLowerCase().includes(query)))
      listed.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
      if (asked !== state.asked) return
      const rows = listed.map((entry) => ({ ...entry, chatName: here.name }))
      if (state.query) drawFiles(state.t.results, rows, state.t.noResults, state.t.noResultsHint, false)
      else drawFiles(here.name, rows, state.t.noneHere, state.t.noneHereHint, false, askAgent(here))
      return
    }
    if (state.query) {
      const found = await gugu.files.search({ query: state.query, ...(KINDS[state.kind] ? { suffixes: KINDS[state.kind] } : {}), limit: 100 })
      if (asked === state.asked) drawFiles(state.t.results, found, state.t.noResults, state.t.noResultsHint, false)
      return
    }
    if (state.group) {
      const group = state.group
      const listed = (await gugu.files.list({ chat: group.chat })).filter(kept)
      listed.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
      if (asked === state.asked) drawFiles(group.name, listed.map((entry) => ({ ...entry, chatName: group.name })), state.t.noFiles, '', true)
      return
    }
    const recent = await gugu.files.recent({ limit: 200 })
    if (asked !== state.asked) return
    state.recent = recent
    drawGroups(recent)
    drawFiles(state.t.recent, recent.filter(kept), state.t.noRecent, state.t.noRecentHint, false)
  } catch (error) {
    if (asked === state.asked) sayError(error)
  }
}

/** The chats of the files opened last, the latest first: a chat is opened lately when a file in it was. */
function drawGroups(recent) {
  const seen = new Map()
  for (const entry of recent) if (!seen.has(entry.chat)) seen.set(entry.chat, entry.chatName || state.t.dm)
  const groups = [...seen].slice(0, 12)
  show('groups', groups.length > 0 && !state.query && !state.group)
  $('group-list').replaceChildren(
    ...groups.map(([chat, name]) => {
      const button = Object.assign(document.createElement('button'), { type: 'button', textContent: name })
      button.dataset.chat = chat
      button.onclick = () => {
        state.group = { chat, name }
        void refresh()
      }
      return button
    }),
  )
}

/** A draft in the chat's own composer asking an agent for a file of the kind picked; the person sends it, or not. */
function askAgent(here) {
  const button = Object.assign(document.createElement('button'), { type: 'button', textContent: state.t.askAgent })
  button.dataset.ask = ''
  button.onclick = () => {
    show('error', false)
    gugu.compose(state.t.asks[state.kind], { chat: here.chat }).catch(sayError)
  }
  return button
}

function drawFiles(title, entries, emptyTitle, emptyHint, inGroup, emptyAction = null) {
  $('files-title').textContent = title
  show('back', inGroup)
  show('groups', !inGroup && !inHere() && !state.query && $('group-list').childElementCount > 0)
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
}

/** A file's row: what it is, where it is (its chat, its folder), when — opened, or changed. A click opens it where it lives. */
function row(entry) {
  const li = document.createElement('li')
  li.tabIndex = 0
  li.dataset.item = entry.id
  const image = ICONS[suffixOf(entry)]
  if (image) li.append(Object.assign(document.createElement('img'), { className: 'kind', src: image, alt: '' }))
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
$('back').onclick = () => {
  state.group = null
  void refresh()
}

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
