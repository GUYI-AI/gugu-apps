// Parameter validation and field mapping moved from the host; the backend contract is unchanged.
import { wordsFor } from './consent-words.mjs';
const invalid = (message)=>Object.assign(new Error(message), {
        code: 'invalid'
    });
const failed = (message)=>Object.assign(new Error(message), {
        code: 'failed'
    });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function idOf(value, what) {
    if (typeof value !== 'string' || !UUID.test(value)) throw invalid(`${what} is the id a forum read gave back`);
    return value.toLowerCase();
}
function userOf(value, what) {
    const raw = typeof value === 'string' ? value.replace(/^user:/, '') : '';
    if (!UUID.test(raw)) throw invalid(`${what} is a user:<id>, as a forum read or gugu.listAgents() gives it`);
    return raw.toLowerCase();
}
function textOf(value, what, max) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text || text.length > max) throw invalid(`${what} is text of 1 to ${max} characters`);
    return text;
}
const personId = (id)=>`user:${id}`;
const person = (id)=>id ? personId(id) : null;
const bountyOf = (row)=>({
        amount: Number(row.amount),
        visibility: row.visibility,
        deadlineAt: row.deadline_at,
        status: row.status,
        awards: (row.awards ?? []).map((award)=>({
                userId: personId(award.user_id),
                replyId: award.reply_id,
                amount: Number(award.amount)
            }))
    });
export function createForumApi(g, locale = "zh-CN") {
    async function rpc(name, args) {
        return g.backend.rpc(name, args);
    }
    async function me() {
        const [row] = await rpc('forum_me', {});
        if (!row) throw failed('This session has no signed-in person');
        return {
            id: personId(row.user_id),
            points: Number(row.community_points)
        };
    }
    const api = {
        onChanged (target, onChange) {
            const feed = target === 'feed';
            const topic = feed ? 'gugu:forum:feed' : `gugu:forum:${idOf(target, 'target')}`;
            return g.backend.subscribe(topic, (message)=>{
                if (message.event === 'subscribed') {
                    onChange({
                        kind: 'subscribed'
                    });
                    return;
                }
                if (message.event !== (feed ? 'forum_feed_changed' : 'forum_changed')) return;
                const payload = message.payload ?? {};
                onChange({
                    kind: feed ? 'feed' : String(payload.kind ?? 'changed'),
                    ...typeof payload.seq === 'number' ? {
                        seq: payload.seq
                    } : {},
                    ...typeof payload.entity_id === 'string' ? {
                        entityId: payload.entity_id
                    } : typeof payload.post_id === 'string' && feed ? {
                        entityId: payload.post_id
                    } : {}
                });
            });
        },
        async list (args = {}) {
            const pick = (key, allowed)=>{
                if (args[key] === undefined || args[key] === null) return null;
                if (!allowed.includes(args[key])) throw invalid(`${key} is one of ${allowed.join(' | ')}`);
                return args[key];
            };
            const limit = args.limit ?? 30;
            const offset = args.offset ?? 0;
            if (!(Number.isInteger(limit) && limit >= 1 && limit <= 100)) throw invalid('limit is a whole number from 1 to 100');
            if (!(Number.isInteger(offset) && offset >= 0)) throw invalid('offset is a whole number from 0');
            const rows = await rpc('forum_list_posts', {
                p_query: typeof args.query === 'string' ? args.query : null,
                p_sort: pick('sort', [
                    'active',
                    'new',
                    'amount',
                    'deadline'
                ]) ?? 'active',
                p_filter: pick('filter', [
                    'all',
                    'bounty_open',
                    'bounty_settled'
                ]) ?? 'all',
                p_mine: pick('mine', [
                    'posted',
                    'answered'
                ]),
                p_limit: limit,
                p_offset: offset
            });
            return {
                me: await me(),
                posts: (rows ?? []).map((row)=>({
                        id: row.post_id,
                        title: row.title,
                        excerpt: row.excerpt,
                        author: {
                            id: person(row.author_user_id),
                            name: row.author_name,
                            avatar: row.author_avatar,
                            points: Number(row.author_points ?? 0)
                        },
                        createdAt: row.created_at,
                        lastActivityAt: row.last_activity_at,
                        replyCount: Number(row.reply_count ?? 0),
                        bounty: row.amount === null || row.amount === undefined ? null : bountyOf({
                            amount: row.amount,
                            visibility: row.visibility,
                            deadline_at: row.deadline_at,
                            status: row.bounty_status,
                            awards: row.awards ?? []
                        })
                    }))
            };
        },
        async read (postId) {
            const post = idOf(postId, 'postId');
            const read = await rpc('forum_read_post', {
                p_post_id: post,
                p_as: null
            });
            return {
                seq: Number(read.seq),
                me: {
                    id: (await me()).id
                },
                post: {
                    id: read.post.id,
                    title: read.post.title,
                    body: read.post.body,
                    createdAt: read.post.created_at,
                    author: {
                        id: person(read.post.author_user_id),
                        name: read.post.author_name,
                        avatar: read.post.author_avatar,
                        points: Number(read.post.author_points ?? 0)
                    }
                },
                bounty: read.bounty ? {
                    ...bountyOf(read.bounty),
                    posterId: person(read.bounty.poster_user_id ?? null),
                    createdAt: read.bounty.created_at ?? null,
                    settledAt: read.bounty.settled_at ?? null,
                    refunded: Number(read.bounty.refunded ?? 0),
                    burned: Number(read.bounty.burned ?? 0)
                } : null,
                replies: read.replies.map((reply)=>({
                        id: reply.id,
                        body: reply.body,
                        createdAt: reply.created_at,
                        toPosterOnly: reply.to_poster_only,
                        replyTo: reply.reply_to,
                        author: {
                            id: person(reply.author_user_id),
                            name: reply.author_name,
                            avatar: reply.author_avatar,
                            isAgent: reply.author_is_agent === true
                        },
                        owner: {
                            id: person(reply.owner_user_id),
                            name: reply.owner_name,
                            points: Number(reply.owner_points ?? 0)
                        }
                    })),
                reactions: read.reactions.map((reaction)=>({
                        targetKind: reaction.target_kind,
                        targetId: reaction.target_id,
                        emoji: reaction.emoji,
                        count: Number(reaction.count),
                        mine: reaction.mine
                    })),
                assignments: read.assignments.map((assignment)=>({
                        agentId: personId(assignment.agent_user_id),
                        agentName: assignment.agent_name,
                        deliveryState: assignment.delivery_state,
                        lastError: assignment.last_error,
                        updatedAt: assignment.updated_at
                    }))
            };
        },
        async postPlain (args) {
            const id = await rpc('forum_create_post', {
                p_title: textOf(args.title, 'title', 100),
                p_body: textOf(args.body, 'body', 20000)
            });
            return {
                post: id
            };
        },
        bountyDraft (args) {
            const bounty = args.bounty ?? {};
            const { amount, days, visibility } = bounty;
            if (!(Number.isInteger(amount) && amount >= 1 && amount <= 100)) throw invalid('bounty.amount is a whole number of points from 1 to 100');
            if (days !== 1 && days !== 3 && days !== 7) throw invalid('bounty.days is 1, 3 or 7');
            if (visibility !== 'public' && visibility !== 'poster_only') throw invalid('bounty.visibility is "public" or "poster_only"');
            return {
                title: textOf(args.title, 'title', 100),
                body: textOf(args.body, 'body', 20000),
                amount: amount,
                days,
                visibility
            };
        },
        async createBountyPost (draft) {
            const id = await rpc('forum_create_post', {
                p_title: draft.title,
                p_body: draft.body,
                p_amount: draft.amount,
                p_days: draft.days,
                p_visibility: draft.visibility
            });
            return {
                post: id
            };
        },
        async reply (postId, text, options = {}) {
            const id = await rpc('forum_reply', {
                p_post_id: idOf(postId, 'postId'),
                p_body: textOf(text, 'text', 20000),
                p_reply_to: options.replyTo === undefined || options.replyTo === null ? null : idOf(options.replyTo, 'replyTo'),
                p_as: null
            });
            return {
                reply: id
            };
        },
        async react (args) {
            if (args.kind !== 'post' && args.kind !== 'reply') throw invalid('kind is "post" or "reply"');
            if (typeof args.on !== 'boolean') throw invalid('on is true (add) or false (take back)');
            await rpc('forum_react', {
                p_kind: args.kind,
                p_target: idOf(args.id, 'id'),
                p_emoji: textOf(args.emoji, 'emoji', 16),
                p_on: args.on,
                p_as: null
            });
        },
        async remove (args) {
            if (args.reply === undefined === (args.post === undefined)) throw invalid('Say what to remove: { reply: id } or { post: id }');
            if (args.reply !== undefined) await rpc('forum_delete_reply', {
                p_reply_id: idOf(args.reply, 'reply'),
                p_as: null
            });
            else await rpc('forum_delete_post', {
                p_post_id: idOf(args.post, 'post')
            });
        },
        async block (userId, on) {
            if (typeof on !== 'boolean') throw invalid('on is true (block) or false (unblock)');
            await rpc('forum_block', {
                p_user_id: userOf(userId, 'userId'),
                p_on: on
            });
        },
        async assign (postId, title) {
            const post = idOf(postId, 'postId');
            const picked = await g.pickAgent({
                title,
                note: wordsFor(locale).assignBody
            });
            if (!picked) return {
                cancelled: true
            };
            await rpc('forum_assign', {
                p_post_id: post,
                p_agent: userOf(picked.agent, 'agent')
            });
            return {
                assigned: picked
            };
        },
        async awardDraft (postId, awards) {
            const post = idOf(postId, 'postId');
            if (!Array.isArray(awards) || awards.length > 3) throw invalid('awards is a list of at most 3 { reply, amount }; [] ends the bounty without accepting');
            const read = await rpc('forum_read_post', {
                p_post_id: post,
                p_as: null
            });
            return {
                post,
                title: read.post.title,
                awards: awards.map((entry)=>{
                    const { reply, amount } = entry ?? {};
                    const id = idOf(reply, 'awards[].reply');
                    const found = read.replies.find((candidate)=>candidate.id === id);
                    if (!found) throw invalid(`${id} is not a reply in this post`);
                    if (!(Number.isInteger(amount) && amount >= 1)) throw invalid('awards[].amount is a whole number of points from 1');
                    return {
                        reply: id,
                        amount: amount,
                        to: found.owner_name ?? found.author_name ?? ''
                    };
                })
            };
        },
        async settle (draft) {
            const row = await rpc('forum_award', {
                p_post_id: draft.post,
                p_awards: draft.awards.map((award)=>({
                        reply_id: award.reply,
                        amount: award.amount
                    }))
            });
            return {
                status: row.status
            };
        }
    };
    const confirm = (type, draft)=>{
        const words = wordsFor(locale);
        const title = type === 'bounty' ? words.postTitle : draft.awards.length ? words.acceptTitle : words.endTitle;
        return g.modal.open({
            entry: 'consent.html',
            title,
            data: {
                type,
                draft
            }
        });
    };
    return {
        ...api,
        post (args) {
            return args.bounty == null ? api.postPlain(args) : confirm('bounty', api.bountyDraft(args));
        },
        async award (post, awards) {
            return confirm('award', await api.awardDraft(post, awards));
        }
    };
}
