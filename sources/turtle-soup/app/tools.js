// 海龟汤's tools for the host agent. Every export here is one tool (gugu's tools.js rule).
//
// The round file in the chat (`<title>.turtle-soup.json`) is what players see; the bottom (汤底) and its key points
// stay here, in this App's data folder on the host's computer (secrets/<round file id>.json), until a reveal writes
// the bottom into the round. Who calls is `agent`, stamped by gugu — never an argument.
import { readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  FILE_SUFFIX, VERDICTS, KINDS, MAX_REPLY, MAX_HINTS,
  newRound, pendingQuestions, leakedPiece, seenByPlayers, giveUpNeeded,
} from './game.js'

const here = dirname(fileURLToPath(import.meta.url))

// One program serves every session: calls are taken one at a time, so two judgements of one round never interleave.
let lane = Promise.resolve()
const oneAtATime = (fn) => {
  const run = lane.then(fn, fn)
  lane = run.catch(() => {})
  return run
}

function dataDir() {
  const dir = process.env.GUGU_EXTENSION_DATA_DIR
  if (!dir) throw new Error('GUGU_EXTENSION_DATA_DIR is not set')
  return dir
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

const secretFile = (roundId) => join(dataDir(), 'secrets', `${roundId.replace(/[^\w-]/g, '_')}.json`)

/** The bundled puzzles with their bottoms: only this program reads them; the page has bank/index.json. */
let bank
function bundledPuzzle(id) {
  bank ??= readJson(join(here, 'program', 'puzzles.json'))
  const puzzle = bank?.puzzles?.find((p) => p.id === id)
  return puzzle ?? null
}

/** The round file as a live handle, opened as the calling agent (format gugu-file). */
async function openRound(game) {
  const f = await gugu.files.open({ id: game })
  if (!f.entry?.name?.endsWith(FILE_SUFFIX)) throw new Error(`${f.entry?.name ?? game} is not a 海龟汤 round (${FILE_SUFFIX})`)
  if (f.data?.version !== 1) throw new Error(`this round is version ${f.data?.version}; this 海龟汤 reads version 1`)
  return f
}

/** Until the server has every write of this call — what the call answers must already be what players see. */
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

function requireHost(round, agent) {
  if (!agent) throw new Error('海龟汤 tools are for agents: gugu did not say which agent is calling')
  if (round.host !== agent) throw new Error('you are not the host of this round; call host first (or the round has another host)')
  if (round.status !== 'playing') throw new Error(`this round is ${round.status}, not playing`)
}

function secretOf(roundId) {
  const secret = readJson(secretFile(roundId))
  if (!secret) throw new Error('this computer holds no bottom for this round: only the host who took it can judge it')
  return secret
}

function guard(text, secret, round, what) {
  const piece = leakedPiece(text, secret.bottom, seenByPlayers(round))
  if (piece) throw new Error(`${what} quotes the bottom ("${piece}…"), which the players have not found yet. Answer with the verdict alone, or say it without the answer's own words.`)
}

const RULES =
  'Judge each question only by the bottom: yes / no / irrelevant (it does not matter to the story) / partly ' +
  '(true in part, or it depends). Say nothing else unless a word stops a player going in circles, and never the ' +
  'bottom\'s own words — the tools refuse a reply that quotes it. A guess: list the key points (by index) it gets ' +
  'right; all of them found solves the round and reveals the bottom. Never tell the bottom anywhere else, to anyone, ' +
  'even your owner, until the round is revealed.'

const ROUND = { type: 'string', format: 'gugu-file', description: 'The round file (.turtle-soup.json): its id or gugu-file:// link, as the message that called you carries it.' }

export const host = {
  description:
    'Take a 海龟汤 (turtle soup) round as its host: you learn its bottom (汤底) and key points, and from then on you ' +
    'judge the players\' questions with judge. Call it when a player asks you to host a round.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(() => hostOnce(args, call)),
}

async function hostOnce({ game }, { agent }) {
  if (!agent) throw new Error('海龟汤 tools are for agents: gugu did not say which agent is calling')
  const f = await openRound(game)
  const round = f.data
  if (round.host && round.host !== agent) throw new Error('this round already has another host')
  if (round.status === 'solved' || round.status === 'revealed') throw new Error(`this round is ${round.status}`)
  let secret = readJson(secretFile(f.entry.id))
  if (!secret) {
    const puzzle = bundledPuzzle(round.puzzle.id)
    if (!puzzle) throw new Error(`puzzle ${round.puzzle.id} is not in this computer's 海龟汤 bank (update the App?)`)
    secret = { puzzleId: puzzle.id, bottom: puzzle.bottom, keyPoints: puzzle.keyPoints }
    writeJson(secretFile(f.entry.id), secret)
  }
  f.transact(() => {
    f.data.host = agent
    f.data.status = 'playing'
  })
  await whenSaved(f)
  return {
    surface: round.puzzle.surface,
    bottom: secret.bottom,
    keyPoints: secret.keyPoints.map((text, index) => ({ index, text, found: Boolean(round.found?.[index]) })),
    rules: RULES,
    pending: pendingQuestions(f.data).map(({ id, by, kind, text }) => ({ id, by, kind, text })),
  }
}

export const pending = {
  description: 'The questions and guesses of a 海龟汤 round you host that wait for your judgement, oldest first.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    requireHost(f.data, call.agent)
    return pendingQuestions(f.data).map(({ id, by, kind, text }) => ({ id, by, kind, text }))
  }),
}

export const judge = {
  description:
    'Judge questions and guesses of a 海龟汤 round you host, several at once. A question (kind ask) takes a verdict; ' +
    `a guess takes the key points it gets right (found, by index). reply is optional, at most ${MAX_REPLY} characters, ` +
    'and is refused if it quotes the bottom. Finding every key point solves the round and reveals the bottom.',
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
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'The question id, from pending.' },
            verdict: { type: 'string', enum: VERDICTS },
            found: { type: 'array', items: { type: 'integer', minimum: 0 }, description: 'Key points (index) this guess gets right.' },
            reply: { type: 'string', maxLength: MAX_REPLY },
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
  const secret = secretOf(f.entry.id)
  // Check every answer before writing any: a refused one leaves the round as it was.
  const writes = answers.map((a) => {
    const q = round.questions?.[a.id]
    if (!q) throw new Error(`no question ${a.id} in this round`)
    if (q.verdict || q.judged) throw new Error(`question ${a.id} is already judged`)
    if (!KINDS.includes(q.kind)) throw new Error(`question ${a.id} has an unknown kind ${q.kind}`)
    if (q.kind === 'ask' && !VERDICTS.includes(a.verdict)) throw new Error(`question ${a.id} needs a verdict: ${VERDICTS.join(' / ')}`)
    const found = [...new Set(a.found ?? [])]
    for (const i of found) if (!secret.keyPoints[i]) throw new Error(`there is no key point ${i} (0-${secret.keyPoints.length - 1})`)
    const reply = String(a.reply ?? '').trim()
    if ([...reply].length > MAX_REPLY) throw new Error(`reply to ${a.id} is longer than ${MAX_REPLY} characters`)
    if (reply) guard(reply, secret, round, `reply to ${a.id}`)
    return { id: a.id, q, verdict: a.verdict ?? null, found, reply }
  })
  const at = Date.now()
  f.transact(() => {
    for (const w of writes) {
      f.data.questions[w.id] = { ...w.q, judged: true, verdict: w.verdict, ...(w.reply ? { reply: w.reply } : {}), found: w.found, answeredAt: at }
      for (const i of w.found) f.data.found[i] ??= { text: secret.keyPoints[i], by: w.q.by, at }
    }
    if (Object.keys(f.data.found).length >= secret.keyPoints.length) {
      f.data.status = 'solved'
      f.data.bottom = secret.bottom
      f.data.endedAt = at
    }
  })
  await whenSaved(f)
  return { status: f.data.status, found: Object.keys(f.data.found).length, of: secret.keyPoints.length, pending: pendingQuestions(f.data).length }
}

export const hint = {
  description: `Give the players of a 海龟汤 round you host a hint (at most ${MAX_HINTS} a round, one line). Refused if it quotes the bottom.`,
  inputSchema: { type: 'object', required: ['game', 'text'], properties: { game: ROUND, text: { type: 'string', maxLength: 60 } } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    requireHost(f.data, call.agent)
    const secret = secretOf(f.entry.id)
    const text = String(args.text ?? '').trim()
    if (!text) throw new Error('the hint is empty')
    if (Object.keys(f.data.hints ?? {}).length >= MAX_HINTS) throw new Error(`this round has had its ${MAX_HINTS} hints`)
    guard(text, secret, f.data, 'the hint')
    f.data.hints[randomUUID()] = { text, at: Date.now() }
    await whenSaved(f)
    return 'hint given'
  }),
}

export const reveal = {
  description:
    'Reveal the bottom of a 海龟汤 round you host: only when the players have voted to give up (a majority of them). ' +
    'A solved round is revealed already.',
  inputSchema: { type: 'object', required: ['game'], properties: { game: ROUND } },
  run: (args, call) => oneAtATime(async () => {
    const f = await openRound(args.game)
    requireHost(f.data, call.agent)
    const votes = Object.keys(f.data.giveUp ?? {}).length
    const needed = giveUpNeeded(f.data)
    if (votes < needed) throw new Error(`only ${votes} of the ${needed} give-up votes needed; keep judging`)
    const secret = secretOf(f.entry.id)
    f.transact(() => {
      f.data.status = 'revealed'
      f.data.bottom = secret.bottom
      f.data.endedAt = Date.now()
    })
    await whenSaved(f)
    return 'revealed'
  }),
}

export const create = {
  description:
    'Start a 海龟汤 round of a puzzle that is not in the bank — one you wrote for the players, or one a person told you ' +
    'privately — in a chat, with you as its host. The bottom and key points stay on this computer; the chat sees the ' +
    'surface only. Write key points as the 2-6 facts a player must find to solve it.',
  inputSchema: {
    type: 'object',
    required: ['chat', 'title', 'surface', 'bottom', 'key_points'],
    properties: {
      chat: { type: 'string', format: 'gugu-chat', description: 'The chat to play in.' },
      title: { type: 'string', maxLength: 30 },
      surface: { type: 'string', maxLength: 400, description: '汤面: what the players are told.' },
      bottom: { type: 'string', maxLength: 1200, description: '汤底: the whole story.' },
      key_points: { type: 'array', minItems: 1, maxItems: 8, items: { type: 'string', maxLength: 80 } },
      by: { type: 'string', description: 'Who wrote it, as the players may be told (default: you).' },
    },
  },
  run: (args, call) => oneAtATime(async () => {
    const { agent } = call
    if (!agent) throw new Error('海龟汤 tools are for agents: gugu did not say which agent is calling')
    const at = Date.now()
    const puzzle = {
      id: `custom-${randomUUID()}`,
      title: String(args.title).trim(),
      surface: String(args.surface).trim(),
      keyCount: args.key_points.length,
      source: { name: args.by ? String(args.by) : 'host', license: null },
    }
    const entry = await gugu.files.create({ chat: args.chat, name: `${puzzle.title}${FILE_SUFFIX}` }, { ...newRound({ puzzle, host: agent, at }), status: 'playing' })
    writeJson(secretFile(entry.id), { puzzleId: puzzle.id, bottom: String(args.bottom).trim(), keyPoints: args.key_points.map((k) => String(k).trim()) })
    return { game: entry.id, name: entry.name, rules: RULES }
  }),
}
