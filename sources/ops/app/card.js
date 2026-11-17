import { asBoard, encodeTicket, subjectOf } from './lib/core.js'
import { h, say } from './lib/dom.js'
const g = window.gugu
const ctx = await g.getContext()
const $ = (id) => document.getElementById(id)
const data = ctx.widget?.data
let ticket
$('open').onclick = async () => {
  try { await g.openLink(await g.linkTo({ kind: 'app', tab: 'board', ...(ctx.chat ? { chat: ctx.chat.id } : {}) })) }
  catch (e) { say($('error'), e.message) }
}
$('copy').onclick = async () => { try { await g.clipboard.writeText(ticket) } catch (e) { say($('error'), e.message) } }
try {
  if (!ctx.chat || typeof data?.board !== 'string' || typeof data?.record !== 'string') throw new Error('在群消息中查看发布卡片；从侧栏打开台账查看全部记录。')
  const f = await g.files.open({ chat: ctx.chat.id, id: data.board })
  try {
    const record = asBoard(f.toJSON()).tickets[data.record]
    if (!record) throw new Error('台账中找不到这张卡片的记录')
    $('title').textContent = record.refused ? '生产发布 · 取票被拒' : '生产发布票'
    if (record.refused) {
      const subject = subjectOf(record.subject)
      $('body').replaceChildren(h('code', { title: record.subject, text: `${subject.repo.split('/')[1]} ${subject.sha.slice(0, 7)}` }),
        ...record.blockers.slice(0, 2).map((i) => h('small', { class: 'state-pending blocker', title: i.id, text: `${i.title.slice(0, 65)}${i.overdue ? ' · 过期' : ''}` })),
        h('small', { text: `共 ${record.blockers.length} 条未完成` }))
    } else {
      ticket = encodeTicket(record)
      $('copy').hidden = false
      $('body').replaceChildren(h('code', { title: record.subject.repo, text: `${record.subject.repo.split('/')[1]} ${record.subject.sha.slice(0, 7)}` }),
        h('span', { class: 'state-done', text: `${record.done.length} 条完成 · ${record.dropped.length} 条不做 · 0 条未完成` }),
        h('small', { text: `发布后要做 ${record.after.length} 条 · 24 小时内` }),
        h('small', {}, '有效到 ', h('gugu-time', { datetime: record.expiresAt })),
        h('small', { text: `取票：${record.requestedBy.name ?? record.requestedBy.id}` }))
    }
  } finally { await f.close() }
} catch (e) { say($('error'), e.message) }
