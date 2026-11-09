// 通天河 (xyj.js, d/qujing/tongtian), the sixth obstacle, from 西游记 4.5: the river frozen over, and 金鳞怪 under it.
// - 袁守诚 of 长安 likes a drink: a 桂花酒袋 earns his 无字天书 (city/npc/shouchen.c); torn open, a 避水咒 is in its back
//   (obj/book/nowords.c).
// - On the ice (bing1–4.c) the river tests who stands there a while: one who looks like a 小童 (变 at 陈家庄) goes through,
//   and with the 避水咒 down to the bottom (hedi.c), where 金鳞怪 and his 鱼精 are; killed, he is a goldfish taken home,
//   and 陈长老 calls it done (npc/jinyu.c, chen.c).
// What is not XYJ's (SOURCE.md): the monsters' numbers are set to this game's fights; the deed counts for the team at
// the bottom; the cold of the bottom takes 10 气, not 50.
import { HOOKS, ROOMS, NPCS, ITEMS, ch, isNpc, thingName, thingsAt, makeThing, destroy, vision, awake } from './world.js'
import { brawl, knockOut } from './fight.js'
import { move, lead } from './game.js'
import { self, later, cancel, TIMERS, PLACES, NO_WAY, FLY } from './xyj-story.js'
import { party, pass, tune } from './xyj-road.js'

const N = HOOKS.npc
const R = HOOKS.room
const C = HOOKS.cmd
const TT = 'x/qujing/tongtian/'
const HEDI = TT + 'hedi'
const ICE = ['bing1', 'bing2', 'bing3', 'bing4'].map((r) => TT + r)
const BOOK = 'x/obj/book/nowords'
const ZHOU = 'x/obj/magic/bishuizhou'
const JINYU = TT + 'npc/jinyu'
const CHEN = 'n:' + TT + 'npc/chen' // chen.c, made only to say it (jinyu.c chen_appearing)

Object.assign(PLACES, { 通天河: TT + 'hedong2', 陈家庄: TT + 'chen1' })
NO_WAY.push(/tongtian\/hedi$/)
// fly.c: 通天河 lands on its east bank (one of hedong1–6 at random there).
Object.assign(FLY, { tongtian: TT + 'hedong1', 通天河: TT + 'hedong1' })

// XYJ's 金鳞怪 is of 1 500 000 道行 and 1700 气血, his 鱼精 of 40 000 each and more: set to this game's fights, so one
// who can 变 (道行 3000), has trained for it and bought a blade beats them more often than not. Played out in test/xyj-tongtian.test.mjs.
tune({ [JINYU]: [0.12, 90], [TT + 'npc/yao']: [0.1, 30] })

// ── 袁守诚's 无字天书, and the 避水咒 in it ────────────────────────────────────────────────────────────────────────

/**
 * shouchen.c accept_object: a 桂花酒袋, and he gives his 无字天书. Anything else he means to give back, but his give
 * command is miswritten and the thing is gone with the rest he is given (give.c destructs what an NPC takes).
 */
N['x/city/npc/shouchen'] = {
  ...N['x/city/npc/shouchen'],
  accept(x, id, tid) {
    const w = x.w
    const wine = thingName(w, tid) === '桂花酒袋'
    destroy(x, tid)
    if (!wine) {
      vision(x, ch(w, id).room, '$N说道：不敢当不敢当．．．您太客气了。', id)
      return true
    }
    const p = w.players[x.me]
    vision(x, ch(w, id).room, `$N说道：这位${p.gender === '女性' ? '姑娘' : '壮士'}就是跟我投缘！\n这里我也有一点小意思，请笑纳。`, id)
    const book = makeThing(x, BOOK, x.me, 1)
    vision(x, ch(w, id).room, `$N拿出${thingName(w, book)}交给$n。`, id, x.me)
    return true
  },
}
/** nowords.c do_tear: 「撕 天书」, carried or on the floor, and out of its back page comes a 避水咒. */
C.tear = (x, rest) => {
  const w = x.w
  const mine = [...thingsAt(w, x.me), ...thingsAt(w, ch(w, x.me).room)].filter((t) => w.things[t].id === BOOK)
  const t = lead(mine.map((tid) => ({ key: tid, names: [thingName(w, tid), ...(ITEMS[BOOK].ids ?? [])] })), rest.trim())
  if (!t) return false
  destroy(x, t.key)
  makeThing(x, ZHOU, x.me, 1)
  vision(x, ch(w, x.me).room, '$N撕开无字天书的背页，从里面小心翼翼地取出一张小纸片。', x.me)
}

// ── the ice (bing1–4.c) ────────────────────────────────────────────────────────────────────────────────────────

/** test_player: 0 one who does not look like a 小童, 1 one who does, 2 one who does and has the 避水咒. */
function looksKid(w, pid) {
  const p = w.players[pid]
  if (p?.temp?.bian?.name !== '小童') return 0
  return thingsAt(w, pid).some((t) => w.things[t].id === ZHOU) ? 2 : 1
}
for (const room of ICE) {
  R[room] = {
    /** init: a crack heard in 5–24 s; in 30–59 s the river tests who came in. */
    init(x, pid) {
      later(x, 14_500, 'tongtian_crack', room)
      later(x, 44_500, 'tongtian_test', { pid, room })
    },
  }
}
TIMERS.tongtian_crack = (x, room) => vision(x, room, '冰发出咔地一声轻响。')
TIMERS.tongtian_test = (x, { pid, room }) => {
  const w = x.w
  const how = looksKid(w, pid)
  if (!how) return vision(x, room, '冰咔咔作响。')
  if (w.players[pid].room !== room) return
  vision(x, room, '冰面上裂开一道裂缝，$N一个趔趄不由自主地摔进水中！', pid)
  if (how === 1) {
    vision(x, room, '众人赶来，连忙将$N冰棍一般拖出冰水。', pid)
    return knockOut(x, pid, (t, id) => vision(x, room, t, id))
  }
  move(x, pid, '', HEDI, { quiet: true })
}

// ── the bottom of the river (hedi.c) ─────────────────────────────────────────────────────────────────────────────

R[HEDI] = {
  /** init: the cold, 5–14 s after one comes in (once more after that, which takes nothing). */
  init(x, pid) {
    cancel(x, 'tongtian_cold')
    later(x, 9500, 'tongtian_cold', pid)
  },
}
TIMERS.tongtian_cold = (x, pid) => {
  const w = x.w
  vision(x, HEDI, '你冻得浑身发抖。')
  const p = pid && w.players[pid]
  if (!p || p.room !== HEDI) return
  if (p.kee.cur > 10) p.kee.cur -= 10
  later(x, 9500, 'tongtian_cold', null)
}

// 金鳞怪 and his 鱼精 fall on whoever comes down (attitude aggressive); each 鱼精 kind (`npc/yao#3`) is one entry.
const kinds = (base) => Object.keys(NPCS).filter((k) => k.split('@')[0].split('#')[0] === base)
for (const k of [JINYU, ...kinds(TT + 'npc/yao')]) {
  N[k] = {
    init(x, id, pid) {
      const w = x.w
      if (isNpc(pid) || w.players[pid].ghost || !awake(w, id, x.now) || ROOMS[ch(w, id).room].noFight) return
      brawl(x, id, pid, 'kill')
    },
  }
}
N[JINYU] = {
  ...N[JINYU],
  /** accept_fight: a challenge is taken as to the death. */
  fight: () => 'kill',
  /** unconcious: die. */
  faint: 'die',
  /** die: a goldfish, called home to the lotus pond; no corpse. 陈长老 tells the world a second later. */
  die(x, id, killer) {
    const w = x.w
    const room = ch(w, id).room
    for (const tid of thingsAt(w, room)) {
      if (w.things[tid].id !== 'corpse' || w.things[tid].of !== id) continue
      for (const f of thingsAt(w, tid)) destroy(x, f)
      destroy(x, tid)
    }
    vision(x, room, '\n$N一甩尾巴，现出金鱼的原身。', id)
    vision(x, room, '\n天上怒喝一声：金鱼，归我莲花池也！', id)
    vision(x, room, '金鱼闻声，乖乖地一纵身扭着腰摇晃着头游走了。', id)
    const team = party(w, killer)
    if (team.length) later(x, 1000, 'tongtian_chen', team)
  },
}
/** chen.c announce_success: 道行 10 years at least (XYJ 10000; here 1000). */
TIMERS.tongtian_chen = (x, team) => {
  for (const pid of team) {
    const p = x.w.players[pid]
    if (!p || self(p).exp < 1000) continue
    pass(x, pid, 'tongtian', '通天河救童男女，水宅降鱼精！', CHEN)
  }
}
