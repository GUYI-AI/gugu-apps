// What an edit does to a workbook's formulas (apply, node only: the page never loads this file). IronCalc
// (vendor/ironcalc.js and ironcalc.wasm) calculates the workbook as it was and as the edit leaves it, in a process of
// its own (recalculate): the memory it took goes when the process ends, and one that runs too long is stopped. The
// answer: each formula cell whose result the edit changes, with that result — or as one it could not calculate.
//
// Not calculated — the stored result taken away, so the sheet shows the formula and Excel or WPS calculate it on
// opening; never a number that may be wrong:
//   · a volatile function (NOW, TODAY, RAND…), or a formula reading one;
//   · another workbook's cells; a function or name IronCalc does not have (its #NAME?, #ERROR!, #N/IMPL!);
//   · a formula IronCalc gets a different result for than the one stored, the workbook as it was: it and Excel
//     disagree on it, so its new result is not trusted either;
//   · every formula reading one of those, however far down.
// A formula with no stored result (as some programs write them) is calculated: there is nothing to disagree with.
//
// Which formulas an edit changes: those IronCalc gets a different result for after it, the edit's own formulas, and
// those it cannot calculate that read a cell the edit changed (they would not show a change in IronCalc) — found with
// an index of what each formula reads (a cell, a range, a name, a table). OFFSET and INDIRECT (in the formula, or in a
// name it uses) read cells their formula does not name: IronCalc calculates them like any other; where what they read
// decides whether a result is taken, they are taken to read every cell of the sheets they can reach. A calculation
// cannot tell it instead: a cell set to an error and the workbook calculated again shows no change through an IFERROR,
// a SUMIF the cell does not meet or an ISNUMBER — that the formula does not read it, wrongly (review 95a903edab).
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mb, openBook, tablesOf, worksheets } from './xlsx-book.mjs'
import { ERROR_CODES, colName, funcName, funcsIn, refs as refsOf, sheetOfPrefix, structColumns, tokenize } from './xlsx-formula.js'
import { addr, parseCell, quoteSheet } from './xlsx-read.js'

/** Functions whose result is not the same twice: the model holds their stored result; an edit does not reach them. */
const VOLATILE = new Set(['NOW', 'TODAY', 'RAND', 'RANDBETWEEN', 'RANDARRAY', 'CELL', 'INFO'])
/** Functions reading cells their formula does not name (OFFSET(A1,1,0), INDIRECT("B"&2)): calculated like any other. */
const FOLLOWS = new Set(['OFFSET', 'INDIRECT'])
/** IronCalc's own errors for what it does not have; a stored result the same error is a result like any other. */
const NOT_IN_IRONCALC = new Set(['#NAME?', '#ERROR!', '#N/IMPL!'])
/** Every error a result may be: Excel's, and IronCalc's own (a circular reference its #CIRC!). */
const ERRORS = new Set([...ERROR_CODES, ...NOT_IN_IRONCALC, '#CIRC!'])
/**
 * What IronCalc gets differently from Excel too often to take its word with nothing to check it against — a formula with
 * no stored result (written so by some programs, or the agent's own). By cause, not by function: the corpus (gugu-base
 * evidence/2026-10-13-xlsx-ab: 1,296 workbooks, 78,389 formulas with a stored result IronCalc can calculate) took apart
 * mismatch by mismatch, a cause at a time — the worst first, while what it takes still differs 0.5% of the time or more,
 * twice or more:
 *   · ways of writing (shapesOf): @lift, @array, @arrayconst, @approx-lookup, TEXT with a date, time or worked-out format,
 *     OFFSET with an empty height or width;
 *   · what it reads (doubtsOf): @datetext text read as a date or time, @lookup-blank a lookup of an empty cell,
 *     @hidden-rows SUBTOTAL or AGGREGATE over rows hidden in the sheet;
 *   · IronCalc's answer: @#SPILL! @#VALUE! @#NUM! @#DIV/0!, @date-early;
 *   · HOUR, MINUTE, SECOND, TEXT's time formats: IronCalc cuts a time to the second below where Excel rounds
 *     (DATE(2024,1,5)+TIME(14,40,0) is 14:39:59 to it) — a probe's, the corpus has few;
 *   · by name only where no way of writing explains it (POI's function test sheet): MODE and SUMSQ with numbers written
 *     as text ("1"), SUMX2MY2, SUMX2PY2, SUMXMY2 over ranges of other shapes.
 * The formulas with none of these (85.9%) differ 0.025% of the time; in SpreadsheetBench's real workbooks 0.002%.
 * Left out as not IronCalc's: stored results the writing program rounded or kept as text, 1E-16 apart, stale.
 * A formula with a stored result needs none of this: it is held to that result.
 */
const UNTRUSTED = new Set([
  '@array', '@lift', '@arrayconst', '@approx-lookup', '@lookup-blank', '@datetext', '@date-early', '@circ',
  '@text-format-date', '@text-format-time', '@text-format-computed', '@hidden-rows', '@offset-blank-size', '@#SPILL!',
  '@#VALUE!', '@#NUM!', '@#DIV/0!',
  'HOUR', 'MINUTE', 'SECOND', 'MODE', 'SUMSQ', 'SUMX2MY2', 'SUMX2PY2', 'SUMXMY2',
])
const UNTRUSTED_SAID = {
  '@array': 'it is an array formula',
  '@lift': 'it puts a range where one value goes',
  '@arrayconst': 'it has a {…} constant',
  '@approx-lookup': 'its lookup is not exact',
  '@lookup-blank': 'it looks up an empty cell',
  '@datetext': 'it reads text as a date or time',
  '@date-early': 'its date is before 1 March 1900',
  '@circ': 'it is a circular reference',
  '@text-format-date': 'its TEXT format is a date',
  '@text-format-time': 'its TEXT format is a time',
  '@text-format-computed': 'its TEXT format is worked out in the formula',
  '@hidden-rows': 'it leaves out hidden rows, which IronCalc is not told of',
  '@offset-blank-size': 'its OFFSET leaves the height or width empty',
}
const saidOf = (k) => UNTRUSTED_SAID[k] ?? (k.startsWith('@#') ? `IronCalc's result is ${k.slice(1)}` : `it uses ${k}`)
const FIXED = '0.000000000000000'
const FIXED_TEXT = /^-?\d+\.\d{15}$/
const SCIENTIFIC = '0.00000000000000E+00'
/**
 * A workbook whose sheets are more XML than this is not calculated (applyEdits): what an edit changes loses its stored
 * results, as when calculating runs over its time. What calculating takes grows with it — measured 10-13, the script's
 * process and the calculating one's peaks: 2.4 MB of sheets (7,274 formulas, INDIRECT and lookups) 69 + 227 MB; 15 MB
 * (100,000 running totals) 553 + 729 MB; 18.2 MB (100,001 formulas) 354 + 793 MB. At 20 MB, about a gigabyte between the
 * two for the seconds it takes.
 */
export const CALC_LIMIT_BYTES = 20e6
/**
 * How long calculating may take in one apply; past it, what the edit changes loses its stored results and the file is
 * written all the same. The script runs in the agent's own shell, and that shell is what may stop it: Claude Code's
 * Bash kills a command at 120 s (its default timeout); Codex (0.156, unified exec on by default) hands the agent the
 * running command after 10 s and leaves it running — it kills one only where managed settings turn unified exec off.
 * 40 s leaves 80 of Claude's 120 for the rest — opening, writing and reading back took 1–2 s at the calculation limit
 * (measured 10-13) — and is twice the slowest workbook measured (7,274 INDIRECT and lookup formulas: 14–19.7 s).
 */
export const CALC_TIMEOUT_MS = 40000
/** A box of at most this many cells is indexed cell by cell; a bigger one is kept whole and tested. */
const SMALL = 256
/** A big box at least this many columns wide is tested for every cell asked about, not kept under its columns. */
const WIDE = 256

const key = (s, r, c) => `${s}:${r}:${c}`

/**
 * The stored results an edit changes — what the writer (xlsx-ooxml.mjs) asks of this file, and all it asks. `book` the
 * workbook as it was (xlsx-book.mjs openBook), `after` the package's bytes as the edit leaves them, `seeds` the cells it
 * wrote ({ sheet, r, c, was: the cell as it was, or null }). Calculated in a process of its own (recalculate). Too much
 * to calculate here (more than `limitBytes` of sheet XML: the memory it takes), or over its time (`timeoutMs`): not
 * calculated — every formula reading a written cell, however far down, loses its stored result; OFFSET and INDIRECT
 * formulas too, and what reads them (what they read cannot be told without calculating). The book as it was is the
 * index's: who reads a cell is the same after (a formula the edit wrote has no stored result to lose). Resolves to
 * { cells: [{ sheet, r, c, value }] (value null: taken away), recalculated, uncomputed, ms } or { cells, skipped,
 * cleared }.
 */
export async function formulaResults(book, after, seeds, { timeoutMs = CALC_TIMEOUT_MS, limitBytes = CALC_LIMIT_BYTES } = {}) {
  const sheets = worksheets(book)
  const sheetBytes = sheets.reduce((n, info) => n + (book.pkg.byName.get(info.part)?.size ?? 0), 0)
  const answer = sheetBytes > limitBytes ? { skipped: `the workbook's sheets are ${Math.ceil(sheetBytes / 1e6)} MB of XML, more than this script calculates (${mb(limitBytes)})` } : await recalculate(after, seeds, timeoutMs)
  if (!answer.skipped) return answer
  const index = formulaIndex(book, sheets)
  const hit = index.downstream(seeds.map((x) => ({ s: index.at.get(x.sheet.toLowerCase()), r: x.r, c: x.c })), undefined, index.follows)
  const cells = [...hit].map((k) => index.cells.get(k)).flatMap((one) => [{ r: one.r, c: one.c, cached: one.cached }, ...one.members].filter((x) => x.cached !== undefined).map((x) => ({ sheet: sheets[one.s].name, r: x.r, c: x.c, value: null })))
  return { skipped: answer.skipped, cells, cleared: hit.size }
}

/**
 * Calculate in a process of its own (xlsx-calc-child.mjs, on this same node): `after` the package's bytes as the edit
 * leaves them, `seeds` the cells the edit wrote ({ sheet, r, c, was: the cell as it was, or null }). Resolves to
 * calculate()'s answer, or { skipped: why } when it ran over `timeoutMs` or failed.
 *
 * A process, not a thread: one that runs over its time is stopped (IronCalc holds its thread seconds at a time, and no
 * timer runs there meanwhile), and what it takes goes back when it ends. And `--liftoff-only`: V8's optimizing compiler
 * takes 330–400 MB compiling IronCalc's code the first time it calculates (measured 10-13: a 7,274-formula workbook
 * 537 MB with it, 185 MB without; 100,000 formulas 1,070 against 745 MB); without it, calculating is slower — 10% to
 * twice as long (3.2 s against 6.5 s) — and the memory is the user's. A flag only a new process takes; and its own
 * deadline, a second after this one. The script stops it in time; one that crashed or was killed cannot, and it ends
 * itself — at that deadline, or once the script is gone: the stdin it is given, which nothing writes to, closes then
 * (xlsx-calc-child.mjs).
 */
export function recalculate(after, seeds, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--liftoff-only', fileURLToPath(new URL('./xlsx-calc-child.mjs', import.meta.url)), String(timeoutMs + 1000)], {
      stdio: ['pipe', 'ignore', 'pipe', 'ipc'],
      serialization: 'advanced',
      windowsHide: true,
    })
    let said = ''
    child.stderr.on('data', (chunk) => (said = (said + chunk).slice(-400)))
    const done = (answer) => {
      clearTimeout(timer)
      child.removeAllListeners()
      child.kill('SIGKILL')
      resolve(answer)
    }
    const timer = setTimeout(() => done({ skipped: `calculating took over ${Math.round(timeoutMs / 1000)} s` }), timeoutMs)
    child.once('message', done)
    child.once('error', (error) => done({ skipped: `calculating failed: ${error.message}` }))
    child.once('close', (code, signal) => done({ skipped: `calculating failed: it stopped (${signal ?? `exit ${code}`})${said.trim() ? `: ${said.trim().split('\n').at(-1)}` : ''}` }))
    child.send({ after, seeds })
  })
}

/**
 * The formula cells of a workbook (an opened book: xlsx-book.mjs openBook), what each reads, and who reads a cell.
 * `sheets` the worksheets in order (their index is IronCalc's).
 */
function formulaIndex(book, sheets) {
  const at = new Map(sheets.map((info, i) => [info.name.toLowerCase(), i]))
  const cells = new Map()
  const small = new Map()
  // A box too big to index cell by cell: kept under each column it covers (sheet:column), or — wider than WIDE columns
  // — in one list tested every time. Asking who reads a cell then tests only that column's boxes: running totals
  // (SUM($B$2:B2), SUM($B$2:B3)… 100,000 of them) cost 22 s a walk when every box was tested for every cell.
  const bigAt = new Map()
  const bigWide = []
  let bigCount = 0
  const names = book.names ?? []
  const tables = sheets.flatMap((info, s) => tablesOf(book, info).map((t) => ({ ...t, s })))
  const tableNamed = (name) => tables.find((x) => x.name.toLowerCase() === name.toLowerCase())
  // The defined name a name token of a formula on sheet `s` means: written with a sheet (Sheet1!Data), that sheet's;
  // else the sheet's own, else the workbook's. A table's name alone is the table, not a defined name.
  const nameAt = (formula, t, s) => {
    const name = formula.slice(t.start + t.sheet.length, t.end).toLowerCase()
    const scopeOf = (n) => (n.scope === null || n.scope === undefined ? null : at.get(book.sheets[n.scope]?.name?.toLowerCase()) ?? -1)
    const is = (n) => n.name.toLowerCase() === name
    if (t.sheet) {
      const i = at.get(sheetOfPrefix(t.sheet).toLowerCase())
      return i === undefined ? undefined : names.find((n) => is(n) && scopeOf(n) === i)
    }
    if (tableNamed(name)) return undefined
    return names.find((n) => is(n) && scopeOf(n) === s) ?? names.find((n) => is(n) && scopeOf(n) === null)
  }
  // The definitions of the names a formula uses, and of the names those use (8 deep at most).
  const defsOf = (formula, s, depth = 0) => {
    let tokens
    try {
      tokens = tokenize(formula)
    } catch {
      return []
    }
    return tokens.filter((t) => t.type === 'name' && depth < 8).flatMap((t) => {
      const found = nameAt(formula, t, s)
      return found ? [found.ref, ...defsOf(found.ref, s, depth + 1)] : []
    })
  }
  // What a formula reads: its cells and ranges, its tables' areas, its names' (a name naming a name: 8 deep at most).
  const boxesOf = (formula, s, cellAt, depth = 0) => {
    const out = []
    let tokens
    try {
      tokens = tokenize(formula)
    } catch {
      return null
    }
    for (const ref of refsOf(formula)) {
      if (ref.table !== undefined) {
        const t = ref.table ? tables.find((x) => x.name.toLowerCase() === ref.table.toLowerCase()) : tables.find((x) => x.s === s && cellAt && cellAt.r >= x.box.r0 && cellAt.r <= x.box.r1 && cellAt.c >= x.box.c0 && cellAt.c <= x.box.c1)
        // Where it cannot be told (a column the table lacks…): the whole table.
        if (t) out.push(structBox(t, ref.spec, cellAt && { s, r: cellAt.r }).box ?? { s: t.s, ...t.box })
        continue
      }
      const sheet = ref.sheet ? at.get(ref.sheet.toLowerCase()) : s
      if (sheet !== undefined) out.push({ s: sheet, r0: ref.r0, c0: ref.c0, r1: ref.r1, c1: ref.c1 })
      else if (ref.sheet.includes(':')) {
        // A range of sheets (Sheet1:Sheet3!A1): the same cells on each sheet from the first to the last.
        const [a, b] = ref.sheet.split(':').map((n) => at.get(n.toLowerCase()))
        if (a !== undefined && b !== undefined) for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push({ s: i, r0: ref.r0, c0: ref.c0, r1: ref.r1, c1: ref.c1 })
      }
    }
    for (const t of tokens) {
      if (t.type !== 'name') continue
      // A table's name alone (SUM(Table1)) reads its data; any other name, what it names.
      const table = t.sheet ? null : tableNamed(formula.slice(t.start, t.end))
      const found = table || depth >= 8 ? null : nameAt(formula, t, s)
      if (table) out.push(structBox(table, '[]').box ?? { s: table.s, ...table.box })
      else if (found) out.push(...(boxesOf(found.ref, s, null, depth + 1) ?? []))
    }
    return out
  }
  // The sheets an OFFSET or INDIRECT formula on sheet `s` can read from (a Set of indexes), or null for any: OFFSET's
  // base reference's sheet; INDIRECT's, when its text starts with written text — "Data!A"&n on Data, "A"&n on its own;
  // INDIRECT(B1) any. A text can also be a name or a table's reference ("税率", "Table1[单价]") — the sheets of those
  // it may begin — or begin a sheet's name ("A"&"pples!B2").
  const reachOf = (f, s) => {
    let sig
    try {
      sig = tokenize(f).filter((t) => t.type !== 'ws')
    } catch {
      return null
    }
    const reach = new Set()
    const text = (t) => f.slice(t.start + 1, t.end - 1).replace(/""/g, '"')
    for (let i = 0; i < sig.length; i++) {
      if (sig[i].type !== 'func') continue
      const fn = funcName(f, sig[i])
      if (!FOLLOWS.has(fn)) continue
      const first = argsAt(sig, i, f)[0] ?? []
      if (fn === 'OFFSET') {
        if (first.length === 1 && first[0].type === 'ref') {
          const sheet = first[0].sheet ? at.get(sheetOfPrefix(first[0].sheet).toLowerCase()) : s
          if (sheet === undefined) return null
          reach.add(sheet)
        } else if (!(first[0]?.type === 'func' && funcName(f, first[0]) === 'INDIRECT')) return null // its INDIRECT: below
        continue
      }
      if (first[0]?.type !== 'str') return null
      const head = text(first[0])
      const more = first.length > 1
      const bang = head.lastIndexOf('!')
      if (bang < 0 && first.some((x) => x.type === 'str' && text(x).includes('!'))) return null
      const sheet = bang < 0 ? s : at.get(head.slice(0, bang).replace(/^'(.*)'$/, '$1').replace(/''/g, "'").toLowerCase())
      if (sheet === undefined) return null
      reach.add(sheet)
      const rest = (bang < 0 ? head : head.slice(bang + 1)).toLowerCase()
      if (bang < 0 && more) for (const [name, i] of at) if (name.startsWith(rest.replace(/^'/, ''))) reach.add(i)
      for (const t of tables) if (t.name.toLowerCase().startsWith(rest) || rest.startsWith(`${t.name.toLowerCase()}[`)) reach.add(t.s)
      for (const n of names) {
        if (!n.name.toLowerCase().replace(/^_xlnm\./, '').startsWith(rest)) continue
        // A name worked out by OFFSET or INDIRECT itself: anywhere.
        const boxes = /\b(OFFSET|INDIRECT)\s*\(/i.test(n.ref) ? null : boxesOf(n.ref, s, null, 1)
        if (!boxes) return null
        for (const box of boxes) reach.add(box.s)
      }
    }
    return reach
  }
  // A formula's reach (reachOf) with the names it uses: a name worked out by OFFSET (a range growing with its data,
  // OFFSET(Data!$A$1,0,0,COUNTA(Data!$A:$A),1)) reads as its OFFSET does.
  const reachWith = (f, defs, s) => {
    const reach = new Set()
    for (const one of [f, ...defs]) {
      const r = reachOf(one, s)
      if (r === null) return null
      for (const x of r) reach.add(x)
    }
    return reach
  }
  sheets.forEach((info, s) => {
    const sheet = book.sheet(info)
    for (const r of sheet.rowNums) {
      for (const [c, cell] of sheet.row(r)) {
        if (cell.f === undefined || cell.fType === 'dataTable') continue
        let external = false
        let spans = null
        // The names it uses: what their definitions call (OFFSET, NOW…) is the formula's own.
        const defs = defsOf(cell.f, s)
        const funcs = [cell.f, ...defs].flatMap(funcsIn)
        try {
          const tokens = tokenize(cell.f)
          external = tokens.some((t) => t.type === 'ref' && /\[/.test(t.sheet ?? ''))
          // A range of sheets (Sheet1:Sheet3!A1), which IronCalc does not calculate (COUNT of one: 0 for 3): never taken
          // from it — its prefix, to say so.
          const range = tokens.find((t) => t.type === 'ref' && !/\[/.test(t.sheet ?? '') && sheetOfPrefix(t.sheet ?? '').includes(':'))
          if (range) spans = `${sheetOfPrefix(range.sheet)}!`
        } catch {}
        const reads = boxesOf(cell.f, s, { r, c })
        const array = cell.fType === 'array' && cell.fRef ? cell.fRef.split(':') : null
        const k = key(s, r, c)
        const follows = funcs.find((x) => FOLLOWS.has(x)) ?? null
        const one = { k, s, r, c, f: cell.f, cached: cell.v, volatile: funcs.find((x) => VOLATILE.has(x)) ?? null, follows, reach: follows ? reachWith(cell.f, defs, s) : undefined, spans, external, unreadable: reads === null, reads: reads ?? [], array: null, members: [] }
        if (array) {
          const [a, b] = array.map(parseCell)
          if (a) {
            const box = { r0: a.r, c0: a.c, r1: (b ?? a).r, c1: (b ?? a).c }
            one.array = box
            for (let rr = box.r0; rr <= box.r1; rr++) for (let cc = box.c0; cc <= box.c1; cc++) if (rr !== r || cc !== c) one.members.push({ r: rr, c: cc, cached: sheet.row(rr).get(cc)?.v })
          }
        }
        cells.set(k, one)
        for (const box of one.reads) {
          const n = (box.r1 - box.r0 + 1) * (box.c1 - box.c0 + 1)
          if (n > SMALL) {
            bigCount++
            if (box.c1 - box.c0 >= WIDE) bigWide.push({ box, k })
            else
              for (let cc = box.c0; cc <= box.c1; cc++) {
                const col = `${box.s}:${cc}`
                if (!bigAt.has(col)) bigAt.set(col, [])
                bigAt.get(col).push({ box, k })
              }
          } else for (let rr = box.r0; rr <= box.r1; rr++) for (let cc = box.c0; cc <= box.c1; cc++) {
            const at2 = key(box.s, rr, cc)
            if (!small.has(at2)) small.set(at2, [])
            small.get(at2).push(k)
          }
        }
      }
    }
  })
  /** The formulas with OFFSET or INDIRECT (or a name of theirs): what they read is not in the index — only its sheets (reach). */
  const follows = [...cells.values()].filter((one) => one.follows).map((one) => one.k)
  const reached = follows.some((k) => cells.get(k).reach === null) ? null : new Set(follows.flatMap((k) => [...cells.get(k).reach]))
  /**
   * Whether some formula reads cell (s, r, c) — any cell, when there are too many big ranges to test each, or OFFSET or
   * INDIRECT may read from its sheet.
   */
  const isRead = (s, r, c) =>
    reached === null || reached.has(s) || small.has(key(s, r, c)) || bigCount > 64 || bigReaders(s, r, c).length > 0
  const inside = (box, s, r, c) => box.s === s && r >= box.r0 && r <= box.r1 && c >= box.c0 && c <= box.c1
  const bigReaders = (s, r, c) => [...(bigAt.get(`${s}:${c}`) ?? []), ...bigWide].filter(({ box }) => inside(box, s, r, c)).map((x) => x.k)
  /** The formula cells reading cell (s, r, c). */
  const readersOf = (s, r, c) => [...(small.get(key(s, r, c)) ?? []), ...bigReaders(s, r, c)]
  /**
   * Every formula cell reading, however far down, one of `starts` ([{ s, r, c }]); `stop(k)` true: not gone past. `wide`:
   * OFFSET or INDIRECT formulas taken to read every cell of the sheets they reach — those reaching a sheet all read the
   * first cell found on it.
   */
  const downstream = (starts, stop = () => false, wide = []) => {
    const seen = new Set()
    const queue = [...starts]
    const visit = (k) => {
      if (seen.has(k)) return
      seen.add(k)
      if (stop(k)) return
      const one = cells.get(k)
      queue.push({ s: one.s, r: one.r, c: one.c }, ...one.members.map((m) => ({ s: one.s, r: m.r, c: m.c })))
    }
    const wideOn = new Map()
    for (const k of wide) {
      for (const s of cells.get(k).reach ?? [null]) {
        if (!wideOn.has(s)) wideOn.set(s, [])
        wideOn.get(s).push(k)
      }
    }
    const sheetsFound = new Set()
    while (queue.length) {
      const { s, r, c } = queue.pop()
      readersOf(s, r, c).forEach(visit)
      if (sheetsFound.has(s)) continue
      sheetsFound.add(s)
      ;(wideOn.get(s) ?? []).forEach(visit)
      if (sheetsFound.size === 1) (wideOn.get(null) ?? []).forEach(visit)
    }
    return seen
  }
  return { at, cells, tables, follows, isRead, readersOf, downstream }
}

/**
 * What a table reference reads of table `t` ({ s, box, header, totals, columns }) — `spec` its brackets: [Col], [@Col],
 * [[#Headers],[Col]], [[Col1]:[Col3]], [#All] / [#Data] / [#Headers] / [#Totals], [] the data rows of every column; `at`
 * the formula's cell ({ s, r }), for @ and #This Row. { box: { s, r0, c0, r1, c1 } }, or { why } where it reads no range
 * of cells (Excel's #REF! or #VALUE!).
 */
function structBox(t, spec, at = null) {
  const inner = (spec ?? '[]').slice(1, -1)
  const items = []
  let thisRow = false
  if (!inner.includes('[')) {
    let text = inner.trim()
    if (text.startsWith('@')) {
      thisRow = true
      text = text.slice(1)
    }
    if (text) items.push(text.replace(/'(.)/g, '$1'))
  } else
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === '@') thisRow = true
      if (inner[i] !== '[') continue
      let text = ''
      let j = i + 1
      for (; j < inner.length && inner[j] !== ']'; j++) text += inner[j] === "'" ? inner[++j] : inner[j]
      items.push(text)
      i = j
    }
  const parts = new Set()
  const cols = []
  for (const text of items) {
    if (text.startsWith('#')) {
      parts.add(text.toLowerCase().replace(/\s+/g, ' '))
      continue
    }
    const i = t.columns.findIndex((x) => x.name.trim().toLowerCase() === text.trim().toLowerCase())
    if (i < 0) return { why: `table ${t.name} has no column ${text}` }
    cols.push(i)
  }
  if (parts.delete('#this row')) thisRow = true
  const dataR0 = t.box.r0 + t.header
  const dataR1 = t.box.r1 - (t.totals ?? 0)
  let r0
  let r1
  if (thisRow) {
    if (!at || at.s !== t.s || at.r < dataR0 || at.r > dataR1) return { why: `it reads a row of table ${t.name} (@) from outside its rows` }
    r0 = r1 = at.r
  } else {
    const rows = { '#all': [t.box.r0, t.box.r1], '#data': [dataR0, dataR1], '#headers': [t.box.r0, dataR0 - 1], '#totals': [dataR1 + 1, t.box.r1] }
    for (const part of parts.size ? parts : ['#data']) {
      const [a, b] = rows[part] ?? []
      if (a === undefined) return { why: `${part} is not a part of a table` }
      if (b < a) return { why: `table ${t.name} has no ${part.slice(1)} rows` }
      r0 = Math.min(r0 ?? a, a)
      r1 = Math.max(r1 ?? b, b)
    }
  }
  return { box: { s: t.s, r0, r1, c0: cols.length ? t.box.c0 + Math.min(...cols) : t.box.c0, c1: cols.length ? t.box.c0 + Math.max(...cols) : t.box.c1 } }
}

/**
 * Where a function takes a range as it is — its argument positions (from 0): '*' all, 'n+' from n on, 'even' / 'odd' and
 * a list. Anywhere else (another function's argument, an operator's side, the formula itself) a range of several cells
 * stands where one value goes: Excel takes each of its cells in turn (an array formula, SUMPRODUCT's arguments, dynamic
 * arrays) or the one in the formula's row (older files); IronCalc does neither as Excel does.
 */
const TAKES_RANGE = new Map([
  ...'SUM SUMSQ PRODUCT AVERAGE AVERAGEA MIN MINA MAX MAXA COUNT COUNTA COUNTBLANK MEDIAN MODE MODE.SNGL MODE.MULT STDEV STDEV.S STDEV.P STDEVA STDEVP STDEVPA VAR VAR.S VAR.P VARA VARP VARPA AVEDEV DEVSQ GEOMEAN HARMEAN KURT SKEW AND OR XOR CONCAT SUMPRODUCT SUMX2MY2 SUMX2PY2 SUMXMY2 MMULT MDETERM MINVERSE TRANSPOSE ROWS COLUMNS AREAS FREQUENCY CORREL COVAR COVARIANCE.P COVARIANCE.S PEARSON RSQ SLOPE INTERCEPT STEYX TREND GROWTH LINEST LOGEST UNIQUE SORT SORTBY FILTER HSTACK VSTACK TOCOL TOROW TAKE DROP CHOOSECOLS CHOOSEROWS WRAPROWS WRAPCOLS EXPAND ISREF'
    .split(' ').map((f) => [f, '*']),
  ['INDEX', '0'], ['MATCH', '1'], ['XMATCH', '1'], ['VLOOKUP', '1'], ['HLOOKUP', '1'], ['LOOKUP', '1,2'], ['XLOOKUP', '1,2'],
  ['COUNTIF', '0'], ['SUMIF', '0,2'], ['AVERAGEIF', '0,2'], ['COUNTIFS', 'even'], ['SUMIFS', '0,odd'], ['AVERAGEIFS', '0,odd'],
  ['MAXIFS', '0,odd'], ['MINIFS', '0,odd'], ['LARGE', '0'], ['SMALL', '0'], ['PERCENTILE', '0'], ['PERCENTILE.INC', '0'],
  ['PERCENTILE.EXC', '0'], ['QUARTILE', '0'], ['QUARTILE.INC', '0'], ['QUARTILE.EXC', '0'], ['RANK', '1'], ['RANK.EQ', '1'],
  ['RANK.AVG', '1'], ['PERCENTRANK', '0'], ['TEXTJOIN', '2+'], ['SUBTOTAL', '1+'], ['AGGREGATE', '2+'], ['OFFSET', '0'],
  ['NPV', '1+'], ['IRR', '0'], ['MIRR', '0'], ['XNPV', '1,2'], ['XIRR', '0,1'], ['NETWORKDAYS', '2'], ['WORKDAY', '2'],
  ['NETWORKDAYS.INTL', '3'], ['WORKDAY.INTL', '3'], ['FORECAST', '1,2'], ['FORECAST.LINEAR', '1,2'],
  ...'DAVERAGE DCOUNT DCOUNTA DGET DMAX DMIN DPRODUCT DSTDEV DSTDEVP DSUM DVAR DVARP'.split(' ').map((f) => [f, '0,2']),
])
const takesRange = (fn, i) => {
  const at = TAKES_RANGE.get(fn)
  if (!at) return false
  return at === '*' || at.split(',').some((p) => (p === 'even' ? i % 2 === 0 : p === 'odd' ? i % 2 === 1 : p.endsWith('+') ? i >= Number(p.slice(0, -1)) : i === Number(p)))
}

/** A table reference that reads one cell: a row's (@, #This Row), or one column's header or totals. */
const oneCell = (spec) =>
  /@|#this row/i.test(spec) || (/#(totals|headers)/i.test(spec) && !/#(data|all)/i.test(spec) && structColumns(spec).length === 1 && !/\]\s*:\s*\[/.test(spec))

/**
 * The ways of writing in a formula that IronCalc and Excel may calculate differently: @lift a range of several cells
 * where one value goes (TAKES_RANGE), @arrayconst a {…} constant, @rangeop a range made with : from a function's answer
 * (A1:INDEX(…)), @wholecol a whole column or row, @name a defined name, @struct a table reference, @numtext a number
 * written as text ("-100"), @datetext a date or time written as text ("2024-01-15"), @approx-lookup a lookup that is not
 * exact (LOOKUP, MATCH without 0, VLOOKUP without FALSE: on data not in order, Excel's answer is where its binary search
 * lands), @text-format-<kind> TEXT's format (formatKind; 'computed' when it is not written in the formula).
 */
function shapesOf(formula, tokens = tokenize(formula)) {
  const shapes = new Set()
  const f = formula
  const sig = tokens.filter((t) => t.type !== 'ws')
  const textOf = (arg) => (arg ? f.slice(arg[0]?.start ?? 0, arg.at(-1)?.end ?? 0).trim().toUpperCase() : null)
  const frames = []
  sig.forEach((t, i) => {
    if (t.type === 'open') frames.push({ fn: sig[i - 1]?.type === 'func' ? funcName(f, sig[i - 1]) : null, arg: 0 })
    else if (t.type === 'brace') {
      if (f[t.start] === '{') {
        shapes.add('@arrayconst')
        frames.push({ brace: true })
      } else frames.pop()
    } else if (t.type === 'close') frames.pop()
    else if (t.type === 'sep' && frames.length && !frames.at(-1).brace) frames.at(-1).arg++
    else if (t.type === 'op' && f[t.start] === ':' && t.end === t.start + 1) shapes.add('@rangeop')
    else if (t.type === 'str') {
      const top = frames.at(-1)
      const text = f.slice(t.start + 1, t.end - 1).replace(/""/g, '"')
      if (!(top?.fn === 'TEXT' && top.arg === 1) && NUMBER_TEXT.test(text)) shapes.add('@numtext')
      else if (!(top?.fn === 'TEXT' && top.arg === 1) && looksLikeDate(text)) shapes.add('@datetext')
    } else if (t.type === 'func') {
      const args = argsAt(sig, i, f)
      const fn = funcName(f, t)
      const exact = (x) => x === '' || x === '0' || x === 'FALSE'
      if (fn === 'TEXT') shapes.add(`@text-format-${args[1]?.length === 1 && args[1][0].type === 'str' ? formatKind(f.slice(args[1][0].start + 1, args[1][0].end - 1).replace(/""/g, '"')) : 'computed'}`)
      // DATE(1900, 1, 61): a year written 1900 or before — Excel counts its 29 February 1900, and adds 1900 to one under it.
      else if (fn === 'DATE' && args[0]?.length === 1 && args[0][0].type === 'num' && Number(f.slice(args[0][0].start, args[0][0].end)) <= 1900) shapes.add('@date-early')
      // OFFSET(A1,0,0,,3): an empty height or width is the base's in Excel; IronCalc takes it as 0 (#REF!, or a count of 0).
      else if (fn === 'OFFSET' && args.slice(3, 5).some((x) => x.length === 0)) shapes.add('@offset-blank-size')
      else if (
        fn === 'LOOKUP' ||
        (fn === 'MATCH' && !(args.length > 2 && exact(textOf(args[2])))) ||
        ((fn === 'VLOOKUP' || fn === 'HLOOKUP') && !(args.length > 3 && exact(textOf(args[3])))) ||
        (fn === 'XLOOKUP' && ((args.length > 4 && !['', '0'].includes(textOf(args[4]))) || (args.length > 5 && ['2', '-2'].includes(textOf(args[5]))))) ||
        (fn === 'XMATCH' && ((args.length > 2 && !['', '0'].includes(textOf(args[2]))) || (args.length > 3 && ['2', '-2'].includes(textOf(args[3])))))
      )
        shapes.add('@approx-lookup')
    }
    const several = (t.type === 'ref' && (t.kind === 'cols' || t.kind === 'rows' || (t.kind === 'range' && (t.a.r !== t.b.r || t.a.c !== t.b.c)))) || (t.type === 'struct' && !oneCell(t.spec))
    if (t.type === 'ref' && (t.kind === 'cols' || t.kind === 'rows')) shapes.add('@wholecol')
    if (t.type === 'name' && !/^(TRUE|FALSE)$/i.test(f.slice(t.start, t.end))) shapes.add('@name')
    if (t.type === 'struct') shapes.add('@struct')
    if (!several) return
    const before = sig[i - 1]
    const after = sig[i + 1]
    const top = frames.at(-1)
    const alone = (before?.type === 'open' || before?.type === 'sep') && (after?.type === 'close' || after?.type === 'sep')
    if (!(alone && top && !top.brace && top.fn && takesRange(top.fn, top.arg))) shapes.add('@lift')
  })
  return [...shapes]
}

/** Where the call whose name is sig[at] ends: the index of its closing parenthesis in sig (or sig's length). */
function argsEnd(sig, at, f) {
  let depth = 0
  for (let j = at + 1; j < sig.length; j++) {
    const x = sig[j]
    if (x.type === 'open' || (x.type === 'brace' && f[x.start] === '{')) depth++
    else if ((x.type === 'close' || (x.type === 'brace' && f[x.start] === '}')) && --depth === 0) return j
  }
  return sig.length
}

/** The arguments of the call whose name is sig[at] (its tokens, ws left out): an array of token arrays. */
function argsAt(sig, at, f) {
  const args = [[]]
  let depth = 0
  for (let j = at + 1; j < sig.length; j++) {
    const x = sig[j]
    const opens = x.type === 'open' || (x.type === 'brace' && f[x.start] === '{')
    const closes = x.type === 'close' || (x.type === 'brace' && f[x.start] === '}')
    if (closes && --depth === 0) break
    if (x.type === 'sep' && depth === 1) args.push([])
    else if (depth >= 1) args.at(-1).push(x)
    if (opens) depth++
  }
  return args.length === 1 && !args[0].length ? [] : args
}

const NUMBER_TEXT = /^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?%?\s*$/i
const DATE_TEXT = /^\s*(\d{1,4}[/\-.]\d{1,2}([/\-.]\d{1,4})?|\d{1,2}:\d{2}|\d{1,2}\s*[ap]\.?m\b)|\d\s*[-\s]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?[\s-]*\d|\d+\s*年\s*\d+\s*月|\d+\s*月\s*\d+\s*日/i
/** Text Excel reads as a date or a time where a number is wanted ("11:00 PM", "2024-01-15", "1Jan2024", "3月5日"). */
const looksLikeDate = (text) => !NUMBER_TEXT.test(text) && DATE_TEXT.test(text)
/** A TEXT format: 'time' (hours, minutes, seconds), 'date' (days, months, years), 'number' (0 # ? , . % E), 'other'. */
function formatKind(format) {
  const bare = format.replace(/"[^"]*"|\.|\[[^\]]*\]/g, '')
  if (/[hs]|am\/pm|a\/p/i.test(bare)) return 'time'
  if (/[dmy]/i.test(bare)) return 'date'
  if (/^[#0?,.%Ee+\-\s;()$€¥£]*$/.test(bare) && /[#0?]/.test(bare)) return 'number'
  return 'other'
}
const DATE_FUNCTIONS = new Set(['DATE', 'EDATE', 'EOMONTH', 'WORKDAY', 'WORKDAY.INTL', 'DATEVALUE'])

/**
 * What a formula that IronCalc calculated has in it, for UNTRUSTED: its functions; its ways of writing (shapesOf, and
 * @array, @circ); its result when IronCalc's is an error (@#VALUE! …); @date-early for a date before 1 March 1900
 * (Excel counts a 29 February 1900 that never was, IronCalc does not). With `read` (readerOf) also what it reads:
 * @datetext a cell holding text Excel reads as a date or time; @lookup-blank a lookup of an empty cell; @hidden-rows
 * SUBTOTAL or AGGREGATE over rows hidden in the sheet.
 */
function doubtsOf(one, results, read) {
  const tokens = tokenize(one.f)
  const fns = tokens.filter((t) => t.type === 'func').map((t) => funcName(one.f, t))
  const keys = new Set([...fns, ...shapesOf(one.f, tokens)])
  if (one.array) keys.add('@array')
  if (results.some((x) => x.t === 'e' && x.v === '#CIRC!')) keys.add('@circ')
  if (results[0]?.t === 'e') keys.add(`@${results[0].v}`)
  // A date before 1 March 1900 as the result of a formula that is one date's call (DATE(…), EDATE(…)…) — not a count of
  // days worked out from dates; or a year IronCalc puts before 1900.
  const v = results[0]?.t === 'n' ? results[0].v : null
  const sig = tokens.filter((t) => t.type !== 'ws')
  const oneDate = sig[0]?.type === 'func' && DATE_FUNCTIONS.has(fns[0]) && argsEnd(sig, 0, one.f) === sig.length - 1
  if (v !== null && ((oneDate && v >= 0 && v < 61) || (fns.includes('YEAR') && v < 1900))) keys.add('@date-early')
  if (!read) return [...keys]
  if (!keys.has('@datetext') && one.reads.some((box) => read.dateText(box))) keys.add('@datetext')
  // SUBTOTAL / AGGREGATE leave out rows hidden (or filtered out) in the sheet; IronCalc is not told which those are.
  if ((fns.includes('SUBTOTAL') || fns.includes('AGGREGATE')) && one.reads.some((box) => read.hidden(box))) keys.add('@hidden-rows')
  // A lookup of an empty cell: Excel finds nothing (#N/A), IronCalc the table's first empty row.
  sig.forEach((t, i) => {
    if (t.type !== 'func' || !LOOKUPS.has(funcName(one.f, t))) return
    const value = argsAt(sig, i, one.f)[0]
    if (value?.length === 1 && value[0].type === 'ref' && value[0].kind === 'cell' && read.empty(value[0].sheet, one.s, value[0].a.r, value[0].a.c)) keys.add('@lookup-blank')
  })
  return [...keys]
}
const LOOKUPS = new Set(['VLOOKUP', 'HLOOKUP', 'LOOKUP', 'MATCH', 'XLOOKUP', 'XMATCH'])

/**
 * For doubtsOf, an opened book's cells (`sheets` its worksheets in order): dateText(box) whether a cell of the box holds
 * text Excel reads as a date or time;
 * empty(prefix, s, r, c) whether the cell a reference names (its sheet prefix as written, or s's) holds nothing;
 * hidden(box) whether a row of the box is hidden.
 */
function readerOf(book, sheets) {
  const at = new Map(sheets.map((info, i) => [info.name.toLowerCase(), i]))
  const empty = (prefix, s, r, c) => {
    const i = prefix ? at.get(sheetOfPrefix(prefix).toLowerCase()) : s
    if (i === undefined) return false
    const cell = book.sheet(sheets[i]).row(r).get(c)
    return !cell || (cell.v === undefined && cell.f === undefined)
  }
  // A sheet's cells holding text Excel reads as a date or time: column → their rows in order, found once when asked (a
  // box is then a search per such column, not a walk of the sheet's rows: 100,000 running totals took 21 s that way).
  const dates = new Map()
  const datesOf = (s) => {
    if (!dates.has(s)) {
      const byColumn = new Map()
      const sheet = book.sheet(sheets[s])
      for (const r of sheet.rowNums)
        for (const [c, cell] of sheet.row(r)) {
          if (typeof cell.v !== 'string' || !looksLikeDate(cell.v)) continue
          if (!byColumn.has(c)) byColumn.set(c, [])
          byColumn.get(c).push(r)
        }
      dates.set(s, byColumn)
    }
    return dates.get(s)
  }
  const dateText = (box) => {
    for (const [c, rows] of datesOf(box.s)) {
      if (c < box.c0 || c > box.c1) continue
      let lo = 0
      let hi = rows.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (rows[mid] < box.r0) lo = mid + 1
        else hi = mid
      }
      if (lo < rows.length && rows[lo] <= box.r1) return true
    }
    return false
  }
  const hidden = (box) => [...book.sheet(sheets[box.s]).heights].some(([r, h]) => h === 0 && r >= box.r0 && r <= box.r1)
  return { dateText, empty, hidden }
}

/** What in a formula (with its results) IronCalc is not taken at its word on: UNTRUSTED's first, said, or null. */
function untrustedIn(one, results, read) {
  let keys
  try {
    keys = doubtsOf(one, results, read)
  } catch {
    return 'a formula this script cannot read'
  }
  // A cause before what it shows as (IronCalc's #VALUE! after reading a date written as text: the text is said).
  const hit = keys.find((k) => UNTRUSTED.has(k) && !k.startsWith('@#')) ?? keys.find((k) => UNTRUSTED.has(k))
  return hit === undefined ? null : saidOf(hit)
}

/** The first volatile function a formula calls, or null. */
const volatileOf = (formula) => (formula ? (funcsIn(formula).find((x) => VOLATILE.has(x)) ?? null) : null)

/**
 * A stored result and a calculated one ({ t, v }) the same. Numbers: to 12 significant digits; apart by less than 1e-15
 * (Excel's SIN(PI()) is 1.2E-16, IronCalc's 0); or the stored one, a number with a fraction, is ours rounded to the 8 to
 * 14 digits the program that wrote it kept (27.83458333) — a whole number is not rounded by one (10000000 is not
 * 10000000.49). An error some programs store as its text ("#DIV/0!") is that error.
 */
export function same(x, cached) {
  if (cached === undefined) return false
  if (x.t === 'n') return typeof cached === 'number' && closeTo(x.v, cached)
  if (x.t === 'e') return (typeof cached === 'object' && cached?.error === x.v) || cached === x.v
  return cached === x.v
}
const closeTo = (v, cached) => {
  const d = Math.abs(cached - v)
  if (d <= 1e-12 * Math.max(Math.abs(cached), Math.abs(v)) || d < 1e-15) return true
  const digits = String(Math.abs(cached)).replace(/e.*$/, '').replace('.', '').replace(/^0+/, '').length
  return !Number.isInteger(cached) && digits >= 8 && digits < 15 && Number(v.toPrecision(digits)) === cached
}

/**
 * Whether a result as the model showed it ({ text, type }) is the stored result `cached`: true or false — or null when
 * only reading it whole can tell (a number too small for 15 decimals, or not in the fixed format).
 */
function shownIs(shown, cached) {
  if (cached === undefined) return true
  const { text, type } = shown
  if (type === 2) return cached === text
  if (type === 4) return cached === (text === 'TRUE')
  if (type === 16 || ERRORS.has(text)) return (typeof cached === 'object' && cached?.error === text) || cached === text
  // A formula's number shows whole in the fixed format modelOf gives formula cells (13 significant digits or more from
  // 0.001 up); a smaller one, only to 15 decimals.
  if (!FIXED_TEXT.test(text)) return null
  if (typeof cached !== 'number') return false
  const n = Number(text)
  if (n !== 0 && Math.abs(n) < 1e-3) return null
  return same({ t: 'n', v: Number(n.toPrecision(15)) + 0 }, cached)
}

/**
 * A formula as IronCalc is given it: a whole column (M:M) cut to the rows its sheet has (M1:M120), a whole row (3:5) to
 * its columns — over whole columns IronCalc goes through all 1,048,576 rows at each evaluation (SUMIFS over whole columns:
 * 34 s a workbook in the corpus). `extents[s]` a sheet's { rows, cols }; `at` sheet name → index. A result the cut
 * changes (COUNTBLANK(M:M), INDEX(M:M, 2000000)) differs from the stored one: not trusted, shown as its formula.
 */
export function clipped(formula, s, extents, at) {
  let tokens
  try {
    tokens = tokenize(formula)
  } catch {
    return formula
  }
  let out = ''
  let from = 0
  for (const t of tokens) {
    if (t.type !== 'ref' || (t.kind !== 'cols' && t.kind !== 'rows')) continue
    const e = extents[t.sheet ? at.get(sheetOfPrefix(t.sheet).toLowerCase()) : s]
    if (!e) continue
    const whole =
      t.kind === 'cols'
        ? `${colName(Math.min(t.a.c, t.b.c))}1:${colName(Math.max(t.a.c, t.b.c))}${e.rows}`
        : `A${Math.min(t.a.r, t.b.r) + 1}:${colName(e.cols - 1)}${Math.max(t.a.r, t.b.r) + 1}`
    out += formula.slice(from, t.start) + (t.sheet ?? '') + whole
    from = t.end
  }
  return from ? out + formula.slice(from) : formula
}

/**
 * What IronCalc is given for the formulas and names of a workbook — the file's own formulas are not touched, only what the
 * model is fed: a table reference as the range it reads (structBox; IronCalc has no tables), a defined name IronCalc will
 * not take (one not plain ASCII: 税率) by an ASCII alias. formula(f, s, at) → { text, why }: `why` when a table reference
 * reads no range of cells (fed as it is: not calculated, and that said). names: the defined names as fed.
 */
function feederOf(book, sheets, index) {
  const tables = index.tables
  const aliases = new Map()
  const taken = new Set((book.names ?? []).map((n) => n.name.toLowerCase()))
  for (const n of book.names ?? []) {
    const low = n.name.toLowerCase()
    if (aliases.has(low) || /^[A-Za-z_\\][A-Za-z0-9_.\\]*$/.test(n.name)) continue
    let i = aliases.size + 1
    while (taken.has(`gugu_name_${i}`)) i++
    taken.add(`gugu_name_${i}`)
    aliases.set(low, `gugu_name_${i}`)
  }
  const named = (name) => tables.filter((t) => t.name.toLowerCase() === name.toLowerCase())
  const rangeText = (b) => `${quoteSheet(sheets[b.s].name)}!${addr(b.r0, b.c0)}${b.r0 === b.r1 && b.c0 === b.c1 ? '' : `:${addr(b.r1, b.c1)}`}`
  const formula = (f, s, at = null) => {
    let tokens
    try {
      tokens = tokenize(f)
    } catch {
      return { text: f, why: null }
    }
    let out = ''
    let from = 0
    let why = null
    for (const t of tokens) {
      let by = null
      if (t.type === 'struct') {
        const inside = (x) => x.s === s && at && at.r >= x.box.r0 && at.r <= x.box.r1 && at.c >= x.box.c0 && at.c <= x.box.c1
        const found = t.table ? named(t.table) : tables.filter(inside)
        const read = found.length === 1 ? structBox(found[0], t.spec, at && { s, r: at.r }) : null
        if (read?.box) by = rangeText(read.box)
        else why ??= read?.why ?? (found.length > 1 ? `two tables are named ${t.table}` : t.table ? `there is no table ${t.table}` : 'it names a table column from outside any table')
      } else if (t.type === 'name') {
        const name = f.slice(t.start + t.sheet.length, t.end)
        const table = t.sheet ? [] : named(name)
        if (table.length === 1) by = rangeText(structBox(table[0], '[]').box ?? { s: table[0].s, ...table[0].box })
        else if (aliases.has(name.toLowerCase())) by = t.sheet + aliases.get(name.toLowerCase())
      }
      if (by === null) continue
      out += f.slice(from, t.start) + by
      from = t.end
    }
    return { text: from ? out + f.slice(from) : f, why }
  }
  const names = (book.names ?? []).map((n) => {
    const scope = n.scope === null || n.scope === undefined ? null : index.at.get(book.sheets[n.scope]?.name?.toLowerCase())
    return { name: aliases.get(n.name.toLowerCase()) ?? n.name, scope: scope ?? null, ref: formula(n.ref, scope ?? 0).text }
  })
  return { formula, names }
}

/** What the model holds for a cell of the file: its formula, or its value as typed (text always quoted). */
function inputOf(cell) {
  if (!cell) return null
  if (cell.f !== undefined && cell.fType !== 'dataTable') return `=${cell.f}`
  const v = cell.v
  if (v === undefined || v === null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : null
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'object') return v.error
  return `'${v}`
}

/**
 * An IronCalc model of the workbook `book` (its worksheets `sheets`, their formulas `index`: formulaIndex): its sheets,
 * names, formulas and the cells a formula reads — a volatile function's cell its stored result; the cells of `instead`
 * (key → a cell, or null for none) as given there, not as `book` has them. `put(s, r, c, cell)` sets one cell (null:
 * empties it) — paused and resumed by the caller around many. Formulas and names as feederOf gives them; `unfed` the
 * formula cells (key → why) whose table reference reads no range.
 */
function modelOf(Model, book, sheets, index, instead = new Map()) {
  const m = new Model('Book', 'en', 'UTC', 'en')
  for (let i = 1; i < sheets.length; i++) m.newSheet()
  sheets.forEach((info, i) => {
    try {
      m.renameSheet(i, info.name)
    } catch {}
  })
  const feed = feederOf(book, sheets, index)
  for (const n of feed.names) {
    try {
      m.newDefinedName(n.name, n.scope, n.ref)
    } catch {}
  }
  const unfed = new Map()
  // How far each sheet goes: its last row with cells, its columns.
  const extents = sheets.map((info) => {
    const sheet = book.sheet(info)
    return { rows: Math.max(1, (sheet.rowNums.at(-1) ?? 0) + 1), cols: Math.max(1, sheet.colCount) }
  })
  const put = (s, r, c, cell) => {
    const volatileHere = !!volatileOf(cell?.f)
    const typed = volatileHere ? inputOf({ v: cell?.v }) : inputOf(cell)
    let input = typed
    if (typed?.startsWith('=') && cell?.f !== undefined) {
      const fed = feed.formula(cell.f, s, { r, c })
      if (fed.why) unfed.set(key(s, r, c), fed.why)
      else unfed.delete(key(s, r, c))
      input = `=${clipped(fed.text, s, extents, index.at)}`
    }
    if (input === null) m.rangeClearContents(s, r + 1, c + 1, r + 1, c + 1)
    else if (cell?.fType === 'array' && cell.fRef && !volatileHere) {
      const box = index.cells.get(key(s, r, c))?.array
      try {
        m.setUserArrayFormula(s, r + 1, c + 1, box ? box.c1 - box.c0 + 1 : 1, box ? box.r1 - box.r0 + 1 : 1, input)
      } catch {
        m.setUserInput(s, r + 1, c + 1, input)
      }
    } else m.setUserInput(s, r + 1, c + 1, input)
  }
  const members = new Set([...index.cells.values()].flatMap((one) => one.members.map((x) => key(one.s, x.r, x.c))))
  m.pauseEvaluation()
  sheets.forEach((info, s) => {
    const sheet = book.sheet(info)
    for (const r of sheet.rowNums)
      for (const [c, cell] of sheet.row(r)) {
        const k = key(s, r, c)
        if (members.has(k) || instead.has(k)) continue
        // A value no formula reads changes no result: not fed (a long column of names, say).
        if (cell.f === undefined && !index.isRead(s, r, c)) continue
        if (inputOf(cell) !== null) put(s, r, c, cell)
      }
  })
  for (const [k, cell] of instead) {
    const [s, r, c] = k.split(':').map(Number)
    put(s, r, c, cell)
  }
  // Formula cells in the fixed format their numbers read whole in (resultAt): a column's run of them at a time.
  const runs = new Map()
  for (const one of index.cells.values())
    for (const { r, c } of [one, ...one.members]) {
      const run = runs.get(`${one.s}:${c}`)
      if (run) {
        run.r0 = Math.min(run.r0, r)
        run.r1 = Math.max(run.r1, r)
      } else runs.set(`${one.s}:${c}`, { s: one.s, c, r0: r, r1: r })
    }
  for (const { s, c, r0, r1 } of runs.values()) m.updateRangeStyle({ sheet: s, row: r0 + 1, column: c + 1, width: 1, height: r1 - r0 + 1 }, 'num_fmt', FIXED)
  m.resumeEvaluation()
  return { m, put, unfed }
}

/** A cell's result in the model, whole: { t: 'n' | 'str' | 'b' | 'e', v } — a number to 15 significant digits. */
function resultAt(m, s, r, c) {
  const type = m.getCellType(s, r + 1, c + 1)
  const text = m.getFormattedCellValue(s, r + 1, c + 1)
  if (type === 2) return { t: 'str', v: text }
  if (type === 4) return { t: 'b', v: text === 'TRUE' }
  if (type === 16 || ERRORS.has(text)) return { t: 'e', v: text }
  // IronCalc formats with 15 significant digits at most (General shows fewer, rounded): formula cells have a fixed format
  // of 15 decimals (modelOf), which shows a number whole (13 significant digits at least, from 0.001 up); a cell without it
  // is given it here; a smaller number is read in scientific notation.
  const area = { sheet: s, row: r + 1, column: c + 1, width: 1, height: 1 }
  if (!FIXED_TEXT.test(text)) m.updateRangeStyle(area, 'num_fmt', FIXED)
  let n = Number(FIXED_TEXT.test(text) ? text : m.getFormattedCellValue(s, r + 1, c + 1))
  if (n !== 0 && Math.abs(n) < 1e-3) {
    m.updateRangeStyle(area, 'num_fmt', SCIENTIFIC)
    const x = Number(m.getFormattedCellValue(s, r + 1, c + 1))
    if (Number.isFinite(x)) n = x
  }
  return Number.isFinite(n) ? { t: 'n', v: Number(n.toPrecision(15)) + 0 } : { t: 'e', v: '#NUM!' }
}

/** The calculation itself (in its own process, xlsx-calc-child.mjs; a test may call it directly). */
export async function calculate({ after, seeds }) {
  const started = performance.now()
  const ms = {}
  const lap = (name, t) => (ms[name] = Math.round(performance.now() - t))
  const { initSync, Model } = await import('../vendor/ironcalc.js')
  initSync({ module: readFileSync(new URL('../vendor/ironcalc.wasm', import.meta.url)) })
  const B = await openBook(after)
  const sheetsB = worksheets(B)
  let t = performance.now()
  // The workbook after the edit is the one before but at the cells written (and a shared formula's followers, written
  // out the same): one index — that one's; the written cells as they were come with the seeds.
  const now = formulaIndex(B, sheetsB)
  const wrote = seeds.map((x) => ({ ...x, s: now.at.get(x.sheet.toLowerCase()) })).filter((x) => x.s !== undefined)
  const wroteAt = new Set(wrote.map((x) => key(x.s, x.r, x.c)))
  const was = (x) => x.was ?? null
  const cellNow = (s, r, c) => B.sheet(sheetsB[s]).row(r).get(c) ?? null
  lap('index', t)

  // The workbook as it was. A volatile function's cell holds its stored result: what it reads is not followed.
  t = performance.now()
  const { m, put, unfed } = modelOf(Model, B, sheetsB, now, new Map(wrote.map((x) => [key(x.s, x.r, x.c), was(x)])))
  lap('feed', t)
  t = performance.now()
  m.evaluate()
  lap('evaluate', t)

  // Every result a formula gives (an array formula's other cells too), as the model shows it: before, after.
  const outputs = new Map()
  for (const one of now.cells.values()) {
    outputs.set(one.k, { s: one.s, r: one.r, c: one.c })
    for (const x of one.members) outputs.set(key(one.s, x.r, x.c), { s: one.s, r: x.r, c: x.c })
  }
  const shown = () => new Map([...outputs].map(([k, o]) => [k, { text: m.getFormattedCellValue(o.s, o.r + 1, o.c + 1), type: m.getCellType(o.s, o.r + 1, o.c + 1) }]))
  t = performance.now()
  const shownBefore = shown()
  m.pauseEvaluation()
  for (const x of wrote) put(x.s, x.r, x.c, cellNow(x.s, x.r, x.c))
  m.resumeEvaluation()
  m.evaluate()
  const shownAfter = shown()
  lap('edit', t)

  // Changed by the edit: a result IronCalc now gives differently, and the edit's own formulas.
  const owner = new Map()
  for (const one of now.cells.values()) {
    owner.set(one.k, one)
    for (const x of one.members) owner.set(key(one.s, x.r, x.c), one)
  }
  const changed = new Set()
  for (const [k, before] of shownBefore) {
    const after = shownAfter.get(k)
    if (owner.has(k) && (after.text !== before.text || after.type !== before.type)) changed.add(owner.get(k).k)
  }
  for (const x of wrote) if (now.cells.has(key(x.s, x.r, x.c))) changed.add(key(x.s, x.r, x.c))

  // Their results, whole, after the edit.
  const valueAt = (s, r, c) => resultAt(m, s, r, c)
  const cellsOf = (one) => [{ r: one.r, c: one.c, cached: one.cached }, ...one.members]
  t = performance.now()
  const afterValues = new Map([...changed].map((k) => [k, cellsOf(now.cells.get(k)).map((x) => valueAt(now.cells.get(k).s, x.r, x.c))]))
  // As the workbook was, held to the stored results (the edit's own formulas are new: nothing to hold them to): what the
  // model showed before the edit — or, where that cannot tell (a very small number), the edit undone and the number read.
  const differs = new Set()
  const unsure = []
  for (const k of changed) {
    if (wroteAt.has(k)) continue
    const one = now.cells.get(k)
    for (const x of cellsOf(one)) {
      const is = shownIs(shownBefore.get(key(one.s, x.r, x.c)), x.cached)
      if (is === false) differs.add(k)
      else if (is === null) unsure.push({ k, s: one.s, ...x })
    }
  }
  if (unsure.length) {
    m.pauseEvaluation()
    for (const x of wrote) put(x.s, x.r, x.c, was(x))
    m.resumeEvaluation()
    m.evaluate()
    for (const x of unsure) if (!same(valueAt(x.s, x.r, x.c), x.cached)) differs.add(x.k)
  }
  lap('values', t)

  // Not calculated, and why; then everything reading those. What reads the formulas `keys` — each of their cells, an
  // array formula's others too — however far down: the index's, and every OFFSET or INDIRECT formula reaching its sheet
  // (what one reads cannot be told more closely; see the top).
  const readers = (keys) =>
    now.downstream(
      keys.flatMap((k) => cellsOf(now.cells.get(k)).map((x) => ({ s: now.cells.get(k).s, r: x.r, c: x.c }))),
      undefined,
      now.follows,
    )
  t = performance.now()
  const not = new Map()
  // Formulas IronCalc already gets differently from their stored results (the workbook as it was), and what reads them:
  // a result worked out from one of those is not taken where nothing stored can check it.
  const inconsistent = [...now.cells.values()]
    .filter((one) => !wroteAt.has(one.k) && cellsOf(one).some((x) => shownIs(shownBefore.get(key(one.s, x.r, x.c)), x.cached) === false))
    .map((one) => one.k)
  const tainted = inconsistent.length ? readers(inconsistent) : new Set()
  const read = readerOf(B, sheetsB)
  const ref = (k) => {
    const one = now.cells.get(k)
    return `${quoteSheet(sheetsB[one.s].name)}!${addr(one.r, one.c)}`
  }
  for (const k of changed) {
    const one = now.cells.get(k)
    const after = afterValues.get(k)
    if (one.volatile) not.set(k, `${one.volatile} is volatile`)
    else if (one.spans) not.set(k, `it reads a range of sheets (${one.spans}), which IronCalc cannot calculate`)
    else if (one.external) not.set(k, 'it reads another workbook')
    else if (one.unreadable) not.set(k, 'this script cannot read the formula')
    else if (unfed.has(k)) not.set(k, unfed.get(k))
    else if (after.some((x, i) => x.t === 'e' && NOT_IN_IRONCALC.has(x.v) && !same(x, cellsOf(one)[i].cached))) not.set(k, 'IronCalc does not have a function or name it uses')
    else if (differs.has(k)) not.set(k, 'IronCalc and Excel calculate it differently')
    else {
      // Nothing stored to hold it to: taken only without what IronCalc often gets differently.
      const doubt = cellsOf(one).every((x) => x.cached === undefined) ? untrustedIn(one, after, read) : null
      if (doubt) not.set(k, `${doubt}: IronCalc and Excel often differ there, and no stored result checks it`)
      // An OFFSET or INDIRECT giving an error not stored: one IronCalc cannot follow (INDIRECT of a name, or of a table's
      // reference, is #REF! to it), whatever Excel gets.
      else if (one.follows && after.some((x, i) => x.t === 'e' && !same(x, cellsOf(one)[i].cached))) not.set(k, `its ${one.follows} gives an error here that Excel may not`)
      // Worked out from a formula IronCalc already gets differently: its new result is not taken, stored one or not —
      // its stored one held only for the way it went before (IF(B1>0,G1,0) now reading G1).
      else if (tainted.has(k)) not.set(k, 'it reads a formula IronCalc and Excel calculate differently')
    }
  }
  // A formula IronCalc cannot calculate shows no change in it: one of those reading a changed cell is changed too.
  const broken = (k) => {
    const one = now.cells.get(k)
    const v = shownAfter.get(k)?.text
    if (one.volatile || one.external || one.unreadable || one.spans || unfed.has(k)) return true
    return ERRORS.has(v) && !(typeof one.cached === 'object' && one.cached?.error === v) && (one.cached !== undefined || NOT_IN_IRONCALC.has(v))
  }
  const starts = [...wrote, ...[...changed].map((k) => now.cells.get(k))].map((x) => ({ s: x.s, r: x.r, c: x.c }))
  // An OFFSET or INDIRECT formula IronCalc cannot calculate reads every cell of the sheets it reaches (one it can shows
  // its change itself).
  const blind = now.follows.filter((k) => broken(k))
  for (const k of now.downstream(starts, (k) => !changed.has(k) && !broken(k), blind)) {
    if (changed.has(k) || !broken(k)) continue
    const one = now.cells.get(k)
    const why = one.spans ? `it reads a range of sheets (${one.spans}), which IronCalc cannot calculate` : (unfed.get(k) ?? 'IronCalc cannot calculate it')
    not.set(k, one.volatile ? `${one.volatile} is volatile` : one.external ? 'it reads another workbook' : why)
  }
  // A workbook counting its dates from 1904 (old Excel for Mac): IronCalc counts from 1900 — its dates would be 4 years off.
  if (B.date1904) for (const k of changed) if (!not.has(k)) not.set(k, 'the workbook counts dates from 1904, the calculator from 1900')
  // Reading a volatile function: its result here would be the stored one's, not now's.
  const volatile = [...now.cells.values()].filter((one) => one.volatile).map((one) => one.k)
  const readsVolatile = volatile.length ? readers(volatile) : new Set()
  for (const k of readsVolatile) if (changed.has(k) && !not.has(k)) not.set(k, 'it reads a volatile function')
  // Everything reading a cell not calculated, however far down.
  for (const k of readers([...not.keys()])) if (!not.has(k)) not.set(k, 'it reads a cell that could not be calculated')
  lap('classify', t)

  // The answer: each cell to write — its result, or null (its stored one taken away).
  const out = []
  let recalculated = 0
  for (const k of changed) {
    if (not.has(k)) continue
    recalculated++
    const one = now.cells.get(k)
    cellsOf(one).forEach((x, i) => {
      const v = afterValues.get(k)[i]
      if (!same(v, x.cached)) out.push({ sheet: sheetsB[one.s].name, r: x.r, c: x.c, value: v })
    })
  }
  for (const k of not.keys()) {
    const one = now.cells.get(k)
    for (const x of cellsOf(one)) if (x.cached !== undefined) out.push({ sheet: sheetsB[one.s].name, r: x.r, c: x.c, value: null })
  }
  ms.total = Math.round(performance.now() - started)
  return {
    cells: out,
    recalculated,
    uncomputed: [...not].map(([k, why]) => ({ ref: ref(k), why })),
    ms,
  }
}
