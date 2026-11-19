import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run } from '../app/game.js'
import { ROOMS, NPCS, spawnNpc } from '../app/world.js'

const CC = 'x/qujing/chechi/'

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
    // Past 平顶山 and trained a little.
    P: { skills: { unarmed: 40, dodge: 40, parry: 35, force: 15, spells: 15 }, maxForce: 80, level: 9 },
    X: { skills: { unarmed: 90, dodge: 90, parry: 90, spells: 60 }, maxForce: 60, level: 30 }, // a test's sure hand
  }
  const enter = (id, name, a = 'V', room = CC + 'jieshi1') => {
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
  const team = (...ids) => { for (const id of ids) s.players[id].team = ids[0] }
  const up = (...ids) => { for (const id of ids) { const p = s.players[id]; delete p.out; p.kee.cur = p.kee.eff = p.kee.max; p.hp.cur = p.hp.max } }
  const wait = (ms, id) => { clock.now += ms; return say(id, '看') }
  const npcs = (room, re) => Object.keys(s.npcs).filter((k) => s.npcs[k].room === room && !s.npcs[k].dead && re.test(k))
  return { s, say, enter, spawn, clock, team, up, wait, npcs }
}
/** A disguised as `k`, the statue carried to the 五谷轮回 and thrown in, back in 三清殿. */
function throwStatue(t, id, k = '元始天尊') {
  const { s, say } = t
  s.players[id].room = CC + 'sanqing'
  assert.match(say(id, `变 ${k}`), /摇身一变/)
  assert.match(say(id, `搬 ${k}`), /稳稳地将.*扛在肩上/)
  say(id, '南', '开门', '东')
  assert.equal(s.players[id].room, CC + 'wugu')
  assert.match(say(id, `扔 ${k}`), /往坑里一扔/)
  assert.match(say(id, '看'), /溅起一阵臭气/)
  say(id, '西', '北')
  assert.equal(s.players[id].room, CC + 'sanqing')
}
function veteran(t, id, name, a = 'X') {
  const p = t.enter(id, name, a, CC + 'sanqing')
  p.xyj.exp = 8000
  p.skills.spells = 60
  p.xyj.mana = p.xyj.maxMana = 300
  p.attrs.str = 15
  return p
}

test('车迟国: 106 rooms tied to the road; the 秘院 has no way in but the 书柜; the 大仙 are made, and tuned', () => {
  const cc = Object.keys(ROOMS).filter((k) => k.startsWith(CC))
  assert.equal(cc.length, 106)
  for (const k of cc) for (const to of Object.values(ROOMS[k].exits)) assert.ok(ROOMS[to], `${k} → ${to}`)
  assert.ok(!Object.values(ROOMS).some((r) => Object.values(r.exits).includes(CC + 'miyuan')))
  for (const k of ['huli', 'luli', 'yangli']) assert.ok(NPCS[CC + 'npc/' + k].max.kee <= 250)
  assert.ok(NPCS[CC + 'npc/weishi@zhaomen'].max.kee < 200)
  const t = world()
  t.enter('user:a', '阿青', 'V', CC + 'cangjing')
  assert.match(t.say('user:a', '念 shugui'), /一阵风将你带了过去/)
  assert.equal(t.s.players['user:a'].room, CC + 'miyuan')
  assert.match(t.say('user:a', '看'), /狼力大仙/)
  assert.match(t.say('user:a', '去 车迟国'), /一路/)
})

test('三清殿: the statues are lifted only with the strength for 75000, never dropped or given, thrown only in the 五谷轮回', () => {
  const t = world()
  const { s, say } = t
  veteran(t, 'user:a', '阿青')
  const p = new Proxy({}, { get: (_, k) => s.players['user:a'][k] })
  assert.match(say('user:a', '拿 元始天尊'), /吃奶的力气/)
  p.attrs.str = 12 // 60000 + 90×200 = 78000: the statue's 75000, but not with a sword of 5000 besides
  s.things['t:sword'] = { id: 'x/obj/weapon/sword/changjian', at: 'user:a' }
  assert.match(say('user:a', '搬 灵宝道君'), /只是晃了一晃/)
  delete s.things['t:sword']
  assert.match(say('user:a', '搬 灵宝道君'), /稳稳地将灵宝道君扛在肩上/)
  assert.ok(!t.npcs(CC + 'sanqing', /lingbao/).length)
  assert.match(say('user:a', '搬 太上老君'), /只是晃了一晃/) // 75000 on the shoulder already
  assert.match(say('user:a', '放下 灵宝道君'), /硬着头皮又搬了起来/)
  assert.equal(say('user:a', '扔 灵宝道君'), '你要扔什么？') // the statues still standing answer over it
  say('user:a', '南')
  assert.match(say('user:a', '扔 灵宝道君'), /没有扔圣象的地方/)
  s.things['t:two'] = { id: CC + 'obj/taishang', at: 'user:a' } // a second on the shoulder answers over it
  assert.equal(say('user:a', '扔 灵宝道君'), '你要扔什么？')
  delete s.things['t:two']
  say('user:a', '北')
  // 搬 and 扔 are the statues' own commands: where none stands and none is carried, they are not known.
  t.enter('user:b', '大壮', 'V', CC + 'jieshi1')
  assert.equal(say('user:b', '搬 石头'), '什么？')
  assert.equal(say('user:b', '扔 石头'), '什么？')
  // Eaten so, the 蒸酥 brings a 道士 (all three are not there).
  assert.match(say('user:a', '吃 蒸酥'), /饥不择食/)
  const r = say('user:a', '看')
  assert.match(r, /哪里来的草贼/)
  assert.ok(Object.keys(s.npcs).some((k) => /daoshi\.t/.test(k)))
})

test('two statues carried: thrown outside the 五谷轮回, the word is of the statue whose throw came first', () => {
  const t = world()
  const { s, say } = t
  veteran(t, 'user:a', '阿青')
  s.players['user:a'].attrs.str = 40
  say('user:a', '南', '北') // come in: the standing statues' throw from now
  say('user:a', '搬 元始天尊', '搬 灵宝道君')
  assert.equal(say('user:a', '扔 元始天尊'), '你要扔什么？') // 太上 still stands here, its throw older
  say('user:a', '南')
  assert.match(say('user:a', '扔 元始天尊'), /没有扔圣象的地方/) // 元始 lifted first
  assert.equal(say('user:a', '扔 灵宝道君'), '你要扔什么？')
  say('user:a', '北') // back in: 太上's throw is the newest now
  assert.match(say('user:a', '扔 元始天尊'), /没有扔圣象的地方/)
})

test('the 蒸酥: each of XYJ\'s five checks, in order, brings the 道士; all passed, the 大仙 come and follow', () => {
  const checks = [
    [(t) => { t.say('user:a', '变 元始天尊') }, /狼吞虎咽/], // two 元始天尊 now
    [(t) => { t.say('user:a', '变 元始天尊', '搬 元始天尊') }, /风卷残云/], // one, but on the shoulder
    [() => {}, /囫囵吞枣/], // not one of the three
    [(t) => { throwStatue(t, 'user:a'); t.s.players['user:a'].xyj.exp = 4000 }, /急急忙忙/], // 道行 too low
  ]
  for (const [set, re] of checks) {
    const t = world(3)
    veteran(t, 'user:a', '阿青')
    set(t)
    t.s.things['t:su'] = { id: CC + 'obj/zhengsu', at: CC + 'sanqing' }
    assert.match(t.say('user:a', '吃 蒸酥'), re)
    assert.match(t.say('user:a', '看'), /草贼/)
  }
  const t = world(5)
  const { s, say } = t
  veteran(t, 'user:a', '阿青')
  throwStatue(t, 'user:a')
  assert.match(say('user:a', '吃 蒸酥'), /一本正经/)
  assert.equal(s.players['user:a'].xyj.qj.cc, 'eaten')
  assert.match(say('user:a', '看'), /圣象显灵了/)
  assert.match(say('user:a', '看'), /虎力大仙扬尘出现/)
  assert.match(t.wait(8000, 'user:a'), /一边祷告，一边斜眼看着你[\s\S]*竟敢冒充我道圣人/) // eyed, 法力 gone; followed
  assert.ok(s.players['user:a'].xyj.mana <= 2)
  assert.equal(Object.values(s.npcs).filter((c) => c.follow === 'user:a').length, 3)
})

test('leaving 三清殿 before the 大仙 follow is told; so is leaving the king before he judges', () => {
  const t = world(5)
  const { s, say } = t
  veteran(t, 'user:a', '阿青')
  throwStatue(t, 'user:a')
  say('user:a', '吃 蒸酥', '看', '看')
  assert.match(say('user:a', '北'), /三大仙还没跟上你/)
  say('user:a', '南')
  t.wait(15_000, 'user:a')
  assert.equal(Object.values(s.npcs).filter((c) => c.follow === 'user:a').length, 3) // they had not eyed one yet
  for (const [k, c] of Object.entries(s.npcs)) if (c.follow === 'user:a') c.room = CC + 'wufeng'
  s.players['user:a'].room = CC + 'wufeng'
  say('user:a', '北')
  assert.match(t.wait(1000, 'user:a'), /三位国师请了/)
  assert.match(say('user:a', '南'), /国王还没发落你/)
  say('user:a', '北')
  t.wait(16_000, 'user:a')
  assert.equal(s.players['user:a'].xyj.qj.cct, 'seen_king')
})

test('朝门: the 卫士 fall on whoever comes in, and none goes north while one is up', () => {
  const t = world(2)
  const { s, say } = t
  t.enter('user:n', '小白', 'N', CC + 'gongmen')
  const r = say('user:n', '北')
  assert.match(r, /贱民无法无天，擅闯禁地/)
  delete s.players['user:n'].out
  if (s.players['user:n'].ghost) return
  assert.match(say('user:n', '北'), /禁行/)
  for (const id of t.npcs(CC + 'zhaomen', /weishi/)) s.npcs[id].out = t.clock.now + 60_000
  say('user:n', '北')
  assert.equal(s.players['user:n'].room, CC + 'tan')
})

/** The trio and the king brought to the contests by `id` (as the chain leaves them), and `who` with `id`. */
function atContests(t, id, ...who) {
  const { s } = t
  for (const q of [id, ...who]) { s.players[q].xyj.qj = { cc: 'eaten', cct: 'seen_king' }; s.players[q].room = CC + 'tan' }
  const king = `n:${CC}npc/king`
  s.npcs[king].room = CC + 'tan'
  s.npcs[king].follow = id
  for (const k of ['huli', 'luli', 'yangli']) { const n = t.spawn(CC + 'npc/' + k, CC + 'tan', 'x'); s.npcs[n].follow = king; s.npcs[n].owner = id }
}

test('祭水场: the first climb always fails; a fall costs a level of 轻功 and 招架 under 75 and knocks one out', () => {
  const t = world(4)
  const { s, say } = t
  t.enter('user:a', '阿青', 'P', CC + 'tan')
  const p = new Proxy({}, { get: (_, k) => s.players['user:a'][k] })
  atContests(t, 'user:a')
  assert.match(say('user:a', '西'), /请上云梯/)
  assert.match(say('user:a', '登 禅台'), /虎力大仙招来一席彩云/)
  assert.match(say('user:a', '西'), /禅台顶上打坐/)
  assert.match(say('user:a', '状态'), /气血/) // looking about is still let
  t.wait(35_000, 'user:a')
  assert.equal(p.skills.dodge, 39)
  assert.equal(p.skills.parry, 34)
  assert.ok(p.out > t.clock.now)
  assert.equal(p.xyj.qj.cc, 'eaten')
})

test('坛场: a wrong guess puts one in the 柜子 two minutes, every command swallowed; 鹿力 says 仙衣 for 道童', () => {
  let saw = false
  for (let seed = 1; seed < 12 && !saw; seed++) {
    const t = world(seed)
    const { s, say } = t
    t.enter('user:a', '阿青', 'P', CC + 'tan')
    atContests(t, 'user:a')
    s.players['user:a'].xyj.qj.cc = 'chantai'
    const r = say('user:a', '猜 道童')
    assert.match(r, /这里面是道童吧/)
    assert.match(say('user:a', '猜 桃子'), /这不正猜着吗/)
    const r2 = t.wait(3000, 'user:a')
    assert.match(r2, /是(桃子|仙衣)”/)
    if (/仙衣/.test(r2)) saw = true
    t.wait(3000, 'user:a')
    assert.equal(s.players['user:a'].temp.chechi_in, 'guizi')
    assert.match(say('user:a', '南'), /^你/)
    assert.equal(s.players['user:a'].room, CC + 'tan')
    assert.match(say('user:a', '状态'), /^你/) // swallowed too
    t.wait(120_000, 'user:a')
    assert.ok(!s.players['user:a'].temp.chechi_in)
  }
  assert.ok(saw)
})

test('祈雨场: going into the 油锅 for nothing can kill one under 道行 20000', () => {
  let died = 0
  for (let seed = 1; seed < 16; seed++) {
    const t = world(seed)
    const { s, say } = t
    t.enter('user:a', '阿青', 'P', CC + 'qiyu')
    assert.match(say('user:a', '进 油锅'), /纵入热浪翻滚的大油锅/) // no 大仙 here, nor the king: invalid
    t.wait(36_000, 'user:a')
    assert.ok(!s.players['user:a'].temp.chechi_in)
    if (s.players['user:a'].ghost) died++
  }
  assert.ok(died >= 2 && died <= 10, `died ${died}`)
})

test('the 大仙 killed: the contests cannot be had, and that is said; a ghost\'s followers wait for them', () => {
  const t = world(6)
  const { s, say } = t
  t.enter('user:a', '阿青', 'X', CC + 'tan')
  atContests(t, 'user:a')
  let r = ''
  for (let i = 0; i < 6 && !/斗法比不成了/.test(r); i++) { t.up('user:a'); r = say('user:a', '杀 鹿力大仙') }
  assert.match(r, /白色鹿头[\s\S]*斗法比不成了/)
  t.up('user:a')
  say('user:a', '西')
  assert.match(say('user:a', '登 禅台'), /国王和三大仙都得在场/)
  t.wait(40_000, 'user:a')
  t.up('user:a')
  say('user:a', '东')
  // The king waits where one died and takes up with one again.
  const king = `n:${CC}npc/king`
  s.players['user:a'].ghost = true
  t.wait(3000, 'user:a')
  assert.equal(s.npcs[king].lost, 'user:a')
  delete s.players['user:a'].ghost
  s.players['user:a'].room = CC + 'zhaomen'
  for (const id of t.npcs(CC + 'zhaomen', /weishi/)) s.npcs[id].dead = 1
  say('user:a', '北')
  assert.equal(s.npcs[king].follow, 'user:a')
})

test('车迟国 whole: a veteran and a newcomer, the statue to the king to the three contests; done for both', () => {
  const t = world(Number(process.env.SEED ?? 21))
  const { s, say, up, wait } = t
  veteran(t, 'user:a', '阿青')
  const a = new Proxy({}, { get: (_, k) => s.players['user:a'][k] })
  t.enter('user:b', '小白', 'N', CC + 'sanqing')
  t.team('user:a', 'user:b')
  say('user:b', '跟随 阿青')
  throwStatue(t, 'user:a', '太上老君')
  s.players['user:b'].room = CC + 'sanqing'
  assert.match(say('user:a', '吃 蒸酥'), /一本正经/)
  assert.equal(s.players['user:b'].xyj.qj.cct, 'eaten')
  wait(20_000, 'user:a')
  assert.equal(Object.values(s.npcs).filter((c) => c.follow === 'user:a').length, 3)
  // Down the 石板路 and through the town to the palace (the walk of it: 去).
  say('user:a', '去 宫门')
  assert.equal(s.players['user:a'].room, CC + 'gongmen')
  assert.equal(s.players['user:b'].room, CC + 'gongmen')
  assert.equal(Object.values(s.npcs).filter((c) => c.follow === 'user:a' && c.room === CC + 'gongmen').length, 3)
  say('user:b', '跟随 无') // the newcomer waits while the veteran, sword in hand, clears the 朝门
  s.things['t:sword'] = { id: 'x/obj/weapon/sword/changjian', at: 'user:a', eq: 'wield' }
  s.players['user:a'].skills.sword = 60
  for (let i = 0; i < 10 && t.npcs(CC + 'zhaomen', /weishi/).length; i++) {
    up('user:a')
    say('user:a', s.players['user:a'].room === CC + 'zhaomen' ? '杀 护宫卫士' : '北')
  }
  assert.match(say('user:a', '北'), /坛场/)
  say('user:b', '北', '北', '跟随 阿青')
  assert.equal(s.players['user:b'].room, CC + 'tan')
  say('user:a', '北', '北')
  assert.equal(s.players['user:a'].room, CC + 'jinluan')
  assert.match(wait(16_000, 'user:a'), /监斩官前见分晓/)
  assert.equal(s.players['user:b'].xyj.qj.cct, 'seen_king')
  // 祭水场: 坐禅 till it comes off.
  say('user:a', '南', '南', '西')
  assert.equal(s.players['user:a'].room, CC + 'jishui')
  for (let i = 0; i < 20 && a.xyj.qj.cc !== 'chantai'; i++) {
    up('user:a', 'user:b')
    say('user:a', '登 禅台')
    wait(46_000, 'user:a')
  }
  assert.equal(s.players['user:b'].xyj.qj.cc, 'chantai')
  // 坛场: 猜枚.
  up('user:a', 'user:b')
  say('user:a', '东')
  for (let i = 0; i < 20 && a.xyj.qj.cc !== 'guizi'; i++) {
    say('user:a', '猜 宫衣')
    wait(130_000, 'user:a')
  }
  assert.equal(s.players['user:b'].xyj.qj.cc, 'guizi')
  // 祈雨场: the 油锅.
  say('user:a', '东')
  assert.match(say('user:a', '看'), /羊力大仙/)
  let r = ''
  for (let i = 0; i < 20 && a.xyj.obstacle.chechi !== 'done'; i++) {
    up('user:a', 'user:b')
    say('user:a', '进 油锅')
    r = wait(46_000, 'user:a')
    r += say('user:a', '看')
  }
  assert.match(r, /果然是兽精/)
  assert.match(r, /阿青车迟国施展圣手，大破妖道！/)
  assert.equal(a.xyj.obstacle.chechi, 'done')
  assert.equal(s.players['user:b'].xyj.obstacle.chechi, 'done')
  assert.ok(s.players['user:b'].xyj.exp >= 5000)
  wait(6000, 'user:a')
  assert.ok(!Object.entries(s.npcs).some(([k, c]) => /(huli|luli|yangli)\./.test(k) && !c.dead))
})

test('金钗女: sleeping with her costs everything one carries; the 道士 of the 厢房 lie down and wake', () => {
  const t = world(8)
  const { s, say } = t
  t.enter('user:a', '阿青', 'V', CC + 'jieshi8')
  s.things['t:s'] = { id: 'x/obj/weapon/sword/changjian', at: 'user:a' }
  s.things['t:c'] = { id: 'stock/silver', at: 'user:a', n: 5 }
  say('user:a', '南')
  assert.match(say('user:a', '睡觉'), /心醉神迷/)
  const r = say('user:a', '看')
  assert.match(r, /神秘地一笑/)
  assert.match(r, /从你身上拿出长剑/)
  assert.ok(!Object.values(s.things).some((x) => x.at === 'user:a'))
  assert.ok(!s.things['t:s'] && !s.things['t:c'])
  s.players['user:a'].room = CC + 'xiang1'
  delete s.players['user:a'].out
  say('user:a', '东')
  assert.match(say('user:a', '看'), /鼾声大作/)
  assert.match(t.wait(25_000, 'user:a'), /一觉醒来/)
})

/** Of `runs` fresh worlds, how often `team` walking into the 朝门 beats both 卫士 (none left up, one of them alive). */
function rateGate(team, runs = 16) {
  let wins = 0
  for (let r = 0; r < runs; r++) {
    const t = world(1000 + r * 7919)
    const { s, say } = t
    const ids = team.split('+').map((a, i) => { const id = 'user:' + i; t.enter(id, a + i, a, CC + 'gongmen'); return id })
    if (ids.length > 1) { t.team(...ids); say(ids[1], `跟随 ${s.players[ids[0]].name}`) }
    say(ids[0], '北')
    const gate = () => t.npcs(CC + 'zhaomen', /weishi/).filter((k) => !(s.npcs[k].out > t.clock.now))
    for (let i = 0; i < 4 && gate().length; i++) {
      const upNow = ids.filter((id) => !s.players[id].ghost && !(s.players[id].out > t.clock.now) && s.players[id].room === CC + 'zhaomen')
      if (!upNow.length) break
      say(upNow.at(-1), '杀 护宫卫士')
    }
    if (!gate().length && ids.some((id) => !s.players[id].ghost)) wins++
  }
  return wins / runs
}
/** Wins of a team against one monster, as in xyj-road.test.mjs. */
function rate(key, team, runs = 16) {
  let wins = 0
  for (let r = 0; r < runs; r++) {
    const t = world(2000 + r * 7919)
    const { s, say } = t
    const ids = team.split('+').map((a, i) => { const id = 'user:' + i; t.enter(id, a + i, a, CC + 'jieshi1'); return id })
    if (ids.length > 1) t.team(...ids)
    const nid = t.spawn(key, CC + 'jieshi1')
    for (let i = 0; i < 4 && !s.npcs[nid].dead; i++) {
      const upNow = ids.filter((id) => !s.players[id].ghost && !(s.players[id].out > t.clock.now))
      if (!upNow.length) break
      say(upNow.at(-1), `杀 ${NPCS[key].name}`)
    }
    if (s.npcs[nid].dead) wins++
  }
  return wins / runs
}
const RATES = process.env.RATES
test('the numbers: the 朝门 is for one past 平顶山 with a teammate; the 大仙 and the 秘院 are harder', () => {
  if (RATES) for (const tm of ['P+V', 'P+W', 'P', 'W+V', 'V']) console.log('gate', tm, rateGate(tm))
  if (RATES) for (const [k, tm] of [['huli', 'P+V'], ['jz1', 'P+V'], ['daoshi', 'P'], ['langli', 'P+W']]) console.log(k, tm, rate(CC + 'npc/' + k, tm))
  assert.ok(rateGate('P+V') >= 0.5)
  assert.ok(rateGate('P') <= 0.35) // alone, rarely
  assert.ok(rateGate('V') <= 0.35)
  assert.ok(rate(CC + 'npc/huli', 'P+V') <= 0.5)
  assert.ok(rate(CC + 'npc/langli', 'P+W') <= 0.35)
})
