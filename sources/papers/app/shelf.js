/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// 读论文 — the shelf: the tab that claims no file. Where it is decides what it lists:
// - the App's own page (its icon in the left bar; no chat, no session): the person's library — every paper in every chat
//   they are in (files.search), with the chat it is in, its marks, who is reading it and their own mastery and due cards;
//   an import goes into the chat they pick.
// - a chat: that chat's papers, imports go there. (Today a chat's side panel holds only the folder and Apps opened for a
//   file — GroupAppSlot — so this is for when it holds Apps of their own; the code is the same.)
// - a session: the working copy's PDFs.
// An arXiv id, a DOI or a link imports a paper (lib/importer.js), or a PDF is uploaded. A paper clicked opens with the
// reader (gugu.files.openWith).
import { importPaper, ImportError, sameWork } from './lib/importer.js'
import { isNotes, isPdf, parseRef, PAPERS_FOLDER } from './lib/paper.js'
import { isDue, mastery } from './lib/review.js'
import { fmt, stringsFor } from './lib/strings.js'

const $ = (id) => document.getElementById(id)
const MAX_OPEN = 40 // notes files opened for their counts; past that, a row says only its name
const state = { t: stringsFor(navigator.language), ctx: null, place: null, library: false, entries: [], notes: new Map(), me: null }

async function start() {
  const ctx = await gugu.getContext()
  state.ctx = ctx
  state.t = stringsFor(ctx.locale)
  const t = state.t
  $('ref').placeholder = t.importPlaceholder
  $('ref').setAttribute('aria-label', t.importPlaceholder)
  $('import-go').textContent = t.import
  $('upload').textContent = t.upload
  state.place = ctx.chat ? { chat: ctx.chat.id } : ctx.session ? { session: ctx.session.id } : null
  state.library = !state.place
  if (ctx.session && !ctx.chat) {
    $('import').hidden = true
    $('list-title').hidden = false
    $('list-title').textContent = t.sessionShelf
  }
  if (state.library) {
    $('target').hidden = false
    $('target').setAttribute('aria-label', t.importInto)
    $('list-title').textContent = t.library
    // Every chat's folder can change: the list is read again when the page is looked at again.
    gugu.onContextChanged((next) => { if (next.layout?.visible) refresh() })
    return refresh()
  }
  gugu.files.onChanged(state.place, () => refresh())
  gugu.onContextChanged((next) => {
    state.ctx = { ...state.ctx, ...next }
  })
  await refresh()
}

let refreshing = null
async function refresh() {
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      state.entries = state.library ? await libraryEntries() : await gugu.files.list(state.place)
      await openNotes()
      draw()
    } catch (error) {
      say(fmt(state.t.failed, { e: error.message }), 'error')
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** The library: every PDF and notes file in the person's chats (newest first), each with its chat's name. */
async function libraryEntries() {
  const [pdfs, notes] = await Promise.all([
    gugu.files.search({ suffixes: ['.pdf'], limit: 200 }),
    gugu.files.search({ query: '.paper', suffixes: ['.json'], limit: 200 }),
  ])
  const chats = new Map()
  for (const e of [...pdfs, ...notes]) if (e.chat && !chats.has(e.chat)) chats.set(e.chat, e.chatName ?? e.chat)
  drawTargets(chats)
  return [...pdfs, ...notes]
}

function drawTargets(chats) {
  const select = $('target')
  const was = select.value
  select.replaceChildren(...[...chats].map(([id, name]) => Object.assign(document.createElement('option'), { value: id, textContent: name })))
  if ([...chats.keys()].includes(was)) select.value = was
  $('import').hidden = chats.size === 0
}

/** Each notes file of the chat, opened live (its counts and readers stay current); ones gone are let go. */
async function openNotes() {
  const want = state.entries.filter(isNotes).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, MAX_OPEN)
  const ids = new Set(want.map((e) => e.id))
  for (const [id, f] of state.notes) if (!ids.has(id)) { f.close(); state.notes.delete(id) }
  await Promise.all(
    want.filter((e) => !state.notes.has(e.id)).map(async (entry) => {
      try {
        const f = await gugu.files.open(entry)
        state.notes.set(entry.id, f)
        state.me ??= f.presence.self.userId
        f.onChange(() => draw())
        f.presence.onChange(() => draw())
      } catch (error) {
        // One unreadable notes file costs its row its counts, never the shelf: say which.
        gugu.reportError(`${entry.name}: ${error.message}`)
      }
    }),
  )
}

function notesOf(pdf) {
  for (const f of state.notes.values()) if (f.data.pdf === pdf.id) return f
  return null
}

function draw() {
  const t = state.t
  const pdfs = state.entries.filter(isPdf).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  if (!pdfs.length) return empty(state.library ? t.libraryEmpty : state.ctx.chat ? t.shelfEmpty : t.sessionEmpty)
  $('list-title').hidden = false
  $('empty').replaceChildren()
  $('papers').replaceChildren(
    ...pdfs.map((pdf) => {
      const f = notesOf(pdf)
      const meta = f?.data.meta ?? {}
      const li = document.createElement('li')
      li.tabIndex = 0
      li.setAttribute('role', 'button')
      const text = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = meta.title || pdf.name.replace(/\.pdf$/i, '')
      const sub = document.createElement('span')
      const marks = Object.keys(f?.data.highlights ?? {}).length
      const readers = new Set((f?.presence.others ?? []).filter((p) => p.state?.page).map((p) => p.userId)).size
      sub.textContent = [
        meta.year,
        meta.authors?.length ? `${meta.authors[0]}${meta.authors.length > 1 ? ' …' : ''}` : null,
        marks ? fmt(t.marks, { n: marks }) : null,
        readers ? `${readers} ${t.readingNow}` : null,
        state.library ? pdf.chatName : null,
        due(f) ? fmt(t.dueCount, { n: due(f) }) : null,
      ].filter(Boolean).join(' · ')
      text.append(title, sub)
      li.append(text)
      const cards = f?.data.cards ?? {}
      if (Object.keys(cards).length && state.me) {
        const concepts = mastery(cards, f.data.reviews?.[state.me])
        const total = concepts.reduce((sum, c) => sum + c.mastery * c.cards.length, 0) / Object.keys(cards).length
        const mine = document.createElement('span')
        mine.className = 'mine'
        const bar = document.createElement('progress')
        bar.max = 100
        bar.value = Math.round(total * 100)
        const small = document.createElement('small')
        small.textContent = `${Math.round(total * 100)}%`
        mine.append(bar, small)
        li.append(mine)
      }
      const open = () => gugu.files.openWith(pdf).catch((e) => say(fmt(t.failed, { e: e.message }), 'error'))
      li.onclick = open
      li.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }
      return li
    }),
  )
}

/** This person's cards on a paper that are due now. */
function due(f) {
  const cards = Object.keys(f?.data.cards ?? {})
  const mine = f?.data.reviews?.[state.me] ?? {}
  return cards.filter((id) => isDue(mine[id])).length
}

function empty(text) {
  $('papers').replaceChildren()
  const node = document.createElement('gugu-empty')
  node.setAttribute('icon', 'book-open')
  const strong = document.createElement('strong')
  strong.textContent = text
  node.append(strong)
  $('empty').replaceChildren(node)
}

// ─── import ────────────────────────────────────────────────────────────────

// One folder for every member whatever their language (the program's import uses the same): 论文.
const folderName = () => PAPERS_FOLDER

/** On this page: arXiv's PDFs are on a host the App declared; any other PDF host is the program's to reach. */
const pageCanFetch = (url) => /^https:\/\/arxiv\.org\//.test(url ?? '')

async function onImport(event) {
  event.preventDefault()
  const t = state.t
  const input = $('ref').value.trim()
  const ref = parseRef(input)
  if (!ref) return say(fmt(t.badRef, { s: input }), 'error')
  say(t.importing)
  $('import-go').disabled = true
  try {
    const done = typeof gugu.callProgram === 'function' && !ref.arxiv
      ? await importByProgram(input)
      : await importHere(ref)
    say(fmt(t.imported, { title: done.title }))
    $('ref').value = ''
    await refresh()
  } catch (error) {
    if (error.code === 'no-pdf') say(fmt(t.noPdf, { title: error.meta?.title || input }), 'error')
    else if (error.code === 'needs-desktop') say(t.phoneNoProgram, 'error')
    else say(fmt(t.failed, { e: error.message }), 'error')
  } finally {
    $('import-go').disabled = false
  }
}

/** Where an import goes: this chat, or (the library) the chat picked. */
const importPlace = () => (state.library ? { chat: $('target').value } : state.place)

async function importHere(ref) {
  const folder = folderName()
  const place = importPlace()
  const result = await importPaper(ref, {
    fetch: (url, init) => {
      if (!pageCanFetch(url) && !/^https:\/\/(export\.arxiv\.org|api\.semanticscholar\.org|api\.openalex\.org)\//.test(url)) {
        throw new ImportError('needs-desktop', url)
      }
      return fetch(url, init)
    },
    upload: async (file) => (await gugu.files.upload({ ...place, folder }, file))[0],
    create: (name, inFolder, data) => gugu.files.create({ ...place, name, ...(inFolder ? { folder: inFolder } : {}) }, data),
    existing: async (meta) => {
      await openNotes()
      for (const f of state.notes.values()) {
        if (f.entry.chat === place.chat && sameWork(f.data.meta, meta)) return { notes: f.entry, pdf: state.entries.find((e) => e.id === f.data.pdf) ?? null }
      }
      return null
    },
  })
  return { title: result.meta.title || result.pdf?.name || '' }
}

async function importByProgram(input) {
  const answer = await gugu.callProgram('import_paper', { chat: importPlace().chat, ref: input })
  if (answer.isError) throw new Error(answer.content?.map((c) => c.text).join(' ') || 'import failed')
  const result = answer.structuredContent ?? {}
  return { title: result.title ?? input }
}

async function onUpload() {
  const t = state.t
  try {
    const entries = await gugu.files.upload({ ...importPlace(), folder: folderName() })
    if (entries.length) {
      say(fmt(t.imported, { title: entries.map((e) => e.name).join(', ') }))
      await refresh()
    }
  } catch (error) {
    say(fmt(t.failed, { e: error.message }), 'error')
  }
}

function say(text, kind = 'info') {
  const banner = $('banner')
  banner.hidden = !text
  banner.textContent = text ?? ''
  banner.dataset.kind = kind
  banner.setAttribute('role', kind === 'error' ? 'alert' : 'status')
}

$('import').onsubmit = onImport
$('upload').onclick = onUpload
start().catch((error) => {
  say(fmt(state.t.failed, { e: error.message }), 'error')
  gugu.reportError(error.message)
})

