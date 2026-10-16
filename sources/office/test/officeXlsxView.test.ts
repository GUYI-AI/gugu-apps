// @vitest-environment jsdom
// 咕咕办公打开群文件夹里的 .xlsx(表格设计说明 §2、§3):只画屏上的行列,
// 照电子表格的习惯选 —— 点一格、拖一片、Shift 扩选、⌘/Ctrl 加一处、点行号列标选整行整列、方向键(Esc、Enter 和浮条是页面的,
// officeXlsxPickBar);手机上点一下加一格、
// 长按再拖加一片;攒着的每一处带编号,点编号撤;每一处交成一个 pill(refOf:at 是 Excel 写法的整段地址),点 pill 回到那一处
// (reveal:切到那张表、框住那一片)。新版本原地换上，停在同一张表，变了的格子闪一下。用的是 fixtures/xlsx-sales.xlsx;
// pill 来回一圈用 fixtures/xlsx-odd-names.xlsx(openpyxl 生成：四张表 O'Neil、A!B、R&D、2024 预算,各有 B2:C2 合并)。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { until } from './support/awaitCondition'

const appDir = resolve(__dirname, '../app')
const sales = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/xlsx-sales.xlsx')))
const t = {
  xlsxLocale: 'zh_CN', xlsxNoSheets: '没有工作表', unpick: '去掉这一处',
  xlsxAbout: '关于这张表', xlsxPending: '有 {n} 个公式还没算出结果，用 Excel 或 WPS 打开时会算。', xlsxNotDrawn: '这张表里有 {what} 没画出来。', xlsxCharts: '{n} 张图表', xlsxPictures: '{n} 张图片', xlsxAnd: '、',
}

interface Pick { sheet: string; kind: string; r0: number; c0: number; r1: number; c1: number }
interface View {
  picks(): Pick[]
  clear(): void
  anchor(): null
  dragging(): boolean
  reveal(query: Record<string, string>): Promise<boolean | 'hidden'>
  keep(): unknown
  destroy(): void
}
interface XlsxView {
  mountXlsx(host: HTMLElement, bytes: Uint8Array, options: { t: typeof t; onPicks: (picks: Pick[]) => void; wanted?: () => boolean; previous?: View | null }): Promise<View | null>
  refOf(pick: Pick): { at: { range: string }; label: string }
}
interface Zipper {
  readZip(bytes: Uint8Array): { entries: { name: string }[] }
  entryText(zip: unknown, name: string): string
  rewriteZip(zip: unknown, changed: Map<string, Buffer>): Buffer
}
let view: XlsxView
let zipper: Zipper
beforeAll(async () => {
  // jsdom lays nothing out: the sheet's box is given a size, so the rows and columns on screen are some.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 900 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
  globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0)) as unknown as typeof requestAnimationFrame
  view = (await import(/* @vite-ignore */ resolve(appDir, 'xlsx-view.js'))) as XlsxView
  zipper = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/ooxml-zip.mjs'))) as Zipper
})
afterEach(() => vi.useRealTimers())

// The sheet's geometry, as the view lays it out for this file: row-number column 36 px, header 22 px; column A 89 px,
// B–D 75 px, the rest 64 px; rows 20 px (row 7: 40 px).
const HW = 36
const HH = 22
const lefts = [0, 89, 164, 239, 314, 378, 442, 506, 570, 634, 698, 762]
const tops = [0, 20, 40, 60, 80, 100, 120, 160, 180, 200, 220, 240, 260, 280, 300]
const at = (r: number, c: number) => ({ clientX: HW + lefts[c]! + 5, clientY: HH + tops[r]! + 5 })
const pointer = (type: string, init: Record<string, unknown>) => Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }), { pointerId: 1 })
const touch = (type: string, x: number, y: number) => Object.assign(new Event(type, { bubbles: true, cancelable: true }), { touches: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] })

// The fixture with its first sheet's XML changed (a case it does not have).
function sheetVariant(change: (xml: string) => string) {
  const zip = zipper.readZip(sales)
  const xml = zipper.entryText(zip, 'xl/worksheets/sheet1.xml')
  const next = change(xml)
  expect(next).not.toBe(xml)
  return new Uint8Array(zipper.rewriteZip(zip, new Map([['xl/worksheets/sheet1.xml', Buffer.from(next, 'utf8')]])))
}
// Scrolled to (left, top) px — jsdom keeps no scroll position — and drawn again (the next animation frame).
async function scrollTo(scroll: HTMLElement, left: number, top: number) {
  Object.defineProperty(scroll, 'scrollLeft', { configurable: true, writable: true, value: left })
  Object.defineProperty(scroll, 'scrollTop', { configurable: true, writable: true, value: top })
  scroll.dispatchEvent(new Event('scroll'))
  await new Promise((resolve) => setTimeout(resolve, 20))
}

async function mount(bytes = sales, host = document.createElement('div')) {
  const heard: Pick[][] = []
  const v = (await view.mountXlsx(host, bytes, { t, onPicks: (p) => heard.push(p) }))!
  const scroll = host.querySelector<HTMLElement>('.xlsx-scroll')!
  const click = (r: number, c: number, mods: Record<string, unknown> = {}) => {
    scroll.dispatchEvent(pointer('pointerdown', { ...at(r, c), ...mods }))
    scroll.dispatchEvent(pointer('pointerup', at(r, c)))
  }
  const drag = (from: [number, number], to: [number, number], mods: Record<string, unknown> = {}) => {
    scroll.dispatchEvent(pointer('pointerdown', { ...at(...from), ...mods }))
    scroll.dispatchEvent(pointer('pointermove', at(...to)))
    scroll.dispatchEvent(pointer('pointerup', at(...to)))
  }
  const said = () => v.picks().map((p) => view.refOf(p).label)
  return { host, v, scroll, click, drag, said, heard }
}

describe('咕咕办公 · .xlsx 画出来', () => {
  test('只画屏上的格子:值照数字格式显示;表头、行号;冻结的首行在自己那层;合并区画一格;表名栏只列能看的表', async () => {
    const { host, v } = await mount()
    const texts = [...host.querySelectorAll('.xlsx-main .xc')].map((el) => el.textContent)
    expect(texts).toEqual(expect.arrayContaining(['华东', '1,200', '2,550', '13%', '2024/3/1', '备注：Q3 & Q4 待补', '东京 支店']))
    // Row 1 is frozen: drawn in the frozen layer, not under it.
    expect([...host.querySelectorAll('.xlsx-ftop .xc')].map((el) => el.textContent)).toEqual(expect.arrayContaining(['地区', 'Q1', '单价']))
    expect(texts).not.toContain('地区')
    // The frozen row is paper under its cells: a row half scrolled under it does not show through its empty cells.
    const back = host.querySelector('.xlsx-ftop')!.firstElementChild as HTMLElement
    expect([back.className, back.style.left, back.style.top, back.style.height]).toEqual(['xlsx-back', '0px', '0px', '20px'])
    const merged = [...host.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === '备注：Q3 & Q4 待补')!
    expect(merged.style.width).toBe(`${lefts[4]}px`)
    expect([...host.querySelectorAll('.xlsx-colhead .xh')].map((el) => el.textContent).slice(0, 4)).toEqual(['A', 'B', 'C', 'D'])
    expect([...host.querySelectorAll('.xlsx-tab')].map((el) => el.textContent)).toEqual(['销售', '2024 预算'])
    // A note's cell is marked; a file's text never becomes markup.
    expect(host.querySelector('.xc.noted')!.getAttribute('title')).toBe('季度目标 > 1000')
    expect(host.querySelectorAll('.xlsx-main script, .xlsx-main b')).toHaveLength(0)
    v.destroy()
    expect(host.children).toHaveLength(0)
  })
})

describe('咕咕办公 · .xlsx 画出来(评审 9d887a6 补的)', () => {
  test('高合并区(C10:D30)的上沿滚出视野:还画着,上面那截藏在冻结行的纸下面', async () => {
    const bytes = sheetVariant((xml) =>
      xml
        .replace('<mergeCells count="1"><mergeCell ref="A8:D8"/></mergeCells>', '<mergeCells count="2"><mergeCell ref="A8:D8"/><mergeCell ref="C10:D30"/></mergeCells>')
        .replace('</sheetData>', '<row r="10"><c r="C10" t="inlineStr"><is><t>MERGED LABEL</t></is></c></row></sheetData>'),
    )
    const { host, scroll, v } = await mount(bytes)
    // Row 14 the first under the frozen row 1: 20 px rows but row 7 (40 px), so row 14's top is 280, scrolled 260.
    await scrollTo(scroll, 0, 260)
    const merged = [...host.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === 'MERGED LABEL')
    expect(merged).toBeTruthy()
    expect([merged!.style.top, merged!.style.height, merged!.style.width]).toEqual(['-80px', '420px', `${lefts[4]! - lefts[2]!}px`])
    v.destroy()
  })

  test('隐藏的行不画:第 4 行 hidden,它的格子和行号都没有', async () => {
    const { host, v } = await mount(sheetVariant((xml) => xml.replace('<row r="4" spans="1:11"', '<row r="4" hidden="1" spans="1:11"')))
    expect([...host.querySelectorAll('.xlsx-main .xc')].map((el) => el.textContent)).not.toContain('华北')
    expect([...host.querySelectorAll('.xlsx-rowhead .xh')].map((el) => el.textContent)).not.toContain('4')
    expect([...host.querySelectorAll('.xlsx-main .xc')].map((el) => el.textContent)).toContain('西部')
    v.destroy()
  })

  test('批注照 XML 的转义读:&apos; 和 &#10; 换行也对', async () => {
    const zip = zipper.readZip(sales)
    const xml = zipper.entryText(zip, 'xl/comments1.xml')
    const next = xml.replace('季度目标 &gt; 1000', 'it&apos;s &gt; 1000&#10;第二行')
    expect(next).not.toBe(xml)
    const { host, v } = await mount(new Uint8Array(zipper.rewriteZip(zip, new Map([['xl/comments1.xml', Buffer.from(next, 'utf8')]]))))
    expect(host.querySelector('.xc.noted')!.getAttribute('title')).toBe("it's > 1000\n第二行")
    v.destroy()
  })
})

describe('咕咕办公 · .xlsx 选区', () => {
  test('冻结的首行上点一格:框和编号画在冻结那层(滚动时留在那格上);首行下面一格的编号整个露在冻结行下面', async () => {
    const { click, host, v } = await mount()
    click(0, 3)
    expect([host.querySelectorAll('.xlsx-ftop .xlsx-mark').length, host.querySelectorAll('.xlsx-main .xlsx-mark').length]).toEqual([1, 0])
    const onFrozen = host.querySelector<HTMLElement>('.xlsx-ftop .xlsx-badge')!
    expect([onFrozen.style.left, onFrozen.style.top]).toEqual([`${lefts[3]}px`, '10px'])
    click(1, 1)
    // B2's corner is frozen row 1's bottom edge: its number sits 10 px lower, whole, on B2.
    const under = host.querySelector<HTMLElement>('.xlsx-main .xlsx-badge')!
    expect([under.style.left, under.style.top]).toEqual([`${lefts[1]}px`, '10px'])
    v.destroy()
  })

  test('点一格换掉、拖一片;Shift 扩选最后一块;⌘/Ctrl 加一处;编号撤一处;Esc 全撤', async () => {
    const { click, drag, said, v, host, scroll, heard } = await mount()
    click(1, 1)
    expect(said()).toEqual(['销售!B2'])
    click(2, 2)
    expect(said()).toEqual(['销售!C3'])
    drag([1, 1], [3, 3])
    expect(said()).toEqual(['销售!B2:D4'])
    click(4, 1, { shiftKey: true })
    expect(said()).toEqual(['销售!B2:B5'])
    click(5, 3, { metaKey: true })
    click(7, 2, { ctrlKey: true })
    expect(said()).toEqual(['销售!B2:B5', '销售!D6', '销售!A8'])
    expect(heard.at(-1)).toHaveLength(3)
    const badges = host.querySelectorAll<HTMLButtonElement>('.xlsx-badge')
    expect([...badges].map((b) => b.dataset.n)).toEqual(['1', '2', '3'])
    badges[1]!.click()
    expect(said()).toHaveLength(2)
    expect([...host.querySelectorAll<HTMLButtonElement>('.xlsx-badge')].map((b) => b.dataset.n)).toEqual(['1', '2'])
    // Esc is the page's (the bar's, app.js): the sheet leaves it.
    scroll.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(v.picks()).toHaveLength(2)
  })

  test('点列标选整列、行号选整行、左上角选整张表;方向键挪、Shift+方向键扩', async () => {
    const { scroll, said, v } = await mount()
    scroll.dispatchEvent(pointer('pointerdown', { clientX: HW + lefts[2]! + 5, clientY: 5 }))
    scroll.dispatchEvent(pointer('pointerup', { clientX: HW + lefts[2]! + 5, clientY: 5 }))
    expect(said()).toEqual(['销售!C:C'])
    scroll.dispatchEvent(pointer('pointerdown', { clientX: 5, clientY: HH + tops[5]! + 5 }))
    scroll.dispatchEvent(pointer('pointerup', { clientX: 5, clientY: HH + tops[5]! + 5 }))
    expect(said()).toEqual(['销售!6:6'])
    scroll.dispatchEvent(pointer('pointerdown', { clientX: 5, clientY: 5 }))
    scroll.dispatchEvent(pointer('pointerup', { clientX: 5, clientY: 5 }))
    expect(v.picks()[0]!.kind).toBe('sheet')
    expect(said()).toEqual(['销售'])
    v.clear()
    const key = (key: string, shiftKey = false) => scroll.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }))
    key('ArrowDown')
    key('ArrowRight')
    expect(said()).toEqual(['销售!B2'])
    key('ArrowRight', true)
    key('ArrowDown', true)
    expect(said()).toEqual(['销售!B2:C3'])
  })

  test('手机:点一下加一格,再点同一格撤;一根手指拖是滚动,不选;长按再拖加一片', async () => {
    vi.useFakeTimers()
    const { scroll, said, v } = await mount()
    const a = at(1, 1)
    scroll.dispatchEvent(touch('touchstart', a.clientX, a.clientY))
    scroll.dispatchEvent(touch('touchend', a.clientX, a.clientY))
    const b = at(2, 2)
    scroll.dispatchEvent(touch('touchstart', b.clientX, b.clientY))
    scroll.dispatchEvent(touch('touchend', b.clientX, b.clientY))
    expect(said()).toEqual(['销售!B2', '销售!C3'])
    scroll.dispatchEvent(touch('touchstart', a.clientX, a.clientY))
    scroll.dispatchEvent(touch('touchend', a.clientX, a.clientY))
    expect(said()).toEqual(['销售!C3'])
    // A drag at once: the sheet scrolls, nothing is picked.
    scroll.dispatchEvent(touch('touchstart', a.clientX, a.clientY))
    scroll.dispatchEvent(touch('touchmove', a.clientX, a.clientY + 60))
    vi.advanceTimersByTime(500)
    scroll.dispatchEvent(touch('touchend', a.clientX, a.clientY + 60))
    expect(v.picks()).toHaveLength(1)
    // A long press on a cell, then a drag: a range, added. The press draws its pick, which takes that cell's element out
    // of the page — the finger's next events still go to it (as on WebView 113, measured 10-13), and still count.
    const pressed = [...scroll.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === '1,200')!
    pressed.dispatchEvent(touch('touchstart', a.clientX, a.clientY))
    vi.advanceTimersByTime(400)
    expect(v.dragging()).toBe(true)
    expect(pressed.isConnected).toBe(false)
    const end = at(4, 3)
    const move = touch('touchmove', end.clientX, end.clientY)
    pressed.dispatchEvent(move)
    expect(move.defaultPrevented).toBe(true)
    pressed.dispatchEvent(touch('touchend', end.clientX, end.clientY))
    expect(said()).toEqual(['销售!C3', '销售!B2:D5'])
    expect(v.dragging()).toBe(false)
  })

  test('冻结 A 列、往右滚过以后,点冻结列里的格子:选中的是 A 列那格(不按滚过的距离挪)', async () => {
    const { click, said, scroll, v } = await mount(sheetVariant((xml) => xml.replace('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>', '<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>')))
    await scrollTo(scroll, 130, 0)
    click(1, 0)
    expect(said()).toEqual(['销售!A2'])
    v.destroy()
  })

  test('选区吞进它碰到的合并区,吞进来又碰到的也吞(要再扫一遍)', async () => {
    // C10:D10 is listed first: the drag B10→B12 touches only B12:C12, and growing over that reaches C10:D10.
    const { drag, said, v } = await mount(sheetVariant((xml) => xml.replace('<mergeCells count="1"><mergeCell ref="A8:D8"/></mergeCells>', '<mergeCells count="3"><mergeCell ref="A8:D8"/><mergeCell ref="C10:D10"/><mergeCell ref="B12:C12"/></mergeCells>')))
    drag([9, 1], [11, 1])
    expect(said()).toEqual(['销售!B10:D12'])
    v.destroy()
  })

  test('切到另一张表:攒的不清空,表名旁边写攒了几处', async () => {
    const { host, click, said } = await mount()
    click(1, 1)
    // 销售 freezes its first row; 2024 预算 freezes nothing: its own row 1 shows, not 销售's (10-13 A/B: 地区 Q1 Q2 over 税率).
    expect([...host.querySelectorAll('.xlsx-ftop .xc')].map((el) => el.textContent)).toContain('地区')
    host.querySelectorAll<HTMLButtonElement>('.xlsx-tab')[1]!.click()
    await until('2024 预算 is the sheet shown', () => host.querySelector('.xlsx-tab.current')!.textContent === '2024 预算')
    expect(host.querySelectorAll('.xlsx-ftop .xc, .xlsx-fleft .xc, .xlsx-fcorner .xc')).toHaveLength(0)
    expect([...host.querySelectorAll('.xlsx-main .xc')].map((el) => el.textContent)).toContain('税率')
    click(1, 0, { metaKey: true })
    expect(said()).toEqual(['销售!B2', "'2024 预算'!A2"])
    expect([...host.querySelectorAll('.xlsx-tab')].map((el) => el.textContent)).toEqual(['销售 ·1', '2024 预算 ·1'])
  })

  test('anchor() 恒为 null:表格不给浮条一处可贴(格子铺满面板，贴着选区会压住下一格),页面把浮条停在底部', async () => {
    const { click, v } = await mount()
    expect(v.anchor()).toBeNull()
    click(2, 2)
    expect(v.picks()).toHaveLength(1)
    expect(v.anchor()).toBeNull()
  })

  test('pill:refOf 交 Excel 写法的整段地址,at.range 和 label 是同一段;合并区按左上格，整列、整行、整张表照 Excel 写', async () => {
    const { click, drag, scroll, v } = await mount()
    const refs = () => v.picks().map((p) => view.refOf(p))
    click(1, 1)
    expect(refs()).toEqual([{ at: { range: '销售!B2' }, label: '销售!B2' }])
    drag([1, 1], [3, 3])
    expect(refs()).toEqual([{ at: { range: '销售!B2:D4' }, label: '销售!B2:D4' }])
    click(7, 2)
    expect(refs()).toEqual([{ at: { range: '销售!A8' }, label: '销售!A8' }])
    scroll.dispatchEvent(pointer('pointerdown', { clientX: HW + lefts[2]! + 5, clientY: 5 }))
    scroll.dispatchEvent(pointer('pointerup', { clientX: HW + lefts[2]! + 5, clientY: 5 }))
    expect(refs()[0]!.at).toEqual({ range: '销售!C:C' })
    scroll.dispatchEvent(pointer('pointerdown', { clientX: 5, clientY: 5 }))
    scroll.dispatchEvent(pointer('pointerup', { clientX: 5, clientY: 5 }))
    expect(refs()[0]!.at).toEqual({ range: '销售' })
    v.destroy()
  })

  test('reveal:切到那张表、框住那一片(合并区整块),下一次按下就撤;整张表只切表不框;读不出的地址、没有的表回 false', async () => {
    const { host, scroll, v } = await mount()
    const found = () => host.querySelector<HTMLElement>('.xlsx-found')
    const current = () => host.querySelector('.xlsx-tab.current')!.textContent
    expect(await v.reveal({ range: "'2024 预算'!A2" })).toBe(true)
    await until(`the sheet shown is ${'2024 预算'}`, () => current() === '2024 预算')
    await until('the place is framed', () => found() !== null)
    const a2 = [...host.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === '6,850')!
    expect([found()!.style.left, found()!.style.top, found()!.style.width, found()!.style.height]).toEqual([a2.style.left, a2.style.top, a2.style.width, a2.style.height])
    // A press anywhere on the sheet takes it away.
    scroll.dispatchEvent(pointer('pointerdown', at(5, 5)))
    scroll.dispatchEvent(pointer('pointerup', at(5, 5)))
    expect(found()).toBeNull()
    v.clear()
    // A merged area's top-left cell: the whole area framed (A8:D8, as the sheet draws it).
    expect(await v.reveal({ range: '销售!A8' })).toBe(true)
    await until(`the sheet shown is ${'销售'}`, () => current() === '销售')
    await until('the place is framed', () => found() !== null)
    expect(found()!.style.width).toBe(`${lefts[4]! - lefts[0]!}px`)
    expect(await v.reveal({ range: '2024 预算' })).toBe(true)
    await until(`the sheet shown is ${'2024 预算'}`, () => current() === '2024 预算')
    expect(found()).toBeNull()
    // The last pill's frame goes when the next one has no place (增量复核 c6f346c134): not left beside "not found".
    expect(await v.reveal({ range: "'2024 预算'!A2" })).toBe(true)
    await until('the place is framed', () => found() !== null)
    expect(await v.reveal({ range: '没有这张表!A1' })).toBe(false)
    expect(found()).toBeNull()
    expect(await v.reveal({ range: '销售!A1:B2:C3' })).toBe(false)
    expect(await v.reveal({})).toBe(false)
    expect(current()).toBe('2024 预算')
    // Past all the sheet draws — a legal address the file has no such rows or columns for (it shrank, or an agent wrote
    // it): no place, said, not a scroll to the edge (复核 156f72cb0e).
    expect(await v.reveal({ range: '销售!Z500' })).toBe(false)
    expect(await v.reveal({ range: '销售!XFD1' })).toBe(false)
    expect(await v.reveal({ range: '销售!A1048576' })).toBe(false)
    expect(current()).toBe('2024 预算')
    expect(found()).toBeNull()
    // Partly past it: framed as far as the sheet draws.
    expect(await v.reveal({ range: '销售!B2:B9999' })).toBe(true)
    await until('the place is framed', () => found() !== null)
    // A key moving the selection takes the frame away too.
    scroll.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(found()).toBeNull()
    v.destroy()
  })

  test('reveal:Excel 里隐藏的表回 hidden(页面说「在一张隐藏的表上」),不说找不到;后到的位置算数，先到的还在读表也不框', async () => {
    const zip = zipper.readZip(sales)
    const workbook = zipper.entryText(zip, 'xl/workbook.xml')
    const hiding = workbook.replace(/(<sheet [^>]*name="2024 预算")/, '$1 state="hidden"')
    expect(hiding).not.toBe(workbook)
    // And a sheet with no cells (a chartsheet, here one whose part is not there): listed, not hidden — not found.
    const withChart = hiding.replace('</sheets>', '<sheet name="图表1" sheetId="9" r:id="rIdNone"/></sheets>')
    expect(withChart).not.toBe(hiding)
    const hidden = new Uint8Array(zipper.rewriteZip(zip, new Map([['xl/workbook.xml', Buffer.from(withChart, 'utf8')]])))
    const { host, v } = await mount(hidden)
    expect(host.querySelectorAll('.xlsx-tab')).toHaveLength(0)
    expect(await v.reveal({ range: "'2024 预算'!A2" })).toBe('hidden')
    expect(await v.reveal({ range: '图表1' })).toBe(false)
    v.destroy()
    // Two places in a row: the second wins, though the first (another sheet) is still being read when it comes.
    const two = await mount()
    const first = two.v.reveal({ range: "'2024 预算'!A2" })
    const second = two.v.reveal({ range: '销售!C3' })
    expect(await second).toBe(true)
    expect(await first).toBe(true)
    const frame = two.host.querySelector<HTMLElement>('.xlsx-found')!
    expect(two.host.querySelector('.xlsx-tab.current')!.textContent).toBe('销售')
    const c3 = [...two.host.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === '1,010')!
    expect([frame.style.left, frame.style.top]).toEqual([c3.style.left, c3.style.top])
    two.v.destroy()
    // The first one's sheet will not read (its part is not in the file): not "cannot open" beside the second's frame —
    // the second is the answer now (复核 7be60855a). Alone, it says it cannot.
    const rels = zipper.entryText(zip, 'xl/_rels/workbook.xml.rels')
    const broken = new Uint8Array(zipper.rewriteZip(zip, new Map([
      ['xl/workbook.xml', Buffer.from(workbook.replace('</sheets>', '<sheet name="坏表" sheetId="9" r:id="rIdBad"/></sheets>'), 'utf8')],
      ['xl/_rels/workbook.xml.rels', Buffer.from(rels.replace('</Relationships>', '<Relationship Id="rIdBad" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet9.xml"/></Relationships>'), 'utf8')],
    ])))
    const bad = await mount(broken)
    const late = bad.v.reveal({ range: '坏表!A1' })
    expect(await bad.v.reveal({ range: '销售!C3' })).toBe(true)
    expect(await late).toBe(true)
    expect(bad.host.querySelector('.xlsx-found')).not.toBeNull()
    await expect(bad.v.reveal({ range: '坏表!A1' })).rejects.toThrow(/sheet9\.xml is missing/)
    bad.v.destroy()
  })

  test('pill 来回一圈：表名带引号、!、&、空格 —— refOf 的地址经宿主写成链接、读回逐字相同,reveal 切到那张表、框的正是那一格', async () => {
    const { groupFileLink, parseGroupFileLink } = await import('./support/fileLink')
    const odd = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/xlsx-odd-names.xlsx')))
    const host = document.createElement('div')
    const v = (await view.mountXlsx(host, odd, { t, onPicks: () => {} }))!
    const current = () => host.querySelector('.xlsx-tab.current')!.textContent
    const found = () => host.querySelector<HTMLElement>('.xlsx-found')
    const ITEM = '0b8c0d33-5a1e-4c5e-9d6a-3f1f0b2c4d5e'
    const links: string[] = []
    for (const sheet of ["O'Neil", 'A!B', 'R&D', '2024 预算']) {
      // B3 (30) and the merged B2:C2 by its top-left cell, as refOf writes them for a pick there.
      for (const [pick, text, cols] of [[{ sheet, kind: 'cells', r0: 2, c0: 1, r1: 2, c1: 1 }, '30', 1], [{ sheet, kind: 'cells', r0: 1, c0: 1, r1: 1, c1: 2, merged: 'B2:C2' }, '合并', 2]] as const) {
        const { at, label } = view.refOf(pick as Pick)
        expect(label).toBe(at.range)
        const link = groupFileLink(ITEM, { version: 1, at })
        links.push(link)
        const back = parseGroupFileLink(link)!.at!
        expect(back).toEqual(at)
        expect(await v.reveal(back)).toBe(true)
        await until(`the sheet shown is ${sheet}`, () => current() === sheet)
        await until('the place is framed', () => found() !== null)
        const cell = [...host.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === text)!
        expect([found()!.style.left, found()!.style.top, found()!.style.width]).toEqual([cell.style.left, cell.style.top, cell.style.width])
        // The merged area is two columns wide: framed whole, not its top-left cell alone.
        if (cols === 2) expect(parseFloat(found()!.style.width)).toBeGreaterThan(parseFloat([...host.querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === '30')!.style.width))
      }
    }
    // A whole sheet whose name has a !: its pill is the quoted name alone, read back whole (复核 156f72cb0e).
    const wholeAB = view.refOf({ sheet: 'A!B', kind: 'sheet', r0: 0, c0: 0, r1: 1048575, c1: 16383 } as Pick)
    expect(wholeAB.at).toEqual({ range: "'A!B'" })
    const backAB = parseGroupFileLink(groupFileLink(ITEM, { version: 1, at: wholeAB.at }))!.at!
    expect(backAB).toEqual(wholeAB.at)
    expect(await v.reveal(backAB)).toBe(true)
    await until('A!B is the sheet shown', () => current() === 'A!B')
    expect(found()).toBeNull()
    // What an agent reads in the link: the address as Excel writes it, a link's own characters escaped.
    expect(links.filter((_, i) => i % 2 === 0)).toEqual([
      `gugu-file://${ITEM}?v=1#range='O''Neil'!B3`,
      `gugu-file://${ITEM}?v=1#range='A!B'!B3`,
      `gugu-file://${ITEM}?v=1#range='R%26D'!B3`,
      `gugu-file://${ITEM}?v=1#range='2024%20预算'!B3`,
    ])
    v.destroy()
  })
})

describe('咕咕办公 · .xlsx 跟着新版本走', () => {
  test('新版原地换上:同一张表、同一个滚动位置;变了的格子闪一下;没结果的公式显示公式原文,标签栏的 ⓘ 里说一句', async () => {
    // The next version as an agent's edit leaves it: B2 a new value, D3 a new formula with no stored result.
    const zip = zipper.readZip(sales)
    const xml = zipper.entryText(zip, 'xl/worksheets/sheet1.xml')
    const edited = xml.replace('<c r="B2" s="2"><v>1200</v></c>', '<c r="B2" s="2"><v>1500</v></c>').replace('<c r="D3" s="2"><f t="shared" si="0"/><v>1910</v></c>', '<c r="D3" s="2"><f>B3+C3+100</f></c>')
    expect(edited).not.toBe(xml)
    const next = { bytes: new Uint8Array(zipper.rewriteZip(zip, new Map([['xl/worksheets/sheet1.xml', Buffer.from(edited, 'utf8')]]))) }
    const first = await mount()
    first.scroll.scrollTop = 0
    // The view of the version before is handed over (app.js redraw): its sheet, its scroll, what each cell showed.
    const second = await view.mountXlsx(first.host, next.bytes, { t, onPicks: () => {}, previous: first.v })
    first.v.destroy()
    const changed = [...first.host.querySelectorAll('.xc.changed')].map((el) => el.textContent)
    expect(changed).toEqual(expect.arrayContaining(['1,500', '=B3+C3+100']))
    expect(changed).not.toContain('1,350')
    expect(first.host.querySelector('.xc.pending')!.textContent).toBe('=B3+C3+100')
    expect(first.host.querySelector('.xlsx-about-text')!.textContent).toBe('有 1 个公式还没算出结果，用 Excel 或 WPS 打开时会算。')
    expect(first.host.querySelector<HTMLElement>('.xlsx-about')!.hidden).toBe(false)
    // In English, one is one formula (10-13 A/B: "1 formulas").
    const host = document.body.appendChild(document.createElement('div'))
    const en = await view.mountXlsx(host, next.bytes, { t: { ...t, xlsxPending: '{n} formula{s} with no result yet: Excel or WPS calculates on opening.' }, onPicks: () => {} })
    expect(host.querySelector('.xlsx-about-text')!.textContent).toBe('1 formula with no result yet: Excel or WPS calculates on opening.')
    en!.destroy()
    host.remove()
    // The old view's destroy took only its own: the new one is on screen.
    expect(first.host.querySelector('.xlsx-book')).not.toBeNull()
    second!.destroy()
    expect(first.host.children).toHaveLength(0)
  })

  test('画好之前人已经换了文件(wanted 说不要):什么都不留', async () => {
    const host = document.createElement('div')
    expect(await view.mountXlsx(host, sales, { t, onPicks: () => {}, wanted: () => false })).toBeNull()
    expect(host.children).toHaveLength(0)
  })
})

describe('咕咕办公 · .xlsx 的 ⓘ', () => {
  // The browser's popover, as far as this page uses it (jsdom has none): showPopover / hidePopover fire toggle; a click,
  // a press outside and Escape are the browser's and not the page's, so not here.
  beforeAll(() => {
    const toggled = (el: HTMLElement, newState: string) => el.dispatchEvent(Object.assign(new Event('toggle'), { newState }))
    Object.assign(HTMLElement.prototype, {
      showPopover(this: HTMLElement) {
        toggled(this, 'open')
      },
      hidePopover(this: HTMLElement) {
        toggled(this, 'closed')
      },
    })
  })
  afterAll(() => {
    delete (HTMLElement.prototype as Partial<{ showPopover: unknown }>).showPopover
    delete (HTMLElement.prototype as Partial<{ hidePopover: unknown }>).hidePopover
  })
  const hover = (el: Element, type: 'pointerenter' | 'pointerleave', pointerType = 'mouse') => el.dispatchEvent(Object.assign(new Event(type), { pointerType }))

  test('只在有话要说时才有:按钮带名字,弹层是 popover、名字同按钮;没有话就没有 ⓘ', async () => {
    const host = document.body.appendChild(document.createElement('div'))
    const v = await view.mountXlsx(host, sales, { t, onPicks: () => {} })
    const about = host.querySelector<HTMLButtonElement>('.xlsx-about')!
    const text = host.querySelector<HTMLElement & { popover: string; }>('.xlsx-about-text')!
    expect(about.hidden).toBe(true)
    expect(text.textContent).toBe('')
    expect(about.getAttribute('aria-label')).toBe('关于这张表')
    expect([text.popover, text.getAttribute('role'), text.getAttribute('aria-label')]).toEqual(['auto', 'dialog', '关于这张表'])
    expect((about as HTMLButtonElement & { popoverTargetElement: unknown }).popoverTargetElement).toBe(text)
    // An error opening a sheet is a line, not in the ⓘ.
    expect(host.querySelector('.xlsx-note')!.getAttribute('role')).toBe('alert')
    v!.destroy()
    host.remove()
  })

  test('鼠标停 150 ms 打开,移开就收;停着时点一下就留住(移开不收);手指不算悬停', async () => {
    const host = document.body.appendChild(document.createElement('div'))
    const v = await view.mountXlsx(host, sheetVariant((xml) => xml.replace('<c r="D3" s="2"><f t="shared" si="0"/><v>1910</v></c>', '<c r="D3" s="2"><f>B3+C3+100</f></c>')), { t, onPicks: () => {} })
    vi.useFakeTimers()
    const about = host.querySelector<HTMLButtonElement>('.xlsx-about')!
    const text = host.querySelector<HTMLElement>('.xlsx-about-text')!
    expect(about.hidden).toBe(false)
    const open = () => Boolean(text.dataset.open)
    hover(about, 'pointerenter')
    vi.advanceTimersByTime(149)
    expect(open()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(open()).toBe(true)
    hover(about, 'pointerleave')
    expect(open()).toBe(false)
    // Opened by hover, then clicked: the click does not toggle it shut (its default is the browser's toggle), and it stays.
    hover(about, 'pointerenter')
    vi.advanceTimersByTime(150)
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    about.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    hover(about, 'pointerleave')
    expect(open()).toBe(true)
    text.hidePopover()
    // A finger's pointer is no hover.
    hover(about, 'pointerenter', 'touch')
    vi.advanceTimersByTime(500)
    expect(open()).toBe(false)
    v!.destroy()
    host.remove()
  })
})

describe('咕咕办公 · .xlsx 打不开的', () => {
  // 复评 049551ec42:zip 里写的大小谎报,页面解开时也照它为限(页面的内存)。
  test('zip 里写的大小比实际小:打不开,说是哪一项', async () => {
    const out = Buffer.from(sales)
    const entry = (zipper.readZip(out) as unknown as { entries: { name: string; local: number; central: Uint8Array }[] }).entries.find((e) => e.name === 'xl/worksheets/sheet1.xml')!
    out.writeUInt32LE(1000, entry.local + 22)
    out.writeUInt32LE(1000, entry.central.byteOffset - out.byteOffset + 24)
    await expect(view.mountXlsx(document.createElement('div'), new Uint8Array(out), { t, onPicks: () => {} })).rejects.toThrow(/xl\/worksheets\/sheet1\.xml unpacks to more than the 1000 bytes its zip says/)
  })
})
