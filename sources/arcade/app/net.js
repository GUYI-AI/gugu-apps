// The one piece every game shares. The group's file keeps what lasts (scores, food, bombs, the board);
// presence carries what moves (my snake, my tank). Nobody steps the game for everyone: each page moves
// its own player, judges hits on itself, and draws the others from their latest presence, smoothed.

/** This game's part of the file, made the first time. Read through the getter, never keep the object: two people
 *  opening at once both make it, and the merged one is what the file holds. */
export function slot(f, key, init) {
  f.data[key] ??= init
  return () => f.data[key]
}

/** Others playing `game` right now, each with the state they last sent. */
export const playing = (f, game) => f.presence.others.filter((p) => p.state?.game === game)

/** Run `step(dt)` at `hz`, then send what it returns as my presence. Returns stop. */
export function loop(f, game, hz, step) {
  let last = performance.now()
  const timer = setInterval(() => {
    const now = performance.now()
    const mine = step(Math.min(0.1, (now - last) / 1000))
    last = now
    f.presence.set({ game, ...mine })
  }, 1000 / hz)
  return () => clearInterval(timer)
}

/** Others' positions eased toward the latest frame: a late frame shows as a short glide, never a jump.
 *  `snap`: a jump longer than this is a respawn, drawn at once instead of glided across the map. */
export function smoother(snap, rate = 18) {
  const seen = new Map()
  return (id, x, y, dt) => {
    const p = seen.get(id) ?? { x, y }
    const k = Math.min(1, rate * dt)
    p.x += (x - p.x) * k
    p.y += (y - p.y) * k
    if (Math.abs(x - p.x) + Math.abs(y - p.y) > snap) Object.assign(p, { x, y })
    seen.set(id, p)
    return p
  }
}

/** Seconds since this page first saw `id` (a bullet, a bomb): shared things run on each page's own clock from
 *  when they arrived, so no clocks need to agree. */
export function ages() {
  const first = new Map()
  return (id) => {
    if (!first.has(id)) first.set(id, performance.now())
    return (performance.now() - first.get(id)) / 1000
  }
}

/** Whether point a is within r of point b: every hit is judged by the one who gets hit, with this. */
export const near = (a, b, r) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < r * r

/** Add one to `table[who]` in the file. */
export const bump = (table, who) => { table[who] = (table[who] ?? 0) + 1 }

/** A canvas scaled to its box for crisp drawing. Resizing clears it: `redraw` paints it again, for a game that
 *  draws only when something changes. */
export function board(canvas, w, h, redraw) {
  const fit = () => {
    const scale = Math.min(canvas.parentElement.clientWidth / w, 1.6)
    canvas.style.width = `${w * scale}px`
    canvas.width = w * scale * devicePixelRatio
    canvas.height = h * scale * devicePixelRatio
    canvas.getContext('2d').setTransform(scale * devicePixelRatio, 0, 0, scale * devicePixelRatio, 0, 0)
  }
  fit()
  const resize = () => { fit(); redraw?.() }
  addEventListener('resize', resize)
  return { g: canvas.getContext('2d'), stop: () => removeEventListener('resize', resize) }
}

/** The arcade's colours. A game's screen is night in either theme, like a cabinet's, so the players' colours read the
 *  same everywhere; plain hex, as a phone's canvas ignores the theme's color-mix() inks. */
export const PAL = { screen: '#0d1020', grid: '#1e2547', me: '#f8b800', them: '#7fd6ff', shot: '#fff1a8', fire: '#ff6a00', flame: '#ffe14d',
  brick: '#b4501e', mortar: '#4a1c06', stone: '#8d939b', grass: '#2f8a3b', grass2: '#2a7d35' }

/** A block shaded the 8-bit way: light along the top and left, dark along the bottom and right. */
export function tile(g, x, y, w, h, color) {
  const e = Math.max(1, Math.round(Math.min(w, h) / 8))
  g.fillStyle = color; g.fillRect(x, y, w, h)
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, w, e); g.fillRect(x, y, e, h)
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + h - e, w, e); g.fillRect(x + w - e, y, e, h)
}

/** A brick wall filling a rectangle, rows of `size`, every other row offset by half a brick. */
export function brickwork(g, x, y, w, h, size = 8) {
  g.fillStyle = PAL.brick; g.fillRect(x, y, w, h)
  g.fillStyle = PAL.mortar
  for (let r = 0; r * size < h; r++) {
    const top = y + r * size, rh = Math.min(size, y + h - top)
    if (rh === size) g.fillRect(x, top + size - 1, w, 1)
    for (let bx = x + (r % 2 ? size : 0); bx < x + w; bx += size * 2) g.fillRect(bx, top, 1, rh)
  }
}

/** Two eyes on the cell centred at cx,cy, looking along dx,dy. */
export function eyes(g, cx, cy, [dx, dy], size) {
  const k = size / 16
  for (const s of [-1, 1]) {
    const ex = cx + dx * 3 * k - dy * s * 4 * k, ey = cy + dy * 3 * k + dx * s * 4 * k
    g.fillStyle = '#fff'; g.fillRect(ex - 2 * k, ey - 2 * k, 4 * k, 4 * k)
    g.fillStyle = '#000'; g.fillRect(ex - k + dx * k, ey - k + dy * k, 2 * k, 2 * k)
  }
}

/** Faint CRT scanlines over the whole screen, drawn last. */
export function scanlines(g, w, h) {
  g.fillStyle = 'rgba(0,0,0,.18)'
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1)
}

/** Arrow keys / WASD and swipes, as one direction. */
export function directions(target, on) {
  const keys = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }
  const key = (e) => { const d = keys[e.key]; if (d) { e.preventDefault(); on(d) } }
  let start = null
  const down = (e) => { start = [e.clientX, e.clientY] }
  const up = (e) => {
    if (!start) return
    const dx = e.clientX - start[0], dy = e.clientY - start[1]
    start = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) on(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)])
  }
  addEventListener('keydown', key)
  target.addEventListener('pointerdown', down)
  target.addEventListener('pointerup', up)
  return () => { removeEventListener('keydown', key); target.removeEventListener('pointerdown', down); target.removeEventListener('pointerup', up) }
}
