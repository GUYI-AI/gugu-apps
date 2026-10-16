// @vitest-environment jsdom
// 咕咕办公 · 稿子底下留的空,手指和鼠标两种布局一样大(评审 c6957a8c8f):布局跟着上一下用的手换(app.js,body.fingers),
// 两种布局底下留的空要是不一样,稿子滚到最底时换一只手按下去,稿子就在那一下挪 16–30 px,拉框的起点也跟着偏。
// App 自己的 style.css,按 jsdom 的层叠读出来。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const css = readFileSync(resolve(__dirname, '../app/style.css'), 'utf8')

test('稿子底下留的空:手指、鼠标两种布局一样大,至少放得下停在底部的浮条(100 px)', () => {
  document.head.innerHTML = `<style>${css}</style>`
  document.body.innerHTML = '<article id="preview" class="preview"><div class="pptx-deck"></div></article>'
  const panel = document.querySelector<HTMLElement>('.preview')!
  const deck = document.querySelector<HTMLElement>('.pptx-deck')!
  // Under the last slide: the panel's own bottom padding plus the deck's.
  const room = () => parseFloat(getComputedStyle(panel).paddingBottom || '0') + parseFloat(getComputedStyle(deck).paddingBottom || '0')
  document.body.classList.remove('fingers')
  const mouse = room()
  document.body.classList.add('fingers')
  const finger = room()
  expect(mouse).toBe(finger)
  expect(mouse).toBeGreaterThanOrEqual(100)
})

test('表格也一样:底下留的空、工作表标签的高矮,两种布局一样大 —— 换手的那一下表格的高度不变', () => {
  document.head.innerHTML = `<style>${css}</style>`
  document.body.innerHTML = '<article id="preview" class="preview xlsx-host"><div class="xlsx-book"><div class="xlsx-tabs"><button class="xlsx-tab">销售</button></div></div></article>'
  const panel = document.querySelector<HTMLElement>('.preview')!
  const tab = document.querySelector<HTMLElement>('.xlsx-tab')!
  const read = () => [getComputedStyle(panel).paddingBottom, getComputedStyle(tab).paddingTop, getComputedStyle(tab).paddingBottom]
  document.body.classList.remove('fingers')
  const mouse = read()
  document.body.classList.add('fingers')
  expect(read()).toEqual(mouse)
  expect(parseFloat(mouse[0]!)).toBeGreaterThanOrEqual(100)
})
