// @vitest-environment jsdom
// 咕咕办公开着的 .pptx 重画(或第一次打开)要读要画好几秒,这期间人还在用屏上的那份(评审 2026-10-12 B1、B2):
// - 读新版的时候人点了一处、或者正拖着一个框:新版不换上去,那一处 / 那一框留着,横条说有新版,人说了才换(B1);
// - 新版或第一次打开还在画时人换去看另一份文件:画完不盖住那一份(B2,第一次打开那条路父提交起就有);
// - files.open 交出的版本比列表说的旧:画到它交出的那一版就停,不一圈接一圈地重开;列表说出更新的版本再画。
// 运行时是假的(files.open 能卡住、能慢一个宏任务;list / onChanged;换文件 = onContextChanged);稿子是真的
// fixtures/two-slides.pptx,新版本用 A2 的写回改出来;pptx-glimpse 是真的,外面包一层闸,好让「还在画」停在那里。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'

const glimpse = vi.hoisted(() => ({ armed: false, waiting: false, release: null as null | (() => void) }))
vi.mock('../app/skills/office/vendor/pptx-glimpse.js', async (importOriginal) => {
  const real = await importOriginal<Record<string, (...args: unknown[]) => unknown>>()
  return {
    ...real,
    // Armed: the next deck drawn waits here ("still drawing") until released.
    convertPptxToSvg: async (...args: unknown[]) => {
      if (glimpse.armed) {
        glimpse.armed = false
        glimpse.waiting = true
        await new Promise<void>((release) => (glimpse.release = release))
        glimpse.waiting = false
      }
      return real.convertPptxToSvg!(...args)
    },
  }
})

const appDir = resolve(__dirname, '../app')
const v1 = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))

interface Ooxml {
  readZip(bytes: Uint8Array): unknown
  locate(zip: unknown, address: { slide: number; shape: string; k?: number }): { xml: string; was: string }
  applyEdits(bytes: Uint8Array, edits: never): { bytes: Uint8Array }
}
let ooxml: Ooxml
/** `bytes` with slide 1's title saying `title` instead (A2's own write-back). */
const retitled = (bytes: Uint8Array, from: string, title: string) => {
  const { xml, was } = ooxml.locate(ooxml.readZip(bytes), { slide: 1, shape: '2', k: 1 })
  return ooxml.applyEdits(bytes, [{ slide: 1, shape: '2', k: 1, was, xml: xml.replace(from, title) }] as never).bytes
}

const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const entryOf = (id: string, version: number) => ({
  id, chat: 'chat-1', name: `${id}.pptx`, displayName: `${id}.pptx`, contentType: PPTX, type: 'binary', suffix: '.pptx', size: v1.length,
  createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version,
})
// `deck` moves through versions; `deck2` is the other file the person turns to.
const rt = {
  versions: new Map<number, Uint8Array>([[1, v1]]),
  stored: 1, // the version files.open hands out for deck
  listed: 1, // the version files.list says for deck
  armOpen: false,
  openGate: null as null | (() => void),
  openDelayMs: 0,
  openCap: Infinity,
  opens: 0,
  handles: [] as { id: string; version: number; close: ReturnType<typeof vi.fn> }[],
  changed: () => {},
  handTo: (_ctx: unknown) => {},
}
const ctxFor = (id: string) => ({ chat: { id: 'chat-1', name: 'G', kind: 'group', groupId: 'chat-1' }, file: { chat: 'chat-1', id }, locale: 'zh-CN', capabilities: ['files:read'] })
const gugu = {
  setTabTitle: vi.fn(async () => {}),
  getContext: vi.fn(async () => ctxFor('deck')),
  onLink: vi.fn(),
  onContextChanged: vi.fn((handler: (ctx: unknown) => void) => {
    rt.handTo = handler
    return () => {}
  }),
  compose: vi.fn(async (_text: string) => {}),
  files: {
    list: vi.fn(async () => [entryOf('deck', rt.listed), entryOf('deck2', 1)]),
    onChanged: vi.fn((_place: unknown, handler: () => void) => {
      rt.changed = handler
      return () => {}
    }),
    open: vi.fn(async (ref: { id: string }) => {
      // A real open crosses IPC: a macrotask, so timers still run even if the page opened in a loop.
      if (rt.openDelayMs) await new Promise((r) => setTimeout(r, rt.openDelayMs))
      // Never forever: past the cap, open catches up with the list (a loop under test still ends, and is counted).
      if (++rt.opens > rt.openCap) rt.stored = rt.listed
      if (rt.armOpen) {
        rt.armOpen = false
        await new Promise<void>((release) => (rt.openGate = release))
      }
      const version = ref.id === 'deck' ? rt.stored : 1
      const bytes = ref.id === 'deck' ? rt.versions.get(version)! : v1
      const close = vi.fn()
      rt.handles.push({ id: ref.id, version, close })
      // Only arrayBuffer() is read; jsdom's Blob may not have it.
      return { entry: entryOf(ref.id, version), type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => bytes.slice().buffer }), close }
    }),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// A deck read and drawn by the real pptx-glimpse: under a loaded machine (every test file at once) it takes its time.
const until = (check: () => void, timeout = 5000) => vi.waitFor(check, { timeout })
/** The slides' pictures: new ones once a deck is drawn (each picture its own object URL). */
const srcs = () => [...$('preview').querySelectorAll('.pptx-slide img')].map((img) => img.getAttribute('src'))
const deckOpens = () => gugu.files.open.mock.calls.filter(([ref]) => (ref as { id: string }).id === 'deck').length
let listCalls = 0
/** What the list says of deck from now (and open hands out, unless `openToo` is false), then the workspace_changed heard. */
async function listed(version: number, { openToo = true, bytes }: { openToo?: boolean; bytes?: Uint8Array } = {}) {
  if (bytes) rt.versions.set(version, bytes)
  if (openToo) rt.stored = version
  rt.listed = version
  rt.changed()
  await until(() => expect(gugu.files.list).toHaveBeenCalledTimes(listCalls + 1))
  listCalls++
}
/** The host hands the page another file (the person opened it), and it is drawn; the page reads the list once then. */
async function show(id: string) {
  const before = srcs()
  rt.handTo(ctxFor(id))
  await until(() => {
    expect(gugu.setTabTitle).toHaveBeenLastCalledWith(`${id}.pptx`)
    expect(srcs()).toHaveLength(2)
    expect(srcs()[0]).not.toBe(before[0])
  })
  listCalls = gugu.files.list.mock.calls.length
}

beforeAll(async () => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  // jsdom has no pointer capture; a box drag asks for it.
  Object.assign(HTMLElement.prototype, { setPointerCapture: HTMLElement.prototype.setPointerCapture ?? (() => {}) })
  ooxml = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-ooxml.mjs'))) as Ooxml
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  // A desktop with a mouse (jsdom has no matchMedia): the bar floats by what is picked, Esc lets it go.
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  // The first open reads the vendored pptx-glimpse cold.
  await until(() => expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2), 15000)
  listCalls = gugu.files.list.mock.calls.length
}, 30000)

describe('咕咕办公 · 重画的时候人还在用屏上的那份', () => {
  test('读新版的时候人点了一处:新版不换上,那一处留着,横条说有第 2 版;点「打开新的一版」才换', async () => {
    const before = srcs()
    rt.armOpen = true
    await listed(2, { bytes: retitled(v1, '第 1 页 标题', '第二版的标题') })
    await until(() => expect(rt.openGate).not.toBeNull())
    // Version 1 still on screen: the person picks its title while version 2 is read.
    $('preview').querySelector<HTMLButtonElement>('.pptx-slide[data-n="1"] .pptx-hit')!.click()
    expect($('pick-count').textContent).toBe('1 处')
    rt.openGate!()
    rt.openGate = null
    await until(() => expect($('banner').textContent).toContain('有了第 2 版；你攒着的 1 处是在第 1 版上选的'))
    expect(srcs()).toEqual(before)
    expect($('pick-count').textContent).toBe('1 处')
    expect($('preview').querySelectorAll('.pptx-hit.picked')).toHaveLength(1)
    // The new version's handle is not kept, and nothing is opened again on its own.
    expect(rt.handles.at(-1)!.close).toHaveBeenCalledTimes(1)
    const opens = deckOpens()
    await sleep(50)
    expect(deckOpens()).toBe(opens)

    $('banner').querySelector('button')!.click()
    await until(() => expect(srcs()[0]).not.toBe(before[0]))
    expect($('pick-bar').classList.contains('on')).toBe(false)
    expect($('banner').hidden).toBe(true)
  })

  test('读新版的时候人正拖着一个框:新版不换上,框照样落下;横条说有第 3 版', async () => {
    const card = $('preview').querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
    card.getBoundingClientRect = () => ({ left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540, x: 0, y: 0, toJSON: () => ({}) })
    const pointer = (type: string, x: number, y: number) => card.dispatchEvent(Object.assign(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }), { pointerId: 1 }))
    pointer('pointerdown', 10, 10)
    const before = srcs()
    await listed(3, { bytes: retitled(rt.versions.get(2)!, '第二版的标题', '第三版的标题') })
    await until(() => expect($('banner').textContent).toContain('有了第 3 版'))
    expect(srcs()).toEqual(before)
    pointer('pointermove', 500, 300)
    pointer('pointerup', 500, 300)
    expect($('pick-count').textContent).toBe('1 处')
    expect($('banner').textContent).toContain('有了第 3 版；你攒着的 1 处是在第 2 版上选的')

    $('banner').querySelector('button')!.click()
    await until(() => expect(srcs()[0]).not.toBe(before[0]))
    expect($('banner').hidden).toBe(true)
  })

  test('新版还在画时人换去看另一份文件:画完不盖住那一份', async () => {
    glimpse.armed = true
    await listed(4, { bytes: retitled(rt.versions.get(3)!, '第三版的标题', '第四版的标题') })
    await until(() => expect(glimpse.waiting).toBe(true))
    await show('deck2')
    const deck2 = srcs()
    glimpse.release!()
    await until(() => expect(glimpse.waiting).toBe(false))
    await sleep(100)
    expect(gugu.setTabTitle).toHaveBeenLastCalledWith('deck2.pptx')
    expect(srcs()).toEqual(deck2)
    expect($('preview').querySelectorAll('.pptx-deck')).toHaveLength(1)
  })

  test('第一次打开还在画时人换去看另一份文件:画完不盖住那一份', async () => {
    glimpse.armed = true
    rt.handTo(ctxFor('deck'))
    await until(() => expect(glimpse.waiting).toBe(true))
    await show('deck2')
    const deck2 = srcs()
    glimpse.release!()
    await until(() => expect(glimpse.waiting).toBe(false))
    await sleep(100)
    expect(gugu.setTabTitle).toHaveBeenLastCalledWith('deck2.pptx')
    expect(srcs()).toEqual(deck2)
    expect($('preview').querySelectorAll('.pptx-deck')).toHaveLength(1)
  })

  test('open 交出的版本比列表说的旧:画到它交出的那一版就停,不再重开;列表说出更新的版本再画', async () => {
    await show('deck')
    rt.versions.set(5, retitled(rt.versions.get(4)!, '第四版的标题', '第五版的标题'))
    rt.versions.set(6, retitled(rt.versions.get(4)!, '第四版的标题', '第六版的标题'))
    rt.openDelayMs = 5
    rt.openCap = rt.opens + 200
    const opens = deckOpens()
    // Every slide drawn is a picture made: two a deck.
    const drawn = () => (URL.createObjectURL as unknown as ReturnType<typeof vi.fn>).mock.calls.length
    const pictures = drawn()
    const before = srcs()
    rt.stored = 5
    await listed(6, { openToo: false })
    await until(() => expect(srcs()[0]).not.toBe(before[0]))
    const fifth = srcs()
    await sleep(500)
    // One open drew version 5; one more found version 5 again and drew nothing. Then it waits for the list.
    expect(deckOpens() - opens).toBe(2)
    expect(drawn() - pictures).toBe(2)
    expect(srcs()).toEqual(fifth)

    await listed(7, { bytes: retitled(rt.versions.get(4)!, '第四版的标题', '第七版的标题') })
    await until(() => expect(srcs()[0]).not.toBe(fifth[0]))
    rt.openDelayMs = 0
  })
})
