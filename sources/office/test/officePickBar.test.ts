// @vitest-environment jsdom
// 咕咕办公 · 选区旁边浮出的那一条(app.js;选区交互设计 §2):
// 「n 处 · 放进输入框 ⏎ · ✕」只在有选中的时候出现;桌面上跟着最后一处,在它右上方 10 px、右对齐,上方没地方放下方,
// 那一处滚出视野就停在面板底部正中;手机上一直在底部正中。Enter 放进输入框,Esc 全部取消(桌面)。顶上那一排没有了。
// 运行时是假的(getContext / files.open / list / onChanged / dispatch);稿子是真的 fixtures/two-slides.pptx。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')
const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
const entry = {
  id: 'deck', chat: 'group-1', name: '季度.pptx', displayName: '季度.pptx', contentType: 'application/octet-stream', type: 'binary', suffix: '.pptx',
  size: deck.length, createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
}
const ctx = { chat: { id: 'group-1', name: 'G', kind: 'group', groupId: 'group-1' }, file: { id: 'deck', chat: 'group-1' }, locale: 'zh-CN', capabilities: ['files:read'] }
let handTo: (ctx: unknown) => void = () => {}
const gugu = {
  setTabTitle: vi.fn(async () => {}),
  getContext: vi.fn(async () => ctx),
  onLink: vi.fn(),
  onContextChanged: vi.fn((handler: (ctx: unknown) => void) => {
    handTo = handler
    return () => {}
  }),
  dispatch: vi.fn(async (_text: string, _where: unknown): Promise<{ cancelled?: true }> => ({})),
  files: {
    list: vi.fn(async () => [entry]),
    onChanged: vi.fn(() => () => {}),
    open: vi.fn(async () => ({ entry, type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => deck.slice().buffer }), close: vi.fn() })),
  },
}
/** A press on the page by a finger or a mouse: the bar's layout follows the hand last used. */
const hand = (pointerType: 'touch' | 'mouse') => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType }))
const fingers = () => document.body.classList.contains('fingers')

const $ = (id: string) => document.getElementById(id) as HTMLElement
const until = (check: () => void, timeout = 15000) => vi.waitFor(check, { timeout })
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
const bar = () => $('pick-bar')
const shown = () => bar().classList.contains('on')
const place = () => [parseFloat(bar().style.left), parseFloat(bar().style.top)]
const hits = () => [...$('preview').querySelectorAll<HTMLButtonElement>('.pptx-slide[data-n="1"] .pptx-hit')]
/** A click as the keyboard makes one (no pointer pressed for it): the view picks it; `shift` adds. */
const pick = (el: Element, shift = false) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: shift }))
const key = (target: EventTarget, init: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

beforeAll(async () => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  // What the device says before any press: a mouse here (officePickBarFingers.test.ts: a device that says a finger).
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  // The panel: 600 × 800 at the top of the page; the bar: 220 × 36 (jsdom lays nothing out).
  $('preview').getBoundingClientRect = () => rect(0, 0, 600, 800)
  Object.defineProperty(bar(), 'offsetWidth', { value: 220 })
  Object.defineProperty(bar(), 'offsetHeight', { value: 36 })
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  await until(() => expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2))
}, 30000)

beforeEach(() => {
  $('pick-clear').click()
  hand('mouse')
  gugu.dispatch.mockClear()
})

describe('咕咕办公 · 选区旁边的那一条', () => {
  test('顶上那一排没有了;什么都没选,就没有浮条;选一处才出来,写着几处', () => {
    for (const gone of ['pptx-bar', 'pptx-hint', 'pptx-box', 'pptx-pending', 'pptx-send', 'pptx-clear']) expect(document.getElementById(gone)).toBeNull()
    expect(shown()).toBe(false)
    expect(bar().getAttribute('aria-hidden')).toBe('true')
    pick(hits()[0]!)
    expect(shown()).toBe(true)
    expect(bar().getAttribute('aria-hidden')).toBe('false')
    expect($('pick-count').textContent).toBe('1 处')
    expect($('pick-send').textContent).toBe('放进输入框⏎')
    pick(hits()[1]!, true)
    expect($('pick-count').textContent).toBe('2 处')
  })

  test('英文:单复数分开说', async () => {
    handTo({ ...ctx, locale: 'en-US' })
    await until(() => expect($('pick-send').textContent).toBe('Put in composer⏎'))
    pick(hits()[0]!)
    expect($('pick-count').textContent).toBe('1 spot')
    pick(hits()[1]!, true)
    expect($('pick-count').textContent).toBe('2 spots')
    expect($('pick-clear').getAttribute('aria-label')).toBe('Clear all')
    handTo(ctx)
    await until(() => expect($('pick-send').textContent).toBe('放进输入框⏎'))
  })

  test('桌面:在最后一处的右上方 10 px、右对齐;上面没地方就放下面;不压在它上面', () => {
    const [first, second] = hits()
    first!.getBoundingClientRect = () => rect(300, 400, 200, 80)
    pick(first!)
    // Right edge 500 → left 500 − 220; top 400 − 36 − 10.
    expect(place()).toEqual([280, 354])
    expect(bar().classList.contains('docked')).toBe(false)
    second!.getBoundingClientRect = () => rect(40, 20, 160, 60)
    pick(second!, true)
    // The last pick now, near the top: no room above it, so below it (bottom 80 + 10); right edge 200 → left 8 at least.
    expect(place()).toEqual([8, 90])
  })

  test('最后一处滚出面板:停在面板底部正中;滚回来又回到它旁边(里面的容器滚也听得到)', async () => {
    const [first] = hits()
    let at = rect(300, 400, 200, 80)
    first!.getBoundingClientRect = () => at
    pick(first!)
    expect(place()).toEqual([280, 354])
    at = rect(300, -200, 200, 80)
    // A scroll of a box inside the panel (scroll does not bubble): heard all the same.
    const inner = document.createElement('div')
    $('preview').append(inner)
    inner.dispatchEvent(new Event('scroll'))
    await until(() => expect(place()).toEqual([190, 800 - 36 - 16]))
    expect(bar().classList.contains('docked')).toBe(true)
    at = rect(300, 400, 200, 80)
    $('preview').dispatchEvent(new Event('scroll'))
    await until(() => expect(place()).toEqual([280, 354]))
    inner.remove()
  })

  test('手指按下以后:浮条在底部正中,拇指够得着(底下留出地方、⏎ 不显示是 .fingers 的样式)', () => {
    expect(fingers()).toBe(false)
    hand('touch')
    expect(fingers()).toBe(true)
    const [first] = hits()
    first!.getBoundingClientRect = () => rect(300, 400, 200, 80)
    pick(first!)
    expect(place()).toEqual([190, 800 - 36 - 22])
    expect(bar().classList.contains('docked')).toBe(true)
  })

  test('选到一半换了手:浮条不从旁边跳到底部;收起以后才换(148:只在浮条隐藏时切)', () => {
    const [first, second] = hits()
    first!.getBoundingClientRect = () => rect(300, 400, 200, 80)
    pick(first!)
    expect(place()).toEqual([280, 354])
    hand('touch')
    pick(second!, true)
    second!.getBoundingClientRect = () => rect(300, 400, 200, 80)
    $('preview').dispatchEvent(new Event('scroll'))
    expect(fingers()).toBe(false)
    expect(bar().classList.contains('docked')).toBe(false)
    $('pick-clear').click()
    expect(fingers()).toBe(true)
    hand('mouse')
    expect(fingers()).toBe(false)
  })

  test('Enter:放进输入框(选区清空);Shift+Enter、没选东西时的 Enter、在输入框里打字的 Enter 都不管', async () => {
    pick(hits()[0]!)
    expect(key(document.body, { key: 'Enter', shiftKey: true }).defaultPrevented).toBe(false)
    const input = document.createElement('input')
    document.body.append(input)
    expect(key(input, { key: 'Enter' }).defaultPrevented).toBe(false)
    input.remove()
    expect(gugu.dispatch).not.toHaveBeenCalled()
    expect(key(document.body, { key: 'Enter' }).defaultPrevented).toBe(true)
    await until(() => expect(gugu.dispatch).toHaveBeenCalledTimes(1))
    expect(gugu.dispatch.mock.calls[0]![1]).toMatchObject({ refs: [{ at: { slide: 1, shape: '2', k: 1 } }] })
    await until(() => expect(shown()).toBe(false))
    expect(key(document.body, { key: 'Enter' }).defaultPrevented).toBe(false)
    expect(gugu.dispatch).toHaveBeenCalledTimes(1)
  })

  test('Esc:鼠标在用时全部取消;手指在用时不取消(用浮条上的 ✕)', () => {
    hand('touch')
    pick(hits()[0]!)
    key(document.body, { key: 'Escape' })
    expect(shown()).toBe(true)
    $('pick-clear').click()
    hand('mouse')
    pick(hits()[0]!)
    key(document.body, { key: 'Escape' })
    expect(shown()).toBe(false)
  })

  // 评审 2e44a6949e 要改 2: Enter on a focused button went to the composer, not to that button.
  test('焦点在按钮上时 Enter 归按钮:✕、编号、形状上按 Enter 都不放进输入框', () => {
    pick(hits()[0]!)
    pick(hits()[1]!, true)
    for (const el of [$('pick-clear'), $('preview').querySelector<HTMLElement>('.pptx-badge')!, hits()[2]!]) {
      expect(key(el, { key: 'Enter' }).defaultPrevented).toBe(false)
    }
    expect(gugu.dispatch).not.toHaveBeenCalled()
    expect($('pick-count').textContent).toBe('2 处')
  })

  test('浮条藏起来时 Tab 也进不去(inert);出来以后能', () => {
    expect((bar() as HTMLElement & { inert: boolean }).inert).toBe(true)
    pick(hits()[0]!)
    expect((bar() as HTMLElement & { inert: boolean }).inert).toBe(false)
  })

  test('浮条上的 ✕ 全部取消;「放进输入框」放进去', async () => {
    pick(hits()[0]!)
    pick(hits()[1]!, true)
    $('pick-clear').click()
    expect(shown()).toBe(false)
    pick(hits()[2]!)
    $('pick-send').click()
    await until(() => expect(gugu.dispatch).toHaveBeenCalledTimes(1))
    expect(gugu.dispatch.mock.calls[0]![1]).toEqual({ draft: true, refs: [expect.objectContaining({ file: expect.objectContaining({ id: 'deck', chat: 'group-1' }) })] })
  })

  test('交给 agent 使用同一选区的文件与版本;取消保留选区,发送才清空', async () => {
    pick(hits()[0]!)
    gugu.dispatch.mockResolvedValueOnce({ cancelled: true })
    $('pick-dispatch').click()
    await until(() => expect(gugu.dispatch).toHaveBeenCalledTimes(1))
    expect(gugu.dispatch.mock.calls[0]![1]).toEqual({ refs: [expect.objectContaining({ file: expect.objectContaining({ id: 'deck', chat: 'group-1' }), version: 1, at: { slide: 1, shape: '2', k: 1 } })] })
    expect(shown()).toBe(true)
    $('pick-dispatch').click()
    await until(() => expect(gugu.dispatch).toHaveBeenCalledTimes(2))
    await until(() => expect(shown()).toBe(false))
  })
})
