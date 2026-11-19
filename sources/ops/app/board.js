import { actorOf, applySet, asBoard, blockers, logRows, rows, subjectOf } from './lib/core.js'
import { mutate, openBoard, whenSaved } from './lib/chat-board.js'
import { h, link, say } from './lib/dom.js'
const g = window.gugu
const $ = (id) => document.getElementById(id)
const ctx = await g.getContext()
let file, board, members = [], filter = 'open'
const names = () => new Map(members.map((m) => [m.id, m.name]))
const actor = () => actorOf(ctx.operator?.kind === 'agent' ? { agent: ctx.operator.id, session: ctx.session?.id } : {}, file.presence?.self)
const call = async (fields) => {
  const result = mutate(file, (b) => applySet(b, fields, actor(), new Date().toISOString()))
  await whenSaved(file)
  draw()
  return result
}
const fail = (error) => { say($('error'), error.message ?? String(error)); g.reportError(error.message ?? String(error)) }
function draw() {
  board = asBoard(file.toJSON())
  const now = new Date().toISOString()
  const pending = rows(board).filter((i) => i.status === 'pending')
  const before = pending.filter((i) => i.when === '前' && !i.sweep)
  const late = pending.filter((i) => i.when === '后' && i.release && i.due <= now)
  $('gate').textContent = before.length || late.length ? '现在不能发布' : '取票时核对本批扫漏'
  $('gate').className = before.length || late.length ? 'state-pending' : ''
  $('counts').textContent = `发布前还有 ${before.length} 条 · 上次发布留下 ${late.length} 条过期`
  $('waiting').replaceChildren(...rows(board).filter((i) => i.ask).map((i) => h('section', { class: 'card stack ask', 'aria-label': `等你 ${i.id}` },
    h('h3', { text: `等你 · ${i.id}` }), h('p', { text: i.ask.question }),
    h('div', { class: 'row' }, ...i.ask.options.map((option) => h('button', { text: option, disabled: ctx.operator?.kind === 'agent' ? '' : null, onclick: async () => {
      try {
        const askedBy = i.ask.by
        const question = i.ask.question
        await call({ item: i.id, answer: option })
        say($('status'), '回答已记录')
        if (askedBy) {
          try { await g.dispatch(`台账 ${i.id} 的回答：${question} → ${option}。用 ops__board 读条目后继续。`, { to: { chat: ctx.chat.id, member: askedBy } }) }
          catch (e) { say($('status'), `回答已记录，未送达负责 agent：${e.message}`) }
        }
      } catch (e) { fail(e) }
    } }))))))
  const list = rows(board).filter((i) => filter === 'closed' ? i.status !== 'pending' : true)
  $('sections').replaceChildren(...[['前', '发布前'], ['后', '发布后'], [null, '不绑批次']].map(([when, title]) => {
    const items = list.filter((i) => i.when === when)
    return h('section', {}, h('h3', { text: `${title} · ${items.length}` }), items.length ? h('ul', { class: 'list' }, ...items.map(itemRow)) : h('p', { class: 'muted', text: '暂无条目' }))
  }))
  $('log').replaceChildren(...logRows(board).slice(0, 10).map((l) => h('li', {}, h('div', {},
    h('span', { text: `${l.actor.name ?? names().get(l.actor.id) ?? l.actor.id} · ${l.what} ${l.item ?? ''}` }),
    h('small', { class: 'muted', text: [l.actor.kind === 'agent' ? 'agent' : '人', l.actor.model, l.actor.session].filter(Boolean).join(' · ') })), h('gugu-time', { datetime: l.at }))))
}
function itemRow(i) {
  const late = i.status === 'pending' && i.due && i.due <= new Date().toISOString()
  const status = late ? '过期' : i.ask ? '等你' : i.status === 'done' ? '完成' : i.status === 'dropped' ? '不做' : i.when === '后' && !i.release ? '等发布' : '未做'
  return h('li', { 'data-key': i.id }, h('div', { class: 'item-content' },
    h('div', { class: 'item-heading' }, h('button', { class: 'item-title', title: i.id, onclick: () => edit(i) }, h('strong', { text: `${i.sweep ? '自动复核' : i.id} · ${i.title}` })), h('small', { class: `state-${i.status}`, text: status })),
    h('small', { class: 'muted meta', text: `负责：${names().get(i.owner) ?? i.owner ?? '没人接'}${i.sweep ? ' · 独立扫漏' : ''}` }),
    h('small', { class: 'muted', title: i.check, text: `怎么核对：${i.check}` }),
    h('div', { class: 'row' }, ...i.source.map((s, n) => link(s, `出处 ${n + 1}`))),
    ...(i.evidence ? [h('div', { class: 'evidence' }, h('small', { title: i.evidence.reading, text: `读数：${i.evidence.reading}` }), ...i.evidence.links.map((s, n) => link(s, `证据 ${n + 1}`)))] : []),
    ...(i.reason ? [h('small', { text: `不做的理由：${i.reason}` })] : []),
    ...(i.note ? [h('details', {}, h('summary', { text: '原记录' }), h('p', { text: i.note }))] : []),
    ...(i.due ? [h('small', { class: late ? 'overdue' : 'muted' }, '到期：', h('gugu-time', { datetime: i.due }))] : [])))
}
const form = $('form')
// @@@form-fields - "item" is also the collection's item() method; namedItem resolves every field without collisions.
const field = (name) => form.elements.namedItem(name)
function edit(item) {
  form.reset()
  $('edit-title').textContent = item ? item.id : '新增条目'
  for (const name of ['item', 'title', 'when', 'check', 'owner']) field(name).value = name === 'item' ? item?.id ?? '' : item?.[name] ?? (name === 'when' ? '前' : '')
  if (item && item.when === null) field('when').value = ''
  field('source').value = item?.source.join('\n') ?? ''
  field('state').value = item?.status ?? 'pending'
  field('evidence').value = item?.evidence?.reading ?? ''
  field('links').value = item?.evidence?.links.join('\n') ?? ''
  field('reason').value = item?.reason ?? ''
  field('question').value = item?.ask?.question ?? ''
  field('options').value = item?.ask?.options.join('\n') ?? ''
  say($('edit-error'), '')
  $('edit').showModal()
}
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const fields = Object.fromEntries(new FormData(form))
  const lines = (s) => s.split('\n').map((s) => s.trim()).filter(Boolean)
  const op = { ...(fields.item ? { item: fields.item } : {}), title: fields.title, when: fields.when || null, check: fields.check, source: lines(fields.source), owner: fields.owner || null,
    ask: fields.question.trim() ? { question: fields.question, options: lines(fields.options) } : null }
  // A sweep's timing is fixed by its contract; normal edits need not try to replace it.
  if (board.items[fields.item]?.sweep) delete op.when
  if (fields.state === 'done') op.done = { evidence: fields.evidence, links: lines(fields.links) }
  else if (fields.state === 'dropped') op.drop = { reason: fields.reason }
  else if (fields.item && board.items[fields.item]?.status !== 'pending') op.done = false
  try { await call(op); $('edit').close() } catch (error) { say($('edit-error'), error.message) }
})
$('cancel').onclick = () => $('edit').close()
$('add').onclick = () => edit(null)
$('request').onclick = () => $('ticket-dialog').showModal()
$('ticket-cancel').onclick = () => $('ticket-dialog').close()
$('ticket-form').onsubmit = async (event) => {
  event.preventDefault()
  const subject = new FormData(event.target).get('subject').trim()
  try {
    subjectOf(subject)
    await g.dispatch(`请取生产发布票：ops__ticket { chat: "${ctx.chat.id}", list: "生产发布", subject: "${subject}" }。接着按返回的 widget_send 参数发卡；扫漏交给另一位 agent，实际读过再写证据。`, { offer: ['agent-in-chat', 'my-agent'] })
    $('ticket-dialog').close()
  } catch (e) { say($('ticket-error'), e.message) }
}
document.querySelectorAll('[data-filter]').forEach((button) => button.onclick = () => {
  filter = button.dataset.filter
  document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-selected', String(b === button)))
  draw()
})
try {
  if (!ctx.chat) throw new Error('请在群的侧栏里打开运维台账。每个群有自己的一本台账。')
  $('place').textContent = `${ctx.chat.name} · 生产发布`
  ;({ members } = await g.chats.members({ chat: ctx.chat.id }))
  for (const m of members) field('owner').append(h('option', { value: m.id, text: m.name }))
  file = ctx.file ? await g.files.open(ctx.file) : await openBoard(g.files, ctx.chat.id, true)
  file.onChange(draw)
  file.onStatus(() => { if (file.status !== 'online') say($('status'), file.status === 'gone' ? '台账文件已不可用' : '离线，正在等待同步'); else say($('status'), '') })
  draw()
} catch (error) { $('add').disabled = true; $('request').disabled = true; fail(error) }
