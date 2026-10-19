import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { publicOf, newRound, pendingQuestions, giveUpNeeded, hintWaiting, checkQuestion } from '../app/game.js'

const bank = JSON.parse(readFileSync(new URL('../app/bank/puzzles.json', import.meta.url), 'utf8'))
const index = readFileSync(new URL('../app/bank/index.json', import.meta.url), 'utf8')

test('the page index carries no solution, fact or hint of any puzzle', () => {
  for (const p of bank.puzzles) {
    assert.ok(!index.includes(p.solution), `${p.id}: solution in index.json`)
    for (const f of p.facts) assert.ok(!index.includes(JSON.stringify(f.text)), `${p.id}: fact in index.json`)
    for (const hint of p.hints) assert.ok(!index.includes(JSON.stringify(hint)), `${p.id}: hint in index.json`)
  }
})

test('every puzzle names its licence, and an attributed one its author and source', () => {
  for (const p of bank.puzzles) {
    assert.ok(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0'].includes(p.source.license), p.id)
    if (p.source.license !== 'CC0-1.0') assert.ok(p.source.author && p.source.url, p.id)
  }
})

const puzzle = publicOf({ id: 'p', lang: 'zh', title: 't', surface: 's', difficulty: 'easy', facts: [{ text: 'a', required: true }, { text: 'b', required: false }], hints: ['h1', 'h2'], source: { license: 'CC0-1.0' } })

test('a puzzle\'s public part counts what is hidden', () => {
  assert.deepEqual([puzzle.requiredCount, puzzle.hintCount], [1, 2])
  assert.equal(puzzle.facts, undefined)
  assert.equal(puzzle.hints, undefined)
})

test('pending is what has no verdict, oldest first; a hint waits once asked', () => {
  const round = newRound({ puzzle, host: 'user:h', at: 1 })
  round.questions = { b: { by: 'user:1', kind: 'ask', text: 'q2', at: 2 }, a: { by: 'user:2', kind: 'ask', text: 'q1', at: 1 }, c: { by: 'user:1', kind: 'ask', text: 'q3', at: 3, verdict: 'no' } }
  assert.deepEqual(pendingQuestions(round).map((q) => q.id), ['a', 'b'])
  assert.equal(giveUpNeeded(round), 2)
  assert.equal(hintWaiting(round), false)
  round.hintAsks[0] = { by: 'user:1', at: 4 }
  assert.equal(hintWaiting(round), true)
  round.hints[0] = { text: 'h1', at: 5 }
  assert.equal(hintWaiting(round), false)
})

test('alone, one give-up vote is enough; the host never counts', () => {
  const round = newRound({ puzzle, host: 'user:h', at: 1 })
  round.giveUp = { 'user:1': 1 }
  round.questions = { x: { by: 'user:h', kind: 'ask', text: '?', at: 1 } }
  assert.equal(giveUpNeeded(round), 1)
})

test('a question is one short line; a guess may be longer', () => {
  assert.throws(() => checkQuestion('ask', '  '))
  assert.throws(() => checkQuestion('ask', '啊'.repeat(121)))
  assert.equal(checkQuestion('guess', '啊'.repeat(300)).length, 300)
  assert.equal(checkQuestion('ask', ' 他是自杀吗？ '), '他是自杀吗？')
})
