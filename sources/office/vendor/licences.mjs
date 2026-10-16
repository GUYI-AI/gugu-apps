// Which packages a bundle holds, and whether each may be in it — the licence gate of build.mjs, apart so a test can
// feed it inputs. A package is named by its LAST node_modules segment in an input's path: a dependency nested under
// another (node_modules/a/node_modules/b/…) is b, read from its own folder, never taken for a.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

export const LICENCES = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD'])

/**
 * A package's licence permissive: one of LICENCES, or a choice of licences one of which is ("MIT OR Apache-2.0",
 * "(MIT OR Apache-2.0)", and npm's older "MIT/Apache-2.0") — the choice is ours. An AND is all of them.
 */
export function permissive(license) {
  if (typeof license !== 'string') return false
  const text = license.trim().replace(/^\((.*)\)$/, '$1')
  if (/\sAND\s/.test(text)) return text.split(/\s+AND\s+/).every(permissive)
  return text.split(/\s+OR\s+|\//).some((one) => LICENCES.has(one.trim().replace(/^\((.*)\)$/, '$1')))
}

/** The package folder (relative to `root`) and name an input path lies in; null for the bundle's own files. */
export function packageOf(input) {
  const matches = [...input.matchAll(/node_modules\/((?:@[^/]+\/)?[^/]+)/g)]
  const last = matches.at(-1)
  if (!last) return null
  return { name: last[1], dir: input.slice(0, last.index + last[0].length) }
}

/**
 * Every package the inputs come from: version, licence, licence text (or a line saying the package ships none — and its
 * project's notice, when `notices` keeps one: <name, / as __>.txt). Throws, naming each, when one's licence is not
 * permissive.
 */
export function packagesOf(root, inputs, notices = null) {
  const packages = new Map()
  for (const input of inputs) {
    const pkg = packageOf(input)
    if (!pkg || packages.has(pkg.dir)) continue
    const dir = path.join(root, pkg.dir)
    const meta = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const author = typeof meta.author === 'string' ? meta.author : (meta.author?.name ?? 'its authors')
    const licenceFile = readdirSync(dir).find((file) => /^licen[cs]e(\.|$)/i.test(file))
    // A package that ships no licence file says its licence only in package.json: that is what is recorded, said so —
    // with its project's notice, kept beside this file, where there is one.
    const notice = !licenceFile && notices ? path.join(notices, `${pkg.name.replace('/', '__')}.txt`) : null
    const kept = notice && existsSync(notice) ? `\n\n${readFileSync(notice, 'utf8')}` : ''
    const text = licenceFile
      ? readFileSync(path.join(dir, licenceFile), 'utf8')
      : `(${pkg.name} ships no licence file; its package.json says "${meta.license}", by ${author}.)${kept}`
    packages.set(pkg.dir, { name: pkg.name, version: meta.version, license: meta.license ?? null, text })
  }
  const refused = [...packages.values()].filter((p) => !permissive(p.license))
  if (refused.length) {
    throw new Error(`not bundled — licence not permissive: ${refused.map((p) => `${p.name}@${p.version} (${p.license})`).join(', ')}`)
  }
  return [...packages.values()]
}
