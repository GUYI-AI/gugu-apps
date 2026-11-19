// @vitest-environment jsdom
// 咕咕办公 · 选区旁边的那一条,在一台说自己是手指的设备上((pointer: coarse)):还没有任何按下时,布局照设备说的来 ——
// 浮条在底部正中;第一下用的是鼠标,收起以后就换成跟着选区走(officePickBar.test.ts 是另一种开头:设备说鼠标)。
// 运行时是假的;稿子是真的 fixtures/two-slides.pptx。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')
const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
const entry = {
  id: 'deck', chat: 'group-1', name: '季度.pptx', displayName: '季度.pptx', contentType: 'application/octet-stream', type: 'binary', suffix: '.pptx',
  size: deck.length, createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
}
const ctx = { chat: { id: 'group-1', name: 'G', kind: 'group', groupId: 'group-1' }, file: { id: 'deck', chat: 'group-1' }, locale: 'zh-CN', capabilities: ['files:read'] }
const gugu = {
  setTabTitle: vi.fn(async () => {}),
  getContext: vi.fn(async () => ctx),
  onLink: vi.fn(),
  onContextChanged: vi.fn(() => () => {}),
  dispatch: vi.fn(async () => {}),
  files: {
    list: vi.fn(async () => [entry]),
    onChanged: vi.fn(() => () => {}),
    open: vi.fn(async () => ({ entry, type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => deck.slice().buffer }), close: vi.fn() })),
  },
}
const $ = (id: string) => document.getElementById(id) as HTMLElement
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
const hits = () => [...$('preview').querySelectorAll<HTMLButtonElement>('.pptx-slide[data-n="1"] .pptx-hit')]
const pick = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
const place = () => [parseFloat($('pick-bar').style.left), parseFloat($('pick-bar').style.top)]

beforeAll(async () => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  window.matchMedia = vi.fn((query: string) => ({ matches: query === '(pointer: coarse)', media: query }) as unknown as MediaQueryList)
  $('preview').getBoundingClientRect = () => rect(0, 0, 400, 800)
  Object.defineProperty($('pick-bar'), 'offsetWidth', { value: 200 })
  Object.defineProperty($('pick-bar'), 'offsetHeight', { value: 48 })
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  await vi.waitFor(() => expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2), { timeout: 15000 })
}, 30000)

describe('咕咕办公 · 设备说是手指', () => {
  test('还没按过:浮条在底部正中;第一下是鼠标,收起以后就跟着选区走', () => {
    expect(document.body.classList.contains('fingers')).toBe(true)
    const [first] = hits()
    first!.getBoundingClientRect = () => rect(100, 400, 200, 80)
    pick(first!)
    expect(place()).toEqual([100, 800 - 48 - 22])
    $('pick-clear').click()
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
    expect(document.body.classList.contains('fingers')).toBe(false)
    pick(first!)
    // Beside it now: right edge 300 − 200, top 400 − 48 − 10.
    expect(place()).toEqual([100, 342])
  })
})
