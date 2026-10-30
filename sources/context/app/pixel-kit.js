// All pixel visuals live here and in pixel-kit.css. Project names, never user identities, seed sprites.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children.flat(Infinity)) if (child !== null && child !== undefined && child !== false) node.append(child)
  return node
}
export function hash(name) { let h = 2166136261; for (const c of name) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const palette = ['cyan', 'pink', 'lav', 'green', 'orange', 'yellow']
export function character(node, name) { node.style.setProperty('--px-strip', `var(--px-${palette[hash(name) % palette.length]})`); return node }
export function sprite(name, size = 40) {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  for (const [key, value] of Object.entries({ class: 'px-sprite', width: size, height: size, viewBox: '0 0 8 8', 'shape-rendering': 'crispEdges', 'aria-hidden': 'true' })) svg.setAttribute(key, value)
  const rect = (x, y, width, height, className) => { const r = document.createElementNS(ns, 'rect'); for (const [k, v] of Object.entries({ x, y, width, height, class: className })) r.setAttribute(k, v); svg.append(r) }
  rect(0, 0, 8, 8, 'px-sprite-bg')
  let x = hash(name)
  for (let y = 1; y < 7; y++) for (let i = 1; i < 4; i++) { x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0; if (x % 100 < 55) { rect(i, y, 1, 1, 'px-sprite-glyph'); rect(7 - i, y, 1, 1, 'px-sprite-glyph') } }
  return character(svg, name)
}
export function toneFor(kind, cells) {
  if (cells === null) return ''
  return kind === 'health' ? cells <= 3 ? 'red' : cells <= 6 ? 'yellow' : '' : kind === 'capacity' ? cells >= 10 ? 'red' : cells >= 7 ? 'yellow' : '' : ''
}
export function bar(kind, cells, { big = false, unknown = false } = {}) {
  const tone = toneFor(kind, cells)
  return el('span', { class: 'px-bar', 'data-kind': kind, 'data-tone': tone, 'data-big': big, 'data-unknown': unknown || cells === null, 'aria-hidden': true }, Array.from({ length: 10 }, (_, i) => el('i', { class: i < cells ? 'px-filled' : '' })))
}
export const button = (text, onclick, attrs = {}) => el('button', { type: 'button', class: 'px-button', onclick, ...attrs }, text)
