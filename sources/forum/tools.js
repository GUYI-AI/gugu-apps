// Forum reply visibility and authorization remain in the existing backend functions.
const encodeTypedId = (kind, raw) => `${kind}:${raw}`
const bare = (kind, value) => {
  const raw = typeof value === 'string' ? value.replace(new RegExp(`^${kind}:`), '') : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) throw new Error(`Expected ${kind}:<id>`)
  return raw
}
const rpc = (name, args) => gugu.backend.rpc(name, args)
const typed = (kind, raw) => (typeof raw === 'string' && raw ? encodeTypedId(kind, raw) : null)

/** forum_read_post 的整帖,换成带类型的 id;表情只给个数。 */
function forumPostForAgent(read) {
  const reactionsOf = (kind, id) => (read.reactions ?? [])
    .filter((reaction) => reaction.target_kind === kind && reaction.target_id === id)
    .map((reaction) => `${reaction.emoji}×${reaction.count}`)
  const bounty = read.bounty
    ? {
        amount: read.bounty.amount,
        answers: read.bounty.visibility === 'poster_only' ? 'for the poster only until it settles' : 'public',
        status: read.bounty.status,
        deadline_at: read.bounty.deadline_at,
        ...(read.bounty.status === 'awarded'
          ? { accepted: read.bounty.awards.map((award) => ({ reply: typed('reply', award.reply_id), points: award.amount })) }
          : {}),
      }
    : null
  return {
    post: {
      id: typed('post', read.post.id),
      title: read.post.title,
      author: { id: typed('user', read.post.author_user_id), name: read.post.author_name },
      created_at: read.post.created_at,
      body: read.post.body,
      reactions: reactionsOf('post', read.post.id),
    },
    bounty,
    replies: (read.replies ?? []).map((reply) => ({
      id: typed('reply', reply.id),
      author: { id: typed('user', reply.author_user_id), name: reply.author_name, ...(reply.author_is_agent ? { agent: true, owner: reply.owner_name } : {}) },
      ...(reply.reply_to ? { reply_to: typed('reply', reply.reply_to) } : {}),
      ...(reply.to_poster_only ? { for_poster_only: true } : {}),
      created_at: reply.created_at,
      body: reply.body,
      reactions: reactionsOf('reply', reply.id),
    })),
  }
}

export const read = {
  description: 'Read an assigned forum post, bounty and visible replies as yourself.',
  inputSchema: { type: 'object', properties: { post_id: { type: 'string', description: 'post:<id> from a forum delivery' } }, required: ['post_id'] },
  async run({ post_id }, { agent }) {
    const post = await rpc('forum_read_post', { p_post_id: bare('post', post_id), p_as: bare('user', agent) })
    if (!post || typeof post !== 'object') throw new Error('The database returned no post')
    return forumPostForAgent(post)
  },
}

export const reply = {
  description: 'Reply in an assigned forum post. Poster-only bounty replies stay private until settlement.',
  inputSchema: { type: 'object', properties: { post_id: { type: 'string' }, text: { type: 'string' }, reply_to: { type: 'string' } }, required: ['post_id', 'text'] },
  async run({ post_id, text, reply_to }, { agent }) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Reply text is required')
    const post = bare('post', post_id)
    const id = await rpc('forum_reply', { p_post_id: post, p_body: text, p_reply_to: reply_to ? bare('reply', reply_to) : null, p_as: bare('user', agent) })
    if (typeof id !== 'string') throw new Error('The database returned no reply id')
    return `Posted reply:${id} in post:${post}.`
  },
}

const timestamp = (iso) => {
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  const offset = -date.getTimezoneOffset() / 60
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${date.toTimeString().slice(0, 5)} ${offset === 8 ? '北京时间' : `UTC${offset >= 0 ? '+' : ''}${offset}`}`
}

function eventText(row) {
  const bounty = row.bounty
  const parts = [`Forum post "${row.post_title}" by ${row.post_author_name ?? 'someone'}`, `post:${row.post_id}`]
  if (bounty) {
    const answers = bounty.visibility === 'poster_only' ? 'answers seen by the poster only until it settles' : 'answers public'
    parts.push(bounty.status === 'open' ? `bounty ${bounty.amount} points, ${answers}, open until ${timestamp(bounty.deadline_at)}` : `bounty ${bounty.amount} points, settled (${bounty.status})`)
  }
  let content
  if (row.kind === 'assigned') {
    parts.push(`${row.actor_name ?? 'your owner'} assigned you to it`, `${row.reply_count} replies so far — read them with forum__read`)
    content = row.post_body
  } else if (row.kind === 'reply') {
    if (!row.entity_id || row.reply_body === null) throw new Error(`Forum reply event post:${row.post_id}#${row.seq} has no reply it can show`)
    parts.push(`new reply reply:${row.entity_id}${row.reply_to_poster_only ? ' (for the poster only)' : ''}`)
    if (row.reply_to) parts.push(`in reply to reply:${row.reply_to}`)
    content = row.reply_body
  } else if (!bounty) content = 'The post was settled.'
  else if (bounty.status === 'awarded') content = `The bounty was settled: the poster accepted ${bounty.awards.map((award) => `reply:${award.reply_id} (${award.amount} points)`).join(', ')}. Answers that were for the poster only are now public.`
  else if (bounty.status === 'refunded') content = 'The bounty ended with no answers; the points went back to the poster.'
  else content = 'The bounty ended without an accepted answer; its points are gone. Answers that were for the poster only are now public.'
  return `${parts.join(' · ')}\nFrom: ${row.actor_name ?? 'System'}${row.actor_user_id ? ` (user:${row.actor_user_id})` : ''}\nAt: ${timestamp(row.created_at)}\n\n${content}`
}

/** Reserved App source; the host supplies the same trusted agent identity as for tools. */
export const inbox = {
  async pull({ agent }) {
    const rows = await rpc('forum_pull_agent_inbox', { p_agent: bare('user', agent) })
    if (!Array.isArray(rows)) throw new Error('forum_pull_agent_inbox returned a non-list result')
    return rows.map((row) => ({ id: `${row.post_id}:${Number(row.seq)}`, text: eventText(row), createdAt: row.created_at, reply: 'reply' }))
  },
  async settle({ agent, items, outcome, error }) {
    const posts = new Map()
    for (const item of items) {
      const [post, seq] = String(item.id).split(':')
      bare('post', post)
      if (!Number.isSafeInteger(Number(seq)) || Number(seq) < 1) throw new Error('Invalid forum event sequence')
      posts.set(post, Math.max(posts.get(post) ?? 0, Number(seq)))
    }
    for (const [post, seq] of posts) {
      if (outcome === 'accepted') await rpc('forum_ack', { p_agent: bare('user', agent), p_post_id: post, p_seq: seq })
      else if (outcome === 'undelivered' || outcome === 'turn_failed') {
        await rpc('forum_record_delivery_failure', { p_agent: bare('user', agent), p_post_id: post, p_state: outcome, p_error: error ?? outcome })
      } else throw new Error('Unknown inbox settlement outcome')
    }
  },
}

