/**
 * 协作看板 — background page: the one place the pages talk to about this computer's board. A chat's board is read and
 * written by each page directly.
 *
 * A page's change comes here (sendToBackground), goes to the App's program (callProgram 'local', the board's only
 * writer), and the board that comes back goes to every page (broadcastToViews). A page never calls the program itself:
 * in a tab of a task on another computer that call would run on that computer, with its board. This page always runs
 * on this one. After an agent's tool call gugu sends `tools/called`, and the board is read again.
 */

const g = window.gugu
let board = null
let failure = null

function parse(answer) {
  const text = answer?.content?.find((part) => part.type === 'text')?.text ?? ''
  if (answer?.isError) throw new Error(text || 'the board program answered with an error')
  return JSON.parse(text)
}

const send = (message) =>
  g.broadcastToViews(message).catch((error) => g.reportError(`协作看板 could not reach its pages: ${error?.message ?? error}`))

const say = (extra = {}) => send({ type: 'state', board, failure, ...extra })

async function readBoard() {
  try {
    board = parse(await g.callProgram('local')).board
    failure = null
  } catch (error) {
    failure = error?.message ?? String(error)
    g.reportError(`协作看板 could not read the board: ${failure}`)
  }
}

g.onViewMessage(async (message) => {
  if (message?.type === 'hello') {
    await readBoard()
    return say()
  }
  if (message?.type === 'op') {
    try {
      const answer = parse(await g.callProgram('local', { op: message.op, ...(message.name ? { name: message.name } : {}) }))
      board = answer.board
      await say({ done: { id: message.id, result: answer.result } })
    } catch (error) {
      await send({ type: 'refused', id: message.id, message: error?.message ?? String(error) })
    }
  }
})

g.onProgramNotification(({ method, params }) => {
  if (method === 'tools/called' && params?.tool !== 'local') readBoard().then(() => say())
})

await readBoard()
await say()
