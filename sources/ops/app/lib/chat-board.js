// Same live group-file mechanism as Teamboard. API 39's ifExists makes first creation atomic by name.
import { emptyBoard, asBoard } from './core.js'
export const FILE_NAME = '运维台账.ops.json'
export async function findBoard(files, chat) {
  return (await files.list({ chat, folder: '' })).find((e) => e.type !== 'folder' && e.name === FILE_NAME) ?? null
}
export async function openBoard(files, chat, create = false) {
  const entry = await findBoard(files, chat)
  if (entry) return files.open({ chat, id: entry.id })
  if (!create) return null
  const made = await files.create({ chat, name: FILE_NAME }, emptyBoard(), { ifExists: 'use' })
  return files.open({ chat, id: made.id })
}
export function mutate(f, apply) {
  const current = asBoard(f.toJSON())
  apply(JSON.parse(JSON.stringify(current)))
  let result
  f.transact(() => {
    if (!f.data.version) Object.assign(f.data, emptyBoard())
    result = apply(f.data)
  })
  return result
}
// Borrowed from Teamboard: the tool must not return before its live-file write reaches the server.
export function whenSaved(f, ms = 15_000) {
  if (f.saved) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { off(); reject(new Error(`Ledger not saved (${f.status})`)) }, ms)
    const off = f.onStatus(() => { if (f.saved) { clearTimeout(timer); off(); resolve() } })
  })
}
