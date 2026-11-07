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

/** A canvas scaled to its box for crisp drawing, and the theme colours to draw with. */
export function board(canvas, w, h) {
  const fit = () => {
    const scale = Math.min(canvas.parentElement.clientWidth / w, 1.6)
    canvas.style.width = `${w * scale}px`
    canvas.width = w * scale * devicePixelRatio
    canvas.height = h * scale * devicePixelRatio
    canvas.getContext('2d').setTransform(scale * devicePixelRatio, 0, 0, scale * devicePixelRatio, 0, 0)
  }
  fit()
  addEventListener('resize', fit)
  const css = getComputedStyle(document.body)
  const ink = (name) => css.getPropertyValue(`--em-${name}`).trim()
  return { g: canvas.getContext('2d'), ink, stop: () => removeEventListener('resize', fit) }
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
