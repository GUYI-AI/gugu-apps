// A .pptx read as its XML says it (its package and parts by ooxml-read.js): the slides in show order, and every shape
// of a slide with where it sits — the one reading both sides use. The page (pptx-view.js) draws its click boxes
// from it and the skill's script (pptx-ooxml.mjs, scripts/pptx.mjs) answers outline / show from it, so the box a person picks by and the box an
// agent reads are the same box. pptx-glimpse only draws the slides. No node module, no DOM: plain JS, both import it.
//
// Where a shape sits, by the rules pptx-glimpse draws by (so the box is where the slide shows the shape):
// - its own <a:xfrm>, turned about its centre by its own rot; a group's member's, in its group's child space, put on the
//   slide through each group around it (the box is the one around the turned shape's corners);
// - of the two copies PowerPoint keeps in an mc:AlternateContent, one: the Choice that gives a shape (what PowerPoint
//   shows), else the Fallback;
// - a placeholder that gives none (a title, usually): the box of the one layout placeholder with its idx, or else, when
//   that one gives none either, of the one master placeholder of the matching type.
// Boxes are { x, y, w, h } in EMU, exact; the callers round or scale them.

import { OoxmlError, descendants, relatedPart, relsOf, resolveTarget, scanXml, unescape } from './ooxml-read.js'

export const SHAPES = new Set(['sp', 'pic', 'graphicFrame', 'grpSp', 'cxnSp'])
export const EMU_PER_PX = 9525

// ─── the deck ───────────────────────────────────────────────────────────────
// `text(name)` is a part's text (or null), as ooxml-read.js says.

/** The slides in show order: their part names (ppt/slides/slideN.xml). */
export function slideParts(text) {
  const PRESENTATION = 'ppt/presentation.xml'
  const pres = text(PRESENTATION)
  const rels = text(relsOf(PRESENTATION))
  if (!pres || !rels) throw new OoxmlError('not a presentation: ppt/presentation.xml is missing')
  const targets = new Map(scanXml(rels).filter((e) => e.local === 'Relationship').map((e) => [e.attrs.Id, e.attrs.Target]))
  const elements = scanXml(pres)
  // The show order is the root's sldIdLst: a section list (p14:sectionLst, in an extLst) names the same slides again,
  // by id only.
  const list = elements.find((e) => e.local === 'sldIdLst' && elements[e.parent]?.parent === -1)
  if (!list) return [] // a deck with no slides has no list at all
  return elements
    .filter((e) => e.local === 'sldId' && e.parent === list.index)
    .map((e) => {
      const target = targets.get(e.attrs['r:id'])
      if (!target) throw new OoxmlError(`slide ${e.attrs.id} has no target`)
      // As every other relationship is read (ooxml-read.js): ../ and ./ too, not only a target in ppt/ itself.
      return resolveTarget(PRESENTATION, target)
    })
}

// ─── where a shape sits ─────────────────────────────────────────────────────

/**
 * A shape's own <a:xfrm> (in its spPr / grpSpPr) or <p:xfrm> (a graphicFrame's), never a member's: off, ext, chOff,
 * chExt in EMU, rot in degrees, the flips; null without one. Scans forward from the shape, as far as its own xfrm.
 */
function xfrmOf(elements, el) {
  let xfrm
  for (let i = el.index + 1; i < elements.length && elements[i].start < el.end; i++) {
    const d = elements[i]
    if (d.local === 'xfrm' && (d.parent === el.index || elements[d.parent].parent === el.index)) {
      xfrm = d
      break
    }
  }
  if (!xfrm) return null
  const part = (local) => {
    for (let i = xfrm.index + 1; i < elements.length && elements[i].start < xfrm.end; i++) if (elements[i].local === local && elements[i].parent === xfrm.index) return elements[i].attrs
    return undefined
  }
  const point = (a) => a && { x: Number(a.x), y: Number(a.y) }
  const size = (a) => a && { w: Number(a.cx), h: Number(a.cy) }
  const on = (v) => v === '1' || v === 'true'
  return {
    off: point(part('off')),
    ext: size(part('ext')),
    ...(part('chOff') ? { chOff: point(part('chOff')) } : {}),
    ...(part('chExt') ? { chExt: size(part('chExt')) } : {}),
    rot: Number(xfrm.attrs.rot ?? 0) / 60000,
    flipH: on(xfrm.attrs.flipH),
    flipV: on(xfrm.attrs.flipV),
  }
}

/**
 * A group member's box on the slide. `box` is in its group's child space; `groups` are the groups around it, the
 * outermost first, each as xfrmOf gives it (chOff / chExt missing = (0, 0) and the group's ext). Each group maps a point
 * as pptx-glimpse draws it: minus chOff, scaled ext / chExt, flipped, turned about the group's centre, plus off. The
 * answer is the box around the four corners (a turned group's member is picked by the box around it).
 */
export function throughGroups(box, groups) {
  let corners = [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]]
  for (const g of [...groups].reverse()) {
    const ch = g.chOff ?? { x: 0, y: 0 }
    const chExt = g.chExt ?? g.ext
    const sx = chExt.w ? g.ext.w / chExt.w : 1
    const sy = chExt.h ? g.ext.h / chExt.h : 1
    const turn = ((g.rot ?? 0) * Math.PI) / 180
    const [cos, sin, cx, cy] = [Math.cos(turn), Math.sin(turn), g.ext.w / 2, g.ext.h / 2]
    corners = corners.map(([x0, y0]) => {
      let x = (x0 - ch.x) * sx
      let y = (y0 - ch.y) * sy
      if (g.flipH) x = g.ext.w - x
      if (g.flipV) y = g.ext.h - y
      if (turn) [x, y] = [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos]
      return [g.off.x + x, g.off.y + y]
    })
  }
  const xs = corners.map(([x]) => x)
  const ys = corners.map(([, y]) => y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

const BODY_LIKE = new Set(['body', 'subTitle', 'obj', 'chart', 'clipArt', 'dgm', 'media', 'pic', 'tbl'])

/** The master placeholder type a layout placeholder's type takes its place from. */
export const masterTypeOf = (type) => (type === 'title' || type === 'ctrTitle' ? 'title' : BODY_LIKE.has(type) ? 'body' : type)

/**
 * A placeholder that gives no box of its own: the box of the one layout placeholder with its idx (idx missing = 0), or
 * else, when that one gives none either, of the one master placeholder of the matching type. `placeholder`: { idx,
 * type }; `layout`, `master`: the top-level placeholders of the slide's layout and master, each { idx, type, box }.
 * Null when no single one matches.
 */
export function inheritedBox(placeholder, layout, master) {
  const inLayout = layout.filter((p) => p.idx === placeholder.idx)
  if (inLayout.length !== 1) return null
  const [from] = inLayout
  if (from.box) return from.box
  const want = masterTypeOf(from.type)
  const inMaster = master.filter((p) => p.type === want)
  return inMaster.length === 1 ? inMaster[0].box : null
}

/**
 * Every shape of a slide's XML, in document order (in groups too): its element, cNvPr id and which of that id it is
 * (k of `of`), name, kind, text, placeholder, box in EMU (its own xfrm, a group member's through its groups; null when
 * it gives none), which of an mc:AlternateContent's copies it is (`alternate`: 'choice', 'fallback' or null), and the
 * groups it is in (the outermost first, as these shapes).
 */
export function shapesOf(text) {
  const elements = scanXml(text)
  const groupXfrms = new Map()
  const groupXfrm = (g) => {
    if (!groupXfrms.has(g.index)) groupXfrms.set(g.index, xfrmOf(elements, g))
    return groupXfrms.get(g.index)
  }
  // A shape inside another one that is no group — an OLE object's picture, inside its graphicFrame — is part of that one,
  // not a shape of the slide: PowerPoint selects the object, never the picture it is shown by.
  const partOfShape = (el) => {
    for (let at = el.parent; at >= 0; at = elements[at].parent) if (SHAPES.has(elements[at].local) && elements[at].local !== 'grpSp') return true
    return false
  }
  // mc:AlternateContent holds the same thing twice — a Choice for readers that know it (an equation, a 2016 chart, a 3D
  // model, ink) and a Fallback for the rest — often one shape with one cNvPr id at one place in each. One of them is
  // listed: the first Choice that gives a shape — what PowerPoint shows (an equation's pptx-glimpse draws too; a 2016
  // chart's or a 3D model's it cannot, and draws the Fallback, at the same place) — else the Fallback (ink: the Choice is
  // a p14:contentPart, no shape; PowerPoint still shows the ink, glimpse the Fallback). A shape in the other branch is not
  // listed. `alternate`: which branch a listed shape is in — 'choice' (apply changes it, will not delete it) or
  // 'fallback' (PowerPoint shows the other copy: apply neither changes nor deletes it); null outside one.
  const drawnBranches = new Map()
  const drawnBranch = (alt) => {
    if (!drawnBranches.has(alt.index)) {
      const branches = elements.filter((e) => e.parent === alt.index && (e.local === 'Choice' || e.local === 'Fallback'))
      const givesShape = (b) => elements.some((e) => SHAPES.has(e.local) && e.start > b.start && e.end <= b.end)
      const drawn = branches.find((b) => b.local === 'Choice' && givesShape(b)) ?? branches.find((b) => b.local === 'Fallback')
      drawnBranches.set(alt.index, drawn?.index ?? -1)
    }
    return drawnBranches.get(alt.index)
  }
  const alternateOf = (el) => {
    let alternate = null
    for (let at = el.parent; at >= 0; at = elements[at].parent) {
      const branch = elements[at]
      if ((branch.local !== 'Choice' && branch.local !== 'Fallback') || elements[branch.parent]?.local !== 'AlternateContent') continue
      if (drawnBranch(elements[branch.parent]) !== branch.index) return 'not-listed'
      // In a Fallback at any depth: what PowerPoint shows is another copy.
      if (alternate !== 'fallback') alternate = branch.local === 'Fallback' ? 'fallback' : 'choice'
    }
    return alternate
  }
  const byElement = new Map()
  const shapes = elements
    .filter((e) => SHAPES.has(e.local) && !partOfShape(e) && alternateOf(e) !== 'not-listed')
    .map((el) => {
      const inner = descendants(elements, el)
      const nv = inner.find((d) => d.local === 'cNvPr')
      // Its own placeholder: in its non-visual block (its first child), not a group member's.
      const block = elements[el.index + 1]
      const ph = block && block.parent === el.index ? inner.find((d) => d.local === 'ph' && d.start > block.start && d.end <= block.end) : undefined
      const groups = []
      for (let at = el.parent; at >= 0; at = elements[at].parent) if (elements[at].local === 'grpSp') groups.unshift(elements[at])
      const own = xfrmOf(elements, el)
      const around = groups.map(groupXfrm)
      const placed = own?.off && own.ext && around.every((g) => g?.off && g.ext)
      const paragraphs = inner.filter((d) => d.local === 'p' && d.name.startsWith('a:'))
      // A line break inside a paragraph (<a:br>, Shift+Enter in PowerPoint) reads as one.
      const words = (p) => inner.filter((d) => (d.local === 't' || d.local === 'br') && d.start > p.start && d.end <= p.end).map((d) => (d.local === 'br' ? '\n' : unescape(text.slice(d.innerStart, d.innerEnd)))).join('')
      const shape = {
        element: el,
        id: nv?.attrs.id ?? null,
        name: unescape(nv?.attrs.name ?? ''),
        kind: el.local,
        // Its own xfrm is the innermost layer: its rect, turned about its centre (its child space is its own ext: no
        // scaling; a flip does not move the box around it), then through each group around it.
        box: placed ? throughGroups({ x: 0, y: 0, ...own.ext }, [...around, { off: own.off, ext: own.ext, rot: own.rot }]) : null,
        text: paragraphs.length ? paragraphs.map(words).join('\n') : '',
        ph: ph ? { type: ph.attrs.type ?? 'obj', idx: Number(ph.attrs.idx ?? 0) } : null,
        alternate: alternateOf(el),
        groupElements: groups,
      }
      byElement.set(el.index, shape)
      return shape
    })
  const count = new Map()
  for (const s of shapes) count.set(s.id, (count.get(s.id) ?? 0) + 1)
  const seen = new Map()
  for (const s of shapes) {
    const k = (seen.get(s.id) ?? 0) + 1
    seen.set(s.id, k)
    s.k = k
    s.of = count.get(s.id)
    s.groups = s.groupElements.map((g) => byElement.get(g.index))
    delete s.groupElements
  }
  return shapes
}

/**
 * A slide's shapes as shapesOf gives them, a placeholder that gives no box of its own given the one it is drawn at
 * (its layout's, or its master's). `cache` (optional, a Map) keeps each layout's and master's placeholders across slides.
 */
export function slideShapes(text, part, cache = new Map()) {
  const shapes = shapesOf(text(part) ?? '')
  const placeholders = (of) => {
    if (!cache.has(of)) {
      const xml = of && text(of)
      cache.set(of, xml ? shapesOf(xml).filter((s) => s.ph && !s.groups.length).map((s) => ({ ...s.ph, box: s.box })) : [])
    }
    return cache.get(of)
  }
  for (const s of shapes) {
    if (s.box || !s.ph || s.groups.length) continue
    const layout = relatedPart(text, part, 'slideLayout')
    s.box = inheritedBox(s.ph, placeholders(layout), placeholders(relatedPart(text, layout, 'slideMaster')))
  }
  return shapes
}
