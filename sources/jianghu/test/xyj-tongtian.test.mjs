import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run } from '../app/game.js'
import { ROOMS, NPCS, baseOf } from '../app/world.js'

const TT = 'x/qujing/tongtian/'

function world(seed = 7) {
  let n = seed
  const rand = () => { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646 }
  const clock = { now: Date.UTC(2026, 10, 9, 3, 0, 0) }
  const s = fresh({ now: clock.now, rand })
  const o = () => ({ now: (clock.now += 3000), rand })
  const say = (id, ...lines) => lines.map((l) => { const r = run(s, id, l, o()); apply(s, r.ops); return r.reply }).at(-1)
  const ARCH = {
    N: { skills: {}, maxForce: 0, exp: 0 },
    W: { skills: { unarmed: 30, blade: 30, dodge: 30, parry: 25, force: 10, spells: 50 }, maxForce: 60, level: 6, exp: 3000 },
    // One who has come this far and can 变: three obstacles behind them, trained for the fourth.
    T: { skills: { unarmed: 45, blade: 45, dodge: 45, parry: 40, force: 20, spells: 60 }, maxForce: 100, level: 10, exp: 12000 },
    X: { skills: { unarmed: 90, dodge: 90, parry: 90, spells: 60 }, maxForce: 100, level: 30, exp: 20000 }, // a test's sure hand
  }
  const enter = (id, name, a = 'T', room = TT + 'hedong2') => {
    apply(s, join(s, id, { name, ...o() }))
    say(id, '看')
    const p = s.players[id]
    const A = ARCH[a]
    Object.assign(p.skills, A.skills)
    p.level = A.level ?? 1
    p.xyj.maxForce = p.xyj.force = p.xyj.maxMana = p.xyj.mana = A.maxForce
    p.xyj.exp = A.exp
    p.kee.max = p.kee.eff = p.kee.cur = 100 + Math.floor(A.maxForce / 4)
    p.room = room
    return p
  }
  const give = (id, key) => { const tid = `t:${key}.${id}`; s.things[tid] = { id: key, at: id }; return tid }
  const has = (id, key) => Object.values(s.things).some((t) => t.id === key && t.at === id)
  const wait = (id, ms) => { for (let t = 0; t < ms; t += 3000) say(id, '看') }
  return { s, say, enter, give, has, wait, clock, rand }
}

test('通天河: every exit to a room of this world; the bottom only by falling in', () => {
  for (const [k, r] of Object.entries(ROOMS)) if (k.startsWith(TT)) for (const to of Object.values(r.exits)) assert.ok(ROOMS[to], `${k} → ${to}`)
  assert.ok(!Object.values(ROOMS).some((r) => Object.values(r.exits).includes(TT + 'hedi')))
  assert.equal(NPCS['x/obj/magic/bishuizhou'], undefined)
})

test('袁守诚 gives his 无字天书 for a 桂花酒袋, and swallows anything else; torn open, it holds a 避水咒', () => {
  const { s, say, enter, give, has } = world()
  const p = enter('user:a', '阿青', 'T')
  const yuan = Object.keys(s.npcs).find((id) => baseOf(id) === 'x/city/npc/shouchen')
  p.room = s.npcs[yuan].room
  give('user:a', 'x/ourhome/obj/jitui')
  give('user:a', 'x/moon/obj/jiudai')
  const no = say('user:a', '给 袁守诚 鸡腿')
  assert.match(no, /不敢当不敢当/)
  assert.ok(!has('user:a', 'x/ourhome/obj/jitui'))
  assert.ok(!has(yuan, 'x/ourhome/obj/jitui'))
  assert.match(say('user:a', '给 袁守诚 桂花酒袋'), /投缘/)
  assert.ok(has('user:a', 'x/obj/book/nowords'))
  assert.match(say('user:a', '丢下 天书'), /丢下/)
  assert.match(say('user:a', '撕 天书'), /小心翼翼地取出一张小纸片/)
  assert.ok(has('user:a', 'x/obj/magic/bishuizhou'))
  assert.ok(!has('user:a', 'x/obj/book/nowords'))
})

test('the ice: crackles for anyone; one like a 小童 falls through, pulled out senseless without the 避水咒', () => {
  const { s, say, enter, wait } = world()
  enter('user:a', '阿青', 'N')
  say('user:a', '西')
  assert.equal(s.players['user:a'].room, TT + 'bing2')
  wait('user:a', 48_000)
  assert.equal(s.players['user:a'].room, TT + 'bing2')
  enter('user:b', '大壮', 'T', TT + 'minju4')
  assert.match(say('user:b', '变 小童'), /摇身一变/)
  s.players['user:b'].room = TT + 'hedong2'
  say('user:b', '西')
  wait('user:b', 45_000)
  assert.equal(s.players['user:b'].room, TT + 'bing2')
  assert.ok(s.players['user:b'].out > 0)
  assert.ok(Object.values(s.log).some((e) => /冰棍一般/.test(e.t ?? '')))
  assert.ok(Object.values(s.log).some((e) => /冰咔咔作响/.test(e.t ?? '')))
  assert.ok(Object.values(s.log).some((e) => /咔地一声轻响/.test(e.t ?? '')))
})

test('通天河 whole: two who can 变 go down with their 避水咒; 金鳞怪 killed is a goldfish, and it is done for both', () => {
  const { s, say, enter, give, wait, clock } = world(11)
  const ids = ['user:a', 'user:b']
  for (const [i, id] of ids.entries()) {
    enter(id, ['阿青', '大壮'][i], 'X', TT + 'minju4')
    s.players[id].team = 'T'
    give(id, 'x/obj/magic/bishuizhou')
    assert.match(say(id, '变 小童'), /摇身一变/)
    s.players[id].room = TT + 'hedong2'
  }
  say('user:a', '西')
  say('user:b', '西')
  wait('user:a', 45_000)
  for (const id of ids) assert.equal(s.players[id].room, TT + 'hedi', id)
  const jinyu = `n:${TT}npc/jinyu`
  for (let i = 0; i < 6 && !s.npcs[jinyu]?.dead; i++) {
    for (const id of ids) { delete s.players[id].out; s.players[id].kee.cur = s.players[id].kee.max; s.players[id].hp.cur = s.players[id].hp.max }
    clock.now += 61_000
    say(ids[i % 2], '杀 金鳞怪')
  }
  assert.ok(s.npcs[jinyu].dead)
  assert.ok(!Object.values(s.things).some((t) => t.id === 'corpse' && t.of === jinyu))
  assert.match(say('user:a', '看'), /【闲聊】陈长老：.*通天河救童男女，水宅降鱼精！/)
  for (const id of ids) assert.equal(s.players[id].xyj.obstacle.tongtian, 'done', id)
  assert.ok(Object.values(s.log).some((e) => /通天河救童男女，水宅降鱼精/.test(e.t ?? '')))
  assert.ok(Object.values(s.log).some((e) => /归我莲花池/.test(e.t ?? '')))
})

test('the cold of the river bottom: 10 气 once a fall, then once more a shiver that takes nothing', () => {
  const { s, say, enter, give, wait } = world()
  enter('user:a', '阿青', 'X', TT + 'minju4')
  give('user:a', 'x/obj/magic/bishuizhou')
  say('user:a', '变 小童')
  for (const id of Object.keys(s.npcs)) if (s.npcs[id].room === TT + 'hedi') s.npcs[id].dead = 1 // the monsters out of the way
  s.players['user:a'].room = TT + 'hedong2'
  say('user:a', '西')
  wait('user:a', 45_000)
  assert.equal(s.players['user:a'].room, TT + 'hedi')
  const cold = []
  for (let t = 0; t < 30_000; t += 3000) { const k = s.players['user:a'].kee.cur; say('user:a', '看'); cold.push(k - s.players['user:a'].kee.cur) }
  assert.equal(Object.values(s.log).filter((e) => e.t === '你冻得浑身发抖。').length, 2)
  assert.ok(cold.some((d) => d >= 9), String(cold))
  assert.ok(!(s.timers ?? []).some((t) => t.kind === 'tongtian_cold'))
})

test('变化: into whom one looks like already is oneself again; then known only by that look; not while fighting', () => {
  const { s, say, enter } = world()
  enter('user:a', '阿青', 'T', TT + 'minju4')
  enter('user:b', '大壮', 'T', TT + 'minju4')
  assert.match(say('user:a', '变 小童'), /摇身一变/)
  assert.match(say('user:b', '看 阿青'), /没看到「阿青」/)
  assert.doesNotMatch(say('user:b', '看 小童'), /没看到/)
  assert.match(say('user:b', '变 小童'), /摇身一变/)
  assert.match(say('user:a', '变 小童'), /现了真身/) // oneself first, even with another 小童 here
  assert.equal(s.players['user:a'].temp.bian, undefined)
  assert.doesNotMatch(say('user:b', '看 阿青'), /没看到/)
  const kid = Object.keys(s.npcs).find((id) => s.npcs[id].room === TT + 'minju4' && !s.npcs[id].dead)
  ;(s.npcs[kid].hate ??= {})['user:a'] = 1
  assert.equal(say('user:a', '变 小童'), '你正在战斗，无暇变身。')
})

/** Wins of one player against 金鳞怪 and his 鱼精, falling in, in `runs` fresh worlds. */
function rate(a, runs = 16) {
  let wins = 0
  for (let r = 0; r < runs; r++) {
    const { s, say, enter, give, wait } = world(1000 + r * 7919)
    enter('user:a', '阿' + r, a, TT + 'minju4')
    give('user:a', 'x/obj/magic/bishuizhou')
    s.things[give('user:a', 'x/obj/weapon/blade/blade')].eq = 'wield' // 钢刀 of 长安's smithy
    say('user:a', '变 小童')
    s.players['user:a'].room = TT + 'hedong2'
    say('user:a', '西')
    wait('user:a', 45_000)
    const jinyu = `n:${TT}npc/jinyu`
    for (let i = 0; i < 3 && !s.npcs[jinyu]?.dead; i++) {
      const p = s.players['user:a']
      if (p.ghost || p.room !== TT + 'hedi') break
      say('user:a', p.out > s.t ? '看' : '杀 金鳞怪')
    }
    if (s.npcs[jinyu]?.dead && !s.players['user:a'].ghost) wins++
  }
  return wins / runs
}
test('the numbers: one who can 变 and has trained for it beats 金鳞怪 and his 鱼精 more often than not; one just able to, seldom', () => {
  const t = rate('T')
  const w = rate('W')
  if (process.env.RATES) console.log('T', t, 'W', w)
  assert.ok(t >= 0.5, `T ${t}`)
  assert.ok(w <= 0.5, `W ${w}`)
})

