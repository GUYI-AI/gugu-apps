// 咕咕办公 manifest 里的两种话(App 模型 v2):`subtitle` 写给人(App 列表、产品页头),中英两份;`contributes.instructions`
// 写给 agent —— 它原样就是 agent 在 <gugu_apps> 里读到的那一行,点名 skill office,不点工具名(它没有工具)。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(join(__dirname, '../app/manifest.json'), 'utf8')) as {
  id: string
  subtitle: string
  defaultLocale: string
  localized?: Record<string, { name?: string; subtitle?: string }>
  contributes: { instructions: string }
}

describe('咕咕办公: what people read, and what agents read', () => {
  it('a person reads a subtitle in zh and en — not the agent\'s line', () => {
    expect(manifest.defaultLocale).toBe('zh-CN')
    for (const subtitle of [manifest.subtitle, manifest.localized?.en?.subtitle]) {
      expect(subtitle).toBeTruthy()
      expect(subtitle).not.toContain('skill')
    }
    expect(manifest.localized?.en?.name).toBeTruthy()
  })

  it('the agent\'s line names its skill, not a tool', () => {
    expect(manifest.contributes.instructions).toContain('skill office')
    expect(manifest.contributes.instructions).not.toContain(`${manifest.id}__`)
  })
})
