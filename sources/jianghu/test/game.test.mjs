import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fresh, join, run, apply, lookText, linesSince, wakes, parse, questText, LOG_MAX } from '../app/game.js'

const A = 'user:a', B = 'user:b'
let n = 0
const opts = () => ({ now: 1_800_000_000_000 + ++n * 1000, rand: () => 0.5 })
function world() {
  const s = fresh()
  apply(s, join(s, A, { name: '阿青', ...opts() }))
  apply(s, join(s, B, { name: 'Claude', agent: true, ...opts() }))
  return s
}
const act = (s, me, line) => { const r = run(s, me, line, opts()); apply(s, r.ops); return r }

test('parse: verbs, glued Chinese, directions, 把', () => {
  assert.deepEqual(parse('拿酒葫芦'), { verb: 'take', rest: '酒葫芦' })
  assert.deepEqual(parse('东'), { verb: 'go', rest: 'east' })
  assert.deepEqual(parse('往东'), { verb: 'go', rest: '东' })
  assert.deepEqual(parse('把酒葫芦给李先生'), { verb: 'give', rest: '李先生 酒葫芦' })
  assert.deepEqual(parse('look'), { verb: 'look', rest: '' })
  assert.equal(parse('lol').verb, null)
})

test('the errand from the waiter to the storyteller, two players', () => {
  const s = world()
  assert.match(lookText(s, A), /客栈大堂[\s\S]*店小二、掌柜[\s\S]*Claude（agent）/)
  assert.match(act(s, A, '问 店小二 李先生').reply, /顺生堂/)
  assert.equal(s.quest.asked, A)
  assert.match(act(s, B, '西').reply, /【厨房】[\s\S]*酒葫芦/)
  assert.match(act(s, B, '拿 葫芦').reply, /你拿起了酒葫芦/)
  assert.equal(s.items.hulu, B)
  act(s, B, '东')
  assert.match(act(s, B, '给 阿青 酒葫芦').reply, /你把酒葫芦交给了阿青/)
  assert.equal(s.items.hulu, A)
  for (const d of ['东', '东', '东', '东', '南']) act(s, A, d)
  assert.equal(s.players[A].room, 'herb_shop')
  assert.match(act(s, A, '给 掌柜 酒葫芦').reply, /交给李先生|这里没有/)
  const r = act(s, A, '把酒葫芦交给李先生')
  assert.match(r.reply, /三把刀[\s\S]*完成了/)
  assert.equal(s.quest.done, A)
  assert.match(questText(s), /已经办完了：阿青/)
  act(s, A, '重来')
  assert.equal(s.items.hulu, 'inn_kitchen')
})

test('lines: who sees what, and who is woken', () => {
  const s = world()
  const since = Object.keys(s.log).sort().at(-1)
  const said = act(s, A, '对 Claude 说 一起去送酒吧').events[0]
  assert.deepEqual(wakes(s, said), [B])
  assert.match(linesSince(s, B, 'inn_hall', since).map((l) => l.text).join('\n'), /阿青对你说：「一起去送酒吧」/)
  const back = act(s, B, '对 阿青 说 好').events[0]
  assert.deepEqual(wakes(s, back), [], 'an agent never wakes anyone')
  act(s, A, '西')
  const far = act(s, A, '说 你好').events[0]
  assert.deepEqual(wakes(s, far), [], 'not named, not in the room')
  assert.equal(linesSince(s, B, 'inn_hall', far.key.slice(0, -1)).length, 0)
  const named = act(s, A, '说 Claude 快来厨房').events[0]
  assert.deepEqual(wakes(s, named), [B])
  assert.match(linesSince(s, B, 'inn_hall').at(-1).text, /（厨房）阿青说/)
})

test('the log keeps its last LOG_MAX lines', () => {
  const s = world()
  for (let i = 0; i < LOG_MAX + 20; i++) act(s, A, `说 ${i}`)
  assert.equal(Object.keys(s.log).length, LOG_MAX)
})

test('unknown and empty commands answer, never throw', () => {
  const s = world()
  assert.match(act(s, A, '飞').reply, /帮助/)
  assert.match(act(s, A, '北').reply, /没有路/)
  assert.match(act(s, A, '拿 石头').reply, /没有「石头」/)
  assert.match(act(s, A, '').reply, /客栈大堂/)
})
