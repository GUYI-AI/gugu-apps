import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// Computer Use is how agents operate this computer. Reached only through the catalog, its tools lost to whatever
// computer tool the agent already had in its list (Codex's own, Gugu's device actions), and the Computer tab never
// opened. Listed natively on first install, like Browser Use; the person can still switch it off per App.
test('Computer Use lists its tools natively on first install', async () => {
  const manifest = JSON.parse(await readFile(new URL('../app/manifest.json', import.meta.url), 'utf8'))
  assert.equal(manifest.contributes.toolsListed, true)
  assert.ok(manifest.contributes.mcpServers.length > 0)
})
