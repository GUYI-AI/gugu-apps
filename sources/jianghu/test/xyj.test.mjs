import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, apply, join, run, statBars } from '../app/game.js'
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

test('西游记: 长安, the road west and 五庄观, every exit to a room of it', () => {
  const xyj = Object.entries(ROOMS).filter(([, r]) => r.area === 'xyj')
  assert.equal(xyj.length, 409)
  for (const [id, r] of xyj) for (const to of Object.values(r.exits)) assert.equal(ROOMS[to]?.area, 'xyj', `${id} → ${to}`)
  const s = fresh({ now: 0, rand: () => 0.5 })
  assert.ok(s.npcs['n:x/qujing/wuzhuang/npc/zhangguolao'] && s.npcs['n:x/city/npc/xiaoer'])
  assert.ok(NPCS[WZ + 'npc/zhenyuan'].inquiry['人参果'])
})

test('the 八卦桥: every bridge once leads through; a bridge twice starts it over', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
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
  say('user:a', '西', '北', '拜师 张果老', '学 内功 从 张果老 5', '学 法术 从 张果老 5')
  assert.equal(s.players['user:a'].xyj.family.name, '五庄观')
  assert.ok(s.players['user:a'].skills.force > 0 && s.players['user:a'].skills.spells > 0)
  s.players['user:a'].room = WZ + 'mudanting'
  say('user:a', '开门', '下')
  assert.match(say('user:a', '摸'), /黄铜钥匙/)
  assert.match(say('user:a', '摸'), /什么也没摸着/)
  assert.match(say('user:a', '跳 桥'), /^什么？$/) // jump is the bridges' own
  say('user:a', '拿 钥匙', '上')
  s.players['user:a'].room = WZ + 'xiguadi'
  assert.match(say('user:a', '北'), /杏木门/)
  assert.match(say('user:a', 'open 北'), /你要打开什么/) // xiguadi.c: `open door` only
  assert.match(say('user:a', '开门'), /钥匙断了/)
  assert.match(say('user:a', '开门'), /没有开这道门的钥匙/) // the key first, even with the gate open
  assert.match(say('user:a', '关门'), /什么？/) // an exit, not a door: it is not shut again
  assert.match(say('user:a', '北'), /镇元大仙走了出来/)
  assert.match(say('user:a', '问 镇元大仙 关于 人参果'), /再等等/)
  assert.match(say('user:b', '观礼'), /到外面去/) // accept.c: outdoors
  s.players['user:b'].room = 'x/city/zhuque-s1'
  assert.match(say('user:b', '观礼'), /你接受镇元大仙的公开邀请/)
  clock.now += 6000
  assert.match(say('user:b', '看'), /人参果园/) // inviting, every 4–7 s, takes one who accepted
  assert.match(say('user:a', '观礼'), /你接受/) // in the orchard already: accepted, and nothing more
  clock.now += 6000
  assert.equal(s.players['user:a'].room, WZ + 'renshenguo-yuan')
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
  s.npcs['n:x/city/npc/jieding'].room = s.players['user:a'].room
  const r = say('user:a', '问 疥顶小僧 关于 取经')
  assert.match(r, /1\. 五庄观／人参果/)
  assert.match(r, /24\. 天竺国/)
})

test('the pace: 去 walks a town and a road at once but not the 八卦桥, 睡觉 restores 精神, the rule of the bridges is told', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  s.players['user:a'].temp = { hasPaid: 2 } // the 马盗 of 饮马峪, paid (below)
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
  assert.ok(s.players['user:a'].temp.wzgmaze)
  say('user:a', '跳 桥') // into the pond: the count is gone (inpool.c)
  assert.equal(s.players['user:a'].temp.wzgmaze, undefined)
  s.players['user:a'].room = 'x/city/sleep'
  s.players['user:a'].sen.cur = 3
  assert.match(say('user:a', '睡觉'), /醒来/)
  assert.equal(s.players['user:a'].sen.cur, s.players['user:a'].sen.max)
  assert.match(say('user:a', '睡觉'), /刚睡过/)
})

test('a newcomer starts in 长安, fed and watered; the bars, with their icons', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  assert.equal(s.players['user:a'].room, 'x/city/kezhan')
  for (const k of ['food', 'water']) assert.equal(s.players['user:a'][k].cur, s.players['user:a'][k].max) // logind.c
  assert.deepEqual(statBars(s.players['user:a']).map(([l, , i]) => l + i), ['气血hp', '精神sen', '食food', '水water'])
  s.players['user:a'].xyj.maxForce = 10
  s.players['user:a'].xyj.maxMana = 10
  assert.deepEqual(statBars(s.players['user:a']).map(([l]) => l), ['气血', '精神', '内力', '法力', '食', '水'])
  for (const [, v] of statBars(s.players['user:a'])) assert.ok(Number.isFinite(v.cur) && v.max > 0)
  const a = s.players['user:a'].attrs
  say('user:a', '状态')
  assert.equal(s.players['user:a'].kee.max, 102) // 100, and 内力 10 ÷ 4
  assert.equal(s.players['user:a'].food.max, Math.max(100, 200 + (a.str - 10) * 10)) // damage.c: weight ÷ 200
})

test('who keeps a way in 长安 and on the road: 小二, the 衙役, the 马盗; 进去 into the main hall', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  const a = () => s.players['user:a']
  // kezhan.c / xiaoer.c: the room behind is for who has paid, till they leave it.
  assert.match(say('user:a', '东'), /不是本店的客人/)
  s.things['t:s1'] = { id: 'stock/silver', at: 'user:a', n: 2 }
  assert.match(say('user:a', '给 店小二 2 两银子'), /不愿意收下/)
  s.things['t:s2'] = { id: 'stock/silver', at: 'user:a', n: 1 }
  assert.match(say('user:a', '给 店小二 3 两银子'), /客官请上楼歇息/)
  say('user:a', '东')
  assert.equal(a().room, 'x/city/sleep')
  say('user:a', '西')
  assert.match(say('user:a', '东'), /不是本店的客人/)
  // zhongdu.c: no way into the hall past the 衙役.
  a().room = 'x/city/zhongdu'
  assert.match(say('user:a', '北'), /公堂岂可乱闯/)
  // yinma.c / madao.c: money or your life; worth 200 文 buys two passes.
  a().room = 'x/westway/pingyang'
  assert.match(say('user:a', '西'), /要钱还是要命/)
  assert.match(say('user:a', '西北'), /不给钱我要杀人啦/)
  s.things['t:s3'] = { id: 'stock/silver', at: 'user:a', n: 1 }
  assert.match(say('user:a', '给 马盗 1 两银子'), /就这点东西/)
  assert.equal(s.things['t:s3']?.at === 'user:a', false)
  s.things['t:s4'] = { id: 'stock/silver', at: 'user:a', n: 2 }
  assert.match(say('user:a', '给 马盗 2 两银子'), /闪身让道/)
  say('user:a', '西北')
  assert.equal(a().room, 'x/westway/madao')
  assert.match(say('user:a', '东南'), /一拱手/)
  say('user:a', '西北')
  say('user:a', '东南')
  assert.match(say('user:a', '西北'), /不给钱/) // two passes, then pay again
  // Three warnings, then he attacks.
  a().temp = {}
  a().room = 'x/westway/pingyang'
  say('user:a', '西')
  clock.now += 20_000
  assert.match(say('user:a', '看'), /到底给不给钱/)
  clock.now += 10_000
  assert.match(say('user:a', '看'), /马盗/)
  assert.ok(a().ghost || a().kee.cur < a().kee.max)
  // yunti.c: half the time the way into the cave slides one down to 酒泉.
  const rooms = new Set()
  for (let i = 0; i < 12; i++) { a().room = 'x/westway/yunti'; say('user:a', '进去'); rooms.add(a().room) }
  assert.deepEqual([...rooms].sort(), ['x/westway/jiuquan', 'x/westway/shandong'])
  // guangchang: 进去 (enter) is the way into the main hall.
  enter('user:b', '阿紫')
  s.players['user:b'].room = WZ + 'guangchang'
  say('user:b', 'enter')
  assert.equal(s.players['user:b'].room, WZ + 'zhengdian')
})

test('an English id is the whole of it: `han zhongli` is not 韩湘子 (han) when 汉钟离 is away', () => {
  const { s, enter, say } = world()
  enter('user:a', '阿青')
  s.players['user:a'].room = WZ + 'gate'
  s.npcs['n:x/qujing/wuzhuang/npc/hanxiangzi'].room = WZ + 'gate'
  assert.doesNotMatch(say('user:a', 'apprentice han zhongli'), /韩湘子/)
  assert.doesNotMatch(say('user:a', 'ask han zhongli about 五庄观'), /韩湘子/)
  assert.match(say('user:a', 'ask han about 五庄观'), /韩湘子/)
})

test('变化 (bian.c): gates, a name and ids borrowed, 法力 drained every 5 s till one shows again', () => {
  const { s, enter, say, clock } = world()
  enter('user:a', '阿青')
  const a = () => s.players['user:a']
  const y = () => a().xyj
  a().room = 'x/city/kezhan'
  assert.match(say('user:a', '变 店小二'), /道行还不够/)
  y().exp = 3000
  assert.match(say('user:a', '变 店小二'), /法术不够/)
  a().skills.spells = 50
  assert.match(say('user:a', '变 店小二'), /法力不足/)
  y().mana = 40
  assert.match(say('user:a', '变 店小二'), /摇身一变/)
  assert.equal(y().mana, 30)
  enter('user:b', '阿紫')
  s.players['user:b'].room = 'x/city/kezhan'
  assert.match(say('user:b', '看'), /店小二[\s\S]*店小二/) // two of them now
  clock.now += 60_000
  const r = say('user:b', '看')
  assert.match(r, /现了原形/)
  assert.ok(!a().temp.bian && y().mana <= 7)
  y().mana = 40
  say('user:a', '变 店小二')
  assert.match(say('user:a', '变 我'), /现了真身/)
})
