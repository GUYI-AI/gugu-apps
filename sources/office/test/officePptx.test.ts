// @vitest-environment jsdom
// 咕咕办公打开群文件夹里的 .pptx(A1,演示稿设计说明 §3、§7):每页画出来,
// 每个形状能点选、能框选,攒着的几处一起变成一段引用。用的是打进包里的 pptx-glimpse(skills/office/vendor/)和一份 PptxGenJS 生成的
// 两页稿(fixtures/two-slides.pptx:每页 4 个形状,表格的 cNvPr id 与一个文本框相同(第 1 页都是 2,第 2 页都是 3)—— 同页重复的 id)。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')
const bytes = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
const t = {
  pptxSlide: '第 {n} 页', pptxShape: '形状 {id}', pptxNth: '（这一页第 {k} 个 id 相同的）', pptxBoxShapes: '框选的 {n} 个形状',
  pptxBoxEmpty: '框选的空白处', unpick: '去掉这一处',
}

// The App's own plain ES module (no types of its own): read through this shape.
interface PptxView {
  mountPptx(host: HTMLElement, bytes: Uint8Array, options: { t: typeof t; onPicks: (picks: unknown[]) => void }): Promise<{
    slides: number
    picks(): never[]
    clear(): void
    anchor(): Element | null
    dragging(): boolean
    reveal(query: Record<string, string>): boolean
    destroy(): void
  }>
  refOf(pick: never, strings: typeof t): { at: Record<string, unknown>; label: string }
}
let view: PptxView
/** A click as the keyboard makes one on a focused shape (no pointer was pressed for it); `shift` adds. */
const click = (el: Element, shift = false) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: shift }))
beforeAll(async () => {
  // jsdom has no object URLs: the slides are <img> of a Blob URL in the page.
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  const modulePath = resolve(appDir, 'pptx-view.js')
  view = (await import(/* @vite-ignore */ modulePath)) as PptxView
})

describe('咕咕办公 · .pptx', () => {
  test('每页一张图,形状的框叠在上面;点一下就选它(换掉原来的),Shift 加一处,Shift 再点去掉', async () => {
    const host = document.createElement('div')
    const heard: unknown[][] = []
    const deck = await view.mountPptx(host, bytes, { t, onPicks: (picks: unknown[]) => heard.push(picks) })
    expect(deck.slides).toBe(2)
    const slides = host.querySelectorAll('.pptx-slide')
    expect(slides).toHaveLength(2)
    expect(slides[0]!.querySelector('img')!.getAttribute('src')).toMatch(/^blob:/)
    // A file's text never becomes this page's markup: only <img> and the pick buttons.
    expect(slides[0]!.querySelectorAll('svg, text, foreignObject')).toHaveLength(0)
    const hits = slides[0]!.querySelectorAll<HTMLButtonElement>('.pptx-hit')
    expect(hits).toHaveLength(4)
    expect(deck.anchor()).toBeNull()
    click(hits[0]!)
    click(hits[3]!)
    expect(deck.picks()).toHaveLength(1)
    expect(hits[0]!.classList.contains('picked')).toBe(false)
    expect(deck.anchor()).toBe(hits[3])
    click(hits[0]!, true)
    expect(deck.picks()).toHaveLength(2)
    expect(hits[3]!.classList.contains('picked')).toBe(true)
    expect(deck.anchor()).toBe(hits[0])
    click(hits[3]!, true)
    expect(deck.picks()).toHaveLength(1)
    expect(heard.at(-1)).toHaveLength(1)
    deck.destroy()
    expect(host.children).toHaveLength(0)
  })

  test('pill:at 是页、id,同一页 id 重复时带第几个;字是页和开头几个字', async () => {
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, bytes, { t, onPicks: () => {} })
    const hits = host.querySelectorAll<HTMLButtonElement>('.pptx-slide[data-n="2"] .pptx-hit')
    click(hits[1]!)
    click(hits[3]!, true)
    const [text, table] = deck.picks().map((pick) => view.refOf(pick, t))
    expect(text).toEqual({ at: { slide: 2, shape: '3', k: 1 }, label: '第 2 页 · 要点：收入增长' })
    // A table's first words are its cells' (the reading the skill's outline gives agents).
    expect(table).toEqual({ at: { slide: 2, shape: '3', k: 2 }, label: '第 2 页 · 季度 收入 Q1 120' })
    // Control: an id the slide gives once is said bare.
    click(hits[0]!, true)
    expect(view.refOf(deck.picks()[2], t)).toEqual({ at: { slide: 2, shape: '2' }, label: '第 2 页 · 第 2 页 标题' })
  })

  test('开头几个字:几段之间隔一个空格,不连成一个词', async () => {
    const ooxml = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-ooxml.mjs'))) as {
      readZip(bytes: Uint8Array): unknown
      locate(zip: unknown, address: { slide: number; shape: string; k: number }): { xml: string; was: string }
      applyEdits(bytes: Uint8Array, edits: never): { bytes: Uint8Array }
    }
    // Slide 2's text box with a second paragraph (A2's own write-back), as a bulleted list has.
    const { xml, was } = ooxml.locate(ooxml.readZip(bytes), { slide: 2, shape: '3', k: 1 })
    const paragraph = /<a:p\b[\s\S]*?<\/a:p>/.exec(xml)![0]
    const two = ooxml.applyEdits(bytes, [{ slide: 2, shape: '3', k: 1, was, xml: xml.replace(paragraph, paragraph + paragraph.replace('要点：收入增长', '第二段')) }] as never).bytes
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, two, { t, onPicks: () => {} })
    click(host.querySelectorAll<HTMLButtonElement>('.pptx-slide[data-n="2"] .pptx-hit')[1]!)
    // Its paragraphs one space apart: the pill reads them as words, not one run-on word.
    expect(view.refOf(deck.picks()[0], t).label).toBe('第 2 页 · 要点：收入增长 第二段')
  })

  test('那一处的字整段交出去:不在 App 里截(按码元截会切开 emoji),只由咕咕整条截一次', async () => {
    const ooxml = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-ooxml.mjs'))) as {
      readZip(bytes: Uint8Array): unknown
      locate(zip: unknown, address: { slide: number; shape: string; k: number }): { xml: string; was: string }
      applyEdits(bytes: Uint8Array, edits: never): { bytes: Uint8Array }
    }
    // 66 characters as seen; a 😀 across the 40th UTF-16 unit, a family emoji right after it.
    const long = `${'季'.repeat(39)}😀👨‍👩‍👧‍👦${'度'.repeat(25)}`
    const { xml, was } = ooxml.locate(ooxml.readZip(bytes), { slide: 2, shape: '3', k: 1 })
    const edited = ooxml.applyEdits(bytes, [{ slide: 2, shape: '3', k: 1, was, xml: xml.replace('要点：收入增长', long) }] as never).bytes
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, edited, { t, onPicks: () => {} })
    click(host.querySelectorAll<HTMLButtonElement>('.pptx-slide[data-n="2"] .pptx-hit')[1]!)
    const { label } = view.refOf(deck.picks()[0], t)
    expect(label).toBe(`第 2 页 · ${long}`)
    expect(label).not.toContain('…')
    expect(label).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/)
  })

  test('攒着的每一处都留在稿子上:框留虚线框、框里的形状描一下、点的形状描边,角上编号与引用同序;只有编号撤,框里照样能开新框(Shift 加)', async () => {
    const host = document.createElement('div')
    const heard: unknown[][] = []
    const deck = await view.mountPptx(host, bytes, { t, onPicks: (picks: unknown[]) => heard.push(picks) })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    // jsdom lays nothing out and has no pointer capture: the slide is as many px wide as its own coordinates.
    const [w, h] = card.style.aspectRatio.split('/').map(Number) as [number, number]
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: w, height: h, right: w, bottom: h, x: 0, y: 0, toJSON: () => ({}) })
    card.setPointerCapture = () => {}
    const hits = [...card.querySelectorAll<HTMLButtonElement>('.pptx-hit')]
    const rect = (el: HTMLElement) => ['left', 'top', 'width', 'height'].map((k, i) => (parseFloat(el.style.getPropertyValue(k)) / 100) * (i % 2 ? h : w))
    const badges = () => [...card.querySelectorAll<HTMLButtonElement>('.pptx-badge')].map((b) => b.dataset.n)

    click(hits[0]!) // the title: 1
    // A box inside the table (the last shape), Shift held: 2. It starts on the table — a drag is a box wherever it starts.
    const [tx, ty, tw, th] = rect(hits[3]!)
    for (const [type, x, y] of [['pointerdown', tx + 2, ty + 2], ['pointermove', tx + tw - 2, ty + th - 2], ['pointerup', tx + tw - 2, ty + th - 2]] as const) {
      hits[3]!.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, shiftKey: true }))
    }
    expect(deck.picks()).toHaveLength(2)
    const frames = card.querySelectorAll<HTMLElement>('.pptx-mark')
    expect(frames).toHaveLength(1)
    expect(rect(frames[0]!).map(Math.round)).toEqual([tx + 2, ty + 2, tw - 4, th - 4].map(Math.round))
    expect(hits[3]!.classList.contains('inside')).toBe(true)
    expect(hits[0]!.classList.contains('inside')).toBe(false)
    expect(hits[0]!.classList.contains('picked')).toBe(true)
    expect(badges()).toEqual(['1', '2'])
    // The numbers are the reference's: 1 is the title, 2 the box.
    expect(deck.picks().map((pick) => 'box' in view.refOf(pick, t).at)).toEqual([false, true])

    // Its number takes the title back; the box is now 1.
    card.querySelector<HTMLButtonElement>('.pptx-badge[data-n="1"]')!.click()
    expect(deck.picks()).toHaveLength(1)
    expect(hits[0]!.classList.contains('picked')).toBe(false)
    expect(badges()).toEqual(['1'])
    expect(heard.at(-1)).toHaveLength(1)
    // The frame is a mark only: a click on it takes nothing back, and a new box starts inside it.
    const press = (el: Element, type: string, x: number, y: number) => el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, shiftKey: true }))
    const frame = card.querySelector<HTMLElement>('.pptx-mark')!
    click(frame)
    expect(deck.picks()).toHaveLength(1)
    const [fx, fy, fw, fh] = rect(frame)
    press(frame, 'pointerdown', fx + fw * 0.2, fy + fh * 0.2)
    expect(deck.dragging()).toBe(true)
    press(card, 'pointermove', fx + fw * 0.6, fy + fh * 0.6)
    press(card, 'pointerup', fx + fw * 0.6, fy + fh * 0.6)
    expect(deck.picks()).toHaveLength(2)
    expect(card.querySelectorAll('.pptx-mark')).toHaveLength(2)
    expect(badges()).toEqual(['1', '2'])
    // Pressing a number starts no box; its click takes that one back, and only that one: nothing left at the end.
    for (const n of ['2', '1']) {
      const badge = card.querySelector<HTMLButtonElement>(`.pptx-badge[data-n="${n}"]`)!
      press(badge, 'pointerdown', fx, fy)
      expect(deck.dragging()).toBe(false)
      press(badge, 'pointerup', fx, fy)
      badge.click()
      expect(deck.picks()).toHaveLength(Number(n) - 1)
    }
    expect(card.querySelectorAll('.pptx-mark, .pptx-badge, .pptx-band, .pptx-hit.inside, .pptx-hit.picked')).toHaveLength(0)
    expect(heard.at(-1)).toHaveLength(0)
  })

  test('没写自己位置的占位符(标题):点击框画在版式里同 idx 占位符的位置,点得中(真稿 Apache 第 1 页)', async () => {
    // apache/poi test-data/slideshow/2411-Performance_Up.pptx 只留第 1 页:标题(ctrTitle)没有 <a:xfrm>,
    // slideLayout1 的 ctrTitle(idx 0)在 144, 152, 768 × 120 px,幻灯片 960 × 720。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/apache-slide1.pptx')))
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    expect(card.style.aspectRatio.split('/').map(Number)).toEqual([960, 720])
    const hits = [...card.querySelectorAll<HTMLButtonElement>('.pptx-hit')]
    expect(hits.map((hit) => hit.dataset.key)).toEqual(['1:16386:1', '1:16387:1', '1:16388:1'])
    const box = ['left', 'top', 'width', 'height'].map((k) => Number(parseFloat(hits[0]!.style.getPropertyValue(k)).toFixed(3)))
    expect(box).toEqual([15, 21.111, 80, 16.667])
    click(hits[0]!)
    // Whole: the one cut is gugu's, over the file's name and this (App 引用 pill, 155 10-15).
    expect(view.refOf(deck.picks()[0], t)).toEqual({ at: { slide: 1, shape: '16386' }, label: '第 1 页 · Apache Performance Tuning' })
  })

  test('版式里同 idx 的占位符也没写位置:取母版里映射类型的那个(obj → body),点得中(真稿 45541_Footer 第 10 页)', async () => {
    // apache/poi test-data/slideshow/45541_Footer.pptx 只留第 10 页:正文占位符(type body,idx 1)没有 <a:xfrm>;
    // slideLayout2 里 idx 1 的是 obj,也没有;slideMaster1 的 body 在 72, 208, 816 × 432 px。标题同理落到母版的 title。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/footer45541-slide10.pptx')))
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    expect(card.style.aspectRatio.split('/').map(Number)).toEqual([960, 720])
    const place = (id: string) => {
      const hit = card.querySelector<HTMLButtonElement>(`.pptx-hit[data-key="1:${id}:1"]`)
      return hit && ['left', 'top', 'width', 'height'].map((k) => Number(parseFloat(hit.style.getPropertyValue(k)).toFixed(3)))
    }
    expect(place('684034')).toEqual([7.5, 8.889, 85, 16.667])
    expect(place('684035')).toEqual([7.5, 28.889, 85, 60])
    click(card.querySelector<HTMLButtonElement>('.pptx-hit[data-key="1:684035:1"]')!)
    expect(view.refOf(deck.picks()[0], t).at).toMatchObject({ slide: 1, shape: expect.stringMatching(/^684035/) })
  })

  test('组合里的形状:框按组合换算;第一次点选中整组,在组里再点选中那一个;框只点名组里的形状(真稿 sample_pptx_grouping_issues)', async () => {
    // apache/poi test-data/slideshow/sample_pptx_grouping_issues.pptx(就一页):组合 14339 里有 14421、14422、14423,子形状的
    // 位置在组合的子坐标里(chOff/chExt),套上组合的 off/ext 才是页上的;14423 自己还转了 -90°,框是转过去以后的。
    // 参考值 = pptx-glimpse 画它的位置:它自己的 SVG transform 写成矩阵,四角推过去取外接框(评审 3987f401a 的仪器)。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/grouping-slide1.pptx')))
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    const [w, h] = card.style.aspectRatio.split('/').map(Number) as [number, number]
    const hit = (id: string) => card.querySelector<HTMLButtonElement>(`.pptx-hit[data-key="1:${id}:1"]`)!
    const at = (id: string) => ['left', 'top', 'width', 'height'].map((k, i) => (parseFloat(hit(id).style.getPropertyValue(k)) / 100) * (i % 2 ? h : w))
    const near = (got: number[], want: number[]) => got.forEach((v, i) => expect(v).toBeCloseTo(want[i]!, 1))
    near(at('14339'), [721.333, 168, 141.167, 63.5])
    near(at('14421'), [842.994, 194.78, 19.506, 36.72])
    near(at('14423'), [731.187, 168, 121.661, 63.086])
    const ids = () => deck.picks().map((p) => (p as unknown as { shape: { id: string } }).shape.id)

    click(hit('14423'))
    expect(ids()).toEqual(['14339']) // the first click: the whole group
    click(hit('14423'))
    expect(ids()).toEqual(['14423']) // again in it: that shape, in the group's place
    click(hit('14421'), true)
    expect(ids()).toEqual(['14423', '14421']) // inside the group now, Shift held: another of its shapes is added
    click(hit('14422'))
    expect(ids()).toEqual(['14422']) // without Shift: that one instead

    // A box inside the group, over its member 14422 only (the slide stacks other groups next to it, and the turned 14423
    // reaches in from x 731): it names that shape, not the group it is in.
    deck.clear()
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: w, height: h, right: w, bottom: h, x: 0, y: 0, toJSON: () => ({}) })
    card.setPointerCapture = () => {}
    for (const [type, x, y] of [['pointerdown', 722, 196], ['pointermove', 730, 228], ['pointerup', 730, 228]] as const) {
      card.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
    }
    const [box] = deck.picks() as unknown as { shapes: { id: string }[] }[]
    expect(box!.shapes.map((s) => s.id)).toEqual(['14422'])
  })

  test('组合套组合、组合有转角:框是页上转过去以后围住它的那个框;第一下选最外层的组合(真稿 54542_cropped_bitmap)', async () => {
    // apache/poi test-data/slideshow/54542_cropped_bitmap.pptx(就一页):组合 4 转了 12.6°,里面的组合 2、3 又各转了一次;
    // 形状 13、16 在最里面。组合 4 自己的框也是转过去以后的。参考值 = pptx-glimpse 画它的位置(同上一格的矩阵)。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/cropped54542-slide1.pptx')))
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    const [w, h] = card.style.aspectRatio.split('/').map(Number) as [number, number]
    const at = (id: string) => {
      const hit = card.querySelector<HTMLButtonElement>(`.pptx-hit[data-key="1:${id}:1"]`)!
      return ['left', 'top', 'width', 'height'].map((k, i) => (parseFloat(hit.style.getPropertyValue(k)) / 100) * (i % 2 ? h : w))
    }
    const near = (got: number[], want: number[]) => got.forEach((v, i) => expect(v).toBeCloseTo(want[i]!, 1))
    near(at('4'), [572.623, 290.942, 306.839, 327.45])
    near(at('2'), [660.537, 354.068, 284.294, 235.456])
    near(at('3'), [640.112, 254.146, 148.403, 150.521])
    near(at('13'), [660.537, 354.068, 281.132, 230.802])
    near(at('16'), [660.785, 274.803, 83.704, 84.713])
    // 13 sits two groups deep (in 2 or 3, inside 4): the first click picks the outermost group, the next the shape itself.
    const ids = () => deck.picks().map((p) => (p as unknown as { shape: { id: string } }).shape.id)
    click(card.querySelector<HTMLButtonElement>('.pptx-hit[data-key="1:13:1"]')!)
    expect(ids()).toEqual(['4'])
    click(card.querySelector<HTMLButtonElement>('.pptx-hit[data-key="1:13:1"]')!)
    expect(ids()).toEqual(['13'])
  })

  test('形状自己转了:框是转过去以后的,不是没转时的(真稿 aascu 第 11 页的肘形连接线)', async () => {
    // apache/poi test-data/slideshow/aascu.org_hbcu_leadershipsummit_cooper_.pptx 只留第 11 页:连接线 35 转了 270°,
    // 没转时是 [400, 344, 272, 80],画出来是竖的 [496, 248, 80, 272](pptx-glimpse 的矩阵,评审 3987f401a)。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/aascu-slide11.pptx')))
    const host = document.createElement('div')
    await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    const [w, h] = card.style.aspectRatio.split('/').map(Number) as [number, number]
    const at = (id: string) => {
      const hit = card.querySelector<HTMLButtonElement>(`.pptx-hit[data-key="1:${id}:1"]`)!
      return ['left', 'top', 'width', 'height'].map((k, i) => (parseFloat(hit.style.getPropertyValue(k)) / 100) * (i % 2 ? h : w))
    }
    const near = (got: number[], want: number[]) => got.forEach((v, i) => expect(v).toBeCloseTo(want[i]!, 1))
    near(at('35'), [496, 248, 80, 272])
    near(at('56'), [488, 368, 72, 264])
    near(at('24'), [240, 288, 48, 136])
  })

  test('mc:AlternateContent:只有画出来的那一份(Choice)有点击框,引用说的是画面上的字', async () => {
    // fixtures/two-slides.pptx 第 1 页加了一个 mc:AlternateContent(PowerPoint 写公式、新式图表时就是这样):Choice、Fallback
    // 各一个 p:sp,cNvPr id 都是 90、位置相同,字分别是 CHOICE ALT TEXT / FALLBACK ALT TEXT(评审 3987f401a 的 make-alt.py)。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/alt-two-slides.pptx')))
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    const hits = [...card.querySelectorAll<HTMLButtonElement>('.pptx-hit')].filter((hit) => hit.dataset.key!.startsWith('1:90:'))
    expect(hits.map((hit) => hit.dataset.key)).toEqual(['1:90:1'])
    click(hits[0]!)
    expect(view.refOf(deck.picks()[0], t)).toEqual({ at: { slide: 1, shape: '90' }, label: '第 1 页 · CHOICE ALT TEXT' })
  })

  test('嵌入的对象(OLE)是一个形状:它里面那张代显示的图不单独画点击框(真稿 bug54570)', async () => {
    // apache/poi test-data/slideshow/bug54570.pptx(就一页):graphicFrame 4「Object 3」是嵌入对象,它的 mc:Fallback 里
    // 有一张 cNvPr id 0 的 <p:pic>。PowerPoint 只选得中对象本身。
    const real = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/ole-bug54570.pptx')))
    const host = document.createElement('div')
    await view.mountPptx(host, real, { t, onPicks: () => {} })
    const card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    expect([...card.querySelectorAll<HTMLButtonElement>('.pptx-hit')].map((hit) => hit.dataset.key)).toEqual(['1:4:1'])
  })

  // App 引用 pill: a pill opens the file at its place — `at` read back as refOf wrote it (the page's onLink hands it).
  test('pill 的那一处:翻到那一页,框出那个形状或那个框;这一版没有的回 false;下一次按下就撤', async () => {
    const host = document.createElement('div')
    const deck = await view.mountPptx(host, bytes, { t, onPicks: () => {} })
    const found = () => [...host.querySelectorAll<HTMLElement>('.pptx-found')]
    const box = (el: HTMLElement) => ['left', 'top', 'width', 'height'].map((k) => el.style.getPropertyValue(k))
    // The table: slide 2's second shape with id 3 — framed where its hit box is.
    expect(deck.reveal({ slide: '2', shape: '3', k: '2' })).toBe(true)
    expect(found()).toHaveLength(1)
    expect(found()[0]!.closest<HTMLElement>('.pptx-slide')!.dataset.n).toBe('2')
    expect(box(found()[0]!)).toEqual(box(host.querySelector<HTMLElement>('.pptx-hit[data-key="2:3:2"]')!))
    // A box as refOf wrote it; a slide alone frames the slide. One frame at a time.
    expect(deck.reveal({ slide: '1', box: '0,0,100,50' })).toBe(true)
    expect(found()).toHaveLength(1)
    expect(found()[0]!.closest<HTMLElement>('.pptx-slide')!.dataset.n).toBe('1')
    expect(deck.reveal({ slide: '1' })).toBe(true)
    expect(found()[0]!.classList.contains('whole')).toBe(true)
    // Not in this version: false, nothing framed.
    for (const query of [{ slide: '9' }, { slide: '1', shape: '999' }, { slide: '2', shape: '3', k: '3' }, { slide: '1', box: 'a,b' }] as Record<string, string>[]) {
      expect(deck.reveal(query), JSON.stringify(query)).toBe(false)
    }
    expect(found()).toHaveLength(0)
    // The next press on the deck takes the frame away.
    expect(deck.reveal({ slide: '2', shape: '2' })).toBe(true)
    host.querySelector('.pptx-deck')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(found()).toHaveLength(0)
    deck.destroy()
  })

  test('框选:框住的形状都点名,框的位置按幻灯片坐标', () => {
    const shapes = [
      { id: '3', k: 1, of: 1, name: 'Text 1', text: '' },
      { id: '4', k: 1, of: 1, name: 'Shape 2', text: '' },
    ]
    expect(view.refOf({ slide: 1, box: [400.4, 120, 200, 100.6], shapes } as never, t)).toEqual({ at: { slide: 1, box: '400,120,200,101' }, label: '第 1 页 · 框选的 2 个形状' })
    expect(view.refOf({ slide: 1, box: [0, 0, 10, 10], shapes: [] } as never, t)).toEqual({ at: { slide: 1, box: '0,0,10,10' }, label: '第 1 页 · 框选的空白处' })
  })
})

describe('咕咕办公 · .pptx 打不开的', () => {
  // zip 目录里写的大小谎报(写小):页面解开时就以它为限,不按真实大小解开(页面的内存)。
  test('zip 里写的一页的大小比实际小:打不开,说是哪一项', async () => {
    const ooxml = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-ooxml.mjs'))) as {
      readZip(bytes: Uint8Array): { entries: { name: string; method: number; local: number; central: Uint8Array }[] }
      entryText(zip: unknown, name: string): string
      rewriteZip(zip: unknown, changed: Map<string, Buffer>): Buffer
    }
    // The fixture's parts are stored (nothing to inflate): slide 1 deflated first, then its size forged.
    const zip = ooxml.readZip(bytes)
    const out = ooxml.rewriteZip(zip, new Map([['ppt/slides/slide1.xml', Buffer.from(`${ooxml.entryText(zip, 'ppt/slides/slide1.xml')} `, 'utf8')]]))
    const entry = ooxml.readZip(out).entries.find((e) => e.name === 'ppt/slides/slide1.xml')!
    expect(entry.method).toBe(8)
    out.writeUInt32LE(100, entry.local + 22)
    out.writeUInt32LE(100, entry.central.byteOffset - out.byteOffset + 24)
    await expect(view.mountPptx(document.createElement('div'), new Uint8Array(out), { t, onPicks: () => {} })).rejects.toThrow(
      /^ppt\/slides\/slide1\.xml unpacks to more than the 100 bytes its zip says: the file is damaged or forged$/,
    )
  })
})
