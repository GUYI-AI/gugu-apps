import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run } from '../app/game.js'
import { ROOMS, NPCS, spawnNpc } from '../app/world.js'

const BX = 'x/qujing/baoxiang/'
const PD = 'x/qujing/pingding/'

function world(seed = 7) {
  let n = seed
  const rand = () => { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646 }
  const clock = { now: Date.UTC(2026, 10, 8, 3, 0, 0) }
  const s = fresh({ now: clock.now, rand })
  const o = () => ({ now: (clock.now += 3000), rand })
  const say = (id, ...lines) => lines.map((l) => { const r = run(s, id, l, o()); apply(s, r.ops); return r.reply }).at(-1)
  const ARCH = {
    N: { skills: {}, maxForce: 0 },
    V: { skills: { unarmed: 15, dodge: 15, parry: 10, force: 4, spells: 4 }, maxForce: 20, level: 3 },
    W: { skills: { unarmed: 30, dodge: 30, parry: 25, force: 10, spells: 10 }, maxForce: 60, level: 6 },
    X: { skills: { unarmed: 90, dodge: 90, parry: 90, spells: 60 }, maxForce: 60, level: 30 }, // a test's sure hand
  }
  /** A player in 长安 as one of: N a newcomer, V back from 五庄观 with a little training, W a while longer. */
  const enter = (id, name, a = 'V', room = 'x/westway/jiayu') => {
    apply(s, join(s, id, { name, ...o() }))
    say(id, '看')
    const p = s.players[id]
    const A = ARCH[a]
    Object.assign(p.skills, A.skills)
    p.level = A.level ?? 1
    p.xyj.maxForce = p.xyj.force = p.xyj.maxMana = p.xyj.mana = A.maxForce
    p.kee.max = p.kee.eff = p.kee.cur = 100 + Math.floor(A.maxForce / 4)
    p.room = room
    return p
  }
  const spawn = (key, room, tag = 'sim') => { const id = `n:${key}.${tag}`; spawnNpc({ w: s, now: clock.now, rand, out: [] }, id, room); return id }
  return { s, say, enter, spawn, clock }
}

test('the road west goes on: 嘉峪关 to 宝象国 and 平顶山, every exit to a room of this world', () => {
  const xyj = Object.entries(ROOMS).filter(([, r]) => r.area === 'xyj')
  assert.equal(xyj.length, 409)
  for (const [id, r] of xyj) for (const to of Object.values(r.exits)) assert.equal(ROOMS[to]?.area, 'xyj', `${id} → ${to}`)
  assert.equal(ROOMS['x/westway/jiayu'].exits['西'], BX + 'yelu8')
  assert.equal(ROOMS[BX + 'yelu1'].exits['西南'], PD + 'shan11')
  assert.ok(!ROOMS[BX + 'gong1'] && !ROOMS[BX + 'luochi1']) // rooms behind guards, a trap loop: left out
  assert.ok(NPCS[BX + 'npc/huangpao'].max.kee < 200) // numbers set to this game's fights
})

test('宝象国: 白骨精 stands in the way till her three shapes are killed; 去 stops there too', () => {
  const { s, say, enter } = world()
  enter('user:a', '阿青', 'X')
  say('user:a', '东') // to 嘉峪关's west: the 野路
  s.players['user:a'].room = BX + 'yelu8'
  let blocked = 0
  for (let i = 0; i < 6 && s.players['user:a'].room === BX + 'yelu8'; i++) if (/挡住了你的路/.test(say('user:a', '西南'))) blocked++
  assert.ok(blocked >= 1)
  s.players['user:a'].room = BX + 'yelu8'
  for (const f of ['女子', '老妇人', '老公公']) {
    s.players['user:a'].kee.cur = s.players['user:a'].kee.max
    say('user:a', `杀 ${f}`)
  }
  const q = s.players['user:a'].xyj.qj
  assert.ok(q.bx_nuzi && q.bx_furen && q.bx_gonggong)
  assert.match(say('user:a', '西南'), /野路/)
})

test('宝象国 whole: the slab, the cave, the letter over the bridge to the king, the princess home; the team shares it', () => {
  const { s, say, enter, clock } = world(11)
  enter('user:a', '阿青', 'X', BX + 'dongwai')
  const a = new Proxy({}, { get: (_, k) => s.players['user:a'][k] })
  enter('user:b', '小白', 'N', BX + 'dongwai')
  for (const id of ['user:a', 'user:b']) { s.players[id].team = 'T'; s.players[id].last = clock.now }
  a.xyj.exp = 5000
  for (const k of ['nuzi', 'furen', 'gonggong']) a.xyj.qj = { ...a.xyj.qj, ['bx_' + k]: 1 }
  a.xyj.force = 10
  assert.match(say('user:a', '撞 石板'), /撞向白玉石板/)
  assert.ok(s.players['user:a'].out > clock.now) // not enough 内力: knocked down
  clock.now += 30_000
  a.xyj.force = a.xyj.mana = 60
  assert.match(say('user:a', '撞 石板'), /天崩地裂/)
  say('user:a', '东南')
  say('user:b', '东南')
  assert.equal(s.players['user:b'].room, BX + 'dong')
  assert.match(say('user:a', '问 百花羞 关于 信'), /摇了摇头/) // 黄袍怪 and the 山妖 are still here
  for (let i = 0; i < 12; i++) {
    const foe = Object.entries(s.npcs).find(([id, c]) => c.room === BX + 'dong' && !c.dead && /huangpao|shanyao/.test(id))
    if (!foe) break
    for (const id of ['user:a', 'user:b']) s.players[id].kee.cur = s.players[id].kee.max
    say('user:a', `杀 ${NPCS[foe[0].slice(2).split('.')[0]].name}`)
  }
  assert.match(say('user:a', '问 百花羞 关于 信'), /秘信/)
  assert.equal(s.players['user:b'].xyj.qj.bx, 'got_letter')
  // To the palace: over the bridge when the boats are together; the 阁门大使 lets letter-bearers up.
  for (const id of ['user:a', 'user:b']) s.players[id].room = BX + 'qiao1'
  const at = (k) => { clock.now += 40_000 - (clock.now % 40_000) + k - 3000 } // each line is 3 s on
  at(21_000) // apart
  assert.match(say('user:a', '南'), /浮桥已被拆开/)
  at(1000) // together
  assert.match(say('user:a', '南'), /云头桥/)
  for (const id of ['user:a', 'user:b']) s.players[id].room = BX + 'longfeng'
  say('user:a', '南')
  assert.equal(s.players['user:a'].room, BX + 'yujie1')
  for (const id of ['user:a', 'user:b']) s.players[id].room = BX + 'tiandi'
  assert.match(say('user:a', '给 国王 秘信'), /军令牌/)
  assert.equal(s.players['user:b'].xyj.qj.bx, 'given_letter')
  // Back to the cave: 百花羞 follows the one with the 军令牌, home to the hall.
  for (const id of ['user:a', 'user:b']) s.players[id].room = BX + 'dongwai'
  assert.match(say('user:a', '东南'), /白玉石板纹丝不动/) // shut again a minute after
  a.xyj.force = a.xyj.mana = 60
  say('user:a', '撞 石板', '东南')
  say('user:b', '东南')
  assert.ok(Object.values(s.npcs).some((c) => c.follow === 'user:a'))
  const r = say('user:a', '去 天地阁')
  assert.match(r, /一路/)
  for (let i = 0; i < 6 && s.players['user:a'].room !== BX + 'tiandi'; i++) { clock.now += 20_000; say('user:a', '去 天地阁') }
  assert.equal(s.players['user:a'].room, BX + 'tiandi')
  assert.equal(s.players['user:a'].xyj.obstacle.baoxiang, 'done')
  s.players['user:b'].room = BX + 'tiandi'
})

test('平顶山: a 法宝 takes the attacker out, a teammate fights on; four killed is done for the team', () => {
  const { s, say, enter, clock } = world()
  enter('user:a', '阿青', 'X', PD + 'nandong')
  enter('user:b', '大壮', 'X', PD + 'nandong')
  for (const id of ['user:a', 'user:b']) { s.players[id].team = 'T'; s.players[id].last = clock.now }
  for (const id of Object.keys(s.npcs)) if (/yao1/.test(id)) s.npcs[id].dead = clock.now // the little ones out of the way
  const r = say('user:a', '杀 金角大王')
  assert.match(r, /紫金红葫芦/)
  if (/吸了进去/.test(r)) {
    assert.ok(s.players['user:a'].out > clock.now)
    s.players['user:b'].kee.cur = s.players['user:b'].kee.max
    assert.doesNotMatch(say('user:b', '杀 金角大王'), /掏出紫金红葫芦/) // a minute before it can be used again
  }
  for (let i = 0; i < 4 && s.npcs[`n:${PD}npc/jinjiao`] && !s.npcs[`n:${PD}npc/jinjiao`].dead; i++) {
    s.players['user:b'].kee.cur = s.players['user:b'].kee.max
    clock.now += 61_000
    say('user:b', '杀 金角大王')
  }
  assert.ok(s.npcs[`n:${PD}npc/jinjiao`].dead)
  assert.equal(s.players['user:a'].xyj.qj.pd_jinjiao, 1)
  assert.ok(Object.values(s.things).some((t) => t.id === PD + 'obj/hulureal' && t.at === PD + 'nandong'))
  for (const [k, room, name] of [['yinjiao', 'beidong', '银角大王'], ['huaqi', 'wofang2', '狐阿七大王'], ['laonai', 'wofang1', '老奶奶']]) {
    for (const id of Object.keys(s.npcs)) if (/yao[12]/.test(id)) s.npcs[id].dead = clock.now
    for (const id of ['user:a', 'user:b']) { s.players[id].room = PD + room; delete s.players[id].out; s.players[id].kee.cur = s.players[id].kee.max }
    for (let i = 0; i < 6 && !s.npcs[`n:${PD}npc/${k}`].dead; i++) {
      clock.now += 61_000
      for (const id of ['user:a', 'user:b']) { delete s.players[id].out; s.players[id].kee.cur = s.players[id].kee.max; s.players[id].last = clock.now }
      say(i % 2 ? 'user:b' : 'user:a', `杀 ${name}`)
    }
    assert.ok(s.npcs[`n:${PD}npc/${k}`].dead, k)
  }
  assert.equal(s.players['user:a'].xyj.obstacle.pingding, 'done')
  assert.equal(s.players['user:b'].xyj.obstacle.pingding, 'done')
})

test('平顶山\'s 小妖 fall on whoever comes in, in every room they stand in', () => {
  const { s, say, enter } = world(3)
  enter('user:a', '阿青', 'X', PD + 'dongmen')
  const r = say('user:a', '南')
  assert.equal(s.players['user:a'].room, PD + 'nandong')
  assert.match(r, /哪里来的毛贼/)
})

test('宝象国\'s 宫兵 fall on the 山妖 among them a second after anyone comes in', () => {
  const { s, say, enter } = world(5)
  const [dir, from] = Object.entries(ROOMS[BX + 'bei1'].exits).find(([, to]) => !to.endsWith('yedu'))
  const back = Object.entries(ROOMS[from].exits).find(([, to]) => to === BX + 'bei1')[0]
  enter('user:a', '阿青', 'X', from)
  say('user:a', back, '看', '看')
  assert.equal(s.players['user:a'].room, BX + 'bei1', dir)
  const yao = Object.keys(s.npcs).filter((k) => k.includes('npc/shanyao') && s.npcs[k].room === BX + 'bei1')
  assert.ok(yao.length && yao.every((k) => s.npcs[k].dead || s.npcs[k].out > 0), yao.join())
  assert.ok(Object.values(s.log).some((e) => e.k === 'fight' && /老匹夫！今日不是你死就是我活/.test(JSON.stringify(e.lines))))
})

test('the 腥风 of 碗子山 knocks the untried down; the 野渡 once a crossing, half the time', () => {
  const { s, say, enter } = world(9)
  const p = enter('user:n', '小白', 'N', BX + 'shanwan1')
  assert.match(say('user:n', '西'), /两腿突然一软/)
  assert.equal(s.players['user:n'].room, BX + 'shanwan1')
  assert.ok(s.players['user:n'].out > 0)
  delete s.players['user:n'].out
  s.players['user:n'].xyj.exp = 50 // fought alongside on the 野路
  say('user:n', '西')
  assert.equal(s.players['user:n'].room, BX + 'shan2')
  s.players['user:n'].room = BX + 'yedu'
  s.players['user:n'].xyj.exp = 0
  assert.match(say('user:n', '东南'), /腥风|两腿/) // the untried: down the first time
  delete s.players['user:n'].out
  say('user:n', '东南') // and through the next
  assert.equal(s.players['user:n'].room, BX + 'bei1')
  void p
})

test('the robed monsters come up out of the mire a while after one comes in, and sink again', () => {
  const { s, say, enter, clock } = world(4)
  enter('user:a', '阿青', 'X', BX + 'shan3')
  say('user:a', '西北') // into shan2
  clock.now += 41_000
  const r = say('user:a', '看')
  assert.match(r, /蓝袍怪/)
  assert.match(r, /绿袍怪/)
  clock.now += 10_000
  assert.match(say('user:a', '看'), /一头钻入沼泽之中/)
  assert.ok(!Object.keys(s.npcs).some((id) => /pao\./.test(id)))
})

test('a letter brought again: the king remembers the one who helped before', () => {
  const { s, say, enter } = world(2)
  enter('user:a', '阿青', 'X', BX + 'tiandi')
  s.players['user:a'].xyj.qj = { bx: 'got_letter', bxp: 'given_letter' }
  s.things['t:l'] = { id: BX + 'obj/letter', at: 'user:a', owner: 'user:a' }
  const r = say('user:a', '给 国王 秘信')
  assert.match(r, /又来相助/)
  assert.match(r, /军令牌/)
  assert.equal(s.players['user:a'].xyj.qj.bx, 'given_letter')
})

test('黄袍怪 attacked turns on his wife too, if he lives through it', () => {
  const { s, say, enter } = world(6)
  enter('user:n', '小白', 'N', BX + 'dong')
  for (const id of Object.keys(s.npcs)) if (/shanyao/.test(id)) s.npcs[id].dead = 1
  say('user:n', '杀 黄袍怪')
  const wife = s.npcs[`n:${BX}npc/baihua`]
  assert.ok(wife.beingKilled)
})

test('the 石栈: stay 25 s and the floor gives way into the iron cage; bend the bars to get out', () => {
  const { s, say, enter, clock } = world(8)
  enter('user:a', '阿青', 'X', 'x/westway/jiuquan')
  say('user:a', '西')
  assert.equal(s.players['user:a'].room, 'x/westway/shizhan')
  clock.now += 26_000
  assert.match(say('user:a', '看'), /掉到了铁笼中/)
  assert.equal(s.players['user:a'].room, 'x/westway/tielong')
  assert.match(say('user:a', '出去'), /铁栏杆关着/)
  s.players['user:a'].attrs.str = 40
  for (let i = 0; i < 9 && !s.rooms['x/westway/tielong']?.open; i++) { s.players['user:a'].kee.cur = s.players['user:a'].kee.max; say('user:a', '扳 铁笼') }
  say('user:a', '出去')
  assert.equal(s.players['user:a'].room, 'x/westway/lu1')
})

test('at noon, out of doors, 法力 without 法术 is drawn off', () => {
  const { s, say, enter, clock } = world(3)
  const p = enter('user:a', '阿青', 'N', 'x/city/center')
  s.players['user:a'].xyj.mana = s.players['user:a'].xyj.maxMana = 30
  s.players['user:a'].here = clock.now
  for (let i = 0; i < 40 && s.players['user:a'].xyj.mana; i++) { clock.now += 60_000; s.players['user:a'].here = clock.now; say('user:a', '看') }
  assert.equal(s.players['user:a'].xyj.mana, 0)
  void p
})

/** Wins of a team against one monster, in `runs` fights each from a fresh world. */
function rate(key, team, runs = 16) {
  let wins = 0
  for (let r = 0; r < runs; r++) {
    const { s, say, enter, spawn, clock } = world(1000 + r * 7919)
    const ids = team.split('+').map((a, i) => {
      const id = 'user:' + i
      enter(id, a + i, a)
      if (team.includes('+')) s.players[id].team = 'T'
      s.players[id].last = clock.now
      return id
    })
    const nid = spawn(key, 'x/westway/jiayu')
    // Whoever is still up goes at it; a 法宝 takes one out for half a minute, then the other has a minute.
    for (let i = 0; i < 4 && !s.npcs[nid].dead; i++) {
      const up = ids.filter((id) => !s.players[id].ghost && !(s.players[id].out > clock.now))
      if (!up.length) break
      say(up.at(-1), `杀 ${NPCS[key].name}`)
    }
    if (s.npcs[nid].dead) wins++
  }
  return wins / runs
}
const RATES = process.env.RATES
test('the numbers: 宝象国 is for one back from 五庄观 with a friend, a newcomer will do; 平顶山 for two', () => {
  if (RATES) for (const [k, t] of [['nuzi', 'V'], ['huangpao', 'V'], ['huangpao', 'N+V'], ['huangpao', 'N']]) console.log(k, t, rate(BX + 'npc/' + k, t))
  if (RATES) for (const [k, t] of [['laonai', 'W'], ['laonai', 'W+V'], ['laonai', 'V+V'], ['jinjiao', 'W'], ['jinjiao', 'V+V'], ['jinjiao', 'W+V'], ['yinjiao', 'W+V'], ['huaqi', 'W+V']]) console.log(k, t, rate(PD + 'npc/' + k, t))
  assert.ok(rate(BX + 'npc/nuzi', 'V') >= 0.5)
  assert.ok(rate(BX + 'npc/huangpao', 'V') <= 0.35)
  assert.ok(rate(BX + 'npc/huangpao', 'N+V') >= 0.5)
  assert.ok(rate(PD + 'npc/laonai', 'W') <= 0.5)
  assert.ok(rate(PD + 'npc/laonai', 'W+V') >= 0.5)
})
