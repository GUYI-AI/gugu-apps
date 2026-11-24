// What a PR card says, from what GitHub answered: pure, so it is tested without a host (test/pr.test.mjs).

// GitHub's own name rules: an owner is 1-39 letters, digits or single hyphens; a repository name is letters, digits, `.`, `_`, `-`.
const REPO = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/
const REF = /^(?:(?:https?:\/\/)?(?:www\.)?github\.com\/)?([^/\s#]+\/[^/\s#]+?)(?:\/pull\/|\/pulls\/|#)(\d+)(?:[/?#].*)?$/

/**
 * The card's data, sent by whoever sent the card: untrusted. `repo` and `number` only locate the PR; `title` is shown only
 * where GitHub cannot be read (a phone), as plain text. Any repository: what the person's credential can read, the card
 * shows; a merge still needs the person's own click on a dialog naming the repository, PR and head (confirm.js).
 * No data at all (the App opened as a tab, not from a card) is not an error: `{ none: true }`, and the card asks for a PR.
 */
export function parseTarget(data) {
  if (data === undefined || data === null) return { none: true }
  const repo = typeof data.repo === 'string' ? data.repo.trim() : ''
  const number = Number(data.number)
  if (!repo) return { error: '卡片里没有写是哪个仓库的 PR（data.repo 应写成 owner/repo）' }
  if (!REPO.test(repo) || repo.endsWith('/.') || repo.endsWith('/..')) return { error: `「${repo.slice(0, 120)}」不是 GitHub 仓库名（应写成 owner/repo）` }
  if (!Number.isInteger(number) || number < 1 || number > 99_999_999) return { error: `PR 号不对：「${String(data.number ?? '').slice(0, 20)}」` }
  const title = typeof data.title === 'string' ? data.title.slice(0, 300) : ''
  return { repo, number, title, url: `https://github.com/${repo}/pull/${number}` }
}

/** What a person pastes: a PR link (`https://github.com/owner/repo/pull/12`) or `owner/repo#12`. */
export function parseRef(text) {
  const match = REF.exec(String(text ?? '').trim())
  if (!match) return { error: '认不出这个 PR：贴 PR 链接，或写成 owner/repo#123' }
  return parseTarget({ repo: match[1], number: match[2] })
}

const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure', 'stale'])

/**
 * Each reviewer's verdict as GitHub counts it: their latest approval or change request (a comment changes nothing, a
 * dismissed review clears it), the author's own aside. `stale`: given on an earlier head than `head` (a repository that
 * dismisses stale approvals no longer counts it).
 */
export function verdicts(reviews, author, head) {
  const latest = new Map()
  for (const review of reviews ?? []) {
    const login = review?.user?.login
    if (!login || login === author || !['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) continue
    if (review.state === 'DISMISSED') latest.delete(login)
    else latest.set(login, { login, state: review.state, stale: !!head && !!review.commit_id && review.commit_id !== head })
  }
  return [...latest.values()]
}

/**
 * What the person reading may do: review (approve / request changes) unless they wrote the PR or it is merged or closed,
 * GitHub's own rule; `mine` their standing verdict; `asked` GitHub requested their review.
 */
export function viewerReview({ pr, reviews }, viewer) {
  const open = pr.state === 'open' && !pr.merged
  const mine = verdicts(reviews, pr.user?.login, pr.head?.sha).find((verdict) => verdict.login === viewer) ?? null
  return {
    canReview: !!viewer && open && viewer !== pr.user?.login,
    mine,
    asked: !!viewer && open && (pr.requested_reviewers ?? []).some((user) => user?.login === viewer),
  }
}

function reviewLine(list) {
  const approved = list.filter((verdict) => verdict.state === 'APPROVED')
  const stale = approved.filter((verdict) => verdict.stale).length
  const changes = list.filter((verdict) => verdict.state === 'CHANGES_REQUESTED')
  const parts = []
  if (changes.length) parts.push(`${changes.slice(0, 2).map((verdict) => verdict.login).join('、')}${changes.length > 2 ? ` 等 ${changes.length} 人` : ''} 请求修改`)
  parts.push(approved.length ? `已获 ${approved.length} 个批准${stale ? `（${stale} 个在旧提交上）` : ''}` : '还没有批准')
  return { line: parts.join(' · '), approved: approved.length, changes: changes.length }
}

/**
 * One of: merged, closed, draft, conflict, behind, computing, running, red, blocked, green.
 * `line` is the status row, `tone` its colour (ok / bad / wait / done), `reason` why merge is off (null: it is on).
 */
export function cardState({ pr, checks, reviews }) {
  const author = pr.user?.login
  const runs = checks?.check_runs ?? []
  const failed = runs.filter((run) => run.status === 'completed' && FAILED.has(run.conclusion))
  const running = runs.filter((run) => run.status !== 'completed')
  const review = reviewLine(verdicts(reviews, author, pr.head?.sha))
  const approved = review.approved
  const total = runs.length
  const names = (list) => list.slice(0, 3).map((run) => run.name).join(' · ') + (list.length > 3 ? ` 等 ${list.length} 项` : '')
  const passed = `${total} 项检查通过`
  const approvedLine = review.line
  if (pr.merged) {
    return { kind: 'merged', tone: 'done', reason: null, merge: false,
      line: `由 ${pr.merged_by?.login ?? '?'} 合并进 ${pr.base?.ref} · ${String(pr.merge_commit_sha ?? '').slice(0, 7)}`, at: pr.merged_at }
  }
  if (pr.state === 'closed') return { kind: 'closed', tone: 'bad', reason: null, merge: false, line: '已关闭，没有合并' }
  if (pr.draft) return { kind: 'draft', tone: 'wait', reason: '草稿', merge: true, line: '草稿 PR：标记为可评审后才能合并' }
  if (pr.mergeable === false || pr.mergeable_state === 'dirty') {
    return { kind: 'conflict', tone: 'bad', reason: '有冲突', merge: true, line: `与 ${pr.base?.ref} 有冲突，需要先把 ${pr.base?.ref} 合进来` }
  }
  if (running.length) {
    return { kind: 'running', tone: 'wait', reason: '等检查跑完', merge: true, line: `检查进行中 ${total - running.length}/${total} · ${names(running)} 还在跑` }
  }
  // Any red check stops the merge, required or not: GitHub calls a PR with only optional failures `unstable` and lets it
  // merge, but a red check is a reason to look first (the merge rule this App serves).
  if (failed.length) return { kind: 'red', tone: 'bad', reason: '检查失败', merge: true, line: `${failed.length} 项失败：${names(failed)}` }
  if (pr.mergeable === null || pr.mergeable === undefined || pr.mergeable_state === 'unknown') {
    return { kind: 'computing', tone: 'wait', reason: 'GitHub 还在算', merge: true, line: 'GitHub 还在计算能否合并，稍后点刷新再看' }
  }
  if (pr.mergeable_state === 'behind') {
    return { kind: 'behind', tone: 'wait', reason: '落后于 ' + pr.base?.ref, merge: true, line: `落后于 ${pr.base?.ref}，需要先把 ${pr.base?.ref} 合进来` }
  }
  if (pr.mergeable_state === 'blocked') {
    if (review.changes) return { kind: 'blocked', tone: 'bad', reason: '有人请求修改', merge: true, line: `${passed} · ${approvedLine}` }
    return { kind: 'blocked', tone: 'wait', reason: approved ? '分支保护未满足' : '等批准', merge: true,
      line: approved ? `${passed} · ${approvedLine} · 分支保护还有条件没满足` : `${passed} · 还差非作者的批准` }
  }
  return { kind: 'green', tone: 'ok', reason: null, merge: true, line: `${passed} · ${approvedLine}` }
}

/** GitHub's word for a refused read or merge, said plainly. */
export function githubProblem(status, data) {
  const message = typeof data?.message === 'string' ? data.message : ''
  if (status === 401) return 'GitHub 不认这份凭据（过期或被撤销）：在这个 App 的权限里换一份，或在「设置 › 密码」里更新它'
  if (status === 404) return '找不到这个 PR，或者你的 GitHub 账号看不到它'
  if (status === 403 && /rate limit/i.test(message)) return 'GitHub 接口用量到上限了，过一会儿再试'
  if (status === 403 && /OAuth App access restrictions/i.test(message)) return '这个组织限制了 OAuth App 访问：组织管理员在 GitHub 上批准咕咕后再试'
  if (status === 409) return 'PR 有新提交，已经刷新，再看一眼'
  // A refused review says why in `errors` (`Can not approve your own pull request`): GitHub's words, not a guess.
  if (status === 422) return `GitHub 没收下：${[message, ...(data?.errors ?? []).map((error) => typeof error === 'string' ? error : error?.message)].filter(Boolean).join(' · ') || '内容不对'}`
  if (status === 405) return `GitHub 不让合并：${message || '状态不满足'}`
  return `GitHub 返回 ${status}${message ? '：' + message : ''}`
}

/** The merge methods the repository allows, the person's last one first when it is allowed. */
export function mergeMethods(repo, last) {
  const all = [
    ['merge', '创建合并提交', repo?.allow_merge_commit],
    ['squash', '压缩合并（squash）', repo?.allow_squash_merge],
    ['rebase', '变基合并（rebase）', repo?.allow_rebase_merge],
  ].filter(([, , allowed]) => allowed !== false).map(([value, label]) => ({ value, label }))
  const index = all.findIndex((method) => method.value === last)
  return index > 0 ? [all[index], ...all.slice(0, index), ...all.slice(index + 1)] : all
}
