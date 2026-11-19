import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run, missing, linesSince, lastKey, wakes, parse, VERSION } from '../app/game.js'
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

test('townspeople and wares read by their Chinese names; their English ids still work as words to type', () => {
  const { enter, say } = world()
  enter('user:a', '阿青')
  const look = say('user:a', '看')
  assert.match(look, /店小二/)
  assert.doesNotMatch(look, /\([a-z ]+\)/)
  assert.doesNotMatch(say('user:a', '清单'), /\([a-z ]+\)/)
  assert.match(say('user:a', '看 waiter'), /^店小二，/)
})

test('parse: directions, verbs with Chinese and English words, 把…给…', () => {
  assert.deepEqual(parse('东'), { verb: 'go', rest: '东' })
  assert.deepEqual(parse('northwest'), { verb: 'go', rest: '西北' })
  assert.deepEqual(parse('把 红木梳子 给 瞎眼老太婆'), { verb: 'give', rest: '瞎眼老太婆 红木梳子' })
  assert.deepEqual(parse('list'), { verb: 'list', rest: '' })
  assert.equal(parse('listen').verb, null)
  assert.equal(parse('爬 榕树').verb, null)
})

test('a ghost revives at 长安\'s 城隍庙; a corpse left too long costs 气', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = 'x/city/junying'
  say('user:a', '杀 校尉')
  assert.equal(s.players['user:a'].ghost, true, 'level 65 against a newcomer')
  assert.ok(Object.values(s.things).some((t) => t.id === 'corpse' && t.of === 'user:a'))
  assert.match(say('user:a', '杀 校尉'), /快去找城隍复活/)
  assert.match(say('user:a', '状态'), /你现在是鬼魂/)
  clock.now += 10 * 60_000 // the corpse turns to dust
  s.players['user:a'].room = 'x/city/chenghuang'
  assert.match(say('user:a', '看'), /红色的漩涡/)
  assert.match(say('user:a', '进 漩涡'), /又活过来了/)
  assert.equal(s.players['user:a'].ghost, undefined)
  assert.equal(s.players['user:a'].kee.max, 90)
})

test('sparring only tires; the loser is left with 1 气 and nobody is hurt', () => {
  const { s, enter, say } = world(3)
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  enter('user:c', '小咕')
  s.players['user:a'].room = s.players['user:b'].room = s.players['user:c'].room = 'x/city/center'
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
  s.players['user:a'].room = s.players['user:b'].room = 'x/city/beiyin4'
  for (const id of ['user:a', 'user:b']) s.things[`t:sw-${id}`] = { id: 'x/obj/weapon/sword/changjian', at: id, eq: 'wield' }
  say('user:a', '组队 大壮')
  assert.match(say('user:b', '组队 阿青'), /你决定加入阿青的队伍/)
  // A third asks the leader: the leader takes them in and the team stays one.
  enter('user:c', '小咕')
  s.players['user:c'].room = 'x/city/beiyin4'
  say('user:c', '组队 阿青')
  assert.match(say('user:a', '组队 小咕'), /你决定让小咕加入队伍/)
  assert.deepEqual(['user:a', 'user:b', 'user:c'].map((id) => s.players[id].team), ['user:a', 'user:a', 'user:a'])
  const r = say('user:a', '杀 小流氓')
  assert.match(r, /大壮加入了战团/)
  assert.ok(s.npcs['n:x/city/npc/liumang'].dead)
  const corpse = Object.entries(s.things).find(([, t]) => t.id === 'corpse' && t.of === 'n:x/city/npc/liumang')[0]
  assert.ok(thingsOf(s, corpse).includes('x/obj/cloth/linen'))
  assert.match(say('user:b', '拿 粗布衣 从 尸体'), /从小流氓的尸体中拿出/)
})

test('people see each other: moves, says, and their names said anywhere', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  enter('user:b', '大壮')
  const mark = lastKey(s)
  say('user:a', '说 大壮，一起去大街')
  say('user:a', '西')
  const seen = linesSince(s, 'user:b', 'x/city/kezhan', mark).map((l) => l.text).join('\n')
  assert.match(seen, /阿青说道：大壮，一起去大街/)
  assert.match(seen, /阿青往西边离开/)
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
  const ops = missing({ version: 1, players: { 'user:a': { room: 'x/city/kezhan' } } }, { now: 0, rand: () => 0.5 })
  const s = apply({}, ops)
  assert.equal(s.version, VERSION)
  assert.deepEqual(s.players, {})
})

test('the file stays small: the log keeps its last lines', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  for (let i = 0; i < 120; i++) say('user:a', `说 第${i}句`)
  assert.ok(Object.keys(s.log).length <= 60)
  assert.ok(JSON.stringify(s).length < 240_000, `${JSON.stringify(s).length}`) // a fresh world is ~200 kB: 西游记 4.5 as far as 通天河
})
