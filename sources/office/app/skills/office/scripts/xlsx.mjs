#!/usr/bin/env node
// 咕咕办公's skill, its .xlsx script (SKILL.md, xlsx.md): a workbook on this computer read by sheet and range, and cells
// written in place — only the written cells' bytes and the stored results of the formulas reading them change, every
// zip entry not changed stays byte for byte (lib/xlsx-ooxml.mjs, the same reading the App's page draws by, so a
// reference's sheet and range are this script's). Run with gugu-node, gugu's own Node.
//
//   read <book.xlsx>                            each sheet: used range, rows, columns, frozen panes, merged cells,
//                                               tables, first row; the workbook's names
//   read <book.xlsx> <range>                    its cells as a person would type them, what the sheet shows where that
//                                               differs, its merged areas, was (its fingerprint); more past 2,000 cells
//   apply <book.xlsx> <edits.json> [-o <out>]   edits [{ range, was?, cells }]: all checked, the formulas reading them
//                                               recalculated (lib/xlsx-calc.mjs, IronCalc), then written (to the book
//                                               itself unless -o) — or nothing written at all
import { main, needNode, readEdits, readInput, writeWhole } from '../lib/cli.mjs'
import { OoxmlError } from '../lib/ooxml-read.js'

needNode()
const ooxml = await import('../lib/xlsx-ooxml.mjs')

const USAGE = 'usage: xlsx.mjs read <book.xlsx> [<range>] | apply <book.xlsx> <edits.json> [-o <out.xlsx>]'

/** The workbook's bytes; a .xlsm is read, never written. */
function book(file) {
  if (file && !/\.xls[xm]$/i.test(file)) throw new OoxmlError(`${file} is not a .xlsx`)
  return readInput(file, 'the workbook', USAGE)
}

/** The recalculation, said in a sentence: how many formulas, and those left to Excel. */
function saysOf(recalc) {
  const later = 'they show as formulas until Excel or WPS opens the file'
  if (recalc.skipped) return `${recalc.skipped}: the ${recalc.cleared} formula${recalc.cleared === 1 ? '' : 's'} reading what you wrote lost their stored results — ${later}`
  const n = recalc.recalculated
  const done = `recalculated ${n} formula${n === 1 ? '' : 's'} reading what you wrote; their new results are stored`
  return recalc.uncomputed ? `${done}; ${recalc.uncomputed} could not be (notCalculated says why): ${later}` : done
}

const commands = {
  async read([file, range]) {
    const opened = await ooxml.openBook(book(file), ooxml.SIZE_LIMIT_BYTES.values)
    return range === undefined || range === '' ? { file, ...ooxml.outline(opened) } : { file, ...ooxml.readRange(opened, range) }
  },

  async apply([file, editsFile], { o }) {
    const bytes = book(file)
    const result = await ooxml.applyEdits(bytes, readEdits(editsFile, USAGE), { macro: /\.xlsm$/i.test(file) })
    const out = o ?? file
    writeWhole(out, result.bytes)
    return {
      file: out,
      changed: result.changed,
      was: result.was,
      ...(result.recalc ? { recalc: { ...result.recalc, says: saysOf(result.recalc) } } : {}),
      ...(result.notes ? { notes: result.notes } : {}),
      partsChanged: result.parts,
      partsUnchanged: result.unchangedEntries,
    }
  },
}

await main(commands, USAGE)
