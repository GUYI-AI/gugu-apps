// 西游记 4.5's 长安城, the road west and 五庄观 (xyj.js). A newcomer arrives at 长安's 南城客栈. What is here is
// XYJ's, carried over from the LPC of the files named (see SOURCE.md):
// - XYJ's growth: 内力 and 法力 (exercise.c, meditate.c), 潜能 spent to learn from a master (learn.c,
//   enable.c), 道行 from fighting (combatd.c), the body's 气血 and 精神 by them (race/human.c), 腾云 (fly.c).
// - The first obstacle of the road west, 五庄观's 人参果 (d/qujing/wuzhuang): over the 八卦桥 with every bridge crossed
//   once (wzgmaze*.c), a key felt for under 牡丹亭 (anshi.c), the gate of the orchard opened with it (xiguadi.c), and
//   镇元大仙's 人参果 meeting (renshenguo-yuan.c, npc/zhenyuan.c); the fruit eaten marks it done (renshen-guo.c).
import {
  HOOKS, ROOMS, ITEMS, NPCS, ch, isNpc, baseOf, npcData, awake, nameOf, attr, thingsAt, makeThing, destroy, vision, tell,
  npcSay, peopleIn, playersIn, npcsIn, spawnNpc, consume, START, online, isMoney,
} from './world.js'
import { SKILL_NAMES, DIRS, cn, gameTime } from './text.js'
import { knockOut, brawl } from './fight.js'
import { move, setDoor, lookText, lead } from './game.js'

const N = HOOKS.npc
const R = HOOKS.room
const C = HOOKS.cmd
const WZ = 'x/qujing/wuzhuang/'
const GARDEN = WZ + 'renshenguo-yuan'
const ZHENYUAN = WZ + 'npc/zhenyuan'
const MEET = `n:${ZHENYUAN}.2` // the one who comes out in the orchard; the other sits in 乘云阁
const rnd = (x, n) => (n > 0 ? Math.floor(x.rand() * n) : 0)

// ── the character in this world ────────────────────────────────────────────────────────────────────────────────

/** A player's XYJ self (logind.c: 潜能 99, nothing else yet), made when they arrive. */
export function self(p) {
  return (p.xyj ??= { force: 0, maxForce: 0, mana: 0, maxMana: 0, exp: 0, pot: 99, spent: 0, obstacle: {} })
}
/** race/human.c: 气血 and 精神 start at 100 (age 14) and grow with 内力 (÷4) and 法力 (×2÷5). */
export function bodyMax(p) {
  const y = self(p)
  const m = { gin: 100, kee: 100 + Math.floor(y.maxForce / 4), sen: 100 + Math.floor(y.maxMana * 2 / 5) }
  for (const k of ['gin', 'kee', 'sen']) {
    const s = p[k]
    if (s.max === m[k]) continue
    if (m[k] > s.max) s.eff += m[k] - s.max
    s.max = m[k]
    s.eff = Math.min(s.eff, s.max)
    s.cur = Math.min(s.cur, s.eff)
  }
  // damage.c max_food_capacity / max_water_capacity: the body's weight ÷ 200 (human.c: 40 kg and 2 kg a point of 膂力).
  stomach(p, Math.max(100, 200 + (p.attrs.str - 10) * 10), Math.max(100, 200 + (p.attrs.str - 10) * 10))
}
/** Food and water to hold at most these (what is in them stays). */
function stomach(p, food, water) {
  for (const [k, m] of [['food', food], ['water', water]]) if (p[k]) { p[k].max = m; p[k].cur = Math.min(p[k].cur, m); if ('eff' in p[k]) p[k].eff = Math.min(p[k].eff, m) }
}
const full = (n) => ({ cur: n, eff: n, max: n })

/** skill.c query_skill: half the basic skill and all of the special one enabled for it. */
export function skillOf(p, s) {
  const basic = p.skills?.[s] ?? 0
  const special = p.map?.[s] ? p.skills?.[p.map[s]] ?? 0 : 0
  return Math.floor(basic / 2) + special
}

// XYJ's names of the skills one meets here (data/chinese.o).
const XYJ_SKILLS = {
  spells: '基本法术', taiyi: '太乙仙法', 'zhenyuan-force': '镇元神功', 'wuxing-quan': '五行拳', baguazhen: '八卦阵法',
  'sanqing-jian': '三清剑法', hammer: '基本锤法', 'kaishan-chui': '开山锤', 'fumo-zhang': '伏魔杖', 'yange-blade': '雁歌刀法',
  changquan: '长拳', baguazhou: '八卦咒', dao: '道家仙法', whip: '基础鞭术', spear: '基本枪法',
}
for (const [k, v] of Object.entries(XYJ_SKILLS)) SKILL_NAMES[k] ??= v
const WORDS = {
  force: ['内功', '内功心法'], spells: ['法术', '基本法术'], unarmed: ['扑击', '拳脚', '扑击格斗', '徒手'], dodge: ['轻功', '闪躲', '基本轻功'],
  parry: ['招架', '拆招'], sword: ['剑术', '剑法', '基本剑术'], blade: ['刀法', '基本刀法'], staff: ['杖法', '基本杖法'], literate: ['读书', '识字'],
}
/** The skill a player means: its id, its Chinese name or a common word for it. */
function skillNamed(text) {
  const t = text.trim().toLowerCase()
  for (const [k, ws] of Object.entries(WORDS)) if (ws.includes(t)) return k
  return Object.keys(SKILL_NAMES).find((k) => k === t || SKILL_NAMES[k] === t) ?? null
}
/** Special skills and the basic one each is enabled for (the skills' own files). */
const SPECIAL = {
  'zhenyuan-force': 'force', taiyi: 'spells', 'wuxing-quan': 'unarmed', baguazhen: 'dodge', 'sanqing-jian': 'sword',
  'kaishan-chui': 'hammer', 'fumo-zhang': 'staff', 'yange-blade': 'blade', changquan: 'unarmed', baguazhou: 'spells', dao: 'spells',
}
/** Skills that are not 武学 (learn.c holds 武学 back until 道行 is enough for it). */
const NOT_MARTIAL = new Set(['force', 'spells', 'literate', 'taiyi', 'zhenyuan-force', 'baguazhou', 'dao'])
/** valid_learn of the special skills here. */
const VALID = {
  taiyi: (p) => ((p.skills.spells ?? 0) < 10 || (p.skills.spells ?? 0) <= (p.skills.taiyi ?? 0) ? '你的法术修为还不够高深，无法学习太乙仙法。' : null),
  'zhenyuan-force': (p) => ((p.skills.force ?? 0) < 10 ? '你的内功修为还不够高深，无法学习镇元神功。' : null),
}

/** 道行 as hp.c tells it: a year is 1000, a day 4. */
function daoxing(exp) {
  const year = Math.floor(exp / 1000)
  const day = Math.floor((exp - year * 1000) / 4)
  const hour = (exp - year * 1000 - day * 4) * 3
  const t = `${year ? cn(year) + '年' : ''}${day ? cn(day) + '天' : ''}${hour ? cn(hour) + '时辰' : ''}`
  return t || '你还没有道行。'
}

/** The person here a name means, read as the engine reads one (game.js lead). */
function personHere(x, text) {
  const w = x.w
  if (!text.trim()) return null
  const names = (id) => (isNpc(id) ? [npcData(id).name, ...npcData(id).ids] : [w.players[id].name])
  const t = lead(peopleIn(w, ch(w, x.me).room).filter((id) => id !== x.me).map((id) => ({ key: id, names: names(id) })), text.trim())
  return t && { id: t.key, rest: t.rest }
}

const busy = (x, p) => (self(p).busy ?? 0) > x.now
const setBusy = (x, p, s) => { self(p).busy = x.now + s * 1000 }

// ── arriving ───────────────────────────────────────────────────────────────────────────────────────────────────

const INTRO = '你一路向西，来到了大唐的京城长安。\n（拜师「拜师 张果老」，学艺「学 法术 从 张果老」，查看「状态」「取经」，赶路「去 五庄观」。）'
/** A newcomer starts in 长安's inn with a body of 100 (race/human.c), fed and watered to the full (logind.c). */
HOOKS.born = (x, me) => {
  const p = x.w.players[me]
  Object.assign(p, { gin: full(100), kee: full(100), sen: full(100) })
  self(p)
  bodyMax(p)
  for (const k of ['food', 'water']) if (p[k]) { p[k].cur = p[k].max; if ('eff' in p[k]) p[k].eff = p[k].max }
  vision(x, START, '$N风尘仆仆地走了进来。', me, null, { k: 'move' })
  tell(x, me, INTRO)
}

// ── status ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** hp.c */
C.hp = (x) => {
  bodyMax(x.w.players[x.me])
  x.out.push(statusText(x.w, x.me))
}
/** What hp.c shows: 气血, 精神, 魂魄, 内力 and 法力, food, water, 潜能 and 道行. */
export function statusText(w, id) {
  const p = w.players[id]
  const y = self(p)
  const pct = (s) => Math.floor(s.eff * 100 / s.max)
  return [
    ` 气血：${p.kee.cur}/${p.kee.eff}（${pct(p.kee)}%）　内力：${y.force}/${y.maxForce}`,
    ` 精神：${p.sen.cur}/${p.sen.eff}（${pct(p.sen)}%）　法力：${y.mana}/${y.maxMana}`,
    ` 魂魄：${p.gin.cur}/${p.gin.eff}（${pct(p.gin)}%）`,
    ` 食物：${p.food.cur}/${p.food.max}　潜能：${y.pot - y.spent}`,
    ` 饮水：${p.water.cur}/${p.water.max}　道行：${daoxing(y.exp)}`,
    ...(p.ghost ? [' 你现在是鬼魂。'] : []),
  ].join('\n')
}
C.score = (x) => {
  const p = x.w.players[x.me]
  const y = self(p)
  const fam = y.family ? `${y.family.name}第${cn(y.family.gen)}代弟子，师父${npcData('n:' + y.family.master)?.name ?? ''}` : '普通百姓'
  x.out.push([`【${fam}】${p.name}`, `道行：${daoxing(y.exp)}　潜能：${y.pot - y.spent}`,
    `内力：${y.force}/${y.maxForce}　法力：${y.mana}/${y.maxMana}`].join('\n'))
  C.obstacles(x)
}

/** obstacles.c with include/obstacle.h: the 24 obstacles of the road west, done and to come. */
const OBSTACLES = [
  ['wuzhuang', '五庄观／人参果'], ['baoxiang', '宝象国／碗子山'], ['pingding', '平顶山／莲花洞／压龙山／压龙洞'], ['wuji', '乌鸡国／宝林寺'],
  ['chechi', '车迟国／三清观'], ['tongtian', '通天河／陈家庄'], ['jindou', '金兜山／金兜洞'], ['nuerguo', '女儿国／解阳山'],
  ['dudi', '毒敌山／琵琶洞'], ['firemount', '火焰山／翠云山'], ['jilei', '积雷山／摩云洞'], ['jisaiguo', '祭赛国／碧波潭'],
  ['jingjiling', '荆棘岭／木仙庵'], ['xiaoxitian', '小西天／小雷音寺'], ['zhuzi', '朱紫国／麒麟山／獬豸洞'], ['pansi', '盘丝岭／盘丝洞／黄花观／紫云山'],
  ['biqiu', '比丘国／清华庄／清华洞'], ['wudidong', '无底洞／黑松林'], ['qinfa', '钦法国'], ['yinwu', '隐雾山／连环洞'], ['fengxian', '凤仙郡'],
  ['yuhua', '玉华县／豹头山／虎口洞／竹节山／九曲盘桓洞'], ['jinping', '金平府／青龙山／玄英洞'], ['tianzhu', '天竺国／毛颖山／三连穴'],
]
C.obstacles = (x) => {
  const y = self(x.w.players[x.me])
  const row = ([, n], i) => `  ${String(i + 1).padStart(2, ' ')}. ${n}`
  const done = OBSTACLES.map((o, i) => [o, i]).filter(([[k]]) => y.obstacle[k] === 'done')
  const left = OBSTACLES.map((o, i) => [o, i]).filter(([[k]]) => y.obstacle[k] !== 'done')
  const out = [done.length ? `你西行求取真经已过了${cn(done.length)}关：\n${done.map(([o, i]) => row(o, i)).join('\n')}` : '你尚未西行求取真经。']
  out.push(left.length ? `你西行求取真经还须过${cn(left.length)}关：\n${left.map(([o, i]) => row(o, i)).join('\n')}` : '你西行求取真经已历尽了所有的难关。')
  x.out.push(out.join('\n'))
}

// ── growth: masters, learning, 内力 and 法力 ───────────────────────────────────────────────────────────────────

/** F_MASTER recruit: into the master's family, a generation below. */
function recruit(x, id) {
  const p = x.w.players[x.me]
  const y = self(p)
  const f = npcData(id).family
  y.family = { name: f.name, gen: f.gen + 1, master: baseOf(id) }
  p.title = `${f.name}第${cn(f.gen + 1)}代弟子`
  vision(x, p.room, '$N决定收$n为弟子。', id, x.me)
  x.out.push(`恭喜您成为${f.name}的第${cn(f.gen + 1)}代弟子。`)
}
/** The 八仙 of 五庄观 and 张果老 (npc/*.c attempt_apprentice): anyone not of 五庄观 is taken in. */
function baxian(welcome, sameGen = (x, id) => npcSay(x, id, '师兄太客气了。')) {
  return (x, id) => {
    const y = self(x.w.players[x.me])
    const gen = npcData(id).family.gen
    if (y.family?.name === '五庄观') {
      if (y.family.gen < gen) npcSay(x, id, '师叔见笑了。')
      else if (y.family.gen === gen) sameGen(x, id)
      else { vision(x, ch(x.w, id).room, '$N沉思了一会儿。', id); npcSay(x, id, '是你自己要拜的，你师父打上门来我可得拿你挡。'); recruit(x, id) }
      return true
    }
    npcSay(x, id, welcome)
    recruit(x, id)
    return true
  }
}
N[WZ + 'npc/zhangguolao'] = { apprentice: baxian('好，好好干，张果老不行，徒弟可不能差了。') }
N[WZ + 'npc/hexiangu'] = { apprentice: baxian('好，我五庄观一门人才辈出，你可得给师父争气。', (x, id) => npcSay(x, id, '你这个家伙，敢拿姑奶奶我来消遣！')) }
N[WZ + 'npc/lancaihe'] = { apprentice: baxian('好，那我就勉为其难吧。') }
N[WZ + 'npc/tieguaili'] = { apprentice: baxian('好，我五庄观一门人才辈出，你可得给师父争气。') }
N[WZ + 'npc/hanxiangzi'] = { apprentice: baxian('好，我五庄观一门人才辈出，你可得给师父争气。') }
N[WZ + 'npc/caoguojiu'] = { apprentice: baxian('好，不过在我这儿可不许偷懒！') }
N[WZ + 'npc/hanzhongli'] = { apprentice: baxian('好，不过在我这儿可不许偷懒！') }
/** npc/zhenyuan.c: only 五庄观's own of the third generation, with 道行 and 太乙仙法 enough. */
N[ZHENYUAN] = {
  apprentice(x, id) {
    const p = x.w.players[x.me]
    const y = self(p)
    if (y.family?.name !== '五庄观') {
      vision(x, ch(x.w, id).room, '$N点了点头。', id)
      npcSay(x, id, '这位朋友，本门讲究长幼之礼，尊卑之分。一下让你成为二代弟子恐人心不服。')
    } else if (y.family.gen > 3) npcSay(x, id, '福禄寿他们正想多收几个弟子，你先到那边看看吧。')
    else if (y.exp >= 300000 && (p.skills.taiyi ?? 0) >= 120) { npcSay(x, id, '好，不愧是本门的人才！'); recruit(x, id) }
    else npcSay(x, id, '有心上进是不错，不过还是要循序渐进。')
    return true
  },
}
/** Who teaches anyone (recognize_apprentice): 武馆教头 范芦平. */
const TEACHES_ALL = new Set(['x/city/npc/jiaotou'])

/** learn.c: 「学 <技能> 从 <人> [次数]」, at most 25 times; 潜能 and 精神 are what it costs. */
C.learn = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  const y = self(p)
  const m = rest.match(/^(.+?)\s*(?:从|跟|向|from)\s*(.+?)\s*(?:(\d+)\s*次?|for\s*(\d+))?$/) ?? rest.match(/^(.+?)\s+(\S+?)\s*(?:(\d+)\s*次?)?$/)
  if (!m) return x.out.push('这样学：学 <技能> 从 <人> [次数]，比如：学 法术 从 张果老 10')
  let skillText = m[1]
  let who = personHere(x, m[2])
  if (!who) { who = personHere(x, m[1]); skillText = m[2] } // 学 张果老 法术
  if (!who || !isNpc(who.id)) return x.out.push('你要向谁求教？')
  const t = who.id
  const skill = skillNamed(skillText)
  if (!skill) return x.out.push(`「${skillText}」是什么技能？`)
  let times = Math.min(25, Math.max(1, Number(m[3] ?? m[4] ?? 1)))
  if (busy(x, p)) return x.out.push('你现在正忙着呢。')
  if (!awake(w, t, x.now)) return x.out.push(`嗯．．．你得先把${nameOf(w, t)}弄醒再说。`)
  if (y.family?.master !== baseOf(t) && !TEACHES_ALL.has(baseOf(t))) {
    const rej = ['说道：您太客气了，这怎么敢当？', '像是受宠若惊一样，说道：请教？这怎么敢当？', '笑着说道：您见笑了，我这点雕虫小技怎够资格「指点」您什么？']
    return x.out.push(nameOf(w, t) + rej[rnd(x, rej.length)])
  }
  const master = npcData(t).skills?.[skill] ?? 0
  if (!master) return x.out.push('这项技能你恐怕必须找别人学了。')
  const why = VALID[skill]?.(p)
  if (why) return x.out.push(why)
  const mine = p.skills[skill] ?? 0
  let senCost = Math.floor(300 / attr(w, x.me, 'int'))
  if (!mine && !p.learned[skill]) senCost *= 2
  const upper = y.pot - y.spent
  if (upper <= 0) return x.out.push('你的潜能已经发挥到极限了，没有办法再成长了。')
  times = Math.min(times, upper)
  const need = (mine + 1) ** 2
  let amount = 0
  let i = 0
  const had = p.learned[skill] ?? 0
  for (; i < times; i++) { amount += rnd(x, attr(w, x.me, 'int')) + 1; if (had + amount > need && had <= need) break }
  times = Math.min(times, i + 1)
  senCost *= times
  x.out.push(`你向${nameOf(w, t)}请教有关「${SKILL_NAMES[skill] ?? skill}」的疑问。`)
  if (p.sen.cur <= senCost) return x.out.push('你今天太累了，结果什么也没有学到。\n（长安客栈东边的睡房里「睡觉」，一觉醒来精神饱满。）')
  if (!NOT_MARTIAL.has(skill) && Math.floor(mine ** 3 / 10) > y.exp) {
    x.out.push(`也许是道行不够，你对${nameOf(w, t)}的回答总是无法领会。`)
  } else {
    y.spent += times
    if (mine < master) x.out.push(`你听了${nameOf(w, t)}的指导，似乎有些心得。`)
    else x.out.push(`${nameOf(w, t)}和你切磋了一会儿${SKILL_NAMES[skill] ?? skill}，你似乎有所领悟。`)
    gainSkill(x, p, skill, amount)
  }
  consume(p, 'sen', senCost)
  setBusy(x, p, 1)
}
/** improve_skill: a level when the learned points pass (level+1)². */
function gainSkill(x, p, s, n) {
  p.learned[s] = (p.learned[s] ?? 0) + n
  const before = p.skills[s] ?? 0
  while (p.learned[s] > ((p.skills[s] ?? 0) + 1) ** 2) {
    p.learned[s] -= ((p.skills[s] ?? 0) + 1) ** 2
    p.skills[s] = (p.skills[s] ?? 0) + 1
  }
  if ((p.skills[s] ?? 0) > before) x.out.push(`你的「${SKILL_NAMES[s] ?? s}」进步了！（${p.skills[s]} 级）`)
}

/** enable.c: 「激发 内功 镇元神功」; alone, what is enabled. */
C.enable = (x, rest) => {
  const p = x.w.players[x.me]
  p.map ??= {}
  const parts = rest.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) {
    const rows = Object.entries(p.map).map(([b, s]) => `  ${SKILL_NAMES[b] ?? b}：${SKILL_NAMES[s] ?? s}`)
    return x.out.push(rows.length ? `以下是你目前使用中的特殊技能：\n${rows.join('\n')}` : '你现在没有使用任何特殊技能。（「激发 内功 镇元神功」）')
  }
  const basic = skillNamed(parts[0])
  const special = skillNamed(parts.slice(1).join(' '))
  if (!basic || !special) return x.out.push('这样激发：激发 <基本技能> <特殊技能>，比如：激发 内功 镇元神功')
  if (!p.skills[special]) return x.out.push('你不会这种技能。')
  if (SPECIAL[special] !== basic) return x.out.push('这个技能不能当成这种用途。')
  p.map[basic] = special
  x.out.push('完成。')
}

/** exercise.c: 「打坐 <气>」 turns 气血 into 内力; past twice the most, the most grows by one, up to 10× 内功. */
C.exercise = (x, rest) => {
  const p = x.w.players[x.me]
  const y = self(p)
  if (ROOMS[p.room].noFight || ROOMS[p.room].noMagic) return x.out.push('安全区内禁止练功。')
  if (busy(x, p)) return x.out.push('你现在正忙着呢。')
  if (!p.map?.force) return x.out.push('你必须先用「激发」选择你要用的内功心法。（比如：激发 内功 镇元神功）')
  const n = Number((rest.match(/\d+/) ?? [])[0])
  if (!n) return x.out.push('你要花多少气练功？（打坐 30）')
  if (n < 10) return x.out.push('你最少要花 10 点「气」才能练功。')
  if (p.kee.cur < n) return x.out.push('你现在的气太少了，无法产生内息运行全身经脉。')
  x.out.push('你坐下来运气用功，一股内息开始在体内流动。')
  setBusy(x, p, Math.floor(n / 20) + 1)
  consume(p, 'kee', n)
  const gain = Math.floor(n * (Math.floor((p.skills.force ?? 0) / 10) + Math.floor(attr(x.w, x.me, 'con') / 2) + rnd(x, 25)) / 30)
  if (gain < 1) return x.out.push('但是当你行功完毕，只觉得全身发麻。')
  y.force += gain
  x.out.push('你行功完毕，吸一口气，缓缓站了起来。')
  if (y.force > y.maxForce * 2) {
    if (y.maxForce >= skillOf(p, 'force') * 10) x.out.push('当你的内息遍布全身经脉时却没有功力提升的迹象，似乎内力修为已经遇到了瓶颈。')
    else { x.out.push('你的内力增强了！'); y.maxForce += 1; bodyMax(p) }
    y.force = y.maxForce
  }
}

/** meditate.c: 「冥想 <神>」 turns 精神 into 法力; past twice the most, the most grows by one, up to 10× 法术. */
C.meditate = (x, rest) => {
  const p = x.w.players[x.me]
  const y = self(p)
  if (ROOMS[p.room].noFight || ROOMS[p.room].noMagic) return x.out.push('安全区内禁止练功。')
  if (busy(x, p)) return x.out.push('你现在正忙着呢。')
  const n = Number((rest.match(/\d+/) ?? [])[0])
  if (!n) return x.out.push('你要花多少精神冥思？（冥想 30）')
  if (n < 10) return x.out.push('你最少要花 10 点「神」才能冥思。')
  if (p.sen.cur < n) return x.out.push('你现在精神太差了，进行冥思将会迷失，永远醒不过来！')
  if (p.kee.cur * 100 / p.kee.max < 70) return x.out.push('你现在身体状况太差了，无法集中精神！')
  x.out.push('你盘膝而坐，静坐冥思了一会儿。')
  consume(p, 'sen', n)
  setBusy(x, p, rnd(x, 1 + Math.floor(n / 20)) + 3)
  const gain = Math.floor(n * (Math.floor(skillOf(p, 'spells') / 10) + attr(x.w, x.me, 'spi')) / 30)
  if (gain < 1) return x.out.push('但是当你睁开眼睛，只觉得脑中一片空白。')
  y.mana += gain
  x.out.push('你冥想完毕，睁开眼睛定了定神，站了起来。')
  if (y.mana > y.maxMana * 2) {
    if (y.maxMana >= skillOf(p, 'spells') * 10) x.out.push('当你的法力增加的瞬间你忽然觉得脑中一片混乱，似乎法力的提升已经到了瓶颈。')
    else { x.out.push('你的法力提高了！'); y.maxMana += 1; bodyMax(p) }
    y.mana = y.maxMana
  }
}

/** combatd.c: fighting gives 道行 (combat_exp) and 潜能, while 潜能 unspent is under 100. */
const prevGain = HOOKS.gain
HOOKS.gain = (x, id, course, n) => {
  prevGain?.(x, id, course, n)
  if (course !== 'combat') return
  const y = self(x.w.players[id])
  y.exp += n
  if (y.pot - y.spent < 100) y.pot += 1
}

/** fly.c: 腾云 needs 道行 ten years and 法力 200, outdoors; only 长安 and 五庄观 are in this world. */
export const FLY = { changan: 'x/city/center', 长安: 'x/city/center', wuzhuang: WZ + 'gate', 五庄观: WZ + 'gate' }
C.fly = (x, rest) => {
  const p = x.w.players[x.me]
  const y = self(p)
  if (busy(x, p)) return x.out.push('你正忙着呢，没工夫腾云驾雾。')
  if (!ROOMS[p.room].outdoors) return x.out.push('周围没有一片云，没办法腾云驾雾。')
  if (p.ghost) return x.out.push('做了鬼了，就老实点吧！')
  if (!rest) return x.out.push('你要飞到哪里去？（长安、五庄观）')
  const fall = () => vision(x, p.room, '$N奋力望上一跳，似乎想飞起来。结果离地不到三尺就一个倒栽葱摔了下来。', x.me)
  if (y.exp < 10000) { fall(); return x.out.push('可能是你道行还不够。') }
  if (y.mana < 200) { fall(); return x.out.push('可能是你法力还不够。') }
  if (p.sen.cur * 100 / p.sen.max < 50) return x.out.push('你现在头脑不太清醒，当心掉下来摔死。')
  if (p.kee.cur * 100 / p.kee.max < 50) return x.out.push('你想飞起来，可是体力似乎有点不支。')
  vision(x, p.room, '$N手一指，召来一朵云彩，高高兴兴地坐了上去，再吹一声口哨，随之往上冉冉地升起。。。', x.me)
  y.mana += Math.min(0, -Math.floor((100 - skillOf(p, 'spells')) / 4) - 40)
  const to = FLY[rest.trim()]
  if (!to) { x.out.push('你在天上转了半天也不知该往那边飞。。。'); vision(x, p.room, '$N失望地从云上跳了下来！', x.me); return }
  move(x, x.me, '', to, { how: { leave: '', arrive: '只见半空中降下一朵彩云，$N从云里走了出来。' } })
}

// ── asking ─────────────────────────────────────────────────────────────────────────────────────────────────────

const NO_IDEA = ['$n摇摇头，说道：没听说过。', '$n疑惑地看着$N，摇了摇头。', '$n睁大眼睛望着$N，显然不知道$P在说什么。',
  '$n耸了耸肩，很抱歉地说：无可奉告。', '$n说道：嗯．．．这我可不清楚，你最好问问别人吧。', '$n想了一会儿，说道：对不起，你问的事我实在没有印象。']
const TOPIC = { 名字: 'name', 你是谁: 'name', 这里: 'here', 此地: 'here' }
/** ask.c: 「问 <人> 关于 <事>」 (or 「打听 <人> <事>」): an answer of the person's inquiry, or a shrug. */
C.ask = (x, rest) => {
  const w = x.w
  const who = personHere(x, rest)
  if (!who) return x.out.push(rest ? '这里没有这个人。' : '你要问谁什么事？（问 张果老 关于 人参果）')
  const topic = who.rest.replace(/^(关于|有关|about)\s*/, '').replace(/的(事|消息)$/, '').trim()
  if (!topic) return x.out.push('你要问什么事？')
  const t = who.id
  const room = ch(w, x.me).room
  if (!isNpc(t)) return vision(x, room, `$N向$n打听有关『${topic}』的消息。`, x.me, t, { k: 'say', text: topic, to: t })
  vision(x, room, `$N向$n打听有关『${topic}』的消息。`, x.me, t)
  if (!awake(w, t, x.now)) return vision(x, room, '但是很显然的，$n现在的状况没有办法给$N任何答覆。', x.me, t)
  const q = npcData(t).inquiry ?? {}
  const a = q[topic] ?? q[TOPIC[topic]]
  if (typeof a === 'string') return npcSay(x, t, a)
  if (a?.fn && N[baseOf(t)]?.ask?.[a.fn]) return N[baseOf(t)].ask[a.fn](x, t)
  if (a?.fn) return vision(x, room, '$n想了想，没有回答$N。', x.me, t)
  vision(x, room, NO_IDEA[rnd(x, NO_IDEA.length)], x.me, t)
}

/** jieding.c give_book: the 《西游记西行求取真经指南》, whose contents (book-qujing.c) are the 24 obstacles; the first is 五庄观, west of 长安. */
;(N['x/city/npc/jieding'] ??= {}).ask = { ...N['x/city/npc/jieding']?.ask,
  give_book(x, t) {
    vision(x, ch(x.w, x.me).room, '疥顶小僧给$N一本《西游记西行求取真经指南》，$N翻了翻。', x.me)
    x.out.push(`西游记现有如下西域地区：\n${OBSTACLES.map(([, n], i) => `  ${String(i + 1).padStart(2, ' ')}. ${n}`).join('\n')}\n（第一关五庄观在长安西门外，一路向西：「去 五庄观」。「取经」随时查看。）`)
  },
}

// ── 五庄观: the 八卦桥 ──────────────────────────────────────────────────────────────────────────────────────────

/** wzgmaze1–8.c: a bridge crossed twice wipes out the path; all eight once each, and one is through to 荷塘边. */
for (let i = 1; i <= 8; i++) {
  R[WZ + 'wzgmaze' + i] = {
    init(x, id) {
      const p = x.w.players[id]
      const t = (p.temp ??= {})
      const seen = (t.wzgmaze ??= {})
      if (!seen[i]) seen[i] = 1
      else {
        delete t.wzgmaze
        // Not said in wzgmaze*.c, where the path is wiped without a word; the rule is told here and on the 木牌.
        if (id === x.me) x.out.push('这座桥你刚才已经走过了。你一阵眼花，记不清走过哪几座了——只好从这座重新数起。')
        ;(t.wzgmaze = {})[i] = 1
      }
      const n = Object.keys(t.wzgmaze ?? {}).length
      if (n < 8 && id === x.me) x.out.push(`（八座桥你已走过${n === 2 ? "两" : cn(n)}座。）`)
      if (n === 8) {
        delete t.wzgmaze
        p.room = WZ + 'northpool'
        if (id === x.me) x.out.push(lookText(x.w, id, x.now))
      }
    },
    jump(x, arg) {
      if (!/桥|bridge/.test(arg)) { x.out.push('你要往哪跳？'); return true }
      vision(x, ch(x.w, x.me).room, '$N心一横，往桥下跳去...', x.me)
      move(x, x.me, '', WZ + 'inpool', { quiet: true })
      vision(x, WZ + 'inpool', '只听「噗嗵」一声，$N从桥上掉到塘中．', x.me)
      return true
    },
  }
}

// The rule of the bridges, which wzgmaze*.c leaves to be found out, on a board at the south bank.
const SOUTHPOOL = WZ + 'southpool'
const BOARD = '木牌上写着：塘上八卦桥八座，座座走过一遍，方到北岸；同一座桥走第二遍，便从头数起。在桥上「跳 桥」，便落回南岸的塘里。'
ROOMS[SOUTHPOOL].long += '岸边立着一块木牌(pai)。'
ROOMS[SOUTHPOOL].details = { ...ROOMS[SOUTHPOOL].details, pai: BOARD, 木牌: BOARD, 牌: BOARD }

// ── 五庄观: the key under 牡丹亭, the gate of the orchard ────────────────────────────────────────────────────────

/** anshi.c: one feels about (mo) and a brass key drops — once till the key comes back (15 hours in XYJ; here a reset). */
R[WZ + 'anshi'] = {
  mo(x) {
    const r = (x.w.rooms[WZ + 'anshi'] ??= {})
    if (r.taken) { x.out.push('你什么也没摸着。'); return true }
    r.taken = true
    makeThing(x, WZ + 'obj/huangtong-key', WZ + 'anshi', 1)
    vision(x, WZ + 'anshi', '只听当！地一声，一把黄铜钥匙掉在地上。', x.me)
    return true
  },
}
const KEY = WZ + 'obj/huangtong-key'
const XIGUA = WZ + 'xiguadi'
// xiguadi.c: the gate north is there, locked; only the key opens it (and breaks in it). Opened, it stays so till a reset.
ROOMS[XIGUA].exits['北'] = GARDEN
ROOMS[XIGUA].doors = { 北: { name: '杏木门', closed: true, locked: '你没有开这道门的钥匙。' } }
ROOMS[GARDEN].exits['南'] = XIGUA
ROOMS[GARDEN].doors = { 南: { name: '杏木门', closed: true } }
R[XIGUA] = {
  /** do_open: `open door` and the key, every time (a second key breaks too, the gate already open). */
  open(x, arg) {
    if (!/^(门|杏木门|door)$/.test(arg ?? '')) { x.out.push('你要打开什么？'); return true }
    const key = thingsAt(x.w, x.me).find((tid) => x.w.things[tid].id === KEY)
    if (!key) { x.out.push('你没有开这道门的钥匙。'); return true }
    setDoor(x, XIGUA, '北', false)
    vision(x, XIGUA, '只听喀嚓！一声，钥匙断了。好在门已经开了。')
    ;(x.w.players[x.me].temp ??= {}).usedKey = true
    destroy(x, key)
    return true
  },
  // XYJ adds an exit and has no door to shut: there is none to close (a gate shut here would need a key again).
  close(x) { x.out.push('什么？'); return true },
}
// mo and jump are the rooms' own (anshi.c, wzgmaze*.c): elsewhere there is no such command.
C.mo = (x, rest) => {
  if (!R[ch(x.w, x.me).room]?.mo?.(x, rest)) x.out.push('什么？')
}
C.jump = (x, rest) => {
  if (!R[ch(x.w, x.me).room]?.jump?.(x, rest)) x.out.push('什么？')
}
/** inpool.c init: in the pond, the bridges crossed are forgotten. */
R[WZ + 'inpool'] = { init(x, id) { delete x.w.players[id].temp?.wzgmaze } }

/** open.c, close.c: a door is named, by its way, its name or `door`. */
for (const verb of ['open', 'close']) {
  C[verb] = (x, rest) => {
    const w = x.w
    const room = ch(w, x.me).room
    if (R[room]?.[verb]) return false
    const what = verb === 'open' ? '你要打开什么？' : '你要关上什么？'
    if (!rest) return x.out.push(what)
    const doors = Object.entries(ROOMS[room].doors ?? {})
    if (doors.length && !doors.some(([d, o]) => DIRS[d]?.includes(rest.toLowerCase()) || d === rest || o.name === rest || /^(门|door)$/.test(rest))) return x.out.push(what)
    return false
  }
}

// ── 五庄观: 镇元大仙's 人参果 meeting ─────────────────────────────────────────────────────────────────────────

/** A word to the whole world, as CHANNEL_D's chat channel. */
const announce = (x, who, text) => vision(x, ch(x.w, who)?.room ?? GARDEN, `【闲聊】${nameOf(x.w, who)}：${text}`, null, null, { k: 'chat' })
const meeting = (w) => w.rooms[GARDEN]?.meeting

/** renshenguo-yuan.c init: whoever opened the gate with the key brings out 镇元大仙, who calls the meeting. */
R[GARDEN] = {
  init(x, id) {
    const t = x.w.players[id].temp ?? {}
    if (!t.usedKey) return
    delete t.usedKey
    vision(x, GARDEN, '只听几声哈哈大笑，镇元大仙走了出来。', id)
    vision(x, GARDEN, '镇元大仙说道：居然被你发现了。那我们就开个人参果大会吧！', id)
    if (!x.w.npcs[MEET] || x.w.npcs[MEET].dead) spawnNpc(x, MEET, GARDEN)
    const r = (x.w.rooms[GARDEN] ??= {})
    if (r.meeting) return
    r.meeting = { at: x.now, said: 0 }
    announce(x, MEET, '五庄观人参果品尝大会即将开始！')
    announce(x, MEET, '诸位仙贤如愿观礼，「观礼」便可！')
  },
  open(x) { x.out.push('什么？'); return true },
  close: R[XIGUA].close,
}
/** zhenyuan.c ready1 / ready2 (3 and 6 minutes there; here 30 s and a minute, so nobody stands about) and finishing
 * (here 90 s after the fruit, not 5 s: whoever ate one wakes in time to be sent home with 「回去」). */
const READY1 = 30_000
const READY2 = 60_000
const STAY = 90_000
const prevBeat = HOOKS.beat
HOOKS.beat = (x) => {
  prevBeat?.(x)
  const m = meeting(x.w)
  if (!m || !x.w.npcs[MEET]) return
  for (m.pulse ??= m.at + 1000; m.pulse <= x.now; m.pulse += 5500) inviting(x)
  if (m.done) {
    if (x.now - m.done >= STAY) {
      vision(x, x.w.npcs[MEET].room, '$N哈哈大笑几声，顿时无影无踪了。', MEET)
      for (const tid of thingsAt(x.w, MEET)) destroy(x, tid)
      delete x.w.npcs[MEET]
    }
    return
  }
  if (m.said < 1 && x.now - m.at >= READY1) {
    m.said = 1
    announce(x, MEET, '五庄观人参果品尝大会马上就要开始！')
    announce(x, MEET, '诸位仙贤如愿观礼，「观礼」便可！')
  }
  if (m.said < 2 && x.now - m.at >= READY2) {
    m.said = 2
    announce(x, MEET, '五庄观人参果品尝大会现在开始！')
    vision(x, GARDEN, '镇元大仙说道：要人参果的，「问 镇元大仙 关于 人参果」。')
  }
}
// The second 镇元大仙 is gone with the reset (as zhenyuan.c destructs itself); the orchard's gate is shut again.
const prevReset = HOOKS.reset
HOOKS.reset = (x) => {
  prevReset?.(x)
  if (x.w.npcs[MEET]) { for (const tid of thingsAt(x.w, MEET)) destroy(x, tid); delete x.w.npcs[MEET] }
}

/** zhenyuan.c asked_guo: three ripe fruit, for up to three in the orchard once the meeting has begun. */
N[ZHENYUAN].ask = {
  asked_guo(x, id) {
    const w = x.w
    const m = meeting(w)
    const say = (t) => npcSay(x, id, t)
    if (!m) return say('人参果可是个好东西。')
    if (ch(w, id).room !== GARDEN) return say('这里又不是果园，哪来的人参果。')
    if (x.now - m.at < READY1) return say('不要急，再等等。')
    if (x.now - m.at < READY2) return say('不要急，马上就有。')
    if (m.done) return say('人参果已分发完了。')
    const here = playersIn(w, GARDEN).filter((pid) => !w.players[pid].ghost)
    if (here.length > 3) return say('哎呀！这么多人，现在只有三枚成熟的人参果。')
    if (!here.length) return say('谁要人参果？')
    for (const pid of here) {
      makeThing(x, 'x/obj/drug/renshen-guo', pid, 1)
      vision(x, GARDEN, '$N给$n一枚人参果。', id, pid, { to: pid, k: 'give' })
      announce(x, id, `恭喜恭喜！${nameOf(w, pid)}获得人参果一枚。`)
    }
    m.done = x.now
    say('好！人参果分发完毕，诸位仙贤尽情享用吧。吃完了要回长安的，「回去」便是。')
  },
  expell_me(x, id) { npcSay(x, id, '清风，明月，送客！') },
  keyword(x, id) {
    if (self(x.w.players[x.me]).family?.name === '五庄观') return npcSay(x, id, '你现在道行太低，施用袖里乾坤恐危及性命。')
    vision(x, ch(x.w, id).room, '$N飞起一脚，把$n踢了出去。', id, x.me)
    npcSay(x, id, '想刺探本门秘技，好大的胆子！')
  },
}

/** accept.c: 「观礼」 (accept zhenyuan daxian) takes up his open invitation, outdoors; his sleeve does the rest. */
C.accept = (x, rest) => {
  const w = x.w
  const p = w.players[x.me]
  if (rest && !/镇元|zhenyuan/.test(rest)) return x.out.push('没有这个人。')
  if (p.ghost) return x.out.push('做了鬼了，就老实点吧！')
  const m = meeting(w)
  if (!m || !w.npcs[MEET]) return x.out.push('镇元大仙现在并没有公开邀请别人。')
  if (!ROOMS[p.room]?.outdoors) return x.out.push('你还是到外面去接受镇元大仙的邀请吧！')
  const t = (p.temp ??= {})
  if (t.accept) return x.out.push('你已经接受镇元大仙的公开邀请了。')
  t.accept = true
  x.out.push('你接受镇元大仙的公开邀请。')
}
/** zhenyuan.c inviting, every 4–7 s (here 5½) while he invites: his sleeve brings one who accepted to the orchard. */
function inviting(x) {
  const w = x.w
  for (const [pid, p] of Object.entries(w.players)) {
    if (!p.temp?.accept || !awake(w, pid, x.now)) continue
    delete p.temp.accept
    if (p.room === GARDEN) continue
    p.temp.wzgFrom = p.room
    vision(x, GARDEN, '$N的大袖往外一罩…', MEET)
    vision(x, p.room, '一团祥云飘来，云中伸出一只巨大的衣袖将$N轻轻一罩，消失在天空。', pid)
    move(x, pid, '', GARDEN, { quiet: true })
    vision(x, GARDEN, '…$N大袖轻轻一抖，$n滑了出来。', MEET, pid)
    return
  }
}
/** zhenyuan.c do_back: the sleeve takes one back to 长安's inn. */
C.back = (x) => {
  const w = x.w
  const z = npcsIn(w, ch(w, x.me).room).find((n) => baseOf(n) === ZHENYUAN)
  if (!z) return x.out.push('这里没有人能送你回去。')
  vision(x, ch(w, x.me).room, '$N请求$n送$N回返。', x.me, z)
  vision(x, ch(w, x.me).room, '$N的大袖朝着$n轻轻一罩…', z, x.me)
  move(x, x.me, '', START, { quiet: true })
  vision(x, START, '…云中伸出一只巨大的衣袖轻轻一抖，只见$N从里面滑了出来。', x.me)
}

/** renshen-guo.c: food to the full, 内力 and 法力 +20 each (below 10× the skill), the obstacle done, and out cold. */
HOOKS.item['x/obj/drug/renshen-guo'] = {
  eat(x, tid) {
    const w = x.w
    const p = w.players[x.me]
    const y = self(p)
    const eaten = y.rsg ?? 0
    p.food.cur = p.food.max
    if (y.maxForce < 10 * skillOf(p, 'force') && eaten <= 100) y.maxForce += 20
    if (y.maxMana < 10 * skillOf(p, 'spells') && eaten <= 100) y.maxMana += 20
    y.rsg = eaten + 1
    bodyMax(p)
    vision(x, p.room, '$N把人参果往嘴里一塞，忍不住大叫一声：人参果啊人参果，不愧是人参果！\n说罢兴奋得都快晕了过去。', x.me)
    y.obstacle.wuzhuang = 'done'
    destroy(x, tid)
    knockOut(x, x.me, (t, id) => vision(x, p.room, t, id))
    return true
  },
}

// ── pace: sleeping, masters who stay, the way to a place, the next step ──────────────────────────────────────────

/** sleep.c in a sleep_room: 精神, 气血 and 魂魄 back to the full (XYJ sleeps 10–45 s for it; here at once), once in 90 s. */
C.sleep = (x) => {
  const w = x.w
  const p = w.players[x.me]
  if (!ROOMS[p.room].sleep) return x.out.push('这里不是睡觉的地方。（长安客栈东边有睡房。）')
  const y = self(p)
  if (x.now - (y.slept ?? 0) < 90_000) return x.out.push('你刚睡过一觉, 先活动活动吧。')
  y.slept = x.now
  bodyMax(p)
  for (const k of ['gin', 'kee', 'sen']) { p[k].eff = p[k].max; p[k].cur = p[k].max }
  vision(x, p.room, '$N往被中一钻，不一会便鼾声大作，进入了梦乡。', x.me)
  x.out.push('你一觉醒来，精神抖擞地活动了几下手脚。')
}

// A master who takes anyone (张果老 and the 八仙) wanders off mid-lesson in XYJ; here they stay where they are found.
for (const id of Object.keys(N)) {
  if (!N[id].apprentice) continue
  const d = NPCS[id]
  if (d?.chatMsg) d.chatMsg = d.chatMsg.filter((m) => m?.fn !== 'random_move')
}

/** Places 「去 <地点>」 knows besides room names: the town and the temples (xyj-road.js adds the road west's). */
export const PLACES = { 长安: START, 客栈: START, 五庄观: WZ + 'gate', 十字街头: 'x/city/center' }
/** Rooms 「去」 never walks into or through: the 八卦桥 (a puzzle walked by hand) and the rooms behind a puzzle. */
export const NO_WAY = [/wzgmaze|inpool|anshi|renshenguo-yuan/]
const noWay = (id) => NO_WAY.some((re) => re.test(id))

/** 「去 <地点>」 in this world: the shortest way there walked in one go, stopping at a shut door; never over the 八卦桥. */
C.go = (x, rest) => {
  const w = x.w
  const want = rest.trim()
  if (!want || Object.values(DIRS).some((ws) => ws.includes(want))) return false
  const p = w.players[x.me]
  const from = p.room
  const prev = new Map([[from, null]])
  const queue = [from]
  let to = null
  while (queue.length && !to) {
    const r = queue.shift()
    for (const [d, n] of Object.entries(ROOMS[r].exits)) {
      if (prev.has(n) || !ROOMS[n] || noWay(n)) continue
      prev.set(n, [r, d])
      if (n === PLACES[want] || ROOMS[n].name === want) { to = n; break }
      queue.push(n)
    }
  }
  if (!to) {
    if (PLACES[want] || Object.values(ROOMS).some((r) => r.area === 'xyj' && r.name === want))
      return x.out.push(ROOMS[from].name === want || PLACES[want] === from ? '你已经在这里了。' : `从这里去不了「${want}」：八卦桥得自己走（或在桥上「跳 桥」回南岸）。`)
    return false
  }
  const path = []
  for (let r = to; prev.get(r); r = prev.get(r)[0]) path.unshift([prev.get(r)[0], prev.get(r)[1], r])
  // The way stops at a shut door, or where a room keeps one from going on (HOOKS.room[…].leave: who stands in it).
  let at = from
  let steps = 0
  let stop = null
  for (const [r, d, n] of path) {
    if (ROOMS[r].doors?.[d] && (w.rooms[r]?.doors?.[d] ?? ROOMS[r].doors[d].closed)) { stop = `你必须先把${ROOMS[r].doors[d].name}打开。`; break }
    // A room that keeps the way is stood in first, so whoever keeps it meets the one who came.
    if (R[r]?.leave && ch(w, x.me).room !== r) { const mark = x.out.length; move(x, x.me, '', r, { quiet: true }); x.out.length = mark }
    const block = R[r]?.leave?.(x, d)
    if (block) { stop = block; if (ch(w, x.me).room !== r) at = ch(w, x.me).room; break }
    at = n
    steps++
  }
  if (!steps) return x.out.push(stop)
  x.out.unshift(`你一路${path[0][1]}行，走了${cn(steps)}段路。`)
  if (ch(w, x.me).room !== at) move(x, x.me, '', at, { how: { leave: '$N匆匆上路了。', arrive: '$N风尘仆仆地走了过来。' } })
  if (stop) x.out.push(stop)
}

/** The status bars of this world: 气血, 精神, 内力 and 法力 (those not yet begun left out), food and water. */
HOOKS.bars = (p) => {
  const y = self(p)
  return [['气血', p.kee, 'hp'], ['精神', p.sen, 'sen'], ['内力', { cur: y.force, max: y.maxForce }, 'force'],
    ['法力', { cur: y.mana, max: y.maxMana }, 'mana'], ['食', p.food, 'food'], ['水', p.water, 'water']].filter(([, v]) => v && v.max > 0)
}

// ── 长安 ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** npc/xiaoer.c greeting: a third of the time, a word to whoever comes in. */
N['x/city/npc/xiaoer'] = {
  init(x, id, pid) {
    if (isNpc(pid) || rnd(x, 3)) return
    npcSay(x, id, '这位客官，进来歇歇脚，喝两盅吧。')
  },
  /** accept_object: 300 文 or more, and the room behind is yours till you leave it (kezhan.c, sleep.c rent_paid). */
  accept(x, id, tid) {
    if (!isMoney(x.w.things[tid]?.id) || worth(x.w, tid) < 300) return false
    tell(x, x.me, '小二一哈腰，说道：多谢您老，客官请上楼歇息。')
    ;(x.w.players[x.me].temp ??= {}).rentPaid = true
    return true
  },
}
R[START] = {
  leave(x, d) {
    if (d === '东' && !x.w.players[x.me].temp?.rentPaid) return '店小二满脸堆笑地挡住了你：对不起，后面是客人的卧房，不是本店的客人，不便打扰。（给小二三两银子住店。）'
    return null
  },
}
R['x/city/sleep'] = {
  leave(x) {
    delete x.w.players[x.me].temp?.rentPaid
    return null
  },
}

/** 总督衙门 (zhongdu.c valid_leave): the 衙役 let nobody into the hall without a 状子 (there is none in the mud). */
R['x/city/zhongdu'] = {
  leave(x, d) {
    if (d !== '北' || !npcsIn(x.w, 'x/city/zhongdu').some((n) => baseOf(n).split('#')[0] === 'x/city/npc/yayi' && awake(x.w, n, x.now))) return null
    return '衙役喝道：公堂岂可乱闯，还不退下！'
  },
}

/** yunti.c valid_leave: half the time the way into the cave slides one down to 酒泉 instead. */
R['x/westway/yunti'] = {
  leave(x, d) {
    if (d !== '进去' || rnd(x, 2)) return null
    vision(x, 'x/westway/yunti', '哗啦啦一阵碎石头响，$N从山壁上斜滑了下来！', x.me)
    move(x, x.me, '', 'x/westway/jiuquan', { quiet: true })
    vision(x, 'x/westway/jiuquan', '$N滚到一个坡底才停下来！', x.me)
    return '你在地上呆坐了几秒钟，慢慢站起来。' // fall_back, 2 s on in XYJ
  },
}

// ── 饮马峪's 马盗 (westway/yinma.c, npc/madao.c) ─────────────────────────────────────────────────────────────────────
// Money or your life, unless you are of 五庄观 or past two obstacles: worth 200 文 buys two passes; three warnings and
// he attacks (call_outs 5–30 s on; here at their means).
const YINMA = 'x/westway/yinma'
const MADAO = 'x/westway/npc/madao'
const worth = (w, tid) => (ITEMS[w.things[tid]?.id]?.baseValue ?? ITEMS[w.things[tid]?.id]?.value ?? 0) * (w.things[tid]?.n ?? 1)
const passes = (p) => self(p).family?.name === '五庄观' || Object.values(self(p).obstacle).filter((v) => v === 'done').length >= 2
const paid = (p) => p.temp?.hasPaid > 0
const WARN = [[7_000, '$N大声喝道：快给钱！'], [12_000, '$N又喊叫几声：拿钱来买命！'], [17_000, '$N急了：你到底给不给钱？']]
N[MADAO] = {
  init(x, id, pid) {
    const p = x.w.players[pid]
    if (!p || isNpc(pid)) return
    if (paid(p) || self(p).family?.name === '五庄观') {
      vision(x, YINMA, '$N对$n一拱手，闪身让道。', id, pid)
      if (ch(x.w, id).hate) delete ch(x.w, id).hate[pid]
      return
    }
    vision(x, YINMA, '$N冲过来，对$n大喝一声：要钱还是要命？', id, pid)
    ;(x.w.npcs[id].rob ??= {})[pid] = { at: x.now, said: 0 }
  },
  accept(x, id, tid) {
    if (worth(x.w, tid) < 200) {
      vision(x, YINMA, '$N一瞪眼：就这点东西？不想活了？？？', id)
      return true
    }
    ;(x.w.players[x.me].temp ??= {}).hasPaid = 2
    delete x.w.npcs[id].rob?.[x.me]
    if (ch(x.w, id).hate) delete ch(x.w, id).hate[x.me]
    vision(x, YINMA, '$N嘿嘿嘿几声怪笑，闪身让道。', id)
    return true
  },
}
R[YINMA] = {
  leave(x, d) {
    const w = x.w
    const p = w.players[x.me]
    const madao = npcsIn(w, YINMA).find((n) => baseOf(n) === MADAO && awake(w, n, x.now))
    if (d === '西北' && madao && !paid(p) && !passes(p)) {
      if (!rnd(x, 3)) vision(x, YINMA, '$N恶狠狠地劈胸一把揪住$n：往哪儿跑！给钱！', madao, x.me)
      return '马盗喊叫着：不给钱我要杀人啦！（给他二两银子，或者打倒他。）'
    }
    if (paid(p)) p.temp.hasPaid -= 1
    return null
  },
}
const prevRob = HOOKS.beat
HOOKS.beat = (x) => {
  prevRob?.(x)
  const w = x.w
  for (const id of npcsIn(w, YINMA)) {
    const rob = w.npcs[id].rob
    if (!rob || baseOf(id) !== MADAO) continue
    for (const [pid, r] of Object.entries(rob)) {
      const p = w.players[pid]
      if (!p || p.room !== YINMA || paid(p) || !awake(w, id, x.now)) { delete rob[pid]; continue }
      for (; r.said < WARN.length && r.at + WARN[r.said][0] <= x.now; r.said++) vision(x, YINMA, WARN[r.said][1], id, pid)
      if (r.at + 27_000 <= x.now) {
        delete rob[pid]
        brawl(x, id, pid, 'kill')
      }
    }
  }
}
void ITEMS

/** natured.c event_noon: at noon whoever is outdoors with 法力 and no 法术 has it drawn off; under 法术 25, in part. */
const prevNoon = HOOKS.beat
HOOKS.beat = (x) => {
  prevNoon?.(x)
  const { hour, day, month } = gameTime(x.now)
  if (hour !== 12 || x.w.noon === `${month}-${day}`) return
  x.w.noon = `${month}-${day}`
  for (const [id, p] of Object.entries(x.w.players)) {
    if (!online(x.w, id, x.now) || !ROOMS[p.room]?.outdoors || !self(p).mana) continue
    const sk = p.skills?.spells ?? 0
    if (!sk) {
      tell(x, id, '你觉得一阵晕眩，好像有一股能量从身上被人吸走了。')
      self(p).mana = 0
    } else if (sk < 25) {
      tell(x, id, '随着太阳升到天空的正中央，你觉得你的法力开始消失了。')
      self(p).mana = Math.floor(self(p).mana * sk / 25)
    }
  }
}
