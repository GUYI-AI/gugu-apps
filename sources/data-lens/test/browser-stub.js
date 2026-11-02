// A stand-in for gugu's page runtime, for test/browser.test.mjs: getContext from window.__setup, chat files from the
// test server's /__fixture/<name>, and a record (window.__seen) of what the page asked for.
;(() => {
  const setup = window.__setup ?? {}
  const seen = { violations: [], dispatched: [], openedWith: [], readVersion: [], evalRefused: undefined }
  window.__seen = seen
  document.addEventListener('securitypolicyviolation', (e) => {
    if (e.blockedURI !== 'eval') seen.violations.push(`${e.violatedDirective} ${e.blockedURI}`)
  })
  try {
    // eslint-disable-next-line no-eval
    ;(0, eval)('"probe"')
    seen.evalRefused = false
  } catch {
    seen.evalRefused = true
  }
  const file = (ref) => {
    const f = setup.files?.[ref.id]
    if (!f) throw Object.assign(new Error('gone'), { code: 'not-found' })
    return f
  }
  const bytes = async (name) => (await fetch(`/__fixture/${encodeURIComponent(name)}`)).arrayBuffer()
  window.gugu = {
    async getContext() {
      return { chat: { id: 'chat:1' }, locale: 'en', ...(setup.widget ? { widget: setup.widget } : {}), ...(setup.file ? { file: setup.file } : {}) }
    },
    files: {
      async open(ref) {
        const f = file(ref)
        const entry = { id: ref.id, chat: 'chat:1', name: f.name, version: f.version }
        if (f.text) return { entry, text: new TextDecoder().decode(await bytes(f.name)), close() {} }
        const content = await bytes(f.name)
        return { entry, type: 'binary', blob: async () => new Blob([content]), close() {} }
      },
      async readVersion(ref, n) {
        seen.readVersion.push(n)
        return new Blob([await bytes(file(ref).name)])
      },
      async list() {
        return Object.entries(setup.files ?? {}).map(([id, f]) => ({ id, name: f.name, version: f.version, type: 'file' }))
      },
      onChanged(place, fn) {
        seen.listeners = (seen.listeners ?? 0) + 1
        window.__change = (change) => fn(change)
        return () => {}
      },
      async openWith(entry) {
        seen.openedWith.push(entry)
      },
    },
    async dispatch(text, options) {
      seen.dispatched.push({ text, options })
    },
    reportError(text) {
      seen.reported = text
    },
  }
})()
