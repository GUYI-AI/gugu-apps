import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardOf, checkView, dataBytes, fileOf, viewOf } from '../app/lib/spec.js'

test('a file reference: gugu-file URI with or without version, or a bare id', () => {
  assert.deepEqual(fileOf('gugu-file://abc-123?v=4'), { id: 'abc-123', version: 4 })
  assert.deepEqual(fileOf('gugu-file://abc-123'), { id: 'abc-123', version: null })
  assert.deepEqual(fileOf('abc-123', 2), { id: 'abc-123', version: 2 })
  for (const bad of ['', 'gugu-file://a/b', 'https://x.test/a', 'abc?v=0', 42]) assert.throws(() => fileOf(bad), { code: 'bad-card' }, String(bad))
})

test('a card: file and sql required, view checked for its kind', () => {
  assert.deepEqual(cardOf({ file: 'gugu-file://f?v=1', sql: 'select 1', view: { kind: 'bar', x: 'a', y: 'b', extra: '<img>' } }),
    { id: 'f', version: 1, sheet: undefined, sql: 'select 1', view: { kind: 'bar', x: 'a', y: 'b' } })
  assert.equal(cardOf({ file: 'f', sql: 'select 1' }).view.kind, 'table')
  assert.throws(() => cardOf(null), { code: 'bad-card' })
  assert.throws(() => cardOf({ file: 'f' }), { code: 'bad-card' })
  assert.throws(() => cardOf({ file: 'f', sql: 'x', view: { kind: 'pie' } }), { code: 'bad-view' })
  assert.throws(() => cardOf({ file: 'f', sql: 'x', view: { kind: 'bar', x: { toString: 1 } } }), { code: 'bad-card' })
})

test('a view names only columns its query returns', () => {
  assert.throws(() => checkView(viewOf({ kind: 'bar', x: 'region' }), ['region', 'total']), { code: 'bad-view', message: /view\.y/ })
  assert.throws(() => checkView(viewOf({ kind: 'bar', x: 'region', y: 'sum' }), ['region', 'total']), { code: 'bad-view', message: /"sum"/ })
  assert.throws(() => checkView(viewOf({ kind: 'heatmap', x: 'a', y: 'b' }), ['a', 'b', 'c']), { code: 'bad-view' })
  assert.deepEqual(checkView(viewOf({ kind: 'kpi' }), ['a']), { kind: 'kpi' })
})

test('data bytes are counted as UTF-8', () => {
  assert.equal(dataBytes({ a: '区' }), new TextEncoder().encode('{"a":"区"}').byteLength)
})
