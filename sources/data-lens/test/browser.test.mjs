// The pages in a real Chromium under the Content-Security-Policy gugu serves every App page with — copied from the
// client (OpenDCAI/gugu apps/desktop/src/session/shared/extensions/app-csp.ts, an App that declares no network): no eval,
// no WebAssembly, scripts only from the bundle. A stand-in `gugu` (test/browser-stub.js) gives the pages a chat file.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { CSV, sqlite, workbook } from './fixtures.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../app')
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.bin': 'application/octet-stream' }

const fixtures = {}
let server
let browser
let origin

before(async () => {
  fixtures['shop.sqlite'] = await sqlite(300)
  fixtures['book.xlsx'] = workbook()
  fixtures['销售.csv'] = new TextEncoder().encode(CSV)
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    try {
      let body
      let file = url.pathname
      if (file.startsWith('/__fixture/')) body = fixtures[decodeURIComponent(file.slice('/__fixture/'.length))]
      else if (file === '/__stub.js') body = await readFile(path.join(here, 'browser-stub.js'))
      else {
        body = await readFile(path.join(app, path.normalize(file)))
        // The host puts its runtime first in every App page; here the stand-in.
        if (file.endsWith('.html')) body = String(body).replace('<script type="module"', '<script src="/__stub.js"></script>\n<script type="module"')
      }
      if (!body) throw new Error('missing')
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': CSP })
      res.end(body)
    } catch {
      res.writeHead(404, { 'Content-Security-Policy': CSP })
      res.end()
    }
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  server?.close()
})

/** Opens a page with the stand-in told what ctx and which file; returns the page and what the stand-in saw. */
async function open(page, ctx, { width = 420, height = 360 } = {}) {
  const tab = await browser.newPage({ viewport: { width, height } })
  const errors = []
  tab.on('pageerror', (e) => errors.push(e.message))
  await tab.addInitScript((setup) => { window.__setup = setup }, ctx)
  await tab.goto(`${origin}/${page}`)
  return { tab, errors }
}

const seen = (tab) => tab.evaluate(() => window.__seen)

test('the CSP is in force: eval is refused on these pages', async () => {
  const { tab } = await open('card.html', { widget: null })
  await tab.waitForFunction(() => window.__seen?.evalRefused !== undefined)
  assert.equal((await seen(tab)).evalRefused, true)
  await tab.close()
})

test('a bar card from a SQLite file: engine in its worker, chart drawn, no CSP violation', async () => {
  const data = { file: 'gugu-file://shop?v=1', sql: 'SELECT region, sum(amount) AS total FROM orders GROUP BY 1 ORDER BY 2 DESC', view: { kind: 'bar', x: 'region', y: 'total', title: 'By region' } }
  const { tab, errors } = await open('card.html', { widget: { messageId: 'm1', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('.stage svg', { timeout: 30_000 })
  assert.equal(await tab.locator('.stage svg g[aria-label="bar"] rect').count(), 3)
  assert.match(await tab.locator('header').innerText(), /By region[\s\S]*shop\.sqlite · v1 · 3/)
  const s = await seen(tab)
  assert.deepEqual(s.violations, [])
  assert.deepEqual(errors, [])
  await tab.close()
})

test('a card pinned to an older version reads that version and says the file moved on', async () => {
  const data = { file: 'gugu-file://shop?v=1', sql: 'SELECT count(*) AS n FROM orders', view: { kind: 'kpi' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm2', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 3 } } })
  await tab.waitForSelector('.kpi strong')
  assert.equal(await tab.locator('.kpi strong').innerText(), '300')
  assert.match(await tab.locator('.actions').innerText(), /v3/)
  assert.deepEqual((await seen(tab)).readVersion, [1])
  await tab.close()
})

test('a workbook card and a CSV table; untrusted text stays text', async () => {
  const data = { file: 'book', sql: 'SELECT 区域, 销售额 FROM t', view: { kind: 'table', title: '<img src=x onerror="window.__pwned=1">' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm3', data, sender: 'user:a' }, files: { book: { name: 'book.xlsx', version: 1 } } })
  await tab.waitForSelector('table tbody tr')
  assert.equal(await tab.locator('table tbody tr').count(), 3)
  assert.equal(await tab.locator('header strong').innerText(), '<img src=x onerror="window.__pwned=1">')
  assert.equal(await tab.evaluate(() => window.__pwned), undefined)
  await tab.locator('th button', { hasText: '销售额' }).click()
  assert.equal(await tab.locator('th[aria-sort="ascending"]').count(), 1)
  await tab.close()
})

test('a card whose SQL writes, or whose view names a missing column, shows why and draws nothing', async () => {
  for (const [data, reason] of [
    [{ file: 'shop', sql: 'DELETE FROM orders' }, /read-only/],
    [{ file: 'shop', sql: 'SELECT region FROM orders', view: { kind: 'bar', x: 'region', y: 'total' } }, /view\.y/],
  ]) {
    const { tab } = await open('card.html', { widget: { messageId: 'm4', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
    await tab.waitForSelector('[role="alert"]')
    assert.match(await tab.locator('[role="alert"]').innerText(), reason)
    assert.equal(await tab.locator('svg').count(), 0)
    await tab.close()
  }
})

test('the buttons: open the file, and draft a question — both only on a click', async () => {
  const data = { file: 'csv', sql: 'SELECT 区域, sum(金额) AS s FROM t GROUP BY 1', view: { kind: 'bar', x: '区域', y: 's' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm5', data, sender: 'user:a' }, files: { csv: { name: '销售.csv', version: 1, text: true } } })
  await tab.waitForSelector('.stage svg')
  assert.deepEqual((await seen(tab)).dispatched, [])
  await tab.locator('.actions button').nth(0).click()
  await tab.locator('.actions button').nth(1).click()
  const s = await seen(tab)
  assert.deepEqual(s.openedWith, [{ chat: 'chat:1', id: 'csv' }])
  assert.equal(s.dispatched.length, 1)
  assert.deepEqual(s.dispatched[0].options, { draft: true, to: { chat: 'chat:1' } })
  await tab.close()
})

test('the explore page: tables listed, a query run, a view switched, a card drafted for an agent', async () => {
  const { tab, errors } = await open('explore.html', { file: { chat: 'chat:1', id: 'shop' }, files: { shop: { name: 'shop.sqlite', version: 2 } } }, { width: 520, height: 900 })
  await tab.waitForSelector('table tbody tr')
  assert.match(await tab.locator('details summary').innerText(), /\(2\)/)
  await tab.locator('textarea').fill('SELECT region, sum(amount) AS total FROM orders GROUP BY 1')
  await tab.getByRole('button', { name: /Run|运行/ }).click()
  await tab.locator('select[aria-label="View"]').selectOption('bar')
  await tab.waitForSelector('.stage svg g[aria-label="bar"] rect')
  await tab.getByRole('button', { name: /card|卡片/ }).click()
  const s = await seen(tab)
  assert.equal(s.dispatched.length, 1)
  assert.match(s.dispatched[0].text, /"file":"gugu-file:\/\/shop\?v=2"/)
  assert.match(s.dispatched[0].text, /"view":\{"kind":"bar","x":"region","y":"total"\}/)
  assert.deepEqual(errors, [])
  await tab.close()
})
