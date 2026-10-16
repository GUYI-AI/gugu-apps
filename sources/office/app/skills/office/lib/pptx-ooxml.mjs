// A .pptx as an agent reads and changes it (A2, the deck design note §3):
// the slides' shapes by slide and cNvPr id, and one shape's XML replaced — nothing else in the file touched.
//
// - A part: the shape's element is found by its byte range in the part's text and only that range is replaced.
// - Checked before anything is written: the new XML is one well-formed shape element (strictly: entities, start tags,
//   attributes — and the whole page after it is spliced in), keeps its cNvPr id, is in the slide's own namespaces
//   (a prefix the slide declares, none of them bound elsewhere, no default one), and refers only to relationships the
//   slide has; a shape is deleted only when nothing else on its slide refers to it (an animation's spid) and its id is
//   its own; and pptx-glimpse draws the changed slides with no warning they did not have before (checkRenders).
//   Anything else is refused, said why — the file keeps the content it has.
// - An address is the slide, the shape's cNvPr id, which of that id (k, when a slide repeats it) and, when given, its
//   name: any of them not matching is refused, never guessed.
// - A change is made to the shape as it was read: each shape read carries `was`, a fingerprint of its XML, and an edit
//   gives it back. The shape as it is now has another (someone changed it since: content-changed) — refused, to be read
//   again; other shapes changed meanwhile do not matter (edit(old, new) on a text file, per shape).
// Node only (scripts/pptx.mjs runs it on gugu-node): the package is read and written by ooxml-zip.mjs (node:zlib,
// node:crypto); the slides' shapes and where they sit by pptx-read.js — the same reading the page draws its click
// boxes from.
import { OoxmlError, localName, relIds as relIdsOf, scanXml } from './ooxml-read.js'
import { fingerprint, packageOf, partText, plainUtf8, readZip, rewriteZip } from './ooxml-zip.mjs'
import * as read from './pptx-read.js'

// The package's side as well: what the script and its tests read a deck with.
export { OoxmlError, scanXml } from './ooxml-read.js'
export { entryBytes, entryText, fingerprint, readZip, rewriteZip } from './ooxml-zip.mjs'
const { SHAPES, EMU_PER_PX } = read

// ─── the deck ───────────────────────────────────────────────────────────────

/** The slides in show order: their part names (ppt/slides/slideN.xml). */
export const slideParts = (zip) => read.slideParts(partText(zip))

/** The relationship ids a slide part has (its .rels). */
export const relIds = (zip, part) => relIdsOf(partText(zip), part)

/** Every shape of a slide's XML (pptx-read.js), each with its `was`. */
export function shapesOf(text) {
  const shapes = read.shapesOf(text)
  for (const s of shapes) s.was = fingerprint(text.slice(s.element.start, s.element.end))
  return shapes
}

/** The deck as an agent reads it: each slide's shapes (id, which of that id, name, kind, box in px, text, was). */
export function outline(zip, { slide, textLimit = 120 } = {}) {
  const text = partText(zip)
  const parts = read.slideParts(text)
  const wanted = slide === undefined ? parts.map((_, i) => i + 1) : [slide]
  const placeholders = new Map()
  const px = (v) => Math.round(v / EMU_PER_PX)
  return wanted.map((n) => {
    const part = parts[n - 1]
    if (!part) throw new OoxmlError(`no slide ${n}: the deck has ${parts.length}`)
    const xml = text(part)
    return {
      slide: n,
      part,
      shapes: read.slideShapes(text, part, placeholders).map((s) => ({
        id: s.id,
        ...(s.of > 1 ? { k: s.k, of: s.of } : {}),
        name: s.name,
        kind: s.kind,
        box: s.box && { x: px(s.box.x), y: px(s.box.y), w: px(s.box.w), h: px(s.box.h) },
        text: s.text.length > textLimit ? `${s.text.slice(0, textLimit)}…` : s.text,
        was: fingerprint(xml.slice(s.element.start, s.element.end)),
      })),
    }
  })
}

/** The one shape an address names: slide N, cNvPr id, (when the slide repeats that id) which of them, and its name if given. */
export function locate(zip, { slide, shape, k, name }) {
  const parts = slideParts(zip)
  const part = parts[slide - 1]
  if (!part) throw new OoxmlError(`no slide ${slide}: the deck has ${parts.length}`)
  const text = partText(zip)(part)
  const matches = shapesOf(text).filter((s) => s.id === String(shape))
  if (matches.length === 0) throw new OoxmlError(`slide ${slide} has no shape with id ${shape} (outline lists them)`)
  if (matches.length > 1 && k === undefined) throw new OoxmlError(`slide ${slide} has ${matches.length} shapes with id ${shape}: say which (k, 1-based, in document order)`)
  const found = matches[(k ?? 1) - 1]
  if (!found) throw new OoxmlError(`slide ${slide} has ${matches.length} shapes with id ${shape}, not a no. ${k}`)
  if (name !== undefined && found.name !== name) {
    throw new OoxmlError(`shape ${shape}${k ? ` (no. ${k})` : ''} on slide ${slide} is named "${found.name}", not "${name}": the deck changed since it was read, or the address is wrong — read it again`)
  }
  return { part, text, found, xml: text.slice(found.element.start, found.element.end), was: found.was }
}

/** Namespace prefixes a text declares (xmlns:p="…"), and the ones its element and attribute names use. */
function prefixes(elements) {
  const declared = new Set(['xml'])
  const used = new Set()
  for (const e of elements) {
    for (const key of Object.keys(e.attrs)) {
      if (key.startsWith('xmlns:')) declared.add(key.slice(6))
      else if (key.includes(':') && !key.startsWith('xmlns')) used.add(key.split(':')[0])
    }
    if (e.name.includes(':')) used.add(e.name.split(':')[0])
  }
  return { declared, used }
}

/**
 * Apply `edits` ({ slide, shape, k?, was, xml } — the shape's whole new element — or { slide, shape, k?, was, delete:
 * true }; `was` the shape's fingerprint as read): all checked first, then each changed part spliced, the package
 * rewritten. Returns the new bytes, what changed, and each edited shape's `was` now (a next edit of it needs no read).
 */
export function applyEdits(bytes, edits) {
  if (!Array.isArray(edits) || edits.length === 0) throw new OoxmlError('edits: give at least one { slide, shape, was, xml } or { slide, shape, was, delete: true }')
  const zip = readZip(bytes)
  const byPart = new Map()
  const shapes = []
  for (const [i, edit] of edits.entries()) {
    const where = `edits[${i}] (slide ${edit.slide}, shape ${edit.shape})`
    if (!Number.isInteger(edit.slide) || edit.shape === undefined) throw new OoxmlError(`${where}: slide (a number) and shape (an id) are required`)
    if (typeof edit.was !== 'string' || !edit.was) throw new OoxmlError(`${where}: was is required — the shape's fingerprint as outline / show gave it`)
    // Mistyped is not changed by someone: said as such, or the agent reads again and sends the same wrong thing.
    if (!/^[0-9a-f]{8}$/.test(edit.was)) throw new OoxmlError(`${where}: was "${edit.was}" is not a fingerprint as outline / show gives it (8 lowercase hex digits) — pass it exactly as read`)
    if (!edit.delete && typeof edit.xml !== 'string') throw new OoxmlError(`${where}: give xml (the shape's whole new element) or delete: true`)
    const { part, text, found } = locate(zip, edit)
    // A Fallback listed because its Choice gives no shape (ink: a p14:contentPart): PowerPoint shows the Choice, so a
    // change here would show in the preview and never in PowerPoint.
    if (found.alternate === 'fallback') {
      throw new OoxmlError(`${where}: PowerPoint shows another copy of this shape (ink, or another object this script cannot change — kept beside it in an mc:AlternateContent); this one is only what other readers draw, so it is neither changed nor deleted`)
    }
    // The shape as it is now, against the one the change was made to: another writer's change to it is never overwritten.
    if (found.was !== edit.was) {
      throw new OoxmlError(`${where}: content-changed — the shape was changed after you read it (was ${edit.was}, now ${found.was}): read it again (show) and make the change on what it is now`, 'content-changed')
    }
    let replacement = ''
    const address = { slide: edit.slide, shape: String(edit.shape), ...(found.of > 1 ? { k: found.k } : {}) }
    if (edit.delete) {
      // Something else on the slide may point at the shape by its id (an animation's p:spTgt, a build's p:bldP):
      // deleting it would leave that pointing at nothing, which PowerPoint "repairs" by dropping the animations.
      if (found.of > 1) throw new OoxmlError(`${where}: slide ${edit.slide} gives id ${edit.shape} to ${found.of} shapes — what refers to that id cannot be told apart, so none is deleted`)
      // One of two copies in an mc:AlternateContent: deleting one leaves the other, drawn by some reader or other.
      if (found.alternate) throw new OoxmlError(`${where}: the shape is one of two copies kept in an mc:AlternateContent — deleting one leaves the other on the slide in some readers, so it is not deleted; change it instead`)
      const elements = scanXml(text)
      const inside = (e) => e.start >= found.element.start && e.end <= found.element.end
      // A group goes with its shapes: an animation on any of them points at an id that would be gone.
      const ids = new Set(elements.filter((e) => inside(e) && e.local === 'cNvPr').map((e) => e.attrs.id))
      const refs = elements.filter((e) => !inside(e) && Object.entries(e.attrs).some(([key, value]) => localName(key) === 'spid' && ids.has(value)))
      if (refs.length) throw new OoxmlError(`${where}: ${[...new Set(refs.map((e) => e.name))].join(', ')} on this slide refer to it (an animation or build): deleting it would make PowerPoint ask to repair the file and drop the slide's animations`)
      shapes.push({ ...address, deleted: true })
    } else {
      let fragment
      try {
        fragment = scanXml(edit.xml, { strict: true })
      } catch (error) {
        throw new OoxmlError(`${where}: the new XML is not well-formed: ${error.message}`)
      }
      const roots = fragment.filter((e) => e.parent === -1)
      if (roots.length !== 1 || !SHAPES.has(roots[0].local) || edit.xml.slice(0, roots[0].start).trim() || edit.xml.slice(roots[0].end).trim()) {
        throw new OoxmlError(`${where}: the new XML must be exactly one shape element (p:sp, p:pic, p:graphicFrame, p:grpSp or p:cxnSp)`)
      }
      const nv = fragment.find((e) => e.local === 'cNvPr')
      if (nv?.attrs.id !== String(edit.shape)) throw new OoxmlError(`${where}: the new XML must keep its cNvPr id ${edit.shape} (it has ${nv?.attrs.id ?? 'none'})`)
      const slideRoot = scanXml(text).find((e) => e.parent === -1)
      const { declared } = prefixes([slideRoot])
      const root = roots[0]
      if (!root.name.includes(':') || !declared.has(root.name.split(':')[0])) {
        throw new OoxmlError(`${where}: the new XML's element must be in the slide's namespace, with its prefix (p:sp, …), not <${root.name}>`)
      }
      // Declared again to the same URI, or xmlns="" (no default namespace — PowerPoint writes it inside extLst): as it was.
      const rebound = fragment
        .flatMap((e) => Object.entries(e.attrs))
        .filter(([key, value]) => (key === 'xmlns' && value !== '') || (key.startsWith('xmlns:') && declared.has(key.slice(6)) && slideRoot.attrs[key] !== value))
        .map(([key]) => key)
      if (rebound.length) throw new OoxmlError(`${where}: the new XML rebinds ${[...new Set(rebound)].join(', ')}: keep the slide's namespaces as they are`)
      const own = prefixes(fragment)
      const missing = [...own.used].filter((p) => !declared.has(p) && !own.declared.has(p))
      if (missing.length) throw new OoxmlError(`${where}: the new XML uses namespace prefixes the slide does not declare: ${missing.join(', ')}`)
      const rels = relIds(zip, part)
      const refs = fragment.flatMap((e) => Object.entries(e.attrs).filter(([key]) => key.startsWith('r:')).map(([, v]) => v))
      const unknown = refs.filter((r) => !rels.has(r))
      if (unknown.length) throw new OoxmlError(`${where}: the new XML refers to relationships the slide does not have: ${unknown.join(', ')}`)
      replacement = edit.xml
      // The element as the slide will have it: the new XML without the blank around it.
      shapes.push({ ...address, was: fingerprint(edit.xml.slice(root.start, root.end)) })
    }
    const list = byPart.get(part) ?? { text, splices: [] }
    list.splices.push({ start: found.element.start, end: found.element.end, replacement, where })
    byPart.set(part, list)
  }
  const changed = new Map()
  const report = []
  for (const [part, { text, splices }] of byPart) {
    // Splicing the text is splicing the bytes only when the part is exactly its UTF-8 text (a BOM included).
    if (!plainUtf8(packageOf(zip), part, text)) throw new OoxmlError(`${part} is not plain UTF-8 text: this script does not rewrite it`)
    splices.sort((a, b) => b.start - a.start)
    for (let i = 1; i < splices.length; i++) {
      if (splices[i].end > splices[i - 1].start) throw new OoxmlError(`${splices[i].where} and ${splices[i - 1].where} overlap: one edit per shape`)
    }
    let next = text
    for (const s of splices) next = next.slice(0, s.start) + s.replacement + next.slice(s.end)
    scanXml(next, { strict: true }) // the page as a whole is still well-formed
    const before = Buffer.byteLength(text)
    const after = Buffer.from(next, 'utf8')
    changed.set(part, after)
    report.push({ part, shapes: splices.length, bytes: { before, after: after.length } })
  }
  const out = rewriteZip(zip, changed)
  const slides = [...new Set(edits.map((e) => e.slide))].sort((a, b) => a - b)
  return { bytes: out, slides, changed: report, shapes, unchangedEntries: zip.entries.length - changed.size }
}

/**
 * Does the changed deck still draw? `convert` is pptx-glimpse's convertPptxToSvg. The changed slides are drawn before
 * and after: a warning or error about those slides (or their parts) that was not there before, or a slide that no
 * longer draws, refuses the edit. Warnings about the deck as a whole (a font not on this computer) are not the edit's.
 */
export async function checkRenders(convert, before, after, { slides, parts }) {
  const draw = async (bytes) => convert(bytes, { slides, logLevel: 'off' })
  const mine = (d) => d.severity !== 'info' && (slides.includes(d.slideNumber) || parts.includes(d.sourcePartPath))
  const key = (d) => `${d.severity} ${d.code}${d.slideNumber ? ` (slide ${d.slideNumber})` : ''}: ${d.message}`
  let was
  try {
    was = await draw(before)
  } catch (error) {
    throw new OoxmlError(`pptx-glimpse cannot draw this deck as it is, so a change to it cannot be checked: ${error instanceof Error ? error.message : String(error)}`)
  }
  const had = new Map()
  for (const d of was.diagnostics.filter(mine)) had.set(key(d), (had.get(key(d)) ?? 0) + 1)
  let drawn
  try {
    drawn = await draw(after)
  } catch (error) {
    throw new OoxmlError(`pptx-glimpse could not draw the changed deck: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (drawn.slides.length !== slides.length) throw new OoxmlError(`pptx-glimpse drew ${drawn.slides.length} of the ${slides.length} changed slides`)
  const fresh = []
  for (const d of drawn.diagnostics.filter(mine)) {
    const left = had.get(key(d)) ?? 0
    if (left > 0) had.set(key(d), left - 1)
    else fresh.push(key(d))
  }
  if (fresh.length) throw new OoxmlError(`after this change pptx-glimpse says: ${fresh.join('; ')}`)
}
