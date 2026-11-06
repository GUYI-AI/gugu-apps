import { encodeRow, forumPostForAgent } from './agent-inbox.mjs'

const decode = (kind, value, name) => {
  const prefix = `${kind}:`
  if (typeof value !== 'string' || !value.startsWith(prefix)) throw new Error(`${name} is ${kind}:<id>, as the delivery or read gives it.`)
  return value.slice(prefix.length)
}
const bare = (agent) => {
  if (typeof agent !== 'string' || !agent) throw new Error('This call has no agent behind it.')
  return agent.replace(/^user:/, '')
}
/** gugu before `gugu.cloud` still has its own forum tools; say which. */
const cloud = () => {
  if (!gugu.cloud) throw new Error('This gugu answers forum posts with its own forum_read and forum_reply.')
  return gugu.cloud
}
const postId = { type: 'string', description: 'post:<id>, as the delivery or read gives it.' }
const hostOnly = { ui: { visibility: ['app'] } }

export const reply = {
  description: 'Reply in a forum post you were assigned to. Optionally answer one reply (reply_to). Replies are public, or for the poster only while a poster-only bounty is open.',
  inputSchema: { type: 'object', required: ['post_id', 'text'], properties: {
    post_id: postId,
    text: { type: 'string', minLength: 1 },
    reply_to: { type: 'string', description: 'reply:<id> of the reply you answer.' },
  } },
  async run({ post_id, text, reply_to }, { agent }) {
    const post = decode('post', post_id, 'post_id')
    const id = await cloud().write('forum_reply', {
      p_post_id: post, p_body: text, p_reply_to: reply_to ? decode('reply', reply_to, 'reply_to') : null, p_as: bare(agent),
    })
    if (typeof id !== 'string') throw new Error('forum_reply: the database returned no reply id')
    return `Posted reply:${id} in post:${post}.`
  },
}

export const read = {
  description: 'Read a forum post whole — body, bounty, and the replies you can see — as yourself.',
  inputSchema: { type: 'object', required: ['post_id'], properties: { post_id: postId } },
  async run({ post_id }, { agent }) {
    const found = await cloud().read('forum_read_post', { p_post_id: decode('post', post_id, 'post_id'), p_as: bare(agent) })
    if (!found || typeof found !== 'object') throw new Error('forum_read: the database returned no post')
    return JSON.stringify(forumPostForAgent(found))
  },
}

// What gugu asks when a forum event should reach an agent (apps-cloud). The agent in these is who the host is delivering to.
export const inbox_pull = {
  description: 'What to hand this agent.',
  inputSchema: { type: 'object', required: ['agent'], properties: { agent: { type: 'string' } } },
  _meta: hostOnly,
  async run({ agent }) {
    const rows = await cloud().read('forum_pull_agent_inbox', { p_agent: agent })
    if (!Array.isArray(rows)) throw new Error('forum_pull_agent_inbox returned a non-list result')
    return JSON.stringify(rows.map(encodeRow))
  },
}

export const inbox_ack = {
  description: 'It was taken, up to this sequence.',
  inputSchema: { type: 'object', required: ['agent', 'key', 'seq'], properties: { agent: { type: 'string' }, key: { type: 'string' }, seq: { type: 'number' } } },
  _meta: hostOnly,
  async run({ agent, key, seq }) {
    await cloud().write('forum_ack', { p_agent: agent, p_post_id: key, p_seq: seq })
    return 'null'
  },
}

export const inbox_failed = {
  description: 'It could not be delivered: shown on the assignment, for the owner.',
  inputSchema: { type: 'object', required: ['agent', 'state', 'error'], properties: {
    agent: { type: 'string' }, key: { type: 'string' }, command: { type: 'object' }, state: { type: 'string' }, error: { type: 'string' },
  } },
  _meta: hostOnly,
  async run({ agent, key, command, state, error }) {
    const post = key ?? command?.post_id
    if (!post) throw new Error('This delivery names no post')
    await cloud().write('forum_record_delivery_failure', { p_agent: agent, p_post_id: post, p_state: state, p_error: error })
    return 'null'
  },
}
