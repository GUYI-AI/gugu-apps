// Reading a chat file's bytes for the engine: a pinned version when the card names one, else the current one.
// Read-only: Data Lens never writes a chat file.
import { contentOf } from './bytes.js'

/** → { entry, content (bytes, ArrayBuffer or text), version (the one read) } */
export async function readFile(ref, version = null) {
  const f = await gugu.files.open(ref)
  try {
    const entry = { ...f.entry }
    if (version !== null && version !== entry.version) {
      const kept = await gugu.files.readVersion(ref, version)
      return { entry, version, content: typeof kept === 'string' ? kept : await kept.arrayBuffer() }
    }
    const content = await contentOf(f, entry.name)
    performance.mark('data-lens:read')
    return { entry, version: entry.version, content }
  } finally {
    f.close?.()
  }
}
