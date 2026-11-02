// Renders media/icon.svg to app/icon.png (256 × 256) in Chromium: node media/render-icon.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const svg = readFileSync(new URL('./icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 256, height: 256 } })
await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`)
await page.locator('svg').screenshot({ path: new URL('../app/icon.png', import.meta.url).pathname, omitBackground: true })
await browser.close()
