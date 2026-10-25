import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
import { assignmentStatus, FORUM_ERRORS, bountyLabel, forumError, latestRequest, settlementWindow, validateAwards } from '../sources/forum/core.mjs'

const DAY = 86400000
const created = Date.parse('2026-10-01T00:00:00Z')
const deadline = created + 3 * DAY
const bounty = { amount: 10, status: 'open', createdAt: new Date(created).toISOString(), deadlineAt: new Date(deadline).toISOString() }
const replies = [{ id: 'a', owner: { id: 'other' } }, { id: 'b', owner: { id: 'other2' } }, { id: 'self', owner: { id: 'me' } }]

test('每一种库原因词都显示中文,包括带前后文的宿主错误', () => {
  for (const [token, text] of Object.entries(FORUM_ERRORS)) {
    assert.equal(forumError({ code: 'failed', message: `database: ${token}: reason` }), text)
    assert(!text.includes(token))
  }
  assert.equal(forumError({ code: 'denied' }), '无权执行此操作，请刷新后重试。')
  assert.equal(forumError({ code: 'failed', message: 'an unknown stack trace' }), '操作未完成，请重试。')
})
test('采纳的 24 小时门槛与截止后 24 小时边界;结束悬赏不受首个门槛限制', () => {
  assert.equal(settlementWindow(bounty, created).canClose, true)
  assert.equal(settlementWindow(bounty, created + DAY - 1).canAward, false)
  assert.equal(settlementWindow(bounty, created + DAY).canAward, true)
  assert.equal(settlementWindow(bounty, deadline + DAY).canAward, true)
  assert.equal(settlementWindow(bounty, deadline + DAY + 1).canAward, false)
  assert.equal(settlementWindow({ ...bounty, status: 'awarded' }, created + DAY).canClose, false)
})
test('分配须是 1–3 个不同的现存回复、正整数、总数等于赏金', () => {
  const check = (awards) => validateAwards(bounty, replies, awards, 'me', created + DAY)
  assert.equal(check([{ reply: 'a', amount: 10 }]), null)
  assert.equal(check([{ reply: 'a', amount: 4 }, { reply: 'b', amount: 6 }]), null)
  for (const invalid of [
    [], [{ reply: 'a', amount: 9 }], [{ reply: 'a', amount: 10.5 }], [{ reply: 'a', amount: 0 }],
    [{ reply: 'missing', amount: 10 }], [{ reply: 'a', amount: 5 }, { reply: 'a', amount: 5 }],
    [{ reply: 'a', amount: NaN }], [{ reply: 'a', amount: -10 }],
    [1, 2, 3, 4].map((id) => ({ reply: String(id), amount: 1 })),
  ]) assert.equal(check(invalid), FORUM_ERRORS.bounty_awards_invalid)
  assert.equal(check([{ reply: 'self', amount: 10 }]), FORUM_ERRORS.bounty_award_to_self)
})
test('不能采纳自己名下 agent 的回复,不信任不同的 author id', () => {
  const agentReply = [{ id: 'agent', author: { id: 'different-agent' }, owner: { id: 'me' } }]
  assert.equal(validateAwards(bounty, agentReply, [{ reply: 'agent', amount: 10 }], 'me', created + DAY), FORUM_ERRORS.bounty_award_to_self)
})
test('截止后的宽限期与等待结算不显示仍进行中', () => {
  assert.equal(bountyLabel(bounty, deadline + 1), '已截止，仍可采纳')
  assert.equal(bountyLabel(bounty, deadline + DAY + 1), '采纳期限已过，等待结算')
  assert.equal(bountyLabel({ ...bounty, status: 'burned' }), '已结束，赏金已作废')
})
test('旧筛选、旧帖与订阅前读取的迟到结果失效', () => {
  const requests = latestRequest()
  const initial = requests.start()
  const subscribed = requests.start()
  assert.equal(requests.current(initial), false)
  assert.equal(requests.current(subscribed), true)
  requests.cancel()
  assert.equal(requests.current(subscribed), false)
})
test('论坛是普通 App,不读取 agent 列表、不申请 capability、没有 App 工具或默认安装标记', () => {
  const path = new URL('../sources/forum/', import.meta.url)
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', path)))
  assert.equal(manifest.id, 'forum')
  assert.equal(manifest.name, '论坛')
  assert.equal(manifest.subtitle, '提问、回答与积分悬赏')
  // The forum interface was introduced in API 9; the manifest may require newer features too.
  assert.ok(manifest.apiVersion >= 9, 'the forum requires App API 9 or later')
  assert.deepEqual(manifest.permissions.capabilities, [])
  assert.equal(manifest.contributes.mcpServers, undefined)
  assert.equal(manifest.firstRun, undefined)
  assert.equal(manifest.unlisted, undefined)
  assert.equal(existsSync(new URL('tools.js', path)), false)
})

test('暂未送达自动重投且不要求手动指派,受理后回合失败才提供重新指派', () => {
  const waiting = assignmentStatus({ deliveryState: 'undelivered', lastError: 'offline' })
  assert.equal(waiting.label, '暂未送达')
  assert.match(waiting.note, /上线后会自动送达/)
  assert(!waiting.note.includes('重新指派'))
  assert.equal(waiting.canReassign, false)
  assert.match(assignmentStatus({ deliveryState: 'undelivered', lastError: null }).note, /自动送达/)
  const failed = assignmentStatus({ deliveryState: 'turn_failed', lastError: 'engine failed' })
  assert.equal(failed.canReassign, true)
  assert.match(failed.note, /可由你重新指派/)
  for (const deliveryState of ['pending', 'delivered']) assert.equal(assignmentStatus({ deliveryState }).canReassign, false)
})
