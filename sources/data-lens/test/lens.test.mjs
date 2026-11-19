// lib/lens.js: the page's handle on the worker. Bytes go to the worker by transfer, the page keeps no copy, and a
// worker stopped by a long query loads the file again through `reread`.
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

// A stand-in Worker: records what it is sent (by type, never holding the content), answers `load` at once and
// `query` unless told to hang. postMessage clones with the transfer list, as a real worker does.
const workers = []
globalThis.Worker = class {
  constructor() {
    this.sent = []
    this.hang = false
    this.terminated = false
    workers.push(this)
  }
  postMessage(message, transfer = []) {
    const got = structuredClone(message, { transfer })
    const content = got.content
    this.sent.push({ op: got.op, transfer: transfer.length, kind: typeof content === 'string' ? 'text' : content ? content.constructor.name : null, size: typeof content === 'string' ? content.length : content?.byteLength })
    if (got.op === 'query' && this.hang) return
    const reply = got.op === 'load' ? { tables: [{ name: got.name, columns: ['n'], rows: 1, first: content?.[0] }] } : { result: { columns: ['n'], rows: [[1]], truncated: false } }
    queueMicrotask(() => this.onmessage?.({ data: { id: got.id, ok: true, ...reply } }))
  }
  terminate() {
    this.terminated = true
  }
}

const { Lens } = await import('../app/lib/lens.js')
const MiB = 1024 * 1024

test('w1: bytes go to the worker by transfer, not a copy', async () => {
  const lens = new Lens()
  const bytes = new Uint8Array(MiB).fill(7)
  await lens.load('shop.sqlite', bytes)
  const [load] = workers.at(-1).sent
  assert.equal(load.transfer, 1, 'the load message carries a transfer list')
  assert.equal(load.size, MiB)
  assert.equal(bytes.byteLength, 0, "the page's array was handed over")
  lens.close()
})

test('w1: a view on part of a buffer is copied once, then transferred; the caller keeps its buffer', async () => {
  const lens = new Lens()
  const whole = new Uint8Array(2 * MiB).fill(3)
  const part = whole.subarray(MiB)
  await lens.load('shop.sqlite', part)
  const [load] = workers.at(-1).sent
  assert.equal(load.transfer, 1)
  assert.equal(load.size, MiB)
  assert.equal(whole.byteLength, 2 * MiB)
  lens.close()
})

test('w1: a CSV text goes as it is', async () => {
  const lens = new Lens()
  await lens.load('a.csv', 'n\n1\n')
  const [load] = workers.at(-1).sent
  assert.deepEqual([load.kind, load.transfer], ['text', 0])
  lens.close()
})

test('w2: the page keeps no copy of the bytes to load again from', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const lens = new Lens()
    await lens.load('big.xlsx', new Uint8Array(4 * MiB).fill(1), 'Sheet1')
    const first = workers.at(-1)
    first.hang = true
    const stopped = lens.query('select * from huge')
    mock.timers.tick(20_000)
    await assert.rejects(stopped, (error) => error.code === 'timeout')
    first.hang = false
    await lens.query('select 1').catch(() => {})
    const resent = workers.slice(workers.indexOf(first) + 1).flatMap((w) => w.sent).filter((m) => m.op === 'load')
    assert.deepEqual(resent, [], 'with no reread, nothing is loaded again from a copy held by the page')
    lens.close()
  } finally {
    mock.timers.reset()
  }
})

test('w3: a worker stopped by a long query loads the file again through reread, once', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const lens = new Lens()
    let rereads = 0
    const reread = async () => {
      rereads++
      return new Uint8Array(MiB).fill(9)
    }
    await lens.load('shop.sqlite', new Uint8Array(MiB).fill(9), null, reread)
    const first = workers.at(-1)
    first.hang = true
    const stopped = lens.query('select * from huge')
    mock.timers.tick(20_000)
    await assert.rejects(stopped, (error) => error.code === 'timeout')
    assert.equal(first.terminated, true)
    const result = await lens.query('select 1')
    assert.deepEqual(result.rows, [[1]])
    assert.equal(rereads, 1)
    const next = workers.at(-1)
    assert.notEqual(next, first)
    assert.deepEqual(next.sent.map((m) => [m.op, m.size ?? null]), [['load', MiB], ['query', null]])
    lens.close()
  } finally {
    mock.timers.reset()
  }
})
