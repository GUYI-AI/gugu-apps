// @vitest-environment jsdom
// 咕咕办公 · 右键:宿主那一份菜单(gugu.showContextMenu),装的是浮条上那几件事 —— 放进输入框 / 交给 agent / 全部取消。
// 指针下面没选中的先选上(表格都这样);已经在一处选区里面就不动选区。手指的长按仍是表自己的。
// 运行时是假的(getContext / files.open / list / onChanged / dispatch / showContextMenu);表是真的 fixtures/xlsx-sales.xlsx。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { until } from './support/awaitCondition'

const appDir = resolve(__dirname, '../app')
const book = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/xlsx-sales.xlsx')))
const entry = {
  id: 'book', chat: 'group-1', name: '销售.xlsx', displayName: '销售.xlsx', contentType: 'application/octet-stream', type: 'binary', suffix: '.xlsx',
  size: book.length, createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
}
const ctx = { chat: { id: 'group-1', name: 'G', kind: 'group', groupId: 'group-1' }, file: { id: 'book', chat: 'group-1' }, locale: 'zh-CN', capabilities: ['files:read'] }
const gugu = {
  setTabTitle: vi.fn(async () => {}),
  getContext: vi.fn(async () => ctx),
  onContextChanged: vi.fn(() => () => {}),
  dispatch: vi.fn(async (_text: string, _where: unknown) => {}),
  showContextMenu: vi.fn(async (_menu: { x: number; y: number; items: Array<Record<string, unknown>> }): Promise<string | null> => null),
  onLink: vi.fn((handler: (link: { query: Record<string, string>; file: string | null }) => void) => { linked = handler }),
  files: {
    list: vi.fn(async () => [entry]),
    onChanged: vi.fn(() => () => {}),
    open: vi.fn(async () => ({ entry, type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => book.slice().buffer }), close: vi.fn() })),
  },
}

let linked: (link: { query: Record<string, string>; file: string | null }) => void = () => {}
const $ = (id: string) => document.getElementById(id) as HTMLElement
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
const bar = () => $('pick-bar')
const shown = () => bar().classList.contains('on')
const place = () => [parseFloat(bar().style.left), parseFloat(bar().style.top)]
const sheet = () => $('preview').querySelector<HTMLElement>('.xlsx-scroll')!
// The sheet's geometry as the view lays this file out (officeXlsxView): row numbers 36 px, header 22 px, row 1 frozen.
const at = (r: number, c: number) => ({ clientX: 36 + [0, 89, 164, 239, 314][c]! + 5, clientY: 22 + 20 * r + 5 })
const pointer = (type: string, init: Record<string, unknown>) => Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }), { pointerId: 1 })
const click = (r: number, c: number, mods: Record<string, unknown> = {}) => {
  sheet().dispatchEvent(pointer('pointerdown', { ...at(r, c), ...mods }))
  sheet().dispatchEvent(pointer('pointerup', at(r, c)))
}
const key = (target: EventTarget, init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}
/** A press of the page's, by a mouse or a finger: the page lays the bar out for the hand used last. */
const hand = (pointerType: 'touch' | 'mouse') => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType }))
const scrolled = (top: number) => {
  Object.defineProperty(sheet(), 'scrollTop', { configurable: true, writable: true, value: top })
  sheet().dispatchEvent(new Event('scroll'))
}

beforeAll(async () => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 900 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
  globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0)) as unknown as typeof requestAnimationFrame
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  // The panel: 600 × 800 at the top of the page (the sheet's box at its corner: jsdom lays nothing out); the bar 220 × 36.
  $('preview').getBoundingClientRect = () => rect(0, 0, 600, 800)
  Object.defineProperty(bar(), 'offsetWidth', { value: 220 })
  Object.defineProperty(bar(), 'offsetHeight', { value: 36 })
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  await until('the sheet is drawn', () => $('preview').querySelector('.xlsx-scroll') !== null)
}, 30000)

beforeEach(() => {
  $('pick-clear').click()
  hand('mouse')
  scrolled(0)
  gugu.dispatch.mockClear()
  gugu.showContextMenu.mockClear()
})

const rightClick = (r: number, c: number, pointerType = 'mouse') => {
  const event = Object.assign(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, ...at(r, c) }), { pointerType })
  sheet().dispatchEvent(event)
  return event
}
const ITEMS = [
  { id: 'send', label: '放进输入框', enabled: true },
  { id: 'dispatch', label: '交给 agent', enabled: true },
  { type: 'separator' },
  { id: 'clear', label: '全部取消', enabled: true },
]

describe('咕咕办公 · 右键是宿主的菜单', () => {
  test('右键一格没选中的:先选上它,菜单是浮条那三件事;选「交给 agent」= 浮条的「交给 agent」', async () => {
    gugu.showContextMenu.mockResolvedValueOnce('dispatch')
    expect(rightClick(2, 2).defaultPrevented).toBe(true)
    expect($('pick-count').textContent).toBe('1 处')
    expect(gugu.showContextMenu).toHaveBeenCalledWith({ x: at(2, 2).clientX, y: at(2, 2).clientY, items: ITEMS })
    await until('the agent sheet was handed the pick', () => gugu.dispatch.mock.calls.length === 1)
    expect(gugu.dispatch.mock.calls[0]).toEqual(['', { refs: [{ file: entry, version: 1, at: { range: '销售!C3' }, label: '销售!C3' }] }])
  })

  test('右键落在已选的一片里:选区不动;「全部取消」= 浮条的 ✕', async () => {
    click(1, 1)
    sheet().dispatchEvent(pointer('pointerdown', { ...at(3, 3), shiftKey: true }))
    sheet().dispatchEvent(pointer('pointerup', at(3, 3)))
    click(5, 4, { metaKey: true })
    expect($('pick-count').textContent).toBe('2 处')
    gugu.showContextMenu.mockResolvedValueOnce('clear')
    rightClick(2, 2)
    expect($('pick-count').textContent).toBe('2 处')
    await until('the picks were let go', () => !shown())
    expect(gugu.dispatch).not.toHaveBeenCalled()
  })

  test('右键另一格:换成选它(不是加一处);「放进输入框」放的就是这一格', async () => {
    click(1, 1)
    gugu.showContextMenu.mockResolvedValueOnce('send')
    rightClick(4, 3)
    expect($('pick-count').textContent).toBe('1 处')
    await until('the composer was handed the pick', () => gugu.dispatch.mock.calls.length === 1)
    expect(gugu.dispatch.mock.calls[0]).toEqual(['', { draft: true, refs: [{ file: entry, version: 1, at: { range: '销售!D5' }, label: '销售!D5' }] }])
  })

  test('菜单关掉(没选):什么也不做,刚选上的那一格留着', async () => {
    rightClick(4, 3)
    await new Promise((done) => setTimeout(done, 0))
    expect(gugu.showContextMenu).toHaveBeenCalledTimes(1)
    expect(shown()).toBe(true)
    expect(gugu.dispatch).not.toHaveBeenCalled()
  })

  test('手指的长按不开这份菜单(表自己的长按拉选区)', () => {
    expect(rightClick(2, 2, 'touch').defaultPrevented).toBe(false)
    expect(gugu.showContextMenu).not.toHaveBeenCalled()
    expect(shown()).toBe(false)
  })
})
