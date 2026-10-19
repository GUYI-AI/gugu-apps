// Who a paper is and where its PDF is, from an arXiv id or a DOI — shared by the page (a phone imports with it) and the
// program (tools.js, on node). Every source is tried in order and the first answer kept; `fetch` is the caller's.
//
// arXiv: arXiv's own API first (its record is the truth for a preprint; OpenAlex merges arXiv works with other records
// and gets the year wrong, measured 10-19 on 1706.03762), then Semantic Scholar. A DOI: Semantic Scholar, then OpenAlex.
// export.arxiv.org sends no CORS header: a phone's page cannot read it and goes on to Semantic Scholar, which does.

/** `{ meta, pdfUrl, tried }`: `tried` says, per source, why it gave nothing (shown when every one failed). */
export async function lookup(ref, fetchFn = fetch) {
  const tried = []
  const sources = ref.arxiv ? [arxivApi, semanticScholar] : ref.doi ? [semanticScholar, openAlex] : []
  for (const source of sources) {
    try {
      const found = await source(ref, fetchFn)
      if (found) return { ...found, pdfUrl: ref.arxiv ? `https://arxiv.org/pdf/${ref.arxiv}` : found.pdfUrl ?? null, tried }
      tried.push(`${source.name}: not found`)
    } catch (error) {
      tried.push(`${source.name}: ${error.message}`)
    }
  }
  return { meta: ref.arxiv ? { arxiv: ref.arxiv } : ref.doi ? { doi: ref.doi } : {}, pdfUrl: ref.arxiv ? `https://arxiv.org/pdf/${ref.arxiv}` : ref.url ?? null, tried }
}

async function getText(fetchFn, url, accept) {
  const response = await fetchFn(url, { headers: { accept } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
const tag = (xml, name) => unescape((new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml)?.[1] ?? '').replace(/\s+/g, ' ').trim())

async function arxivApi(ref, fetchFn) {
  const xml = await getText(fetchFn, `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(ref.arxiv)}`, 'application/atom+xml')
  const entry = /<entry>([\s\S]*?)<\/entry>/.exec(xml)?.[1]
  if (!entry || !tag(entry, 'title')) return null
  const doi = tag(entry, 'arxiv:doi')
  return {
    meta: {
      title: tag(entry, 'title'),
      authors: [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((m) => unescape(m[1].trim())),
      year: Number(tag(entry, 'published').slice(0, 4)) || null,
      venue: tag(entry, 'arxiv:journal_ref') || 'arXiv',
      arxiv: ref.arxiv,
      ...(doi ? { doi } : {}),
      abstract: tag(entry, 'summary'),
    },
  }
}

async function semanticScholar(ref, fetchFn) {
  const id = ref.arxiv ? `arXiv:${ref.arxiv}` : `DOI:${ref.doi}`
  const fields = 'title,authors,year,venue,abstract,externalIds,citationCount,openAccessPdf'
  const work = JSON.parse(await getText(fetchFn, `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(id)}?fields=${fields}`, 'application/json'))
  if (!work?.title) return null
  const arxiv = ref.arxiv ?? work.externalIds?.ArXiv
  const doi = ref.doi ?? work.externalIds?.DOI
  return {
    meta: {
      title: work.title,
      authors: (work.authors ?? []).map((a) => a.name).filter(Boolean),
      year: work.year ?? null,
      venue: work.venue || null,
      ...(arxiv ? { arxiv } : {}),
      ...(doi ? { doi } : {}),
      citedBy: work.citationCount ?? null,
      abstract: work.abstract ?? '',
    },
    pdfUrl: arxiv ? `https://arxiv.org/pdf/${arxiv}` : work.openAccessPdf?.url || null,
  }
}

async function openAlex(ref, fetchFn) {
  const work = JSON.parse(await getText(fetchFn, `https://api.openalex.org/works/doi:${encodeURIComponent(ref.doi)}`, 'application/json'))
  if (!work?.display_name) return null
  const words = []
  for (const [word, places] of Object.entries(work.abstract_inverted_index ?? {})) for (const p of places) words[p] = word
  return {
    meta: {
      title: work.display_name,
      authors: (work.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean),
      year: work.publication_year ?? null,
      venue: work.primary_location?.source?.display_name ?? null,
      doi: ref.doi,
      citedBy: work.cited_by_count ?? null,
      abstract: words.filter(Boolean).join(' '),
    },
    pdfUrl: work.best_oa_location?.pdf_url ?? null,
  }
}
