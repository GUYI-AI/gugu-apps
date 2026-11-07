import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TEXT, accountOf, scoreOf, itemOf, itemsOf, mineOf, boardOf, reviewQuery, allQuery, startersQuery, starterOf, textFor } from '../app/core.js'

const row = (over = {}) => ({
  html_url: 'https://github.com/GUYI-AI/gugu/pull/1', repository_url: 'https://api.github.com/repos/GUYI-AI/gugu',
  number: 1, title: 'Fix', state: 'open', user: { login: 'octo' }, labels: [], created_at: '2026-11-01T00:00:00Z',
  body: 'Change.\n\nGuguAccount: 100023', pull_request: { merged_at: null }, ...over,
})

test('the identity line is one line of its own, naming one 咕咕号', () => {
  assert.equal(accountOf('x\nGuguAccount: 100023\n'), 100023)
  assert.equal(accountOf('GuguAccount:100023  '), 100023)
  assert.equal(accountOf('see GuguAccount: 100023 above'), null)
  assert.equal(accountOf('GuguAccount: abc'), null)
  assert.equal(accountOf('GuguAccount: 1\nGuguAccount: 1'), 1)
  assert.equal(accountOf('GuguAccount: 1\nGuguAccount: 2'), null)
  assert.equal(accountOf(null), null)
  assert.equal(accountOf('Gugu-Account: 100023'), null, 'the old two-word form is not the line')
})

test('one score label scores; several conflict; 0 counts as reviewed', () => {
  assert.deepEqual(scoreOf([{ name: 'bug' }]), {})
  assert.deepEqual(scoreOf([{ name: 'score:4' }, { name: 'bug' }]), { score: 4 })
  assert.deepEqual(scoreOf([{ name: 'score:0' }]), { score: 0 })
  assert.deepEqual(scoreOf([{ name: 'score:2' }, { name: 'score:4' }]), { conflict: true })
  assert.deepEqual(scoreOf([{ name: 'score:6' }]), {})
})

test('status does not depend on merging', () => {
  assert.equal(itemOf(row()).status, 'waiting')
  assert.equal(itemOf(row({ state: 'closed', pull_request: { merged_at: '2026-11-02T00:00:00Z' } })).state, 'merged')
  assert.equal(itemOf(row({ state: 'closed' })).status, 'waiting')
  assert.equal(itemOf(row({ labels: [{ name: 'score:3' }] })).status, 'scored')
  const issue = itemOf(row({ pull_request: undefined, labels: [{ name: 'score:5' }] }))
  assert.equal(issue.kind, 'issue')
  assert.equal(issue.score, 5)
  assert.equal(itemOf(row({ body: 'no line' })), null)
})

test('mine and the board add up scored contributions only', () => {
  const items = itemsOf([
    row({ number: 1, labels: [{ name: 'score:5' }] }),
    row({ number: 2, labels: [{ name: 'score:0' }] }),
    row({ number: 3 }),
    row({ number: 4, labels: [{ name: 'score:1' }, { name: 'score:2' }] }),
    row({ number: 5, body: 'GuguAccount: 100117', user: { login: 'mei' }, labels: [{ name: 'score:3' }] }),
  ])
  const mine = mineOf(items, 100023)
  assert.equal(mine.points, 5)
  assert.equal(mine.scored.length, 2)
  assert.equal(mine.waiting.length, 2)
  assert.deepEqual(boardOf(items).map((r) => [r.account, r.points, r.scored, r.waiting, r.rank]), [[100023, 5, 2, 2, 1], [100117, 3, 1, 0, 2]])
  const tied = boardOf(itemsOf([row({ labels: [{ name: 'score:3' }] }), row({ body: 'GuguAccount: 2', labels: [{ name: 'score:3' }] }), row({ body: 'GuguAccount: 3', labels: [{ name: 'score:1' }] })]))
  assert.deepEqual(tied.map((r) => r.rank), [1, 1, 3], 'equal points share a rank')
})

test('the review list is everything with the line and no score label yet', () => {
  assert.match(reviewQuery(), /^org:GUYI-AI "GuguAccount" in:body /)
  for (let n = 0; n <= 5; n++) assert.ok(reviewQuery().includes(`-label:"score:${n}"`))
  assert.equal(allQuery(), 'org:GUYI-AI "GuguAccount" in:body')
})

test('what can be claimed is open, unassigned and marked for newcomers', () => {
  for (const part of ['is:issue', 'is:open', 'no:assignee', 'label:"good first issue"']) assert.ok(startersQuery().includes(part), part)
  assert.deepEqual(starterOf({ html_url: 'u', repository_url: 'https://api.github.com/repos/GUYI-AI/gugu', number: 7, title: 't', comments: 2, updated_at: 'c' }), { url: 'u', repo: 'gugu', number: 7, title: 't', comments: 2, updatedAt: 'c' })
})

test('both languages say the same things, and anything but Chinese reads English', () => {
  const shape = (o) => Object.entries(o).map(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? [k, shape(v)] : [k, typeof v]))
  assert.deepEqual(shape(TEXT.en), shape(TEXT.zh))
  assert.equal(textFor('zh-CN'), TEXT.zh)
  assert.equal(textFor('en-US'), TEXT.en)
  assert.equal(textFor('ja'), TEXT.en)
  assert.equal(textFor(undefined), TEXT.en)
})
