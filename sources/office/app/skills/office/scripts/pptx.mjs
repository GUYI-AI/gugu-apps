#!/usr/bin/env node
// 咕咕办公's skill, its .pptx script (SKILL.md, pptx.md): a deck on this computer read by slide and shape, and shapes
// changed in place — every zip entry not changed stays byte for byte (lib/pptx-ooxml.mjs, the same reading the App's
// page picks by, so a reference's slide and shape id are this script's). Run with gugu-node, gugu's own Node.
//
//   outline <deck.pptx> [<slide>]               each slide's shapes: id (k when the slide repeats it), name, kind, box in
//                                               px, first words, was (the shape's fingerprint); with a slide, whole texts
//   show <deck.pptx> <slide> <shape>[:<k>]      that shape's whole XML, its was, the relationship ids its slide has
//   apply <deck.pptx> <edits.json> [-o <out>]   edits [{ slide, shape, k?, name?, was, xml | delete: true }]: all checked,
//                                               then written (to the deck itself unless -o) — or nothing written at all
//   check <file.pptx> [--against <original>]    every XML part strictly well-formed, the slides drawn by pptx-glimpse;
//                                               with the original: which entries changed, and no new warning on the
//                                               changed slides (a deck changed some other way, python-pptx say)
import { main, needNode, readEdits, readInput, writeWhole } from '../lib/cli.mjs'
import { OoxmlError, partName, relsOf } from '../lib/ooxml-read.js'

needNode()
const ooxml = await import('../lib/pptx-ooxml.mjs')
const draw = async () => (await import('../vendor/pptx-glimpse.js')).convertPptxToSvg

const USAGE =
  'usage: pptx.mjs outline <deck.pptx> [<slide>] | show <deck.pptx> <slide> <shape>[:<k>] | apply <deck.pptx> <edits.json> [-o <out.pptx>] | check <file.pptx> [--against <original.pptx>]'

function deck(file) {
  if (file && !/\.pptx$/i.test(file)) throw new OoxmlError(`${file} is not a .pptx`)
  const bytes = readInput(file, 'the deck', USAGE)
  return { bytes, zip: ooxml.readZip(bytes) }
}

function number(value, what) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) throw new OoxmlError(`${what} is a number from 1, not "${value ?? ''}"`)
  return n
}

/** A diagnostic of pptx-glimpse's, as one line. */
const said = (d) => `${d.severity} ${d.code}${d.slideNumber ? ` (slide ${d.slideNumber})` : ''}: ${d.message}`

const commands = {
  async outline([file, slide]) {
    const { zip } = deck(file)
    const one = slide === undefined ? undefined : number(slide, 'slide')
    return { file, slides: ooxml.outline(zip, { slide: one, textLimit: one === undefined ? 120 : Infinity }) }
  },

  async show([file, slide, address]) {
    const { zip } = deck(file)
    const n = number(slide, 'slide')
    if (!address) throw new OoxmlError(USAGE)
    const [shape, k] = address.split(':')
    const { part, xml, was } = ooxml.locate(zip, { slide: n, shape, k: k === undefined ? undefined : number(k, 'k') })
    return { file, slide: n, part, shape, ...(k ? { k: Number(k) } : {}), was, xml, relationships: [...ooxml.relIds(zip, part)] }
  },

  async apply([file, editsFile], { o }) {
    const { bytes } = deck(file)
    const result = ooxml.applyEdits(bytes, readEdits(editsFile, USAGE))
    await ooxml.checkRenders(await draw(), bytes, result.bytes, { slides: result.slides, parts: result.changed.map((c) => c.part) })
    const out = o ?? file
    writeWhole(out, result.bytes)
    return { file: out, changed: result.changed, shapes: result.shapes, entriesUnchanged: result.unchangedEntries }
  },

  async check([file], { against }) {
    const after = deck(file)
    const names = after.zip.entries.map((e) => e.name)
    for (const name of names.filter((n) => /\.(xml|rels)$/i.test(n))) {
      try {
        ooxml.scanXml(ooxml.entryText(after.zip, name), { strict: true })
      } catch (error) {
        throw new OoxmlError(`${name} is not well-formed XML: ${error.message}`)
      }
    }
    const slides = ooxml.slideParts(after.zip)
    const convert = await draw()
    if (against === undefined) {
      let drawn
      try {
        drawn = await convert(after.bytes, { logLevel: 'off' })
      } catch (error) {
        throw new OoxmlError(`pptx-glimpse cannot draw it: ${error instanceof Error ? error.message : String(error)}`)
      }
      return { file, entries: names.length, slides: drawn.slides.length, warnings: drawn.diagnostics.filter((d) => d.severity !== 'info').map(said) }
    }
    const before = deck(against)
    const all = [...new Set([...before.zip.entries.map((e) => e.name), ...names])].sort()
    const changed = all.filter((n) => {
      const a = ooxml.entryBytes(before.zip, n)
      const b = ooxml.entryBytes(after.zip, n)
      return !a || !b || !a.equals(b)
    })
    // The slides by their part names: an entry written with backslashes (ppt\slides\slide1.xml) is the slide's all the same.
    const parts = changed.map(partName)
    const changedSlides = slides.flatMap((part, i) => (parts.includes(part) || parts.includes(relsOf(part)) ? [i + 1] : []))
    if (changedSlides.length) await ooxml.checkRenders(convert, before.bytes, after.bytes, { slides: changedSlides, parts })
    return { file, against, entries: all.length, changed, unchanged: all.length - changed.length, changedSlides }
  },
}

await main(commands, USAGE)
