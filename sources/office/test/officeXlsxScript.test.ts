// 咕咕办公的 skill 改 .xlsx(表格设计说明 §4–§7;10-13 起是 skill + 脚本,
// 表格-脚本方案.md):按表和区域读,按区域写格子,改的就是那个文件 —— 没动的 zip 条目逐字节拷回,写到的那张表只换被写的
// 那几格(所在的行),其余字节不动;字写成 inlineStr,不碰 sharedStrings;calcPr 加 fullCalcOnLoad;不再是公式的格从
// calcChain 里删掉。改动牵连的公式写回时用 IronCalc 重算、把新结果存进去(xlsx-calc.mjs,owner 10-13 定的 ①);算不了的
// 拿掉旧结果,显示成公式。读到的每块区域带 was,改的时候对不上就拒(content-changed)。上半是模块
// (skills/office/lib/xlsx-ooxml.mjs),下半是 agent 在自己 shell 里跑的脚本(skills/office/scripts/xlsx.mjs)。
// 用的是 fixtures/xlsx-sales.xlsx。父提交上没有这些模块和脚本,这些格全红。
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

const appDir = resolve(__dirname, '../app')
const lib = resolve(appDir, 'skills/office/lib')
const fixture = (name: string) => new Uint8Array(readFileSync(resolve(__dirname, 'fixtures', name)))
const sales = fixture('xlsx-sales.xlsx')

interface Zip { entries: { name: string; flags: number; record: Uint8Array }[] }
type Value = unknown
interface Read { range: string; was: string; cells: Value[][]; shown?: Record<string, string>; merged?: string[]; more?: string }
interface Edited {
  bytes: Uint8Array
  changed: string[]
  was: Record<string, string>
  recalc?: { recalculated?: number; uncomputed?: number; notCalculated?: { ref: string; why: string }[]; skipped?: string; cleared?: number }
  notes?: string[]
  parts: string[]
  unchangedEntries: number
}
interface Ooxml {
  readZip(bytes: Uint8Array): Zip
  openBook(bytes: Uint8Array, limit?: number): Promise<{ pkg: { text(name: string): string | null } }>
  outline(book: unknown): { sheets: { name: string; used: string | null; tables?: string[]; head: unknown[] }[] }
  readRange(book: unknown, range: string, options?: { limit?: number }): Read
  applyEdits(bytes: Uint8Array, edits: unknown[], options?: { macro?: boolean; calcTimeoutMs?: number; calcLimitBytes?: number; sizeLimitBytes?: { formulas: number; values: number } }): Promise<Edited>
  prunedCalcChain(xml: string, gone: { sheetId: number; ref: string }[]): string
  fullCalcOnLoad(xml: string): string
}
const ox = (await import(/* @vite-ignore */ resolve(lib, 'xlsx-ooxml.mjs'))) as Ooxml

const records = (bytes: Uint8Array) => new Map(ox.readZip(bytes).entries.map((e) => [e.name, Buffer.from(e.record)]))
const read = async (bytes: Uint8Array, range: string) => ox.readRange(await ox.openBook(bytes), range)
const part = async (bytes: Uint8Array, name: string) => (await ox.openBook(bytes)).pkg.text(name)!
const wasOf = async (bytes: Uint8Array, range: string) => (await read(bytes, range)).was

describe('读:目录和区域', () => {
  test('目录:每张表的已用范围、冻结、合并、表格、第一行;区域:cells 是人会敲的,shown 是表上显示的,was 是这块的指纹', async () => {
    const book = await ox.openBook(sales)
    const all = ox.outline(book)
    expect(all.sheets.map((s) => [s.name, s.used])).toEqual([['销售', 'A1:K9'], ['2024 预算', 'A1:B4'], ['Hidden', 'A1']])
    expect(all.sheets[0]!.tables).toEqual(['Table1 I1:K3'])
    const one = ox.readRange(book, '销售!A1:E3')
    expect(one.range).toBe('销售!A1:E3')
    expect(one.was).toMatch(/^销售!A1:E3@[0-9a-f]{8}$/)
    expect(one.cells).toEqual([
      ['地区', 'Q1', 'Q2', '合计', '增长'],
      ['华东', 1200, 1350, '=B2+C2', '=(C2-B2)/B2'],
      ['华南', 900, 1010, '=B3+C3', null],
    ])
    expect(one.shown).toMatchObject({ B2: '1,200', D2: '2,550', E2: '13%', D3: '1,910' })
    // The sheet can be left out only when the workbook has one sheet; this one has three.
    expect(() => ox.readRange(book, 'A1:B2')).toThrow(/say which sheet — this workbook has 3: 销售, '2024 预算', Hidden/)
    expect(() => ox.readRange(book, '利润!A1')).toThrow(/no sheet "利润"/)
  })

  test('一次最多给 limit 格,more 是接着读的那块', async () => {
    const book = await ox.openBook(sales)
    const page = ox.readRange(book, '销售!A:D', { limit: 12 })
    expect(page.range).toBe('销售!A1:D3')
    expect(page.more).toBe('销售!A4:D9')
    expect(ox.readRange(book, page.more!, { limit: 100 }).more).toBeUndefined()
    // A whole column is the rows the sheet uses; a sheet's name alone is its used range.
    expect(ox.readRange(book, '销售!C:C').range).toBe('销售!C1:C9')
    expect(ox.readRange(book, "'2024 预算'").range).toBe("'2024 预算'!A1:B4")
  })
})

describe('写:只换被写的格子,其余逐字节不动', () => {
  test('改一个值、写一个公式、在末尾加两行:只有 sheet1.xml 和 workbook.xml 变了;sheet1 里没写到的字节都在', async () => {
    const was = await wasOf(sales, '销售!A1:G9')
    const done = await ox.applyEdits(sales, [
      { range: '销售!B2', was, cells: [[1500]] },
      { range: '销售!D3', was, cells: '=B3+C3+100' },
      { range: '销售!A10:C11', cells: [['新区', 1, { date: '2024-03-05' }], [null, 'x < y & z', true]] },
    ])
    expect(done.parts.sort()).toEqual(['xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'])
    const before = records(sales)
    const after = records(done.bytes)
    expect([...after.keys()]).toEqual([...before.keys()])
    for (const [name, record] of after) if (!done.parts.includes(name)) expect(record.equals(before.get(name)!), name).toBe(true)
    expect(done.unchangedEntries).toBe(12)
    // The sheet: only rows 2, 3, 6 (totals recalculated) and the new 10–11 differ; before row 2 and after row 9 the file's own.
    const oldXml = await part(sales, 'xl/worksheets/sheet1.xml')
    const newXml = await part(done.bytes, 'xl/worksheets/sheet1.xml')
    const row = (xml: string, n: number) => xml.match(new RegExp(`<row r="${n}"[\\s\\S]*?</row>`))![0]
    // Before row 2, only the dimension changed (it takes in rows 10–11 now).
    expect(newXml.slice(0, newXml.indexOf('<row r="2"'))).toBe(oldXml.slice(0, oldXml.indexOf('<row r="2"')).replace('<dimension ref="A1:K9"/>', '<dimension ref="A1:K11"/>'))
    for (const n of [1, 4, 5, 8, 9]) expect(row(newXml, n)).toBe(row(oldXml, n))
    expect(newXml.slice(newXml.indexOf('</sheetData>'))).toBe(oldXml.slice(oldXml.indexOf('</sheetData>')))
    // Text inline (sharedStrings untouched), escaped; the new formula with its result; the date given its serial.
    expect(row(newXml, 11)).toContain('<c r="B11" t="inlineStr"><is><t>x &lt; y &amp; z</t></is></c>')
    expect(row(newXml, 3)).toContain('<c r="D3" s="2"><f>B3+C3+100</f><v>2010</v></c>')
    expect(row(newXml, 10)).toContain('<c r="C10" s="3"><v>45356</v></c>')
    expect(newXml).toContain('<dimension ref="A1:K11"/>')
    expect(await part(done.bytes, 'xl/workbook.xml')).toContain('<calcPr calcId="191029" fullCalcOnLoad="1"/>')
    // What reads the cells written: recalculated, the new results stored — on the other sheet too.
    expect(done.recalc).toMatchObject({ recalculated: 7, uncomputed: 0 })
    expect((await read(done.bytes, '销售!B2:G6')).shown).toMatchObject({ D2: '2,850', E2: '-10%', G2: '3,000', D3: '2,010', B6: '3,570', D6: '7,250' })
    expect((await read(done.bytes, "'2024 预算'!A2")).shown).toMatchObject({ A2: '7,250' })
    const back = await read(done.bytes, '销售!A10:C11')
    expect(back.cells).toEqual([['新区', 1, { date: '2024-03-05' }], [null, 'x < y & z', true]])
    expect(done.was['销售!A1:G9']).toBe(await wasOf(done.bytes, '销售!A1:G9'))
  })

  test('单元格和行按顺序插进去:行里两个新格在一个旧格之前、两个新行在一个旧行之前;自闭合的行得到格子;spans 跟着扩', async () => {
    const was = await wasOf(sales, '销售!A1:L9')
    const done = await ox.applyEdits(sales, [{ range: '销售!F2:F2', was, cells: [['f2']] }, { range: '销售!H2', was, cells: 'h2' }, { range: '销售!L2', was, cells: 'l2' }, { range: '销售!B7', was, cells: 7 }])
    const xml = await part(done.bytes, 'xl/worksheets/sheet1.xml')
    const row2 = xml.match(/<row r="2"[\s\S]*?<\/row>/)![0]
    expect([...row2.matchAll(/<c r="([A-Z]+)2"/g)].map((m) => m[1])).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
    expect(row2).toMatch(/^<row r="2" spans="1:12"/)
    expect(xml).toMatch(/<row r="7" spans="1:11" ht="30" customHeight="1" x14ac:dyDescent="0.25"><c r="B7"><v>7<\/v><\/c><\/row>/)
    const b = await ox.applyEdits(sales, [{ range: '销售!A15', cells: 'x15' }, { range: '销售!A12:A13', cells: [['x12'], ['x13']] }])
    const rows = [...(await part(b.bytes, 'xl/worksheets/sheet1.xml')).matchAll(/<row r="(\d+)"/g)].map((m) => Number(m[1]))
    expect(rows).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 15])
  })

  test('一个值填一整块:公式照 Ctrl+Enter 的规则逐格平移;形状不对说期望几行几列', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!F2:F5', cells: '=B2*2+$B$2' }])
    expect((await read(done.bytes, '销售!F2:F5')).cells).toEqual([['=B2*2+$B$2'], ['=B3*2+$B$2'], ['=B4*2+$B$2'], ['=B5*2+$B$2']])
    await expect(ox.applyEdits(sales, [{ range: '销售!F2:G3', cells: [[1, 2]] }])).rejects.toThrow(/2 rows × 2 columns: cells must be 2 arrays of 2 values/)
    await expect(ox.applyEdits(sales, [{ range: '销售!F2' }])).rejects.toThrow(/give cells/)
  })

  test('新函数存成带前缀的;以 = 开头的字写成字;控制字符和读不懂的公式拒绝', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!F2:F4', cells: [['=XLOOKUP(A2,A:A,B:B)'], ["'=not a formula"], ['=SORT(B2:B5)']] }])
    const xml = await part(done.bytes, 'xl/worksheets/sheet1.xml')
    expect(xml).toContain('<f>_xlfn.XLOOKUP(A2,A:A,B:B)</f>')
    expect(xml).toContain('<f>_xlfn._xlws.SORT(B2:B5)</f>')
    expect((await read(done.bytes, '销售!F2:F4')).cells).toEqual([['=XLOOKUP(A2,A:A,B:B)'], ["'=not a formula"], ['=SORT(B2:B5)']])
    await expect(ox.applyEdits(sales, [{ range: '销售!F2', cells: 'a\u0001b' }])).rejects.toThrow(/control character/)
    await expect(ox.applyEdits(sales, [{ range: '销售!F2', cells: '=SUM(B2:B5' }])).rejects.toThrow(/cannot be read — 1 \( never closed/)
    await expect(ox.applyEdits(sales, [{ range: '销售!F2', cells: Infinity }])).rejects.toThrow(/not a number Excel stores/)
  })
})

describe('写:乐观锁(was)', () => {
  test('读过的区域被人改过就拒(content-changed),什么都不写;区域外面改了不影响;往全空的格子写不用 was', async () => {
    const was = await wasOf(sales, '销售!A1:C3')
    const elsewhere = await ox.applyEdits(sales, [{ range: '销售!B5', was: await wasOf(sales, '销售!B5'), cells: 1 }])
    // Someone changed B5, outside A1:C3: the edit on A1:C3 still goes.
    await expect(ox.applyEdits(elsewhere.bytes, [{ range: '销售!B2', was, cells: 2 }])).resolves.toBeTruthy()
    const inside = await ox.applyEdits(sales, [{ range: '销售!C3', was: await wasOf(sales, '销售!C3'), cells: 1 }])
    const refused = await ox.applyEdits(inside.bytes, [{ range: '销售!B2', was, cells: 2 }]).catch((e: Error & { code?: string }) => e)
    expect(refused).toMatchObject({ code: 'content-changed' })
    expect((refused as Error).message).toMatch(/content-changed — 销售!A1:C3 was changed after you read it \(was [0-9a-f]{8}, now [0-9a-f]{8}\): read it again/)
    // A format alone is not a change of content: the fingerprint is the values and formulas.
    await expect(ox.applyEdits(sales, [{ range: '销售!B2', was: was.replace(/@.*$/, '@0000000x'), cells: 2 }])).rejects.toThrow(/is not one read gives/)
    await expect(ox.applyEdits(sales, [{ range: '销售!B2', cells: 2 }])).rejects.toThrow(/销售!B2 is not empty — read the range \(read\) and give its was/)
    await expect(ox.applyEdits(sales, [{ range: '销售!E5', was, cells: 2 }])).rejects.toThrow(/销售!E5 is not inside 销售!A1:C3/)
    await expect(ox.applyEdits(sales, [{ range: '销售!F20:G21', cells: 1 }])).resolves.toBeTruthy()
  })
})

describe('写:Excel 的规矩', () => {
  test('合并区里不是左上角的格子拒;数组公式只改一部分拒,整块改可以', async () => {
    const was = await wasOf(sales, '销售!A1:G9')
    await expect(ox.applyEdits(sales, [{ range: '销售!B8', was, cells: 1 }])).rejects.toThrow(/B8 is inside the merged area A8:D8 — write its top-left cell, A8/)
    await expect(ox.applyEdits(sales, [{ range: '销售!G3', was, cells: 1 }])).rejects.toThrow(/G3 is part of the array formula G2:G3 — change all of it/)
    const whole = await ox.applyEdits(sales, [{ range: '销售!G2:G3', was, cells: [[1], [2]] }])
    expect((await read(whole.bytes, '销售!G2:G3')).cells).toEqual([[1], [2]])
  })

  test('共享公式的主格被改:跟随格各自得到自己的公式,结果保留;calcChain 里删掉主格,带 i 的那项把 i 交给下一项', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!D2', was: await wasOf(sales, '销售!D2'), cells: 0 }])
    expect(done.parts.sort()).toEqual(['xl/calcChain.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'])
    const after = await read(done.bytes, '销售!D2:D5')
    expect(after.cells).toEqual([[0], ['=B3+C3'], ['=B4+C4'], ['=B5+C5']])
    expect(after.shown).toMatchObject({ D3: '1,910', D4: '1,460', D5: '930' })
    const xml = await part(done.bytes, 'xl/worksheets/sheet1.xml')
    expect(xml).toContain('<c r="D3" s="2"><f>B3+C3</f><v>1910</v></c>')
    expect(xml).not.toContain('si="0"')
    expect(await part(done.bytes, 'xl/calcChain.xml')).toContain('<calcChain xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><c r="D3" i="1"/><c r="D4"/>')
  })

  test('calcChain:只删不再是公式的格;sheet 号(i)沿到下一项', () => {
    const xml = '<calcChain><c r="A1" i="1"/><c r="A2"/><c r="B1" i="2"/><c r="B2"/></calcChain>'
    expect(ox.prunedCalcChain(xml, [{ sheetId: 1, ref: 'A1' }])).toBe('<calcChain><c r="A2" i="1"/><c r="B1" i="2"/><c r="B2"/></calcChain>')
    expect(ox.prunedCalcChain(xml, [{ sheetId: 2, ref: 'B2' }, { sheetId: 1, ref: 'B2' }])).toBe('<calcChain><c r="A1" i="1"/><c r="A2"/><c r="B1" i="2"/></calcChain>')
  })

  test('fullCalcOnLoad:加到 calcPr 上;没有 calcPr 就照 schema 的顺序放在 definedNames(或 sheets)后面;已有就不动', () => {
    expect(ox.fullCalcOnLoad('<workbook><sheets/><calcPr calcId="1"/></workbook>')).toBe('<workbook><sheets/><calcPr calcId="1" fullCalcOnLoad="1"/></workbook>')
    expect(ox.fullCalcOnLoad('<x:workbook><x:sheets></x:sheets><x:definedNames></x:definedNames><x:extLst/></x:workbook>')).toBe(
      '<x:workbook><x:sheets></x:sheets><x:definedNames></x:definedNames><x:calcPr fullCalcOnLoad="1"/><x:extLst/></x:workbook>',
    )
    const already = '<workbook><sheets/><calcPr fullCalcOnLoad="1"/></workbook>'
    expect(ox.fullCalcOnLoad(already)).toBe(already)
  })

  test('日期写进没有日期格式的格:找一个同字体、同填充、同边框的日期样式,没有就加一个(styles.xml 只多一个 xf)', async () => {
    const was = await wasOf(sales, '销售!A8:D8')
    const done = await ox.applyEdits(sales, [{ range: '销售!A8', was, cells: { date: '2024-03-05' } }])
    expect(done.parts).toContain('xl/styles.xml')
    const styles = await part(done.bytes, 'xl/styles.xml')
    expect(styles).toContain('<cellXfs count="8">')
    expect(styles).toContain('<xf numFmtId="14" applyNumberFormat="1" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs>')
    expect((await read(done.bytes, '销售!A8')).cells).toEqual([[{ date: '2024-03-05' }]])
    expect(done.notes).toEqual(expect.arrayContaining([expect.stringMatching(/now has one/)]))
    // A cell whose own style already has a date format: styles.xml untouched.
    const plain = await ox.applyEdits(sales, [{ range: '销售!B9', was: await wasOf(sales, '销售!B9'), cells: { date: '2025-01-02T09:30' } }])
    expect(plain.parts).not.toContain('xl/styles.xml')
  })

  test('表格的表头:改名同步到 tableN.xml;有公式用结构化引用指着这一列就拒,点名是哪个公式', async () => {
    const was = await wasOf(sales, '销售!I1:K3')
    const renamed = await ox.applyEdits(sales, [{ range: '销售!J1', was, cells: '件数' }])
    expect(renamed.parts.sort()).toEqual(['xl/tables/table1.xml', 'xl/worksheets/sheet1.xml'].concat(renamed.parts.includes('xl/workbook.xml') ? ['xl/workbook.xml'] : []).sort())
    expect(await part(renamed.bytes, 'xl/tables/table1.xml')).toContain('<tableColumn id="2" name="件数"/>')
    expect(renamed.notes).toEqual(expect.arrayContaining([expect.stringMatching(/renames column "数量" of table Table1 to "件数"/)]))
    await expect(ox.applyEdits(sales, [{ range: '销售!I1', was, cells: '价格' }])).rejects.toThrow(
      /I1 renames column "单价" of table Table1, and '2024 预算'!A3 =SUM\(Table1\[单价\]\) names that column — this script does not rewrite such formulas/,
    )
    await expect(ox.applyEdits(sales, [{ range: '销售!J1', was, cells: '单价' }])).rejects.toThrow(/has a column "单价" already/)
    await expect(ox.applyEdits(sales, [{ range: '销售!K1', was, cells: null }])).rejects.toThrow(/header of column "金额" of table Table1: give it a name/)
  })

  test('带宏的工作簿(.xlsm)只读;流式写出的包写回后改过的条目没有 data descriptor,其余原样;反斜杠条目名保留', async () => {
    await expect(ox.applyEdits(sales, [{ range: '销售!F2', cells: 1 }], { macro: true })).rejects.toThrow(/macro-enabled workbook \(.xlsm\) is read only/)
    const dd = fixture('xlsx-sales-dd.xlsx')
    const done = await ox.applyEdits(dd, [{ range: '销售!F2', cells: 1 }])
    const entries = ox.readZip(done.bytes).entries
    for (const e of entries) expect(Boolean(e.flags & 8), e.name).toBe(!done.parts.includes(e.name))
    const back = fixture('xlsx-backslash.xlsx')
    const b = await ox.applyEdits(back, [{ range: '销售!F2', cells: 1 }])
    expect(ox.readZip(b.bytes).entries.map((e) => e.name)).toEqual(ox.readZip(back).entries.map((e) => e.name))
    // Its entries keep their backslashed names; those not written, their bytes.
    const was = records(back)
    for (const [name, record] of records(b.bytes)) if (!b.parts.includes(name.replace(/\\/g, '/'))) expect(record.equals(was.get(name)!), name).toBe(true)
    expect((await read(b.bytes, '销售!F2')).cells).toEqual([[1]])
  })
})

// The same workbook with one part's text changed (to make a case the fixture does not have).
const zipper = (await import(/* @vite-ignore */ resolve(lib, 'ooxml-zip.mjs'))) as { readZip(b: Uint8Array): unknown; rewriteZip(zip: unknown, changed: Map<string, Buffer>): Buffer; entryText(zip: unknown, name: string): string }
/** The package with one entry saying (central directory and local header) it unpacks to `size` bytes, whatever it does. */
function forged(bytes: Uint8Array, name: string, size: number) {
  const out = Buffer.from(bytes)
  const entry = (zipper.readZip(out) as { entries: { name: string; local: number; central: Uint8Array }[] }).entries.find((e) => e.name === name)!
  out.writeUInt32LE(size, entry.local + 22)
  out.writeUInt32LE(size, entry.central.byteOffset - out.byteOffset + 24)
  return new Uint8Array(out)
}
async function variants(changes: Record<string, (xml: string) => string>) {
  const parts = new Map<string, Buffer>()
  for (const [name, change] of Object.entries(changes)) {
    const xml = await part(sales, name)
    const next = change(xml)
    expect(next).not.toBe(xml)
    parts.set(name, Buffer.from(next, 'utf8'))
  }
  return new Uint8Array(zipper.rewriteZip(zipper.readZip(sales), parts))
}
const variant = (name: string, change: (xml: string) => string) => variants({ [name]: change })

describe('写:语料回归撞到的(1,319 份真实与测试表,10-13)', () => {
  test('共享公式的主格带绝对引用($C$1):跟随格得到的公式一个字不错(不当成替换串里的 $1)', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('si="0">B2+C2</f>', 'si="0">B2+$C$1</f>'))
    const done = await ox.applyEdits(bytes, [{ range: '销售!D2', was: await wasOf(bytes, '销售!D2'), cells: 0 }])
    expect((await read(done.bytes, '销售!D3:D5')).cells).toEqual([['=B3+$C$1'], ['=B4+$C$1'], ['=B5+$C$1']])
  })

  test('新行插在一个也被改写的旧行前面:先改写旧行、再插新行,读回来都对', async () => {
    const first = await ox.applyEdits(sales, [{ range: '销售!A15', cells: 'x15' }])
    const done = await ox.applyEdits(first.bytes, [{ range: '销售!A13:A15', was: await wasOf(first.bytes, '销售!A13:A15'), cells: [['x13'], ['x14'], ['y15']] }])
    expect((await read(done.bytes, '销售!A13:A15')).cells).toEqual([['x13'], ['x14'], ['y15']])
    const rows = [...(await part(done.bytes, 'xl/worksheets/sheet1.xml')).matchAll(/<row r="(\d+)"/g)].map((m) => Number(m[1]))
    expect(rows.slice(-3)).toEqual([13, 14, 15])
  })

  test('行在文件里不按顺序(有的程序这么写,Excel 照开):照读、照改,别的行原地不动', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => {
      const row3 = xml.match(/<row r="3"[\s\S]*?<\/row>/)![0]
      const row4 = xml.match(/<row r="4"[\s\S]*?<\/row>/)![0]
      return xml.replace(row3 + row4, row4 + row3)
    })
    expect((await read(bytes, '销售!A3:B4')).cells).toEqual([['华南', 900], ['华北', 760]])
    const done = await ox.applyEdits(bytes, [{ range: '销售!B3', was: await wasOf(bytes, '销售!B3'), cells: 901 }])
    expect((await read(done.bytes, '销售!A3:B4')).cells).toEqual([['华南', 901], ['华北', 760]])
    expect(await part(done.bytes, 'xl/worksheets/sheet1.xml')).toMatch(/<row r="4"[\s\S]*?<\/row><row r="3"/)
  })

  test('别的格里有这里读不懂的公式(“” 引号):不挡这次改动;agent 自己写这种就拒', async () => {
    const bytes = await variant('xl/worksheets/sheet2.xml', (xml) => xml.replace('<f>税率*100</f>', '<f>税率*100&amp;“”</f>'))
    await expect(ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1 }])).resolves.toBeTruthy()
    await expect(ox.applyEdits(bytes, [{ range: '销售!F2', cells: '=A1&“x”' }])).rejects.toThrow(/"“" is not part of a formula \(straight quotes " for text\)/)
  })

  test('文字里原样写着 CR LF(1_49237):照 XML 的规矩读成 LF,和 Excel 一样;&#13; 写出来的 CR 照留', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/<c r="A9"[^>]*?(\/>|>[\s\S]*?<\/c>)/, '<c r="A9" t="inlineStr"><is><t>Joe\r\nLane\rNE&#13;MN</t></is></c>'))
    expect((await read(bytes, '销售!A9')).cells).toEqual([['Joe\nLane\nNE\rMN']])
  })

  test('表头改名、名字里有 $& 这种:原样写进 tableN.xml', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!J1', was: await wasOf(sales, '销售!I1:K3'), cells: '$&数量$1' }])
    expect(await part(done.bytes, 'xl/tables/table1.xml')).toContain('<tableColumn id="2" name="$&amp;数量$1"/>')
  })
})

describe('写:改动牵连的公式写回时重算(IronCalc,xlsx-calc.mjs)', () => {
  const xmlOf = async (bytes: Uint8Array, sheet: 1 | 2) => part(bytes, `xl/worksheets/sheet${sheet}.xml`)
  const cellXml = (xml: string, ref: string) => xml.match(new RegExp(`<c r="${ref}"[^>]*?(?:/>|>[\\s\\S]*?</c>)`))?.[0]

  test('改 B2:读它的公式重算、新结果存进去(跨表也是);结果没变的格一个字节不动', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!B2', was: await wasOf(sales, '销售!B2'), cells: 1500 }])
    expect(done.recalc).toMatchObject({ recalculated: 6, uncomputed: 0 })
    const s1 = await xmlOf(done.bytes, 1)
    expect(cellXml(s1, 'D2')).toBe('<c r="D2" s="2"><f t="shared" ref="D2:D5" si="0">B2+C2</f><v>2850</v></c>')
    expect(cellXml(s1, 'E2')).toBe('<c r="E2" s="5"><f>(C2-B2)/B2</f><v>-0.1</v></c>')
    expect(cellXml(s1, 'G2')).toBe('<c r="G2" s="2"><f t="array" ref="G2:G3">B2:B3*2</f><v>3000</v></c>')
    expect(cellXml(s1, 'D6')).toBe('<c r="D6" s="2"><f>SUM(D2:D5)</f><v>7150</v></c>')
    // Results that did not change: the file's own bytes (G3 = B3*2, the totals of C).
    const s0 = await xmlOf(sales, 1)
    for (const ref of ['G3', 'C6', 'D3']) expect(cellXml(s1, ref)).toBe(cellXml(s0, ref))
    expect(cellXml(await xmlOf(done.bytes, 2), 'A2')).toBe('<c r="A2" s="2"><f>SUM(销售!D2:D5)</f><v>7150</v></c>')
    for (const ref of ['A3', 'A4']) expect(cellXml(await xmlOf(done.bytes, 2), ref)).toBe(cellXml(await xmlOf(sales, 2), ref))
  })

  test('中文名字(税率)、表格引用(Table1[单价]):喂给 IronCalc 的那份改写成别名、普通区域,算得出来;文件里的公式一个字不动', async () => {
    const tax = await ox.applyEdits(sales, [{ range: "'2024 预算'!B1", was: await wasOf(sales, "'2024 预算'!B1"), cells: 0.2 }])
    expect(tax.recalc).toMatchObject({ recalculated: 1, uncomputed: 0 })
    expect(cellXml(await xmlOf(tax.bytes, 2), 'A4')).toBe('<c r="A4"><f>税率*100</f><v>20</v></c>')
    expect((await read(tax.bytes, "'2024 预算'!A4")).cells).toEqual([['=税率*100']])
    const [[i3]] = (await read(sales, '销售!I3')).cells as number[][]
    const price = await ox.applyEdits(sales, [{ range: '销售!I2', was: await wasOf(sales, '销售!I2'), cells: 20 }])
    expect(price.recalc).toMatchObject({ recalculated: 2, uncomputed: 0 })
    expect(cellXml(await xmlOf(price.bytes, 1), 'K2')).toBe('<c r="K2" s="6"><f>I2*J2</f><v>60</v></c>')
    expect(cellXml(await xmlOf(price.bytes, 2), 'A3')).toBe(`<c r="A3" s="6"><f>SUM(Table1[单价])</f><v>${20 + i3!}</v></c>`)
  })

  test('表格引用的各种写法照 Excel 读;读不出一片格子的(@ 在表外的行、没有的列或表、没有汇总行)照旧算不了,说准为什么', async () => {
    const formulas = ['=SUM(Table1[单价])', '=COUNTA(Table1[#Headers])', '=Table1[[#Totals],[单价]]', '=Table1[@单价]', '=SUM(Table1[不存在])', '=SUM(Foo[x])', '=Table1[@单价]*2']
    const [[i2, i3]] = [((await read(sales, '销售!I2:I3')).cells as number[][]).map((row) => row[0]!)]
    // F2:F7 down the sales sheet, the last one in L2 — on a row of Table1 (I1:K3), outside its columns: Excel reads I2.
    const done = await ox.applyEdits(sales, [
      { range: '销售!F2:F7', was: await wasOf(sales, '销售!F2:F7'), cells: formulas.slice(0, 6).map((f) => [f]) },
      { range: '销售!L2', cells: formulas[6] },
    ])
    expect(done.recalc!.notCalculated).toEqual([
      { ref: '销售!F4', why: 'table Table1 has no totals rows' },
      { ref: '销售!F5', why: 'it reads a row of table Table1 (@) from outside its rows' },
      { ref: '销售!F6', why: 'table Table1 has no column 不存在' },
      { ref: '销售!F7', why: 'there is no table Foo' },
    ])
    const s1 = await xmlOf(done.bytes, 1)
    expect(cellXml(s1, 'F2')).toBe(`<c r="F2"><f>SUM(Table1[单价])</f><v>${i2! + i3!}</v></c>`)
    expect(cellXml(s1, 'F3')).toBe('<c r="F3"><f>COUNTA(Table1[#Headers])</f><v>3</v></c>')
    expect(cellXml(s1, 'L2')).toBe(`<c r="L2"><f>Table1[@单价]*2</f><v>${i2! * 2}</v></c>`)
    for (const ref of ['F4', 'F5', 'F6', 'F7']) expect(cellXml(s1, ref)).not.toContain('<v>')
    // What the agent reads back is the formula as written.
    expect((await read(done.bytes, '销售!F2:F7')).cells).toEqual(formulas.slice(0, 6).map((f) => [f]))
    // A table whose last row is its totals row: the data stops above it; [#Totals] is that row.
    const totals = await variant('xl/tables/table1.xml', (xml) => xml.replace('ref="I1:K3"', 'ref="I1:K3" totalsRowCount="1"'))
    const sums = await ox.applyEdits(totals, [{ range: '销售!F2:F3', was: await wasOf(totals, '销售!F2:F3'), cells: [['=SUM(Table1[单价])'], ['=Table1[[#Totals],[单价]]']] }])
    const t1 = await xmlOf(sums.bytes, 1)
    expect([cellXml(t1, 'F2'), cellXml(t1, 'F3')]).toEqual([`<c r="F2"><f>SUM(Table1[单价])</f><v>${i2}</v></c>`, `<c r="F3"><f>Table1[[#Totals],[单价]]</f><v>${i3}</v></c>`])
  })

  test('易变函数(NOW)读到改动:算不了;往下读它的(合计、另一张表)一并拿掉 —— INDIRECT 能读到那张表的也当作读它;读别的表的照旧,存的结果原样', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml.replace('si="0">B2+C2</f>', 'si="0">B2+C2+NOW()*0</f>').replace('<c r="K3" s="6"><f>I3*J3</f><v>16</v></c>', '<c r="K3" s="6"><f>INDIRECT("I3")*J3</f><v>16</v></c><c r="L3" t="str"><f>INDIRECT("Hidden!A1")&amp;""</f><v>secret</v></c>'),
    )
    const done = await ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1500 }])
    const why = Object.fromEntries(done.recalc!.notCalculated!.map((x) => [x.ref, x.why]))
    expect(why).toMatchObject({ '销售!D2': 'NOW is volatile', '销售!D6': 'it reads a cell that could not be calculated', "'2024 预算'!A2": 'it reads a cell that could not be calculated', '销售!K3': 'it reads a cell that could not be calculated' })
    expect(why['销售!L3']).toBeUndefined()
    const s1 = await xmlOf(done.bytes, 1)
    expect(cellXml(s1, 'D2')).toBe('<c r="D2" s="2"><f t="shared" ref="D2:D5" si="0">B2+C2+NOW()*0</f></c>')
    expect(cellXml(s1, 'D6')).toBe('<c r="D6" s="2"><f>SUM(D2:D5)</f></c>')
    expect(cellXml(s1, 'K3')).toBe('<c r="K3" s="6"><f>INDIRECT("I3")*J3</f></c>')
    expect(cellXml(s1, 'L3')).toBe('<c r="L3" t="str"><f>INDIRECT("Hidden!A1")&amp;""</f><v>secret</v></c>')
    // B6 reads only B: recalculated.
    expect(cellXml(s1, 'B6')).toBe('<c r="B6" s="2"><f>SUM(B2:B5)</f><v>3570</v></c>')
    // An INDIRECT the edit changes, on the sheet of a volatile cell the edit does not reach: taken to read it.
    const near = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/(<row r="5"[\s\S]*?)<\/row>/, '$1<c r="L5"><f>NOW()*0+7</f><v>7</v></c><c r="M5"><v>1</v></c><c r="O5"><f>INDIRECT("L5")+M5</f><v>8</v></c></row>'))
    const o5 = await ox.applyEdits(near, [{ range: '销售!M5', was: await wasOf(near, '销售!M5'), cells: 2 }])
    expect(o5.recalc!.notCalculated).toEqual([{ ref: '销售!O5', why: 'it reads a volatile function' }])
    expect(cellXml(await xmlOf(o5.bytes, 1), 'O5')).toBe('<c r="O5"><f>INDIRECT("L5")+M5</f></c>')
  })

  test('OFFSET 照常算(评审 C3):改动碰不到它,存的结果原样;改到它读的那格,它和读它的照算出新结果;算不完(超时)它们一并拿掉', async () => {
    // M2 = 20 is read only by N1 = OFFSET(M1,1,0); O1 = N1*2.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml
        .replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>10</v></c><c r="N1"><f>OFFSET(M1,1,0)</f><v>20</v></c><c r="O1"><f>N1*2</f><v>40</v></c></row>')
        .replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="M2"><v>20</v></c></row>'),
    )
    const results = async (b: Uint8Array) => {
      const s1 = await xmlOf(b, 1)
      return [cellXml(s1, 'N1'), cellXml(s1, 'O1')]
    }
    const away = await ox.applyEdits(bytes, [{ range: '销售!Z50', cells: 1 }])
    expect(away.recalc).toMatchObject({ recalculated: 0, uncomputed: 0 })
    expect(await results(away.bytes)).toEqual(['<c r="N1"><f>OFFSET(M1,1,0)</f><v>20</v></c>', '<c r="O1"><f>N1*2</f><v>40</v></c>'])
    const edit = [{ range: '销售!M2', was: await wasOf(bytes, '销售!M2'), cells: 25 }]
    const near = await ox.applyEdits(bytes, edit)
    expect(near.recalc).toMatchObject({ recalculated: 2, uncomputed: 0 })
    expect(await results(near.bytes)).toEqual(['<c r="N1"><f>OFFSET(M1,1,0)</f><v>25</v></c>', '<c r="O1"><f>N1*2</f><v>50</v></c>'])
    const late = await ox.applyEdits(bytes, edit, { calcTimeoutMs: 1 })
    expect(late.recalc).toMatchObject({ skipped: expect.stringMatching(/^calculating took over/) })
    expect(await results(late.bytes)).toEqual(['<c r="N1"><f>OFFSET(M1,1,0)</f></c>', '<c r="O1"><f>N1*2</f></c>'])
  })

  test('OFFSET / INDIRECT 算不出来(或超时)时,读到的格子不知道:按它能读到的那几张表算 —— 别的表上的改动不碰它', async () => {
    // N3 = SUM(OFFSET(M1:M2,0,0,,)): IronCalc does not take the empty height and width; OFFSET stays on its base's sheet.
    const blind = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml
        .replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>10</v></c></row>')
        .replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="M2"><v>20</v></c></row>')
        .replace(/(<row r="3"[\s\S]*?)<\/row>/, '$1<c r="N3"><f>SUM(OFFSET(M1:M2,0,0,,))</f><v>30</v></c></row>'),
    )
    const n3 = async (b: Uint8Array) => cellXml(await xmlOf(b, 1), 'N3')
    const other = await ox.applyEdits(blind, [{ range: "'2024 预算'!B1", was: await wasOf(blind, "'2024 预算'!B1"), cells: 0.2 }])
    expect(await n3(other.bytes)).toBe('<c r="N3"><f>SUM(OFFSET(M1:M2,0,0,,))</f><v>30</v></c>')
    const same = await ox.applyEdits(blind, [{ range: '销售!Z50', cells: 1 }])
    expect(same.recalc!.notCalculated).toEqual([{ ref: '销售!N3', why: 'IronCalc cannot calculate it' }])
    expect(await n3(same.bytes)).toBe('<c r="N3"><f>SUM(OFFSET(M1:M2,0,0,,))</f></c>')
    // Calculating ran over: every OFFSET / INDIRECT formula reaching the sheets written goes — INDIRECT's text names its sheet.
    const named = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('<c r="K3" s="6"><f>I3*J3</f><v>16</v></c>', `<c r="K3" s="6"><f>INDIRECT("'2024 预算'!B1")*100</f><v>20</v></c>`))
    const k3 = async (b: Uint8Array) => cellXml(await xmlOf(b, 1), 'K3')
    // (B2 would reach '2024 预算' through A2 = SUM(销售!D2:D5); A9 no formula reads.)
    const here = await ox.applyEdits(named, [{ range: '销售!A9', was: await wasOf(named, '销售!A9'), cells: '大阪 支店' }], { calcTimeoutMs: 1 })
    expect(await k3(here.bytes)).toBe(`<c r="K3" s="6"><f>INDIRECT("'2024 预算'!B1")*100</f><v>20</v></c>`)
    const there = await ox.applyEdits(named, [{ range: "'2024 预算'!B1", was: await wasOf(named, "'2024 预算'!B1"), cells: 0.3 }], { calcTimeoutMs: 1 })
    expect(await k3(there.bytes)).toBe(`<c r="K3" s="6"><f>INDIRECT("'2024 预算'!B1")*100</f></c>`)
    // A text that may begin a sheet's name ("Hid"&Q6: Hidden), one not written at all (INDIRECT(Q7): any sheet), a table's
    // name ('2024 预算'!B3 = SUM(INDIRECT("Table1[单价]")): Table1's, on 销售) — each alone, nothing else reaching there.
    const late = { calcTimeoutMs: 1 }
    const begun = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/(<row r="6"[\s\S]*?)<\/row>/, '$1<c r="P6" t="str"><f>INDIRECT("Hid"&amp;Q6)</f><v>secret</v></c><c r="Q6" t="inlineStr"><is><t>den!A1</t></is></c></row>'))
    const hidden = await ox.applyEdits(begun, [{ range: 'Hidden!A1', was: await wasOf(begun, 'Hidden!A1'), cells: 'x' }], late)
    expect(cellXml(await xmlOf(hidden.bytes, 1), 'P6')).toBe('<c r="P6"><f>INDIRECT("Hid"&amp;Q6)</f></c>')
    const anywhere = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/(<row r="7"[\s\S]*?)<\/row>/, '$1<c r="P7" t="str"><f>INDIRECT(Q7)</f><v>secret</v></c><c r="Q7" t="inlineStr"><is><t>Hidden!A1</t></is></c></row>'))
    const hidden2 = await ox.applyEdits(anywhere, [{ range: 'Hidden!A1', was: await wasOf(anywhere, 'Hidden!A1'), cells: 'x' }], late)
    expect(cellXml(await xmlOf(hidden2.bytes, 1), 'P7')).toBe('<c r="P7"><f>INDIRECT(Q7)</f></c>')
    const tabled = await variant('xl/worksheets/sheet2.xml', (xml) => xml.replace(/(<c r="A3"[\s\S]*?<\/c>)/, '$1<c r="B3"><f>SUM(INDIRECT("Table1[单价]"))</f><v>20.5</v></c>'))
    // J2: Table1's, a column nothing on '2024 预算' names.
    const counted = await ox.applyEdits(tabled, [{ range: '销售!J2', was: await wasOf(tabled, '销售!J2'), cells: 4 }], late)
    expect(cellXml(await xmlOf(counted.bytes, 2), 'B3')).toBe('<c r="B3"><f>SUM(INDIRECT("Table1[单价]"))</f></c>')
  })

  test('改动碰不到的易变格(RAND)原样不动:它在模型里是存着的结果,两次计算之间不会无故变', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('<c r="K3" s="6"><f>I3*J3</f><v>16</v></c>', '<c r="K3" s="6"><f>RAND()</f><v>0.5</v></c>'))
    const done = await ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1500 }])
    expect(cellXml(await xmlOf(done.bytes, 1), 'K3')).toBe('<c r="K3" s="6"><f>RAND()</f><v>0.5</v></c>')
    expect(done.recalc).toMatchObject({ recalculated: 6, uncomputed: 0 })
  })

  test('原来没有结果的格,读到一格 IronCalc 和 Excel 算得不一样的公式:没得比,不写,显示成公式', async () => {
    // D3's stored result is not what IronCalc gets (1910); D6 = SUM(D2:D5) has none, and reads D3.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml.replace('<c r="D3" s="2"><f t="shared" si="0"/><v>1910</v></c>', '<c r="D3" s="2"><f t="shared" si="0"/><v>9999</v></c>').replace('<c r="D6" s="2"><f>SUM(D2:D5)</f><v>6850</v></c>', '<c r="D6" s="2"><f>SUM(D2:D5)</f></c>'),
    )
    const done = await ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1500 }])
    expect(Object.fromEntries(done.recalc!.notCalculated!.map((x) => [x.ref, x.why]))).toMatchObject({ '销售!D6': 'it reads a formula IronCalc and Excel calculate differently' })
    expect(cellXml(await xmlOf(done.bytes, 1), 'D6')).toBe('<c r="D6" s="2"><f>SUM(D2:D5)</f></c>')
    // D2 has its stored result, held to it and right: recalculated.
    expect(cellXml(await xmlOf(done.bytes, 1), 'D2')).toBe('<c r="D2" s="2"><f t="shared" ref="D2:D5" si="0">B2+C2</f><v>2850</v></c>')
  })

  test('有结果的格也一样(评审 C1):改动让它改读一格 IronCalc 和 Excel 算得不一样的公式 —— 新结果不写,拿掉;那一格照旧', async () => {
    // O1 = N1*2 stores 999 (IronCalc: 2); P1 = IF(M1>0,O1,0) stores 0, right while M1 is 0.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml.replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>0</v></c><c r="N1"><v>1</v></c><c r="O1"><f>N1*2</f><v>999</v></c><c r="P1"><f>IF(M1&gt;0,O1,0)</f><v>0</v></c></row>'),
    )
    const done = await ox.applyEdits(bytes, [{ range: '销售!M1', was: await wasOf(bytes, '销售!M1'), cells: 1 }])
    expect(done.recalc!.notCalculated).toEqual([{ ref: '销售!P1', why: 'it reads a formula IronCalc and Excel calculate differently' }])
    const s1 = await xmlOf(done.bytes, 1)
    expect(cellXml(s1, 'P1')).toBe('<c r="P1"><f>IF(M1&gt;0,O1,0)</f></c>')
    expect(cellXml(s1, 'O1')).toBe('<c r="O1"><f>N1*2</f><v>999</v></c>')
  })

  test('没有结果可对照的公式(agent 新写的):按原因拦,不按函数名 —— AVERAGE、TEXT 数字格式照写;区域放在只收一个值的地方、不精确的查找、查空格、HOUR 不写,说为什么', async () => {
    const formulas = ['=AVERAGE(B2:B5)', '=TEXT(B2,"0.0")', '=SUMPRODUCT((B2:B5>1000)*C2:C5)', '=VLOOKUP("华南",A2:B5,2)', '=VLOOKUP(L1,A2:B5,2,FALSE)', '=HOUR(B2)', '=SUM(OFFSET(B2:C3,0,0,,1))']
    const done = await ox.applyEdits(sales, [{ range: '销售!F2:F8', was: await wasOf(sales, '销售!F2:F8'), cells: formulas.map((f) => [f]) }])
    const why = ': IronCalc and Excel often differ there, and no stored result checks it'
    expect(done.recalc!.notCalculated).toEqual([
      { ref: '销售!F4', why: `it puts a range where one value goes${why}` },
      { ref: '销售!F5', why: `its lookup is not exact${why}` },
      { ref: '销售!F6', why: `it looks up an empty cell${why}` },
      { ref: '销售!F7', why: `it uses HOUR${why}` },
      { ref: '销售!F8', why: `its OFFSET leaves the height or width empty${why}` },
    ])
    const s1 = await xmlOf(done.bytes, 1)
    expect(cellXml(s1, 'F2')).toBe('<c r="F2"><f>AVERAGE(B2:B5)</f><v>817.5</v></c>')
    expect(cellXml(s1, 'F3')).toMatch(/^<c r="F3" t="str"><f>TEXT\(B2,"0\.0"\)<\/f><v>1200\.0<\/v><\/c>$/)
    for (const ref of ['F4', 'F5', 'F6', 'F7', 'F8']) expect(cellXml(s1, ref)).not.toContain('<v>')
  })

  test('没有结果可对照的公式:读到当日期读的文字、IronCalc 自己算出错误、1900 年 3 月以前的日期 —— 不写,说为什么', async () => {
    // L2 holds the text "11:00 PM": Excel reads it as a time in B2-TIME(…); IronCalc gives #VALUE!.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="L2" t="inlineStr"><is><t>11:00 PM</t></is></c></row>'))
    const formulas = ['=L2-TIME(0,30,0)', '=IF(B2>1000,B2/0,0)', '=DATE(1900,1,61)', '=B2-TIME(0,30,0)']
    const done = await ox.applyEdits(bytes, [{ range: '销售!F2:F5', was: await wasOf(bytes, '销售!F2:F5'), cells: formulas.map((f) => [f]) }])
    const why = ': IronCalc and Excel often differ there, and no stored result checks it'
    expect(done.recalc!.notCalculated).toEqual([
      { ref: '销售!F2', why: `it reads text as a date or time${why}` },
      { ref: '销售!F3', why: `IronCalc's result is #DIV/0!${why}` },
      { ref: '销售!F4', why: `its date is before 1 March 1900${why}` },
    ])
    const f5 = cellXml(await xmlOf(done.bytes, 1), 'F5')!
    expect(f5).toMatch(/^<c r="F5"><f>B2-TIME\(0,30,0\)<\/f><v>[\d.]+<\/v><\/c>$/)
    expect(Number(f5.match(/<v>([\d.]+)<\/v>/)![1])).toBeCloseTo(1200 - 30 / 1440, 9)
  })

  test('表里有藏起来的行:SUBTOTAL 不算它们,IronCalc 不知道哪几行藏了 —— 不写;SUM 照写', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/<row r="3"/, '<row r="3" hidden="1"'))
    const done = await ox.applyEdits(bytes, [{ range: '销售!F2:F3', was: await wasOf(bytes, '销售!F2:F3'), cells: [['=SUBTOTAL(109,B2:B5)'], ['=SUM(B2:B5)']] }])
    expect(done.recalc!.notCalculated).toEqual([{ ref: '销售!F2', why: 'it leaves out hidden rows, which IronCalc is not told of: IronCalc and Excel often differ there, and no stored result checks it' }])
    expect(cellXml(await xmlOf(done.bytes, 1), 'F3')).toBe('<c r="F3"><f>SUM(B2:B5)</f><v>3270</v></c>')
  })

  test('和存着的结果比:写文件的程序截短的数(27.83458333)、存成文字的错误、1E-16 的差,都算一样;整数不吞小数', async () => {
    const { same } = (await import(/* @vite-ignore */ resolve(lib, 'xlsx-calc.mjs'))) as { same(x: { t: string; v: unknown }, cached: unknown): boolean }
    expect(same({ t: 'n', v: 27.8345833333333 }, 27.83458333)).toBe(true)
    expect(same({ t: 'e', v: '#DIV/0!' }, '#DIV/0!')).toBe(true)
    expect(same({ t: 'n', v: 0 }, 1.22514845490862e-16)).toBe(true)
    expect(same({ t: 'n', v: 3.4 }, 3)).toBe(false)
    // A whole number is not one a program rounded (评审): 8 digits or more, still held to the last unit.
    expect(same({ t: 'n', v: 10000000.49 }, 10000000)).toBe(false)
    expect(same({ t: 'n', v: 123456789.4 }, 123456789)).toBe(false)
    expect(same({ t: 'n', v: 27.8345 }, 27.83458333)).toBe(false)
    expect(same({ t: 'n', v: 0 }, 1e-12)).toBe(false)
  })

  test('跨一串表的引用(销售:Hidden!B9):读的是每张表的那一格;改动碰到它们才拿掉旧结果 —— IronCalc 算不对它(SUM 是错误,COUNT 是个错的数)', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('<c r="K3" s="6"><f>I3*J3</f><v>16</v></c>', '<c r="K3" s="6"><f>SUM(销售:Hidden!B9)</f><v>45352</v></c><c r="L3"><f>COUNT(销售:Hidden!B9)</f><v>1</v></c>'))
    const k3l3 = async (b: Uint8Array) => {
      const s1 = await xmlOf(b, 1)
      return [cellXml(s1, 'K3'), cellXml(s1, 'L3')]
    }
    const away = await ox.applyEdits(bytes, [{ range: '销售!A1', was: await wasOf(bytes, '销售!A1'), cells: '地区2' }])
    expect(away.recalc).toMatchObject({ uncomputed: 0 })
    expect(await k3l3(away.bytes)).toEqual(['<c r="K3" s="6"><f>SUM(销售:Hidden!B9)</f><v>45352</v></c>', '<c r="L3"><f>COUNT(销售:Hidden!B9)</f><v>1</v></c>'])
    const near = await ox.applyEdits(bytes, [{ range: '销售!B9', was: await wasOf(bytes, '销售!B9'), cells: 1 }])
    const why = 'it reads a range of sheets (销售:Hidden!), which IronCalc cannot calculate'
    expect(near.recalc!.notCalculated).toEqual([{ ref: '销售!K3', why }, { ref: '销售!L3', why }])
    expect(await k3l3(near.bytes)).toEqual(['<c r="K3" s="6"><f>SUM(销售:Hidden!B9)</f></c>', '<c r="L3"><f>COUNT(销售:Hidden!B9)</f></c>'])
    // Sheet names IronCalc reads (Budget:Hidden): its COUNT is a number — 0 whatever the cells hold — not an error. Excel's
    // is 1 once Budget!B9 holds one: taken away all the same.
    const wb = (await part(sales, 'xl/workbook.xml')).replace('name="2024 预算"', 'name="Budget"')
    const s1 = (await part(sales, 'xl/worksheets/sheet1.xml')).replace('<c r="K3" s="6"><f>I3*J3</f><v>16</v></c>', '<c r="K3" s="6"><f>I3*J3</f><v>16</v></c><c r="L3"><f>COUNT(Budget:Hidden!B9)</f><v>0</v></c>')
    expect(wb).toContain('name="Budget"')
    const ascii = new Uint8Array(zipper.rewriteZip(zipper.readZip(sales), new Map([['xl/workbook.xml', Buffer.from(wb, 'utf8')], ['xl/worksheets/sheet1.xml', Buffer.from(s1, 'utf8')]])))
    const counted = await ox.applyEdits(ascii, [{ range: 'Budget!B9', cells: 1 }])
    expect(counted.recalc!.notCalculated).toEqual(expect.arrayContaining([{ ref: '销售!L3', why: 'it reads a range of sheets (Budget:Hidden!), which IronCalc cannot calculate' }]))
    expect(cellXml(await xmlOf(counted.bytes, 1), 'L3')).toBe('<c r="L3"><f>COUNT(Budget:Hidden!B9)</f></c>')
  })

  test('IronCalc 和 Excel 对原表算得不一样(存的结果对不上):新结果也不信,拿掉,往下的一并拿掉', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('<f t="shared" ref="D2:D5" si="0">B2+C2</f><v>2550</v>', '<f t="shared" ref="D2:D5" si="0">B2+C2</f><v>9999</v>'))
    const done = await ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1500 }])
    const why = Object.fromEntries(done.recalc!.notCalculated!.map((x) => [x.ref, x.why]))
    expect(why).toMatchObject({ '销售!D2': 'IronCalc and Excel calculate it differently', '销售!D6': 'it reads a formula IronCalc and Excel calculate differently' })
    expect(cellXml(await xmlOf(done.bytes, 1), 'D2')).toBe('<c r="D2" s="2"><f t="shared" ref="D2:D5" si="0">B2+C2</f></c>')
  })

  test('日期从 1904 年算的表(老的 Mac Excel):IronCalc 从 1900 年算,日期会差四年 —— 牵连到的一律算不了', async () => {
    const bytes = await variant('xl/workbook.xml', (xml) => xml.replace('<workbookPr defaultThemeVersion="166925"/>', '<workbookPr date1904="1" defaultThemeVersion="166925"/>'))
    const done = await ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1500 }])
    expect(done.recalc).toMatchObject({ recalculated: 0, uncomputed: 6 })
    expect(done.recalc!.notCalculated).toEqual(expect.arrayContaining([{ ref: '销售!D2', why: 'the workbook counts dates from 1904, the calculator from 1900' }]))
  })

  test('原文件里这格本来就没有结果(有的程序这么写):没得比,照算出来的写进去,算在 recalculated 里', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('<c r="D6" s="2"><f>SUM(D2:D5)</f><v>6850</v></c>', '<c r="D6" s="2"><f>SUM(D2:D5)</f></c>'))
    const done = await ox.applyEdits(bytes, [{ range: '销售!B2', was: await wasOf(bytes, '销售!B2'), cells: 1500 }])
    expect(done.recalc).toMatchObject({ recalculated: 6, uncomputed: 0 })
    expect(cellXml(await xmlOf(done.bytes, 1), 'D6')).toBe('<c r="D6" s="2"><f>SUM(D2:D5)</f><v>7150</v></c>')
  })

  test('整列、整行的引用交给 IronCalc 前裁到那张表的已用区域(它每次都会扫满 104 万行);跨表按那张表算;外部工作簿不动', async () => {
    const { clipped } = (await import(/* @vite-ignore */ resolve(lib, 'xlsx-calc.mjs'))) as { clipped(f: string, s: number, extents: { rows: number; cols: number }[], at: Map<string, number>): string }
    const at = new Map([['销售', 0], ['2024 预算', 1]])
    const extents = [{ rows: 9, cols: 11 }, { rows: 4, cols: 2 }]
    expect(clipped("SUMIFS('2024 预算'!B:B,$A:$A,\"x\")+COUNT(3:4)", 0, extents, at)).toBe("SUMIFS('2024 预算'!B1:B4,A1:A9,\"x\")+COUNT(A3:K4)")
    expect(clipped('SUM(D:C)', 1, extents, at)).toBe('SUM(C1:D4)')
    expect(clipped("SUM('[1]Other'!A:A)+B2", 0, extents, at)).toBe("SUM('[1]Other'!A:A)+B2")
  })

  test('表太大(表的 XML 过了上限):不算,和超时一样 —— 往下读写到的格的公式旧结果拿掉,说为什么', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!B2', was: await wasOf(sales, '销售!B2'), cells: 1500 }], { calcLimitBytes: 1000 })
    expect(done.recalc).toMatchObject({ skipped: expect.stringMatching(/^the workbook's sheets are \d+ MB of XML, more than this script calculates \(0 MB\)$/), cleared: 6 })
    expect(cellXml(await xmlOf(done.bytes, 1), 'D2')).toBe('<c r="D2" s="2"><f t="shared" ref="D2:D5" si="0">B2+C2</f></c>')
    const roomy = await ox.applyEdits(sales, [{ range: '销售!B2', was: await wasOf(sales, '销售!B2'), cells: 1500 }], { calcLimitBytes: 1e6 })
    expect(roomy.recalc).toMatchObject({ recalculated: 6, uncomputed: 0 })
    // Who reads B2 without calculating: a box too big to index cell by cell, under its column (B2:B300) or wider than
    // that (a whole row, 2:2) — both found.
    const big = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><f>SUM(B2:B300)</f><v>3270</v></c><c r="N1"><f>SUM(2:2)</f><v>1</v></c><c r="O1"><f>SUM(C2:C300)</f><v>3580</v></c></row>'))
    const gone = await ox.applyEdits(big, [{ range: '销售!B2', was: await wasOf(big, '销售!B2'), cells: 1500 }], { calcLimitBytes: 1000 })
    const s1 = await xmlOf(gone.bytes, 1)
    expect([cellXml(s1, 'M1'), cellXml(s1, 'N1'), cellXml(s1, 'O1')]).toEqual(['<c r="M1"><f>SUM(B2:B300)</f></c>', '<c r="N1"><f>SUM(2:2)</f></c>', '<c r="O1"><f>SUM(C2:C300)</f><v>3580</v></c>'])
  })

  test('INDIRECT 读到一格 IronCalc 和 Excel 算得不一样的公式:索引里看不到,它能读到那张表就当作读到 —— 不写', async () => {
    // N1 = M1*2 stores 999 (IronCalc: 20); O1 = INDIRECT("N1")+M2 stores what IronCalc gets (25), so it alone is consistent.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml
        .replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>10</v></c><c r="N1"><f>M1*2</f><v>999</v></c><c r="O1"><f>INDIRECT("N1")+M2</f><v>25</v></c></row>')
        .replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="M2"><v>5</v></c></row>'),
    )
    const done = await ox.applyEdits(bytes, [{ range: '销售!M2', was: await wasOf(bytes, '销售!M2'), cells: 6 }])
    expect(done.recalc!.notCalculated).toEqual([{ ref: '销售!O1', why: 'it reads a formula IronCalc and Excel calculate differently' }])
    expect(cellXml(await xmlOf(done.bytes, 1), 'O1')).toBe('<c r="O1"><f>INDIRECT("N1")+M2</f></c>')
  })

  // 复评 95a903edab:找「谁读这格」把那格设成错误再算一次,结果没变就当没读 —— IFERROR 吞掉错误、SUMIF 的条件错误值也不中、
  // ISNUMBER 对错误值和文字一样是 FALSE:读了也看不出变化,于是写出从对不上的那格算出来的数(O1 写成 1,Excel 是 151)。
  test('INDIRECT 读到对不上的公式,而那格设成错误也看不出变化(IFERROR、条件不中的 SUMIF、ISNUMBER):照样不写', async () => {
    // N1 = M2*1 stores 150 (IronCalc: 0); N2 = M2&"" stores the number 150 (IronCalc: the text "0"). Right while M1 > 150.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml
        .replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>200</v></c><c r="N1"><f>M2*1</f><v>150</v></c><c r="O1"><f>IF(M1&gt;150,0,IFERROR(INDIRECT("N1"),0)+1)</f><v>0</v></c></row>')
        .replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="M2"><v>0</v></c><c r="N2"><f>M2&amp;""</f><v>150</v></c><c r="O2"><f>IF(M1&gt;150,0,SUMIF(INDIRECT("N1"),"&gt;100"))+M1</f><v>200</v></c></row>')
        .replace(/(<row r="3"[\s\S]*?)<\/row>/, '$1<c r="O3"><f>IF(M1&gt;150,0,IF(ISNUMBER(INDIRECT("N2")),1000,M1))</f><v>0</v></c></row>')
        .replace(/(<row r="4"[\s\S]*?)<\/row>/, `$1<c r="O4"><f>INDIRECT("'2024 预算'!B1")*M1</f><v>26</v></c></row>`),
    )
    const done = await ox.applyEdits(bytes, [{ range: '销售!M1', was: await wasOf(bytes, '销售!M1'), cells: 120 }])
    const why = 'it reads a formula IronCalc and Excel calculate differently'
    expect(Object.fromEntries(done.recalc!.notCalculated!.map((x) => [x.ref, x.why]))).toEqual({ '销售!O1': why, '销售!O2': why, '销售!O3': why })
    const s1 = await xmlOf(done.bytes, 1)
    expect([cellXml(s1, 'O1'), cellXml(s1, 'O2'), cellXml(s1, 'O3')]).toEqual([
      '<c r="O1"><f>IF(M1&gt;150,0,IFERROR(INDIRECT("N1"),0)+1)</f></c>',
      '<c r="O2"><f>IF(M1&gt;150,0,SUMIF(INDIRECT("N1"),"&gt;100"))+M1</f></c>',
      '<c r="O3"><f>IF(M1&gt;150,0,IF(ISNUMBER(INDIRECT("N2")),1000,M1))</f></c>',
    ])
    // Reading another sheet, where nothing disagrees: calculated (0.13 × 120).
    expect(cellXml(s1, 'O4')).toBe(`<c r="O4"><f>INDIRECT("'2024 预算'!B1")*M1</f><v>15.6</v></c>`)
  })

  // 复评 d218e73379:数组公式只从首格找起 —— 读成员格的、只有成员格对不上的、易变数组的成员格,都写出了错数。
  test('数组公式的每一格都算:读到对不上的成员格、只有成员格对不上的数组、易变数组的成员格 —— 都不写', async () => {
    // R1:R2 are 0. Q1:Q2 {=R1:R2*1} stores 150, 150 (IronCalc: 0, 0); T1:T2 the same but stores 0, 150 (only T2 off);
    // V1:V2 {=R1:R2+5+NOW()*0} stores 5, 5. S2, U1, W2 read Q2, T2, V2 — right while M1 > 150.
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml
        .replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>200</v></c><c r="Q1"><f t="array" ref="Q1:Q2">R1:R2*1</f><v>150</v></c><c r="R1"><v>0</v></c><c r="T1"><f t="array" ref="T1:T2">R1:R2*1</f><v>0</v></c><c r="U1"><f>IF(M1&gt;150,0,T2+1)</f><v>0</v></c><c r="V1"><f t="array" ref="V1:V2">R1:R2+5+NOW()*0</f><v>5</v></c></row>')
        .replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="Q2"><v>150</v></c><c r="R2"><v>0</v></c><c r="S2"><f>IF(M1&gt;150,0,Q2+1)</f><v>0</v></c><c r="T2"><v>150</v></c><c r="V2"><v>5</v></c><c r="W2"><f>IF(M1&gt;150,0,V2+1)</f><v>0</v></c></row>'),
    )
    const done = await ox.applyEdits(bytes, [{ range: '销售!M1', was: await wasOf(bytes, '销售!M1'), cells: 120 }])
    const off = 'it reads a formula IronCalc and Excel calculate differently'
    expect(Object.fromEntries(done.recalc!.notCalculated!.map((x) => [x.ref, x.why]))).toMatchObject({ '销售!S2': off, '销售!U1': off, '销售!W2': 'it reads a volatile function' })
    const s1 = await xmlOf(done.bytes, 1)
    expect([cellXml(s1, 'S2'), cellXml(s1, 'U1'), cellXml(s1, 'W2')]).toEqual([
      '<c r="S2"><f>IF(M1&gt;150,0,Q2+1)</f></c>',
      '<c r="U1"><f>IF(M1&gt;150,0,T2+1)</f></c>',
      '<c r="W2"><f>IF(M1&gt;150,0,V2+1)</f></c>',
    ])
  })

  // 复评 d218e73379:INDIRECT 的字是名字或表格引用,IronCalc 给 #REF!,当结果写进去了(Excel 是 14、20.5)。
  test('OFFSET / INDIRECT 算出存值以外的错误(INDIRECT 的字是名字、表格引用):算不了,不写;agent 新写的也一样;写明工作表的照算', async () => {
    const bytes = await variant('xl/worksheets/sheet1.xml', (xml) =>
      xml
        .replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="M1"><v>200</v></c><c r="X1"><f>IF(M1&gt;150,0,INDIRECT("税率")*100+1)</f><v>0</v></c></row>')
        .replace(/(<row r="2"[\s\S]*?)<\/row>/, '$1<c r="X2"><f>IF(M1&gt;150,0,SUM(INDIRECT("Table1[单价]")))</f><v>0</v></c></row>')
        .replace(/(<row r="4"[\s\S]*?)<\/row>/, `$1<c r="X4"><f>IF(M1&gt;150,0,INDIRECT("'2024 预算'!B1")*100+1)</f><v>0</v></c></row>`),
    )
    const done = await ox.applyEdits(bytes, [
      { range: '销售!M1', was: await wasOf(bytes, '销售!M1'), cells: 120 },
      { range: '销售!X3', cells: '=INDIRECT("税率")*100' },
    ])
    const why = 'its INDIRECT gives an error here that Excel may not'
    expect(Object.fromEntries(done.recalc!.notCalculated!.map((x) => [x.ref, x.why]))).toEqual({ '销售!X1': why, '销售!X2': why, '销售!X3': why })
    const s1 = await xmlOf(done.bytes, 1)
    expect([cellXml(s1, 'X1'), cellXml(s1, 'X2'), cellXml(s1, 'X3'), cellXml(s1, 'X4')]).toEqual([
      '<c r="X1"><f>IF(M1&gt;150,0,INDIRECT("税率")*100+1)</f></c>',
      '<c r="X2"><f>IF(M1&gt;150,0,SUM(INDIRECT("Table1[单价]")))</f></c>',
      '<c r="X3"><f>INDIRECT("税率")*100</f></c>',
      `<c r="X4"><f>IF(M1&gt;150,0,INDIRECT("'2024 预算'!B1")*100+1)</f><v>14</v></c>`,
    ])
  })

  test('名字里的 OFFSET(随数据长的区域)、INDIRECT 的字是个名字:IronCalc 都算不了;读到的格子按名字指的那边算 —— 改到那里,存的旧结果拿掉', async () => {
    // Recent = OFFSET(销售!$M$2,0,0,3,1): M2:M4, which no formula names; N1 = SUM(Recent) stores 9.
    const grown = await variants({
      'xl/workbook.xml': (xml) => xml.replace('</definedNames>', '<definedName name="Recent">OFFSET(销售!$M$2,0,0,3,1)</definedName></definedNames>'),
      'xl/worksheets/sheet1.xml': (xml) =>
        [2, 3, 4].reduce((x, r) => x.replace(new RegExp(`(<row r="${r}"[\\s\\S]*?)</row>`), `$1<c r="M${r}"><v>${r}</v></c></row>`), xml.replace(/(<row r="1"[\s\S]*?)<\/row>/, '$1<c r="N1"><f>SUM(Recent)</f><v>9</v></c></row>')),
    })
    const sum = await ox.applyEdits(grown, [{ range: '销售!M3', was: await wasOf(grown, '销售!M3'), cells: 30 }])
    expect(sum.recalc!.notCalculated).toEqual([{ ref: '销售!N1', why: 'IronCalc cannot calculate it' }])
    expect(cellXml(await xmlOf(sum.bytes, 1), 'N1')).toBe('<c r="N1"><f>SUM(Recent)</f></c>')
    // P5 = INDIRECT("税率")*100 stores 13: its text is a name, on '2024 预算'.
    const named = await variant('xl/worksheets/sheet1.xml', (xml) => xml.replace(/(<row r="5"[\s\S]*?)<\/row>/, '$1<c r="P5"><f>INDIRECT("税率")*100</f><v>13</v></c></row>'))
    const done = await ox.applyEdits(named, [{ range: "'2024 预算'!B1", was: await wasOf(named, "'2024 预算'!B1"), cells: 0.2 }])
    expect(done.recalc!.notCalculated).toEqual([{ ref: '销售!P5', why: 'IronCalc cannot calculate it' }])
    expect(cellXml(await xmlOf(done.bytes, 1), 'P5')).toBe('<c r="P5"><f>INDIRECT("税率")*100</f></c>')
  })

  test('表大到这里不读也不改(XML 解开以后过了线,共享字符串也算):直接拒,说多大、为什么,什么都不读不写 —— 有公式的,改的线低一些', async () => {
    const edit = [{ range: '销售!B2', was: await wasOf(sales, '销售!B2'), cells: 1500 }]
    await expect(ox.applyEdits(sales, edit, { sizeLimitBytes: { formulas: 1000, values: 1e9 } })).rejects.toThrow(/^the workbook is 1 MB of XML unpacked, more than this script changes in a workbook with formulas \(0 MB\): change it in Excel or WPS — nothing was written; if it is saved back another way that does not recalculate formulas \(openpyxl, say\), the formulas' results are left empty or stale$/)
    await expect(ox.applyEdits(sales, edit, { sizeLimitBytes: { formulas: 1e9, values: 1000 } })).rejects.toThrow(/^the workbook is 1 MB of XML unpacked, more than this script reads or changes \(0 MB\): use Excel or WPS; if it is saved back another way that does not recalculate formulas \(openpyxl, say\), the formulas' results are left empty or stale$/)
    // Reading (read): the same line, before any part is read.
    await expect(ox.openBook(sales, 1000)).rejects.toThrow(/^the workbook is 1 MB of XML unpacked, more than this script reads or changes \(0 MB\)/)
    // Shared strings count with the sheets: small sheets, 2 MB of strings.
    const wordy = await variant('xl/sharedStrings.xml', (xml) => xml.replace(/<\/(?:\w+:)?sst>$/, (end) => `<si><t>${'x'.repeat(2_000_000)}</t></si>${end}`))
    await expect(ox.openBook(wordy, 1e6)).rejects.toThrow(/^the workbook is 3 MB of XML unpacked/)
    await expect(ox.openBook(sales, 1e6)).resolves.toBeTruthy()
    // No formula in it: only the higher line.
    const plain = await variants(Object.fromEntries(['xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'].map((name) => [name, (xml: string) => xml.replace(/<f[^>]*\/>|<f[^>]*>[^<]*<\/f>/g, '')])))
    const done = await ox.applyEdits(plain, [{ range: '销售!B2', was: await wasOf(plain, '销售!B2'), cells: 1500 }], { sizeLimitBytes: { formulas: 1000, values: 1e9 } })
    expect(done.changed).toEqual(['销售!B2'])
  })

  // 复评 95a903edab:起它的那边被杀(或崩了)以后,算的进程照算到完 —— 计时器在那边,一起没了。它自己看着:到期限,或起它
  // 的脚本不在了,就退出;看的是它自己的一个线程 —— 主线程正在 IronCalc 里算,一算几秒,轮不到计时器。
  const childPath = resolve(lib, 'xlsx-calc-child.mjs')
  // 1,500 SUMPRODUCTs over 1,500 rows: about 6 s to calculate twice (measured).
  const slowBook = () => {
    let rows = ''
    for (let r = 20; r < 1520; r++) rows += `<row r="${r}"><c r="M${r}"><v>${r % 97}</v></c><c r="N${r}"><f>SUMPRODUCT(($M$20:$M$1519&gt;M${r})*1)</f></c></row>`
    return variant('xl/worksheets/sheet1.xml', (xml) => xml.replace('</sheetData>', `${rows}</sheetData>`))
  }
  const slowSeeds = [{ sheet: '销售', r: 1, c: 1, was: null }]

  test('算的进程自带期限:到点就退出 —— 它正在 IronCalc 里算也一样', async () => {
    const { spawn } = await import('node:child_process')
    const slow = await slowBook()
    const child = spawn(process.execPath, ['--liftoff-only', childPath, '1000'], { stdio: ['pipe', 'ignore', 'pipe', 'ipc'], serialization: 'advanced' })
    const answers: unknown[] = []
    child.on('message', (answer) => answers.push(answer))
    const started = Date.now()
    child.send({ after: slow, seeds: slowSeeds })
    const code = await new Promise<number | null>((done) => child.once('close', (exit) => done(exit)))
    expect({ answers, ended: code !== 0 }).toEqual({ answers: [], ended: true })
    expect(Date.now() - started).toBeLessThan(4000)
  })

  test('起它的脚本不在了(崩了、被杀了):算的进程立刻跟着退出,不算到完、不等期限', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { spawnSync } = await import('node:child_process')
    const dir = mkdtempSync(resolve(tmpdir(), 'xlsx-calc-'))
    writeFileSync(resolve(dir, 'slow.xlsx'), await slowBook())
    // A script: starts it as recalculate() does (its deadline a minute off), says its pid, and is gone.
    const program = resolve(dir, 'program.mjs')
    writeFileSync(program, [
      "import { spawn } from 'node:child_process'",
      "import { readFileSync } from 'node:fs'",
      `const child = spawn(process.execPath, ['--liftoff-only', ${JSON.stringify(childPath)}, '60000'], { stdio: ['pipe', 'ignore', 'ignore', 'ipc'], serialization: 'advanced' })`,
      `child.send({ after: new Uint8Array(readFileSync(${JSON.stringify(resolve(dir, 'slow.xlsx'))})), seeds: ${JSON.stringify(slowSeeds)} })`,
      'console.log(child.pid)',
      'setTimeout(() => process.exit(0), 300)',
    ].join('\n'))
    const run = spawnSync(process.execPath, [program], { encoding: 'utf8', timeout: 30000 })
    expect(run.status, run.stderr).toBe(0)
    const pid = Number(run.stdout.trim())
    const alive = () => {
      try {
        process.kill(pid, 0)
        return true
      } catch {
        return false
      }
    }
    const gone = Date.now()
    while (alive() && Date.now() - gone < 10000) await new Promise((wait) => setTimeout(wait, 50))
    expect(alive()).toBe(false)
    expect(Date.now() - gone).toBeLessThan(2000)
  })

  test('算不完(超时):不留可能错的数 —— 往下读写到的格的公式,旧结果全拿掉', async () => {
    const done = await ox.applyEdits(sales, [{ range: '销售!B2', was: await wasOf(sales, '销售!B2'), cells: 1500 }], { calcTimeoutMs: 1 })
    expect(done.recalc).toMatchObject({ skipped: expect.stringMatching(/^calculating took over/), cleared: 6 })
    const s1 = await xmlOf(done.bytes, 1)
    expect(cellXml(s1, 'D2')).toBe('<c r="D2" s="2"><f t="shared" ref="D2:D5" si="0">B2+C2</f></c>')
    expect(cellXml(s1, 'G3')).toBe('<c r="G3" s="2"/>')
    expect(cellXml(await xmlOf(done.bytes, 2), 'A2')).toBe('<c r="A2" s="2"><f>SUM(销售!D2:D5)</f></c>')
  })

  // 10-13 产品面实撞:起它的 node 带着自己的 --import(当时是 App 程序的 gugu-program.mjs),算的那一边若照样带上,它在那里
  // 跑不通就抛错,每次改动都退回「拿掉旧结果」。算的进程只带自己的参数;这里起一个带 --import 的 node,那个 --import
  // 每跑一次记一行。
  test('起脚本的 node 带着别的参数(--import):算的进程不跑它,照样算得出来;算完它的内存跟着进程走', async () => {
    const { mkdtempSync, readFileSync: read, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { spawnSync } = await import('node:child_process')
    const { pathToFileURL } = await import('node:url')
    const dir = mkdtempSync(resolve(tmpdir(), 'xlsx-calc-'))
    const ran = resolve(dir, 'ran.txt')
    const preload = resolve(dir, 'preload.mjs')
    writeFileSync(preload, `import { appendFileSync } from 'node:fs'\nappendFileSync(${JSON.stringify(ran)}, process.pid + '\\n')\n`)
    const script = resolve(dir, 'edit.mjs')
    const edits = [{ range: '销售!B2', was: await wasOf(sales, '销售!B2'), cells: 1500 }]
    writeFileSync(script, [
      "import { readFileSync } from 'node:fs'",
      `const ox = await import(${JSON.stringify(pathToFileURL(resolve(lib, 'xlsx-ooxml.mjs')).href)})`,
      `const done = await ox.applyEdits(new Uint8Array(readFileSync(${JSON.stringify(resolve(__dirname, 'fixtures', 'xlsx-sales.xlsx'))})), ${JSON.stringify(edits)})`,
      'console.log(JSON.stringify({ pid: process.pid, recalc: done.recalc }))',
    ].join('\n'))
    const run = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, script], { encoding: 'utf8', timeout: 60000 })
    expect(run.status, run.stderr).toBe(0)
    const answer = JSON.parse(run.stdout) as { pid: number; recalc: Edited['recalc'] }
    expect(answer.recalc).toMatchObject({ recalculated: 6, uncomputed: 0 })
    // The --import ran where the script ran only, not where it calculated.
    expect(read(ran, 'utf8').trim().split('\n')).toEqual([String(answer.pid)])
  })
})

describe('scripts/xlsx.mjs: the skill\'s script, as an agent runs it in its own shell', () => {
  const script = resolve(appDir, 'skills/office/scripts/xlsx.mjs')
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'office-xlsx-'))
    writeFileSync(join(dir, 'book.xlsx'), sales)
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))
  // As the agent runs it: its own process (process.execPath here is node, as gugu-node is on a server), cwd its folder.
  // A minute at most: an apply that does not end (a calculating process left running) fails here, not in the agent's shell.
  const run = (...args: string[]) => {
    const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 60000 })
    return { status: r.status, out: r.stdout, err: r.stderr, json: () => JSON.parse(r.stdout) as Record<string, unknown> }
  }
  const book = () => readFileSync(join(dir, 'book.xlsx'))
  const edits = (list: unknown[], name = 'edits.json') => {
    writeFileSync(join(dir, name), JSON.stringify(list))
    return name
  }
  const wasAt = (range: string) => (run('read', 'book.xlsx', range).json() as unknown as Read).was

  test("a whole sheet whose name has a ! ('A!B', as a pill writes it): read whole, not cut at its !", () => {
    writeFileSync(join(dir, 'odd.xlsx'), readFileSync(resolve(__dirname, 'fixtures/xlsx-odd-names.xlsx')))
    const r = run('read', 'odd.xlsx', "'A!B'")
    expect(r.err).toBe('')
    expect(r.status).toBe(0)
    expect(JSON.stringify(r.json())).toContain('"A!B"')
  })

  test('no command: the usage, exit 1, nothing on stdout', () => {
    const r = run()
    expect(r.status).toBe(1)
    expect(r.out).toBe('')
    expect(r.err).toMatch(/^usage: xlsx\.mjs read <book\.xlsx> \[<range>\]/)
  })

  test('an older Node (no node:zlib crc32 before 22.2): one sentence naming gugu-node, exit 1, before the modules load', () => {
    const older = 'data:text/javascript,Object.defineProperty(process.versions,"node",{value:"22.1.0"})'
    const r = spawnSync(process.execPath, ['--import', older, script, 'read', 'book.xlsx'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
    expect(r.status).toBe(1)
    expect(r.stdout).toBe('')
    expect(r.stderr).toBe('this script needs Node 22.2 or later (this is 22.1.0): run it with gugu-node\n')
  })

  test('read: each sheet; read a range: its cells as typed, what the sheet shows, its was', () => {
    const all = run('read', 'book.xlsx')
    expect(all.status).toBe(0)
    expect(all.err).toBe('') // nothing else said: no warning about the modules' type (skills/office/package.json)
    expect((all.json().sheets as { name: string }[]).map((s) => s.name)).toEqual(['销售', '2024 预算', 'Hidden'])
    const one = run('read', 'book.xlsx', '销售!B2:D3').json() as unknown as Read
    expect(one.cells).toEqual([[1200, 1350, '=B2+C2'], [900, 1010, '=B3+C3']])
    expect(one.shown).toMatchObject({ B2: '1,200', D2: '2,550', D3: '1,910' })
    expect(one.was).toMatch(/^销售!B2:D3@[0-9a-f]{8}$/)
  })

  test('apply in place: the cell written, the formulas reading it recalculated and stored, the answer says so; the script ends', () => {
    const r = run('apply', 'book.xlsx', edits([{ range: '销售!B2', was: wasAt('销售!B2:C3'), cells: [[1500]] }]))
    expect(r.err).toBe('')
    expect(r.status).toBe(0)
    const done = r.json() as { changed: string[]; was: Record<string, string>; recalc: { recalculated: number; uncomputed: number; says: string } }
    expect(done.changed).toEqual(['销售!B2'])
    expect(done.was['销售!B2:C3']).toMatch(/^销售!B2:C3@[0-9a-f]{8}$/)
    expect(done.recalc).toMatchObject({ recalculated: 6, uncomputed: 0, says: 'recalculated 6 formulas reading what you wrote; their new results are stored' })
    expect((run('read', 'book.xlsx', '销售!B2:D2').json() as unknown as Read).shown).toMatchObject({ B2: '1,500', D2: '2,850' })
    expect(readdirSync(dir).sort()).toEqual(['book.xlsx', 'edits.json']) // nothing left beside it
  })

  test('-o writes the result elsewhere; the book is as it was', () => {
    const before = book()
    expect(run('apply', 'book.xlsx', edits([{ range: '销售!Z1', cells: 1 }]), '-o', 'out.xlsx').status).toBe(0)
    expect(book().equals(before)).toBe(true)
    expect((run('read', 'out.xlsx', '销售!Z1').json() as unknown as Read).cells).toEqual([[1]])
  })

  test('refused, said why in one sentence, exit 1, nothing written: a range changed since it was read, a merged area, a .xlsm, not JSON', () => {
    const before = book()
    const stale = wasAt('销售!B2:C3').replace(/@[0-9a-f]{8}$/, '@00000000')
    writeFileSync(join(dir, 'macro.xlsm'), sales)
    writeFileSync(join(dir, 'bad.json'), '[{')
    const cases: [string[], RegExp][] = [
      [['apply', 'book.xlsx', edits([{ range: '销售!B2', was: stale, cells: 1 }], 'stale.json')], /^content-changed — 销售!B2:C3 was changed after you read it \(was 00000000, now [0-9a-f]{8}\): read it again \(read\)/],
      [['apply', 'book.xlsx', edits([{ range: '销售!B8', was: wasAt('销售!A8:D8'), cells: 1 }], 'merged.json')], /merged area A8:D8/],
      [['apply', 'macro.xlsm', edits([{ range: '销售!F2', cells: 1 }], 'macro.json')], /^a macro-enabled workbook \(\.xlsm\) is read only here/],
      [['apply', 'book.xlsx', 'bad.json'], /^bad\.json is not JSON: /],
    ]
    for (const [args, said] of cases) {
      const r = run(...args)
      expect(r.status).toBe(1)
      expect(r.out).toBe('')
      expect(r.err).toMatch(said)
      expect(r.err.trim().split('\n')).toHaveLength(1)
    }
    expect(book().equals(before)).toBe(true)
    expect(readFileSync(join(dir, 'macro.xlsm')).equals(Buffer.from(sales))).toBe(true)
    expect(run('read', 'macro.xlsm', '销售!A1').json()).toMatchObject({ cells: [['地区']] })
    expect(readdirSync(dir).sort()).toEqual(['bad.json', 'book.xlsx', 'macro.json', 'macro.xlsm', 'merged.json', 'stale.json'])
  })

  test('too big to read here (its zip\'s directory says 150 MB of shared strings): refused before any of it is read', () => {
    const big = Buffer.from(sales)
    const strings = ox.readZip(sales).entries.find((e) => e.name === 'xl/sharedStrings.xml') as unknown as { central: Uint8Array }
    big.writeUInt32LE(150e6, big.indexOf(Buffer.from(strings.central)) + 24)
    writeFileSync(join(dir, 'big.xlsx'), big)
    for (const args of [['read', 'big.xlsx'], ['apply', 'big.xlsx', edits([{ range: '销售!Z1', cells: 1 }])]]) {
      const r = run(...args)
      expect(r.status).toBe(1)
      expect(r.err).toBe('the workbook is 151 MB of XML unpacked, more than this script reads or changes (100 MB): use Excel or WPS; if it is saved back another way that does not recalculate formulas (openpyxl, say), the formulas\' results are left empty or stale\n')
    }
  })

  // 复评 049551ec42:线看的是 zip 目录里写的大小 —— 写小了就放行,解开时又没有上限(197 MB 的表写成 1 KB:679 MB)。
  test('a workbook whose zip says a sheet is smaller than it unpacks to: read and apply refused, naming it, nothing written', () => {
    writeFileSync(join(dir, 'forged.xlsx'), forged(sales, 'xl/worksheets/sheet1.xml', 1000))
    const before = readFileSync(join(dir, 'forged.xlsx'))
    for (const args of [['read', 'forged.xlsx', '销售!A1'], ['apply', 'forged.xlsx', edits([{ range: '销售!Z1', cells: 1 }])]]) {
      const r = run(...args)
      expect(r.status).toBe(1)
      expect(r.err).toBe('xl/worksheets/sheet1.xml unpacks to more than the 1000 bytes its zip says: the file is damaged or forged\n')
    }
    expect(readFileSync(join(dir, 'forged.xlsx')).equals(before)).toBe(true)
  })
})
