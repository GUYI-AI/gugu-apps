// The page's puzzle list (app/bank/index.json) is app/program/puzzles.json without what only the host may know:
// the bottom and the key points (their count stays). Written from it, never by hand:
//   node scripts/bank.mjs           rewrite the index
//   node scripts/bank.mjs --check   fail when the index is not what the bank makes (npm test)
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const at = (p) => fileURLToPath(new URL(`../app/${p}`, import.meta.url))
const bank = JSON.parse(readFileSync(at('program/puzzles.json'), 'utf8'))

const REQUIRED = ['id', 'title', 'surface', 'bottom', 'keyPoints', 'difficulty', 'source']
const ids = new Set()
for (const p of bank.puzzles) {
  for (const k of REQUIRED) if (p[k] === undefined) throw new Error(`puzzle ${p.id ?? '?'} has no ${k}`)
  if (ids.has(p.id)) throw new Error(`puzzle id ${p.id} twice`)
  ids.add(p.id)
  if (!/^[a-z0-9-]+$/.test(p.id)) throw new Error(`puzzle id ${p.id}: lowercase, digits, dashes`)
  if (!Array.isArray(p.keyPoints) || p.keyPoints.length < 1 || p.keyPoints.length > 8) throw new Error(`puzzle ${p.id}: 1-8 key points`)
  // A puzzle without a licence that lets us ship it is not in the bank (方案: 没有授权的题不收).
  if (!p.source?.license || !p.source?.name) throw new Error(`puzzle ${p.id}: source.name and source.license are required`)
}

const index = {
  version: 1,
  puzzles: bank.puzzles.map(({ bottom, keyPoints, ...rest }) => ({ ...rest, keyCount: keyPoints.length })),
}
const text = `${JSON.stringify(index, null, 2)}\n`
if (process.argv.includes('--check')) {
  if (readFileSync(at('bank/index.json'), 'utf8') !== text) {
    console.error('app/bank/index.json is not what app/program/puzzles.json makes: run node scripts/bank.mjs')
    process.exit(1)
  }
  console.log(`bank: ${index.puzzles.length} puzzles, index up to date`)
} else {
  writeFileSync(at('bank/index.json'), text)
  console.log(`bank: wrote ${index.puzzles.length} puzzles`)
}
