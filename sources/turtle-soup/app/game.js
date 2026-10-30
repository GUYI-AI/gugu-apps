// 海龟汤's rules, shared by the page (main.js), the host's tools (tools.js) and the bank script. Pure: no gugu, no Node.
//
// A round lives in the chat's folder as `<title>.turtle-soup.json`. Everyone in the chat can read it, so it holds only
// what players may see: the puzzle's public part, the questions with their verdicts, the hints given, and the
// solution (汤底) once the round is over. The rest of the puzzle — solution, facts, hints not yet given — stays with
// the host: in its App data folder (tools.js) and the host agent's own context.

export const FILE_SUFFIX = '.turtle-soup.json'
/** A question's verdicts: a host picks one, never writes words of its own (no free text to leak through). */
export const ASK_VERDICTS = ['yes', 'no', 'irrelevant', 'partly', 'unclear']
/** A guess at the whole story: solved only with every required fact (tools.js checks). */
export const GUESS_VERDICTS = ['solved', 'close', 'wrong']
export const VERDICT_LABEL = { yes: '是', no: '不是', irrelevant: '无关', partly: '是也不是', unclear: '请换个问法', solved: '还原成功', close: '接近', wrong: '方向不对' }
export const DIFFICULTY_LABEL = { easy: '简单', medium: '中等', hard: '困难' }
export const STATUS_LABEL = { waiting: '等主持', playing: '进行中', solved: '已还原', revealed: '看了汤底' }
export const MAX_QUESTION = 120
export const MAX_GUESS = 400
export const MAX_HINTS = 3

/** What of a puzzle players may see before the end: the bank's page index and a new round both take this. */
export function publicOf(puzzle) {
  return {
    id: puzzle.id,
    lang: puzzle.lang,
    title: puzzle.title,
    surface: puzzle.surface,
    difficulty: puzzle.difficulty,
    tags: puzzle.tags ?? [],
    requiredCount: puzzle.facts.filter((f) => f.required).length,
    hintCount: Math.min(puzzle.hints?.length ?? 0, MAX_HINTS),
    source: puzzle.source,
  }
}

/** A new round's file content. `puzzle` is its public part (publicOf). */
export function newRound({ puzzle, host, at }) {
  return {
    version: 1,
    puzzle,
    host,
    startedAt: at,
    status: 'waiting',
    questions: {},
    hints: {},
    hintAsks: {},
    giveUp: {},
    bottom: null,
    solvedBy: null,
    endedAt: null,
  }
}

export const ended = (round) => round.status === 'solved' || round.status === 'revealed'

/** The questions and guesses in the order they were asked. */
export function questionsInOrder(round) {
  return Object.entries(round.questions ?? {})
    .map(([id, q]) => ({ id, ...q }))
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0) || (a.id < b.id ? -1 : 1))
}

/** Questions and guesses still waiting for the host. */
export const pendingQuestions = (round) => questionsInOrder(round).filter((q) => !q.verdict)

/** How many hints have been given; the next one's level is this number. */
export const hintsGiven = (round) => Object.keys(round.hints ?? {}).length

/** A hint asked for and not given yet. */
export const hintWaiting = (round) => Boolean(round.hintAsks?.[hintsGiven(round)]) && hintsGiven(round) < round.puzzle.hintCount

/** Something waits for the host: a question or guess not judged, or a hint asked for. Whoever adds to that wakes it. */
export const somethingWaits = (round) => pendingQuestions(round).length > 0 || hintWaiting(round)

/** This player's question or guess still waiting for the host: an agent player has one at a time. */
export const waitingFrom = (round, who) => pendingQuestions(round).find((q) => q.by === who) ?? null

export function checkQuestion(kind, text) {
  const line = String(text ?? '').trim()
  if (!line) throw new Error(kind === 'guess' ? '还原是空的' : '问题是空的')
  const max = kind === 'guess' ? MAX_GUESS : MAX_QUESTION
  if ([...line].length > max) throw new Error(`${kind === 'guess' ? '还原' : '问题'}最多 ${max} 字`)
  return line
}

/** Players: everyone who asked, guessed or voted to give up — never the host. */
export function playersOf(round) {
  const ids = new Set(Object.keys(round.giveUp ?? {}))
  for (const q of Object.values(round.questions ?? {})) ids.add(q.by)
  ids.delete(round.host)
  return [...ids]
}

/** Give-up votes needed to reveal: a majority of the players (one when playing alone). */
export const giveUpNeeded = (round) => Math.floor(playersOf(round).length / 2) + 1

/** Questions asked so far (guesses at the story not counted). */
export const askedCount = (round) => Object.values(round.questions ?? {}).filter((q) => q.kind === 'ask').length

/** A round as a line in the lobby's history: what anyone in the chat may see of it, nothing of the solution. */
export function summaryOf(round) {
  return {
    title: round.puzzle?.title ?? '',
    status: round.status,
    asked: askedCount(round),
    players: playersOf(round),
    host: round.host,
  }
}
