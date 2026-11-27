// The 微信读书 page: what you are reading, the lines you just marked, a book's notes by chapter. Every highlight can be
// taken into the conversation in one click (解释 / 换个角度 / 展开联想), drafted, never sent. Data comes from this App's
// program (server.mjs) through its page-only tools; the key is written to settings.json in the App's data folder.
import { h } from './dom.js'

const g = window.gugu
let ctx = await g.getContext()
g.onContextChanged?.((next) => { ctx = next })
const root = document.getElementById('root')
const SETTINGS_FILE = 'settings.json'
const KEY_PAGE = 'https://weread.qq.com/r/weread-skills'
const REFRESH_MS = 120_000

const icon = (name) => h('gugu-icon', { name })
const dot = () => h('span', { class: 'dot', text: ' · ' })
const TILE = ['#c8553d', '#3d6c8a', '#4a7a4c', '#7a5c99', '#b7832f', '#2f6f6a', '#8a3d5c', '#45505e']
const tint = (title) => TILE[[...String(title)].reduce((n, c) => (n * 31 + c.codePointAt(0)) >>> 0, 7) % TILE.length]

let view = { name: 'loading' }
let home = null
let openId = null
let lastError = ''

async function program(name, args = {}) {
  const result = await g.callProgram(name, args)
  if (!result) throw Object.assign(new Error('微信读书 App 的工具没在运行：在 App 管理里打开它的「给 agent 工具」权限'), { code: 'program' })
  const data = result.structuredContent ?? JSON.parse(result.content?.[0]?.text ?? '{}')
  if (result.isError) throw Object.assign(new Error(data.error ?? result.content?.[0]?.text ?? '出错了'), { code: data.code })
  return data
}

async function readSettings() {
  try { return JSON.parse((await g.readData(SETTINGS_FILE)) ?? '{}') ?? {} } catch { return {} }
}

function openLink(url) { g.openBrowserTab(url).catch(() => {}) }

function draft(text) {
  g.dispatch(text, { draft: true, ...(ctx.chat ? { to: { chat: ctx.chat.id } } : {}) })
    .catch((error) => g.reportError(`没能放进对话框：${error.message}`))
}

const quote = (item) => [
  item.text ? `> ${item.text}` : null,
  `——《${item.book?.title ?? ''}》${item.chapter ? ` ${item.chapter}` : ''}`,
  ...(item.thoughts ?? []).map((t) => `我的想法：${t.text}`),
].filter(Boolean).join('\n') + '\n\n'

const ASKS = [
  ['解释这段', 'lightbulb', '请解释这段话，碰到专业概念讲清楚，必要时举例或推一遍。'],
  ['换个角度', 'message-square', '给我两三个不同、甚至相反的观点，各说依据。'],
  ['展开联想', 'sparkles', '它让你联想到哪些别的书、现实案例或我书架上的书？'],
]

function cover(book, size = '') {
  const tile = h('span', { class: `cover ${size}`, style: `background:${tint(book.title)}` }, h('span', { text: String(book.title).slice(0, 4) }))
  if (book.cover) {
    const img = h('img', { src: book.cover, alt: '', referrerpolicy: 'no-referrer' })
    img.addEventListener('error', () => img.remove())
    tile.append(img)
  }
  return tile
}

function top(extra = []) {
  return h('div', { class: 'top' }, h('img', { src: 'icon.png', alt: '' }), h('strong', { text: '微信读书' }),
    home ? h('small', { class: 'sync' }, icon('check'), '已连接 · 同步于 ', h('gugu-time', { datetime: home.at })) : null,
    h('span', { class: 'spacer' }), ...extra,
    h('button', { 'aria-label': '换 API Key', title: '换 API Key', onclick: () => show({ name: 'setup' }) }, icon('settings')),
    h('button', { 'aria-label': '刷新', title: '刷新', onclick: () => load(true) }, icon('refresh')))
}

function minutes(seconds) {
  const m = Math.round((seconds ?? 0) / 60)
  return m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分钟` : `${m} 分钟`
}

function nowReading(book) {
  return h('section', { class: 'card now' }, cover(book, 'big'),
    h('div', { class: 'info' },
      h('h5', { text: '正在读' }),
      h('strong', { class: 'title', text: `《${book.title}》` }), h('small', { text: book.author }),
      book.progress != null ? h('div', { class: 'prog' }, h('progress', { value: book.progress, max: 100 }), h('small', { text: `${book.progress}%` })) : null,
      h('small', {}, book.chapter?.title ?? '', book.chapter ? dot() : null, `累计读了 ${minutes(book.readingSeconds)}`),
      h('div', { class: 'row' },
        h('button', { onclick: () => show({ name: 'book', bookId: book.bookId, title: book.title }) }, icon('book-open'), '按书看笔记'),
        h('button', { class: 'primary', onclick: () => draft(`我正在读《${book.title}》${book.chapter ? `，读到${book.chapter.title}` : ''}。`) }, icon('message-circle'), '聊聊这本书'),
        book.readerLink ? h('button', { 'aria-label': '在微信读书打开', title: '在微信读书打开', onclick: () => openLink(book.readerLink) }, icon('external-link')) : null)))
}

function noteRow(item, { withBook = true } = {}) {
  const id = `${item.book?.bookId ?? ''}:${item.id}`
  const open = openId === id
  const toggle = () => { openId = open ? null : id; render() }
  return h('li', { class: open ? 'open' : '', tabindex: '0', onclick: (e) => { if (!e.target.closest('button')) toggle() },
    onkeydown: (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) toggle() } },
    h('div', { class: 'hl' },
      item.text ? h('p', { class: 'q', text: item.text }) : null,
      ...(item.thoughts ?? []).map((t) => h('p', { class: 'mine' }, icon('pencil'), t.text)),
      withBook ? h('small', {}, `《${item.book.title}》`, item.chapter ? dot() : null, item.chapter ?? '', item.at ? dot() : null, item.at ? h('gugu-time', { datetime: item.at }) : null) : null,
      open ? h('div', { class: 'asks' }, ...ASKS.map(([label, name, ask]) => h('button', { onclick: () => draft(quote(item) + ask) }, icon(name), label))) : null))
}

function drawHome() {
  const [current, ...others] = home.reading
  if (openId === null && home.recent[0]) openId = `${home.recent[0].book.bookId}:${home.recent[0].id}`
  root.replaceChildren(top(),
    current ? nowReading(current) : h('p', { class: 'muted', text: '书架上没有在读的书。' }),
    h('h5', { text: '刚划的线' }),
    home.recent.length ? h('ul', { class: 'list hls' }, ...home.recent.map((item) => noteRow(item))) : h('small', { class: 'none', text: '还没有划线。在微信读书里划一句，这里就会出现。' }),
    others.length ? h('h5', { text: '也在读' }) : null,
    others.length ? h('ul', { class: 'list' }, ...others.map((b) => h('li', { tabindex: '0', role: 'button', onclick: () => show({ name: 'book', bookId: b.bookId, title: b.title }) },
      cover(b), h('div', {}, h('strong', { text: `《${b.title}》` }), h('span', { text: [b.author, b.chapter?.title].filter(Boolean).join(' · ') })),
      h('small', { text: b.progress != null ? `${b.progress}%` : '' })))) : null)
}

function drawBook(notes) {
  const book = { ...notes.book, title: notes.book.title || view.title }
  const count = notes.chapters.reduce((n, c) => n + c.items.length, 0)
  const ask = `请用微信读书工具 weread_book_notes 读《${book.title}》（bookId ${book.bookId}）里我的全部划线和想法，按主题（不是按章节）整理成读书笔记：每个主题写要点、我的疑问、可以接着读什么。`
  root.replaceChildren(top([h('button', { onclick: () => show({ name: 'home' }) }, icon('arrow-left'), '返回')]),
    h('div', { class: 'bookhead' }, cover(book), h('div', {}, h('strong', { class: 'title', text: `《${book.title}》` }), h('small', { text: `${book.author} · ${count} 条笔记` }))),
    h('div', { class: 'row' },
      h('button', { class: 'primary', onclick: () => draft(ask) }, icon('sparkles'), '让 agent 整理成读书笔记'),
      ctx.chat && ctx.chat.kind !== 'dm' ? h('button', { onclick: () => draft(`${ask}整理好后存进群文件夹「读书笔记/${book.title}.md」。`) }, icon('folder'), '整理并存进群文件夹') : null),
    ...notes.chapters.flatMap((c) => [h('h5', { text: c.title || '未分章' }),
      h('ul', { class: 'list hls' }, ...c.items.map((item) => noteRow({ ...item, book, chapter: c.title }, { withBook: false })))]),
    ...(notes.bookReviews.length ? [h('h5', { text: '书评' }), h('ul', { class: 'list hls' },
      ...notes.bookReviews.map((r, i) => noteRow({ id: `review${i}`, text: '', thoughts: [r], book, chapter: '' }, { withBook: false })))] : []))
}

function drawSetup(current = {}) {
  const input = h('input', { type: 'password', placeholder: 'wrk-…', 'aria-label': 'API Key', value: current.key ?? '' })
  const connect = async () => {
    const key = input.value.trim()
    if (!key) return input.focus()
    lastError = ''
    await g.writeData(SETTINGS_FILE, JSON.stringify({ ...(await readSettings()), key }))
    try {
      await program('page_status')
      show({ name: 'home' })
    } catch (error) {
      lastError = error.message
      drawSetup({ key })
    }
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect() })
  root.replaceChildren(
    h('div', { class: 'top' }, h('img', { src: 'icon.png', alt: '' }), h('strong', { text: '微信读书' }), h('span', { class: 'spacer' }),
      home ? h('button', { onclick: () => show({ name: 'home' }) }, icon('arrow-left'), '返回') : null),
    h('gugu-empty', { icon: 'book-open' },
      h('strong', { text: '连上微信读书，读书时随时问 agent' }),
      h('small', { text: '用的是微信读书官方开放的接口（微信读书 Skill）。连上后，你在手机上划的线、写的想法，agent 都能读到。' }),
      h('ol', { class: 'steps' },
        h('li', {}, '在微信读书 App 打开「我 › 设置 › 微信读书 Skill」，或在浏览器打开 ',
          h('a', { href: KEY_PAGE, text: 'weread.qq.com/r/weread-skills', onclick: (e) => { e.preventDefault(); openLink(KEY_PAGE) } }), '，登录后复制 API Key（wrk- 开头）'),
        h('li', { text: '贴到下面，点连接' })),
      h('div', { class: 'row key' }, input, h('button', { class: 'primary', onclick: connect, text: '连接' })),
      lastError ? h('p', { role: 'alert', text: lastError }) : h('small', { class: 'note', text: 'Key 存在这台电脑上，这个 App 的数据里；在微信读书里重新获取就会换掉旧的。' })))
  if (!current.key) input.focus()
}

function drawProblem(message) {
  root.replaceChildren(top(), h('p', { role: 'alert', text: message }),
    h('div', { class: 'row' }, h('button', { onclick: () => load(true) }, icon('refresh'), '再试一次'), h('button', { onclick: () => show({ name: 'setup' }) }, icon('settings'), '换 API Key')))
}

async function load(force = false) {
  const settings = await readSettings()
  if (!settings.key) return show({ name: 'setup' })
  try {
    if (view.name === 'book') {
      if (!view.notes || force) view.notes = await program('page_book', { bookId: view.bookId, title: view.title })
      drawBook(view.notes)
    } else {
      if (!home || force) home = { ...(await program('page_home')), at: new Date().toISOString() }
      drawHome()
    }
  } catch (error) {
    if (error.code === 'auth' || error.code === 'no_key') { lastError = error.message; return show({ name: 'setup' }) }
    drawProblem(error.message)
  }
}

function render() {
  if (view.name === 'home' && home) drawHome()
  else if (view.name === 'book' && view.notes) drawBook(view.notes)
  else if (view.name === 'setup') readSettings().then(drawSetup)
  else load()
}

function show(next) {
  view = next
  if (next.name === 'loading') root.replaceChildren(h('small', { class: 'muted', text: '正在读取微信读书…' }))
  render()
}

setInterval(() => { if (!document.hidden && view.name === 'home') load(true) }, REFRESH_MS)
document.addEventListener('visibilitychange', () => { if (!document.hidden && view.name === 'home' && home && Date.now() - Date.parse(home.at) > REFRESH_MS) load(true) })
root.replaceChildren(h('small', { class: 'muted', text: '正在读取微信读书…' }))
view = { name: 'home' }
load(true)
