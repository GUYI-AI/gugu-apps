// Requests through the host's `gugu.credentials` (API 61): the host sends each one with the github.com credential the person
// chose for this App in their password vault; the App never sees it. GitHub's own status comes back with each answer.
import { githubProblem } from './pr.js'

export const SITE = 'github.com'
export const API = 'https://api.github.com'
export const HEADERS = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
export const hasGithub = () => typeof window.gugu?.credentials?.read === 'function'

/** A GET that must succeed: GitHub's refusal becomes an Error carrying its status, in words the card shows. */
export async function read(path) {
  const { status, data } = await window.gugu.credentials.read(SITE, `${API}${path}`, { headers: HEADERS })
  if (status < 200 || status > 299) throw Object.assign(new Error(githubProblem(status, data)), { status })
  return data
}

/**
 * Everything the card shows, read once: the PR, its head's check runs and its reviews (3 GETs). GitHub computes
 * `mergeable` lazily: a `null` there is shown as such, and the read before a merge asks again.
 */
export async function readPr({ repo, number }) {
  const pr = await read(`/repos/${repo}/pulls/${number}`)
  const [checks, reviews] = await Promise.all([
    read(`/repos/${repo}/commits/${pr.head.sha}/check-runs?per_page=100`),
    read(`/repos/${repo}/pulls/${number}/reviews?per_page=100`),
  ])
  return { pr, checks, reviews }
}
