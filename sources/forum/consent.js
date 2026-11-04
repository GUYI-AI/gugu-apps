import { createForumApi } from './forum-api.mjs'
import { wordsFor } from './consent-words.mjs'

const REASONS = [
  ['bounty_insufficient_points', 'insufficient'],
  ['bounty_active_limit', 'activeLimit'],
  ['bounty_award_too_early', 'tooEarly'],
  ['bounty_past_grace', 'pastGrace'],
  ['bounty_award_to_self', 'toSelf'],
  ['add up to the bounty', 'splitMismatch'],
  ['bounty_already_settled', 'settled'],
  ['account_too_new', 'accountTooNew'],
  ['blocked_by_poster', 'blocked'],
  ['owner_identity_limit', 'identityLimit'],
  ['post_closed', 'settled'],
]

const g = window.gugu
const context = await g.getContext()
const words = wordsFor(context.locale)
const ask = context.modal?.data
if (!ask || !['bounty', 'award'].includes(ask.type)) throw new Error('Missing points confirmation')
const api = createForumApi(g, context.locale)
const $ = (id) => document.getElementById(id)
const t = (key, values = {}) => (words[`${key}_${values.count === 1 ? 'one' : 'other'}`] ?? words[key]).replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? ''))
const ending = ask.type === 'award' && ask.draft.awards.length === 0
$('title').textContent = t(ask.type === 'bounty' ? 'postTitle' : ending ? 'endTitle' : 'acceptTitle')
$('body').textContent = t(ask.type === 'bounty' ? 'postBody' : ending ? 'endBody' : 'acceptBody', { count: ask.draft.amount })
const lines = ask.type === 'bounty'
  ? [ask.draft.title, t('reward', { count: ask.draft.amount }), t('days', { count: ask.draft.days }), words.visibility[ask.draft.visibility]]
  : [ask.draft.title, ...ask.draft.awards.map((award) => t('awardLine', { name: award.to, count: award.amount }))]
for (const text of lines) {
  const item = document.createElement('li')
  item.textContent = text
  $('lines').append(item)
}
$('cancel').textContent = t('cancel')
$('confirm').textContent = t(ask.type === 'bounty' ? 'postConfirm' : ending ? 'endConfirm' : 'acceptConfirm')
$('cancel').onclick = () => g.modal.close({ cancelled: true })
$('confirm').onclick = async () => {
  $('confirm').disabled = $('cancel').disabled = true
  $('error').hidden = true
  try {
    const result = await (ask.type === 'bounty' ? api.createBountyPost(ask.draft) : api.settle(ask.draft))
    await g.modal.close(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const reason = REASONS.find(([word]) => message.includes(word))?.[1]
    $('error').textContent = reason ? words.error[reason] : t('failed')
    $('error').hidden = false
    $('confirm').disabled = $('cancel').disabled = false
  }
}
