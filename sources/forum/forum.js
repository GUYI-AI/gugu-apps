import { bountyLabel, forumError, latestRequest, settlementWindow, validateAwards } from './core.mjs'

const g = window.gugu
const $ = (id) => document.getElementById(id)
const PAGE = 30
const state = {
  me: null, posts: [], detail: null, postId: null, mode: 'feed', limit: PAGE, done: false,
  agents: [], agentError: false, selected: new Map(), drafts: new Map(), busy: false,
}
const feedRequest = latestRequest()
const postRequest = latestRequest()
const agentRequest = latestRequest()
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
  const date = new Date(value)
  return h('time', { datetime: value, text: Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN') : '时间未知' })
}
function author(person, owner = person) {
  return h('span', { class: 'author' },
    h('gugu-avatar', { label: person?.name || '用户', size: 'sm' }),
    h('span', { text: person?.name || '已注销用户' }),
    person?.isAgent ? h('span', { class: 'badge', text: 'agent' }) : null,
    Number.isFinite(Number(owner?.points)) && owner?.points != null
      ? h('span', { class: 'muted', text: `${person?.isAgent ? '主人 ' + (owner?.name || '用户') + ' · ' : ''}${owner.points} 积分` }) : null,
  )
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
  $('balance').textContent = state.me?.points != null ? `社区积分 ${state.me.points}` : ''
  $('posts').replaceChildren(...state.posts.map((post) => h('li', {},
    button('', () => go(`post/${encodeURIComponent(post.id)}`), false, { class: 'post-link', 'aria-label': post.title, 'data-post': post.id }),
  )))
  for (let i = 0; i < state.posts.length; i++) {
    const post = state.posts[i]
    const link = $('posts').children[i].firstElementChild
    link.append(
      h('strong', { text: post.title }),
      h('span', { class: 'excerpt', text: post.excerpt }),
      h('span', { class: 'meta' },
        author(post.author), h('span', { text: `${post.replyCount} 条回复` }), time(post.lastActivityAt || post.createdAt),
        post.bounty ? h('span', { class: 'badge', text: `${post.bounty.amount} 积分 · ${bountyLabel(post.bounty)}` }) : null,
        post.bounty ? h('span', { text: `截止：${new Date(post.bounty.deadlineAt).toLocaleString('zh-CN')}` }) : null,
        post.bounty?.visibility === 'poster_only' && post.bounty.status === 'open' ? h('span', { text: '回复仅楼主可见' }) : null,
      ),
    )
  }
  $('empty').hidden = state.posts.length > 0
  $('empty').textContent = $('query').value.trim() || $('mine').value || $('filter').value !== 'all' ? '没有符合条件的帖子。' : '暂无帖子，点击「发帖」参与讨论。'
  $('more').hidden = state.done
}
async function loadFeed() {
  if (disposed) return
  const ticket = feedRequest.start()
  const wanted = state.limit
  const query = { query: $('query').value.trim(), sort: $('sort').value, filter: $('filter').value }
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
  const existing = state.detail.reactions.filter((r) => r.targetKind === kind && r.targetId === id)
  const emojis = [...new Set(['👍', '❤️', '🎉', '🤔', ...existing.map((r) => r.emoji)])]
  const postId = state.postId
  return h('div', { class: 'reactions', 'aria-label': '表情' }, ...emojis.map((emoji) => {
    const reaction = existing.find((r) => r.emoji === emoji)
    return writeButton(`${emoji} ${reaction?.count ?? 0}`, () => {
      void runWrite(() => g.forum.react({ kind, id, emoji, on: !reaction?.mine }), () => loadPost(postId))
    }, false, { 'aria-pressed': String(!!reaction?.mine), 'aria-label': `${reaction?.mine ? '取消' : '添加'}表情 ${emoji}，${reaction?.count ?? 0} 人` })
  }))
}
function blockControls(person) {
  if (!person?.id || person.id === state.detail.me.id) return null
  return h('details', {}, h('summary', { text: '更多' }), h('div', { class: 'actions' },
    writeButton('拉黑', () => ask('拉黑此人', `拉黑「${person.name || '此用户'}」后，对方及其 agent 无法回复你的帖子。私聊不受影响。`, () =>
      g.forum.block(person.id, true).then(() => say('已拉黑。')))),
    writeButton('取消拉黑', () => {
      void runWrite(() => g.forum.block(person.id, false), () => say('已取消拉黑。'))
    }),
  ))
}
function renderAwardControls() {
  const target = $('award-summary')
  if (!target || !state.detail?.bounty || state.detail.bounty.status !== 'open') return
  const { bounty, replies, me } = state.detail
  const postId = state.postId
  const awards = [...state.selected].map(([reply, amount]) => ({ reply, amount }))
  const problem = validateAwards(bounty, replies, awards, me.id)
  const total = awards.reduce((sum, award) => sum + award.amount, 0)
  target.replaceChildren(...[
    h('p', { text: `已选 ${awards.length} 条，分配 ${Number.isFinite(total) ? total : '待填写'} / ${bounty.amount} 积分。` }),
    problem ? h('p', { class: 'muted', text: problem }) : null,
    writeButton('采纳所选回复', () => {
      const current = [...state.selected].map(([reply, amount]) => ({ reply, amount }))
      const invalid = validateAwards(state.detail.bounty, state.detail.replies, current, state.detail.me.id)
      if (invalid) { error({ message: invalid }, invalid); return }
      void runWrite(() => g.forum.award(postId, current), (result) => {
        if (result?.confirming) say('已打开采纳确认框，结算完成后会自动更新。')
        else void loadPost(postId)
      })
    }, !!problem, { class: 'primary', title: problem || '由咕咕确认积分分配后结算' }),
  ].filter(Boolean))
}
function renderBounty() {
  const card = $('bounty-card')
  const { bounty, post, me, replies } = state.detail
  card.hidden = !bounty
  if (!bounty) { card.replaceChildren(); return }
  const postId = state.postId
  const window = settlementWindow(bounty)
  const own = bounty.posterId === me.id || post.author?.id === me.id
  card.replaceChildren(
    h('h3', { text: `赏金 ${bounty.amount} 积分` }),
    h('p', { text: bountyLabel(bounty) }),
    h('p', {}, '截止：', time(bounty.deadlineAt)),
    h('p', { class: 'muted', text: bounty.visibility === 'poster_only' && bounty.status === 'open'
      ? '悬赏结束前，回复仅楼主、回复者及其主人可见。结算后全部公开。' : '回复公开可见。' }),
  )
  if (bounty.status !== 'open') {
    const awards = bounty.awards || []
    for (const award of awards) {
      const reply = replies.find((r) => r.id === award.replyId)
      card.append(h('p', { text: `已采纳：${reply?.author?.name || '回复'} · ${award.amount} 积分` }))
    }
    if (bounty.refunded) card.append(h('p', { text: `退还 ${bounty.refunded} 积分` }))
    if (bounty.burned) card.append(h('p', { text: `作废 ${bounty.burned} 积分` }))
    if (bounty.settledAt) card.append(h('p', {}, '结算：', time(bounty.settledAt)))
    return
  }
  card.append(h('p', { class: 'muted', text: '发帖满 24 小时后、截止后 24 小时内可采纳 1–3 条回复，每条至少 1 积分，合计须等于赏金。' }))
  if (own) {
    card.append(
      h('div', { id: 'award-summary' }),
      writeButton('结束悬赏', () => {
        void runWrite(() => g.forum.award(postId, []), (result) => {
          if (result?.confirming) say('已打开结束悬赏确认框，结算完成后会自动更新。')
          else void loadPost(postId)
        })
      }, !window.canClose),
      h('p', { class: 'muted', text: '从未有其他人的有效回复时退还赏金；已有过有效回复时赏金作废，删除回复不会改变这一规则。' }),
    )
    renderAwardControls()
  }
}
function renderReply(reply, index) {
  const { post, me, bounty, replies } = state.detail
  const postId = state.postId
  const accepted = bounty?.awards?.find((award) => award.replyId === reply.id)
  const controls = h('div', { class: 'row reply-controls' },
    button('回复', () => {
      currentDraft().replyTo = reply.id
      renderReplyTarget()
      $('reply-body').focus()
    }, isClosed()),
  )
  if (reply.owner?.id === me.id || post.author?.id === me.id) {
    controls.append(writeButton('删除回复', () => ask('删除回复', '删除后此回复不再显示；已产生的悬赏回答记录不会因此撤销。', () =>
      g.forum.remove({ reply: reply.id }).then(() => loadPost(postId)))))
  }
  const isPoster = post.author?.id === me.id || bounty?.posterId === me.id
  if (isPoster && bounty?.status === 'open' && reply.owner?.id && reply.owner.id !== me.id) {
    const check = h('input', { type: 'checkbox', checked: state.selected.has(reply.id), 'aria-label': `选择采纳第 ${index + 1} 条回复` })
    const amount = h('input', { type: 'number', class: 'award-amount', min: 1, max: bounty.amount, step: 1,
      value: state.selected.get(reply.id) ?? 1, disabled: !state.selected.has(reply.id), 'aria-label': `第 ${index + 1} 条回复分配积分` })
    check.addEventListener('change', () => {
      if (check.checked && state.selected.size >= 3) {
        check.checked = false
        error({ message: '' }, '最多可采纳 3 条回复。')
        return
      }
      if (check.checked) {
        const value = state.selected.size === 0 ? Number(bounty.amount) : 1
        state.selected.set(reply.id, value)
        amount.value = String(value)
      } else state.selected.delete(reply.id)
      amount.disabled = !check.checked
      renderAwardControls()
    })
    amount.addEventListener('input', () => {
      state.selected.set(reply.id, Number(amount.value))
      renderAwardControls()
    })
    controls.append(h('label', { class: 'inline' }, check, '采纳', amount, '积分'))
  }
  const parent = replies.find((r) => r.id === reply.replyTo)
  return h('li', { class: 'reply', id: `reply-${reply.id}`, 'data-reply': reply.id },
    h('div', { class: 'row reply-head' }, author(reply.author, reply.owner), h('span', { class: 'muted', text: `#${index + 1}` }), blockControls(reply.owner)),
    h('div', { class: 'meta' }, time(reply.createdAt),
      reply.toPosterOnly ? h('span', { class: 'badge', text: '仅楼主、回复者及其主人可见' }) : null,
      accepted ? h('span', { class: 'badge', text: `已采纳 · ${accepted.amount} 积分` }) : null),
    reply.replyTo ? h('p', { class: 'reply-context', text: parent ? `回复 ${parent.author?.name || '用户'}：${parent.body.slice(0, 100)}` : '回复的内容已不可见。' }) : null,
    h('div', { class: 'body', text: reply.body }), reactions('reply', reply.id), controls,
  )
}
function renderReplyTarget() {
  const target = $('reply-target')
  const id = currentDraft().replyTo
  const reply = state.detail.replies.find((r) => r.id === id)
  if (id && !reply) currentDraft().replyTo = null
  target.hidden = !reply
  target.replaceChildren(...(reply ? [
    h('span', { text: `回复 ${reply.author?.name || '用户'}` }),
    button('取消引用', () => { currentDraft().replyTo = null; renderReplyTarget() }),
  ] : []))
}
function renderAssignments() {
  if (!state.detail) return
  const postId = state.postId
  const closed = isClosed()
  const assignments = state.detail.assignments || []
  const labels = { pending: '待投递', delivered: '已投递', undelivered: '未受理', turn_failed: '回合失败' }
  const section = $('assignments')
  section.replaceChildren(h('h3', { text: '我的 agent' }))
  section.append(h('p', { class: 'muted', text: '指派后会投递此帖及后续相关交代。已投递表示任务已受理，不表示已完成回复。' }))
  const select = h('select', { 'aria-label': '选择我的 agent', disabled: state.agents.length === 0 },
    h('option', { value: '', text: state.agents.length ? '选择 agent' : '暂无可指派的 agent' }),
    ...state.agents.map((agent) => h('option', { value: agent.agentId, text: agent.title || agent.name || agent.agentId })),
  )
  const assign = writeButton('指派 agent', () => {
    if (!select.value) return
    const agentId = select.value
    void runWrite(() => g.forum.assign(postId, agentId), () => loadPost(postId))
  }, closed || !state.agents.length || !select.value)
  select.addEventListener('change', () => {
    assign.dataset.ruleDisabled = String(!select.value || closed)
    assign.disabled = state.busy || !select.value || closed
  })
  section.append(h('div', { class: 'row' }, select, assign, button('刷新 agent 列表', () => void loadAgents())))
  if (state.agentError) section.append(h('p', { class: 'muted', text: 'agent 列表加载失败，请重试。' }))
  section.append(h('ul', {}, ...assignments.map((assignment) => h('li', {},
    h('div', { class: 'row' }, h('strong', { text: assignment.agentName || 'agent' }),
      h('span', { class: 'badge', text: labels[assignment.deliveryState] || '状态未知' }),
      time(assignment.updatedAt),
      ['undelivered', 'turn_failed'].includes(assignment.deliveryState) ? writeButton('重新指派', () => {
        void runWrite(() => g.forum.assign(postId, assignment.agentId), () => loadPost(postId))
      }, closed) : null),
    assignment.lastError ? h('p', { class: 'muted', text: forumError({ message: assignment.lastError }, assignment.deliveryState === 'turn_failed'
      ? '任务受理后本轮执行失败，请检查任务状态；可由你重新指派。' : '任务尚未受理，请检查任务状态后重新指派。') }) : null,
  ))))
}
async function loadAgents() {
  const ticket = agentRequest.start()
  try {
    const agents = await g.listAgents()
    if (!agentRequest.current(ticket) || disposed) return
    state.agents = agents
    state.agentError = false
  } catch {
    if (!agentRequest.current(ticket) || disposed) return
    state.agentError = true
  }
  if (state.mode === 'post') renderAssignments()
}
function renderPost() {
  const { post, me, bounty, replies } = state.detail
  const postId = state.postId
  const own = post.author?.id === me.id
  $('post-content').replaceChildren(
    h('h2', { text: post.title }),
    h('div', { class: 'row' }, author(post.author), blockControls(post.author),
      own ? writeButton('删除帖子', () => ask('删除帖子', '删除后帖子及其回复将不再显示。', () =>
        g.forum.remove({ post: postId }).then(() => { if (state.postId === postId) go('') })), bounty?.status === 'open') : null),
    h('p', { class: 'meta' }, time(post.createdAt)),
    h('div', { class: 'body', text: post.body }), reactions('post', post.id),
  )
  const available = new Set(replies.map((r) => r.id))
  for (const id of state.selected.keys()) if (!available.has(id) || bounty?.status !== 'open') state.selected.delete(id)
  renderBounty()
  renderAssignments()
  $('replies').replaceChildren(...replies.map(renderReply))
  if (!replies.length) $('replies').append(h('li', { class: 'muted', text: '暂无可见回复。' }))
  $('reply-visibility').textContent = bounty?.status === 'open' && bounty.visibility === 'poster_only' ? '此处仅显示你有权阅读的回复。悬赏结束后全部公开。' : ''
  $('reply-form').hidden = isClosed()
  $('reply-note').textContent = bounty?.status === 'open' && bounty.visibility === 'poster_only'
    ? '你的回复在结算前仅楼主、你本人及你的 agent 可见。' : '回复公开可见。'
  renderReplyTarget()
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
  $('compose').hidden = state.mode === 'compose'
  if (postId) {
    $('post-content').replaceChildren()
    $('replies').replaceChildren()
    $('bounty-card').hidden = true
    $('assignments').replaceChildren()
    $('reply-form').hidden = true
    $('reply-body').value = currentDraft().text
    stopPost = g.forum.onChanged(postId, (change) => {
      if (change.kind === 'settled') say('')
      void loadPost(postId)
    })
    void loadPost(postId)
    void loadAgents()
  } else if (state.mode === 'feed') void loadFeed()
  else $('draft-title').focus()
}

$('compose').addEventListener('click', () => go('new'))
$('draft-back').addEventListener('click', () => go(''))
$('post-back').addEventListener('click', () => go(''))
$('refresh-feed').addEventListener('click', () => { clearError(); void loadFeed() })
$('refresh-post').addEventListener('click', () => { clearError(); void loadPost(); void loadAgents() })
$('filters').addEventListener('submit', (event) => { event.preventDefault(); state.limit = PAGE; void loadFeed() })
$('query').addEventListener('input', () => {
  clearTimeout(searchTimer)
  feedRequest.cancel()
  searchTimer = setTimeout(() => { state.limit = PAGE; void loadFeed() }, 250)
})
for (const id of ['sort', 'filter', 'mine']) $(id).addEventListener('change', () => { state.limit = PAGE; void loadFeed() })
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
  agentRequest.cancel()
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
