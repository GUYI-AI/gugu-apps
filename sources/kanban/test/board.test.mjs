import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { emptyBoard, applyOp } from '../app/lib/core.js'

const html = await readFile(new URL('../app/board.html', import.meta.url), 'utf8')

for (const code of ['denied', 'not-found', null]) {
  test(`Open beside shows the host's ${code ?? 'successful'} result`, async () => {
    const { window, document } = parseHTML(html)
    document.hasFocus = () => false
    const board = emptyBoard()
    let n = 0
    const by = { by: 'person', now: '2026-10-25T00:00:00.000Z', id: () => `id${++n}` }
    const { card } = applyOp(board, { type: 'card.create', title: 'Read attachment' }, by)
    applyOp(board, { type: 'link.add', card, link: { kind: 'chatfile', file: 'attachment', name: 'notes.txt' } }, by)
    const calls = []
    const reason = code === 'denied' ? 'filesOpenWith needs a gesture from the person' : 'The linked file is no longer accessible'
    window.gugu = {
      getContext: async () => ({ locale: 'en', file: { id: 'board' }, chat: { id: 'chat', name: 'Chat', members: [] } }),
      onContextChanged() {},
      onCommand() {},
      getAppState: async () => null,
      setTabBadge: async () => {},
      files: {
        open: async () => ({
          entry: { id: 'board', chat: 'chat' }, data: board, toJSON: () => structuredClone(board),
          presence: { self: { userId: 'person' } }, onChange() {}, onStatus() {}, close() {},
        }),
        async openWith(...args) {
          calls.push(args)
          if (code) throw Object.assign(new Error(reason), { code })
        },
      },
    }
    globalThis.window = window
    globalThis.document = document
    try {
      await import(`../app/board.js?open-beside=${code}`)
      document.querySelector(`[data-card="${card}"]`).click()
      const button = [...document.querySelectorAll('#drawer button')].find((el) => el.textContent === 'Open beside')
      assert.ok(button)
      button.click()
      await new Promise(setImmediate)
      assert.deepEqual(calls, [[{ id: 'attachment' }, { peek: true }]])
      const alert = document.getElementById('alert')
      assert.equal(alert.parentElement.id, 'drawer', 'the card stays visible when the narrow layout hides #main')
      assert.equal(alert.hidden, !code)
      if (code) assert.equal(alert.textContent, reason)
      document.querySelector('#drawer .head button').click()
      assert.equal(alert.parentElement.id, 'main')
      if (code) assert.equal(alert.textContent, reason)
    } finally {
      delete globalThis.window
      delete globalThis.document
    }
  })
}
