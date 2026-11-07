import test from 'node:test'
import assert from 'node:assert/strict'
import { fiveInRow, turn } from '../app/gomoku.js'
import { hits, outside, same } from '../app/snake.js'

const row = (cells, c = 'b') => Object.fromEntries(cells.map((xy) => [xy.join(), c]))

test('gomoku: five in every direction wins, four does not', () => {
  assert.equal(fiveInRow(row([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]), 2, 0), true)
  assert.equal(fiveInRow(row([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]), 0, 4), true)
  assert.equal(fiveInRow(row([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]), 0, 0), true)
  assert.equal(fiveInRow(row([[4, 0], [3, 1], [2, 2], [1, 3], [0, 4]]), 2, 2), true)
  assert.equal(fiveInRow(row([[0, 0], [1, 0], [2, 0], [3, 0]]), 3, 0), false)
  assert.equal(fiveInRow({ ...row([[0, 0], [1, 0], [3, 0], [4, 0]]), '2,0': 'w' }, 4, 0), false)
})

test('gomoku: black moves first, then turns alternate', () => {
  assert.equal(turn({}), 'b')
  assert.equal(turn(row([[7, 7]])), 'w')
  assert.equal(turn({ '7,7': 'b', '7,8': 'w' }), 'b')
})

test('snake: walls and bodies', () => {
  assert.equal(outside([-1, 0]), true)
  assert.equal(outside([30, 5]), true)
  assert.equal(outside([29, 21]), false)
  assert.equal(hits([2, 3], [[1, 3], [2, 3]]), true)
  assert.equal(hits([2, 3], [[2, 4]]), false)
  assert.equal(same([1, 2], [1, 2]), true)
})

test('tanks: shells fly straight, stop at walls and run out', async () => {
  const { flight, inWall } = await import('../app/tanks.js')
  assert.equal(inWall(-1, 10), true)
  assert.equal(inWall(110, 100), true)
  assert.equal(inWall(240, 100), false)
  assert.deepEqual(flight({ x: 20, y: 20, vx: 100, vy: 0 }, 0.5), { x: 70, y: 20 })
  assert.equal(flight({ x: 20, y: 100, vx: 200, vy: 0 }, 0.5), null) // the wall at x 100
  assert.equal(flight({ x: 240, y: 300, vx: 0, vy: 0 }, 2), null)
})

test('bomber: a blast stops at pillars and on the first brick', async () => {
  const { blast, bricks, pillar } = await import('../app/bomber.js')
  assert.equal(pillar(2, 2), true)
  assert.equal(pillar(0, 5), true)
  assert.equal(pillar(1, 2), false)
  const cells = blast(1, 1, { '2,1': 1 }).map((c) => c.join()).sort()
  assert.deepEqual(cells, ['1,1', '1,2', '1,3', '2,1'])
  const field = bricks(() => 0)
  assert.equal(field['1,1'] ?? field['2,1'] ?? field['1,2'], undefined) // corners stay clear to start from
  assert.equal(Object.keys(field).every((k) => !pillar(...k.split(',').map(Number))), true)
})
