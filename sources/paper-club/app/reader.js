/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 论文共读 (code: paper-club) — the reader. It opens the PDF the host hands it (its claim: a chat's .pdf, a session's .pdf, or a
// paper's notes file .paper.json, which names its PDF), draws it with PDF.js, and keeps what people mark on it in the
// notes file beside it (lib/paper.js): highlights on a passage or a boxed region, comment threads, study cards. Everyone
// with the paper open is in the notes file's presence: who reads which page, and following one of them.
//
// Every mark is evidence an agent can be sent back to: the PDF's entry id, the page, the quote and its rects. "Ask an
// agent" puts the passage in the chat's composer as a pill (gugu.dispatch draft refs, `at` = page and highlight); a pill clicked
// opens the paper here at that place (onLink). Agents read the same notes with the App's tools (tools.js).
//
// How often each passage was discussed in the chat comes from the chat itself (chat:read): every message citing this PDF
// (gugu.messages.search by file), kept per highlight by its pill's `at.h`. Nothing is pushed, so it is read again when
// the page opens, shows again or gets the focus back (from the chat's composer), and when a thread or the side opens.
import { openPdf, pdfjs } from './lib/pdf.js'
import { COLORS, emptyNotes, folderOf, mergeRects, newId, notesNameOf, isNotes, placeOfEntry, projectOf } from './lib/paper.js'
import { fmt, stringsFor } from './lib/strings.js'
import { createReview } from './lib/review.js'
import { discussionLabel, highlightView } from './lib/highlight-view.js'
import { importFailure, importInto, uploadInto } from './lib/import-box.js'

const $ = (id) => document.getElementById(id)
const ZOOMS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3]

const state = {
  t: stringsFor(navigator.language),
  ctx: null,
  entry: null, // the PDF's entry
  place: null, // { chat } or { workspace } (a session's working copy, a project's folder)
  doc: null,
  notes: null, // the notes file's live handle, once there is one
  notesBusy: null, // the create in flight
  zoom: 4, // index in ZOOMS, of fit-width
  fitScale: 1,
  pages: [], // { n, el, canvas, text, marks, vp1, rendered, task }
  current: 1,
  selection: null, // { page, rects, quote, box? }
  focus: null, // highlight id the side shows
  tab: 'highlights',
  highlightFilter: 'all', // local view of the existing shared notes, never persisted
  follow: null, // userId being followed
  place_wait: null, // a link's place, until the pages exist
  discussed: new Map(), // highlight id → the chat's messages citing it, newest first
  openDiscussion: null, // the highlight whose messages are listed in its thread
  boxing: false, // the box tool is on: a drag on a page marks a region (a figure, a table, an equation)
}

// ─── start ─────────────────────────────────────────────────────────────────

async function start() {
  // Before the first await: a pill that opened this page brings its place as the first link event.
  gugu.onLink((link) => goTo(link.query))
  const ctx = await gugu.getContext()
  state.ctx = ctx
  state.t = stringsFor(ctx.locale)
  labels()
  gugu.onContextChanged((next) => {
    const shownAgain = next.layout?.visible === true && state.ctx?.layout?.visible === false
    state.ctx = { ...state.ctx, ...next }
    if (next.chat?.members) drawReaders()
    if (shownAgain) readDiscussions()
  })
  // Opened for a file (a chat's panel, a session's tab, a pill), or from the library page with the file in the address.
  const asked = new URLSearchParams(location.search)
  const file = ctx.file ?? (asked.get('file') ? await fileFromAddress(asked) : null)
  $('back').hidden = asked.get('from') !== 'shelf'
  if (asked.get('tab')) state.tab = asked.get('tab')
  if (!file) return say(state.t.noFile)
  if (asked.get('tab')) showSide(true)
  say(state.t.loading)
  try {
    await openPaper(file)
  } catch (error) {
    say(fmt(state.t.failed, { e: error.message }), 'error')
    gugu.reportError(error.message)
  }
}

/** The library page's link: `?file=<id>&chat=<id>` (or `&workspace=<id>`) — the file, named in its place. */
async function fileFromAddress(asked) {
  const key = ['chat', 'workspace'].find((k) => asked.get(k))
  return { [key]: asked.get(key), id: asked.get('file') }
}

function labels() {
  const t = state.t
  for (const [id, label] of [['zoom-out', t.zoomOut], ['zoom-in', t.zoomIn], ['sel-copy', t.copy], ['box-toggle', t.boxTool], ['back', t.library], ['import-toggle', t.import]]) $(id).setAttribute('aria-label', label)
  $('import-ref').placeholder = t.importPlaceholder
  $('import-ref').setAttribute('aria-label', t.importPlaceholder)
  $('import-go').textContent = t.import
  $('import-upload').textContent = t.upload
  $('side-toggle-label').textContent = t.notes
  $('tabs').setAttribute('aria-label', t.notes)
  $('highlight-filters').setAttribute('aria-label', t.filterHighlights)
  $('tab-highlights').textContent = t.highlights
  $('tab-cards').textContent = t.cards
  $('tab-about').textContent = t.about
  $('sel-comment-label').textContent = t.comment
  $('sel-ask-label').textContent = t.ask
  $('sel-new-task-label').textContent = t.askNew
  $('sel-colors').replaceChildren(
    ...COLORS.map((color) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = `swatch c-${color}`
      b.setAttribute('aria-label', `${t.highlight} · ${color}`)
      b.onclick = () => markSelection({ color })
      return b
    }),
  )
}

/** `file`: what the host opened this page for — a PDF, or a notes file that names its PDF (ctx.file is an id, so the
 * handle's entry says which). */
async function openPaper(file) {
  let pdfHandle = await gugu.files.open(file)
  if (isNotes(pdfHandle.entry)) {
    const notes = pdfHandle
    attachNotes(notes)
    pdfHandle = await gugu.files.open({ ...placeOfEntry(notes.entry), id: notes.data.pdf }).catch((error) => {
      throw error?.code === 'not-found' ? new Error(state.t.gone) : error
    })
  }
  state.entry = pdfHandle.entry
  state.place = placeOfEntry(state.entry)
  $('sel-new-task').hidden = !projectOf(state.place)
  pdfHandle.onStatus?.(() => { if (pdfHandle.status === 'gone') say(state.t.gone, 'error') })
  const bytes = new Uint8Array(await (await pdfHandle.blob()).arrayBuffer())
  try {
    state.doc = await openPdf(bytes)
  } catch (error) {
    throw new Error(fmt(state.t.pdfFailed, { e: error.message }))
  }
  say(null) // the loading line goes; anything finding the notes says from here on stays on screen
  if (!state.notes) await findNotes()
  // Nobody marked it yet: the notes file someone else makes (or an agent's tool) is picked up the moment it appears.
  if (!state.notes) {
    // A chat tells its entries; a working copy the paths that changed (below the PDF's folder).
    const name = notesNameOf(state.entry.name)
    const folder = folderOf(state.entry)
    const place = state.place.workspace && folder ? { ...state.place, folder } : state.place
    const stop = gugu.files.onChanged(place, ({ entries, changes }) => {
      if (state.notes) return stop?.()
      if ((entries ?? []).some((e) => e.name === name) || (changes ?? []).some((c) => c.path.split('/').pop() === name)) findNotes()
    })
  }
  const title = state.notes?.data.meta?.title || (await state.doc.getMetadata().catch(() => null))?.info?.Title || state.entry.name.replace(/\.pdf$/i, '')
  $('title').textContent = title
  gugu.setTabTitle(title).catch(() => {}) // a tab's title is decoration: a refusal changes nothing the person reads
  await layoutPages()
  if (state.place_wait) goTo(state.place_wait)
  readDiscussions()
}

// ─── what the chat said about each passage ─────────────────────────────────

const DISCUSSION_PAGES = 10 // 100 messages a page: the last thousand that cite this paper

/** Every message of the chat citing this PDF, kept per highlight (a pill's `at.h`); then the marks and threads redrawn. */
async function readDiscussions() {
  // A gugu without gugu.messages (older than #7478), or chat:read taken back, or a session's PDF: no counts, nothing broken.
  if (!messagesReadable() || !state.entry?.chat) return
  const pdf = state.entry.id
  const found = new Map()
  try {
    let before
    for (let n = 0; n < DISCUSSION_PAGES; n++) {
      const page = await gugu.messages.search({ chat: state.entry.chat, file: state.entry, before, limit: 100 })
      for (const m of page.messages) {
        const places = new Set(m.refs.filter((r) => r.file === pdf && r.at?.h).map((r) => r.at.h))
        for (const h of places) found.set(h, [...(found.get(h) ?? []), m])
      }
      if ((before = page.next) == null) break
    }
  } catch (error) {
    return say(fmt(state.t.discussFailed, { e: error.message }), 'error')
  }
  state.discussed = found
  drawAllMarks()
  drawSide()
}

/** A message's words without its pills' links: 「@[A.pdf · p.4 · …](gugu-file://…)」 reads 「‹A.pdf · p.4 · …›」. */
const plainText = (text) => String(text ?? '').replace(/@\[([^\]]*)\]\([^)]*\)/g, '‹$1›').replace(/\s+/g, ' ').trim()

function notesName() {
  const folder = folderOf(state.entry)
  return (folder ? `${folder}/` : '') + notesNameOf(state.entry.name)
}

async function findNotes() {
  if (state.notes) return
  try {
    const notes = await gugu.files.open({ ...state.place, name: notesName() })
    if (notes.data.pdf && notes.data.pdf !== state.entry.id) return notes.close()
    if (state.notes) return notes.close()
    attachNotes(notes)
  } catch (error) {
    if (error.code !== 'not-found') say(fmt(state.t.failed, { e: error.message }), 'error')
  }
}

/** The notes file, made the first time someone marks this paper (reading alone makes no file). */
async function ensureNotes() {
  if (state.notes) return state.notes
  state.notesBusy ??= (async () => {
    await findNotes()
    if (state.notes) return state.notes
    const info = (await state.doc.getMetadata().catch(() => null))?.info
    const meta = { title: info?.Title || state.entry.name.replace(/\.pdf$/i, '') }
    const folder = folderOf(state.entry)
    const entry = await gugu.files.create({ ...state.place, name: notesNameOf(state.entry.name), ...(folder ? { folder } : {}) }, emptyNotes(state.entry.id, meta))
    const notes = await gugu.files.open(entry)
    attachNotes(notes)
    return notes
  })()
  try {
    return await state.notesBusy
  } finally {
    state.notesBusy = null
  }
}

function attachNotes(notes) {
  state.notes = notes
  notes.onChange(() => {
    drawAllMarks()
    drawSide()
  })
  notes.presence.onChange(() => {
    drawReaders()
    followMove()
  })
  notes.onStatus(() => {
    if (notes.status === 'gone') say(state.t.gone, 'error')
  })
  notes.onRefused(({ reason }) => say(fmt(state.t.saveFailed, { e: reason }), 'error'))
  notes.presence.set({ page: state.current })
  drawReaders()
  drawSide()
}

// ─── pages ─────────────────────────────────────────────────────────────────

let observer = null
const textLayers = new Map()
let previousSelectionRange = null
let pointerDown = false

function resetTextLayer(end, text) {
  text.append(end)
  end.style.width = ''
  end.style.height = ''
  end.style.userSelect = ''
  text.classList.remove('selecting')
}

/**
 * Keep PDF.js's end marker beside the active selection so an empty line cannot select the whole layer.
 * Ported from pdfjs-dist 5.6.205 `web/text_layer_builder.js` #enableGlobalSelectionListener (lines 210-361):
 * https://github.com/mozilla/pdf.js/blob/v5.6.205/web/text_layer_builder.js#L210-L361
 */
function updateTextLayerSelection() {
  const selection = getSelection()
  if (!selection?.rangeCount) {
    textLayers.forEach(resetTextLayer)
    previousSelectionRange = null
    return
  }

  const active = new Set()
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i)
    for (const text of textLayers.keys()) if (range.intersectsNode(text)) active.add(text)
  }
  for (const [text, end] of textLayers) {
    if (active.has(text)) text.classList.add('selecting')
    else resetTextLayer(end, text)
  }

  const range = selection.getRangeAt(0)
  const modifyStart = previousSelectionRange && (
    range.compareBoundaryPoints(Range.END_TO_END, previousSelectionRange) === 0 ||
    range.compareBoundaryPoints(Range.START_TO_END, previousSelectionRange) === 0
  )
  let anchor = modifyStart ? range.startContainer : range.endContainer
  if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode
  const parentTextLayer = anchor.parentElement?.closest('.textLayer')
  const end = textLayers.get(parentTextLayer)
  if (end && anchor.parentElement) {
    if (!modifyStart && range.endOffset === 0) {
      do {
        while (!anchor.previousSibling) anchor = anchor.parentNode
        anchor = anchor.previousSibling
      } while (!anchor.childNodes.length)
    }
    end.style.width = parentTextLayer.style.width
    end.style.height = parentTextLayer.style.height
    end.style.userSelect = 'text'
    anchor.parentElement.insertBefore(end, modifyStart ? anchor : anchor.nextSibling)
  }
  previousSelectionRange = range.cloneRange()
}

function bindTextLayer(text, end) {
  textLayers.set(text, end)
  text.addEventListener('pointerdown', () => text.classList.add('selecting'))
  return () => textLayers.delete(text)
}

async function layoutPages() {
  const doc = state.doc
  const first = await doc.getPage(1)
  const vp1 = first.getViewport({ scale: 1 })
  const width = $('pages').clientWidth - 24
  state.fitScale = Math.max(0.3, width / vp1.width)
  observer?.disconnect()
  observer = new IntersectionObserver(onVisible, { root: $('pages'), rootMargin: '150% 0px' })
  const holder = $('pages')
  holder.replaceChildren()
  state.pages = []
  for (let n = 1; n <= doc.numPages; n++) {
    const el = document.createElement('div')
    el.className = 'page'
    el.dataset.page = String(n)
    el.setAttribute('role', 'region')
    el.setAttribute('aria-label', fmt(state.t.page, { n }))
    const marks = document.createElement('div')
    marks.className = 'marks'
    // The counts sit above the text layer (a finger on one must reach it, not the words under it); the marks below it.
    const counts = document.createElement('div')
    counts.className = 'counts'
    el.append(marks, counts)
    holder.append(el)
    const page = { n, el, marks, counts, canvas: null, text: null, textSelectionCleanup: null, vp1: n === 1 ? vp1 : null, rendered: false, task: null }
    state.pages.push(page)
    sizePage(page)
    observer.observe(el)
  }
  drawPageNo()
}

const scale = () => state.fitScale * ZOOMS[state.zoom]

function sizePage(page) {
  const vp = page.vp1 ?? state.pages[0].vp1
  const s = scale()
  page.el.style.width = `${Math.floor(vp.width * s)}px`
  page.el.style.height = `${Math.floor(vp.height * s)}px`
  page.el.style.setProperty('--scale-factor', String(s))
  page.el.style.setProperty('--user-unit', '1')
  page.el.style.setProperty('--total-scale-factor', String(s))
}

function onVisible(entries) {
  for (const entry of entries) {
    const page = state.pages[Number(entry.target.dataset.page) - 1]
    if (entry.isIntersecting) renderPage(page)
    else if (page.rendered && Math.abs(page.n - state.current) > 6) unrenderPage(page)
  }
}

async function renderPage(page) {
  if (page.rendered || page.task) return
  page.task = (async () => {
    const pdfPage = await state.doc.getPage(page.n)
    page.vp1 = pdfPage.getViewport({ scale: 1 })
    sizePage(page)
    const vp = pdfPage.getViewport({ scale: scale() })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(vp.width * dpr)
    canvas.height = Math.floor(vp.height * dpr)
    canvas.style.width = `${Math.floor(vp.width)}px`
    canvas.style.height = `${Math.floor(vp.height)}px`
    await pdfPage.render({ canvas, canvasContext: canvas.getContext('2d'), viewport: vp, transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0] }).promise
    const text = document.createElement('div')
    text.className = 'textLayer'
    const layer = new pdfjs.TextLayer({ textContentSource: pdfPage.streamTextContent(), container: text, viewport: vp })
    await layer.render()
    const end = document.createElement('div')
    end.className = 'endOfContent'
    text.append(end)
    page.canvas?.remove()
    page.text?.remove()
    page.canvas = canvas
    page.text = text
    page.textSelectionCleanup?.()
    page.textSelectionCleanup = bindTextLayer(text, end)
    page.el.prepend(canvas)
    page.el.append(text)
    page.rendered = true
    drawMarks(page)
  })()
  try {
    await page.task
  } catch (error) {
    gugu.reportError(`page ${page.n}: ${error.message}`)
  } finally {
    page.task = null
  }
}

function unrenderPage(page) {
  page.textSelectionCleanup?.()
  page.textSelectionCleanup = null
  page.canvas?.remove()
  page.text?.remove()
  page.canvas = page.text = null
  page.rendered = false
}

async function rezoom(index) {
  const next = Math.max(0, Math.min(ZOOMS.length - 1, index))
  if (next === state.zoom || !state.doc) return
  state.zoom = next
  refit()
}

/**
 * Every page drawn again at the scale now (a zoom, a new width), the page read kept in view. A page the observer already
 * saw on screen is observed afresh: it would not be told again while it stays on screen, and would stay blank.
 */
function refit() {
  const at = state.current
  for (const page of state.pages) {
    unrenderPage(page)
    sizePage(page)
    observer.unobserve(page.el)
    observer.observe(page.el)
  }
  scrollToPage(at)
}

function scrollToPage(n, y = 0) {
  const page = state.pages[n - 1]
  if (!page) return
  const holder = $('pages')
  holder.scrollTo({ top: page.el.offsetTop - 8 + y * page.el.offsetHeight - holder.clientHeight * (y ? 0.3 : 0) })
}

function onScroll() {
  const holder = $('pages')
  const mid = holder.scrollTop + holder.clientHeight / 3
  let n = 1
  for (const page of state.pages) if (page.el.offsetTop <= mid) n = page.n
  if (n !== state.current) {
    state.current = n
    drawPageNo()
    state.notes?.presence.set({ page: n })
  }
  hideSelBar()
}

function drawPageNo() {
  $('pageno').textContent = fmt(state.t.pageOf, { n: state.current, total: state.doc?.numPages ?? 0 })
}

// ─── marks ─────────────────────────────────────────────────────────────────

function drawAllMarks() {
  for (const page of state.pages) drawMarks(page)
}

function drawMarks(page) {
  const highlights = Object.entries(state.notes?.data.highlights ?? {}).filter(([, h]) => h.page === page.n)
  page.marks.replaceChildren(
    ...highlights.flatMap(([id, h]) =>
      (h.rects ?? []).map(([x, y, w, hh]) => {
        const box = document.createElement('div')
        box.className = `mark c-${COLORS.includes(h.color) ? h.color : 'yellow'}${h.box ? ' box' : ''}${state.focus === id ? ' focused' : ''}`
        box.dataset.h = id
        Object.assign(box.style, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${hh * 100}%` })
        return box
      }),
    ),
  )
  page.counts.replaceChildren(...highlights.map(([id, h]) => discussedBadge(id, h)).filter(Boolean))
}

/** How many times the chat discussed this highlight, at the end of its last line: a click opens their list. */
function discussedBadge(id, h) {
  const n = state.discussed.get(id)?.length ?? 0
  const last = h.rects?.at(-1)
  if (!n || !last) return null
  const badge = document.createElement('button')
  badge.type = 'button'
  badge.className = 'discussed'
  badge.textContent = String(n)
  badge.setAttribute('aria-label', fmt(state.t.discussed, { n }))
  badge.title = badge.getAttribute('aria-label')
  Object.assign(badge.style, { left: `${(last[0] + last[2]) * 100}%`, top: `${last[1] * 100}%` })
  badge.onclick = (event) => {
    event.stopPropagation()
    state.openDiscussion = id
    openThread(id)
  }
  return badge
}

/** What is selected in one page's text, as a highlight would keep it; null when nothing is, or it spans pages. */
function readSelection() {
  const sel = getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null
  const range = sel.getRangeAt(0)
  const pageOf = (node) => (node.nodeType === 1 ? node : node.parentElement)?.closest('.page')
  const startPage = pageOf(range.startContainer)
  if (!startPage) return null
  if (pageOf(range.endContainer) !== startPage) return { error: state.t.onePage }
  const box = startPage.getBoundingClientRect()
  const rects = mergeRects(
    [...range.getClientRects()]
      .filter((r) => r.width > 1 && r.height > 1)
      .map((r) => [(r.left - box.left) / box.width, (r.top - box.top) / box.height, r.width / box.width, r.height / box.height]),
  )
  const quote = sel.toString().replace(/\s+/g, ' ').trim()
  if (!quote || !rects.length) return null
  return { page: Number(startPage.dataset.page), rects, quote }
}

let selTimer = 0
function onSelectionChange() {
  updateTextLayerSelection()
  clearTimeout(selTimer)
  selTimer = setTimeout(() => {
    const picked = readSelection()
    if (!picked) return hideSelBar()
    if (picked.error) return say(picked.error)
    state.selection = picked
    showSelBar()
  }, 250)
}

function showSelBar() {
  const bar = $('sel-bar')
  const page = state.pages[state.selection.page - 1]
  const box = page.el.getBoundingClientRect()
  const [x, y] = state.selection.rects[0]
  bar.hidden = false
  const bw = bar.offsetWidth, bh = bar.offsetHeight
  let top = box.top + y * box.height - bh - 8
  if (top < 48) top = box.top + (state.selection.rects.at(-1)[1] + state.selection.rects.at(-1)[3]) * box.height + 8
  const left = Math.max(8, Math.min(window.innerWidth - bw - 8, box.left + x * box.width))
  Object.assign(bar.style, { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` })
}

function hideSelBar() {
  $('sel-bar').hidden = true
}

/** The selection kept as a highlight (made by this person); its id. */
async function markSelection({ color = 'yellow' } = {}) {
  const picked = state.selection
  if (!picked) return null
  hideSelBar()
  getSelection()?.removeAllRanges()
  state.selection = null
  try {
    const notes = await ensureNotes()
    const id = newId()
    notes.data.highlights[id] = { page: picked.page, rects: picked.rects, quote: picked.quote, ...(picked.box ? { box: true } : {}), color, by: notes.presence.self.userId, name: notes.presence.self.name, at: new Date().toISOString() }
    return id
  } catch (error) {
    say(fmt(state.t.saveFailed, { e: error.message }), 'error')
    return null
  }
}

/** A highlight's place, as a pill keeps it: back as onLink's query when the pill is clicked. */
function refOf(id, h) {
  const words = h.quote.length > 36 ? `${h.quote.slice(0, 36)}…` : h.quote
  return { file: state.entry, at: { page: h.page, h: id }, label: `${fmt(state.t.page, { n: h.page })} · ${words}` }
}

async function askAgent() {
  const picked = state.selection
  const id = await markSelection({ color: 'blue' })
  if (!id) return
  const h = state.notes.data.highlights[id]
  try {
    await askAbout(id, h, fmt(state.t.askText, { n: picked.page }))
  } catch (error) {
    say(fmt(state.t.failed, { e: error.message }), 'error')
  }
}

/**
 * A passage to an agent, in a composer; the person sends it, or not. A chat's PDF goes as a pill into that chat's (a click
 * opens it there). A session's PDF has no pill — a pill points at a chat's file — so its agent gets the passage's words,
 * page and path in that session's composer, and the person is told why. A project's PDF (one person's library) goes where
 * the person picks in gugu's own sheet — one of their tasks or a chat — with its project and path (`askTask`).
 */
function askAbout(id, h, text) {
  if (state.place.chat) return gugu.dispatch(text, { draft: true, refs: [refOf(id, h)] })
  if (projectOf(state.place)) return askTask(h, text)
  say(state.t.sessionNoPill)
  const agent = state.ctx.workspace?.agentId
  return gugu.dispatch(fmt(state.t.askSession, { text, path: state.entry.path ?? state.entry.name, n: h.page, quote: h.quote }), { draft: true, ...(agent ? { to: { agent } } : {}) })
}

/** A project's PDF: the passage's words, page, project and path, with the project's name. */
async function projectWords(h, text) {
  const project = projectOf(state.place)
  const name = (await gugu.projects.list()).projects.find((p) => p.id === project)?.name ?? project
  return { name, words: fmt(state.t.askProject, { text, project: name, id: project, path: state.entry.path ?? state.entry.name, n: h.page, quote: h.quote }) }
}

/** Into the composer the person picks — one of their tasks or a chat (gugu lists the places, not this page). */
async function askTask(h, text) {
  const placed = await gugu.dispatch((await projectWords(h, text)).words, { draft: true })
  if (!placed.cancelled) say(state.t.askPlaced)
}

/** A new task in the PDF's project, starting from the passage. Starting takes a while: said at once, and not twice meanwhile. */
async function askNewTask() {
  const picked = state.selection
  const id = await markSelection({ color: 'blue' })
  if (!id) return
  const button = $('sel-new-task')
  button.disabled = true
  say(state.t.askStarting)
  try {
    const { name, words } = await projectWords(state.notes.data.highlights[id], fmt(state.t.askText, { n: picked.page }))
    await gugu.dispatch(words, { to: { new: true }, spawn: { project: projectOf(state.place), title: $('title').textContent } })
    say(fmt(state.t.askStarted, { project: name }))
  } catch (error) {
    say(fmt(state.t.askFailed, { e: error.message }), 'error')
  } finally {
    button.disabled = false
  }
}

async function commentSelection() {
  const id = await markSelection({ color: 'yellow' })
  if (!id) return
  openThread(id)
  setTimeout(() => document.querySelector('#side-body .reply input')?.focus(), 50)
}

function onPageClick(event) {
  if (!getSelection()?.isCollapsed) return
  const pageEl = event.target.closest('.page')
  if (!pageEl) return
  const box = pageEl.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height
  const n = Number(pageEl.dataset.page)
  const hit = Object.entries(state.notes?.data.highlights ?? {}).find(
    ([, h]) => h.page === n && (h.rects ?? []).some(([rx, ry, rw, rh]) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh),
  )
  if (hit) openThread(hit[0])
}

function openThread(id) {
  readDiscussions()
  state.focus = id
  state.highlightFilter = 'all' // a source link must reveal its passage even after filtering
  state.tab = 'highlights'
  showSide(true)
  drawAllMarks()
  drawSide()
  requestAnimationFrame(() => document.querySelector(`[data-thread="${id}"]`)?.scrollIntoView({ block: 'nearest' }))
}

/** A pill's place (`query` = its `at`): the page scrolled to, the highlight shown. */
function goTo(query) {
  if (!query) return
  if (!state.pages.length) {
    state.place_wait = query
    return
  }
  state.place_wait = null
  const h = query.h ? state.notes?.data.highlights?.[query.h] : null
  const page = Number(h?.page ?? query.page) || 1
  scrollToPage(page, h?.rects?.[0]?.[1] ?? 0)
  if (h) openThread(query.h)
}

// ─── a boxed region (a figure, a table, an equation) ───────────────────────

function setBoxing(on) {
  state.boxing = on
  $('box-toggle').setAttribute('aria-pressed', String(on))
  for (const page of state.pages) page.el.classList.toggle('boxing', on)
}

let drag = null
function onBoxDown(event) {
  if (!state.boxing) return
  const pageEl = event.target.closest('.page')
  if (!pageEl) return
  event.preventDefault()
  const box = pageEl.getBoundingClientRect()
  const ghost = document.createElement('div')
  ghost.className = 'drawing-box'
  pageEl.append(ghost)
  drag = { pageEl, box, x0: event.clientX - box.left, y0: event.clientY - box.top, ghost }
  // The drag keeps its moves even past the page's edge; a pointer the page does not hold (a pen lifted) needs none.
  try { pageEl.setPointerCapture(event.pointerId) } catch {}
}
function onBoxMove(event) {
  if (!drag) return
  const x = event.clientX - drag.box.left, y = event.clientY - drag.box.top
  Object.assign(drag.ghost.style, { left: `${Math.min(x, drag.x0)}px`, top: `${Math.min(y, drag.y0)}px`, width: `${Math.abs(x - drag.x0)}px`, height: `${Math.abs(y - drag.y0)}px` })
}
function onBoxUp(event) {
  if (!drag) return
  const { pageEl, box, x0, y0, ghost } = drag
  drag = null
  ghost.remove()
  const x1 = event.clientX - box.left, y1 = event.clientY - box.top
  const r = [Math.min(x0, x1) / box.width, Math.min(y0, y1) / box.height, Math.abs(x1 - x0) / box.width, Math.abs(y1 - y0) / box.height]
  if (r[2] < 0.02 || r[3] < 0.01) return
  // The words inside it, so the region carries its text too (an agent reads the quote; a figure may have none).
  const words = [...pageEl.querySelectorAll('.textLayer span')]
    .filter((span) => {
      const s = span.getBoundingClientRect()
      const cx = (s.left + s.width / 2 - box.left) / box.width, cy = (s.top + s.height / 2 - box.top) / box.height
      return cx >= r[0] && cx <= r[0] + r[2] && cy >= r[1] && cy <= r[1] + r[3]
    })
    .map((span) => span.textContent)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  const n = Number(pageEl.dataset.page)
  state.selection = { page: n, rects: [r.map((v) => Math.round(v * 10000) / 10000)], quote: words || fmt(state.t.region, { n }), box: true }
  setBoxing(false)
  showSelBar()
}

// ─── who is reading ────────────────────────────────────────────────────────

/** A member's name: the chat's members where the page is in a chat; elsewhere (the library page, a session's tab) the
 * name kept with what they wrote, or their presence, else 「a member」. */
function memberName(userId, kept) {
  return state.ctx?.chat?.members?.find((m) => m.id === userId)?.name
    ?? kept
    ?? state.notes?.presence.others.find((p) => p.userId === userId)?.name
    ?? (userId === state.notes?.presence.self.userId ? state.notes.presence.self.name : null)
    ?? state.t.member
}

function drawReaders() {
  const others = state.notes?.presence.others ?? []
  const seen = new Map()
  // Only someone reading (a page in their presence): the shelf has notes files open too, and is nobody's reading.
  for (const p of others) if (p.state?.page && !seen.has(p.userId)) seen.set(p.userId, p)
  $('readers').replaceChildren(
    ...[...seen.values()].map((p) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = `reader${state.follow === p.userId ? ' following' : ''}`
      b.style.setProperty('--who', p.color || 'var(--em-accent-9)')
      // Someone's own other device (a phone beside the desktop) is them too: 「you, elsewhere」 — follow it to read on.
      const name = p.userId === state.notes.presence.self.userId ? state.t.youElsewhere : p.name || memberName(p.userId)
      b.setAttribute('aria-label', state.follow === p.userId ? fmt(state.t.following, { name }) : fmt(state.t.follow, { name }))
      b.title = b.getAttribute('aria-label')
      const avatar = document.createElement('gugu-avatar')
      avatar.setAttribute('user', p.userId)
      avatar.setAttribute('size', 'xs')
      const where = document.createElement('small')
      where.textContent = p.state?.page ? fmt(state.t.onPage, { n: p.state.page }) : ''
      b.append(avatar, where)
      b.onclick = () => {
        state.follow = state.follow === p.userId ? null : p.userId
        drawReaders()
        followMove()
      }
      return b
    }),
  )
}

function followMove() {
  if (!state.follow) return
  const p = state.notes?.presence.others.find((o) => o.userId === state.follow)
  if (!p) {
    state.follow = null
    return drawReaders()
  }
  if (p.state?.page && p.state.page !== state.current) scrollToPage(p.state.page)
}

// ─── the side: highlights, cards, the paper ────────────────────────────────

function showSide(open) {
  $('side').hidden = !open
  $('side-toggle').setAttribute('aria-pressed', String(open))
  document.body.classList.toggle('side-open', open)
}

function drawSide() {
  if ($('side').hidden) return
  const data = state.notes?.data
  const view = highlightView(data, state.discussed, state.notes?.presence.self.userId, state.highlightFilter)
  $('tab-highlights').textContent = fmt(state.t.highlightsCount, { n: view.counts.all })
  $('tab-cards').textContent = fmt(state.t.cardsCount, { n: Object.keys(data?.cards ?? {}).length })
  for (const tab of document.querySelectorAll('#tabs [role=tab]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.tab === state.tab))
    tab.setAttribute('aria-controls', 'side-body')
  }
  $('highlight-filters').hidden = state.tab !== 'highlights'
  for (const button of document.querySelectorAll('[data-highlight-filter]')) {
    const filter = button.dataset.highlightFilter
    const count = document.createElement('small')
    count.textContent = String(view.counts[filter])
    button.replaceChildren(state.t[`${filter}Highlights`], count)
    button.setAttribute('aria-pressed', String(filter === state.highlightFilter))
  }
  const body = $('side-body')
  body.setAttribute('aria-labelledby', `tab-${state.tab}`)
  if (state.tab === 'cards') return review.draw(body)
  if (state.tab === 'about') return drawAbout(body)
  drawHighlights(body, view)
}

function drawHighlights(body, view) {
  const t = state.t
  if (!view.rows.length) {
    const empty = document.createElement('gugu-empty')
    empty.setAttribute('icon', 'pencil')
    const strong = document.createElement('strong')
    strong.textContent = view.counts.all ? t.noFilteredHighlights : t.noHighlights
    empty.append(strong)
    if (view.counts.all) {
      const reset = document.createElement('button')
      reset.type = 'button'
      reset.textContent = t.showAllHighlights
      reset.onclick = () => { state.highlightFilter = 'all'; drawSide() }
      empty.append(reset)
    } else if (!canWrite()) {
      const small = document.createElement('small')
      small.textContent = t.readOnly
      empty.append(small)
    }
    return body.replaceChildren(empty)
  }
  body.replaceChildren(
    ...view.rows.map(({ id, highlight: h, comments, messages }) => {
      const selected = state.focus === id
      const card = document.createElement('article')
      card.className = `thread${selected ? ' focused' : ''}`
      card.dataset.thread = id
      const head = document.createElement('button')
      head.type = 'button'
      head.className = 'quote'
      head.id = `quote-${id}`
      card.setAttribute('aria-labelledby', head.id)
      head.setAttribute('aria-expanded', String(selected))
      const q = document.createElement('blockquote')
      q.className = `c-${h.color ?? 'yellow'}`
      q.textContent = h.quote
      head.append(q)
      head.onclick = () => {
        state.focus = selected ? null : id
        if (!selected) scrollToPage(h.page, h.rects?.[0]?.[1] ?? 0)
        drawAllMarks()
        drawSide()
      }
      // One quiet line under the quote: its page, who marked it, and (bottom right) the one count of its discussion.
      const meta = document.createElement('div')
      meta.className = 'thread-meta'
      const page = document.createElement('small')
      page.className = 'page-pill'
      page.textContent = fmt(t.page, { n: h.page })
      meta.append(page, h.by ? avatarNamed(h.by) : Object.assign(document.createElement('small'), { textContent: memberName(h.by, h.name) }))
      const label = discussionLabel({ messages: messages.length, comments: comments.length, selected }, t, fmt)
      if (label) meta.append(discussionCount(id, label, messages.length > 0))
      card.append(head, meta)
      if (selected && canWrite() && h.by === state.notes.presence.self.userId) card.append(moreMenu(id))
      if (selected) {
        for (const c of comments) {
          const row = document.createElement('div')
          row.className = 'comment'
          const who = document.createElement('div')
          who.className = 'comment-who'
          const when = document.createElement('gugu-time')
          when.setAttribute('datetime', c.at)
          who.append(avatarNamed(c.by), when)
          const text = document.createElement('p')
          text.textContent = c.text
          row.append(who, text)
          card.append(row)
        }
      }
      if (selected && state.openDiscussion === id && messages.length) card.append(discussionOf(messages))
      else if (selected && !messages.length && !state.place?.chat) card.append(note(t.noChatInSession))
      else if (selected && !messages.length && !messagesReadable()) card.append(note(t.noMessagesHere))
      if (selected && canWrite()) card.append(replyBox(id, h))
      return card
    }),
  )
}

function note(text) {
  const small = document.createElement('small')
  small.className = 'muted'
  small.textContent = text
  return small
}

/** Whether this page can read the chat's messages: a gugu with gugu.messages, and chat:read granted. */
const messagesReadable = () => typeof gugu.messages?.search === 'function' && (state.ctx?.capabilities ?? []).includes('chat:read')

/** A member's face and name (the host's element: an agent's carries ⚡). */
function avatarNamed(userId) {
  const avatar = document.createElement('gugu-avatar')
  avatar.setAttribute('user', userId)
  avatar.setAttribute('size', 'xs')
  avatar.setAttribute('name', '')
  return avatar
}

/** The card's discussion count; where the chat cited it, a click selects the card and unfolds those messages. */
function discussionCount(id, label, cited) {
  if (!cited) return Object.assign(document.createElement('small'), { className: 'discussion-count', textContent: label })
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'discussion-count'
  const expanded = state.focus === id && state.openDiscussion === id
  button.setAttribute('aria-expanded', String(expanded))
  button.textContent = label
  button.onclick = () => {
    state.focus = id
    state.openDiscussion = expanded ? null : id
    drawAllMarks()
    drawSide()
  }
  return button
}

/** The chat's messages citing a passage; one clicked is shown in the chat (gugu.showMessage). */
function discussionOf(said) {
  const t = state.t
  const list = document.createElement('ul')
  list.className = 'list discussion'
  for (const m of said) {
    const li = document.createElement('li')
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'said'
    const who = document.createElement('strong')
    who.textContent = m.sender?.name ?? t.system
    const words = document.createElement('span')
    words.textContent = plainText(m.text)
    const when = document.createElement('gugu-time')
    when.setAttribute('datetime', m.createdAt)
    const text = document.createElement('div')
    text.append(who, words)
    row.append(text, when)
    row.onclick = () => gugu.showMessage(m.id).catch((e) => say(fmt(t.failed, { e: e.message }), 'error'))
    li.append(row)
    list.append(li)
  }
  return list
}

/** ⋯ on the marker's own selected card: deleting is there, not beside the reply. */
function moreMenu(id) {
  const t = state.t
  const box = document.createElement('div')
  box.className = 'more'
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'more-toggle'
  toggle.setAttribute('aria-label', t.more)
  toggle.title = t.more
  toggle.innerHTML = '<gugu-icon name="more-horizontal"></gugu-icon>'
  const menu = document.createElement('div')
  menu.className = 'more-menu'
  menu.popover = 'auto'
  menu.id = `more-${id}`
  toggle.setAttribute('popovertarget', menu.id)
  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'danger'
  remove.textContent = t.remove
  remove.onclick = () => {
    menu.hidePopover()
    state.notes.transact(() => {
      delete state.notes.data.highlights[id]
      for (const [cid, c] of Object.entries(state.notes.data.comments)) if (c.on === id) delete state.notes.data.comments[cid]
    })
    state.focus = null
  }
  menu.append(remove)
  // Placed under its button by hand: the popover sits in the top layer, outside the card's box.
  menu.addEventListener('toggle', (event) => {
    if (event.newState !== 'open') return
    const r = toggle.getBoundingClientRect()
    menu.style.top = `${r.bottom + 4}px`
    menu.style.right = `${document.documentElement.clientWidth - r.right}px`
  })
  box.append(toggle, menu)
  return box
}

function replyBox(id, h) {
  const t = state.t
  const form = document.createElement('form')
  form.className = 'reply'
  const box = document.createElement('input')
  box.type = 'text'
  box.placeholder = t.reply
  box.enterKeyHint = 'send'
  box.setAttribute('aria-label', t.reply)
  const ask = document.createElement('button')
  ask.type = 'button'
  ask.textContent = t.ask
  ask.onclick = () => askAbout(id, h, fmt(t.askText, { n: h.page })).catch((e) => say(fmt(t.failed, { e: e.message }), 'error'))
  form.append(box, ask)
  // Enter sends (a form with one text field submits on Enter); an IME's Enter only commits the composition.
  box.onkeydown = (event) => {
    if (event.key === 'Enter' && event.isComposing) event.preventDefault()
  }
  form.onsubmit = (event) => {
    event.preventDefault()
    const text = box.value.trim()
    if (!text) return
    state.notes.data.comments[newId()] = { on: id, by: state.notes.presence.self.userId, name: state.notes.presence.self.name, text, at: new Date().toISOString() }
    box.value = ''
  }
  return form
}

function drawAbout(body) {
  const t = state.t
  const meta = state.notes?.data.meta ?? {}
  const parts = []
  const h = document.createElement('h3')
  h.textContent = meta.title || state.entry?.name || ''
  parts.push(h)
  if (meta.authors?.length) {
    const p = document.createElement('p')
    p.textContent = meta.authors.join(', ')
    parts.push(p)
  }
  const facts = [meta.venue, meta.year, meta.citedBy != null ? fmt(t.citedBy, { n: meta.citedBy }) : null].filter(Boolean)
  if (facts.length) {
    const small = document.createElement('small')
    small.className = 'muted'
    small.textContent = facts.join(' · ')
    parts.push(small)
  }
  if (meta.arxiv) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = t.openArxiv
    b.onclick = () => gugu.openBrowserTab(`https://arxiv.org/abs/${meta.arxiv}`).catch((e) => say(fmt(t.failed, { e: e.message }), 'error'))
    parts.push(b)
  }
  if (meta.abstract) {
    const h5 = document.createElement('h5')
    h5.textContent = t.abstract
    const p = document.createElement('p')
    p.textContent = meta.abstract
    parts.push(h5, p)
  }
  body.replaceChildren(...parts)
}

const canWrite = () => (state.ctx?.capabilities ?? []).includes('files:write')

// ─── cards: the review loop (lib/review.js) ────────────────────────────────

const review = createReview({
  strings: () => state.t,
  notes: () => state.notes,
  onOpenHighlight: (id) => goTo({ h: id }),
  onAsk: (id, card) => {
    const h = state.notes?.data.highlights?.[id]
    if (!h) return
    askAbout(id, h, fmt(state.t.askMissed, { front: card.front, n: h.page })).catch((e) => say(fmt(state.t.failed, { e: e.message }), 'error'))
  },
  say: (text, kind) => say(text, kind),
})

// ─── the banner ────────────────────────────────────────────────────────────

function say(text, kind = 'info') {
  const banner = $('banner')
  banner.hidden = !text
  banner.textContent = text ?? ''
  banner.dataset.kind = kind
  banner.setAttribute('role', kind === 'error' ? 'alert' : 'status')
}

// ─── wiring ────────────────────────────────────────────────────────────────

$('box-toggle').onclick = () => setBoxing(!state.boxing)
$('pages').addEventListener('pointerdown', onBoxDown)
$('pages').addEventListener('pointermove', onBoxMove)
$('pages').addEventListener('pointerup', onBoxUp)
$('back').onclick = () => { location.href = 'shelf.html' }
$('import-toggle').onclick = () => {
  $('import-box').hidden = !$('import-box').hidden
  if (!$('import-box').hidden) $('import-ref').focus()
}
$('import-box').onsubmit = async (event) => {
  event.preventDefault()
  const input = $('import-ref').value.trim()
  say(state.t.importing)
  try {
    const done = await importInto(state.place, input)
    say(fmt(state.t.imported, { title: done.title }))
    $('import-ref').value = ''
  } catch (error) {
    say(importFailure(error, state.t, input), 'error')
  }
}
$('import-upload').onclick = async () => {
  try {
    const entries = await uploadInto(state.place)
    if (entries.length) say(fmt(state.t.imported, { title: entries.map((e) => e.name).join(', ') }))
  } catch (error) {
    say(fmt(state.t.failed, { e: error.message }), 'error')
  }
}
$('zoom-in').onclick = () => rezoom(state.zoom + 1)
$('zoom-out').onclick = () => rezoom(state.zoom - 1)
$('side-toggle').onclick = () => {
  showSide($('side').hidden)
  drawSide()
  if (!$('side').hidden) readDiscussions()
}
// Back on the paper after writing in the chat (its composer is outside this page): what was just said is counted.
let refocused = 0
window.addEventListener('focus', () => {
  if (Date.now() - refocused < 2000) return
  refocused = Date.now()
  readDiscussions()
})
for (const button of document.querySelectorAll('[data-highlight-filter]')) {
  button.onclick = () => { state.highlightFilter = button.dataset.highlightFilter; drawSide() }
}
for (const tab of document.querySelectorAll('#tabs [role=tab]')) {
  tab.onclick = () => {
    state.tab = tab.dataset.tab
    drawSide()
  }
}
$('sel-ask').onclick = () => askAgent()
$('sel-new-task').onclick = () => askNewTask()
$('sel-comment').onclick = () => commentSelection()
$('sel-copy').onclick = () => {
  const quote = state.selection?.quote
  if (!quote) return
  gugu.clipboard.writeText(quote).then(() => say(state.t.copied)).catch((e) => say(fmt(state.t.failed, { e: e.message }), 'error'))
}
$('pages').addEventListener('scroll', onScroll, { passive: true })
$('pages').addEventListener('click', onPageClick)
document.addEventListener('selectionchange', onSelectionChange)
document.addEventListener('pointerdown', () => { pointerDown = true })
document.addEventListener('pointerup', () => {
  pointerDown = false
  textLayers.forEach(resetTextLayer)
  previousSelectionRange = null
})
window.addEventListener('blur', () => {
  pointerDown = false
  textLayers.forEach(resetTextLayer)
  previousSelectionRange = null
})
document.addEventListener('keyup', () => {
  if (pointerDown) return
  textLayers.forEach(resetTextLayer)
  previousSelectionRange = null
})
document.addEventListener('keydown', (event) => {
  if (event.target.closest?.('input, textarea')) return
  if ((event.metaKey || event.ctrlKey) && (event.key === '=' || event.key === '+')) { event.preventDefault(); rezoom(state.zoom + 1) }
  if ((event.metaKey || event.ctrlKey) && event.key === '-') { event.preventDefault(); rezoom(state.zoom - 1) }
  if (event.key === 'Escape') {
    hideSelBar()
    setBoxing(false)
  }
})
// The panel is resized (a split moved, the window, a phone turned): pages fit its new width, the page read stays.
let resizeTimer = 0
new ResizeObserver(() => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    const vp1 = state.pages[0]?.vp1
    if (!vp1) return
    const fit = Math.max(0.3, ($('pages').clientWidth - 24) / vp1.width)
    if (Math.abs(fit - state.fitScale) < 0.01) return
    state.fitScale = fit
    refit()
  }, 200)
}).observe($('pages'))

start().catch((error) => {
  say(fmt(state.t.failed, { e: error.message }), 'error')
  gugu.reportError(error.message)
})
