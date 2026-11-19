/**
 * The forum through `gugu.cloud` (App interface 31): the same answers `gugu.forum` gives on an older gugu, read and written
 * as the person through the `public.forum_*` functions. What they may see and do is judged there.
 */
const personId = (id) => `user:${String(id).replace(/^user:/, '')}`
const person = (id) => (id ? personId(id) : null)
const bare = (id) => String(id).replace(/^user:/, '')

const bountyOf = (row) => ({
  amount: Number(row.amount),
  visibility: row.visibility,
  deadlineAt: row.deadline_at,
  status: row.status,
  awards: (row.awards ?? []).map((award) => ({ userId: personId(award.user_id), replyId: award.reply_id, amount: Number(award.amount) })),
})

/** The rows `forum_read_post` gives, as the page reads them. */
export function postFromRead(read, meId) {
  return {
    seq: Number(read.seq),
    me: { id: meId },
    post: {
      id: read.post.id, title: read.post.title, body: read.post.body, createdAt: read.post.created_at,
      author: { id: person(read.post.author_user_id), name: read.post.author_name, avatar: read.post.author_avatar, points: Number(read.post.author_points ?? 0) },
    },
    bounty: read.bounty ? {
      ...bountyOf(read.bounty),
      posterId: person(read.bounty.poster_user_id ?? null),
      createdAt: read.bounty.created_at ?? null,
      settledAt: read.bounty.settled_at ?? null,
      refunded: Number(read.bounty.refunded ?? 0),
      burned: Number(read.bounty.burned ?? 0),
    } : null,
    replies: read.replies.map((reply) => ({
      id: reply.id, body: reply.body, createdAt: reply.created_at, toPosterOnly: reply.to_poster_only, replyTo: reply.reply_to,
      author: { id: person(reply.author_user_id), name: reply.author_name, avatar: reply.author_avatar, isAgent: reply.author_is_agent === true },
      owner: { id: person(reply.owner_user_id), name: reply.owner_name, points: Number(reply.owner_points ?? 0) },
    })),
    reactions: read.reactions.map((reaction) => ({
      targetKind: reaction.target_kind, targetId: reaction.target_id, emoji: reaction.emoji, count: Number(reaction.count), mine: reaction.mine,
    })),
    assignments: read.assignments.map((assignment) => ({
      agentId: personId(assignment.agent_user_id), agentName: assignment.agent_name, deliveryState: assignment.delivery_state,
      lastError: assignment.last_error, updatedAt: assignment.updated_at,
    })),
  }
}

function postFromList(row) {
  return {
    id: row.post_id,
    title: row.title,
    excerpt: row.excerpt,
    author: { id: person(row.author_user_id), name: row.author_name, avatar: row.author_avatar, points: Number(row.author_points ?? 0) },
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    replyCount: Number(row.reply_count ?? 0),
    bounty: row.amount === null || row.amount === undefined ? null : bountyOf({
      amount: row.amount, visibility: row.visibility, deadline_at: row.deadline_at, status: row.bounty_status, awards: row.awards ?? [],
    }),
  }
}

export function cloudForum(g) {
  const { cloud } = g
  async function me() {
    const [row] = await cloud.read('forum_me')
    if (!row) throw new Error('not authenticated')
    return { id: personId(row.user_id), points: Number(row.community_points) }
  }
  return {
    /** What moves points takes the page's own confirmation first: `post` with a bounty and `award`. */
    confirmsInPage: true,
    async list({ query, sort, filter, mine, limit, offset }) {
      const rows = await cloud.read('forum_list_posts', { p_query: query, p_sort: sort, p_filter: filter, p_mine: mine, p_limit: limit, p_offset: offset })
      return { me: await me(), posts: (rows ?? []).map(postFromList) }
    },
    async read(postId) {
      return postFromRead(await cloud.read('forum_read_post', { p_post_id: postId }), (await me()).id)
    },
    async post({ title, body, bounty }) {
      const id = await cloud.write('forum_create_post', {
        p_title: title, p_body: body, ...(bounty ? { p_amount: bounty.amount, p_days: bounty.days, p_visibility: bounty.visibility } : {}),
      })
      return { post: id }
    },
    async reply(postId, text, { replyTo } = {}) {
      return { reply: await cloud.write('forum_reply', { p_post_id: postId, p_body: text, p_reply_to: replyTo ?? null, p_as: null }) }
    },
    react({ kind, id, emoji, on }) {
      return cloud.write('forum_react', { p_kind: kind, p_target: id, p_emoji: emoji, p_on: on, p_as: null })
    },
    remove({ reply, post }) {
      return reply ? cloud.write('forum_delete_reply', { p_reply_id: reply, p_as: null }) : cloud.write('forum_delete_post', { p_post_id: post })
    },
    block(userId, on) {
      return cloud.write('forum_block', { p_user_id: bare(userId), p_on: on })
    },
    /** Their press in gugu's sheet is what assigns: the write goes with the ask. */
    async assign(postId, agentId, title) {
      const picked = await g.pickAgent({
        title: '指派 agent',
        subject: title,
        body: '选一个你名下的 agent 来回答这个帖子。它会收到帖子正文，之后楼主和你在帖子里的交代也会送到它那里。',
        action: '指派',
        search: '搜索 agent',
        empty: '你还没有 agent。',
        ...(agentId ? { preselect: agentId } : {}),
        write: { name: 'forum_assign', args: { p_post_id: postId }, agent: 'p_agent' },
      })
      return picked.cancelled ? { cancelled: true } : { assigned: { agent: picked.agent } }
    },
    award(postId, awards) {
      return cloud.write('forum_award', { p_post_id: postId, p_awards: awards.map(({ reply, amount }) => ({ reply_id: reply, amount })) })
    },
    onChanged(target, fn) {
      const feed = target === 'feed'
      return cloud.on(`gugu:forum:${target}`, feed ? 'forum_feed_changed' : 'forum_changed', (heard) => {
        if (heard.subscribed) { fn({ kind: 'subscribed' }); return }
        const { payload } = heard
        fn({
          kind: feed ? 'feed' : String(payload.kind ?? 'changed'),
          ...(typeof payload.seq === 'number' ? { seq: payload.seq } : {}),
          ...(typeof payload.entity_id === 'string' ? { entityId: payload.entity_id } : {}),
        })
      })
    },
  }
}
