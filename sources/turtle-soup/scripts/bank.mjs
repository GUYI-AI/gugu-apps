// 海龟汤's puzzle bank: bank-src/*.json (one file per collection, each puzzle with its own source and licence) makes
// app/bank/puzzles.json (everything, read only by the host's program) and app/bank/index.json (what the page lists:
// publicOf, no solution, facts or hints).
//   node scripts/bank.mjs                                  rewrite app/bank/ from bank-src/
//   node scripts/bank.mjs --check                          fail when app/bank/ is not what bank-src/ makes (npm test)
//   node scripts/bank.mjs import <soupbase> <coop>         convert the pinned upstream checkouts into bank-src/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publicOf, MAX_HINTS } from '../app/game.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const json = (p) => JSON.parse(readFileSync(p, 'utf8'))
const write = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`)

// The upstream commits the bank was taken from: an import from any other commit is refused.
const SOUPBASE = { repo: 'spoonnotfound/soupbase', commit: 'b36c2da267023e6c580b1238edb787f3d4c99fb6' }
const COOP = { repo: 'AZHi-xinxin/haiguitang-coop', commit: '72dc96b107d63bfcebedc503e3d57bbd416b8ffd' }
// Soupbase's own stories, dedicated CC0 (its content/LICENSE.md); every other one names its licence in source.license.
const SOUPBASE_CC0 = ['doorbell', 'lit-room', 'blank-last-page']
const LICENSES = ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0']
const DIFFICULTIES = ['easy', 'medium', 'hard']

function checkPuzzle(p) {
  const where = `puzzle ${p.id ?? '?'}`
  for (const k of ['id', 'lang', 'title', 'surface', 'solution', 'facts', 'hints', 'difficulty', 'source']) if (p[k] === undefined || p[k] === null) throw new Error(`${where}: no ${k}`)
  if (!/^[a-z0-9-]+$/.test(p.id)) throw new Error(`${where}: id is lowercase, digits, dashes`)
  if (!['zh', 'en'].includes(p.lang)) throw new Error(`${where}: lang zh or en`)
  if (!DIFFICULTIES.includes(p.difficulty)) throw new Error(`${where}: difficulty ${DIFFICULTIES.join(' / ')}`)
  if (!p.facts.some((f) => f.required) || p.facts.length > 8) throw new Error(`${where}: 1-8 facts, at least one required`)
  if (p.hints.length > MAX_HINTS) throw new Error(`${where}: at most ${MAX_HINTS} hints`)
  // A puzzle without a licence that lets it ship is not in the bank (方案: 没有授权的题不收).
  if (!LICENSES.includes(p.source?.license)) throw new Error(`${where}: source.license must be one of ${LICENSES.join(', ')}`)
  if (p.source.license !== 'CC0-1.0' && !(p.source.author && p.source.url)) throw new Error(`${where}: an attributed licence needs source.author and source.url`)
}

function build() {
  const collections = readdirSync(join(root, 'bank-src')).filter((f) => f.endsWith('.json')).sort().map((f) => json(join(root, 'bank-src', f)))
  const puzzles = collections.flatMap((c) => c.puzzles)
  const ids = new Set()
  for (const p of puzzles) {
    checkPuzzle(p)
    if (ids.has(p.id)) throw new Error(`puzzle id ${p.id} twice`)
    ids.add(p.id)
  }
  const full = { version: 1, puzzles }
  const index = { version: 1, puzzles: puzzles.map(publicOf) }
  return { full, index }
}

function importUpstream(soupbaseDir, coopDir) {
  const head = (dir) => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (head(soupbaseDir) !== SOUPBASE.commit) throw new Error(`${soupbaseDir} is not ${SOUPBASE.repo}@${SOUPBASE.commit}`)
  if (head(coopDir) !== COOP.commit) throw new Error(`${coopDir} is not ${COOP.repo}@${COOP.commit}`)
  const fileUrl = (repo, commit, path) => `https://github.com/${repo}/blob/${commit}/${path}`

  const soupbase = []
  for (const lang of ['zh', 'en']) {
    const dir = join(soupbaseDir, 'content', 'puzzles', lang)
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      const d = json(join(dir, name))
      const slug = name.slice(0, -5)
      const cc0 = SOUPBASE_CC0.includes(slug)
      const at = fileUrl(SOUPBASE.repo, SOUPBASE.commit, `content/puzzles/${lang}/${name}`)
      soupbase.push({
        id: `soupbase-${slug}-${lang}`,
        lang,
        title: d.title,
        surface: d.surface,
        solution: d.solution,
        facts: d.facts.map((f) => ({ text: f.text, required: f.required === true })),
        unknowns: d.unknowns ?? [],
        character_claims: d.character_claims ?? [],
        hints: d.hints ?? [],
        difficulty: d.difficulty,
        tags: d.tags ?? [],
        source: {
          kind: d.source.kind,
          author: cc0 ? 'Soupbase' : d.source.author,
          url: cc0 ? at : d.source.url,
          license: cc0 ? 'CC0-1.0' : d.source.license,
          note: d.source.note,
          collection: 'Soupbase',
          collection_url: at,
          adaptation: '咕咕：字段改为咕咕题库格式（facts 去掉 id），文字未改。',
        },
      })
    }
  }
  write(join(root, 'bank-src', 'soupbase.json'), { from: `${SOUPBASE.repo}@${SOUPBASE.commit}`, puzzles: soupbase })

  const DIFF = { 简单: 'easy', 中等: 'medium', 困难: 'hard' }
  const coop = json(join(coopDir, 'samples', 'sample_soups.json')).map((d) => ({
    id: `coop-${d.id.replace(/_/g, '-')}`,
    lang: 'zh',
    title: d.title,
    surface: d.soup_face,
    solution: d.soup_bottom,
    // coop's key_elements are what its judge needs to call a guess right: our required facts.
    facts: d.key_elements.map((text) => ({ text, required: true })),
    unknowns: [],
    character_claims: [],
    hints: d.hints ?? [],
    difficulty: DIFF[d.difficulty] ?? (() => { throw new Error(`coop ${d.id}: difficulty ${d.difficulty}`) })(),
    tags: d.tags ?? [],
    source: {
      kind: 'original',
      author: 'AZHi-xinxin（haiguitang-coop）',
      url: fileUrl(COOP.repo, COOP.commit, 'samples/sample_soups.json'),
      license: 'CC-BY-4.0',
      collection: 'haiguitang-coop',
      collection_url: fileUrl(COOP.repo, COOP.commit, 'CONTENT_LICENSE.md'),
      adaptation: '咕咕：改为咕咕题库格式（soup_face → surface，soup_bottom → solution，key_elements → 必要事实，难度改为 easy / medium / hard），文字未改。',
    },
  }))
  write(join(root, 'bank-src', 'coop.json'), { from: `${COOP.repo}@${COOP.commit}`, puzzles: coop })
  console.log(`imported: soupbase ${soupbase.length}, coop ${coop.length}`)
}

const [cmd, ...rest] = process.argv.slice(2)
if (cmd === 'import') importUpstream(...rest)
const { full, index } = build()
const out = { 'app/bank/puzzles.json': full, 'app/bank/index.json': index }
if (cmd === '--check') {
  for (const [path, value] of Object.entries(out)) {
    if (readFileSync(join(root, path), 'utf8') !== `${JSON.stringify(value, null, 2)}\n`) {
      console.error(`${path} is not what bank-src/ makes: run node scripts/bank.mjs`)
      process.exit(1)
    }
  }
  console.log(`bank: ${full.puzzles.length} puzzles, app/bank/ up to date`)
} else {
  for (const [path, value] of Object.entries(out)) write(join(root, path), value)
  console.log(`bank: wrote ${full.puzzles.length} puzzles`)
}
