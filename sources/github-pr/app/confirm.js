// Merge, asked once more: what the card just re-read (head, checks, approvals), the account it merges as, the method.
// The merge names that head (`sha`): if anyone pushed since, GitHub refuses (409) and the card reads again.
import { githubProblem } from './lib/pr.js'
import { API, HEADERS, SITE } from './lib/github.js'
import { h } from './lib/dom.js'

const g = window.gugu
const { data } = (await g.getContext()).modal ?? {}
const root = document.getElementById('dlg')
const say = h('p', { role: 'status', class: 'muted', text: '如果这期间有人推了新提交，GitHub 会拒绝这次合并，卡片会刷新给你再看一眼。' })
const method = h('select', {}, ...(data?.methods ?? []).map((m) => h('option', { value: m.value, text: m.label })))
const cancel = h('button', { onclick: () => g.modal.close(null) }, '取消')
const go = h('button', { class: 'primary', onclick: () => merge() }, h('gugu-icon', { name: 'git-merge' }), '确认合并')

async function merge() {
  go.disabled = cancel.disabled = true
  say.className = 'muted'
  say.textContent = '正在合并…'
  try {
    const answer = await g.credentials.write(SITE, 'PUT', `${API}/repos/${data.repo}/pulls/${data.number}/merge`, { sha: data.head, merge_method: method.value }, { headers: HEADERS })
    // A page an agent works gets `null`: the host did not merge, the person has to.
    if (answer === null) { say.textContent = '合并要由人来点'; go.disabled = cancel.disabled = false; return }
    const { status, data: body } = answer
    if (status === 200 && body?.merged) {
      await g.writeData('merge-method.json', JSON.stringify({ method: method.value })).catch((error) => g.reportError(`没能记住合并方式：${error.message}`))
      return g.modal.close({ notice: `已合并 · ${String(body.sha ?? '').slice(0, 7)}` })
    }
    if (status === 409) return g.modal.close({ notice: githubProblem(409, body) })
    say.className = 'bad'
    say.setAttribute('role', 'alert')
    say.textContent = githubProblem(status, body)
  } catch (error) {
    say.className = 'bad'
    say.setAttribute('role', 'alert')
    say.textContent = error.message
  }
  cancel.disabled = false
}

if (!data?.repo) root.replaceChildren(h('p', { role: 'alert', text: '从 PR 卡片打开这里' }))
else {
  root.replaceChildren(
    h('p', { text: data.title }),
    // The full repository, PR and head: the card's data is whatever its sender wrote, so the person sees exactly what merges.
    h('dl', { class: 'kv' },
      h('dt', { text: 'PR' }), h('dd', {}, h('code', { text: `${data.repo}#${data.number}` })),
      h('dt', { text: '合并到' }), h('dd', { text: data.base }),
      h('dt', { text: 'head' }), h('dd', {}, h('code', { text: String(data.head) }), ' · 刚刚重新核对'),
      h('dt', { text: '检查' }), h('dd', { class: data.tone, text: data.line }),
      h('dt', { text: '身份' }), h('dd', { text: `你的 GitHub：${data.login}` })),
    h('label', {}, '方式', method),
    say,
    h('div', { class: 'confirm-actions' }, cancel, go))
}
