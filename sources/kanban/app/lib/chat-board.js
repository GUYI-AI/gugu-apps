// A chat's board: one file in the chat's folder, opened live with gugu.files — everyone in the chat, and their agents
// through the tools, see each other's changes as they land. The same core.applyOp as this computer's board; only where
// the board is kept differs. Used by the page (the browser) and by tools.js (Node) alike: `files` is that side's
// gugu.files.
import { applyOp, emptyBoard, newId } from './core.js'

export const BOARD_SUFFIX = '.board.json'
/** The board a chat gets when its 协作看板 is first opened there. Any other *.board.json in a chat opens the same way. */
export const CHAT_BOARD_NAME = `协作看板${BOARD_SUFFIX}`

/**
 * The chat's own board, made the first time anyone opens it there. Found by listing the chat's top folder: an entry is
 * how both a page and an agent's call may name a chat's file.
 */
export async function openChatBoard(files, chat) {
  const found = (await files.list({ chat, folder: '' })).find((e) => e.type !== 'folder' && e.name === CHAT_BOARD_NAME)
  return files.open(found ?? (await files.create({ chat, name: CHAT_BOARD_NAME }, emptyBoard())))
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
