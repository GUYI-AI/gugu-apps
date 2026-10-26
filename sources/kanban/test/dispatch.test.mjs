import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { emptyBoard, applyOp } from '../app/lib/core.js'

const html = await readFile(new URL('../app/board.html', import.meta.url), 'utf8')
const settled = () => new Promise(setImmediate)

for (const background of [false, true]) {
  test(`task actions and live status use the host directly ${background ? 'with' : 'without'} a background page`, async () => {
    const { window, document } = parseHTML(html)
    document.hasFocus = () => false
    const board = emptyBoard()
    let n = 0
    const { card } = applyOp(board, { type: 'card.create', title: 'Handle this card' }, {
      by: 'person', now: '2026-10-26T00:00:00.000Z', id: () => `id${++n}`,
    })
    const row = { agentId: 'user:existing', sessionId: 'existing', title: 'Existing task', status: 'working' }
    const rows = [row]
    let agentsChanged, boardChanged, backgroundMessage
    let listError = null
    let dispatchError = null
    const sent = []
    const f = {
      entry: { id: 'board', chat: 'chat' }, data: board, toJSON: () => structuredClone(board),
      presence: { self: { userId: 'person' } }, onChange(fn) { boardChanged = fn }, onStatus() {}, close() {},
      transact(fn) { fn(); boardChanged({ local: true }) },
    }
    window.gugu = {
      getContext: async () => ({ locale: 'en', file: { id: 'board' }, chat: { id: 'chat', name: 'Chat', members: [] } }),
      onContextChanged() {}, onCommand() {}, getAppState: async () => null, setTabBadge: async () => {},
      listAgents: async () => { if (listError) throw new Error(listError); return rows },
      onAgentsChanged(fn) { agentsChanged = fn },
      async dispatch(...args) {
        sent.push(args)
        if (dispatchError) throw new Error(dispatchError)
        rows.push({ agentId: 'user:new', sessionId: 'new', title: 'New task', status: 'working' })
        await agentsChanged()
        return { to: { agent: 'user:new' } }
      },
      files: { open: async () => f },
      ...(background ? {
        onBackgroundMessage(fn) { backgroundMessage = fn },
        sendToBackground: async (message) => {
          assert.equal(message.type, 'hello', 'agent reads never go through the background page')
          backgroundMessage({ type: 'state', board: emptyBoard(), agents: [], failure: { agents: 'stale relay' } })
        },
      } : {}),
    }
    globalThis.window = window
    globalThis.document = document
    const button = (text, root = '#drawer') => [...document.querySelectorAll(`${root} button`)].find((el) => el.textContent === text)
    try {
      await import(`../app/board.js?dispatch=${background}`)
      document.querySelector(`[data-card="${card}"]`).click()
      await settled()
      assert.ok(button('New task'))
      button('Link task…').click()
      await settled()
      assert.match(document.querySelector('.picker').textContent, /Existing task/)
      button('Existing taskRunning').click()
      await settled()
      assert.equal(Object.values(board.cards[card].links)[0].session, 'existing')
      assert.equal(document.querySelector('#drawer .state').textContent, 'Running')

      row.status = 'needs_user'
      row.detail = 'approval'
      await agentsChanged()
      await settled()
      assert.equal(document.querySelector('#drawer .state').textContent, 'Awaiting approval')

      listError = 'Agent list refused'
      await agentsChanged()
      assert.match(document.getElementById('alert').textContent, /Unable to read task status: Agent list refused/)
      assert.equal(document.querySelector('#drawer .state'), null, 'unknown status is not drawn as a missing task')
      listError = null
      await agentsChanged()
      assert.equal(document.getElementById('alert').hidden, true)
      await settled()

      button('New task').click()
      await settled()
      await settled()
      assert.equal(sent.length, 1)
      assert.match(sent[0][0], /Handle this card/)
      assert.deepEqual(sent[0][1], { to: { new: true }, spawn: { title: 'Handle this card', chat: 'chat' } })
      assert.ok(Object.values(board.cards[card].links).some((link) => link.session === 'new' && link.agent === 'user:new'))
      assert.equal(board.columns[board.cards[card].column].role, 'doing')

      dispatchError = 'The selected computer is offline'
      button('New task').click()
      await settled()
      assert.equal(document.getElementById('alert').textContent, dispatchError)
      assert.equal(Object.values(board.cards[card].links).length, 2)
    } finally {
      delete globalThis.window
      delete globalThis.document
    }
  })
}
