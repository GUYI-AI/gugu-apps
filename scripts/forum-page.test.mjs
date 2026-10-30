import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import * as core from '../sources/forum/core.mjs'

// An in-memory DOM/host boundary for the actual page script, not a browser or a layout test.
class Element {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.childNodes = []; this.events = {}; this.value = ''; this.disabled = false; this.hidden = false; this.checked = false }
  get children() { return this.childNodes.filter((node) => node instanceof Element) }
  get firstElementChild() { return this.children[0] }
  get lastElementChild() { return this.children.at(-1) }
  get textContent() { return this.childNodes.map((node) => typeof node === 'string' ? node : node.textContent).join('') }
  set textContent(value) { this.childNodes = [String(value)] }
  set innerHTML(_) { throw new Error('Forum content must remain plain text') }
  get className() { return this.attrs.class ?? '' }
  set className(value) { this.attrs.class = value }
  get dataset() { return Object.fromEntries(Object.entries(this.attrs).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value])) }
  get classList() {
    const node = this
    return { contains: (value) => node.className.split(' ').includes(value), toggle(value, force) {
      const names = new Set(node.className.split(' ').filter(Boolean))
      const on = force ?? !names.has(value)
      if (on) names.add(value); else names.delete(value)
      node.className = [...names].join(' ')
    } }
  }
  setAttribute(key, value) {
    this.attrs[key] = String(value)
    if (['hidden', 'disabled', 'checked'].includes(key)) this[key] = true
    if (key === 'value') this.value = String(value)
  }
  getAttribute(key) { return this.attrs[key] ?? null }
  append(...nodes) { this.childNodes.push(...nodes.map((node) => node instanceof Element ? node : String(node))) }
  replaceChildren(...nodes) { this.childNodes = []; this.append(...nodes) }
  matches(selector) {
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1))
    if (selector.startsWith('#')) return this.attrs.id === selector.slice(1)
    const attr = selector.match(/^\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]$/)
    return attr ? this.attrs[attr[1]] !== undefined && (attr[2] === undefined || this.attrs[attr[1]] === attr[2]) : this.tagName === selector
  }
  querySelectorAll(selector) { return this.children.flatMap((node) => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]) }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
  addEventListener(event, fn) { (this.events[event] ??= []).push(fn) }
  emit(event) { if (this.disabled && event === 'click') return; this['on' + event]?.(); for (const fn of this.events[event] ?? []) fn({ preventDefault() {} }) }
  focus() { this.focused = true }
  showModal() { this.open = true }
  close() { this.open = false }
  reset() { for (const node of this.querySelectorAll('input').concat(this.querySelectorAll('textarea'))) { node.value = node.attrs.value ?? ''; node.checked = node.attrs.checked !== undefined } }
}
const app = new URL('../sources/forum/', import.meta.url)
const html = readFileSync(new URL('forum.html', app), 'utf8')
const source = readFileSync(new URL('forum.js', app), 'utf8')
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
const plain = (value) => JSON.parse(JSON.stringify(value))
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }
const now = Date.now()
const iso = (ms) => new Date(ms).toISOString()
const me = { id: 'me', points: 40 }
const author = { id: 'other', name: 'Author', points: 17 }
const bounty = { amount: 10, status: 'open', posterId: 'me', visibility: 'poster_only', createdAt: iso(now - 2 * 86400000), deadlineAt: iso(now + 86400000) }
const reply = (id, extra = {}) => ({ id, body: 'Answer ' + id, createdAt: iso(now), author, owner: author, ...extra })
const detail = (extra = {}) => ({ me, post: { id: 'p', title: 'Question', body: '<b>plain text</b>', author: { ...author, id: 'me' }, createdAt: iso(now) }, bounty, replies: [reply('a'), reply('b')], reactions: [], assignments: [], ...extra })

function page(overrides = {}, hash = '') {
  const document = new Element('document')
  const stack = [document]
  for (const token of html.match(/<[^>]+>|[^<]+/g)) {
    if (token.startsWith('</')) { stack.pop(); continue }
    if (token.startsWith('<!')) continue
    if (!token.startsWith('<')) { stack.at(-1).append(token); continue }
    const [, tag, attributes] = token.match(/^<([\w-]+)([\s\S]*?)>$/)
    const node = new Element(tag)
    for (const match of attributes.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) node.setAttribute(match[1], match[2] ?? '')
    stack.at(-1).append(node)
    if (!['meta', 'link', 'input'].includes(tag)) stack.push(node)
  }
  document.getElementById = (id) => document.querySelector('#' + id)
  document.createElement = (tag) => new Element(tag)
  for (const select of document.querySelectorAll('select')) select.value = (select.querySelector('[selected]') ?? select.firstElementChild).attrs.value
  const calls = [], subscriptions = [], timers = new Map()
  let timer = 0, gesture = false, currentHash = hash
  const window = new Element('window')
  window.location = { get hash() { return currentHash }, set hash(value) { currentHash = value ? '#' + value.replace(/^#/, '') : ''; queueMicrotask(() => window.emit('hashchange')) } }
  const forum = {
    list: () => Promise.resolve({ me, posts: [] }), read: () => Promise.resolve(detail()),
    post: () => Promise.resolve({ confirming: true }), reply: () => Promise.resolve({ reply: 'new' }),
    react: () => Promise.resolve({}), award: () => Promise.resolve({ confirming: true }),
    assign: () => Promise.resolve({ cancelled: true }), block: () => Promise.resolve({}), remove: () => Promise.resolve({}), ...overrides,
    onChanged(id, fn) { const entry = { id, fn, stopped: false }; subscriptions.push(entry); return () => { entry.stopped = true } },
  }
  for (const key of ['list', 'read', 'post', 'reply', 'react', 'award', 'assign', 'block', 'remove']) {
    const fn = forum[key]
    forum[key] = (...args) => { calls.push({ method: key, args: plain(args), gesture }); return fn(...args) }
  }
  window.gugu = { forum }
  runInNewContext(source.replace(/^import .*\n/, ''), { ...core, window, document, console,
    setTimeout(fn, ms) { const id = ++timer; timers.set(id, { fn, ms }); return id }, clearTimeout(id) { timers.delete(id) },
  }, { filename: 'forum.js' })
  const fire = (node, event = 'click') => { assert.ok(node, 'control exists'); gesture = true; try { node.emit(event) } finally { gesture = false } }
  return { document, window, calls, subscriptions, timers, fire, $: (id) => document.getElementById(id),
    button: (node, text) => node.querySelectorAll('button').find((button) => button.textContent === text),
    change: (id, kind) => subscriptions.filter((entry) => entry.id === id && !entry.stopped).forEach((entry) => entry.fn({ kind })),
  }
}

test('feed tabs, compact metadata and empty states retain the list query contract', async () => {
  const p = page({ list: () => Promise.resolve({ me, posts: [{ id: 'p', title: 'Topic', excerpt: 'Summary', author, createdAt: iso(now), replyCount: 0, bounty }] }) })
  await flush()
  assert.equal(p.$('balance').textContent, '40 积分')
  const row = p.$('posts').firstElementChild.firstElementChild
  assert.equal(row.tagName, 'button')
  assert.ok(row.querySelector('gugu-time'))
  assert.ok(row.textContent.includes('待回答'))
  assert.ok(!row.textContent.includes('17 积分'))
  p.fire(p.$('more'))
  await flush()
  const tab = p.$('filter').children[1]
  p.fire(tab)
  assert.deepEqual(p.calls.at(-1).args, [{ query: '', sort: 'active', filter: 'bounty_open', limit: 30, offset: 0 }])
  assert.equal(tab.getAttribute('aria-selected'), 'true')
  assert.equal(p.$('filter').children[0].getAttribute('aria-selected'), 'false')
  p.$('query').value = ' needle '
  p.fire(p.$('query'), 'input')
  assert.equal([...p.timers.values()][0].ms, 250)
  const empty = page()
  await flush()
  assert.equal(empty.$('empty').querySelector('strong').textContent, '还没有帖子')
  empty.fire(empty.$('filter').children[2])
  await flush()
  assert.equal(empty.$('empty').attrs.icon, 'search')
  assert.equal(empty.$('empty').querySelector('strong').textContent, '没有符合条件的帖子')
})

test('post confirmation preserves the draft and invokes the same write during the gesture', async () => {
  const p = page({}, '#new')
  p.$('draft-title').value = ' Title '
  p.$('draft-body').value = ' Body '
  p.$('with-bounty').checked = true
  p.fire(p.$('with-bounty'), 'change')
  p.fire(p.$('draft'), 'submit')
  const write = p.calls.find((call) => call.method === 'post')
  assert.deepEqual(write.args, [{ title: 'Title', body: 'Body', bounty: { amount: 10, days: 3, visibility: 'public' } }])
  assert.equal(write.gesture, true)
  await flush()
  assert.equal(p.$('draft-body').value, ' Body ')
  assert.match(p.$('notice').textContent, /草稿已保留/)
  assert.equal(p.$('compose').hidden, true)
})

test('award toggles stay inline, retain confirmation selection and clear after settlement', async () => {
  let model = detail()
  const p = page({ read: () => Promise.resolve(model) }, '#post/p')
  await flush()
  const first = p.$('replies').children[0]
  p.fire(first.querySelector('.pick'))
  assert.equal(first.querySelector('.pick').getAttribute('aria-pressed'), 'true')
  assert.equal(first.querySelector('input').hidden, false)
  assert.equal(p.$('award-bar').hidden, false)
  assert.equal(first.classList.contains('picked'), true)
  p.fire(p.button(p.$('award-bar'), '采纳所选回复'))
  const write = p.calls.find((call) => call.method === 'award')
  assert.deepEqual(write.args, ['p', [{ reply: 'a', amount: 10 }]])
  assert.equal(write.gesture, true)
  await flush()
  assert.equal(p.$('award-bar').hidden, false)
  model = detail({ bounty: { ...bounty, status: 'awarded', awards: [{ replyId: 'b', amount: 10 }] } })
  p.change('p', 'settled')
  await flush()
  assert.equal(p.$('award-bar').hidden, true)
  assert.equal(p.$('replies').firstElementChild.dataset.reply, 'b')
  assert.match(p.$('replies').firstElementChild.querySelector('.num').textContent, /#2/)
  assert.equal(p.$('replies').firstElementChild.classList.contains('accepted'), true)
  assert.equal(p.$('reply-form').hidden, true)
  assert.ok(!p.$('post-view').textContent.includes('null'))
})

test('reaction pills hide unused counts and retain the react arguments', async () => {
  const p = page({ read: () => Promise.resolve(detail({ reactions: [{ targetKind: 'post', targetId: 'p', emoji: '👍', count: 7, mine: true }] })) }, '#post/p')
  await flush()
  const row = p.$('post-content').querySelector('.reactions')
  assert.equal(row.children.filter((node) => node.tagName === 'button').length, 2)
  assert.equal(row.firstElementChild.getAttribute('aria-pressed'), 'true')
  assert.ok(!row.querySelector('.picker').textContent.includes('0'))
  p.fire(row.firstElementChild)
  assert.deepEqual(p.calls.find((call) => call.method === 'react').args, [{ kind: 'post', id: 'p', emoji: '👍', on: false }])
  assert.equal(p.calls.find((call) => call.method === 'react').gesture, true)
})

test('reply, assignment and destructive menus keep host arguments and cancellation handling', async () => {
  const p = page({ read: () => Promise.resolve(detail({ assignments: ['pending', 'delivered', 'undelivered', 'turn_failed'].map((deliveryState) => ({ deliveryState, agentId: deliveryState, agentName: deliveryState, updatedAt: iso(now) })) })) }, '#post/p')
  await flush()
  assert.equal(p.$('assignments').querySelectorAll('button').filter((node) => node.textContent === '重新指派').length, 1)
  p.fire(p.button(p.$('assignments'), '重新指派'))
  assert.deepEqual(p.calls.find((call) => call.method === 'assign').args, ['p', 'turn_failed'])
  await flush()
  assert.equal(p.$('notice').textContent, '')
  const first = p.$('replies').firstElementChild
  p.fire(p.button(first, '回复'))
  p.$('reply-body').value = ' reply text '
  p.fire(p.$('reply-body'), 'input')
  p.fire(p.$('reply-form'), 'submit')
  assert.deepEqual(p.calls.find((call) => call.method === 'reply').args, ['p', 'reply text', { replyTo: 'a' }])
  assert.equal(p.calls.find((call) => call.method === 'reply').gesture, true)
  await flush()
  const remove = p.button(p.$('post-content'), '删除帖子')
  assert.equal(remove.disabled, true)
  assert.equal(remove.getAttribute('title'), '请先结束悬赏')
  const block = p.button(p.$('replies').firstElementChild, '拉黑此人')
  p.fire(block)
  assert.equal(p.calls.some((call) => call.method === 'block'), false)
  p.fire(p.$('confirm-action'))
  assert.deepEqual(p.calls.find((call) => call.method === 'block').args, ['other', true])
  assert.equal(p.calls.find((call) => call.method === 'block').gesture, true)
})

test('late list responses, post switches and disposal cannot replace a newer page', async () => {
  const old = deferred(), fresh = deferred()
  let reads = 0
  const p = page({ list: () => (++reads === 1 ? old : fresh).promise })
  p.fire(p.$('filter').children[1])
  fresh.resolve({ me, posts: [] })
  await flush()
  old.resolve({ me: { ...me, points: 999 }, posts: [] })
  await flush()
  assert.equal(p.$('balance').textContent, '40 积分')
  const first = deferred(), second = deferred()
  const q = page({ read: (id) => (id === 'first' ? first : second).promise }, '#post/first')
  q.window.location.hash = 'post/second'
  await flush()
  assert.equal(q.subscriptions.find((entry) => entry.id === 'first').stopped, true)
  second.resolve(detail({ post: { ...detail().post, title: 'Second' } }))
  await flush()
  first.resolve(detail({ post: { ...detail().post, title: 'First' } }))
  await flush()
  assert.equal(q.$('post-content').querySelector('h2').textContent, 'Second')
  q.fire(q.window, 'pagehide')
  assert.equal(q.subscriptions.every((entry) => entry.stopped), true)
  const calls = q.calls.length
  q.change('feed', 'subscribed')
  q.change('second', 'changed')
  assert.equal(q.calls.length, calls)
})

test('ending a bounty and deleting content still use explicit host actions', async () => {
  const p = page({}, '#post/p')
  await flush()
  p.fire(p.button(p.$('bounty-card'), '结束悬赏'))
  assert.deepEqual(p.calls.find((call) => call.method === 'award').args, ['p', []])
  assert.equal(p.calls.find((call) => call.method === 'award').gesture, true)
  await flush()
  assert.match(p.$('notice').textContent, /确认框/)
  const q = page({ read: () => Promise.resolve(detail({ bounty: null })) }, '#post/p')
  await flush()
  assert.equal(q.$('bounty-card').hidden, true)
  assert.equal(q.$('award-bar').hidden, true)
  p.fire(p.button(p.$('replies').firstElementChild, '取消拉黑'))
  assert.deepEqual(p.calls.find((call) => call.method === 'block').args, ['other', false])
  q.fire(q.button(q.$('post-content'), '删除帖子'))
  assert.equal(q.calls.some((call) => call.method === 'remove'), false)
  q.fire(q.$('confirm-cancel'))
  assert.equal(q.calls.some((call) => call.method === 'remove'), false)
  q.fire(q.button(q.$('post-content'), '删除帖子'))
  q.fire(q.$('confirm-action'))
  assert.deepEqual(q.calls.find((call) => call.method === 'remove').args, [{ post: 'p' }])
  assert.equal(q.calls.find((call) => call.method === 'remove').gesture, true)
})

test('assignment success is reported only for an assigned result and disposal suppresses late notices', async () => {
  const p = page({ assign: () => Promise.resolve({ assigned: { agent: 'chosen' } }) }, '#post/p')
  await flush()
  p.fire(p.button(p.$('assignments'), '指派 agent'))
  assert.deepEqual(p.calls.find((call) => call.method === 'assign').args, ['p'])
  assert.equal(p.calls.find((call) => call.method === 'assign').gesture, true)
  await flush()
  assert.equal(p.$('notice').textContent, '已指派 agent。')
  const result = deferred()
  const q = page({ assign: () => result.promise }, '#post/p')
  await flush()
  q.fire(q.button(q.$('assignments'), '指派 agent'))
  q.fire(q.window, 'pagehide')
  result.resolve({ assigned: { agent: 'chosen' } })
  await flush()
  assert.equal(q.$('notice').textContent, '')
})

test('a deleted post hides the sticky award bar and plain bodies never become markup', async () => {
  let missing = false
  const p = page({ read: () => missing ? Promise.reject(new Error('forum_post_not_found')) : Promise.resolve(detail()) }, '#post/p')
  await flush()
  assert.equal(p.$('post-content').querySelector('.body').textContent, '<b>plain text</b>')
  assert.equal(p.$('post-content').querySelector('b'), null)
  p.fire(p.$('replies').firstElementChild.querySelector('.pick'))
  assert.equal(p.$('award-bar').hidden, false)
  missing = true
  p.change('p', 'deleted')
  await flush()
  assert.equal(p.$('award-bar').hidden, true)
  assert.equal(p.$('error').hidden, false)
  assert.equal(p.$('post-view').textContent.includes('null'), false)
})
