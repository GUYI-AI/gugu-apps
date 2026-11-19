// 海龟汤's tools: the host's (host, pending, judge, hint, reveal, create) and the players' (rounds, state, ask, guess,
// request_hint, give_up). Every export here is one tool (gugu's tools.js rule).
//
// The round file in the chat (`<title>.turtle-soup.json`) is what players see. The rest of the puzzle — solution,
// facts, hints — stays here, in this App's data folder on the host's computer (secrets/<round file id>.json), until
// the round ends. The host picks verdicts; no tool takes free text from it, so nothing it writes can carry the answer.
// The players' tools read the round file only, never secrets/: what they answer, any player sees in the App anyway.
// Who calls is `agent`, stamped by gugu — never an argument.
//
// Waking (apps-programs' followers): whoever adds to what waits for the host whispers it, as the page does; an agent
// player is marked in the round's `agents` (stamped, by its own call), and the host's judge / hint / reveal whisper each
// agent player what was done to it. People see it all in the App and are never whispered.
import { readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  FILE_SUFFIX, ASK_VERDICTS, GUESS_VERDICTS, MAX_HINTS, VERDICT_LABEL,
  publicOf, newRound, ended, questionsInOrder, pendingQuestions, hintsGiven, hintWaiting, giveUpNeeded,
  checkQuestion, somethingWaits, waitingFrom,
} from './game.js'

const here = dirname(fileURLToPath(import.meta.url))

// One program serves every session: calls are taken one at a time, so two judgements of one round never interleave.
let lane = Promise.resolve()
const oneAtATime = (fn) => {
  const run = lane.then(fn, fn)
  lane = run.catch(() => {})
  return run
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    if (e.code === 'ENOENT') return null
    throw new Error(`${file} could not be read: ${e.message}`)
  }
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  try {
    writeFileSync(tmp, JSON.stringify(value))
    renameSync(tmp, file)
  } catch (e) {
    try { unlinkSync(tmp) } catch {}
    throw e
  }
}

function secretFile(roundId) {
  const dir = process.env.GUGU_EXTENSION_DATA_DIR
  if (!dir) throw new Error('GUGU_EXTENSION_DATA_DIR is not set')
  return join(dir, 'secrets', `${roundId.replace(/[^\w-]/g, '_')}.json`)
}

let bank
function bankPuzzle(id) {
  bank ??= readJson(join(here, 'bank', 'puzzles.json'))
  return bank?.puzzles?.find((p) => p.id === id) ?? null
}

/** The round file as a live handle, opened as the calling agent: its id (format gugu-file), or an entry listed in a chat it handed. */
async function openRound(game) {
  const f = await gugu.files.open(typeof game === 'string' ? { id: game } : game)
  if (!f.entry?.name?.endsWith(FILE_SUFFIX)) throw new Error(`${f.entry?.name ?? game} is not a 海龟汤 round (${FILE_SUFFIX})`)
  if (f.data?.version !== 1) throw new Error(`this round is version ${f.data?.version}; this 海龟汤 reads version 1`)
  return f
}

/** Until the server has every write of this call: what the call answers is already what players see. */
function whenSaved(f) {
  if (f.saved) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { off(); reject(new Error('the round was not saved within 10 s; check the chat is reachable and call again')) }, 10_000)
    const off = f.onStatus(() => {
      if (f.status === 'gone') { clearTimeout(timer); off(); reject(new Error('the round file is gone (deleted, or you left the chat)')) }
      else if (f.saved) { clearTimeout(timer); off(); resolve() }
    })
  })
}

function needAgent(agent) {
  if (!agent) throw new Error('海龟汤 tools are for agents: gugu did not say which agent is calling')
}

function requireHost(round, agent) {
  needAgent(agent)
  if (round.host !== agent) throw new Error('you are not the host of this round; call host first (or the round has another host)')
  if (round.status !== 'playing') throw new Error(`this round is ${round.status}, not playing — nothing to judge`)
}

function secretOf(roundId) {
  const secret = readJson(secretFile(roundId))
  if (!secret) throw new Error('this computer holds no solution for this round: only the host who took it can judge it')
  return secret
}

const required = (secret) => secret.facts.filter((f) => f.required)

/** What waits for the host: questions and guesses, a hint asked for, give-up votes. */
function waiting(round) {
  return {
    questions: pendingQuestions(round).map(({ id, by, kind, text }) => ({ id, by, kind, text })),
    hint_asked: hintWaiting(round),
    give_up: { votes: Object.keys(round.giveUp ?? {}).length, needed: giveUpNeeded(round) },
  }
}

/** Whisper each one its line, the round's pill under it. What could not be told is said back, never swallowed. */
async function whisper(f, lines) {
  const notTold = []
  for (const [to, text] of lines) {
    try {
      await gugu.dispatch(text, { to: { chat: f.entry.chat, member: to }, refs: [{ file: f.entry }] })
    } catch (e) {
      notTold.push(`${to}: ${e.code ?? 'failed'} — ${e.message}`)
    }
  }
  return notTold
}

const agentPlayers = (round) => Object.keys(round.agents ?? {}).filter((id) => id !== round.host)

/** How a round ended, in the line an agent player is woken with. */
const endLine = (round) => (round.status === 'revealed' ? '大家放弃了，汤底已揭晓' : '有人还原成功，汤底已揭晓')

/**
 * What the host did, told to the agent players: each its own verdict, its hint, or the end; and any other verdict to
 * every agent player, so one that waits for the people to ask (the player skill's pace) wakes when they did.
 */
function linesFor(round, { judged = [], hintFor = null } = {}) {
  const head = `海龟汤「${round.puzzle.title}」：`
  const said = new Map()
  const add = (to, line) => said.set(to, [...(said.get(to) ?? []), line])
  const agents = new Set(agentPlayers(round))
  for (const q of judged) {
    if (!agents.has(q.by)) continue
    const label = q.verdict === 'close' ? `接近（中 ${q.hits}/${round.puzzle.requiredCount} 条）` : VERDICT_LABEL[q.verdict]
    add(q.by, `你的${q.kind === 'guess' ? '还原' : '问题'}「${q.text}」：${label}`)
  }
  for (const id of agents) {
    const others = judged.filter((q) => q.by !== id).length
    if (others && !ended(round)) add(id, `别人的 ${others} 个问题判了`)
  }
  if (hintFor && agents.has(hintFor.by)) add(hintFor.by, `你要的提示 ${hintFor.level + 1} 出来了`)
  if (ended(round)) for (const id of agents) add(id, `这局结束了：${endLine(round)}`)
  return [...said].map(([to, lines]) => [to, `${head}${lines.join('；')}。`])
}

const RULES =
  'Judge by the solution and the facts only. A question: yes / no — the solution settles it (a stated fact is ' +
  'answered true or false even if it does not matter); irrelevant — it has no bearing on the story; partly — true in ' +
  'part, or it depends on how it is meant; unclear — ambiguous, several questions in one, or about something the ' +
  'solution leaves open where the answer would matter (never answer no just because the solution does not say). ' +
  'The same question asked again gets the same answer; a negative question is answered as its own claim. A guess: ' +
  'solved only when it covers every required fact and hangs together, close when it has some of them, wrong otherwise; ' +
  'hits lists the required facts (by index) it covers. Never tell the solution, a fact or an unused hint anywhere — ' +
  'chat, private message, your own owner — until the round is over.'

const ROUND = { type: 'string', format: 'gugu-file', description: 'The round file (.turtle-soup.json): its id or gugu-file:// link, as the message that called you carries it.' }

export const host = {
  description:
    'Take a 海龟汤 (turtle soup) round as its host: you learn its solution (汤底) and facts, and from then on you judge ' +
    'the players\' questions and guesses with judge. Call it when a player asks you to host a round.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(() => hostOnce(args, call)),
}

async function hostOnce({ game }, { agent }) {
  needAgent(agent)
  const f = await openRound(game)
  const round = f.data
  if (round.host && round.host !== agent) throw new Error('this round has another host')
  if (ended(round)) throw new Error(`this round is ${round.status}`)
  let secret = readJson(secretFile(f.entry.id))
  if (!secret) {
    const puzzle = bankPuzzle(round.puzzle.id)
    if (!puzzle) throw new Error(`puzzle ${round.puzzle.id} is not in this computer's 海龟汤 bank (update the App?)`)
    secret = { id: puzzle.id, solution: puzzle.solution, facts: puzzle.facts, unknowns: puzzle.unknowns, character_claims: puzzle.character_claims, hints: puzzle.hints.slice(0, MAX_HINTS) }
    writeJson(secretFile(f.entry.id), secret)
  }
  if (round.status !== 'playing') f.data.status = 'playing'
  await whenSaved(f)
  return {
    title: round.puzzle.title,
    surface: round.puzzle.surface,
    solution: secret.solution,
    required_facts: required(secret).map((fact, index) => ({ index, text: fact.text })),
    other_facts: secret.facts.filter((x) => !x.required).map((x) => x.text),
    unknowns: secret.unknowns ?? [],
    character_claims: secret.character_claims ?? [],
    hints_left: secret.hints.length - hintsGiven(round),
    rules: RULES,
    waiting: waiting(f.data),
  }
}

export const pending = {
  description: 'What waits for you in a 海龟汤 round you host: questions and guesses (oldest first), a hint asked for, give-up votes.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    requireHost(f.data, call.agent)
    return waiting(f.data)
  }),
}

export const judge = {
  description:
    'Judge questions and guesses of a 海龟汤 round you host, several at once. A question (kind ask): verdict ' +
    `${ASK_VERDICTS.join(' / ')}. A guess (kind guess): verdict ${GUESS_VERDICTS.join(' / ')} and hits, the required ` +
    'facts (by index) it covers; solved needs all of them and reveals the solution to everyone. There is no text to write.',
  inputSchema: {
    type: 'object',
    required: ['game', 'answers'],
    properties: {
      game: ROUND,
      answers: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'verdict'],
          properties: {
            id: { type: 'string', description: 'The question id, from pending.' },
            verdict: { type: 'string', enum: [...ASK_VERDICTS, ...GUESS_VERDICTS] },
            hits: { type: 'array', items: { type: 'integer', minimum: 0 }, description: 'A guess: the required facts it covers.' },
          },
        },
      },
    },
  },
  run: (args, call) => oneAtATime(() => judgeOnce(args, call)),
}

async function judgeOnce({ game, answers }, { agent }) {
  const f = await openRound(game)
  const round = f.data
  requireHost(round, agent)
  const facts = required(secretOf(f.entry.id))
  // Every answer is checked before any is written: a refused one leaves the round as it was.
  const writes = answers.map((a) => {
    const q = round.questions?.[a.id]
    if (!q) throw new Error(`no question ${a.id} in this round`)
    if (q.verdict) throw new Error(`question ${a.id} is judged already`)
    if (q.kind === 'ask') {
      if (!ASK_VERDICTS.includes(a.verdict)) throw new Error(`question ${a.id} is a question: verdict ${ASK_VERDICTS.join(' / ')}`)
      return { id: a.id, q, verdict: a.verdict }
    }
    if (q.kind !== 'guess') throw new Error(`question ${a.id} has an unknown kind ${q.kind}`)
    if (!GUESS_VERDICTS.includes(a.verdict)) throw new Error(`question ${a.id} is a guess: verdict ${GUESS_VERDICTS.join(' / ')}`)
    const hits = [...new Set(a.hits ?? [])]
    for (const i of hits) if (!facts[i]) throw new Error(`there is no required fact ${i} (0-${facts.length - 1})`)
    if (a.verdict === 'solved' && hits.length < facts.length) {
      const missing = facts.map((_, i) => i).filter((i) => !hits.includes(i))
      throw new Error(`solved needs every required fact; this guess misses ${missing.join(', ')} — judge it close, or list the hits it really has`)
    }
    if (a.verdict === 'wrong' && hits.length) throw new Error(`a guess with hits is close, not wrong`)
    return { id: a.id, q, verdict: a.verdict, hits: hits.length }
  })
  const at = Date.now()
  const solved = writes.find((w) => w.verdict === 'solved')
  f.transact(() => {
    for (const w of writes) f.data.questions[w.id] = { ...w.q, verdict: w.verdict, ...(w.hits !== undefined ? { hits: w.hits } : {}), judgedAt: at }
    if (solved) Object.assign(f.data, { status: 'solved', solvedBy: solved.id, bottom: secretOf(f.entry.id).solution, endedAt: at })
  })
  await whenSaved(f)
  const notTold = await whisper(f, linesFor(f.data, { judged: writes.map((w) => ({ ...w.q, verdict: w.verdict, hits: w.hits })) }))
  return { status: f.data.status, waiting: ended(f.data) ? null : waiting(f.data), ...(notTold.length ? { players_not_told: notTold } : {}) }
}

export const hint = {
  description: 'Give the players of a 海龟汤 round you host its next prepared hint, when they asked for one. You do not write it.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    requireHost(f.data, call.agent)
    const { hints } = secretOf(f.entry.id)
    const level = hintsGiven(f.data)
    if (level >= hints.length) throw new Error('every prepared hint is out already')
    if (!f.data.hintAsks?.[level]) throw new Error('no one asked for a hint: hints are the players\' to ask for')
    f.data.hints[level] = { text: hints[level], at: Date.now() }
    await whenSaved(f)
    const notTold = await whisper(f, linesFor(f.data, { hintFor: { by: f.data.hintAsks[level].by, level } }))
    return `hint ${level + 1} of ${hints.length} given${notTold.length ? `; players not told: ${notTold.join('; ')}` : ''}`
  }),
}

export const reveal = {
  description: 'Reveal the solution of a 海龟汤 round you host: only when a majority of the players voted to give up (alone: their one vote).',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    requireHost(f.data, call.agent)
    const votes = Object.keys(f.data.giveUp ?? {}).length
    const needed = giveUpNeeded(f.data)
    if (votes < needed) throw new Error(`${votes} of the ${needed} give-up votes needed: keep judging`)
    Object.assign(f.data, { status: 'revealed', bottom: secretOf(f.entry.id).solution, endedAt: Date.now() })
    await whenSaved(f)
    const notTold = await whisper(f, linesFor(f.data))
    return `revealed${notTold.length ? `; players not told: ${notTold.join('; ')}` : ''}`
  }),
}

export const create = {
  description:
    'Start a 海龟汤 round of a puzzle that is not in the bank — one you made up for the players, or one a person told ' +
    'you privately — in a chat, with you as its host. The solution, facts and hints stay on this computer; the chat sees ' +
    'the title and surface only. The surface must be solvable by yes/no questions; required facts are the 1-4 things a ' +
    'guess must have to count as solved.',
  inputSchema: {
    type: 'object',
    required: ['chat', 'title', 'surface', 'solution', 'facts'],
    properties: {
      chat: { type: 'string', format: 'gugu-chat', description: 'The chat to play in.' },
      title: { type: 'string', minLength: 1, maxLength: 30 },
      surface: { type: 'string', minLength: 1, maxLength: 400, description: '汤面: what the players are told.' },
      solution: { type: 'string', minLength: 1, maxLength: 1200, description: '汤底: the whole story.' },
      facts: {
        type: 'array', minItems: 1, maxItems: 8,
        items: { type: 'object', required: ['text', 'required'], properties: { text: { type: 'string', maxLength: 120 }, required: { type: 'boolean' } } },
      },
      hints: { type: 'array', maxItems: MAX_HINTS, items: { type: 'string', maxLength: 60 }, description: 'Up to 3, vaguest first.' },
    },
  },
  run: (args, call) => oneAtATime(async () => {
    needAgent(call.agent)
    const facts = args.facts.map((x) => ({ text: String(x.text).trim(), required: x.required === true }))
    if (!facts.some((x) => x.required)) throw new Error('at least one fact must be required: what a guess needs to be solved')
    const puzzle = {
      id: `custom-${randomUUID()}`,
      lang: null,
      title: String(args.title).trim(),
      surface: String(args.surface).trim(),
      difficulty: null,
      facts,
      hints: (args.hints ?? []).map((h) => String(h).trim()).filter(Boolean),
      source: { kind: 'host', license: null },
    }
    const entry = await gugu.files.create({ chat: args.chat, name: `${puzzle.title}${FILE_SUFFIX}` }, { ...newRound({ puzzle: publicOf(puzzle), host: call.agent, at: Date.now() }), status: 'playing' })
    writeJson(secretFile(entry.id), { id: puzzle.id, solution: String(args.solution).trim(), facts, unknowns: [], character_claims: [], hints: puzzle.hints })
    return { game: entry.id, name: entry.name, rules: RULES }
  }),
}

// ── the players' tools ──────────────────────────────────────────────────────────────────────────────────────────

/** A player of this round: anyone but its host, while it is on. */
function requirePlayer(round, agent) {
  needAgent(agent)
  if (round.host === agent) throw new Error('you host this round: the host judges, it does not play — player tools are for the others')
  if (ended(round)) throw new Error(`this round is over (${round.status}); state shows the solution`)
}

/** Wake the host — unless something already waited for it (it judges everything waiting before it stops), as the page does. */
async function tellHost(f, before, text) {
  if (f.data.status !== 'playing' || before) return {}
  const notTold = await whisper(f, [[f.data.host, text]])
  return notTold.length ? { host_not_told: notTold[0] } : {}
}

/** An agent player's own mark in the round, made by its own call: the host's tools whisper it from then on. */
function markAgent(f, agent) {
  // What is assigned into f.data is copied in: write the key through the live object, never into the {} just assigned.
  if (!f.data.agents) f.data.agents = {}
  f.data.agents[agent] = true
}

/** Most of a round an answer carries, in bytes: agents keep about 8 KB of one (apps-programs). */
const STATE_BYTES = 6000

export const rounds = {
  description: 'The 海龟汤 (turtle soup) rounds in a chat, newest first: to join one when nobody handed you its pill.',
  inputSchema: { type: 'object', required: ['chat'], properties: { chat: { type: 'string', format: 'gugu-chat', description: 'The chat.' } } },
  run: async ({ chat }, { agent }) => {
    needAgent(agent)
    const entries = (await gugu.files.list({ chat }))
      .filter((e) => e.type !== 'folder' && e.name.endsWith(FILE_SUFFIX))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 10)
    const found = []
    for (const entry of entries) {
      try {
        const f = await openRound(entry)
        found.push({ game: entry.id, title: f.data.puzzle.title, status: f.data.status, host: f.data.host, you_host: f.data.host === agent, updated_at: entry.updatedAt })
      } catch (e) {
        found.push({ game: entry.id, name: entry.name, unreadable: e.message })
      }
    }
    return found.length ? found : 'no 海龟汤 rounds in this chat: a person starts one from the 海龟汤 panel'
  },
}

export const state = {
  description:
    'A 海龟汤 round as its players see it: the surface (汤面), every question and guess with its verdict, the hints ' +
    'given, give-up votes, whether you may ask now, and the solution once the round is over. Read it before you ask.',
  inputSchema: {
    type: 'object',
    required: ['game'],
    properties: {
      game: ROUND,
      from: { type: 'integer', minimum: 1, description: 'The first question to list, by its number n (default 1); a long round comes in pages: pass next.' },
    },
  },
  run: async ({ game, from = 1 }, { agent }) => {
    needAgent(agent)
    const f = await openRound(game)
    const round = f.data
    const p = round.puzzle
    const all = questionsInOrder(round)
    const rows = []
    let bytes = 0
    for (const [i, q] of all.slice(from - 1).entries()) {
      const row = {
        n: from + i, id: q.id, by: q.by, ...(q.by === agent ? { mine: true } : {}), kind: q.kind, text: q.text,
        verdict: q.verdict ?? 'waiting', ...(q.verdict === 'close' ? { hits: q.hits } : {}),
      }
      bytes += Buffer.byteLength(JSON.stringify(row))
      if (rows.length && bytes > STATE_BYTES) break
      rows.push(row)
    }
    const next = from + rows.length <= all.length ? from + rows.length : null
    const over = ended(round)
    const mine = waitingFrom(round, agent)
    const why = round.host === agent ? 'you host this round' : over ? 'the round is over' : mine ? `your ${mine.kind === 'guess' ? 'guess' : 'question'} ${mine.id} waits for the host's verdict; you are told when it is judged` : null
    return {
      title: p.title,
      surface: p.surface,
      required_facts: p.requiredCount,
      status: round.status,
      host: round.host,
      questions: { total: all.length, rows, ...(next ? { next } : {}) },
      hints: Object.keys(round.hints ?? {}).sort((a, b) => a - b).map((k) => round.hints[k].text),
      hint: { given: hintsGiven(round), of: p.hintCount, asked: hintWaiting(round) },
      give_up: { votes: Object.keys(round.giveUp ?? {}).length, needed: giveUpNeeded(round), yours: Boolean(round.giveUp?.[agent]) },
      you: { can_ask: !why, ...(why ? { why } : {}) },
      ...(over ? { solution: round.bottom, ...(round.status === 'solved' ? { solved_by: round.questions?.[round.solvedBy]?.by ?? null } : {}) } : {}),
    }
  },
}

const PLAYER_TEXT = { type: 'string', minLength: 1 }

function putter(kind, wake) {
  return async ({ game, text }, { agent }) => {
    const f = await openRound(game)
    const round = f.data
    requirePlayer(round, agent)
    const line = checkQuestion(kind, text)
    const mine = waitingFrom(round, agent)
    if (mine) throw new Error(`your ${mine.kind === 'guess' ? 'guess' : 'question'} "${mine.text}" still waits for the host's verdict — one at a time; you are told when it is judged`)
    const before = somethingWaits(round)
    const id = randomUUID()
    f.transact(() => {
      markAgent(f, agent)
      f.data.questions[id] = { by: agent, kind, text: line, at: Date.now() }
    })
    await whenSaved(f)
    return { id, ...(round.status === 'waiting' ? { note: 'the host has not taken the round yet; it sees this when it does' } : {}), ...(await tellHost(f, before, wake)) }
  }
}

export const ask = {
  description:
    'Ask the host of a 海龟汤 round a yes/no question about the story (up to 120 characters). One at a time: the next ' +
    'once this one is judged — you are told then.',
  inputSchema: { type: 'object', required: ['game', 'text'], properties: { game: ROUND, text: { ...PLAYER_TEXT, maxLength: 120 } } },
  run: (args, call) => oneAtATime(() => putter('ask', '海龟汤有新问题')(args, call)),
}

export const guess = {
  description:
    'Tell the host of a 海龟汤 round the whole story as you think it is (up to 400 characters): solved when it has ' +
    'every required fact, otherwise close (how many it has) or wrong. Counts as your one question in waiting.',
  inputSchema: { type: 'object', required: ['game', 'text'], properties: { game: ROUND, text: { ...PLAYER_TEXT, maxLength: 400 } } },
  run: (args, call) => oneAtATime(() => putter('guess', '海龟汤有人提交了还原')(args, call)),
}

export const request_hint = {
  description: 'Ask the host of a 海龟汤 round for its next prepared hint (each round has up to 3). You are told when it is out.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    const round = f.data
    requirePlayer(round, call.agent)
    const level = hintsGiven(round)
    if (level >= round.puzzle.hintCount) throw new Error('every hint of this round is out already')
    if (hintWaiting(round)) throw new Error('a hint is asked for already: wait for the host to give it')
    const before = somethingWaits(round)
    f.transact(() => {
      markAgent(f, call.agent)
      f.data.hintAsks[level] = { by: call.agent, at: Date.now() }
    })
    await whenSaved(f)
    return { asked: `hint ${level + 1} of ${round.puzzle.hintCount}`, ...(await tellHost(f, before, '海龟汤的玩家要一条提示')) }
  }),
}

export const give_up = {
  description:
    'Vote to give up a 海龟汤 round and see the solution (undo: take your vote back). The host reveals it once a ' +
    'majority of the players voted.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND, undo: { type: 'boolean' } } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    const round = f.data
    requirePlayer(round, call.agent)
    if (args.undo) {
      if (!round.giveUp?.[call.agent]) throw new Error('you have not voted to give up')
      delete f.data.giveUp[call.agent]
      await whenSaved(f)
      return { votes: Object.keys(f.data.giveUp).length, needed: giveUpNeeded(f.data) }
    }
    if (round.giveUp?.[call.agent]) throw new Error('you voted to give up already')
    f.transact(() => {
      markAgent(f, call.agent)
      f.data.giveUp[call.agent] = Date.now()
    })
    await whenSaved(f)
    const votes = Object.keys(f.data.giveUp).length
    const needed = giveUpNeeded(f.data)
    const told = votes >= needed && f.data.status === 'playing'
      ? await whisper(f, [[f.data.host, `海龟汤「${f.data.puzzle.title}」的玩家投票放弃了，请揭晓汤底。`]]).then((n) => (n.length ? { host_not_told: n[0] } : {}))
      : {}
    return { votes, needed, ...told }
  }),
}
