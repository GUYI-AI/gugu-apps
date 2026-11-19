// 车迟国 (xyj.js, d/qujing/chechi), the fifth obstacle of the road west, from 西游记 4.5:
// - 三清观: one 变s into a statue of 三清 (npc/yuanshi.c, lingbao.c, taishang.c), carries that statue through the 小门 of
//   the 殿门 to the 五谷轮回 and throws it in, and eats the 蒸酥 on the altar in its place (obj/zhengsu.c); the three
//   大仙 come out and take the impostor to the king (sanqing.c, npc/huli.c, luli.c, yangli.c, npc/king.c).
// - The palace, past the 卫士 of the 朝门 (zhaomen.c, npc/weishi.c): three contests with the 大仙 before the
//   监斩官 — 坐禅 on the 云禅台 (jishui.c, npc/jz1.c, obj/chantai.c), 猜枚 at the 朱红柜子 (tan.c, npc/jz2.c,
//   obj/guizi.c) and the 油锅 (qiyu.c, npc/jz3.c, obj/youguo.c); the king calls it done (king.c announce_success).
// - Beside it: the 秘院 behind the 藏经楼's 书柜 (cangjing.c, miyuan.c), the 道士 asleep in the 厢房 (xiang2.c,
//   xiang3.c), 金钗女 of the 烟花院 (npc/jinchai.c).
// What is not XYJ's (SOURCE.md): the monsters' numbers (TUNE); a deed counts for the team in the room; the 禅台, the
// 柜子 and the 油锅 are a state of the one in them, not a place; the statue carried is a thing, not the NPC itself.
import {
  HOOKS, ROOMS, NPCS, ITEMS, ch, isNpc, baseOf, npcData, nameOf, thingsAt, thingName, makeThing, destroy, vision, tell,
  playersIn, npcsIn, spawnNpc, awake, carriage, load, fill,
} from './world.js'
import { knockOut, brawl, die } from './fight.js'
import { move, lead } from './game.js'
import { self, later, cancel, TIMERS, bianAs, PLACES, NO_WAY, FLY } from './xyj-story.js'
import { party, flags, pass, tune } from './xyj-road.js'

const N = HOOKS.npc
const R = HOOKS.room
const C = HOOKS.cmd
const CC = 'x/qujing/chechi/'
const SANQING = CC + 'sanqing'
const WUGU = CC + 'wugu'
const ZHAOMEN = CC + 'zhaomen'
const JINLUAN = CC + 'jinluan'
const JISHUI = CC + 'jishui'
const TAN = CC + 'tan'
const QIYU = CC + 'qiyu'
const CANGJING = CC + 'cangjing'
const MIYUAN = CC + 'miyuan'
const YANHUA = CC + 'yanhua'
const KING = CC + 'npc/king'
const rnd = (x, n) => (n > 0 ? Math.floor(x.rand() * n) : 0)
const alive = (w, id) => Boolean(w.npcs[id]) && !w.npcs[id].dead
/** present(): the first living one of this kind in the room (by base key, any room's copy of it). */
const present = (w, room, base) => npcsIn(w, room).find((n) => baseOf(n).split('@')[0] === base)
const tag = (x) => `t${x.now.toString(36)}${rnd(x, 1296).toString(36)}`

Object.assign(PLACES, { 车迟国: CC + 'jieshi1', 三清观: CC + 'dianmen' })
NO_WAY.push(/chechi\/miyuan$/)
// fly.c: 车迟国 lands at the 街市 in the north of the town.
Object.assign(FLY, { chechi: CC + 'jieshi1', 车迟国: CC + 'jieshi1' })

const DAXIAN = { huli: ['虎力大仙', 'hupi'], luli: ['鹿力大仙', 'lutou'], yangli: ['羊力大仙', 'yangjiao'] }
for (const k of ['chantai', 'guizi', 'youguo']) ITEMS[CC + 'obj/' + k].noGet = true

// ── the monsters' numbers ──────────────────────────────────────────────────────────────────────────────────────

// As xyj-road.js: skills in proportion, 气血 outright. The 卫士 of the 朝门 (two, both on whoever comes in) are beaten
// by one past 平顶山 who has trained a little, with a teammate; the 大仙 and the 监斩官, whom nobody has to fight,
// are worse; the four of the 秘院 (optional) are for a strong team. Played out in test/xyj-chechi.test.mjs.
const TUNE = {
  [CC + 'npc/weishi']: [0.15, 80], [CC + 'npc/daoshi']: [0.15, 60],
  [CC + 'npc/huli']: [0.3, 200], [CC + 'npc/luli']: [0.3, 200], [CC + 'npc/yangli']: [0.3, 200],
  [CC + 'npc/jz1']: [0.25, 160], [CC + 'npc/jz2']: [0.25, 160], [CC + 'npc/jz3']: [0.25, 160],
  [CC + 'npc/langli']: [0.2, 260], [CC + 'npc/chaili']: [0.2, 260], [CC + 'npc/beili']: [0.2, 260], [CC + 'npc/mali']: [0.2, 260],
}
tune(TUNE)

// ── 三清殿: the statues ──────────────────────────────────────────────────────────────────────────────────────────

const STATUES = ['yuanshi', 'lingbao', 'taishang']
const statueKey = (k) => CC + 'npc/' + k
/** How many of a statue's kind stand in the room: the statue itself and whoever has 变 into it (present "yuanshi 2"). */
const howMany = (w, room, k) => npcsIn(w, room).filter((n) => baseOf(n) === statueKey(k)).length +
  playersIn(w, room).filter((pid) => bianAs(w.players[pid]) === statueKey(k)).length
const statueNames = (k) => [npcData('n:' + statueKey(k)).name, ...npcData('n:' + statueKey(k)).ids]
/** The statue (an NPC) here that `text` names. */
const statueHere = (x, text) => {
  const room = ch(x.w, x.me).room
  const cands = npcsIn(x.w, room).filter((n) => STATUES.some((k) => baseOf(n) === statueKey(k))).map((n) => ({ key: n, names: statueNames(baseOf(n).split('/').pop()) }))
  return lead(cands, text)?.key ?? null
}
/** The statue (a thing) one carries that `text` names, or any if `text` is null. */
const statueCarried = (x, text = null) => thingsAt(x.w, x.me).find((tid) => {
  const id = x.w.things[tid].id
  if (!STATUES.some((k) => id === CC + 'obj/' + k)) return false
  return text === null || lead([{ key: tid, names: [ITEMS[id].name, ...ITEMS[id].ids] }], text)
}) ?? null
/** lift and throw are the statues' own commands (add_action in their init): only where one stands or is carried. */
const statueStanding = (x) => npcsIn(x.w, ch(x.w, x.me).room).some((n) => STATUES.some((k) => baseOf(n) === statueKey(k)))
const statueNear = (x) => !!statueCarried(x) || statueStanding(x)

for (const k of STATUES) {
  N[statueKey(k)] = {
    /** init: its lift and throw are added to whoever comes in (the order they were added in counts, see C.throw). */
    init(x, id, pid) { if (!isNpc(pid)) temp(x.w.players[pid]).seen = stamp(x.w.players[pid]) },
    /** die / unconcious: a statue cannot be killed; it is whole again where it stood (revive, reincarnate). */
    die(x, id) {
      const room = ch(x.w, id).room
      for (const tid of thingsAt(x.w, room)) if (x.w.things[tid].id === 'corpse' && x.w.things[tid].of === id) destroy(x, tid)
      later(x, 1, 'chechi_revive', { id, room }) // after the fight, which still counts it
    },
  }
}
TIMERS.chechi_revive = (x, { id, room }) => { if (x.w.npcs[id]?.dead) spawnNpc(x, id, room) }
/** do_get: not taken like a thing. */
C.get = ((prev) => (x, rest) => {
  if (rest && statueHere(x, rest)) return x.out.push('恐怕要花吃奶的力气去搬才能搬得动吧。')
  return prev ? prev(x, rest) : false
})(C.get)
/**
 * do_lift: in 三清殿 only, onto one's shoulder if one can carry its 75000 on top of what one has. The capacity is XYJ's
 * (chard.c: 膂力×5000 + 扑击×200): this game's (膂力²×200, ~45000 at 15) would keep almost everyone from a statue XYJ
 * lets anyone of 膂力 15 lift. Carried, it is the thing of its kind (obj/<k>.c) and the altar is without it till a reset.
 */
C.lift = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  if (!statueNear(x)) return false
  if (!rest) return x.out.push('你要搬什么？')
  const st = statueHere(x, rest)
  if (!st) return x.out.push('你要搬什么？')
  if (p.room !== SANQING) return vision(x, p.room, '$N使了吃奶的力气也没能将圣象搬起来。', x.me, st)
  const cap = carriage(w, x.me)
  if (load(w, x.me) + 75000 > cap || thingsAt(w, x.me).length >= 20) {
    vision(x, p.room, '$N憋红了脸一使劲，$n只是晃了一晃。', x.me, st)
    return x.out.push(`（圣象七十五斤重，你扛得动的连身上的东西一共${Math.floor(cap / 1000)}斤：膂力×5000 + 扑击×200。）`)
  }
  const k = baseOf(st).split('/').pop()
  for (const tid of thingsAt(w, st)) destroy(x, tid)
  delete w.npcs[st]
  w.things[makeThing(x, CC + 'obj/' + k, x.me, 1)].added = stamp(p)
  vision(x, p.room, '$N大喝一声，稳稳地将$n扛在肩上。', x.me, st)
}
/** do_throw: into the pit of the 五谷轮回, gone a second later. */
C.throw = (x, rest) => {
  const p = x.w.players[x.me]
  if (!statueNear(x)) return false
  if (!rest) return x.out.push('你要扔什么？')
  const tid = statueCarried(x, rest)
  if (!tid) return x.out.push('你要扔什么？')
  // Every statue near has its own throw, tried newest first, and the notify_fail of the last tried is the one heard:
  // the statue whose action was added first — carried, from its lifting; standing, from one's coming in. That is the
  // one thrown, 「这里怕是没有扔圣象的地方」; another, 「你要扔什么？」.
  if (p.room !== WUGU) {
    const added = thingsAt(x.w, x.me).filter((t) => STATUES.some((k) => x.w.things[t].id === CC + 'obj/' + k))
      .map((t) => [t, x.w.things[t].added ?? 0])
    if (statueStanding(x)) added.push([null, temp(p).seen ?? 0])
    const [first] = added.reduce((a, b) => (b[1] < a[1] ? b : a))
    return x.out.push(first === tid ? '这里怕是没有扔圣象的地方。' : '你要扔什么？')
  }
  vision(x, p.room, `$N将${thingName(x.w, tid)}举过头顶，往坑里一扔。`, x.me)
  later(x, 1000, 'chechi_splash', { pid: x.me, tid })
}
TIMERS.chechi_splash = (x, { pid, tid }) => {
  const t = x.w.things[tid]
  if (!t) return
  vision(x, ch(x.w, pid)?.room ?? WUGU, `只听“嗵”地一声，${thingName(x.w, tid)}溅起一阵臭气。`)
  destroy(x, tid)
}
// no_drop, no_give: a statue stays on the shoulder.
C.drop = ((prev) => (x, rest) => {
  if (rest && statueCarried(x, rest.replace(/^(一|1)\s*尊\s*/, ''))) return x.out.push('你将圣象往地上一放，又觉不妥，硬着头皮又搬了起来。')
  return prev ? prev(x, rest) : false
})(C.drop)
C.give = ((prev) => (x, rest) => {
  const tid = statueCarried(x)
  if (tid && [ITEMS[x.w.things[tid].id].name, ...ITEMS[x.w.things[tid].id].ids].some((n) => rest.includes(n))) return x.out.push('圣象如此之大，怕是给不了人吧。')
  return prev ? prev(x, rest) : false
})(C.give)

// ── 三清殿: the 蒸酥 (obj/zhengsu.c) ─────────────────────────────────────────────────────────────────────────────

const progress = (p) => flags(p).cc // obstacle/chechi: eaten, chantai, guizi (done is self(p).obstacle.chechi)
const done = (p) => self(p).obstacle.chechi === 'done'
const temp = (p) => (p.temp ??= {}).chechi ??= {}
/** An ever larger number a player's, to order the statues' actions added to them. */
const stamp = (p) => (temp(p).order = (temp(p).order ?? 0) + 1)
/** The temp obstacle/chechi (eaten, then seen_king), kept with the flags so a world saved keeps it. */
const met = (p) => flags(p).cct

HOOKS.item[CC + 'obj/zhengsu'] = {
  /** do_eat: food to the full; in 三清殿, the five checks in XYJ's order, any failing brings a 道士 3 s on. */
  eat(x, tid) {
    const w = x.w
    const p = w.players[x.me]
    const room = p.room
    p.food.cur = p.food.max
    const gone = (line, why) => {
      if (why !== undefined) { cancel(x, 'chechi_daoshi'); later(x, 3000, 'chechi_daoshi', x.me) }
      vision(x, room, line, x.me)
      destroy(x, tid)
      if (why) x.out.push(why)
      return true
    }
    if (room !== SANQING) return gone('$N将蒸酥吃了下去。')
    if (STATUES.some((k) => howMany(w, room, k) < 1)) return gone('$N饥不择食地将蒸酥吃了下去。', '（殿上的三清圣象不全。）')
    if (STATUES.some((k) => howMany(w, room, k) > 1)) return gone('$N狼吞虎咽地将蒸酥吃了下去。', '（殿上有两尊一样的圣象：你变成了哪一尊，就得先把那尊「搬」走，从殿门东边的小门进去，在五谷轮回「扔」掉。）')
    if (statueCarried(x)) return gone('$N风卷残云一般将蒸酥吃了下去。', '（圣象还在你肩上：到五谷轮回「扔」掉。）')
    if (!STATUES.some((k) => bianAs(p) === statueKey(k))) return gone('$N囫囵吞枣一般将蒸酥吃了下去。', '（这是供给三清的：先「变」成三清之一。）')
    if (self(p).exp < 5000) return gone('$N急急忙忙地将蒸酥吃了下去。', '（道行要五千以上。）')
    for (const q of party(w, x.me)) {
      const f = flags(w.players[q])
      if (!f.cc && !done(w.players[q])) f.cc = 'eaten' // set only if not yet set
      f.cct = 'eaten'
    }
    vision(x, room, '$N一本正经地将蒸酥吃了下去。', x.me)
    destroy(x, tid)
    cancel(x, 'chechi_daotong')
    later(x, 3000, 'chechi_daotong', x.me)
    return true
  },
}
/** sanqing.c daoshi_appearing: a 道士 who follows the thief and fights to the death. */
TIMERS.chechi_daoshi = (x, pid) => {
  const p = x.w.players[pid]
  if (!p || p.room !== SANQING || p.ghost) return
  vision(x, SANQING, '道士走了过来。', pid)
  vision(x, SANQING, '道士见状，喝道：“哪里来的草贼，竟敢偷吃供品！”', pid)
  vision(x, SANQING, '道士紧紧地跟上$N，大叫一声往死里打将起来！', pid)
  const id = spawnNpc(x, `n:${CC}npc/daoshi.${tag(x)}`, SANQING)
  x.w.npcs[id].follow = pid
  x.w.npcs[id].spawned = true
  brawl(x, id, pid, 'kill')
}
/** daotong_appearing, three_appearing: the 道童 runs for his masters, and 3 s on the three are here. */
TIMERS.chechi_daotong = (x, pid) => {
  const p = x.w.players[pid]
  if (!p || p.room !== SANQING) return
  vision(x, SANQING, '道童走了过来。', pid)
  vision(x, SANQING, '道童见状，唬得慌乱大声一道：“师父！圣象显灵了！”', pid)
  vision(x, SANQING, '只见道童一步一跌，向后殿奔去。', pid)
  cancel(x, 'chechi_three')
  later(x, 3000, 'chechi_three', pid)
}
TIMERS.chechi_three = (x, pid) => {
  const w = x.w
  const p = w.players[pid]
  if (!p || p.room !== SANQING) return
  vision(x, SANQING, '虎力大仙扬尘出现。')
  vision(x, SANQING, '鹿力大仙闻声而来。')
  vision(x, SANQING, '羊力大仙披着法衣赶来。')
  const t = tag(x)
  for (const k of ['yangli', 'huli', 'luli']) {
    const id = spawnNpc(x, `n:${CC}npc/${k}.${t}`, SANQING)
    w.npcs[id].owner = pid
    w.npcs[id].spawned = true
    later(x, 5500, 'chechi_eye', { id, pid }) // init: follow_player, random(10)+1 s on
  }
  tell(x, pid, '（三大仙跟上你以后，带他们去金銮殿见国王。）')
}

// ── the 大仙 (npc/huli.c, luli.c, yangli.c) ─────────────────────────────────────────────────────────────────────

/** follow_player: once, the one who ate in 三清殿 is eyed, their 法力 gone; 3–5 s on (do_follow), followed. */
TIMERS.chechi_eye = (x, { id, pid }) => {
  const w = x.w
  const c = w.npcs[id]
  const p = w.players[pid]
  if (!c || c.dead || c.room !== SANQING || !p || c.followed) return
  if (done(p) || met(p) !== 'eaten' || p.room !== c.room) return
  c.followed = 1
  vision(x, c.room, '只见$N一边祷告，一边斜眼看着$n。', id, pid)
  self(p).mana = 0
  later(x, 4000, 'chechi_cling', { id, pid })
}
TIMERS.chechi_cling = (x, { id, pid }) => {
  const w = x.w
  const c = w.npcs[id]
  const p = w.players[pid]
  if (!c || c.dead || c.room !== SANQING || !p || p.room !== c.room) return
  c.follow = pid
  vision(x, c.room, '$N对着$n一声冷笑。', id, pid)
  const t = temp(p)
  if (!t.recognized) {
    t.recognized = 1
    vision(x, c.room, '$N喝道：“大胆顽徒，竟敢冒充我道圣人！快去见国王领罪！”', id, pid)
  }
  vision(x, c.room, '$N决定开始跟随$n一起行动。', id, pid)
}
/** The trio of the one who ate, waiting to follow them, in 三清殿. */
const waiting = (w, pid) => npcsIn(w, SANQING).filter((n) => w.npcs[n].owner === pid && !w.npcs[n].follow)
R[SANQING] = {
  /** Leaving before the 大仙 have taken up with one: they stay behind (have_followed), and that is said. */
  leave(x) {
    if (waiting(x.w, x.me).length) x.out.push('（三大仙还没跟上你：这一走，他们就留在三清殿了，只好另请一回三清。）')
    return null
  },
}
/** The pelt each leaves (die()), and nothing else; a death that ends the contests is said. */
function daxianGone(x, id, how) {
  const w = x.w
  const c = w.npcs[id]
  const k = baseOf(id).split('/').pop()
  const pelt = { huli: '一张黄色虎皮', luli: '一只白色鹿头', yangli: '一根灰色羊角' }[k]
  for (const tid of thingsAt(w, c.room)) if (w.things[tid].id === 'corpse' && w.things[tid].of === id) destroy(x, tid)
  for (const tid of thingsAt(w, id)) destroy(x, tid)
  vision(x, c.room, `$N软软地倒下，留下${pelt}。`, id)
  makeThing(x, CC + 'obj/' + DAXIAN[k][1], c.room, 1)
  const owner = w.players[c.owner]
  if (how === 'killed' && owner && !done(owner) && met(owner)) {
    vision(x, c.room, '（三大仙少了一位，斗法比不成了：只好回三清殿，另请一回三清。）')
  }
  c.dead ??= x.now
}
for (const k of Object.keys(DAXIAN)) {
  N[CC + 'npc/' + k] = {
    /** init: whoever ate, back in 三清殿 before being eyed, is eyed. */
    init(x, id, pid) {
      const c = x.w.npcs[id]
      if (pid === c.owner && !c.followed && !c.follow) later(x, 5500, 'chechi_eye', { id, pid })
      regain(x, id, pid)
    },
    die(x, id) { daxianGone(x, id, 'killed') },
  }
}

// ── the palace: the 卫士 (npc/weishi.c, zhaomen.c) ─────────────────────────────────────────────────────────────

N[CC + 'npc/weishi'] = {
  /** greeting: whoever comes in is fallen on (kill_ob), the first time with a word. */
  init(x, id, pid) {
    const w = x.w
    if (isNpc(pid) || w.players[pid].ghost || !awake(w, id, x.now) || ROOMS[ch(w, id).room].noFight) return
    // One mark for the 卫士 of 乌鸡国 and of here alike (temp weishi_kill): shouted at in one, not again in the other.
    const t = (w.players[pid].temp ??= {})
    const lead0 = t.weishi_kill ? [] : [['$N喝道：贱民无法无天，擅闯禁地！', id]]
    t.weishi_kill = 1
    brawl(x, id, pid, 'kill', lead0)
  },
}
/** valid_leave: north of the 朝门, not while a 卫士 is up. */
R[ZHAOMEN] = {
  leave(x, d) {
    if (d !== '北') return null
    const shi = npcsIn(x.w, ZHAOMEN).find((n) => baseOf(n).startsWith(CC + 'npc/weishi') && awake(x.w, n, x.now))
    return shi ? `${nameOf(x.w, shi)}喝道：禁行！` : null
  },
}

// ── the palace: the king (npc/king.c) ───────────────────────────────────────────────────────────────────────────

const DAXIAN_KEYS = Object.keys(DAXIAN).map((k) => CC + 'npc/' + k)
const trio = (w, room) => DAXIAN_KEYS.map((k) => present(w, room, k))
const taijian = (w, room) => present(w, room, CC + 'npc/taijian')
N[KING] = {
  /** init: follow_player, 2 s on. */
  init(x, id, pid) {
    if (isNpc(pid)) return
    later(x, 2000, 'chechi_king', { id, pid })
    regain(x, id, pid)
  },
  die(x, id) {
    const p = x.w.players[x.w.npcs[id].follow]
    if (p && !done(p)) vision(x, x.w.npcs[id].room, '（国王一死，斗法比不成了。）')
  },
}
/** follow_player: the three kneel to the king (and follow him); 4, 8 and 12 s on, the king's judgement. */
TIMERS.chechi_king = (x, { id, pid }) => {
  const w = x.w
  const k = w.npcs[id]
  const p = w.players[pid]
  if (!k || k.dead || k.room !== JINLUAN || !p) return
  const three = trio(w, JINLUAN)
  if (three.some((n) => !n) || done(p) || met(p) !== 'eaten' || p.room !== JINLUAN || k.follow === pid) return
  // The one who ate (a teammate shares the temp flag here, not the 大仙's eye).
  if (!three.some((n) => w.npcs[n].owner === pid) && three.some((n) => w.players[w.npcs[n].owner])) return
  vision(x, JINLUAN, '国王道声：“三位国师请了！”', pid)
  for (const n of three) w.npcs[n].follow = id
  vision(x, JINLUAN, '三大仙凑上前去，跪在国王脚下，低声说着什么。', id)
  k.judging = pid
  for (const [ms, step] of [[4000, 1], [8000, 2], [12000, 3]]) {
    cancel(x, 'chechi_judge', (a) => a.step === step)
    later(x, ms, 'chechi_judge', { id, pid, step })
  }
}
TIMERS.chechi_judge = (x, { id, pid, step }) => {
  const w = x.w
  const k = w.npcs[id]
  const p = w.players[pid]
  if (!k || k.dead) return
  if (step === 1) {
    // continue_follow
    vision(x, k.room, '$N吃惊地啊了一声。', id)
    vision(x, k.room, '$N怒道：“大胆妄徒，竟敢欺骗国师！”', id)
    if (p && p.room === k.room) {
      vision(x, k.room, '$N不禁“叭”地一声跪下。', pid)
      self(p).busy = x.due + 9000
    }
    return
  }
  if (step === 2) {
    // continue_following
    if (taijian(w, k.room)) vision(x, k.room, '太监凑上去，低声密语。', id)
    vision(x, k.room, '$N想了一想，微微点了点头。', id)
    return
  }
  // following_player
  delete k.judging
  if (k.room !== JINLUAN || !p || done(p) || met(p) !== 'eaten' || p.room !== JINLUAN || k.follow === pid) return
  const tj = taijian(w, JINLUAN)
  if (tj) {
    vision(x, JINLUAN, '$N走上前来，决定跟随$n一起行动。', tj, pid)
    w.npcs[tj].follow = pid
  }
  vision(x, JINLUAN, '$N俯视着$n说道：若真是远道仙客，且不妨与三国师一比。', id, pid)
  vision(x, JINLUAN, '$N又道：“是死是活，监斩官前见分晓！”', id)
  vision(x, JINLUAN, '$N决定开始跟随$n一起行动。', id, pid)
  k.follow = pid
  for (const q of party(w, pid)) flags(w.players[q]).cct = 'seen_king'
  tell(x, pid, '（三场斗法依次比过：祭水场「登 禅台」坐禅，坛场「猜」柜中之物，祈雨场「进 油锅」。国王和三大仙跟着你。）')
}
R[JINLUAN] = {
  /** Gone before the king has judged: the three stay kneeling by him, and that is said (he asks again on return). */
  leave(x) {
    const k = npcsIn(x.w, JINLUAN).find((n) => baseOf(n) === KING && x.w.npcs[n].judging === x.me)
    if (k) x.out.push('（国王还没发落你：三大仙留在了国王身边。回金銮殿来，国王会再问一遍。）')
    return null
  },
}
for (const key of [CC + 'npc/taijian', CC + 'npc/taijian@jinluan', CC + 'npc/taijian@leiyu']) N[key] = { init: (x, id, pid) => regain(x, id, pid) }

/**
 * Who follows a player stays where the player died (a ghost goes on alone) and takes up with them again when they
 * come back alive to where it is: the king, the 太监 and the 大仙 are not lost to a death.
 */
function regain(x, id, pid) {
  const c = x.w.npcs[id]
  const p = x.w.players[pid]
  if (!c || c.lost !== pid || !p || p.ghost) return
  delete c.lost
  c.follow = pid
  vision(x, c.room, '$N决定开始跟随$n一起行动。', id, pid)
}

// ── the contests: who and what must be there (jz1.c, jz2.c, jz3.c check_valid_player) ──────────────────────────

/** 1: not as it should be; 2: the one to contest. */
function valid(x, pid, room, stage, things) {
  const w = x.w
  const p = w.players[pid]
  const here = thingsAt(w, room).map((t) => w.things[t].id)
  if (trio(w, room).some((n) => !n) || !present(w, room, KING) || things.some(([k, n]) => here.filter((t) => t === k).length < n)) return 1
  if (met(p) !== 'seen_king' || progress(p) !== stage) return 1
  return 2
}
const officer = (w, room, k) => present(w, room, CC + 'npc/' + k)
/** Why a contest did not count, for one on the way (not XYJ's: its 监斩官 says nothing of it). */
function whyNot(x, room, stage) {
  const p = x.w.players[x.me]
  if (!met(p) || done(p)) return
  if (trio(x.w, room).some((n) => !n) || !present(x.w, room, KING)) x.out.push('（国王和三大仙都得在场，这一场才作数。）')
  else if (met(p) !== 'seen_king') x.out.push('（国王还没发落你：先带三大仙去金銮殿见国王。）')
  else if (progress(p) !== stage) x.out.push('（斗法依次来：祭水场坐禅，坛场猜枚，祈雨场下油锅。）')
}
/** The state of one in the 禅台, the 柜子 or the 油锅 (XYJ moves them in: here they stay in the room, shut in). */
const inside = (p) => p?.temp?.chechi_in ?? null
/** Shut in, this stay told from the next by when it began (its call_outs are for it alone, as XYJ's are per object). */
const shut = (x, p, kind) => { Object.assign((p.temp ??= {}), { chechi_in: kind, chechi_stay: x.now }); return x.now }
const letOut = (p) => { if (p.temp) { delete p.temp.chechi_in; delete p.temp.chechi_stay } }
/** Whether one is still in the stay a call_out was made for. */
const still = (p, kind, stay) => inside(p) === kind && p.temp.chechi_stay === stay
const greeted = (p, k) => { const t = temp(p); if (t[k]) return true; t[k] = 1; return false }

N[CC + 'npc/jz1'] = {
  /** greet_player */
  init(x, id, pid) {
    if (isNpc(pid) || valid(x, pid, JISHUI, 'eaten', [[CC + 'obj/chantai', 2]]) !== 2 || greeted(x.w.players[pid], 'greeted')) return
    vision(x, JISHUI, '$N对$n说道：“请上云梯，于台顶坐禅显圣。”', id, pid)
    tell(x, pid, '（「登 禅台」。）')
  },
  die: officerDied,
}
N[CC + 'npc/jz2'] = {
  init(x, id, pid) {
    if (isNpc(pid) || valid(x, pid, TAN, 'chantai', [[CC + 'obj/guizi', 1]]) !== 2 || greeted(x.w.players[pid], 'greeted2')) return
    vision(x, TAN, '几位内官抬着一些东西走来，将朱红柜子布置一番。', id)
    vision(x, TAN, '内官向北离去。', id)
    vision(x, TAN, '$N对$n说道：“隔板猜枚，请道出朱红柜子里为何物。”', id, pid)
    tell(x, pid, '（「猜 <东西>」，比如「猜 宫衣」。）')
  },
  die: officerDied,
}
N[CC + 'npc/jz3'] = {
  init(x, id, pid) {
    if (isNpc(pid) || valid(x, pid, QIYU, 'guizi', [[CC + 'obj/youguo', 1]]) !== 2 || greeted(x.w.players[pid], 'greeted3')) return
    vision(x, QIYU, '$N对场外喝道：“添柴。”早有内官上前将大火挑旺。', id)
    vision(x, QIYU, '内官退下。', id)
    vision(x, QIYU, '$N对$n说道：“请下油锅，与国师双武洗。”', id, pid)
    tell(x, pid, '（「进 油锅」。）')
  },
  die: officerDied,
}
/** The contests are the 监斩官's (add_action): without him, none till he is back with the reset. */
function officerDied(x, id) {
  vision(x, ch(x.w, id).room, '（监斩官死了，这里的斗法要等他回来——半个时辰一轮的重置——才比得成。）')
}

/** The 大仙 of a contest goes in (or up) beside the one contesting: still in the room here, his place is the same. */
const daxianIn = (x, room, k) => {
  const id = present(x.w, room, CC + 'npc/' + k)
  return id && awake(x.w, id, x.now) ? id : null
}

// ── 祭水场: 坐禅 on the 云禅台 (npc/jz1.c do_climb, obj/chantai.c) ────────────────────────────────────────────────

C.climb = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  const jz = officer(w, p.room, 'jz1')
  if (p.room !== JISHUI || !jz || !/^(云?禅台|yun chantai|chantai)$/i.test(rest.trim())) return x.out.push('什么？')
  if (thingsAt(w, JISHUI).filter((t) => w.things[t].id === CC + 'obj/chantai').length < 2) return x.out.push('什么？')
  const st = valid(x, x.me, JISHUI, 'eaten', [[CC + 'obj/chantai', 2]])
  const huli = daxianIn(x, JISHUI, 'huli')
  const t = temp(p)
  let ok = false
  if (st === 1 || !huli) ok = false
  else if (!t.chantai) t.chantai = 1 // the first try always fails
  else ok = !rnd(x, 3)
  // display_climb, 1 s on in XYJ: here at once.
  if (huli) {
    vision(x, JISHUI, '$N顺手一指。', jz)
    vision(x, JISHUI, '$N招来一席彩云，慢慢飞上禅台顶座盘定，开始打坐。', huli)
  }
  vision(x, JISHUI, '$N顺手一指。', jz)
  vision(x, JISHUI, '$N招来一席彩云，慢慢飞上禅台顶座盘定，开始打坐。', x.me)
  const arg = { pid: x.me, jz, huli, kind: 'chantai', stay: shut(x, p, 'chantai') }
  later(x, ok ? 44_500 : 34_500, ok ? 'chechi_sat' : 'chechi_fell', arg) // success 40+random(10) s, failing 30+random(10)
  later(x, 14_500, 'chechi_wobble', arg)
  later(x, 60_000, 'chechi_autoleave', arg)
  if (st === 1) whyNot(x, JISHUI, 'eaten')
}
TIMERS.chechi_fell = (x, { pid, jz, huli, stay }) => {
  const w = x.w
  const p = w.players[pid]
  if (!alive(w, jz) || !p || !still(p, 'chantai', stay)) return
  letOut(p)
  vision(x, p.room, '只见$N倒栽葱一般摔将下来，梆地砸在地上。', pid)
  for (const [s, msg] of [['dodge', '你的基本轻功给活活地摔掉了一级！'], ['parry', '你的拆招卸力之法给活活地摔掉了一级！']]) {
    const i = p.skills[s] ?? 0
    if (i > 0 && i < 75) { tell(x, pid, msg); p.skills[s] = i - 1 }
  }
  knockOut(x, pid, (t, id) => vision(x, p.room, t, id))
  if (alive(w, huli)) vision(x, p.room, '$N踏着云彩，轻身稳稳落地。', huli)
}
TIMERS.chechi_sat = (x, { pid, jz, huli, stay }) => {
  const w = x.w
  const p = w.players[pid]
  if (!alive(w, jz) || !p || !still(p, 'chantai', stay)) return
  letOut(p)
  if (alive(w, huli)) vision(x, p.room, '$N像秤砣一样叭地砸在地上，摔得鼻青脸肿。', huli)
  vision(x, p.room, '只见$N携云纵身，健步飞跃直下，稳稳地落在地上。', pid)
  for (const q of party(w, pid)) if (!done(w.players[q])) flags(w.players[q]).cc = 'chantai'
  vision(x, p.room, '$N兴奋地点点头，向$n拜道：“请！”', jz, pid)
}

// ── 坛场: 猜枚 at the 朱红柜子 (npc/jz2.c do_guess, obj/guizi.c) ─────────────────────────────────────────────────

const ITEMS3 = ['宫衣', '桃子', '道童']
C.guess = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  const jz = officer(w, p.room, 'jz2')
  const arg = rest.trim()
  if (p.room !== TAN || !jz || !arg || !thingsAt(w, TAN).some((t) => w.things[t].id === CC + 'obj/guizi')) return x.out.push('什么？')
  const c = w.npcs[jz]
  if (c.guess === 'busy') {
    vision(x, TAN, `$N冒冒失失地喊了一声，这里面是${arg}！`, x.me)
    return vision(x, TAN, '$N叫道：“住口，这不正猜着吗？”', jz)
  }
  if (c.guess === 'player_in') {
    vision(x, TAN, `$N癫癫地喊了一声，这里面是${arg}！`, x.me)
    return vision(x, TAN, '$N说道：“住口，这里面不还关着人吗？”', jz)
  }
  const st = valid(x, x.me, TAN, 'chantai', [[CC + 'obj/guizi', 1]])
  const luli = daxianIn(x, TAN, 'luli')
  c.guess = 'busy'
  const t = temp(p)
  let ok = false
  if (st === 1 || !luli) ok = false
  else if (!t.guizi) t.guizi = 1
  else if (rnd(x, 3)) ok = false
  else ok = ITEMS3.includes(arg)
  vision(x, TAN, `$N指着柜子说，这里面是${arg}吧。`, x.me) // display_guess
  if (st === 1) whyNot(x, TAN, 'chantai')
  if (ok) later(x, 2000, 'chechi_opened', { pid: x.me, jz, arg })
  else later(x, 5000, 'chechi_wrong', { pid: x.me, jz, arg, luli })
}
/** failing: what is in it, named by 鹿力 (the source's own 仙衣 where 道童 was guessed), and into the 柜子 3 s on. */
TIMERS.chechi_wrong = (x, { pid, jz, arg, luli }) => {
  const w = x.w
  if (!alive(w, jz) || !w.players[pid]) return
  const two = { 宫衣: ['桃子', '道童'], 桃子: ['宫衣', '道童'], 道童: ['桃子', '仙衣'] }[arg]
  const str = two ? two[rnd(x, 2)] : ITEMS3[rnd(x, 3)]
  later(x, 3000, 'chechi_shut', { pid, jz })
  later(x, 120_000, 'chechi_unshut', { pid, jz })
  if (alive(w, luli)) {
    vision(x, TAN, `只见$N苦思冥想，说道：“是${str}”。`, luli)
    vision(x, TAN, `话音未落，$N打开朱红柜子，却果然是${str}。`, jz)
  } else vision(x, TAN, `$N哼地一声打开朱红柜子，里面是${str}。`, jz)
}
TIMERS.chechi_shut = (x, { pid, jz }) => {
  const w = x.w
  const p = w.players[pid]
  if (!alive(w, jz) || !p) return
  vision(x, TAN, '$N对$n一声冷笑，喊道：“来人！”', jz, pid)
  w.npcs[jz].guess = 'player_in'
  // put_player_in: from wherever they are.
  if (p.room !== TAN) move(x, pid, '', TAN, { quiet: true })
  vision(x, TAN, '从宫里早已走出两个内官，将$N左右夹起往柜子里一扔。', pid)
  const stay = shut(x, p, 'guizi')
  w.npcs[jz].shut = stay
  tell(x, pid, '（你被关进了柜子：两分钟后内官才放你出来，这期间做什么都只是在柜子里折腾。）')
  later(x, 180_000, 'chechi_autoleave', { pid, jz, kind: 'guizi', stay })
}
TIMERS.chechi_unshut = (x, { pid, jz }) => {
  const w = x.w
  const p = w.players[pid]
  if (!alive(w, jz)) return
  delete w.npcs[jz].guess
  if (!p || !still(p, 'guizi', w.npcs[jz].shut)) return
  letOut(p)
  vision(x, TAN, '宫里走出两个内官，将$N从柜子里软绵绵地拖了出来。', pid)
  vision(x, TAN, '内官重新将朱红柜子布置一番，向北离开。', jz)
  vision(x, TAN, '$N对$n说道：“恕你一回，速猜！”', jz, pid)
}
TIMERS.chechi_opened = (x, { pid, jz, arg }) => {
  const w = x.w
  if (!alive(w, jz) || !w.players[pid]) return
  vision(x, TAN, '$N说道：“开柜！”', jz)
  vision(x, TAN, `朱红柜子打开，果然是${arg}！`, jz)
  for (const q of party(w, pid)) if (!done(w.players[q])) flags(w.players[q]).cc = 'guizi'
  delete w.npcs[jz].guess
  vision(x, TAN, '$N面露喜色，连声向$n拜道：“请！”', jz, pid)
}

// ── 祈雨场: the 油锅 (npc/jz3.c do_enter, obj/youguo.c) ──────────────────────────────────────────────────────────

C.enter = ((prev) => (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  const jz = officer(w, p.room, 'jz3')
  if (p.room !== QIYU || !jz || !/^(大?油锅|da youguo|youguo)$/i.test(rest.trim()) || !thingsAt(w, QIYU).some((t) => w.things[t].id === CC + 'obj/youguo')) {
    return prev ? prev(x, rest) : false
  }
  const st = valid(x, x.me, QIYU, 'guizi', [[CC + 'obj/youguo', 1]])
  const yangli = daxianIn(x, QIYU, 'yangli')
  const t = temp(p)
  t.invalid = 0
  let ok = false
  if (st === 1 || !yangli) t.invalid = 1
  else if (!t.youguo) t.youguo = 1
  else ok = !rnd(x, 3)
  // display_enter, 1 s on in XYJ: here at once.
  if (yangli) vision(x, QIYU, '$N一个起身，纵入热浪翻滚的大油锅。', yangli)
  vision(x, QIYU, '$N一个起身，纵入热浪翻滚的大油锅。', x.me)
  const arg = { pid: x.me, jz, yangli, kind: 'youguo', stay: shut(x, p, 'youguo') }
  later(x, ok ? 44_500 : 34_500, ok ? 'chechi_fried' : 'chechi_scooped', arg)
  later(x, 14_500, 'chechi_wobble', arg)
  later(x, 60_000, 'chechi_autoleave', arg)
  if (st === 1) whyNot(x, QIYU, 'guizi')
})(C.enter)
/** failing: fished out senseless; one who went in for nothing, under 道行 20000 (XYJ 200000), a third of the time dies. */
TIMERS.chechi_scooped = (x, { pid, jz, yangli, stay }) => {
  const w = x.w
  const p = w.players[pid]
  if (!alive(w, jz) || !p || !still(p, 'youguo', stay)) return
  vision(x, QIYU, '只见$N在油面上绝望地抓了一把。', pid)
  vision(x, QIYU, '$N见况不妙，大喊：“来人！”。', jz)
  vision(x, QIYU, '早已从后面冲上几个内官用铁爪篱捞出$n。', jz, pid)
  letOut(p)
  if (alive(w, yangli)) vision(x, QIYU, '$N费力地翻身出锅落地。', yangli)
  knockOut(x, pid, (t, id) => vision(x, QIYU, t, id))
  if (self(p).exp < 20000 && !rnd(x, 3) && temp(p).invalid) {
    die(x, pid, null, (t, id) => vision(x, QIYU, '$N被滚油烹死了。', id))
  }
}
TIMERS.chechi_fried = (x, { pid, jz, yangli, stay }) => {
  const w = x.w
  const p = w.players[pid]
  if (!alive(w, jz) || !p || !still(p, 'youguo', stay)) return
  letOut(p)
  if (alive(w, yangli)) {
    vision(x, QIYU, '$N在油面上绝望地探出头来。', yangli)
    vision(x, QIYU, '$N急忙大喊：“来人，国师完也！”。', jz)
    vision(x, QIYU, '几个内官赶来用铁爪篱捞出$n。', jz, yangli)
    vision(x, QIYU, '$N皮焦肉烂，已不成形。', yangli)
    daxianGone(x, yangli)
  }
  vision(x, QIYU, '$N兴奋地点点头，向$n拜道：“请！”', jz, pid)
  cancel(x, 'chechi_won')
  later(x, 2000, 'chechi_won', { pid })
}
/** king_announce_success: the king (whoever stands for him) sees it; 5000 + random(600), and the 大仙 die 5 s on. */
TIMERS.chechi_won = (x, { pid }) => {
  const w = x.w
  if (!w.players[pid]) return
  const king = present(w, QIYU, KING)
  vision(x, QIYU, '国王大悟道：“果然是兽精！”')
  vision(x, QIYU, '国王又道：“寡人糊涂，竟尊其为国师，岂不殃民祸国！”')
  const by = king ?? 'n:' + KING
  for (const q of party(w, pid)) {
    if (done(w.players[q])) { tell(x, q, '你已经过了这一关，什么都得不到了！'); continue }
    pass(x, q, 'chechi', '车迟国施展圣手，大破妖道！', by, 600, { base: 5000 })
    delete flags(w.players[q]).cc
    delete flags(w.players[q]).cct
  }
  if (king) delete w.npcs[king].follow // follow none
  later(x, 5000, 'chechi_doom', QIYU)
}
TIMERS.chechi_doom = (x, room) => {
  for (const n of trio(x.w, room)) if (n) daxianGone(x, n)
}

// ── in the 禅台, the 柜子, the 油锅 ─────────────────────────────────────────────────────────────────────────────

const WOBBLE = {
  chantai: ['禅台上', ['$N忍耐不住，晃了一下，赶紧坐定。', '$N强忍着，就着衣襟蹭了蹭头。', '$N身子一歪，差点儿摔下。', '$N略动了一动。',
    '$N一个不稳连忙坐正。', '$N歪歪斜斜有点坐不住了。', '$N象喝醉了一样，身子直晃。']],
  youguo: ['油锅中', ['$N在滚油里挣扎了一下。', '$N从油浪里勉强冒出头来，又沉下去。', '$N扑打着双手。', '$N浮出油面，又被油浪压了下去。',
    '$N探出头来，大口喘气。', '$N从油面上伸出手乱抓了一下。', '$N随着油浪翻卷不止。', '$N的头勉强伸出滚烫的油面，旋即沉下。', '$N拼命蹿出油面喘着气。']],
}
/** chantai.c / youguo.c disturbed, every 5–24 s (here 14½) while one is in it and awake. */
TIMERS.chechi_wobble = (x, arg) => {
  const p = x.w.players[arg.pid]
  if (!p || !still(p, arg.kind, arg.stay) || !awake(x.w, arg.pid, x.now)) return
  const [where, lines] = WOBBLE[arg.kind]
  vision(x, p.room, where + lines[rnd(x, lines.length)], arg.pid)
  later(x, 14_500, 'chechi_wobble', arg)
}
/** autoleave: still in it after a minute (the 柜子 three), one is put out senseless. */
TIMERS.chechi_autoleave = (x, { pid, kind, stay }) => {
  const p = x.w.players[pid]
  if (!p || !still(p, kind, stay) || !awake(x.w, pid, x.now)) return
  letOut(p)
  vision(x, p.room, { chantai: '只见$N倒栽葱一般摔将下来，梆地砸在地上。', youguo: '几个内官上来用铁爪篱捞出$N。', guizi: '只见$N面如死灰地被内官拖了出来。' }[kind], pid)
  knockOut(x, pid, (t, id) => vision(x, p.room, t, id))
}
const KNOCKS = ['你听见', '你好像听见里面', '柜子里', '柜子里似乎']
const NOISES = ['$N在黑暗中胡乱踢打了几下。', '$N砰地撞在柜顶上。', '$N颠三倒四地发出噪音。', '$N胡乱挣扎着。', '$N摸摸索索地折腾着。',
  '$N发出一声哀鸣。', '$N狠狠地撞在柜壁上。', '$N不知所措地在黑暗中踢打着。', '$N发出笨重的撞击声。', '$N头撞在壁板上，发出沉闷的一声响。']
/** What one in them may do: in the 柜子 nothing (do_command takes every command); up on the 禅台 or in the 油锅, look
 * about and talk, but not go anywhere or do anything else (XYJ's containers have no way out). */
const FREE = new Set(['look', 'hp', 'score', 'skills', 'inv', 'say', 'sayto', 'tt', 'team', 'who', 'time', 'help', 'obstacles'])
HOOKS.before = ((prev) => (x, verb, rest) => {
  const p = x.w.players[x.me]
  const k = inside(p)
  if (k && p.ghost) letOut(p)
  if (!k || p.ghost) return prev?.(x, verb, rest) ?? false
  if (k === 'guizi') {
    const noise = NOISES[rnd(x, NOISES.length)]
    x.out.push(fill(x.w, noise, x.me, null, x.me))
    const mark = x.out.length
    vision(x, p.room, KNOCKS[rnd(x, KNOCKS.length)] + noise, x.me)
    x.out.length = mark
    return true
  }
  if (FREE.has(verb)) return false
  x.out.push(k === 'chantai' ? '你正在云禅台顶上打坐，下不来。' : '你正泡在大油锅里，出不来。')
  return true
})(HOOKS.before)

// ── 藏经楼, 秘院 (cangjing.c do_spell, miyuan.c, npc/langli.c etc.) ─────────────────────────────────────────────

/** do_spell: 「念 shugui」 to the 书柜, and a wind takes one to the 秘院 (its only way in). */
C.spell = (x, rest) => {
  const p = x.w.players[x.me]
  if (p.room !== CANGJING || !/^(shugui|书柜)$/.test(rest.trim())) return x.out.push('什么？')
  x.out.push('你悄声地对书柜念了几声咒语，一阵风将你带了过去。')
  move(x, x.me, '', MIYUAN, { quiet: true })
}
for (const k of ['langli', 'chaili', 'beili', 'mali']) {
  N[CC + 'npc/' + k] = {
    /** die / unconcious: a heap of bones, which crumble 20 s on (d/obj/misc/bone.c). */
    die(x, id) {
      const w = x.w
      const room = ch(w, id).room
      for (const tid of thingsAt(w, room)) if (w.things[tid].id === 'corpse' && w.things[tid].of === id) destroy(x, tid)
      vision(x, room, '$N浑身一软瘫在地上，化做一堆零散的兽骨。', id)
      const bone = makeThing(x, 'x/obj/misc/bone', room, 1)
      later(x, 20_000, 'chechi_dust', bone)
    },
  }
}
TIMERS.chechi_dust = (x, tid) => { if (x.w.things[tid]) destroy(x, tid) }

// ── 厢房: the 道士 asleep (xiang2.c, xiang3.c) ───────────────────────────────────────────────────────────────────

for (const room of ['xiang2', 'xiang3'].map((r) => CC + r)) {
  R[room] = {
    /** init: one of the two lies down, 1–3 s on (here 2); sleep.c wakes him 10 + random(45 − 根骨) s on (here 24½). */
    init(x) {
      const pair = [`n:${CC}npc/daoshi@${room.split('/').pop()}`, `n:${CC}npc/daoshi@${room.split('/').pop()}.2`]
      cancel(x, 'chechi_doze', (a) => a.room === room)
      later(x, 2000, 'chechi_doze', { id: pair[rnd(x, 2)], room })
    },
  }
}
TIMERS.chechi_doze = (x, { id, room }) => {
  const c = x.w.npcs[id]
  if (!c || c.room !== room || !awake(x.w, id, x.now)) return
  vision(x, room, '$N往被中一钻，不一会便鼾声大作，进入了梦乡。', id)
  c.out = x.now + 600_000 // asleep till chechi_wake
  c.asleep = 1
  later(x, 24_500, 'chechi_wake', id)
}
TIMERS.chechi_wake = (x, id) => {
  const c = x.w.npcs[id]
  if (!c?.asleep || c.dead) return
  delete c.asleep
  delete c.out
  vision(x, c.room, '$N一觉醒来，精力充沛地活动了一下筋骨。', id)
}

// ── 烟花院: 金钗女 (npc/jinchai.c) ──────────────────────────────────────────────────────────────────────────────

const JINCHAI = CC + 'npc/jinchai'
const SAYS = ['$N吃吃一笑，抿嘴看着你。', '$N含情脉脉地对你说……我……', '看来$N很想跟你……如果你愿意，也请下一次 sleep 命令。',
  '$N冲着你会心地一笑，点了点头。', '$N很想跟你……', '$N对你婉尔一笑。']
N[JINCHAI] = {
  /** init: says, random(3) s on (here 1), then every random(40) s (here 19½) while anyone is there to hear. */
  init(x, id, pid) {
    if (isNpc(pid)) return
    cancel(x, 'chechi_says')
    later(x, 1000, 'chechi_says', id)
  },
}
TIMERS.chechi_says = (x, id) => {
  const c = x.w.npcs[id]
  if (!c || c.dead || !playersIn(x.w, c.room).length) return
  if (awake(x.w, id, x.now)) vision(x, c.room, SAYS[rnd(x, SAYS.length)], id)
  later(x, 19_500, 'chechi_says', id)
}
/** do_sleep: 「睡觉」 with her there (her own sleep, before the room's): one's armour off, and a second later one
 * is out cold and all one carries is taken out and gone (moved to her, then destructed: nothing is left of it). */
C.sleep = ((prev) => (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  const her = npcsIn(w, p.room).find((n) => baseOf(n) === JINCHAI)
  if (!her || p.ghost) return prev ? prev(x, rest) : false
  vision(x, p.room, '$N搂着$n柔软的身体，不由得心醉神迷……', x.me, her)
  for (const tid of thingsAt(w, x.me)) {
    if (w.things[tid].eq !== 'wear') continue
    delete w.things[tid].eq
    vision(x, p.room, `$N将${thingName(w, tid)}脱了下来。`, x.me) // remove all
  }
  self(p).busy = x.now + 3000
  cancel(x, 'chechi_says')
  later(x, 1000, 'chechi_taken', { pid: x.me, id: her })
  later(x, 40_000, 'chechi_says', her)
})(C.sleep)
TIMERS.chechi_taken = (x, { pid, id }) => {
  const w = x.w
  const p = w.players[pid]
  if (!p || !w.npcs[id]) return
  const room = p.room
  vision(x, room, '$N对$n神秘地一笑。', id, pid)
  knockOut(x, pid, (t, who) => vision(x, room, t, who))
  for (const tid of thingsAt(w, pid)) {
    vision(x, room, `$N从$n身上拿出${thingName(w, tid)}。`, id, pid)
    destroy(x, tid)
  }
}

// ── keeping the chain whole ──────────────────────────────────────────────────────────────────────────────────────

const prevBeat = HOOKS.beat
HOOKS.beat = (x) => {
  prevBeat?.(x)
  // A ghost goes on alone: whoever followed them waits where they died (regain takes up with them again).
  for (const c of Object.values(x.w.npcs)) {
    if (!c.follow || isNpc(c.follow) || !x.w.players[c.follow]?.ghost) continue
    c.lost = c.follow
    delete c.follow
  }
}
const prevReset = HOOKS.reset
HOOKS.reset = (x) => {
  prevReset?.(x)
  const w = x.w
  for (const [id, c] of Object.entries(w.npcs)) {
    // The 道士 who came for a thief, and the dead 大仙, are gone; so is the king's judging.
    if (c.spawned && (c.dead || baseOf(id) === CC + 'npc/daoshi')) { for (const tid of thingsAt(w, id)) destroy(x, tid); delete w.npcs[id]; continue }
    if (baseOf(id) === KING) delete c.judging
    // The reset sends the king and the 太监 home; one who leads them to the contests keeps them.
    const p = w.players[c.follow ?? c.lost]
    if (!/npc\/(king|taijian)/.test(baseOf(id)) || !p) continue
    if (met(p) === 'seen_king' && !done(p)) c.room = p.room
    else { delete c.follow; delete c.lost }
  }
}

// A person placed in several rooms is one entry a room (`npc/weishi@zhaomen`, xyj.js): each keeps the rules of its kind.
for (const key of Object.keys(NPCS)) {
  const base = key.split('@')[0]
  if (base !== key && base.startsWith(CC) && N[base] && !N[key]) N[key] = N[base]
}
