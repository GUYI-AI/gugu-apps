// An Office file's package as the skill's scripts read and write it (node only: the scripts run on gugu-node).
// node:zlib inflates and deflates and gives the CRC, node:crypto the fingerprint; the zip's directory is read by
// ooxml-read.js, the same reading the page uses.
// - Every zip entry not changed is copied as it was, its local header and compressed bytes byte for byte; only a changed
//   part is compressed again, and the central directory is rebuilt with the new offsets.
import { createHash } from 'node:crypto'
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib'
import * as read from './ooxml-read.js'

const { OoxmlError } = read

/** A part's or an element's fingerprint (`was`): its XML exactly as the file has it, hashed; 8 hex digits. */
export const fingerprint = (xml) => createHash('sha256').update(xml, 'utf8').digest('hex').slice(0, 8)

/** Each entry of the package (ooxml-read.js), its slices Buffers. */
export const readZip = (bytes) => read.readZip(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength))

/**
 * One part's bytes, inflated — by its part name (ooxml-read.js partName: a backslashed entry answers too) or its entry's
 * own name (scripts/pptx.mjs check lists the entries as the zip names them).
 */
export function entryBytes(zip, name) {
  const entry = zip.entries.find((e) => e.name === name || read.partName(e.name) === name)
  return entry ? inflateEntry(zip, entry, name) : null
}

/** An entry's bytes, inflated — to no more than the size its zip says (ooxml-read.js sizeLie). */
export function inflateEntry(zip, entry, name) {
  const data = zip.buf.subarray(entry.dataStart, entry.dataStart + entry.compressedSize)
  if (entry.method === 0) return Buffer.from(data)
  if (entry.method !== 8) throw new OoxmlError(`${name} uses a compression this script does not read (method ${entry.method})`)
  try {
    return inflateRawSync(data, { maxOutputLength: Math.max(1, entry.size) })
  } catch (error) {
    if (error?.code === 'ERR_BUFFER_TOO_LARGE') throw read.sizeLie(name, entry.size)
    throw error
  }
}

export const entryText = (zip, name) => entryBytes(zip, name)?.toString('utf8') ?? null

const packages = new WeakMap()
/**
 * A read zip as its parts (one per zip, made once): `byName` part name → entry (ooxml-read.js partName: an entry written
 * xl\sheet1.xml answers to xl/sheet1.xml), `raw(name)` its bytes inflated, `text(name)` its text — each inflated once,
 * when asked; null for a part the package does not have. `textAsync` the same, as the readers both sides share take it.
 */
export function packageOf(zip) {
  if (!packages.has(zip)) {
    const byName = new Map(zip.entries.map((e) => [read.partName(e.name), e]))
    const texts = new Map()
    const raw = (name) => {
      const entry = byName.get(read.partName(name))
      return entry ? inflateEntry(zip, entry, name) : null
    }
    const text = (name) => {
      if (!texts.has(name)) texts.set(name, raw(name)?.toString('utf8') ?? null)
      return texts.get(name)
    }
    packages.set(zip, { zip, byName, raw, text, textAsync: async (name) => text(name) })
  }
  return packages.get(zip)
}

/** An Office file's bytes as its package (packageOf). */
export const openPackage = (bytes) => packageOf(readZip(bytes))

/** `text(name)` over a package, as ooxml-read.js and the types' readers take it: a part's text, inflated once. */
export const partText = (zip) => packageOf(zip).text

/**
 * Whether `text` is its part's bytes exactly, as UTF-8 — splicing the text is then splicing the bytes. Read whole again
 * only when the text has a U+FFFD (written in the part, or what a byte that is not UTF-8 became); else UTF-8 read and
 * written again is the same bytes, and their count says it.
 */
export const plainUtf8 = (pkg, name, text) =>
  text.includes('�') ? Buffer.from(text, 'utf8').equals(pkg.raw(name)) : Buffer.byteLength(text, 'utf8') === pkg.byName.get(read.partName(name)).size

/**
 * The package with `changed` (part name → new bytes) in place: every other entry copied byte for byte (local record and
 * central record), a changed one deflated again with its CRC and sizes, offsets rebuilt — under the entry's own name.
 */
export function rewriteZip(zip, changed) {
  for (const name of changed.keys()) if (!zip.entries.some((e) => read.partName(e.name) === read.partName(name))) throw new OoxmlError(`no part ${name} in this file`)
  const byPart = new Map([...changed].map(([name, data]) => [read.partName(name), data]))
  const locals = []
  const centrals = []
  let offset = 0
  for (const entry of zip.entries) {
    const next = byPart.get(read.partName(entry.name))
    let local
    let central
    if (!next) {
      local = entry.record
      central = Buffer.from(entry.central)
    } else {
      const data = deflateRawSync(next, { level: 6 })
      const name = Buffer.from(entry.name, 'utf8')
      const needs = Math.max(entry.record.readUInt16LE(4), 20) // deflate needs 2.0, a stored part may have said 1.0
      local = Buffer.alloc(30 + name.length + data.length)
      local.writeUInt32LE(0x04034b50, 0)
      local.writeUInt16LE(needs, 4)
      local.writeUInt16LE(entry.flags & ~8, 6) // no data descriptor: sizes are in the header
      local.writeUInt16LE(8, 8)
      entry.record.copy(local, 10, 10, 14) // time, date
      local.writeUInt32LE(crc32(next), 14)
      local.writeUInt32LE(data.length, 18)
      local.writeUInt32LE(next.length, 22)
      local.writeUInt16LE(name.length, 26)
      local.writeUInt16LE(0, 28)
      name.copy(local, 30)
      data.copy(local, 30 + name.length)
      central = Buffer.from(entry.central)
      central.writeUInt16LE(needs, 6)
      central.writeUInt16LE(entry.flags & ~8, 8)
      central.writeUInt16LE(8, 10)
      central.writeUInt32LE(crc32(next), 16)
      central.writeUInt32LE(data.length, 20)
      central.writeUInt32LE(next.length, 24)
    }
    central.writeUInt32LE(offset, 42)
    locals.push(local)
    centrals.push(central)
    offset += local.length
  }
  const cd = Buffer.concat(centrals)
  const end = Buffer.alloc(22 + zip.comment.length)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(zip.entries.length, 8)
  end.writeUInt16LE(zip.entries.length, 10)
  end.writeUInt32LE(cd.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(zip.comment.length, 20)
  zip.comment.copy(end, 22)
  return Buffer.concat([...locals, cd, end])
}
