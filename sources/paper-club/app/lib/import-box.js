/* global gugu */ // window.gugu: the platform runtime puts it on the page before this module runs.
// Importing from a page — the shelf and the reader's own import box — into one place: a chat (its folder 论文) or a
// session's working copy. One way for every page (lib/importer.js does the work):
// - arXiv, on any device: the page fetches it itself (arxiv.org sends CORS; a desktop answers CORS for declared hosts);
// - anything else into a chat, on a desktop: the program fetches it (it reaches any host) — import_paper, the agents' tool;
// - anything else on a phone, or into a working copy: said plainly, nothing half done.
import { importPaper, ImportError, sameWork } from './importer.js'
import { isNotes, parseRef, PAPERS_FOLDER } from './paper.js'

const PAGE_HOSTS = /^https:\/\/(arxiv\.org|export\.arxiv\.org|api\.semanticscholar\.org|api\.openalex\.org)\//

/** The paper `input` names, imported into `place`; resolves `{ title }`, rejects with an ImportError's `code`. */
export async function importInto(place, input) {
  const ref = parseRef(input)
  if (!ref) throw new ImportError('bad-ref', input)
  if (!ref.arxiv && place.chat && typeof gugu.callProgram === 'function') {
    const answer = await gugu.callProgram('import_paper', { chat: place.chat, ref: input })
    if (answer.isError) throw new Error(answer.content?.map((c) => c.text).join(' ') || 'import failed')
    return { title: answer.structuredContent?.title ?? input }
  }
  const folder = PAPERS_FOLDER
  const result = await importPaper(ref, {
    fetch: (url, init) => {
      if (!/^https:\/\/arxiv\.org\//.test(url) && !PAGE_HOSTS.test(url)) throw new ImportError(place.session ? 'session-arxiv-only' : 'needs-desktop', url)
      return fetch(url, init)
    },
    upload: async (file) => (await gugu.files.upload(...into(place, folder, file)))[0],
    create: (name, inFolder, data) => gugu.files.create(placed(place, inFolder, name), data),
    existing: async (meta) => {
      const entries = await gugu.files.list(place)
      for (const entry of entries.filter(isNotes)) {
        const f = await gugu.files.open(entry)
        const same = sameWork(f.data.meta, meta)
        const pdf = same ? entries.find((e) => e.id === f.data.pdf) ?? null : null
        f.close()
        if (same) return { notes: entry, pdf }
      }
      return null
    },
  })
  return { title: result.meta.title || result.pdf?.name || '' }
}

/** The person's own PDF (the picker), into `place`'s 论文 folder (a working copy: its top — the picker names the file). */
export function uploadInto(place) {
  return gugu.files.upload(place.session ? place : { ...place, folder: PAPERS_FOLDER })
}

// A chat's folder is a `folder` beside the name; a working copy has none: there the path is the file's name.
const placed = (place, folder, name) => (place.session ? { ...place, name: folder ? `${folder}/${name}` : name } : { ...place, name, ...(folder ? { folder } : {}) })
const into = (place, folder, file) =>
  place.session ? [place, new File([file], `${folder}/${file.name}`, { type: file.type })] : [{ ...place, folder }, file]

/** An import's failure in the person's words (strings: the page's). */
export function importFailure(error, t, input) {
  if (error.code === 'bad-ref') return t.badRef.replace('{s}', input)
  if (error.code === 'no-pdf') return t.noPdf.replace('{title}', error.meta?.title || input)
  if (error.code === 'needs-desktop') return t.phoneNoProgram
  if (error.code === 'session-arxiv-only') return t.sessionArxivOnly
  return t.failed.replace('{e}', error.message)
}
