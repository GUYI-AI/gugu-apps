// A .pptx in a chat's folder, opened in 咕咕办公: every slide drawn, every shape pickable, and the picks put in the
// chat's composer as pills for the person to @ an agent with (the deck design note §3, §7; App
// reference pills).
//
// - Drawn by pptx-glimpse (MIT, skills/office/vendor/, built by sources/office/vendor/build.mjs): each slide an SVG, shown as an
//   <img> — a file's own text never becomes markup in this page. Its shapes, and where each sits, are read from the
//   file's XML by pptx-read.js — the reading the skill's scripts answer agents from, so both name and place a shape the same —
//   and their boxes laid over the slide to pick by. pptx-glimpse only draws.
// - A shape is named by its slide, its cNvPr id and, when one slide gives the same id twice (PptxGenJS does), which of
//   them in document order (refOf: `{ slide: 3, shape: 12, k: 2 }`); the pill says its first words or its name.
// - No modes (the selection design note §1): a click picks, a drag anywhere
//   on a slide draws a box — the deck is read-only, so a drag means nothing else. On a desktop a plain click or drag
//   replaces what is picked and Shift / ⌘ / Ctrl adds (a picked one clicked so takes it back); a click on nothing clears.
//   With a finger a tap adds or takes back, one finger dragging scrolls, and holding still ~0.35 s then dragging draws.
// - Picks wait here until the person puts them in the composer at once (the bar the page floats by the last of them,
//   app.js): gugu.compose closes the panel on a phone, so a pick each would mean opening it again for each.
// - Each waiting pick stays visible on its slide, numbered in the order its pill goes; its number takes it back.
// - A pill clicked opens the file here at its place (`reveal`, from the page's onLink): its slide scrolled to and the
//   place framed until the next press.
// - Nothing is written to the file here: an agent changes it (A2), the person reads it. Its new version is drawn
//   again by the page (app.js pptxMoved), a new view replacing this one.

import { partTexts } from './skills/office/lib/ooxml-read.js'
import { EMU_PER_PX, slideParts, slideShapes } from './skills/office/lib/pptx-read.js'

let glimpse = null
const loadGlimpse = () => (glimpse ??= import('./skills/office/vendor/pptx-glimpse.js'))

const VIEWBOX = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/
/** How long a finger holds still before its drag draws a box instead of scrolling (选区交互设计 §1: about 0.35 s). */
export const LONG_PRESS_MS = 350

/**
 * A pick as the pill the composer gets (App 引用 pill): `at`, where it is as this view reads it back (`reveal`) and the
 * skill's scripts address it — `{ slide, shape }` (`k: 2`: that id's second on the slide), `{ slide, box: 'x,y,w,h' }`
 * in slide px; the link the host writes reads `#slide=3&shape=12` — and `label`, what the pill says after the file's name:
 * the slide, then the shape as a person tells it.
 */
export function refOf(pick, t) {
  const slide = t.pptxSlide.replace('{n}', String(pick.slide))
  if (pick.box) {
    const n = pick.shapes.length
    const what = n ? t.pptxBoxShapes.replace('{n}', String(n)).replace('{s}', n === 1 ? '' : 's') : t.pptxBoxEmpty
    return { at: { slide: pick.slide, box: pick.box.map(Math.round).join(',') }, label: `${slide} · ${what}` }
  }
  const { shape } = pick
  return { at: { slide: pick.slide, shape: shape.id, ...(shape.of > 1 ? { k: shape.k } : {}) }, label: `${slide} · ${shapeWords(shape, t)}` }
}

/**
 * A shape as a person tells it apart in a pill: its words, else its name, else its id — whole. The pill is cut once, by
 * gugu (the file's name, this label: 60 characters as seen), so what the slide's words leave is the shape's.
 */
function shapeWords(shape, t) {
  return shape.text || shape.name || t.pptxShape.replace('{id}', shape.id)
}

function shapeLabel(shape, t) {
  const nth = shape.of > 1 ? t.pptxNth.replace('{k}', String(shape.k)) : ''
  return `${t.pptxShape.replace('{id}', shape.id)}${nth}${shape.name ? `「${shape.name}」` : ''}`
}

// The deck's XML parts the shapes are read from — presentation.xml, the slides, layouts, masters and their
// relationships, not the media (ooxml-read.js partTexts inflates them in the page).
const XML_PARTS = /^ppt\/(presentation\.xml|_rels\/presentation\.xml\.rels|(slides|slideLayouts|slideMasters)\/(_rels\/)?[^/]+\.(xml|rels))$/

/**
 * Each shape of a slide as the page picks it: box in slide px, its words (paragraphs and line breaks a space apart, or
 * they read as one word; whole — a pill is cut once, by gugu), the groups it is in (as these shapes).
 */
function shapesOn(text, part, layouts) {
  const read = slideShapes(text, part, layouts)
  const px = (v) => v / EMU_PER_PX
  const mine = new Map(read.map((s) => [s, { id: s.id, k: s.k, of: s.of, name: s.name, kind: s.kind, text: s.text.replace(/\s+/g, ' ').trim(), bounds: s.box && { x: px(s.box.x), y: px(s.box.y), width: px(s.box.w), height: px(s.box.h) } }]))
  for (const [s, shape] of mine) shape.groups = s.groups.map((group) => mine.get(group))
  return [...mine.values()]
}

/**
 * Draw `bytes` into `host`; `onPicks(picks)` hears the waiting picks change. Resolves to the view's handle:
 * `picks()`, `clear()`, `anchor()`, `dragging()`, `reveal(query)`, `destroy()`. Rejects (said by the caller) if the file cannot be
 * read. Reading and drawing take seconds; `wanted()` is asked once more just before the deck replaces what `host`
 * shows by then (another file, or picks made on the deck this one would replace): no, and it resolves to null with
 * nothing of it left.
 */
export async function mountPptx(host, bytes, { t, onPicks, wanted = () => true }) {
  const { convertPptxToSvg } = await loadGlimpse()
  // Read first: a part whose zip lies about its size is refused here, said as such — pptx-glimpse would inflate it cut
  // to that size and fail on the cut XML. Then drawn with the options the editor session drew with (text as text).
  const text = await partTexts(bytes, XML_PARTS)
  const drawn = await convertPptxToSvg(bytes, { textOutput: 'text', skipSystemFonts: true, logLevel: 'off' })
  const parts = slideParts(text)
  const layouts = new Map()
  const urls = []
  const cards = new Map()
  let picks = []
  /** The last waiting pick's mark on its slide (a picked shape's box, a box's frame): anchor(). */
  let lastMark = null
  let dragging = false
  /** The finger on a slide now, from its touchstart to its touchend: one at a time (a second finger is a pinch). */
  let touch = null
  const changed = () => {
    drawMarks()
    onPicks(picks.slice())
  }
  const unpick = (pick) => {
    picks = picks.filter((p) => p !== pick)
    changed()
  }
  // Every waiting pick shown where it was made, numbered as the reference will number it: a picked shape ringed, a
  // box left as a dashed frame with the shapes in it ringed lightly. Only the number takes that one back: the frame is
  // a mark, and a new box can start inside it.
  const drawMarks = () => {
    for (const el of host.querySelectorAll('.pptx-mark, .pptx-badge')) el.remove()
    for (const el of host.querySelectorAll('.pptx-hit')) el.classList.remove('picked', 'inside')
    lastMark = null
    picks.forEach((pick, i) => {
      const { card, w, h } = cards.get(pick.slide)
      const place = (el, [x, y, width, height]) =>
        Object.assign(el.style, { left: `${(x / w) * 100}%`, top: `${(y / h) * 100}%`, width: `${(width / w) * 100}%`, height: `${(height / h) * 100}%` })
      const hit = (shape) => card.querySelector(`.pptx-hit[data-key="${shape.key}"]`)
      let corner
      let mark
      if (pick.box) {
        mark = document.createElement('div')
        mark.className = 'pptx-mark'
        place(mark, pick.box)
        card.append(mark)
        for (const shape of pick.shapes) hit(shape)?.classList.add('inside')
        corner = pick.box
      } else {
        mark = hit(pick.shape)
        mark?.classList.add('picked')
        const { x, y } = pick.shape.bounds
        corner = [x, y]
      }
      const badge = document.createElement('button')
      badge.type = 'button'
      badge.className = 'pptx-badge'
      badge.dataset.n = String(i + 1)
      badge.title = t.unpick
      badge.setAttribute('aria-label', `${t.unpick} ${i + 1}`)
      Object.assign(badge.style, { left: `${(corner[0] / w) * 100}%`, top: `${(corner[1] / h) * 100}%` })
      // Its own press: no box starts on it, no pick is made under it (the slide's handlers never hear it).
      badge.addEventListener('pointerdown', (e) => e.stopPropagation())
      badge.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })
      badge.onclick = (e) => {
        e.stopPropagation()
        unpick(pick)
      }
      card.append(badge)
      lastMark = mark ?? null
    })
  }
  // `add`: Shift / ⌘ / Ctrl on a desktop, every tap with a finger — a picked one is taken back, any other joins. Else
  // what is picked is replaced (a lone pick clicked again stays).
  const pick = (next, add) => {
    const at = picks.findIndex((p) => p.key === next.key)
    if (add) picks = at >= 0 ? picks.filter((_, i) => i !== at) : [...picks, next]
    else picks = at >= 0 && picks.length === 1 ? picks : [next]
    changed()
  }
  // In a group, as PowerPoint does: the first click picks the whole (outermost) group; once it or something in it is
  // picked, a click picks the shape under the pointer, taking the group's place when the group itself was picked.
  const pickShape = (n, shape, add) => {
    const pickOf = (s) => ({ key: `shape:${s.key}`, slide: n, shape: s })
    const [group] = shape.groups
    if (group) {
      const groupAt = picks.findIndex((p) => p.shape === group)
      if (groupAt >= 0) {
        picks = picks.map((p, i) => (i === groupAt ? pickOf(shape) : p))
        return changed()
      }
      if (!picks.some((p) => p.shape?.groups.includes(group))) return pick(pickOf(group), add)
    }
    pick(pickOf(shape), add)
  }
  const clear = () => {
    if (!picks.length) return
    picks = []
    changed()
  }
  const shapeOf = new Map()
  const additive = (e) => e.shiftKey || e.metaKey || e.ctrlKey
  // The keyboard to the App — and not to a shape a long press left focused (its Enter would pick that one, not put the
  // picks in the composer; 评审 367706fb81).
  const takeKeys = () => {
    if (document.activeElement?.classList?.contains('pptx-hit')) document.activeElement.blur()
    window.focus()
  }

  const deck = document.createElement('div')
  deck.className = 'pptx-deck'
  /** The frame of the place a pill pointed at (reveal): until the next press on the deck. */
  let found = null
  const unfind = () => {
    found?.remove()
    found = null
  }
  deck.addEventListener('pointerdown', unfind, { capture: true })
  for (const slide of drawn.slides) {
    const n = slide.slideNumber
    const size = slide.svg.match(VIEWBOX)
    const [w, h] = size ? [Number(size[1]), Number(size[2])] : [960, 540]
    const card = document.createElement('figure')
    card.className = 'pptx-slide'
    card.dataset.n = String(n)
    card.style.aspectRatio = `${w} / ${h}`
    const img = document.createElement('img')
    const url = URL.createObjectURL(new Blob([slide.svg], { type: 'image/svg+xml' }))
    urls.push(url)
    img.src = url
    img.alt = t.pptxSlide.replace('{n}', String(n))
    img.draggable = false
    card.append(img)
    const shapes = parts[n - 1] ? shapesOn(text, parts[n - 1], layouts) : []
    for (const shape of shapes) {
      if (!shape.bounds) continue
      shape.key = `${n}:${shape.id}:${shape.k}`
      const hit = document.createElement('button')
      hit.type = 'button'
      hit.className = 'pptx-hit'
      hit.dataset.key = shape.key
      hit.title = shapeLabel(shape, t)
      const { x, y, width, height } = shape.bounds
      Object.assign(hit.style, { left: `${(x / w) * 100}%`, top: `${(y / h) * 100}%`, width: `${(width / w) * 100}%`, height: `${(height / h) * 100}%` })
      shapeOf.set(hit, shape)
      // A click the pointer did not make (the keyboard's Enter / Space on a focused shape): picked as a click would be.
      // The pointer's own clicks were already answered when it was lifted (below), and are not answered twice.
      hit.onclick = (e) => {
        if (e.detail === 0) pickShape(n, shape, additive(e))
      }
      card.append(hit)
    }
    // A box: the innermost shapes it touches — a group's members, not the group. It is one place of its own (its box
    // and the shapes it touches are said), so a box around an empty part of a slide counts too.
    const pickBox = (box, add) => {
      const inside = shapes.filter(({ kind, bounds: b }) => kind !== 'grpSp' && b && b.x < box[0] + box[2] && b.x + b.width > box[0] && b.y < box[1] + box[3] && b.y + b.height > box[1])
      pick({ key: `box:${n}:${box.map(Math.round).join(',')}`, slide: n, box, shapes: inside }, add)
    }
    // Where a pointer is on this slide, in the slide's own px (clamped to it).
    const at = (rect, cx, cy) => [Math.min(Math.max(cx - rect.left, 0), rect.width) * (w / rect.width), Math.min(Math.max(cy - rect.top, 0), rect.height) * (h / rect.height)]
    const drawBand = (band, from, to) => {
      const box = [Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])]
      Object.assign(band.style, { left: `${(box[0] / w) * 100}%`, top: `${(box[1] / h) * 100}%`, width: `${(box[2] / w) * 100}%`, height: `${(box[3] / h) * 100}%` })
      return box
    }
    // The mouse (and a pen): pressed and lifted where it was, a click — on a shape it picks, on nothing it clears; moved
    // more than 4 px first, a box, wherever it started (on a shape too). Shift / ⌘ / Ctrl adds.
    card.addEventListener('pointerdown', (down) => {
      if (down.pointerType === 'touch' || down.button !== 0) return
      down.preventDefault()
      // Not moving the focus (above) must not leave the keys where they were: in the host's frame the App sits in, its
      // composer still has them, and Enter there sends. The App takes the keyboard as a click would have given it.
      takeKeys()
      const rect = card.getBoundingClientRect()
      const add = additive(down)
      const target = down.target.closest('.pptx-hit')
      let band = null
      let from = null
      let box = null
      // Pressed: a click or a box is under way — a new version is not swapped in under it (app.js redraw).
      dragging = true
      const move = (e) => {
        if (!band) {
          if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) <= 4) return
          band = document.createElement('div')
          band.className = 'pptx-band'
          card.append(band)
          from = at(rect, down.clientX, down.clientY)
          deck.classList.add('drawing')
        }
        box = drawBand(band, from, at(rect, e.clientX, e.clientY))
      }
      // A press ends once: lifted (it counts) or cancelled (it does not) — each takes all three listeners away.
      const end = () => {
        card.removeEventListener('pointermove', move)
        card.removeEventListener('pointerup', up)
        card.removeEventListener('pointercancel', end)
        band?.remove()
        dragging = false
        deck.classList.remove('drawing')
      }
      const up = () => {
        const drawn = band
        end()
        if (drawn) {
          if (box && box[2] >= 4 && box[3] >= 4) pickBox(box, add)
        } else if (target) pickShape(n, shapeOf.get(target), add)
        else if (!add) clear()
      }
      card.setPointerCapture(down.pointerId)
      card.addEventListener('pointermove', move)
      card.addEventListener('pointerup', up)
      card.addEventListener('pointercancel', end)
    })
    // A finger: a tap adds or takes back (no Shift on a phone, and a tap meant to scroll must not throw away what was
    // gathered — nothing clears on a tap); one finger moving is a scroll; held still ~0.35 s, the drag after it is a box.
    card.addEventListener('touchstart', (e) => {
      // A second finger: a pinch, not a box — what the first one had begun is let go, nothing kept.
      if (e.touches.length !== 1) {
        touchEnd(e, false)
        return
      }
      const [p] = e.touches
      const press = { x: p.clientX, y: p.clientY, target: e.target.closest('.pptx-hit'), armed: false, scrolled: false, band: null, box: null }
      press.timer = setTimeout(() => {
        if (touch !== press || press.scrolled) return
        press.armed = true
        dragging = true
        navigator.vibrate?.(8)
      }, LONG_PRESS_MS)
      touch = press
    }, { passive: true })
    card.addEventListener('touchmove', (e) => {
      const press = touch
      if (!press) return
      const [p] = e.touches
      if (!press.armed) {
        if (Math.hypot(p.clientX - press.x, p.clientY - press.y) > 8) {
          press.scrolled = true
          clearTimeout(press.timer)
        }
        return
      }
      // Held first: this drag is the box's, not the page's scroll.
      e.preventDefault()
      const rect = card.getBoundingClientRect()
      if (!press.band) {
        press.band = document.createElement('div')
        press.band.className = 'pptx-band'
        card.append(press.band)
        press.from = at(rect, press.x, press.y)
      }
      press.box = drawBand(press.band, press.from, at(rect, p.clientX, p.clientY))
    }, { passive: false })
    const touchEnd = (e, counts) => {
      const press = touch
      touch = null
      if (!press) return
      clearTimeout(press.timer)
      press.band?.remove()
      dragging = false
      if (!counts) return
      if (press.band) {
        if (press.box && press.box[2] >= 4 && press.box[3] >= 4) {
          pickBox(press.box, true)
          takeKeys()
        }
        return
      }
      if (press.scrolled || press.armed) return
      // A tap: answered here, so the browser's own click after it (which would pick it again) is not made — nor the
      // focus it would have moved: the App takes the keyboard itself, as the mouse's press does (a tablet's Enter).
      e.preventDefault()
      takeKeys()
      if (press.target) pickShape(n, shapeOf.get(press.target), true)
    }
    card.addEventListener('touchend', (e) => touchEnd(e, true))
    card.addEventListener('touchcancel', (e) => touchEnd(e, false))
    // A finger held on a slide is ours (a tap, or the box after the hold): not the system's long-press menu as well.
    card.addEventListener('contextmenu', (e) => {
      if (touch) e.preventDefault()
    })
    cards.set(n, { card, w, h })
    deck.append(card)
  }
  if (!wanted()) {
    for (const url of urls) URL.revokeObjectURL(url)
    return null
  }
  host.replaceChildren(deck)

  return {
    slides: drawn.slides.length,
    picks: () => picks.slice(),
    clear,
    /** The last waiting pick's mark (a picked shape's box, a box's frame): what the page floats its bar by. */
    anchor: () => lastMark,
    /** The mouse pressed on a slide, or a finger held to draw a box, right now: replacing the deck would drop it. */
    dragging: () => dragging,
    /**
     * Where a pill points (`query`: its `at` as refOf wrote it): its slide scrolled to, the shape or the box framed —
     * the slide alone when it names no more. False when this version has no such slide, shape or box: the page says so.
     */
    reveal(query) {
      unfind()
      const n = Number(query.slide)
      const slide = cards.get(n)
      if (!slide) return false
      let place = null
      if (query.box !== undefined) {
        const box = query.box.split(',').map(Number)
        if (box.length !== 4 || box.some((v) => !Number.isFinite(v))) return false
        place = { x: box[0], y: box[1], width: box[2], height: box[3] }
      } else if (query.shape !== undefined) {
        const key = `${n}:${query.shape}:${query.k ?? 1}`
        const shape = [...shapeOf.values()].find((s) => s.key === key)
        if (!shape) return false
        place = shape.bounds
      }
      found = document.createElement('div')
      found.className = place ? 'pptx-found' : 'pptx-found whole'
      if (place) {
        const { w, h } = slide
        Object.assign(found.style, { left: `${(place.x / w) * 100}%`, top: `${(place.y / h) * 100}%`, width: `${(place.width / w) * 100}%`, height: `${(place.height / h) * 100}%` })
      }
      slide.card.append(found)
      slide.card.scrollIntoView?.({ block: 'center' })
      return true
    },
    // Its own slides only: a deck a newer version replaced must not take the new one with it.
    destroy() {
      for (const url of urls) URL.revokeObjectURL(url)
      deck.remove()
    },
  }
}
