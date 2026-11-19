import { normalize } from './markdown.js'

export function tokens(text) {
  const s = text.toLowerCase(), out = s.match(/[a-z][a-z0-9_.-]{2,}/g) || []
  for (const run of s.match(/[一-鿿]+/g) || []) for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2))
  return out
}
const stop = new Set('the and for with not that this from are was but its into via when have has use then than only owner lane md how apply why a about above after again against all also am an any as at be because been before being below between both by can could did do does doing down during each either else few further had he her here hers herself him himself his i if in is it itself just me more most much my myself nor of off on once or other our ours ourselves out over own same she should so some such their theirs them themselves there these they those through too under until up very we were what where which while who whom will would you your yours yourself yourselves'.split(' '))
const count = (values) => { const m = new Map(); for (const v of values) m.set(v, (m.get(v) || 0) + 1); return m }
const grams = (s, n) => { const t = s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''), out = new Set(); for (let i = 0; i <= t.length - n; i++) out.add(t.slice(i, i + n)); return out }

function inverted(vectors) {
  const index = new Map()
  vectors.forEach((vector, i) => { for (const [term, value] of vector) { if (!index.has(term)) index.set(term, []); index.get(term).push([i, value]) } })
  return index
}

function literalDuplicates(docs) {
  const shingles = docs.map((f) => grams(f.body, 5)), frequency = new Map()
  for (const set of shingles) for (const gram of set) frequency.set(gram, (frequency.get(gram) || 0) + 1)
  // One global rare-first order is required for exact prefix-prefix filtering.
  const buckets = Array(docs.length + 1), ranks = new Map()
  for (const [gram, count] of frequency) (buckets[count] ||= []).push(gram)
  for (const bucket of buckets) if (bucket) for (const gram of bucket) ranks.set(gram, ranks.size)
  const sets = shingles.map((set) => Uint32Array.from(set, (gram) => ranks.get(gram)).sort())
  const posting = new Map(), result = []
  for (const a of sets.map((_, i) => i).sort((a, b) => sets[a].length - sets[b].length || a - b)) {
    const x = sets[a], prefix = x.length - Math.ceil(x.length * .5) + 1, candidates = new Set()
    for (let i = 0; i < Math.min(prefix, x.length); i++) for (const b of posting.get(x[i]) || []) if (sets[b].length > x.length * .5) candidates.add(b)
    for (const b of candidates) {
      const y = sets[b], need = (x.length + y.length) / 3
      let i = 0, j = 0, intersection = 0
      while (i < x.length && j < y.length) {
        if (intersection + Math.min(x.length - i, y.length - j) <= need) break
        if (x[i] === y[j]) { intersection++; i++; j++ }
        else if (x[i] < y[j]) i++
        else j++
      }
      const jaccard = intersection / (x.length + y.length - intersection)
      if (jaccard > .5) {
        const first = Math.min(a, b), second = Math.max(a, b)
        result.push({ a: docs[first].path, b: docs[second].path, jaccard, identical: normalize(docs[a].body) === normalize(docs[b].body) })
      }
    }
    for (let i = 0; i < Math.min(prefix, x.length); i++) { if (!posting.has(x[i])) posting.set(x[i], []); posting.get(x[i]).push(a) }
  }
  return result
}

function scatteredRules(files, docs) {
  const entries = files.find((f) => f.file === 'MEMORY.md')?.entries || []
  const indexed = docs.filter((f) => f.fields.type === 'feedback' && entries.some((e) => e.target === f.file))
  // Topic candidates use only the index the agent sees, never a hand-maintained topic vocabulary.
  // Split hyphenated identifiers so filenames do not become opaque, unique "keywords".
  const terms = indexed.map((f) => new Set(tokens(entries.filter((e) => e.target === f.file).map((e) => e.text.replace(/\]\([^)]*\)/g, ']').replace(/-/g, ' ')).join(' ')).filter((t) => !stop.has(t))))
  const df = count(terms.flatMap((set) => [...set])), maximum = Math.max(3, Math.min(8, Math.floor(indexed.length * .1)))
  const groups = new Map()
  // Anchor each candidate to a rare shared term; never transitively union topics.
  // The frequency ceiling also bounds a cluster to at most eight index entries.
  for (const [term, posting] of inverted(terms.map((set) => new Map([...set].map((term) => [term, 1]))))) {
    if (stop.has(term) || df.get(term) < 3 || df.get(term) > maximum) continue
    const members = posting.map(([i]) => indexed[i].path).sort(), key = members.join('\0')
    if (!groups.has(key)) groups.set(key, { keywords: [], members })
    groups.get(key).keywords.push(term)
  }
  // A lone natural-language word ("build", "check") is not a topic. Require a
  // co-occurring rare-term set; a precise code identifier can anchor a group alone.
  return [...groups.values()].filter((group) => group.keywords.length >= 2 || group.keywords.some((term) => /[_./]/.test(term))).map((group) => ({ ...group, keywords: group.keywords.sort().join(' · ') }))
}

export function candidates(files) {
  const docs = files.filter((f) => f.file.endsWith('.md') && f.file !== 'MEMORY.md' && !f.file.endsWith('-hub.md'))
  const tf = docs.map((f) => count(tokens((f.fields.description || '').repeat(3) + ' ' + f.body.slice(0, 6000)).filter((t) => !stop.has(t))))
  const df = count(tf.flatMap((m) => [...m.keys()]))
  const vectors = tf.map((m) => {
    const entries = [...m].filter(([term]) => df.get(term) > 1 && df.get(term) < docs.length * .3).map(([term, n]) => [term, (1 + Math.log(n)) * Math.log(docs.length / df.get(term))]).toSorted((a, b) => b[1] - a[1]).slice(0, 80)
    const norm = Math.sqrt(entries.reduce((s, [, n]) => s + n * n, 0)) || 1
    return new Map(entries.map(([term, n]) => [term, n / norm]))
  })
  const ids = docs.map((f) => new Set(((f.fields.description || '') + ' ' + f.body.slice(0, 4000)).match(/(?:[\w-]+)?#\d{2,5}\b|\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{8,12}\b|\b\d{2}-\d{2} \d{2}:\d{2}\b/g) || []))
  const idDf = count(ids.flatMap((set) => [...set]))
  const scores = new Map(), sharedIds = new Map(), n = docs.length
  for (const posting of inverted(vectors).values()) for (let i = 0; i < posting.length; i++) for (let j = i + 1; j < posting.length; j++) {
    const [a, x] = posting[i], [b, y] = posting[j], key = a * n + b
    scores.set(key, (scores.get(key) || 0) + x * y)
  }
  const idVectors = ids.map((set) => new Map([...set].filter((id) => idDf.get(id) <= 3).map((id) => [id, 1])))
  for (const [id, posting] of inverted(idVectors)) for (let i = 0; i < posting.length; i++) for (let j = i + 1; j < posting.length; j++) {
    const key = posting[i][0] * n + posting[j][0]
    if (!sharedIds.has(key)) sharedIds.set(key, [])
    sharedIds.get(key).push(id)
  }
  const pairs = []
  for (const key of new Set([...scores.keys(), ...sharedIds.keys()])) {
    const cos = scores.get(key) || 0, shared = sharedIds.get(key) || []
    if (cos > .3 || shared.length >= 2) pairs.push({ a: docs[Math.floor(key / n)].path, b: docs[key % n].path, cosine: Math.round(cos * 1000) / 1000, shared })
  }
  return { pairs: pairs.toSorted((a, b) => b.cosine - a.cosine), duplicates: literalDuplicates(docs), scattered: scatteredRules(files, docs) }
}
