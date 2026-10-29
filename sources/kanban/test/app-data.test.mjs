import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHAT_BOARD_NAME, openChatBoard } from '../app/lib/chat-board.js'
import { emptyBoard } from '../app/lib/core.js'

for (const exists of [false, true]) {
  test(`${exists ? 'existing' : 'new'} chat board explicitly opts into App data`, async () => {
    const entry = { id: 'board-id', chat: 'group-id', name: CHAT_BOARD_NAME, type: 'json' }
    const calls = []
    const files = {
      list: async () => exists ? [entry] : [],
      async create(target, content, options) {
        calls.push(['create', target, content, options])
        return entry
      },
      async open(ref, options) {
        calls.push(['open', ref, options])
        return { entry, data: emptyBoard() }
      },
    }
    const opened = await openChatBoard(files, 'group-id')
    assert.equal(opened.entry.id, 'board-id')
    assert.deepEqual(calls.at(-1), ['open', entry, { appData: true }])
    if (!exists) {
      assert.deepEqual(calls[0].slice(0, 2), ['create', { chat: 'group-id', name: CHAT_BOARD_NAME }])
      assert.deepEqual(calls[0][3], { appData: true })
    }
  })
}
