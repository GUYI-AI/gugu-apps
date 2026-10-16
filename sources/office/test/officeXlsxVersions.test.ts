// @vitest-environment jsdom
// 咕咕办公开着一份 .xlsx,手上攒着选区时 agent 存了新的一版:横条说「这份文件有了第 2 版…」—— 不说「演示稿」(#7230 时
// 横条对所有文件都用演示稿的那几句;跟进优化改成不分类型的说法)。点「打开新的一版」:新版换上，停在人看着的那张表上(旧视图
// 经 mount 的 previous 交过去，不再挂在宿主元素上)。真 app.js,运行时是假的(files.open / list / onChanged);表是
// fixtures/xlsx-sales.xlsx,新的一版把 销售!B2 从 1200 改成 1500。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { until } from './support/awaitCondition'

const appDir = resolve(__dirname, '../app')
const v1 = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/xlsx-sales.xlsx')))
interface Zipper {
  readZip(bytes: Uint8Array): unknown
  entryText(zip: unknown, name: string): string
  rewriteZip(zip: unknown, changed: Map<string, Buffer>): Buffer
}

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const entry = {
  id: 'book', chat: 'chat-1', name: '销售.xlsx', displayName: '销售.xlsx', contentType: XLSX, type: 'binary', suffix: '.xlsx', size: v1.length,
  createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
}
const versions = new Map<number, Uint8Array>([[1, v1]])
let stored = 1
let listed = 1
let changed: () => void = () => {}
const gugu = {
  setTabTitle: vi.fn(async () => {}),
  getContext: vi.fn(async () => ({ chat: { id: 'chat-1', name: 'G', kind: 'group', groupId: 'chat-1' }, file: { chat: 'chat-1', id: 'book' }, locale: 'zh-CN', capabilities: ['files:read'] })),
  onLink: vi.fn(),
  onContextChanged: vi.fn(() => () => {}),
  compose: vi.fn(async () => {}),
  files: {
    list: vi.fn(async () => [{ ...entry, version: listed }]),
    onChanged: vi.fn((_place: unknown, handler: () => void) => {
      changed = handler
      return () => {}
    }),
    open: vi.fn(async () => {
      const bytes = versions.get(stored)!
      return { entry: { ...entry, version: stored, size: bytes.length }, type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => bytes.slice().buffer }), close: vi.fn() }
    }),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const tab = () => $('preview').querySelector('.xlsx-tab.current')?.textContent ?? null
const cellText = (text: string) => [...$('preview').querySelectorAll<HTMLElement>('.xlsx-main .xc')].some((el) => el.textContent === text)

beforeAll(async () => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 900 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
  globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0)) as unknown as typeof requestAnimationFrame
  const zipper = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/ooxml-zip.mjs'))) as Zipper
  const zip = zipper.readZip(v1)
  const sheet = zipper.entryText(zip, 'xl/worksheets/sheet1.xml')
  const edited = sheet.replace('<c r="B2" s="2"><v>1200</v></c>', '<c r="B2" s="2"><v>1500</v></c>')
  expect(edited).not.toBe(sheet)
  versions.set(2, new Uint8Array(zipper.rewriteZip(zip, new Map([['xl/worksheets/sheet1.xml', Buffer.from(edited, 'utf8')]]))))
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  $('preview').getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 800, right: 600, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  await until('the workbook is drawn', () => tab() === '销售')
}, 30000)

describe('咕咕办公 · 开着的 .xlsx 有了新版本', () => {
  test('攒着选区时：横条说「这份文件有了第 2 版」,不说演示稿;点「打开新的一版」换上新版，停在原来那张表', async () => {
    // Version 1 as drawn: B2 is 1,200 and nothing shows 1,500 (what the end of this test reads as the new version).
    expect(cellText('1,200')).toBe(true)
    expect(cellText('1,500')).toBe(false)
    // On the second sheet, one cell picked (an arrow key picks the next cell, as in a spreadsheet).
    const budget = [...$('preview').querySelectorAll<HTMLButtonElement>('.xlsx-tab')].find((b) => b.textContent === '2024 预算')!
    budget.click()
    await until('the second sheet is shown', () => tab() === '2024 预算')
    $('preview').querySelector('.xlsx-scroll')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await until('one cell is picked', () => $('pick-count').textContent === '1 处')

    stored = 2
    listed = 2
    changed()
    await until('the banner says there is a new version', () => !$('banner').hidden)
    expect($('banner').textContent).toContain('这份文件有了第 2 版；你攒着的 1 处是在第 1 版上选的')
    expect($('banner').textContent).not.toContain('演示稿')

    // The view on screen now: the new version's replaces it (app.js redraw swaps the whole book in one step).
    const old = $('preview').querySelector('.xlsx-book')
    $('banner').querySelector('button')!.click()
    await until('the new version is drawn', () => gugu.files.open.mock.calls.length === 2 && $('banner').hidden === true)
    await until('the new view is on screen', () => { const book = $('preview').querySelector('.xlsx-book'); return !!book && book !== old })
    // Where the person was: the second sheet still, not the first.
    expect(tab()).toBe('2024 预算')
    // And it is the new version: the first sheet now shows B2 as 1,500.
    const sales = [...$('preview').querySelectorAll<HTMLButtonElement>('.xlsx-tab')].find((b) => b.textContent === '销售')!
    sales.click()
    await until('B2 is the new value', () => cellText('1,500'))
    expect(cellText('1,200')).toBe(false)
  })
})
