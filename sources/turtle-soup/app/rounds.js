// A chat's rounds as the lobby shows them, kept current from the chat's own file changes (gugu.files.onChanged) — a
// round someone else starts appears without a reload, one that ends shows it, one deleted goes. No DOM, no window.gugu:
// the page hands in `gugu.files`, a test a stand-in.
import { FILE_SUFFIX } from './game.js'

export const isRound = (entry) => entry.type !== 'folder' && entry.name.endsWith(FILE_SUFFIX)
const newestFirst = (a, b) => String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt))

/**
 * Lists the chat's rounds once and follows its changes from then on. `draw(rounds, changed)` gets every round, newest
 * first, and the entries that are new or changed since the last call (all of them the first time). Subscribed before
 * the list is read, so a round started meanwhile is not missed; the list never brings back one already gone.
 * Returns `{ stop, ready }`: `ready` settles once the first list is drawn (it rejects when the list cannot be read).
 */
export function followRounds(files, chat, draw) {
  const rounds = new Map()
  const gone = new Set()
  let stopped = false
  const show = (changed) => { if (!stopped) draw([...rounds.values()].sort(newestFirst), changed) }
  const unsubscribe = files.onChanged({ chat }, (change) => {
    if (change?.kind !== 'entries') return // a chat sends its files as entries; nothing else names what changed
    const changed = []
    for (const id of change.gone ?? []) {
      gone.add(id)
      rounds.delete(id)
    }
    for (const entry of change.entries ?? []) {
      if (isRound(entry)) {
        rounds.set(entry.id, entry)
        changed.push(entry)
      } else rounds.delete(entry.id) // renamed away from a round's suffix
    }
    if (changed.length || change.gone?.length) show(changed)
  })
  const ready = files.list({ chat }).then((entries) => {
    const listed = entries.filter((e) => isRound(e) && !rounds.has(e.id) && !gone.has(e.id))
    for (const entry of listed) rounds.set(entry.id, entry)
    show(listed)
  })
  return {
    ready,
    stop() {
      stopped = true
      unsubscribe()
    },
  }
}
