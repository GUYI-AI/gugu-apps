// @vitest-environment jsdom
// 咕咕办公的页面外壳(app.js):从 App 列表打开、没交给它文件时说它是干什么的;交给它一份它不开的文件说打不开;
// 交给它 .pptx 时标签页标题是文件名,听的是文件所在那个群的文件变化(onChanged 认文件的 chat,不认页面开在哪);
// 读不了群文件夹(没有 files:read)时明说「新版本看不到」,不悄悄停在旧版上。
// 运行时是假的(getContext / onContextChanged / files.open / list / onChanged);稿子是真的 fixtures/two-slides.pptx。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')
const deck = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))

const entryOf = (id: string, name: string, chat: string) => ({
  id, chat, name, displayName: name, contentType: 'application/octet-stream', type: 'binary', suffix: name.slice(name.lastIndexOf('.')), size: deck.length,
  createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
})
const files = { deck: entryOf('deck', '季度.pptx', 'group-2'), doc: entryOf('doc', '合同.docx', 'group-1'), pill: entryOf('pill', '季度三.pptx', 'group-2') }
const panel = { chat: { id: 'group-1', name: 'G', kind: 'group', groupId: 'group-1' }, locale: 'zh-CN', capabilities: ['files:read'] }
let handTo: (ctx: unknown) => void = () => {}
const gugu = {
  setTabTitle: vi.fn(async (_title: string) => {}),
  getContext: vi.fn(async () => panel),
  onLink: vi.fn(),
  onContextChanged: vi.fn((handler: (ctx: unknown) => void) => {
    handTo = handler
    return () => {}
  }),
  compose: vi.fn(async () => {}),
  files: {
    list: vi.fn(async () => [files.deck]),
    onChanged: vi.fn((_place: unknown, _handler: () => void) => () => {}),
    open: vi.fn(async (ref: { id: keyof typeof files }) => ({
      entry: files[ref.id],
      type: 'binary',
      readOnly: true,
      // Only arrayBuffer() is read; jsdom's Blob may not have it.
      blob: async () => ({ arrayBuffer: async () => deck.slice().buffer }),
      close: vi.fn(),
    })),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const until = (check: () => void, timeout = 15000) => vi.waitFor(check, { timeout })

beforeAll(async () => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  // A desktop with a mouse (jsdom has no matchMedia): the bar floats by what is picked, Esc lets it go.
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
})

describe('咕咕办公 · 页面外壳', () => {
  test('没交给它文件(从 App 列表打开):说从群文件夹点开一份演示稿或表格;标签页是 App 的名字', async () => {
    await until(() => expect($('doc-message').textContent).toBe('从群文件夹里点开一份演示稿（.pptx）或表格（.xlsx），就在这里打开。'))
    expect(document.body.dataset.state).toBe('message')
    expect(gugu.setTabTitle).toHaveBeenLastCalledWith('咕咕办公')
    expect(gugu.files.open).not.toHaveBeenCalled()
  })

  test('交给它一份它不开的文件:说打不开哪一份,不听那个群', async () => {
    handTo({ ...panel, file: { id: 'doc', chat: 'group-1' } })
    await until(() => expect($('doc-message').textContent).toBe('咕咕办公打不开这种文件：合同.docx'))
    expect(gugu.files.onChanged).not.toHaveBeenCalled()
    expect($('pick-bar').classList.contains('on')).toBe(false)
  })

  test('交给它 .pptx:画出来,标签页是文件名,听的是文件所在的群', async () => {
    handTo({ ...panel, file: { id: 'deck', chat: 'group-2' } })
    await until(() => expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2))
    expect(document.body.dataset.state).toBe('doc')
    expect(gugu.setTabTitle).toHaveBeenLastCalledWith('季度.pptx')
    expect(gugu.files.onChanged).toHaveBeenCalledTimes(1)
    expect(gugu.files.onChanged.mock.calls[0]![0]).toEqual({ chat: 'group-2' })
    await until(() => expect(gugu.files.list).toHaveBeenCalledWith({ chat: 'group-2' }))
    // Nothing picked: no bar, nothing over the deck but the deck.
    expect($('pick-bar').classList.contains('on')).toBe(false)
    expect($('banner').hidden).toBe(true)
    // A pick goes to the composer of the chat the file is in, with a pill to the file (compose's `refs`): the group's.
    $('preview').querySelector<HTMLButtonElement>('.pptx-slide[data-n="1"] .pptx-hit')!.click()
    expect($('pick-bar').classList.contains('on')).toBe(true)
    expect($('pick-count').textContent).toBe('1 处')
    $('pick-send').click()
    await until(() => expect(gugu.compose).toHaveBeenCalledTimes(1))
    const [text, where] = gugu.compose.mock.calls[0] as unknown as [string, { refs: { file: { id: string; chat: string } }[] }]
    // The pick is the pill (App 引用 pill): no words of the App's own — the person says what to do.
    expect(text).toBe('')
    expect(where.refs).toEqual([expect.objectContaining({ file: expect.objectContaining({ id: 'deck', chat: 'group-2' }), at: { slide: 1, shape: '2', k: 1 }, label: '第 1 页 · 第 1 页 标题' })])
  })

  test('读不了群文件夹(没有 files:read):画照样画,横条明说新版本看不到', async () => {
    // Another deck, in another group (the id `doc` now names a .pptx).
    files.doc = entryOf('doc', '季度二.pptx', 'group-3')
    handTo({ ...panel, capabilities: [], file: { id: 'doc', chat: 'group-3' } })
    await until(() => expect(gugu.setTabTitle).toHaveBeenLastCalledWith('季度二.pptx'))
    await until(() => expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2))
    expect($('banner').hidden).toBe(false)
    expect($('banner').textContent).toBe('读不了群文件夹（没有 files:read），这份文件有了新版本也看不到。')
    expect(gugu.files.onChanged).toHaveBeenCalledTimes(1)
  })

  // App 引用 pill: a pill clicked opens its file here and the page hears where (the `link` event, query = its `at`) —
  // on the desktop before the page has drawn anything, so the place waits for the deck.
  test('pill 打开它:那一处等稿子画好再找,翻到那一页框出来;这一版没有的那一处明说', async () => {
    const [[onLink]] = gugu.onLink.mock.calls as unknown as [[(link: { tab: string; path: string; query: Record<string, string> }) => void]]
    const found = () => [...$('preview').querySelectorAll<HTMLElement>('.pptx-found')]
    // Handed the file: the deck there goes at once, the new one is read — and the place arrives meanwhile.
    handTo({ ...panel, file: { id: 'pill', chat: 'group-2' } })
    onLink({ tab: 'main', path: '', query: { slide: '2', shape: '2' } })
    expect(found()).toHaveLength(0)
    await until(() => expect(found()).toHaveLength(1))
    expect(found()[0]!.closest<HTMLElement>('.pptx-slide')!.dataset.n).toBe('2')
    onLink({ tab: 'main', path: '', query: { slide: '7' } })
    expect(found()).toHaveLength(0)
    expect($('banner').hidden).toBe(false)
    expect($('banner').textContent).toBe('这一处在现在这一版里找不到了。')
  })
})
