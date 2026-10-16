// Excel formulas (A1 style) as a .xlsx stores them and as people and agents write them (the sheet
// design note §4): tokens by their place in the text. Plain JS: the page and the
// skill's script (xlsx-ooxml.mjs) both read formulas with this.
// - shift(formula, dr, dc): its relative references moved, as Excel moves them filling a formula down or across — and as
//   a shared formula's followers are their master moved. $-anchored parts stay; a reference moved off the sheet is #REF!.
// - Functions Excel added after 2007 are stored with a prefix (_xlfn.XLOOKUP, _xlfn._xlws.FILTER): stored() puts it on,
//   shown() takes it off — people and agents write and read formulas as Excel shows them; without the prefix Excel opens
//   them as #NAME?.
// - refs(formula): what it reads — cells and ranges (with their sheet), and table columns (Table1[单价]).
// - check(formula): quotes closed, brackets, braces and parentheses in pairs; else Excel drops the formula on open.

export const MAX_ROWS = 1048576
export const MAX_COLS = 16384

/** A column's letters from its index (0 → A, 26 → AA). */
export function colName(c) {
  let s = ''
  for (let n = c + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

/** A column's index from its letters (A → 0); -1 if they are not a column. */
export function colIndex(letters) {
  if (!/^[A-Za-z]{1,3}$/.test(letters)) return -1
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64
  return n - 1 < MAX_COLS ? n - 1 : -1
}

// Functions stored with a prefix (MS-XLSX 2.2.2, "future functions"; the dynamic-array and later ones as Excel 365
// writes them). Not in the list: stored as written — Excel shows #NAME? for a name it does not know, the file is fine.
const XLWS = new Set(['FILTER', 'SORT'])
const XLFN = new Set(
  (
    'ACOT ACOTH AGGREGATE ARABIC BASE BETA.DIST BETA.INV BINOM.DIST BINOM.DIST.RANGE BINOM.INV BITAND BITLSHIFT BITOR ' +
    'BITRSHIFT BITXOR CEILING.MATH CEILING.PRECISE CHISQ.DIST CHISQ.DIST.RT CHISQ.INV CHISQ.INV.RT CHISQ.TEST COMBINA CONCAT ' +
    'CONFIDENCE.NORM CONFIDENCE.T COT COTH COVARIANCE.P COVARIANCE.S CSC CSCH DAYS DECIMAL ERF.PRECISE ERFC.PRECISE EXPON.DIST ' +
    'F.DIST F.DIST.RT F.INV F.INV.RT F.TEST FILTERXML FLOOR.MATH FLOOR.PRECISE FORECAST.ETS FORECAST.ETS.CONFINT ' +
    'FORECAST.ETS.SEASONALITY FORECAST.ETS.STAT FORECAST.LINEAR FORMULATEXT GAMMA GAMMA.DIST GAMMA.INV GAMMALN.PRECISE GAUSS ' +
    'HYPGEOM.DIST IFNA IFS IMCOSH IMCOT IMCSC IMCSCH IMSEC IMSECH IMSINH IMTAN ISFORMULA ISOWEEKNUM LOGNORM.DIST LOGNORM.INV ' +
    'MAXIFS MINIFS MODE.MULT MODE.SNGL MUNIT NEGBINOM.DIST NORM.DIST NORM.INV NORM.S.DIST NORM.S.INV NUMBERVALUE PDURATION ' +
    'PERCENTILE.EXC PERCENTILE.INC PERCENTRANK.EXC PERCENTRANK.INC PERMUTATIONA PHI POISSON.DIST QUARTILE.EXC QUARTILE.INC ' +
    'RANK.AVG RANK.EQ RRI SEC SECH SHEET SHEETS SKEW.P STDEV.P STDEV.S SWITCH T.DIST T.DIST.2T T.DIST.RT T.INV T.INV.2T ' +
    'T.TEST TEXTJOIN UNICHAR UNICODE VAR.P VAR.S WEBSERVICE WEIBULL.DIST XOR Z.TEST ' +
    'XLOOKUP XMATCH UNIQUE SORTBY SEQUENCE RANDARRAY LET LAMBDA TEXTBEFORE TEXTAFTER TEXTSPLIT VSTACK HSTACK TOCOL TOROW ' +
    'WRAPROWS WRAPCOLS TAKE DROP CHOOSEROWS CHOOSECOLS EXPAND ARRAYTOTEXT VALUETOTEXT ISOMITTED BYROW BYCOL MAP REDUCE SCAN ' +
    'MAKEARRAY IMAGE GROUPBY PIVOTBY PERCENTOF REGEXTEST REGEXEXTRACT REGEXREPLACE TRIMRANGE ANCHORARRAY SINGLE'
  ).split(' '),
)

/** Excel's error values. */
export const ERROR_CODES = ['#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A', '#GETTING_DATA', '#SPILL!', '#CALC!', '#FIELD!', '#BLOCKED!', '#CONNECT!', '#BUSY!', '#UNKNOWN!', '#PYTHON!']
const ERRORS = new RegExp(`^(${ERROR_CODES.map((e) => e.replace(/[/?]/g, '\\$&')).join('|')})`, 'i')
const CELL = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]+)/
const COLS = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})/
const ROWS = /^(\$?)([0-9]+):(\$?)([0-9]+)/
// What may not follow a reference (or it is part of a name or a function: LOG10(, A1B, R2D2).
const NAME_CHAR = /[\p{L}\p{N}_.\\?]/u
const NAME_START = /[\p{L}_\\]/u
// An unquoted sheet name before its !: anything but what separates tokens.
const SHEET = /^((?:\[[^\]]*\])?[^\s'"!(),:;+\-*/^&=<>{}[\]%#@]+(?::[^\s'"!(),:;+\-*/^&=<>{}[\]%#@]+)?)!/u

/** The error a malformed formula throws (the caller says where, and that nothing was written). */
export class FormulaError extends Error {}

/**
 * The formula's tokens, in order, covering it end to end: { type, start, end } and, for a reference, `sheet` (its
 * prefix as written, with the !, or '') and `a` / `b` ({ c, cAbs } / { r, rAbs } / both) — kind 'cell', 'range',
 * 'cols' or 'rows'; for a table column reference, `table` and `spec` (the bracketed part).
 * Types: ws, str, err, num, ref, func (its name, the ( not included), name, struct, op, open, close, sep, brace.
 */
export function tokenize(formula) {
  const f = formula
  const tokens = []
  let i = 0
  const push = (type, end, extra = {}) => {
    tokens.push({ type, start: i, end, ...extra })
    i = end
  }
  const bracketEnd = (at) => {
    // ' escapes the next character inside a table's specifiers ([Price'[USD']]); an external workbook's path
    // (['file:///…/a.xlsx]Sheet1) has quotes that escape nothing — read again without them.
    for (const escapes of [true, false]) {
      let depth = 0
      for (let j = at; j < f.length; j++) {
        if (f[j] === '[') depth++
        else if (f[j] === ']' && --depth === 0) return j + 1
        else if (escapes && f[j] === "'" && f[j + 1] !== undefined) j++
      }
    }
    throw new FormulaError(`a [ is never closed: ${f.slice(at, at + 40)}`)
  }
  // A reference at `at` (after its sheet prefix, if any): the token's end and its parts, or null.
  const refAt = (at) => {
    const rest = f.slice(at)
    const notName = (end) => end >= f.length || !(NAME_CHAR.test(f[end]) || f[end] === '(')
    let m = rest.match(COLS)
    if (m && notName(at + m[0].length) && colIndex(m[2]) >= 0 && colIndex(m[4]) >= 0)
      return { end: at + m[0].length, kind: 'cols', a: { c: colIndex(m[2]), cAbs: !!m[1] }, b: { c: colIndex(m[4]), cAbs: !!m[3] } }
    m = rest.match(ROWS)
    if (m && notName(at + m[0].length) && +m[2] >= 1 && +m[4] >= 1)
      return { end: at + m[0].length, kind: 'rows', a: { r: +m[2] - 1, rAbs: !!m[1] }, b: { r: +m[4] - 1, rAbs: !!m[3] } }
    m = rest.match(CELL)
    if (!m || colIndex(m[2]) < 0 || +m[4] < 1 || +m[4] > MAX_ROWS) return null
    const a = { c: colIndex(m[2]), cAbs: !!m[1], r: +m[4] - 1, rAbs: !!m[3] }
    let end = at + m[0].length
    if (f[end] === ':') {
      const m2 = f.slice(end + 1).match(CELL)
      if (m2 && colIndex(m2[2]) >= 0 && +m2[4] >= 1 && notName(end + 1 + m2[0].length))
        return { end: end + 1 + m2[0].length, kind: 'range', a, b: { c: colIndex(m2[2]), cAbs: !!m2[1], r: +m2[4] - 1, rAbs: !!m2[3] } }
    }
    if (!notName(end)) return null
    // A1# (the spill of A1) is A1 and an operator, for this.
    return { end, kind: 'cell', a, b: null }
  }
  while (i < f.length) {
    const ch = f[i]
    if (/\s/.test(ch)) {
      let j = i
      while (j < f.length && /\s/.test(f[j])) j++
      push('ws', j)
    } else if (ch === '"') {
      let j = i + 1
      for (;;) {
        if (j >= f.length) throw new FormulaError(`a " is never closed: ${f.slice(i, i + 40)}`)
        if (f[j] === '"') {
          if (f[j + 1] === '"') j += 2
          else break
        } else j++
      }
      push('str', j + 1)
    } else if (ch === '#' && ERRORS.test(f.slice(i))) {
      push('err', i + f.slice(i).match(ERRORS)[0].length)
    } else if (ch === "'") {
      // A quoted sheet name: '' is a ' in it; it must be followed by ! and a reference.
      let j = i + 1
      for (;;) {
        if (j >= f.length) throw new FormulaError(`a ' is never closed: ${f.slice(i, i + 40)}`)
        if (f[j] === "'") {
          if (f[j + 1] === "'") j += 2
          else break
        } else j++
      }
      if (f[j + 1] !== '!') throw new FormulaError(`a quoted name not followed by !: ${f.slice(i, j + 2)}`)
      const sheet = f.slice(i, j + 2)
      const ref = refAt(j + 2)
      if (ref) push('ref', ref.end, { sheet, ...ref })
      else if (f[j + 2] === '#' && ERRORS.test(f.slice(j + 2))) push('err', j + 2 + f.slice(j + 2).match(ERRORS)[0].length)
      else {
        const m = f.slice(j + 2).match(/^[\p{L}_\\][\p{L}\p{N}_.\\?]*/u)
        if (!m) throw new FormulaError(`nothing after ${sheet}`)
        push('name', j + 2 + m[0].length, { sheet })
      }
    } else if (ch === '[') {
      // ['file:///…/b.xlsx]Sheet1'!A1 — another workbook by its path, as older files store it: a prefix like a sheet's.
      const path = /^\['[^\]]*\][^'![\]]*'!/.exec(f.slice(i))
      const pathRef = path && refAt(i + path[0].length)
      if (pathRef) {
        push('ref', pathRef.end, { sheet: path[0], ...pathRef })
        continue
      }
      // [@Col], [[#This Row],[Col]] (a table's own column), or [1]Sheet!A1 (another workbook).
      const end = bracketEnd(i)
      const m = f.slice(end).match(SHEET)
      if (/^\[\d+\]$/.test(f.slice(i, end)) && m) {
        const ref = refAt(end + m[0].length)
        if (ref) push('ref', ref.end, { sheet: f.slice(i, end) + m[0], ...ref })
        else push('name', end + m[0].length, { sheet: f.slice(i, end + m[0].length) })
      } else push('struct', end, { table: '', spec: f.slice(i, end) })
    } else if (ch === '$' || /[A-Za-z0-9]/.test(ch) || NAME_START.test(ch)) {
      const sheet = f.slice(i).match(SHEET)
      const at = sheet ? i + sheet[0].length : i
      const ref = refAt(at)
      if (ref) {
        push('ref', ref.end, { sheet: sheet ? sheet[0] : '', ...ref })
        continue
      }
      if (sheet && f[at] === '#' && ERRORS.test(f.slice(at))) {
        push('err', at + f.slice(at).match(ERRORS)[0].length)
        continue
      }
      if (!sheet && /[0-9.]/.test(ch)) {
        const m = f.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?%?/)
        if (m) {
          push('num', i + m[0].length)
          continue
        }
      }
      const m = f.slice(at).match(/^[\p{L}_\\][\p{L}\p{N}_.\\?]*/u)
      if (!m) throw new FormulaError(`cannot read the formula at: ${f.slice(i, i + 40)}`)
      const end = at + m[0].length
      if (!sheet && f[end] === '(') push('func', end)
      else if (!sheet && f[end] === '[') {
        const close = bracketEnd(end)
        push('struct', close, { table: m[0], spec: f.slice(end, close) })
      } else push('name', end, { sheet: sheet ? sheet[0] : '' })
    } else if (ch === '(') push('open', i + 1)
    else if (ch === ')') push('close', i + 1)
    else if (ch === '{' || ch === '}') push('brace', i + 1)
    else if (ch === ',' || ch === ';') push('sep', i + 1)
    else if ('+-*/^&=<>%@:!#'.includes(ch)) push('op', i + (f.startsWith('<>', i) || f.startsWith('<=', i) || f.startsWith('>=', i) ? 2 : 1))
    // A character no formula has (a file's own oddity, “” quotes): kept as it is; check() refuses it in what is written.
    else push('other', i + 1)
  }
  return tokens
}

/** Quotes closed (tokenize), parentheses and braces in pairs. Throws FormulaError saying what is wrong. */
export function check(formula) {
  let paren = 0
  let brace = 0
  for (const t of tokenize(formula)) {
    if (t.type === 'open') paren++
    else if (t.type === 'func') {
      // its ( is the next token
    } else if (t.type === 'close' && --paren < 0) throw new FormulaError('a ) with no ( before it')
    else if (t.type === 'brace') brace += formula[t.start] === '{' ? 1 : -1
    else if (t.type === 'other') throw new FormulaError(`${JSON.stringify(formula.slice(t.start, t.end))} is not part of a formula (straight quotes " for text)`)
    if (brace < 0) throw new FormulaError('a } with no { before it')
  }
  if (paren > 0) throw new FormulaError(`${paren} ( never closed`)
  if (brace > 0) throw new FormulaError('a { never closed')
}

const part = (p, dr, dc) => {
  const out = { ...p }
  if (p.c !== undefined && !p.cAbs) out.c = p.c + dc
  if (p.r !== undefined && !p.rAbs) out.r = p.r + dr
  return out
}
const inSheet = (p) => (p.c === undefined || (p.c >= 0 && p.c < MAX_COLS)) && (p.r === undefined || (p.r >= 0 && p.r < MAX_ROWS))
const refText = (p) => (p.c !== undefined ? `${p.cAbs ? '$' : ''}${colName(p.c)}` : '') + (p.r !== undefined ? `${p.rAbs ? '$' : ''}${p.r + 1}` : '')

/** The formula with its relative references moved `dr` rows and `dc` columns (a reference moved off the sheet: #REF!). */
export function shift(formula, dr, dc) {
  if (!dr && !dc) return formula
  let out = ''
  for (const t of tokenize(formula)) {
    if (t.type !== 'ref') {
      out += formula.slice(t.start, t.end)
      continue
    }
    const a = part(t.a, dr, dc)
    const b = t.b && part(t.b, dr, dc)
    if (!inSheet(a) || (b && !inSheet(b))) out += `${t.sheet}#REF!`
    else out += `${t.sheet}${refText(a)}${b ? `:${refText(b)}` : ''}`
  }
  return out
}

/** As the file stores it: future functions prefixed (XLOOKUP → _xlfn.XLOOKUP, FILTER → _xlfn._xlws.FILTER). */
export function stored(formula) {
  let out = ''
  for (const t of tokenize(formula)) {
    const text = formula.slice(t.start, t.end)
    if (t.type !== 'func' || /^_xl/i.test(text)) {
      out += text
      continue
    }
    const name = text.toUpperCase()
    out += XLWS.has(name) ? `_xlfn._xlws.${name}` : XLFN.has(name) ? `_xlfn.${name}` : text
  }
  return out
}

/** As Excel shows it: the stored prefixes (_xlfn., _xlws., _xlpm.) taken off. */
export const shown = (formula) => formula.replace(/_xl(?:fn|ws|pm)\./gi, '')

/** A function token's name as Excel shows it, in capitals: its stored prefixes off (_xlfn.XLOOKUP → XLOOKUP). */
export const funcName = (formula, t) => formula.slice(t.start, t.end).replace(/^(_xl(fn|ws|pm)\.)+/i, '').toUpperCase()

/** The functions a formula calls, in order (funcName); none for a formula that cannot be read. */
export function funcsIn(formula) {
  try {
    return tokenize(formula).filter((t) => t.type === 'func').map((t) => funcName(formula, t))
  } catch {
    return []
  }
}

/** An unquoted sheet name from a reference's prefix ('2024 预算'! → 2024 预算; Sheet1! → Sheet1); '' for none. */
export const sheetOfPrefix = (prefix) => {
  if (!prefix) return ''
  const name = prefix.slice(0, -1)
  return name.startsWith("'") ? name.slice(1, -1).replace(/''/g, "'") : name
}

/**
 * What the formula reads: { sheet, r0, c0, r1, c1 } per cell or range (sheet '' = its own; a whole column or row spans
 * the sheet), and { table, spec } per table column reference.
 */
export function refs(formula) {
  const out = []
  for (const t of tokenize(formula)) {
    if (t.type === 'struct') out.push({ table: t.table, spec: t.spec })
    if (t.type !== 'ref') continue
    const sheet = sheetOfPrefix(t.sheet)
    if (t.kind === 'cell') out.push({ sheet, r0: t.a.r, c0: t.a.c, r1: t.a.r, c1: t.a.c })
    else if (t.kind === 'range') out.push({ sheet, r0: Math.min(t.a.r, t.b.r), c0: Math.min(t.a.c, t.b.c), r1: Math.max(t.a.r, t.b.r), c1: Math.max(t.a.c, t.b.c) })
    else if (t.kind === 'cols') out.push({ sheet, r0: 0, c0: Math.min(t.a.c, t.b.c), r1: MAX_ROWS - 1, c1: Math.max(t.a.c, t.b.c) })
    else out.push({ sheet, r0: Math.min(t.a.r, t.b.r), c0: 0, r1: Math.max(t.a.r, t.b.r), c1: MAX_COLS - 1 })
  }
  return out
}

/** The column names a table column reference names (Table1[单价], Table1[[#Headers],[单价]:[数量]], [@单价]). */
export function structColumns(spec) {
  const inner = spec.slice(1, -1)
  const parts = inner.startsWith('[') ? [...inner.matchAll(/\[((?:[^\]']|'.)*)\]/g)].map((m) => m[1]) : [inner.replace(/^@/, '')]
  return parts.filter((p) => p && !p.startsWith('#')).map((p) => p.replace(/^@/, '').replace(/'(.)/g, '$1').trim())
}
