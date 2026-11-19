// A chat file's whole content as the engine takes it, from whichever handle gugu gave: read in pieces into one buffer
// when the handle can (`size` + `read(offset, length)`), else `bytes()`, else `blob()`, else a text handle's text.
// Shared by the pages (lib/files.js) and the agent's tools (tools.js).

/** The most one `read` asks for: what gugu reads a file in (512 KiB). */
const PIECE = 512 * 1024

/** → Uint8Array, or a string for a text handle with nothing else. Throws { code: 'unreadable' }. */
export async function contentOf(f, name = 'the file') {
  if (typeof f.read === 'function' && Number.isInteger(f.size) && f.size >= 0) {
    // One buffer the size of the file, filled piece by piece: no second whole copy of a 25 MB file.
    const all = new Uint8Array(f.size)
    let at = 0
    while (at < f.size) {
      const piece = await f.read(at, Math.min(PIECE, f.size - at))
      if (!piece?.byteLength) break
      all.set(piece.byteLength > f.size - at ? piece.subarray(0, f.size - at) : piece, at)
      at += piece.byteLength
    }
    if (at !== f.size) throw Object.assign(new Error(`${name} ended at ${at} of ${f.size} bytes`), { code: 'unreadable' })
    return all
  }
  if (typeof f.bytes === 'function') return new Uint8Array(await f.bytes())
  if (typeof f.blob === 'function') return new Uint8Array(await (await f.blob()).arrayBuffer())
  if (typeof f.text === 'string') return f.text
  throw Object.assign(new Error(`${name} has no content`), { code: 'unreadable' })
}
