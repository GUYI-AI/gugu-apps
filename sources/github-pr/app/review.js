// GitHub's review, as its own page offers it: approve, request changes or comment, with a summary (GitHub requires one
// unless approving). It names the head the card just re-read (`commit_id`), so the verdict is on what the person saw.
import { githubProblem } from './lib/pr.js'
import { API, HEADERS, SITE } from './lib/github.js'
import { h } from './lib/dom.js'

const g = window.gugu
const { data } = (await g.getContext()).modal ?? {}
const root = document.getElementById('dlg')
const EVENTS = [['APPROVE', '批准', '可以合并'], ['REQUEST_CHANGES', '请求修改', '合并前要先改'], ['COMMENT', '评论', '只说说看法，不表态']]
const say = h('p', { role: 'status', class: 'muted' })
const body = h('textarea', { rows: 4, 'aria-label': '说明', placeholder: '说明（批准时可以不写）' })
const choices = EVENTS.map(([value, label, help], index) => h('label', { class: 'choice' },
  h('input', { type: 'radio', name: 'event', value, ...(index === 0 ? { checked: '' } : {}) }), h('strong', { text: label }), h('small', { class: 'muted', text: ` ${help}` })))
const cancel = h('button', { onclick: () => g.modal.close(null) }, '取消')
const go = h('button', { class: 'primary', onclick: () => submit() }, h('gugu-icon', { name: 'circle-check' }), '提交评审')
const picked = () => root.querySelector('input[name=event]:checked')?.value ?? 'APPROVE'

function fail(text) {
  say.className = 'bad'
  say.setAttribute('role', 'alert')
  say.textContent = text
  go.disabled = cancel.disabled = false
}

async function submit() {
  const event = picked()
  const text = body.value.trim()
  if (event !== 'APPROVE' && !text) return fail(event === 'COMMENT' ? '评论要写点内容' : '请求修改要写明要改什么')
  go.disabled = cancel.disabled = true
  say.className = 'muted'
  say.textContent = '正在提交…'
  try {
    const answer = await g.credentials.write(SITE, 'POST', `${API}/repos/${data.repo}/pulls/${data.number}/reviews`,
      { commit_id: data.head, event, ...(text ? { body: text } : {}) }, { headers: HEADERS })
    // A page an agent works gets `null`: the host did not send it, the person has to.
    if (answer === null) return fail('评审要由人来提交')
    const { status, data: reply } = answer
    if (status === 200) return g.modal.close({ notice: { APPROVE: '已批准', REQUEST_CHANGES: '已请求修改', COMMENT: '已评论' }[event] + ` · ${data.head.slice(0, 7)}` })
    fail(githubProblem(status, reply))
  } catch (error) { fail(error.message) }
}

if (!data?.repo) root.replaceChildren(h('p', { role: 'alert', text: '从 PR 卡片打开这里' }))
else {
  root.replaceChildren(
    h('p', { text: data.title }),
    h('dl', { class: 'kv' },
      h('dt', { text: 'PR' }), h('dd', {}, h('code', { text: `${data.repo}#${data.number}` })),
      h('dt', { text: 'head' }), h('dd', {}, h('code', { text: String(data.head) }), ' · 刚刚重新核对'),
      h('dt', { text: '身份' }), h('dd', { text: `你的 GitHub：${data.login}${data.mine === 'APPROVED' ? ' · 你已批准过' : data.mine === 'CHANGES_REQUESTED' ? ' · 你请求过修改' : ''}` })),
    h('div', { class: 'choices' }, ...choices),
    body,
    say,
    h('div', { class: 'confirm-actions' }, cancel, go))
}
