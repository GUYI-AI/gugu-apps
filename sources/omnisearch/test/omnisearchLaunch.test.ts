// @vitest-environment node
// 全能搜索 App(app/):launch.mjs 是咕咕和 omnisearch 之间的那一层。
// 这里用真的 launch.mjs、真的 server.mjs 起进程,按 MCP stdio 跟它说话;判的是 agent 看到什么、没 key 时起不起 omnisearch。
// omnisearch 起来时自己在 stderr 说「Omnisearch MCP server running on stdio」—— 这一句就是「起没起」的判据。
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createInterface } from 'node:readline'
import { afterEach, describe, expect, it } from 'vitest'
import { awaitFact } from './support/awaitFact'

const APP = resolve(__dirname, '../app')
const STARTED = 'Omnisearch MCP server running on stdio'

type Settings = { keys: Record<string, string>; use: Record<string, string> }
// The App's own module, as its page and launch.mjs import it (plain JS in the bundle: typed here).
const { CAPABILITIES, serviceFor } = (await import(pathToFileURL(join(APP, 'catalog.mjs')).href)) as {
  CAPABILITIES: { id: string }[]
  serviceFor: (capability: { id: string }, settings: Settings) => string | null
}

const running: ChildProcessWithoutNullStreams[] = []
// Its stdin closing is how launch.mjs is told to go: it stops omnisearch with it (a kill would leave that one behind).
afterEach(() => {
  for (const child of running.splice(0)) child.stdin.end()
})

/** launch.mjs with a data folder holding `settings` (none: no file at all), spoken to over stdio. */
function launch(settings?: object) {
  const data = mkdtempSync(join(tmpdir(), 'omnisearch-data-'))
  if (settings) writeFileSync(join(data, 'settings.json'), JSON.stringify(settings))
  const env: NodeJS.ProcessEnv = { ...process.env, GUGU_EXTENSION_DATA_DIR: data }
  for (const name of ['FIRECRAWL_API_KEY', 'CONTEXT7_API_KEY', 'TAVILY_API_KEY', 'EXA_API_KEY', 'BRAVE_API_KEY', 'KAGI_API_KEY', 'LINKUP_API_KEY', 'GITHUB_API_KEY']) {
    delete env[name]
  }
  const child = spawn(process.execPath, [join(APP, 'launch.mjs')], { cwd: APP, env })
  running.push(child)
  let stderr = ''
  child.stderr.on('data', (chunk: Buffer) => void (stderr += chunk.toString('utf8')))
  const answers = new Map<number, { result?: Record<string, unknown>; error?: { message: string } }>()
  createInterface({ input: child.stdout }).on('line', (line) => {
    const message = JSON.parse(line)
    if (typeof message.id === 'number') answers.set(message.id, message)
  })
  let next = 0
  const ask = async (method: string, params: object = {}) => {
    const id = ++next
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    return awaitFact(`answer to ${method}`, () => answers.get(id))
  }
  const open = async () => {
    const answer = await ask('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } })
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    return answer
  }
  return { ask, open, stderr: () => stderr, data }
}

const toolNames = (answer: { result?: Record<string, unknown> }) =>
  ((answer.result?.tools ?? []) as { name: string; _meta?: { ui?: { visibility?: string[] } } }[])
    .filter((tool) => !tool._meta?.ui?.visibility || tool._meta.ui.visibility.includes('model'))
    .map((tool) => tool.name)
    .sort()

describe('全能搜索 launch.mjs', () => {
  it('no key anywhere: agents get no tool, the page still gets its status, and omnisearch is never started', async () => {
    const app = launch()
    // Why agents get nothing, in initialize's instructions: what gugu shows where it says this App gives agents no tools.
    expect((await app.open()).result?.instructions).toBe('未配置搜索服务的 API key，请在全能搜索的设置页填写。')
    expect(toolNames(await app.ask('tools/list'))).toEqual([])
    const status = await app.ask('tools/call', { name: 'provider_status', arguments: {} })
    const structured = status.result?.structuredContent as { settings_path: string; services: Record<string, boolean> }
    expect(structured.settings_path).toBe(join(app.data, 'settings.json'))
    expect(Object.values(structured.services).some(Boolean)).toBe(false)
    expect(app.stderr()).not.toContain(STARTED)
  }, 30_000)

  it('a key: omnisearch starts and agents get that service\'s tools — one per capability, the default service filled in', async () => {
    const app = launch({ keys: { firecrawl: 'fc-test-not-a-real-key' }, use: { web_search: 'firecrawl' } })
    await app.open()
    expect(toolNames(await app.ask('tools/list'))).toEqual(['web_extract', 'web_search'])
    await awaitFact('omnisearch said it started', () => (app.stderr().includes(STARTED) ? true : undefined))
  }, 30_000)

  it('a capability turned off is not offered even with its service\'s key', async () => {
    const app = launch({ keys: { firecrawl: 'fc-test-not-a-real-key' }, use: { web_extract: 'off' } })
    await app.open()
    expect(toolNames(await app.ask('tools/list'))).toEqual(['web_search'])
  }, 30_000)

  // 10-06, on a Mac: the first key saved while launch.mjs already ran (every agent session starts it to list tools) made the
  // page's check say「omnisearch stopped」— the check ran on an omnisearch started from the new file, and the restart
  // for that same save killed it under the check. Firecrawl here is a local stand-in that answers slower than the
  // watcher's poll, so the restart is always due while the check is still out.
  it('a key saved while it runs without one: the page\'s check that follows is answered, not cut off by the restart', async () => {
    let hits = 0
    const firecrawl = createServer((_request, response) => {
      hits += 1
      setTimeout(() => response.writeHead(401, { 'content-type': 'application/json' }).end('{"success":false,"error":"Invalid API key"}'), 2500)
    })
    await new Promise<void>((done) => firecrawl.listen(0, '127.0.0.1', done))
    try {
      const app = launch()
      await app.open()
      expect(toolNames(await app.ask('tools/list'))).toEqual([])
      const { port } = firecrawl.address() as AddressInfo
      writeFileSync(join(app.data, 'settings.json'), JSON.stringify({
        keys: { firecrawl: 'fc-test-not-a-real-key' }, use: { web_search: 'firecrawl' }, firecrawl_base_url: `http://127.0.0.1:${port}`,
      }))
      const check = await app.ask('tools/call', { name: 'check_service', arguments: { service: 'firecrawl' } })
      const answer = check.result?.structuredContent as { ok: boolean; reason: string | null }
      expect(hits).toBeGreaterThan(0)
      expect(answer.reason).not.toMatch(/omnisearch stopped/)
    } finally {
      firecrawl.close()
    }
  }, 30_000)

  // 10-19 on mac1: agents saw `web_extract(url, mode?, …)`, guessed mode "text", then took "extract" from omnisearch's own
  // refusal — Firecrawl's AI extraction, which times out. Reading a page needs no mode; a mode is only for a whole site.
  it('web_extract: read a page with no mode; a mode only for a whole site, anything else refused before Firecrawl is asked', async () => {
    const asked: string[] = []
    const firecrawl = createServer((request, response) => {
      asked.push(request.url ?? '')
      response.writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ success: true, data: { markdown: '# Example Domain\n\nThis domain is for use in examples.', metadata: {} } }))
    })
    await new Promise<void>((done) => firecrawl.listen(0, '127.0.0.1', done))
    try {
      const { port } = firecrawl.address() as AddressInfo
      const app = launch({ keys: { firecrawl: 'fc-test-not-a-real-key' }, use: {}, firecrawl_base_url: `http://127.0.0.1:${port}` })
      await app.open()
      const tools = (await app.ask('tools/list')).result?.tools as { name: string; inputSchema: { properties: Record<string, { enum?: string[] }> } }[]
      const extract = tools.find((tool) => tool.name === 'web_extract')!
      expect(Object.keys(extract.inputSchema.properties).sort()).toEqual(['mode', 'url'])
      expect(extract.inputSchema.properties.mode.enum).toEqual(['crawl', 'map'])

      const call = (args: object) => app.ask('tools/call', { name: 'web_extract', arguments: { url: 'https://example.com', ...args } })
      for (const mode of ['text', 'extract']) {
        const refused = await call({ mode })
        expect(refused.result?.isError).toBe(true)
        expect(JSON.stringify(refused.result?.content)).toMatch(/leave mode out/)
      }
      expect(asked).toEqual([])

      const read = await call({})
      expect(read.result?.isError).toBeFalsy()
      expect(JSON.stringify(read.result?.content)).toContain('This domain is for use in examples.')
      expect(asked).toEqual(['/v2/scrape'])
    } finally {
      firecrawl.close()
    }
  }, 30_000)
})

describe('全能搜索 catalog.mjs: which service a capability uses', () => {
  const webSearch = CAPABILITIES.find((c) => c.id === 'web_search')!

  it('the person\'s pick when it has a key; otherwise the first service with a key; off is off; no key, nothing', () => {
    expect(serviceFor(webSearch, { keys: { firecrawl: 'k', tavily: 'k' }, use: { web_search: 'tavily' } })).toBe('tavily')
    expect(serviceFor(webSearch, { keys: { firecrawl: 'k' }, use: { web_search: 'tavily' } })).toBe('firecrawl')
    expect(serviceFor(webSearch, { keys: { firecrawl: 'k' }, use: {} })).toBe('firecrawl')
    expect(serviceFor(webSearch, { keys: { firecrawl: 'k' }, use: { web_search: 'off' } })).toBeNull()
    expect(serviceFor(webSearch, { keys: {}, use: {} })).toBeNull()
  })
})
