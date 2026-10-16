/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 咕咕办公 (code: office) — the built-in App for Office files in a chat's folder. It opens the file the host hands it
// (its claim: opensFiles .pptx, .xlsx; a click in the folder's list goes through gugu.files.openWith): a deck drawn and
// its shapes picked, or a workbook drawn and its cells and ranges picked; the picks put in the chat's composer as pills
// for the person to @ an agent with. The agent changes the file in its own shell, with this App's skill and its scripts
// (skills/office); what is on screen follows the file to its new version. A pill clicked opens the file here at its
// place (onLink).
//
// Built only on the public App API: getContext / onContextChanged, files.open / list / onChanged, compose, onLink,
// setTabTitle.
// - Each kind of file is its own view module (KINDS, by the suffix the host handed it for): the page around it is the
//   same — the file opened, followed to its new versions, the picks put in the composer.
// - Following: the file's chat is heard (files.onChanged, its chat named by the file); the list read again, a version
//   above the one drawn is drawn again — or, with picks waiting, said, and drawn when the person says so.

const $ = (id) => document.getElementById(id)

const STRINGS = {
  zh: {
    title: '咕咕办公',
    noFile: '从群文件夹里点开一份演示稿（.pptx）或表格（.xlsx），就在这里打开。',
    notMine: '咕咕办公打不开这种文件：{name}',
    gone: '这份文件已经不在群文件夹里了。',
    unfollowed: '读不了群文件夹（没有 files:read），这份文件有了新版本也看不到。',
    failed: '出错了：{e}',
    loading: '正在打开…',
    pptxFailed: '这份演示稿打不开：{e}',
    picksCount: '{n} 处',
    picksSend: '放进输入框',
    picksClear: '全部取消',
    unpick: '去掉这一处',
    placeGone: '这一处在现在这一版里找不到了。',
    placeHidden: '这一处在一张隐藏的表上，这里不显示。',
    newVersion: '这份文件有了第 {n} 版；画面上还是第 {v} 版。',
    newVersionPicks: '这份文件有了第 {n} 版；你攒着的 {k} 处是在第 {v} 版上选的，打开新版就不留了。',
    openNew: '打开新的一版',
    pptxSlide: '第 {n} 页',
    pptxShape: '形状 {id}',
    pptxNth: '（这一页第 {k} 个 id 相同的）',
    pptxBoxShapes: '框选的 {n} 个形状',
    pptxBoxEmpty: '框选的空白处',
    xlsxFailed: '这份表格打不开：{e}',
    xlsxLocale: 'zh_CN',
    xlsxNoSheets: '这份表格里没有能打开的工作表',
    xlsxAbout: '关于这张表',
    xlsxPending: '有 {n} 个公式还没算出结果，用 Excel 或 WPS 打开时会算。',
    xlsxNotDrawn: '这张表里有 {what} 没画出来。',
    xlsxCharts: '{n} 张图表',
    xlsxPictures: '{n} 张图片',
    xlsxAnd: '、',
  },
  en: {
    title: 'Gugu Office',
    noFile: 'Open a deck (.pptx) or a workbook (.xlsx) from a chat\'s folder and it opens here.',
    notMine: 'Gugu Office does not open this kind of file: {name}',
    gone: 'This file is no longer in the chat\'s folder.',
    unfollowed: 'The chat\'s folder cannot be read here (no files:read): a new version of this file will not show.',
    failed: 'Something went wrong: {e}',
    loading: 'Opening…',
    pptxFailed: 'This deck cannot be opened: {e}',
    picksCount: '{n} spot{s}',
    picksSend: 'Put in composer',
    picksClear: 'Clear all',
    unpick: 'Take this one back',
    placeGone: 'That place is not in the version shown now.',
    placeHidden: 'That place is on a hidden sheet, not shown here.',
    newVersion: 'This file has a version {n}; what is shown is version {v}.',
    newVersionPicks: 'This file has a version {n}; the {k} you gathered were picked on version {v} and go when the new one opens.',
    openNew: 'Open the new version',
    pptxSlide: 'Slide {n}',
    pptxShape: 'shape {id}',
    pptxNth: ' (no. {k} with that id on this slide)',
    pptxBoxShapes: 'a box around {n} shape{s}',
    pptxBoxEmpty: 'a box around nothing',
    xlsxFailed: 'This workbook cannot be opened: {e}',
    xlsxLocale: 'en',
    xlsxNoSheets: 'This workbook has no sheet that opens',
    xlsxAbout: 'About this sheet',
    xlsxPending: '{n} formula{s} with no result yet: Excel or WPS calculates on opening.',
    xlsxNotDrawn: 'This sheet has {what} not drawn here.',
    xlsxCharts: '{n} chart{s}',
    xlsxPictures: '{n} picture{s}',
    xlsxAnd: ' and ',
  },
}

/**
 * Each kind of file this App opens, by the suffix it claims: its view module's `mount(host, bytes, { t, onPicks, wanted,
 * previous })` (`previous`: the view of the version before, when a new one replaces it — a view may keep its place)
 * (resolves to the view's handle: picks(), clear(), anchor() — the last pick's mark on screen, or null: the bar at the
 * bottom — dragging(), reveal(query) — a pill's place framed: true, or (also as a promise) false when this version has
 * none, 'hidden' when it is on what the file hides — destroy(); null when no longer wanted) and `refOf(pick, t)` (a pick as a pill: `{ at, label }`, App 引用 pill); `failed` names its STRINGS (why
 * it did not open). How a pick is made, and how a place is found again, are the view's own; the bar that gathers picks
 * is this page's.
 */
const xlsx = async () => {
  const { mountXlsx, refOf } = await import('./xlsx-view.js')
  return { mount: mountXlsx, refOf, failed: 'xlsxFailed' }
}
const KINDS = {
  '.pptx': async () => {
    const { mountPptx, refOf } = await import('./pptx-view.js')
    return { mount: mountPptx, refOf, failed: 'pptxFailed' }
  },
  '.xlsx': xlsx,
  // A macro-enabled workbook draws and picks the same; the skill's script only reads it.
  '.xlsm': xlsx,
}

const state = {
  ctx: null,
  t: STRINGS.zh,
  /** The file on screen: { entry, file, kind, view, drawn, latest, held, redrawing, failure }. */
  current: null,
  /** The open in progress ({ id }: the file's): a newer one makes an older one's answer moot. */
  opening: null,
  /** The chat whose files are heard, and how to stop hearing them. */
  watching: null,
  unwatch: null,
  /** Where a pill pointed (`query`, its `at`) and in which file (`file`, null when it came before any): shown once
   *  that file is drawn. */
  place: null,
}

const fmt = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
/** A count said with its number: `{n}` the number, `{s}` an "s" unless it is 1 (the English strings' plural). */
const counted = (text, n) => fmt(text, { n, s: n === 1 ? '' : 's' })
/**
 * The bar's layout follows the hand last used on the page (148, 10-13: what `(pointer: coarse)` says is wrong on an
 * emulator, DeX, a tablet with a trackpad — WebView 113 on ppt_a says fine): a finger — the bar at the bottom where a
 * thumb reaches, room left under the file for it, no ⏎, Esc clears nothing; a mouse or a pen — by the last pick. Before
 * any press, what the device says. Changed only while the bar is hidden: never moved from beside a pick to the bottom
 * while picking.
 */
let fingers = matchMedia('(pointer: coarse)').matches
let fingersNext = fingers
const touchLayout = () => fingers
const applyLayout = () => {
  if ($('pick-bar').classList.contains('on')) return
  fingers = fingersNext
  document.body.classList.toggle('fingers', fingers)
}
const isZh = (locale) => String(locale || '').toLowerCase().startsWith('zh')
const can = (capability) => !!state.ctx?.capabilities?.includes(capability)
const suffixOf = (entry) => (entry.suffix ?? entry.name.match(/\.[^.]+$/)?.[0] ?? '').toLowerCase()

// ─── context ────────────────────────────────────────────────────────────────

// Opened for a file (ctx.file): that file, for as long as the page is. Opened for none (from the App list): what it is for.
async function applyContext(ctx) {
  state.ctx = ctx
  state.t = isZh(ctx.locale) ? STRINGS.zh : STRINGS.en
  document.documentElement.lang = isZh(ctx.locale) ? 'zh-CN' : 'en'
  document.title = state.t.title
  labelBar()
  // Its theme or language changed, the file being opened already: not opened again.
  if (ctx.file && state.current?.entry.id !== ctx.file.id && state.opening?.id !== ctx.file.id) await openHanded()
  else if (!ctx.file) {
    closeCurrent()
    showMessage(state.t.noFile)
    titleTab(null)
  }
}

/** The tab's (the side panel's header's) title: the file's name, as the folder's list says it; the App's without one. */
function titleTab(entry) {
  const title = entry ? entry.displayName ?? entry.name : state.t.title
  Promise.resolve(gugu.setTabTitle(title)).catch((error) => showBanner(fmt(state.t.failed, { e: error.message }), 'error'))
}

// ─── the file ───────────────────────────────────────────────────────────────

async function openHanded() {
  const token = { id: state.ctx.file.id }
  state.opening = token
  // A place is the file's it came for: another file opening drops it. One that came before any file is the first's —
  // claimed as that file starts opening, so a second file opened before the first is drawn drops it too.
  if (state.place?.file && state.place.file !== token.id) state.place = null
  else if (state.place && !state.place.file) state.place.file = token.id
  closeCurrent()
  showMessage(state.t.loading)
  try {
    const file = await gugu.files.open(state.ctx.file)
    if (state.opening !== token) {
      file.close()
      return
    }
    const load = KINDS[suffixOf(file.entry)]
    if (file.type !== 'binary' || !load) {
      file.close()
      showMessage(fmt(state.t.notMine, { name: file.entry.name }))
      return
    }
    titleTab(file.entry)
    follow(file.entry)
    await mountFile(file, await load(), token)
  } catch (error) {
    if (state.opening === token) showMessage(fmt(state.t.failed, { e: error.message }))
  } finally {
    if (state.opening === token) state.opening = null
  }
}

/** Hear the file's chat (its list changing is how a new version shows), once per chat. */
function follow(entry) {
  const chat = entry.chat ?? state.ctx.chat?.id
  if (state.watching === chat) return
  state.unwatch?.()
  state.unwatch = null
  state.watching = null
  if (!chat) return
  if (!can('files:read') && !can('files:write')) {
    showBanner(state.t.unfollowed, 'error', true)
    return
  }
  state.watching = chat
  state.unwatch = gugu.files.onChanged({ chat }, () => refreshEntry())
}

/** The list is the truth for the file's entry: its name, and its version (an agent saved one: workspace_changed). */
async function refreshEntry() {
  const current = state.current
  if (!current || !state.watching) return
  let entries
  try {
    entries = await gugu.files.list({ chat: state.watching })
  } catch (error) {
    if (state.current === current) showBanner(fmt(state.t.failed, { e: error.message }), 'error')
    return
  }
  if (state.current !== current) return
  const fresh = entries.find((e) => e.id === current.entry.id)
  if (!fresh) {
    showBanner(state.t.gone, 'error', true)
    return
  }
  current.entry = fresh
  titleTab(fresh)
  if (typeof fresh.version === 'number' && fresh.version > current.latest) {
    current.latest = fresh.version
    moved(current)
  }
}

function closeCurrent() {
  const current = state.current
  if (!current) return
  state.current = null
  current.view?.destroy()
  current.file.close()
  $('preview').replaceChildren()
  renderPicks([])
  hideBanner()
}

// ─── the view: drawn, picked from, drawn again ──────────────────────────────

async function mountFile(file, kind, token) {
  const t = state.t
  // `drawn`: the version on screen; `latest`: the newest the list has said. `held`: a newer one waits for the person.
  const version = typeof file.entry.version === 'number' ? file.entry.version : 0
  const current = { entry: file.entry, file, kind, view: null, drawn: version, latest: version, held: false, redrawing: null, failure: null }
  state.current = current
  try {
    const bytes = new Uint8Array(await (await file.blob()).arrayBuffer())
    if (state.opening !== token) return
    // Another file opened while this one was read: it is not put over that one.
    current.view = await kind.mount($('preview'), bytes, { t, onPicks: (picks) => renderPicks(picks), wanted: () => state.current === current })
    if (!current.view) return
    if (state.current !== current) {
      current.view.destroy()
      return
    }
    document.body.dataset.state = 'doc'
    renderPicks([])
    showPlace()
    // Saved again while this one loaded: the list says so.
    await refreshEntry()
  } catch (error) {
    if (state.current === current) showMessage(fmt(t[kind.failed], { e: error.message }))
  }
}

// The open file has a newer version than the one drawn. Nothing waiting to be sent: it is drawn again where the person
// is. Picks waiting were made on the drawn one, so then the person says when (a banner); until then what they put in
// the composer says which version it was picked on (sendPicks).
function moved(current) {
  if (state.current !== current || !current.view || current.redrawing || current.latest <= current.drawn) return
  if (current.held || current.view.picks().length) {
    showNewVersion(current)
    return
  }
  const from = { drawn: current.drawn, latest: current.latest }
  current.redrawing = redraw(current).finally(() => {
    current.redrawing = null
    // Looked at again when the redraw moved on (a newer one may have come meanwhile) or now waits for the person; one
    // that found nothing newer to draw (an open behind the list) waits for the list to say more.
    if (current.held || current.drawn !== from.drawn || current.latest !== from.latest) moved(current)
  })
}

// Said again as the picks change; a redraw that failed says why, and the button tries again.
function showNewVersion(current) {
  const t = state.t
  current.held = true
  const k = current.view.picks().length
  const said = k ? fmt(t.newVersionPicks, { n: current.latest, v: current.drawn, k }) : fmt(t.newVersion, { n: current.latest, v: current.drawn })
  showBanner(current.failure ? `${said} ${fmt(t.failed, { e: current.failure.message })}` : said, current.failure ? 'error' : 'info', true)
  const open = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', textContent: t.openNew })
  open.onclick = () => {
    if (state.current !== current) return
    current.view.clear()
    current.held = false
    current.failure = null
    hideBanner()
    moved(current)
  }
  $('banner').append(' ', open)
}

// The new version's view replaces the old one, its handle the old one's. The old one stays on screen while the new one
// is read and swaps in one step (the view's replaceChildren), so nothing flashes and the scroll stays where it is.
// The person keeps using the old one meanwhile: a pick made or a box being drawn by the time the new one is ready, and
// it is not swapped in — the new version waits for the person (the banner), as when picks waited from the start.
async function redraw(current) {
  let file = null
  try {
    file = await gugu.files.open(state.ctx.file)
    if (state.current !== current) return
    // The version on screen already: nothing to draw again.
    if (typeof file.entry.version === 'number' && file.entry.version <= current.drawn) return
    const bytes = new Uint8Array(await (await file.blob()).arrayBuffer())
    if (state.current !== current) return
    const idle = () => state.current === current && !current.held && current.view.picks().length === 0 && !current.view.dragging()
    const next = await current.kind.mount($('preview'), bytes, { t: state.t, onPicks: (picks) => renderPicks(picks), wanted: idle, previous: current.view })
    if (!next) {
      if (state.current === current) current.held = true
      return
    }
    if (state.current !== current) {
      next.destroy()
      return
    }
    current.view.destroy()
    current.file.close()
    current.view = next
    current.file = file
    file = null
    current.drawn = typeof current.file.entry.version === 'number' ? current.file.entry.version : current.latest
    current.latest = Math.max(current.latest, current.drawn)
    renderPicks([])
  } catch (error) {
    // Held, so it is not tried again on its own; moved's next look puts it on the banner.
    current.failure = error
    current.held = true
  } finally {
    file?.close()
  }
}

// ─── the picks ──────────────────────────────────────────────────────────────

// The bar: shown only while something is picked, by the last pick — never over it, never moving the file under it.
function labelBar() {
  $('pick-send-label').textContent = state.t.picksSend
  $('pick-clear').title = state.t.picksClear
  $('pick-clear').setAttribute('aria-label', state.t.picksClear)
  renderPicks(state.current?.view?.picks() ?? [])
}

function renderPicks(picks) {
  const bar = $('pick-bar')
  bar.classList.toggle('on', picks.length > 0)
  bar.setAttribute('aria-hidden', String(picks.length === 0))
  // Hidden, it is out of the way of the keyboard too: no Tab into its buttons.
  bar.inert = picks.length === 0
  applyLayout()
  $('pick-count').textContent = counted(state.t.picksCount, picks.length)
  placeBar()
  if (state.current?.held && state.current.view) showNewVersion(state.current)
}

// On a desktop: 10 px above the last pick's mark, right-aligned with it (below it when there is no room above), kept
// inside the panel; that pick out of sight (its mark cut to the panel shows nothing of it), at the panel's bottom middle
// until it comes back. On a phone: always at the bottom middle, where the panel leaves room for it (style.css). The
// mark is asked for each time (a view may draw it anew on a scroll) and only one still on the page counts; a view with no
// mark to give (a sheet: its cells fill the panel) keeps it at the bottom.
function placeBar() {
  const bar = $('pick-bar')
  const view = state.current?.view
  if (!view || !bar.classList.contains('on')) return
  const panel = $('preview').getBoundingClientRect()
  const [bw, bh] = [bar.offsetWidth, bar.offsetHeight]
  const mark = view.anchor()
  const r = mark?.isConnected ? mark.getBoundingClientRect() : null
  const seen = r && { top: Math.max(r.top, panel.top), bottom: Math.min(r.bottom, panel.bottom), left: Math.max(r.left, panel.left), right: Math.min(r.right, panel.right) }
  let docked = touchLayout() || !seen || seen.bottom <= seen.top || seen.right <= seen.left
  let top = 0
  let left = 0
  if (!docked) {
    top = seen.top - bh - 10
    if (top < panel.top + 4) top = seen.bottom + 10
    left = Math.min(Math.max(seen.right - bw, panel.left + 8), panel.right - bw - 8)
    if (top + bh > panel.bottom - 4) docked = true
  }
  if (docked) {
    top = panel.bottom - bh - (touchLayout() ? 22 : 16)
    left = panel.left + (panel.width - bw) / 2
  }
  bar.classList.toggle('docked', docked)
  Object.assign(bar.style, { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` })
}

// Every waiting pick, in order, into the file's chat's composer as a pill (gugu.compose refs, inside the click or the
// Enter that asked for it): the file, the version drawn — what it was picked on, the newest or not — and where, as the
// view says it. The person says what to do with them, @s an agent and sends it, or not.
async function sendPicks() {
  const current = state.current
  const picks = current?.view?.picks() ?? []
  if (!picks.length) return
  const refs = picks.map((pick) => ({ file: current.entry, ...(current.drawn ? { version: current.drawn } : {}), ...current.kind.refOf(pick, state.t) }))
  try {
    await gugu.compose('', { refs })
    current.view.clear()
  } catch (error) {
    showBanner(fmt(state.t.failed, { e: error.message }), 'error')
  }
}

// ─── a pill's place ─────────────────────────────────────────────────────────

// A pill opened this file (App 引用 pill: the `link` event a gugu link brings, `query` the pill's `at`) — one entry
// for every kind of file: held until the file is drawn, then the view finds the place; one this version lacks is said.
// The host hands a place only to the page on its file (#7232): it is that file's — the one opening, or open — or, come
// before any file, the first one's. The newest place wins.
function goTo(query) {
  state.place = { query, file: state.opening?.id ?? state.current?.entry.id ?? null }
  showPlace()
}

function showPlace() {
  const view = state.current?.view
  if (!state.place || !view?.reveal) return
  const { query } = state.place
  state.place = null
  // What the view says of it: at once (a deck), or once it has read what it needs (a sheet).
  const said = (shown) => {
    if (shown === true || state.current?.view !== view) return
    showBanner(shown === 'hidden' ? state.t.placeHidden : state.t.placeGone, 'info')
  }
  const failed = (error) => {
    if (state.current?.view === view) showBanner(fmt(state.t.failed, { e: error.message }), 'error')
  }
  try {
    const shown = view.reveal(query)
    if (typeof shown?.then === 'function') shown.then(said, failed)
    else said(shown)
  } catch (error) {
    failed(error)
  }
}

// ─── messages ───────────────────────────────────────────────────────────────

function showMessage(text) {
  document.body.dataset.state = 'message'
  $('doc-message').textContent = text
}

function showBanner(message, tone, sticky = false) {
  const banner = $('banner')
  banner.hidden = false
  banner.dataset.tone = tone
  if (sticky) banner.dataset.sticky = '1'
  else delete banner.dataset.sticky
  banner.textContent = message
}

function hideBanner() {
  const banner = $('banner')
  banner.hidden = true
  delete banner.dataset.sticky
}

// ─── start ──────────────────────────────────────────────────────────────────

function start() {
  document.body.classList.toggle('fingers', fingers)
  // Every press on the page says which hand it was (before a view answers it: a finger's pick then lands at the bottom).
  document.addEventListener('pointerdown', (e) => {
    fingersNext = e.pointerType === 'touch'
    applyLayout()
  }, { capture: true })
  $('pick-send').onclick = () => sendPicks()
  $('pick-clear').onclick = () => state.current?.view?.clear()
  // The keys are the page's, for every kind of file: Enter puts what is picked in the composer, Esc (a desktop's) lets
  // it go. Not while typing somewhere, and nothing else is taken (a view keeps its own arrows and Shift).
  document.addEventListener('keydown', (e) => {
    const view = state.current?.view
    if (!view || e.defaultPrevented || e.isComposing || !view.picks().length) return
    if (e.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
    // On a button or a link, Enter is that one's own (✕ lets all go, a number takes its pick back, a shape is picked).
    if (e.key === 'Enter' && e.target.closest?.('button, a[href], [role="button"]')) return
    if (e.key === 'Escape' && !touchLayout()) {
      e.preventDefault()
      view.clear()
    } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      sendPicks()
    }
  })
  // A scroll anywhere in the panel (a view may scroll a box of its own inside it) moves the mark the bar sits by. Placed
  // in the event itself: scroll and resize already come once a frame, so the bar moves in the same frame as the mark.
  $('preview').addEventListener('scroll', placeBar, { capture: true })
  window.addEventListener('resize', placeBar)
  gugu.onLink((link) => goTo(link.query))
  gugu.onContextChanged((ctx) => applyContext(ctx).catch((error) => showMessage(fmt(state.t.failed, { e: error.message }))))
  gugu.getContext().then(applyContext).catch((error) => showMessage(fmt(state.t.failed, { e: error.message })))
}

start()
