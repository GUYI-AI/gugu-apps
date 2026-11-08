// The world's state and the verbs every rule uses: who is who, where things are, what is said where, the clock.
//
// The chat's world file holds everything that changes: each player and each townsperson as a character (stats, room,
// skills), each thing and where it is (a room, someone's hands, a corpse, the wagon), and the last lines said and done
// (`log`). Rooms, people and things as ES2 made them are in es2.js. A command runs on a copy of the file (`x.w`); what
// differs afterwards is written back (game.js diff), so the rules below just change `x.w` in place.
import { ROOMS, NPCS, ITEMS } from './es2.js'
import { gameTime, cn } from './text.js'

export const START = 'inn_hall'
/** ES2's heart beat: an NPC may say something or wander once per beat. */
export const BEAT = 2000
/** How often stats regenerate, food runs down (ES2: every 5–14 beats). */
export const TICK = 20_000
/** How often the town resets: the dead come back, shops restock, lost things lie where they were (ES2 reset). */
export const RESET = 30 * 60_000
export const LOG_MAX = 60

/** Hooks of particular people and rooms (story.js fills them): what they do beyond the general rules. */
export const HOOKS = { npc: {}, room: {}, chat: {}, item: {} }

// ── ids ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export const isNpc = (id) => typeof id === 'string' && id.startsWith('n:')
export const isThing = (id) => typeof id === 'string' && id.startsWith('t:')
/** n:child3.2 → child3: the person in es2.js an NPC is one of. */
export const baseOf = (id) => id.slice(2).split('.')[0]
export const npcData = (id) => NPCS[baseOf(id)]
/**
 * A person with the page open now: the page marks `here` while open (main.js). Only they can be killed by another
 * player or be drawn into someone's fight; agents and people away never are.
 */
export const ONLINE = 150_000
export const online = (w, id, now) => { const p = w.players?.[id]; return Boolean(p) && !p.agent && now - (p.here ?? 0) < ONLINE }
export const ch = (w, id) => (isNpc(id) ? w.npcs?.[id] : w.players?.[id])
export const alive = (w, id) => { const c = ch(w, id); return Boolean(c) && !c.dead }
export const awake = (w, id, now) => { const c = ch(w, id); return Boolean(c) && !c.dead && !c.ghost && !(c.out > now) }

export function newId(x, prefix) {
  x.seq = (x.seq ?? 0) + 1
  return `${prefix}${x.now.toString(36)}${Math.floor(x.rand() * 1296).toString(36).padStart(2, '0')}${x.seq.toString(36)}`
}

// ── names ────────────────────────────────────────────────────────────────────────────────────────────────────────

export function nameOf(w, id) {
  if (isNpc(id)) return npcData(id)?.name ?? '某人'
  if (isThing(id)) return thingName(w, id)
  const p = w.players?.[id]
  if (!p) return '一位侠客'
  return p.ghost ? `${p.name}的鬼魂` : p.name
}
/** How `viewer` reads a name: themselves as 你. */
export const who = (w, id, viewer) => (id === viewer ? '你' : nameOf(w, id))

const count = (n) => (n === 2 ? '两' : cn(n))

export const itemOf = (w, tid) => ITEMS[w.things[tid]?.id]
export function thingName(w, tid) {
  const t = w.things[tid]
  if (!t) return '某样东西'
  return t.name ?? ITEMS[t.id]?.name ?? t.id
}
/** 「两个牛肉包子」「一把木剑」: how a thing is counted where it lies. */
export function thingShort(w, tid) {
  const t = w.things[tid]
  const it = ITEMS[t.id] ?? {}
  if (it.baseUnit) return `${count(t.n ?? 1)}${it.baseUnit}${thingName(w, tid)}`
  return `一${it.unit ?? t.unit ?? '个'}${thingName(w, tid)}`
}
/** What lies somewhere, alike things counted together (「三个大木箱」): [a thing of each kind, how it reads]. */
export function thingGroups(w, at) {
  const groups = new Map()
  for (const tid of thingsAt(w, at)) {
    const t = w.things[tid]
    const key = `${t.id}|${thingName(w, tid)}|${t.eq ?? ''}`
    if (groups.has(key)) groups.get(key).push(tid)
    else groups.set(key, [tid])
  }
  return [...groups.values()].map((tids) => {
    if (tids.length === 1) return [tids[0], thingShort(w, tids[0])]
    const t = w.things[tids[0]]
    const it = ITEMS[t.id] ?? {}
    // Stacks of one kind (several heaps of coins) read as one heap.
    if (it.baseUnit) return [tids[0], `${count(tids.reduce((n, tid) => n + (w.things[tid].n ?? 1), 0))}${it.baseUnit}${thingName(w, tids[0])}`]
    return [tids[0], `${count(tids.length)}${it.unit ?? t.unit ?? '个'}${thingName(w, tids[0])}`]
  })
}

// ── characters ───────────────────────────────────────────────────────────────────────────────────────────────────

const ATTRS = ['str', 'cor', 'int', 'spi', 'cps', 'dex', 'con', 'wis']

/** Bonuses from what someone wears and wields (apply_armor, apply_weapon), and a human's natural armor 3. */
export function applied(w, id, key) {
  let v = key === 'armor' ? 3 : 0
  for (const tid of thingsAt(w, id)) {
    const t = w.things[tid]
    if (t.eq) v += ITEMS[t.id]?.apply?.[key] ?? 0
  }
  return v
}
export function attr(w, id, k) {
  const base = isNpc(id) ? npcData(id)?.attrs?.[k] ?? 15 : w.players[id]?.attrs?.[k] ?? 15
  return base + applied(w, id, k)
}
export function skillLv(w, id, s, raw = false) {
  const c = ch(w, id)
  const own = (isNpc(id) ? npcData(id)?.skills?.[s] : c?.skills?.[s]) ?? 0
  if (raw) return own
  const mapped = (isNpc(id) ? npcData(id)?.map : c?.map)?.[s]
  const v = own + applied(w, id, s)
  return mapped ? Math.floor((v + skillLv(w, id, mapped)) / 2) : v
}
export const levelOf = (w, id) => (isNpc(id) ? npcData(id)?.level ?? 1 : w.players[id]?.level ?? 1)
export const clsOf = (w, id) => (isNpc(id) ? npcData(id)?.cls ?? 'commoner' : w.players[id]?.cls ?? 'commoner')

/** A new character's stats: ES2's human (daemon/race/human.c): 精气神 30, 形体 根骨×5, food and water by attributes. */
export function newStats(attrs, more = {}) {
  // Named keys, never arrays: two pages writing one character at once merge leaf by leaf.
  const stat = (k) => { const m = more.max?.[k] ?? 30 + (more.advance?.[k] ?? 0); return { cur: m, eff: m, max: m } }
  const full = (m) => ({ cur: m, max: m })
  return {
    gin: stat('gin'), kee: stat('kee'), sen: stat('sen'),
    hp: full(attrs.con * 5),
    food: full(attrs.con * 10 + attrs.str * 5),
    water: full(attrs.cps * 10 + attrs.dex * 5),
  }
}

/** A player as they enter the world: attributes rolled 13–18 each (human.c), level 1, a commoner, empty hands. */
export function newPlayer(x, name, agent) {
  const attrs = Object.fromEntries(ATTRS.map((k) => [k, 13 + Math.floor(x.rand() * 6)]))
  return {
    name: name || '一位侠客', room: START, joined: x.now, at: x.now, rt: x.now, ...(agent ? { agent: true } : {}),
    attrs, level: 1, cls: 'commoner', skills: {}, learned: {}, score: {}, temp: {}, ...newStats(attrs),
  }
}

/** An NPC (back) in the world with what it carries; in a town reset its things take the reset's ids (resetId). */
export function spawnNpc(x, id, room) {
  const d = npcData(id)
  const attrs = Object.fromEntries(ATTRS.map((k) => [k, d.attrs?.[k] ?? 15]))
  const st = newStats(attrs, d)
  x.w.npcs[id] = { room, home: room, rt: x.now, ...st }
  for (const [i, [key, how]] of (d.carry ?? []).entries()) {
    if (!ITEMS[key]) continue
    const tid = makeThing(x, key, id, 1, {}, resetId(x, id, i))
    if (how === 'wear' || how === 'wield') x.w.things[tid].eq = how
  }
  if (d.coin) makeThing(x, 'stock/coin', id, d.coin, {}, resetId(x, id, 'coin'))
  return id
}

/**
 * The id of a thing a town reset makes: the same on every page that runs the same reset (`x.reset` is its number), so
 * two pages crossing the half hour together write one set of things, not two. Outside a reset: a fresh id.
 */
export const resetId = (x, ...where) => (x.reset ? ['t:r' + x.reset.toString(36), ...where].join('.') : undefined)

export const roomOf = (w, id) => (isThing(id) ? w.things[id]?.at : ch(w, id)?.room)
export const peopleIn = (w, room) => [
  ...Object.entries(w.npcs ?? {}).filter(([, c]) => c.room === room && !c.dead).map(([id]) => id),
  ...Object.entries(w.players ?? {}).filter(([, c]) => c.room === room).map(([id]) => id),
]
export const npcsIn = (w, room) => Object.entries(w.npcs ?? {}).filter(([, c]) => c.room === room && !c.dead).map(([id]) => id)
export const playersIn = (w, room) => Object.entries(w.players ?? {}).filter(([, c]) => c.room === room).map(([id]) => id)

// ── stats (feature/statistic.c) ─────────────────────────────────────────────────────────────────────────────────

/** Spend current (consume_stat); below 0 it stays at 0 and the stat is exhausted. */
export function consume(c, k, n) { c[k].cur -= n; if (c[k].cur < 0) { c[k].cur = 0; return true } return false }
/** Wound: lower the effective ceiling (damage_stat); below 0 the stat is destroyed. */
export function wound(c, k, n) { c[k].eff -= n; if (c[k].cur > c[k].eff) c[k].cur = Math.max(0, c[k].eff); if (c[k].eff < 0) { c[k].eff = 0; return true } return false }
/** Restore current up to effective (supplement_stat). */
export function supplement(c, k, n) { c[k].cur = Math.min(c[k].eff, c[k].cur + n) }
/** Heal the effective ceiling up to the maximum (heal_stat). */
export function heal(c, k, n) { c[k].eff = Math.min(c[k].max, c[k].eff + n) }

/**
 * Regeneration since the character last had it (health_regenerator, every TICK): current back towards effective by
 * 机敏 / 根骨 / 灵性, then effective back towards the maximum while fed. Players' food and water run down 1 a tick;
 * at none, 气 drains — but time away only wastes 30 ticks, and never knocks anyone out.
 */
export function regen(x, id) {
  const c = ch(x.w, id)
  if (!c || c.dead) return
  const ticks = Math.floor((x.now - (c.rt ?? x.now)) / TICK)
  if (ticks <= 0) return
  c.rt = (c.rt ?? x.now) + ticks * TICK
  const player = !isNpc(id)
  const k2a = { gin: 'dex', kee: 'con', sen: 'spi' }
  for (let i = 0; i < Math.min(ticks, 200); i++) {
    if (player && (c.water.cur < 1 || c.ghost)) break
    for (const k of ['gin', 'kee', 'sen']) {
      const a = attr(x.w, id, k2a[k])
      if (c[k].cur < c[k].eff) supplement(c, k, a)
      else if ((!player || c.food.cur >= 1) && c[k].eff < c[k].max) heal(c, k, Math.floor(a / 6) + 1)
    }
    if (c.hp.cur < c.hp.max) c.hp.cur += 1
  }
  if (!player || c.ghost) return
  for (let i = 0; i < Math.min(ticks, 30); i++) {
    for (const k of ['food', 'water']) {
      if (c[k].cur > 0) c[k].cur -= 1
      else c.kee.cur = Math.max(1, c.kee.cur - 1)
    }
  }
  if (c.food.cur === 0) tell(x, id, '你已经饿得两眼昏花，四肢无力了，最好找点东西来吃。')
  if (c.water.cur === 0) tell(x, id, '你觉得口干舌燥，开始出现脱水的现象了，最好找点水喝。')
}

// ── things ───────────────────────────────────────────────────────────────────────────────────────────────────────

export const thingsAt = (w, at) => Object.entries(w.things ?? {}).filter(([, t]) => t.at === at).map(([id]) => id)
export const isMoney = (key) => ['stock/coin', 'stock/silver', 'stock/gold'].includes(key)
const combined = (key) => Boolean(ITEMS[key]?.baseUnit)

/**
 * A new thing of `key` at `at` (`n` of a stack). Stacks never merge into one already there: someone else may be
 * counting that one at the same moment, and one of the two counts would be lost. Lists count alike things together.
 */
export function makeThing(x, key, at, n = 1, extra = {}, tid = newId(x, 't:')) {
  x.w.things[tid] = { id: key, at, ...(combined(key) ? { n } : {}), ...extra }
  return tid
}

/**
 * The heaps of `key` (coins, say) at `at` gathered into one, for whoever is about to count them out: what others hand
 * over arrives as new heaps, so gathering one's own never loses theirs. Undefined when there is none.
 */
export function heap(x, at, key) {
  const [first, ...more] = thingsAt(x.w, at).filter((tid) => x.w.things[tid].id === key)
  for (const tid of more) { x.w.things[first].n = (x.w.things[first].n ?? 1) + (x.w.things[tid].n ?? 1); destroy(x, tid) }
  return first
}

/**
 * Move `n` of a thing (all of it by default) to `to`. Returns the id of what arrived. Split only a heap the one acting
 * holds: two pages splitting one heap at once each keep a part and one of the counts, and money is made or lost.
 */
export function moveThing(x, tid, to, n) {
  const t = x.w.things[tid]
  if (combined(t.id) && n !== undefined && n < (t.n ?? 1)) {
    t.n -= n
    return makeThing(x, t.id, to, n)
  }
  delete t.eq
  delete t.home
  t.at = to
  return tid
}

/** A thing gone from the world, with what was in it. */
export function destroy(x, tid) {
  for (const inner of thingsAt(x.w, tid)) destroy(x, inner)
  delete x.w.things[tid]
}

export function weightOf(w, tid) {
  const t = w.things[tid]
  const it = ITEMS[t.id] ?? {}
  return it.baseWeight ? it.baseWeight * (t.n ?? 1) : it.weight ?? 0
}
/** feature/char/combat.c: a character carries 膂力² × 200 g, and at most 20 things. */
export const carriage = (w, id) => attr(w, id, 'str') ** 2 * 200
export const load = (w, id) => thingsAt(w, id).reduce((sum, tid) => sum + weightOf(w, tid), 0)

// ── money (feature/char/finance.c) ───────────────────────────────────────────────────────────────────────────────

const COIN_VALUE = { 'stock/coin': 1, 'stock/silver': 100, 'stock/gold': 10000 }
export function purse(w, id) {
  const out = { 'stock/coin': 0, 'stock/silver': 0, 'stock/gold': 0 }
  for (const tid of thingsAt(w, id)) if (isMoney(w.things[tid].id)) out[w.things[tid].id] += w.things[tid].n ?? 1
  return out
}
export const wealth = (w, id) => Object.entries(purse(w, id)).reduce((s, [k, n]) => s + COIN_VALUE[k] * n, 0)

/**
 * Pay `price` exactly, coins being 1, silver 100, gold 10000: 1 paid, 0 too little, 2 enough but no change (ES2 gives none).
 * What is paid leaves the world: a shopkeeper's till would only grow the file, a new heap each sale.
 */
export function pay(x, id, price) {
  const have = purse(x.w, id)
  for (let g = Math.min(have['stock/gold'], Math.floor(price / 10000)); g >= 0; g--) {
    const rest = price - g * 10000
    const s = Math.min(have['stock/silver'], Math.floor(rest / 100))
    const c = rest - s * 100
    if (c <= have['stock/coin']) {
      for (const [key, n] of [['stock/gold', g], ['stock/silver', s], ['stock/coin', c]]) {
        if (!n) continue
        destroy(x, moveThing(x, heap(x, id, key), 'gone', n))
      }
      return 1
    }
  }
  return wealth(x.w, id) >= price ? 2 : 0
}

// ── messages ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A line everyone in `room` sees (message_vision): `$N` is `a`, `$n` / `$p` is `b`, each read as 你 by themselves.
 * `k` marks lines the page reacts to (say, give, attack: who to wake).
 */
export function vision(x, room, text, a = null, b = null, more = {}) {
  const ev = { k: 'v', room, t: text, ...(a ? { a } : {}), ...(b ? { b } : {}), ...more }
  emit(x, ev)
}
/** A line only `id` reads (tell_object / write). */
export function tell(x, id, text, more = {}) {
  if (id === x.me) x.out.push(text)
  else if (!isNpc(id)) emit(x, { k: 'tell', only: id, room: roomOf(x.w, id), t: text, ...more }, false)
}
/** An NPC says a line in its room (command("say …")). */
export const npcSay = (x, id, text) => vision(x, ch(x.w, id).room, `$N说道：${text}`, id)
/** An emote of data/emoted.o, at someone or not. */
export function emote(x, id, lines, target = null) {
  vision(x, ch(x.w, id).room, target ? lines[1] : lines[0], id, target)
}

function emit(x, ev, mine = true) {
  ev.at = x.now
  ev.by = x.me
  x.events.push(ev)
  if (mine && ev.room === roomOf(x.w, x.me) && !(ev.k === 'move' && ev.a === x.me)) x.out.push(render(x.w, ev, x.me))
}

/** A logged line as `viewer` reads it. */
export function render(w, ev, viewer) {
  const lines = ev.lines ?? [[ev.t, ev.a, ev.b]]
  return lines.map(([t, a, b]) => fill(w, t, a, b, viewer)).join('\n')
}
export function fill(w, t, a, b, viewer) {
  return String(t)
    .replaceAll('$N', a ? who(w, a, viewer) : '')
    .replaceAll('$n', b ? who(w, b, viewer) : '')
    .replaceAll('$p', b ? who(w, b, viewer) : '')
    .replaceAll('$P', a ? who(w, a, viewer) : '')
}

// ── time ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Whether the game clock passed `hhmm` (as ES2 schedules say it: 700, 2200) between two moments. */
export function passed(since, now, hhmm) {
  if (now - since >= 24 * 60_000) return true
  const mins = (t) => { const g = gameTime(t); return g.hour * 60 + g.minute }
  const at = Math.floor(hhmm / 100) * 60 + (hhmm % 100)
  const a = mins(since); const b = mins(now)
  return a <= b ? a < at && at <= b : a < at || at <= b
}

export { ROOMS, NPCS, ITEMS }
