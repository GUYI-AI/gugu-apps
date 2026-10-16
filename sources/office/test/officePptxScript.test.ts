// 咕咕办公的 skill 改 .pptx(A2,方案 gugu-base notes/2026-10-10-ppt-office/演示稿-设计说明.html §3;10-13 起是 skill + 脚本,
// gugu-base notes/2026-10-10-ppt-office/演示稿-脚本方案.md):按页和 cNvPr id 读,整段换掉一个形状的 XML —— 没动的 zip 条目
// 逐字节拷回,改的那一页只换那一段。上半是模块(skills/office/lib/pptx-ooxml.mjs),下半是 agent 在自己 shell 里跑的脚本
// (skills/office/scripts/pptx.mjs)。用的是两页样例(fixtures/two-slides.pptx,PptxGenJS 生成:每页的表格和一个文本框 cNvPr id 相同)。
// 写之前还要让 pptx-glimpse(咕咕办公画幻灯片用的同一个库)把改过的页画一遍:多出关于这几页的警告就拒。
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

const appDir = resolve(__dirname, '../app')
const fixture = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
// The same deck repacked the way a streaming writer does it: every entry followed by a signed data descriptor (made with
// Python's zipfile writing to a stream it cannot seek).
const streamed = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides-dd.pptx')))
// The App's own plain ES module (no types of its own): read through this shape.
interface Zip {
  entries: { name: string; flags: number; record: Uint8Array }[]
}
interface Shape {
  id: string
  k?: number
  name: string
  kind: string
  box: unknown
  text: string
  was: string
}
/** An edited shape as applyEdits answers it: its address and its was now, or that it was deleted. */
interface EditedShape {
  slide: number
  shape: string
  k?: number
  was?: string
  deleted?: true
}
interface Diagnostic {
  source: string
  severity: 'info' | 'warning' | 'error'
  code: string
  message: string
  slideNumber?: number
  sourcePartPath?: string
}
type Convert = (bytes: Uint8Array, options: { slides: number[] }) => Promise<{ slides: unknown[]; diagnostics: Diagnostic[] }>
interface Ooxml {
  readZip(bytes: Uint8Array): Zip
  outline(zip: Zip, options: { slide?: number }): { part: string; shapes: Shape[] }[]
  locate(zip: Zip, address: { slide: number; shape: string; k?: number; name?: string }): { xml: string; was: string }
  applyEdits(bytes: Uint8Array, edits: never): { bytes: Uint8Array; slides: number[]; shapes: EditedShape[]; unchangedEntries: number }
  fingerprint(xml: string): string
  checkRenders(convert: Convert, before: Uint8Array, after: Uint8Array, scope: { slides: number[]; parts: string[] }): Promise<void>
  entryText(zip: Zip, name: string): string | null
  entryBytes(zip: Zip, name: string): Buffer | null
  rewriteZip(zip: Zip, changed: Map<string, Buffer>): Buffer
}
const modulePath = resolve(appDir, 'skills/office/lib/pptx-ooxml.mjs')
const ooxml = (await import(/* @vite-ignore */ modulePath)) as Ooxml

/** Each entry's local record as it lies in the package: copied byte for byte, or not. */
const records = (bytes: Uint8Array) => new Map(ooxml.readZip(bytes).entries.map((e) => [e.name, Buffer.from(e.record)]))

/**
 * Each entry's local record cut out by the central directory's offsets alone — from its offset to the next entry's (the
 * last to the directory) — without reading any record's own lengths: an instrument that does not share the writer's
 * parsing, so a record copied short or long shows.
 */
function spans(bytes: Uint8Array): Map<string, Buffer> {
  const buf = Buffer.from(bytes)
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const count = buf.readUInt16LE(eocd + 10)
  const cd = buf.readUInt32LE(eocd + 16)
  const at: { name: string; offset: number }[] = []
  for (let p = cd, i = 0; i < count; i++) {
    const nameLen = buf.readUInt16LE(p + 28)
    at.push({ name: buf.toString('utf8', p + 46, p + 46 + nameLen), offset: buf.readUInt32LE(p + 42) })
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32)
  }
  const sorted = [...at].sort((a, b) => a.offset - b.offset)
  return new Map(sorted.map((e, i) => [e.name, buf.subarray(e.offset, sorted[i + 1]?.offset ?? cd)]))
}

/**
 * applyEdits with each edit's `was` as a reader of `bytes` gets it (outline / show): the per-shape lock is tested on its own
 * below. An address that names no shape keeps a placeholder written as a fingerprint is, so applyEdits says what is
 * wrong with the address.
 */
function apply(bytes: Uint8Array, edits: never) {
  const zip = ooxml.readZip(bytes)
  const was = (e: { slide: number; shape: string; k?: number }) => {
    try {
      return ooxml.locate(zip, { slide: e.slide, shape: e.shape, k: e.k }).was
    } catch {
      return '00000000'
    }
  }
  return ooxml.applyEdits(bytes, (edits as { slide: number; shape: string; k?: number; was?: string }[]).map((e) => ({ was: was(e), ...e })) as never)
}

/** The fixture with one part's text changed by `change` (a test's own package, written by rewriteZip). */
function withPart(part: string, change: (text: string) => string): Buffer {
  const zip = ooxml.readZip(fixture)
  const text = ooxml.entryText(zip, part)!
  const next = change(text)
  expect(next).not.toBe(text)
  return ooxml.rewriteZip(zip, new Map([[part, Buffer.from(next, 'utf8')]]))
}

/**
 * The fixture with slide 1 deflated (the fixture's parts are stored: nothing to inflate, nothing past the file's own
 * bytes) and its zip saying (central directory and local header) it unpacks to `size` bytes, whatever it does.
 */
function forged(size: number): Buffer {
  const out = withPart('ppt/slides/slide1.xml', (text) => `${text} `)
  const entry = (ooxml.readZip(out) as unknown as { entries: { name: string; method: number; local: number; central: Uint8Array }[] }).entries.find((e) => e.name === 'ppt/slides/slide1.xml')!
  expect(entry.method).toBe(8)
  out.writeUInt32LE(size, entry.local + 22)
  out.writeUInt32LE(size, entry.central.byteOffset - out.byteOffset + 24)
  return out
}

describe('pptx-ooxml', () => {
  test('outline: slides in show order, shapes with id, k when a slide repeats an id, name, kind, box in px, text', () => {
    const [first] = ooxml.outline(ooxml.readZip(fixture), { slide: 1 })
    expect(first!.part).toBe('ppt/slides/slide1.xml')
    expect(first!.shapes.map((s) => [s.id, 'k' in s ? s.k : null, s.name, s.kind])).toEqual([
      ['2', 1, 'Text 0', 'sp'],
      ['3', null, 'Text 1', 'sp'],
      ['4', null, 'Shape 2', 'sp'],
      ['2', 2, 'Table 0', 'graphicFrame'],
    ])
    expect(first!.shapes[0]).toMatchObject({ box: { x: 48, y: 29, w: 864, h: 77 }, text: '第 1 页 标题' })
  })

  test('a placeholder with no box of its own reads with the box it is drawn at: its layout\'s placeholder of the same idx', () => {
    // Slide 1 of a real deck (apache/poi test-data/slideshow/2411-Performance_Up.pptx, the other slides dropped): the
    // title (ctrTitle) gives no <a:xfrm>; slideLayout1's ctrTitle (idx 0) is at 144, 152, 768 × 120 px.
    const real = ooxml.readZip(new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/apache-slide1.pptx'))))
    const [first] = ooxml.outline(real, { slide: 1 })
    expect(first!.shapes.map((s) => [s.id, s.name, s.box])).toEqual([
      ['16386', 'Rectangle 2', { x: 144, y: 152, w: 768, h: 120 }],
      ['16387', 'Rectangle 3', { x: 192, y: 344, w: 672, h: 80 }],
      ['16388', 'Text Box 4', { x: 250, y: 464, w: 556, h: 48 }],
    ])
    // The shape on the slide, not the layout's: the one located and changed.
    const { xml } = ooxml.locate(real, { slide: 1, shape: '16386' })
    expect(xml).toMatch(/^<p:sp>[\s\S]*Apache Performance Tuning[\s\S]*<\/p:sp>$/)
    expect(xml).not.toMatch(/<a:xfrm/)
  })

  test('a placeholder whose layout placeholder gives no box either reads with the master\'s: matched by idx, then by type mapped', () => {
    // Slide 10 of a real deck (apache/poi test-data/slideshow/45541_Footer.pptx, the other slides dropped): the body
    // placeholder (type body, idx 1) gives no <a:xfrm>; slideLayout2's idx-1 placeholder is an obj with none either, so
    // it takes slideMaster1's body (obj maps to body): 72, 208, 816 × 432 px. The title the same way, to the master's title.
    const real = ooxml.readZip(new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/footer45541-slide10.pptx'))))
    const [first] = ooxml.outline(real, { slide: 1 })
    const box = (id: string) => first!.shapes.find((s) => s.id === id)!.box
    expect(box('684034')).toEqual({ x: 72, y: 64, w: 816, h: 120 })
    expect(box('684035')).toEqual({ x: 72, y: 208, w: 816, h: 432 })
  })

  test('a group\'s member reads with its box on the slide: through its group(s), scaled, nested and turned', () => {
    // Real decks (apache/poi test-data/slideshow): sample_pptx_grouping_issues.pptx (group 14339, its members in its child
    // space, scaled; member 14423 turned -90° itself) and 54542_cropped_bitmap.pptx (group 4 turned 12.6°, groups 2 and 3
    // inside it turned again). The boxes are where pptx-glimpse draws them — its own SVG transforms as matrices, the
    // corners pushed through (the reviewer's instrument, 3987f401a) — rounded to px.
    const boxes = (fixture: string) => new Map(ooxml.outline(ooxml.readZip(new Uint8Array(readFileSync(resolve(__dirname, `fixtures/${fixture}`)))), { slide: 1 })[0]!.shapes.map((s) => [s.id, s.box]))
    const grouping = boxes('grouping-slide1.pptx')
    expect(grouping.get('14339')).toEqual({ x: 721, y: 168, w: 141, h: 64 })
    expect(grouping.get('14421')).toEqual({ x: 843, y: 195, w: 20, h: 37 })
    expect(grouping.get('14423')).toEqual({ x: 731, y: 168, w: 122, h: 63 })
    const turned = boxes('cropped54542-slide1.pptx')
    expect(turned.get('4')).toEqual({ x: 573, y: 291, w: 307, h: 327 })
    expect(turned.get('13')).toEqual({ x: 661, y: 354, w: 281, h: 231 })
    expect(turned.get('16')).toEqual({ x: 661, y: 275, w: 84, h: 85 })
  })

  test('a flipped group puts its members mirrored (pptx-read.js throughGroups, a real deck\'s numbers)', async () => {
    // ca.ubc.cs.people_~emhill_presentations_HowWeRefactor.pptx (apache/poi test-data) slide 4: group 9 is flipH, its
    // child space (240, 2592) 1632 × 1490 on 533400 × 487362 EMU at (5486400, 1672615); member 122 at (493, 2610) 69 × 145.
    const read = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-read.js'))) as { throughGroups(box: object, groups: object[]): { x: number; y: number; w: number; h: number } }
    const group = { off: { x: 5486400, y: 1672615 }, ext: { w: 533400, h: 487362 }, chOff: { x: 240, y: 2592 }, chExt: { w: 1632, h: 1490 }, rot: 0, flipH: true, flipV: false }
    const box = read.throughGroups({ x: 493, y: 2610, w: 69, h: 145 }, [group])
    const px = [box.x, box.y, box.w, box.h].map((v) => v / 9525)
    ;[620.951, 176.221, 2.368, 4.979].forEach((want, i) => expect(px[i]).toBeCloseTo(want, 2))
  })

  test('a group flipped upside down (flipV) mirrors its members top to bottom; a flip is made before the turn', async () => {
    const read = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-read.js'))) as { throughGroups(box: object, groups: object[]): { x: number; y: number; w: number; h: number } }
    // flipV: child space = the group's own (no scaling); y becomes 300 − y inside the group, then the group's off.
    const flipped = { off: { x: 100, y: 200 }, ext: { w: 400, h: 300 }, rot: 0, flipH: false, flipV: true }
    expect(read.throughGroups({ x: 10, y: 20, w: 50, h: 60 }, [flipped])).toEqual({ x: 110, y: 420, w: 50, h: 60 })
    // flipH and a quarter turn: the member at the top left goes to the top right (x → 400 − x), then the turn about the
    // centre (200, 100) puts it at (250, 200) 50 × 100. Turned first and flipped after, it would land at (100, −100).
    const both = { off: { x: 0, y: 0 }, ext: { w: 400, h: 200 }, rot: 90, flipH: true, flipV: false }
    const box = read.throughGroups({ x: 0, y: 0, w: 100, h: 50 }, [both])
    ;[250, 200, 50, 100].forEach((want, i) => expect([box.x, box.y, box.w, box.h][i]).toBeCloseTo(want, 6))
  })

  test('the slides\' targets are read as every relationship is (ooxml-read.js resolveTarget): ./, ../ and an absolute one', async () => {
    const read = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-read.js'))) as { slideParts(text: (name: string) => string | null): string[] }
    const pres = '<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/><p:sldId id="258" r:id="rId3"/></p:sldIdLst></p:presentation>'
    const rels = '<Relationships><Relationship Id="rId1" Target="./slides/slide1.xml"/><Relationship Id="rId2" Target="../ppt/slides/slide2.xml"/><Relationship Id="rId3" Target="/ppt/slides/slide3.xml"/></Relationships>'
    const parts: Record<string, string> = { 'ppt/presentation.xml': pres, 'ppt/_rels/presentation.xml.rels': rels }
    // A target going up out of ppt/ and back (../ppt/slides/slide2.xml) is ppt/slides/slide2.xml, not ppt/../ppt/….
    expect(read.slideParts((name) => parts[name] ?? null)).toEqual(['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/slides/slide3.xml'])
  })

  test('a layout ctrTitle with no box of its own takes the master\'s title (ctrTitle maps to title, not to itself)', async () => {
    const read = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-read.js'))) as { inheritedBox(placeholder: object, layout: object[], master: object[]): unknown }
    const title = { x: 1, y: 2, w: 3, h: 4 }
    const master = [{ idx: 0, type: 'title', box: title }, { idx: 1, type: 'body', box: { x: 9, y: 9, w: 9, h: 9 } }]
    expect(read.inheritedBox({ idx: 0, type: 'ctrTitle' }, [{ idx: 0, type: 'ctrTitle', box: null }], master)).toEqual(title)
  })

  test('a shape turned itself reads with the box it is drawn in (a real deck: aascu slide 11, elbow connectors at 270°)', () => {
    const real = ooxml.readZip(new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/aascu-slide11.pptx'))))
    const box = (id: string) => ooxml.outline(real, { slide: 1 })[0]!.shapes.find((s) => s.id === id)!.box
    expect(box('35')).toEqual({ x: 496, y: 248, w: 80, h: 272 })
    expect(box('56')).toEqual({ x: 488, y: 368, w: 72, h: 264 })
  })

  test('mc:AlternateContent: only the copy that is drawn (the Choice) is listed; it can be changed, not deleted', () => {
    // fixtures/alt-two-slides.pptx: slide 1 of two-slides.pptx with an mc:AlternateContent whose Choice and Fallback are
    // each a p:sp with cNvPr id 90 at the same place ("CHOICE ALT TEXT" / "FALLBACK ALT TEXT"), as PowerPoint writes an
    // equation or a newer chart; pptx-glimpse draws the Choice.
    const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/alt-two-slides.pptx')))
    const zip = ooxml.readZip(deck)
    expect(ooxml.entryText(zip, 'ppt/slides/slide1.xml')).toMatch(/<mc:Fallback>[\s\S]*FALLBACK ALT TEXT/)
    const listed = ooxml.outline(zip, { slide: 1 })[0]!.shapes.filter((s) => s.id === '90')
    expect(listed.map((s) => [s.id, 'k' in s ? s.k : null, s.text])).toEqual([['90', null, 'CHOICE ALT TEXT']])
    const { xml, was } = ooxml.locate(zip, { slide: 1, shape: '90' })
    expect(() => apply(deck, [{ slide: 1, shape: '90', was, delete: true }] as never)).toThrow(/mc:AlternateContent .* not deleted; change it instead/)
    const changed = apply(deck, [{ slide: 1, shape: '90', was, xml: xml.replace('CHOICE ALT TEXT', 'CHANGED') }] as never)
    const after = ooxml.entryText(ooxml.readZip(changed.bytes), 'ppt/slides/slide1.xml')!
    expect(after).toContain('CHANGED')
    expect(after).toContain('FALLBACK ALT TEXT')
  })

  test('mc:AlternateContent whose Choice gives no shape (ink): the Fallback is listed, and apply neither changes nor deletes it', () => {
    // fixtures/ink-two-slides.pptx: slide 1 of two-slides.pptx with an mc:AlternateContent as PowerPoint writes ink — the
    // Choice a p14:contentPart (no shape), the Fallback a p:sp with cNvPr id 90 ("FALLBACK ALT TEXT"); made by the
    // reviewer's make-alt2.py. PowerPoint shows the ink, pptx-glimpse the Fallback: a change to it would show in the
    // preview and never in PowerPoint.
    const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/ink-two-slides.pptx')))
    const zip = ooxml.readZip(deck)
    expect(ooxml.entryText(zip, 'ppt/slides/slide1.xml')).toMatch(/<mc:Choice[^>]*>\s*<p14:contentPart/)
    const listed = ooxml.outline(zip, { slide: 1 })[0]!.shapes.filter((s) => s.id === '90')
    expect(listed.map((s) => [s.id, s.kind, s.text])).toEqual([['90', 'sp', 'FALLBACK ALT TEXT']])
    const { xml, was } = ooxml.locate(zip, { slide: 1, shape: '90' })
    const refused = /PowerPoint shows another copy of this shape .* neither changed nor deleted/
    expect(() => apply(deck, [{ slide: 1, shape: '90', was, xml: xml.replace('FALLBACK ALT TEXT', 'CHANGED') }] as never)).toThrow(refused)
    expect(() => apply(deck, [{ slide: 1, shape: '90', was, delete: true }] as never)).toThrow(refused)
  })

  test('an OLE object is one shape: the picture it is shown by (inside its graphicFrame) is not one of the slide\'s', () => {
    // apache/poi test-data/slideshow/bug54570.pptx as it is: graphicFrame 4 "Object 3" holds an embedded object whose
    // fallback is a <p:pic> with cNvPr id 0, under graphicData/mc:AlternateContent/mc:Fallback/p:oleObj.
    const real = ooxml.readZip(new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/ole-bug54570.pptx'))))
    expect(ooxml.entryText(real, 'ppt/slides/slide1.xml')).toMatch(/<p:oleObj[\s\S]*<p:cNvPr id="0"/)
    const [first] = ooxml.outline(real, { slide: 1 })
    expect(first!.shapes.map((s) => [s.id, s.name, s.kind])).toEqual([['4', 'Object 3', 'graphicFrame']])
    expect(() => ooxml.locate(real, { slide: 1, shape: '0' })).toThrow(/no shape with id 0/)
  })

  test('an empty run <a:t/> reads as no words, not as the rest of the slide\'s XML', () => {
    // Slide 1 of a real deck as it is: apache/poi test-data/slideshow/aascu.org_hbcu_leadershipsummit_cooper_.pptx.
    const real = readFileSync(resolve(__dirname, 'fixtures/aascu-cooper-slide1.xml'), 'utf8')
    expect(real).toMatch(/<a:t\/>/)
    const [first] = ooxml.outline(ooxml.readZip(withPart('ppt/slides/slide1.xml', () => real)), { slide: 1 })
    expect(first!.shapes.map((s) => [s.id, s.name, s.text])).toEqual([
      ['4098', 'Rectangle 2', '\nPositioning HBCUs in the\nCurrent Environment'],
      ['4099', 'Rectangle 4', 'Michelle Asha Cooper, PhD\nPresident\nmcooper@ihep.org\n'],
      ['4100', 'Rectangle 9', 'PRESENTED BY\nThe Institute for Higher Education Policy'],
      ['4101', 'Rectangle 7', 'Leadership Summit\nJune 2012'],
    ])
  })

  test('a line break inside a paragraph (<a:br>) reads as a line break, not as words run together', () => {
    // The same real slide: the title is one paragraph, an empty run, <a:br>, "Positioning HBCUs in the", <a:br>, "Current Environment".
    const real = readFileSync(resolve(__dirname, 'fixtures/aascu-cooper-slide1.xml'), 'utf8')
    const [first] = ooxml.outline(ooxml.readZip(withPart('ppt/slides/slide1.xml', () => real)), { slide: 1 })
    expect(first!.shapes[0]!.text.split('\n')).toEqual(['', 'Positioning HBCUs in the', 'Current Environment'])
  })

  test('one shape changed: only that slide\'s entry differs, every other record byte for byte; the text is the new one', () => {
    const zip = ooxml.readZip(fixture)
    const { xml } = ooxml.locate(zip, { slide: 1, shape: '2', k: 1 })
    const result = apply(fixture, [{ slide: 1, shape: '2', k: 1, xml: xml.replace('第 1 页 标题', '改过的标题') }] as never)
    const before = records(fixture)
    const after = records(result.bytes)
    const differ = [...before.keys()].filter((name) => !before.get(name)!.equals(after.get(name)!))
    expect(differ).toEqual(['ppt/slides/slide1.xml'])
    expect(result.unchangedEntries).toBe(before.size - 1)
    // Within the part: only the shape's range — the text before and after it is the same.
    const oldText = ooxml.entryText(zip, 'ppt/slides/slide1.xml')!
    const newText = ooxml.entryText(ooxml.readZip(result.bytes), 'ppt/slides/slide1.xml')!
    const at = oldText.indexOf(xml)
    expect(newText.slice(0, at)).toBe(oldText.slice(0, at))
    expect(newText.slice(newText.length - (oldText.length - at - xml.length))).toBe(oldText.slice(at + xml.length))
    expect(ooxml.outline(ooxml.readZip(result.bytes), { slide: 1 })[0]!.shapes[0]!.text).toBe('改过的标题')
  })

  test('a package whose entry names are written with backslashes (ppt\\slides\\slide1.xml, PowerPoint opens it): the page and the script read it; a shape changed keeps the entry\'s name, other entries byte for byte', async () => {
    const back = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/pptx-backslash.pptx')))
    const names = ooxml.readZip(back).entries.map((e) => e.name)
    expect(names).toContain('ppt\\slides\\slide1.xml')
    // The script's reading (ooxml-zip.mjs) and the page's (ooxml-read.js): one name rule, the same slide.
    expect(ooxml.outline(ooxml.readZip(back), { slide: 1 })[0]!.shapes.map((s) => s.text)).toEqual(ooxml.outline(ooxml.readZip(fixture), { slide: 1 })[0]!.shapes.map((s) => s.text))
    const page = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/ooxml-read.js'))) as { partTexts(b: Uint8Array, wanted: RegExp): Promise<(name: string) => string | null> }
    expect((await page.partTexts(back, /^ppt\/slides\/slide1\.xml$/))('ppt/slides/slide1.xml')).toContain('第 1 页 标题')
    const { xml } = ooxml.locate(ooxml.readZip(back), { slide: 1, shape: '2', k: 1 })
    const result = apply(back, [{ slide: 1, shape: '2', k: 1, xml: xml.replace('第 1 页 标题', '改过的标题') }] as never)
    expect(ooxml.readZip(result.bytes).entries.map((e) => e.name)).toEqual(names)
    const before = records(back)
    const after = records(result.bytes)
    expect([...before.keys()].filter((name) => !before.get(name)!.equals(after.get(name)!))).toEqual(['ppt\\slides\\slide1.xml'])
    expect(ooxml.outline(ooxml.readZip(result.bytes), { slide: 1 })[0]!.shapes[0]!.text).toBe('改过的标题')
  })

  test('delete removes the shape; two edits on one slide land together', () => {
    const zip = ooxml.readZip(fixture)
    const text = ooxml.locate(zip, { slide: 2, shape: '2' }).xml
    const result = apply(fixture, [
      { slide: 2, shape: '4', delete: true },
      { slide: 2, shape: '2', xml: text.replace('第 2 页 标题', '第二页') },
    ] as never)
    const shapes = ooxml.outline(ooxml.readZip(result.bytes), { slide: 2 })[0]!.shapes
    expect(shapes.map((s) => s.name)).toEqual(['Text 0', 'Text 1', 'Table 0'])
    expect(shapes[0]!.text).toBe('第二页')
  })

  test('refused, said why, nothing written: a changed id, an id given twice without k, a foreign prefix, an unknown rel, not one shape, bad XML, overlap', () => {
    const zip = ooxml.readZip(fixture)
    const { xml } = ooxml.locate(zip, { slide: 1, shape: '2', k: 1 })
    const refuse = (edits: unknown[], why: RegExp) => expect(() => apply(fixture, edits as never)).toThrow(why)
    refuse([{ slide: 1, shape: '2', k: 1, xml: xml.replace('id="2"', 'id="99"') }], /must keep its cNvPr id 2 \(it has 99\)/)
    refuse([{ slide: 1, shape: '2', xml }], /has 2 shapes with id 2: say which/)
    refuse([{ slide: 1, shape: '2', k: 1, xml: xml.replace('<a:t>', '<x:y/><a:t>') }], /prefixes the slide does not declare: x/)
    refuse([{ slide: 1, shape: '2', k: 1, xml: xml.replace('<p:cNvPr ', '<p:cNvPr r:id="rId99" ') }], /relationships the slide does not have: rId99/)
    refuse([{ slide: 1, shape: '2', k: 1, xml: `${xml}${xml}` }], /exactly one shape element/)
    refuse([{ slide: 1, shape: '2', k: 1, xml: xml.replace('</p:sp>', '') }], /not well-formed/)
    refuse([{ slide: 9, shape: '2', xml }], /no slide 9: the deck has 2/)
    refuse([{ slide: 1, shape: '3', delete: true }, { slide: 1, shape: '3', delete: true }], /overlap/)
  })

  test('the name, when given, must be the shape\'s: a reference read off another version of the deck is refused, not guessed', () => {
    const zip = ooxml.readZip(fixture)
    expect(ooxml.locate(zip, { slide: 1, shape: '3', name: 'Text 1' }).xml).toMatch(/^<p:sp>/)
    expect(() => ooxml.locate(zip, { slide: 1, shape: '3', name: 'Title 1' })).toThrow(/is named "Text 1", not "Title 1".*read it again/)
    const { xml } = ooxml.locate(zip, { slide: 1, shape: '2', k: 2 })
    expect(() => apply(fixture, [{ slide: 1, shape: '2', k: 2, name: 'Text 0', xml }] as never)).toThrow(/is named "Table 0", not "Text 0"/)
  })

  test('a slide that is not exactly its UTF-8 text is not rewritten (splicing the text would change bytes outside the shape)', () => {
    const zip = ooxml.readZip(fixture)
    const part = 'ppt/slides/slide1.xml'
    const raw = ooxml.entryBytes(zip, part)!
    const at = raw.indexOf(Buffer.from('第 1 页 标题'))
    expect(at).toBeGreaterThan(0)
    const latin1 = Buffer.concat([raw.subarray(0, at), Buffer.from([0xe9]), raw.subarray(at)]) // a lone byte that is not UTF-8
    const deck = ooxml.rewriteZip(zip, new Map([[part, latin1]]))
    const { xml } = ooxml.locate(zip, { slide: 1, shape: '3' })
    expect(() => apply(deck, [{ slide: 1, shape: '3', xml }] as never)).toThrow(/slide1\.xml is not plain UTF-8 text/)
    // control: the same kind of edit on slide 2, whose bytes are UTF-8, goes through
    const two = ooxml.locate(zip, { slide: 2, shape: '2' }).xml
    expect(apply(deck, [{ slide: 2, shape: '2', xml: two }] as never).slides).toEqual([2])
  })

  test('A1 strictly well-formed: a bare &, an entity XML does not have, an attribute with no value, one given twice — refused; R&amp;D goes', () => {
    const { xml } = ooxml.locate(ooxml.readZip(fixture), { slide: 1, shape: '3' })
    const edit = (next: string) => apply(fixture, [{ slide: 1, shape: '3', xml: next }] as never)
    const inText = (t: string) => xml.replace('要点：收入增长', t)
    expect(() => edit(inText('R&D'))).toThrow(/not well-formed: an & that is no entity in text/)
    expect(() => edit(inText('a&nbsp;b'))).toThrow(/not well-formed: an & that is no entity in text/)
    expect(() => edit(xml.replace('<a:off ', '<a:off hidden '))).toThrow(/not well-formed: a malformed tag <a:off hidden/)
    expect(() => edit(xml.replace(/<a:off x="(\d+)"/, '<a:off x="$1" x="$1"'))).toThrow(/not well-formed: <a:off> gives x twice/)
    expect(() => edit(xml.replace('<p:cNvPr ', '<p:cNvPr descr="Q&A" '))).toThrow(/an & that is no entity in p:cNvPr descr/)
    // control: what an XML parser takes goes, and reads back as the person wrote it
    const done = edit(inText('R&amp;D &#x4E2D;&lt;'))
    expect(ooxml.outline(ooxml.readZip(done.bytes), { slide: 1 })[0]!.shapes.find((s) => s.id === '3')!.text).toContain('R&D 中<')
  })

  test('A2 a shape something on its slide points at (an animation) is not deleted; nor one whose id the slide repeats; others are', () => {
    const animated = withPart('ppt/slides/slide1.xml', (t) =>
      t.replace('</p:sld>', '<p:timing><p:tnLst><p:par><p:cTn id="1"><p:childTnLst><p:set><p:cBhvr><p:cTn id="2"/><p:tgtEl><p:spTgt spid="3"/></p:tgtEl></p:cBhvr></p:set></p:childTnLst></p:cTn></p:par></p:tnLst><p:bldLst><p:bldP spid="3" grpId="0"/></p:bldLst></p:timing></p:sld>'),
    )
    expect(() => apply(animated, [{ slide: 1, shape: '3', delete: true }] as never)).toThrow(/p:spTgt, p:bldP on this slide refer to it/)
    expect(() => apply(fixture, [{ slide: 1, shape: '2', k: 1, delete: true }] as never)).toThrow(/gives id 2 to 2 shapes .* none is deleted/)
    // control: a shape nothing points at goes; changing the animated one (its id kept) goes too
    expect(ooxml.outline(ooxml.readZip(apply(animated, [{ slide: 1, shape: '4', delete: true }] as never).bytes), { slide: 1 })[0]!.shapes.map((s) => s.id)).toEqual(['2', '3', '2'])
    const { xml } = ooxml.locate(ooxml.readZip(animated), { slide: 1, shape: '3' })
    expect(apply(animated, [{ slide: 1, shape: '3', xml }] as never).slides).toEqual([1])
  })

  test('a deck with no slides (no slide list at all) reads as an empty outline', () => {
    const empty = withPart('ppt/presentation.xml', (t) => t.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, ''))
    expect(ooxml.outline(ooxml.readZip(empty), {})).toEqual([])
    expect(() => ooxml.locate(ooxml.readZip(empty), { slide: 1, shape: '2' })).toThrow(/no slide 1: the deck has 0/)
  })

  test('a group is not deleted while an animation points at one of its shapes', () => {
    const grouped = withPart('ppt/slides/slide1.xml', (t) => {
      const m = /<p:sp>(?:(?!<p:sp>)[\s\S])*?<p:cNvPr id="3"[\s\S]*?<\/p:sp>/.exec(t)!
      const group = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="90" name="Group 1"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${m[0]}</p:grpSp>`
      return t.replace(m[0], group).replace('</p:sld>', '<p:timing><p:tnLst><p:par><p:cTn id="1"><p:childTnLst><p:set><p:cBhvr><p:cTn id="2"/><p:tgtEl><p:spTgt spid="3"/></p:tgtEl></p:cBhvr></p:set></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing></p:sld>')
    })
    expect(() => apply(grouped, [{ slide: 1, shape: '90', delete: true }] as never)).toThrow(/p:spTgt on this slide refer to it/)
  })

  test('A3 a deck with sections: the slides are the slide list\'s, not the section list\'s repeat of them', () => {
    const sectioned = withPart('ppt/presentation.xml', (t) => {
      const ids = [...t.matchAll(/<p:sldId id="(\d+)"/g)].map((m) => m[1])
      const list = `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"><p14:section name="One" id="{00000000-0000-0000-0000-000000000001}"><p14:sldIdLst>${ids.map((id) => `<p14:sldId id="${id}"/>`).join('')}</p14:sldIdLst></p14:section></p14:sectionLst></p:ext></p:extLst>`
      return t.replace('</p:presentation>', `${list}</p:presentation>`)
    })
    expect(ooxml.outline(ooxml.readZip(sectioned), {})).toHaveLength(2)
    const { xml } = ooxml.locate(ooxml.readZip(sectioned), { slide: 2, shape: '2' })
    expect(apply(sectioned, [{ slide: 2, shape: '2', xml }] as never).slides).toEqual([2])
  })

  test('S1 zip64 in any of its forms, and a package cut short, are refused as such (no RangeError)', () => {
    const buf = Buffer.from(fixture)
    const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
    const cd = buf.readUInt32LE(eocd + 16)
    const bigSize = Buffer.from(buf)
    bigSize.writeUInt32LE(0xffffffff, cd + 24) // the first entry's size: "see the zip64 extra"
    expect(() => ooxml.readZip(bigSize)).toThrow(/zip64/)
    const locator = Buffer.concat([buf.subarray(0, eocd), Buffer.alloc(20), buf.subarray(eocd)])
    locator.writeUInt32LE(0x07064b50, eocd)
    expect(() => ooxml.readZip(locator)).toThrow(/zip64/)
    const cut = Buffer.from(buf)
    cut.writeUInt32LE(buf.length + 1000, eocd + 16) // the directory said to start past the end
    expect(() => ooxml.readZip(cut)).toThrow(/the zip is damaged|damaged/)
    expect(() => ooxml.readZip(cut)).not.toThrow(RangeError)
  })

  // A zip saying an entry is small lets a big one past any line drawn on sizes; inflating it then takes what it unpacks to.
  test('S6 an entry that unpacks to more than its zip says: refused, naming it, inflated to no more than that', () => {
    const lie = /^ppt\/slides\/slide1\.xml unpacks to more than the 100 bytes its zip says: the file is damaged or forged$/
    expect(() => ooxml.entryText(ooxml.readZip(forged(100)), 'ppt/slides/slide1.xml')).toThrow(lie)
    expect(() => ooxml.outline(ooxml.readZip(forged(100)), {})).toThrow(lie)
    // Its true size passes: the line is the zip's own number, not a guess.
    const text = `${ooxml.entryText(ooxml.readZip(fixture), 'ppt/slides/slide1.xml')!} `
    expect(ooxml.entryText(ooxml.readZip(forged(Buffer.byteLength(text, 'utf8'))), 'ppt/slides/slide1.xml')).toBe(text)
  })

  test('S2 a streamed package (every entry with a data descriptor): records not changed are copied whole, descriptor and all', () => {
    expect(ooxml.readZip(streamed).entries.every((e) => (e.flags & 8) === 8)).toBe(true) // the fixture is what it says
    const { xml } = ooxml.locate(ooxml.readZip(streamed), { slide: 1, shape: '3' })
    const out = apply(streamed, [{ slide: 1, shape: '3', xml: xml.replace('要点：收入增长', '要点：增长') }] as never).bytes
    const before = spans(streamed)
    const after = spans(out)
    const differ = [...before.keys()].filter((name) => !before.get(name)!.equals(after.get(name)!))
    expect(differ).toEqual(['ppt/slides/slide1.xml'])
  })

  test('S4 the shape stays in the slide\'s namespaces: no unprefixed element, no slide prefix bound elsewhere, no default namespace', () => {
    const { xml } = ooxml.locate(ooxml.readZip(fixture), { slide: 1, shape: '3' })
    const edit = (next: string) => () => apply(fixture, [{ slide: 1, shape: '3', xml: next }] as never)
    const P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
    expect(edit(xml.replace('<p:sp>', `<sp xmlns="${P}">`).replace(/<\/p:sp>$/, '</sp>'))).toThrow(/must be in the slide's namespace/)
    expect(edit(xml.replace('<p:sp>', '<p:sp xmlns:p="urn:other">'))).toThrow(/rebinds xmlns:p/)
    expect(edit(xml.replace('<p:sp>', '<p:sp xmlns="urn:other">'))).toThrow(/rebinds xmlns\b/)
    // B1 control: what real decks write goes back as it was — the same URI declared again, and xmlns="" inside extLst
    expect(edit(xml.replace('<p:sp>', `<p:sp xmlns:p="${P}">`))().slides).toEqual([1])
    const creationId = '<p:cNvPr id="3" name="Text 1"><a:extLst><a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}"><a16:creationId xmlns="" xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{00000000-0000-0000-0000-000000000003}"/></a:ext></a:extLst></p:cNvPr>'
    const withId = xml.replace(/<p:cNvPr id="3" name="Text 1"(\/>|><\/p:cNvPr>)/, creationId)
    expect(withId).toContain('a16:creationId')
    expect(edit(withId)().slides).toEqual([1])
  })

  test('S5 a name is matched as a person reads it: Q&A, not Q&amp;A', () => {
    const { xml } = ooxml.locate(ooxml.readZip(fixture), { slide: 1, shape: '3', name: 'Text 1' })
    const renamed = apply(fixture, [{ slide: 1, shape: '3', xml: xml.replace('name="Text 1"', 'name="Q&amp;A"') }] as never).bytes
    expect(ooxml.locate(ooxml.readZip(renamed), { slide: 1, shape: '3', name: 'Q&A' }).xml).toContain('name="Q&amp;A"')
    expect(() => ooxml.locate(ooxml.readZip(renamed), { slide: 1, shape: '3', name: 'Q&amp;A' })).toThrow(/is named "Q&A"/)
  })
})

describe('was: a change is made to the shape as it was read (per-shape lock, like edit(old, new) on a text file)', () => {
  const zip = () => ooxml.readZip(fixture)
  const title = () => ooxml.locate(zip(), { slide: 1, shape: '2', k: 1 })
  const body = () => ooxml.locate(zip(), { slide: 1, shape: '3' })

  test('read gives each shape its fingerprint: 8 hex digits of its XML, the same in the outline and in a shape read', () => {
    const { xml, was } = title()
    expect(was).toMatch(/^[0-9a-f]{8}$/)
    expect(was).toBe(ooxml.fingerprint(xml))
    const shapes = ooxml.outline(zip(), { slide: 1 })[0]!.shapes
    expect(shapes[0]!.was).toBe(was)
    expect(new Set(shapes.map((s) => s.was)).size).toBe(shapes.length)
  })

  test('an edit without was is refused', () => {
    const { xml } = title()
    expect(() => ooxml.applyEdits(fixture, [{ slide: 1, shape: '2', k: 1, xml }] as never)).toThrow(/was is required/)
  })

  test('a was written otherwise (upper case, cut short, blank around it) is refused as mistyped, not as content-changed', () => {
    const { xml, was } = title()
    // (upper case only when the fingerprint has a letter to raise)
    for (const typed of [was.toUpperCase(), was.slice(0, 7), ` ${was} `, `${was}0`].filter((typed) => typed !== was)) {
      let refused: unknown
      try {
        ooxml.applyEdits(fixture, [{ slide: 1, shape: '2', k: 1, was: typed, xml }] as never)
      } catch (error) {
        refused = error
      }
      expect(String((refused as Error).message)).toMatch(/is not a fingerprint as outline \/ show gives it \(8 lowercase hex digits\) — pass it exactly as read/)
      expect((refused as { code?: string }).code).toBeUndefined()
    }
  })

  test('the shape changed after it was read: refused as content-changed, nothing written; read again, the change goes', () => {
    const read = title()
    // another agent changed the same shape first
    const theirs = ooxml.applyEdits(fixture, [{ slide: 1, shape: '2', k: 1, was: read.was, xml: read.xml.replace('第 1 页 标题', '他们的标题') }] as never).bytes
    let refused: unknown
    try {
      ooxml.applyEdits(theirs, [{ slide: 1, shape: '2', k: 1, was: read.was, xml: read.xml.replace('第 1 页 标题', '我的标题') }] as never)
    } catch (error) {
      refused = error
    }
    expect(refused).toMatchObject({ code: 'content-changed' })
    expect(String((refused as Error).message)).toMatch(new RegExp(`content-changed — the shape was changed after you read it \\(was ${read.was}, now [0-9a-f]{8}\\): read it again`))
    // read again: the change is made to what is there now
    const again = ooxml.locate(ooxml.readZip(theirs), { slide: 1, shape: '2', k: 1 })
    expect(again.xml).toContain('他们的标题')
    const mine = ooxml.applyEdits(theirs, [{ slide: 1, shape: '2', k: 1, was: again.was, xml: again.xml.replace('他们的标题', '我的标题') }] as never)
    expect(ooxml.outline(ooxml.readZip(mine.bytes), { slide: 1 })[0]!.shapes[0]!.text).toBe('我的标题')
  })

  test('another shape changed meanwhile does not stop it: both changes are in the file', () => {
    const t = title()
    const b = body()
    const theirs = ooxml.applyEdits(fixture, [{ slide: 1, shape: '3', was: b.was, xml: b.xml.replace('要点：收入增长', '他们改的要点') }] as never).bytes
    const mine = ooxml.applyEdits(theirs, [{ slide: 1, shape: '2', k: 1, was: t.was, xml: t.xml.replace('第 1 页 标题', '我的标题') }] as never)
    const texts = ooxml.outline(ooxml.readZip(mine.bytes), { slide: 1 })[0]!.shapes.map((s) => s.text)
    expect(texts.slice(0, 2)).toEqual(['我的标题', '他们改的要点'])
  })

  test('a delete is made to the shape as read too', () => {
    const b = body()
    const theirs = ooxml.applyEdits(fixture, [{ slide: 1, shape: '3', was: b.was, xml: b.xml.replace('要点：收入增长', '他们改的要点') }] as never).bytes
    expect(() => ooxml.applyEdits(theirs, [{ slide: 1, shape: '3', was: b.was, delete: true }] as never)).toThrow(/content-changed/)
  })

  test('the answer gives each edited shape\'s was now — what a read of the new version gives — so a next change needs no read', () => {
    const t = title()
    const b = body()
    // blank around the new XML is allowed: the was is the element's, as the slide has it
    const first = ooxml.applyEdits(fixture, [
      { slide: 1, shape: '2', k: 1, was: t.was, xml: `\n  ${t.xml.replace('第 1 页 标题', '第一次')}\n` },
      { slide: 1, shape: '4', was: ooxml.locate(zip(), { slide: 1, shape: '4' }).was, delete: true },
    ] as never)
    const now = ooxml.locate(ooxml.readZip(first.bytes), { slide: 1, shape: '2', k: 1 })
    expect(first.shapes).toEqual([
      { slide: 1, shape: '2', k: 1, was: now.was },
      { slide: 1, shape: '4', deleted: true },
    ])
    expect(now.was).not.toBe(t.was)
    // its own change made the was it read stale: with that one it is refused, with the answer's it goes
    expect(() => ooxml.applyEdits(first.bytes, [{ slide: 1, shape: '2', k: 1, was: t.was, xml: now.xml }] as never)).toThrow(/content-changed/)
    const second = ooxml.applyEdits(first.bytes, [{ slide: 1, shape: '2', k: 1, was: first.shapes[0]!.was, xml: now.xml.replace('第一次', '第二次') }] as never)
    expect(ooxml.outline(ooxml.readZip(second.bytes), { slide: 1 })[0]!.shapes[0]!.text).toBe('第二次')
    // a shape whose id is its own has no k in the answer
    expect(ooxml.applyEdits(fixture, [{ slide: 1, shape: '3', was: b.was, xml: b.xml }] as never).shapes).toEqual([{ slide: 1, shape: '3', was: b.was }])
  })
})

describe('checkRenders: the changed slides drawn before and after', () => {
  const scope = { slides: [1], parts: ['ppt/slides/slide1.xml'] }
  const said = (code: string, slideNumber?: number, severity: Diagnostic['severity'] = 'warning'): Diagnostic => ({
    source: 'renderer-adapter',
    severity,
    code,
    message: code,
    ...(slideNumber === undefined ? {} : { slideNumber }),
  })
  const fake = (before: Diagnostic[], after: Diagnostic[] | Error): Convert => {
    let call = 0
    return async () => {
      call++
      if (call === 2 && after instanceof Error) throw after
      return { slides: [{}], diagnostics: call === 1 ? before : (after as Diagnostic[]) }
    }
  }
  const a = new Uint8Array([1])
  const b = new Uint8Array([2])

  test('a new warning about a changed slide refuses, quoting it; one it already had, a deck-wide one, or an info does not', async () => {
    await expect(ooxml.checkRenders(fake([], [said('missing-transform', 1)]), a, b, scope)).rejects.toThrow(/pptx-glimpse says: warning missing-transform \(slide 1\)/)
    await expect(ooxml.checkRenders(fake([said('x', 1)], [said('x', 1)]), a, b, scope)).resolves.toBeUndefined()
    await expect(ooxml.checkRenders(fake([said('x', 1)], [said('x', 1), said('x', 1)]), a, b, scope)).rejects.toThrow(/warning x \(slide 1\)/)
    await expect(ooxml.checkRenders(fake([], [said('renderer.font.notFound'), said('note', 1, 'info')]), a, b, scope)).resolves.toBeUndefined()
    await expect(ooxml.checkRenders(fake([], [{ ...said('rel'), sourcePartPath: 'ppt/slides/slide1.xml' }]), a, b, scope)).rejects.toThrow(/warning rel/)
  })

  test('a deck that no longer draws refuses; so does one glimpse could not draw before (nothing to compare with)', async () => {
    await expect(ooxml.checkRenders(fake([], new Error('boom')), a, b, scope)).rejects.toThrow(/could not draw the changed deck: boom/)
    const neverDraws: Convert = async () => {
      throw new Error('bad zip')
    }
    await expect(ooxml.checkRenders(neverDraws, a, b, scope)).rejects.toThrow(/cannot draw this deck as it is/)
  })

  test('with the bundled pptx-glimpse: a text change passes, a shape whose position is no number is refused', async () => {
    const { convertPptxToSvg } = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/vendor/pptx-glimpse.js'))) as { convertPptxToSvg: Convert }
    const zip = ooxml.readZip(fixture)
    const { xml } = ooxml.locate(zip, { slide: 1, shape: '3' })
    const good = apply(fixture, [{ slide: 1, shape: '3', xml: xml.replace('要点：收入增长', '要点：增长 23%') }] as never)
    await expect(ooxml.checkRenders(convertPptxToSvg, fixture, good.bytes, scope)).resolves.toBeUndefined()
    const bad = apply(fixture, [{ slide: 1, shape: '3', xml: xml.replace(/<a:off x="\d+"/, '<a:off x="abc"') }] as never)
    await expect(ooxml.checkRenders(convertPptxToSvg, fixture, bad.bytes, scope)).rejects.toThrow(/missing-transform \(slide 1\)/)
  })
})

describe('scripts/pptx.mjs: the skill\'s script, as an agent runs it in its own shell', () => {
  const script = resolve(appDir, 'skills/office/scripts/pptx.mjs')
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'office-pptx-'))
    writeFileSync(join(dir, 'deck.pptx'), fixture)
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))
  // As the agent runs it: its own process (process.execPath here is node, as gugu-node is on a server), cwd its folder.
  const run = (...args: string[]) => {
    const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
    return { status: r.status, out: r.stdout, err: r.stderr, json: () => JSON.parse(r.stdout) as Record<string, unknown> }
  }
  const deck = () => readFileSync(join(dir, 'deck.pptx'))
  const edits = (list: unknown[]) => {
    writeFileSync(join(dir, 'edits.json'), JSON.stringify(list))
    return 'edits.json'
  }
  const shape3 = () => run('show', 'deck.pptx', '1', '3').json() as unknown as { xml: string; was: string }

  test('no command: the usage, exit 1, nothing on stdout', () => {
    const r = run()
    expect(r.status).toBe(1)
    expect(r.out).toBe('')
    expect(r.err).toMatch(/^usage: pptx\.mjs outline <deck\.pptx>/)
  })

  test('an older Node (no node:zlib crc32 before 22.2): one sentence naming gugu-node, exit 1, before the modules load', () => {
    const older = 'data:text/javascript,Object.defineProperty(process.versions,"node",{value:"22.1.0"})'
    const r = spawnSync(process.execPath, ['--import', older, script, 'outline', 'deck.pptx'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
    expect(r.status).toBe(1)
    expect(r.stdout).toBe('')
    expect(r.stderr).toBe('this script needs Node 22.2 or later (this is 22.1.0): run it with gugu-node\n')
  })

  test('outline: every slide\'s shapes with their was; show: one shape\'s XML (k for a repeated id), its slide\'s relationships', () => {
    const all = run('outline', 'deck.pptx')
    expect(all.status).toBe(0)
    expect(all.err).toBe('') // nothing else said: no warning about the modules' type (skills/office/package.json)
    const slides = all.json().slides as { slide: number; shapes: { id: string; was: string }[] }[]
    expect(slides.map((s) => s.slide)).toEqual([1, 2])
    expect(slides[0]!.shapes.every((s) => /^[0-9a-f]{8}$/.test(s.was))).toBe(true)
    const one = run('show', 'deck.pptx', '1', '2:2').json() as { xml: string; was: string; relationships: string[] }
    expect(one.xml).toMatch(/^<p:graphicFrame>/)
    expect(one.was).toMatch(/^[0-9a-f]{8}$/)
    expect(one.relationships.length).toBeGreaterThan(0)
  })

  test('apply in place: one shape changed, every other entry\'s bytes as they were, each edited shape\'s was now', () => {
    const before = deck()
    const { xml, was } = shape3()
    const r = run('apply', 'deck.pptx', edits([{ slide: 1, shape: '3', was, xml: xml.replace('要点：收入增长', '要点：增长 23%') }]))
    expect(r.err).toBe('')
    expect(r.status).toBe(0)
    const done = r.json() as { changed: { part: string }[]; shapes: { was: string }[] }
    expect(done.changed.map((c) => c.part)).toEqual(['ppt/slides/slide1.xml'])
    expect(done.shapes).toEqual([{ slide: 1, shape: '3', was: expect.stringMatching(/^[0-9a-f]{8}$/) }])
    expect(done.shapes[0]!.was).not.toBe(was)
    const was0 = records(before)
    const now = records(deck())
    expect([...now.keys()].filter((name) => !now.get(name)!.equals(was0.get(name)!))).toEqual(['ppt/slides/slide1.xml'])
    expect(readdirSync(dir).sort()).toEqual(['deck.pptx', 'edits.json']) // nothing left beside it
  })

  test('apply refused (not well-formed; a slide pptx-glimpse now warns about; a shape changed since it was read): exit 1, one sentence, the deck untouched', () => {
    const before = deck()
    const { xml, was } = shape3()
    const cases: [unknown[], RegExp][] = [
      [[{ slide: 1, shape: '3', was, xml: '<p:sp>' }], /not well-formed/],
      [[{ slide: 1, shape: '3', was, xml: xml.replace(/<a:off x="\d+"/, '<a:off x="abc"') }], /pptx-glimpse says: .*missing-transform/],
      [[{ slide: 1, shape: '3', was: '00000000', xml }], /^edits\[0\] \(slide 1, shape 3\): content-changed — the shape was changed after you read it \(was 00000000, now [0-9a-f]{8}\): read it again \(show\)/],
    ]
    for (const [list, said] of cases) {
      const r = run('apply', 'deck.pptx', edits(list), '-o', 'out.pptx')
      expect(r.status).toBe(1)
      expect(r.out).toBe('')
      expect(r.err).toMatch(said)
      expect(r.err.trim().split('\n')).toHaveLength(1)
    }
    expect(deck().equals(before)).toBe(true)
    expect(readdirSync(dir).sort()).toEqual(['deck.pptx', 'edits.json'])
  })

  test('a deck whose zip says a slide is smaller than it unpacks to: refused, one sentence, exit 1', () => {
    writeFileSync(join(dir, 'forged.pptx'), forged(100))
    const r = run('outline', 'forged.pptx')
    expect(r.status).toBe(1)
    expect(r.out).toBe('')
    expect(r.err).toBe('ppt/slides/slide1.xml unpacks to more than the 100 bytes its zip says: the file is damaged or forged\n')
  })

  test('check --against: which entries changed, the changed slides drawn with no new warning; a part that is no XML is refused', () => {
    const { xml, was } = shape3()
    expect(run('apply', 'deck.pptx', edits([{ slide: 1, shape: '3', was, xml: xml.replace('要点：收入增长', '要点：增长 23%') }]), '-o', 'out.pptx').status).toBe(0)
    const r = run('check', 'out.pptx', '--against', 'deck.pptx')
    expect(r.status).toBe(0)
    expect(r.json()).toMatchObject({ changed: ['ppt/slides/slide1.xml'], changedSlides: [1] })
    const alone = run('check', 'deck.pptx')
    expect(alone.status).toBe(0)
    expect(alone.json()).toMatchObject({ slides: 2 })
    // A deck whose entry names are written with backslashes: checked by those names, entry for entry.
    writeFileSync(join(dir, 'back.pptx'), readFileSync(resolve(__dirname, 'fixtures/pptx-backslash.pptx')))
    const back = run('check', 'back.pptx', '--against', 'back.pptx')
    expect(back.err).toBe('')
    expect(back.json()).toMatchObject({ changed: [], changedSlides: [] })
    // Slide 1 of it really changed: the changed slide is drawn (by its part name) — pptx-glimpse cannot draw such a deck,
    // so it is refused, as apply refuses it; not passed with nothing drawn (review of d65101bd24).
    const backBytes = new Uint8Array(readFileSync(join(dir, 'back.pptx')))
    const { xml: title } = ooxml.locate(ooxml.readZip(backBytes), { slide: 1, shape: '2', k: 1 })
    writeFileSync(join(dir, 'back-changed.pptx'), apply(backBytes, [{ slide: 1, shape: '2', k: 1, xml: title.replace('第 1 页 标题', '改过的标题') }] as never).bytes)
    const backChanged = run('check', 'back-changed.pptx', '--against', 'back.pptx')
    expect(backChanged.status).toBe(1)
    expect(backChanged.out).toBe('')
    expect(backChanged.err).toMatch(/^pptx-glimpse cannot draw this deck as it is, so a change to it cannot be checked: /)
    writeFileSync(join(dir, 'broken.pptx'), withPart('ppt/slides/slide2.xml', (text) => text.replace('</p:sld>', '<a:t>x &nbsp; y</a:t></p:sld>')))
    const broken = run('check', 'broken.pptx', '--against', 'deck.pptx')
    expect(broken.status).toBe(1)
    expect(broken.err).toMatch(/^ppt\/slides\/slide2\.xml is not well-formed XML: /)
  })
})
