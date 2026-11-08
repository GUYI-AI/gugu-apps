// 文字江湖's engine: one text command in, what the player reads and what changes in the world file out. The page and
// the agents' tools (tools.js) both run it, so a person typing 「拿 木剑」 and an agent calling act with the same words
// do the same thing. The world is ES2's 雪亭镇 (es2.js, story.js); the rules are ES2's (world.js, fight.js).
//
// No server clock: time moves when someone types. Each command first lets the town catch up (advance): the people
// in the rooms where players stand say and do what they would have in the meantime (a few beats at most), the inn
// opens and closes by the game's clock, and every half hour the town resets.
import {
  ROOMS, NPCS, ITEMS, HOOKS, START, BEAT, RESET, LOG_MAX, ch, isNpc, isThing, baseOf, npcData, alive, awake, nameOf, who,
  thingName, thingShort, thingGroups, itemOf, attr, skillLv, levelOf, clsOf, newPlayer, spawnNpc, peopleIn, npcsIn, playersIn,
  thingsAt, makeThing, moveThing, heap, resetId, destroy, weightOf, carriage, load, isMoney, purse, wealth, pay, vision, tell, npcSay,
  emote, render, regen, supplement, consume, heal, passed, online,
} from './world.js'
import { DIRS, BACK, ATTR_NAMES, SCORE_NAMES, CLASS_NAMES, EMOTES, HUNT_MSG, woundMsg, phaseOf, timeText, priceText, cn } from './text.js'
import { brawl, improve, skillName, weaponOf } from './fight.js'
import './story.js'
import './xyj-story.js'

export const FILE_NAME = '文字江湖.jianghu.json'
export const VERSION = 3
export const MAX_SAY = 200
export { START }

// ── the file ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** What a new world's file starts as: 雪亭镇 with its people and things where ES2 puts them. */
export function fresh({ now = Date.now(), rand = Math.random } = {}) {
  const x = ctx({ version: VERSION, t: now, reset: now, players: {}, npcs: {}, things: {}, rooms: {}, sold: {}, log: {} }, null, now, rand)
  resetTown(x)
  return x.w
}

/** The keys a file still lacks to be this version's world: an older world starts over. */
export function missing(data, opts) {
  if (data?.version !== VERSION) return Object.entries(fresh(opts)).map(([k, v]) => [[k], v])
  const base = { players: {}, npcs: {}, things: {}, rooms: {}, sold: {}, log: {} }
  return Object.keys(base).filter((k) => data[k] === undefined).map((k) => [[k], base[k]])
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

/** The changes from `a` to `b`, one op per player, townsperson, thing or room that differs. */
function diff(a, b) {
  const ops = []
  for (const k of ['version', 't', 'reset']) if (a[k] !== b[k]) ops.push([[k], b[k]])
  for (const k of ['players', 'npcs', 'things', 'rooms', 'sold']) {
    for (const id of new Set([...Object.keys(a[k] ?? {}), ...Object.keys(b[k] ?? {})])) {
      const x = a[k]?.[id]; const y = b[k]?.[id]
      if (JSON.stringify(x) !== JSON.stringify(y)) ops.push([[k, id], y === undefined ? undefined : structuredClone(y)])
    }
  }
  return ops
}

function ctx(w, me, now, rand) {
  return { w, me, now, rand, out: [], events: [] }
}
const rnd = (x, n) => (n > 0 ? Math.floor(x.rand() * n) : 0)
const pick = (x, list) => list[rnd(x, list.length)]

// ── the log ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** Log keys sort by time: base-36 milliseconds, then a few random letters. */
export function logKey(now, rand = Math.random) {
  return now.toString(36).padStart(9, '0') + rand().toString(36).slice(2, 6).padEnd(4, '0')
}
const sortedLog = (s) => Object.entries(s.log ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
export const lastKey = (s) => sortedLog(s).at(-1)?.[0] ?? ''

/** Whether `viewer` in `room` sees a line: what happens in the room, what is told to them, and their name said aloud. */
export function sees(s, ev, viewer, room) {
  if (ev.only) return ev.only === viewer
  if (ev.k === 'team') return Boolean(s.players?.[viewer]?.team) && s.players[viewer].team === ev.team
  if (ev.k === 'chat') return true // a word to the whole world (xyj-story.js: 镇元大仙's 人参果 meeting)
  if (ev.room === room) return true
  const name = s.players?.[viewer]?.name
  return ev.k === 'say' && Boolean(name) && String(ev.text).includes(name)
}

/** The log after `since` (a key; '' for all) that `viewer` sees from `room`, minus what their own commands made. */
export function linesSince(s, viewer, room, since = '', limit = 30) {
  const rows = sortedLog(s).filter(([k, ev]) => k > since && ev.by !== viewer && sees(s, ev, viewer, room))
  return rows.slice(-limit).map(([k, ev]) => ({
    key: k,
    text: (ev.room !== room && ev.k === 'say' ? `（${ROOMS[ev.room]?.name ?? ''}）` : '') + render(s, ev, viewer),
  }))
}

/** Who to wake for a line a person made: an agent spoken to, named, handed something or attacked. Agents wake nobody. */
export function wakes(s, ev) {
  if (!s.players?.[ev.by] || s.players[ev.by].agent) return []
  const agents = Object.entries(s.players ?? {}).filter(([, p]) => p.agent).map(([id]) => id)
  if (ev.to && agents.includes(ev.to)) return [ev.to]
  if (ev.k === 'say') return agents.filter((id) => ev.text.includes(s.players[id].name))
  return []
}
export const wakeText = (s, ev, agent) => `文字江湖（${ROOMS[ev.room]?.name ?? ''}）：${render(s, ev, agent)}`

// ── the clock ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The town after a reset: the dead back at home, the lost things again where they lay, shops restocked. */
function resetTown(x) {
  const w = x.w
  // The reset of this half hour: every page crossing it makes the same one (resetId), so it is written once.
  w.reset = epochOf(x.now)
  x.reset = w.reset / RESET
  w.rooms = {}
  w.sold = {} // shops restocked
  for (const [room, r] of Object.entries(ROOMS)) {
    for (const [key, n] of Object.entries(r.spawn ?? {})) {
      if (NPCS[key]) {
        for (let i = 1; i <= n; i++) {
          const id = `n:${key}${i > 1 ? '.' + i : ''}`
          const c = w.npcs[id]
          if (!c || c.dead) spawnNpc(x, id, room)
          else {
            delete c.hate; delete c.flags
            if (c.room !== room && !(c.out > x.now)) c.room = room
          }
        }
      } else if (ITEMS[key]) {
        const have = Object.values(w.things).filter((t) => t.id === key && t.home === room).reduce((s, t) => s + (t.n ?? 1), 0)
        const lacking = n - have
        if (lacking > 0) {
          if (ITEMS[key].baseUnit) makeThing(x, key, room, lacking, { home: room }, resetId(x, 'r:' + room, key))
          else for (let i = 0; i < lacking; i++) makeThing(x, key, room, 1, { home: room }, resetId(x, 'r:' + room, key, i))
        }
      }
    }
  }
  // Coins handed to townspeople arrive as heaps of their own; gathered here, alike on every page.
  for (const id of Object.keys(w.npcs)) for (const key of ['stock/coin', 'stock/silver', 'stock/gold']) heap(x, id, key)
  HOOKS.reset?.(x)
  delete x.reset
}
const epochOf = (now) => Math.floor(now / RESET) * RESET

/** Let the town catch up to now: wake-ups, the inn's hours, corpses rotting, a few beats of the townspeople. */
function advance(x) {
  const w = x.w
  if (epochOf(x.now) > (w.reset ?? 0)) resetTown(x)
  const since = w.t ?? x.now
  for (const [hhmm, fn] of HOOKS.schedule ?? []) if (passed(since, x.now, hhmm)) fn(x)
  // Corpses rot (obj/corpse.c): rotten after 3 minutes, bones after 6, dust after 9 — with what was in them.
  for (const [tid, t] of Object.entries(w.things)) {
    if (t.id !== 'corpse') continue
    const age = x.now - t.decay
    if (age >= 9 * 60_000) { if (playersIn(w, t.at).length) vision(x, t.at, `一阵风吹过，把${t.name}化成骨灰吹散了。`); destroy(x, tid) }
    else if (age >= 6 * 60_000 && t.stage !== 2) { t.stage = 2; t.name = '枯干的骸骨' }
    else if (age >= 3 * 60_000 && !t.stage) { t.stage = 1; t.name = `腐烂的${t.name.replace(/的尸体$/, '')}尸体` }
  }
  // Those knocked out come to.
  for (const id of [...Object.keys(w.players), ...Object.keys(w.npcs)]) {
    const c = ch(w, id)
    if (c.out && c.out <= x.now) {
      delete c.out
      supplement(c, 'gin', attr(w, id, 'dex')); supplement(c, 'kee', attr(w, id, 'con')); supplement(c, 'sen', attr(w, id, 'spi'))
      vision(x, c.room, '$N慢慢睁开眼睛，清醒了过来。', id)
      if (!isNpc(id)) tell(x, id, '慢慢地你终于又有了知觉....')
    }
  }
  const beats = Math.min(15, Math.floor((x.now - since) / BEAT))
  if (beats > 0) w.t = x.now
  const watched = new Set(Object.values(w.players).map((p) => p.room))
  for (let b = 0; b < beats; b++) {
    for (const [id, c] of Object.entries(w.npcs)) {
      if (c.dead || c.out > x.now || !watched.has(c.room)) continue
      const d = npcData(id)
      if (d.chatMsg && rnd(x, 100) < (d.chatChance ?? 0)) act(x, id, pick(x, d.chatMsg))
    }
    HOOKS.beat?.(x)
  }
}

/** One thing an NPC says or does: a line, a say, a command, or a behaviour of its own (chat_msg, do_chat). */
export function act(x, id, what) {
  const c = ch(x.w, id)
  if (!c || c.dead) return
  if (typeof what === 'function') return what(x, id)
  if (typeof what === 'string') return vision(x, c.room, what, id)
  if (what.say) return npcSay(x, id, what.say)
  if (what.emote) return emote(x, id, EMOTES[what.emote] ?? [what.emote, what.emote], what.at ?? null)
  if (what.fn === 'random_move') return randomMove(x, id)
  if (what.do === 'get all') {
    for (const tid of thingsAt(x.w, c.room)) if (!itemOf(x.w, tid)?.noGet && x.w.things[tid].id !== 'corpse') { moveThing(x, tid, id); vision(x, c.room, `$N捡起${thingName(x.w, tid)}。`, id) }
    return
  }
  if (what.do) return emote(x, id, EMOTES[what.do] ?? ['$N' + what.do, '$N' + what.do])
  if (what.fn) return HOOKS.chat[what.fn]?.(x, id, what)
}
export function randomMove(x, id) {
  const c = ch(x.w, id)
  const exits = Object.entries(ROOMS[c.room].exits).filter(([d]) => !closed(x.w, c.room, d))
  if (!exits.length) return
  const [dir, to] = pick(x, exits)
  move(x, id, dir, to)
}

// ── moving ───────────────────────────────────────────────────────────────────────────────────────────────────────

const closed = (w, room, dir) => Boolean(ROOMS[room].doors?.[dir]) && (w.rooms[room]?.doors?.[dir] ?? ROOMS[room].doors[dir].closed)
export function setDoor(x, room, dir, isClosed) {
  const to = ROOMS[room].exits[dir]
  ;(x.w.rooms[room] ??= {}).doors = { ...(x.w.rooms[room].doors ?? {}), [dir]: isClosed }
  const back = Object.entries(ROOMS[to]?.doors ?? {}).find(([, d]) => d.name === ROOMS[room].doors[dir].name)?.[0]
  if (back) (x.w.rooms[to] ??= {}).doors = { ...(x.w.rooms[to].doors ?? {}), [back]: isClosed }
}

/** Someone goes `dir` to `to`: the rooms see them leave and arrive; those following them come along. */
export function move(x, id, dir, to, { how = null, quiet = false } = {}) {
  const w = x.w
  const c = ch(w, id)
  const from = c.room
  if (!quiet) vision(x, from, how?.leave ?? `$N往${dir}边离开。`, id, null, { k: 'move' })
  c.room = to
  if (c.temp?.sitting) delete c.temp.sitting
  if (!quiet) vision(x, to, how?.arrive ?? (BACK[dir] ? `$N从${BACK[dir]}边走了过来。` : '$N走了过来。'), id, null, { k: 'move' })
  if (id === x.me) x.out.push(lookText(w, id, x.now))
  // followers (feature/char/team.c follow_me)
  for (const f of peopleIn(w, from)) {
    const fc = ch(w, f)
    if (f !== id && fc.follow === id && awake(w, f, x.now)) move(x, f, dir, to)
  }
  arrive(x, id)
}

/** What arriving sets off: greetings, grudges (combatd.c auto_fight), and each person's own init. */
function arrive(x, id) {
  const w = x.w
  const room = ch(w, id).room
  if (!awake(w, id, x.now)) return
  for (const n of npcsIn(w, room)) {
    if (n === id || !awake(w, n, x.now)) continue
    if (!isNpc(id)) {
      const c = ch(w, n)
      const d = npcData(n)
      if (c.hate?.[id] && !ROOMS[room].noFight) {
        brawl(x, n, id, 'kill', [[pick(x, HUNT_MSG), n, id]])
        return
      }
      if (d.vendettaMark && w.players[id].vendetta?.[d.vendettaMark] && !ROOMS[room].noFight) {
        brawl(x, n, id, 'kill', [[pick(x, HUNT_MSG), n, id]])
        return
      }
    }
    HOOKS.npc[baseOf(n)]?.init?.(x, n, id)
  }
  if (!isNpc(id)) HOOKS.room[room]?.init?.(x, id)
  if (isNpc(id)) for (const p of playersIn(w, room)) HOOKS.npc[baseOf(id)]?.init?.(x, id, p)
}

// ── what a player reads ──────────────────────────────────────────────────────────────────────────────────────────

const exitsLine = (w, room) => {
  const ex = Object.keys(ROOMS[room].exits)
  return ex.length ? `这里明显的出口是 ${ex.map((d) => (ROOMS[room].doors?.[d] ? `${d}（${ROOMS[room].doors[d].name}${closed(w, room, d) ? '，关着' : ''}）` : d)).join('、')}。` : '这里没有任何明显的出路。'
}

/** A room as the one standing in it sees it. */
export function lookText(w, me, now = Date.now()) {
  const p = ch(w, me)
  const room = p?.room in ROOMS ? p.room : START
  const r = ROOMS[room]
  const lines = [`【${r.name}】`, r.long + (r.outdoors ? `${phaseOf(now)[2]}。` : '')]
  if (room === 'small_temple' && p?.ghost) lines.push('你看见地面上有一个红色的漩涡(swirl)在不断旋转 ...')
  lines.push(exitsLine(w, room))
  const things = thingGroups(w, room).map(([, text]) => text)
  if (things.length) lines.push(`这里有：${things.join('、')}。`)
  const people = peopleIn(w, room).filter((id) => id !== me).map((id) => personShort(w, id, now))
  if (people.length) lines.push(...people.map((t) => `  ${t}`))
  return lines.join('\n')
}

function personShort(w, id, now) {
  const c = ch(w, id)
  if (isNpc(id)) {
    const d = npcData(id)
    return `${d.title ? `${d.title} ` : ''}${d.nickname ? `「${d.nickname}」` : ''}${d.name}${c.out > now ? ' <昏迷不醒>' : ''}`
  }
  const title = c.title ?? CLASS_NAMES[c.cls] ?? ''
  return `${title} ${nameOf(w, id)}${c.agent ? '（agent）' : ''}${c.out > now ? ' <昏迷不醒>' : ''}`
}

function lookAt(x, target) {
  const w = x.w
  if (target.kind === 'detail') return ROOMS[ch(w, x.me).room].details[target.key]
  if (target.kind === 'thing') {
    const t = w.things[target.key]
    if (t.id === 'corpse') {
      const inside = thingGroups(w, target.key).map(([, text]) => text)
      return `${t.name}${t.stage === 2 ? '已经躺在这里很久了。' : t.stage ? '显然已经躺在这里有一段时间了，正散发着一股腐尸的味道。' : '。'}${inside.length ? `\n里面有：${inside.join('、')}。` : ''}`
    }
    const it = itemOf(w, target.key)
    const inside = thingGroups(w, target.key).map(([, text]) => text)
    const water = t.water ? `\n里面装着${t.water}口水。` : ''
    return `${thingName(w, target.key)}：${it?.long ?? ''}${inside.length ? `\n里面有：${inside.join('、')}。` : ''}${water}`
  }
  const id = target.key
  const c = ch(w, id)
  const lines = []
  if (isNpc(id)) {
    const d = npcData(id)
    lines.push(`${d.nickname ? `「${d.nickname}」` : ''}${d.name}${d.age ? `，看起来约${cn(Math.floor(d.age / 10) * 10)}多岁` : ''}。`, d.long)
  } else {
    lines.push(`${personShort(w, id, x.now).trim()}，${CLASS_NAMES[c.cls] ?? ''}，${levelOf(w, id)} 级。`)
  }
  const eq = thingsAt(w, id).filter((tid) => w.things[tid].eq).map((tid) => thingName(w, tid))
  if (eq.length) lines.push(`身上装备着：${eq.join('、')}。`)
  if (!c.ghost) lines.push(woundMsg(Math.floor(c.kee.eff * 100 / c.kee.max)).replace('$N', id === x.me ? '你' : nameOf(w, id)))
  return lines.join('\n')
}

// ── commands ─────────────────────────────────────────────────────────────────────────────────────────────────────

export const HELP = [
  '看 / 看 <人或东西>　东 西 南 北 上 下 出去（也可以 走 东）',
  '说 <话>　对 <人> 说 <话>　队 <话>（队伍里说）',
  '拿 <东西> [从 <尸体等>] / 放下 / 给 <人> [数量] <东西>　背包',
  '穿 / 脱 <衣物>　装备 / 卸下 <兵器>　吃 <东西>　喝 <水缸等>',
  '清单（看店里卖什么）　买 <东西>　兑换 <数量> <钱> 成 <钱>',
  '比武 <人>（点到为止）　杀 <人>　跟随 <人>|无　组队 <人>　离队　队伍',
  '状态 / 属性 / 技能　拜师 <人>　请教 <人> <技能>　偷 <东西> 从 <人>',
  '爬 / 钻 / 进 / 搜 / 坐 / 装车 / 开门 / 关门（看地方）　时间　谁',
  '西游（去《西游记》的长安）/ 东归　那边还有：去 <地点>　问 <人> 关于 <事>　学 <技能> 从 <人>　睡觉　激发　打坐 / 冥想 <数>　取经　腾云',
].join('\n')

const VERBS = [
  [['看看', '看', '瞧', 'look', 'l'], 'look'],
  [['走', '去', '往', 'go'], 'go'],
  [['说', 'say', "'"], 'say'],
  [['对'], 'sayto'],
  [['队伍', 'team'], 'team'],
  [['队', 'tt'], 'tt'],
  [['组队'], 'teamwith'],
  [['离队'], 'teamleave'],
  [['拿起', '拿', '捡起', '捡', 'get', 'take'], 'get'],
  [['放下', '丢下', '丢', 'drop'], 'drop'],
  [['交给', '给', 'give'], 'give'],
  [['背包', '身上', 'inventory', 'inv', 'i'], 'inv'],
  [['穿上', '穿', '戴上', '戴', 'wear'], 'wear'],
  [['脱下', '脱', 'remove'], 'remove'],
  [['装备', '拿兵器', 'wield'], 'wield'],
  [['卸下', 'unwield'], 'unwield'],
  [['吃', '服', 'eat'], 'eat'],
  [['喝', 'drink'], 'drink'],
  [['装水', 'fill'], 'fill'],
  [['清单', '看货', 'list'], 'list'],
  [['买', '点', 'buy'], 'buy'],
  [['兑换', '换钱', 'convert'], 'convert'],
  [['比武', '切磋', 'fight'], 'fight'],
  [['杀', '打', 'kill'], 'kill'],
  [['停手', '罢手', 'halt'], 'halt'],
  [['跟随', '跟着', '跟', 'follow'], 'follow'],
  [['状态', 'hp'], 'hp'],
  [['属性', '分数', 'score'], 'score'],
  [['技能', '武功', 'skills'], 'skills'],
  [['拜师', '拜', 'apprentice'], 'apprentice'],
  [['请教', '求教', 'acquire'], 'acquire'],
  [['偷', 'steal'], 'steal'],
  [['开门', 'open'], 'open'],
  [['关门', 'close'], 'close'],
  [['时间', 'time'], 'time'],
  [['谁', 'who'], 'who'],
  [['帮助', 'help', '?', '？'], 'help'],
  // Room actions (story.js): the verb goes to the room.
  [['爬上', '爬', '翻', 'climb'], 'climb'],
  [['钻进', '钻', '进去', '进', '走进', 'enter'], 'enter'],
  [['搜', '找', '搜索', 'search'], 'search'],
  [['坐下', '坐', 'sit'], 'sit'],
  [['装车', '装上车', '装', 'load'], 'load'],
  [['领信札', '领', 'request'], 'request'],
  // 西游记's commands (xyj-story.js, HOOKS.cmd).
  [['西游', '去长安', 'xiyou'], 'xiyou'],
  [['睡觉', '睡', 'sleep'], 'sleep'],
  [['东归', '回雪亭', 'donggui'], 'donggui'],
  [['学习', '学', 'learn'], 'learn'],
  [['激发', 'enable'], 'enable'],
  [['打坐', '练内力', 'exercise'], 'exercise'],
  [['冥想', '冥思', 'meditate'], 'meditate'],
  [['取经', '关卡', 'obstacles'], 'obstacles'],
  [['腾云', '飞', 'fly'], 'fly'],
  [['打听', '问', 'ask'], 'ask'],
  [['摸', 'mo'], 'mo'],
  [['跳下', '跳', 'jump'], 'jump'],
  [['接受', '观礼', 'accept'], 'accept'],
  [['回去', 'back'], 'back'],
]

const ascii = (w) => /^[a-z?']+$/i.test(w)
const dirOf = (word) => Object.keys(DIRS).find((d) => DIRS[d].includes(String(word).toLowerCase().replace(/^[往向]/, '').replace(/边$/, '')))

/** The verb a line starts with and the rest: an English verb needs a space or the end after it. */
export function parse(line) {
  const text = String(line ?? '').trim().replace(/\s+/g, ' ').replace(/[。！!]+$/, '')
  if (dirOf(text)) return { verb: 'go', rest: dirOf(text) }
  const ba = text.match(/^把\s*(.+?)\s*(?:交给|给)\s*(.+)$/)
  if (ba) return { verb: 'give', rest: `${ba[2]} ${ba[1]}` }
  const lower = text.toLowerCase()
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

/** The thing `text` starts with among `cands` (`{ key, kind, names }`), longest name first, and what follows. */
function lead(cands, text) {
  let best = null
  const t = text.toLowerCase()
  for (const c of cands) for (const n of c.names) {
    if (n && t.startsWith(n.toLowerCase()) && (!best || n.length > best.n.length)) best = { c, n }
  }
  if (best) return { key: best.c.key, kind: best.c.kind, rest: text.slice(best.n.length).trim() }
  // A part of a name will do: 「掌柜」 for 药铺掌柜.
  const [word, ...more] = text.split(' ')
  const part = word && cands.find((c) => c.names.some((n) => n.length > word.length && n.includes(word)))
  return part ? { key: part.key, kind: part.kind, rest: more.join(' ') } : null
}
const personNames = (w, id) => (isNpc(id) ? [npcData(id).name, ...npcData(id).ids] : [w.players[id].name, nameOf(w, id)])
const thingNames = (w, tid) => [thingName(w, tid), ...(itemOf(w, tid)?.ids ?? []), ...(w.things[tid].id === 'corpse' ? ['尸体', 'corpse', '骸骨'] : [])]
const people = (w, me, room) => peopleIn(w, room).filter((id) => id !== me && !(ch(w, id).ghost && !ch(w, me).ghost)).map((id) => ({ key: id, kind: 'person', names: personNames(w, id) }))
const things = (w, at) => thingsAt(w, at).map((tid) => ({ key: tid, kind: 'thing', names: thingNames(w, tid) }))

const AMOUNT = /^(\d+|[一二两三四五六七八九十百千]+)\s*(?:个|枚|文|两|粒|颗|株|根|把|件|只|张|堆|些)?\s*/
function amount(text) {
  const m = text.match(AMOUNT)
  if (!m || !m[1]) return { n: undefined, rest: text }
  let n = Number(m[1])
  if (Number.isNaN(n)) {
    const D = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
    n = 0; let cur = 0
    for (const ch2 of m[1]) {
      if (D[ch2]) cur = D[ch2]
      else { const u = { 十: 10, 百: 100, 千: 1000 }[ch2]; n += (cur || 1) * u; cur = 0 }
    }
    n += cur
  }
  return { n, rest: text.slice(m[0].length) }
}
/** 钱 / 银子 / 黄金 in what people type. */
const MONEY_WORDS = { 'stock/coin': ['文钱', '钱', '铜钱', 'coin'], 'stock/silver': ['两银子', '银子', '碎银', 'silver'], 'stock/gold': ['两黄金', '黄金', '金子', 'gold'] }
const moneyOf = (text) => Object.entries(MONEY_WORDS).find(([, ws]) => ws.some((w) => text.startsWith(w)))?.[0]

/**
 * Run one command of `me` against the world `s` (left as it is). Returns `{ reply, ops, events }`: what `me` reads,
 * the changes to make (apply), and the log lines they add (already in ops).
 */
export function run(s, me, line, { now = Date.now(), rand = Math.random } = {}) {
  if (!s.players?.[me]) return { reply: '你还不在江湖里。', ops: [], events: [] }
  const w = structuredClone(s)
  const x = ctx(w, me, now, rand)
  advance(x)
  const before = x.out.length
  regen(x, me)
  const p = w.players[me]
  if (!(p.room in ROOMS)) p.room = START
  if (p.out > now) x.out.push('你还昏迷不醒，什么也做不了。')
  else command(x, line)
  if (x.out.length === before) x.out.push(lookText(w, me, now))
  p.at = now
  if (!p.agent) p.here = now
  // Lines go into the log; older ones drop out as new ones come.
  const ops = diff(s, w)
  let t = now
  const added = []
  for (const ev of x.events) {
    const key = logKey(t++, rand)
    ops.push([['log', key], ev])
    added.push({ key, ...ev })
  }
  const keys = sortedLog(s).map(([k]) => k)
  for (const k of keys.slice(0, Math.max(0, keys.length + added.length - LOG_MAX))) ops.push([['log', k], undefined])
  return { reply: x.out.join('\n'), ops, events: added }
}

function command(x, line) {
  const w = x.w
  const me = x.me
  const p = w.players[me]
  const room = p.room
  const { verb, rest } = parse(line)
  const reply = (t) => x.out.push(t)
  const ghostNo = () => { reply('你现在是鬼魂，做不了这件事。快去土地公庙找城隍复活吧！'); return true }
  const roomHook = (v) => HOOKS.room[room]?.[v]?.(x, rest)
  // A world's own command, or its own way with a common one (false: not here).
  if (HOOKS.cmd[verb] && HOOKS.cmd[verb](x, rest) !== false) return

  switch (verb) {
    case null:
      return reply(rest ? `「${rest}」？江湖上没这个说法。输入「帮助」看看能做什么。` : lookText(w, me, x.now))
    case 'help':
      return reply(HELP)
    case 'time':
      return reply(`现在是${timeText(x.now)}，${phaseOf(x.now)[2]}。`)
    case 'look': {
      if (!rest) return reply(lookText(w, me, x.now))
      const t = lead([...people(w, me, room), ...things(w, me), ...things(w, room), ...Object.keys(ROOMS[room].details ?? {}).map((d) => ({ key: d, kind: 'detail', names: [d] }))], rest)
      if (t) return reply(lookAt(x, t))
      if (roomHook('look')) return
      return reply(`你看了半天，没看到「${rest}」。`)
    }
    case 'go': {
      const d = dirOf(rest)
      if (!d) return reply(rest ? `「${rest}」是哪个方向？${exitsLine(w, room)}` : `往哪走？${exitsLine(w, room)}`)
      if (d === '进去' && !ROOMS[room].exits[d] && roomHook('enter')) return
      for (const n of npcsIn(w, room)) if (awake(w, n, x.now) && !p.ghost && HOOKS.npc[baseOf(n)]?.go?.(x, n, d)) return
      const to = ROOMS[room].exits[d]
      if (!to) return reply('这个方向没有出路。')
      if (closed(w, room, d)) return reply(`你必须先把${ROOMS[room].doors[d].name}打开。`)
      return move(x, me, d, to)
    }
    case 'say': {
      const text = rest.slice(0, MAX_SAY)
      if (!text) return reply('你自言自语不知道在说些什么。')
      vision(x, room, `$N说道：${text}`, me, null, { k: 'say', text })
      for (const n of npcsIn(w, room)) if (awake(w, n, x.now)) HOOKS.npc[baseOf(n)]?.say?.(x, n, me, text)
      return
    }
    case 'sayto': {
      const m = rest.match(/^(.+?)\s*说[：:]?\s*(.*)$/)
      const t = m && lead(people(w, me, room), m[1])
      if (!m || !t || t.rest) return reply('对谁说？这样说：对 <这里的人> 说 <话>')
      const text = m[2].slice(0, MAX_SAY)
      if (!text) return reply('你想说什么？')
      vision(x, room, `$N对$n说道：${text}`, me, t.key, { k: 'say', text, to: t.key })
      if (isNpc(t.key) && awake(w, t.key, x.now)) HOOKS.npc[baseOf(t.key)]?.say?.(x, t.key, me, text)
      return
    }
    case 'inv': {
      const mine = thingGroups(w, me).map(([tid, text]) => text + (w.things[tid].eq ? '（装备中）' : ''))
      return reply(mine.length ? `你身上带着：\n  ${mine.join('\n  ')}\n（负重 ${Math.round(load(w, me) * 100 / carriage(w, me))}%）` : '你身上空空如也。')
    }
    case 'get': {
      if (p.ghost) return ghostNo()
      if (!rest) return reply('你要捡起什么东西？')
      const m = rest.match(/^(.+?)\s*(?:从|from)\s*(.+)$/)
      let from = room
      let what = rest
      if (m) {
        const box = lead([...things(w, room), ...things(w, me)], m[2])
        if (!box) return reply(`你找不到 ${m[2]} 这样东西。`)
        from = box.key
        what = m[1]
      }
      if (/^(全部|所有|一切|all)$/.test(what)) {
        const all = thingsAt(w, from).filter((tid) => !itemOf(w, tid)?.noGet && w.things[tid].id !== 'corpse')
        if (!all.length) return reply('这里没有可以拿的东西。')
        for (const tid of all) take(x, tid, from)
        return
      }
      const { rest: what2 } = amount(what)
      const money = moneyOf(what2)
      const none = () => reply(from === room ? '这里没有这样东西。' : '那里面没有这样东西。')
      if (money) {
        const heaps = thingsAt(w, from).filter((tid) => w.things[tid].id === money)
        if (!heaps.length) return none()
        for (const tid of heaps) take(x, tid, from)
        return
      }
      const t = lead(things(w, from), what2)
      if (!t?.key) return none()
      if (HOOKS.item[w.things[t.key].id]?.get?.(x, t.key) === true) return
      return take(x, t.key, from)
    }
    case 'drop': {
      const { n, rest: what } = amount(rest)
      const money = moneyOf(what)
      const t = money ? { key: heap(x, me, money) } : lead(things(w, me), what)
      if (!t?.key) return reply(rest ? '你身上没有这样东西。' : '你要丢弃什么东西？')
      const name = n ? `${cn(n)}${itemOf(w, t.key).baseUnit}${thingName(w, t.key)}` : thingShort(w, t.key)
      moveThing(x, t.key, room, n)
      return vision(x, room, `$N丢下${name}。`, me)
    }
    case 'give': {
      if (p.ghost) return ghostNo()
      const to = lead(people(w, me, room), rest)
      if (!to) return reply(rest ? `这里没有「${rest.split(' ')[0]}」这个人。` : '你要给谁什么东西？')
      const { n, rest: what } = amount(to.rest)
      const money = moneyOf(what)
      const t = money ? { key: heap(x, me, money) } : lead(things(w, me), what)
      if (!t?.key) return reply(to.rest ? '你身上没有这样东西。' : `给${nameOf(w, to.key)}什么？`)
      // One of a stack unless a number is said; money all of it.
      const stack = itemOf(w, t.key)?.baseUnit && !money ? 1 : undefined
      return give(x, to.key, t.key, n ?? stack)
    }
    case 'wear': case 'remove': case 'wield': case 'unwield': {
      if (p.ghost) return ghostNo()
      const t = lead(things(w, me), rest)
      if (!t) return reply(rest ? '你身上没有这样东西。' : '什么？')
      return equip(x, t.key, verb)
    }
    case 'eat': {
      if (p.ghost) return reply('你没有形体，无法进食。')
      const t = lead([...things(w, me), ...things(w, room)], rest)
      if (!t) return reply(rest ? '这里没有这样东西 ...。' : '你要吃什么？')
      return eat(x, t.key)
    }
    case 'drink': case 'fill': {
      if (p.ghost) return reply('你没有形体，喝不了东西。')
      if (roomHook(verb)) return
      const t = lead([...things(w, me), ...things(w, room)], rest.replace(/^(从|from)\s*/, ''))
      if (!t) return reply(rest ? '这里没有这样东西 ...。' : '你要喝什么？')
      return verb === 'drink' ? drink(x, t.key) : fill(x, t.key)
    }
    case 'list': {
      const v = npcsIn(w, room).find((n) => npcData(n).sells && awake(w, n, x.now))
      if (!v) return reply('这里没有人做买卖。')
      const rows = Object.entries(npcData(v).sells).map(([key, n]) => {
        const left = n - Object.keys(w.sold).filter((k) => k.startsWith(`${baseOf(v)}|${key}|`)).length
        const it = ITEMS[key]
        return left > 0 ? `${it.baseUnit ? '一' + it.baseUnit : '一' + (it.unit ?? '个')}${it.name}：${priceText(it.baseValue ?? it.value ?? 0)}` : null
      }).filter(Boolean)
      return reply(rows.length ? `你可以向${nameOf(w, v)}购买下列这些东西：\n-------------------------\n${rows.join('\n')}` : `${nameOf(w, v)}的货物已经全部卖光了，下次早一点来吧！`)
    }
    case 'buy': return buy(x, rest)
    case 'convert': return convert(x, rest)
    case 'fight': case 'kill': {
      if (p.ghost) return reply('人死了就一了百了，快去找城隍复活吧!!')
      const t = lead(people(w, me, room), rest)
      if (!t) return reply(rest ? '这里没有这个人。' : verb === 'fight' ? '你想攻击谁？' : '你想杀谁？')
      return attackCmd(x, t.key, verb)
    }
    case 'halt':
      delete p.killing
      return reply(p.challenge ? (delete p.challenge, '你收回了挑战。') : '你现在并没有在战斗。')
    case 'follow': {
      if (!rest || /^(无|none|不跟了)$/.test(rest)) { delete p.follow; return reply('你决定不再跟随任何人。') }
      const t = lead(people(w, me, room), rest)
      if (!t) return reply(`这里没有 ${rest}。`)
      p.follow = t.key
      return vision(x, room, '$N决定开始跟随$n一起行动。', me, t.key, { to: t.key })
    }
    case 'team': {
      if (/^(with|和)\s*/.test(rest)) return teamWith(x, rest.replace(/^(with|和)\s*/, ''))
      if (/^(dismiss|解散)/.test(rest)) return teamLeave(x)
      if (!p.team) return reply('你现在并没有参加任何队伍。')
      const ms = Object.entries(w.players).filter(([, q]) => q.team === p.team).map(([id]) => `${who(w, id, me)}（${ROOMS[ch(w, id).room]?.name}）`)
      return reply(`你现在队伍中的成员有：\n  ${ms.join('\n  ')}`)
    }
    case 'teamwith': return teamWith(x, rest)
    case 'teamleave': return teamLeave(x)
    case 'tt': {
      if (!p.team) return reply('你现在并没有和别人组成队伍。')
      if (!rest) return reply('你想对队友说什么？')
      vision(x, room, `【队伍】$N：${rest.slice(0, MAX_SAY)}`, me, null, { k: 'team', team: p.team })
      return
    }
    case 'hp': return reply(hpText(w, me))
    case 'score': return reply(scoreText(w, me))
    case 'skills': {
      const sk = Object.entries(p.skills).filter(([, v]) => v > 0)
      const learning = Object.entries(p.learned).filter(([k, v]) => v > 0 && !p.skills[k])
      if (!sk.length && !learning.length) return reply('你目前并没有学会任何技能。')
      return reply(['你目前学过的技能：', ...sk.map(([k, v]) => `  ${skillName(k)}(${k})　${v} 级`), ...learning.map(([k]) => `  ${skillName(k)}(${k})　刚入门`)].join('\n'))
    }
    case 'apprentice': case 'acquire': {
      if (p.ghost) return ghostNo()
      const t = lead(people(w, me, room).filter((c) => isNpc(c.key)), rest)
      if (!t) return reply(verb === 'apprentice' ? '你要拜谁为师？' : '你要向谁请教？')
      const hook = HOOKS.npc[baseOf(t.key)]?.[verb]
      if (verb === 'apprentice') vision(x, room, '$N想要拜$n为师。', me, t.key)
      if (!hook || !hook(x, t.key, t.rest)) reply(verb === 'apprentice' ? `${nameOf(w, t.key)}似乎没有收你为徒的打算。` : `${nameOf(w, t.key)}似乎不愿意教你这个。`)
      return
    }
    case 'steal': return steal(x, rest)
    case 'open': case 'close': {
      if (roomHook(verb)) return
      const d = Object.keys(ROOMS[room].doors ?? {})[0]
      if (!d) return reply('这里没有门。')
      if (verb === 'open' && ROOMS[room].doors[d].locked && closed(w, room, d)) return reply(ROOMS[room].doors[d].locked)
      const isClosed = closed(w, room, d)
      if ((verb === 'open') !== isClosed) return reply(`${ROOMS[room].doors[d].name}已经是${isClosed ? '关' : '开'}着的了。`)
      setDoor(x, room, d, verb === 'close')
      return vision(x, room, `$N把${ROOMS[room].doors[d].name}${verb === 'open' ? '打开' : '关上'}了。`, me)
    }
    case 'who': {
      const rows = Object.entries(w.players).map(([id, q]) => `${who(w, id, me)}${q.agent ? '（agent）' : ''}：${ROOMS[q.room]?.name ?? ''}`)
      return reply(rows.length ? rows.join('\n') : '江湖上还没有人。')
    }
    case 'climb': case 'enter': case 'search': case 'sit': case 'load': case 'request': {
      if (verb === 'enter' && room === 'small_temple' && /漩涡|swirl/.test(rest)) return revive(x)
      if (p.ghost && verb !== 'enter') return ghostNo()
      if (roomHook(verb)) return
      if (verb === 'search') return reply(rest ? `你仔细找了找 ${rest}，但是啥特别的东西也没找到。` : '你仔细四处翻翻找找，但没看到啥特别的东西。')
      return reply('什么？')
    }
  }
  return reply(HELP)
}

// ── things in hand ───────────────────────────────────────────────────────────────────────────────────────────────

/** A heap not on you is taken whole: others may be taking from it at this moment (see moveThing). */
function take(x, tid, from) {
  const w = x.w
  const me = x.me
  const it = itemOf(w, tid)
  if (it?.noGet || w.things[tid].id === 'corpse') return x.out.push('这个东西拿不起来。')
  if (thingsAt(w, me).length >= 20) return x.out.push('你身上已经没有空位再携带其他东西了。')
  if (load(w, me) + weightOf(w, tid) > carriage(w, me)) return x.out.push(`${thingName(w, tid)}现在对你来说太重了。`)
  const name = thingShort(w, tid)
  const fromName = from === ch(w, me).room ? '' : thingName(w, from)
  moveThing(x, tid, me)
  vision(x, ch(w, me).room, fromName ? `$N从${fromName}中拿出${name}。` : `$N捡起${name}。`, me)
}

/** give.lpc: to a player it is theirs; a townsperson takes it only if they want it (accept_object). */
export function give(x, to, tid, n) {
  const w = x.w
  const me = x.me
  const room = ch(w, me).room
  const it = itemOf(w, tid)
  const name = n && it?.baseUnit ? `${cn(n)}${it.baseUnit}${thingName(w, tid)}` : thingShort(w, tid)
  if (isNpc(to)) {
    const hook = HOOKS.npc[baseOf(to)]?.accept
    if (!awake(w, to, x.now) || !hook) return x.out.push(`看起来${nameOf(w, to)}并不愿意收下这${it?.unit ?? '个'}${thingName(w, tid)}。`)
    const moved = moveThing(x, tid, to, n)
    vision(x, room, `$N拿出${name}交给$n。`, me, to)
    if (!hook(x, to, moved)) {
      moveThing(x, moved, me)
      x.out.push(`看起来${nameOf(w, to)}并不愿意收下这${it?.unit ?? '个'}${thingName(w, tid)}。`)
    }
    return
  }
  if (thingsAt(w, to).length >= 20 || load(w, to) + weightOf(w, tid) > carriage(w, to)) return x.out.push(`${nameOf(w, to)}已经负荷过重，再也搬不动任何东西了。`)
  moveThing(x, tid, to, n)
  vision(x, room, `$N拿出${name}交给$n。`, me, to, { k: 'give', to })
}

const SLOT_WORD = { cloth: '穿上', armor: '穿上', head_eq: '戴上', feet_eq: '穿上', waist_eq: '系上' }
function equip(x, tid, verb) {
  const w = x.w
  const me = x.me
  const room = ch(w, me).room
  const t = w.things[tid]
  const it = itemOf(w, tid) ?? {}
  if (verb === 'wear') {
    if (!it.wearAs) return x.out.push('你不能穿戴这一种护具。')
    if (t.eq) return x.out.push('你已经装备着了。')
    if (thingsAt(w, me).some((o) => w.things[o].eq === 'wear' && itemOf(w, o)?.wearAs === it.wearAs)) return x.out.push('你已经穿戴同类的护具了。')
    t.eq = 'wear'
    return vision(x, room, `$N${SLOT_WORD[it.wearAs] ?? '装备'}一${it.unit ?? '件'}${thingName(w, tid)}。`, me)
  }
  if (verb === 'remove' || verb === 'unwield') {
    if (!t.eq) return x.out.push('你并没有装备这样东西。')
    delete t.eq
    return vision(x, room, verb === 'remove' ? `$N将${thingName(w, tid)}脱了下来。` : `$N放下手中的${thingName(w, tid)}。`, me)
  }
  if (!it.wieldAs) return x.out.push('这样东西不能当作武器。')
  if (t.eq) return x.out.push('你已经装备着了。')
  if (thingsAt(w, me).some((o) => w.things[o].eq === 'wield')) return x.out.push('你的双手都没有空可以装备这个武器。')
  // humanoid.c valid_wield: 膂力 against the weapon's weight.
  const two = [it.wieldAs].flat().every((a) => a.startsWith('twohanded'))
  const need = Math.floor((it.weight ?? 0) / (two ? 1000 : 500))
  const str = attr(w, me, 'str')
  if (str < need - 1) return x.out.push(`这${it.unit}${thingName(w, tid)}对你来说太重了，你根本挥不动这么沉重的兵刃。`)
  t.eq = 'wield'
  vision(x, room, `$N装备${thingName(w, tid)}作武器。`, me)
  x.out.push(str > need + 6 ? `这${it.unit}${thingName(w, tid)}拿在手里轻飘飘的，不是十分趁手。` : str >= need ? `这${it.unit}${thingName(w, tid)}的重量对你来说刚刚好，相当趁手。` : `这${it.unit}${thingName(w, tid)}的份量重了点，不过你勉强使得动。`)
}

/** feature/food.c, and the medicines' own stuff_ob (obj/medication). */
const MEDICINE = {
  'stock/black_pill': { room: 5, msg: '$N吞下一粒黑黑的药丸。', fx: (c) => { consume(c, 'water', 30); c.food.cur += 5; c.sen.eff = Math.max(0, c.sen.eff - 1); consume(c, 'sen', 4); supplement(c, 'gin', 15); supplement(c, 'kee', 15) } },
  'stock/boar_berry': { room: 20, msg: '$N吃下一颗发着恶臭的山猪果 ... 天啊，$N竟然吞得下去 .... 。', fx: (c) => { c.food.cur += 10; consume(c, 'water', 20); heal(c, 'sen', 15); supplement(c, 'sen', 10) } },
  'stock/dragon_saliva': { room: 10, msg: '$N拿出一株龙涎草放入口中嚼了嚼吞了下去。', fx: (c) => { consume(c, 'water', 10); c.food.cur += 10; consume(c, 'sen', 3); heal(c, 'kee', 30) } },
  'stock/wild_ginseng': { room: 50, msg: '$N拿出一株野山参放入口中嚼了嚼吞了下去。', fx: (c) => { c.food.cur += 50; heal(c, 'gin', 5); heal(c, 'kee', 5); heal(c, 'sen', 5) } },
}
function eat(x, tid) {
  const w = x.w
  const me = x.me
  const c = w.players[me]
  const t = w.things[tid]
  const it = itemOf(w, tid) ?? {}
  const med = MEDICINE[t.id]
  if (HOOKS.item[t.id]?.eat?.(x, tid)) return
  if (med) {
    if (c.food.max - c.food.cur < med.room) return x.out.push('你的肚子已经撑得什么东西也吞不下去了。')
    vision(x, c.room, med.msg, me)
    med.fx(c)
    c.food.cur = Math.min(c.food.max, c.food.cur)
  } else if (it.foodStuff) {
    if (c.food.cur + it.foodStuff > c.food.max) return x.out.push(`你的肚子已经装不下这${it.baseUnit ?? it.unit}${thingName(w, tid)}了。`)
    vision(x, c.room, `$N吃下一${it.baseUnit ?? it.unit}${thingName(w, tid)}。`, me)
    c.food.cur += it.foodStuff
    if (it.bites > 1 && (t.bites = (t.bites ?? it.bites) - 1) > 0) return x.out.push(`${thingName(w, tid)}还剩下${cn(t.bites)}口。`)
    if (it.healKee) { supplement(c, 'kee', it.healKee); x.out.push('你吃了营养的食物，觉得气力恢复了一些。') }
  } else return x.out.push('这样东西不能吃。')
  if ((t.n ?? 1) > 1) t.n -= 1
  else destroy(x, tid)
}

/** feature/drink.c: a third of what one can hold, from something holding water. */
function drink(x, tid) {
  const w = x.w
  const c = w.players[x.me]
  const t = w.things[tid]
  const it = itemOf(w, tid) ?? {}
  if (t.water === undefined && it.water) t.water = it.water
  if (!it.liquidContainer && t.water === undefined) return x.out.push(`${thingName(w, tid)}并不是装水的容器。`)
  if (t.water === 0) return x.out.push(`${thingName(w, tid)}里没有任何能喝的东西。`)
  if (c.water.cur >= c.water.max) return x.out.push('你已经涨得喝不下一滴水了。')
  c.water.cur = Math.min(c.water.max, c.water.cur + Math.floor(c.water.max / 3))
  if (t.water !== undefined) t.water -= 1
  vision(x, c.room, `$N从${thingName(w, tid)}喝了几口${it.liquid ?? '水'}。`, x.me)
}
/** fill: a bottle from the water vat (or the river). */
function fill(x, tid) {
  const w = x.w
  const room = w.players[x.me].room
  const t = w.things[tid]
  if (t.id !== 'stock/bottle') return x.out.push(`${thingName(w, tid)}不能装水。`)
  const src = thingsAt(w, room).find((o) => itemOf(w, o)?.liquidContainer) ?? (ROOMS[room].water ? 'river' : null)
  if (!src) return x.out.push('这附近没有水可以装。')
  t.water = 5
  vision(x, room, `$N将${thingName(w, tid)}装满了水。`, x.me)
}

function buy(x, rest) {
  const w = x.w
  const me = x.me
  const room = w.players[me].room
  const v = npcsIn(w, room).find((n) => npcData(n).sells && awake(w, n, x.now))
  if (!v) return x.out.push('你要跟谁买东西？')
  const sells = npcData(v).sells
  const want = rest.replace(/^(一|1)\s*(个|把|件|顶|粒|颗|株|根|只|片|份)?\s*/, '').replace(/\s*(from|向|跟).*$/, '')
  const key = Object.keys(sells).find((k) => [ITEMS[k].name, ...ITEMS[k].ids].some((n) => n.toLowerCase() === want.toLowerCase()))
    ?? Object.keys(sells).find((k) => ITEMS[k].name.includes(want) && want)
  if (!key) return x.out.push(`${nameOf(w, v)}并没有卖 ${want || '什么'} 这种东西。`)
  // One key a sale in one map that is always there, not a count: two buying at once both count.
  const shelf = `${baseOf(v)}|${key}|`
  if (Object.keys(w.sold).filter((k) => k.startsWith(shelf)).length >= sells[key]) return x.out.push(`${ITEMS[key].name}已经卖完了，待会儿再来吧。`)
  const it = ITEMS[key]
  const price = it.baseValue ?? it.value ?? 0
  const paid = pay(x, me, price)
  if (paid === 0) return x.out.push('你身上的钱不够。')
  if (paid === 2) return x.out.push('你没有足够的零钱，而对方也找不开...。')
  const tid = makeThing(x, key, me, 1)
  w.sold[shelf + tid] = 1
  if (key === 'stock/bottle') w.things[tid].water = 0
  vision(x, room, `$N向$n买下一${it.baseUnit ?? it.unit ?? '个'}${it.name}。`, me, v)
  HOOKS.npc[baseOf(v)]?.sold?.(x, v, me, tid)
}

/** std/room/bank.c convert, at 鱼记小铺: coins, silver and gold at 1, 100, 10000. */
function convert(x, rest) {
  const w = x.w
  const me = x.me
  const room = w.players[me].room
  if (room !== 'bazar') return x.out.push('这里没有钱庄。')
  const m = rest.match(/^(.+?)\s*(?:成|换成|to)\s*(.+)$/)
  if (!m) return x.out.push('这样兑换：兑换 <数量> <钱币> 成 <钱币>，比如：兑换 100 文钱 成 银子')
  const { n, rest: what } = amount(m[1])
  const from = moneyOf(what)
  const to = moneyOf(m[2])
  if (!n || !from || !to || from === to) return x.out.push('这样兑换：兑换 <数量> <钱币> 成 <钱币>，比如：兑换 100 文钱 成 银子')
  const V = { 'stock/coin': 1, 'stock/silver': 100, 'stock/gold': 10000 }
  if ((purse(w, me)[from] ?? 0) < n) return x.out.push(`你身上没有那么多${ITEMS[from].name}。`)
  const value = n * V[from]
  if (value % V[to]) return x.out.push('这些钱换不成整数，换个数目吧。')
  const tid = heap(x, me, from)
  destroy(x, moveThing(x, tid, 'gone', n))
  makeThing(x, to, me, value / V[to])
  vision(x, room, `$N把${cn(n)}${ITEMS[from].baseUnit}${ITEMS[from].name}换成了${cn(value / V[to])}${ITEMS[to].baseUnit}${ITEMS[to].name}。`, me)
}

// ── fights, teams, stealing ──────────────────────────────────────────────────────────────────────────────────────

/** fight.c / kill.lpc, then the fight itself. */
function attackCmd(x, t, verb) {
  const w = x.w
  const me = x.me
  const room = w.players[me].room
  const c = ch(w, t)
  if (c.ghost) return x.out.push('你的攻击从对方身上穿透过去。')
  if (verb === 'fight') {
    if (ROOMS[room].noFight) return x.out.push('这里禁止战斗。')
    if (!isNpc(t)) {
      // Both players must ask: the second one starts it.
      if (c.challenge === me) {
        delete c.challenge
        return brawl(x, me, t, 'fight', [[`$N对着$n说道：在下${nameOf(w, me)}，领教这位朋友的高招！`, me, t]])
      }
      w.players[me].challenge = t
      vision(x, room, `$N对着$n说道：在下${nameOf(w, me)}，领教这位朋友的高招！`, me, t, { k: 'attack', to: t })
      return x.out.push(`由于对方是由玩家控制的人物，你必须等对方同意才能进行比试（对方也要对你「比武」）。`)
    }
    if (!awake(w, t, x.now)) return x.out.push(`${nameOf(w, t)}现在没有办法和你比试。`)
    const hook = HOOKS.npc[baseOf(t)]?.fight
    const answer = hook ? hook(x, t) : defaultAcceptFight(x, t)
    if (answer === 'kill') return brawl(x, t, me, 'kill', [[`$N对着$n说道：在下${nameOf(w, me)}，领教这位朋友的高招！`, me, t]])
    if (!answer) return x.out.push(`看起来${nameOf(w, t)}并不想跟你较量。`)
    return brawl(x, me, t, 'fight', [[`$N对着$n说道：在下${nameOf(w, me)}，领教这位朋友的高招！`, me, t]])
  }
  if (ROOMS[room].noFight) return x.out.push('这里不准战斗。')
  const rude = pick(x, ['今日不是你死就是我活', '纳命来', '明年的今天就是你的忌日'])
  const lead = [[`$N对着$n喝道：「家伙！${rude}！」`, me, t]]
  if (isNpc(t)) {
    HOOKS.npc[baseOf(t)]?.kill?.(x, t, me, lead)
    if (npcData(t).kind.includes('villager') && !HOOKS.npc[baseOf(t)]?.kill) lead.push([`${nameOf(w, t)}说道：咦？怎么动起粗来了？救命哪 ...`])
  } else {
    // Players kill players as in ES2, but only someone here now: never an agent, never someone away.
    if (c.agent) return x.out.push(`${nameOf(w, t)}是 agent，玩家之间不能对 agent 下杀手；想较量就找它「比武」。`)
    if (!online(w, t, x.now)) return x.out.push(`${nameOf(w, t)}现在不在线，不能对不在线的人下杀手。`)
    ;(w.players[me].killing ??= {})[t] = true
  }
  brawl(x, me, t, 'kill', lead)
  if (!isNpc(t)) vision(x, room, '', me, t, { k: 'attack', to: t, t: '看起来$N想杀死$n！' })
}

/** F_VILLAGER refuses with a shake or a word; F_FIGHTER takes a spar; F_BANDIT turns it into a kill. */
function defaultAcceptFight(x, t) {
  const d = npcData(t)
  if (d.kind.includes('bandit')) { npcSay(x, t, pick(x, ['哈！看来你是活得不耐烦了，让我来教训教训你！', '「哼」地一声，那得瞧你有没有这个本事！'])); return 'kill' }
  if (d.kind.includes('fighter')) { npcSay(x, t, '不敢，请赐招！'); return true }
  if (d.kind.includes('soldier')) { npcSay(x, t, '走开走开！'); return false }
  const r = rnd(x, 5)
  if (r === 0) emote(x, t, EMOTES.shake)
  else if (r === 1) emote(x, t, EMOTES['?'])
  else if (r === 2) emote(x, t, EMOTES.smile)
  else vision(x, ch(x.w, t).room, `${nameOf(x.w, t)}武功我可不会，失礼了。`)
  return false
}

/** How long an invitation to a team stands. */
const INVITE_FOR = 5 * 60_000

/**
 * cmds/std/team.c `team with`: ask someone, or answer someone who asked. A leader who answers takes the asker in, with
 * the asker's own team if they lead one; someone without a team joins the asker's. An invitation lapses after
 * INVITE_FOR and with any change to the asker's team.
 */
function teamWith(x, rest) {
  const w = x.w
  const me = x.me
  const p = w.players[me]
  const t = lead(people(w, me, p.room).filter((c) => !isNpc(c.key)), rest)
  if (!t) return x.out.push('你想和谁成为伙伴？')
  const o = w.players[t.key]
  const asked = o.invite === me && x.now - (o.invitedAt ?? 0) < INVITE_FOR && (!o.team || o.team === t.key)
  if (asked) {
    if (p.team && p.team !== me) return x.out.push('你已经在别人的队伍里了，先「离队」才能加入别的队伍。')
    if (p.team === me) {
      for (const q of [t.key, ...membersOf(w, t.key)]) setTeam(w, q, me)
      return vision(x, p.room, '$N决定让$n加入队伍。', me, t.key, { to: t.key })
    }
    setTeam(w, t.key, t.key)
    setTeam(w, me, t.key)
    return vision(x, p.room, '$N决定加入$n的队伍。', me, t.key, { to: t.key })
  }
  if (p.team && p.team !== me) return x.out.push('只有队伍领袖可以邀请别人加入。')
  p.invite = t.key
  p.invitedAt = x.now
  vision(x, p.room, '$N邀请$n加入$P的队伍。', me, t.key, { to: t.key })
  tell(x, t.key, `如果你愿意加入，请用「组队 ${p.name}」。`)
}
const membersOf = (w, leader) => Object.keys(w.players).filter((id) => id !== leader && w.players[id].team === leader)
/** A player into a team (or out, with none); whatever they had asked lapses. */
function setTeam(w, id, team) {
  const q = w.players[id]
  if (team) q.team = team
  else delete q.team
  delete q.invite
  delete q.invitedAt
}
function teamLeave(x) {
  const w = x.w
  const p = w.players[x.me]
  if (!p.team) return x.out.push('你现在并没有参加任何队伍。')
  const team = p.team
  if (team === x.me) {
    for (const id of [x.me, ...membersOf(w, x.me)]) setTeam(w, id, null)
    vision(x, p.room, '$N将队伍解散了。', x.me, null, { k: 'team', team })
  } else {
    vision(x, p.room, '$N决定脱离队伍。', x.me, null, { k: 'team', team })
    setTeam(w, x.me, null)
  }
}

/** steal.c: 妙手空空之技 against how watchful the other is; caught, a townsperson turns on you. */
function steal(x, rest) {
  const w = x.w
  const me = x.me
  const room = w.players[me].room
  if (ROOMS[room].noFight) return x.out.push('这里禁止行窃。')
  const m = rest.match(/^(.+?)\s*(?:从|from)\s*(.+)$/)
  if (!m) return x.out.push('这样偷：偷 <东西> 从 <人>')
  const t = lead(people(w, me, room), m[2])
  if (!t) return x.out.push('你想行窃的对象不在这里。')
  if (!skillLv(w, me, 'stealing', true)) return x.out.push('你必须学会妙手空空之技才能行窃!')
  const money = moneyOf(m[1])
  // Money is taken a whole heap at a time, never gathered or split: the heap is theirs to write (see moveThing).
  const tid = money ? thingsAt(w, t.key).find((c) => w.things[c].id === money) : lead(things(w, t.key).filter((c) => !w.things[c.key].eq), m[1])?.key
  if (!tid) return x.out.push(`${nameOf(w, t.key)}身上看起来没有什么值钱的东西好偷。`)
  const mine = skillLv(w, me, 'stealing') * 2 + attr(w, me, 'dex')
  const theirs = Math.floor(attr(w, t.key, 'cps') * attr(w, t.key, 'spi') / 10) + levelOf(w, t.key)
  x.out.push(`你不动声色地慢慢靠近${nameOf(w, t.key)}，等待机会下手 ...`)
  if (rnd(x, mine + theirs) < mine) {
    const n = money ? w.things[tid].n ?? 1 : undefined
    const what = `${n ? cn(n) + itemOf(w, tid).baseUnit : '一' + (itemOf(w, tid)?.unit ?? '个')}${thingName(w, tid)}`
    moveThing(x, tid, me)
    improve(x, me, 'stealing', 1)
    // A player robbed is told (and an agent woken): nothing of theirs goes without a word.
    if (!isNpc(t.key)) tell(x, t.key, `你忽然觉得身上一轻，发现${what}不见了 —— ${nameOf(w, me)}刚刚从你身边走开。`, { k: 'steal', to: t.key })
    return x.out.push(`得手了！\n你成功地偷到${what}！`)
  }
  vision(x, room, `$N一回头，正好发现$n的手正抓着$N身上的${thingName(w, tid)}！\n$N喝道：「干什么！」`, t.key, me, { to: t.key })
  if (isNpc(t.key) && !npcData(t.key).kind.includes('villager')) brawl(x, t.key, me, 'kill')
}

/** 土地公庙's swirl (std/room/temple.c, chard.c make_living): alive again; if the corpse is gone, 气 −10%. */
function revive(x) {
  const w = x.w
  const p = w.players[x.me]
  if (!p.ghost) return x.out.push('你走进漩涡的中央，但甚么事都没有发生。')
  x.out.push('你觉得一阵晕眩 ...')
  const corpse = Object.values(w.things).some((t) => t.id === 'corpse' && t.of === x.me)
  if (!corpse) { p.kee.max = Math.max(10, Math.floor(p.kee.max * 0.9)); x.out.push('你的尸体已经化成灰了，你觉得元气大伤。') }
  delete p.ghost
  delete p.diedAt
  for (const k of ['gin', 'kee', 'sen']) { p[k].eff = p[k].max; p[k].cur = p[k].max }
  p.hp.cur = p.hp.max
  vision(x, p.room, '$N从漩涡中走了出来，又活过来了。', x.me)
}

// ── status ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** hp.c */
export function hpText(w, id) {
  const c = ch(w, id)
  const f = (k) => `${c[k].cur}/${c[k].eff}${c[k].max !== undefined && c[k].eff !== c[k].max ? `(${c[k].max})` : ''}`
  return [
    `形体 ${c.hp.cur}/${c.hp.max}　精 ${f('gin')}　气 ${f('kee')}　神 ${f('sen')}`,
    `食物 ${c.food.cur}/${c.food.max}　饮水 ${c.water.cur}/${c.water.max}`,
    ...(c.ghost ? ['你现在是鬼魂。'] : []),
  ].join('\n')
}
/** score.lpc */
export function scoreText(w, id) {
  const p = w.players[id]
  const money = wealth(w, id)
  return [
    `【${CLASS_NAMES[p.cls] ?? p.cls}】${p.title ? p.title + ' ' : ''}${p.name}　${p.level} 级`,
    Object.entries(ATTR_NAMES).map(([k, n]) => `${n} ${attr(w, id, k)}`).join('　'),
    hpText(w, id),
    `身上的钱：${money ? priceParts(money) : '没有'}`,
    ...Object.entries(p.score).filter(([, v]) => v).map(([k, v]) => `${SCORE_NAMES[k] ?? k}：${v}`),
  ].join('\n')
}
const priceParts = (v) => [[10000, '两黄金'], [100, '两银子'], [1, '文钱']].map(([u, n]) => { const k = Math.floor(v / u); v %= u; return k ? `${cn(k)}${n}` : '' }).join('')

/**
 * The changes that bring `me` into the world, or update their name: a new player starts in 客栈大堂.
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
  const w = structuredClone(s)
  const x = ctx(w, me, now, rand)
  w.players[me] = newPlayer(x, name, agent)
  vision(x, START, '$N走进了饮风客栈。', me)
  arrive(x, me)
  const ops = diff(s, w)
  let t = now
  for (const ev of x.events) ops.push([['log', logKey(t++, rand)], ev])
  return ops
}

export { hpText as statusText }

const BARS = [['精', 'gin'], ['气', 'kee'], ['神', 'sen'], ['体', 'hp'], ['食', 'food'], ['水', 'water']]
/** The page's status bars, [label, {cur, max}]: 精气神, body, food and water, or another world's own; one missing is left out. */
export const statBars = (p) => HOOKS.bars?.(p) ?? BARS.filter(([, k]) => p[k]).map(([label, k]) => [label, p[k]])

// ── the first steps (the page's 下一步 line): the starting errand only, nothing of the town's stories ──────────────

/** The first direction of the shortest way from room `from` to room `to`, or null. */
export function wayTo(from, to) {
  const first = new Map([[from, null]])
  const queue = [from]
  while (queue.length && !first.has(to)) {
    const r = queue.shift()
    for (const [d, n] of Object.entries(ROOMS[r]?.exits ?? {})) if (ROOMS[n] && !first.has(n)) { first.set(n, first.get(r) ?? d); queue.push(n) }
  }
  return first.get(to) ?? null
}

/** What a newcomer might do next, [words, the command that does it]: earn wages at the warehouse, then eat. */
function nextStep(w, me) {
  const p = w.players?.[me]
  if (!p || p.ghost || p.agent) return null
  const other = HOOKS.hint?.(w, me) // another world's first steps
  if (other !== undefined) return other
  const go = (to, what) => {
    if (p.room === to) return null
    const d = wayTo(p.room, to)
    if (!d) return [what, null]
    return closed(w, p.room, d) ? [`${what}（先「开门」，再往${d}）`, '开门'] : [`${what}（往${d}）`, d]
  }
  if (p.temp?.wage) return go('store', '回货栈对工头说「工钱」') ?? ['对工头说「工钱」领钱，或者再扛一箱', '对 工头 说 工钱']
  if (thingsAt(w, me).some((t) => w.things[t].id === 'crate')) return go('store', '把木箱扛回货栈') ?? ['装车 木箱', '装车 木箱']
  if (!wealth(w, me)) return go('store', '身上还没钱：先去货栈帮工头装货挣工钱') ?? ['拿 木箱，再 装车 木箱；装完对工头说「工钱」', '拿 木箱']
  if (p.food.cur < p.food.max * 0.6) return go('inn_hall', '有钱了：回客栈买点吃的') ?? ['买 包子，再 吃 包子', '买 包子']
  return null
}
/** The 下一步 line's words, null once a newcomer is on their way. */
export const hintFor = (w, me) => nextStep(w, me)?.[0] ?? null
/** What tapping the 下一步 line does. */
export const hintStep = (w, me) => nextStep(w, me)?.[1] ?? null
