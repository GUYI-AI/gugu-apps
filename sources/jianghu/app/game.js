// 文字江湖's engine: one text command in, what the player reads and what changes in the world file out. The page and
// the agents' tools (tools.js) both run it, so a person typing 「拿 酒葫芦」 and an agent calling act with the same words
// do the same thing. No clock and no heartbeat: nothing happens unless someone types, and the town's people answer
// from fixed tables, the same on every computer.
//
// The world file (`文字江湖.jianghu.json`, the chat's) holds only what changes: where each player stands, where each
// thing lies, how far the errand went, and the last lines said and done (`log`). Rooms and people are in world.js.
import { START, DIRS, BACK, ROOMS, NPCS, ITEMS, QUEST } from './world.js'

export const FILE_NAME = '文字江湖.jianghu.json'
export const VERSION = 1
/** Lines kept in the file: older ones drop out as new ones come. */
export const LOG_MAX = 80
export const MAX_SAY = 200

/** What a new world's file starts as. */
export function fresh() {
  return { version: VERSION, players: {}, items: Object.fromEntries(Object.entries(ITEMS).map(([id, it]) => [id, it.at])), quest: {}, log: {} }
}

/** The keys a file still lacks to be a world: written once by whoever opens it first. */
export function missing(data) {
  const base = fresh()
  return Object.keys(base).filter((k) => data?.[k] === undefined).map((k) => [[k], base[k]])
}

/** Apply `[path, value]` changes to `target` (the live `f.data`, or a plain copy); `undefined` deletes. */
export function apply(target, ops) {
  for (const [path, value] of ops) {
    let at = target
    for (const k of path.slice(0, -1)) {
      if (at[k] === undefined || at[k] === null) at[k] = {}
      at = at[k]
    }
    const last = path[path.length - 1]
    if (value === undefined) delete at[last]
    else at[last] = value
  }
  return target
}

// ── names ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const nameOf = (s, id) => s.players?.[id]?.name || '一位侠客'
const who = (s, id, viewer) => (id === viewer ? '你' : nameOf(s, id))
const roomName = (room) => ROOMS[room]?.name ?? room
const thingName = (key) => (key.startsWith('npc:') ? NPCS[key.slice(4)]?.name : null) ?? key

/** Log keys sort by time: base-36 milliseconds, then a few random letters. */
export function logKey(now, rand = Math.random) {
  return now.toString(36).padStart(9, '0') + rand().toString(36).slice(2, 6).padEnd(4, '0')
}

const sortedLog = (s) => Object.entries(s.log ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

// ── what a player reads ───────────────────────────────────────────────────────────────────────────────────────────

const here = (s, room) => ({
  npcs: Object.entries(NPCS).filter(([, n]) => n.room === room).map(([id]) => id),
  items: Object.entries(s.items ?? {}).filter(([, at]) => at === room).map(([id]) => id),
  players: Object.entries(s.players ?? {}).filter(([, p]) => p.room === room).map(([id]) => id),
})

export const carrying = (s, me) => Object.entries(s.items ?? {}).filter(([, at]) => at === me).map(([id]) => id)

const exitsLine = (room) => `出口：${Object.keys(ROOMS[room].exits).map((d) => DIRS[d].name).join('、')}。`

/** A room as the one standing in it sees it. */
export function lookText(s, me) {
  const room = s.players?.[me]?.room ?? START
  const r = ROOMS[room]
  const h = here(s, room)
  const lines = [`【${r.name}】`, r.long]
  for (const id of h.items) lines.push(ITEMS[id].at === room ? ITEMS[id].lying : `地上放着一个${ITEMS[id].name}。`)
  if (h.npcs.length) lines.push(`这里有：${h.npcs.map((id) => NPCS[id].name).join('、')}。`)
  const others = h.players.filter((id) => id !== me)
  if (others.length) lines.push(`同在这里：${others.map((id) => nameOf(s, id) + (s.players[id].agent ? '（agent）' : '')).join('、')}。`)
  lines.push(exitsLine(room))
  return lines.join('\n')
}

/** A line of the log as `viewer` reads it. */
export function eventText(s, ev, viewer) {
  const by = who(s, ev.by, viewer)
  const to = ev.to ? (ev.to.startsWith('npc:') ? thingName(ev.to) : who(s, ev.to, viewer)) : ''
  const item = ev.item ? ITEMS[ev.item]?.name ?? ev.item : ''
  switch (ev.k) {
    case 'join': return `${by}走进了饮风客栈。`
    case 'leave': return `${by}往${DIRS[ev.dir]?.name ?? ''}边离开了。`
    case 'arrive': return `${by}从${DIRS[ev.dir]?.name ?? ''}边走了过来。`
    case 'say': return `${by}说：「${ev.text}」`
    case 'sayto': return `${by}对${to}说：「${ev.text}」`
    case 'take': return `${by}拿起了${item}。`
    case 'drop': return `${by}放下了${item}。`
    case 'give': return `${by}把${item}交给了${to}。`
    case 'ask': return `${by}向${NPCS[ev.npc]?.name}打听「${ev.topic}」。\n${NPCS[ev.npc]?.name}说：「${ev.reply}」`
    case 'npc': return ev.text
    case 'quest': return ev.text
    case 'reset': return `${by}让江湖重开了一回：东西都回到了原处。`
    default: return ''
  }
}

/** Whether `viewer` standing in `room` sees the line: what happens in the room, and anyone saying their name anywhere. */
export function sees(s, ev, viewer, room) {
  if (ev.room === room || ev.k === 'reset') return true
  const name = s.players?.[viewer]?.name
  return ev.k === 'say' && Boolean(name) && ev.text.includes(name)
}

/** The log after `since` (a key; '' for all) that `viewer` sees from `room`, minus their own, oldest first. */
export function linesSince(s, viewer, room, since = '', limit = 30) {
  const rows = sortedLog(s).filter(([k, ev]) => k > since && ev.by !== viewer && sees(s, ev, viewer, room))
  return rows.slice(-limit).map(([k, ev]) => ({ key: k, text: (ev.room !== room && ev.k === 'say' ? `（${roomName(ev.room)}）` : '') + eventText(s, ev, viewer) }))
}

/** The newest key of the log, '' when it is empty. */
export const lastKey = (s) => sortedLog(s).at(-1)?.[0] ?? ''

/**
 * Who to wake for a line: an agent spoken to, named, or handed something — and only by a person, so two agents never
 * keep each other talking.
 */
export function wakes(s, ev) {
  if (s.players?.[ev.by]?.agent) return []
  const agents = Object.entries(s.players ?? {}).filter(([, p]) => p.agent).map(([id]) => id)
  if ((ev.k === 'sayto' || ev.k === 'give') && agents.includes(ev.to)) return [ev.to]
  if (ev.k === 'say') return agents.filter((id) => ev.text.includes(nameOf(s, id)))
  return []
}

/** The whisper that wakes an agent for a line. */
export const wakeText = (s, ev, agent) => `文字江湖（${roomName(ev.room)}）：${eventText(s, ev, agent)}`

// ── commands ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const HELP = [
  '看 / 看 <东西或人>　四处看看，或细看一样东西',
  '东 西 南 北（也可以 走 东）　往那边走',
  '说 <话>　对这里的人说话；对 <人> 说 <话>　对一个人说',
  '问 <人> <事>　向镇上的人打听，比如：问 店小二 李先生',
  '拿 <东西> / 放下 <东西> / 给 <人> <东西>',
  '背包　看身上带着什么；任务　看差事进展；谁　看大家在哪',
].join('\n')

const VERBS = [
  [['看看', '看', '瞧', '观察', 'look', 'l'], 'look'],
  [['走', '去', '往', '向', 'go'], 'go'],
  [['说', 'say'], 'say'],
  [['对'], 'sayto'],
  [['问', '打听', 'ask'], 'ask'],
  [['拿起', '拿', '捡起', '捡', '取', 'get', 'take'], 'take'],
  [['放下', '丢下', '丢', '放', 'drop'], 'drop'],
  [['交给', '给', 'give'], 'give'],
  [['背包', '身上', 'inventory', 'inv', 'i'], 'inv'],
  [['任务', '差事', '提示', 'quest', 'hint'], 'quest'],
  [['谁', 'who'], 'who'],
  [['帮助', 'help', '?', '？'], 'help'],
  [['重来', '重开', 'reset'], 'reset'],
]

const ascii = (w) => /^[a-z?]+$/i.test(w)

/** The verb a line starts with and the rest: an English verb needs a space or the end after it. */
export function parse(line) {
  const text = String(line ?? '').trim().replace(/\s+/g, ' ').replace(/[。！!]+$/, '')
  const lower = text.toLowerCase()
  for (const d of Object.keys(DIRS)) if (DIRS[d].words.includes(lower)) return { verb: 'go', rest: d }
  const ba = text.match(/^把\s*(.+?)\s*(?:交给|给)\s*(.+)$/)
  if (ba) return { verb: 'give', rest: `${ba[2]} ${ba[1]}` }
  let best = null
  for (const [words, verb] of VERBS) {
    for (const w of words) {
      if (!lower.startsWith(w)) continue
      if (ascii(w) && lower.length > w.length && lower[w.length] !== ' ') continue
      if (!best || w.length > best.w.length) best = { w, verb }
    }
  }
  if (!best) return { verb: null, rest: text }
  return { verb: best.verb, rest: text.slice(best.w.length).trim() }
}

/** The direction a word names. */
const dirOf = (word) => Object.keys(DIRS).find((d) => DIRS[d].words.includes(word.toLowerCase().replace(/^[往向]/, '')))

/**
 * The thing `text` starts with, among `cands` (`{ key, names }`), longest name first, and what follows it.
 */
function lead(cands, text) {
  let best = null
  for (const c of cands) for (const n of c.names) {
    if (n && text.toLowerCase().startsWith(n.toLowerCase()) && (!best || n.length > best.n.length)) best = { c, n }
  }
  return best ? { key: best.c.key, kind: best.c.kind, rest: text.slice(best.n.length).trim() } : null
}

/** Everything a player can name where they stand. */
function nameable(s, me, room) {
  const h = here(s, room)
  return [
    ...h.npcs.map((id) => ({ key: id, kind: 'npc', names: [NPCS[id].name, ...NPCS[id].words] })),
    ...h.players.filter((id) => id !== me).map((id) => ({ key: id, kind: 'player', names: [nameOf(s, id)] })),
    ...[...carrying(s, me), ...h.items].map((id) => ({ key: id, kind: 'item', names: [ITEMS[id].name, ...ITEMS[id].words] })),
    ...Object.keys(ROOMS[room].details ?? {}).map((d) => ({ key: d, kind: 'detail', names: [d] })),
  ]
}

/**
 * Run one command of `me` against the world `s` (a plain copy). Returns `{ reply, ops, events }`: what `me` reads,
 * the changes to make (apply), and the log lines they add (already in ops).
 * `opts`: `{ now, rand }`.
 */
export function run(s, me, line, { now = Date.now(), rand = Math.random } = {}) {
  const player = s.players?.[me]
  if (!player) return { reply: '你还不在江湖里。', ops: [], events: [] }
  const room = player.room in ROOMS ? player.room : START
  const ops = []
  const events = []
  let t = now
  const log = (ev) => {
    const e = { ...ev, by: ev.by ?? me, room: ev.room ?? room, at: now }
    const key = logKey(t++, rand)
    ops.push([['log', key], e])
    events.push({ key, ...e })
    return e
  }
  const done = (reply) => {
    // Older lines go as new ones come: the file keeps LOG_MAX.
    const keys = sortedLog(s).map(([k]) => k)
    const over = keys.length + events.length - LOG_MAX
    for (const k of keys.slice(0, Math.max(0, over))) ops.push([['log', k], undefined])
    ops.push([['players', me, 'at'], now])
    return { reply, ops, events }
  }
  const { verb, rest } = parse(line)

  switch (verb) {
    case null:
      return done(rest ? `「${rest}」？江湖上没这个说法。输入「帮助」看看能做什么。` : lookText(s, me))
    case 'help':
      return done(HELP)
    case 'look': {
      if (!rest) return done(lookText(s, me))
      const t2 = lead(nameable(s, me, room), rest)
      if (!t2) return done(`你看了半天，没看到「${rest}」。`)
      if (t2.kind === 'npc') return done(`${NPCS[t2.key].name}：${NPCS[t2.key].long}`)
      if (t2.kind === 'item') return done(`${ITEMS[t2.key].name}：${ITEMS[t2.key].long}`)
      if (t2.kind === 'detail') return done(ROOMS[room].details[t2.key])
      const has = carrying(s, t2.key).map((id) => ITEMS[id].name)
      return done(`${nameOf(s, t2.key)}${s.players[t2.key].agent ? '（agent）' : ''}站在这里。${has.length ? `身上带着：${has.join('、')}。` : ''}`)
    }
    case 'go': {
      const d = dirOf(rest)
      if (!d) return done(rest ? `「${rest}」是哪个方向？${exitsLine(room)}` : `往哪走？${exitsLine(room)}`)
      const to = ROOMS[room].exits[d]
      if (!to) return done(`${DIRS[d].name}边没有路。${exitsLine(room)}`)
      log({ k: 'leave', dir: d })
      log({ k: 'arrive', dir: BACK[d], room: to })
      ops.push([['players', me, 'room'], to])
      const after = apply(structuredClone(s), [[['players', me, 'room'], to]])
      return done(lookText(after, me))
    }
    case 'say': {
      const text = rest.slice(0, MAX_SAY)
      if (!text) return done('你想说什么？')
      return done(eventText(s, log({ k: 'say', text }), me))
    }
    case 'sayto': {
      const m = rest.match(/^(.+?)\s*说[：:]?\s*(.*)$/)
      const t2 = m && lead(nameable(s, me, room).filter((c) => c.kind === 'npc' || c.kind === 'player'), m[1])
      if (!m || !t2 || t2.rest) return done('对谁说？这样说：对 <这里的人> 说 <话>')
      const text = m[2].slice(0, MAX_SAY)
      if (!text) return done('你想说什么？')
      if (t2.kind === 'npc') return done(ask(t2.key, text))
      return done(eventText(s, log({ k: 'sayto', to: t2.key, text }), me))
    }
    case 'ask': {
      const t2 = lead(nameable(s, me, room).filter((c) => c.kind === 'npc'), rest)
      if (!t2) return done(rest ? `这里没有「${rest.split(' ')[0]}」可以打听。` : '问谁？这样问：问 <人> <事>')
      return done(ask(t2.key, t2.rest.replace(/^(关于|有关|about)\s*/i, '').replace(/的事$/, '')))
    }
    case 'take': {
      const t2 = lead(here(s, room).items.map((id) => ({ key: id, kind: 'item', names: [ITEMS[id].name, ...ITEMS[id].words] })), rest)
      if (!t2) return done(rest ? `这里没有「${rest}」可以拿。` : '拿什么？')
      ops.push([['items', t2.key], me])
      return done(eventText(s, log({ k: 'take', item: t2.key }), me))
    }
    case 'drop': {
      const t2 = lead(carrying(s, me).map((id) => ({ key: id, kind: 'item', names: [ITEMS[id].name, ...ITEMS[id].words] })), rest)
      if (!t2) return done(rest ? `你身上没有「${rest}」。` : '放下什么？')
      ops.push([['items', t2.key], room])
      return done(eventText(s, log({ k: 'drop', item: t2.key }), me))
    }
    case 'give': {
      // 给 <人> <东西>; 把 <东西> 给 <人> comes here turned around (parse).
      const people = nameable(s, me, room).filter((c) => c.kind === 'npc' || c.kind === 'player')
      const mine = carrying(s, me).map((id) => ({ key: id, kind: 'item', names: [ITEMS[id].name, ...ITEMS[id].words] }))
      const p = lead(people, rest)
      const it = p && lead(mine, p.rest)
      if (!p) return done(rest ? `这里没有「${rest.split(' ')[0]}」。` : '给谁？这样给：给 <人> <东西>')
      if (!it) return done(p.rest ? `你身上没有「${p.rest}」。` : `给${p.kind === 'npc' ? NPCS[p.key].name : nameOf(s, p.key)}什么？`)
      return done(give(p, it.key))
    }
    case 'inv': {
      const has = carrying(s, me).map((id) => ITEMS[id].name)
      return done(has.length ? `你身上带着：${has.join('、')}。` : '你身上空空如也。')
    }
    case 'quest':
      return done(questText(s))
    case 'who': {
      const rows = Object.entries(s.players ?? {}).map(([id, p]) => `${who(s, id, me)}${p.agent ? '（agent）' : ''}：${roomName(p.room)}`)
      return done(rows.length ? rows.join('\n') : '江湖上还没有人。')
    }
    case 'reset': {
      if (!s.quest?.done) return done('差事还没办完，不能重开。办完之后输入「重来」，东西会回到原处。')
      for (const [id, it] of Object.entries(ITEMS)) ops.push([['items', id], it.at])
      ops.push([['quest'], {}])
      return done(eventText(s, log({ k: 'reset' }), me))
    }
  }
  return done(HELP)

  /** Asking a townsperson: their line, said aloud in the room. */
  function ask(npc, topic) {
    const n = NPCS[npc]
    const key = Object.keys(n.topics).find((k) => topic.includes(k))
    let reply = key ? n.topics[key] : n.idle
    if (reply === 'quest') {
      reply = s.quest?.done ? QUEST.done : QUEST.ask
      if (!s.quest?.asked) ops.push([['quest', 'asked'], me])
    }
    return eventText(s, log({ k: 'ask', npc, topic: topic || '近况', reply }), me)
  }

  /** Handing a thing over: to a player it is theirs; of the town, only the storyteller takes the gourd. */
  function give(p, item) {
    const name = ITEMS[item].name
    if (p.kind === 'player') {
      ops.push([['items', item], p.key])
      return eventText(s, log({ k: 'give', to: p.key, item }), me)
    }
    const n = NPCS[p.key]
    if (p.key === 'storyteller' && item === 'hulu') {
      ops.push([['items', item], 'npc:storyteller'], [['quest', 'done'], me], [['quest', 'at'], now])
      const a = log({ k: 'give', to: 'npc:storyteller', item })
      const b = log({ k: 'quest', text: `${QUEST.given}\n——「${QUEST.name}」完成了！输入「重来」可以让江湖重开一回。` })
      return `${eventText(s, a, me)}\n${eventText(s, b, me)}`
    }
    if (p.key === 'junkman' && item !== 'hulu') {
      ops.push([['items', item], `npc:junkman`])
      const a = log({ k: 'give', to: 'npc:junkman', item })
      return `${eventText(s, a, me)}\n拾荒老头把${name}揣进怀里，咧嘴一笑。`
    }
    if (item === 'hulu') return `${n.name}看了看葫芦上的红纸：「这是给李先生的，可别给错了人。」`
    return `${n.name}摇摇头，没有接你的${name}。`
  }
}

/** How far the errand went, as the 任务 command shows it. */
export function questText(s) {
  const at = s.items?.hulu
  const steps = [Boolean(s.quest?.asked), Boolean(s.quest?.done) || (typeof at === 'string' && at.startsWith('user:')), Boolean(s.quest?.done)]
  const lines = [`差事：${QUEST.name}`, ...QUEST.hint.map((h, i) => `${steps[i] ? '✓' : '·'} ${h}`)]
  if (s.quest?.done) lines.push(`已经办完了：${nameOf(s, s.quest.done)}把酒送到了。`)
  else if (typeof at === 'string' && at.startsWith('user:')) lines.push(`酒葫芦现在在${nameOf(s, at)}身上。`)
  return lines.join('\n')
}

/**
 * The changes that bring `me` into the world, or update their name: a new player starts in the inn's hall.
 * `agent`: they play through the App's tools (the page wakes them when spoken to).
 */
export function join(s, me, { name, agent = false, now = Date.now(), rand = Math.random } = {}) {
  const p = s.players?.[me]
  if (p) {
    const ops = []
    if (name && p.name !== name) ops.push([['players', me, 'name'], name])
    if (agent && !p.agent) ops.push([['players', me, 'agent'], true])
    return ops
  }
  const key = logKey(now, rand)
  return [
    [['players', me], { name: name || '一位侠客', room: START, joined: now, at: now, ...(agent ? { agent: true } : {}) }],
    [['log', key], { k: 'join', by: me, room: START, at: now }],
  ]
}
