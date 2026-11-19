import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run } from '../app/game.js'
import { ROOMS, NPCS, spawnNpc } from '../app/world.js'
import { gameTime } from '../app/text.js'

const WJ = 'x/qujing/wuji/'

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
    P: { skills: { unarmed: 40, dodge: 40, parry: 35, force: 15, spells: 15 }, maxForce: 80, level: 8, exp: 5200 }, // past 平顶山
    X: { skills: { unarmed: 90, dodge: 90, parry: 90, spells: 60 }, maxForce: 60, level: 30 }, // a test's sure hand
  }
  const enter = (id, name, a = 'P', room = WJ + 'square') => {
    apply(s, join(s, id, { name, ...o() }))
    say(id, '看')
    const p = s.players[id]
    const A = ARCH[a]
    Object.assign(p.skills, A.skills)
    p.level = A.level ?? 1
    p.xyj.maxForce = p.xyj.force = p.xyj.maxMana = p.xyj.mana = A.maxForce
    p.xyj.exp = A.exp ?? 0
    p.kee.max = p.kee.eff = p.kee.cur = 100 + Math.floor(A.maxForce / 4)
    p.room = room
    return p
  }
  const spawn = (key, room, tag = 'sim') => { const id = `n:${key}.${tag}`; spawnNpc({ w: s, now: clock.now, rand, out: [] }, id, room); return id }
  /** Players up again: 气血 full, awake (between fights, as after a rest). */
  const rest = (...ids) => { for (const id of ids) { const p = s.players[id]; delete p.out; delete p.ghost; p.hp.cur = p.hp.max; p.kee.eff = p.kee.cur = p.kee.max } }
  const toNight = () => { while (gameTime(clock.now).hour < 19 && gameTime(clock.now).hour >= 6) clock.now += 60_000 }
  const npcs = (room, k) => Object.entries(s.npcs).filter(([id, c]) => c.room === room && !c.dead && id.slice(2).split(/[.@#]/)[0] === WJ + 'npc/' + k).map(([id]) => id)
  const things = (at, k) => Object.entries(s.things).filter(([, t]) => t.at === at && t.id === WJ + 'obj/' + k).map(([id]) => id)
  return { s, say, enter, spawn, clock, rest, toNight, npcs, things }
}

test('乌鸡国 in the map: 平顶山 to 宝林寺 and the city; the well behind the 芭蕉; numbers set to this game', () => {
  assert.equal(ROOMS['x/qujing/pingding/shan4'].exits['西南'], WJ + 'shandao1')
  assert.equal(ROOMS[WJ + 'road5'].exits['北'], WJ + 'temple')
  assert.equal(ROOMS[WJ + 'yuhua'].exits['下'], WJ + 'well')
  for (const k of ['weishi', 'prince', 'kingfake', 'kingreal', 'longwang']) assert.ok(NPCS[WJ + 'npc/' + k].max.kee <= 300, k)
  const { s, say, enter } = world()
  enter('user:a', '阿青', 'P', WJ + 'kezhan')
  assert.match(say('user:a', '去 宝林寺'), /一路/)
  assert.equal(s.players['user:a'].room, WJ + 'temple')
})

test('乌鸡国 whole: temple, ghost, queen, prince, 芭蕉, 龙王, the king raised and led home; done for the team', () => {
  const { s, say, enter, clock, rest, toNight, npcs, things } = world(5)
  enter('user:a', '阿青', 'X', WJ + 'temple').xyj.exp = 5200 // the fights' odds are the last test's
  enter('user:b', '小白', 'W', WJ + 'temple')
  for (const id of ['user:a', 'user:b']) s.players[id].team = 'T'
  const both = (room) => { for (const id of ['user:a', 'user:b']) s.players[id].room = room; rest('user:a', 'user:b') }
  const a = () => s.players['user:a']
  // 宝林寺: the 守寺僧 keep the door.
  assert.match(say('user:a', '进去'), /寺院恕不接客，请回/)
  for (let i = 0; i < 8 && npcs(WJ + 'temple', 'monk2').length; i++) { rest('user:a', 'user:b'); say('user:b', '看'); say('user:a', '杀 守寺僧') }
  assert.equal(npcs(WJ + 'temple', 'monk2').length, 0)
  say('user:a', '进去', '北', '西')
  assert.equal(a().room, WJ + 'westroom')
  // The ghost: a troubled sleep at night; ask him of 报仇.
  const jade = () => {
    both(WJ + 'westroom')
    toNight()
    let r = ''
    for (let i = 0; i < 40 && !/忐忑不安/.test(r); i++) { clock.now += 91_000; toNight(); r = say('user:a', '睡觉') }
    assert.match(r, /忐忑不安/)
    clock.now += 7000
    assert.match(say('user:a', '看'), /水淋淋的人影/)
    const g = say('user:a', '问 国王 关于 报仇')
    assert.match(g, /师父我留下一件表记与你吧/)
    assert.equal(things('user:a', 'jade').length, 1)
    assert.match(say('user:a', '问 国王 关于 报仇'), /国王/) // one at a time
    clock.now += 900_000
  }
  jade()
  // Into the palace grounds: the 卫士 fall on whoever comes; none passes while one stands.
  both(WJ + 'zym')
  assert.match(say('user:a', '北'), /严禁闯入/)
  say('user:b', '看') // the two from the gate, and a fight
  for (const [room, dir] of [['wall3', '西'], ['wall2', '西'], ['wall', '北']]) {
    both(WJ + room)
    say('user:b', '看')
    for (let i = 0; i < 10 && npcs(WJ + room, 'weishi').length; i++) {
      rest('user:a', 'user:b')
      assert.match(say('user:a', dir), /禁行/)
      say('user:a', '杀 护宫卫士')
    }
    assert.equal(npcs(WJ + room, 'weishi').length, 0, room)
  }
  rest('user:a', 'user:b')
  say('user:a', '北', '东')
  say('user:b', '北', '东')
  assert.equal(a().room, WJ + 'jxt')
  // The queen knows the 玉圭, and gives it back.
  say('user:b', '看')
  assert.match(say('user:a', '给 王后 金厢白玉圭'), /一怔/)
  assert.match(say('user:a', '看'), /还是去见太子罢/)
  assert.equal(things('user:a', 'jade').length, 1)
  assert.equal(s.players['user:b'].xyj.qj.wuji_queen, 1)
  // The prince: the first one shown him, he takes for a thief's; the 玉圭 is lost.
  both(WJ + 'hilltop')
  say('user:b', '看')
  say('user:a', '给 太子 金厢白玉圭')
  assert.match(say('user:a', '看'), /贼人！吾家珍国宝何时落入你手中/)
  assert.equal(things('user:a', 'jade').length, 0)
  // Again, till he knows it (half the time); his treasure for it.
  for (let i = 0; i < 6 && !things('user:a', 'jing').length; i++) {
    jade()
    both(WJ + 'hilltop')
    const prince = npcs(WJ + 'hilltop', 'prince')[0]
    if (!prince) { clock.now += 30 * 60_000; say('user:a', '看'); continue } // beaten to death: back with the reset
    delete s.npcs[prince].hate
    delete s.npcs[prince].out
    say('user:b', '看')
    say('user:a', '给 太子 金厢白玉圭', '看', '看')
  }
  assert.equal(things('user:a', 'jing').length, 1)
  // The 芭蕉 in the 御花园, felled with an axe; the well; the 水晶宫, where those who stay call up the 龙王.
  both(WJ + 'yuhua')
  assert.match(say('user:a', '下'), /芭蕉树关着/)
  assert.match(say('user:a', '砍 芭蕉'), /先去找把斧头吧/)
  s.things['t:axe'] = { id: 'x/obj/weapon/axe/tiefu', at: 'user:a' }
  let r = ''
  for (let i = 0; i < 40 && !/芭蕉树倒了/.test(r); i++) { rest('user:a'); r = say('user:a', '砍 芭蕉') }
  assert.match(r, /地下露出一口井/)
  say('user:a', '下', '下')
  say('user:b', '下', '下')
  assert.equal(a().room, WJ + 'shuijing')
  for (let i = 0; i < 25 && !npcs(WJ + 'shuijing', 'longwang').length; i++) say('user:a', '看')
  assert.ok(npcs(WJ + 'shuijing', 'longwang').length)
  assert.match(say('user:a', '问 井龙王 关于 国王'), /可怜可怜也/)
  assert.match(say('user:a', '施用 国王遗体'), /乌鸡精度下重楼/)
  say('user:a', '看')
  assert.match(say('user:a', '看'), /昨夜鬼魂拜谒/)
  const king = npcs(WJ + 'shuijing', 'kingreal')[0]
  assert.equal(s.npcs[king].follow, 'user:a')
  assert.equal(s.players['user:b'].xyj.qj.wuji, 'saved')
  // Home to the hall: the false king falls on him, and is beaten.
  for (const d of ['上', '上', '出去', '南']) { say('user:a', d); say('user:b', d) }
  assert.equal(s.npcs[king].room, WJ + 'huilang')
  rest('user:a', 'user:b')
  say('user:b', '南')
  const fight = say('user:a', '南')
  assert.match(fight, /妖怪魔头，竟敢欺世盗名变做朕的模样/)
  for (let i = 0; i < 6 && !s.npcs[`n:${WJ}npc/kingfake`].dead; i++) { rest('user:a', 'user:b'); say('user:b', '看'); say('user:a', '杀 国王') }
  assert.ok(s.npcs[`n:${WJ}npc/kingfake`].dead)
  assert.ok(!s.npcs[king].dead)
  clock.now += 9000
  assert.match(say('user:a', '看'), /乌鸡国救我回生，大灭妖道还我乾坤/)
  for (const id of ['user:a', 'user:b']) assert.equal(s.players[id].xyj.obstacle.wuji, 'done', id)
  assert.ok(a().xyj.exp >= 5200 + 4000)
})

test('the ghost: only at night, to the tried, a fifth of the time; he fades, and flies from a blow', () => {
  const { s, say, enter, clock, toNight, npcs } = world(3)
  enter('user:a', '阿青', 'P', WJ + 'westroom')
  while (gameTime(clock.now).hour >= 18 || gameTime(clock.now).hour < 6 || gameTime(clock.now).hour > 15) clock.now += 60_000
  for (let i = 0; i < 12; i++) { clock.now += 91_000; if (gameTime(clock.now).hour >= 16) break; assert.doesNotMatch(say('user:a', '睡觉'), /忐忑/) }
  s.players['user:a'].xyj.exp = 100
  toNight()
  for (let i = 0; i < 12; i++) { clock.now += 91_000; toNight(); assert.doesNotMatch(say('user:a', '睡觉'), /忐忑/) }
  s.players['user:a'].xyj.exp = 5000
  let tries = 0
  for (; tries < 40 && !/忐忑/.test(say('user:a', '睡觉')); tries++) { clock.now += 91_000; toNight() }
  assert.ok(tries < 40)
  clock.now += 8000
  say('user:a', '看')
  assert.equal(npcs(WJ + 'westroom', 'king').length, 1)
  assert.match(say('user:a', '杀 国王'), /化为一缭青烟飞去/)
  assert.equal(npcs(WJ + 'westroom', 'king').length, 0)
  // Left alone he talks, and in time is gone.
  for (tries = 0; tries < 40 && !/忐忑/.test(say('user:a', '睡觉')); tries++) { clock.now += 91_000; toNight() }
  let log = ''
  for (let i = 0; i < 80 && npcs(WJ + 'westroom', 'king').length + (i < 3 ? 1 : 0); i++) { clock.now += 3000; log += say('user:a', '看') }
  assert.match(log, /乌鸡国王/)
  assert.match(log, /乌鸡国王已经不见了/)
})

test('the 玉圭 is its owner\'s: in another\'s hands it is smoke; it cannot be dropped', () => {
  const { s, say, enter, things } = world(4)
  enter('user:a', '阿青', 'P', WJ + 'square')
  enter('user:b', '小白', 'W', WJ + 'square')
  s.things['t:j'] = { id: WJ + 'obj/jade', at: 'user:a', owner: 'user:a' }
  assert.match(say('user:a', '丢下 金厢白玉圭'), /谁敢乱扔金厢白玉圭/)
  say('user:a', '给 小白 金厢白玉圭')
  assert.equal(things('user:b', 'jade').length, 1)
  say('user:b', '看')
  assert.match(say('user:b', '看'), /青光一闪，化成一道烟去了/)
  assert.equal(things('user:b', 'jade').length, 0)
})

test('the 乌鸡精 drunk or put on oneself knocks one out; on anything else, it is wasted', () => {
  const { s, say, enter, clock, things } = world(6)
  enter('user:a', '阿青', 'P', WJ + 'kezhan')
  s.things['t:a'] = { id: WJ + 'obj/jing', at: 'user:a', owner: 'user:a' }
  assert.match(say('user:a', '喝 乌鸡精'), /七窍生烟/)
  assert.ok(s.players['user:a'].out > clock.now)
  delete s.players['user:a'].out
  s.things['t:b'] = { id: WJ + 'obj/jing', at: 'user:a', owner: 'user:a' }
  assert.match(say('user:a', '施用 店小二'), /晃动了一下/)
  assert.equal(things('user:a', 'jing').length, 0)
  assert.match(say('user:a', '施用 店小二'), /什么/)
})

test('the 卫士 at the gate: two come out the first time one tries north, not again', () => {
  const { say, enter, npcs, s } = world(8)
  enter('user:a', '阿青', 'X', WJ + 'nstreet2')
  say('user:a', '北')
  assert.match(say('user:a', '北'), /从里面冲出护宫卫兵/)
  say('user:a', '看')
  const out = Object.keys(s.npcs).filter((id) => id.includes('weishi.zym'))
  assert.equal(out.length, 2)
  void npcs
  assert.doesNotMatch(say('user:a', '北'), /冲出/)
  assert.equal(Object.keys(s.npcs).filter((id) => id.includes('weishi.zym')).length, 2)
})

test('the inn: upstairs for those who paid the 小二; 山姬 follows one on the 山路 and is a 山鸡 when beaten', () => {
  const { s, say, enter, rest } = world(9)
  enter('user:a', '阿青', 'X', WJ + 'kezhan')
  assert.match(say('user:a', '上'), /客房不便打扰/)
  s.things['t:s'] = { id: 'stock/silver', at: 'user:a', n: 5 }
  assert.match(say('user:a', '给 店小二 3 两银子'), /客官请上楼歇息/)
  say('user:a', '上')
  assert.equal(s.players['user:a'].room, WJ + 'up')
  s.players['user:a'].room = WJ + 'road2'
  say('user:a', '东')
  const ji = `n:${WJ}npc/shanji`
  assert.equal(s.npcs[ji].follow, 'user:a')
  say('user:a', '西')
  assert.equal(s.npcs[ji].room, WJ + 'road2')
  let r = ''
  for (let i = 0; i < 6 && s.npcs[ji]; i++) { rest('user:a'); r += say('user:a', '杀 山姬') }
  assert.match(r, /竟是一只母山鸡/)
  assert.ok(Object.keys(s.npcs).some((id) => id.startsWith(`n:${WJ}npc/ji.`)))
})

/** Wins of a team in a room of 乌鸡国, `runs` times from a fresh world: `setup` makes the fight, `won` reads it. */
function rate(team, setup, won, runs = 16) {
  let wins = 0
  for (let r = 0; r < runs; r++) {
    const w = world(1000 + r * 7919)
    const ids = team.split('+').map((a, i) => {
      const id = 'user:' + i
      w.enter(id, a + i, a)
      if (team.includes('+')) w.s.players[id].team = 'T'
      return id
    })
    setup(w, ids)
    if (won(w, ids)) wins++
  }
  return wins / runs
}
/** The three 卫士 of the outer wall, come in on from the gate: they fall on the team; whoever is up goes at them. */
const wall3 = (w, ids) => {
  for (const id of ids) w.s.players[id].room = WJ + 'zym'
  for (const id of ids.slice(1)) w.say(id, '看')
  for (const id of ids.slice(1)) w.say(id, '西')
  w.say(ids[0], '西')
  for (let i = 0; i < 4 && w.npcs(WJ + 'wall3', 'weishi').length; i++) {
    const up = ids.filter((id) => !w.s.players[id].ghost && !(w.s.players[id].out > w.clock.now) && w.s.players[id].room === WJ + 'wall3')
    if (!up.length) break
    w.say(up.at(-1), '杀 护宫卫士')
  }
}
const wall3Won = (w, ids) => !w.npcs(WJ + 'wall3', 'weishi').length && ids.some((id) => !w.s.players[id].ghost)
/** The hall: the team comes in with the true king, whom the false one falls on. */
const hall = (withKing) => (w, ids) => {
  for (const id of ids) w.s.players[id].room = WJ + 'huilang'
  if (withKing) {
    const k = w.spawn(WJ + 'npc/kingreal', WJ + 'huilang')
    Object.assign(w.s.npcs[k], { follow: ids[0], guarding: ids[0], saver: ids[0] })
  }
  for (const id of ids.slice(1)) w.say(id, '南')
  w.say(ids[0], '南')
  for (let i = 0; i < 3 && !w.s.npcs[`n:${WJ}npc/kingfake`].dead; i++) {
    const up = ids.filter((id) => !w.s.players[id].ghost && !(w.s.players[id].out > w.clock.now))
    if (!up.length) break
    w.say(up[0], '杀 国王')
  }
}
const hallWon = (w) => Boolean(w.s.npcs[`n:${WJ}npc/kingfake`].dead) && !Object.entries(w.s.npcs).some(([id, c]) => id.includes('kingreal') && c.dead)
/** The prince, given a 玉圭 he takes for stolen. */
const prince = (w, ids) => {
  for (const id of ids) w.s.players[id].room = WJ + 'hilltop'
  for (const id of ids.slice(1)) w.say(id, '看')
  w.s.things['t:j'] = { id: WJ + 'obj/jade', at: ids[0], owner: ids[0] }
  w.say(ids[0], '给 太子 金厢白玉圭', '看')
}
const survived = (w, ids) => ids.every((id) => !w.s.players[id].ghost)

const RATES = process.env.RATES
test('the numbers: one past 平顶山 with a teammate gets through the 卫士 and beats the false king, more often than not', () => {
  if (RATES) {
    for (const t of ['P', 'P+W', 'P+P', 'W+W']) console.log('wall3', t, rate(t, wall3, wall3Won))
    for (const t of ['P', 'P+W', 'W+W']) console.log('hall+king', t, rate(t, hall(true), hallWon))
    for (const t of ['P', 'P+W']) console.log('hall alone', t, rate(t, hall(false), hallWon))
    for (const t of ['P', 'P+W']) console.log('prince survived', t, rate(t, prince, survived))
  }
  assert.ok(rate('P+W', wall3, wall3Won) >= 0.5)
  assert.ok(rate('P', wall3, wall3Won) <= 0.5)
  assert.ok(rate('P+W', hall(true), hallWon) >= 0.5)
  assert.ok(rate('P', hall(true), hallWon) <= 0.35)
  assert.ok(rate('P+W', hall(false), hallWon) <= 0.35) // without the true king by them
  assert.ok(rate('P+W', prince, survived) >= 0.5)
})
