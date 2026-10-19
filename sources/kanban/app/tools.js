// 看板's tools. Every export is one tool (gugu's tools.js rule); helpers live in lib/.
//
// This program is the board's only writer: the pages send their changes here through the background page (snapshot,
// apply — page-only), and agents call the rest. Who calls is `agent` (user:<uuid>) and `session`, stamped by gugu and
// never an argument; a call with no agent is the person, from a page.
import path from 'node:path'
import { apply as applyToBoard, snapshot as readNow } from './lib/store.js'
import { findColumn } from './lib/core.js'
import { agentsBySession, cardView, listView, columnName } from './lib/agent-view.js'

const forAgents = { ui: { visibility: ['model'] } }
const forPages = { ui: { visibility: ['app'] } }

const by = (call) => call.agent ?? 'person'

function needAgent(call, what) {
  if (!call.agent) throw new Error(`${what} is for agents: gugu did not say which agent is calling`)
}

async function columnId(name) {
  const board = await readNow()
  const column = findColumn(board, name)
  if (!column) throw new Error(`no column "${name}" on the board; there are: ${Object.values(board.columns).map(columnName).join(', ')}`)
  return column.id
}

const cardArg = { type: 'string', description: "The card's id, as list gives it." }

export const list = {
  description:
    "The person's board on this computer: its columns and cards, each card with its id, title, who made it, and the " +
    'tasks linked to it with their status (running, parked, approval, answer, done, stopped, error, gone). ' +
    'Use column to see one column whole when the answer says cards were left out.',
  inputSchema: { type: 'object', properties: { column: { type: 'string', description: 'A column by name (待办, doing …).' } } },
  annotations: { readOnlyHint: true },
  _meta: forAgents,
  async run({ column }, call) {
    const [board, agents] = await Promise.all([readNow(), agentsBySession()])
    const only = column === undefined ? null : findColumn(board, column)
    if (column !== undefined && !only) throw new Error(`no column "${column}"; list without column shows them all`)
    return listView(board, call.agent, agents, only?.id ?? null)
  },
}

export const get = {
  description: 'One card whole: its note, links (tasks with status, files, PRs, messages) and comments.',
  inputSchema: { type: 'object', required: ['card'], properties: { card: cardArg } },
  annotations: { readOnlyHint: true },
  _meta: forAgents,
  async run({ card }, call) {
    const [board, agents] = await Promise.all([readNow(), agentsBySession()])
    const found = board.cards[String(card)]
    if (!found) throw new Error(`there is no card ${card}; list shows the cards`)
    return cardView(board, found, call.agent, agents)
  },
}

export const create = {
  description:
    "Add a card to the person's board. When the person asks you to note something from a chat message on their board, " +
    'pass that message as message (its id from your delivery envelope): the card links back to it.',
  inputSchema: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string' },
      note: { type: 'string', description: 'Markdown.' },
      column: { type: 'string', description: 'Default: the first column.' },
      message: { type: 'string', description: 'A chat message id (msg:<uuid> or <uuid>).' },
    },
  },
  _meta: forAgents,
  async run({ title, note, column, message }, call) {
    needAgent(call, 'create')
    const links = []
    if (message !== undefined) {
      const id = String(message).replace(/^msg:/, '')
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('message is a chat message id: msg:<uuid> or <uuid>')
      links.push({ kind: 'message', message: id })
    }
    const op = { type: 'card.create', title, note, links, ...(column === undefined ? {} : { column: await columnId(column) }) }
    const { result } = await applyToBoard(op, by(call))
    return `added card ${result.card}`
  },
}

export const claim = {
  description:
    'Take a card: your task is linked to it (the person sees its status on the card and opens it from there) and ' +
    'the card moves to the doing column. When the work is done, move it to review and link what you made.',
  inputSchema: { type: 'object', required: ['card'], properties: { card: cardArg } },
  _meta: forAgents,
  async run({ card }, call) {
    needAgent(call, 'claim')
    if (!call.session) throw new Error('gugu did not say which task you are in, so there is nothing to link')
    const doing = findColumn(await readNow(), 'doing')
    await applyToBoard({ type: 'link.add', card: String(card), link: { kind: 'task', session: call.session, agent: call.agent } }, by(call))
    if (doing) await applyToBoard({ type: 'card.move', card: String(card), column: doing.id }, by(call))
    return doing ? `claimed ${card}: linked to your task, moved to ${columnName(doing)}` : `claimed ${card}: linked to your task`
  },
}

export const move = {
  description: 'Move a card to another column (by name).',
  inputSchema: { type: 'object', required: ['card', 'column'], properties: { card: cardArg, column: { type: 'string' } } },
  _meta: forAgents,
  async run({ card, column }, call) {
    needAgent(call, 'move')
    const id = await columnId(column)
    await applyToBoard({ type: 'card.move', card: String(card), column: id }, by(call))
    return `moved ${card}`
  },
}

export const comment = {
  description: 'Add a comment to a card, as yourself.',
  inputSchema: { type: 'object', required: ['card', 'text'], properties: { card: cardArg, text: { type: 'string' } } },
  _meta: forAgents,
  async run({ card, text }, call) {
    needAgent(call, 'comment')
    await applyToBoard({ type: 'comment.add', card: String(card), text }, by(call))
    return `commented on ${card}`
  },
}

export const link = {
  description:
    'Link something to a card: a pull request (kind pr, url; state like open / merged if you know it), a web page ' +
    '(kind url), or a file in your own working copy (kind file, path — relative to it, or absolute inside it).',
  inputSchema: {
    type: 'object',
    required: ['card', 'kind'],
    properties: {
      card: cardArg,
      kind: { type: 'string', enum: ['pr', 'url', 'file'] },
      url: { type: 'string' },
      path: { type: 'string' },
      state: { type: 'string', description: 'A pull request state, as you know it.' },
      title: { type: 'string' },
    },
  },
  _meta: forAgents,
  async run({ card, kind, url, path: file, state, title }, call) {
    needAgent(call, 'link')
    let target
    if (kind === 'file') {
      if (!call.session || !call.workspaceRoot) throw new Error('gugu did not say which working copy you are in, so a file cannot be linked')
      const rel = path.isAbsolute(String(file ?? '')) ? path.relative(call.workspaceRoot, String(file)) : String(file ?? '')
      target = { kind: 'file', session: call.session, path: rel.split(path.sep).join('/') }
    } else {
      target = { kind, url, ...(state ? { state } : {}), ...(title ? { title } : {}) }
    }
    const { result } = await applyToBoard({ type: 'link.add', card: String(card), link: target }, by(call))
    return result.existed ? `already linked to ${card}` : `linked to ${card}`
  },
}

export const snapshot = {
  description: "The whole board (the board page's own call).",
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  _meta: forPages,
  async run() {
    return await readNow()
  },
}

export const apply = {
  description: "Apply one change to the board (the board page's own call, through its background page).",
  inputSchema: { type: 'object', required: ['op'], properties: { op: { type: 'object' } } },
  _meta: forPages,
  async run({ op }, call) {
    const { rev, board, result } = await applyToBoard(op, by(call))
    return { rev, board, result }
  },
}
