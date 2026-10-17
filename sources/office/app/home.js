/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 咕咕办公's own page (the `home` tab: it claims no file, so it is the App's page — the desktop's rail, the phone's 「App」
// page, 「在本群打开」 in a chat): the files this person opened last across all their chats, the chats they were in, and a
// search over every chat's files — decks, workbooks and markdown by default. A file opens where it lives, with the App the
// person uses for it (`gugu.files.openWith`): a deck or a workbook here, on its own page; markdown in the folder's editor.
//
// Built only on the public App API: getContext / onContextChanged, files.recent / search / list / openWith.

const $ = (id) => document.getElementById(id)

const STRINGS = {
  zh: {
    title: '咕咕办公',
    search: '搜索所有群文件',
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

/** `able`: this gugu and this App's grant can list the chats' files — until then nothing is asked, only said why. */
const state = { t: STRINGS.zh, kind: 'office', query: '', group: null, asked: 0, recent: [], able: false }

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
  $('query').placeholder = state.t.search
  $('query').setAttribute('aria-label', state.t.search)
  $('back').setAttribute('aria-label', state.t.back)
  $('groups-title').textContent = state.t.groups
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

/** What the page shows now: a search, a chat's files, or what was opened last. The answer to the latest ask wins. */
async function refresh() {
  if (!state.able) return
  const asked = ++state.asked
  show('error', false)
  try {
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

function drawFiles(title, entries, emptyTitle, emptyHint, inGroup) {
  $('files-title').textContent = title
  show('back', inGroup)
  show('groups', !inGroup && !state.query && $('group-list').childElementCount > 0)
  $('files').replaceChildren(...entries.map(row))
  show('files', entries.length > 0)
  const empty = $('empty')
  empty.replaceChildren()
  if (entries.length === 0) {
    const box = document.createElement('gugu-empty')
    box.setAttribute('icon', state.query ? 'search' : 'history')
    box.append(Object.assign(document.createElement('strong'), { textContent: emptyTitle }))
    if (emptyHint) box.append(Object.assign(document.createElement('small'), { textContent: emptyHint }))
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

// Back on screen (the person opened a file and came back), what was opened last has changed: read again. Another language:
// drawn again in it.
let last = null
gugu.onContextChanged((next) => {
  const back = next.layout?.visible !== false && last?.layout?.visible === false
  const relabel = next.locale !== last?.locale
  last = next
  if (relabel) applyContext(next).catch(sayError)
  else if (back) void refresh()
})
gugu.getContext().then((ctx) => {
  last = ctx
  return applyContext(ctx)
}).catch(sayError)
