import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CSV, sqlite } from './fixtures.mjs'

// The host's file verbs as tools.js uses them: open by id (a binary file has blob(), a text file text), readVersion.
const files = new Map()
globalThis.gugu = {
  files: {
    async open({ id }) {
      const file = files.get(id)
      if (!file) throw Object.assign(new Error('gone'), { code: 'not-found' })
      const latest = file.versions.at(-1)
      const entry = { id, name: file.name, version: file.versions.length }
      return typeof latest === 'string'
        ? { entry, text: latest, close() {} }
        : { entry, blob: async () => new Blob([latest]), close() {} }
    },
    async readVersion({ id }, n) {
      const kept = files.get(id).versions[n - 1]
      return typeof kept === 'string' ? kept : new Blob([kept])
    },
  },
}
files.set('db1', { name: 'shop.sqlite', versions: [await sqlite(3), await sqlite(9)] })
files.set('csv1', { name: '销售.csv', versions: [CSV] })

const tools = await import('../app/tools.js')

test('every export is a tool', () => {
  for (const [name, tool] of Object.entries(tools)) {
    assert.equal(typeof tool.run, 'function', name)
    assert.equal(tool.inputSchema.properties.file.format, 'gugu-file', name)
  }
})

test('data_schema lists tables with samples, at the current version', async () => {
  const out = JSON.parse(await tools.data_schema.run({ file: 'db1' }))
  assert.equal(out.file, 'gugu-file://db1?v=2')
  assert.deepEqual(out.tables.map((t) => [t.name, t.rows]), [['customers', 2], ['orders', 9]])
  assert.equal(out.tables[1].sample.length, 3)
})

test('data_query reads a kept version when asked', async () => {
  const now = JSON.parse(await tools.data_query.run({ file: 'db1', sql: 'SELECT count(*) AS n FROM orders' }))
  const then = JSON.parse(await tools.data_query.run({ file: 'db1', sql: 'SELECT count(*) AS n FROM orders', version: 1 }))
  assert.deepEqual([now.rows, then.rows], [[[9]], [[3]]])
})

test('data_card returns widget_send data pinned to the version, checked against the columns', async () => {
  const out = JSON.parse(await tools.data_card.run({ file: 'csv1', sql: 'SELECT 区域 AS region, sum(金额) AS total FROM t GROUP BY 1', view: { kind: 'bar', x: 'region', y: 'total', title: '各区' } }))
  assert.deepEqual(out.data, { file: 'gugu-file://csv1?v=1', sql: 'SELECT 区域 AS region, sum(金额) AS total FROM t GROUP BY 1', view: { kind: 'bar', x: 'region', y: 'total', title: '各区' } })
  assert.ok(out.bytes <= 4096)
  await assert.rejects(tools.data_card.run({ file: 'csv1', sql: 'SELECT 1 AS a', view: { kind: 'bar', x: 'a', y: 'b' } }), { code: 'bad-view' })
  await assert.rejects(tools.data_card.run({ file: 'csv1', sql: `SELECT '${'区'.repeat(1500)}' AS a` }), { code: 'too-large' })
})
