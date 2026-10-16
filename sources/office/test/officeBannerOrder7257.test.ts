// @vitest-environment jsdom
// #7257(复核 3 建议):咕咕办公打开 pill 指进来的一份文件，那个位置这一版里没有(两页稿的第 99 页:「这一处…找不到了」),
// 而群里说这份文件已经删了。留在横幅上的是「已经不在群文件夹里了」(error,常驻)—— 位置的 info 不盖在正显示着的 error 上。
// 无论「已删除」是打开途中听到的，还是读字节时听到的;两格对照：只有位置找不到、只有已删除。
// 运行时是假的(files.open / blob 每一次都扣住，由测试放行);稿子是真的:fixtures/two-slides.pptx。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { until } from './support/awaitCondition'

const appDir = resolve(__dirname, '../app')
const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const GONE = { text: '这份文件已经不在群文件夹里了。', tone: 'error' }
const PLACE_GONE = { text: '这一处在现在这一版里找不到了。', tone: 'info' }
const entryOf = (id: string) => ({
  id, chat: 'chat-1', name: `${id}.pptx`, displayName: `${id}.pptx`, contentType: PPTX, type: 'binary', suffix: '.pptx', size: deck.length,
  createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
})
const ctxOf = (id: string) => ({ chat: { id: 'chat-1', name: 'G', kind: 'group', groupId: 'chat-1' }, file: { chat: 'chat-1', id }, locale: 'zh-CN', capabilities: ['files:read'] })
let contextChanged: (ctx: unknown) => void = () => {}
let heard: (change: unknown) => void = () => {}
let linked: (link: unknown) => void = () => {}
/** Each open and each read asked, held until the test lets it go. */
const opens: { id: string; answer: () => void }[] = []
const reads: { id: string; answer: () => void }[] = []
const fileOf = (entry: ReturnType<typeof entryOf>) => ({
  entry, type: 'binary', readOnly: true, close: vi.fn(),
  blob: () => new Promise((done) => reads.push({ id: entry.id, answer: () => done({ arrayBuffer: async () => deck.slice().buffer }) })),
})
const gugu = {
  setTabTitle: vi.fn(async (_title: string) => {}),
  getContext: vi.fn(async () => ({ chat: { id: 'chat-1', name: 'G', kind: 'group', groupId: 'chat-1' }, locale: 'zh-CN', capabilities: ['files:read'] })),
  onLink: vi.fn((fn: typeof linked) => {
    linked = fn
    return () => {}
  }),
  onContextChanged: vi.fn((fn: typeof contextChanged) => {
    contextChanged = fn
    return () => {}
  }),
  compose: vi.fn(async () => {}),
  files: {
    list: vi.fn(async () => []),
    onChanged: vi.fn((_place: unknown, fn: typeof heard) => {
      heard = fn
      return () => {}
    }),
    open: vi.fn((ref: { id: string }) => new Promise((done) => opens.push({ id: ref.id, answer: () => done(fileOf(entryOf(ref.id))) }))),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const banner = () => ($('banner').hidden ? null : { text: $('banner').firstChild?.textContent ?? $('banner').textContent, tone: $('banner').dataset.tone })
const goneSaid = (id: string) => heard({ kind: 'entries', entries: [], gone: [id] })
const opening = (id: string) => opens.find((o) => o.id === id)
const reading = (id: string) => reads.find((r) => r.id === id)
// Drawn: a deck's place is answered in the same step (its `reveal` is not async), so the banner is final by then.
const drawn = (step: string) => until(step, () => document.body.dataset.state === 'doc' && $('preview').querySelectorAll('.pptx-slide').length === 2)
/** A pill pointing at slide 99 of `id` (with `place`), then the file handed to the page. */
async function openFile(id: string, place: boolean) {
  if (place) linked({ tab: 'office.main', path: '', query: { slide: '99' }, file: id })
  contextChanged(ctxOf(id))
  await until(`${id} is being opened`, () => !!opening(id))
}
async function read(id: string) {
  await until(`${id} is being read`, () => !!reading(id))
  reading(id)!.answer()
  await drawn(`${id} drawn`)
}

beforeAll(async () => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync(resolve(appDir, 'index.html'), 'utf8'), 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  await until('the page started (no file yet)', () => gugu.onContextChanged.mock.calls.length === 1)
}, 30_000)

describe('office App: a place not found does not cover the file being gone (#7257)', () => {
  test('gone heard while opened, the place not found: gone stays', async () => {
    await openFile('d1', true)
    goneSaid('d1')
    opening('d1')!.answer()
    await read('d1')
    expect(banner(), '对照:11bd96dbf5 上位置的 info 盖掉了「已删除」').toEqual(GONE)
  }, 30_000)

  test('gone heard while its bytes are read, the place not found: gone stays', async () => {
    await openFile('d2', true)
    opening('d2')!.answer()
    await until('d2 is being read', () => !!reading('d2'))
    goneSaid('d2')
    await read('d2')
    expect(banner(), '对照:5aac4b8faa 上也是位置的 info 盖掉「已删除」').toEqual(GONE)
  }, 30_000)

  test('control: the place not found, nothing heard — said', async () => {
    await openFile('d3', true)
    opening('d3')!.answer()
    await read('d3')
    expect(banner()).toEqual(PLACE_GONE)
  }, 30_000)

  test('control: gone heard while opened, no place — gone', async () => {
    await openFile('d4', false)
    goneSaid('d4')
    opening('d4')!.answer()
    await read('d4')
    expect(banner()).toEqual(GONE)
  }, 30_000)
})
