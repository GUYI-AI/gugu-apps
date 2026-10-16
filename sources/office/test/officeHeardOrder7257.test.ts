// @vitest-environment jsdom
// #7257(复核 2 第 3 点):咕咕办公在读文件之前就听着它所在的群。打开途中听到的(一改)先记在这次打开上,文件一到手就放上去;
// 读字节途中再听到的(二改)当场放上去 —— 所以页面停在最新的那个名字上,而不是画完后又被打开途中那条旧的盖回去。
// 运行时是假的(files.open / blob 每一次都扣住，由测试放行);稿子是真的:fixtures/two-slides.pptx。
// 名字在它露面的两处读:标签页标题(setTabTitle)和挑一块放进输入框的引用 pill。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { until } from './support/awaitCondition'

const appDir = resolve(__dirname, '../app')
const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const entryOf = (id: string, name: string) => ({
  id, chat: 'chat-1', name, displayName: name, contentType: PPTX, type: 'binary', suffix: '.pptx', size: deck.length,
  createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
})
const ctxOf = (id: string) => ({ chat: { id: 'chat-1', name: 'G', kind: 'group', groupId: 'chat-1' }, file: { chat: 'chat-1', id }, locale: 'zh-CN', capabilities: ['files:read'] })
let contextChanged: (ctx: unknown) => void = () => {}
let heard: (change: unknown) => void = () => {}
/** Each open and each read asked, held until the test lets it go. */
const opens: { id: string; answer: (entry: ReturnType<typeof entryOf> | Error) => void }[] = []
const reads: { id: string; answer: () => void }[] = []
const fileOf = (entry: ReturnType<typeof entryOf>) => ({
  entry, type: 'binary', readOnly: true, close: vi.fn(),
  blob: () => new Promise((done) => reads.push({ id: entry.id, answer: () => done({ arrayBuffer: async () => deck.slice().buffer }) })),
})
const gugu = {
  setTabTitle: vi.fn(async (_title: string) => {}),
  getContext: vi.fn(async () => ctxOf('d1')),
  onLink: vi.fn(),
  onContextChanged: vi.fn((fn: typeof contextChanged) => {
    contextChanged = fn
    return () => {}
  }),
  compose: vi.fn(async (_text: string, _options: unknown) => {}),
  files: {
    list: vi.fn(async () => []),
    onChanged: vi.fn((_place: unknown, fn: typeof heard) => {
      heard = fn
      return () => {}
    }),
    open: vi.fn((ref: { id: string }) => new Promise((done, fail) => opens.push({ id: ref.id, answer: (entry) => (entry instanceof Error ? fail(entry) : done(fileOf(entry))) }))),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const said = (id: string, name: string) => heard({ kind: 'entries', entries: [entryOf(id, name)], gone: [] })
const title = () => gugu.setTabTitle.mock.calls.at(-1)?.[0] ?? null
const opening = (id: string) => opens.find((o) => o.id === id)
const reading = (id: string) => reads.find((r) => r.id === id)
const drawn = (step: string) => until(step, () => document.body.dataset.state === 'doc' && $('preview').querySelectorAll('.pptx-slide').length === 2)
/** Slide 1's first shape picked and put in the composer: the name on the pill. */
async function pillName() {
  $('preview').querySelector<HTMLButtonElement>('.pptx-slide[data-n="1"] .pptx-hit')!.click()
  const before = gugu.compose.mock.calls.length
  $('pick-send').click()
  await until('the pick is in the composer', () => gugu.compose.mock.calls.length === before + 1)
  const [, options] = gugu.compose.mock.calls.at(-1) as unknown as [string, { refs: { file: { name: string } }[] }]
  return options.refs[0]!.file.name
}
async function openFile(id: string) {
  contextChanged(ctxOf(id))
  await until(`${id} is being opened`, () => !!opening(id))
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
}, 30_000)

describe('office App: what its chat says of the file while it is opened and read (#7257)', () => {
  test('renamed while opened (一改), again while read (二改): the page ends on 二改 — the older one does not go over it', async () => {
    await until('d1 is being opened', () => !!opening('d1'))
    said('d1', '一改.pptx')
    opening('d1')!.answer(entryOf('d1', '原名.pptx'))
    await until('d1 is being read', () => !!reading('d1'))
    // What was heard while it was opened is on it as soon as it is the file on screen.
    expect(title()).toBe('一改.pptx')
    said('d1', '二改.pptx')
    expect(title()).toBe('二改.pptx')
    reading('d1')!.answer()
    await drawn('d1 drawn')
    expect(title(), '对照:父提交画完后把打开途中那条(一改)又放了上去').toBe('二改.pptx')
    expect(await pillName()).toBe('二改.pptx')
  }, 30_000)

  test('control: renamed while opened (一改), again once drawn (二改) — 二改', async () => {
    await openFile('d2')
    said('d2', '一改.pptx')
    opening('d2')!.answer(entryOf('d2', '原名.pptx'))
    await until('d2 is being read', () => !!reading('d2'))
    reading('d2')!.answer()
    await drawn('d2 drawn')
    expect(title()).toBe('一改.pptx')
    said('d2', '二改.pptx')
    expect(title()).toBe('二改.pptx')
    expect(await pillName()).toBe('二改.pptx')
  }, 30_000)

  test('heard of a file whose open another one overtook: not put on that other one', async () => {
    await openFile('d3')
    said('d3', '三改.pptx')
    await openFile('d4')
    opening('d3')!.answer(entryOf('d3', '三原.pptx'))
    opening('d4')!.answer(entryOf('d4', '四原.pptx'))
    await until('d4 is being read', () => !!reading('d4'))
    reading('d4')!.answer()
    await drawn('d4 drawn')
    expect(title()).toBe('四原.pptx')
    expect(await pillName()).toBe('四原.pptx')
    expect(reading('d3'), 'the overtaken one is never read').toBe(undefined)
  }, 30_000)

  test('heard of a file whose open failed: not put on the next one opened', async () => {
    await openFile('d5')
    said('d5', '五改.pptx')
    opening('d5')!.answer(new Error('rig: the file service did not answer'))
    await until('d5 said it failed', () => document.body.dataset.state === 'message' && /rig: the file service/.test(document.body.textContent ?? ''))
    await openFile('d6')
    opening('d6')!.answer(entryOf('d6', '六原.pptx'))
    await until('d6 is being read', () => !!reading('d6'))
    reading('d6')!.answer()
    await drawn('d6 drawn')
    expect(title()).toBe('六原.pptx')
    expect(await pillName()).toBe('六原.pptx')
  }, 30_000)
})
