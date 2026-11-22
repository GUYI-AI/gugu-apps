// @vitest-environment jsdom
// 咕咕办公自己的一页(home.js):只列最近打开过的演示稿和表格(files.recent 一次),从不列一个群的全部文件。
// 画在群里(getContext().chat)时一行里有「群文件」(宿主的文件 App,开在这个群)和「新建」(有 files:write:按钮与菜单,
// 宽页面与什么都没打开过时是卡片),在本群文件夹里放一份 App 自带的空白文件再打开它;什么都没打开过时可以先建空白再交给 agent。
// 画在没有群的地方(左栏):只有最近打开。
// 运行时是假的(getContext / onContextChanged / files.recent / upload / openWith / linkTo / openLink / dispatch)。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

const appDir = resolve(__dirname, '../app')

const entryOf = (id: string, name: string, chat: string, chatName: string, updatedAt: string) => ({
  id, chat, chatName, name, path: name, type: 'binary', suffix: name.slice(name.lastIndexOf('.')), updatedAt, openedAt: updatedAt,
})
const A = { id: 'group-a', name: 'A群', kind: 'group', groupId: 'group-a', members: [] }
const B = { id: 'group-b', name: 'B群', kind: 'group', groupId: 'group-b', members: [] }
const EMPTY = { id: 'group-e', name: '空群', kind: 'group', groupId: 'group-e', members: [] }
const opened = [
  entryOf('b1', '产品路线.pptx', 'group-b', 'B群', '2026-10-25T11:00:00Z'),
  entryOf('a9', '笔记.md', 'group-a', 'A群', '2026-10-25T10:30:00Z'),
  entryOf('a2', '预算.xlsx', 'group-a', 'A群', '2026-10-25T10:00:00Z'),
]
let recent = opened

const ctxOf = (chat: typeof A | null, capabilities = ['files:read', 'agents:tools']) => ({ ...(chat ? { chat } : {}), locale: 'zh-CN', capabilities, layout: { visible: true, width: 500, height: 800, fullscreen: false } })
let handTo: (ctx: unknown) => void = () => {}
const gugu = {
  getContext: vi.fn(async () => ctxOf(A)),
  onContextChanged: vi.fn((handler: (ctx: unknown) => void) => {
    handTo = handler
    return () => {}
  }),
  dispatch: vi.fn(async (): Promise<{ cancelled?: true }> => ({})),
  linkTo: vi.fn(async (target: { chat: string }) => `link:${target.chat}`),
  openLink: vi.fn(async () => {}),
  files: {
    list: vi.fn(async () => []),
    recent: vi.fn(async () => recent),
    openWith: vi.fn(async () => {}),
    upload: vi.fn(async ({ chat }: { chat: string }, file: File) => [entryOf('new', file.name, chat, chat, '2026-10-25T12:00:00Z')]),
  },
}
const fetched: string[] = []
/** 「新建」 names a file by the minute it was made: the case pins the date (only Date is faked, the waits still run). */
const stamp = () => '10-25 1407'

const $ = (id: string) => document.getElementById(id) as HTMLElement
const until = (check: () => void) => vi.waitFor(check, { timeout: 15000 })
const names = () => [...$('files').querySelectorAll('li strong')].map((e) => e.textContent)

beforeAll(async () => {
  const html = readFileSync(resolve(appDir, 'home.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu, fetch: vi.fn(async (url: URL) => {
    fetched.push(String(url))
    // A copy of the file's bytes alone: a Buffer's `.buffer` may be a bigger ArrayBuffer it is only a view into.
    return { arrayBuffer: async () => new Uint8Array(readFileSync(resolve(appDir, String(url).slice(String(url).lastIndexOf('/') + 1)))).buffer }
  }) })
  Object.assign(window, { gugu })
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/home.js')
})

beforeEach(() => {
  gugu.files.list.mockClear()
  gugu.files.recent.mockClear()
  gugu.dispatch.mockClear()
  gugu.files.upload.mockClear()
  gugu.files.openWith.mockClear()
})

const WRITE = ['files:read', 'files:write', 'agents:tools']

describe('咕咕办公自己的一页', () => {
  test('画在群里:只列最近打开的演示稿和表格(问一次 files.recent),不列本群文件夹', async () => {
    await until(() => expect(names()).toEqual(['产品路线.pptx', '预算.xlsx']))
    expect(gugu.files.list).not.toHaveBeenCalled()
    expect($('files-title').textContent).toBe('最近打开')
    expect([...$('files').querySelectorAll('.where')].map((e) => e.textContent)).toEqual(['B群', 'A群'])
    expect(document.querySelector('input, select, [role=tablist]')).toBeNull()
  })

  test('「群文件」用宿主的文件 App 开这个群的文件夹', async () => {
    expect($('bar').hidden).toBe(false)
    expect($('folder').textContent).toBe('群文件')
    $('folder').click()
    await until(() => expect(gugu.openLink).toHaveBeenCalledWith('link:group-a'))
    expect(gugu.linkTo).toHaveBeenCalledWith({ kind: 'app', app: 'workspace', tab: 'main', chat: 'group-a' })
    handTo(ctxOf(B))
    await until(() => expect(gugu.files.recent).toHaveBeenCalled())
    $('folder').click()
    await until(() => expect(gugu.openLink).toHaveBeenLastCalledWith('link:group-b'))
  })

  test('点一行:在它所在的地方打开', async () => {
    await until(() => expect(names()).toContain('预算.xlsx'))
    ;($('files').querySelector('[data-item="a2"]') as HTMLElement).click()
    expect(gugu.files.openWith).toHaveBeenCalledWith(expect.objectContaining({ id: 'a2', chat: 'group-a' }))
  })

  test('没有 files:write:不给「新建」', async () => {
    handTo(ctxOf(A))
    await until(() => expect(names()).toContain('预算.xlsx'))
    expect($('new').hidden).toBe(true)
    expect($('blanks').hidden).toBe(true)
  })

  test('有 files:write:「新建」菜单里的空白演示稿放进本群文件夹顶层,放好就打开;卡片同样', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 25, 14, 7))
    handTo(ctxOf(A, WRITE))
    await until(() => expect($('new').hidden).toBe(false))
    expect($('new').textContent).toBe('新建')
    expect($('create').hidden).toBe(true)
    $('new').click()
    expect($('create').hidden).toBe(false)
    expect([...$('create').querySelectorAll('button')].map((b) => b.textContent)).toEqual(['空白演示稿', '空白表格'])
    expect([...$('blanks').querySelectorAll('button')].map((b) => b.textContent)).toEqual(['空白演示稿', '空白表格'])
    ;($('create').querySelector('[data-create="pptx"]') as HTMLButtonElement).click()
    expect($('create').hidden).toBe(true)
    await until(() => expect(gugu.files.openWith).toHaveBeenCalled())
    expect(fetched.at(-1)).toMatch(/\/blank\.pptx$/)
    const [place, file] = gugu.files.upload.mock.calls.at(-1)!
    expect(place).toEqual({ chat: 'group-a' })
    expect(file.name).toBe(`未命名演示稿 ${stamp()}.pptx`)
    expect(file.type).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array(readFileSync(resolve(appDir, 'blank.pptx'))))
    expect(gugu.files.openWith).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'new', name: file.name }))
    ;($('blanks').querySelector('[data-create="xlsx"]') as HTMLButtonElement).click()
    await until(() => expect(gugu.files.upload.mock.calls.at(-1)![1].name).toBe(`未命名表格 ${stamp()}.xlsx`))
    vi.useRealTimers()
  })

  test('什么都没打开过:空白卡片就是开头(窄页面也给);先建空白演示稿,交宿主派给 agent,再打开同一文件', async () => {
    recent = [opened[1]]
    handTo(ctxOf(EMPTY, WRITE))
    await until(() => expect($('empty').hidden).toBe(false))
    expect($('empty').textContent).toContain('还没有打开过演示稿或表格')
    expect(document.body.classList.contains('empty-here')).toBe(true)
    expect($('blanks').hidden).toBe(false)
    ;($('empty').querySelector('[data-ask]') as HTMLButtonElement).click()
    await until(() => expect(gugu.files.openWith).toHaveBeenCalledTimes(1))
    expect(gugu.files.upload.mock.calls[0]![0]).toEqual({ chat: 'group-e' })
    expect(gugu.files.upload.mock.calls[0]![1].name).toMatch(/\.pptx$/)
    const entry = await gugu.files.upload.mock.results[0]!.value
    expect(gugu.dispatch).toHaveBeenCalledWith('用咕咕办公做这份演示稿，内容：', { refs: [{ file: entry[0] }] })
    expect(gugu.files.openWith).toHaveBeenCalledWith(entry[0])
    expect(gugu.files.upload.mock.invocationCallOrder[0]).toBeLessThan(gugu.dispatch.mock.invocationCallOrder[0]!)
    recent = opened
  })

  test('等待人选择派发对象时就打开新文件,不等原来的点击手势过期', async () => {
    recent = []
    handTo(ctxOf(EMPTY, WRITE))
    let finish!: (value: { cancelled: true }) => void
    gugu.dispatch.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const ask = await vi.waitFor(() => {
      const button = $('empty').querySelector('[data-ask]') as HTMLButtonElement | null
      expect(button).not.toBeNull()
      return button!
    })
    ask.click()
    try {
      await until(() => expect(gugu.dispatch).toHaveBeenCalledTimes(1))
      await until(() => expect(gugu.files.openWith).toHaveBeenCalledTimes(1))
    } finally {
      finish({ cancelled: true })
      recent = opened
    }
  })

  test('一份文件画成宿主的文件图块(<gugu-file-mark tile>,和文件 App 一样),页面里没有自带的图', async () => {
    handTo(ctxOf(A, WRITE))
    await until(() => expect(names()).toContain('预算.xlsx'))
    const marks = [...$('files').querySelectorAll('li')].map((li) => li.querySelector('gugu-file-mark'))
    expect(marks.map((mark) => [mark?.getAttribute('name'), mark?.hasAttribute('tile')])).toEqual(names().map((name) => [name, true]))
    expect([...$('create').querySelectorAll('gugu-file-mark')].map((mark) => mark.getAttribute('name'))).toEqual(['blank.pptx', 'blank.xlsx'])
    expect(document.querySelectorAll('main img, .menu img')).toHaveLength(0)
  })

  test('挪到没有群的地方(左栏):没有那一行,只有最近打开', async () => {
    handTo(ctxOf(null, WRITE))
    await until(() => expect($('bar').hidden).toBe(true))
    await until(() => expect(names()).toEqual(['产品路线.pptx', '预算.xlsx']))
    expect($('blanks').hidden).toBe(true)
    expect($('files-title').textContent).toBe('最近打开')
  })
})
