// @vitest-environment jsdom
// 咕咕办公自己的一页(home.js):画在一个群里(getContext().chat,群右栏)时先是这个群的页 —— 列本群文件夹里的文件、
// 搜本群,一枚「所有群」切回跨群的最近打开与搜索;本群没有这类文件时「让 agent 做一份」把草稿放进本群输入框;
// 换到另一个群(onContextChanged 整份替换)就画那个群;画在没有群的地方(左栏)照旧是最近打开。
// 运行时是假的(getContext / onContextChanged / files.list / recent / search / openWith / compose)。
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
const folders: Record<string, ReturnType<typeof entryOf>[]> = {
  'group-a': [entryOf('a1', '季度汇报.pptx', 'group-a', 'A群', '2026-10-25T10:00:00Z'), entryOf('a2', '预算.xlsx', 'group-a', 'A群', '2026-10-25T11:00:00Z'), { ...entryOf('a3', '附件', 'group-a', 'A群', ''), type: 'folder' }],
  'group-b': [entryOf('b1', '产品路线.pptx', 'group-b', 'B群', '2026-10-25T09:00:00Z')],
  'group-e': [],
}
const recent = [folders['group-b'][0], folders['group-a'][0]]

const ctxOf = (chat: typeof A | null) => ({ ...(chat ? { chat } : {}), locale: 'zh-CN', capabilities: ['files:read', 'agents:tools'], layout: { visible: true, width: 500, height: 800, fullscreen: false } })
let handTo: (ctx: unknown) => void = () => {}
const gugu = {
  getContext: vi.fn(async () => ctxOf(A)),
  onContextChanged: vi.fn((handler: (ctx: unknown) => void) => {
    handTo = handler
    return () => {}
  }),
  compose: vi.fn(async () => ({})),
  files: {
    list: vi.fn(async ({ chat }: { chat: string }) => folders[chat] ?? []),
    recent: vi.fn(async () => recent),
    search: vi.fn(async () => [folders['group-b'][0]]),
    openWith: vi.fn(async () => {}),
  },
}

const $ = (id: string) => document.getElementById(id) as HTMLElement
const until = (check: () => void) => vi.waitFor(check, { timeout: 15000 })
const names = () => [...$('files').querySelectorAll('li strong')].map((e) => e.textContent)
const scopeTab = (scope: string) => $('scope').querySelector(`[data-scope="${scope}"]`) as HTMLButtonElement
const search = (text: string) => {
  const box = $('query') as HTMLInputElement
  box.value = text
  box.dispatchEvent(new Event('input'))
}

beforeAll(async () => {
  const html = readFileSync(resolve(appDir, 'home.html'), 'utf8')
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  Object.assign(globalThis, { gugu })
  Object.assign(window, { gugu })
  // @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
  await import('../app/home.js')
})

beforeEach(() => {
  gugu.files.list.mockClear()
  gugu.files.recent.mockClear()
  gugu.files.search.mockClear()
  gugu.compose.mockClear()
})

describe('咕咕办公自己的一页 · 画在群里', () => {
  test('从群右栏打开:列本群的演示稿和表格(新改的在前),标题是群名;「本群 · A群」选中,不列最近打开过的群', async () => {
    await until(() => expect(names()).toEqual(['预算.xlsx', '季度汇报.pptx']))
    expect($('files-title').textContent).toBe('A群')
    expect($('scope').hidden).toBe(false)
    expect(scopeTab('here').textContent).toBe('本群 · A群')
    expect(scopeTab('here').getAttribute('aria-selected')).toBe('true')
    expect(($('query') as HTMLInputElement).placeholder).toBe('搜索本群文件')
    expect($('groups').hidden).toBe(true)
  })

  test('在本群里搜:按名字筛本群的文件,不去搜所有群', async () => {
    gugu.files.list.mockClear()
    search('预算')
    await until(() => expect(names()).toEqual(['预算.xlsx']))
    expect(gugu.files.list).toHaveBeenCalledWith({ chat: 'group-a' })
    expect(gugu.files.search).not.toHaveBeenCalled()
    search('')
    await until(() => expect(names()).toEqual(['预算.xlsx', '季度汇报.pptx']))
  })

  test('点「所有群」:回到跨群的最近打开和最近打开过的群;搜索搜所有群;再点「本群」回来', async () => {
    scopeTab('everywhere').click()
    await until(() => expect(names()).toEqual(['产品路线.pptx', '季度汇报.pptx']))
    expect(scopeTab('everywhere').getAttribute('aria-selected')).toBe('true')
    expect(($('query') as HTMLInputElement).placeholder).toBe('搜索所有群文件')
    expect($('groups').hidden).toBe(false)
    search('路线')
    await until(() => expect(gugu.files.search).toHaveBeenCalled())
    search('')
    scopeTab('here').click()
    await until(() => expect(names()).toEqual(['预算.xlsx', '季度汇报.pptx']))
  })

  test('换到另一个群(onContextChanged 整份替换):画 B群,回到「本群」', async () => {
    scopeTab('everywhere').click()
    await until(() => expect(gugu.files.recent).toHaveBeenCalled())
    handTo(ctxOf(B))
    await until(() => expect(names()).toEqual(['产品路线.pptx']))
    expect($('files-title').textContent).toBe('B群')
    expect(scopeTab('here').textContent).toBe('本群 · B群')
    expect(scopeTab('here').getAttribute('aria-selected')).toBe('true')
  })

  test('本群没有这类文件:说没有,「让 agent 做一份」把草稿放进本群的输入框(选了演示稿就要演示稿)', async () => {
    handTo(ctxOf(EMPTY))
    await until(() => expect($('empty').hidden).toBe(false))
    expect($('empty').textContent).toContain('本群文件夹里还没有这类文件')
    ;[...$('kinds').querySelectorAll('button')].find((b) => b.textContent === '演示稿')!.click()
    const ask = await vi.waitFor(() => {
      const button = $('empty').querySelector('[data-ask]') as HTMLButtonElement | null
      expect(button).not.toBeNull()
      return button!
    })
    ask.click()
    expect(gugu.compose).toHaveBeenCalledWith('用咕咕办公做一份演示稿，放进本群文件夹：', { chat: 'group-e' })
  })

  test('挪到没有群的地方(左栏):没有「本群/所有群」,照旧是最近打开和最近打开过的群', async () => {
    handTo(ctxOf(null))
    await until(() => expect($('scope').hidden).toBe(true))
    await until(() => expect($('groups').hidden).toBe(false))
    expect($('files-title').textContent).toBe('最近打开')
    expect(($('query') as HTMLInputElement).placeholder).toBe('搜索所有群文件')
  })
})
