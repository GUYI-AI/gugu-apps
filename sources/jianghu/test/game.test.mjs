import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run, missing, linesSince, lastKey, wakes, parse, hintFor, hintStep, wayTo, VERSION } from '../app/game.js'
import { ROOMS, NPCS } from '../app/es2.js'
import { gameTime } from '../app/text.js'

/** The first real moment after `from` when the game's clock (60×) reads `hour`:`minute`. */
function at(hour, minute = 0, from = Date.UTC(2026, 10, 8, 3, 0, 0)) {
  let t = from
  while (gameTime(t).hour !== hour || gameTime(t).minute !== minute) t += 1000
  return t
}

// A world where time and chance are fixed: each command 3 s after the last, at noon of the game's day.
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
const thingsOf = (s, at) => Object.values(s.things).filter((t) => t.at === at).map((t) => t.id)

test('the whole of ES2 snow is here: every room reachable, every exit leads to a room', () => {
  assert.equal(Object.keys(ROOMS).length, 43)
  for (const [id, r] of Object.entries(ROOMS)) for (const to of Object.values(r.exits)) assert.ok(ROOMS[to], `${id} → ${to}`)
  const s = fresh({ now: 0, rand: () => 0.5 })
  for (const [id, r] of Object.entries(ROOMS)) for (const k of Object.keys(r.spawn ?? {})) if (NPCS[k]) assert.ok(s.npcs[`n:${k}`], `${k} in ${id}`)
  const spawned = Object.values(ROOMS).flatMap((r) => Object.entries(r.spawn ?? {})).filter(([k]) => NPCS[k]).reduce((n, [, c]) => n + c, 0)
  assert.equal(Object.keys(s.npcs).length, spawned)
})

test('townspeople and wares read by their Chinese names; their English ids still work as words to type', () => {
  const { enter, say } = world()
  enter('user:a', '阿青')
  const look = say('user:a', '看')
  assert.match(look, /店小二/)
  assert.doesNotMatch(look, /\([a-z ]+\)/)
  assert.doesNotMatch(say('user:a', '清单'), /\([a-z ]+\)/)
  assert.match(say('user:a', '看 waiter'), /^店小二，/)
})

test('a newcomer is walked through the first wages and the first meal, and no further', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  assert.equal(wayTo('inn_hall', 'inn_hall'), null)
  assert.match(hintFor(s, 'user:a'), /^身上还没钱：先去货栈帮工头装货挣工钱（往东）$/)
  // At night the inn's door is shut: the hint says to open it first.
  ;(s.rooms.inn_hall ??= {}).doors = { 东: true }
  assert.match(hintFor(s, 'user:a'), /（先「开门」，再往东）$/)
  assert.equal(hintStep(s, 'user:a'), '开门')
  say('user:a', hintStep(s, 'user:a'))
  assert.match(hintFor(s, 'user:a'), /（往东）$/)
  // Following the hint step by step reaches the warehouse.
  // Tapping the hint, again and again, earns the first wages.
  for (let i = 0; i < 12 && hintStep(s, 'user:a'); i++) say('user:a', hintStep(s, 'user:a'))
  assert.equal(s.players['user:a'].room, 'store')
  assert.equal(hintFor(s, 'user:a'), null, 'paid and fed: on their own now')
  s.players['user:a'].food.cur = 10
  assert.match(hintFor(s, 'user:a'), /有钱了：回客栈买点吃的（往.+）/)
  enter('user:c', '小咕', true)
  assert.equal(hintFor(s, 'user:c'), null, 'agents read the help, not hints')
})

test('parse: directions, verbs with Chinese and English words, 把…给…', () => {
  assert.deepEqual(parse('东'), { verb: 'go', rest: '东' })
  assert.deepEqual(parse('northwest'), { verb: 'go', rest: '西北' })
  assert.deepEqual(parse('把 红木梳子 给 瞎眼老太婆'), { verb: 'give', rest: '瞎眼老太婆 红木梳子' })
  assert.deepEqual(parse('list'), { verb: 'list', rest: '' })
  assert.equal(parse('listen').verb, null)
  assert.equal(parse('爬 榕树').verb, 'climb')
})

test('a thief is made: work at the warehouse, feed 阿宝, return the comb, call her 祖奶奶', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  assert.match(say('user:a', '东', '南', '东', '南', '西'), /这里有：一辆运货驴车、三个大木箱。/)
  assert.match(say('user:a', '拿 大木箱'), /扛了起来/)
  assert.match(say('user:a', '装车 木箱'), /装上运货驴车/)
  assert.match(say('user:a', '说 工钱'), /总共是二十五文钱/)
  say('user:a', '东', '北', '西', '北', '西')
  assert.match(say('user:a', 'buy dumpling'), /买下一个牛肉包子/)
  say('user:a', '东', '东')
  assert.match(say('user:a', '爬 榕树'), /肚子好饿/)
  const fed = say('user:a', '给 阿宝 包子')
  assert.match(fed, /阿宝吃下一个牛肉包子[\s\S]*红木梳子交给你/)
  say('user:a', '下')
  s.npcs['n:gammer'].room = 'square' // she wanders: meet her at the vat
  assert.match(say('user:a', '给 瞎眼老太婆 梳子'), /叫声「祖奶奶」/)
  const made = say('user:a', '说 祖奶奶')
  assert.match(made, /你正式成为一名盗贼了/)
  assert.equal(s.players['user:a'].cls, 'thief')
  assert.ok(s.players['user:a'].skills.stealing > 0)
  assert.ok(thingsOf(s, 'user:a').includes('coin'), 'the old coin, a thief\'s token')
})

test('the hairpin and the 英雄帖: found at noon, the woman in white trades the card for it', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'ruin1'
  assert.match(say('user:a', '搜 杂草'), /发现了一支发簪/)
  assert.match(say('user:a', '搜 杂草'), /什么也没有找到/, 'once a reset')
  const meet = say('user:a', '爬 梁柱')
  assert.match(meet, /白衣女子说道：你是谁？滚！/)
  const given = say('user:a', '给 白衣女子 发簪')
  assert.match(given, /这是我的发簪！[\s\S]*你想要什么？说吧/)
  assert.match(say('user:a', '说 英雄帖'), /拿了快滚吧[\s\S]*丢下一张英雄帖/)
  assert.match(say('user:a', '拿 英雄帖'), /捡起一张英雄帖/)
  s.players['user:a'].room = 'ebridge'
  assert.match(say('user:a', '东'), /只有持英雄帖的贵客才能入内/)
  assert.match(say('user:a', '给 青衣汉子 英雄帖'), /小人失敬！[\s\S]*不在 ES2 公开的源码里/)
})

test('the woman in white kills an intruder who stays', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'ruin1'
  say('user:a', '爬 梁柱')
  const r = say('user:a', '看', '看')
  assert.match(r, /你真是不要命了/)
  assert.equal(s.players['user:a'].ghost, true, 'level 55 against level 1')
  assert.ok(Object.values(s.things).some((t) => t.id === 'corpse' && t.of === 'user:a'))
})

test('a ghost revives at 土地公庙; a corpse left too long costs 气', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'court'
  say('user:a', '杀 黑衣老人')
  assert.equal(s.players['user:a'].ghost, true)
  assert.match(say('user:a', '杀 黑衣老人'), /快去找城隍复活/)
  clock.now += 10 * 60_000 // the corpse turns to dust
  s.players['user:a'].room = 'small_temple'
  assert.match(say('user:a', '看'), /红色的漩涡/)
  assert.match(say('user:a', '进 漩涡'), /又活过来了/)
  assert.equal(s.players['user:a'].ghost, undefined)
  assert.equal(s.players['user:a'].kee.max, 27)
})

test('sparring only tires; the loser is left with 1 气 and nobody is hurt', () => {
  const { s, enter, say } = world(3)
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  enter('user:c', '小咕')
  s.players['user:a'].room = s.players['user:b'].room = s.players['user:c'].room = 'square_e'
  // All three in one team: the third keeps out of a spar between the other two.
  say('user:a', '组队 大壮'); say('user:b', '组队 阿青'); say('user:c', '组队 阿青'); say('user:a', '组队 小咕')
  assert.match(say('user:a', '比武 大壮'), /必须等对方同意/)
  const r = say('user:b', '比武 阿青')
  assert.match(r, /领教这位朋友的高招[\s\S]*输掉了这场比试/)
  assert.doesNotMatch(r, /小咕/)
  for (const id of ['user:a', 'user:b']) {
    assert.equal(s.players[id].ghost, undefined)
    assert.equal(s.players[id].kee.eff, s.players[id].kee.max, 'no wounds in a spar')
  }
})

test('teammates fight together; the dead NPC leaves a corpse with its things', () => {
  const { s, enter, say } = world(5)
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  s.players['user:a'].room = s.players['user:b'].room = 'nstreet2'
  // Two wooden swords from the fireplace, wielded.
  for (const id of ['user:a', 'user:b']) s.things[`t:sw-${id}`] = { id: 'woodsword', at: id, eq: 'wield' }
  say('user:a', '组队 大壮')
  assert.match(say('user:b', '组队 阿青'), /你决定加入阿青的队伍/)
  // A third asks the leader: the leader takes them in and the team stays one.
  enter('user:c', '小咕')
  s.players['user:c'].room = 'nstreet2'
  say('user:c', '组队 阿青')
  assert.match(say('user:a', '组队 小咕'), /你决定让小咕加入队伍/)
  assert.deepEqual(['user:a', 'user:b', 'user:c'].map((id) => s.players[id].team), ['user:a', 'user:a', 'user:a'])
  const r = say('user:a', '杀 路人')
  assert.match(r, /大壮加入了战团/)
  assert.ok(s.npcs['n:man'].dead)
  const corpse = Object.entries(s.things).find(([, t]) => t.id === 'corpse' && t.of === 'n:man')[0]
  assert.ok(thingsOf(s, corpse).includes('stock/shortsword'))
  assert.match(say('user:b', '拿 短剑 从 尸体'), /从路人的尸体中拿出/)
})

test('school: sitting through 三字经 teaches 读书识字', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'school'
  assert.match(say('user:a', '坐'), /跟着王老师念书/)
  let text = ''
  for (let i = 0; i < 40; i++) { clock.now += 30_000; text += say('user:a', '看') }
  assert.match(text, /大家跟着我念/)
  assert.ok(s.players['user:a'].learned.literate > 0 || s.players['user:a'].skills.literate > 0)
})

test('陈维侠 takes an apprentice on the second asking', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'school'
  assert.match(say('user:a', '拜师 陈维侠'), /老夫门徒不下千人[\s\S]*似乎没有收你为徒的打算/)
  assert.match(say('user:a', '拜师 陈维侠'), /磕了四个响头[\s\S]*烧火采药十年/)
  assert.equal(s.players['user:a'].cls, 'alchemist')
  assert.equal(s.players['user:a'].title, '龙图丹派弟子')
})

test('the inn closes at 二更 and puts guests out; the north road is barred below level 10', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  clock.now = at(21, 59, clock.now)
  const r = say('user:a', '看')
  assert.match(r, /打烊吧/)
  assert.equal(s.players['user:a'].room, 'square_w')
  assert.match(say('user:a', '西'), /先把客栈大门打开/)
  s.players['user:a'].room = 'ngate'
  assert.match(say('user:a', '北'), /拦了下来[\s\S]*野羊山最近有盗匪出没/)
})

test('鱼天 gives a newcomer the hand-drawn map for a coin', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'store'
  say('user:a', '拿 大木箱', '装车 大木箱', '说 工钱', '东', '东')
  const r = say('user:a', '给 鱼天 1 文钱')
  assert.match(r, /这玩意儿就送给你啦/)
  assert.match(say('user:a', '看 雪亭小镇见闻'), /野羊山/)
})

test('people see each other: moves, says, and their names said anywhere', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  const mark = lastKey(s)
  say('user:a', '说 大壮，一起去广场')
  say('user:a', '东')
  const seen = linesSince(s, 'user:b', 'inn_hall', mark).map((l) => l.text).join('\n')
  assert.match(seen, /阿青说道：大壮，一起去广场/)
  assert.match(seen, /阿青往东边离开/)
})

test('waking: only people wake agents, by speaking to, naming, giving to or attacking them', () => {
  const { s, enter, play } = world()
  enter('user:a', '阿青')
  enter('user:bot', 'Claude', true)
  const r = play('user:a', '对 Claude 说 跟我来')
  assert.deepEqual(r.events.flatMap((ev) => wakes(s, ev)), ['user:bot'])
  const back = play('user:bot', '对 阿青 说 好')
  assert.deepEqual(back.events.flatMap((ev) => wakes(s, ev)), [])
})

test('an old world (v1) starts over as this version', () => {
  const ops = missing({ version: 1, players: { 'user:a': { room: 'inn_hall' } } }, { now: 0, rand: () => 0.5 })
  const s = apply({}, ops)
  assert.equal(s.version, VERSION)
  assert.deepEqual(s.players, {})
})

test('the file stays small: the log keeps its last lines', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  for (let i = 0; i < 120; i++) say('user:a', `说 第${i}句`)
  assert.ok(Object.keys(s.log).length <= 60)
  assert.ok(JSON.stringify(s).length < 120_000, `${JSON.stringify(s).length}`)
})
