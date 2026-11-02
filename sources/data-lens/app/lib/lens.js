// The page's handle on the engine in worker.js: load a file, run queries. A query that runs longer than QUERY_MS ends
// the worker (a chat member's SQL must not hang anyone's chat); the next call starts a new one and loads the file again.
const QUERY_MS = 20_000

export class Lens {
  #worker = null
  #next = 0
  #waiting = new Map()
  #loaded = null

  #start() {
    if (this.#worker) return this.#worker
    this.#worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
    this.#worker.onmessage = ({ data }) => {
      const wait = this.#waiting.get(data.id)
      if (!wait) return
      this.#waiting.delete(data.id)
      clearTimeout(wait.timer)
      if (data.ok) wait.resolve(data)
      else wait.reject(Object.assign(new Error(data.message), { code: data.code }))
    }
    this.#worker.onerror = (event) => this.#fail('failed', event.message || 'the data engine stopped')
    return this.#worker
  }

  #fail(code, message) {
    this.#worker?.terminate()
    this.#worker = null
    for (const wait of this.#waiting.values()) {
      clearTimeout(wait.timer)
      wait.reject(Object.assign(new Error(message), { code }))
    }
    this.#waiting.clear()
  }

  #ask(message, ms) {
    const worker = this.#start()
    const id = ++this.#next
    return new Promise((resolve, reject) => {
      const timer = ms ? setTimeout(() => this.#fail('timeout', `the query ran longer than ${ms / 1000} s and was stopped`), ms) : null
      this.#waiting.set(id, { resolve, reject, timer })
      worker.postMessage({ ...message, id })
    })
  }

  /** content: bytes (ArrayBuffer) or a CSV's text. → [{ name, columns, rows }] */
  async load(name, content, sheet) {
    this.#loaded = { name, content, sheet }
    const copy = typeof content === 'string' ? content : content.slice(0)
    return (await this.#ask({ op: 'load', name, content: copy, sheet })).tables
  }

  /** → { columns, rows, truncated } */
  async query(sql, limit) {
    if (!this.#worker && this.#loaded) await this.load(this.#loaded.name, this.#loaded.content, this.#loaded.sheet)
    return (await this.#ask({ op: 'query', sql, limit }, QUERY_MS)).result
  }

  close() {
    this.#fail('closed', 'closed')
  }
}
