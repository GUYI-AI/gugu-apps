import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const receiver = { agentId: 'user:receiver', sessionId: 'receiver', title: 'Receiver', status: 'working', deviceId: null }
const remote = { agentId: 'user:remote', sessionId: 'remote', title: 'Remote lane', deviceId: 'device-b', deviceLabel: 'Computer B', statusFrom: 'device', statusAt: '2026-10-26T07:00:00.000Z', status: 'working' }

test('cross-device watch, needs_you delivery, deduplication, offline retention and confirmed removal', async () => {
  let rows = [receiver, remote]
  let unreached = []
  const sub = { id: 'w123', by: receiver.agentId, to: receiver.agentId, target: remote.agentId, level: 'needs_you', stuckMinutes: 30, devices: { target: 'device-b', to: null } }
  const data = new Map([['subs/w123.json', JSON.stringify(sub)]])
  const sent = []
  const errors = []
  let changed
  let saved
  const untilSaved = () => new Promise((resolve) => { saved = resolve })
  const g = {
    readData: async (file) => data.get(file) ?? null,
    listData: async () => data.has('subs/w123.json') ? [{ kind: 'file', path: 'subs/w123.json' }] : [],
    writeData: async (file, text) => { data.set(file, text); if (file === 'state.json') saved?.(JSON.parse(text)) },
    listAgents: async (options) => { assert.equal(options?.report, true); return { agents: rows, unreached } },
    getContext: async () => ({ locale: 'en' }),
    dispatch: async (text, options) => { sent.push({ text, options }) },
    readAgentHistory: async () => { throw new Error('needs_you must not read conversation history') },
    callProgram: async (tool) => { assert.equal(tool, 'unwatch'); data.delete('subs/w123.json') },
    reportError: (message) => errors.push(message),
    broadcastToViews: async () => {},
    onViewMessage: () => {},
    onAgentsChanged: (fn) => { changed = fn },
  }
  const originalInterval = globalThis.setInterval
  globalThis.window = { gugu: g }
  globalThis.setInterval = () => 0
  try {
    const first = untilSaved()
    await import('../sources/radar/background.js')
    await first
    assert.equal(sent.length, 0, 'first look is only a baseline')
    const step = async (nextRows, missed = []) => {
      rows = nextRows; unreached = missed
      const complete = untilSaved()
      changed()
      return await complete
    }
    await step([receiver, { ...remote, status: 'needs_user', detail: 'approval' }])
    assert.equal(sent.length, 1)
    assert.match(sent[0].text, /waiting for someone to approve/)
    assert.match(sent[0].text, /Computer B at 2026-10-26T07:00:00.000Z/)
    assert.deepEqual(sent[0].options, { to: { agent: receiver.agentId } })
    await step(rows)
    assert.equal(sent.length, 1, 'same need is told once')
    const offline = await step([receiver], [{ deviceId: 'device-b', label: 'Computer B', detail: 'offline' }])
    assert.ok(data.has('subs/w123.json'))
    assert.equal(offline.last[remote.agentId].status, 'needs_user')
    assert.equal(sent.length, 1, 'offline is not gone')
    await step([receiver, remote])
    await step([receiver, { ...remote, status: 'needs_user', detail: 'question' }])
    assert.equal(sent.length, 2, 'working again rearms the watch')
    await step([receiver], [{ deviceId: null, detail: 'remote listing unavailable' }])
    assert.ok(data.has('subs/w123.json'))
    // A current local reading wins over an old remote address, even while that old device is offline.
    await step([receiver, { ...remote, deviceId: null }], [{ deviceId: 'device-b', detail: 'offline' }])
    await step([receiver, { ...remote, deviceId: null, status: 'needs_user', detail: 'question' }], [{ deviceId: 'device-b', detail: 'offline' }])
    assert.equal(sent.length, 3)
    await step([receiver])
    assert.equal(sent.length, 4, 'confirmed removal is told')
    assert.equal(data.has('subs/w123.json'), false)
    assert.deepEqual(errors, [])
  } finally {
    globalThis.setInterval = originalInterval
    delete globalThis.window
  }
})

test('watch resolves a remote session and stores the device for offline checks', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'radar-test-'))
  process.env.GUGU_EXTENSION_DATA_DIR = dir
  try {
    await writeFile(path.join(dir, 'agents.json'), JSON.stringify({ at: remote.statusAt, agents: [receiver, remote] }))
    const { watch } = await import('../sources/radar/tools.js')
    const result = await watch.run({ target: 'session:remote', level: 'needs_you' }, { agent: receiver.agentId })
    const stored = JSON.parse(await readFile(path.join(dir, 'subs', `${result.id}.json`), 'utf8'))
    assert.equal(stored.devices.target, 'device-b')
    assert.equal(stored.level, 'needs_you')
    assert.equal(stored.to, receiver.agentId)
  } finally {
    delete process.env.GUGU_EXTENSION_DATA_DIR
    assert.ok(dir.startsWith(path.join(os.tmpdir(), 'radar-test-')))
    console.log(`Removing own test directory: ${dir}`)
    await rm(dir, { recursive: true, force: true })
  }
})
