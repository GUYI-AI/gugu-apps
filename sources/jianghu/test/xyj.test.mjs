import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run, statBars, hintFor } from '../app/game.js'
import { ROOMS, NPCS } from '../app/world.js'

function world(seed = 7) {
  let n = seed
  const rand = () => { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646 }
  const clock = { now: Date.UTC(2026, 10, 8, 3, 0, 0) }
  const s = fresh({ now: clock.now, rand })
  const o = () => ({ now: (clock.now += 3000), rand })
  const enter = (id, name, agent = false) => apply(s, join(s, id, { name, agent, ...o() }))
  const say = (id, ...lines) => lines.map((l) => { const r = run(s, id, l, o()); apply(s, r.ops); return r.reply }).at(-1)
  return { s, enter, say, clock }
}
const WZ = 'x/qujing/wuzhuang/'

test('西游记: 长安, the road west and 五庄观 are one place apart from 雪亭镇, every exit to a room of it', () => {
  const xyj = Object.entries(ROOMS).filter(([, r]) => r.area === 'xyj')
  assert.equal(xyj.length, 141)
  for (const [id, r] of xyj) for (const to of Object.values(r.exits)) assert.equal(ROOMS[to]?.area, 'xyj', `${id} → ${to}`)
  const s = fresh({ now: 0, rand: () => 0.5 })
  assert.ok(s.npcs['n:x/qujing/wuzhuang/npc/zhangguolao'] && s.npcs['n:x/city/npc/xiaoer'])
  assert.ok(NPCS[WZ + 'npc/zhenyuan'].inquiry['人参果'])
})

test('西游 and 东归 swap bodies; 雪亭镇 keeps its own', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  const kee = s.players['user:a'].kee.max
  assert.match(say('user:a', '西游'), /长安/)
  assert.equal(s.players['user:a'].room, 'x/city/kezhan')
  assert.match(say('user:a', '状态'), /气血：100\/100.*内力：0\/0/s)
  say('user:a', '东归')
  assert.equal(s.players['user:a'].room, 'inn_hall')
  assert.equal(s.players['user:a'].kee.max, kee)
})

test('the 八卦桥: every bridge once leads through; a bridge twice starts it over', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  say('user:a', '西游')
  s.players['user:a'].room = WZ + 'southpool'
  say('user:a', '北', '东北', '西南') // 1 → 2 → 1 again: the count starts over from this bridge
  assert.deepEqual(s.players['user:a'].temp.wzgmaze, { 1: 1 })
  s.players['user:a'].room = WZ + 'southpool'
  s.players['user:a'].temp = {}
  const r = say('user:a', '北', '东北', '东北', '西北', '西北', '西南', '西南', '东南')
  assert.equal(s.players['user:a'].room, WZ + 'northpool')
  assert.match(r, /荷塘边/)
})

test('人参果: the key under 牡丹亭 opens the orchard, the meeting gives fruit after a minute, eating it marks the obstacle', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  enter('user:b', '小灵', true)
  say('user:a', '西游', '西', '北', '拜师 张果老', '学 内功 从 张果老 5', '学 法术 从 张果老 5')
  assert.equal(s.players['user:a'].xyj.family.name, '五庄观')
  assert.ok(s.players['user:a'].skills.force > 0 && s.players['user:a'].skills.spells > 0)
  s.players['user:a'].room = WZ + 'mudanting'
  say('user:a', '开门', '下')
  assert.match(say('user:a', '摸'), /黄铜钥匙/)
  assert.match(say('user:a', '摸'), /什么也没摸着/)
  say('user:a', '拿 钥匙', '上')
  s.players['user:a'].room = WZ + 'xiguadi'
  assert.match(say('user:a', '北'), /杏木门/)
  assert.match(say('user:a', '开门'), /钥匙断了/)
  assert.match(say('user:a', '北'), /镇元大仙走了出来/)
  assert.match(say('user:a', '问 镇元大仙 关于 人参果'), /再等等/)
  say('user:b', '西游')
  assert.match(say('user:b', '观礼'), /人参果园/)
  clock.now += 60_000
  const r = say('user:a', '问 镇元大仙 关于 人参果')
  assert.match(r, /分发完毕/)
  assert.ok(Object.values(s.things).some((t) => t.id === 'x/obj/drug/renshen-guo' && t.at === 'user:b'))
  s.players['user:a'].skills.force = 4 // 10 × (内功 ÷ 2) above 内力's most: the fruit adds to it
  s.players['user:a'].skills.spells = 4
  say('user:a', '吃 人参果')
  const y = s.players['user:a'].xyj
  assert.equal(y.obstacle.wuzhuang, 'done')
  assert.equal(y.maxForce, 20)
  assert.equal(y.maxMana, 20)
  assert.ok(s.players['user:a'].out > clock.now)
  clock.now += 70_000
  assert.match(say('user:a', '取经'), /已过了一关/)
  assert.match(say('user:a', '回去'), /长安|客栈/) // 镇元大仙 waits for the fruit's eaters to wake
  assert.equal(s.players['user:a'].room, 'x/city/kezhan')
})

test('打坐 and 冥想 need 激发 and a skill; their most grows past twice', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  say('user:a', '西游')
  s.players['user:a'].room = 'x/city/center'
  assert.match(say('user:a', '打坐 30'), /激发/)
  const p = () => s.players['user:a'] // each command writes the player anew
  p().skills.force = 20; p().skills['zhenyuan-force'] = 10
  say('user:a', '激发 内功 镇元神功')
  assert.equal(p().map.force, 'zhenyuan-force')
  say('user:a', '打坐 30')
  assert.ok(p().xyj.maxForce >= 1)
  assert.match(say('user:a', '冥想 30'), /瓶颈|冥想完毕|空白|忙/)
})

test('疥顶小僧 asked of 取经 hands over the guide: the 24 obstacles, 五庄观 first', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  say('user:a', '西游')
  s.npcs['n:x/city/npc/jieding'].room = s.players['user:a'].room
  const r = say('user:a', '问 疥顶小僧 关于 取经')
  assert.match(r, /1\. 五庄观／人参果/)
  assert.match(r, /24\. 天竺国/)
})

test('the pace: 去 walks a town and a road at once but not the 八卦桥, 睡觉 restores 精神, the rule of the bridges is told', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  say('user:a', '西游')
  assert.match(say('user:a', '去 五庄观'), /观门/)
  assert.equal(s.players['user:a'].room, WZ + 'gate')
  assert.match(say('user:a', '去 后院'), /后院|梨花门/)
  s.players['user:a'].room = WZ + 'northpool'
  assert.match(say('user:a', '去 长安'), /八卦桥/)
  assert.equal(s.players['user:a'].room, WZ + 'northpool')
  s.players['user:a'].room = WZ + 'southpool'
  assert.match(say('user:a', '看 木牌'), /走过一遍/)
  say('user:a', '北')
  assert.match(say('user:a', '东北'), /已走过两座/)
  assert.match(say('user:a', '西南'), /重新数起/)
  say('user:a', '去 长安')
  assert.equal(s.players['user:a'].room, WZ + 'wzgmaze1') // no 「去」 off a bridge
  s.players['user:a'].room = 'x/city/sleep'
  s.players['user:a'].sen.cur = 3
  assert.match(say('user:a', '睡觉'), /醒来/)
  assert.equal(s.players['user:a'].sen.cur, s.players['user:a'].sen.max)
  assert.match(say('user:a', '睡觉'), /刚睡过/)
})

test('statBars: 雪亭镇 six, and 西游记 气血/精神 with 内力/法力 once begun; the 下一步 line of each world', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  assert.deepEqual(statBars(s.players['user:a']).map(([l]) => l), ['精', '气', '神', '体', '食', '水'])
  say('user:a', '西游')
  assert.deepEqual(statBars(s.players['user:a']).map(([l]) => l), ['气血', '精神', '食', '水'])
  assert.match(hintFor(s, 'user:a'), /张果老/)
  s.players['user:a'].xyj.maxForce = 10
  s.players['user:a'].xyj.maxMana = 10
  assert.deepEqual(statBars(s.players['user:a']).map(([l]) => l), ['气血', '精神', '内力', '法力', '食', '水'])
  for (const [, v] of statBars(s.players['user:a'])) assert.ok(Number.isFinite(v.cur) && v.max > 0)
})
