// 协作看板's tools. Every export is one tool (gugu's tools.js rule); helpers live in lib/.
//
// A board is this computer's (board.json, written only by this program: the pages send their changes here through the
// background page — snapshot, apply, page-only) or a shared file (live; `board` names the file, `chat` its default
// board). Gugu resolves a topic to its source chat, checks the caller and makes the write that agent's.
// Who calls is `agent` (user:<uuid>) and `session`,
// stamped by gugu and never an argument; a call with no agent is the person, from a page.
import path from 'node:path'
import { apply as applyToBoard, snapshot as readNow } from './lib/store.js'
import { findColumn } from './lib/core.js'
import { openChatBoard, applyToFile, whenSaved } from './lib/chat-board.js'
import { agentsBySession, cardView, listView, columnName } from './lib/agent-view.js'

const forAgents = { ui: { visibility: ['model'] } }
const forPages = { ui: { visibility: ['app'] } }

const by = (call) => call.agent ?? 'person'

function needAgent(call, what) {
  if (!call.agent) throw new Error(`${what} is for agents: gugu did not say which agent is calling`)
}

/**
 * Runs `fn` on the named board file, the chat's default, or this computer's when neither is named. A board file is
 * opened for this call only and closed when it ends — after its writes reached the server, or failed to — so a lane
 * reporting all day keeps no copies or connections open. (gugu also closes what an agent's call opened when the call
 * ends, guide apps-programs; closing here does not lean on it.)
 */
async function withBoard({ chat, board }, fn) {
  if (chat === undefined && board === undefined) return fn({ read: readNow, apply: async (op, who) => (await applyToBoard(op, who)).result })
  const f = board === undefined
    ? await openChatBoard(gugu.files, chat)
    : await gugu.files.open({ id: board, ...(chat === undefined ? {} : { chat }) })
  try {
    let wrote = false
    const answer = await fn({
      read: async () => f.toJSON(),
      apply: async (op, who) => {
        wrote = true
        return applyToFile(f, op, who)
      },
    })
    if (wrote) await whenSaved(f)
    return answer
  } finally {
    f.close()
  }
}

function columnId(board, name) {
  const column = findColumn(board, name)
  if (!column) throw new Error(`no column "${name}" on the board; there are: ${Object.values(board.columns).map(columnName).join(', ')}`)
  return column.id
}

const chatArg = {
  type: 'string',
  format: 'gugu-chat',
  description: "A shared board instead of this computer's: a group or private chat id. A topic uses its source chat's default board. With board, gugu checks that file belongs to this chat's source; a mismatch is an error.",
}
const boardArg = { type: 'string', format: 'gugu-file', description: 'A specific .board.json file id, including a renamed board. Without board, chat selects its default board; neither selects this computer. With chat, both must name the same source chat.' }
const cardArg = { type: 'string', description: "The card's id, as list gives it." }
const progressArgs = {
  progress: { type: 'integer', minimum: 0, maximum: 100, description: 'How far along, 0–100.' },
  waitingOn: { type: 'string', description: 'Who or what the card waits on now; empty string when nothing.' },
  next: { type: 'string', description: 'The next step.' },
  due: { type: 'string', description: 'When it is due, as people say it (16:30, 10-25).' },
}

export const list = {
  description:
    "A board's columns and cards: this computer's board, a chat's default with chat, or a specific file with board. Each card with its id, title, who made " +
    'it, its progress (progress, waitingOn, next, due, stale) and its tasks with their status (running, parked, approval, ' +
    'answer, done, stopped, error, gone). Use column to see one column whole when the answer says cards were left out.',
  inputSchema: { type: 'object', properties: { chat: chatArg, board: boardArg, column: { type: 'string', description: 'A column by name (待办, doing …).' } } },
  annotations: { readOnlyHint: true },
  _meta: forAgents,
  async run({ chat, board: boardFile, column }, call) {
    const [board, agents] = await Promise.all([withBoard({ chat, board: boardFile }, (b) => b.read()), agentsBySession()])
    const only = column === undefined ? null : findColumn(board, column)
    if (column !== undefined && !only) throw new Error(`no column "${column}"; list without column shows them all`)
    return listView(board, call.agent, agents, only?.id ?? null)
  },
}

export const get = {
  description: 'One card whole: its note, progress, links (tasks with status, files, PRs, messages) and comments.',
  inputSchema: { type: 'object', required: ['card'], properties: { chat: chatArg, board: boardArg, card: cardArg } },
  annotations: { readOnlyHint: true },
  _meta: forAgents,
  async run({ chat, board: boardFile, card }, call) {
    const [board, agents] = await Promise.all([withBoard({ chat, board: boardFile }, (b) => b.read()), agentsBySession()])
    const found = board.cards[String(card)]
    if (!found) throw new Error(`there is no card ${card}; list shows the cards`)
    return cardView(board, found, call.agent, agents)
  },
}

export const create = {
  description:
    'Add a card to a board. When the person asks you to note something from a chat message on their board, pass that ' +
    'message as message (its id from your delivery envelope): the card links back to it.',
  inputSchema: {
    type: 'object',
    required: ['title'],
    properties: {
      chat: chatArg,
      board: boardArg,
      title: { type: 'string' },
      note: { type: 'string', description: 'Markdown.' },
      column: { type: 'string', description: 'Default: the first column.' },
      message: { type: 'string', description: 'A chat message id (msg:<uuid> or <uuid>).' },
    },
  },
  _meta: forAgents,
  async run({ chat, board: boardFile, title, note, column, message }, call) {
    needAgent(call, 'create')
    const links = []
    if (message !== undefined) {
      const id = String(message).replace(/^msg:/, '')
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('message is a chat message id: msg:<uuid> or <uuid>')
      links.push({ kind: 'message', message: id })
    }
    return withBoard({ chat, board: boardFile }, async (board) => {
      const op = { type: 'card.create', title, note, links, ...(column === undefined ? {} : { column: columnId(await board.read(), column) }) }
      const result = await board.apply(op, by(call))
      return `added card ${result.card}`
    })
  },
}

export const claim = {
  description:
    'Take a card: your task is linked to it (people see its status and your machine on the card and open it from ' +
    'there) and the card moves to the doing column. Keep it current with update; when the work is done, move it to ' +
    'review and link what you made.',
  inputSchema: { type: 'object', required: ['card'], properties: { chat: chatArg, board: boardArg, card: cardArg } },
  _meta: forAgents,
  async run({ chat, board: boardFile, card }, call) {
    needAgent(call, 'claim')
    if (!call.session) throw new Error('gugu did not say which task you are in, so there is nothing to link')
    const doing = await withBoard({ chat, board: boardFile }, async (board) => {
      const column = findColumn(await board.read(), 'doing')
      await board.apply({ type: 'link.add', card: String(card), link: { kind: 'task', session: call.session, agent: call.agent } }, by(call))
      if (column) await board.apply({ type: 'card.move', card: String(card), column: column.id }, by(call))
      return column
    })
    return doing ? `claimed ${card}: linked to your task, moved to ${columnName(doing)}` : `claimed ${card}: linked to your task`
  },
}

export const update = {
  description:
    "Report a card's progress: how far along, who or what it waits on (empty string when nothing any more), the next " +
    'step, when it is due; and its title or note. Only what you pass changes. Every update stamps the card as updated ' +
    'now, so a lane that keeps reporting never shows as stale.',
  inputSchema: {
    type: 'object',
    required: ['card'],
    properties: { chat: chatArg, board: boardArg, card: cardArg, ...progressArgs, title: { type: 'string' }, note: { type: 'string', description: 'Markdown.' } },
  },
  _meta: forAgents,
  async run({ chat, board: boardFile, card, progress, waitingOn, next, due, title, note }, call) {
    needAgent(call, 'update')
    await withBoard({ chat, board: boardFile }, (board) => board.apply({ type: 'card.update', card: String(card), progress, waitingOn, next, due, title, note }, by(call)))
    return `updated ${card}`
  },
}

export const move = {
  description: 'Move a card to another column (by name).',
  inputSchema: { type: 'object', required: ['card', 'column'], properties: { chat: chatArg, board: boardArg, card: cardArg, column: { type: 'string' } } },
  _meta: forAgents,
  async run({ chat, board: boardFile, card, column }, call) {
    needAgent(call, 'move')
    await withBoard({ chat, board: boardFile }, async (board) => board.apply({ type: 'card.move', card: String(card), column: columnId(await board.read(), column) }, by(call)))
    return `moved ${card}`
  },
}

export const comment = {
  description: 'Add a comment to a card, as yourself.',
  inputSchema: { type: 'object', required: ['card', 'text'], properties: { chat: chatArg, board: boardArg, card: cardArg, text: { type: 'string' } } },
  _meta: forAgents,
  async run({ chat, board: boardFile, card, text }, call) {
    needAgent(call, 'comment')
    await withBoard({ chat, board: boardFile }, (board) => board.apply({ type: 'comment.add', card: String(card), text }, by(call)))
    return `commented on ${card}`
  },
}

export const link = {
  description:
    'Link something to a card: a pull request (kind pr, url; state like open / merged if you know it), a web page ' +
    '(kind url), a file in your own working copy (kind file, path — relative to it, or absolute inside it), or a ' +
    "chat's file such as your report page (kind chatfile, file — its id).",
  inputSchema: {
    type: 'object',
    required: ['card', 'kind'],
    properties: {
      chat: chatArg,
      board: boardArg,
      card: cardArg,
      kind: { type: 'string', enum: ['pr', 'url', 'file', 'chatfile'] },
      url: { type: 'string' },
      path: { type: 'string' },
      file: { type: 'string', format: 'gugu-file', description: "A chat file's id (kind chatfile)." },
      state: { type: 'string', description: 'A pull request state, as you know it.' },
      title: { type: 'string' },
    },
  },
  _meta: forAgents,
  async run({ chat, board: boardFile, card, kind, url, path: file, file: chatFile, state, title }, call) {
    needAgent(call, 'link')
    let target
    if (kind === 'file') {
      if (!call.session || !call.workspaceRoot) throw new Error('gugu did not say which working copy you are in, so a file cannot be linked')
      const rel = path.isAbsolute(String(file ?? '')) ? path.relative(call.workspaceRoot, String(file)) : String(file ?? '')
      target = { kind: 'file', session: call.session, path: rel.split(path.sep).join('/') }
    } else if (kind === 'chatfile') {
      if (!chatFile) throw new Error('a chatfile link needs file: the chat file id')
      const f = await gugu.files.open({ id: chatFile })
      const { id, chat: fileChat, path: filePath, name } = f.entry
      f.close() // only its entry was needed
      target = { kind: 'chatfile', file: id, name: filePath ?? name, ...(fileChat ? { chat: fileChat } : {}) }
    } else {
      target = { kind, url, ...(state ? { state } : {}), ...(title ? { title } : {}) }
    }
    const result = await withBoard({ chat, board: boardFile }, (board) => board.apply({ type: 'link.add', card: String(card), link: target }, by(call)))
    return result.existed ? `already linked to ${card}` : `linked to ${card}`
  },
}

export const snapshot = {
  description: "This computer's whole board (the board page's own call).",
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  _meta: forPages,
  async run() {
    return await readNow()
  },
}

export const apply = {
  description: "Apply one change to this computer's board (the board page's own call, through its background page).",
  inputSchema: { type: 'object', required: ['op'], properties: { op: { type: 'object' } } },
  _meta: forPages,
  async run({ op }, call) {
    const { rev, board, result } = await applyToBoard(op, by(call))
    return { rev, board, result }
  },
}
