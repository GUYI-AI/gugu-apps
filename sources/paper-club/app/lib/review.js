// The cards tab: study cards on a paper, each tied to the passage it comes from, and each person's own review of them —
// what they answered, when, and when the card is due again — kept in the notes file under their id
// (`reviews[<user:uuid>][<card id>]`), so it follows them to every device and the group sees how far each one is.
//
// Scheduling is SM-2 (SuperMemo 2): a grade of 1 (again), 3 (hard), 4 (good) or 5 (easy); an "again" starts the card
// over and counts as a lapse — the cards someone keeps missing are their 错题. A card is mastered once its interval has
// reached MASTERED_DAYS; a concept's mastery is the mean over its cards of min(1, interval / MASTERED_DAYS).
import { fmt } from './strings.js'

export const GRADES = { again: 1, hard: 3, good: 4, easy: 5 }
export const MASTERED_DAYS = 21
const DAY = 24 * 60 * 60 * 1000
const LOG_KEEP = 30

/** A card's state after one answer (pure: `state` may be undefined for a new card). */
export function schedule(state, grade, now = Date.now()) {
  const s = { interval: 0, ease: 2.5, reps: 0, lapses: 0, log: [], ...(state ?? {}) }
  const log = [...(s.log ?? []), [new Date(now).toISOString(), grade]].slice(-LOG_KEEP)
  if (grade < 3) {
    return { interval: 0, ease: Math.max(1.3, s.ease - 0.2), reps: 0, lapses: s.lapses + 1, due: new Date(now + 10 * 60 * 1000).toISOString(), log }
  }
  const reps = s.reps + 1
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(Math.max(1, s.interval) * s.ease)
  const ease = Math.max(1.3, s.ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  return { interval, ease: Math.round(ease * 100) / 100, reps, lapses: s.lapses, due: new Date(now + interval * DAY).toISOString(), log }
}

export const isDue = (state, now = Date.now()) => !state?.due || Date.parse(state.due) <= now

/** Per concept: its cards and this person's mastery of it (0..1). Cards without a concept are under ''. */
export function mastery(cards, mine) {
  const concepts = new Map()
  for (const [id, card] of Object.entries(cards ?? {})) {
    const key = card.concept ?? ''
    const c = concepts.get(key) ?? { concept: key, cards: [], score: 0 }
    c.cards.push(id)
    c.score += Math.min(1, (mine?.[id]?.interval ?? 0) / MASTERED_DAYS)
    concepts.set(key, c)
  }
  return [...concepts.values()].map((c) => ({ ...c, mastery: c.cards.length ? c.score / c.cards.length : 0 }))
}

/** The cards tab of the reader. `notes()` is the paper's live notes file (or null), `strings()` the page's words. */
export function createReview({ strings, notes, onOpenHighlight, onAsk, say }) {
  let session = null // { queue: [card ids], flipped }

  const me = () => notes()?.presence.self.userId
  const mine = () => notes()?.data.reviews?.[me()] ?? {}

  function grade(id, value) {
    const f = notes()
    const user = me()
    if (!f || !user) return
    f.transact(() => {
      f.data.reviews ??= {}
      f.data.reviews[user] ??= {}
      f.data.reviews[user][id] = schedule(f.data.reviews[user][id], value)
    })
    session.queue.shift()
    if (value < 3) session.queue.push(id) // missed: once more before this round ends
    session.flipped = false
  }

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag)
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') node.className = value
      else if (key.startsWith('on')) node[key] = value
      else node.setAttribute(key, value)
    }
    node.append(...children.filter((c) => c != null && c !== false))
    return node
  }

  function draw(body) {
    const t = strings()
    const f = notes()
    const cards = f?.data.cards ?? {}
    const ids = Object.keys(cards)
    if (!ids.length) {
      const empty = el('gugu-empty', { icon: 'layers' }, el('strong', {}, t.noCards))
      return body.replaceChildren(empty)
    }
    if (session?.queue.length) return body.replaceChildren(drawCard(cards, session.queue[0]))
    if (session) {
      session = null
      say(t.reviewDone)
    }
    const state = mine()
    const due = ids.filter((id) => isDue(state[id]))
    const missed = ids.filter((id) => (state[id]?.lapses ?? 0) > 0).sort((a, b) => state[b].lapses - state[a].lapses)
    const start = el('button', { class: 'primary', type: 'button', onclick: () => { session = { queue: [...due], flipped: false }; draw(body) } }, `${t.review} · ${fmt(t.dueCount, { n: due.length })}`)
    if (!due.length) start.disabled = true
    const concepts = mastery(cards, state).sort((a, b) => a.mastery - b.mastery)
    const table = el('ul', { class: 'list mastery' },
      ...concepts.map((c) =>
        el('li', {},
          el('div', {}, el('strong', {}, c.concept || t.cards), el('span', {}, `${c.cards.length} · ${Math.round(c.mastery * 100)}%`)),
          el('progress', { max: '100', value: String(Math.round(c.mastery * 100)) }),
        ),
      ),
    )
    const parts = [el('div', { class: 'row' }, start), el('h5', {}, t.mastery), table]
    if (missed.length) {
      parts.push(el('h5', {}, t.missed))
      parts.push(el('ul', { class: 'list' }, ...missed.map((id) => cardRow(cards, id, state[id]))))
    }
    parts.push(el('h5', {}, fmt(t.allCards, { n: ids.length })))
    parts.push(el('ul', { class: 'list' }, ...ids.map((id) => cardRow(cards, id, state[id]))))
    body.replaceChildren(...parts)
  }

  function cardRow(cards, id, state) {
    const t = strings()
    const card = cards[id]
    const sub = state ? fmt(t.cardState, { n: state.reps, lapses: state.lapses ?? 0 }) : t.cardNew
    return el('li', {},
      el('div', {}, el('strong', {}, card.front), el('span', {}, sub)),
      card.on ? el('button', { type: 'button', onclick: () => onOpenHighlight(card.on) }, t.source) : null,
      card.on && (state?.lapses ?? 0) > 0 ? el('button', { type: 'button', onclick: () => onAsk(card.on, card) }, t.ask) : null,
    )
  }

  function drawCard(cards, id) {
    const t = strings()
    const card = cards[id]
    if (!card) {
      session.queue.shift()
      return el('p', {}, '')
    }
    const left = el('small', { class: 'muted' }, fmt(t.left, { n: session.queue.length }))
    const front = el('p', { class: 'front' }, el('strong', {}, card.front))
    const parts = [left, front]
    if (session.flipped) {
      parts.push(el('hr'), el('p', { class: 'back' }, card.back))
      if (card.on) parts.push(el('button', { type: 'button', onclick: () => onOpenHighlight(card.on) }, t.source))
      parts.push(
        el('div', { class: 'row grades' },
          ...Object.entries(GRADES).map(([key, value]) =>
            el('button', { type: 'button', class: key === 'good' ? 'primary' : key === 'again' ? 'danger' : '', onclick: () => { grade(id, value); redraw() } }, t[key]),
          ),
        ),
      )
    } else {
      parts.push(el('button', { type: 'button', class: 'primary', onclick: () => { session.flipped = true; redraw() } }, t.flip))
    }
    parts.push(el('button', { type: 'button', onclick: () => { session = null; redraw() } }, t.stop))
    return el('article', { class: 'flash card' }, ...parts)
  }

  let target = null
  function redraw() {
    if (target) draw(target)
  }

  return {
    draw(body) {
      target = body
      draw(body)
    },
  }
}
