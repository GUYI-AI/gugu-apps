/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 论文共读 (code: paper-club) — the reader. It opens the PDF the host hands it (its claim: a chat's .pdf, a session's .pdf, or a
// paper's notes file .paper.json, which names its PDF), draws it with PDF.js, and keeps what people mark on it in the
// notes file beside it (lib/paper.js): highlights on a passage or a boxed region, comment threads, study cards. Everyone
// with the paper open is in the notes file's presence: who reads which page, and following one of them.
//
// Every mark is evidence an agent can be sent back to: the PDF's entry id, the page, the quote and its rects. "Ask an
// agent" puts the passage in the chat's composer as a pill (gugu.compose refs, `at` = page and highlight); a pill clicked
// opens the paper here at that place (onLink). Agents read the same notes with the App's tools (tools.js).
import { openPdf, pdfjs } from './lib/pdf.js'
import { COLORS, emptyNotes, folderOf, mergeRects, newId, notesNameOf, isNotes } from './lib/paper.js'
import { fmt, stringsFor } from './lib/strings.js'
import { createReview } from './lib/review.js'

const $ = (id) => document.getElementById(id)
const ZOOMS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3]

const state = {
  t: stringsFor(navigator.language),
  ctx: null,
  entry: null, // the PDF's entry
  place: null, // { chat } or { session }
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
  follow: null, // userId being followed
  place_wait: null, // a link's place, until the pages exist
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
    state.ctx = { ...state.ctx, ...next }
    if (next.chat?.members) drawReaders()
  })
  if (!ctx.file) return say(state.t.noFile)
  say(state.t.loading)
  try {
    await openPaper(ctx.file)
  } catch (error) {
    say(fmt(state.t.failed, { e: error.message }), 'error')
    gugu.reportError(error.message)
  }
}

function labels() {
  const t = state.t
  for (const [id, label] of [['zoom-out', t.zoomOut], ['zoom-in', t.zoomIn], ['sel-copy', t.copy], ['box-toggle', t.boxTool]]) $(id).setAttribute('aria-label', label)
  $('side-toggle-label').textContent = t.notes
  $('tab-highlights').textContent = t.highlights
  $('tab-cards').textContent = t.cards
  $('tab-about').textContent = t.about
  $('sel-comment-label').textContent = t.comment
  $('sel-ask-label').textContent = t.ask
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
    const entries = await gugu.files.list(placeOfEntry(notes.entry))
    const pdf = entries.find((e) => e.id === notes.data.pdf)
    if (!pdf) throw new Error(state.t.gone)
    pdfHandle = await gugu.files.open(pdf)
  }
  state.entry = pdfHandle.entry
  state.place = placeOfEntry(state.entry)
  pdfHandle.onStatus?.(() => { if (pdfHandle.status === 'gone') say(state.t.gone, 'error') })
  const bytes = new Uint8Array(await (await pdfHandle.blob()).arrayBuffer())
  try {
    state.doc = await openPdf(bytes)
  } catch (error) {
    throw new Error(fmt(state.t.pdfFailed, { e: error.message }))
  }
  if (!state.notes) await findNotes()
  // Nobody marked it yet: the notes file someone else makes (or an agent's tool) is picked up the moment it appears.
  if (!state.notes) {
    const stop = gugu.files.onChanged(state.place, ({ entries }) => {
      if (state.notes) return stop?.()
      if ((entries ?? []).some((e) => e.name === notesNameOf(state.entry.name))) findNotes()
    })
  }
  const title = state.notes?.data.meta?.title || (await state.doc.getMetadata().catch(() => null))?.info?.Title || state.entry.name.replace(/\.pdf$/i, '')
  $('title').textContent = title
  gugu.setTabTitle(title).catch(() => {}) // a tab's title is decoration: a refusal changes nothing the person reads
  say(null)
  await layoutPages()
  if (state.place_wait) goTo(state.place_wait)
}

const placeOfEntry = (entry) => (entry.chat ? { chat: entry.chat } : { session: entry.session })

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
    el.append(marks)
    holder.append(el)
    const page = { n, el, marks, canvas: null, text: null, vp1: n === 1 ? vp1 : null, rendered: false, task: null }
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
  page.canvas?.remove()
  page.text?.remove()
  page.canvas = page.text = null
  page.rendered = false
}

async function rezoom(index) {
  const next = Math.max(0, Math.min(ZOOMS.length - 1, index))
  if (next === state.zoom || !state.doc) return
  const at = state.current
  state.zoom = next
  for (const page of state.pages) {
    unrenderPage(page)
    sizePage(page)
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
    notes.data.highlights[id] = { page: picked.page, rects: picked.rects, quote: picked.quote, ...(picked.box ? { box: true } : {}), color, by: notes.presence.self.userId, at: new Date().toISOString() }
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
    // The person @s the agent they mean and says what they want; nothing is sent until they do.
    await gugu.compose(fmt(state.t.askText, { n: picked.page }), { refs: [refOf(id, h)] })
  } catch (error) {
    say(fmt(state.t.failed, { e: error.message }), 'error')
  }
}

async function commentSelection() {
  const id = await markSelection({ color: 'yellow' })
  if (!id) return
  openThread(id)
  setTimeout(() => document.querySelector('#side-body textarea')?.focus(), 50)
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
  state.focus = id
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

function memberName(userId) {
  return state.ctx?.chat?.members?.find((m) => m.id === userId)?.name ?? userId
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
      where.textContent = p.state?.page ? String(p.state.page) : ''
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
  for (const tab of document.querySelectorAll('#tabs [role=tab]')) tab.setAttribute('aria-selected', String(tab.dataset.tab === state.tab))
  const body = $('side-body')
  if (state.tab === 'cards') return review.draw(body)
  if (state.tab === 'about') return drawAbout(body)
  drawHighlights(body)
}

function drawHighlights(body) {
  const t = state.t
  const data = state.notes?.data
  const list = Object.entries(data?.highlights ?? {}).sort(([, a], [, b]) => a.page - b.page || (a.rects?.[0]?.[1] ?? 0) - (b.rects?.[0]?.[1] ?? 0))
  if (!list.length) {
    const empty = document.createElement('gugu-empty')
    empty.setAttribute('icon', 'pencil')
    const strong = document.createElement('strong')
    strong.textContent = t.noHighlights
    empty.append(strong)
    if (!canWrite()) {
      const small = document.createElement('small')
      small.textContent = t.readOnly
      empty.append(small)
    }
    return body.replaceChildren(empty)
  }
  const comments = Object.entries(data.comments ?? {})
  body.replaceChildren(
    ...list.map(([id, h]) => {
      const card = document.createElement('article')
      card.className = `thread card${state.focus === id ? ' focused' : ''}`
      card.dataset.thread = id
      const head = document.createElement('button')
      head.type = 'button'
      head.className = 'quote'
      const q = document.createElement('blockquote')
      q.className = `c-${h.color ?? 'yellow'}`
      q.textContent = h.quote
      const meta = document.createElement('small')
      meta.className = 'muted'
      meta.textContent = `${fmt(t.page, { n: h.page })} · ${memberName(h.by)}`
      head.append(q, meta)
      head.onclick = () => {
        state.focus = id
        scrollToPage(h.page, h.rects?.[0]?.[1] ?? 0)
        drawAllMarks()
        drawSide()
      }
      card.append(head)
      for (const [, c] of comments.filter(([, c]) => c.on === id).sort(([, a], [, b]) => String(a.at).localeCompare(String(b.at)))) {
        const row = document.createElement('div')
        row.className = 'comment'
        const avatar = document.createElement('gugu-avatar')
        avatar.setAttribute('user', c.by)
        avatar.setAttribute('size', 'xs')
        const text = document.createElement('p')
        text.textContent = c.text
        const when = document.createElement('gugu-time')
        when.setAttribute('datetime', c.at)
        row.append(avatar, text, when)
        card.append(row)
      }
      if (state.focus === id && canWrite()) card.append(replyBox(id, h))
      return card
    }),
  )
}

function replyBox(id, h) {
  const t = state.t
  const form = document.createElement('form')
  form.className = 'reply'
  const box = document.createElement('textarea')
  box.rows = 2
  box.placeholder = t.reply
  box.setAttribute('aria-label', t.reply)
  const row = document.createElement('div')
  row.className = 'row'
  const send = document.createElement('button')
  send.type = 'submit'
  send.className = 'primary'
  send.textContent = t.send
  const ask = document.createElement('button')
  ask.type = 'button'
  ask.textContent = t.ask
  ask.onclick = () => gugu.compose(fmt(t.askText, { n: h.page }), { refs: [refOf(id, h)] }).catch((e) => say(fmt(t.failed, { e: e.message }), 'error'))
  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'danger'
  remove.textContent = t.remove
  remove.hidden = h.by !== state.notes.presence.self.userId
  remove.onclick = () => {
    state.notes.transact(() => {
      delete state.notes.data.highlights[id]
      for (const [cid, c] of Object.entries(state.notes.data.comments)) if (c.on === id) delete state.notes.data.comments[cid]
    })
    state.focus = null
  }
  row.append(send, ask, remove)
  form.append(box, row)
  form.onsubmit = (event) => {
    event.preventDefault()
    const text = box.value.trim()
    if (!text) return
    state.notes.data.comments[newId()] = { on: id, by: state.notes.presence.self.userId, text, at: new Date().toISOString() }
    box.value = ''
  }
  box.onkeydown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) form.requestSubmit()
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
    gugu.compose(fmt(state.t.askMissed, { front: card.front, n: h.page }), { refs: [refOf(id, h)] }).catch((e) => say(fmt(state.t.failed, { e: e.message }), 'error'))
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
$('zoom-in').onclick = () => rezoom(state.zoom + 1)
$('zoom-out').onclick = () => rezoom(state.zoom - 1)
$('side-toggle').onclick = () => {
  showSide($('side').hidden)
  drawSide()
}
for (const tab of document.querySelectorAll('#tabs [role=tab]')) {
  tab.onclick = () => {
    state.tab = tab.dataset.tab
    drawSide()
  }
}
$('sel-ask').onclick = () => askAgent()
$('sel-comment').onclick = () => commentSelection()
$('sel-copy').onclick = () => {
  const quote = state.selection?.quote
  if (!quote) return
  gugu.clipboard.writeText(quote).then(() => say(state.t.copied)).catch((e) => say(fmt(state.t.failed, { e: e.message }), 'error'))
}
$('pages').addEventListener('scroll', onScroll, { passive: true })
$('pages').addEventListener('click', onPageClick)
document.addEventListener('selectionchange', onSelectionChange)
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
    const at = state.current
    state.fitScale = fit
    for (const page of state.pages) {
      unrenderPage(page)
      sizePage(page)
    }
    scrollToPage(at)
  }, 200)
}).observe($('pages'))

start().catch((error) => {
  say(fmt(state.t.failed, { e: error.message }), 'error')
  gugu.reportError(error.message)
})
