// Reading a chat file's bytes for the engine: a pinned version when the card names one, else the current one.
// Read-only: Data Lens never writes a chat file.

/** A chat file's handle has its bytes (`blob()`, text or binary alike); a handle without one, its text. */
function textOf(f) {
  if (typeof f.text !== 'string') throw Object.assign(new Error('the file has no content'), { code: 'unreadable' })
  return f.text
}

/** → { entry, content (ArrayBuffer or text), version (the one read) } */
export async function readFile(ref, version = null) {
  const f = await gugu.files.open(ref)
  try {
    const entry = { ...f.entry }
    if (version !== null && version !== entry.version) {
      const kept = await gugu.files.readVersion(ref, version)
      return { entry, version, content: typeof kept === 'string' ? kept : await kept.arrayBuffer() }
    }
    const content = typeof f.blob === 'function' ? await (await f.blob()).arrayBuffer() : textOf(f)
    return { entry, version: entry.version, content }
  } finally {
    f.close?.()
  }
}
