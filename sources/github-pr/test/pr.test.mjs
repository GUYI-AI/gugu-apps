import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardState, githubProblem, mergeMethods, parseRef, parseTarget } from '../app/lib/pr.js'

const pr = (over = {}) => ({ state: 'open', merged: false, draft: false, mergeable: true, mergeable_state: 'clean', user: { login: 'author' }, base: { ref: 'dev' }, head: { sha: 'abc' }, ...over })
const run = (name, status, conclusion = null) => ({ name, status, conclusion })
const done = (name, conclusion = 'success') => run(name, 'completed', conclusion)
const checks = (...runs) => ({ check_runs: runs })
const review = (login, state) => ({ user: { login }, state })

test('any repository\'s PR, located by repo and number; the rest of the data is text', () => {
  assert.deepEqual(parseTarget({ repo: 'nodejs/node', number: 7, title: 't' }), { repo: 'nodejs/node', number: 7, title: 't', url: 'https://github.com/nodejs/node/pull/7' })
  for (const repo of ['GUYI-AI/gugu', 'guyi-ai/gugu', 'a/b', 'octo-cat/re.po_x-1', 'x'.repeat(39) + '/y']) assert.equal(parseTarget({ repo, number: 1 }).repo, repo)
  assert.equal(parseTarget({ repo: ' cli/cli ', number: '12' }).number, 12)
  for (const repo of ['other/gugu/../x', 'owner/', '/repo', 'owner/..', 'owner/.', '-owner/r', 'x'.repeat(40) + '/y', 'a b/c', 'https://github.com/a/b']) assert.match(parseTarget({ repo, number: 1 }).error, /不是 GitHub 仓库名/, repo)
  for (const number of [0, -1, 1.5, 'x', null]) assert.match(parseTarget({ repo: 'cli/cli', number }).error, /PR 号不对/, String(number))
})

test('no data is a tab with nothing to show, not an error; a card without a repo says so instead of 「空」', () => {
  assert.deepEqual(parseTarget(undefined), { none: true })
  assert.deepEqual(parseTarget(null), { none: true })
  for (const data of [{}, { number: 1 }, { repo: ' ', number: 1 }, { repo: 42, number: 1 }]) {
    const { error } = parseTarget(data)
    assert.match(error, /没有写是哪个仓库/); assert.doesNotMatch(error, /空|GUYI-AI/)
  }
})

test('a pasted PR link or owner/repo#n', () => {
  const want = { repo: 'cli/cli', number: 9001, title: '', url: 'https://github.com/cli/cli/pull/9001' }
  for (const text of ['https://github.com/cli/cli/pull/9001', ' https://github.com/cli/cli/pull/9001/files ', 'http://www.github.com/cli/cli/pull/9001#issuecomment-1', 'github.com/cli/cli/pull/9001', 'cli/cli#9001', 'https://github.com/cli/cli/pull/9001?w=1']) assert.deepEqual(parseRef(text), want, text)
  for (const text of ['', 'cli/cli', 'https://github.com/cli/cli/issues/9001', 'https://gitlab.com/cli/cli/pull/1', 'cli/cli#x', 'a/b/c#1']) assert.ok(parseRef(text).error, text)
})

test('the seven states the design shows, from what GitHub answers', () => {
  const two = review('reviewer', 'APPROVED')
  assert.equal(cardState({ pr: pr(), checks: checks(done('a'), done('b')), reviews: [two] }).kind, 'green')
  assert.equal(cardState({ pr: pr(), checks: checks(done('a'), done('b')), reviews: [two] }).reason, null)
  const running = cardState({ pr: pr({ mergeable_state: 'blocked' }), checks: checks(done('a'), run('Typecheck', 'in_progress')), reviews: [] })
  assert.equal(running.kind, 'running'); assert.match(running.line, /1\/2 · Typecheck/)
  const red = cardState({ pr: pr({ mergeable_state: 'blocked' }), checks: checks(done('a', 'failure'), done('b', 'timed_out'), done('c')), reviews: [] })
  assert.equal(red.kind, 'red'); assert.match(red.line, /2 项失败：a · b/)
  assert.equal(cardState({ pr: pr({ mergeable: false, mergeable_state: 'dirty' }), checks: checks(), reviews: [] }).kind, 'conflict')
  const blocked = cardState({ pr: pr({ mergeable_state: 'blocked' }), checks: checks(done('a')), reviews: [review('author', 'APPROVED')] })
  assert.equal(blocked.kind, 'blocked'); assert.equal(blocked.reason, '等批准')
  const merged = cardState({ pr: pr({ state: 'closed', merged: true, merged_by: { login: 'shuxue' }, merge_commit_sha: '9a1f3e2aa' }), checks: checks(), reviews: [] })
  assert.equal(merged.kind, 'merged'); assert.equal(merged.merge, false); assert.match(merged.line, /由 shuxue 合并进 dev · 9a1f3e2/)
})

test('a later review replaces an earlier one; the author\'s own does not count', () => {
  const s = cardState({ pr: pr(), checks: checks(done('a')), reviews: [review('r', 'APPROVED'), review('r', 'CHANGES_REQUESTED'), review('author', 'APPROVED')] })
  assert.match(s.line, /还没有批准/)
})

test('any red check stops a merge, even one GitHub calls optional (unstable); mergeable null and behind do too', () => {
  const s = cardState({ pr: pr({ mergeable_state: 'unstable' }), checks: checks(done('a'), done('verify', 'failure')), reviews: [] })
  assert.equal(s.kind, 'red'); assert.equal(s.reason, '检查失败'); assert.match(s.line, /1 项失败：verify/)
  assert.equal(cardState({ pr: pr({ mergeable: null }), checks: checks(done('a')), reviews: [] }).kind, 'computing')
  assert.equal(cardState({ pr: pr({ mergeable_state: 'behind' }), checks: checks(done('a')), reviews: [] }).kind, 'behind')
  assert.equal(cardState({ pr: pr({ draft: true, mergeable_state: 'draft' }), checks: checks(), reviews: [] }).kind, 'draft')
  assert.equal(cardState({ pr: pr({ state: 'closed' }), checks: checks(), reviews: [] }).kind, 'closed')
})

test('GitHub\'s refusals in words, and the methods the repository allows', () => {
  assert.match(githubProblem(409, {}), /新提交/)
  assert.match(githubProblem(404, {}), /找不到/)
  assert.match(githubProblem(403, { message: 'Although you appear to have the correct authorization credentials, the `GUYI-AI` organization has enabled OAuth App access restrictions' }), /OAuth App/)
  assert.match(githubProblem(405, { message: 'Pull Request is not mergeable' }), /not mergeable/)
  assert.deepEqual(mergeMethods({ allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: false }, 'squash').map((m) => m.value), ['squash', 'merge'])
  assert.deepEqual(mergeMethods({ allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: true }, null).map((m) => m.value), ['merge', 'squash', 'rebase'])
})
