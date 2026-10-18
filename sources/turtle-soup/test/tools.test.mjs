// The host's tools against a stand-in for gugu.files: one live object per round file, as the runtime hands it.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { newRound } from '../app/game.js'

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
const HOST = { agent: 'user:host' }

function roundOf(puzzleId, keyCount) {
  const id = `item-${files.size + 1}`
  const data = newRound({ puzzle: { id: puzzleId, title: 't', surface: '一辆车直直撞上了路边的大树。', keyCount }, host: HOST.agent, at: 1 })
  files.set(id, handle({ id, name: `t${'.turtle-soup.json'}` }, data))
  return { id, data }
}

test('host learns the bottom; players find every key point and the round is solved', async () => {
  const { id, data } = roundOf('gugu-crash-success', 3)
  const took = await tools.host.run({ game: id }, HOST)
  assert.match(took.bottom, /特技演员/)
  assert.equal(data.status, 'playing')
  assert.equal(data.bottom, null)
  data.questions.q1 = { by: 'user:p1', kind: 'ask', text: '他是故意撞的吗？', at: 2 }
  data.questions.q2 = { by: 'user:p2', kind: 'guess', text: '他在拍电影，撞车是特技', at: 3 }
  assert.equal((await tools.pending.run({ game: id }, HOST)).length, 2)
  const r1 = await tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'yes' }, { id: 'q2', found: [0, 1] }] }, HOST)
  assert.deepEqual([r1.status, r1.found, r1.of], ['playing', 2, 3])
  assert.equal(data.found[0].by, 'user:p2')
  data.questions.q3 = { by: 'user:p1', kind: 'guess', text: '一次就拍成了', at: 4 }
  const r2 = await tools.judge.run({ game: id, answers: [{ id: 'q3', found: [2] }] }, HOST)
  assert.equal(r2.status, 'solved')
  assert.match(data.bottom, /特技演员/)
})

test('a reply quoting the bottom is refused and nothing is written', async () => {
  const { id, data } = roundOf('gugu-crash-success', 3)
  await tools.host.run({ game: id }, HOST)
  data.questions.q1 = { by: 'user:p1', kind: 'ask', text: '他是司机吗？', at: 2 }
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'partly', reply: '他是一名特技演员' }] }, HOST), /quotes the bottom/)
  assert.equal(data.questions.q1.judged, undefined)
  await assert.rejects(tools.hint.run({ game: id, text: '撞树是事先设计好的' }, HOST), /quotes the bottom/)
})

test('only the host judges; reveal waits for the give-up votes', async () => {
  const { id, data } = roundOf('gugu-crash-success', 3)
  await tools.host.run({ game: id }, HOST)
  data.questions.q1 = { by: 'user:p1', kind: 'ask', text: '下雨了吗？', at: 2 }
  await assert.rejects(tools.judge.run({ game: id, answers: [{ id: 'q1', verdict: 'no' }] }, { agent: 'user:other' }), /not the host/)
  await assert.rejects(tools.host.run({ game: id }, { agent: 'user:other' }), /another host/)
  data.questions.q2 = { by: 'user:p2', kind: 'ask', text: '是白天吗？', at: 3 }
  data.giveUp['user:p1'] = 4
  await assert.rejects(tools.reveal.run({ game: id }, HOST), /give-up votes/)
  data.giveUp['user:p2'] = 5
  assert.equal(await tools.reveal.run({ game: id }, HOST), 'revealed')
  assert.equal(data.status, 'revealed')
})

test('a puzzle of the host\'s own keeps its bottom on this computer only', async () => {
  const made = await tools.create.run({ chat: 'chat-1', title: '自制', surface: '他笑了。', bottom: '因为他中了彩票，奖金很多。', key_points: ['他中了彩票'] }, HOST)
  const round = files.get(made.game).data
  assert.equal(round.status, 'playing')
  assert.ok(!JSON.stringify(round).includes('彩票'))
  assert.ok(readdirSync(join(dir, 'secrets')).length > 0)
  round.questions.q1 = { by: 'user:p1', kind: 'guess', text: '他买彩票中奖了', at: 2 }
  assert.equal((await tools.judge.run({ game: made.game, answers: [{ id: 'q1', found: [0] }] }, HOST)).status, 'solved')
})
