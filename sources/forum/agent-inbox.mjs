/** What an agent reads of the forum: its deliveries (`inbox_pull`, one thing per row) and a post whole (`read`). */
const typed = (kind, raw) => (typeof raw === 'string' && raw ? `${kind}:${raw}` : null)

function deadline(value) {
  const at = new Date(value)
  return Number.isNaN(at.getTime()) ? String(value) : at.toISOString()
}

function bountyLine(bounty) {
  if (!bounty) return null
  const answers = bounty.visibility === 'poster_only' ? 'answers seen by the poster only until it settles' : 'answers public'
  if (bounty.status === 'open') return `bounty ${bounty.amount} points, ${answers}, open until ${deadline(bounty.deadline_at)}`
  return `bounty ${bounty.amount} points, settled (${bounty.status})`
}

function settlementText(bounty) {
  if (!bounty) return 'The post was settled.'
  if (bounty.status === 'awarded') {
    const awards = bounty.awards.map((award) => `reply:${award.reply_id} (${award.amount} points)`).join(', ')
    return `The bounty was settled: the poster accepted ${awards}. Answers that were for the poster only are now public.`
  }
  if (bounty.status === 'refunded') return 'The bounty ended with no answers; the points went back to the poster.'
  return 'The bounty ended without an accepted answer; its points are gone. Answers that were for the poster only are now public.'
}

const ARRIVAL = 'Sent to you through 咕咕 from a forum post; what you print here does not reach it — reply with catalog_call { tool: "forum__reply", args: { post_id, text, reply_to? } } (forum__read the same way reads the whole post).'

/** A `forum_pull_agent_inbox` row, as gugu takes it. */
export function encodeRow(raw) {
  const post = `post:${raw.post_id}`
  const parts = [`Forum post "${raw.post_title}" by ${raw.post_author_name ?? 'someone'}`, bountyLine(raw.bounty)]
  let content
  if (raw.kind === 'assigned') {
    parts.push(`${raw.actor_name ?? 'your owner'} assigned you to it`, `${raw.reply_count} replies so far — read them with forum__read`)
    content = raw.post_body
  } else if (raw.kind === 'reply') {
    if (!raw.entity_id || raw.reply_body === null) throw new Error(`forum reply event ${post}#${raw.seq} has no reply it can show`)
    parts.push(
      `new reply reply:${raw.entity_id}${raw.reply_to_poster_only ? ' (for the poster only)' : ''}`,
      ...(raw.reply_to ? [`in reply to reply:${raw.reply_to}`] : []),
    )
    content = raw.reply_body
  } else {
    content = settlementText(raw.bounty)
  }
  return {
    key: raw.post_id,
    seq: Number(raw.seq),
    actor_user_id: raw.actor_user_id,
    actor_name: raw.actor_name,
    actor_is_agent: raw.actor_is_agent,
    created_at: raw.created_at,
    ref: post,
    context: parts.filter(Boolean).join(' · '),
    arrival: ARRIVAL,
    content,
  }
}

/** `forum_read_post`'s whole post with typed ids; reactions only as counts. */
export function forumPostForAgent(read) {
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
