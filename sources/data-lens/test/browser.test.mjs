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
  // GUGU_UI_CSS: the host's own stylesheet (a gugu checkout's app-runtime/ui/ui.css), for layout as the host lays it out.
  if (process.env.GUGU_UI_CSS) await tab.addStyleTag({ path: process.env.GUGU_UI_CSS })
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

test('bars keep the query\'s order and axis numbers stay short enough for a 420 px card', async () => {
  const data = { file: 'shop', sql: 'SELECT region, sum(amount) * 1000 AS total FROM orders GROUP BY 1 ORDER BY 2 ASC', view: { kind: 'bar', x: 'region', y: 'total' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm6', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('.stage svg g[aria-label="bar"] rect')
  const ticks = await tab.evaluate(() => ({
    x: [...document.querySelectorAll('.stage svg g[aria-label="x-axis tick label"] text')].map((t) => t.textContent),
    y: [...document.querySelectorAll('.stage svg g[aria-label="y-axis tick label"] text')].map((t) => t.textContent),
  }))
  const sums = await tab.evaluate(() => [...document.querySelectorAll('.stage svg g[aria-label="bar"] rect')].map((r) => Number(r.getAttribute('height'))))
  assert.deepEqual(sums, [...sums].sort((a, b) => a - b), 'bars ascend, as the query orders them')
  assert.equal(ticks.x.length, 3)
  assert.ok(ticks.y.every((t) => t.length <= 5), `short y ticks: ${ticks.y.join(' ')}`)
  await tab.close()
})

test('a heatmap fits the card: every cell and both axes inside the drawing, readable text on dark cells', async () => {
  const data = { file: 'shop', sql: "SELECT region, substr(day, 1, 7) AS month, sum(amount) AS total FROM orders GROUP BY 1, 2", view: { kind: 'heatmap', x: 'month', y: 'region', value: 'total' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm7', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('.stage svg g[aria-label="cell"] rect')
  const fit = await tab.evaluate(() => {
    const stage = document.querySelector('.stage').getBoundingClientRect()
    const inside = (e) => { const r = e.getBoundingClientRect(); return r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1 }
    return {
      cells: document.querySelectorAll('.stage svg g[aria-label="cell"] rect').length,
      cellsInside: [...document.querySelectorAll('.stage svg g[aria-label="cell"] rect')].every(inside),
      ticksInside: [...document.querySelectorAll('.stage svg [aria-label$="tick label"] text')].every(inside),
      whiteText: document.querySelectorAll('.stage svg g[aria-label="text"][fill="white"] text').length,
    }
  })
  assert.equal(fit.cells, 9)
  assert.ok(fit.cellsInside && fit.ticksInside, JSON.stringify(fit))
  assert.ok(fit.whiteText > 0)
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
  assert.equal(await tab.locator('th[aria-sort="ascending"] gugu-icon').getAttribute('name'), 'arrow-up')
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
  assert.deepEqual(s.dispatched[0].options.to, { chat: 'chat:1' })
  assert.equal(s.dispatched[0].options.draft, true)
  assert.equal(s.dispatched[0].options.refs[0].file.id, 'csv', 'the draft carries the file as a ref, not only its name')
  await tab.close()
})

test('a newer version saved to the chat is said on the card as it happens, and the card keeps its pinned version', async () => {
  const data = { file: 'gugu-file://shop?v=1', sql: 'SELECT count(*) AS n FROM orders', view: { kind: 'kpi' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm8', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('.kpi strong')
  assert.doesNotMatch(await tab.locator('.actions').innerText(), /v2/)
  await tab.evaluate(() => window.__change({ kind: 'entries', entries: [{ id: 'other', version: 9 }, { id: 'shop', name: 'shop.sqlite', version: 2 }], gone: [] }))
  assert.match(await tab.locator('.actions').innerText(), /v2/)
  assert.equal(await tab.locator('.kpi strong').innerText(), '300')
  assert.deepEqual((await seen(tab)).readVersion, [])
  await tab.close()
})

test('the explore page: tables listed, a query run, a view switched, a card drafted for an agent', async () => {
  const { tab, errors } = await open('explore.html', { file: { chat: 'chat:1', id: 'shop' }, files: { shop: { name: 'shop.sqlite', version: 2 } } }, { width: 520, height: 900 })
  await tab.waitForSelector('table tbody tr')
  assert.match(await tab.locator('details summary').innerText(), /\(2\)/)
  await tab.locator('textarea').fill('SELECT region, sum(amount) AS total FROM orders GROUP BY 1')
  await tab.getByRole('button', { name: /Run|运行/ }).click()
  await tab.getByLabel('Kind').selectOption('bar')
  await tab.waitForSelector('.stage svg g[aria-label="bar"] rect')
  await tab.getByRole('button', { name: /card|卡片/ }).click()
  const s = await seen(tab)
  assert.equal(s.dispatched.length, 1)
  assert.match(s.dispatched[0].text, /"file":"gugu-file:\/\/shop\?v=2"/)
  assert.match(s.dispatched[0].text, /"view":\{"kind":"bar","x":"region","y":"total"\}/)
  assert.deepEqual(errors, [])
  await tab.close()
})

test('explore charts stay bounded while the host stack and resize observer lay them out', async () => {
  const { tab, errors } = await open('explore.html', { file: { chat: 'chat:1', id: 'csv' }, files: { csv: { name: '销售.csv', version: 1, text: true } } }, { width: 1280, height: 900 })
  try {
    // The host supplies .stack (app-runtime/ui/ui.css); the stand-in has no host layout by default.
    await tab.addStyleTag({ content: ':where(.stack) { display: flex; flex-direction: column; }' })
    await tab.waitForSelector('table tbody tr')
    await tab.locator('textarea').fill('SELECT 区域 AS category, 季度 AS series, 金额 AS total FROM t WHERE 金额 IS NOT NULL')
    await tab.getByRole('button', { name: /Run|运行/ }).click()
    await tab.getByLabel('y', { exact: true }).selectOption('total')
    await tab.getByLabel('color', { exact: true }).selectOption('series')
    await tab.getByLabel('Kind').selectOption('bar')
    await tab.waitForSelector('.stage svg g[aria-label="bar"] rect')
    for (const width of [1280, 480]) {
      await tab.setViewportSize({ width, height: 900 })
      await tab.evaluate(() => document.fonts.ready)
      const frames = await tab.evaluate(async () => {
        const samples = []
        for (let frame = 0; frame < 12; frame++) {
          await new Promise(requestAnimationFrame)
          const stage = document.querySelector('.explore-stage').getBoundingClientRect()
          const plot = document.querySelector('.explore-stage svg').getBoundingClientRect()
          samples.push({ stage: stage.height, plot: plot.height, viewport: innerHeight })
        }
        return samples
      })
      assert.ok(frames.every((sample) => sample.stage <= sample.viewport && sample.plot <= sample.stage + 1), `chart fits its viewport and stage at ${width}px: ${JSON.stringify(frames)}`)
      assert.ok(frames.every((sample) => Math.abs(sample.stage - frames[0].stage) <= 1), `repainting does not grow the stage at ${width}px: ${JSON.stringify(frames)}`)
    }
    assert.deepEqual(errors, [])
  } finally {
    await tab.close()
  }
})

test('charts draw in gugu\'s inks, read from its tokens: muted bars, border grid, a heatmap ramp from background-3 to foreground', async () => {
  const tokens = '--em-foreground: rgb(10, 10, 10); --em-foreground-muted: rgb(100, 100, 100); --em-foreground-passive: rgb(160, 160, 160); --em-border: rgb(220, 220, 220); --em-background: rgb(255, 255, 255); --em-background-3: rgb(240, 240, 240)'
  for (const [view, check] of [
    [{ kind: 'bar', x: 'region', y: 'total' }, async (tab) => {
      assert.deepEqual(await tab.evaluate(() => [...new Set([...document.querySelectorAll('.stage g[aria-label="bar"]')].map((g) => g.getAttribute('fill')))]), ['rgb(100, 100, 100)'])
      assert.equal(await tab.evaluate(() => document.querySelector('.stage g[aria-label="y-grid"]').getAttribute('stroke')), 'rgb(220, 220, 220)')
      // The tip sits on gugu's surface, not Plot's white: a dark theme's background-1 here.
      await tab.addStyleTag({ content: ':root { --em-background-1: rgb(30, 30, 30) }' })
      const bar = await tab.locator('.stage g[aria-label="bar"] rect').first().boundingBox()
      await tab.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2)
      await tab.waitForSelector('.stage g[aria-label="tip"] path')
      assert.equal(await tab.evaluate(() => getComputedStyle(document.querySelector('.stage g[aria-label="tip"] path')).fill), 'rgb(30, 30, 30)')
      assert.equal(await tab.evaluate(() => getComputedStyle(document.querySelector('.stage g[aria-label="tip"] text')).fill), 'rgb(10, 10, 10)')
    }],
    [{ kind: 'heatmap', x: 'month', y: 'region', value: 'total' }, async (tab) => {
      const fills = await tab.evaluate(() => [...document.querySelectorAll('.stage g[aria-label="cell"] rect')].map((r) => r.getAttribute('fill')))
      assert.ok(fills.includes('rgb(10, 10, 10)'), `the largest cell is the foreground: ${fills.join(' ')}`)
      assert.ok(!fills.includes('rgb(240, 240, 240)'), 'the smallest cell stands off the background-3 behind it')
      // Every cell's text is the better-contrasted of background and foreground on that cell.
      const worse = await tab.evaluate(() => {
        const rgb = (c) => c.match(/\d+/g).slice(0, 3).map(Number)
        const lum = (x) => x.map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
        const ratio = (a, b) => { const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m); return (p + 0.05) / (q + 0.05) }
        const cells = [...document.querySelectorAll('.stage g[aria-label="cell"] rect')].map((r) => ({ box: r.getBoundingClientRect(), fill: rgb(r.getAttribute('fill')) }))
        return [...document.querySelectorAll('.stage g[aria-label="text"]')].flatMap((g) => [...g.querySelectorAll('text')].map((t) => {
          const b = t.getBoundingClientRect(), cx = b.x + b.width / 2, cy = b.y + b.height / 2
          const cell = cells.find(({ box }) => cx > box.left && cx < box.right && cy > box.top && cy < box.bottom)
          const mine = rgb(g.getAttribute('fill')), other = mine[0] === 10 ? [255, 255, 255] : [10, 10, 10]
          return ratio(cell.fill, mine) >= ratio(cell.fill, other) ? null : t.textContent
        })).filter(Boolean)
      })
      assert.deepEqual(worse, [])
      assert.deepEqual(await tab.evaluate(() => [...document.querySelectorAll('.stage g[aria-label="text"]')].map((g) => g.getAttribute('fill')).sort()), ['rgb(10, 10, 10)', 'rgb(255, 255, 255)'])
    }],
  ]) {
    const sql = view.kind === 'bar' ? 'SELECT region, sum(amount) AS total FROM orders GROUP BY 1' : 'SELECT region, substr(day, 1, 7) AS month, sum(amount) AS total FROM orders GROUP BY 1, 2'
    const { tab } = await open('card.html', { widget: { messageId: 'm9', data: { file: 'shop', sql, view }, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
    await tab.addStyleTag({ content: `:root { ${tokens} }` })
    await tab.waitForSelector('.stage svg g[aria-label="cell"] rect, .stage svg g[aria-label="bar"] rect')
    // Drawn before the tokens arrived on this stand-in page: the next paint reads them, as a theme change would.
    await tab.setViewportSize({ width: 421, height: 360 })
    await tab.waitForFunction(() => !document.querySelector('.stage svg [fill="currentColor"]'))
    await check(tab)
    await tab.close()
  }
})

test('more series than three inks: the card says so instead of drawing them alike', async () => {
  const data = { file: 'shop', sql: "SELECT substr(day, 1, 7) AS month, region || n AS series, sum(amount) AS total FROM orders, (SELECT 1 AS n UNION SELECT 2) GROUP BY 1, 2", view: { kind: 'line', x: 'month', y: 'total', color: 'series' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm10', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('.stage gugu-empty')
  assert.match(await tab.locator('.stage').innerText(), /More than 3 series/)
  await tab.close()
})

test('on a phone-wide card the buttons are icons, still named', async () => {
  const data = { file: 'shop', sql: 'SELECT count(*) AS n FROM orders', view: { kind: 'kpi' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm11', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } }, { width: 268, height: 360 })
  await tab.waitForSelector('.kpi strong')
  assert.ok((await tab.locator('.actions .label').first().boundingBox()).width <= 1, 'the words are hidden from sight')
  assert.equal(await tab.getByRole('button', { name: 'Open' }).count(), 1)
  assert.equal(await tab.getByRole('button', { name: 'Ask an agent' }).count(), 1)
  await tab.close()
})

test('a table groups the digits of amounts, not of ids or order numbers', async () => {
  const data = { file: 'shop', sql: 'SELECT id + 59000 AS 订单号, id + 59000 AS order_id, amount * 1000 AS total FROM orders LIMIT 1', view: { kind: 'table' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm12', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('table tbody tr')
  const cells = await tab.locator('tbody tr').first().locator('td').allInnerTexts()
  assert.deepEqual(cells.slice(0, 2), ['59001', '59001'])
  assert.match(cells[2], /,/)
  // The host draws a gugu-icon 16 px wide (ui.css); this stand-in page has no such style of its own.
  await tab.addStyleTag({ content: 'gugu-icon { display: inline-block; width: 16px; height: 16px; }' })
  const edges = await tab.evaluate(() => [...document.querySelectorAll('thead th')].map((th, i) => {
    const words = document.createRange()
    words.selectNodeContents(th.querySelector('button').firstChild)
    return Math.abs(words.getBoundingClientRect().right - document.querySelectorAll('tbody tr:first-child td')[i].getBoundingClientRect().right)
  }))
  assert.ok(edges.every((d) => d <= 12), `number headings end where their numbers end (cell padding apart): ${edges}`)
  await tab.close()
})

test('up to three series: told apart by ink and dash, and named in a legend', async () => {
  const data = { file: 'shop', sql: "SELECT substr(day, 1, 7) AS month, region, sum(amount) AS total FROM orders GROUP BY 1, 2", view: { kind: 'line', x: 'month', y: 'total', color: 'region' } }
  const { tab } = await open('card.html', { widget: { messageId: 'm13', data, sender: 'user:a' }, files: { shop: { name: 'shop.sqlite', version: 1 } } })
  await tab.waitForSelector('.stage svg g[aria-label="line"]')
  // Each legend entry draws its series' own line: the same ink and the same dash as the line in the chart.
  const pairs = await tab.evaluate(() => {
    const lines = [...document.querySelectorAll('.stage svg g[aria-label="line"]')].map((g) => {
      const path = g.querySelector('path')
      return `${path.getAttribute('stroke') ?? g.getAttribute('stroke')}|${g.getAttribute('stroke-dasharray') ?? ''}`
    })
    const legend = [...document.querySelectorAll('.stage .legend span')].map((s) => {
      const line = s.querySelector('svg line')
      return { name: s.textContent.trim(), look: `${line.getAttribute('stroke')}|${line.getAttribute('stroke-dasharray') ?? ''}` }
    })
    return { lines, legend }
  })
  assert.equal(pairs.legend.length, 3, JSON.stringify(pairs))
  assert.deepEqual(pairs.legend.map((l) => l.look), pairs.lines, 'legend lines look like the chart lines')
  assert.equal(new Set(pairs.legend.map((l) => l.look)).size, 3, 'three different looks')
  const inside = await tab.evaluate(() => {
    const stage = document.querySelector('.stage').getBoundingClientRect()
    const legend = document.querySelector('.stage .legend').getBoundingClientRect()
    const plot = document.querySelector('.stage svg').getBoundingClientRect()
    return legend.height > 0 && legend.top >= stage.top - 1 && plot.bottom <= stage.bottom + 1
  })
  assert.ok(inside, 'legend and chart both fit the card')
  assert.equal(await tab.locator('.stage svg g[aria-label="line"]').count(), 3)
  await tab.close()
})
