// lib/bytes.js: a file's content from any handle gugu gives — read in pieces, bytes(), blob(), or text.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contentOf } from '../app/lib/bytes.js'

const data = Uint8Array.from({ length: 1300 * 1024 + 7 }, (_, i) => (i * 31) % 251)

test('a handle with size and read: pieces of at most 512 KiB, in order, into one buffer', async () => {
  const asked = []
  const f = { size: data.byteLength, read: async (offset, length) => { asked.push([offset, length]); return data.slice(offset, offset + length) }, bytes: () => assert.fail('bytes() not needed') }
  const got = await contentOf(f)
  assert.deepEqual(got, data)
  assert.deepEqual(asked, [[0, 524288], [524288, 524288], [1048576, data.byteLength - 1048576]])
})

test('a read that stops short is an error, not a truncated file', async () => {
  const f = { size: data.byteLength, read: async (offset, length) => (offset > 0 ? new Uint8Array(0) : data.slice(0, length)) }
  await assert.rejects(contentOf(f, 'shop.sqlite'), (error) => error.code === 'unreadable' && /shop\.sqlite ended at 524288/.test(error.message))
})

test('without a size (a file elsewhere, not yet sized): bytes(); else blob(); else a text handle\'s text', async () => {
  assert.deepEqual(await contentOf({ read: () => assert.fail('no size, no pieces'), bytes: async () => data }), data)
  assert.deepEqual(await contentOf({ blob: async () => new Blob([data]) }), data)
  assert.equal(await contentOf({ text: 'a,b\n1,2' }), 'a,b\n1,2')
  await assert.rejects(contentOf({}), (error) => error.code === 'unreadable')
})
