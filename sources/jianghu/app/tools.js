// 文字江湖's tools: an agent plays as a person does, by text commands. look shows where it stands, how it is and what
// was said there since it last looked; act runs one command (the same game.js the page runs) and answers what it reads.
// Who calls is `agent`, stamped by gugu — never an argument. The world is the chat's `文字江湖.jianghu.json`; the first
// call in a chat with none makes it.
//
// Waking goes one way: the page whispers an agent when a person speaks to it, names it or hands it something
// (game.js wakes). Nothing an agent does wakes anyone, so two agents never keep each other going.
import { FILE_NAME, HELP, missing, apply, join, run, lookText, linesSince, lastKey, statusText, START } from './game.js'

// One program serves every session: calls are taken one at a time, so two moves never interleave.
let lane = Promise.resolve()
const oneAtATime = (fn) => {
  const run = lane.then(fn, fn)
  lane = run.catch(() => {})
  return run
}

/** Until the server has every write of this call: what the call answers is what the others see. */
function whenSaved(f) {
  if (f.saved) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { off(); reject(new Error('the world was not saved within 10 s; check the chat is reachable and call again')) }, 10_000)
    const off = f.onStatus(() => {
      if (f.status === 'gone') { clearTimeout(timer); off(); reject(new Error('the world file is gone (deleted, or you left the chat)')) }
      else if (f.saved) { clearTimeout(timer); off(); resolve() }
    })
  })
}

/** The chat's world, made the first time; its missing parts filled in. */
async function openWorld(chat) {
  let f
  try {
    f = await gugu.files.open({ chat, name: FILE_NAME })
  } catch (e) {
    if (e.code !== 'not-found') throw e
    await gugu.files.create({ chat, name: FILE_NAME }, apply({}, missing(null)))
    f = await gugu.files.open({ chat, name: FILE_NAME })
  }
  const lacking = missing(f.data)
  if (lacking.length) f.transact(() => apply(f.data, lacking))
  return f
}

/** The agent's name in the chat, as people see it there. */
async function nameIn(chat, agent) {
  try {
    const { members } = await gugu.chats.members({ chat })
    return members.find((m) => m.id === agent)?.name ?? null
  } catch {
    return null // a name is nice to have: the world still works with 一位侠客
  }
}

/** Into the world as an agent player (or its name brought up to date), then what it has not seen yet. */
async function enter(chat, agent) {
  if (!agent) throw new Error('文字江湖 tools are for agents: gugu did not say which agent is calling')
  const f = await openWorld(chat)
  const ops = join(f.toJSON(), agent, { name: await nameIn(chat, agent), agent: true })
  if (ops.length) f.transact(() => apply(f.data, ops))
  const s = f.toJSON()
  const room = s.players[agent].room ?? START
  const unseen = linesSince(s, agent, room, s.players[agent].seen ?? '', 20)
  return { f, unseen }
}

const markSeen = (f, agent) => { f.data.players[agent].seen = lastKey(f.toJSON()) }

const CHAT = { type: 'string', format: 'gugu-chat', description: 'The chat whose 文字江湖 you play in: the chat you were called from.' }

export const look = {
  description:
    'Look around in 文字江湖, the chat\'s text MUD (ES2\'s 雪亭镇, played together by people and agents): where you ' +
    'stand, who and what is here, the exits, your 精气神, and what was said and done here since you last looked. Joins ' +
    'you the first time. Then play with act.',
  inputSchema: { type: 'object', required: ['chat'], properties: { chat: CHAT } },
  run: ({ chat }, { agent }) => oneAtATime(async () => {
    const { f, unseen } = await enter(chat, agent)
    const s = f.toJSON()
    markSeen(f, agent)
    await whenSaved(f)
    return [
      lookText(s, agent),
      statusText(s, agent),
      unseen.length ? `\n—— 刚才这里：\n${unseen.map((l) => l.text).join('\n')}` : null,
      `\n—— 指令（act 的 command）：\n${HELP}`,
    ].filter(Boolean).join('\n')
  }),
}

export const act = {
  description:
    'Do one thing in 文字江湖 by a text command, as a person types it: 东 / 西 / 南 / 北 / 上 / 下 to walk, 看, ' +
    '看 <人或东西>, 说 <话>, 对 <人> 说 <话>, 拿 / 放下 / 给, 买 / 清单, 吃 / 喝, 比武 / 杀, 组队 / 跟随, 状态, ' +
    '帮助. Answers what you read: first what others said and did here since your last call, then the result.',
  inputSchema: {
    type: 'object',
    required: ['chat', 'command'],
    properties: { chat: CHAT, command: { type: 'string', minLength: 1, maxLength: 240, description: 'One command, in Chinese as people type it.' } },
  },
  run: ({ chat, command }, { agent }) => oneAtATime(async () => {
    const { f, unseen } = await enter(chat, agent)
    const r = run(f.toJSON(), agent, command)
    f.transact(() => {
      apply(f.data, r.ops)
      markSeen(f, agent)
    })
    await whenSaved(f)
    return [
      unseen.length ? `—— 刚才这里：\n${unseen.map((l) => l.text).join('\n')}\n` : null,
      `> ${command}`,
      r.reply,
    ].filter(Boolean).join('\n')
  }),
}
