// The panel: how to start contributing, the person's contributions and everyone's, read from GitHub's public search. Who
// the person is comes from the host (`getContext().operator.guguNumber`, App API 32), never typed in.
import { ACCOUNT_WORD, ALL_ISSUES_URL, CONTRIBUTING_URL, STARTERS_LIMIT, WRITE_APP_URL, allQuery, boardOf, itemsOf, mineOf, reviewUrl, searchApi, SEARCH_PAGES, starterOf, startersQuery, startersUrl, textFor } from './core.js'

const g = window.gugu
const CACHE = 'gugu-contribution:v2'
const TAB = 'gugu-contribution:tab'
const TABS = ['start', 'mine', 'board']
const FRESH_MS = 10 * 60_000 // how long a read is shown without asking GitHub again
const SPACING_MS = 60_000 // anonymous search allows 10 requests a minute; a success waits this long before the next
const RETRY_MS = 60_000 // the host tries the 咕咕号 again on an ask a minute after a failure
const TIMEOUT_MS = 20_000 // a GitHub read that hangs is said, not waited on forever

const $ = (id) => document.getElementById(id)
const state = { tab: TABS.includes(localStorage.getItem(TAB)) ? localStorage.getItem(TAB) : 'start', ctx: null, data: null, error: null, loading: false, nextRead: 0, note: null, handing: false, handResult: null }
const t = () => textFor(state.ctx?.locale)

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue
    if (k === 'text') el.textContent = v
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else el.setAttribute(k, v === true ? '' : String(v))
  }
  for (const child of children.flat(3)) if (child !== null && child !== undefined && child !== false) el.append(child)
  return el
}

const said = (error) => g.reportError(error?.message ?? String(error))
const link = (url, text, attrs = {}) => h('a', { href: url, ...attrs, text, onclick: (event) => { event.preventDefault(); g.openBrowserTab(url).catch(said) } })

function guguNumberState(ctx) {
  const op = ctx?.operator
  if (!op || op.guguNumber === undefined && op.kind === 'person') return { wait: true }
  if (op.kind !== 'person') return { agent: true }
  return op.guguNumber === null ? { missing: true } : { number: op.guguNumber }
}

// ---- GitHub ----

class Unavailable extends Error {
  constructor(message, retryAt) { super(message); this.retryAt = retryAt }
}

async function search(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch((error) => {
    throw new Unavailable(error?.name === 'TimeoutError' ? t().timedOut(TIMEOUT_MS / 1000) : t().offline)
  })
  if (res.ok) return res.json()
  const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000
  if (res.status === 403 || res.status === 429) throw new Unavailable(t().rateLimited(reset ? new Date(reset).toLocaleTimeString(state.ctx?.locale, { hour: '2-digit', minute: '2-digit' }) : null), reset || undefined)
  throw new Unavailable(t().httpFailed(res.status))
}

async function readGitHub() {
  const starters = await search(searchApi(startersQuery(), 1, STARTERS_LIMIT))
  const rows = []
  let total = 0
  let incomplete = Boolean(starters.incomplete_results)
  for (let page = 1; page <= SEARCH_PAGES; page++) {
    const body = await search(searchApi(allQuery(), page))
    total = body.total_count
    incomplete ||= Boolean(body.incomplete_results)
    rows.push(...body.items)
    if (body.items.length < 100 || rows.length >= total) break
  }
  return { at: Date.now(), items: itemsOf(rows), starters: starters.items.map(starterOf), startersTotal: starters.total_count, partial: incomplete || rows.length < total }
}

function cached() {
  try { return JSON.parse(localStorage.getItem(CACHE) ?? 'null') } catch { return null }
}

let again = null
async function refresh(force) {
  const now = Date.now()
  if (state.loading) return
  if (!force && state.data && now - state.data.at < FRESH_MS) return render()
  if (force && now < state.nextRead) { // say why, on screen: a disabled icon's tooltip reaches neither phones nor keyboards
    state.note = t().refreshWait
    render()
    return
  }
  state.loading = true
  state.note = null
  clearTimeout(again)
  render()
  try {
    state.data = await readGitHub()
    state.error = null
    state.nextRead = Date.now() + SPACING_MS
    localStorage.setItem(CACHE, JSON.stringify(state.data))
  } catch (error) {
    if (!(error instanceof Unavailable)) said(error)
    state.error = error.message ?? String(error)
    state.nextRead = error.retryAt ?? 0
    if (error.retryAt) again = setTimeout(() => refresh(true), Math.max(error.retryAt - Date.now(), 0) + 1000)
  } finally {
    state.loading = false
    render()
  }
}

// ---- handing work to an agent: gugu's own sheet, where the person edits the text and chooses who ----

async function hand(text) {
  if (state.handing) return
  state.handing = true
  state.handResult = null
  render()
  try {
    const done = await g.dispatch(text, { spawn: { title: t().taskTitle } }) // a new agent's task needs a name
    if (!done?.cancelled) state.handResult = { ok: t().handed }
  } catch (error) {
    state.handResult = { error: t().handFailed(error?.message ?? String(error)) }
  } finally {
    state.handing = false
    render()
  }
}

// ---- drawing ----

function tag(item) {
  const w = t()
  if (item.status === 'conflict') return h('strong', { class: 'conflict', text: w.conflict })
  if (item.status === 'waiting') return h('small', { class: 'muted', text: w.waiting })
  return item.score === 0 ? h('small', { class: 'muted', text: w.noCredit }) : h('strong', { class: 'score', text: w.points(item.score) })
}

function itemRow(item) {
  const w = t()
  return h('li', {},
    h('div', {},
      link(item.url, item.title, { class: 'title' }),
      h('span', { class: 'muted', text: `${w.kind[item.kind]} · ${item.repo} #${item.number} · ${w.state[item.state]}` })),
    tag(item))
}

function startersBlock() {
  const w = t().claim
  const d = state.data
  if (!d) {
    return state.loading
      ? h('p', { role: 'status', class: 'muted', text: t().loading })
      : h('p', { class: 'muted' }, `${w.unread} `, link(startersUrl(), w.all))
  }
  if (!d.starters?.length) return h('p', { class: 'muted' }, `${w.none} `, link(ALL_ISSUES_URL, w.all))
  return [
    h('ul', { class: 'list' }, d.starters.map((s) => h('li', {},
      h('div', {},
        link(s.url, s.title, { class: 'title' }),
        h('span', { class: 'muted', text: `${s.repo} #${s.number} · ${w.comments(s.comments)}` })),
      h('button', { 'data-key': s.url, disabled: state.handing, 'aria-label': w.actionFor(s.title), onclick: () => hand(w.prompt(s)), text: w.action })))),
    d.startersTotal > d.starters.length ? h('p', {}, link(startersUrl(), w.more.replace('{n}', d.startersTotal))) : null,
  ]
}

function way(words, ...rest) {
  return h('section', { class: 'card stack way' },
    h('h4', { text: words.title }),
    h('p', { class: 'muted', text: words.body }),
    h('p', {}, h('small', { class: 'muted', text: words.cost })),
    rest)
}

function startView(who) {
  const w = t()
  const r = state.handResult
  return [
    h('h2', { text: w.heading }),
    h('p', { text: w.intro }),
    h('div', { class: 'row' }, h('button', { class: 'primary', 'data-key': 'unsure', disabled: state.handing, onclick: () => hand(w.unsure.prompt), text: w.unsure.action })),
    r?.ok ? h('p', { role: 'status', text: r.ok }) : null,
    r?.error ? h('p', { role: 'alert', text: r.error }) : null,
    way(w.report, h('div', { class: 'row' }, h('button', { 'data-key': 'report', disabled: state.handing, onclick: () => hand(w.report.prompt), text: w.report.action }))),
    way(w.app, h('div', { class: 'row actions' }, h('button', { 'data-key': 'app', disabled: state.handing, onclick: () => hand(w.app.prompt), text: w.app.action }), link(WRITE_APP_URL, w.app.guide))),
    way(w.claim, startersBlock(),
      h('details', {},
        h('summary', { text: w.steps.title }),
        h('ol', {}, w.steps.items.map((item) => h('li', { text: item }))),
        h('p', {}, link(CONTRIBUTING_URL, w.steps.guide)))),
    h('details', {},
      h('summary', { text: w.scoring.title }),
      h('p', { class: 'muted', text: w.scoring.body }),
      h('p', { class: 'muted' }, w.scoring.identity(h('code', { text: w.scoring.line(who.number) })))),
  ]
}

function mineView(who) {
  const w = t()
  if (who.wait) return h('p', { role: 'status', class: 'muted', text: w.readingNumber })
  if (who.agent) return h('p', { role: 'status', class: 'muted', text: w.agentPage })
  if (who.missing) return [h('p', { role: 'alert', text: w.noNumber }), h('div', { class: 'row' }, h('button', { 'data-key': 'go-start', onclick: () => go('start'), text: w.startAction }))]
  if (!state.data) return h('p', { role: 'status', class: 'muted', text: state.loading ? w.loading : '' })
  const { waiting, scored, points } = mineOf(state.data.items, who.number)
  if (!waiting.length && !scored.length) {
    return [
      h('gugu-empty', { icon: 'git-pull-request' },
        h('strong', { text: w.mineEmptyTitle }),
        h('small', { text: w.mineEmptyBody }),
        h('button', { class: 'primary', 'data-key': 'go-start', onclick: () => go('start'), text: w.startAction })),
      h('p', { class: 'muted center' }, h('small', {}, w.mineEmptyAlready(h('code', { text: w.scoring.line(who.number) })))),
    ]
  }
  return [
    h('div', { class: 'stats' },
      h('div', { class: 'card' }, h('strong', { text: String(points) }), h('small', { class: 'muted', text: w.stats.points })),
      h('div', { class: 'card' }, h('strong', { text: String(scored.length) }), h('small', { class: 'muted', text: w.stats.scored })),
      h('div', { class: 'card' }, h('strong', { text: String(waiting.length) }), h('small', { class: 'muted', text: w.stats.waiting }))),
    waiting.length ? [h('h5', { text: w.waitingTitle(waiting.length) }), h('ul', { class: 'list' }, waiting.map(itemRow))] : null,
    scored.length ? [h('h5', { text: w.scoredTitle(scored.length) }), h('ul', { class: 'list' }, scored.map(itemRow))] : null,
    h('p', { class: 'muted' }, h('small', { text: w.scoring.body })),
  ]
}

function boardView(who) {
  const w = t()
  if (!state.data) return h('p', { role: 'status', class: 'muted', text: state.loading ? w.loading : '' })
  const rows = boardOf(state.data.items)
  return [
    rows.length
      ? [
          h('p', { class: 'muted' }, h('small', { text: `${w.boardNote} ${w.scoring.body}` })),
          h('ul', { class: 'list' }, rows.map((row) => h('li', { class: row.account === who.number ? 'me' : null },
            h('strong', { class: 'rank', text: String(row.rank) }),
            h('div', {},
              h('strong', { class: 'title', text: `${row.logins[0] ?? '—'}${row.account === who.number ? w.me : ''}` }),
              h('span', { class: 'muted', text: w.boardRow(row.account, row.scored) })),
            h('div', { class: 'pts' }, h('strong', { text: String(row.points) }), row.waiting ? h('small', { class: 'muted', text: w.boardWaiting(row.waiting) }) : null)))),
        ]
      : h('gugu-empty', { icon: 'users' },
          h('strong', { text: w.boardEmptyTitle }),
          h('small', { text: w.boardEmptyBody }),
          h('button', { class: 'primary', 'data-key': 'go-start', onclick: () => go('start'), text: w.startAction })),
    h('p', {}, h('small', {}, link(reviewUrl(), w.review))),
  ]
}

const keyOf = (el) => el.dataset.key ?? el.getAttribute('href') ?? null

function render() {
  const w = t()
  const who = guguNumberState(state.ctx)
  document.documentElement.lang = /^zh/i.test(state.ctx?.locale ?? '') ? 'zh-CN' : 'en'
  $('who').textContent = who.number ? w.who(who.number) : ''
  for (const tab of document.querySelectorAll('[role=tab]')) {
    const on = tab.dataset.tab === state.tab
    tab.textContent = w.tabs[tab.dataset.tab]
    tab.setAttribute('aria-selected', String(on))
    tab.setAttribute('aria-controls', 'view')
    tab.tabIndex = on ? 0 : -1
  }
  const button = $('refresh')
  button.setAttribute('aria-disabled', String(state.loading))
  button.setAttribute('aria-label', w.refresh)
  button.title = w.refresh
  const err = state.error ?? ''
  if ($('err').textContent !== err) $('err').textContent = err
  $('err').hidden = !err
  // Redrawing must not lose the person's place: the scroll, what is focused, and which folds are open all stay.
  const view = $('view')
  const scroll = document.scrollingElement?.scrollTop ?? 0
  const active = view.contains(document.activeElement) ? document.activeElement : null
  const focusKey = active ? (active.tagName === 'SUMMARY' ? `summary:${active.textContent}` : keyOf(active)) : null
  const open = new Set([...view.querySelectorAll('details[open] > summary')].map((el) => el.textContent))
  view.classList.toggle('stale', Boolean(state.error))
  view.setAttribute('aria-labelledby', `tab-${state.tab}`)
  const draw = { start: startView, mine: mineView, board: boardView }[state.tab]
  view.replaceChildren(...[draw(who)].flat(3).filter(Boolean))
  for (const summary of view.querySelectorAll('details > summary')) if (open.has(summary.textContent)) summary.parentElement.open = true
  if (focusKey) {
    const again = [...view.querySelectorAll('a, button, summary')].find((el) => (el.tagName === 'SUMMARY' ? `summary:${el.textContent}` : keyOf(el)) === focusKey)
    again?.focus({ preventScroll: true })
  }
  if (document.scrollingElement) document.scrollingElement.scrollTop = scroll
  const stamp = $('stamp')
  stamp.replaceChildren()
  if (state.note) stamp.append(state.note)
  else if (state.loading && state.data) stamp.append(w.loading)
  else if (state.data) {
    stamp.append(`${state.error ? w.showingFrom : w.updated} `, h('gugu-time', { datetime: new Date(state.data.at).toISOString() }))
    if (state.data.partial) stamp.append(` · ${w.partial}`)
  }
}

function go(tab) {
  state.tab = tab
  state.note = null
  localStorage.setItem(TAB, tab)
  render()
  window.scrollTo(0, 0)
}

// ---- start ----

$('refresh').addEventListener('click', () => refresh(true))
$('tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[role=tab]')
  if (tab) go(tab.dataset.tab)
})
$('tabs').addEventListener('keydown', (event) => {
  const at = TABS.indexOf(state.tab)
  const next = { ArrowRight: at + 1, ArrowLeft: at - 1 + TABS.length, Home: 0, End: TABS.length - 1 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  go(TABS[next % TABS.length])
  document.querySelector('[role=tab][aria-selected=true]').focus()
})
window.addEventListener('online', () => { if (state.error) refresh(true) })

let retry = null
function seen(ctx) {
  state.ctx = ctx
  render()
  // A failed lookup is asked again; the answer comes back as a context change, or as this read.
  if (ctx?.operator?.guguNumber === null && !retry) retry = setTimeout(() => { retry = null; readContext() }, RETRY_MS)
}

async function readContext() {
  try {
    seen(await g.getContext())
  } catch (error) {
    said(error)
  }
}

g.onContextChanged(seen)
state.data = cached()
await readContext()
$('app').hidden = false
await refresh(false)
