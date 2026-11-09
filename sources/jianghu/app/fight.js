// Combat as the mudlib has it (feature/char/attack.c, feature/char/combat.c, adm/daemons/combatd.c), played out at once:
// a fight runs its rounds when it starts, and what was seen goes into the log as one passage. `fight` (比武) is a
// spar that only tires; `kill` (杀) wounds, knocks out and kills.
//
// Where the mudlib as published cannot work, the smallest fix is made (see SOURCE.md): every weapon attacks (it has
// moves only for swords and fists), fists do damage (its unmapped 内功 zeroes it), 纵跃闪躲之法 counts in defence,
// and skills and levels rise with use.
import { ACTIONS, IDLE, LIMBS, SKILL_NAMES, ATTR_NAMES, damageMsg, woundMsg, tiredMsg, DEAD_MSG } from './text.js'
import {
  HOOKS, ITEMS, ROOMS, online, ch, isNpc, baseOf, npcData, attr, skillLv, applied, consume, wound, thingsAt, makeThing,
  moveThing, vision, tell, nameOf, regen, peopleIn, awake,
} from './world.js'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const rnd = (x, n) => (n > 0 ? Math.floor(x.rand() * n) : 0)
const pick = (x, list) => list[rnd(x, list.length)]

/** The wielded weapon and the skill it is used with. */
export function weaponOf(w, id) {
  const tid = thingsAt(w, id).find((t) => w.things[t].eq === 'wield')
  if (!tid) return { tid: null, skill: 'unarmed' }
  const it = ITEMS[w.things[tid].id]
  const as = [it.wieldAs].flat()[0] ?? 'unarmed'
  return { tid, skill: as, kind: Object.keys(it.weapon ?? {})[0] ?? as, params: Object.values(it.weapon ?? {})[0] ?? [1, 4, 0, 0] }
}

// combat.c query_ability / query_strength
const ability = {
  attack: (w, id, c) => Math.floor(attr(w, id, 'dex') * attr(w, id, 'cor') / 10) + (c.gin.cur >> 5) + applied(w, id, 'attack'),
  defense: (w, id, c) => Math.floor(attr(w, id, 'dex') * attr(w, id, 'cps') / 10) + (c.gin.cur >> 5) + applied(w, id, 'defense'),
  intimidate: (w, id, c) => Math.floor(attr(w, id, 'cor') * attr(w, id, 'str') / 10) + (c.kee.cur >> 5) + applied(w, id, 'intimidate'),
  wittiness: (w, id, c) => Math.floor(attr(w, id, 'cps') * attr(w, id, 'wis') / 10) + (c.kee.cur >> 4),
}
const strength = (w, id, c) => attr(w, id, 'str') * attr(w, id, 'cor') * 150 + c.kee.cur * 30

/** Learned points into a skill; a level comes when they reach (level+1)² (the mudlib leaves this to skill files it lacks). */
export function improve(x, id, s, n) {
  if (isNpc(id) || n <= 0) return
  const p = x.w.players[id]
  const lv = p.skills[s] ?? 0
  p.learned[s] = (p.learned[s] ?? 0) + n + n * rnd(x, Math.floor(lv / 8))
  const before = p.skills[s] ?? 0
  while (p.learned[s] >= ((p.skills[s] ?? 0) + 1) ** 2 && (p.skills[s] ?? 0) < 200) {
    p.learned[s] -= ((p.skills[s] ?? 0) + 1) ** 2
    p.skills[s] = (p.skills[s] ?? 0) + 1
  }
  if (p.skills[s] > before) tell(x, id, `你的「${skillName(s)}」进步了！（${p.skills[s]} 级）`)
}
export const skillName = (s) => SKILL_NAMES[s] ?? s

/**
 * Experience (`score`). A level when 实战经验 reaches 50·L·(L+1) — the mudlib sets no targets, so nobody levels there —
 * with a 30% chance of +1 to an attribute, by human.c's odds.
 */
export function gainScore(x, id, course, n) {
  if (isNpc(id) || n <= 0) return
  const p = x.w.players[id]
  p.score[course] = (p.score[course] ?? 0) + n
  HOOKS.gain?.(x, id, course, n)
  while ((p.score.combat ?? 0) >= 50 * p.level * (p.level + 1)) {
    p.level += 1
    if (x.rand() < 0.3) {
      const roll = rnd(x, 30)
      const a = roll === 0 ? 'dex' : roll < 2 ? 'spi' : roll < 4 ? 'con' : roll < 8 ? 'str' : roll < 12 ? 'int' : roll < 16 ? 'cps' : roll < 25 ? 'wis' : 'cor'
      p.attrs[a] += 1
      tell(x, id, `你的${ATTR_NAMES[a]}值提高了！`)
    }
    tell(x, id, `你的等级提升到了 ${p.level} 级。`)
  }
}

/**
 * A fight `a` starts against `b`: everyone with a side in this room takes part (teammates and protectors help,
 * soldiers stand by each other), and rounds run until one side cannot go on, someone flees, or 150 rounds pass.
 * `mode`: 'fight' spars, 'kill' is to the death. `lead`: what was said as it began.
 */
export function brawl(x, a, b, mode, lead = []) {
  const w = x.w
  const room = ch(w, a).room
  const lines = [...lead]
  const mark = x.out.length
  const ids = new Set([a, b])
  regen(x, a); regen(x, b)
  // Who is killing whom: the one who started; an NPC attacked to kill kills back.
  const kills = new Set()
  if (mode === 'kill') {
    kills.add(`${a}>${b}`)
    if (isNpc(b)) kills.add(`${b}>${a}`)
    else if (ch(w, b).killing?.[a]) kills.add(`${b}>${a}`)
  }
  for (const [k, v] of Object.entries(ch(w, a).hate ?? {})) if (v && k === b) kills.add(`${a}>${b}`)
  const side = { [a]: 0, [b]: 1 }
  // Helpers: teammates in the room (not when two of one team fight each other), guards of the one attacked, soldiers
  // for soldiers.
  const oneTeam = !isNpc(a) && !isNpc(b) && ch(w, a).team && ch(w, a).team === ch(w, b).team
  for (const id of peopleIn(w, room)) {
    // Nobody joins a spar; no agent and nobody away joins a fight.
    if (id in side || !awake(w, id, x.now) || mode !== 'kill' || !(isNpc(id) || online(w, id, x.now))) continue
    const c = ch(w, id)
    for (const [s0, who0] of [[0, a], [1, b]]) {
      const lead0 = ch(w, who0)
      const team = !oneTeam && !isNpc(id) && !isNpc(who0) && lead0.team && lead0.team === c.team
      const guard = c.guarding === who0
      const soldier = isNpc(id) && isNpc(who0) && npcData(id).kind.includes('soldier') && npcData(who0).kind.includes('soldier') && mode === 'kill'
      if (team || guard || soldier) {
        side[id] = s0
        lines.push([guard ? '$N大喝一声，上前助战！' : '$N加入了战团！', id])
        const foe = s0 === 0 ? b : a
        if (mode === 'kill' || guard) kills.add(`${id}>${foe}`)
        if (isNpc(id) && mode === 'kill') kills.add(`${id}>${foe}`)
        break
      }
    }
  }
  // In a fight to the death, a townsperson fights everyone on the other side to the death.
  if (mode === 'kill') for (const id of Object.keys(side)) if (isNpc(id)) for (const o of Object.keys(side)) if (side[o] !== side[id]) kills.add(`${id}>${o}`)
  for (const id of Object.keys(side)) regen(x, id)
  const fighters = () => Object.keys(side).filter((id) => ch(w, id)?.room === room && !ch(w, id).dead && !ch(w, id).ghost)
  const able = (id) => !(ch(w, id).out > x.now)
  let rounds = 0
  let over = false
  const said = []
  const say = (t, p, q) => said.push([t, p, q])

  while (!over && rounds < 150) {
    rounds++
    let swung = false
    for (const id of fighters()) {
      if (over || !able(id) || ch(w, id).room !== room || ch(w, id).dead || ch(w, id).ghost) continue
      const foes = fighters().filter((o) => side[o] !== side[id])
      // A spar stops at someone's exhaustion; an unconscious foe is only hit by those killing them.
      const targets = foes.filter((o) => able(o) || kills.has(`${id}>${o}`))
      if (!targets.length) continue
      const target = pick(x, targets)
      swung = true
      const r = attack(x, id, target, kills.has(`${id}>${target}`), say)
      if (r?.over) over = true
    }
    // The side that has nobody left able to fight is done.
    const standing = [0, 1].map((s) => fighters().some((id) => side[id] === s && able(id)))
    if (!swung || !standing[0] || !standing[1]) {
      // Killers still finish who lies before them.
      const finishing = fighters().some((id) => able(id) && fighters().some((o) => side[o] !== side[id] && !able(o) && kills.has(`${id}>${o}`)))
      if (!finishing) over = true
    }
  }
  if (!over) said.push(['双方打了好一阵子，各自退开了几步，暂且罢手。'])
  // A long fight reads as its opening and its end.
  lines.push(...(said.length > 36 ? [...said.slice(0, 24), ['……（双方又斗了好几回合）……'], ...said.slice(-10)] : said))
  // What only I read during the fight (a level, death) comes after the fight itself.
  const mine = x.out.splice(mark)
  vision(x, room, '', a, b, { k: 'fight', lines, ...(isNpc(b) ? {} : { to: b }) })
  x.out.push(...mine)
  // Hatred lasts: an NPC someone tried to kill attacks them on sight from now on.
  for (const k of kills) {
    const [p, q] = k.split('>')
    if (!isNpc(p) && isNpc(q) && ch(w, q)) (ch(w, q).hate ??= {})[p] = 1
  }
}

/** One swing of `id` at `t` (attack.c attack + combatd fight). */
function attack(x, id, t, killing, say) {
  const w = x.w
  const me = ch(w, id)
  const op = ch(w, t)
  const room = me.room
  // select_opponent: whether this round brings a swing at all.
  if (!(op.out > x.now)) {
    const chance = clamp(50 + (ability.intimidate(w, id, me) - ability.wittiness(w, t, op)) * 2, 20, 80)
    if (rnd(x, 100) >= chance) {
      const wp = weaponOf(w, id)
      if (rnd(x, 3) === 0) say(pick(x, IDLE[wp.skill] ?? IDLE.unarmed).replace('$w', wp.tid ? nameOf(w, wp.tid) : ''), id, t)
      return null
    }
  }
  const wp = weaponOf(w, id)
  const table = ACTIONS[wp.kind === 'sword' ? 'sword' : wp.tid ? 'other' : 'unarmed']
  const [action, type] = pick(x, table)
  const limb = pick(x, LIMBS)
  const wname = wp.tid ? nameOf(w, wp.tid) : ''
  let msg = action.replace('$l', limb).replaceAll('$w', wname)
  // Ability to hit: attack ability + skill, less what the victim knows of the same skill.
  let abil = ability.attack(w, id, me) + skillLv(w, id, wp.skill) - rnd(x, skillLv(w, t, wp.skill) + 1)
  let str = strength(w, id, me)
  const force = skillLv(w, id, 'force')
  if (force) {
    const bonus = Math.floor(force * me.kee.cur * 3)
    if (isNpc(id)) str += bonus
    else if (me.kee.cur > bonus / 500) { consume(me, 'kee', Math.floor(bonus / 500)); str += bonus }
  }
  if (!isNpc(id)) {
    if (me.gin.cur > 1) consume(me, 'gin', 1)
    else { abil = Math.floor(abil / 2); str = Math.floor(str / 2) }
  }
  abil = Math.max(1, abil)
  // Defence: unless knocked out, a dodge by defence ability and 纵跃闪躲之法.
  if (!(op.out > x.now)) {
    const counter = ability.defense(w, t, op) + skillLv(w, t, 'dodge')
    const chance = clamp(50 + (abil - counter) * 2, 5, 95)
    if (rnd(x, 100) > chance) {
      say(`${msg}，但是没中。`, id, t)
      improve(x, t, 'dodge', 1)
      return null
    }
  }
  // Damage: a weapon's setup (x × 1d y + r, plus a bonus of strength), or fists by strength; less armor.
  let dmg
  if (wp.tid) {
    const [xm, y, z, r] = wp.params
    const max = Math.floor(xm * y * z / 100)
    dmg = xm * (1 + rnd(x, y)) + (r ?? 0) + Math.min(rnd(x, Math.floor(str / 20000)), max) + applied(w, id, 'damage') - rnd(x, applied(w, t, 'armor') + 1)
  } else {
    // Armor takes a random part of the blow, as it does of a weapon's (the mudlib takes all of it from fists).
    dmg = 1 + Math.floor(str / 10000) + rnd(x, Math.floor(str / 10000)) + applied(w, id, 'damage') - rnd(x, applied(w, t, 'armor') + 1)
  }
  dmg = Math.max(0, dmg)
  if (dmg > 0) {
    improve(x, id, wp.skill, 1)
    gainScore(x, id, 'combat', 1 + rnd(x, Math.floor(attr(w, id, 'int') / 3)))
  }
  const pct = dmg * 100 / Math.max(1, op.kee.eff)
  say(`${msg}，${damageMsg(pct, type).replace('$l', limb).replaceAll('$w', wname)}`, id, t)
  return receive(x, t, id, dmg, killing, say)
}

/** combat.c receive_damage: 气 spent, and when killing, wounds and 形体; then what it leads to. */
function receive(x, t, from, dmg, killing, say) {
  const w = x.w
  const op = ch(w, t)
  if (dmg <= 0) return null
  const out = op.out > x.now
  if (out) {
    op.hp.cur -= dmg * 10
  } else {
    consume(op, 'kee', dmg)
    if (killing) {
      if (rnd(x, Math.floor(op.kee.eff / 3)) < dmg) { wound(op, 'kee', dmg); gainScore(x, t, 'survive', dmg) }
      if (rnd(x, op.kee.cur) < dmg) op.hp.cur -= rnd(x, dmg) + 1
    }
  }
  if (op.hp.cur <= 0) { die(x, t, from, say); return null }
  if (!out) say(killing && op.kee.eff < op.kee.max ? woundMsg(Math.floor(op.kee.eff * 100 / op.kee.max)) : tiredMsg(Math.floor(op.kee.cur * 100 / Math.max(1, op.kee.eff))), t)
  // A spar is lost when any stat of the one hit is spent (receive_damage): 气 by blows, 精 by one's own attacks.
  if (!killing && !out && op.gin.cur <= 1) { op.gin.cur = 1; return sparOver(x, t, from, say) }
  if (op.kee.cur <= 0 && !out) {
    // Exhausted: a spar is lost (its stats back to 1); otherwise down.
    if (!killing) { op.kee.cur = 1; return sparOver(x, t, from, say) }
    knockOut(x, t, say)
    return null
  }
  // set_stat_notify: under this share of 气, an NPC reacts (most flee).
  const d = isNpc(t) ? npcData(t) : null
  if (d?.notify?.kee && op.kee.cur * 100 < op.kee.max * d.notify.kee) {
    const hook = HOOKS.npc[baseOf(t)]?.notify
    if (hook) return hook(x, t, from, say, killing)
    return flee(x, t, say)
  }
  return null
}

function sparOver(x, loser, winner, say) {
  say('$N招架不住，输掉了这场比试。', loser)
  HOOKS.npc[isNpc(winner) ? baseOf(winner) : '']?.win?.(x, winner, loser)
  return { over: true }
}

/** std/char.c unconcious: down for a minute. */
export function knockOut(x, id, say) {
  const c = ch(x.w, id)
  c.out = x.now + 60_000
  say('$N脚下一个不稳，跌在地上一动也不动了。', id)
  if (!isNpc(id)) tell(x, id, '你的眼前一黑，接着什么也不知道了....')
}

/** An NPC runs out a random exit (notify_stat → random move). */
export function flee(x, id, say) {
  const room = ch(x.w, id).room
  const exits = Object.entries(ROOMS[room].exits)
  if (!exits.length) return null
  const [dir, to] = pick(x, exits)
  say(`$N往${dir}边落荒而逃了。`, id)
  ch(x.w, id).room = to
  return { over: true }
}

/**
 * Death (std/char.c die, adm/daemons/chard.c): a corpse with all they carried, the killer's scores. A player becomes
 * a ghost who comes back to life in 长安's 城隍庙; a townsperson is gone until the town resets.
 */
export function die(x, id, killer, say = null) {
  const w = x.w
  const c = ch(w, id)
  const room = c.room
  const dead = DEAD_MSG[Math.floor(x.rand() * DEAD_MSG.length)]
  if (say) say(dead, id)
  else vision(x, room, dead, id)
  const corpse = makeThing(x, 'corpse', room, 1, { name: `${nameOf(w, id).replace(/的鬼魂$/, '')}的尸体`, unit: '具', decay: x.now, of: id })
  for (const tid of thingsAt(w, id)) moveThing(x, tid, corpse)
  if (killer && !isNpc(killer)) {
    const k = w.players[killer]
    k.score.kills = (k.score.kills ?? 0) + 1
    const d = isNpc(id) ? npcData(id) : null
    if (d?.vendettaMark) (k.vendetta ??= {})[d.vendettaMark] = (k.vendetta[d.vendettaMark] ?? 0) + 1
    for (const [course, n] of Object.entries(d?.bounty ?? {})) gainScore(x, killer, course, n)
  }
  if (isNpc(id)) {
    c.dead = x.now
    delete c.out
    HOOKS.npc[baseOf(id)]?.die?.(x, id, killer) // die(): what a death sets off
    return
  }
  // A ghost: no 气, no fights, until 城隍庙.
  c.ghost = true
  c.diedAt = x.now
  c.hp.cur = 0
  delete c.out
  delete c.follow
  delete c.killing
  c.kee.cur = 0
  tell(x, id, '你死了！！')
  for (const n of Object.values(w.npcs)) if (n.hate) delete n.hate[id]
}
