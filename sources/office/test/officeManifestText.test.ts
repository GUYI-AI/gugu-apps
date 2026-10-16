// 咕咕办公 manifest 里的两种话:description 写给 agent —— 它的第一句就是 agent 在 <gugu_apps> 里读到的那一行,长度由索引仓的
// verify 管(scripts/lib.mjs `guguAppsLine`,超过就截成半句);localized 写给人(App 列表、产品页、首启装上后 App 页那一行),
// 中英两份都要在,而且不是写给 agent 的那句(不点工具名)。以前这一条在咕咕仓里管着预装的那份,办公搬来以后在这里管。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(join(__dirname, '../app/manifest.json'), 'utf8')) as {
  id: string
  description: string
  localized?: Record<string, { name?: string; description?: string }>
}

describe('咕咕办公: what people read, and what agents read', () => {
  it('a person reads its localized description, zh and en — not the agent\'s sentence', () => {
    for (const locale of ['zh', 'en']) {
      const text = manifest.localized?.[locale]
      expect(text?.name, locale).toBeTruthy()
      expect(text?.description, locale).toBeTruthy()
      expect(text!.description, locale).not.toContain(`${manifest.id}__`)
      expect(text!.description, locale).not.toBe(manifest.description)
    }
  })

  it('the agent\'s line names its skill, not a tool — in its first sentence, the one <gugu_apps> carries', () => {
    // The same cut as the host's (and scripts/lib.mjs `firstSentence`): a `.` before whitespace or the end, or `。`.
    const first = /^[\s\S]*?(?:\.(?=\s|$)|。)/.exec(manifest.description)?.[0] ?? manifest.description
    expect(first).toContain('skill office')
    expect(first).not.toContain(`${manifest.id}__`)
  })
})
