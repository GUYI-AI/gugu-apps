// The fourth obstacle of the road west, 乌鸡国／宝林寺 (xyj.js, d/qujing/wuji), from 西游记 4.5:
// - the drowned king's ghost comes to one who sleeps uneasy at night in 宝林寺's 西厢房 and leaves a 金厢白玉圭
//   (westroom.c, npc/king.c, obj/jade.c); the queen knows it (npc/queen.c), and the prince, given it, either takes
//   the thief for a thief or knows it and hands over 乌鸡精 (npc/prince.c, obj/jing.c);
// - the 芭蕉 of the 御花园 felled with an axe to the well (yuhua.c), 井龙王 called up in the 水晶宫 by those who stay
//   (shuijing.c, npc/longwang.c), the king's body raised and brought back to life with the 乌鸡精 (obj/kingbody.c);
// - the king led to his hall past the 护宫卫士 (wall*.c, zym.c, npc/weishi.c), where the false king — 青毛狮子 —
//   falls on him and is beaten (palace.c, npc/kingfake.c), and the true one calls it done (npc/kingreal.c).
// With the town about it: the temple's 守寺僧 (temple.c), the inn (kezhan.c, up.c), 山姬 of the 山路 (npc/shanji.c),
// the townsfolk who wander only within the walls (people.c; eastgate.c, nstreet2.c, house.c, zym.c).
// What is not XYJ's (SOURCE.md): numbers set to this game's fights (TUNE), deeds for the team in the room, call_outs
// at their means; the 900 s of the 西厢房 and the 水晶宫 end sooner if the town resets.
import {
  HOOKS, ROOMS, NPCS, ITEMS, ch, isNpc, baseOf, nameOf, thingsAt, makeThing, moveThing, destroy, vision, tell, npcSay,
  playersIn, npcsIn, spawnNpc, awake, online, isMoney, thingName,
} from './world.js'
import { EMOTES, gameTime } from './text.js'
import { brawl, knockOut } from './fight.js'
import { setDoor, move, lead, personNames } from './game.js'
import { self, PLACES, NO_WAY, FLY, later, cancel, TIMERS } from './xyj-story.js'
import { party, flags, pass, tune } from './xyj-road.js'

const N = HOOKS.npc
const R = HOOKS.room
const C = HOOKS.cmd
const WJ = 'x/qujing/wuji/'
const rnd = (x, n) => (n > 0 ? Math.floor(x.rand() * n) : 0)
/** The person of xyj.js someone is, without the room (`@wall2`) or the roll (`#2`) the data adds. */
const kindOf = (id) => baseOf(id).split(/[@#]/)[0]
const here = (w, room, k) => npcsIn(w, room).filter((n) => kindOf(n) === WJ + 'npc/' + k)
const awakeHere = (x, room, k) => here(x.w, room, k).filter((n) => awake(x.w, n, x.now))
const has = (w, at, key) => thingsAt(w, at).find((t) => w.things[t].id === key)
/** An NPC of a call_out gone (destruct), with what it carried. */
function gone(x, id) {
  for (const t of thingsAt(x.w, id)) destroy(x, t)
  delete x.w.npcs[id]
}
/** A corpse just made of `id` gone too (die() that destructs instead). */
function noCorpse(x, id) {
  for (const t of thingsAt(x.w, ch(x.w, id).room)) if (x.w.things[t].id === 'corpse' && x.w.things[t].of === id) destroy(x, t)
}
// emoted.o is not in the source: the few emotes these people make, in plain words of our own (others from text.js).
const EMOTE = {
  ah: ['$N「啊」的一声。', '$N对$n「啊」的一声。'], hi: ['$N向大家打了个招呼。', '$N向$n打了个招呼。'],
  sigh: ['$N叹了一口气。', '$N对着$n叹了一口气。'], thank: ['$N向大家道谢。', '$N向$n道谢。'],
  shake: ['$N摇了摇头。', '$N对$n摇了摇头。'], hmm: EMOTES.hmm, '?': EMOTES['?'], giggle: EMOTES.giggle,
}
const emote = (x, id, e, at = null) => vision(x, ch(x.w, id).room, EMOTE[e][at ? 1 : 0], id, at)

const TEMPLE = WJ + 'temple'
const WEST = WJ + 'westroom'
const YUHUA = WJ + 'yuhua'
const WELL = WJ + 'well'
const SHUIJING = WJ + 'shuijing'
const PALACE = WJ + 'palace'
const ZYM = WJ + 'zym'
const GHOST = `n:${WJ}npc/king`
const LONGWANG = `n:${WJ}npc/longwang`
const JADE = WJ + 'obj/jade'
const JING = WJ + 'obj/jing'
const BODY = WJ + 'obj/kingbody'
const GIVEN = 900_000 // westroom.c, shuijing.c set_given: once in 900 s (or till the town resets)

Object.assign(PLACES, { 乌鸡国: WJ + 'square', 宝林寺: TEMPLE })
NO_WAY.push(/wuji\/(well|shuijing)$/)
// fly.c: 乌鸡国 lands on its square.
Object.assign(FLY, { wuji: WJ + 'square', 乌鸡国: WJ + 'square' })

// ── the numbers ────────────────────────────────────────────────────────────────────────────────────────────────

// As 宝象国's and 平顶山's (xyj-road.js): skills in proportion, 气血 in this game's terms. The 卫士 come three and two at
// a time with spears, the prince with a golden blade; the false king is fought beside the true one. Played out in
// test/xyj-wuji.test.mjs: one past 平顶山 with a teammate gets through.
const TUNE = {
  [WJ + 'npc/weishi']: [0.15, 30], [WJ + 'npc/prince']: [0.1, 80], [WJ + 'npc/kingfake']: [0.25, 300],
  [WJ + 'npc/kingreal']: [0.2, 150], [WJ + 'npc/longwang']: [0.2, 150], [WJ + 'npc/monk2']: [0.15, 60],
  [WJ + 'npc/shanji']: [0.15, 70], [WJ + 'npc/ji']: [0.1, 30],
}
tune(TUNE)

// ── 宝林寺 (temple.c): the 守寺僧 let nobody in ───────────────────────────────────────────────────────────────────

R[TEMPLE] = {
  leave(x, d) {
    const seng = awakeHere(x, TEMPLE, 'monk2')[0]
    if (d === '进去' && seng) return `${nameOf(x.w, seng)}说道：“寺院恕不接客，请回。”`
    return null
  },
}

// ── 西厢房 (westroom.c): the ghost of the king ────────────────────────────────────────────────────────────────────

/** get_current_day_phase with its phase one behind: sleep troubled from 18:00 to 06:00 (dusk to dawn). */
const night = (now) => { const { hour } = gameTime(now); return hour >= 18 || hour < 6 }
/** do_sleep: a fifth of the time, no ghost about, 道行 enough (XYJ 50000, here 5000), at night: else a sleep as any. */
C.sleep = ((prev) => (x, rest) => {
  const p = x.w.players[x.me]
  if (p.room !== WEST || rnd(x, 5) || x.w.npcs[GHOST] || self(p).exp < 5000 || !night(x.now)) return prev(x, rest)
  vision(x, WEST, '$N试着躺下想睡着，但心里有点忐忑不安。', x.me)
  cancel(x, 'wuji_king')
  later(x, 6500, 'wuji_king')
})(C.sleep)
/** create_king, 2–11 s on: the ghost in the 西厢房; show_king a second after. */
TIMERS.wuji_king = (x) => {
  if (x.w.npcs[GHOST]) return
  spawnNpc(x, GHOST, WEST)
  later(x, 1000, 'wuji_show')
}
TIMERS.wuji_show = (x) => {
  if (!x.w.npcs[GHOST]) return
  vision(x, ch(x.w, GHOST).room, '只听风声一时过处，青烟中现出一个水淋淋的人影。', GHOST)
  later(x, 7000, 'wuji_talk')
}
const TALK = [
  '乌鸡国王眼中垂泪，口里不住的只叫：师父你要替我报仇啊!', '乌鸡国王叹道：可怜我已死去三年，是个落井伤身的冤屈之鬼啊!',
  '乌鸡国王对你说：师父既有本事去西天取经，定能帮我报仇。', '乌鸡国王对你说：师父若能除去那妖道，定然功德无量啊啊!',
  '乌鸡国王叹道：可恨那妖道变做朕的模样，霸占了朕的江山，暗侵了我的国土。', '乌鸡国王叹道：可恨那妖道神通广大，地府天堂竟无我伸冤之处。',
  '乌鸡国王对你说：今日夜游神将我吹来此间，说师父你可以帮朕。', '乌鸡国王对你说：师父您若能拿住那妖道，辨明邪正，朕当结草衔环报答师父。',
]
/** talk_king: a line every 5–19 s; each time one in seven he is gone 5 s later. */
TIMERS.wuji_talk = (x) => {
  if (!x.w.npcs[GHOST]) return
  if (rnd(x, 7) === 0) return later(x, 5000, 'wuji_vanish')
  vision(x, ch(x.w, GHOST).room, TALK[rnd(x, TALK.length)], GHOST)
  later(x, 12_000, 'wuji_talk')
}
TIMERS.wuji_vanish = (x) => {
  if (!x.w.npcs[GHOST]) return
  vision(x, ch(x.w, GHOST).room, '冷风一过，你像是猛然惊醒，乌鸡国王已经不见了。', GHOST)
  gone(x, GHOST)
}
N[WJ + 'npc/king'] = {
  /** kill_ob, unconcious, die: attacked, he is smoke. */
  kill(x, id) {
    vision(x, ch(x.w, id).room, '$N大惊失色，噌地一声化为一缭青烟飞去。', id)
    gone(x, id)
    return false
  },
  fight(x, id) { emote(x, id, 'ah'); return false },
  ask: {
    /** give_jade: 道行 enough (XYJ 50000), no 玉圭 on one already, in the 西厢房, once in 900 s. */
    give_jade(x, id) {
      const w = x.w
      const p = w.players[x.me]
      const room = ch(w, id).room
      if (self(p).exp < 5000) return emote(x, id, '?')
      if (has(w, x.me, JADE)) return emote(x, id, 'hmm', x.me)
      if (room !== WEST) return emote(x, id, 'ah', x.me)
      const r = (w.rooms[WEST] ??= {})
      if (r.given && x.now - r.given < GIVEN) return emote(x, id, 'shake', x.me)
      r.given = x.now
      vision(x, room, '$N对$n说：师父我留下一件表记与你吧。', id, x.me)
      vision(x, room, '说着$N给$n一样东西。', id, x.me, { to: x.me, k: 'give' })
      makeThing(x, JADE, x.me, 1, { owner: x.me })
      x.out.push('（乌鸡国的王后和太子认得这件国宝：拿去「给」他们看。）')
    },
  },
}

// ── the 玉圭 and the 乌鸡精 are their owner's (obj/jade.c, jing.c init) ───────────────────────────────────────────

/** In another player's hands, a second on, they are gone. */
const BOUND = { [JADE]: '$n青光一闪，化成一道烟去了……', [JING]: '$n掉在地上，碎了。' }
const prevBound = HOOKS.beat
HOOKS.beat = (x) => {
  prevBound?.(x)
  const w = x.w
  for (const [tid, t] of Object.entries(w.things)) {
    if (!BOUND[t.id] || !w.players[t.at] || !t.owner || t.owner === t.at) continue
    if (!t.doom) { t.doom = x.now + 1000; continue }
    if (t.doom > x.now) continue
    vision(x, w.players[t.at].room, BOUND[t.id], t.at, tid)
    destroy(x, tid)
  }
}
/** no_drop. */
C.drop = ((prev) => (x, rest) => {
  const t = lead(thingsAt(x.w, x.me).map((tid) => ({ key: tid, names: [thingName(x.w, tid), ...(ITEMS[x.w.things[tid].id]?.ids ?? [])] })), rest)
  const id = t && x.w.things[t.key].id
  if (id === JADE) return x.out.push('谁敢乱扔金厢白玉圭？')
  if (id === JING) return x.out.push('这样东西不能随意丢弃。')
  return prev ? prev(x, rest) : false
})(C.drop)

// ── the queen (npc/queen.c, in the 锦香亭) and the prince (npc/prince.c, on the 山顶) ───────────────────────────────

N[WJ + 'npc/queen'] = {
  /** accept_object: the 玉圭 only; she knows it, and a second on gives it back: go to the prince. */
  accept(x, id, tid) {
    const w = x.w
    if (w.things[tid]?.id !== JADE) return false
    vision(x, ch(w, id).room, '$N看见$n一怔，顿时脸色暗下来。', id, tid)
    emote(x, id, 'shake')
    for (const pid of party(w, x.me)) flags(w.players[pid]).wuji_queen = 1
    cancel(x, 'wuji_queen')
    later(x, 1000, 'wuji_queen', { id, pid: x.me })
    return true
  },
}
/** telling */
TIMERS.wuji_queen = (x, { id, pid }) => {
  const w = x.w
  const q = ch(w, id)
  if (!q || q.dead || !w.players[pid]) return
  const jade = has(w, id, JADE) ?? makeThing(x, JADE, id, 1)
  vision(x, q.room, '王后对$N说：还是去见太子罢。', pid)
  emote(x, id, 'sigh')
  if (w.players[pid].room !== q.room || !awake(w, id, x.now)) return
  moveThing(x, jade, pid)
  vision(x, q.room, '$N拿出一柄金厢白玉圭交给$n。', id, pid, { to: pid, k: 'give' })
}
N[WJ + 'npc/prince'] = {
  /**
   * accept_object: the 玉圭, and 2 s on, half the time — and always unless the queen has seen it and it was shown him
   * before (wuji_jade, set after the check: the first is always refused) — he takes one for a thief; else his treasure.
   */
  accept(x, id, tid) {
    const w = x.w
    if (w.things[tid]?.id !== JADE) return false
    const q = flags(w.players[x.me])
    const refuse = rnd(x, 2) || !q.wuji_queen || !q.wuji_jade
    later(x, 2000, refuse ? 'wuji_refuse' : 'wuji_accept', { id, pid: x.me, tid })
    for (const pid of party(w, x.me)) flags(w.players[pid]).wuji_jade = 1
    return true
  },
}
TIMERS.wuji_refuse = (x, { id, pid, tid }) => {
  const w = x.w
  const c = ch(w, id)
  if (!c || c.dead) return
  vision(x, c.room, '$N看见金厢白玉圭脸色一变，高声叫道：“贼人！吾家珍国宝何时落入你手中！”', id, tid)
  vision(x, c.room, '$N怒发冲冠，大喝一声要杀死$n！', id, pid)
  if (w.things[tid]) destroy(x, tid)
  const p = w.players[pid]
  if (!p) return
  ;(c.hate ??= {})[pid] = 1 // kill_ob: he goes for them wherever they meet
  if (p.room === c.room && !p.ghost && awake(w, id, x.now)) brawl(x, id, pid, 'kill')
}
TIMERS.wuji_accept = (x, { id, pid, tid }) => {
  const c = ch(x.w, id)
  if (!c || c.dead) return
  vision(x, c.room, '$N看见金厢白玉圭脸色一变，禁不住叫道：“恩人！此乃吾家珍国宝也！”', id, tid)
  vision(x, c.room, '$N涕泪皆下。', id)
  if (x.w.things[tid]) destroy(x, tid)
  later(x, 2000, 'wuji_jing', { id, pid })
}
/** give_jing */
TIMERS.wuji_jing = (x, { id, pid }) => {
  const w = x.w
  const c = ch(w, id)
  if (!c || c.dead || !w.players[pid]) return
  vision(x, c.room, '$N对$n说道：“恩人，我身边亦有一宝，请笑纳！”', id, pid)
  vision(x, c.room, '说着$N取出一匣子，拿出一小瓶来。', id, pid)
  if (w.players[pid].room !== c.room) return void makeThing(x, JING, id, 1)
  makeThing(x, JING, pid, 1, { owner: pid })
  vision(x, c.room, '$N拿出一小瓶乌鸡精交给$n。', id, pid, { to: pid, k: 'give' })
}

// ── 御花园 (yuhua.c): the 芭蕉 felled, the well beneath ───────────────────────────────────────────────────────────

// The way down is there once the tree is down: a door here, shut till then, and again at the town reset.
ROOMS[YUHUA].exits['下'] = WELL
ROOMS[YUHUA].doors = { 下: { name: '芭蕉树', closed: true, locked: '墙角的芭蕉树长的茂盛。（拿着斧头「砍 芭蕉」。）' } }
const isAxe = (w, tid) => [ITEMS[w.things[tid].id]?.wieldAs].flat().some((s) => /axe/.test(s ?? ''))
/**
 * do_kan: with an axe, 40 气 a swing (out cold at 40 or less), and one in (50 − 福缘) the tree falls. The axe there is
 * to be had (长安's 铁匠 sells a 铁斧) is too heavy for anyone here to wield (game.js equip): carried, it will do.
 */
C.kan = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  if (p.room !== YUHUA) return x.out.push('什么？')
  if (!/^(bajiao|芭蕉|芭蕉树)$/.test(rest.trim())) return x.out.push('你要砍什么？')
  const wielded = thingsAt(w, x.me).find((t) => w.things[t].eq === 'wield')
  if (!(wielded ? isAxe(w, wielded) : thingsAt(w, x.me).some((t) => isAxe(w, t)))) return x.out.push('先去找把斧头吧！')
  if (!(w.rooms[YUHUA]?.doors?.['下'] ?? true)) return x.out.push('芭蕉树已经倒了！')
  vision(x, YUHUA, '$N抡起大斧子朝芭蕉树砍去，芭蕉树晃了晃。', x.me)
  if (p.kee.cur <= 40) knockOut(x, x.me, (t, id) => vision(x, YUHUA, t, id))
  p.kee.cur = Math.max(0, p.kee.cur - 40)
  if (rnd(x, 50 - (p.attrs.kar ?? 20)) < 5) {
    vision(x, YUHUA, '只听轰的一声，芭蕉树倒了，地下露出一口井。', x.me)
    setDoor(x, YUHUA, '下', false)
  }
}

// ── 水晶宫 (shuijing.c, npc/longwang.c) ─────────────────────────────────────────────────────────────────────────

/** do_all: every command counts; at the twentieth with no 龙王 about he rises, and sinks 10–39 s on. */
HOOKS.before = ((prev) => (x, verb, rest) => {
  const p = x.w.players[x.me]
  if (p.room === SHUIJING) {
    const t = (p.temp ??= {})
    if (x.w.npcs[LONGWANG]) t.wuji_shuijing = 0
    else if ((t.wuji_shuijing = (t.wuji_shuijing ?? 0) + 1) >= 20) {
      t.wuji_shuijing = 0
      vision(x, SHUIJING, '水面缓缓升起，慢慢显出龙王的形体。', x.me)
      spawnNpc(x, LONGWANG, SHUIJING)
      emote(x, LONGWANG, 'hi')
      cancel(x, 'wuji_sink')
      later(x, 24_500, 'wuji_sink')
    }
  }
  return prev?.(x, verb, rest)
})(HOOKS.before)
TIMERS.wuji_sink = (x) => {
  const c = x.w.npcs[LONGWANG]
  if (!c) return
  vision(x, c.room, '水面缓缓分开，龙王徐徐地沉了下去。', LONGWANG)
  gone(x, LONGWANG)
}
/** present("guo wang"): the body, or a king. */
const kingHere = (w, room) => thingsAt(w, room).some((t) => w.things[t].id === BODY) || npcsIn(w, room).some((n) => /npc\/king(real|fake)?$/.test(kindOf(n)))
N[WJ + 'npc/longwang'] = {
  ask: {
    /** show_king: with 乌鸡精 on one, the body brought up — once in 900 s. */
    show_king(x, id) {
      const w = x.w
      const room = ch(w, id).room
      if (kingHere(w, room)) return npcSay(x, id, '国王在此！')
      if (room !== SHUIJING) return npcSay(x, id, '莫提，莫提！')
      if (!has(w, x.me, JING)) return npcSay(x, id, '国王与你何故也？')
      const r = (w.rooms[SHUIJING] ??= {})
      if (r.given && x.now - r.given < GIVEN) return npcSay(x, id, '国王被救了也！')
      r.given = x.now
      emote(x, id, 'sigh')
      vision(x, room, '$N一挥手，水下浮起两夜叉，将什么东西抬将过来。', id)
      makeThing(x, BODY, room, 1)
      npcSay(x, id, '可怜可怜也！')
      x.out.push('（「施用 国王遗体」，把乌鸡精给他灌下去。）')
    },
  },
}

// ── the 乌鸡精 (obj/jing.c): drunk, out cold; applied to the body, the king lives ────────────────────────────────

const myJing = (x) => has(x.w, x.me, JING)
const crazed = (x, room) => {
  vision(x, room, '顿时$N只觉得一股精气入髓七窍生烟，乾坤倒置！', x.me)
  knockOut(x, x.me, (t, id) => vision(x, room, t, id))
}
C.drink = ((prev) => (x, rest) => {
  const jing = myJing(x)
  if (!jing || !lead([{ key: jing, names: [ITEMS[JING].name, ...ITEMS[JING].ids] }], rest.trim())) return prev ? prev(x, rest) : false
  const room = ch(x.w, x.me).room
  vision(x, room, '$N拿起乌鸡精豪饮而下，顺手将空瓶一扔。', x.me)
  destroy(x, jing)
  crazed(x, room)
})(C.drink)
/** do_apply: on oneself as drunk; on anything but the body (or once done), wasted; on the body, the king back. */
C.apply = (x, rest) => {
  const w = x.w
  const jing = myJing(x)
  if (!jing) return x.out.push('什么？')
  const room = ch(w, x.me).room
  const p = w.players[x.me]
  const cands = [
    ...npcsIn(w, room).map((n) => ({ key: n, names: [NPCS[baseOf(n)]?.name, ...(NPCS[baseOf(n)]?.ids ?? [])] })),
    ...playersIn(w, room).map((q) => ({ key: q, names: q === x.me ? [p.name, 'me', '我', '自己'] : personNames(w, q) })),
    ...thingsAt(w, room).map((t) => ({ key: t, names: [thingName(w, t), ...(ITEMS[w.things[t].id]?.ids ?? [])] })),
  ]
  const t = rest.trim() && lead(cands.map((c) => ({ ...c, names: c.names.filter(Boolean) })), rest.trim())
  if (!t) return x.out.push('你要将乌鸡精洒在什么上面？')
  if (t.key === x.me) {
    vision(x, room, '$N拿起乌鸡精往自己身上一洒，顺手将空瓶一扔。', x.me)
    destroy(x, jing)
    return crazed(x, room)
  }
  if (w.things[t.key]?.id !== BODY || self(p).obstacle.wuji === 'done') {
    vision(x, room, '$N拿起乌鸡精往$n上一洒，顺手将空瓶一扔。', x.me, t.key)
    vision(x, room, `顿时${nameOf(w, t.key)}晃动了一下。`, x.me)
    return destroy(x, jing)
  }
  vision(x, room, '$N掰开$n的口唇，拿起乌鸡精只是灌下，一口气吹入咽喉。', x.me, t.key)
  vision(x, room, '乌鸡精度下重楼，转明堂，径至丹田，顿时国王动了一下。', x.me)
  const king = `n:${WJ}npc/kingreal.${x.now.toString(36)}`
  spawnNpc(x, king, room)
  moveThing(x, jing, king)
  destroy(x, t.key)
  later(x, 2000, 'wuji_wake', { pid: x.me })
  later(x, 4000, 'wuji_follow', { king, pid: x.me })
}
TIMERS.wuji_wake = (x, { pid }) => {
  const p = x.w.players[pid]
  if (p) vision(x, p.room, '呼的一声响亮，国王气聚神归，翻身坐起。', pid)
}
/** follow_player: if the one who saved him is still by him, he follows them (obstacle/wuji "saved"). */
TIMERS.wuji_follow = (x, { king, pid }) => {
  const w = x.w
  const p = w.players[pid]
  const k = ch(w, king)
  if (!p || !k || k.dead || p.room !== k.room) return
  vision(x, p.room, '国王对$N拜道：“昨夜鬼魂拜谒，今朝晓返阳神！”', pid)
  vision(x, p.room, '说罢国王又是一拜。', pid)
  if (self(p).obstacle.wuji === 'done') return
  k.follow = pid
  k.guarding = pid
  k.saver = pid
  vision(x, p.room, '$N决定开始跟随$n一起行动。', king, pid)
  for (const q of party(w, pid)) flags(w.players[q]).wuji = 'saved'
  for (const t of thingsAt(w, king)) if (w.things[t].id === JING) destroy(x, t)
  tell(x, pid, '（领国王回他的昭泽殿去。）')
}

// ── the palace: the 卫士 (npc/weishi.c; wall.c, wall2.c, wall3.c, zym.c) ───────────────────────────────────────────

/** wall*.c valid_leave: no way on past a 卫士 standing. */
for (const [room, dir] of [['wall', '北'], ['wall2', '西'], ['wall3', '西']]) {
  R[WJ + room] = {
    leave(x, d) {
      const shi = awakeHere(x, WJ + room, 'weishi')[0]
      return d === dir && shi ? `${nameOf(x.w, shi)}喝道：禁行！` : null
    },
  }
}
/** zym.c valid_leave: never north; the first time, two 卫士 come out at one a second on. */
R[ZYM] = {
  leave(x, d) {
    if (d !== '北') return null
    if (!x.w.rooms[ZYM]?.seen?.[x.me]) {
      cancel(x, 'wuji_gate')
      later(x, 1000, 'wuji_gate', { pid: x.me })
      vision(x, ZYM, '从里面冲出护宫卫兵，围住$N就打！', x.me)
    }
    return '岗楼上一片吆喝声：“皇宫御地，严禁闯入！”'
  },
}
/** weishis_out */
TIMERS.wuji_gate = (x, { pid }) => {
  const w = x.w
  if (here(w, ZYM, 'weishi').length >= 4) return
  for (let i = 0; i < 2; i++) spawnNpc(x, `n:${WJ}npc/weishi.zym${x.now.toString(36)}${i}`, ZYM)
  const r = (w.rooms[ZYM] ??= {})
  ;(r.seen ??= {})[pid] = 1
  for (const q of playersIn(w, ZYM)) greet(x, ZYM, q)
}
/** greeting, a second after one comes in: all the 卫士 here at them (one fight), with a shout the first time. */
function greet(x, room, pid) {
  cancel(x, 'wuji_greet', (a) => a.room === room && a.pid === pid)
  later(x, 1000, 'wuji_greet', { room, pid })
}
TIMERS.wuji_greet = (x, { room, pid }) => {
  const w = x.w
  const p = w.players[pid]
  if (!p || p.room !== room || p.ghost || ROOMS[room].noFight) return
  const [first, ...more] = awakeHere(x, room, 'weishi')
  if (!first) return
  if (!p.temp?.weishi_kill) vision(x, room, '$N喝道：贱民无法无天，擅闯禁地！', first)
  ;(p.temp ??= {}).weishi_kill = 1
  for (const s of more) w.npcs[s].guarding = first
  try { brawl(x, first, pid, 'kill') } finally { for (const s of more) if (w.npcs[s]) delete w.npcs[s].guarding }
}
N[WJ + 'npc/weishi'] = {
  init(x, id, pid) { if (!isNpc(pid)) greet(x, ch(x.w, id).room, pid) },
}

// ── 昭泽殿 (palace.c, npc/kingfake.c, kingreal.c) ──────────────────────────────────────────────────────────────

const FAKE = `n:${WJ}npc/kingfake`
const realHere = (x, room) => awakeHere(x, room, 'kingreal')[0]
/**
 * autokill: the false king, on anyone coming in with the true one there, falls on him. The true king's saver and
 * their team here stand by him (they brought him for it).
 */
function autokill(x, room) {
  const w = x.w
  const fake = awakeHere(x, room, 'kingfake')[0]
  const real = realHere(x, room)
  if (!fake || !real || w.npcs[fake].fought === x.now) return
  w.npcs[fake].fought = x.now
  const saver = w.npcs[real].saver
  const by = saver && w.players[saver]?.room === room ? party(w, saver).filter((q) => awake(w, q, x.now) && online(w, q, x.now)) : []
  for (const q of by) w.players[q].guarding = real
  try {
    brawl(x, fake, real, 'kill', [
      ['$N对$n大喝一声：“妖怪魔头，竟敢欺世盗名变做朕的模样！”', fake, real], ['$N与$n立刻撕打了起来！', fake, real],
    ])
  } finally { for (const q of by) delete w.players[q].guarding }
}
N[WJ + 'npc/kingfake'] = {
  init(x, id) { autokill(x, ch(x.w, id).room) },
  /** die(): 青毛狮子, taken by 文殊 5 s on; the true king here tells the world 8 s on (announce_success). */
  die(x, id) {
    const w = x.w
    const room = ch(w, id).room
    vision(x, room, '$N发出一声长长的哀鸣，在尘土里现了青毛狮子的原身！', id)
    vision(x, room, '青毛狮子瞪着琉璃盏红眼，喘着粗气。')
    noCorpse(x, id)
    later(x, 5000, 'wuji_lion', { room })
    const real = npcsIn(w, room).find((n) => kindOf(n) === WJ + 'npc/kingreal')
    const saver = real && w.npcs[real].saver
    if (!saver || w.players[saver]?.room !== room) return
    cancel(x, 'wuji_announce', (a) => a.king === real)
    later(x, 8000, 'wuji_announce', { king: real, pids: party(w, saver) })
  },
}
TIMERS.wuji_lion = (x, { room }) => {
  vision(x, room, '一道金光照住青毛狮子，将青毛狮子唰地一声收去。')
  vision(x, room, '天上远远传来文殊菩萨的笑声。')
}
/** announce: 4000 + random(600) 道行 for whoever brought him back, and the team with them. */
TIMERS.wuji_announce = (x, { king, pids }) => {
  const w = x.w
  const k = ch(w, king)
  if (!k || k.dead) return
  for (const pid of pids) {
    const p = w.players[pid]
    if (!p || flags(p).wuji !== 'saved') continue
    if (self(p).obstacle.wuji === 'done') { tell(x, pid, '你已经过了这一关，什么都得不到了！'); continue }
    emote(x, king, 'thank', pid)
    pass(x, pid, 'wuji', '乌鸡国救我回生，大灭妖道还我乾坤！', king, 600, { base: 4000 })
  }
  delete k.follow
  delete k.guarding
}
N[WJ + 'npc/kingreal'] = {
  init(x, id) { if (ch(x.w, id).room === PALACE) autokill(x, PALACE) },
}

// ── the town ───────────────────────────────────────────────────────────────────────────────────────────────────

/** kezhan.c, up.c: the room upstairs for whoever has paid the 小二 (as 长安's inn, xyj-story.js). */
R[WJ + 'kezhan'] = {
  leave(x, d) { return d === '上' && !x.w.players[x.me].temp?.rentPaid ? '店小二满脸堆笑地挡住了你：对不起，客房不便打扰。' : null },
}
R[WJ + 'up'] = { leave(x) { delete x.w.players[x.me].temp?.rentPaid; return null } }
N[WJ + 'npc/xiaoer'] = {
  init(x, id, pid) { if (!isNpc(pid) && !rnd(x, 3)) vision(x, ch(x.w, id).room, '店小二笑咪咪地说道：这位客官，进来歇歇脚，喝两盅吧。') },
  accept(x, id, tid) {
    const t = x.w.things[tid]
    if (!isMoney(t?.id) || (ITEMS[t.id].baseValue ?? 0) * (t.n ?? 1) < 300) return false
    tell(x, x.me, '小二一哈腰，说道：多谢您老，客官请上楼歇息。')
    ;(x.w.players[x.me].temp ??= {}).rentPaid = true
    return true
  },
}

/** people.c random_move, kept in town: no townsperson goes out of the east gate, into the prince's house or the palace. */
const KEEP = { eastgate: ['西'], house: ['西'], zym: ['南'] }
const SHUT = { nstreet2: ['东'] }
HOOKS.chat.wuji_move = (x, id) => {
  const c = ch(x.w, id)
  const room = c.room.slice(WJ.length)
  const exits = Object.entries(ROOMS[c.room].exits).filter(([d]) => (KEEP[room] ? KEEP[room].includes(d) : !SHUT[room]?.includes(d)))
  if (!exits.length) return
  const [d, to] = exits[rnd(x, exits.length)]
  move(x, id, d, to)
}
for (const [key, d] of Object.entries(NPCS)) {
  if (key.startsWith(WJ + 'npc/people') && d.chatMsg) d.chatMsg = d.chatMsg.map((m) => (m?.fn === 'random_move' ? { fn: 'wuji_move' } : m))
}

/** npc/shanji.c: on the 山路 she follows the first one to come by, giggling now and then; off it, she stays. */
N[WJ + 'npc/shanji'] = {
  init(x, id, pid) {
    const w = x.w
    if (isNpc(pid)) return
    const c = w.npcs[id]
    cancel(x, 'wuji_giggle', (a) => a.id === id)
    later(x, 5000, 'wuji_giggle', { id, pid })
    if (ROOMS[c.room].name !== '山路') return void delete c.follow
    if (c.followed) return
    c.followed = 1
    emote(x, id, 'giggle', pid)
    vision(x, c.room, '$N决定开始跟随$n一起行动。', id, pid)
    c.follow = pid
  },
  /** unconcious / die: beaten, she is a 山鸡. */
  notify(x, id, from, say, killing) {
    if (!killing) return null
    say('$N身子一软现了原形，竟是一只母山鸡，扑打着翅膀。', id)
    henOf(x, id)
    return { over: true }
  },
  die(x, id) {
    vision(x, ch(x.w, id).room, '$N身子一软现了原形，竟是一只母山鸡，扑打着翅膀。', id)
    noCorpse(x, id)
    henOf(x, id)
  },
}
function henOf(x, id) {
  const room = ch(x.w, id).room
  spawnNpc(x, `n:${WJ}npc/ji.${x.now.toString(36)}${rnd(x, 1296).toString(36)}`, room)
  gone(x, id)
}
// She turns before she drops: under a quarter of her 气血 (XYJ: as she falls unconscious).
for (const [key, d] of Object.entries(NPCS)) if (key.split('@')[0] === WJ + 'npc/shanji') d.notify = { kee: 25 }
/** emoting, every 20–79 s while the one she met is by her and she is not fighting. */
TIMERS.wuji_giggle = (x, { id, pid }) => {
  const c = x.w.npcs[id]
  const p = x.w.players[pid]
  if (!c || c.dead || !p || p.room !== c.room || !awake(x.w, id, x.now)) return
  later(x, 49_500, 'wuji_giggle', { id, pid })
  const r = rnd(x, 3)
  if (r === 0) emote(x, id, 'giggle', pid)
  else if (r === 1) emote(x, id, 'giggle', id)
}

// What the story brought is gone with the town reset (but a king on his way home); the 山姬 home and free again.
const prevReset = HOOKS.reset
HOOKS.reset = (x) => {
  prevReset?.(x)
  const w = x.w
  for (const id of Object.keys(w.npcs)) {
    const k = kindOf(id)
    const led = k === WJ + 'npc/kingreal' && w.npcs[id].follow && !w.npcs[id].dead // on his way home: he goes on
    if (!led && ([GHOST, LONGWANG].includes(id) || [WJ + 'npc/kingreal', WJ + 'npc/ji'].includes(k) || id.startsWith(`n:${WJ}npc/weishi.zym`))) gone(x, id)
    else if (k === WJ + 'npc/shanji') { delete w.npcs[id].follow; delete w.npcs[id].followed }
  }
  for (const [tid, t] of Object.entries(w.things)) if (t.id === BODY) destroy(x, tid)
}

// A person placed in several rooms is one entry a room (`npc/weishi@wall2`, xyj.js): each keeps the rules of its kind.
for (const key of Object.keys(NPCS)) {
  const base = key.split('@')[0].split('#')[0]
  if (base !== key && base.startsWith(WJ) && N[base] && !N[key]) N[key] = N[base]
}
