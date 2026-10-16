// @vitest-environment jsdom
// 咕咕办公 · 演示稿怎么选(选区交互设计 §1 那张表,一格一条):
// 没有模式 —— 点就是选,在稿子上任意处拖就是框;桌面上不按键点 / 拖换掉原来选的,Shift / ⌘ / Ctrl 加一处,点空白全部取消;
// 手指点一下加一处(再点去掉)、一根手指拖是滚动、按住约 0.35 秒再拖是框。真的鼠标事件、真的修饰键、真的计时(假时钟)。
// 稿子是 fixtures/two-slides.pptx(PptxGenJS 两页,每页 4 个形状)。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')
const bytes = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
const t = {
  pptxSlide: '第 {n} 页', pptxShape: '形状 {id}', pptxQuote: '：“{text}”', pptxNth: '（这一页第 {k} 个 id 相同的）', pptxBox: '框 (x {x}, y {y}, 宽 {w}, 高 {h})',
  pptxBoxHas: '，里面有 ', pptxBoxEmpty: '没有形状', pptxListSep: '、', unpick: '去掉这一处',
}

type Pick = { key: string; box?: number[]; shapes?: { id: string; key: string }[]; shape?: { id: string; k: number } }
interface Deck {
  picks(): Pick[]
  clear(): void
  anchor(): Element | null
  dragging(): boolean
  destroy(): void
}
let view: {
  LONG_PRESS_MS: number
  mountPptx(host: HTMLElement, bytes: Uint8Array, options: { t: typeof t; onPicks: (picks: unknown[]) => void }): Promise<Deck>
}

beforeAll(async () => {
  // jsdom has no object URLs: the slides are <img> of a Blob URL in the page.
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  view = (await import(/* @vite-ignore */ resolve(appDir, 'pptx-view.js'))) as typeof view
})

let deck: Deck
let card: HTMLElement
let w = 0
let h = 0
beforeEach(async () => {
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  deck = await view.mountPptx(host, bytes, { t, onPicks: () => {} })
  card = host.querySelector<HTMLElement>('.pptx-slide[data-n="1"]')!
  // jsdom lays nothing out and has no pointer capture: the slide is as many px wide as its own coordinates.
  ;[w, h] = card.style.aspectRatio.split('/').map(Number) as [number, number]
  card.getBoundingClientRect = () => ({ left: 0, top: 0, width: w, height: h, right: w, bottom: h, x: 0, y: 0, toJSON: () => ({}) })
  card.setPointerCapture = () => {}
})
afterEach(() => {
  deck.destroy()
  vi.useRealTimers()
})

const hits = () => [...card.querySelectorAll<HTMLButtonElement>('.pptx-hit')]
/** A shape's box on the slide, in slide px: [x, y, w, h]. */
const box = (el: HTMLElement) => ['left', 'top', 'width', 'height'].map((k, i) => (parseFloat(el.style.getPropertyValue(k)) / 100) * (i % 2 ? h : w))
const middle = (el: HTMLElement) => {
  const [x, y, bw, bh] = box(el)
  return [x + bw / 2, y + bh / 2] as const
}
/** Somewhere on slide 1 no shape covers (the shapes' own boxes, read from the page). */
const blank = () => {
  for (let y = 4; y < h; y += 8) {
    for (let x = 4; x < w; x += 8) {
      if (!hits().some((el) => { const [bx, by, bw, bh] = box(el); return x >= bx && x <= bx + bw && y >= by && y <= by + bh })) return [x, y] as const
    }
  }
  throw new Error('slide 1 has no blank spot')
}
type Keys = { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; button?: number }
const mouse = (el: Element, type: string, [x, y]: readonly [number, number], keys: Keys = {}) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, ...keys }))
/** A mouse click as the hand makes one: pressed and lifted where it was, then the browser's own click (detail 1). */
const press = (el: Element, at: readonly [number, number], keys: Keys = {}) => {
  mouse(el, 'pointerdown', at, keys)
  mouse(card, 'pointerup', at, keys)
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1, ...keys }))
}
const drag = (el: Element, from: readonly [number, number], to: readonly [number, number], keys: Keys = {}) => {
  mouse(el, 'pointerdown', from, keys)
  mouse(card, 'pointermove', to, keys)
  mouse(card, 'pointerup', to, keys)
}
/** A finger: `touches` as the event carries them (jsdom has no Touch); returns the event, to read defaultPrevented. */
const finger = (el: Element, type: string, points: (readonly [number, number])[]) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: points.map(([clientX, clientY]) => ({ clientX, clientY })) })
  el.dispatchEvent(event)
  return event
}
const ids = () => deck.picks().map((p) => (p.shape ? p.shape.id : 'box'))

describe('桌面:鼠标', () => {
  test('点一个形状只选它,换掉原来选的;只选着它时再点一下还是它', () => {
    const [title, , , table] = hits()
    press(title!, middle(title!))
    press(table!, middle(table!))
    expect(deck.picks()).toHaveLength(1)
    expect(table!.classList.contains('picked')).toBe(true)
    expect(title!.classList.contains('picked')).toBe(false)
    press(table!, middle(table!))
    expect(deck.picks()).toHaveLength(1)
  })

  test.each([['Shift', { shiftKey: true }], ['⌘', { metaKey: true }], ['Ctrl', { ctrlKey: true }]] as const)('%s + 点:加进来;点已选的就去掉', (_key, keys) => {
    const [title, text] = hits()
    press(title!, middle(title!))
    press(text!, middle(text!), keys)
    expect(deck.picks()).toHaveLength(2)
    press(title!, middle(title!), keys)
    expect(deck.picks().map((p) => p.key)).toEqual([`shape:${text!.dataset.key}`])
  })

  test('在稿子上按住拖:从形状上开始拖也算拉出一个框,框碰到的形状描细线;不按修饰键时换掉原来选的', () => {
    const [title, , , table] = hits()
    press(title!, middle(title!))
    const [tx, ty, tw, th] = box(table!)
    drag(table!, [tx + 2, ty + 2], [tx + tw - 2, ty + th - 2])
    expect(deck.picks()).toHaveLength(1)
    const [only] = deck.picks()
    expect(only!.box).toBeDefined()
    // Slide 1's title and table share cNvPr id 2: the box names the table (its key), not the title.
    expect(only!.shapes!.map((s) => s.key)).toContain(table!.dataset.key)
    expect(only!.shapes!.map((s) => s.key)).not.toContain(title!.dataset.key)
    expect(table!.classList.contains('inside')).toBe(true)
    expect(table!.classList.contains('picked')).toBe(false)
    expect(card.querySelectorAll('.pptx-mark')).toHaveLength(1)
    expect(card.querySelectorAll('.pptx-band')).toHaveLength(0)
  })

  test('Shift / ⌘ + 拖:新框加进来', () => {
    const [title] = hits()
    press(title!, middle(title!))
    const [x, y] = blank()
    drag(card, [x, y], [x + 40, y + 30], { metaKey: true })
    drag(card, [x, y], [x + 60, y + 50], { shiftKey: true })
    expect(ids()).toEqual([title!.dataset.key!.split(':')[1], 'box', 'box'])
  })

  test('点空白处全部取消;按着 Shift 点空白不取消', () => {
    const [title, text] = hits()
    press(title!, middle(title!))
    press(text!, middle(text!), { shiftKey: true })
    press(card, blank(), { shiftKey: true })
    expect(deck.picks()).toHaveLength(2)
    press(card, blank())
    expect(deck.picks()).toHaveLength(0)
  })

  test('按下抬起只挪了不到 4 px:是点,不是框', () => {
    const [title] = hits()
    const [x, y] = middle(title!)
    drag(title!, [x, y], [x + 3, y + 2])
    expect(ids()).toEqual([title!.dataset.key!.split(':')[1]])
    expect(card.querySelectorAll('.pptx-mark')).toHaveLength(0)
  })

  test('按着的时候就算忙(新版本不换上来),抬起就不忙了', () => {
    const [title] = hits()
    mouse(title!, 'pointerdown', middle(title!))
    expect(deck.dragging()).toBe(true)
    mouse(card, 'pointerup', middle(title!))
    expect(deck.dragging()).toBe(false)
  })

  // 评审 2e44a6949e 要改 1: the press does not move the focus (preventDefault), so in the host's frame the keys stayed with
  // the host's composer — Enter sent its draft. The App takes the keyboard on the press itself.
  test('按下就把键盘拿过来(App 在宿主的框里时,Enter 才不落进宿主的输入框)', () => {
    const focus = vi.spyOn(window, 'focus')
    const [title] = hits()
    mouse(title!, 'pointerdown', middle(title!))
    expect(focus).toHaveBeenCalledTimes(1)
    mouse(card, 'pointerup', middle(title!))
    focus.mockRestore()
  })

  // 评审 367706fb81: a long press left the focus on that shape's button; a tap elsewhere then Enter picked that shape.
  test('点选时把形状上留着的焦点放掉(长按以后的回车不再选中长按过的那个)', () => {
    vi.useFakeTimers()
    const [title, text] = hits()
    title!.focus()
    expect(document.activeElement).toBe(title)
    finger(text!, 'touchstart', [middle(text!)])
    finger(card, 'touchend', [])
    expect(document.activeElement).not.toBe(title)
    title!.focus()
    mouse(text!, 'pointerdown', middle(text!))
    mouse(card, 'pointerup', middle(text!))
    expect(document.activeElement).not.toBe(title)
  })

  test('右键、中键:不选,也不清', () => {
    const [title, text] = hits()
    press(title!, middle(title!))
    press(text!, middle(text!), { button: 2 })
    press(card, blank(), { button: 1 })
    expect(ids()).toEqual([title!.dataset.key!.split(':')[1]])
  })

  test('鼠标点一下只算一次(抬起时已经选了,浏览器随后的 click 不再算);键盘在形状上按 Enter / 空格(click,没有按下)照样选', () => {
    const [title, text] = hits()
    press(title!, middle(title!), { shiftKey: true })
    expect(deck.picks()).toHaveLength(1)
    text!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0, shiftKey: true }))
    expect(deck.picks()).toHaveLength(2)
  })

  test('点某一处的编号只去掉那一处,其余重新编号;按在编号上不开框也不选', () => {
    const [title, text, , table] = hits()
    press(title!, middle(title!))
    press(text!, middle(text!), { shiftKey: true })
    press(table!, middle(table!), { shiftKey: true })
    const badges = () => [...card.querySelectorAll<HTMLButtonElement>('.pptx-badge')]
    const two = badges().find((b) => b.dataset.n === '2')!
    mouse(two, 'pointerdown', [0, 0])
    expect(deck.dragging()).toBe(false)
    two.click()
    expect(badges().map((b) => b.dataset.n)).toEqual(['1', '2'])
    expect(deck.picks().map((p) => p.key)).toEqual([`shape:${title!.dataset.key}`, `shape:${table!.dataset.key}`])
  })

  test('anchor:最后一处的标记(选的形状是它的框,框是虚线框);什么都没选时是 null', () => {
    expect(deck.anchor()).toBeNull()
    const [title, text] = hits()
    press(title!, middle(title!))
    press(text!, middle(text!), { shiftKey: true })
    expect(deck.anchor()).toBe(text)
    const [x, y] = blank()
    drag(card, [x, y], [x + 40, y + 30], { shiftKey: true })
    expect(deck.anchor()).toBe(card.querySelector('.pptx-mark'))
    deck.clear()
    expect(deck.anchor()).toBeNull()
  })
})

describe('手机:手指', () => {
  test('点一下:加进来;再点一下已选的就去掉;点空白处不取消', () => {
    const [title, text] = hits()
    for (const el of [title!, text!]) {
      finger(el, 'touchstart', [middle(el)])
      finger(card, 'touchend', [])
    }
    expect(deck.picks()).toHaveLength(2)
    finger(card, 'touchstart', [blank()])
    finger(card, 'touchend', [])
    expect(deck.picks()).toHaveLength(2)
    finger(title!, 'touchstart', [middle(title!)])
    finger(card, 'touchend', [])
    expect(ids()).toEqual([text!.dataset.key!.split(':')[1]])
  })

  test('点完就答了:touchend 拦下浏览器随后补发的那次 click,同一处不会再算一次', () => {
    const [title] = hits()
    finger(title!, 'touchstart', [middle(title!)])
    expect(finger(card, 'touchend', []).defaultPrevented).toBe(true)
    // Were the browser's click made anyway, it is a pointer's click (detail 1): not answered again.
    title!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    expect(deck.picks()).toHaveLength(1)
  })

  test('一根手指拖 = 滚动:什么都不选、不画框,也不拦浏览器滚动', () => {
    vi.useFakeTimers()
    const [title] = hits()
    const [x, y] = middle(title!)
    finger(title!, 'touchstart', [[x, y]])
    const moved = finger(card, 'touchmove', [[x, y + 40]])
    vi.advanceTimersByTime(view.LONG_PRESS_MS + 100)
    finger(card, 'touchmove', [[x, y + 120]])
    finger(card, 'touchend', [])
    expect(moved.defaultPrevented).toBe(false)
    expect(deck.picks()).toHaveLength(0)
    expect(card.querySelectorAll('.pptx-band, .pptx-mark')).toHaveLength(0)
  })

  test('按住约 0.35 秒再拖 = 拉框,加进来;按住以后算忙,拖的那一下不让浏览器滚', () => {
    vi.useFakeTimers()
    const [title] = hits()
    finger(title!, 'touchstart', [middle(title!)])
    finger(card, 'touchend', [])
    const [x, y] = blank()
    finger(card, 'touchstart', [[x, y]])
    vi.advanceTimersByTime(view.LONG_PRESS_MS - 50)
    expect(deck.dragging()).toBe(false)
    vi.advanceTimersByTime(60)
    expect(deck.dragging()).toBe(true)
    const moved = finger(card, 'touchmove', [[x + 50, y + 40]])
    expect(moved.defaultPrevented).toBe(true)
    expect(card.querySelectorAll('.pptx-band')).toHaveLength(1)
    finger(card, 'touchend', [])
    expect(deck.dragging()).toBe(false)
    expect(ids()).toEqual([title!.dataset.key!.split(':')[1], 'box'])
  })

  test('按住了但没拖就抬起:不选;按住不到 0.35 秒就抬起:是点', () => {
    vi.useFakeTimers()
    const [title] = hits()
    finger(title!, 'touchstart', [middle(title!)])
    vi.advanceTimersByTime(view.LONG_PRESS_MS + 10)
    finger(card, 'touchend', [])
    expect(deck.picks()).toHaveLength(0)
    finger(title!, 'touchstart', [middle(title!)])
    vi.advanceTimersByTime(view.LONG_PRESS_MS - 100)
    finger(card, 'touchend', [])
    expect(deck.picks()).toHaveLength(1)
  })

  test('被系统打断(touchcancel)、两根手指:都不算', () => {
    vi.useFakeTimers()
    const [title, text] = hits()
    finger(title!, 'touchstart', [middle(title!)])
    finger(card, 'touchcancel', [])
    finger(text!, 'touchstart', [middle(text!), middle(title!)])
    finger(card, 'touchend', [])
    expect(deck.picks()).toHaveLength(0)
  })

  // 评审 2e44a6949e 要改 3: a second finger landing mid-box left the box on the slide and dragging() true for good.
  test('拉框途中落下第二根手指(要缩放):框不留,不再算忙,抬起也不选', () => {
    vi.useFakeTimers()
    const [x, y] = blank()
    finger(card, 'touchstart', [[x, y]])
    vi.advanceTimersByTime(view.LONG_PRESS_MS + 10)
    finger(card, 'touchmove', [[x + 40, y + 30]])
    expect(card.querySelectorAll('.pptx-band')).toHaveLength(1)
    finger(card, 'touchstart', [[x + 40, y + 30], [x + 120, y + 90]])
    expect(card.querySelectorAll('.pptx-band')).toHaveLength(0)
    expect(deck.dragging()).toBe(false)
    finger(card, 'touchend', [[x + 120, y + 90]])
    finger(card, 'touchend', [])
    expect(deck.picks()).toHaveLength(0)
  })

  test('手指按在稿子上时,系统的长按菜单不出;没有手指按着时(鼠标右键)照常', () => {
    const menu = () => {
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
      card.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(menu()).toBe(false)
    finger(card, 'touchstart', [blank()])
    expect(menu()).toBe(true)
    finger(card, 'touchend', [])
    expect(menu()).toBe(false)
  })

  // The tap's touchend is cancelled (no second pick from the browser's click): that also keeps the focus where it was —
  // in the host's frame. A tap and a finger's box take the keyboard as the mouse's press does.
  test('点一下、按住拉的框:都把键盘拿过来(和鼠标按下一样)', () => {
    vi.useFakeTimers()
    const focus = vi.spyOn(window, 'focus')
    const [title] = hits()
    finger(title!, 'touchstart', [middle(title!)])
    finger(card, 'touchend', [])
    expect(focus).toHaveBeenCalledTimes(1)
    const [x, y] = blank()
    finger(card, 'touchstart', [[x, y]])
    vi.advanceTimersByTime(view.LONG_PRESS_MS + 10)
    finger(card, 'touchmove', [[x + 40, y + 30]])
    finger(card, 'touchend', [])
    expect(focus).toHaveBeenCalledTimes(2)
    // A scroll takes nothing.
    finger(card, 'touchstart', [[x, y]])
    finger(card, 'touchmove', [[x, y + 60]])
    finger(card, 'touchend', [])
    expect(focus).toHaveBeenCalledTimes(2)
    focus.mockRestore()
  })

  test('手指在按:鼠标那条路不接(pointerType touch 的 pointerdown 不开框也不选)', () => {
    const [title] = hits()
    const down = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 })
    Object.defineProperty(down, 'pointerType', { value: 'touch' })
    title!.dispatchEvent(down)
    mouse(card, 'pointerup', [10, 10])
    expect(deck.dragging()).toBe(false)
    expect(deck.picks()).toHaveLength(0)
  })
})
