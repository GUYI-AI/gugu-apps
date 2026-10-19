// The host's tools against a stand-in for gugu.files: one live object per round file, as the runtime hands it.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { newRound, publicOf } from '../app/game.js'

const dir = mkdtempSync(join(tmpdir(), 'turtle-soup-test-'))
process.env.GUGU_EXTENSION_DATA_DIR = dir
after(() => rmSync(dir, { recursive: true, force: true }))

const files = new Map()
const handle = (entry, data) => ({ entry, data, saved: true, status: 'online', transact: (fn) => fn(), onStatus: () => () => {} })
globalThis.gugu = {
  files: {
    open: async ({ id }) => {
      if (!files.has(id)) throw Object.assign(new Error('not found'), { code: 'not-found' })
      return files.get(id)
    },
    create: async ({ chat, name }, content) => {
      const entry = { id: `item-${files.size + 1}`, chat, name }
      files.set(entry.id, handle(entry, structuredClone(content)))
      return entry
    },
  },
}
const tools = await import('../app/tools.js')
const bank = JSON.parse(readFileSync(new URL('../app/bank/puzzles.json', import.meta.url), 'utf8'))
const HOST = { agent: 'user:host' }
const ICED = bank.puzzles.find((p) => p.id === 'soupbase-iced-tea-zh')

function roundOf(p = ICED) {
  const id = `item-${files.size + 1}`
  const data = newRound({ puzzle: publicOf(p), host: HOST.agent, at: 1 })
  files.set(id, handle({ id, name: `t.turtle-soup.json` }, data))
  return { id, data }
}
const ask = (data, id, kind, text, by = 'user:p1') => { data.questions[id] = { by, kind, text, at: Object.keys(data.questions).length + 2 } }

test('the host learns the story; the file never holds it until the round is solved', async () => {
  const { id, data } = roundOf()
  const took = await tools.host.run({ game: id }, HOST)
  assert.equal(took.solution, ICED.solution)
  assert.equal(took.required_facts.length, 2)
  assert.equal(data.status, 'playing')
  const leak = () => assert.ok(!JSON.stringify(data).includes(ICED.solution.slice(0, 12)))
  leak()
  ask(data, 'q1', 'ask', '毒在冰里吗？')
  ask(data, 'q2', 'guess', '毒在冰块里', 'user:p2')
  assert.equal((await tools.pending.run({ game: id }, HOST)).questions.length, 2)
  const r1 = await tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'yes' }, { id: 'q2', verdict: 'close', hits: [0] }] }, HOST)
  assert.equal(r1.status, 'playing')
  assert.equal(data.questions.q2.hits, 1)
  leak()
  ask(data, 'q3', 'guess', '毒在冰里，喝得快的人冰没化')
  const r2 = await tools.judge.run({ game: id, answers: [{ id: 'q3', verdict: 'solved', hits: [0, 1] }] }, HOST)
  assert.equal(r2.status, 'solved')
  assert.equal(data.bottom, ICED.solution)
  assert.equal(data.solvedBy, 'q3')
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'no' }] }, HOST), /solved, not playing/)
})

test('solved without every required fact, a verdict of the wrong kind, a second judgement: refused, nothing written', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  ask(data, 'q1', 'guess', '毒在冰块里')
  ask(data, 'q2', 'ask', '是白天吗？')
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q2', verdict: 'no' }, { id: 'q1', verdict: 'solved', hits: [0] }] }, HOST), /misses 1/)
  assert.equal(data.questions.q2.verdict, undefined)
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q2', verdict: 'solved' }] }, HOST), /is a question/)
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'yes' }] }, HOST), /is a guess/)
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'wrong', hits: [0] }] }, HOST), /close, not wrong/)
  await tools.judge.run({ game: id, answers: [{ id: 'q2', verdict: 'irrelevant' }] }, HOST)
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q2', verdict: 'no' }] }, HOST), /judged already/)
})

test('hints are the prepared ones, in order, and only when asked', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  await assert.rejects(tools.hint.run({ game: id }, HOST), /no one asked/)
  data.hintAsks[0] = { by: 'user:p1', at: 2 }
  await tools.hint.run({ game: id }, HOST)
  assert.equal(data.hints[0].text, ICED.hints[0])
  await assert.rejects(tools.hint.run({ game: id }, HOST), /no one asked/)
})

test('only the host judges; reveal waits for a majority of give-up votes', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  ask(data, 'q1', 'ask', '下雨了吗？')
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'no' }] }, { agent: 'user:other' }), /not the host/)
  await assert.rejects(tools.host.run({ game: id }, { agent: 'user:other' }), /another host/)
  ask(data, 'q2', 'ask', '是白天吗？', 'user:p2')
  data.giveUp['user:p1'] = 4
  await assert.rejects(tools.reveal.run({ game: id }, HOST), /1 of the 2/)
  data.giveUp['user:p2'] = 5
  assert.equal(await tools.reveal.run({ game: id }, HOST), 'revealed')
  assert.equal(data.bottom, ICED.solution)
})

test('a puzzle of the host\'s own keeps solution, facts and hints on this computer', async () => {
  const made = await tools.create.run({ chat: 'chat-1', title: '自制', surface: '他笑了。', solution: '因为他中了彩票，奖金很多。', facts: [{ text: '他中了彩票', required: true }], hints: ['和钱有关'], author: 'user:a085' }, HOST)
  const round = files.get(made.game).data
  assert.equal(round.status, 'playing')
  assert.ok(!JSON.stringify(round).includes('彩票'))
  assert.ok(!JSON.stringify(round).includes('和钱有关'))
  assert.deepEqual([round.puzzle.requiredCount, round.puzzle.hintCount], [1, 1])
  assert.deepEqual(round.puzzle.source, { kind: 'host', license: null }) // shown as 主持人自出: no words of the host's
  round.questions.q1 = { by: 'user:p1', kind: 'guess', text: '他买彩票中奖了', at: 2 }
  assert.equal((await tools.judge.run({ game: made.game, answers: [{ id: 'q1', verdict: 'solved', hits: [0] }] }, HOST)).status, 'solved')
})
