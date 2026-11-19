import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseHTML } from 'linkedom'
import { applyOp, emptyBoard, logOf } from '../app/lib/core.js'
import { live } from './live.mjs'
const v1 = await readFile(new URL('./fixtures/v1-board.json', import.meta.url), 'utf8')

const html = await readFile(new URL('../app/board.html', import.meta.url), 'utf8')
const LANE = { agent: 'user:00000000-0000-0000-0000-00000000000a', session: 'sess-lane-1', name: 'scroll-pull' }
let n = 0

/** The board page in a chat, on a live board file, with gugu's verbs recorded. */
async function openPage(data, { members = [], host = {}, opened = async (file) => file, agents = [{ agentId: LANE.agent, sessionId: LANE.session, status: 'idle', detail: 'done', deviceLabel: 'gpu', title: 'scroll-pull' }] } = {}) {
  const { window, document } = parseHTML(html)
  const sent = []
  const changes = new Set()
  const file = {
    entry: { id: 'f1', chat: 'chat-1', name: '协作看板.board.json' },
    get data() { return live(data) },
    presence: { self: { userId: 'user:owner', name: 'Owner' } },
    toJSON: () => JSON.parse(JSON.stringify(data)),
    transact(fn) { fn(); for (const c of changes) c({ local: true }) },
    onChange: (fn) => changes.add(fn),
    onStatus: () => {},
    close() {},
  }
  window.gugu = {
    getContext: async () => ({ locale: 'zh-CN', chat: { id: 'chat-1', name: 'work', members }, file: file.entry, layout: { visible: true } }),
    files: { open: async () => opened(file), list: async () => [file.entry] },
    ...(agents ? { listAgents: async () => ({ agents, devices: [] }) } : {}),
    dispatch: async (text, opts) => { sent.push({ text, opts }); return { to: opts.to } },
    setTabBadge: async () => {},
    reportError: (e) => { throw new Error(`reportError: ${e}`) },
    onContextChanged() {}, onAgentsChanged() {}, onLink() {},
    markdown: async () => ({ render: (el, text) => { el.textContent = text } }),
    ...host,
  }
  Object.assign(globalThis, { window, document, addEventListener: () => {} })
  await import(`../app/board.js?page=${++n}`)
  await new Promise((r) => setImmediate(r))
  return { document, sent, data }
}

const card = (b, op) => applyOp(b, op, { by: LANE.agent, now: new Date().toISOString(), caller: LANE }).card

test('one list, no columns or tabs: groups in order, stopped cards say so, header counts match', async () => {
  const b = emptyBoard()
  card(b, { type: 'create', title: 'merge #2798?', hold: true, ask: { question: 'CI 绿了，可以合吗？', options: ['合', '先别合'] } })
  card(b, { type: 'create', title: 'colour #2189', hold: true, ask: { question: '3:1?', options: ['3:1', '4.5:1'] } })
  card(b, { type: 'create', title: 'restart dup images', hold: true, next: 'mac1 复现' })
  card(b, { type: 'create', title: 'scroll pull', hold: true, wait: 'P4 回执' })
  card(b, { type: 'create', title: 'nobody has me' })
  const { document } = await openPage(b)
  assert.equal(document.querySelector('[role=tablist]'), null)
  assert.deepEqual([...document.querySelectorAll('#list > section h5')].map((h) => h.firstChild.textContent), ['等你', '进行中', '等别的'])
  assert.equal(document.querySelectorAll('.group.owner .answer:not(.plain)').length, 4, 'both questions show their answers')
  assert.equal(document.getElementById('summary').textContent, '2 等你 · 0 在跑 · 1 停了 · 1 等别的')
  assert.match(document.querySelector('.group.progress small.stopped').textContent, /^停了/)
  assert.match(document.querySelector('details.unclaimed summary').textContent, /没人接 1/)
})

test('one tap answers after 5 s: the card leaves 等你 and the holder is told; 撤销 sends nothing', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const b = emptyBoard()
    const id = card(b, { type: 'create', title: 'merge #2798?', hold: true, ask: { question: 'CI 绿了，可以合吗？', options: ['合', '先别合'] } })
    const { document, sent, data } = await openPage(b)
    const tap = (label) => [...document.querySelectorAll('.answer')].find((x) => x.textContent === label).click()
    tap('先别合')
    assert.equal(document.querySelector('.group.owner'), null, 'leaves 等你 at once')
    assert.match(document.getElementById('undo').textContent, /已答「先别合」/)
    document.querySelector('#undo button').click()
    mock.timers.tick(6000)
    await new Promise((r) => setImmediate(r))
    assert.equal(sent.length, 0)
    assert.equal(data.cards[id].wait.on, 'owner')
    assert.ok(document.querySelector('.group.owner'), 'the card stays')
    tap('合')
    mock.timers.tick(5000)
    await new Promise((r) => setImmediate(r))
    assert.equal(data.cards[id].wait, null)
    assert.equal(sent.length, 1)
    assert.deepEqual(sent[0].opts, { to: { agent: LANE.agent } })
    assert.match(sent[0].text, new RegExp(`卡 ${id}「merge #2798\\?」：CI 绿了，可以合吗？ → 合.*kanban__board \\{ chat: "chat-1", card: "${id}" \\}`))
  } finally {
    mock.timers.reset()
  }
})

test('with no task list the page still draws every card, without dots', async () => {
  const b = emptyBoard()
  card(b, { type: 'create', title: 'a', hold: true })
  card(b, { type: 'create', title: 'b', hold: true })
  const { document } = await openPage(b, { agents: null })
  assert.equal(document.querySelectorAll('.group.progress article').length, 2)
  assert.equal(document.querySelectorAll('.dot').length, 0)
  assert.equal(document.getElementById('summary').textContent, '2 进行中')
})

test('a card opens in a sheet; ticking a check and finishing write through core', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'lane', hold: true, check: { 'PR merged': false } })
  const { document, data } = await openPage(b)
  document.querySelector('.card .head').click()
  const sheet = document.getElementById('sheet')
  assert.equal(sheet.hidden, false)
  assert.equal(sheet.querySelector('h2').textContent, 'lane')
  const doneButton = () => [...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '完成')
  assert.equal(doneButton().disabled, true, 'an open check keeps 完成 off')
  assert.equal(sheet.querySelector('footer .blocking').textContent, '还不能完成：PR merged')
  const box = sheet.querySelector('.checks input[type=checkbox]')
  box.checked = true
  box.dispatchEvent(new window.Event('change'))
  assert.equal(Object.values(data.cards[id].checks)[0].done, true)
  assert.equal(sheet.querySelector('footer .blocking'), null)
  doneButton().click()
  assert.ok(data.cards[id].doneAt)
})

test('a 1.x board on the page: a question without answers opens its reply box, and old log lines name chat members', async () => {
  const { document, data } = await openPage(JSON.parse(v1), { members: [{ id: 'user:00000000-0000-0000-0000-0000000000b2', name: 'Mei' }] })
  assert.equal(data.version, 1, 'reading changes nothing')
  const bare = [...document.querySelectorAll('.group.owner article')].find((a) => a.textContent.includes('要不要先合'))
  assert.equal(bare.querySelector('.answers'), null)
  assert.equal(bare.querySelector('form.reply').hidden, false)
  ;[...document.querySelectorAll('.card .head')].find((b) => b.textContent.includes('sidebar push')).click()
  assert.ok([...document.querySelectorAll('#sheet .log b')].some((b) => b.textContent === 'Mei'))
})

test("a holder missing from the viewer's task list gets no dot and is not counted as stopped; machines come only from rows that know them", async () => {
  const b = emptyBoard()
  card(b, { type: 'create', title: 'mine', hold: true })
  const other = card(b, { type: 'create', title: 'theirs', hold: true })
  applyOp(b, { type: 'set', card: other, hold: 'session:sess-elsewhere' }, { by: LANE.agent, now: new Date().toISOString(), caller: LANE })
  const here = { agentId: LANE.agent, sessionId: LANE.session, status: 'working', deviceId: null, deviceLabel: null, statusFrom: 'this_machine', title: 'scroll-pull' }
  const { document, data } = await openPage(b, { agents: [here] })
  const article = (title) => [...document.querySelectorAll('.group.progress article')].find((a) => a.textContent.includes(title))
  assert.ok(article('mine').querySelector('.dot'))
  assert.equal(article('theirs').querySelector('.dot'), null)
  assert.equal(document.querySelector('.group.progress small.stopped'), null)
  assert.equal(document.getElementById('summary').textContent, '2 进行中')
  assert.equal(data.cards[other].holder.machine, undefined, 'nothing is written for a session the page cannot see')
})

test('交给…: the sheet shows the title and one line; the picked agent gets the tool words and the log says who', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'colour #2189', check: { 'PR merged': false } })
  const asked = []
  let answer = { agent: LANE.agent.replace('user:', '') }
  const { document, sent, data } = await openPage(b, { host: { pickAgent: async (words) => { asked.push(words); return answer } } })
  const open = () => { document.querySelector('.card .head').click(); [...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '交给…').click() }
  open()
  await new Promise((r) => setImmediate(r))
  assert.deepEqual(asked[0], { title: '交给谁', subject: 'colour #2189', body: '它会接手这张卡，按清单做下去。', action: '交给', search: '搜索你的 agent', empty: '没有找到 agent' })
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0].opts, { to: { agent: LANE.agent } })
  assert.match(sent[0].text, new RegExp(`kanban__set \\{ chat: "chat-1", card: "${id}", hold: true \\}`))
  assert.equal(logOf(data.cards[id]).at(-1).text, '交给 scroll-pull')
  answer = { cancelled: true }
  open()
  await new Promise((r) => setImmediate(r))
  assert.equal(sent.length, 1, 'cancelled: nothing goes')
  assert.equal(logOf(data.cards[id]).at(-1).text, '交给 scroll-pull', 'and nothing is logged')
})

test('交给… an agent no online computer has: the page says so in words and logs nothing', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'x' })
  const { document, data } = await openPage(b, { host: { pickAgent: async () => ({ agent: 'user:00000000-0000-0000-0000-0000000000ff' }), dispatch: async () => { throw Object.assign(new Error('user:00000000-0000-0000-0000-0000000000ff is not an agent on this computer or on your other online computers'), { code: 'not-found' }) } } })
  document.querySelector('.card .head').click()
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '交给…').click()
  await new Promise((r) => setImmediate(r))
  assert.match(document.querySelector('#sheet [role=alert]').textContent, /没交出去：这个 agent 现在不在你任何一台在线的电脑上/)
  assert.doesNotMatch(document.body.textContent, /0000000000ff/)
  assert.equal(logOf(data.cards[id]).length, 1)
})

test('交给… refused for another reason: the page says the host\'s reason, without the id, not the offline line', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'x' })
  const { document, data } = await openPage(b, { host: { pickAgent: async () => ({ agent: 'user:00000000-0000-0000-0000-0000000000ff' }), dispatch: async () => { throw Object.assign(new Error('user:00000000-0000-0000-0000-0000000000ff is not an agent on this computer or on your other online computers (not read: Office Mac)'), { code: 'failed' }) } } })
  document.querySelector('.card .head').click()
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '交给…').click()
  await new Promise((r) => setImmediate(r))
  const alert = document.querySelector('#sheet [role=alert]').textContent
  assert.equal(alert, '没交出去：这个 agent is not an agent on this computer or on your other online computers (not read: Office Mac)')
  assert.doesNotMatch(alert, /现在不在你任何一台在线的电脑上/)
  assert.doesNotMatch(document.body.textContent, /0000000000ff/)
  assert.equal(logOf(data.cards[id]).length, 1)
})

const SUPER = { id: 'user:00000000-0000-0000-0000-00000000000b', name: 'supervisor', kind: 'agent' }
const flush = () => new Promise((r) => setImmediate(r))
const rightClick = (window, el) => {
  const e = new window.Event('contextmenu', { bubbles: true, cancelable: true })
  Object.defineProperties(e, { clientX: { value: 10 }, clientY: { value: 20 } })
  el.dispatchEvent(e)
}

test('引用 from a card\'s menu (right-click) or its sheet: gugu\'s 引用 pill to the board file at that card, drafted into the board\'s chat', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'fix [2] scroll' })
  const menus = []
  let pick = 'cite'
  const { document, sent } = await openPage(b, { host: { showContextMenu: async (m) => { menus.push(m); return pick } } })
  rightClick(globalThis.window, document.querySelector('.card .head'))
  await flush()
  assert.deepEqual(menus[0].items.map((i) => i.label), ['打开', '引用'])
  // A pill, not hand-written markdown: the title reads as written (an escaped `\\[2\\]` was math in gugu's chat).
  assert.deepEqual(sent[0], { text: '', opts: { draft: true, refs: [{ file: { id: 'f1', chat: 'chat-1', name: '协作看板.board.json' }, at: { card: id }, label: `${id} · fix [2] scroll` }] } })
  pick = null
  rightClick(globalThis.window, document.querySelector('.card .head'))
  await flush()
  assert.equal(sent.length, 1, 'closing the menu drafts nothing')
  document.querySelector('.card .head').click()
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '引用').click()
  await flush()
  assert.equal(sent.length, 2)
  assert.deepEqual(sent[1].opts.refs[0].at, { card: id })
})

test('a cited card\'s pill opens the board on that card, also when it is what opened the page (the link comes before the board)', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'ship it' })
  let link = null
  let release
  const loaded = new Promise((r) => { release = r })
  // The page registers onLink, then waits for its board: the link is handed over in between.
  const page = openPage(b, { host: { onLink: (fn) => { link = fn } }, opened: async (file) => { await loaded; return file } })
  while (!link) await flush()
  await link({ tab: 'file', path: '', query: { card: id }, file: 'f1' })
  assert.equal(globalThis.document.getElementById('sheet').hidden, true, 'no board yet')
  release()
  const { document } = await page
  await flush()
  assert.equal(document.getElementById('sheet').hidden, false)
  assert.match(document.getElementById('sheet').textContent, /ship it/)
})

test('主管: unset says so; picked from the chat\'s agents it is logged on the board; a person\'s done and reopen tell it, with the open checks', async () => {
  const b = emptyBoard()
  const id = card(b, { type: 'create', title: 'ship it', check: { 'PR merged': true } })
  const { document, sent, data } = await openPage(b, { members: [SUPER, { id: 'user:owner', name: 'Owner', kind: 'human' }], host: {
    showContextMenu: async (m) => { assert.deepEqual(m.items[0], { id: SUPER.id, label: 'supervisor', person: SUPER.id, checked: false }); assert.equal(m.items.length, 3); return SUPER.id },
  } })
  assert.equal(document.querySelector('#lead').textContent, '未设主管')
  // No lead: finishing tells no one.
  document.querySelector('.card .head').click()
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '完成').click()
  await flush()
  assert.equal(sent.length, 0)
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '重开').click()
  await flush()
  document.querySelector('#lead').click()
  await flush()
  assert.deepEqual(data.lead, { agent: SUPER.id, name: 'supervisor' })
  assert.deepEqual(logOf(data).map((l) => [l.what, l.text, l.by]), [['lead', 'supervisor', 'user:owner']])
  assert.equal(document.querySelector('#lead').textContent, '主管：supervisor')
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '完成').click()
  await flush()
  assert.equal(sent.length, 1)
  // A chat message @ the lead, from whoever clicked: it reaches another person's agent too (`{ agent }` reached only the clicker's own).
  assert.deepEqual(sent[0].opts, { to: { chat: 'chat-1', member: SUPER.id }, visible: true })
  assert.match(sent[0].text, new RegExp(`卡 ${id}「ship it」被 Owner 标为完成（清单 1/1）。你是这块看板的主管：用 kanban__board \\{ chat: "chat-1", card: "${id}" \\}`))
  applyOp(data, { type: 'set', card: id, check: { 'P4 receipt': false } }, { by: LANE.agent, now: new Date().toISOString(), caller: LANE })
  ;[...document.querySelectorAll('#sheet footer button')].find((x) => x.textContent === '重开').click()
  await flush()
  assert.match(sent[1].text, /被 Owner 重新打开；还开着的检查项：P4 receipt。/)
})


test('a long press on a card (a phone) opens its menu once', async () => {
  const b = emptyBoard()
  card(b, { type: 'create', title: 'ship it' })
  const menus = []
  const { document } = await openPage(b, { host: { showContextMenu: async (m) => { menus.push(m); return null } } })
  const head = document.querySelector('.card .head')
  const pointer = (type) => {
    const e = new globalThis.window.Event(type, { bubbles: true, cancelable: true })
    Object.defineProperties(e, { pointerType: { value: 'touch' }, clientX: { value: 10 }, clientY: { value: 20 } })
    head.dispatchEvent(e)
  }
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    pointer('pointerdown')
    mock.timers.tick(500)
  } finally {
    mock.timers.reset()
  }
  // The platform may also fire contextmenu for the same press: still one menu.
  rightClick(globalThis.window, head)
  await flush()
  assert.equal(menus.length, 1)
  assert.deepEqual(menus[0].items.map((i) => i.label), ['打开', '引用'])
  // That the tap ending the press opens no card rests on a capture-phase click listener, which linkedom does not run
  // before the target's: checked in Chromium (the App's page on a desktop build), not here.
})
