import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leakedPiece, newRound, pendingQuestions, giveUpNeeded, seenByPlayers, checkQuestion } from '../app/game.js'

const bottom = '男人曾在海难中被同伴骗说吃的是海龟汤，其实是同伴的肉。今天尝到真正的海龟汤，明白了真相。'

test('a reply quoting the bottom is caught, one that does not is let through', () => {
  assert.equal(leakedPiece('其实是同伴的肉', bottom, ['男人在餐厅喝了海龟汤后自杀了']), '其实是同伴')
  assert.equal(leakedPiece('想想他以前的经历', bottom, []), null)
})

test('what the players already have may be repeated', () => {
  const seen = ['男人在餐厅喝了一碗海龟汤，然后自杀了。', '他以前吃过海龟汤吗？']
  assert.equal(leakedPiece('对，海龟汤很关键', bottom, seen), null)
  // punctuation and spacing do not hide a quote
  assert.equal(leakedPiece('是 同 伴，的 肉', bottom, seen), '是同伴的肉')
})

test('pending is what has no judgement, oldest first', () => {
  const round = newRound({ puzzle: { id: 'p', title: 't', surface: 's', keyPoints: ['a'] }, host: 'user:h', at: 1 })
  round.questions = { b: { by: 'user:1', kind: 'ask', text: 'q2', at: 2 }, a: { by: 'user:2', kind: 'ask', text: 'q1', at: 1 }, c: { by: 'user:1', kind: 'ask', text: 'q3', at: 3, judged: true, verdict: 'no' } }
  assert.deepEqual(pendingQuestions(round).map((q) => q.id), ['a', 'b'])
  assert.equal(giveUpNeeded(round), 2)
  assert.ok(seenByPlayers(round).includes('q1'))
})

test('alone, one give-up vote is enough', () => {
  const round = newRound({ puzzle: { id: 'p', title: 't', surface: 's', keyCount: 1 }, host: 'user:h', at: 1 })
  round.giveUp = { 'user:1': 1 }
  assert.equal(giveUpNeeded(round), 1)
})

test('a question must be one line of reasonable length', () => {
  assert.throws(() => checkQuestion('  '))
  assert.throws(() => checkQuestion('啊'.repeat(121)))
  assert.equal(checkQuestion(' 他是自杀吗？ '), '他是自杀吗？')
})
