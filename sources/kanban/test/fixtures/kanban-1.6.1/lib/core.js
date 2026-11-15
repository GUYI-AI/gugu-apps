// 协作看板's board, as data: the operations every writer goes through, the order keys, and how a card reads (its task's
// status, whether it waits on someone, whether it went quiet). No Node, no DOM: tools.js (Node) and the pages (the
// browser) import the same file, and apply it to either home of a board — this computer's board.json, or a chat's
// board file (a live object, gugu.files) — alike.

export const BOARD_VERSION = 1

/** The four columns a new board starts with. `role` names one for the tools; its title is the page's to word. */
export const DEFAULT_COLUMNS = [
  { id: 'todo', role: 'todo' },
  { id: 'doing', role: 'doing' },
  { id: 'review', role: 'review' },
  { id: 'done', role: 'done' },
]

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * A key strictly between `a` and `b` (either may be null: no bound), compared as plain strings. Fractional keys, so a
 * move writes one card and never renumbers its neighbours: there is no server here to rebalance float positions later.
 */
export function keyBetween(a, b) {
  if (a !== null && b !== null && a >= b) throw new Error(`order keys out of order: ${a} >= ${b}`)
  return midpoint(a ?? '', b)
}

function midpoint(a, b) {
  if (b !== null) {
    let n = 0
    while ((a[n] ?? '0') === b[n]) n++
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n))
  }
  const da = a ? DIGITS.indexOf(a[0]) : 0
  const db = b !== null ? DIGITS.indexOf(b[0]) : DIGITS.length
  if (db - da > 1) return DIGITS[Math.round((da + db) / 2)]
  if (b !== null && b.length > 1) return b.slice(0, 1)
  return DIGITS[da] + midpoint(a.slice(1), null)
}

/** Ties (two writers picked the same key) sort by id, the same way everywhere. */
export const byOrder = (x, y) => (x.order < y.order ? -1 : x.order > y.order ? 1 : x.id < y.id ? -1 : x.id > y.id ? 1 : 0)

/** Ids for new cards, links, comments and columns: short, and the same maker in Node and the browser. */
export const newId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12)

export function emptyBoard() {
  const columns = {}
  let order = null
  for (const c of DEFAULT_COLUMNS) {
    order = keyBetween(order, null)
    columns[c.id] = { id: c.id, role: c.role, title: null, order }
  }
  return { version: BOARD_VERSION, rev: 0, columns, cards: {}, comments: {} }
}

export const columnsInOrder = (board) => Object.values(board.columns).sort(byOrder)
export const cardsIn = (board, column) => Object.values(board.cards).filter((c) => c.column === column).sort(byOrder)

/** What people and agents call a starting column, in the languages the page words it in. */
const ROLE_NAMES = {
  todo: ['todo', 'to do', '待办'],
  doing: ['doing', 'in progress', '进行中'],
  review: ['review', '待验收'],
  done: ['done', '完成'],
}

/** A column by id, by its title, or by a starting column's name (todo / 待办 …), ignoring case. */
export function findColumn(board, name) {
  const text = String(name ?? '').trim().toLowerCase()
  if (!text) return null
  const all = columnsInOrder(board)
  return (
    all.find((c) => c.id === text) ??
    all.find((c) => (c.title ?? '').toLowerCase() === text) ??
    all.find((c) => c.role && c.title === null && ROLE_NAMES[c.role].includes(text)) ??
    null
  )
}

const LINK_KINDS = {
  task: ['session'],
  file: ['session', 'path'],
  project: ['project', 'path'],
  chatfile: ['file'],
  message: ['message'],
  pr: ['url'],
  url: ['url'],
}

function checkLink(link) {
  const needs = LINK_KINDS[link?.kind]
  if (!needs) throw new Error(`a link's kind is one of: ${Object.keys(LINK_KINDS).join(', ')}`)
  for (const field of needs) {
    if (typeof link[field] !== 'string' || !link[field].trim()) throw new Error(`a ${link.kind} link needs ${field}`)
  }
  if ((link.kind === 'pr' || link.kind === 'url') && !/^https?:\/\//.test(link.url)) throw new Error('a link url starts with http:// or https://')
  if ((link.kind === 'file' || link.kind === 'project') && (link.path.startsWith('/') || link.path.split('/').includes('..'))) {
    throw new Error("a file link's path is relative to its task's working copy or project folder, without ..")
  }
  const kept = { kind: link.kind }
  for (const [key, value] of Object.entries(link)) if (typeof value === 'string' && value) kept[key] = value
  return kept
}

const text = (value, what, max) => {
  const s = String(value ?? '')
  if (s.length > max) throw new Error(`${what} is longer than ${max} characters`)
  return s
}

/** What a card says about its progress, besides its column: any card may carry them, an agent's lane keeps them current. */
const PROGRESS_FIELDS = { waitingOn: 500, next: 500, due: 100, dest: 40 }

/**
 * What a lane waits on, as a kind the fleet view colours and counts (the words stay in waitingOn): the owner deciding,
 * a developer's review, CI, someone merging, another lane, an account's quota, or anything else.
 */
export const WAIT_KINDS = ['owner', 'review', 'ci', 'merge', 'lane', 'quota', 'other']

/**
 * Writes the progress fields `op` names into `changes`, reading what the card says now from `card` (the same object
 * for a new card). Only the fields that change are put in `changes`: a chat's card is live, and an unchanged field
 * written again is still sent.
 */
function setProgress(changes, op, card = changes) {
  const now = (field) => (field in changes ? changes[field] : card[field])
  if (op.progress !== undefined) {
    const n = op.progress === null || op.progress === '' ? null : Number(op.progress)
    if (n !== null && !(Number.isInteger(n) && n >= 0 && n <= 100)) throw new Error('progress is a whole number from 0 to 100, or null')
    changes.progress = n
  }
  const waitedOn = Boolean(card.waitingOn || card.waitKind)
  const kindBefore = card.waitKind ?? ''
  for (const [field, max] of Object.entries(PROGRESS_FIELDS)) if (op[field] !== undefined) changes[field] = text(op[field], field, max).trim()
  if (op.waitKind !== undefined) {
    const kind = String(op.waitKind ?? '').trim()
    if (kind && !WAIT_KINDS.includes(kind)) throw new Error(`waitKind is one of: ${WAIT_KINDS.join(', ')}, or empty`)
    changes.waitKind = kind
  } else if (op.waitingOn === '') {
    // "Nothing any more" in words is nothing in kind too.
    changes.waitKind = ''
  }
  if (op.waitWho !== undefined) changes.waitWho = text(op.waitWho, 'waitWho', 100).trim()
  if (op.head !== undefined) {
    const head = String(op.head ?? '').trim().toLowerCase()
    if (head && !/^[0-9a-f]{7,40}$/.test(head)) throw new Error('head is a commit sha: 7 to 40 hex digits, or empty')
    changes.head = head
  }
  const waits = Boolean(now('waitingOn') || now('waitKind'))
  if (!waits && waitedOn) {
    changes.waitWho = ''
    changes.waitSince = null
  } else if (waits && (!waitedOn || (now('waitKind') ?? '') !== kindBefore)) changes.waitSince = op.at
}

/** Every change to a card says when and by whom: the page shows it, and a lane that stops saying anything goes stale. */
function touch(card, by, at) {
  card.updatedAt = at
  card.updatedBy = by
}

function needCard(board, id) {
  const card = board.cards[id]
  if (!card) throw new Error(`there is no card ${id} on the board`)
  return card
}

function needColumn(board, id) {
  const column = board.columns[id]
  if (!column) throw new Error(`there is no column ${id} on the board`)
  return column
}

/** The key for a place in a list: just after `after`, or just before `before`, or at the end. */
function placeIn(list, { before = null, after = null }, self) {
  const others = list.filter((x) => x.id !== self)
  let i = others.length
  if (after !== null) {
    const at = others.findIndex((x) => x.id === after)
    if (at < 0) throw new Error(`${after} is not there`)
    i = at + 1
  } else if (before !== null) {
    const at = others.findIndex((x) => x.id === before)
    if (at < 0) throw new Error(`${before} is not there`)
    i = at
  }
  const lo = i > 0 ? others[i - 1].order : null
  const hi = i < others.length ? others[i].order : null
  // Two cards with the same key (a tie): step past it so the new key still lands between distinct bounds.
  return lo !== null && hi !== null && lo >= hi ? keyBetween(lo, null) : keyBetween(lo, hi)
}

/**
 * Apply one operation to `board` in place. `by` is who did it: 'person', or an agent's user:<uuid> stamped by gugu.
 * `id` makes new ids (passed in so tests are repeatable). Returns what the caller needs back (a new card's id …).
 * Every failure throws, with what to do in the message: nothing is half-applied, the caller writes only on success.
 */
export function applyOp(board, op, { by, now, id }) {
  const at = now
  switch (op?.type) {
    case 'card.create': {
      const column = op.column ? needColumn(board, op.column).id : columnsInOrder(board)[0].id
      const title = text(op.title, 'a title', 500).trim()
      if (!title) throw new Error('a card needs a title')
      const card = { id: id(), title, note: text(op.note, 'a note', 100_000), column, order: '', by, links: {}, createdAt: at, updatedAt: at, updatedBy: by }
      setProgress(card, { ...op, at })
      card.order = placeIn(cardsIn(board, column), {}, card.id)
      for (const link of op.links ?? []) card.links[id()] = { ...checkLink(link), by, at }
      board.cards[card.id] = card
      return { card: card.id }
    }
    case 'card.update': {
      const card = needCard(board, op.card)
      // Every field is checked before any is written: a card in a chat's file is live, a half-written change is sent.
      const changes = {}
      if (op.title !== undefined) {
        changes.title = text(op.title, 'a title', 500).trim()
        if (!changes.title) throw new Error('a card needs a title')
      }
      if (op.note !== undefined) changes.note = text(op.note, 'a note', 100_000)
      setProgress(changes, { ...op, at }, card)
      Object.assign(card, changes)
      touch(card, by, at)
      return { card: card.id }
    }
    case 'card.move': {
      const card = needCard(board, op.card)
      const column = needColumn(board, op.column ?? card.column).id
      card.order = placeIn(cardsIn(board, column), op, card.id)
      card.column = column
      touch(card, by, at)
      return { card: card.id, column }
    }
    case 'card.delete': {
      needCard(board, op.card)
      delete board.cards[op.card]
      for (const [cid, c] of Object.entries(board.comments)) if (c.card === op.card) delete board.comments[cid]
      return { card: op.card }
    }
    case 'link.add': {
      const card = needCard(board, op.card)
      const link = checkLink(op.link)
      // The same task or file twice on one card is one link.
      const same = Object.entries(card.links).find(([, l]) => l.kind === link.kind && LINK_KINDS[link.kind].every((f) => l[f] === link[f]))
      if (same) return { card: card.id, link: same[0], existed: true }
      const lid = id()
      card.links[lid] = { ...link, by, at }
      touch(card, by, at)
      return { card: card.id, link: lid }
    }
    case 'link.remove': {
      const card = needCard(board, op.card)
      if (!card.links[op.link]) throw new Error(`card ${card.id} has no link ${op.link}`)
      delete card.links[op.link]
      touch(card, by, at)
      return { card: card.id }
    }
    case 'comment.add': {
      const card = needCard(board, op.card)
      const body = text(op.text, 'a comment', 20_000).trim()
      if (!body) throw new Error('a comment needs text')
      const cid = id()
      board.comments[cid] = { id: cid, card: card.id, by, text: body, at }
      touch(card, by, at)
      return { comment: cid }
    }
    case 'column.create': {
      const title = text(op.title, 'a column title', 100).trim()
      if (!title) throw new Error('a column needs a title')
      const cid = id()
      board.columns[cid] = { id: cid, role: null, title, order: placeIn(columnsInOrder(board), {}, cid) }
      return { column: cid }
    }
    case 'column.update': {
      const column = needColumn(board, op.column)
      const title = text(op.title, 'a column title', 100).trim()
      // An empty title gives a starting column its default name back; a column of your own needs one.
      if (!title && !column.role) throw new Error('a column needs a title')
      column.title = title || null
      return { column: column.id }
    }
    case 'column.move': {
      const column = needColumn(board, op.column)
      column.order = placeIn(columnsInOrder(board), op, column.id)
      return { column: column.id }
    }
    case 'column.delete': {
      const column = needColumn(board, op.column)
      if (cardsIn(board, column.id).length) throw new Error('move or delete the cards in this column first')
      if (columnsInOrder(board).length === 1) throw new Error('a board keeps at least one column')
      delete board.columns[column.id]
      return { column: column.id }
    }
    case 'pr.sync': {
      // What a lane's pull requests say now, read in one sweep by whoever has GitHub (the board itself never asks it):
      // written onto every card's pr link with the same url.
      if (!Array.isArray(op.prs)) throw new Error('prs is a list of pull requests')
      let matched = 0
      for (const pr of op.prs) {
        const url = prKey(pr?.url)
        if (!url) throw new Error('each pull request needs its github.com …/pull/<n> url')
        const facts = checkPr(pr)
        for (const card of Object.values(board.cards)) {
          for (const link of Object.values(card.links)) {
            if (link.kind !== 'pr' || prKey(link.url) !== url) continue
            Object.assign(link, facts, { syncedAt: at })
            matched += 1
          }
        }
      }
      return { matched }
    }
    case 'decision.create': {
      const question = text(op.question, 'a question', 1000).trim()
      if (!question) throw new Error('a decision needs its question')
      const answer = text(op.answer, 'an answer', 2000).trim()
      if (op.card !== undefined && op.card !== null) needCard(board, op.card)
      const options = op.options === undefined ? [] : op.options
      if (!Array.isArray(options) || options.length > 6) throw new Error('options are a list of at most 6 short answers')
      const scope = checkScope(op.scope ?? (op.card ? { kind: 'lane', ref: op.card } : { kind: 'fleet' }))
      // Everything is checked before anything is written: a chat's board is live, a half-made decision would be sent.
      const replaced = op.supersedes ? openDecision(board, op.supersedes) : null
      const message = op.message ? messageId(op.message) : null
      const did = id()
      board.decisions ??= {}
      const n = Math.max(0, ...Object.values(board.decisions).map((d) => d.n ?? 0)) + 1
      board.decisions[did] = {
        id: did, n, question, options: options.map((o) => text(o, 'an option', 120).trim()).filter(Boolean), scope,
        ...(op.card ? { card: op.card } : {}), ...(message ? { message } : {}),
        status: answer ? 'decided' : 'pending', answer, by, at, ...(answer ? { decidedBy: by, decidedAt: at } : {}),
      }
      if (replaced) Object.assign(replaced, { status: 'superseded', closedBy: by, closedAt: at, supersededBy: did })
      return { decision: did, n, label: decisionLabel(board, board.decisions[did]) }
    }
    case 'decision.decide': {
      // Only the person answers, on the board page: no agent tool makes this operation. Whoever asked never answers.
      const decision = needDecision(board, op.decision)
      if (decision.status !== 'pending') throw new Error(`${decisionLabel(board, decision)} is ${decision.status} already`)
      if (decision.by === by) throw new Error('a question is answered by the owner, not by whoever asked it')
      const answer = text(op.answer, 'an answer', 2000).trim()
      if (!answer) throw new Error('a decision needs its answer')
      const message = op.message ? messageId(op.message) : null
      Object.assign(decision, { status: 'decided', answer, decidedBy: by, decidedAt: at, ...(message ? { message } : {}) })
      return { decision: decision.id, n: decision.n, label: decisionLabel(board, decision), card: decision.card ?? null }
    }
    case 'decision.close': {
      if (op.status !== 'withdrawn' && op.status !== 'superseded') throw new Error('a decision is closed as withdrawn or superseded')
      const decision = openDecision(board, op.decision)
      Object.assign(decision, { status: op.status, closedBy: by, closedAt: at, ...(op.supersededBy ? { supersededBy: op.supersededBy } : {}) })
      return { decision: decision.id }
    }
    case 'handoff.offer': {
      const card = needCard(board, op.card)
      const to = op.to ?? {}
      if (typeof to.session !== 'string' || !to.session || typeof to.agent !== 'string' || !to.agent.startsWith('user:')) {
        throw new Error('a handoff goes to a task: its session and its agent (user:<uuid>)')
      }
      if (Object.values(card.links).some((l) => l.kind === 'task' && l.session === to.session)) throw new Error('that task is already on this card')
      card.handoff = { to: { session: to.session, agent: to.agent, ...(to.title ? { title: text(to.title, 'a title', 200) } : {}) }, by, at, acceptedAt: null }
      touch(card, by, at)
      return { card: card.id }
    }
    case 'handoff.accept': {
      const card = needCard(board, op.card)
      if (!card.handoff) throw new Error(`card ${card.id} is not being handed over`)
      if (card.handoff.acceptedAt) throw new Error(`card ${card.id} was taken over already`)
      if (by !== card.handoff.to.agent) throw new Error('only the task it is handed to accepts a handoff')
      card.handoff.acceptedAt = at
      const { session, agent, title } = card.handoff.to
      card.links[id()] = { kind: 'task', session, agent, ...(title ? { title } : {}), by, at }
      touch(card, by, at)
      return { card: card.id }
    }
    case 'handoff.cancel': {
      const card = needCard(board, op.card)
      if (!card.handoff) throw new Error(`card ${card.id} is not being handed over`)
      if (card.handoff.acceptedAt) throw new Error('an accepted handoff stays: it is what lets the old task be archived')
      card.handoff = null
      touch(card, by, at)
      return { card: card.id }
    }
    case 'fleet.supervisor': {
      // The machines' supervisors, as the fleet names them: they head their machine's column and are never archived.
      if (typeof op.session !== 'string' || !op.session) throw new Error('a supervisor is named by its session id')
      board.fleet ??= {}
      board.fleet.supervisors ??= {}
      if (op.on === false) delete board.fleet.supervisors[op.session]
      else board.fleet.supervisors[op.session] = { by, at, ...(op.title ? { title: text(op.title, 'a title', 200) } : {}) }
      return { session: op.session }
    }
    default:
      throw new Error(`unknown operation ${JSON.stringify(op?.type)}`)
  }
}

/** A pull request's address without what varies (a trailing slash, #fragment, /files): how a sync finds its links. */
export function prKey(url) {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i.exec(String(url ?? ''))
  return m ? `${m[1].toLowerCase()}/${m[2].toLowerCase()}#${m[3]}` : null
}

export const prNumber = (url) => prKey(url)?.split('#')[1] ?? null

const CI = ['pending', 'green', 'red']
const REVIEW = ['required', 'approved', 'changes']

/** The facts a sync may write on a pr link; everything else it was given is left out. */
function checkPr(pr) {
  const out = {}
  if (pr.ci !== undefined) {
    if (!CI.includes(pr.ci)) throw new Error(`a pull request's ci is one of: ${CI.join(', ')}`)
    out.ci = pr.ci
  }
  if (pr.review !== undefined) {
    if (pr.review !== null && !REVIEW.includes(pr.review)) throw new Error(`a pull request's review is one of: ${REVIEW.join(', ')}, or null`)
    out.review = pr.review
  }
  if (pr.merged !== undefined) out.merged = Boolean(pr.merged)
  if (pr.closed !== undefined) out.closed = Boolean(pr.closed)
  if (pr.devReview !== undefined) out.devReview = Boolean(pr.devReview)
  if (pr.head !== undefined) {
    const head = String(pr.head).toLowerCase()
    if (!/^[0-9a-f]{7,40}$/.test(head)) throw new Error("a pull request's head is a commit sha")
    out.head = head
  }
  if (pr.mergedBy !== undefined) out.mergedBy = text(pr.mergedBy, 'mergedBy', 100)
  if (pr.title !== undefined) out.title = text(pr.title, 'a title', 300)
  return out
}

const SCOPES = ['fleet', 'machine', 'lane', 'release']

/** Whom a decision binds: the whole fleet, one machine (its label), one lane (its card) or one release ("18:00 Beta"). */
function checkScope(scope) {
  if (!SCOPES.includes(scope?.kind)) throw new Error(`a decision's scope is one of: ${SCOPES.join(', ')}`)
  if (scope.kind === 'fleet') return { kind: 'fleet' }
  const ref = text(scope.ref, "a scope's ref", 200).trim()
  if (!ref) throw new Error(`a ${scope.kind} scope names its ${scope.kind === 'lane' ? 'card' : scope.kind}`)
  return { kind: scope.kind, ref }
}

const messageId = (message) => {
  const mid = String(message).replace(/^msg:/, '')
  if (!/^[0-9a-f-]{36}$/i.test(mid)) throw new Error('message is a chat message id: msg:<uuid> or <uuid>')
  return mid
}

/**
 * A decision's name: D-<n>. Two made at once on a live board can take the same n (each writer counts what it has);
 * those two are told apart by their ids, D-<n>-<id>, rather than renumbered under anyone who already quoted them.
 */
export function decisionLabel(board, d) {
  const twins = Object.values(board.decisions ?? {}).filter((x) => x.n === d.n).length
  return twins > 1 ? `D-${d.n}-${d.id.slice(0, 4)}` : `D-${d.n}`
}

function needDecision(board, did) {
  const all = Object.values(board.decisions ?? {})
  if (board.decisions?.[did]) return board.decisions[did]
  const named = all.filter((d) => decisionLabel(board, d) === String(did))
  if (named.length === 1) return named[0]
  const plain = all.filter((d) => `D-${d.n}` === String(did))
  if (plain.length > 1) throw new Error(`${did} is ambiguous: ${plain.map((d) => decisionLabel(board, d)).join(', ')}`)
  if (!plain.length) throw new Error(`there is no decision ${did}`)
  return plain[0]
}

/** A decision still in force or pending, to close: one closed already stays as it was. */
function openDecision(board, did) {
  const decision = needDecision(board, did)
  if (decision.status === 'withdrawn' || decision.status === 'superseded') throw new Error(`${decisionLabel(board, decision)} is ${decision.status} already`)
  return decision
}

/** The decisions in their order (D-1, D-2 …). */
export const decisionsInOrder = (board) => Object.values(board.decisions ?? {}).sort((a, b) => a.n - b.n || (a.id < b.id ? -1 : 1))

/** The question a card waits on the owner for, if it asks one. */
export const pendingAsk = (board, cardId) => decisionsInOrder(board).find((d) => d.card === cardId && d.status === 'pending') ?? null

/**
 * How a task's status reads on a card, from listAgents' status / detail (packages/core/src/shared/agentStatus.ts):
 * a key the page words, and whether it waits on the person (those count in the tab's badge).
 */
export function taskState(agent) {
  if (!agent) return { key: 'gone', waiting: false }
  if (agent.failure || agent.status === 'error') return { key: 'error', waiting: false }
  switch (agent.status) {
    case 'working':
      return { key: agent.detail === 'parked' ? 'parked' : 'running', waiting: false }
    case 'needs_user':
      return { key: agent.detail === 'approval' ? 'approval' : 'answer', waiting: true }
    case 'idle':
      return { key: agent.detail === 'done' ? 'done' : 'stopped', waiting: false }
    default:
      return { key: 'none', waiting: false }
  }
}

/** A card in progress with a task on it and no word for this long has gone quiet: the board greys it. */
export const STALE_MS = 45 * 60 * 1000

/**
 * What a card asks of people, read from the card and its tasks: `waiting` — its waitingOn says who or what it waits
 * on; `asks` — one of its tasks waits on the person (approval, answer); `stale` — in progress, with a task, and not
 * changed for STALE_MS. `stateOf(session)` is that task's taskState, or null when the statuses are not known here.
 */
export function cardFlags(board, card, stateOf, now) {
  const tasks = Object.values(card.links).filter((l) => l.kind === 'task')
  const waiting = Boolean(card.waitingOn || card.waitKind)
  const asks = tasks.some((l) => stateOf(l.session)?.waiting) || pendingAsk(board, card.id) !== null
  const stale = board.columns[card.column]?.role === 'doing' && tasks.length > 0 && now - Date.parse(card.updatedAt) > STALE_MS
  return { waiting, asks, stale, attention: waiting || asks }
}
