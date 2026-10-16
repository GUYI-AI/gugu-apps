// An Office file (.pptx, and the other OOXML kinds) read as its package says it: the zip's directory, each part's
// elements, and the relationships between parts. Every type reads its parts with this (pptx-read.js); the page and the
// skill's scripts both import it. No node module, no DOM: plain JS. Writing a package back is node's (ooxml-zip.mjs).

/** The error an agent reads: what was wrong, and that nothing was written. `code` 'content-changed': read it again. */
export class OoxmlError extends Error {
  constructor(message, code) {
    super(message)
    if (code) this.code = code
  }
}

// ─── the zip ────────────────────────────────────────────────────────────────

/**
 * Each entry of the package, in central-directory order, with where its local record lies: `record` and `central` are
 * slices of `bytes` (a Buffer's slices are Buffers), `dataStart` and `compressedSize` say where its data is.
 */
export function readZip(bytes) {
  try {
    return readZipOrThrow(bytes)
  } catch (error) {
    // Offsets past the end (a cut-off or fuzzed package): the package is damaged, said as such.
    if (error instanceof RangeError) throw new OoxmlError(`the zip is damaged: ${error.message}`)
    throw error
  }
}

function readZipOrThrow(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const u16 = (at) => view.getUint16(at, true)
  const u32 = (at) => view.getUint32(at, true)
  const utf8 = new TextDecoder()
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (u32(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new OoxmlError('not an Office file: no zip end record')
  const count = u16(eocd + 10)
  const cdSize = u32(eocd + 12)
  const cdOffset = u32(eocd + 16)
  const zip64 = 'a zip64 package is not supported'
  if (count === 0xffff || cdOffset === 0xffffffff) throw new OoxmlError(zip64)
  if (eocd >= 20 && u32(eocd - 20) === 0x07064b50) throw new OoxmlError(zip64)
  const entries = []
  let p = cdOffset
  for (let i = 0; i < count; i++) {
    if (u32(p) !== 0x02014b50) throw new OoxmlError('the zip central directory is damaged')
    const nameLen = u16(p + 28)
    const extraLen = u16(p + 30)
    const commentLen = u16(p + 32)
    const local = u32(p + 42)
    const entry = {
      name: utf8.decode(buf.subarray(p + 46, p + 46 + nameLen)),
      flags: u16(p + 8),
      method: u16(p + 10),
      crc: u32(p + 16),
      compressedSize: u32(p + 20),
      size: u32(p + 24),
      local,
      central: buf.subarray(p, p + 46 + nameLen + extraLen + commentLen),
    }
    if ([entry.compressedSize, entry.size, local].includes(0xffffffff)) throw new OoxmlError(zip64)
    if (u32(local) !== 0x04034b50) throw new OoxmlError(`the zip entry ${entry.name} is damaged`)
    const dataStart = local + 30 + u16(local + 26) + u16(local + 28)
    let end = dataStart + entry.compressedSize
    // A data descriptor after the data (flag bit 3): 12 bytes, or 16 with its optional signature.
    if (entry.flags & 8) end += buf.length >= end + 4 && u32(end) === 0x08074b50 ? 16 : 12
    if (end > cdOffset) throw new OoxmlError(`the zip entry ${entry.name} runs past its end`)
    entry.dataStart = dataStart
    entry.record = buf.subarray(local, end)
    entries.push(entry)
    p += 46 + nameLen + extraLen + commentLen
  }
  if (p !== cdOffset + cdSize) throw new OoxmlError('the zip central directory is damaged')
  return { buf, entries, comment: buf.subarray(eocd + 22, eocd + 22 + u16(eocd + 20)) }
}

/**
 * An entry that unpacks to more than its zip says (the size a package is held to before anything is inflated, and what
 * inflating it may take): refused — damaged, or made to slip a big file past that.
 */
export const sizeLie = (name, size) => new OoxmlError(`${name} unpacks to more than the ${size} bytes its zip says: the file is damaged or forged`)

/**
 * A zip entry's name as the part's name, the one relationships use: an entry written with backslashes
 * (xl\workbook.xml, ppt\slides\slide1.xml — Excel and PowerPoint open those) answers to its forward-slash name. One
 * rule for the page (openParts) and the scripts (ooxml-zip.mjs, xlsx-ooxml.mjs); written back, an entry keeps the
 * name it had.
 */
export const partName = (entryName) => entryName.replace(/\\/g, '/')

/**
 * The parts whose names `wanted` matches, all inflated at once (openParts): resolves to a function giving a part's text
 * by its name, at once — for a reader that asks part after part (pptx-read.js).
 */
export async function partTexts(bytes, wanted) {
  const parts = openParts(bytes)
  const names = parts.names.filter((name) => wanted.test(name))
  const texts = await Promise.all(names.map((name) => parts.text(name)))
  const byName = new Map(names.map((name, i) => [name, texts[i]]))
  return (name) => byName.get(name) ?? null
}

/**
 * The package's parts, inflated only when asked and each once, by the browser's own DecompressionStream('deflate-raw')
 * (Chromium 103+; the phone's WebView is 113 — a page has no node:zlib): a workbook's big sheets only the one on screen.
 * Part names as the package's rels name them (partName).
 */
export function openParts(bytes) {
  const zip = readZip(bytes)
  const byName = new Map(zip.entries.map((e) => [partName(e.name), e]))
  const inflated = new Map()
  const bytesOf = (name) => {
    const e = byName.get(name)
    if (!e) return Promise.resolve(null)
    if (!inflated.has(name)) {
      const data = zip.buf.subarray(e.dataStart, e.dataStart + e.compressedSize)
      if (e.method === 0) inflated.set(name, Promise.resolve(data))
      else if (e.method === 8) inflated.set(name, inflateRaw(data, e.size, name))
      else return Promise.reject(new OoxmlError(`${name} uses a compression this page does not read (method ${e.method})`))
    }
    return inflated.get(name)
  }
  return {
    names: [...byName.keys()],
    bytes: bytesOf,
    text: async (name) => {
      const data = await bytesOf(name)
      return data && new TextDecoder().decode(data)
    },
  }
}

/**
 * How much deflate data DecompressionStream is given at a time. Chromium's inflates a chunk it is given whole and queues
 * all of it before a reader has the first piece: fed an entry at once, a part whose zip lies about its size took what it
 * unpacks to before the count below could stop it (a 1 GiB lie, +1.2 GB in the renderer — review of 83b1a43159). A
 * chunk inflates to 1,032 times its size at most: 16 MB, the most this takes past the limit.
 */
const INFLATE_SLICE = 16384

/** Raw deflate data inflated through DecompressionStream, fed as it is read (INFLATE_SLICE) — `limit` bytes at most. */
async function inflateRaw(data, limit, name) {
  let fed = 0
  const reader = new ReadableStream(
    {
      pull(controller) {
        if (fed >= data.length) return controller.close()
        controller.enqueue(data.subarray(fed, fed + INFLATE_SLICE))
        fed += INFLATE_SLICE
      },
    },
    { highWaterMark: 0 },
  )
    .pipeThrough(new DecompressionStream('deflate-raw'))
    .getReader()
  const chunks = []
  let size = 0
  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    chunks.push(read.value)
    size += read.value.length
    if (size > limit) {
      reader.cancel()
      throw sizeLie(name, limit)
    }
  }
  const out = new Uint8Array(size)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}

// ─── XML: elements by their place in the text ───────────────────────────────

export const localName = (qname) => qname.slice(qname.indexOf(':') + 1)

const NAME = String.raw`[^\s"'<>/=&]+`
const START_TAG = new RegExp(String.raw`^${NAME}(\s+${NAME}\s*=\s*("[^"<]*"|'[^'<]*'))*\s*$`)
const END_TAG = new RegExp(String.raw`^/${NAME}\s*$`)
// An & starts one of XML's five entities or a character reference; anything else (a bare &, &nbsp;) is not XML.
const BAD_AMP = /&(?!(?:amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);)/

/**
 * Every element of `text` in document order: its qualified name, its [start, end) in the text, its parent, its attributes.
 * `strict`: also refuses what a tag matcher lets through and an XML parser does not — an & that is no entity or
 * character reference (in text or a value), a start tag that is not names and quoted values, an attribute twice.
 */
export function scanXml(text, { strict = false } = {}) {
  const amp = (part, where) => {
    if (strict && BAD_AMP.test(part)) throw new OoxmlError(`an & that is no entity in ${where} (write &amp;): "${part.slice(0, 60)}"`)
  }
  const elements = []
  const stack = []
  let i = 0
  while (i < text.length) {
    const lt = text.indexOf('<', i)
    amp(text.slice(i, lt < 0 ? text.length : lt), 'text')
    if (lt < 0) break
    if (text.startsWith('<!--', lt)) {
      const end = text.indexOf('-->', lt + 4)
      if (end < 0) throw new OoxmlError('an unterminated comment')
      i = end + 3
      continue
    }
    if (text.startsWith('<![CDATA[', lt)) {
      const end = text.indexOf(']]>', lt + 9)
      if (end < 0) throw new OoxmlError('an unterminated CDATA section')
      i = end + 3
      continue
    }
    if (text.startsWith('<?', lt) || text.startsWith('<!', lt)) {
      const end = text.indexOf('>', lt + 2)
      if (end < 0) throw new OoxmlError('an unterminated declaration')
      i = end + 1
      continue
    }
    // A tag: find its end outside quoted attribute values.
    let j = lt + 1
    let quote = null
    for (; j < text.length; j++) {
      const c = text[j]
      if (quote) {
        if (c === quote) quote = null
      } else if (c === '"' || c === "'") quote = c
      else if (c === '>') break
    }
    if (j >= text.length) throw new OoxmlError('an unterminated tag')
    const tag = text.slice(lt + 1, j)
    if (tag.startsWith('/')) {
      if (strict && !END_TAG.test(tag)) throw new OoxmlError(`a malformed closing tag <${tag.slice(0, 60)}>`)
      const name = tag.slice(1).trim()
      const open = stack.pop()
      if (!open || open.name !== name) throw new OoxmlError(`a closing </${name}> that does not match ${open ? `<${open.name}>` : 'anything'}`)
      open.end = j + 1
      open.innerEnd = lt
    } else {
      const selfClosing = tag.endsWith('/')
      const body = selfClosing ? tag.slice(0, -1) : tag
      const name = body.match(/^[^\s/>]+/)?.[0]
      if (!name) throw new OoxmlError('a tag with no name')
      if (strict && !START_TAG.test(body)) throw new OoxmlError(`a malformed tag <${body.slice(0, 80)}>: names and quoted values only`)
      const attrs = {}
      for (const m of body.slice(name.length).matchAll(/([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
        if (strict && m[1] in attrs) throw new OoxmlError(`<${name}> gives ${m[1]} twice`)
        attrs[m[1]] = m[3] ?? m[4]
        amp(attrs[m[1]], `${name} ${m[1]}`)
      }
      const element = { name, local: localName(name), start: lt, end: selfClosing ? j + 1 : -1, innerStart: j + 1, innerEnd: selfClosing ? j + 1 : -1, parent: stack.at(-1)?.index ?? -1, index: elements.length, attrs }
      elements.push(element)
      if (!selfClosing) stack.push(element)
    }
    i = j + 1
  }
  if (stack.length) throw new OoxmlError(`<${stack.at(-1).name}> is never closed`)
  return elements
}

/** The elements inside `el`, in document order. */
export const descendants = (elements, el) => elements.filter((d) => d.start > el.start && d.end <= el.end)

/**
 * An attribute value's or a text's characters: XML's line ends (a CR LF or a lone CR written as they are is a LF, as
 * every XML reader — Excel too — reads it; &#13; stays a CR), its five entities and character references read.
 */
export const unescape = (s) =>
  s
    .replace(/\r\n?/g, '\n')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

// ─── relationships ──────────────────────────────────────────────────────────
// The one reading of a part's .rels, for every type and both sides. `text(name)` is a part's text (or null): the
// scripts read it out of the zip as they need it (ooxml-zip.mjs), the page has inflated the parts it needs before
// (partTexts); a page reading parts as it goes (a workbook's) reads the .rels itself and hands `relationships` its text.

/** A part's relationships part: ppt/slides/slide3.xml → ppt/slides/_rels/slide3.xml.rels. */
export const relsOf = (part) => part.replace(/([^/]+)$/, '_rels/$1.rels')

/**
 * The relationships a .rels text gives (null: none): [{ id, type (its last segment: worksheet, slideLayout …), external,
 * target (a part name resolved against `part`'s folder, or the external URL as written) }].
 */
export function relationships(rels, part) {
  if (!rels) return []
  return scanXml(rels)
    .filter((e) => e.local === 'Relationship')
    .map((e) => {
      const external = e.attrs.TargetMode === 'External'
      return { id: e.attrs.Id, type: (e.attrs.Type ?? '').split('/').pop(), external, target: external ? e.attrs.Target : resolveTarget(part, e.attrs.Target ?? '') }
    })
}

/** The relationship ids a part has (its .rels). */
export const relIds = (text, part) => new Set(relationships(text(relsOf(part)), part).map((r) => r.id))

/** The part `part` points to with its relationship of `type` (slideLayout, worksheet …), resolved against its folder. */
export function relatedPart(text, part, type) {
  if (!part) return null
  return relationships(text(relsOf(part)), part).find((r) => r.type === type)?.target ?? null
}

/** A relationship's Target, as a part name: absolute (leading /) or against the folder of the part that has it. */
export function resolveTarget(part, target) {
  if (target.startsWith('/')) return target.slice(1)
  const path = []
  for (const segment of [...part.split('/').slice(0, -1), ...target.split('/')]) {
    if (segment === '..') path.pop()
    else if (segment !== '.') path.push(segment)
  }
  return path.join('/')
}
