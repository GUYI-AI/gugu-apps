// The engine off the page's thread: a big file loads, and a slow query runs, without freezing the chat. The page can
// stop a query that runs too long by ending this worker (lens.js).
import { load, query } from './engine.js'

let opened = null

self.onmessage = async ({ data: message }) => {
  const { id, op } = message
  try {
    if (op === 'load') {
      opened?.db.close()
      opened = null
      opened = await load(message.name, message.content, { sheet: message.sheet })
      self.postMessage({ id, ok: true, tables: opened.tables })
    } else if (op === 'query') {
      if (!opened) throw Object.assign(new Error('no file is open'), { code: 'not-loaded' })
      self.postMessage({ id, ok: true, result: query(opened.db, message.sql, { limit: message.limit }) })
    }
  } catch (error) {
    self.postMessage({ id, ok: false, code: error.code ?? 'failed', message: error.message ?? String(error) })
  }
}
