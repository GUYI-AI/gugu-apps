// 海龟汤's rules, shared by the page (main.js) and the host's tools (tools.js). Pure: no gugu, no Node.
//
// A round lives in the chat's folder as `<title>.turtle-soup.json` — everyone in the chat can read it, so it holds
// only what players may see: the surface (汤面), the questions with their verdicts, the key points found so far,
// and the bottom (汤底) once it is revealed. The unrevealed bottom stays with the host: in its App data folder
// (tools.js) and in the host agent's own context.

export const FILE_SUFFIX = '.turtle-soup.json'
export const VERDICTS = ['yes', 'no', 'irrelevant', 'partly']
export const VERDICT_LABEL = { yes: '是', no: '不是', irrelevant: '无关', partly: '是也不是' }
export const KINDS = ['ask', 'guess']
export const MAX_QUESTION = 120
export const MAX_REPLY = 40
export const MAX_HINTS = 3

/** A new round's file content: what the page writes when someone starts a game. */
export function newRound({ puzzle, host, at }) {
  return {
    version: 1,
    puzzle: {
      id: puzzle.id,
      title: puzzle.title,
      surface: puzzle.surface,
      difficulty: puzzle.difficulty ?? null,
      tags: puzzle.tags ?? [],
      keyCount: puzzle.keyCount ?? puzzle.keyPoints?.length ?? 0,
      source: puzzle.source ?? null,
    },
    host,
    startedAt: at,
    status: 'waiting',
    questions: {},
    found: {},
    hints: {},
    giveUp: {},
    bottom: null,
    endedAt: null,
  }
}

/** The questions in the order they were asked. */
export function questionsInOrder(round) {
  return Object.entries(round.questions ?? {})
    .map(([id, q]) => ({ id, ...q }))
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0) || (a.id < b.id ? -1 : 1))
}

/** Questions still waiting for the host. */
export function pendingQuestions(round) {
  return questionsInOrder(round).filter((q) => !q.verdict && !q.judged)
}

export function checkQuestion(text) {
  const line = String(text ?? '').trim()
  if (!line) throw new Error('问题是空的')
  if ([...line].length > MAX_QUESTION) throw new Error(`问题最多 ${MAX_QUESTION} 字`)
  return line
}

// Letters, digits and CJK only, lower-cased: punctuation and spacing never decide whether two texts share words.
const norm = (text) => String(text ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

/** How long a run of the bottom's own characters may appear in a reply before it counts as quoting it. */
export const LEAK_RUN = 5

/**
 * The piece of `bottom` that `reply` quotes and the players have not seen yet, or null.
 *
 * A host answer, a hint or a judged guess is checked here before it is written: a run of LEAK_RUN characters of the
 * bottom that is in the reply, but in nothing the players already have (the surface, their own questions, the key
 * points they found), is the host giving the answer away. Not a classifier: one fixed rule, said in the error.
 */
export function leakedPiece(reply, bottom, seen) {
  const r = norm(reply)
  const b = norm(bottom)
  const known = norm(seen.join('\n'))
  const chars = [...r]
  for (let i = 0; i + LEAK_RUN <= chars.length; i++) {
    const piece = chars.slice(i, i + LEAK_RUN).join('')
    if (b.includes(piece) && !known.includes(piece)) return piece
  }
  return null
}

/** Everything the players of a round can already see — what a reply may repeat. */
export function seenByPlayers(round) {
  return [
    round.puzzle?.surface ?? '',
    round.puzzle?.title ?? '',
    ...questionsInOrder(round).map((q) => q.text),
    ...Object.values(round.found ?? {}).map((k) => k.text),
    ...Object.values(round.hints ?? {}).map((h) => h.text),
  ]
}

/** Players: everyone who asked or voted to give up, by id. */
export function playersOf(round) {
  const ids = new Set(Object.keys(round.giveUp ?? {}))
  for (const q of Object.values(round.questions ?? {})) ids.add(q.by)
  ids.delete(round.host)
  return [...ids]
}

/** Give-up votes needed to reveal: a majority of the players (one when playing alone). */
export function giveUpNeeded(round) {
  return Math.floor(playersOf(round).length / 2) + 1
}
