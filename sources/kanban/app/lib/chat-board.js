// A chat's board: one file in the chat's folder, opened live with gugu.files — everyone in the chat, and their agents
// through the tools, see each other's changes as they land. The same core.applyOp as this computer's board; only where
// the board is kept differs. Used by the page (the browser) and by tools.js (Node) alike: `files` is that side's
// gugu.files.
import { applyOp, emptyBoard, newId } from './core.js'

export const BOARD_SUFFIX = '.board.json'
/** The default board of a source group/private chat. Gugu resolves topic addresses; other *.board.json stay separate. */
export const CHAT_BOARD_NAME = `协作看板${BOARD_SUFFIX}`

const findBoard = async (files, chat) =>
  (await files.list({ chat, folder: '' })).find((e) => e.type !== 'folder' && e.name === CHAT_BOARD_NAME) ?? null

/**
 * The chat's own board, made the first time anyone opens it there. Found by listing the chat's top folder (an entry is
 * how both a page and an agent's call may name a chat's file). Two making it at once: the host either refuses the
 * second (the folder's names are unique) or names it `协作看板 (2).board.json` — either way the second removes what it
 * made, if anything, and opens the first.
 */
export async function openChatBoard(files, chat) {
  const found = await findBoard(files, chat)
  if (found) return filled(await files.open(found, { appData: true }))
  let made
  try {
    made = await files.create({ chat, name: CHAT_BOARD_NAME }, emptyBoard(), { appData: true })
  } catch (error) {
    const theirs = await findBoard(files, chat)
    if (!theirs) throw error
    return filled(await files.open(theirs, { appData: true }))
  }
  if (made.name === CHAT_BOARD_NAME) return filled(await files.open(made, { appData: true }))
  await files.remove(made)
  const theirs = await findBoard(files, chat)
  if (!theirs) throw new Error(`${CHAT_BOARD_NAME} was made as ${made.name} and the board it gave way to is gone`)
  return filled(await files.open(theirs, { appData: true }))
}

/**
 * An open board file as a board. Opened in a chat, gugu makes the board this App names (`chatFile`, App API 14) before
 * the page runs, and makes it empty (`{}`): the first to open it writes the empty board, and two doing so at once write
 * the same one.
 */
export function filled(f) {
  if (!f.data.columns) f.transact(() => Object.assign(f.data, emptyBoard()))
  return f
}

/** One operation on a board file, as one change everyone receives whole. Refused: throws, nothing written. */
export function applyToFile(f, op, by) {
  let result
  f.transact(() => {
    result = applyOp(f.data, op, { by, now: new Date().toISOString(), id: newId })
  })
  return result
}

/** Resolves once the server has every change made to `f`; a program's call ends only then, so its write is not lost. */
export function whenSaved(f, ms = 15_000) {
  if (f.saved) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off()
      reject(new Error(`the board file was not saved within ${ms / 1000} s (it is ${f.status})`))
    }, ms)
    const off = f.onStatus(() => {
      if (!f.saved) return
      clearTimeout(timer)
      off()
      resolve()
    })
  })
}
