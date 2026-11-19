// One world, many pages: what two pages writing at once must not break, and what one player may do to another.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run, wakes } from '../app/game.js'
import { RESET, ONLINE, NPCS } from '../app/world.js'
import { gameTime } from '../app/text.js'

/** The first real moment after `from` when the game's clock (60×) reads `hour`:00. */
function at(hour, from = Date.UTC(2026, 10, 8, 3, 0, 0)) {
  let t = from
  while (gameTime(t).hour !== hour || gameTime(t).minute !== 0) t += 1000
  return t
}

function world(seed = 7) {
  let n = seed
  const rand = () => { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646 }
  const clock = { now: at(11) }
  const s = fresh({ now: clock.now, rand })
  const o = () => ({ now: (clock.now += 3000), rand })
  const enter = (id, name, agent = false) => apply(s, join(s, id, { name, agent, ...o() }))
  const play = (id, ...lines) => lines.map((l) => { const r = run(s, id, l, o()); apply(s, r.ops); return r }).at(-1)
  const say = (id, ...lines) => play(id, ...lines).reply
  return { s, enter, play, say, clock, rand }
}
/** Each leaf `next` changed from `base`: [path, value], undefined for one removed (how the host merges a write). */
function leaves(base, next, path = []) {
  const obj = (v) => v && typeof v === 'object' && !Array.isArray(v)
  if (obj(base) && obj(next)) {
    return [...new Set([...Object.keys(base), ...Object.keys(next)])].flatMap((k) => leaves(base[k], next[k], [...path, k]))
  }
  return JSON.stringify(base) === JSON.stringify(next) ? [] : [[path, next]]
}
/** Two pages run a command each on the same copy of the world; the file then takes both, leaf by leaf. */
function together(s, [a, la, ta], [b, lb, tb], rand = Math.random) {
  const base = structuredClone(s)
  const out = []
  const changes = [[a, la, ta], [b, lb, tb]].flatMap(([id, line, now]) => {
    const w = structuredClone(base)
    const r = run(w, id, line, { now, rand })
    out.push(r)
    apply(w, r.ops)
    return leaves(base, w)
  })
  apply(s, changes)
  return out
}
const coins = (s, id) => Object.values(s.things).filter((t) => t.at === id && t.id === 'stock/coin').reduce((n, t) => n + (t.n ?? 1), 0)

test('the world file holds no arrays outside its log: two pages writing one character merge leaf by leaf', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  s.things['t:purse'] = { id: 'stock/coin', at: 'user:a', n: 100 }
  say('user:b', '组队 阿青')
  say('user:a', '组队 大壮', '买 花生豆')
  s.players['user:a'].room = s.players['user:b'].room = 'x/city/beiyin4'
  say('user:a', '杀 小流氓')
  const arrays = []
  const walk = (v, path) => {
    if (Array.isArray(v)) arrays.push(path)
    else if (v && typeof v === 'object') for (const [k, u] of Object.entries(v)) walk(u, `${path}.${k}`)
  }
  for (const [k, v] of Object.entries(s)) if (k !== 'log') walk(v, k)
  assert.deepEqual(arrays, [])
  assert.deepEqual(Object.keys(s.players['user:a'].kee).sort(), ['cur', 'eff', 'max'])
})

test('two pages crossing the half hour together reset the town once', () => {
  const { s, enter, clock } = world()
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  // 小流氓 died (his corpse and things rotted away): he and what he carried come back at the reset.
  const M = 'n:x/city/npc/liumang'
  s.npcs[M].dead = true
  for (const [tid, t] of Object.entries(s.things)) if (t.at === M) delete s.things[tid]
  const before = Object.values(s.things).filter((t) => t.at === M).length
  assert.equal(before, 0)
  const next = Math.floor(clock.now / RESET) * RESET + RESET
  const alone = structuredClone(s)
  apply(alone, run(structuredClone(alone), 'user:a', '看', { now: next + 100 }).ops)
  together(s, ['user:a', '看', next + 100], ['user:b', '看', next + 900])
  const count = (w, f) => Object.values(w.things).filter(f).length
  assert.equal(coins(s, M), NPCS['x/city/npc/liumang'].coin, '小流氓 carries his coins once')
  assert.equal(count(s, (t) => t.at === M), count(alone, (t) => t.at === M), 'what he carries, once')
  assert.equal(Object.keys(s.things).length, Object.keys(alone.things).length)
})

test('coins handed over while the other pays: neither is lost; two buying at once both count', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  for (const id of ['user:a', 'user:b']) s.things[`t:purse-${id}`] = { id: 'stock/coin', at: id, n: 50 }
  together(s, ['user:a', '给 大壮 20 文钱', clock.now + 1000], ['user:b', '买 花生豆', clock.now + 1200])
  assert.equal(coins(s, 'user:b'), 50 + 20 - 20)
  assert.equal(coins(s, 'user:a'), 30)
  together(s, ['user:a', '买 花生豆', clock.now + 5000], ['user:b', '买 花生豆', clock.now + 5100])
  assert.equal(Object.keys(s.sold).length, 3, 'three sales on the books')
  assert.match(say('user:b', '背包'), /三十文钱/, 'heaps read as one')
})

test('two taking different amounts from one heap on the floor at once: no money made or lost', () => {
  const { s, enter, clock } = world()
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  const room = s.players['user:a'].room
  s.things['t:floor'] = { id: 'stock/coin', at: room, n: 100 }
  together(s, ['user:a', '拿 30 文钱', clock.now + 1000], ['user:b', '拿 40 文钱', clock.now + 1100])
  assert.equal(coins(s, room) + coins(s, 'user:a') + coins(s, 'user:b'), 100)
  assert.equal(coins(s, room), 0, 'a heap not on you is taken whole')
})

test('a thief takes a whole heap while its owner gives from it: no money made', () => {
  const { s, enter, clock } = world(3)
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  enter('user:c', '小翠')
  for (const id of ['user:a', 'user:b', 'user:c']) s.players[id].room = 'x/city/beiyin4'
  s.players['user:a'].skills.stealing = 100
  s.things['t:purse'] = { id: 'stock/coin', at: 'user:b', n: 100 }
  const all = () => coins(s, 'user:a') + coins(s, 'user:b') + coins(s, 'user:c')
  let thief
  for (let i = 0; i < 20 && !/得手了/.test(thief?.reply ?? ''); i++) {
    const t = (clock.now += 10_000)
    ;[thief] = together(s, ['user:a', '偷 文钱 从 大壮', t], ['user:b', '给 小翠 10 文钱', t + 100])
    assert.equal(all(), 100)
  }
  assert.match(thief.reply, /得手了/)
})

test('what is paid leaves the world, and coins given to townspeople are gathered at the reset', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  s.things['t:purse'] = { id: 'stock/coin', at: 'user:a', n: 500 }
  const heaps = () => Object.values(s.things).filter((t) => t.id === 'stock/coin').length
  const before = heaps()
  for (let i = 0; i < 5; i++) say('user:a', '买 花生豆')
  assert.equal(coins(s, 'user:a'), 400)
  assert.equal(heaps(), before, 'no new heap of coins at the counter each sale')
  const v = Object.keys(s.npcs).find((id) => s.npcs[id].room === s.players['user:a'].room)
  for (let i = 0; i < 3; i++) s.things[`t:gift${i}`] = { id: 'stock/coin', at: v, n: 5 }
  const had = coins(s, v)
  clock.now = Math.floor(clock.now / RESET) * RESET + RESET + 100
  say('user:a', '看')
  assert.equal(Object.values(s.things).filter((t) => t.at === v && t.id === 'stock/coin').length, 1)
  assert.equal(coins(s, v), had)
  // Reset ids say what made them, a room or a townsperson, so a room and a townsperson of one name never meet.
  const made = Object.keys(s.things).filter((tid) => tid.startsWith('t:r'))
  assert.ok(made.length)
  for (const tid of made) assert.match(tid, /^t:r[0-9a-z]+\.[rn]:/)
})

test('teams: a leader takes in a whole team; invitations lapse, and do not outlive a change of team', () => {
  const { s, enter, say, clock } = world()
  for (const [id, name] of [['user:a', '阿青'], ['user:b', '大壮'], ['user:c', '小咕'], ['user:d', '小翠']]) enter(id, name)
  say('user:a', '组队 大壮'); say('user:b', '组队 阿青') // 阿青 leads 大壮
  say('user:c', '组队 小翠'); say('user:d', '组队 小咕') // 小咕 leads 小翠
  say('user:c', '组队 阿青')
  assert.match(say('user:a', '组队 小咕'), /你决定让小咕加入队伍/)
  assert.deepEqual(['user:a', 'user:b', 'user:c', 'user:d'].map((id) => s.players[id].team), ['user:a', 'user:a', 'user:a', 'user:a'])
  assert.match(say('user:b', '组队 小咕'), /只有队伍领袖可以邀请别人加入/)
  // A stale invitation: 小翠 asked 大壮, then joined 阿青's team; 大壮, answering later, does not pull her out.
  say('user:a', '离队')
  say('user:d', '组队 大壮')
  say('user:a', '组队 小翠'); say('user:d', '组队 阿青')
  assert.doesNotMatch(say('user:b', '组队 小翠'), /决定/)
  assert.equal(s.players['user:d'].team, 'user:a')
  // An invitation lapses after five minutes.
  say('user:c', '组队 大壮')
  clock.now += 6 * 60_000
  assert.match(say('user:b', '组队 小咕'), /你邀请小咕加入你的队伍/)
  assert.equal(s.players['user:b'].team, undefined)
})

test('killing players: only someone here now, never an agent; nobody away is drawn in', () => {
  const { s, enter, say, clock } = world(5)
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  enter('user:c', '小咕', true)
  enter('user:d', '小翠')
  for (const id of ['user:a', 'user:b', 'user:c', 'user:d']) s.players[id].room = 'x/city/beiyin4'
  assert.match(say('user:a', '杀 小咕'), /是 agent，玩家之间不能对 agent 下杀手/)
  assert.match(say('user:a', '杀 大壮'), /现在不在线，不能对不在线的人下杀手/)
  assert.equal(s.players['user:b'].ghost, undefined)
  // 大壮 opens the page: now he can be killed, but 小翠 (away) and 小咕 (an agent), his teammates, stay out of it.
  say('user:b', '组队 小翠'); say('user:d', '组队 大壮')
  s.players['user:c'].team = 'user:b'
  s.players['user:d'].here = clock.now - ONLINE - 1000
  s.players['user:b'].here = clock.now
  const r = say('user:a', '杀 大壮')
  assert.match(r, /你对着大壮喝道/)
  assert.doesNotMatch(r, /小翠|小咕/)
  for (const id of ['user:c', 'user:d']) assert.equal(s.players[id].kee.eff, s.players[id].kee.max, 'untouched')
})

test('a player robbed is told, and an agent robbed is woken', () => {
  const { s, enter, play, say } = world(3)
  enter('user:a', '阿青')
  enter('user:c', '小咕', true)
  s.players['user:a'].skills.stealing = 100
  s.players['user:a'].room = s.players['user:c'].room = 'x/city/beiyin4'
  s.things['t:sw'] = { id: 'x/obj/weapon/sword/changjian', at: 'user:c' }
  let r
  for (let i = 0; i < 10 && !/得手了/.test(r?.reply ?? ''); i++) r = play('user:a', '偷 长剑 从 小咕')
  assert.match(r.reply, /得手了/)
  const told = r.events.find((ev) => ev.only === 'user:c')
  assert.match(told.t, /长剑不见了 —— 阿青刚刚从你身边走开/)
  assert.deepEqual(wakes(s, told), ['user:c'])
})
