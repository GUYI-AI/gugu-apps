import { test } from 'node:test'
import assert from 'node:assert/strict'
import { highlightView } from '../app/lib/highlight-view.js'

const data = {
  highlights: {
    later: { page: 3, by: 'me' },
    lower: { page: 1, by: 'other', rects: [[0, 0.8]] },
    upper: { page: 1, by: 'me', rects: [[0, 0.2]] },
    unattributed: { page: 2 },
  },
  comments: {
    newer: { on: 'upper', at: '2026-10-28T11:00:00Z', text: 'second' },
    older: { on: 'upper', at: '2026-10-28T10:00:00Z', text: 'first' },
    orphan: { on: 'deleted', at: '2026-10-28T10:00:00Z' },
  },
}
const messages = new Map([['lower', [{ id: 'm1' }, { id: 'm2' }]], ['deleted', [{ id: 'orphan' }]]])

test('quotes retain document order and their own chronological replies and chat references', () => {
  const view = highlightView(data, messages, 'me')
  assert.deepEqual(view.rows.map(({ id }) => id), ['upper', 'lower', 'unattributed', 'later'])
  assert.deepEqual(view.rows[0].comments.map(({ text }) => text), ['first', 'second'])
  assert.deepEqual(view.rows[1].messages.map(({ id }) => id), ['m1', 'm2'])
})

test('mine follows the current reader identity, never an unknown identity', () => {
  assert.deepEqual(highlightView(data, messages, 'me', 'mine').rows.map(({ id }) => id), ['upper', 'later'])
  assert.equal(highlightView(data, messages, undefined, 'mine').rows.length, 0)
})

test('discussed counts passages with local replies or chat references, excluding orphaned threads', () => {
  const view = highlightView(data, messages, 'me', 'discussed')
  assert.deepEqual(view.rows.map(({ id }) => id), ['upper', 'lower'])
  assert.deepEqual(view.counts, { all: 4, mine: 2, discussed: 2 })
})

test('filtering never changes the shared notes or reference map and supports an empty paper', () => {
  const before = JSON.stringify(data)
  highlightView(data, messages, 'other', 'mine')
  assert.equal(JSON.stringify(data), before)
  assert.equal(messages.get('lower').length, 2)
  assert.deepEqual(highlightView(undefined, new Map(), undefined), { rows: [], counts: { all: 0, mine: 0, discussed: 0 } })
})
