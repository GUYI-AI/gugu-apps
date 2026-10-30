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

test('commands received before the first local board state execute once when it arrives', async () => {
  const { window, document } = parseHTML(html)
  document.hasFocus = () => false
  Object.defineProperty(document.getElementById('where'), 'value', { value: '', writable: true })
  const board = emptyBoard()
  let command, backgroundMessage
  const opened = []
  window.gugu = {
    getContext: async () => ({ locale: 'en' }),
    onContextChanged() {},
    onCommand(fn) { command = fn; fn('new'); fn('ignored'); fn('new') },
    onBackgroundMessage(fn) { backgroundMessage = fn },
    sendToBackground: async () => {},
    getAppState: async () => null,
    setTabBadge: async () => {},
    modal: { open: async (options) => { opened.push(options) } },
    files: { search: async () => [] },
  }
  globalThis.window = window
  globalThis.document = document
  try {
    await import('../app/board.js?opening-command')
    await new Promise(setImmediate)
    assert.equal(opened.length, 0, 'no dialog can open before there is a board')
    backgroundMessage({ type: 'state', board })
    assert.equal(opened.length, 2, 'both pending commands execute; unknown commands do not')
    assert.ok(opened.every((options) => options.data.newCard.column === Object.keys(board.columns)[0]))
    backgroundMessage({ type: 'state', board })
    assert.equal(opened.length, 2, 'later state updates never replay commands')
    command('new')
    assert.equal(opened.length, 3, 'a ready board still executes immediately')
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

async function openChatBoard(board, tag) {
  const changed = []
  const { window, document } = parseHTML(html)
  document.hasFocus = () => false
  window.gugu = {
    getContext: async () => ({ locale: 'en', file: { id: 'board' }, chat: { id: 'chat', name: 'Chat', members: [] } }),
    onContextChanged() {},
    onCommand() {},
    getAppState: async () => null,
    setTabBadge: async () => {},
    files: {
      open: async () => ({
        entry: { id: 'board', chat: 'chat' }, data: board, toJSON: () => structuredClone(board),
        presence: { self: { userId: 'person' } }, onChange(fn) { changed.push(fn) }, onStatus() {}, close() {},
        transact(fn) { fn(); for (const g of changed) g({ local: true }) },
      }),
    },
  }
  globalThis.window = window
  globalThis.document = document
  await import(`../app/board.js?${tag}`)
  return document
}

test('an empty board says so and offers a new card; Done invites a drop', async () => {
  try {
    const document = await openChatBoard(emptyBoard(), 'empty')
    const empty = document.getElementById('empty-board')
    assert.equal(empty?.tagName, 'GUGU-EMPTY')
    assert.equal(empty.querySelector('button.primary').textContent, 'New card')
    assert.equal(document.querySelector('section.col[data-role="done"] .drop-hint').textContent, 'Drop here to mark done')
    assert.deepEqual([...document.querySelectorAll('section.col > h2 small')].map((n) => n.textContent), ['0', '0', '0', '0'])
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

test('a task without an agent is named in text, with no icon the host does not have', async () => {
  const board = emptyBoard()
  let n = 0
  const by = { by: 'person', now: '2026-10-25T00:00:00.000Z', id: () => `id${++n}` }
  const { card } = applyOp(board, { type: 'card.create', title: 'Draft', column: 'done', links: [{ kind: 'task', session: 's1', title: 'Old task' }] }, by)
  try {
    const document = await openChatBoard(board, 'no-agent')
    assert.equal(document.getElementById('empty-board'), null)
    const shown = document.querySelector(`[data-card="${card}"]`)
    assert.ok(shown.closest('section.col[data-role="done"]'))
    assert.equal(shown.querySelector('.top gugu-icon').getAttribute('name'), 'check-circle-2', 'a done card carries the check')
    shown.click()
    await new Promise(setImmediate)
    const row = document.querySelector('#drawer .links li')
    assert.match(row.textContent, /Old task/)
    assert.equal(row.querySelector('gugu-icon[name="bot"], gugu-avatar'), null)
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

async function wideBoard(tag) {
  const board = emptyBoard()
  let n = 0
  const by = { by: 'person', now: '2026-10-25T00:00:00.000Z', id: () => `id${++n}` }
  const { card } = applyOp(board, { type: 'card.create', title: 'Carried', column: 'review' }, by)
  const document = await openChatBoard(board, tag)
  const { window } = globalThis
  Object.defineProperty(document.getElementById('shell'), 'clientWidth', { value: 1200 }) // wide: cards can be carried
  window.HTMLElement.prototype.getBoundingClientRect ??= function () { return { left: 0, top: 0, width: 240, height: 64 } }
  document.elementsFromPoint = () => []
  const pointer = (type, x, y) => Object.assign(new window.Event(type, { bubbles: true }), { button: 0, pointerType: 'mouse', pointerId: 1, clientX: x, clientY: y })
  const shown = () => document.querySelector(`[data-card="${card}"]`)
  /** One press on the card: down, optional moves, (something), up, then the click the browser sends at its end. */
  const press = async (moves, between = () => {}) => {
    const el = shown()
    el.dispatchEvent(pointer('pointerdown', 10, 10))
    for (const [x, y] of moves) el.dispatchEvent(pointer('pointermove', x, y))
    await between()
    el.dispatchEvent(pointer('pointerup', 40, 30))
    el.click()
    await new Promise(setImmediate)
  }
  return { board, card, document, window, press }
}

const clear = () => { delete globalThis.window; delete globalThis.document }

test('Esc cancels a carry, and its release — however long after — does not open the card', async () => {
  const realNow = Date.now
  try {
    const { board, card, document, window, press } = await wideBoard('esc-cancel')
    await press([[40, 30]], () => {
      assert.ok(document.querySelector('.card.lifted'), 'the card is carried')
      document.dispatchEvent(Object.assign(new window.Event('keydown', { bubbles: true }), { key: 'Escape' }))
      assert.equal(document.querySelector('.card.lifted'), null, 'Esc puts it down')
      const later = realNow() + 1500
      Date.now = () => later // released 1.5 s after Esc
    })
    assert.equal(document.getElementById('drawer').hidden, true, 'the card stays closed')
    assert.equal(board.cards[card].column, 'review')
    await press([])
    assert.equal(document.getElementById('drawer').hidden, false, 'the next plain click opens it')
  } finally {
    Date.now = realNow
    clear()
  }
})

test('a plain click opens the card; a carry dropped on Done moves it without opening it', async () => {
  try {
    const { board, card, document, press } = await wideBoard('carry-drop')
    await press([])
    assert.equal(document.getElementById('drawer').hidden, false, 'a press without a carry is a click')
    document.querySelector('#drawer .head button').click()
    assert.equal(document.getElementById('drawer').hidden, true)
    const done = document.querySelector('section.col[data-role="done"]')
    document.elementsFromPoint = () => [done]
    await press([[40, 30], [60, 40]])
    assert.equal(board.cards[card].column, 'done', 'dropped on Done')
    assert.equal(document.getElementById('drawer').hidden, true, 'the drop is not a click')
    assert.ok(document.querySelector('.done-note'), 'Done offers Undo')
  } finally {
    clear()
  }
})

test('a linked markdown file is drawn as a file, front matter read; the card\'s own note is not a file', async () => {
  const { window, document } = parseHTML(html)
  document.hasFocus = () => false
  const board = emptyBoard()
  let n = 0
  const by = { by: 'person', now: '2026-10-25T00:00:00.000Z', id: () => `id${++n}` }
  const { card } = applyOp(board, { type: 'card.create', title: 'Plan', note: '---\nnot: front matter\n---' }, by)
  applyOp(board, { type: 'link.add', card, link: { kind: 'chatfile', file: 'plan', name: 'plan.md' } }, by)
  const renders = []
  const planEntry = { id: 'plan', chat: 'chat', name: 'plan.md' }
  window.gugu = {
    getContext: async () => ({ locale: 'en', file: { id: 'board' }, chat: { id: 'chat', name: 'Chat', members: [] } }),
    onContextChanged() {},
    onCommand() {},
    getAppState: async () => null,
    setTabBadge: async () => {},
    codemirror: async () => ({}),
    markdown: async () => ({ render: (element, text, options) => renders.push({ text, options }) }),
    files: {
      open: async (ref) => (ref.id === 'plan'
        ? { type: 'text', entry: planEntry, text: '---\ntitle: x\n---\n\nbody', onChange: () => () => {}, close() {} }
        : { entry: { id: 'board', chat: 'chat' }, data: board, toJSON: () => structuredClone(board), presence: { self: { userId: 'person' } }, onChange() {}, onStatus() {}, close() {} }),
    },
  }
  globalThis.window = window
  globalThis.document = document
  try {
    await import('../app/board.js?frontmatter')
    document.querySelector(`[data-card="${card}"]`).click()
    await new Promise(setImmediate)
    const view = [...document.querySelectorAll('#drawer button')].find((el) => el.textContent === 'View')
    assert.ok(view)
    view.click()
    for (let i = 0; i < 5 && !renders.some((r) => r.options?.file); i++) await new Promise(setImmediate)
    const note = renders.find((r) => r.text.startsWith('---\nnot:'))
    const file = renders.find((r) => r.options?.file)
    assert.deepEqual(note?.options, { density: 'comfortable' }, 'the note: no front matter, no file')
    assert.deepEqual(file?.options, { density: 'comfortable', frontmatter: true, file: planEntry })
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})
