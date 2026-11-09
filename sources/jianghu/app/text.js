// The mudlib's words for its rules (combat, the day, names of skills and stats), turned into simplified Chinese. Taken from
// the files named at each table; see SOURCE.md. `$N` is who acts, `$n` the other one, `$w` a weapon, `$l` a limb,
// `$p` the other one again (its pronoun: here their name).

export const DIRS = {
  北: ['北', 'n', 'north', '北边'], 南: ['南', 's', 'south', '南边'], 东: ['东', 'e', 'east', '东边'], 西: ['西', 'w', 'west', '西边'],
  东北: ['东北', 'ne', 'northeast'], 西北: ['西北', 'nw', 'northwest'], 东南: ['东南', 'se', 'southeast'], 西南: ['西南', 'sw', 'southwest'],
  上: ['上', 'u', 'up', '上去'], 下: ['下', 'd', 'down', '下去'], 出去: ['出去', 'out', '出'], 进去: ['进去', 'enter', '进'],
}
export const BACK = { 北: '南', 南: '北', 东: '西', 西: '东', 东北: '西南', 西南: '东北', 西北: '东南', 东南: '西北', 上: '下', 下: '上' }

// daemon/race/humanoid.c
export const LIMBS = ['头部', '颈部', '胸口', '后心', '左肩', '右肩', '左臂', '右臂', '左手', '右手', '腰间', '小腹', '左腿', '右腿', '左脚', '右脚']

// data/chinese.o
export const ATTR_NAMES = { str: '膂力', cor: '胆识', int: '悟性', spi: '灵性', cps: '定力', dex: '机敏', con: '根骨', wis: '慧根' }
export const SKILL_NAMES = {
  unarmed: '徒手搏斗', parry: '拆招卸力之法', dodge: '纵跃闪躲之法', force: '内功', sword: '剑术', blade: '刀法', dagger: '锥法',
  staff: '杖法', pike: '单手枪法', literate: '读书识字', sneak: '潜行伏进之技', stealing: '妙手空空之技', killerhood: '杀手本能',
  lightswift: '小孚游功', 'secondhand dagger': '左手锥法', 'twohanded sword': '双握剑术', 'twohanded pike': '双手枪法',
  'twohanded staff': '双握杖法', 'dragon force': '龙图心经', 'regular force': '某种内功', 'celestial force': '天邪神功',
  'kee anatomy': '经脉穴道之学', 'alchemy-medication': '丹道【神农之术】', 'alchemy-wealth': '丹道【黄白之术】',
  'alchemy-magic': '丹道【仙异之术】', 'alchemy-immortality': '丹道【长生之术】',
}
// daemon/class/commoner.c, fighter.c
export const CLASS_NAMES = { commoner: '平民', fighter: '武者' }

// daemon/skill/sword.c, daemon/skill/unarmed.c: [action, damage type]
export const ACTIONS = {
  sword: [
    ['$N蹲低身子，手中$w刺向$n的$l', '刺伤'], ['$N挥动$w，往$n的$l斩下', '割伤'], ['$N高举$w，往前一跳斩向$n的$l', '割伤'],
    ['$N将手中$w举在胸前，冲出几步对准$n的$l刺出一剑', '刺伤'], ['$N侧过身子，手中$w对准$n的$l斜斜刺出', '刺伤'],
    ['$N一个转身手中的$w忽然挥出，斩向$n的$l', '割伤'], ['$N退后一步，手中$w对准$n$l一剑刺去', '刺伤'],
    ['$N微微矮身，向前跃出一步同时$w斩向$n的$l', '割伤'],
  ],
  unarmed: [
    ['$N握紧拳头往$n的$l用力挥出', '瘀伤'], ['$N抬腿往$n的$l踢去', '瘀伤'], ['$N抓住机会往$n的$l挥了一拳', '瘀伤'],
    ['$N放低身子，对准$n的$l一拳挥出', '瘀伤'], ['$N大叫一声，往$n的$l踢出一腿', '瘀伤'], ['$N跳了起来，往$n的$l飞踢过去', '瘀伤'],
    ['$N做了个闪避假动作，冷不防一拳往$n$l挥去', '瘀伤'], ['$N假装要后退，忽然蹲低身子向$n$l踢了一脚', '瘀伤'],
  ],
  // The mudlib has no file for the other weapons (their wielders never attack there): these few lines are this App's own.
  other: [['$N挥动$w往$n的$l砍去', '割伤'], ['$N手中$w一抖，戳向$n的$l', '刺伤'], ['$N抡起$w，往$n的$l砸下', '瘀伤']],
}
export const IDLE = {
  sword: ['$N紧握着手中的$w，缓缓移动。'],
  unarmed: ['$N紧盯着$n的一举一动。', '$N虚张声势地挥舞着拳头。', '$N一边缓缓移动，一边想要找出可以进攻的空隙。'],
}

// adm/daemons/combatd.c: damage_msg by damage type and how much of the victim's 气 it took (percent).
export function damageMsg(pct, type) {
  if (pct <= 0) return '结果似乎没有造成明显的伤害。'
  if (type === '割伤') {
    if (pct < 5) return '但是$w只轻轻地划破$p的皮肉。'
    if (pct < 10) return '不过仅在$p$l划出一道细长的血痕。'
    if (pct < 20) return '结果$w「嗤」地一声划出一道伤口！'
    if (pct < 40) return '结果「嗤」地一声划出一道血淋淋的伤口！'
    if (pct < 60) return '结果「嗤」地一声划出一道又长又深的伤口，溅得$N满脸鲜血！'
    return '只听见$n一声惨嚎，$w已在$p$l划出一道深及见骨的可怕伤口！！'
  }
  if (type === '刺伤') {
    if (pct < 5) return '但是$w只轻轻地刺破$p的皮肉。'
    if (pct < 10) return '不过仅在$p$l刺出一个创口。'
    if (pct < 20) return '结果$w「噗」地一声刺入了$n$l寸许！'
    if (pct < 40) return '结果「噗」地一声刺进$n的$l，使$p不由自主地退了几步！'
    if (pct < 60) return '结果「噗嗤」地一声，$w已在$p$l刺出一个血肉模糊的血窟窿！'
    return '结果只见$n瞪大双眼，$w竟在$p的$l对穿而出，鲜血溅得满地！！'
  }
  if (pct < 2) return '尽管歪歪地击中$l，但是似乎伤害不大。'
  if (pct < 5) return '不过仅在$p的$l造成一处瘀青。'
  if (pct < 10) return '结果命中$n的$l，登时肿了一块老高！'
  if (pct < 20) return '结果一击命中，$n闷哼了一声显然吃了不小的亏！'
  if (pct < 40) return '结果「砰」地一声，$n不由自主地退了两步！'
  if (pct < 60) return '结果这一下「砰」地一声打得$n连退了好几步，差一点摔倒！'
  return '结果重重地击中，震得$n「哇」地一声吐出一口鲜血！！'
}

// combatd.c status_msg: wounds (effective 气 of the maximum) and tiredness (current of effective).
export function woundMsg(r) {
  if (r >= 100) return '( $N看起来并没有受伤。 )'
  if (r > 95) return '( $N似乎受了点轻伤，不过光从外表看不大出来。 )'
  if (r > 90) return '( $N看起来可能受了点轻伤。 )'
  if (r > 80) return '( $N受了几处伤，不过似乎并不碍事。 )'
  if (r > 60) return '( $N受伤不轻，看起来状况并不太好。 )'
  if (r > 40) return '( $N气息粗重，动作开始散乱，看来所受的伤着实不轻。 )'
  if (r > 30) return '( $N已经伤痕累累，正在勉力支撑着不倒下去。 )'
  if (r > 20) return '( $N受了相当重的伤，只怕会有生命危险。 )'
  if (r > 10) return '( $N伤重之下已经难以支撑，眼看就要倒在地上。 )'
  if (r > 5) return '( $N受伤过重，已经奄奄一息，命在旦夕了。 )'
  return '( $N受伤过重，已经有如风中残烛，随时都可能断气。 )'
}
export function tiredMsg(r) {
  if (r >= 100) return '( $N看起来对这种程度的攻击一点也不在乎。 )'
  if (r > 95) return '( $N似乎有些疲惫，但也许是诱敌之计，你无法确定。 )'
  if (r > 90) return '( $N看起来可能有些累了，出招开始慢了下来。 )'
  if (r > 80) return '( $N动作似乎开始有点不太灵光，但是仍然有条不紊。 )'
  if (r > 60) return '( $N气喘嘘嘘，看起来状况并不太好。 )'
  if (r > 40) return '( $N似乎十分疲惫，看来体力的消耗相当严重。 )'
  if (r > 30) return '( $N已经一副头重脚轻的模样，正在勉力支撑着不倒下去。 )'
  if (r > 20) return '( $N看起来已经力不从心了。 )'
  if (r > 10) return '( $N摇头晃脑、歪歪斜斜地站都站不稳，眼看就要倒在地上。 )'
  return '( $N已经陷入半昏迷状态，随时都可能摔倒晕去。 )'
}

export const DEAD_MSG = [
  '$N死了。', '$N吐出几口鲜血，抽搐了几下 ... 死了。', '$N倒卧在血泊中，嘴角流出鲜血，眼看是不活了。',
  '$N呻吟了几声，咳出一口鲜血，便断了气。', '$N趴在地上，无力地挣扎了一会儿，随即死去。',
]
export const HUNT_MSG = [
  '$N和$n仇人相见分外眼红，立刻打了起来！', '$N对着$n大喝：「可恶，又是你！」', '$N和$n一碰面，二话不说就打了起来！',
  '$N一眼瞥见$n，「哼」的一声冲了过来！', '$N喝道：「狗贼！别跑」', '$N喝道：「纳命来！」',
]

// data/emoted.o: the few emotes snow's people use, without and with a target.
export const EMOTES = {
  shake: ['$N缓缓地摇了摇头。', '$N抓住$n一阵猛摇，$n都快被摇散掉了。'],
  '?': ['$N的脸上露出疑惑的表情。', '$N很疑惑地看着$n。'],
  smile: ['$N愉快地微笑着。', '$N愉快地对着$n微笑着。'],
  giggle: ['$N发出一串母鸡下蛋般的笑声。', '$N对着$n咯咯地笑了起来。'],
  pat: ['$N轻轻地拍着自己的头。', '$N轻轻地拍拍$n的头。'],
  hmm: ['$N「嗯」的一声，一副欲言又止的样子。', '$N「嗯」的一声，一副欲言又止的样子。'],
  sweat: ['$N长长的呼了口气，伸手用衣袖擦了擦额头上的汗水。', '$N细心的用衣袖帮$n擦了擦额头上的汗水。'],
}

// adm/etc/nature/day_phase: [minutes into the day it starts, said when it starts, how the sky looks].
export const DAY_PHASES = [
  [0, '已经是午夜了。', '夜幕低垂，满天繁星'],
  [240, '东方的天空中开始出现一丝微曦。', '东方的天空已逐渐发白'],
  [360, '太阳从东方的地平线升起了。', '太阳刚从东方的地平线升起'],
  [540, '太阳已经高高地挂在东方的天空中。', '太阳正高挂在东方的天空中'],
  [720, '已经是正午了，太阳从你正上方照耀着大地。', '现在是正午时分，太阳高挂在你的头顶正上方'],
  [900, '太阳开始从西方的天空中慢慢西沉。', '太阳正高挂在西方的天空中'],
  [1080, '傍晚了，太阳的余晖将西方的天空映成一片火红。', '一轮火红的夕阳正徘徊在西方的地平线上'],
  [1200, '夜晚降临了。', '夜幕笼罩着大地'],
]

/** adm/daemons/natured.c: the game's clock runs 60 times as fast as the real one (a day is 24 minutes), on Taipei time. */
export function gameTime(now) {
  const d = new Date((now * 60) % 1_892_160_000_000 + 8 * 3600_000)
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes(), day: d.getUTCDate(), month: d.getUTCMonth() + 1 }
}
export const phaseOf = (now) => {
  const { hour, minute } = gameTime(now)
  const m = hour * 60 + minute
  return DAY_PHASES.filter(([at]) => at <= m).at(-1)
}

const DIGITS = '零一二三四五六七八九'
/** 0–9999 in Chinese numerals, as the mudlib's chinese_number says amounts. */
export function cn(n) {
  n = Math.floor(n)
  if (n < 10) return DIGITS[n]
  if (n < 20) return '十' + (n % 10 ? DIGITS[n % 10] : '')
  const units = ['', '十', '百', '千']
  const s = String(n)
  let out = ''
  let zero = false
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i]); const u = units[s.length - 1 - i]
    if (d === 0) { zero = true; continue }
    if (zero && out) out += '零'
    zero = false
    out += DIGITS[d] + u
  }
  return n >= 10000 ? String(n) : out
}

/** feature/npc/vendor.c price_string: whole gold, else whole silver, else coins. */
export const priceText = (v) => (v % 10000 === 0 ? `${cn(v / 10000)}两黄金` : v % 100 === 0 ? `${cn(v / 100)}两银子` : `${cn(v)}文钱`)
const HOURS = '子丑寅卯辰巳午未申酉戌亥'
/** The game's time of day said the old way: 午时三刻. */
export function timeText(now) {
  const { hour, minute } = gameTime(now)
  const branch = HOURS[Math.floor(((hour + 1) % 24) / 2)]
  const ke = Math.floor((((hour + 1) % 2) * 60 + minute) / 15)
  return `${branch}时${ke ? cn(ke) + '刻' : '正'}`
}
