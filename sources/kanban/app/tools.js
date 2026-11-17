// 协作看板's tools. Every export is one tool (gugu's tools.js rule); helpers live in lib/.
//
// Two for agents: board (read) and set (the only write). A board is a chat's (`chat`: its file in the chat's folder,
// live) or, without chat, this computer's (board.json, written only by this program; the page sends its changes here
// through the background page, with the page-only `local`). Gugu resolves a topic to its source chat, checks the caller
// and makes the write that agent's. Who calls is `agent` (user:<uuid>), `session` and, when gugu knows it, `agentName`
// (the task's name): stamped by gugu, never an argument. A tool call cannot know which chat its caller sits in, so
// `chat` is always passed; and it cannot know the caller's machine, which the page fills in from the task list.
import { apply as applyLocal, snapshot as readLocal } from './lib/store.js'
import { readChatBoard, openChatBoard, applyToFile, whenSaved } from './lib/chat-board.js'
import { applyOp, boardText, cardText, findCard } from './lib/core.js'

const forAgents = { ui: { visibility: ['model'] } }
const forPages = { ui: { visibility: ['app'] } }

const chatArg = {
  type: 'string',
  format: 'gugu-chat',
  description: "The chat whose board this is: a group or private chat id (a topic uses its source chat's). Omit for this computer's board.",
}
const cardArg = { type: 'string', description: "The card's id as board shows it (its first characters are enough when only one card starts so)." }

const callerOf = (call) => ({ agent: call.agent, session: call.session, name: call.agentName ?? call.taskTitle })
const whoFor = (call) => (l) => (l.by === call.agent ? 'you' : l.by === 'person' ? 'the person' : l.name ?? l.by.replace(/^user:/, '').slice(0, 8))

export const board = {
  description:
    "Read a board: a chat's with chat, else this computer's. Without card: every open card in one line each, grouped as " +
    'the page shows them (waiting on the owner, in progress, waiting, unclaimed), then the last 10 log lines. With card: ' +
    'that card whole — holder, wait, next, checks, note and its full log. Read it before you start, and after a compaction.',
  inputSchema: { type: 'object', properties: { chat: chatArg, card: cardArg } },
  annotations: { readOnlyHint: true },
  _meta: forAgents,
  async run({ chat, card }, call) {
    const b = chat === undefined ? await readLocal() : await readChatBoard(gugu.files, chat)
    const opts = { caller: callerOf(call), who: whoFor(call), name: chat === undefined ? 'this computer' : 'chat board' }
    return card === undefined ? boardText(b, opts) : cardText(b, findCard(b, card), opts)
  },
}

export const set = {
  description:
    'The one way to change a board. Without card: adds a card (title required) and returns its id. With card: changes ' +
    'only what you pass. hold: true takes it for you; "session:<id>" records another session as its holder; false ' +
    'releases it. wait: what it waits on that is not the owner ("" when it no longer does). ask: { question, options } ' +
    'puts a question to the owner, answered on the board page and sent back to the holder as a message (null withdraws ' +
    'it; do not also ask in chat). check: { "<label>": true | false | null | "<note>" } ticks, adds open, removes, or ' +
    'ticks with a note — closing conditions such as "PR merged", "slot cleared". done: true is refused while a check ' +
    'is open or a question is pending; false reopens. log: one line of your own. Every change is logged with who made it. ' +
    'lead (with chat, without card or anything else): the board\'s lead, an agent of the chat as user:<uuid> (null: none) — ' +
    'told whenever a person marks a card done or reopens it.',
  inputSchema: {
    type: 'object',
    properties: {
      chat: chatArg,
      card: cardArg,
      title: { type: 'string', description: 'One line.' },
      next: { type: 'string', description: 'One line: the next step, or where to resume.' },
      note: { type: 'string', description: 'Markdown, links included; replaces the note.' },
      hold: { type: ['boolean', 'string'], description: 'true, false, or "session:<id>".' },
      wait: { type: 'string' },
      ask: {
        type: ['object', 'null'],
        properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' }, maxItems: 6 } },
      },
      check: { type: 'object', additionalProperties: { type: ['boolean', 'string', 'null'] } },
      done: { type: 'boolean' },
      log: { type: 'string', description: 'One line.' },
      lead: { type: ['string', 'null'], description: 'user:<uuid>, or null.' },
    },
  },
  _meta: forAgents,
  async run({ chat, card, ...fields }, call) {
    if (!call.agent) throw new Error('set is for agents: gugu did not say which agent is calling')
    const { lead, ...rest } = fields
    if (lead !== undefined && (chat === undefined || card !== undefined || Object.keys(rest).length)) throw new Error("lead is set on its own, on a chat's board: { chat, lead }")
    const op = lead !== undefined ? { type: 'lead', agent: lead } : card === undefined ? { type: 'create', ...fields } : { type: 'set', card, ...fields }
    const caller = callerOf(call)
    let result
    if (chat === undefined) {
      result = (await applyLocal(op, call.agent, caller)).result
    } else {
      const f = await openChatBoard(gugu.files, chat, (empty) => applyOp(empty, op, { by: call.agent, now: new Date().toISOString(), caller, name: caller.name }))
      try {
        result = applyToFile(f, op, call.agent, caller)
        await whenSaved(f)
      } finally {
        f.close()
      }
    }
    if (lead !== undefined) return lead ? `the board's lead is ${lead}` : 'the board has no lead'
    return card === undefined ? `added card ${result.card}` : `changed ${result.card}`
  },
}

export const local = {
  description: "This computer's board for its page: without op, the board; with op, one change, and the board after it.",
  inputSchema: { type: 'object', properties: { op: { type: 'object' }, name: { type: 'string' } } },
  _meta: forPages,
  async run({ op, name }, call) {
    if (call.agent) throw new Error("this computer's board is changed by agents with set")
    if (!op) return { board: await readLocal() }
    const { board: b, result } = await applyLocal(op, 'person', name ? { name } : {})
    return { board: b, result }
  },
}
