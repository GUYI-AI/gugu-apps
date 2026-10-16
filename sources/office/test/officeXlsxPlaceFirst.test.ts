// @vitest-environment jsdom
// 咕咕办公 · 页面刚起时到的位置，是它的 link 点名的那份文件的(#7257 link.file;以前是第一份开始读时认领)。增量复核
// c6f346c134 的场景：页面刚起、A 的位置先到，A 还在读(这里它的字节永远不来),人在 A 画出来之前换到
// B —— B 上不框 A 的位置，也不说找不到。真 app.js,运行时是假的(同 officeXlsxPlace);表是 fixtures/xlsx-sales.xlsx。一页一个文件:
// app.js 的状态是整页的，这一格要从页面刚起开始。
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
const files = { 'file-a': entryOf('file-a', 'A.xlsx'), 'file-b': entryOf('file-b', 'B.xlsx') }
type Id = keyof typeof files
const ctxOf = (id: Id) => ({ chat: { id: 'group-1', name: 'G', kind: 'group', groupId: 'group-1' }, file: { id, chat: 'group-1' }, locale: 'zh-CN', capabilities: ['files:read'] })
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
        if (ref.id === 'file-a') await never
        return { arrayBuffer: async () => book.slice().buffer }
      },
    })),
  },
}
const $ = (id: string) => document.getElementById(id) as HTMLElement
const frame = () => $('preview').querySelector('.xlsx-found') !== null

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

describe('咕咕办公 · 页面刚起时到的位置是第一份文件的', () => {
  test('第一份 A 还在读，人换到 B:B 上不框 A 的位置，也不说找不到', async () => {
    linked({ query: { range: '销售!C3' }, file: 'file-a' })
    giveContext(ctxOf('file-a'))
    await until('A is being opened', () => gugu.files.open.mock.calls.some(([ref]) => ref.id === 'file-a'))
    contextChanged(ctxOf('file-b'))
    await until('B is drawn', () => gugu.setTabTitle.mock.calls.at(-1)?.[0] === 'B.xlsx' && $('preview').querySelector('.xlsx-scroll') !== null)
    await untilStable('B settles', () => [frame(), $('banner').hidden])
    expect(frame()).toBe(false)
    expect($('banner').hidden).toBe(true)
  })
})
