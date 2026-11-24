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
 * Everything the card shows, in one round of 3 GETs at once: the PR, its reviews, and the check runs of its head, named by
 * GitHub's own ref for it (`pull/N/head`) so they need not wait for the PR. A push between the reads gives runs of another
 * head: those are dropped (the card shows no checks until it reads again). GitHub computes `mergeable` lazily: a `null`
 * there is shown as such, and the read before a merge asks again.
 */
export async function readPr({ repo, number }) {
  const [pr, checks, reviews] = await Promise.all([
    read(`/repos/${repo}/pulls/${number}`),
    read(`/repos/${repo}/commits/pull/${number}/head/check-runs?per_page=100`),
    read(`/repos/${repo}/pulls/${number}/reviews?per_page=100`),
  ])
  return { pr, checks: { ...checks, check_runs: (checks.check_runs ?? []).filter((run) => run.head_sha === pr.head.sha) }, reviews }
}

/**
 * The person's GitHub login, read once and kept until they set another credential (`forgetViewer`): it decides only what
 * the card offers, never what GitHub allows.
 */
export async function viewerLogin() {
  const kept = JSON.parse(await window.gugu.readData('viewer.json') ?? 'null')
  if (kept?.login) return kept.login
  const { login } = await read('/user')
  await window.gugu.writeData('viewer.json', JSON.stringify({ login }))
  return login
}
export const forgetViewer = () => window.gugu.writeData('viewer.json', 'null')
