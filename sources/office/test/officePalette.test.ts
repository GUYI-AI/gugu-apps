// 咕咕办公的界面(表头、选中条、标记、按钮)跟咕咕的调色板走:颜色只来自 --em-*,不写死。单元格和幻灯片是文件内容,
// 白纸黑字照文件画,不在此列。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(__dirname, '../app/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const rules = new Map([...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => [selector.trim(), body]))
const LITERAL = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i

describe('咕咕办公: the page around a file takes gugu\'s palette', () => {
  it.each(['.pick-bar', '.pick-clear:hover', '.xh', '.xh.picked', '.xlsx-found', '.xlsx-mark', '.xlsx-badge', '.xlsx-handle'])(
    '%s has no colour of its own',
    (selector) => {
      expect(rules.get(selector), selector).toBeDefined()
      expect(rules.get(selector)).not.toMatch(LITERAL)
    },
  )

  it('buttons are the runtime\'s own: no .btn of its own', () => {
    expect([...rules.keys()].filter((selector) => /\.btn\b/.test(selector))).toEqual([])
  })
})
