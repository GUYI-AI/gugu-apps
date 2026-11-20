import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { applyOp, emptyBoard } from '../app/lib/core.js'
import { live } from './live.mjs'

const html = await readFile(new URL('../app/card.html', import.meta.url), 'utf8')
const LANE = { agent: 'user:00000000-0000-0000-0000-00000000000a', session: 'sess-lane-1', name: 'scroll-pull' }
let n = 0
const make = (b, op) => applyOp(b, op, { by: LANE.agent, now: new Date().toISOString(), caller: LANE })

/** The card widget in a chat message, on a live board file; links opened are recorded. */
async function openCard(data, widget, { open } = {}) {
  const { window, document } = parseHTML(html)
  const changes = new Set(), opened = [], errors = []
  const file = { entry: { id: 'f1', chat: 'chat-1', name: '协作看板.board.json' }, get data() { return live(data) }, toJSON: () => JSON.parse(JSON.stringify(data)), onChange: (fn) => changes.add(fn), close() {} }
  window.gugu = {
    getContext: async () => ({ locale: 'zh-CN', chat: { id: 'chat-1', name: '研发' }, widget: { id: 'w1', messageId: 'm1', data: widget, sender: null } }),
    files: { open: open ?? (async () => file) },
    linkTo: async (target) => ({ target }), openLink: async (link) => { opened.push(link.target) },
    reportError: (e) => errors.push(e), onContextChanged() {},
  }
  Object.assign(globalThis, { window, document })
  await import(`../app/card.js?card=${++n}`)
  await new Promise((r) => setImmediate(r))
  const change = (fn) => { fn(data); for (const c of changes) c({}) }
  return { document, opened, errors, change }
}

test('the card shows its title, state, holder, checklist and next step, and follows the board as it changes', async () => {
  const b = emptyBoard()
  const id = make(b, { type: 'create', title: '群文件夹上传卡在 99%', hold: true, next: '等闸', check: { 复现: true, 修复: false } }).card
  const { document, change } = await openCard(b, { board: 'f1', card: id })
  const text = () => document.getElementById('card').textContent
  for (const part of ['协作看板 · 研发', id, '进行中', '群文件夹上传卡在 99%', 'scroll-pull', '1/2', '下一步：等闸']) assert.ok(text().includes(part), part)
  assert.match(document.body.className, /s-progress/)
  change((d) => make(d, { type: 'set', card: id, ask: { question: '合吗？', options: ['合'] } }))
  assert.ok(text().includes('等你') && text().includes('问你：合吗？'), text())
  assert.match(document.body.className, /s-owner/)
  change((d) => { d.cards[id].holder.machine = 'gpu-box' })
  assert.ok(!text().includes('gpu-box'), 'the holder shows its name, not its machine')
})

test('a click opens the board file at that card', async () => {
  const b = emptyBoard()
  const id = make(b, { type: 'create', title: 'x' }).card
  const { document, opened } = await openCard(b, { board: 'f1', card: id })
  document.getElementById('card').dispatchEvent(new document.defaultView.Event('click'))
  await new Promise((r) => setImmediate(r))
  assert.deepEqual(opened, [{ kind: 'file', file: { id: 'f1', chat: 'chat-1', name: '协作看板.board.json' }, at: { card: id } }])
})

test('a card gone from the board, or a board gone, says so without an error', async () => {
  const gone = await openCard(emptyBoard(), { board: 'f1', card: 'zzzz' })
  assert.equal(gone.document.getElementById('card').textContent, '这张卡已不在看板上')
  const lost = await openCard(emptyBoard(), { board: 'f1', card: 'abcd' }, { open: async () => { throw Object.assign(new Error('gone'), { code: 'not-found' }) } })
  assert.equal(lost.document.getElementById('card').textContent, '这块看板已不可用')
  assert.deepEqual(lost.errors, [])
  const forged = await openCard(emptyBoard(), { board: '../x', card: 'a b' })
  assert.equal(forged.document.getElementById('card').textContent, '这块看板已不可用')
})
