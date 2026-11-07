import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FILE_NAME, apply, join, run } from '../app/game.js'

// A stand-in for gugu: one chat's files, opened as live handles (saved at once), and its members.
const files = new Map()
globalThis.gugu = {
  files: {
    async open({ chat, name }) {
      const key = `${chat}/${name}`
      if (!files.has(key)) throw Object.assign(new Error('no such file'), { code: 'not-found' })
      const data = files.get(key)
      return { data, saved: true, status: 'online', toJSON: () => structuredClone(data), transact: (fn) => fn(), onStatus: () => () => {} }
    },
    async create({ chat, name }, content) { files.set(`${chat}/${name}`, structuredClone(content)); return { id: 'f1', name } },
  },
  chats: { async members() { return { members: [{ id: 'user:bot', name: 'Claude' }, { id: 'user:a', name: '阿青' }] } } },
}
const { look, act } = await import('../app/tools.js')
const call = { agent: 'user:bot' }

test('an agent joins, plays the errand and reads what a person said to it', async () => {
  const first = await look.run({ chat: 'c1' }, call)
  assert.match(first, /【客栈大堂】[\s\S]*指令/)
  const s = files.get(`c1/${FILE_NAME}`)
  assert.equal(s.players['user:bot'].name, 'Claude')
  assert.equal(s.players['user:bot'].agent, true)
  // A person comes in and speaks to it, as the page would.
  apply(s, join(s, 'user:a', { name: '阿青' }))
  apply(s, run(structuredClone(s), 'user:a', '对 Claude 说 帮我去厨房拿酒').ops)
  const r = await act.run({ chat: 'c1', command: '西' }, call)
  assert.match(r, /阿青对你说：「帮我去厨房拿酒」[\s\S]*> 西\n【厨房】/)
  assert.match(await act.run({ chat: 'c1', command: '拿 酒葫芦' }, call), /你拿起了酒葫芦/)
  const again = await act.run({ chat: 'c1', command: '背包' }, call)
  assert.doesNotMatch(again, /刚才这里/, 'what it saw is not repeated')
  assert.match(again, /酒葫芦/)
})

test('without an agent stamp the tools refuse', async () => {
  await assert.rejects(look.run({ chat: 'c1' }, {}), /for agents/)
})
