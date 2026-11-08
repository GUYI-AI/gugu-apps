import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { emptyBoard, applyOp } from '../app/lib/core.js'

const settled = () => new Promise(setImmediate)
const pages = {
  board: await readFile(new URL('../app/board.html', import.meta.url), 'utf8'),
  fleet: await readFile(new URL('../app/fleet.html', import.meta.url), 'utf8'),
}

/** A chat's board and the person's agents on two machines, as the host gives them to a page. */
function fixture() {
  const board = emptyBoard()
  let n = 0
  const by = { by: 'user:lane', now: '2026-11-07T10:00:00.000Z', id: () => `id${++n}` }
  const kb = applyOp(board, { type: 'card.create', title: 'Keyboard overlap', column: 'doing', links: [{ kind: 'task', session: 's-kb', agent: 'user:kb' }] }, by).card
  const ci = applyOp(board, { type: 'card.create', title: 'Billing window', column: 'doing', links: [{ kind: 'task', session: 's-bill', agent: 'user:bill' }] }, by).card
  const free = applyOp(board, { type: 'card.create', title: 'Release notes draft', column: 'todo' }, by).card
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
  return { board, kb, ci, free, report }
}

async function open(page, { board, report }, extra = {}) {
  const { window, document } = parseHTML(pages[page])
  document.hasFocus = () => false
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
    onContextChanged() {}, onLink() {}, onAgentsChanged() {}, onCommand() {}, setTabBadge: async () => {}, reportError() {},
    getAppState: async () => null,
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
  await import(`../app/${page}.js?t=${Math.random()}`)
  await settled()
  await settled()
  return { window, document, sent, links, remote: () => changed({ local: false }) }
}

const click = (el) => el.dispatchEvent(new globalThis.window.Event('click', { bubbles: true }))
const buttonBy = (root, text) => [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === text)
const tab = (document, name) => buttonBy(document.getElementById('views'), name) ?? [...document.querySelectorAll('#views button')].find((b) => b.textContent.startsWith(name))
const done = () => { delete globalThis.window; delete globalThis.document }

test('the views are one page: 团队 and back to 看板, and the "who" filter holds across them', async () => {
  const fx = fixture()
  const { document } = await open('board', fx)
  try {
    assert.equal(document.getElementById('board').hidden, false)
    click(tab(document, '团队'))
    assert.equal(document.getElementById('board').hidden, true)
    assert.equal(document.getElementById('team').hidden, false)
    assert.deepEqual([...document.querySelectorAll('.member.sup .name')].map((s) => s.textContent), ['chief', 'desk'])
    click(tab(document, '看板'))
    assert.equal(document.getElementById('board').hidden, false, 'back to the board from the team view')
    // who: kb only, on the board and on the team view alike
    click([...document.querySelectorAll('#people .face-chip')].find((b) => b.textContent.includes('kb')))
    assert.deepEqual([...document.querySelectorAll('#board [data-card] strong')].map((s) => s.textContent), ['Keyboard overlap'])
    click(tab(document, '团队'))
    assert.equal(document.querySelector('#people .face-chip.on').textContent.includes('kb'), true)
    assert.ok([...document.querySelectorAll('.member.dim .name')].some((s) => s.textContent === 'bill'))
  } finally { done() }
})

test('what waits on the person is above every view and answered in one click: ledger first, then the agent, with the card named', async () => {
  const fx = fixture()
  const { document, sent } = await open('board', fx)
  try {
    const asks = document.getElementById('asks')
    assert.equal(asks.hidden, false)
    assert.match(asks.textContent, /1 件事等你拍板.*Which layout gives way\?/s)
    click(buttonBy(asks, 'B'))
    await settled()
    const d = Object.values(fx.board.decisions)[0]
    assert.deepEqual([d.status, d.answer, d.decidedBy], ['decided', 'B', 'user:owner'])
    assert.equal(sent.length, 1)
    assert.equal(sent[0][1].to.agent, 'user:kb')
    assert.match(sent[0][0], /^Owner 拍板 D-1：Which layout gives way\? → B/)
    assert.match(sent[0][0], new RegExp(`kanban__update \\{ board: "board-1", card: "${fx.kb}" \\}`), 'the agent can act on it with its tools')
    assert.equal(document.getElementById('asks').hidden, true)
  } finally { done() }
})

test('a card and its holder lead to each other: the team view opens the card, the card opens the agent', async () => {
  const fx = fixture()
  const { document } = await open('board', fx)
  try {
    click(tab(document, '团队'))
    const pill = [...document.querySelectorAll('.pill')].find((b) => b.textContent.includes('Keyboard overlap'))
    assert.ok(pill, 'the lane lists the card it holds')
    click(pill)
    await settled()
    const drawer = document.getElementById('drawer')
    assert.equal(drawer.hidden, false)
    assert.equal(drawer.querySelector('.title-slot h2').textContent, 'Keyboard overlap')
    assert.match(drawer.querySelector('.callout').textContent, /Which layout gives way\?/, 'its question is answered in the card too')
    assert.equal(document.getElementById('asks').hidden, true, 'the question shows once: in the open card')
    assert.ok(document.querySelector('.member.selected .name').textContent === 'kb', 'its holder is marked in the team view')
    click(drawer.querySelector('.owners .owner'))
    await settled()
    assert.match(drawer.querySelector('.member-panel h2').textContent, /kb/)
    assert.ok([...drawer.querySelectorAll('.mini')].some((b) => b.textContent.includes('Keyboard overlap')), 'the agent lists what it holds')
    // the unclaimed card sits in its own column on the team view
    assert.match(document.querySelector('.pool').textContent, /Release notes draft/)
  } finally { done() }
})

test('an agent opens to its essentials; archiving waits for every check and the typed name, then goes to its supervisor', async () => {
  const fx = fixture()
  const { document, sent, remote } = await open('board', fx)
  try {
    click(tab(document, '团队'))
    click([...document.querySelectorAll('.member .who')].find((b) => b.textContent.includes('bill')))
    await settled()
    const drawer = document.getElementById('drawer')
    assert.equal(drawer.hidden, false)
    assert.match(drawer.querySelector('.callout').textContent, /等合并/)
    assert.equal(drawer.querySelector('.fields'), null, 'the second layer stays closed until asked')
    click(buttonBy(drawer, '更多'))
    click(buttonBy(drawer, '归档'))
    assert.equal(buttonBy(drawer, '交给主管执行归档').disabled, true)
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
  } finally { done() }
})

test('a supervisor is never offered for archiving', async () => {
  const fx = fixture()
  const { document } = await open('board', fx)
  try {
    click(tab(document, '团队'))
    click(document.querySelectorAll('.member.sup .who')[1])
    await settled()
    const drawer = document.getElementById('drawer')
    click(buttonBy(drawer, '更多'))
    assert.equal(buttonBy(drawer, '归档'), undefined)
    assert.equal(buttonBy(drawer, '改挂主管'), undefined)
  } finally { done() }
})

test('a card nobody holds is given to an agent, which claims it with the tools', async () => {
  const fx = fixture()
  const { document, sent } = await open('board', fx)
  try {
    click(document.querySelector(`[data-card="${fx.free}"]`))
    await settled()
    const menu = document.querySelector('#drawer .owners .assign')
    assert.ok(menu, 'nobody holds it: the holder is a choice')
    click([...menu.querySelectorAll('.menu button')].find((b) => b.textContent.startsWith('bill')))
    await settled()
    assert.equal(sent[0][1].to.agent, 'user:bill')
    assert.match(sent[0][0], new RegExp(`kanban__claim \\{ board: "board-1", card: "${fx.free}" \\}`))
  } finally { done() }
})

test('a wait on the person without a question: the reply goes to the holder and the card stops waiting', async () => {
  const fx = fixture()
  applyOp(fx.board, { type: 'decision.close', decision: Object.keys(fx.board.decisions)[0], status: 'withdrawn' }, { by: 'person', now: '2026-11-07T10:30:00.000Z', id: () => 'x' })
  applyOp(fx.board, { type: 'card.update', card: fx.kb, waitKind: 'owner', waitingOn: 'Phone or WeChat login?' }, { by: 'user:kb', now: '2026-11-07T10:31:00.000Z', id: () => 'y' })
  const { document, sent } = await open('board', fx)
  try {
    const asks = document.getElementById('asks')
    assert.match(asks.textContent, /Phone or WeChat login\?/)
    const input = asks.querySelector('input')
    input.value = 'Phone'
    click(buttonBy(asks, '回复'))
    await settled()
    assert.equal(sent[0][1].to.agent, 'user:kb')
    assert.match(sent[0][0], /^Owner 回复（看板卡「Keyboard overlap」）：Phone/)
    assert.equal(fx.board.cards[fx.kb].waitingOn, '')
    assert.equal(fx.board.cards[fx.kb].waitKind, '')
    assert.equal(document.getElementById('asks').hidden, true)
  } finally { done() }
})

test('the message card counts the fleet when shown and opens the board it names on its team view', async () => {
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
    assert.deepEqual(links, [{ link: { kind: 'app', tab: 'file', chat: 'chat', query: { view: 'team', board: 'board-1' } } }])
  } finally { done() }
})

test('a question no card holds still waits on the person: counted on the card, answered on the page, told to whoever asked', async () => {
  const fx = fixture()
  const by = { by: 'user:chief', now: '2026-11-07T10:05:00.000Z', id: () => 'loose1' }
  // The supervisor's own card: no task has claimed it, so no lane carries its question.
  const own = applyOp(fx.board, { type: 'card.create', title: 'Release notes', column: 'doing' }, by).card
  applyOp(fx.board, { type: 'decision.create', card: own, question: 'Ship on Friday?', options: ['Yes', 'No'] }, { ...by, id: () => 'loose2' })
  const card = await open('fleet', fx, { ctx: { widget: { data: { board: 'board-1' }, messageId: 'msg:1' } } })
  try {
    assert.deepEqual([...card.document.querySelectorAll('#nums .num b')].map((b) => b.textContent), ['0', '2', '1', '0'])
  } finally { done() }
  const { document, sent } = await open('board', fx)
  try {
    click(tab(document, '决策'))
    const list = document.querySelector('.ask-list')
    assert.equal(list.querySelectorAll('li.ask').length, 2)
    assert.match(list.textContent, /Release notes.*Ship on Friday\?/s)
    click(buttonBy(list, 'Yes'))
    await settled()
    const d = Object.values(fx.board.decisions).find((x) => x.question === 'Ship on Friday?')
    assert.deepEqual([d.status, d.answer, d.decidedBy], ['decided', 'Yes', 'user:owner'])
    assert.deepEqual(sent.map(([, opts]) => opts.to.agent), ['user:chief'], 'the answer goes back to whoever asked')
  } finally { done() }
})
