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
// f.data as the runtime gives it: an object assigned in is copied into the file (json-proxy's toY), so a write into the
// object you assigned, rather than through f.data, is lost — as it is in gugu.
const live = (target) => new Proxy(target, {
  get: (t, k) => (t[k] !== null && typeof t[k] === 'object' ? live(t[k]) : t[k]),
  set: (t, k, v) => { t[k] = v !== null && typeof v === 'object' ? structuredClone(v) : v; return true },
})
const handle = (entry, data) => ({ entry, data: live(data), saved: true, status: 'online', transact: (fn) => fn(), onStatus: () => () => {} })
// Whispers the tools dispatch, and who cannot be told (gugu refuses them: not-found).
const sent = []
const everSent = [] // every whisper of the whole file: `sent` is emptied between steps
const unreachable = new Set()
globalThis.gugu = {
  dispatch: async (text, { to: target, refs }) => {
    const to = target.member
    assert.equal(target.chat, refs[0].file.chat)
    if (unreachable.has(to)) throw Object.assign(new Error(`${to} cannot be told`), { code: 'not-found' })
    sent.push({ to, text, file: refs[0].file.id })
    everSent.push(text)
    return { id: `msg-${sent.length}` }
  },
  files: {
    list: async ({ chat }) => [...files.values()].filter((f) => f.entry.chat === chat).map((f) => ({ ...f.entry, type: 'json' })),
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
  files.set(id, handle({ id, chat: 'chat-1', name: `t.turtle-soup.json` }, data))
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

// ── agents as players ───────────────────────────────────────────────────────────────────────────────────────────

const AGENT = { agent: 'user:agent-player' }
const HUMAN = 'user:human'
const hasNoSolution = (x) => assert.ok(!JSON.stringify(x).includes(ICED.solution.slice(0, 12)), `leaked: ${JSON.stringify(x)}`)
const sentTo = (to) => sent.filter((m) => m.to === to)

test('an agent plays a whole round with the tools: one question at a time, woken by each verdict, never shown the story', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  sent.length = 0
  const before = await tools.state.run({ game: id }, AGENT)
  hasNoSolution(before)
  assert.equal(before.surface, ICED.surface)
  assert.equal(before.you.can_ask, true)

  const q1 = await tools.ask.run({ game: id, text: '毒在冰里吗？' }, AGENT)
  hasNoSolution(q1)
  assert.deepEqual(data.questions[q1.id], { by: AGENT.agent, kind: 'ask', text: '毒在冰里吗？', at: data.questions[q1.id].at })
  assert.equal(sentTo(HOST.agent).length, 1) // the host is woken, with the round's pill
  assert.equal(sentTo(HOST.agent)[0].file, id)
  await assert.rejects(tools.ask.run({ game: id, text: '是白天吗？' }, AGENT), /still waits for the host's verdict/)
  await assert.rejects(tools.guess.run({ game: id, text: '毒在冰里' }, AGENT), /one at a time/)
  const waitingNow = await tools.state.run({ game: id }, AGENT)
  assert.equal(waitingNow.you.can_ask, false)
  assert.match(waitingNow.you.why, /waits for the host's verdict/)

  await tools.judge.run({ game: id, answers: [{ id: q1.id, verdict: 'yes' }] }, HOST)
  assert.match(sentTo(AGENT.agent).at(-1).text, /你的问题「毒在冰里吗？」：是/)
  const g1 = await tools.guess.run({ game: id, text: '毒在冰块里' }, AGENT)
  assert.equal(sentTo(HOST.agent).length, 2)
  await tools.judge.run({ game: id, answers: [{ id: g1.id, verdict: 'close', hits: [0] }] }, HOST)
  assert.match(sentTo(AGENT.agent).at(-1).text, /你的还原「毒在冰块里」：接近（中 1\/2 条）/)
  const mid = await tools.state.run({ game: id }, AGENT)
  hasNoSolution(mid)
  // Two writes in one millisecond are ordered by id: compare without the order.
  assert.deepEqual(mid.questions.rows.map((r) => [r.text, r.mine, r.verdict]).sort(), [['毒在冰块里', true, 'close'], ['毒在冰里吗？', true, 'yes']])
  assert.deepEqual(mid.questions.rows.map((r) => r.n), [1, 2])

  const g2 = await tools.guess.run({ game: id, text: '毒在冰里，喝得快的人冰还没化，所以没事' }, AGENT)
  await tools.judge.run({ game: id, answers: [{ id: g2.id, verdict: 'solved', hits: [0, 1] }] }, HOST)
  assert.match(sentTo(AGENT.agent).at(-1).text, /还原成功.*这局结束了/)
  assert.equal(sentTo(AGENT.agent).length, 3) // one whisper per verdict, nothing for anything else
  const after = await tools.state.run({ game: id }, AGENT)
  assert.equal(after.solution, ICED.solution)
  assert.equal(after.solved_by, AGENT.agent)
  await assert.rejects(tools.ask.run({ game: id, text: '还有吗？' }, AGENT), /over/)
})

test('the host cannot play its own round; reading it is harmless', async () => {
  const { id } = roundOf()
  await tools.host.run({ game: id }, HOST)
  for (const [tool, args] of [[tools.ask, { text: '是吗？' }], [tools.guess, { text: '故事' }], [tools.request_hint, {}], [tools.give_up, {}]]) {
    await assert.rejects(tool.run({ game: id, ...args }, HOST), /you host this round/)
  }
  assert.equal((await tools.state.run({ game: id }, HOST)).you.why, 'you host this round')
})

test('the host is woken only when nothing already waits for it, as the page does', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  ask(data, 'h1', 'ask', '是白天吗？', HUMAN) // a person's question, not judged yet
  sent.length = 0
  await tools.ask.run({ game: id, text: '有人死了吗？' }, AGENT)
  assert.equal(sent.length, 0)
  // Before the host took the round: written, not woken.
  const fresh = roundOf()
  const r = await tools.ask.run({ game: fresh.id, text: '有人死了吗？' }, AGENT)
  assert.match(r.note, /has not taken the round/)
  assert.equal(sent.length, 0)
})

test('hints and giving up: asked by the agent, the host woken, the agent told when it is done', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  sent.length = 0
  await tools.request_hint.run({ game: id }, AGENT)
  assert.equal(data.hintAsks[0].by, AGENT.agent)
  assert.equal(sentTo(HOST.agent).length, 1)
  await assert.rejects(tools.request_hint.run({ game: id }, AGENT), /asked for already/)
  await tools.hint.run({ game: id }, HOST)
  assert.match(sentTo(AGENT.agent).at(-1).text, /提示 1 出来了/)
  const st = await tools.state.run({ game: id }, AGENT)
  assert.deepEqual(st.hints, [ICED.hints[0]])
  hasNoSolution(st)

  // Alone with the host, one vote is a majority: the host is told to reveal, the agent told it ended.
  const vote = await tools.give_up.run({ game: id }, AGENT)
  assert.deepEqual([vote.votes, vote.needed], [1, 1])
  assert.match(sentTo(HOST.agent).at(-1).text, /玩家投票放弃了，请揭晓汤底/)
  await assert.rejects(tools.give_up.run({ game: id }, AGENT), /voted to give up already/)
  await tools.give_up.run({ game: id, undo: true }, AGENT)
  assert.equal(data.giveUp[AGENT.agent], undefined)
  await tools.give_up.run({ game: id }, AGENT)
  await tools.reveal.run({ game: id }, HOST)
  assert.match(sentTo(AGENT.agent).at(-1).text, /大家放弃了/)
})

test('a person\'s question judged wakes the agent players too, so they can take turns with the people', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  const q = await tools.ask.run({ game: id, text: '毒在冰里吗？' }, AGENT)
  await tools.judge.run({ game: id, answers: [{ id: q.id, verdict: 'yes' }] }, HOST)
  ask(data, 'h1', 'ask', '是白天吗？', HUMAN)
  sent.length = 0
  await tools.judge.run({ game: id, answers: [{ id: 'h1', verdict: 'no' }] }, HOST)
  assert.deepEqual(sent.map((m) => m.to), [AGENT.agent])
  assert.match(sent[0].text, /别人的 1 个问题判了/)
})

test('people are never whispered; an agent that cannot be told is said back to the host, the verdict stays', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  const q = await tools.ask.run({ game: id, text: '毒在冰里吗？' }, AGENT)
  ask(data, 'h1', 'ask', '是白天吗？', HUMAN)
  sent.length = 0
  unreachable.add(AGENT.agent)
  try {
    const r = await tools.judge.run({ game: id, answers: [{ id: q.id, verdict: 'yes' }, { id: 'h1', verdict: 'no' }] }, HOST)
    assert.equal(data.questions[q.id].verdict, 'yes')
    assert.match(r.players_not_told[0], /user:agent-player: not-found/)
    assert.equal(sentTo(HUMAN).length, 0)
  } finally {
    unreachable.delete(AGENT.agent)
  }
})

test('what the tools write is what 0.1.2 reads: its round shape plus agents, and a question as the page writes it', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  const before = Object.keys(data).sort()
  const q = await tools.ask.run({ game: id, text: '毒在冰里吗？' }, AGENT)
  await tools.request_hint.run({ game: id }, AGENT)
  await tools.give_up.run({ game: id }, AGENT)
  assert.deepEqual(Object.keys(data).sort(), [...before, 'agents'].sort())
  assert.equal(data.version, 1)
  assert.deepEqual(Object.keys(data.questions[q.id]).sort(), ['at', 'by', 'kind', 'text']) // main.js submit()
  assert.deepEqual(Object.keys(data.hintAsks[0]).sort(), ['at', 'by']) // main.js askHint()
  assert.equal(typeof data.giveUp[AGENT.agent], 'number') // main.js toggleGiveUp()
  assert.deepEqual(data.agents, { [AGENT.agent]: true })
})

test('a long round comes in pages under the answer budget; rounds lists a chat\'s rounds', async () => {
  const { id, data } = roundOf()
  await tools.host.run({ game: id }, HOST)
  for (let i = 0; i < 60; i++) ask(data, `q${String(i).padStart(2, '0')}`, 'guess', '很长的还原'.repeat(70), HUMAN)
  const page1 = await tools.state.run({ game: id }, AGENT)
  assert.ok(Buffer.byteLength(JSON.stringify(page1)) < 8000)
  assert.ok(page1.questions.next > 1)
  const page2 = await tools.state.run({ game: id, from: page1.questions.next }, AGENT)
  assert.equal(page2.questions.rows[0].n, page1.questions.next)

  const made = await tools.create.run({ chat: 'chat-r', title: '另一局', surface: '他笑了。', solution: '中了彩票。', facts: [{ text: '彩票', required: true }] }, HOST)
  const listed = await tools.rounds.run({ chat: 'chat-r' }, AGENT)
  assert.deepEqual(listed.map((r) => [r.game, r.title, r.status, r.you_host]), [[made.game, '另一局', 'playing', false]])
  hasNoSolution(listed)
  assert.match(await tools.rounds.run({ chat: 'chat-empty' }, AGENT), /no 海龟汤 rounds/)
})

// The person whose computer hosts sees these whispers too (they go out in their name): sentences, never a tool's name.
// What to do with them is the skills' job (10-19: 「用 turtle-soup__state 看全局」 showed in the opener's chat).
test('every whisper reads as a sentence for people: no tool names', () => {
  assert.ok(everSent.length > 5)
  for (const text of everSent) assert.doesNotMatch(text, /turtle-soup__|\b(state|reveal|host|judge|hint|pending)\b/, text)
})
