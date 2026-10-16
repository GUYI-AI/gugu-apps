// 咕咕办公 App 的 vendor 许可证闸(vendor/licences.mjs):包按输入路径里**最后一个** node_modules 段认,
// 嵌套的依赖(node_modules/a/node_modules/b/…)是 b、读它自己的 package.json —— 以前的正则只认第一段,把 b 当成 a,
// 一个嵌在 MIT 包下面的 GPL 包就混过去了(评审 f45fd10e2)。
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const { packageOf, packagesOf, permissive } = (await import(/* @vite-ignore */ join(__dirname, '../vendor/licences.mjs'))) as {
  packageOf(input: string): { name: string; dir: string } | null
  permissive(license: unknown): boolean
  packagesOf(root: string, inputs: string[]): { name: string; license: string }[]
}

let root = ''
const pkg = (dir: string, name: string, license: string, withFile = true) => {
  mkdirSync(join(root, dir), { recursive: true })
  writeFileSync(join(root, dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', license }))
  if (withFile) writeFileSync(join(root, dir, 'LICENSE'), `${license} text`)
}
afterEach(() => rm())
const rm = () => root && rmSync(root, { recursive: true, force: true })

describe('office vendor licence gate', () => {
  test('a package is named by the last node_modules segment; scoped names keep their scope', () => {
    expect(packageOf('node_modules/a/index.js')).toEqual({ name: 'a', dir: 'node_modules/a' })
    expect(packageOf('node_modules/a/node_modules/b/lib/x.js')).toEqual({ name: 'b', dir: 'node_modules/a/node_modules/b' })
    expect(packageOf('node_modules/@s/a/node_modules/@t/b/x.js')).toEqual({ name: '@t/b', dir: 'node_modules/@s/a/node_modules/@t/b' })
    expect(packageOf('entry.mjs')).toBeNull()
  })

  test('a GPL package nested under an MIT one is refused, named; control: the MIT parent alone passes', () => {
    root = mkdtempSync(join(tmpdir(), 'vendor-licences-'))
    pkg('node_modules/a', 'a', 'MIT')
    pkg('node_modules/a/node_modules/b', 'b', 'GPL-3.0')
    expect(packagesOf(root, ['node_modules/a/index.js']).map((p) => p.name)).toEqual(['a'])
    expect(() => packagesOf(root, ['node_modules/a/index.js', 'node_modules/a/node_modules/b/x.js'])).toThrow(/licence not permissive: b@1\.0\.0 \(GPL-3\.0\)/)
  })

  test('a permissive package with no licence file is recorded, said so; one with no licence at all is refused', () => {
    root = mkdtempSync(join(tmpdir(), 'vendor-licences-'))
    pkg('node_modules/c', 'c', 'MIT', false)
    pkg('node_modules/d', 'd', undefined as unknown as string, false)
    expect(packagesOf(root, ['node_modules/c/x.js'])).toMatchObject([{ name: 'c', license: 'MIT', text: expect.stringMatching(/ships no licence file/) }])
    expect(() => packagesOf(root, ['node_modules/d/x.js'])).toThrow(/d@1\.0\.0 \(null\)/)
  })

  test('a choice of licences passes when one of them is permissive (IronCalc: "MIT/Apache-2.0"); an AND needs all', () => {
    for (const ok of ['MIT/Apache-2.0', 'MIT OR Apache-2.0', '(MIT OR Apache-2.0)', 'GPL-3.0 OR MIT', 'MIT AND ISC']) expect(permissive(ok)).toBe(true)
    for (const no of ['GPL-3.0', 'MPL-2.0 OR GPL-3.0', 'MIT AND GPL-3.0', 'SEE LICENSE IN LICENSE', '', null]) expect(permissive(no)).toBe(false)
  })
})
