import { test } from 'node:test'
import assert from 'node:assert/strict'
import { followRounds } from '../app/rounds.js'

const CHAT = 'chat:g'
const round = (id, at, name = `r${id}`) => ({ id, chat: CHAT, name: `${name}.turtle-soup.json`, type: 'file', updatedAt: new Date(at).toISOString() })

/** A chat's files as gugu.files gives them to one page: list once; onChanged fires what the host sends. */
function chatFiles(listed) {
  const handlers = new Set()
  let release
  const held = new Promise((resolve) => { release = resolve })
  return {
    calls: [],
    list(place) { this.calls.push(['list', place]); return held.then(() => listed) },
    onChanged(place, fn) {
      this.calls.push(['onChanged', place])
      handlers.add(fn)
      return () => handlers.delete(fn)
    },
    send: (change) => { for (const fn of handlers) fn(change) },
    answerList: () => release(),
    get watching() { return handlers.size },
  }
}

function follow(files) {
  const draws = []
  const f = followRounds(files, CHAT, (rounds, changed) => draws.push({ ids: rounds.map((r) => r.id), changed: changed.map((r) => r.id) }))
  return { ...f, draws, last: () => draws.at(-1) }
}

test('a round another member starts shows in an open lobby at once, without listing again', async () => {
  const files = chatFiles([round('a', 1)])
  const lobby = follow(files)
  files.answerList()
  await lobby.ready
  assert.deepEqual(lobby.last(), { ids: ['a'], changed: ['a'] })
  // Member B starts a round: the chat's file change reaches member A's page.
  files.send({ kind: 'entries', entries: [round('b', 2)], gone: [] })
  assert.deepEqual(lobby.last(), { ids: ['b', 'a'], changed: ['b'] })
  assert.deepEqual(files.calls.filter(([k]) => k === 'list').length, 1)
  assert.deepEqual(files.calls.find(([k]) => k === 'onChanged'), ['onChanged', { chat: CHAT }])
})

test('a round that changes is handed back to be read again; one deleted goes; other files are no rounds', async () => {
  const files = chatFiles([round('a', 1), round('b', 2)])
  const lobby = follow(files)
  files.answerList()
  await lobby.ready
  files.send({ kind: 'entries', entries: [round('a', 3), { id: 'n', chat: CHAT, name: 'notes.md', type: 'file', updatedAt: 'x' }], gone: [] })
  assert.deepEqual(lobby.last(), { ids: ['a', 'b'], changed: ['a'] })
  files.send({ kind: 'entries', entries: [], gone: ['b'] })
  assert.deepEqual(lobby.last(), { ids: ['a'], changed: [] })
  const drawn = lobby.draws.length
  files.send({ kind: 'entries', entries: [{ id: 'n', chat: CHAT, name: 'notes.md', type: 'file' }], gone: [] })
  assert.equal(lobby.draws.length, drawn, 'a change to no round draws nothing')
})

test('a round started while the list is on its way is kept, and the list brings back none already gone', async () => {
  const files = chatFiles([round('a', 1), round('old', 0)])
  const lobby = follow(files)
  files.send({ kind: 'entries', entries: [round('b', 2)], gone: ['old'] })
  files.answerList()
  await lobby.ready
  assert.deepEqual(lobby.last(), { ids: ['b', 'a'], changed: ['a'] })
})

test('stopping lets the chat go: no more draws', async () => {
  const files = chatFiles([])
  const lobby = follow(files)
  files.answerList()
  await lobby.ready
  lobby.stop()
  assert.equal(files.watching, 0)
  const drawn = lobby.draws.length
  files.send({ kind: 'entries', entries: [round('b', 2)], gone: [] })
  assert.equal(lobby.draws.length, drawn)
})
