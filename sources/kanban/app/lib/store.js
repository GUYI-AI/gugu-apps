// The board on disk (Node, for tools.js): board.json in the App's data folder, written only here and one write at a
// time — the pages' changes (through the background page) and the agents' tool calls go through the same queue, so
// none overwrites another half-way.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { BOARD_VERSION, applyOp, emptyBoard, newId } from './core.js'

const FILE = 'board.json'

function dir() {
  const d = process.env.GUGU_EXTENSION_DATA_DIR
  if (!d) throw new Error('GUGU_EXTENSION_DATA_DIR is not set: this program only runs under gugu')
  return d
}

export async function readBoard() {
  let raw
  try {
    raw = await readFile(path.join(dir(), FILE), 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyBoard()
    throw new Error(`协作看板 could not read ${FILE}: ${error.message}`)
  }
  const board = JSON.parse(raw)
  if (board.version !== BOARD_VERSION) throw new Error(`${FILE} is version ${board.version}; this 协作看板 reads ${BOARD_VERSION}`)
  return board
}

async function writeBoard(board) {
  await mkdir(dir(), { recursive: true })
  const file = path.join(dir(), FILE)
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`
  await writeFile(tmp, JSON.stringify(board))
  await rename(tmp, file)
}

let lane = Promise.resolve()
const oneAtATime = (fn) => {
  const run = lane.then(fn, fn)
  lane = run.catch(() => {})
  return run
}

/** Apply one operation and save; resolves { rev, board, result }. A refused operation saves nothing. */
export function apply(op, by) {
  return oneAtATime(async () => {
    const board = await readBoard()
    const result = applyOp(board, op, { by, now: new Date().toISOString(), id: newId })
    board.rev += 1
    await writeBoard(board)
    return { rev: board.rev, board, result }
  })
}

/** The board as it is now, read in the same queue as the writes (never between a write's read and its save). */
export const snapshot = () => oneAtATime(readBoard)

/** The background page's list of this computer's tasks (agents.json), or null when it has not written one yet. */
export async function readAgentsSnapshot() {
  try {
    return JSON.parse(await readFile(path.join(dir(), 'agents.json'), 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw new Error(`协作看板 could not read agents.json: ${error.message}`)
  }
}
