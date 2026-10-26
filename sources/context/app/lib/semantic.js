import { normalize } from './markdown.js'

export function tokens(text) {
  const s = text.toLowerCase(), out = s.match(/[a-z][a-z0-9_.-]{2,}/g) || []
  for (const run of s.match(/[一-鿿]+/g) || []) for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2))
  return out
}
const stop = new Set('the and for with not that this from are was but its into via when have has use then than only owner lane md how apply why'.split(' '))
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
  const posting = new Map(), result = [], n = docs.length
  // Query a rare-first half-prefix against complete earlier sets. A Jaccard > .5 pair must share this prefix.
  // The prefix match count also bounds the entire intersection, avoiding all-pairs body comparisons.
  for (let a = 0; a < n; a++) {
    const set = shingles[a], prefixLength = set.size - Math.ceil(set.size * .5) + 1
    // Frequency buckets give the rare-first subset in linear time; no global or per-document shingle sort.
    const buckets = Array(n + 1), sorted = []
    for (const gram of set) { const count = frequency.get(gram); (buckets[count] ||= []).push(gram) }
    for (const bucket of buckets) if (bucket) for (const gram of bucket) sorted.push(gram)
    const matches = new Uint32Array(n)
    for (let position = 0; position < Math.min(prefixLength, sorted.length); position++) {
      for (const b of posting.get(sorted[position]) || []) matches[b]++
    }
    for (let b = 0; b < a; b++) {
      const overlap = matches[b]
      if (!overlap || Math.min(set.size, shingles[b].size) / Math.max(set.size, shingles[b].size) <= .5) continue
      const need = (set.size + shingles[b].size) / 3
      let intersection = overlap, remaining = set.size - prefixLength
      if (intersection + remaining <= need) continue
      for (let i = prefixLength; i < sorted.length; i++) { if (shingles[b].has(sorted[i])) intersection++; if (intersection + --remaining <= need) break }
      const jaccard = intersection / (set.size + shingles[b].size - intersection)
      if (jaccard > .5) result.push({ a: docs[b].path, b: docs[a].path, jaccard, identical: normalize(docs[a].body) === normalize(docs[b].body) })
    }
    for (const gram of sorted) { if (!posting.has(gram)) posting.set(gram, []); posting.get(gram).push(a) }
  }
  return result
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
  const groups = new Map()
  for (let i = 0; i < docs.length; i++) {
    if (docs[i].fields.type !== 'feedback') continue
    const descriptionTokens = new Set(tokens(docs[i].fields.description || ''))
    const terms = [...vectors[i]].filter(([term]) => descriptionTokens.has(term)).toSorted((a, b) => b[1] - a[1]).slice(0, 6).map(([term]) => term).sort()
    for (let a = 0; a < terms.length; a++) for (let b = a + 1; b < terms.length; b++) {
      const key = `${terms[a]} + ${terms[b]}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(docs[i].path)
    }
  }
  return { pairs: pairs.toSorted((a, b) => b.cosine - a.cosine), duplicates: literalDuplicates(docs), scattered: [...groups].filter(([, members]) => members.length >= 3).map(([keywords, members]) => ({ keywords, members })) }
}
