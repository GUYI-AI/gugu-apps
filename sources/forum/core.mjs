const DAY = 24 * 60 * 60 * 1000
export const FORUM_ERRORS = {
  account_too_new: '注册满 3 天并认领设备后，才可发帖、回复或指派 agent。',
  blocked_by_poster: '你或该 agent 的主人已被楼主拉黑，无法参与此帖。',
  owner_identity_limit: '同一主人在此帖最多使用 3 个身份，已参与的身份可继续回复。',
  'rate-limited': '回复过于频繁，每个身份在同一帖 10 分钟内最多回复 10 条。',
  post_closed: '悬赏已结束，无法继续回复或指派 agent。',
  bounty_insufficient_points: '社区积分不足，请减少赏金。',
  bounty_active_limit: '同时进行中的悬赏最多 3 个，请先结束已有悬赏。',
  bounty_award_too_early: '发帖满 24 小时后才能采纳回复。',
  bounty_past_grace: '已超过截止后 24 小时的采纳期限。',
  bounty_award_to_self: '不能采纳自己或自己名下 agent 的回复。',
  forum_post_has_open_bounty: '请先结束悬赏，再删除帖子。',
  forum_agent_not_assigned: '请先将该 agent 指派到此帖。',
  forum_post_not_found: '帖子不存在或已被删除。',
  forum_reply_not_found: '回复不存在或已被删除。',
  forum_reply_target_not_found: '所回复的内容已不可见，请重新选择回复对象。',
  forum_reaction_target_not_found: '该内容已不可见，无法添加表情。',
  forum_post_not_yours: '仅楼主可以删除此帖。',
  forum_reply_not_yours: '仅楼主或回复者可以删除此回复。',
  forum_agent_not_yours: '只能指派自己的 agent。',
  forum_poster_must_be_human: '请使用本人身份发帖。',
  forum_title_or_body_invalid: '标题须为 1–100 字，正文须为 1–20000 字。',
  forum_body_invalid: '回复须为 1–20000 字。',
  forum_emoji_invalid: '表情无效，请重新选择。',
  forum_block_target_invalid: '无法拉黑此身份。',
  bounty_amount_out_of_range: '赏金须为 1–100 的整数积分。',
  bounty_days_invalid: '悬赏期限须为 1、3 或 7 天。',
  bounty_visibility_invalid: '请选择有效的回复可见范围。',
  bounty_already_settled: '悬赏已结算，请刷新查看结果。',
  bounty_not_yours: '仅楼主可以采纳回复或结束悬赏。',
  bounty_awards_invalid: '请选择 1–3 条回复，每条至少 1 积分，合计须等于赏金。',
  'not authenticated': '登录状态已失效，请重新登录。',
}
export function forumError(error, fallback = '操作未完成，请重试。') {
  const message = String(error?.message ?? '')
  for (const [token, text] of Object.entries(FORUM_ERRORS)) {
    if (message.includes(token) || error?.code === token) return text
  }
  return error?.code === 'denied' ? '无权执行此操作，请刷新后重试。' : fallback
}
export function settlementWindow(bounty, now = Date.now()) {
  const awardAt = Date.parse(bounty?.createdAt) + DAY
  const closesAt = Date.parse(bounty?.deadlineAt) + DAY
  const open = bounty?.status === 'open'
  return { awardAt, closesAt, canAward: open && now >= awardAt && now <= closesAt, canClose: open && now <= closesAt }
}
export function validateAwards(bounty, replies, awards, me, now = Date.now()) {
  if (bounty.status !== 'open') return FORUM_ERRORS.bounty_already_settled
  if (!settlementWindow(bounty, now).canAward) {
    return now < Date.parse(bounty.createdAt) + DAY ? FORUM_ERRORS.bounty_award_too_early : FORUM_ERRORS.bounty_past_grace
  }
  if (!awards.length || awards.length > 3 || new Set(awards.map((a) => a.reply)).size !== awards.length) return FORUM_ERRORS.bounty_awards_invalid
  let total = 0
  for (const award of awards) {
    const reply = replies.find((r) => r.id === award.reply)
    if (!reply || !Number.isInteger(award.amount) || award.amount < 1) return FORUM_ERRORS.bounty_awards_invalid
    if (!reply.owner?.id || reply.owner.id === me) return FORUM_ERRORS.bounty_award_to_self
    total += award.amount
  }
  return total === Number(bounty.amount) ? null : FORUM_ERRORS.bounty_awards_invalid
}
export function bountyLabel(bounty, now = Date.now()) {
  if (!bounty) return ''
  const states = { awarded: '已采纳', refunded: '已结束，赏金已退还', burned: '已结束，赏金已作废' }
  if (bounty.status !== 'open') return states[bounty.status] ?? '已结束'
  const deadline = Date.parse(bounty.deadlineAt)
  if (now <= deadline) return '悬赏进行中'
  return now <= deadline + DAY ? '已截止，仍可采纳' : '采纳期限已过，等待结算'
}
/** A slow response must not replace a newer filter, route or realtime refresh. */
export function latestRequest() {
  let serial = 0
  return { start: () => ++serial, current: (id) => id === serial, cancel: () => { serial += 1 } }
}

/** Unaccepted deliveries retry automatically; only a failed accepted turn offers manual reassignment. */
export function assignmentStatus({ deliveryState, lastError }) {
  const labels = { pending: '待投递', delivered: '已投递', undelivered: '暂未送达', turn_failed: '回合失败' }
  const note = deliveryState === 'undelivered'
    ? '暂未送达：运行此 agent 的咕咕未在线，上线后会自动送达。'
    : deliveryState === 'turn_failed'
      ? forumError({ message: lastError }, '任务受理后本轮执行失败，请检查任务状态；可由你重新指派。')
      : ''
  return { label: labels[deliveryState] || '状态未知', note, canReassign: deliveryState === 'turn_failed' }
}

/** The colour a bounty wears in the list and on the post: gold while open, blue in the grace day, green when awarded. */
export function bountyTone(bounty, now = Date.now()) {
  if (!bounty) return ''
  if (bounty.status === 'awarded') return 'awarded'
  if (bounty.status !== 'open') return 'ended'
  const deadline = Date.parse(bounty.deadlineAt)
  if (now <= deadline) return 'open'
  return now <= deadline + DAY ? 'late' : 'ended'
}
/** Time left before a deadline, coarse: 剩 2 天 3 小时 / 剩 5 小时 / 剩 40 分钟. */
export function timeLeft(deadline, now = Date.now()) {
  const ms = Date.parse(deadline) - now
  if (!(ms > 0)) return ''
  const minutes = Math.ceil(ms / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days) return hours ? `剩 ${days} 天 ${hours} 小时` : `剩 ${days} 天`
  return hours ? `剩 ${hours} 小时` : `剩 ${minutes} 分钟`
}
