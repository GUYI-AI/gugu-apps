// The PR card in a chat message (a widget, 202 px high). Reads GitHub once when it opens and once before a merge (and when
// the person presses refresh); never on a timer.
import { cardState, mergeMethods, parseTarget } from './lib/pr.js'
import { hasGithub, read, readPr } from './lib/github.js'
import { h } from './lib/dom.js'

const g = window.gugu
const ctx = await g.getContext()
const root = document.getElementById('pr')
const target = parseTarget(ctx.widget?.data)
const byAgent = ctx.operator?.kind === 'agent'
let busy = false
let notice = ''

const icon = (name) => h('gugu-icon', { name })
const button = (label, props = {}, ...children) => h('button', props, ...children, ...(label ? [label] : []))

function openOnGithub() {
  g.openBrowserTab(target.url).catch((error) => g.reportError(`没能打开 GitHub：${error.message}`))
}

function head(repo, number, state) {
  const label = { open: '打开', draft: '草稿', merged: '已合并', closed: '已关闭' }[state]
  return h('div', { class: 'head' }, icon(state === 'merged' ? 'git-merge' : state === 'draft' ? 'git-pull-request-draft' : 'git-pull-request'),
    h('small', { class: 'repo', text: `${repo} #${number}` }), label ? h('small', { class: `state ${state}`, text: label }) : null)
}

function status(tone, iconName, text) {
  return h('small', { class: `status ${tone}` }, icon(iconName), h('span', { text, title: text }))
}

/** A phone has no `gugu.credentials`: what the card was sent with, and GitHub one tap away. */
function drawPhone() {
  root.replaceChildren(head(target.repo, target.number, null),
    h('strong', { class: 'title', id: 't', text: target.title || `${target.repo} #${target.number}` }),
    status('', 'smartphone', '手机上只显示发卡时的信息；检查、改动和合并请在电脑上看'),
    h('div', { class: 'actions' }, h('span', { class: 'spacer' }), button('在 GitHub 打开', { class: 'primary', onclick: openOnGithub }, icon('github'))))
}

function drawProblem(message, { signIn = false } = {}) {
  root.replaceChildren(head(target.repo ?? '', target.number ?? '', null),
    h('strong', { class: 'title', id: 't', text: target.title || 'GitHub PR' }),
    status(signIn ? 'wait' : 'bad', signIn ? 'github' : 'triangle-alert', message),
    h('div', { class: 'actions' },
      target.url ? button('在 GitHub 打开', { onclick: openOnGithub }, icon('external-link')) : null,
      target.url ? button('', { 'aria-label': '刷新', onclick: () => load() }, icon('refresh')) : null))
}

const TONE_ICON = { ok: 'circle-check', bad: 'x-circle', wait: 'loader-circle', done: 'git-merge' }
const KIND_ICON = { conflict: 'triangle-alert', blocked: 'circle-alert', behind: 'circle-alert', computing: 'loader-circle', closed: 'git-pull-request-closed', draft: 'git-pull-request-draft' }

function draw({ pr }, state) {
  const prState = pr.merged ? 'merged' : pr.state === 'closed' ? 'closed' : pr.draft ? 'draft' : 'open'
  const reason = byAgent ? '只有人能合并' : busy ? '正在核对…' : state.reason
  const meta = `${pr.user?.login ?? ''} · ${pr.changed_files} 个文件 `
  root.replaceChildren(head(target.repo, target.number, prState),
    h('strong', { class: 'title', id: 't', text: pr.title, title: pr.title }),
    h('small', { class: 'meta' }, meta, h('span', { class: 'add', text: `+${pr.additions}` }), ' ', h('span', { class: 'del', text: `−${pr.deletions}` }),
      ` · ${pr.head.sha.slice(0, 7)} → ${pr.base.ref}`),
    notice ? status('wait', 'info', notice) : status(state.tone, KIND_ICON[state.kind] ?? TONE_ICON[state.tone], state.line),
    h('div', { class: 'actions' },
      button('查看改动', { onclick: () => openDiff(pr) }),
      button('', { 'aria-label': '在 GitHub 打开', onclick: openOnGithub }, icon('external-link')),
      button('', { 'aria-label': '刷新', onclick: () => load() }, icon('refresh')),
      state.merge ? (reason ? h('small', { class: 'reason', text: reason }) : h('span', { class: 'spacer' })) : h('span', { class: 'spacer' }),
      state.merge ? button('合并', { class: 'primary', ...(reason ? { disabled: '' } : {}), onclick: () => merge() }, icon('git-merge')) : null))
}

let shown = null
async function load({ keepNotice = false } = {}) {
  if (!keepNotice) notice = ''
  try {
    const got = await readPr(target)
    shown = got
    const state = cardState(got)
    // Once merged or closed, GitHub's own line says what happened; a note from before (「已合并 · sha」) only repeats it.
    if (!state.merge) notice = ''
    draw(got, state)
  } catch (error) {
    // No github.com credential for this App, or the vault can't be read on this computer: where the person fixes it.
    if (error.code === 'unavailable') drawProblem('在 App 的权限里为 github.com 选一份凭据（密码库读不了时看「设置 › 密码」），然后点刷新', { signIn: true })
    else drawProblem(error.message)
  }
}

async function openDiff(pr) {
  try {
    await g.modal.open({ entry: 'diff.html', title: `${target.repo} #${target.number} 的改动`, size: 'xl',
      data: { repo: target.repo, number: target.number, head: pr.head.sha, files: pr.changed_files, additions: pr.additions, deletions: pr.deletions } })
  } catch (error) { g.reportError(`没能打开改动：${error.message}`) }
}

/** Read again, then ask; the dialog merges with the head it showed (`PUT …/merge { sha }`), so a later push is refused by GitHub. */
async function merge() {
  if (busy || byAgent) return
  busy = true
  notice = ''
  if (shown) draw(shown, cardState(shown))
  try {
    const fresh = await readPr(target)
    shown = fresh
    const state = cardState(fresh)
    if (state.reason) { busy = false; notice = `状态变了：${state.line}`; return draw(fresh, state) }
    const [repo, user, last] = await Promise.all([read(`/repos/${target.repo}`), read('/user'), g.readData('merge-method.json')])
    busy = false
    draw(fresh, state)
    const result = await g.modal.open({ entry: 'confirm.html', title: `合并 ${target.repo} #${target.number}？`, size: 'sm',
      data: { repo: target.repo, number: target.number, title: fresh.pr.title, head: fresh.pr.head.sha, base: fresh.pr.base.ref,
        line: state.line, tone: state.tone, login: user.login, methods: mergeMethods(repo, JSON.parse(last ?? 'null')?.method) } })
    if (result?.notice) notice = result.notice
    if (result) await load({ keepNotice: true })
  } catch (error) {
    busy = false
    notice = error.message
    if (shown) draw(shown, cardState(shown))
    else drawProblem(error.message)
  }
}

if (target.error) drawProblem(target.error)
else if (!hasGithub()) drawPhone()
else await load()
