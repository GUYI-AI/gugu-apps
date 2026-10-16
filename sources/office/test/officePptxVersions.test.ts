// @vitest-environment jsdom
// 咕咕办公开着一份 .pptx,agent 把它改成了新的一版(第 ② 次实测:真机上人这边一直停在第 1 版,库里已是第 5 版):
// 列表因 workspace_changed 刷新、版本变大 ⇒ 原地重画成新版(旧的留在屏上直到新的一步换上);人手上还攒着没放进输入框的选区时不自动重画,
// 提示「有新的一版」+「打开新的一版」,这时放进输入框的引用写明是哪一版上选的。
// 运行时是假的(files.open / list / onChanged / compose);稿子是真的:fixtures/two-slides.pptx,新版本用 A2 的写回
// (pptx-ooxml.mjs applyEdits)改出来,所以重画读到的是真的新字节。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')
const v1 = new Uint8Array(readFileSync(resolve(__dirname, 'fixtures/two-slides.pptx')))

interface Ooxml {
  readZip(bytes: Uint8Array): unknown
  locate(zip: unknown, address: { slide: number; shape: string; k?: number }): { xml: string; was: string }
  applyEdits(bytes: Uint8Array, edits: never): { bytes: Uint8Array }
}
let ooxml: Ooxml
/** `bytes` with slide 1's title saying `title` instead (A2's own write-back). */
const retitled = (bytes: Uint8Array, from: string, title: string) => {
  const { xml, was } = ooxml.locate(ooxml.readZip(bytes), { slide: 1, shape: '2', k: 1 })
  return ooxml.applyEdits(bytes, [{ slide: 1, shape: '2', k: 1, was, xml: xml.replace(from, title) }] as never).bytes
}

const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const entry = {
  id: 'deck', chat: 'chat-1', name: '季度.pptx', displayName: '季度.pptx', contentType: PPTX, type: 'binary', suffix: '.pptx', size: v1.length,
  createdAt: null, updatedAt: null, createdBy: { id: 'u1', name: 'A', kind: 'human' }, sourceMessageIds: [], version: 1,
}
const versions = new Map<number, Uint8Array>([[1, v1]])
let stored = 1 // the version files.open hands out
let listed = 1 // the version the chat says the file is at (files.onChanged, #7257)
let failOpen = false
let changed: () => void = () => {}
const gugu = {
  setTabTitle: vi.fn(async () => {}),
  getContext: vi.fn(async () => ({ chat: { id: 'chat-1', name: 'G', kind: 'group', groupId: 'chat-1' }, file: { chat: 'chat-1', id: 'deck' }, locale: 'zh-CN', capabilities: ['files:read'] })),
  onLink: vi.fn(),
  onContextChanged: vi.fn(() => () => {}),
  compose: vi.fn(async (_text: string) => {}),
  files: {
    list: vi.fn(async () => [{ ...entry, version: listed }]),
    onChanged: vi.fn((_place: unknown, handler: (change: unknown) => void) => {
      // The chat says how its files are now (#7257): the App reads no list.
      changed = () => handler({ kind: 'entries', entries: [{ ...entry, version: listed }], gone: [] })
      return () => {}
    }),
    open: vi.fn(async () => {
      if (failOpen) throw Object.assign(new Error('the file service did not answer'), { code: 'failed' })
      const bytes = versions.get(stored)!
      // Only arrayBuffer() is read; jsdom's Blob may not have it.
      return { entry: { ...entry, version: stored, size: bytes.length }, type: 'binary', readOnly: true, blob: async () => ({ arrayBuffer: async () => bytes.slice().buffer }), close: vi.fn() }
    }),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const banner = () => $('banner')
/** The first slide's picture: a new one once the deck is drawn again. */
const firstSlide = () => $('preview').querySelector('.pptx-slide img')?.getAttribute('src') ?? null
const redrawn = (before: string | null) => vi.waitFor(() => expect(firstSlide()).not.toBe(before), { timeout: 5000 })
/** A new version saved (an agent's): what the chat and open say from now, heard by the App at once (#7257: no list). */
async function save(version: number, bytes?: Uint8Array) {
  if (bytes) versions.set(version, bytes)
  stored = version
  listed = version
  changed()
  expect(gugu.files.list).not.toHaveBeenCalled()
}
/** Only the chat says `version` (open hands out what it did): a rename, or an older answer arriving late. */
async function listSays(version: number) {
  listed = version
  changed()
  expect(gugu.files.list).not.toHaveBeenCalled()
  await new Promise((r) => setTimeout(r, 20))
}
/** Pick slide `n`'s first shape and put the picks in the composer: the pills the App made (App 引用 pill). */
async function pickAndSend(n: number) {
  $('preview').querySelector<HTMLButtonElement>(`.pptx-slide[data-n="${n}"] .pptx-hit`)!.click()
  const before = gugu.compose.mock.calls.length
  $('pick-send').click()
  await vi.waitFor(() => expect(gugu.compose).toHaveBeenCalledTimes(before + 1))
  return (gugu.compose.mock.calls.at(-1) as unknown as [string, { refs: { version?: number; at: Record<string, unknown>; label: string }[] }])[1].refs
}

beforeAll(async () => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:slide-${++n}`)
  URL.revokeObjectURL = vi.fn()
  ooxml = (await import(/* @vite-ignore */ resolve(appDir, 'skills/office/lib/pptx-ooxml.mjs'))) as Ooxml
  const html = readFileSync(resolve(appDir, 'index.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  // A desktop with a mouse (jsdom has no matchMedia): the bar floats by what is picked, Esc lets it go.
  window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList)
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/app.js')
  // The first open reads the vendored pptx-glimpse cold: slow on a loaded machine (every test file at once).
  await vi.waitFor(() => expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2), { timeout: 15000 })
}, 30000)

describe('咕咕办公 · 开着的 .pptx 有了新版本', () => {
  test('手上没攒着的:原地重画成新版,旧的一页不剩;版本没变大就不重画(对照)', async () => {
    expect(gugu.files.open).toHaveBeenCalledTimes(1)
    // Control: a change that leaves the version where it is (a rename, another file) draws nothing again.
    await save(1)
    await new Promise((r) => setTimeout(r, 50))
    expect(gugu.files.open).toHaveBeenCalledTimes(1)

    const drawn = firstSlide()
    await save(2, retitled(v1, '第 1 页 标题', '第二版的标题'))
    await redrawn(drawn)
    expect(gugu.files.open).toHaveBeenCalledTimes(2)
    const [ref] = await pickAndSend(1)
    expect(ref!.label).toContain('第二版的标题')
    expect($('preview').querySelectorAll('.pptx-deck')).toHaveLength(1)
    expect($('preview').querySelectorAll('.pptx-slide')).toHaveLength(2)
    expect(banner().hidden).toBe(true)
    // Drawn from the version on screen: picked on the newest, and the pill says so.
    expect(ref!.version).toBe(2)
  })

  test('手上攒着的时候不自动重画:提示有第 3 版;这时放进输入框的引用写明是第 2 版上选的;点「打开新的一版」才重画', async () => {
    $('preview').querySelector<HTMLButtonElement>('.pptx-slide[data-n="2"] .pptx-hit')!.click()
    expect($('pick-count').textContent).toBe('1 处')
    await save(3, retitled(versions.get(2)!, '第二版的标题', '第三版的标题'))
    await vi.waitFor(() => expect(banner().hidden).toBe(false))
    expect(banner().textContent).toContain('有了第 3 版；你攒着的 1 处是在第 2 版上选的')
    expect(gugu.files.open).toHaveBeenCalledTimes(2)

    // The file is at 3: the pill says it was picked on 2 (its link's ?v=), which the skill tells an agent to check.
    const [ref] = await pickAndSend(1)
    expect(ref).toMatchObject({ version: 2, at: { slide: 1, shape: '2', k: 1 } })
    expect(ref!.label).toContain('第二版的标题')
    // Sent: none waiting, the banner says so and still offers the new version.
    expect(banner().textContent).toContain('有了第 3 版；画面上还是第 2 版。')
    expect(gugu.files.open).toHaveBeenCalledTimes(2)

    const drawn = firstSlide()
    banner().querySelector('button')!.click()
    await redrawn(drawn)
    expect(gugu.files.open).toHaveBeenCalledTimes(3)
    expect(banner().hidden).toBe(true)
    expect($('pick-bar').classList.contains('on')).toBe(false)
    const [fresh] = await pickAndSend(1)
    expect(fresh!.label).toContain('第三版的标题')
    expect(fresh!.version).toBe(3)
  })

  test('重画失败:说出原因、不自己反复重试;点「打开新的一版」再试', async () => {
    failOpen = true
    await save(4, retitled(versions.get(3)!, '第三版的标题', '第四版的标题'))
    await vi.waitFor(() => expect(banner().textContent).toContain('the file service did not answer'))
    expect(banner().dataset.tone).toBe('error')
    const opens = gugu.files.open.mock.calls.length
    await new Promise((r) => setTimeout(r, 50))
    expect(gugu.files.open.mock.calls.length).toBe(opens)

    failOpen = false
    const drawn = firstSlide()
    banner().querySelector('button')!.click()
    await redrawn(drawn)
    expect(banner().hidden).toBe(true)
    const [ref] = await pickAndSend(1)
    expect(ref!.label).toContain('第四版的标题')
  })

  // The list has no order: two refreshes can cross. What the page says of the newest version only moves up (review
  // 2026-10-12, B3 — `> latest` is not `!== drawn`).
  test('列表的回答不分先后:同一版再说一次,横条不重画;后到的旧回答(第 5 版)不把横条退回去,pill 照旧是第 4 版上选的', async () => {
    $('preview').querySelector<HTMLButtonElement>('.pptx-slide[data-n="2"] .pptx-hit')!.click()
    await save(6, retitled(versions.get(4)!, '第四版的标题', '第六版的标题'))
    await vi.waitFor(() => expect(banner().textContent).toContain('有了第 6 版；你攒着的 1 处是在第 4 版上选的'))
    const button = banner().querySelector('button')
    await listSays(6)
    expect(banner().querySelector('button')).toBe(button)
    await listSays(5)
    expect(banner().textContent).toContain('有了第 6 版')
    const [ref] = await pickAndSend(1)
    expect(ref!.version).toBe(4)
  })
})
