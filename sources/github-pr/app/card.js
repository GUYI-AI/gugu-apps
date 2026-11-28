// The PR card in a chat message (a widget, 202 px high). Reads GitHub once when it opens and once before a merge (and when
// the person presses refresh); never on a timer.
import { cardState, mergeMethods, parseRef, parseTarget, viewerReview } from './lib/pr.js'
import { forgetViewer, hasGithub, read, readPr, viewerLogin } from './lib/github.js'
import { h } from './lib/dom.js'

const g = window.gugu
const ctx = await g.getContext()
const root = document.getElementById('pr')
let target = parseTarget(ctx.widget?.data)
const fromTab = !!target.none
// A tab is a whole page, not a 202 px card: the card's rows stay together at the top (card.css `.pr.tab`).
if (fromTab) root.classList.add('tab')
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
      target.url ? button('', { 'aria-label': '刷新', onclick: () => load() }, icon('refresh')) : null,
      fromTab ? h('span', { class: 'spacer' }) : null,
      fromTab ? button('换一个 PR', { onclick: () => drawAsk() }) : null))
}

/** Opened as a tab (no card behind it): ask for a PR instead of reading nothing. */
function drawAsk(problem = '', value = '') {
  const input = h('input', { type: 'text', 'aria-label': 'PR 链接', value, placeholder: 'https://github.com/owner/repo/pull/123 或 owner/repo#123' })
  const open = () => {
    const next = parseRef(input.value)
    if (next.error) return drawAsk(next.error, input.value)
    target = next
    start()
  }
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') open() })
  root.replaceChildren(h('div', { class: 'head' }, icon('git-pull-request'), h('small', { class: 'repo', text: 'GitHub PR' })),
    h('strong', { class: 'title', id: 't', text: '打开一个 PR' }),
    problem ? status('bad', 'triangle-alert', problem) : status('', 'info', '贴 PR 链接，或让 agent 把 PR 发成群里的卡片'),
    h('div', { class: 'actions' }, input, button('打开', { class: 'primary', onclick: open })))
  input.focus()
}

// What to make on GitHub for this App: what it reads (PR, checks, reviews) and writes (merge, review). The host's dialog
// (`gugu.credentials.choose`, API 64) shows the same words above its form.
const TOKEN_HINT = 'GitHub 细粒度 token：仓库权限里 Pull requests 读写、Contents 只读'
const TOKEN_PAGE = 'https://github.com/settings/personal-access-tokens/new'
const canChoose = () => typeof g.credentials?.choose === 'function'

/** No usable github.com credential: what to make and where, and one button to the host's dialog; a choice reloads the card. */
function drawSetup(problem) {
  if (!canChoose() || byAgent) {
    return drawProblem(byAgent ? '这台电脑上还没有给这个 App 选 github.com 的凭据，需要人来选' : `${problem}。在 App 的权限里为 github.com 选一份凭据（密码库读不了时看「设置 › 密码」），然后点刷新`, { signIn: true })
  }
  const choose = async () => {
    try {
      const { chosen } = await g.credentials.choose('github.com', { hint: TOKEN_HINT, help: TOKEN_PAGE })
      if (chosen) { await forgetViewer(); await load() }
    } catch (error) { g.reportError(`没能打开凭据窗口：${error.message}`) }
  }
  root.replaceChildren(head(target.repo ?? '', target.number ?? '', null),
    h('strong', { class: 'title', id: 't', text: target.title || 'GitHub PR' }),
    status('wait', 'key-round', problem),
    h('small', { class: 'meta' }, '需要一份 ', h('a', { href: TOKEN_PAGE, text: 'GitHub 细粒度 token', onclick: (event) => { event.preventDefault(); g.openBrowserTab(TOKEN_PAGE).catch(() => {}) } }),
      '：选上这些仓库，Pull requests 读写，Contents 只读'),
    h('div', { class: 'actions' },
      target.url ? button('在 GitHub 打开', { onclick: openOnGithub }, icon('external-link')) : null,
      h('span', { class: 'spacer' }),
      fromTab ? button('换一个 PR', { onclick: () => drawAsk() }) : null,
      button('设置凭据', { class: 'primary', onclick: choose }, icon('key-round'))))
}

const TONE_ICON = { ok: 'circle-check', bad: 'x-circle', wait: 'loader-circle', done: 'git-merge' }
const KIND_ICON = { conflict: 'triangle-alert', blocked: 'circle-alert', behind: 'circle-alert', computing: 'loader-circle', closed: 'git-pull-request-closed', draft: 'git-pull-request-draft' }

const VERDICT = { APPROVED: '你已批准', CHANGES_REQUESTED: '你请求了修改' }

function draw({ pr }, state, you) {
  const prState = pr.merged ? 'merged' : pr.state === 'closed' ? 'closed' : pr.draft ? 'draft' : 'open'
  const reason = byAgent ? '只有人能合并' : busy ? '正在核对…' : state.reason
  const meta = `${pr.user?.login ?? ''} · ${pr.changed_files} 个文件 `
  const top = head(target.repo, target.number, prState)
  // Where the person stands, in the head row (the card is 202 px high): asked to review, or their verdict.
  if (you?.asked || you?.mine) {
    top.append(h('small', { class: `you ${you.mine?.state === 'CHANGES_REQUESTED' ? 'bad' : you.mine ? 'ok' : 'wait'}`,
      text: you.mine ? VERDICT[you.mine.state] + (you.mine.stale ? '（旧提交）' : '') : '请你评审' }))
  }
  root.replaceChildren(top,
    h('strong', { class: 'title', id: 't', text: pr.title, title: pr.title }),
    h('small', { class: 'meta' }, meta, h('span', { class: 'add', text: `+${pr.additions}` }), ' ', h('span', { class: 'del', text: `−${pr.deletions}` }),
      ` · ${pr.head.sha.slice(0, 7)} → ${pr.base.ref}`),
    notice ? status('wait', 'info', notice) : status(state.tone, KIND_ICON[state.kind] ?? TONE_ICON[state.tone], state.line),
    h('div', { class: 'actions' },
      button('查看改动', { onclick: () => openDiff(pr) }),
      button('', { 'aria-label': '在 GitHub 打开', onclick: openOnGithub }, icon('external-link')),
      button('', { 'aria-label': '刷新', onclick: () => load() }, icon('refresh')),
      state.merge ? (reason ? h('small', { class: 'reason', text: reason }) : h('span', { class: 'spacer' })) : h('span', { class: 'spacer' }),
      you?.canReview && !byAgent ? button('评审', { ...(busy ? { disabled: '' } : {}), onclick: () => review() }, icon('circle-check')) : null,
      state.merge ? button('合并', { class: 'primary', ...(reason ? { disabled: '' } : {}), onclick: () => merge() }, icon('git-merge')) : null,
      fromTab ? button('换一个 PR', { onclick: () => drawAsk() }) : null))
}

let shown = null
let viewer = null
const redraw = () => shown && draw(shown, cardState(shown), viewerReview(shown, viewer))

/** One round: the PR's three reads and, the first time, the person's login, all at once. */
async function fresh() {
  const [got, login] = await Promise.all([readPr(target), viewer ?? viewerLogin()])
  shown = got
  viewer = login
  return got
}

async function load({ keepNotice = false } = {}) {
  if (!keepNotice) notice = ''
  try {
    const got = await fresh()
    const state = cardState(got)
    // Once merged or closed, GitHub's own line says what happened; a note from before (「已合并 · sha」) only repeats it.
    if (!state.merge) notice = ''
    draw(got, state, viewerReview(got, viewer))
  } catch (error) {
    // No github.com credential for this App, the vault can't be read here, or GitHub refuses the one chosen: set one up.
    if (error.code === 'unavailable') drawSetup('还没有给这个 App 选 GitHub 凭据')
    else if (error.status === 401) drawSetup(error.message)
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
  redraw()
  try {
    const [now, repo, last] = await Promise.all([fresh(), read(`/repos/${target.repo}`), g.readData('merge-method.json')])
    const state = cardState(now)
    busy = false
    if (state.reason) { notice = `状态变了：${state.line}`; return redraw() }
    redraw()
    const result = await g.modal.open({ entry: 'confirm.html', title: `合并 ${target.repo} #${target.number}？`, size: 'sm',
      data: { repo: target.repo, number: target.number, title: now.pr.title, head: now.pr.head.sha, base: now.pr.base.ref,
        line: state.line, tone: state.tone, login: viewer, methods: mergeMethods(repo, JSON.parse(last ?? 'null')?.method) } })
    if (result?.notice) notice = result.notice
    if (result) await load({ keepNotice: true })
  } catch (error) {
    busy = false
    notice = error.message
    if (shown) redraw()
    else drawProblem(error.message)
  }
}

/**
 * GitHub's review: approve, request changes or comment, with a summary (required unless approving). Read again first, so
 * the review names the head the person is shown (`commit_id`); a push since then is said, not reviewed blind.
 */
async function review() {
  if (busy || byAgent) return
  const seen = shown?.pr.head.sha
  busy = true
  notice = ''
  redraw()
  try {
    const now = await fresh()
    busy = false
    const you = viewerReview(now, viewer)
    if (!you.canReview) { notice = '这个 PR 现在不能评审'; return redraw() }
    if (seen && now.pr.head.sha !== seen) { notice = `有新提交（${now.pr.head.sha.slice(0, 7)}），先看一眼改动再评审`; return redraw() }
    redraw()
    const result = await g.modal.open({ entry: 'review.html', title: `评审 ${target.repo} #${target.number}`, size: 'sm',
      data: { repo: target.repo, number: target.number, title: now.pr.title, head: now.pr.head.sha, login: viewer, mine: you.mine?.state ?? null } })
    if (result?.notice) notice = result.notice
    if (result) await load({ keepNotice: true })
  } catch (error) {
    busy = false
    notice = error.message
    if (shown) redraw()
    else drawProblem(error.message)
  }
}

async function start() {
  if (target.none) drawAsk()
  else if (target.error) drawProblem(target.error)
  else if (!hasGithub()) drawPhone()
  else await load()
}
await start()
// Drawn (the PR, a problem or the question): the host shows this page in place of the card it kept from last time.
g.ready()
