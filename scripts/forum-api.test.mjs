import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createForumApi } from '../sources/forum/forum-api.mjs'
import { read, reply, inbox } from '../sources/forum/tools.js'

const post = '11111111-1111-4111-8111-111111111111'
const agent = '22222222-2222-4222-8222-222222222222'
const replyId = '33333333-3333-4333-8333-333333333333'

test('bounty validation and cancellation never send a write before App confirmation', async () => {
  const calls = []
  const api = createForumApi({ backend: { rpc: (...args) => calls.push(args) }, modal: { open: async (ask) => { calls.push(ask); return { cancelled: true } } } })
  assert.throws(() => api.post({ title: 'Post', body: 'Body', bounty: { amount: 0, days: 1, visibility: 'public' } }))
  assert.equal(calls.length, 0)
  assert.deepEqual(await api.post({ title: 'Post', body: 'Body', bounty: { amount: 5, days: 1, visibility: 'public' } }), { cancelled: true })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].entry, 'consent.html')
  assert.equal(calls[0].data.draft.amount, 5)
})

test('agent picking starts in the click before any backend read or write', async () => {
  const calls = []
  let finish
  const api = createForumApi({
    pickAgent: (ask) => { calls.push(['pick', ask]); return new Promise((resolve) => { finish = resolve }) },
    backend: { rpc: async (...args) => { calls.push(args) } },
  })
  const pending = api.assign(post, 'The post title')
  assert.deepEqual(calls.map((c) => c[0]), ['pick'])
  finish({ agent: `user:${agent}` })
  assert.deepEqual(await pending, { assigned: { agent: `user:${agent}` } })
  assert.deepEqual(calls[1], ['forum_assign', { p_post_id: post, p_agent: agent }])
})

test('resubscription refreshes the existing forum view and event payload mapping is preserved', () => {
  let receive
  let stopped = false
  const api = createForumApi({ backend: { subscribe: (topic, callback) => {
    assert.equal(topic, 'gugu:forum:feed'); receive = callback; return () => { stopped = true }
  } } })
  const changes = []
  const stop = api.onChanged('feed', (value) => changes.push(value))
  receive({ event: 'subscribed' })
  receive({ event: 'forum_feed_changed', payload: { post_id: post, seq: 9 } })
  receive({ event: 'unrelated', payload: {} })
  assert.deepEqual(changes, [{ kind: 'subscribed' }, { kind: 'feed', seq: 9, entityId: post }])
  stop()
  assert.equal(stopped, true)
})

test('tools use the stamped agent and preserve backend refusals', async () => {
  const calls = []
  globalThis.gugu = { backend: { rpc: async (...args) => { calls.push(args); return replyId } } }
  await assert.rejects(() => read.run({ post_id: `post:${post}` }, {}), /Expected user/)
  assert.equal(calls.length, 0)
  await reply.run({ post_id: `post:${post}`, text: 'Answer' }, { agent: `user:${agent}` })
  assert.deepEqual(calls[0], ['forum_reply', { p_post_id: post, p_body: 'Answer', p_reply_to: null, p_as: agent }])
  globalThis.gugu.backend.rpc = async () => { throw Object.assign(new Error('forum_agent_not_assigned'), { code: 'failed' }) }
  await assert.rejects(() => read.run({ post_id: `post:${post}` }, { agent: `user:${agent}` }), /forum_agent_not_assigned/)
})

test('inbox settlements keep a per-post cursor and failures remain visible without acknowledging', async () => {
  const calls = []
  globalThis.gugu = { backend: { rpc: async (...args) => { calls.push(args) } } }
  const items = [{ id: `${post}:2`, text: 'a' }, { id: `${post}:7`, text: 'b' }]
  await inbox.settle({ agent: `user:${agent}`, items, outcome: 'accepted' })
  assert.deepEqual(calls, [['forum_ack', { p_agent: agent, p_post_id: post, p_seq: 7 }]])
  calls.length = 0
  await inbox.settle({ agent: `user:${agent}`, items, outcome: 'undelivered', error: 'No running session' })
  assert.deepEqual(calls, [['forum_record_delivery_failure', { p_agent: agent, p_post_id: post, p_state: 'undelivered', p_error: 'No running session' }]])
})


test('inbox events carry original time, a stable id, context and their own reply tool', async () => {
  const createdAt = '2026-11-02T10:00:00+00:00'
  globalThis.gugu = { backend: { rpc: async (name, args) => {
    assert.equal(name, 'forum_pull_agent_inbox')
    assert.deepEqual(args, { p_agent: agent })
    return [{ post_id: post, seq: 7, kind: 'assigned', created_at: createdAt, post_title: 'Question', post_body: 'Body', actor_name: 'Owner', reply_count: 2 }]
  } } }
  const [event] = await inbox.pull({ agent: `user:${agent}` })
  assert.equal(event.id, `${post}:7`)
  assert.equal(event.createdAt, createdAt)
  assert.equal(event.reply, 'reply')
  assert.match(event.text, /read them with forum__read/)
  assert.match(event.text, /Body/)
  assert.match(event.text, new RegExp(`post:${post}`))
})

test('list and read keep the original backend arguments and UI field mapping', async () => {
  const calls = []
  const person = { author_user_id: agent, author_name: 'Ada', author_avatar: null, author_points: '17' }
  const raw = {
    post: { id: post, title: 'Question', body: 'Body', created_at: 'then', ...person }, seq: '9', bounty: null,
    replies: [{ id: replyId, body: 'Answer', created_at: 'now', to_poster_only: true, reply_to: null, ...person,
      author_is_agent: true, owner_user_id: agent, owner_name: 'Owner', owner_points: '40' }],
    reactions: [{ target_kind: 'reply', target_id: replyId, emoji: '+', count: '2', mine: true }],
    assignments: [{ agent_user_id: agent, agent_name: 'Helper', delivery_state: 'delivered', last_error: null, updated_at: 'now' }],
  }
  const api = createForumApi({ backend: { rpc: async (name, args) => {
    calls.push([name, args])
    if (name === 'forum_me') return [{ user_id: agent, community_points: '40' }]
    if (name === 'forum_read_post') return raw
    return [{ post_id: post, title: 'Question', excerpt: 'Body', ...person, created_at: 'then', last_activity_at: 'now', reply_count: '2' }]
  } } })
  const list = await api.list({ query: 'needle', sort: 'new', filter: 'all', mine: 'posted', limit: 7, offset: 2 })
  assert.deepEqual(calls[0], ['forum_list_posts', { p_query: 'needle', p_sort: 'new', p_filter: 'all', p_mine: 'posted', p_limit: 7, p_offset: 2 }])
  assert.deepEqual(list.me, { id: `user:${agent}`, points: 40 })
  assert.equal(list.posts[0].author.points, 17)
  assert.equal(list.posts[0].replyCount, 2)
  const result = await api.read(post)
  assert.deepEqual(calls[2], ['forum_read_post', { p_post_id: post, p_as: null }])
  assert.equal(result.seq, 9)
  assert.equal(result.replies[0].toPosterOnly, true)
  assert.equal(result.replies[0].owner.id, `user:${agent}`)
  assert.equal(result.reactions[0].count, 2)
  assert.deepEqual(result.assignments[0], { agentId: `user:${agent}`, agentName: 'Helper', deliveryState: 'delivered', lastError: null, updatedAt: 'now' })
})
