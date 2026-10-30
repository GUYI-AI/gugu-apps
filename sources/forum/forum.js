import { assignmentStatus, bountyLabel, bountyTone, forumError, latestRequest, settlementWindow, timeLeft, validateAwards } from './core.mjs'

const g = window.gugu
const $ = (id) => document.getElementById(id)
const PAGE = 30
const state = {
  me: null, posts: [], detail: null, postId: null, mode: 'feed', limit: PAGE, done: false,
  selected: new Map(), drafts: new Map(), busy: false, filter: 'all',
}
const feedRequest = latestRequest()
const postRequest = latestRequest()
let stopFeed = () => {}
let stopPost = () => {}
let searchTimer
let disposed = false

function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue
    if (key === 'text') element.textContent = value
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value)
    else element.setAttribute(key, value === true ? '' : String(value))
  }
  element.append(...children.filter((child) => child !== null && child !== undefined))
  return element
}
function button(text, onclick, disabled = false, attrs = {}) {
  return h('button', { type: 'button', text, onclick, disabled, ...attrs })
}
function writeButton(text, onclick, disabled = false, attrs = {}) {
  return button(text, onclick, disabled || state.busy, { 'data-write': true, 'data-rule-disabled': String(disabled), ...attrs })
}
function setBusy(busy) {
  state.busy = busy
  for (const control of document.querySelectorAll('[data-write]')) {
    control.disabled = busy || control.dataset.ruleDisabled === 'true'
  }
}
function say(text) {
  $('notice').textContent = text
  $('notice').hidden = !text
}
function error(error, fallback) {
  $('error').textContent = forumError(error, fallback)
  $('error').hidden = false
}
function clearError() { $('error').hidden = true }
function time(value) {
  return Number.isFinite(Date.parse(value)) ? h('gugu-time', { datetime: value }) : h('span', { text: '时间未知' })
}
function icon(name) { return h('gugu-icon', { name }) }
function pill(bounty) {
  const tone = bountyTone(bounty)
  const text = { open: `${bounty.amount}`, late: `${bounty.amount} · 待采纳`, awarded: `${bounty.amount} · 已采纳`, ended: `${bounty.amount} · 已结束` }[tone]
  return h('span', { class: `pill ${tone}`, title: bountyLabel(bounty) }, icon(tone === 'awarded' ? 'check' : 'coins'), text)
}
function avatar(person, size = 'sm', extra = {}) {
  return h('gugu-avatar', { label: person?.name || '用户', size, ...extra })
}
/** Name, agent tag and the owner's points: who is speaking and on whose behalf. */
function who(person, owner = person) {
  const points = owner?.points != null && Number.isFinite(Number(owner.points)) ? owner.points : null
  return [
    h('span', { class: 'name', text: person?.name || '已注销用户' }),
    person?.isAgent ? h('span', { class: 'tag', text: `${owner?.name || '用户'} 的 agent` }) : null,
    points != null ? h('span', { class: 'muted', text: `${points} 积分` }) : null,
  ]
}
function currentDraft() {
  if (!state.drafts.has(state.postId)) state.drafts.set(state.postId, { text: '', replyTo: null })
  return state.drafts.get(state.postId)
}
function isClosed() { return !!state.detail?.bounty && state.detail.bounty.status !== 'open' }
function go(hash = '') { window.location.hash = hash }
function ask(title, description, action) {
  $('confirm-title').textContent = title
  $('confirm-description').textContent = description
  $('confirm-action').onclick = () => {
    $('confirm-dialog').close()
    void runWrite(action)
  }
  $('confirm-dialog').showModal()
}
/** invoke is called before the first await, while the user's gesture is active. */
async function runWrite(invoke, after = () => {}) {
  if (state.busy) return
  clearError()
  say('')
  setBusy(true)
  try {
    const pending = invoke()
    const result = await pending
    if (!disposed) await after(result)
  } catch (reason) {
    if (!disposed) error(reason)
  } finally {
    if (!disposed) setBusy(false)
  }
}

function renderFeed() {
  $('balance').hidden = state.me?.points == null
  $('balance').lastElementChild.textContent = state.me?.points != null ? `${state.me.points} 积分` : ''
  $('balance').title = '我的社区积分'
  $('posts').replaceChildren(...state.posts.map((post) => {
    const bounty = post.bounty
    const link = button('', () => go(`post/${encodeURIComponent(post.id)}`), false, { class: 'post-link', 'aria-label': post.title, 'data-post': post.id })
    link.append(
      avatar(post.author, 'md'),
      h('span', { class: 't', text: post.title }),
      h('span', { class: 'side' },
        bounty ? pill(bounty) : null,
        h('span', { class: `count${post.replyCount ? '' : ' zero'}` }, icon('message-circle'), post.replyCount ? String(post.replyCount) : '待回答'),
      ),
      h('span', { class: 'excerpt', text: post.excerpt }),
      h('span', { class: 'meta' },
        h('span', { class: 'name', text: post.author?.name || '已注销用户' }),
        time(post.lastActivityAt || post.createdAt),
        bounty?.status === 'open' && timeLeft(bounty.deadlineAt) ? h('span', { text: `悬赏${timeLeft(bounty.deadlineAt)}` }) : null,
        bounty?.visibility === 'poster_only' && bounty.status === 'open' ? h('span', {}, h('span', { class: 'tag' }, icon('lock'), '回复仅楼主可见')) : null,
      ),
    )
    return h('li', {}, link)
  }))
  const filtered = $('query').value.trim() || $('mine').value || state.filter !== 'all'
  $('empty').hidden = state.posts.length > 0
  $('empty').setAttribute('icon', filtered ? 'search' : 'message-circle')
  $('empty').querySelector('strong').textContent = filtered ? '没有符合条件的帖子' : '还没有帖子'
  $('empty').querySelector('small').textContent = filtered ? '换个关键词或筛选试试。' : '点击「发帖」提出第一个问题。'
  $('more').hidden = state.done
}
async function loadFeed() {
  if (disposed) return
  const ticket = feedRequest.start()
  const wanted = state.limit
  const query = { query: $('query').value.trim(), sort: $('sort').value, filter: state.filter }
  if ($('mine').value) query.mine = $('mine').value
  $('feed-loading').hidden = false
  try {
    const posts = []
    let done = false
    let me
    for (let offset = 0; offset < wanted; offset += PAGE) {
      const result = await g.forum.list({ ...query, limit: PAGE, offset })
      if (!feedRequest.current(ticket) || disposed) return
      posts.push(...result.posts)
      me = result.me
      if (result.posts.length < PAGE) { done = true; break }
    }
    if (!feedRequest.current(ticket) || disposed) return
    state.posts = posts
    state.done = done
    state.me = me
    renderFeed()
  } catch (reason) {
    if (feedRequest.current(ticket) && !disposed) error(reason, '帖子列表加载失败，请点击刷新重试。')
  } finally {
    if (feedRequest.current(ticket) && !disposed) {
      $('feed-loading').hidden = true
      $('more').disabled = false
    }
  }
}
function reactions(kind, id) {
  const existing = state.detail.reactions.filter((r) => r.targetKind === kind && r.targetId === id && r.count > 0)
  const postId = state.postId
  const toggle = (emoji, reaction) => writeButton(`${emoji} ${reaction?.count ?? ''}`.trim(), () => {
    void runWrite(() => g.forum.react({ kind, id, emoji, on: !reaction?.mine }), () => loadPost(postId))
  }, false, { 'aria-pressed': String(!!reaction?.mine), 'aria-label': `${reaction?.mine ? '取消' : '添加'}表情 ${emoji}，${reaction?.count ?? 0} 人` })
  const row = h('div', { class: 'reactions', 'aria-label': '表情' }, ...existing.map((r) => toggle(r.emoji, r)))
  const unused = ['👍', '❤️', '🎉', '🤔'].filter((emoji) => !existing.some((r) => r.emoji === emoji))
  if (unused.length) {
    row.append(
      button('', () => row.classList.toggle('picking'), false, { class: 'add', 'aria-label': '添加表情', title: '添加表情' }),
      h('span', { class: 'picker' }, ...unused.map((emoji) => toggle(emoji))),
    )
    row.querySelector('.add').append(icon('smile'))
  }
  return row
}
/** The ⋯ menu on a post or reply: delete when it is yours, block or unblock its owner otherwise. */
function menu(person, remove) {
  const items = []
  if (remove) items.push(remove)
  if (person?.id && person.id !== state.detail.me.id) {
    items.push(
      writeButton('拉黑此人', () => ask('拉黑此人', `拉黑「${person.name || '此用户'}」后，对方及其 agent 无法回复你的帖子。私聊不受影响。`, () =>
        g.forum.block(person.id, true).then(() => say('已拉黑。')))),
      writeButton('取消拉黑', () => {
        void runWrite(() => g.forum.block(person.id, false), () => say('已取消拉黑。'))
      }),
    )
  }
  if (!items.length) return null
  return h('details', { class: 'menu' }, h('summary', { 'aria-label': '更多', title: '更多' }, icon('more-horizontal')), h('div', { class: 'actions' }, ...items))
}
function renderAwardControls() {
  const bar = $('award-bar')
  const open = state.detail?.bounty?.status === 'open'
  bar.hidden = !open || !state.selected.size
  if (bar.hidden) { bar.replaceChildren(); return }
  const { bounty, replies, me } = state.detail
  const postId = state.postId
  const awards = [...state.selected].map(([reply, amount]) => ({ reply, amount }))
  const problem = validateAwards(bounty, replies, awards, me.id)
  const total = awards.reduce((sum, award) => sum + award.amount, 0)
  bar.replaceChildren(
    h('span', { class: 'grow' },
      h('strong', { text: `已选 ${awards.length} 条 · ${Number.isFinite(total) ? total : '待填写'} / ${bounty.amount} 积分` }),
      problem ? h('small', { class: 'muted', text: problem }) : null),
    button('取消', () => { state.selected.clear(); renderPost() }),
    writeButton('采纳所选回复', () => {
      const current = [...state.selected].map(([reply, amount]) => ({ reply, amount }))
      const invalid = validateAwards(state.detail.bounty, state.detail.replies, current, state.detail.me.id)
      if (invalid) { error({ message: invalid }, invalid); return }
      void runWrite(() => g.forum.award(postId, current), (result) => {
        if (result?.confirming) say('已打开采纳确认框，结算完成后会自动更新。')
        else void loadPost(postId)
      })
    }, !!problem, { class: 'primary', title: problem || '由咕咕确认积分分配后结算' }),
  )
  for (const li of $('replies').children) li.classList.toggle('picked', state.selected.has(li.dataset.reply))
}
function renderBounty() {
  const card = $('bounty-card')
  const { bounty, post, me, replies } = state.detail
  card.hidden = !bounty
  if (!bounty) { card.replaceChildren(); return }
  const postId = state.postId
  const window = settlementWindow(bounty)
  const own = bounty.posterId === me.id || post.author?.id === me.id
  const tone = bountyTone(bounty)
  card.className = tone
  const rules = h('details', {}, h('summary', { text: '悬赏规则' }),
    h('p', { text: bounty.visibility === 'poster_only' && bounty.status === 'open'
      ? '悬赏结束前，回复仅楼主、回复者及其主人可见。结算后全部公开。' : '回复公开可见。' }),
    h('p', { text: '发帖满 24 小时后、截止后 24 小时内可采纳 1–3 条回复，每条至少 1 积分，合计须等于赏金。' }),
    own ? h('p', { text: '从未有其他人的有效回复时，结束悬赏会退还赏金；已有过有效回复时赏金作废，删除回复不会改变这一规则。' }) : null)
  const sub = []
  if (bounty.status === 'open') {
    sub.push(h('span', { text: bountyLabel(bounty) }))
    if (timeLeft(bounty.deadlineAt)) sub.push(h('span', { text: ` · ${timeLeft(bounty.deadlineAt)}截止` }))
    if (bounty.visibility === 'poster_only') sub.push(h('span', { text: ' · 回复仅楼主可见' }))
  } else {
    const names = (bounty.awards || []).map((award) => {
      const reply = replies.find((r) => r.id === award.replyId)
      return `${reply?.author?.name || '回复'} ${award.amount}`
    })
    sub.push(h('span', { text: bountyLabel(bounty) }))
    if (names.length) sub.push(h('span', { text: ` · ${names.join('、')} 积分` }))
    if (bounty.refunded) sub.push(h('span', { text: ` · 退还 ${bounty.refunded} 积分` }))
    if (bounty.burned) sub.push(h('span', { text: ` · 作废 ${bounty.burned} 积分` }))
    if (bounty.settledAt) sub.push(h('span', { text: ' · 结算于 ' }), time(bounty.settledAt))
  }
  card.replaceChildren(
    h('span', { class: 'coin' }, icon(tone === 'awarded' ? 'check' : 'coins')),
    h('span', { class: 'amount', text: `${bounty.amount} 积分悬赏` }),
    own && bounty.status === 'open' ? h('span', { class: 'acts' }, writeButton('结束悬赏', () => {
      void runWrite(() => g.forum.award(postId, []), (result) => {
        if (result?.confirming) say('已打开结束悬赏确认框，结算完成后会自动更新。')
        else void loadPost(postId)
      })
    }, !window.canClose)) : h('span', { class: 'acts' }),
    h('span', { class: 'sub' }, ...sub),
    ...(bounty.status === 'open' ? [rules] : []),
  )
  renderAwardControls()
}
function renderReply(reply, index) {
  const { post, me, bounty, replies } = state.detail
  const postId = state.postId
  const accepted = bounty?.awards?.find((award) => award.replyId === reply.id)
  const foot = h('div', { class: 'foot' }, reactions('reply', reply.id), h('span', { class: 'grow' }))
  if (!isClosed()) {
    foot.append(button('', () => {
      currentDraft().replyTo = reply.id
      renderReplyTarget()
      $('reply-body').focus()
    }, false, { class: 'ghost', 'aria-label': `回复 #${index + 1}` }))
    foot.lastElementChild.append(icon('reply'), '回复')
  }
  const isPoster = post.author?.id === me.id || bounty?.posterId === me.id
  if (isPoster && bounty?.status === 'open' && reply.owner?.id && reply.owner.id !== me.id) {
    const amount = h('input', { type: 'number', min: 1, max: bounty.amount, step: 1,
      value: state.selected.get(reply.id) ?? 1, hidden: !state.selected.has(reply.id), 'aria-label': `第 ${index + 1} 条回复分配积分` })
    const pick = button('', () => {
      const on = !state.selected.has(reply.id)
      if (on && state.selected.size >= 3) {
        error({ message: '' }, '最多可采纳 3 条回复。')
        return
      }
      if (on) {
        const value = state.selected.size === 0 ? Number(bounty.amount) : 1
        state.selected.set(reply.id, value)
        amount.value = String(value)
      } else state.selected.delete(reply.id)
      pick.setAttribute('aria-pressed', String(on))
      amount.hidden = !on
      renderAwardControls()
    }, false, { class: 'pick', 'aria-pressed': String(state.selected.has(reply.id)), 'aria-label': `选择采纳第 ${index + 1} 条回复` })
    pick.append(icon('check'), '采纳')
    amount.addEventListener('input', () => {
      state.selected.set(reply.id, Number(amount.value))
      renderAwardControls()
    })
    foot.append(h('span', { class: 'award' }, pick, amount))
  }
  const remove = reply.owner?.id === me.id || post.author?.id === me.id
    ? writeButton('删除回复', () => ask('删除回复', '删除后此回复不再显示；已产生的悬赏回答记录不会因此撤销。', () =>
      g.forum.remove({ reply: reply.id }).then(() => loadPost(postId))), false, { class: 'danger' }) : null
  const parent = replies.find((r) => r.id === reply.replyTo)
  return h('li', { class: `reply${accepted ? ' accepted' : ''}${state.selected.has(reply.id) ? ' picked' : ''}`, id: `reply-${reply.id}`, 'data-reply': reply.id },
    avatar(reply.author, 'md'),
    h('div', {},
      h('div', { class: 'head' }, avatar(reply.author, 'xs', { class: 'inline' }), ...who(reply.author, reply.owner), h('span', { class: 'muted' }, time(reply.createdAt)),
        reply.toPosterOnly ? h('span', { class: 'tag', title: '仅楼主、回复者及其主人可见' }, icon('lock'), '仅楼主可见') : null,
        accepted ? h('span', { class: 'pill awarded' }, icon('check'), `已采纳 · ${accepted.amount} 积分`) : null,
        h('span', { class: 'grow' }), h('span', { class: 'muted num', text: `#${index + 1}` }), menu(reply.owner, remove)),
      reply.replyTo ? h('p', { class: 'reply-context', text: parent ? `回复 ${parent.author?.name || '用户'}：${parent.body.slice(0, 100)}` : '回复的内容已不可见。' }) : null,
      h('div', { class: 'body', text: reply.body }), foot),
  )
}
function renderReplyTarget() {
  const target = $('reply-target')
  const id = currentDraft().replyTo
  const reply = state.detail.replies.find((r) => r.id === id)
  if (id && !reply) currentDraft().replyTo = null
  target.hidden = !reply
  target.replaceChildren(...(reply ? [
    icon('reply'), h('span', { text: `回复 ${reply.author?.name || '用户'}` }),
    button('取消', () => { currentDraft().replyTo = null; renderReplyTarget() }),
  ] : []))
}
function renderAssignments() {
  if (!state.detail) return
  const postId = state.postId
  const closed = isClosed()
  const assignments = state.detail.assignments || []
  const section = $('assignments')
  section.replaceChildren(h('span', { class: 'label', text: assignments.length ? '我的 agent' : '让自己的 agent 来回答' }))
  for (const assignment of assignments) {
    const status = assignmentStatus(assignment)
    section.append(h('span', { class: 'agent', title: '已投递表示任务已受理，不表示已完成回复。' },
      h('span', { class: `dot ${assignment.deliveryState}` }), h('strong', { text: assignment.agentName || 'agent' }),
      h('span', { class: 'muted', text: status.label }), h('span', { class: 'muted' }, time(assignment.updatedAt)),
      status.canReassign ? writeButton('重新指派', () => assignAgent(postId, assignment.agentId), closed) : null))
  }
  section.append(writeButton('指派 agent', () => assignAgent(postId), closed))
  for (const assignment of assignments) {
    const note = assignmentStatus(assignment).note
    if (note) section.append(h('p', { class: 'note', text: note }))
  }
}
function assignAgent(postId, agentId) {
  void runWrite(
    () => agentId ? g.forum.assign(postId, agentId) : g.forum.assign(postId),
    (result) => {
      if (result?.assigned) say('已指派 agent。')
    },
  )
}
function renderPost() {
  const { post, me, bounty, replies } = state.detail
  const postId = state.postId
  const own = post.author?.id === me.id
  const remove = own ? writeButton('删除帖子', () => ask('删除帖子', '删除后帖子及其回复将不再显示。', () =>
    g.forum.remove({ post: postId }).then(() => { if (state.postId === postId) go('') })), bounty?.status === 'open', { class: 'danger', title: bounty?.status === 'open' ? '请先结束悬赏' : null }) : null
  $('post-content').replaceChildren(
    h('h2', { text: post.title }),
    h('div', { class: 'byline' }, avatar(post.author, 'md'),
      h('span', { class: 'who' }, h('span', {}, ...who(post.author)), h('small', { class: 'muted' }, '发布于 ', time(post.createdAt))),
      menu(post.author, remove)),
    h('div', { class: 'body', text: post.body }), reactions('post', post.id),
  )
  const available = new Set(replies.map((r) => r.id))
  for (const id of state.selected.keys()) if (!available.has(id) || bounty?.status !== 'open') state.selected.delete(id)
  renderBounty()
  renderAssignments()
  const ordered = [...replies.entries()].sort(([a, x], [b, y]) => (bounty?.awards?.some((w) => w.replyId === y.id) ? 1 : 0) - (bounty?.awards?.some((w) => w.replyId === x.id) ? 1 : 0) || a - b)
  $('replies').replaceChildren(...ordered.map(([index, reply]) => renderReply(reply, index)))
  if (!replies.length) $('replies').append(h('li', { class: 'empty-replies', text: '还没有可见的回复。' }))
  $('replies-heading').replaceChildren('回复', replies.length ? h('small', { text: String(replies.length) }) : '')
  $('reply-visibility').textContent = bounty?.status === 'open' && bounty.visibility === 'poster_only' ? '此处仅显示你有权阅读的回复。悬赏结束后全部公开。' : ''
  $('reply-visibility').hidden = !$('reply-visibility').textContent
  $('reply-form').hidden = isClosed()
  $('reply-note').textContent = bounty?.status === 'open' && bounty.visibility === 'poster_only'
    ? '你的回复在结算前仅楼主、你本人及你的 agent 可见。' : '回复公开可见。'
  renderReplyTarget()
  renderAwardControls()
}
async function loadPost(id = state.postId) {
  if (!id || state.mode !== 'post' || state.postId !== id || disposed) return
  const ticket = postRequest.start()
  $('post-loading').hidden = false
  try {
    const detail = await g.forum.read(id)
    if (!postRequest.current(ticket) || state.postId !== id || disposed) return
    state.detail = detail
    state.me = { ...state.me, ...detail.me }
    renderPost()
  } catch (reason) {
    if (!postRequest.current(ticket) || state.postId !== id || disposed) return
    if (String(reason?.message).includes('forum_post_not_found')) {
      state.detail = null
      $('post-content').replaceChildren()
      $('replies').replaceChildren()
      $('bounty-card').hidden = true
      $('assignments').replaceChildren()
      $('reply-form').hidden = true
      renderAwardControls()
    }
    error(reason, '帖子加载失败，请点击刷新重试。')
  } finally {
    if (postRequest.current(ticket) && !disposed) $('post-loading').hidden = true
  }
}
function route() {
  if (disposed) return
  stopPost()
  stopPost = () => {}
  postRequest.cancel()
  clearError()
  say('')
  $('confirm-dialog').close()
  const hash = window.location.hash.slice(1)
  const postId = hash.startsWith('post/') ? decodeURIComponent(hash.slice(5)) : null
  state.mode = postId ? 'post' : hash === 'new' ? 'compose' : 'feed'
  state.detail = null
  state.postId = postId
  state.selected.clear()
  $('feed').hidden = state.mode !== 'feed'
  $('compose-view').hidden = state.mode !== 'compose'
  $('post-view').hidden = state.mode !== 'post'
  $('compose').hidden = state.mode !== 'feed'
  $('award-bar').hidden = true
  if (postId) {
    $('post-content').replaceChildren()
    $('replies').replaceChildren()
    $('bounty-card').hidden = true
    $('assignments').replaceChildren()
    $('reply-form').hidden = true
    $('reply-body').value = currentDraft().text
    stopPost = g.forum.onChanged(postId, (change) => {
      if (change.kind === 'settled' || change.kind === 'assigned') say('')
      void loadPost(postId)
    })
    void loadPost(postId)
  } else if (state.mode === 'feed') void loadFeed()
  else $('draft-title').focus()
}

$('compose').addEventListener('click', () => go('new'))
$('draft-back').addEventListener('click', () => go(''))
$('post-back').addEventListener('click', () => go(''))
$('refresh-feed').addEventListener('click', () => { clearError(); void loadFeed() })
$('refresh-post').addEventListener('click', () => { clearError(); void loadPost() })
$('filters').addEventListener('submit', (event) => { event.preventDefault(); state.limit = PAGE; void loadFeed() })
$('query').addEventListener('input', () => {
  clearTimeout(searchTimer)
  feedRequest.cancel()
  searchTimer = setTimeout(() => { state.limit = PAGE; void loadFeed() }, 250)
})
for (const id of ['sort', 'mine']) $(id).addEventListener('change', () => { state.limit = PAGE; void loadFeed() })
for (const tab of $('filter').querySelectorAll('[role=tab]')) {
  tab.addEventListener('click', () => {
    state.filter = tab.dataset.filter
    for (const other of $('filter').querySelectorAll('[role=tab]')) other.setAttribute('aria-selected', String(other === tab))
    state.limit = PAGE
    void loadFeed()
  })
}
$('more').addEventListener('click', () => { state.limit += PAGE; $('more').disabled = true; void loadFeed() })
$('with-bounty').addEventListener('change', () => {
  $('bounty-fields').hidden = !$('with-bounty').checked
  $('bounty-fields').disabled = !$('with-bounty').checked
})
$('draft').addEventListener('submit', (event) => {
  event.preventDefault()
  const draft = { title: $('draft-title').value.trim(), body: $('draft-body').value.trim() }
  if (!draft.title || draft.title.length > 100 || !draft.body || draft.body.length > 20000) {
    error({ message: 'forum_title_or_body_invalid' })
    return
  }
  if ($('with-bounty').checked) {
    draft.bounty = { amount: Number($('draft-amount').value), days: Number($('draft-days').value), visibility: $('draft-visibility').value }
    if (!Number.isInteger(draft.bounty.amount) || draft.bounty.amount < 1 || draft.bounty.amount > 100) {
      error({ message: 'bounty_amount_out_of_range' })
      return
    }
  }
  void runWrite(() => g.forum.post(draft), (result) => {
    if (result?.confirming) {
      say('已打开悬赏确认框，确认后列表会自动更新；草稿已保留。')
    } else if (result?.post) {
      if ($('draft-title').value.trim() === draft.title && $('draft-body').value.trim() === draft.body) {
        $('draft').reset()
        $('bounty-fields').hidden = true
        $('bounty-fields').disabled = true
      }
      if (state.mode === 'compose') go(`post/${encodeURIComponent(result.post)}`)
      else say('帖子已发布。')
    }
  })
})
$('reply-body').addEventListener('input', () => { if (state.postId) currentDraft().text = $('reply-body').value })
$('reply-form').addEventListener('submit', (event) => {
  event.preventDefault()
  if (!state.detail || isClosed()) return
  const postId = state.postId
  const text = $('reply-body').value.trim()
  const replyTo = currentDraft().replyTo
  if (!text || text.length > 20000) { error({ message: 'forum_body_invalid' }); return }
  void runWrite(() => g.forum.reply(postId, text, replyTo ? { replyTo } : {}), async () => {
    const saved = state.drafts.get(postId)
    const unchanged = saved?.text.trim() === text && saved?.replyTo === replyTo
    if (unchanged) state.drafts.delete(postId)
    if (state.postId === postId) {
      if (unchanged) $('reply-body').value = ''
      await loadPost(postId)
    }
  })
})
$('confirm-cancel').addEventListener('click', () => $('confirm-dialog').close())
window.addEventListener('hashchange', route)
function dispose() {
  if (disposed) return
  disposed = true
  clearTimeout(searchTimer)
  stopPost()
  stopFeed()
  feedRequest.cancel()
  postRequest.cancel()
}
window.addEventListener('pagehide', dispose)
try {
  if (!g?.forum?.list || !g?.forum?.onChanged) {
    throw new Error('forum_api_unavailable')
  }
  stopFeed = g.forum.onChanged('feed', () => void loadFeed())
  route()
} catch (reason) {
  if (reason?.message === 'forum_api_unavailable') {
    $('feed').hidden = true
    $('compose').hidden = true
    error(reason, '此版本尚不支持论坛，请升级咕咕后重试。')
  } else error(reason, '论坛初始化失败，请重新打开。')
}
