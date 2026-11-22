// What a PR card says, from what GitHub answered: pure, so it is tested without a host (test/pr.test.mjs).

/** The App touches GUYI-AI's PRs only: the host's `github` reaches anything the account can, so the App draws the line. */
export const ORG = 'GUYI-AI'
const REPO = /^GUYI-AI\/[A-Za-z0-9._-]{1,100}$/

/**
 * The card's data, sent by whoever sent the card: untrusted. `repo` and `number` only locate the PR; `title` is shown only
 * where GitHub cannot be read (a phone), as plain text.
 */
export function parseTarget(data) {
  const repo = typeof data?.repo === 'string' ? data.repo.trim() : ''
  const number = Number(data?.number)
  if (!REPO.test(repo) || repo.endsWith('/.') || repo.endsWith('/..')) return { error: `只支持 ${ORG} 组织下的 PR（卡片里写的是「${repo || '空'}」）` }
  if (!Number.isInteger(number) || number < 1 || number > 99_999_999) return { error: 'PR 号不对' }
  const title = typeof data?.title === 'string' ? data.title.slice(0, 300) : ''
  return { repo, number, title, url: `https://github.com/${repo}/pull/${number}` }
}

const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure', 'stale'])

/** The latest review of each reviewer: GitHub lists every review, and a later one replaces an earlier one's verdict. */
function approvals(reviews, author) {
  const latest = new Map()
  for (const review of reviews ?? []) {
    const login = review?.user?.login
    if (!login || login === author || review.state === 'COMMENTED' || review.state === 'PENDING') continue
    latest.set(login, review.state)
  }
  return [...latest.values()].filter((state) => state === 'APPROVED').length
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
  const approved = approvals(reviews, author)
  const total = runs.length
  const names = (list) => list.slice(0, 3).map((run) => run.name).join(' · ') + (list.length > 3 ? ` 等 ${list.length} 项` : '')
  const passed = `${total} 项检查通过`
  const approvedLine = approved ? `已获 ${approved} 个批准` : '还没有批准'
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
