// @vitest-environment jsdom
// 咕咕办公 · 一个 pill 的位置是哪份文件的(app.js goTo / showPlace,#7232 起两种文件共用):宿主只把位置交给开着那份文件的页,
// 所以位置记下当时在开、或开着的那份;另一份文件打开就丢掉;页面刚起、还没有文件时到的，留给第一份打开的。同一份文件里
// 连到两个位置，后到的算数。真 app.js,运行时是假的(同 officeXlsxPickBar);表是 fixtures/xlsx-sales.xlsx。
// 复核 156f72cb0e(要改 2)的场景：A 还在读时 A 的位置到了，
// 人换到 B,B 上框的是 A 的 销售!C3。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { until, untilStable } from './support/awaitCondition'

const appDir = resolve(__dirname, '../app')
const book = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/xlsx-sales.xlsx')))
const entryOf = (id: string, name: string) => ({
  id, chat: 'group-1', name, displayName: name, contentType: 'application/octet-stream', type: 'binary', suffix: '.xlsx',
  size: book.length, createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
})
const files = { 'file-a': entryOf('file-a', 'A.xlsx'), 'file-b': entryOf('file-b', 'B.xlsx'), 'file-c': entryOf('file-c', 'C.xlsx') }
type Id = keyof typeof files
const ctxOf = (id: Id) => ({ chat: { id: 'group-1', name: 'G', kind: 'group', groupId: 'group-1' }, file: { id, chat: 'group-1' }, locale: 'zh-CN', capabilities: ['files:read'] })
// The page's first context comes when the test says; C's bytes never come (a file still being read).
let giveContext: (ctx: unknown) => void = () => {}
const firstContext = new Promise((resolve) => { giveContext = resolve })
const never = new Promise<never>(() => {})
let linked: (link: { query: Record<string, string>; file: string | null }) => void = () => {}
let contextChanged: (ctx: unknown) => void = () => {}
const gugu = {
  setTabTitle: vi.fn(async (_title: string) => {}),
  getContext: vi.fn(() => firstContext),
  onContextChanged: vi.fn((handler: (ctx: unknown) => void) => { contextChanged = handler; return () => {} }),
  compose: vi.fn(async () => {}),
  onLink: vi.fn((handler: (link: { query: Record<string, string>; file: string | null }) => void) => { linked = handler }),
  files: {
    list: vi.fn(async () => Object.values(files)),
    onChanged: vi.fn(() => () => {}),
    open: vi.fn(async (ref: { id: Id }) => ({
      entry: files[ref.id], type: 'binary', readOnly: true, close: vi.fn(),
      blob: async () => {
        if (ref.id === 'file-c') await never
        return { arrayBuffer: async () => book.slice().buffer }
      },
    })),
  },
}
const $ = (id: string) => document.getElementById(id) as HTMLElement
const shownFile = () => gugu.setTabTitle.mock.calls.at(-1)?.[0]
const frame = () => {
  const found = $('preview').querySelector<HTMLElement>('.xlsx-found')
  return found ? [found.style.left, found.style.top].join(' ') : null
}
// Where a cell of 销售 is drawn (its text, as the sheet shows it): what a frame on it reads.
const cellAt = (text: string) => {
  const cell = [...$('preview').querySelectorAll<HTMLElement>('.xlsx-main .xc')].find((el) => el.textContent === text)!
  return [cell.style.left, cell.style.top].join(' ')
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
  $('preview').getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 800, right: 600, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
}, 30000)

describe('咕咕办公 · 一个 pill 的位置是哪份文件的', () => {
  test('页面刚起时到的位置给第一份文件;同一份里后到的算数;C 还在读时到的位置，换到 B 就丢了(B 上不框、也不说找不到)', async () => {
    // Before any file: the place a pill opened this page with comes first (the host holds it until onLink).
    linked({ query: { range: '销售!C3' }, file: 'file-a' })
    giveContext(ctxOf('file-a'))
    await until('A is drawn', () => shownFile() === 'A.xlsx' && $('preview').querySelector('.xlsx-scroll') !== null)
    await until('the place is framed on A', () => frame() !== null)
    expect(frame()).toBe(cellAt('1,010'))
    // Two places in a row on the file shown: the second wins.
    linked({ query: { range: '销售!D4' }, file: 'file-a' })
    linked({ query: { range: '销售!B5' }, file: 'file-a' })
    await untilStable('A settles', frame)
    expect(frame()).toBe(cellAt('410'))
    expect($('banner').hidden).toBe(true)
    // C is being read when its place comes; the person opens B before C is drawn.
    contextChanged(ctxOf('file-c'))
    await until('C is being opened', () => gugu.files.open.mock.calls.some(([ref]) => ref.id === 'file-c'))
    linked({ query: { range: '销售!C3' }, file: 'file-c' })
    contextChanged(ctxOf('file-b'))
    await until('B is drawn', () => shownFile() === 'B.xlsx' && $('preview').querySelector('.xlsx-scroll') !== null)
    await untilStable('B settles', () => [frame(), $('banner').hidden])
    expect(frame()).toBeNull()
    expect($('banner').hidden).toBe(true)
    // #7257: a place names its file — not shown on the file on screen (A's, with B shown) …
    linked({ query: { range: '销售!C3' }, file: 'file-a' })
    await untilStable('B stays as it is', () => [frame(), $('banner').hidden])
    expect(frame()).toBeNull()
    // … and dropped once another file starts opening (C): A, opened after that, is drawn with no frame.
    contextChanged(ctxOf('file-c'))
    await until('C is being opened again', () => gugu.files.open.mock.calls.filter(([ref]) => ref.id === 'file-c').length === 2)
    contextChanged(ctxOf('file-a'))
    await until('A is drawn again', () => shownFile() === 'A.xlsx' && $('preview').querySelector('.xlsx-scroll') !== null)
    await untilStable('A settles', () => [frame(), $('banner').hidden])
    expect(frame()).toBeNull()
    expect($('banner').hidden).toBe(true)
  })
})
