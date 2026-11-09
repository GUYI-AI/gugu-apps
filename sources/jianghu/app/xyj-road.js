// The road west after 五庄观 (xyj.js, d/qujing): 宝象国 and 平顶山, the second and third obstacles, from 西游记 4.5.
// - 宝象国 (baoxiang): past 白骨精's three shapes on the 野路 (yelu8.c, npc/nuzi.c, furen.c, gonggong.c), the cave of
//   波月洞 broken open at the 金塔 (dongwai.c), 黄袍怪 and his 山妖 beaten, 百花羞's letter carried to the king over a
//   pontoon bridge that comes and goes (baihua.c, qiao1.c, longfeng.c, king.c), and the princess led home.
// - 平顶山 (pingding): 金角, 银角, 狐阿七大王 and 老奶奶 killed, with the gourd, the vase and the rope they use
//   (npc/jinjiao.c, yinjiao.c, huaqi.c, laonai.c, obj/*real.c), and 太上老君 calls it done (taishang.c).
// What is not XYJ's (SOURCE.md): the monsters' numbers are set to this game's fights (TUNE); a deed counts for the
// team in the room, not the last blow alone; a 法宝 takes one fighter out for a while, and then needs a minute.
import {
  HOOKS, ROOMS, NPCS, ch, isNpc, baseOf, npcData, nameOf, thingsAt, makeThing, destroy, vision, tell, playersIn,
  npcsIn, spawnNpc, awake, attr,
} from './world.js'
import { cn } from './text.js'
import { brawl, knockOut } from './fight.js'
import { setDoor, move } from './game.js'
import { self, skillOf, PLACES, NO_WAY, FLY } from './xyj-story.js'

const N = HOOKS.npc
const R = HOOKS.room
const C = HOOKS.cmd
const BX = 'x/qujing/baoxiang/'
const PD = 'x/qujing/pingding/'
const rnd = (x, n) => (n > 0 ? Math.floor(x.rand() * n) : 0)
const alive = (w, id) => Boolean(w.npcs[id]) && !w.npcs[id].dead
const here = (w, room, base) => npcsIn(w, room).filter((n) => baseOf(n) === base && !w.npcs[n].dead)

Object.assign(PLACES, { 嘉峪关: 'x/westway/jiayu', 宝象国: BX + 'xi1', 平顶山: PD + 'shan11', 压龙山: PD + 'yalong1' })
NO_WAY.push(/baoxiang\/dong$/)
// fly.c: 宝象国 lands at its north gate, 平顶山 and 压龙山 on their tops.
Object.assign(FLY, { baoxiang: BX + 'bei1', 宝象国: BX + 'bei1', pingding: PD + 'ping1', 平顶山: PD + 'ping1', yalong: PD + 'yalong1', 压龙山: PD + 'yalong1' })

// ── the monsters' numbers ──────────────────────────────────────────────────────────────────────────────────────────

// XYJ sets these monsters against characters of hundreds of thousands of 道行, in fights of 气血 by the thousand. Here
// (fight.js, ES2's fights) a blow takes a few: each keeps its skills in proportion and its 气血 in absolute terms, so
// 宝象国 is beaten by one who has been through 五庄观 and trained a little, best with a friend (a newcomer will do), and
// 平顶山 by two such together. Played out in test/xyj-road.test.mjs.
const TUNE = {
  [BX + 'npc/nuzi']: [0.2, 60], [BX + 'npc/furen']: [0.2, 60], [BX + 'npc/gonggong']: [0.2, 60],
  [BX + 'npc/shanyao']: [0.2, 35], [BX + 'npc/huangpao']: [0.15, 80], [BX + 'npc/baihua']: [0.15, 60],
  [PD + 'npc/jinjiao']: [0.2, 100], [PD + 'npc/yinjiao']: [0.2, 100], [PD + 'npc/huaqi']: [0.2, 90], [PD + 'npc/laonai']: [0.25, 130],
  [PD + 'npc/yao1']: [0.2, 35], [PD + 'npc/yao2']: [0.15, 50],
  [BX + 'npc/lanpao']: [0.15, 150], [BX + 'npc/lupao']: [0.15, 150], [BX + 'npc/qingpao']: [0.15, 150],
  [BX + 'npc/zipao']: [0.15, 150],
  [PD + 'npc/hu']: [0.15, 60], [PD + 'npc/long']: [0.15, 60], [PD + 'npc/chong']: [0.15, 60], [PD + 'npc/gui']: [0.15, 60],
}
for (const [key, d] of Object.entries(NPCS)) {
  const t = TUNE[key.split('@')[0]]
  if (!t) continue
  const [k, pool] = t
  d.skills = Object.fromEntries(Object.entries(d.skills ?? {}).map(([s, v]) => [s, Math.max(1, Math.round(v * k))]))
  d.max = { kee: pool, sen: pool, gin: pool }
  d.exp = Math.round((d.exp ?? 0) * k / 10)
  // The real 法宝 or the fake one (jinjiao.c: whichever is not yet in the world): here always the real one.
  if (d.carry) d.carry = d.carry.filter(([c]) => !/fake$/.test(c))
}

// ── what counts, and for whom ───────────────────────────────────────────────────────────────────────────────────

/** Who a deed counts for: the player who did it and their team here with them (XYJ: the one with the last blow). */
function party(w, id) {
  if (!id || isNpc(id) || !w.players[id]) return []
  const p = w.players[id]
  const mates = p.team ? playersIn(w, p.room).filter((q) => q !== id && w.players[q].team === p.team && !w.players[q].ghost) : []
  return [id, ...mates]
}
const flags = (p) => (self(p).qj ??= {})
const announce = (x, who, text) => vision(x, ch(x.w, who)?.room, `【闲聊】${nameOf(x.w, who)}：${text}`, null, null, { k: 'chat' })

/** An obstacle passed (king.c / taishang.c announce_success): 3000 道行 and some (king.c random(800), taishang.c 700). */
function pass(x, pid, key, say, by, some = 800) {
  const w = x.w
  const p = w.players[pid]
  const y = self(p)
  if (y.obstacle[key] === 'done') return
  y.obstacle[key] = 'done'
  const i = rnd(x, some)
  y.exp += 3000 + i
  announce(x, by, `${p.name}${say}`)
  announce(x, by, `${p.name}顺利闯过西行又一关！`)
  tell(x, pid, `你赢得了三年${cn(Math.floor(i / 4))}天${cn((i % 4) * 3)}时辰的道行！`)
}

// ── 宝象国: 白骨精 on the 野路 ────────────────────────────────────────────────────────────────────────────────────

const YELU8 = BX + 'yelu8'
const FORMS = [
  ['nuzi', '$N对$n说道：哟，客从何来？', '只见一个老妇人拄着竹杖，一步一哭地走了过来。'],
  ['furen', '$N对$n说道：唉，可见吾小女？', '只见一个老公公手持龙头拐杖，口中念着经，走了过来。'],
  ['gonggong', '$N对$n说道：唉唉，可见吾小女老妻？', null],
]
/** yelu8.c valid_leave: west of the 野路, one of 白骨精's three shapes stands in the way till each is killed in turn. */
R[YELU8] = {
  leave(x, d) {
    if (d === '东') return null
    const p = x.w.players[x.me]
    const q = flags(p)
    if (self(p).obstacle.baoxiang === 'done' || q.bx_gonggong) return null
    if (rnd(x, 20) === 0) return null
    const [k, hello] = FORMS.find(([f]) => !q['bx_' + f])
    const id = `n:${BX}npc/${k}`
    if (!alive(x.w, id) || ch(x.w, id).room !== YELU8) {
      spawnNpc(x, id, YELU8)
      vision(x, YELU8, hello, id, x.me)
    }
    return `你眼前身影一晃，似乎有谁挡住了你的路。（${nameOf(x.w, id)}拦在路上：「杀 ${nameOf(x.w, id)}」）`
  },
}
FORMS.forEach(([k, hello, next], i) => {
  N[BX + 'npc/' + k] = {
    init(x, id, pid) { if (!isNpc(pid) && !rnd(x, 2)) vision(x, ch(x.w, id).room, hello, id, pid) },
    die(x, id, killer) {
      for (const pid of party(x.w, killer)) flags(x.w.players[pid])['bx_' + k] = 1
      if (!next) return vision(x, YELU8, '一阵阴风刮过，地上只剩下一堆白骨。白骨精的三变都给识破了，往西的野路通了。')
      const id2 = `n:${BX}npc/${FORMS[i + 1][0]}`
      spawnNpc(x, id2, YELU8)
      vision(x, YELU8, next, id2)
    },
  }
})

// ── 宝象国: 波月洞 ───────────────────────────────────────────────────────────────────────────────────────────────

const JINTA = BX + 'dongwai'
const DONG = BX + 'dong'
const SLAB = 60_000 // dongwai.c: the slab closes again after 10 s; here a minute, so a team gets in together
ROOMS[JINTA].exits['东南'] = DONG
ROOMS[JINTA].doors = { 东南: { name: '白玉石板', closed: true, locked: '白玉石板纹丝不动。（运足内力法力「撞 石板」）' } }
/** dongwai.c do_break: with 内力 and 法力 enough (XYJ 300 each, here 30), the slab gives way to 波月洞. */
C.break = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  if (p.room !== JINTA || (rest && !/石板|shi ?ban/.test(rest))) return x.out.push('你要撞什么？')
  if (!(w.rooms[JINTA]?.doors?.['东南'] ?? true)) return x.out.push('石板已经撞开了。')
  const y = self(p)
  vision(x, JINTA, '$N大喝一声，使尽周身神力撞向白玉石板！', x.me)
  if (y.force < 30 || y.mana < 30) {
    y.force = 0
    y.mana = 0
    p.out = x.now + 20_000
    vision(x, JINTA, '$N被震得眼冒金星，一头栽倒在地。', x.me)
    return x.out.push('（内力和法力都要有三十以上才撞得开：「打坐」「冥想」。）')
  }
  y.force -= 30
  y.mana -= 30
  setDoor(x, JINTA, '东南', false)
  ;(w.rooms[JINTA] ??= {}).broke = x.now
  vision(x, JINTA, '刹那间天崩地裂，金塔突然消失得无影无踪！崖壁处现出一个大洞穴，阴气缭绕，石牙交错。', x.me)
}
/** dongwai.c close_up: a while later the 金塔 is back and the slab shut. */
const prevBeat = HOOKS.beat
HOOKS.beat = (x) => {
  prevBeat?.(x)
  const r = x.w.rooms[JINTA]
  if (!r?.broke || x.now - r.broke < SLAB) return
  delete r.broke
  setDoor(x, JINTA, '东南', true)
  vision(x, JINTA, '轰隆一声巨响，一切都还原了！')
  vision(x, DONG, '轰隆一声巨响，洞口的白玉石板又合上了。')
}

/** baihua.c execute_ask: in 波月洞 with 黄袍怪 and his 山妖 gone, 道行 enough (XYJ 20000, here 2000), and once a reset. */
N[BX + 'npc/baihua'] = {
  ask: {
    execute_ask(x, id) {
      const w = x.w
      const p = w.players[x.me]
      const room = ch(w, id).room
      const shake = (why) => { vision(x, room, '$N摇了摇头。', id); if (why) x.out.push(why) }
      if (self(p).exp < 2000) return shake('（百花羞看你道行太浅，不敢托付。道行两千以上再来。）')
      if (room !== DONG) return shake()
      if (here(w, DONG, BX + 'npc/huangpao').length || npcsIn(w, DONG).some((n) => baseOf(n).startsWith(BX + 'npc/shanyao') && !w.npcs[n].dead))
        return shake('（黄袍怪和山妖还在洞里，百花羞不敢开口。）')
      const r = (w.rooms[DONG] ??= {})
      if (r.letter) return shake()
      if (self(p).obstacle.baoxiang === 'done') return shake()
      r.letter = x.me
      vision(x, room, '$N点了点头。', id)
      makeThing(x, BX + 'obj/letter', x.me, 1, { owner: x.me })
      vision(x, room, '$N悄悄对$n说道：将此秘信速交国王！事不宜迟！', id, x.me)
      vision(x, room, '$N给$n一封秘信。', id, x.me, { to: x.me, k: 'give' })
      // obstacle/baoxiang (kept, set the first time only) and its temp (this time): `bxp` and `bx` here.
      for (const pid of party(w, x.me)) { const q = flags(w.players[pid]); q.bx = 'got_letter'; q.bxp ??= 'got_letter' }
    },
  },
  /** check_rescure: whoever brings the 军令牌 back, the cave clear, is followed home. */
  init(x, id, pid) {
    const w = x.w
    if (isNpc(pid) || ch(w, id).follow) return
    if (flags(w.players[pid]).bx !== 'given_letter' || !thingsAt(w, pid).some((t) => w.things[t].id === BX + 'obj/ling')) return
    if (here(w, DONG, BX + 'npc/huangpao').length || here(w, DONG, BX + 'npc/shanyao').length) return
    w.npcs[id].follow = pid
    vision(x, ch(w, id).room, '$N对$n急切地说道：恩人！快带我去见父王！', id, pid)
  },
}

// ── 宝象国: the 腥风 of 碗子山 and the 野渡 ──────────────────────────────────────────────────────────────────────

/** shanwan1–3.c, yedu.c valid_leave: a 腥风 knocks down the untried (XYJ combat_exp 2000; here 道行 20, which one who
 * has fought alongside on the 野路 has); at the 野渡 anyone, half the time, once a crossing. */
const UNTRIED = 20
function faint(x, room) {
  vision(x, room, '一阵腥风吹来，$N顿时头重脚轻。', x.me)
  knockOut(x, x.me, (t, id) => vision(x, room, t, id))
  return '你禁不住踉跄了几下，两腿突然一软。'
}
for (const [room, dir] of [['shanwan1', '西'], ['shanwan2', '西北'], ['shanwan3', '北']]) {
  R[BX + room] = { leave: (x, d) => (d === dir && self(x.w.players[x.me]).exp < UNTRIED ? faint(x, BX + room) : null) }
}
R[BX + 'yedu'] = {
  leave(x) {
    const p = x.w.players[x.me]
    const t = (p.temp ??= {})
    if ((self(p).exp < UNTRIED || rnd(x, 2)) && !t.fainted_yedu) {
      t.fainted_yedu = 1
      return faint(x, BX + 'yedu')
    }
    t.fainted_yedu = 0
    return null
  },
}

// ── 宝象国: the robed monsters of the 沼 (shan2.c, shan3.c, shan5.c; npc/lanpao.c, lupao.c, qingpao.c) ──────────────

const ROBES = ['lanpao', 'lupao', 'qingpao']
const MIRE = ['shan2', 'shan3', 'shan5'].map((r) => BX + r)
for (const room of MIRE) {
  R[room] = {
    /** init: 10–40 s after someone comes in, if they are still here, the three come up (once, till the next arrival). */
    init(x, pid) {
      const r = (x.w.rooms[room] ??= {})
      if (!r.rise || r.rise.at < x.now) r.rise = { at: x.now + (10 + rnd(x, 30)) * 1000, who: pid }
    },
  }
}
for (const k of [...ROBES, 'zipao']) {
  N[BX + 'npc/' + k] = {
    /** die / unconcious: gone up in smoke, nothing left. */
    die(x, id) {
      const room = ch(x.w, id).room
      vision(x, room, '$N呼地一声化作股烟向天上飞去。', id)
      for (const tid of thingsAt(x.w, room)) if (x.w.things[tid].id === 'corpse' && x.w.things[tid].of === id) destroy(x, tid)
    },
  }
}

// ── 宝象国: 黄袍怪 and his wife (npc/huangpao.c) ──────────────────────────────────────────────────────────────────

N[BX + 'npc/huangpao'] = {
  /** init: he keeps by his wife (set_leader); her attacker is his too (baihua.c kill_ob). */
  init(x, id) {
    const wife = here(x.w, ch(x.w, id).room, BX + 'npc/baihua')[0]
    if (wife) x.w.npcs[id].guarding = wife
  },
  /** kill_ob: attacked, he turns on her as well, once (being_killed). */
  attacked(x, id) {
    const w = x.w
    if (!alive(w, id)) return
    const wife = here(w, ch(w, id).room, BX + 'npc/baihua')[0]
    if (!wife || w.npcs[wife].beingKilled) return
    w.npcs[wife].beingKilled = true
    brawl(x, id, wife, 'kill')
  },
  /** die: the star he was flies home. */
  die(x, id) { vision(x, ch(x.w, id).room, '奎木狼星嗖地向天空飞去……') },
  ask: { give_dan(x, id) { vision(x, ch(x.w, id).room, '$N说道：你是何许人也？', id) } }, // only for one changed into 百花羞
}
NPCS[BX + 'npc/huangpao'].inquiry = Object.fromEntries(['丹', '内丹', '舍利子', '舍利子内丹'].map((k) => [k, { fn: 'give_dan' }]))

// ── 宝象国: the pontoon bridge, the hall, the king ─────────────────────────────────────────────────────────────────

/** qiao1.c / qiao2.c: the boats come together and drift apart every twenty seconds. */
const bridgeApart = (now) => Math.floor(now / 20_000) % 2 === 1
const bridge = (dir) => ({
  leave(x, d) {
    if (d !== dir || !bridgeApart(x.now)) return null
    return `河面上用船搭成的浮桥已被拆开，过不去。（船每二十秒聚散一次，还要等${cn(20 - Math.floor((x.now % 20_000) / 1000))}秒。）`
  },
})
R[BX + 'qiao1'] = bridge('南')
R[BX + 'qiao2'] = bridge('北')
/** longfeng.c: the 阁门大使 lets nobody up to the hall who has no business with the king. */
R[BX + 'longfeng'] = {
  leave(x, d) {
    const p = x.w.players[x.me]
    if (d !== '南' || !here(x.w, BX + 'longfeng', BX + 'npc/dashi').some((n) => awake(x.w, n, x.now))) return null
    if (flags(p).bx || self(p).obstacle.baoxiang) return null
    return '阁门大使向你摇了摇手。'
  },
}
const KING = BX + 'npc/king'
N[KING] = {
  /** king.c accept_object: the letter, read; the 军令牌 given to lead the troops. */
  accept(x, id, tid) {
    const w = x.w
    const t = w.things[tid]
    if (ch(w, id).room !== BX + 'tiandi' || t?.id !== BX + 'obj/letter') return false
    if (t.owner && t.owner !== x.me) {
      vision(x, BX + 'tiandi', '秘信一落，慢慢地随风飘去……')
      destroy(x, tid)
      return true
    }
    const q = flags(w.players[x.me])
    if (q.bx !== 'got_letter') return false
    destroy(x, tid)
    const room = BX + 'tiandi'
    // read_letter, 3 s on in XYJ (and send_to_fight 3 s after): here at once.
    if (q.bxp === 'got_letter') {
      vision(x, room, '$N读罢秘信，不禁涕泪俱下。', id)
      vision(x, room, '$N道：吾儿不幸，被妖倚强罢占为妻，已有十三年之久！', id)
      vision(x, room, '此刻三宫滴泪，文武伤情，宫中一片哭声。')
    } else vision(x, room, `$N对$n道：这位${w.players[x.me].gender === '女性' ? '姑娘' : '壮士'}，又来相助，教寡人今生如何相报。`, id, x.me)
    vision(x, room, '$N大声说道：令$n兴兵领将，与寡人捉杀妖魔，救我百花公主！', id, x.me)
    vision(x, room, '旁边早有军机大臣上前递给$n一支军令牌。', id, x.me)
    makeThing(x, BX + 'obj/ling', x.me, 1)
    for (const pid of party(w, x.me)) { const f = flags(w.players[pid]); f.bx = 'given_letter'; f.bxp = 'given_letter' }
    x.out.push('（带着军令牌回波月洞，领百花公主回来见国王。）')
    return true
  },
}
/** king.c check_princess: 百花羞 brought to the hall by whoever holds the 军令牌; it is done for them and their team. */
const prevArrive = R[BX + 'tiandi']?.init
R[BX + 'tiandi'] = {
  init(x, pid) {
    prevArrive?.(x, pid)
    const w = x.w
    const room = BX + 'tiandi'
    const king = here(w, room, KING)[0]
    const princess = here(w, room, BX + 'npc/baihua').find((n) => w.npcs[n].follow === pid)
    if (!king || !princess) return
    if (flags(w.players[pid]).bx !== 'given_letter' || !thingsAt(w, pid).some((t) => w.things[t].id === BX + 'obj/ling')) return
    delete w.npcs[princess].follow
    w.npcs[princess].home = room
    vision(x, room, '$N见了$n一愣，然后老泪纵横地将$n拉过去。', king, princess)
    for (const q of party(w, pid)) pass(x, q, 'baoxiang', '兴兵领将，替宝象大国捉杀妖魔，解救百花公主！', king)
  },
}

// ── 平顶山: the four, and the 法宝 ───────────────────────────────────────────────────────────────────────────────

const FOUR = {
  jinjiao: ['金角童子', '紫金红葫芦'], yinjiao: ['银角童子', '羊脂玉净瓶'], huaqi: ['狐阿七', '幌金绳'], laonai: ['九尾狐狸', null],
}
for (const [k, [child, fabao]] of Object.entries(FOUR)) {
  N[PD + 'npc/' + k] = {
    /** accept_fight: a challenge is taken as to the death. */
    fight: () => 'kill',
    /** jinjiao.c hurting (and its 法宝's do_ji): at the start, the 法宝 takes the one who attacks out of the fight. */
    kill(x, id, pid, lead) {
      if (!fabao) return
      const w = x.w
      const c = ch(w, id)
      if ((c.fabao ?? 0) > x.now) return // 祭过一次，还要一会儿才祭得出
      if (!thingsAt(w, id).some((t) => /real$/.test(w.things[t].id))) return
      c.fabao = x.now + 60_000
      // ap / dp as hulureal.c: 道行 by the thousand and 法术 cubed, the attacker's against the monster's.
      const power = (exp, sp) => exp / 1000 + (sp / 10) ** 3 / 3 + 1
      const p = w.players[pid]
      const ap = power(npcData(id).exp ?? 0, npcData(id).skills?.spells ?? 0)
      const dp = power(self(p).exp, skillOf(p, 'spells'))
      vision(x, c.room, `$N口中念着咒语，掏出${fabao}，冷不丁地对$n一喊：「${p.name}！」`, id, pid)
      if (rnd(x, Math.ceil(ap + dp)) < dp) { vision(x, c.room, '$n知道有诈，闭口不语，结果什么都没发生。', id, pid); return }
      vision(x, c.room, `$n顺口答道：「在！」倾刻之间$n被${fabao}叭地一声活活吸了进去！`, id, pid)
      p.out = x.now + 30_000
      x.out.push(`（你要过半分钟才出得来。${nameOf(w, id)}祭过${fabao}，一分钟内祭不出第二次：趁这时候让同伴动手。）`)
      return false
    },
    /** die(): the true shape, the 法宝 dropped, and 太上老君 told (taishang.c announce_success). */
    die(x, id, killer) {
      const w = x.w
      const room = ch(w, id).room
      vision(x, room, `$N无可奈何地现了真身，原来是${k === 'laonai' || k === 'huaqi' ? '' : '太上老君的'}${child}。`, id)
      for (const tid of thingsAt(w, room)) {
        const t = w.things[tid]
        if (t.id === 'corpse' && t.of === id) for (const f of thingsAt(w, tid)) if (/real$/.test(w.things[f].id)) w.things[f].at = room
      }
      for (const pid of party(w, killer)) {
        const q = flags(w.players[pid])
        q['pd_' + k] = 1
        if (Object.keys(FOUR).every((f) => q['pd_' + f])) {
          pass(x, pid, 'pingding', '平顶山压龙山施威，替老夫收回金银童子！', id, 700)
        }
      }
    },
  }
}
// 平顶山's 小妖 fall on whoever comes in (attitude aggressive), as do those of 压龙洞.
for (const k of ['yao1', 'yao2']) {
  N[PD + 'npc/' + k] = {
    init(x, id, pid) {
      const w = x.w
      if (isNpc(pid) || w.players[pid].ghost || !awake(w, id, x.now) || ROOMS[ch(w, id).room].noFight) return
      brawl(x, id, pid, 'kill', [['$N对着$n大喝一声：哪里来的毛贼，敢闯我家大王的洞府！', id, pid]])
    },
  }
}

// A person placed in several rooms is one entry a room (`npc/yao1@nandong`, xyj.js): each keeps the rules of its kind.
for (const key of Object.keys(NPCS)) {
  const base = key.split('@')[0]
  if (base !== key && N[base] && !N[key]) N[key] = N[base]
}

// ── the road west: the 石栈 and its iron cage (westway/shizhan.c, tielong.c) ────────────────────────────────────

const SHIZHAN = 'x/westway/shizhan'
const CAGE = 'x/westway/tielong'
R[SHIZHAN] = {
  /** init: 25 s after one comes in, if they are still here, all in the room drop into the cage; then 5 minutes quiet. */
  init(x, pid) {
    const r = (x.w.rooms[SHIZHAN] ??= {})
    if ((r.done ?? 0) > x.now) return
    r.trap = { at: x.now + 25_000, who: pid }
  },
}
/** tielong.c do_break: 「扳 铁笼」, strength of arm (XYJ force_factor×5 + str, to 3000 in all; here str, to 300), 30 气 a
 * try; bent far enough, a way out to the north road. */
C.break = ((prev) => (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  if (p.room !== CAGE) return prev(x, rest)
  const r = (w.rooms[CAGE] ??= {})
  if (r.open) return x.out.push('铁笼已经打开了，别费劲了。')
  if (rest && !/铁笼|栏杆|tielong|cage/.test(rest)) return prev(x, rest)
  const i = attr(w, x.me, 'str')
  vision(x, CAGE, '$N扯着铁栏杆，双手一较劲，大喊一声“开！”', x.me)
  vision(x, CAGE, i > 30 ? '只听铁栏杆发出“咔，咔”的响声………' : i > 20 ? '只见铁栏杆慢慢变弯………' : i > 10 ? '铁栏杆好象被扳弯了一些………' : '铁栏杆好象没有什么动静………')
  r.bent = (r.bent ?? 0) + i
  p.kee.cur = Math.max(0, p.kee.cur - 30)
  if (r.bent > 300) {
    r.open = true
    setDoor(x, CAGE, '出去', false)
    vision(x, CAGE, '铁栏杆的缝隙足够一个人钻出去了。')
  }
})(C.break)
// The way out is there once the bars are bent (exits/out): a door here, shut till then, and again at the reset.
ROOMS[CAGE].exits['出去'] = 'x/westway/lu1'
ROOMS[CAGE].doors = { 出去: { name: '铁栏杆', closed: true, locked: '铁笼是由手指粗的钢条圈成，看起来十分的坚固。（「扳 铁笼」）' } }
R[CAGE] = {
  leave(x, d) {
    if (d === '出去') vision(x, CAGE, '$N躬身从铁笼中钻了出去。', x.me)
    return null
  },
}

// Timers of these rooms, run as the world catches up (XYJ call_outs).
const prevBeat2 = HOOKS.beat
HOOKS.beat = (x) => {
  prevBeat2?.(x)
  const w = x.w
  for (const room of MIRE) {
    const r = w.rooms[room]
    if (!r?.rise || r.rise.at > x.now || r.rise.done) continue
    r.rise.done = true
    if (w.players[r.rise.who]?.room !== room) continue
    for (const k of ROBES) {
      const id = `n:${BX}npc/${k}.${room.split('/').pop()}`
      if (alive(w, id) && ch(w, id).room === room) continue
      spawnNpc(x, id, room)
      w.npcs[id].sink = x.now + 9000
      vision(x, room, '呼地一声，沼里冒上来长袍怪物！')
    }
  }
  for (const [id, c] of Object.entries(w.npcs)) {
    if (!c.sink || c.sink > x.now || c.dead) continue
    vision(x, c.room, '$N一个反身大翻转，一头钻入沼泽之中。', id)
    for (const tid of thingsAt(w, id)) destroy(x, tid)
    delete w.npcs[id]
  }
  const t = w.rooms[SHIZHAN]?.trap
  if (t && t.at <= x.now) {
    delete w.rooms[SHIZHAN].trap
    if (w.players[t.who]?.room === SHIZHAN) {
      vision(x, SHIZHAN, '你忽然觉得脚下的石板松动了………')
      for (const id of [...playersIn(w, SHIZHAN), ...npcsIn(w, SHIZHAN)]) {
        move(x, id, '', CAGE, { quiet: true })
        vision(x, CAGE, '「咚」的一声，$N从机关掉到了铁笼中………', id)
      }
      w.rooms[SHIZHAN].done = x.now + 300_000
    }
  }
}
