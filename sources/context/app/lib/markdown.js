import fs from 'node:fs/promises'
import path from 'node:path'

export const normalize = (s = '') => String(s).replace(/\\"/g, '"').replace(/\s+/g, ' ').trim().replace(/^"|"$/g, '').trim()
export const lines = (s) => s.split(/\r?\n/)
export const slug = (s) => path.basename(s).replace(/\.md$/, '')

// The small memory frontmatter vocabulary; no YAML evaluation or arbitrary tags.
export function frontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  const fields = {}
  if (!match) return { fields, body: raw, present: false }
  let parent = ''
  for (const line of lines(match[1])) {
    const m = line.match(/^(\s*)([\w-]+):\s*(.*?)\s*$/)
    if (!m) continue
    let value = m[3]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1).replace(/\\"/g, '"')
    if (!m[1]) { parent = m[2]; fields[parent] = value }
    else if (parent === 'metadata') fields[m[2]] = value
  }
  return { fields, body: raw.slice(match[0].length), present: true }
}

export function links(raw) {
  const result = []
  for (const match of raw.matchAll(/\[([^\]\n]*)\]\(([^)\s]+\.md)(?:#[^)]*)?\)|\[\[([^\]\n|#]+)(?:[|#][^\]\n]*)?\]\]/g)) {
    const target = (match[2] || match[3]).trim()
    if (/^(?:[a-z]+:|\/|~)/i.test(target) || target.includes('..')) continue
    // Bash character classes, JSON arrays and code expressions are not wiki links.
    if (match[3] && !/^[\p{L}\p{N}_.\/-]+$/u.test(target)) continue
    result.push({ target: `${target.replace(/\.md$/, '')}.md`, text: match[0], offset: match.index, line: lines(raw.slice(0, match.index)).length })
  }
  return result
}

export function indexEntries(file, raw) {
  if (file !== 'MEMORY.md' && !file.endsWith('-hub.md')) return []
  return lines(raw).flatMap((line, i) => {
    const m = line.match(/^\s*[-*]\s*\[([^\]]*)\]\(([^)\s]+\.md)\)\s*(?:—|--|-|:)\s*(.*)$/)
    return m ? [{ file, target: m[2], description: m[3].trim(), line: i + 1, text: line }] : []
  })
}

export function reachable(graph, start = 'MEMORY.md') {
  const seen = new Set([start]), stack = [start]
  while (stack.length) for (const to of graph.get(stack.pop()) || []) if (!seen.has(to)) { seen.add(to); stack.push(to) }
  return seen
}

export async function readMemory(directory) {
  const root = await fs.realpath(directory)
  const entries = (await fs.readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
  const files = await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile() && !entry.isSymbolicLink()) return null
    const filePath = path.join(root, entry.name), real = await fs.realpath(filePath)
    if (path.dirname(real) !== root) throw new Error(`Memory file leaves its directory: ${filePath}`)
    const stat = await fs.stat(real)
    if (!stat.isFile()) return null
    const raw = entry.name.endsWith('.md') ? await fs.readFile(real, 'utf8') : ''
    return { file: entry.name, path: real, bytes: stat.size, mtimeMs: stat.mtimeMs, raw, ...frontmatter(raw), links: links(raw), entries: indexEntries(entry.name, raw) }
  }))
  return { root, files: files.filter(Boolean) }
}
