import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { emptyBoard, applyOp } from '../app/lib/core.js'

const settled = () => new Promise(setImmediate)
const pages = {
  org: await readFile(new URL('../app/org.html', import.meta.url), 'utf8'),
  fleet: await readFile(new URL('../app/fleet.html', import.meta.url), 'utf8'),
}

/** A chat's fleet board and the person's agents on two machines, as the host gives them to a page. */
function fixture() {
  const board = emptyBoard()
  let n = 0
  const by = { by: 'user:lane', now: '2026-11-07T10:00:00.000Z', id: () => `id${++n}` }
  const kb = applyOp(board, { type: 'card.create', title: 'Keyboard overlap', column: 'doing', links: [{ kind: 'task', session: 's-kb', agent: 'user:kb' }] }, by).card
  const ci = applyOp(board, { type: 'card.create', title: 'Billing window', column: 'doing', links: [{ kind: 'task', session: 's-bill', agent: 'user:bill' }] }, by).card
  applyOp(board, { type: 'card.update', card: ci, waitKind: 'merge', waitingOn: 'owner merges', dest: '→ 18:00 Beta' }, by)
  applyOp(board, { type: 'decision.create', card: kb, question: 'Which layout gives way?', options: ['A', 'B'] }, by)
  // Machine A's supervisor has no lanes yet: only its name on the board makes it one.
  applyOp(board, { type: 'fleet.supervisor', session: 's-chief' }, by)
  applyOp(board, { type: 'fleet.supervisor', session: 's-desk' }, by)
  const row = (id, device, parent, more = {}) => ({ agentId: `user:${id}`, sessionId: `s-${id}`, deviceId: device, deviceLabel: device ? 'Machine-B' : 'Machine-A', parentAgentId: parent ? `user:${parent}` : null, title: id, providerId: 'codex', status: 'working', detail: 'running', pendingPermissionCount: 0, ...more })
  const report = {
    agents: [row('chief', null, null), row('desk', 'B', null, { providerId: 'claude' }), row('kb', 'B', 'desk'), row('bill', 'B', 'desk', { status: 'idle', detail: 'done' })],
    devices: [{ deviceId: 'A', label: 'Machine-A', online: true, thisMachine: true }, { deviceId: 'B', label: 'Machine-B', online: true, thisMachine: false }],
    unreached: [],
  }
  return { board, kb, ci, report }
}

async function open(page, { board, report }, extra = {}) {
  const { window, document } = parseHTML(pages[page])
  const sent = []
  const links = []
  let changed = () => {}
  const f = {
    entry: { id: 'board-1', chat: 'chat', name: '协作看板.board.json' }, data: board, toJSON: () => structuredClone(board),
    presence: { self: { userId: 'user:owner' } }, onChange(fn) { changed = fn }, onStatus() {}, close() {},
    transact(fn) { fn(); changed({ local: true }) },
  }
  window.gugu = {
    getContext: async () => ({ locale: 'zh-CN', chat: { id: 'chat', name: 'Fleet' }, ...extra.ctx }),
    onContextChanged() {}, onLink() {}, onAgentsChanged() {}, setTabBadge: async () => {}, reportError() {},
    listAgents: async () => report,
    dispatch: async (...args) => { sent.push(args); return { to: args[1].to } },
    showSession: async () => {}, openBrowserTab: async () => {},
    linkTo: async (target) => ({ link: target }), openLink: async (link) => { links.push(link) },
    files: {
      list: async () => [{ ...f.entry, type: 'json' }],
      open: async () => f,
      search: async () => [],
    },
  }
  globalThis.window = window
  globalThis.document = document
  const realInterval = globalThis.setInterval
  globalThis.setInterval = () => 0 // the page's minute poll would keep the test process alive
  try {
    await import(`../app/${page}.js?t=${Math.random()}`)
    await settled()
  } finally {
    globalThis.setInterval = realInterval
  }
  return { window, document, sent, links, remote: () => changed({ local: false }) }
}

const click = (el) => el.dispatchEvent(new globalThis.window.Event('click', { bubbles: true }))
const buttonBy = (root, text) => [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === text)

test('opened, the chart says first what waits on the person, and one click decides it: ledger first, then the lane', async () => {
  const fx = fixture()
  const { document, sent } = await open('org', fx)
  try {
    const asks = document.querySelector('.asks')
    assert.match(asks.textContent, /Which layout gives way\?/)
    assert.equal(asks.querySelectorAll('li.ask').length, 1)
    // The others' waits are counts, below: one waits to be merged.
    assert.match(document.querySelector('.strip').textContent, /等合并1/)
    // The chart: the person, then a column per machine with its supervisor.
    assert.deepEqual([...document.querySelectorAll('.machine .sup strong')].map((s) => s.textContent), ['chief', 'desk'])
    click(buttonBy(asks, 'B'))
    await settled()
    const d = Object.values(fx.board.decisions)[0]
    assert.deepEqual([d.status, d.answer, d.decidedBy], ['decided', 'B', 'user:owner'])
    assert.deepEqual(sent.map(([text, opts]) => [text, opts.to.agent]), [['Owner 拍板 D-1：Which layout gives way? → B', 'user:kb']])
    assert.equal(document.querySelector('.asks li.ask'), null)
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

test('a lane opens to its essentials; archiving waits for every check and the typed name, then goes to its supervisor', async () => {
  const fx = fixture()
  const { document, sent, remote } = await open('org', fx)
  try {
    const lane = [...document.querySelectorAll('.lane-card')].find((b) => b.textContent.includes('Billing window') || b.textContent.includes('bill'))
    click(lane)
    await settled()
    const drawer = document.getElementById('drawer')
    assert.equal(drawer.hidden, false)
    assert.match(drawer.querySelector('.big-wait').textContent, /等合并/)
    assert.equal(drawer.querySelector('.fields'), null, 'the second layer stays closed until asked')
    click(buttonBy(drawer, '更多'))
    click(buttonBy(drawer, '归档'))
    const go = buttonBy(drawer, '交给主管执行归档')
    assert.equal(go.disabled, true)
    assert.deepEqual([...drawer.querySelectorAll('.checks li')].map((li) => li.className), ['ok', 'ok', 'no', 'ok'])

    // A PR the sync has seen satisfies the handoff check; still nothing until the name is typed.
    const lane2 = { by: 'user:bill', now: '2026-11-07T11:00:00.000Z', id: () => 'pr1' }
    applyOp(fx.board, { type: 'link.add', card: fx.ci, link: { kind: 'pr', url: 'https://github.com/acme/app/pull/98' } }, lane2)
    applyOp(fx.board, { type: 'pr.sync', prs: [{ url: 'https://github.com/acme/app/pull/98', ci: 'green' }] }, lane2)
    remote()
    await settled()
    const pane = drawer.querySelector('.pane.archive')
    assert.deepEqual([...pane.querySelectorAll('.checks li')].map((li) => li.className), ['ok', 'ok', 'ok', 'ok'])
    const typed = pane.querySelector('input')
    typed.value = 'bil'
    typed.dispatchEvent(new globalThis.window.Event('input'))
    assert.equal(buttonBy(pane, '交给主管执行归档').disabled, true)
    typed.value = 'bill'
    typed.dispatchEvent(new globalThis.window.Event('input'))
    const armed = buttonBy(pane, '交给主管执行归档')
    assert.equal(armed.disabled, false)
    click(armed)
    await settled()
    assert.equal(sent.length, 1)
    assert.equal(sent[0][1].to.agent, 'user:desk', 'the machine’s supervisor archives, not the page')
    assert.match(sent[0][0], /session_archive/)
    assert.match(sent[0][0], /自己逐条核对/, 'the supervisor checks again; the message is not proof')
    assert.match(sent[0][0], /s-bill/)
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

test('a supervisor is never offered for archiving', async () => {
  const fx = fixture()
  const { document } = await open('org', fx)
  try {
    click([...document.querySelectorAll('.machine .sup')][1])
    await settled()
    const drawer = document.getElementById('drawer')
    click(buttonBy(drawer, '更多'))
    assert.equal(buttonBy(drawer, '归档'), undefined)
    assert.equal(buttonBy(drawer, '改挂主管'), undefined)
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

test('the message card counts the fleet when shown and opens the chart of the board it names', async () => {
  const fx = fixture()
  const { document, links } = await open('fleet', fx, { ctx: { widget: { data: { board: 'board-1' }, messageId: 'msg:1' } } })
  try {
    const nums = [...document.querySelectorAll('#nums .num b')].map((b) => b.textContent)
    // running: kb is waiting on the owner and bill is done, so none runs; one waits on the owner, one on merge.
    assert.deepEqual(nums, ['0', '1', '1', '0'])
    assert.match(document.getElementById('machines').textContent, /2\/2 台机器在线/)
    assert.doesNotMatch(document.getElementById('machines').textContent, /null/, 'no machine is offline: nothing is written in its place')
    click(document.getElementById('card'))
    await settled()
    assert.deepEqual(links, [{ link: { kind: 'app', tab: 'org', chat: 'chat', query: { board: 'board-1' } } }])
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

test('a question no lane holds still waits on the person: counted on the card, answered on the chart, told to whoever asked', async () => {
  const fx = fixture()
  const by = { by: 'user:chief', now: '2026-11-07T10:05:00.000Z', id: () => 'loose1' }
  // The supervisor's own card: no task has claimed it, so no lane carries its question.
  const own = applyOp(fx.board, { type: 'card.create', title: 'Release notes', column: 'doing' }, by).card
  applyOp(fx.board, { type: 'decision.create', card: own, question: 'Ship on Friday?', options: ['Yes', 'No'] }, { ...by, id: () => 'loose2' })
  const card = await open('fleet', fx, { ctx: { widget: { data: { board: 'board-1' }, messageId: 'msg:1' } } })
  try {
    assert.deepEqual([...card.document.querySelectorAll('#nums .num b')].map((b) => b.textContent), ['0', '2', '1', '0'])
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
  const { document, sent } = await open('org', fx)
  try {
    const asks = document.querySelector('.asks')
    assert.equal(asks.querySelectorAll('li.ask').length, 2)
    assert.match(asks.textContent, /Release notes.*Ship on Friday\?/s)
    click(buttonBy(asks, 'Yes'))
    await settled()
    const d = Object.values(fx.board.decisions).find((x) => x.question === 'Ship on Friday?')
    assert.deepEqual([d.status, d.answer, d.decidedBy], ['decided', 'Yes', 'user:owner'])
    assert.deepEqual(sent.map(([, opts]) => opts.to.agent), ['user:chief'], 'the answer goes back to whoever asked')
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})
