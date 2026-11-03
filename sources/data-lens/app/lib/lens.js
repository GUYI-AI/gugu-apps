// The page's handle on the engine in worker.js: load a file, run queries. A file's bytes go to the worker by transfer and
// the page keeps no copy. A query that runs longer than QUERY_MS ends the worker (a chat member's SQL must not hang
// anyone's chat); the next call starts a new one and loads the file again through the `reread` it was given.
const QUERY_MS = 20_000

export class Lens {
  #worker = null
  #next = 0
  #waiting = new Map()
  #source = null

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

  #ask(message, ms, transfer = []) {
    const worker = this.#start()
    const id = ++this.#next
    return new Promise((resolve, reject) => {
      const timer = ms ? setTimeout(() => this.#fail('timeout', `the query ran longer than ${ms / 1000} s and was stopped`), ms) : null
      this.#waiting.set(id, { resolve, reject, timer })
      worker.postMessage({ ...message, id }, transfer)
    })
  }

  /**
   * content: bytes (Uint8Array or ArrayBuffer, handed to the worker: the caller's array is empty afterwards) or a CSV's
   * text. reread: () => Promise<content> of the same version, for when the worker has to load it again; without one, a
   * stopped worker is not loaded again. → [{ name, columns, rows }]
   */
  async load(name, content, sheet, reread = null) {
    this.#source = reread ? { name, sheet, reread } : null
    if (typeof content === 'string') return (await this.#ask({ op: 'load', name, content, sheet })).tables
    let bytes = content instanceof Uint8Array ? content : new Uint8Array(content)
    // Only a view on the whole of its buffer is handed over as it is; a part of a larger one is copied first.
    if (bytes.byteOffset !== 0 || bytes.byteLength !== bytes.buffer.byteLength) bytes = bytes.slice()
    return (await this.#ask({ op: 'load', name, content: bytes, sheet }, 0, [bytes.buffer])).tables
  }

  /** → { columns, rows, truncated } */
  async query(sql, limit) {
    if (!this.#worker && this.#source) {
      const { name, sheet, reread } = this.#source
      await this.load(name, await reread(), sheet, reread)
    }
    return (await this.#ask({ op: 'query', sql, limit }, QUERY_MS)).result
  }

  close() {
    this.#fail('closed', 'closed')
  }
}
