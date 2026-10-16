// @vitest-environment jsdom
// 咕咕办公 · 表格接那条浮条(app.js;演示稿那份见 officePickBar):选中一处才出来、写着几处;表格的浮条桌面上也停在底部正中
// —— 格子铺满面板，贴着选区摆就压住下一处要点的格(10-15 A/B:选了 B2 再 ⌘ 点 C3,点在浮条上),view.anchor() 恒为 null。
// Esc 全部取消、Enter 放进输入框是页面的 —— 表格自己的键(方向键、Shift 扩选、⌘A)照旧。手指按下以后浮条也在底部正中。
// 运行时是假的(getContext / files.open / list / onChanged / compose);表是真的 fixtures/xlsx-sales.xlsx。
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
  compose: vi.fn(async (_text: string, _where: unknown) => {}),
  onLink: vi.fn((handler: (link: { query: Record<string, string> }) => void) => { linked = handler }),
  files: {
    list: vi.fn(async () => [entry]),
    onChanged: vi.fn(() => () => {}),
    open: vi.fn(async () => ({ entry, type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => book.slice().buffer }), close: vi.fn() })),
  },
}

let linked: (link: { query: Record<string, string> }) => void = () => {}
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
  gugu.compose.mockClear()
})

describe('咕咕办公 · 表格接那条浮条', () => {
  test('选中一处才出来,写着几处;⌘ 加一处;Shift 是扩选最后一处,不加', () => {
    expect(shown()).toBe(false)
    click(2, 2)
    expect(shown()).toBe(true)
    expect($('pick-count').textContent).toBe('1 处')
    click(4, 1, { metaKey: true })
    expect($('pick-count').textContent).toBe('2 处')
    click(4, 3, { shiftKey: true })
    expect($('pick-count').textContent).toBe('2 处')
  })

  test('桌面:不贴着选区，停在底部正中(底下留的那 100 px 里);加一处、滚动都不挪', () => {
    // The panel 600 × 800, the bar 220 × 36: (600 − 220) / 2, 800 − 36 − 16.
    const bottom = [190, 800 - 36 - 16]
    click(2, 2)
    expect(place()).toEqual(bottom)
    expect(bar().classList.contains('docked')).toBe(true)
    // The next pick is the cell under the first (B2, then C3 by it): nothing of the bar over the sheet.
    click(3, 2, { metaKey: true })
    expect($('pick-count').textContent).toBe('2 处')
    expect(place()).toEqual(bottom)
    scrolled(20)
    expect(place()).toEqual(bottom)
  })

  test('Esc 是页面的:在表上按也全部取消;Enter 放进输入框：每一处一个 pill,at 是表格的地址', async () => {
    click(2, 2)
    key(sheet(), { key: 'Escape' })
    expect(shown()).toBe(false)
    click(2, 2)
    click(4, 1, { metaKey: true })
    expect(key(sheet(), { key: 'Enter' }).defaultPrevented).toBe(true)
    await until('the composer was handed the picks', () => gugu.compose.mock.calls.length === 1)
    expect(gugu.compose.mock.calls[0]).toEqual(['', { refs: [
      { file: entry, version: 1, at: { range: '销售!C3' }, label: '销售!C3' },
      { file: entry, version: 1, at: { range: '销售!B5' }, label: '销售!B5' },
    ] }])
    await until('the bar has gone', () => !shown())
  })

  test('点 pill(onLink):切到那张表、框住那一格;这一版没有的地址说一句', async () => {
    linked({ query: { range: "'2024 预算'!A2" } })
    await until(`the sheet shown is ${'2024 预算'}`, () => $('preview').querySelector('.xlsx-tab.current')!.textContent === '2024 预算')
    await until('the place is framed', () => $('preview').querySelector('.xlsx-found') !== null)
    linked({ query: { range: '没有这张表!A1' } })
    await until('the page says the place is gone', () => !$('banner').hidden && $('banner').textContent === '这一处在现在这一版里找不到了。')
    $('preview').querySelectorAll<HTMLButtonElement>('.xlsx-tab')[0]!.click()
    await until(`the sheet shown is ${'销售'}`, () => $('preview').querySelector('.xlsx-tab.current')!.textContent === '销售')
  })

  test('点编号去掉一处、点表名换表以后,键盘还在表上:方向键是表的,Enter 放进输入框', async () => {
    click(2, 2)
    click(4, 1, { metaKey: true })
    // A press on a button leaves the focus on it (as a browser does); the redraw takes the button away.
    const badge = $('preview').querySelector<HTMLButtonElement>('.xlsx-badge[data-n="2"]')!
    badge.focus()
    badge.click()
    expect($('pick-count').textContent).toBe('1 处')
    expect(document.activeElement).toBe(sheet())
    const tab = $('preview').querySelectorAll<HTMLButtonElement>('.xlsx-tab')[1]!
    tab.focus()
    tab.click()
    await until(`the sheet shown is ${'2024 预算'}`, () => $('preview').querySelector('.xlsx-tab.current')!.textContent === '2024 预算')
    expect(document.activeElement).toBe(sheet())
    expect(key(document.activeElement!, { key: 'Enter' }).defaultPrevented).toBe(true)
    await until('the composer was handed the picks', () => gugu.compose.mock.calls.length === 1)
    $('preview').querySelectorAll<HTMLButtonElement>('.xlsx-tab')[0]!.click()
    await until(`the sheet shown is ${'销售'}`, () => $('preview').querySelector('.xlsx-tab.current')!.textContent === '销售')
  })

  test('表格自己的键照旧,页面不拦:方向键挪、⌘A 整张表', () => {
    click(2, 2)
    expect(key(sheet(), { key: 'ArrowDown' }).defaultPrevented).toBe(true)
    expect(key(sheet(), { key: 'a', metaKey: true }).defaultPrevented).toBe(true)
    expect($('pick-count').textContent).toBe('1 处')
    expect(gugu.compose).not.toHaveBeenCalled()
  })

  test('手指点一下(选一格):浮条在底部正中;Esc 不取消', () => {
    hand('touch')
    const touch = (type: string) => Object.assign(new Event(type, { bubbles: true, cancelable: true }), { touches: type === 'touchend' ? [] : [at(2, 2)] })
    sheet().dispatchEvent(touch('touchstart'))
    sheet().dispatchEvent(touch('touchend'))
    expect(shown()).toBe(true)
    expect(place()).toEqual([190, 800 - 36 - 22])
    key(sheet(), { key: 'Escape' })
    expect(shown()).toBe(true)
  })
})
