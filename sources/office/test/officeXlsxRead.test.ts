// 咕咕办公读 .xlsx(表格设计说明 §2、§4):公式的分词、平移、_xlfn 前缀,
// 地址的读写,日期序列值,以及工作簿和工作表照文件原样读出来(页面和 skill 的脚本读的是同一份 xlsx-read.js)。
// 用的是手写的样例 fixtures/xlsx-sales.xlsx(两张表加一张隐藏表:共享字符串里有注音、样式和主题色、冻结首行、合并区、
// 共享公式 D2:D5、数组公式 G2:G3、表格 Table1、批注、calcChain、日期、定义名称),它流式写出的版本(每个条目后面跟 data
// descriptor)和条目名用反斜杠的版本(xl\workbook.xml,Excel 打得开)。父提交上没有 xlsx-*.js,这些格全红。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const lib = resolve(__dirname, '../app/skills/office/lib')
const fixture = (name: string) => new Uint8Array(readFileSync(resolve(__dirname, 'fixtures', name)))

interface Box { r0: number; c0: number; r1: number; c1: number }
interface Formula {
  tokenize(f: string): { type: string; start: number; end: number }[]
  shift(f: string, dr: number, dc: number): string
  stored(f: string): string
  shown(f: string): string
  check(f: string): void
  refs(f: string): ({ sheet: string } & Box | { table: string; spec: string })[]
  structColumns(spec: string): string[]
  colName(c: number): string
  colIndex(s: string): number
}
interface Cell { r: number; c: number; t: string; s: number; v: unknown; f?: string; fType?: string; master?: boolean }
interface Sheet {
  rowCount: number
  colCount: number
  frozen: { rows: number; cols: number }
  merges: Box[]
  heights: Map<number, number>
  row(r: number): Map<number, Cell>
  col(c: number): { width: number }
}
interface Book {
  sheets: { name: string; state: string; part: string | null }[]
  date1904: boolean
  names: { name: string; ref: string }[]
  sst: string[]
  styles: { xfs: { fmt: string; font?: { b: boolean; color?: string }; fill?: string; border?: { l?: string } }[] }
}
interface Read {
  parseRange(text: string): { sheet: string | null; kind: string } & Box
  formatRange(sheet: string | null, box: Partial<Box> & { kind?: string }): string
  quoteSheet(name: string): string
  serialToDate(serial: number, date1904: boolean): { date: string }
  dateToSerial(value: { date: string }, date1904: boolean): number
  readBook(text: (name: string) => Promise<string | null>): Promise<Book>
  readSheet(xml: string, book: Book): Sheet
  display(book: Book, cell: Cell | undefined, locale?: string): { text: string; color?: string; pending?: boolean }
  agentValue(book: Book, cell: Cell | undefined): unknown
}
const F = (await import(/* @vite-ignore */ resolve(lib, 'xlsx-formula.js'))) as Formula
const X = (await import(/* @vite-ignore */ resolve(lib, 'xlsx-read.js'))) as Read
const P = (await import(/* @vite-ignore */ resolve(lib, 'ooxml-read.js'))) as { openParts(bytes: Uint8Array): { text(name: string): Promise<string | null> } }

/** A workbook read the way the page reads it: parts inflated as asked (DecompressionStream), every sheet. */
async function openBook(bytes: Uint8Array) {
  const parts = P.openParts(bytes)
  const book = await X.readBook(parts.text)
  const sheets = new Map<string, Sheet>()
  for (const s of book.sheets) if (s.part) sheets.set(s.name, X.readSheet((await parts.text(s.part))!, book))
  return Object.assign(book, { sheet: (info: Book['sheets'][number]) => sheets.get(info.name)! })
}

describe('公式:分词、平移、前缀、引用', () => {
  test('平移只动相对的部分;$ 锚定的不动;字符串、函数名、名称不动;移出表外是 #REF!', () => {
    expect(F.shift('SUM(B2:B5)+$A$1+A$1+$A1', 2, 1)).toBe('SUM(C4:C7)+$A$1+B$1+$A3')
    expect(F.shift("'2024 预算'!B1*销售!C3+LOG10(A1)&\"A1\"", 1, 0)).toBe("'2024 预算'!B2*销售!C4+LOG10(A2)&\"A1\"")
    expect(F.shift('SUM(C:C)+SUM(3:4)', 1, 1)).toBe('SUM(D:D)+SUM(4:5)')
    expect(F.shift('A1+税率', -1, 0)).toBe('#REF!+税率')
    // No move: the very text back (a shared formula's master reads as itself).
    expect(F.shift('b2 + c2', 0, 0)).toBe('b2 + c2')
  })
  test('2007 以后的函数存成带前缀的(XLOOKUP → _xlfn.XLOOKUP、FILTER → _xlfn._xlws.FILTER);读出来去掉', () => {
    expect(F.stored('XLOOKUP(A1,B:B,C:C)+filter(A1:A9,B1:B9>0)+SUM(A1)')).toBe('_xlfn.XLOOKUP(A1,B:B,C:C)+_xlfn._xlws.FILTER(A1:A9,B1:B9>0)+SUM(A1)')
    expect(F.stored('_xlfn.IFS(A1>0,1)')).toBe('_xlfn.IFS(A1>0,1)')
    expect(F.shown('_xlfn.XLOOKUP(A1,_xlfn._xlws.SORT(B:B),C:C)')).toBe('XLOOKUP(A1,SORT(B:B),C:C)')
  })
  test('读不懂的公式说清楚哪里不对:括号不配对、引号没闭合', () => {
    expect(() => F.check('SUM(A1:A3')).toThrow(/1 \( never closed/)
    expect(() => F.check('SUM(A1))')).toThrow(/\) with no \(/)
    expect(() => F.check('"abc')).toThrow(/" is never closed/)
    expect(() => F.check("'2024 预算!A1")).toThrow(/' is never closed/)
    expect(() => F.check('IF(A1>0,"a(",{1,2;3,4})')).not.toThrow()
    // Another workbook's cell, its path quoted inside the brackets (POI 52575): read, not taken for a table's escape.
    expect(F.refs("['file:///home/a/b.xlsx]Sheet1'!$A$1+1")).toEqual([{ sheet: "['file:///home/a/b.xlsx]Sheet1'", r0: 0, c0: 0, r1: 0, c1: 0 }])
    expect(F.shift("['file:///home/a/b.xlsx]Sheet1'!A1+1", 1, 0)).toBe("['file:///home/a/b.xlsx]Sheet1'!A2+1")
  })
  test('引用:单元格、区域、整列整行,各带它的表名;表格的列', () => {
    expect(F.refs("SUM('2024 预算'!B1:B4)+A1+Table1[单价]+C:C")).toEqual([
      { sheet: '2024 预算', r0: 0, c0: 1, r1: 3, c1: 1 },
      { sheet: '', r0: 0, c0: 0, r1: 0, c1: 0 },
      { table: 'Table1', spec: '[单价]' },
      { sheet: '', r0: 0, c0: 2, r1: 1048575, c1: 2 },
    ])
    expect(F.structColumns('[[#This Row],[单价]:[数量]]')).toEqual(['单价', '数量'])
    expect(F.structColumns('[@金额]')).toEqual(['金额'])
    expect([F.colName(0), F.colName(25), F.colName(26), F.colName(16383), F.colIndex('XFD'), F.colIndex('XFE')]).toEqual(['A', 'Z', 'AA', 'XFD', 16383, -1])
  })
})

describe('地址和日期', () => {
  test('地址照 Excel 的写法读:表名(加引号的、中文的)、区域、整列、整行、只写表名', () => {
    expect(X.parseRange('销售!B2:D9')).toMatchObject({ sheet: '销售', kind: 'cells', r0: 1, c0: 1, r1: 8, c1: 3 })
    expect(X.parseRange("'2024 预算'!$B$1")).toMatchObject({ sheet: '2024 预算', kind: 'cells', r0: 0, c0: 1 })
    expect(X.parseRange('C:E')).toMatchObject({ sheet: null, kind: 'cols', c0: 2, c1: 4 })
    expect(X.parseRange('销售!3:5')).toMatchObject({ kind: 'rows', r0: 2, r1: 4 })
    expect(X.parseRange('销售')).toMatchObject({ sheet: '销售', kind: 'sheet' })
    expect(X.parseRange("'Q1'")).toMatchObject({ sheet: 'Q1', kind: 'sheet' })
    // A quoted name alone is that whole sheet, a ! in the name or not (复核 156f72cb0e: 'A!B' was cut at its !).
    expect(X.parseRange("'A!B'")).toMatchObject({ sheet: 'A!B', kind: 'sheet' })
    expect(X.parseRange("'O''Neil'")).toMatchObject({ sheet: "O'Neil", kind: 'sheet' })
    expect(X.parseRange("'A!B'!B3")).toMatchObject({ sheet: 'A!B', kind: 'cells', r0: 2, c0: 1 })
    expect(() => X.parseRange('销售!A1:B2:C3')).toThrow(/is not an address/)
    expect(X.formatRange('2024 预算', { r0: 0, c0: 1, r1: 0, c1: 1 })).toBe("'2024 预算'!B1")
    expect(X.formatRange('销售', { kind: 'cols', r0: 0, c0: 2, r1: 9, c1: 2 })).toBe('销售!C:C')
    expect([X.quoteSheet('销售'), X.quoteSheet('A1'), X.quoteSheet("O'Brien"), X.quoteSheet('2024')]).toEqual(['销售', "'A1'", "'O''Brien'", "'2024'"])
  })
  test('日期:1900 年系统(含 Lotus 那个不存在的 2 月 29 日)和 1904 年系统,带时间、只有时间;读写对称', () => {
    expect(X.serialToDate(45352, false)).toEqual({ date: '2024-03-01' })
    expect(X.serialToDate(40513.35139, false)).toEqual({ date: '2010-12-01T08:26' })
    expect(X.serialToDate(60, false)).toEqual({ date: '1900-02-29' })
    expect(X.serialToDate(61, false)).toEqual({ date: '1900-03-01' })
    expect(X.serialToDate(0.5, false)).toEqual({ date: '12:00' })
    expect(X.serialToDate(0, true)).toEqual({ date: '1904-01-01' })
    for (const date of ['2024-03-01', '1900-01-01', '1900-03-01', '2010-12-01T08:26', '2031-07-04T23:59:30', '12:30']) {
      expect(X.serialToDate(X.dateToSerial({ date }, false), false)).toEqual({ date })
    }
    // 1904: its first day is serial 0, so a time alone reads as on that day.
    for (const date of ['2024-03-01', '2010-12-01T08:26', '2031-07-04T23:59:30']) expect(X.serialToDate(X.dateToSerial({ date }, true), true)).toEqual({ date })
    expect(() => X.dateToSerial({ date: '1900-01-01' }, true)).toThrow(/before the workbook's first day/)
    expect(X.dateToSerial({ date: '1900-03-01' }, false)).toBe(61)
    expect(() => X.dateToSerial({ date: '2024-02-30' }, false)).toThrow(/not a day of the calendar/)
    expect(() => X.dateToSerial({ date: '3/1/2024' }, false)).toThrow(/is not a date: write YYYY-MM-DD/)
  })
})

describe('工作簿照文件原样读出来', () => {
  test('表(隐藏的也在)、定义名称、共享字符串(富文本拼起来,注音不算)、样式(字体、填充、边框、数字格式、主题色)', async () => {
    const book = await openBook(fixture('xlsx-sales.xlsx'))
    expect(book.sheets.map((s) => [s.name, s.state, s.part])).toEqual([
      ['销售', 'visible', 'xl/worksheets/sheet1.xml'],
      ['2024 预算', 'visible', 'xl/worksheets/sheet2.xml'],
      ['Hidden', 'hidden', 'xl/worksheets/sheet3.xml'],
    ])
    expect(book.names).toEqual([{ name: '税率', scope: null, hidden: false, ref: "'2024 预算'!$B$1" }])
    expect(book.sst.at(-1)).toBe('东京 支店')
    const xfs = book.styles.xfs
    expect(xfs[1]!.font!.b).toBe(true)
    expect(xfs[4]!.fill).toBe('#ffff00')
    expect(xfs[4]!.font!.color).toBe('#ff0000')
    expect(xfs[4]!.border!.l).toBe('1px solid #000')
    expect(xfs.map((x) => x.fmt).slice(0, 7)).toEqual(['General', 'General', '#,##0', 'm/d/yyyy', 'General', '0%', '#,##0.00'])
    // Theme colour 1 is the scheme's dk1 (sysClr lastClr 000000).
    expect(xfs[0]!.font!.color).toBe('#000000')
  })

  test('一张表:行按位置找到,冻结首行,合并区,自定义行高,列宽;共享公式的跟随格展开成自己的公式', async () => {
    const book = await openBook(fixture('xlsx-sales.xlsx'))
    const sheet = book.sheet(book.sheets[0]!)
    expect([sheet.rowCount, sheet.colCount]).toEqual([9, 11])
    expect(sheet.frozen).toEqual({ rows: 1, cols: 0 })
    expect(sheet.merges).toEqual([{ r0: 7, c0: 0, r1: 7, c1: 3 }])
    expect(sheet.heights.get(6)).toBe(30)
    expect([sheet.col(0).width, sheet.col(2).width, sheet.col(9).width]).toEqual([12, 10, 8.43])
    const row3 = sheet.row(2)
    expect(row3.get(3)).toMatchObject({ f: 'B3+C3', fType: 'shared', v: 1910 })
    expect(sheet.row(1).get(3)).toMatchObject({ f: 'B2+C2', master: true })
    expect(sheet.row(1).get(6)).toMatchObject({ f: 'B2:B3*2', fType: 'array' })
    expect(sheet.row(7).get(0)!.v).toBe('备注：Q3 & Q4 待补')
    // The self-closing row 7: no cells, its height kept.
    expect(sheet.row(6).size).toBe(0)
  })

  test('格子显示的是什么(照数字格式,不算公式)和 agent 读到的是什么(人会往 Excel 里敲的)', async () => {
    const book = await openBook(fixture('xlsx-sales.xlsx'))
    const sheet = book.sheet(book.sheets[0]!)
    const shown = (r: number, c: number) => X.display(book, sheet.row(r).get(c), 'en').text
    expect([shown(1, 1), shown(1, 3), shown(1, 4), shown(8, 1), shown(1, 8), shown(0, 0)]).toEqual(['1,200', '2,550', '13%', '3/1/2024', '12.50', '地区'])
    // Built-in 14, the short date, as the viewer's Excel shows it: Chinese 2024/3/1, English 3/1/2024.
    expect(X.display(book, sheet.row(8).get(1), 'zh_CN').text).toBe('2024/3/1')
    expect(X.agentValue(book, sheet.row(1).get(3))).toBe('=B2+C2')
    expect(X.agentValue(book, sheet.row(8).get(1))).toEqual({ date: '2024-03-01' })
    expect(X.agentValue(book, sheet.row(1).get(1))).toBe(1200)
    expect(X.agentValue(book, undefined)).toBeNull()
    // A formula with no stored result shows as itself, pending — never a guessed number.
    expect(X.display(book, { r: 0, c: 0, t: 'n', s: 2, v: undefined, f: 'B2*2' })).toEqual({ text: '=B2*2', pending: true })
    // Text that starts with = or ' is read with a ' before it, as Excel would take it typed.
    expect(X.agentValue(book, { r: 0, c: 0, t: 's', s: 0, v: '=not a formula' })).toBe("'=not a formula")
  })

  test('流式写出的(data descriptor)和条目名用反斜杠的,读出来一样', async () => {
    // Each sheet's size and every cell as an agent reads it.
    const outline = async (name: string) => {
      const book = await openBook(fixture(name))
      return book.sheets.map((s) => {
        const sheet = book.sheet(s)
        return { name: s.name, rows: sheet.rowCount, cols: sheet.colCount, cells: Array.from({ length: sheet.rowCount }, (_, r) => [...sheet.row(r)].map(([c, cell]) => [c, X.agentValue(book, cell)])) }
      })
    }
    const outlines = await Promise.all(['xlsx-sales.xlsx', 'xlsx-sales-dd.xlsx', 'xlsx-backslash.xlsx'].map(outline))
    expect(outlines[0]![0]!.cells[1]).toEqual([[0, '华东'], [1, 1200], [2, 1350], [3, '=B2+C2'], [4, '=(C2-B2)/B2'], [6, '=B2:B3*2'], [8, 12.5], [9, 3], [10, '=I2*J2']])
    expect(outlines[1]).toEqual(outlines[0])
    expect(outlines[2]).toEqual(outlines[0])
  })
})
