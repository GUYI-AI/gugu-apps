// 炸弹人: I walk the grid in my presence. Bombs and bricks are in the file; each page lights a bomb's fuse when the bomb
// arrives, so it bursts at the same moment for everyone give or take the link. Whoever stands in a blast judges it on
// their own page; the bomb's owner clears the bomb and the bricks it broke.
import { ages, board, bump, directions, loop, playing, slot, smoother } from './net.js'

export const title = '炸弹人'
const W = 15, H = 11, CELL = 32, FUSE = 2, FLAME = 0.5, RANGE = 2, MAX_BOMBS = 2
const CORNERS = [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2]]

export const pillar = (x, y) => x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1 || (x % 2 === 0 && y % 2 === 0)

/** A fresh field: bricks on about half the open cells, never next to a corner where someone starts. */
export function bricks(random = Math.random) {
  const out = {}
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!pillar(x, y) && !CORNERS.some(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) < 3) && random() < 0.5) out[`${x},${y}`] = 1
  }
  return out
}

/** The cells a bomb at x,y burns: out to RANGE each way, stopping at a pillar and at (and on) the first brick. */
export function blast(x, y, brick) {
  const cells = [[x, y]]
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= RANGE; k++) {
    const c = [x + dx * k, y + dy * k]
    if (pillar(...c)) break
    cells.push(c)
    if (brick[c.join()]) break
  }
  return cells
}

export function mount(stage, { f, nameOf }) {
  const B = slot(f, 'bomber', { bricks: bricks(), bombs: {}, kills: {}, deaths: {} })
  const me = () => f.presence.self.userId
  const canvas = document.createElement('canvas')
  const line = document.createElement('p')
  const actions = Object.assign(document.createElement('div'), { className: 'row' })
  const drop = Object.assign(document.createElement('button'), { className: 'primary', textContent: '放炸弹' })
  const fresh = Object.assign(document.createElement('button'), { textContent: '新的一局' })
  actions.append(drop, fresh)
  stage.append(line, canvas, actions)
  const { g, ink, stop } = board(canvas, W * CELL, H * CELL)
  const age = ages(), smooth = smoother(3)

  let pos = CORNERS[Math.floor(Math.random() * 4)], dead = 0, wait = 0
  const counted = new Set(), chained = new Map() // a bomb another blast reached goes off right then
  const fuse = (id) => (chained.has(id) ? FUSE + (performance.now() - chained.get(id)) / 1000 : age(id))
  const blocked = ([x, y]) => pillar(x, y) || B().bricks[`${x},${y}`] || Object.values(B().bombs).some((b) => b.x === x && b.y === y)
  const offDirs = directions(canvas, ([dx, dy]) => {
    const to = [pos[0] + dx, pos[1] + dy]
    if (!dead && wait <= 0 && !blocked(to)) { pos = to; wait = 0.12 }
  })
  const place = () => {
    const mine = Object.values(B().bombs).filter((b) => b.by === me()).length
    if (!dead && mine < MAX_BOMBS && !blocked(pos)) B().bombs[crypto.randomUUID().slice(0, 8)] = { x: pos[0], y: pos[1], by: me() }
  }
  const space = (e) => { if (e.key === ' ') { e.preventDefault(); place() } }
  addEventListener('keydown', space)
  drop.onclick = place
  fresh.onclick = () => f.transact(() => { B().bricks = bricks(); B().bombs = {} })

  const stopLoop = loop(f, 'bomber', 15, (dt) => {
    wait -= dt
    if (dead && (dead -= dt) <= 0) { dead = 0; pos = CORNERS[Math.floor(Math.random() * 4)] }
    const flames = []
    for (const [id, b] of Object.entries(B().bombs)) {
      const t = fuse(id)
      if (t < FUSE) continue
      const cells = blast(b.x, b.y, B().bricks)
      flames.push(...cells)
      if (!dead && !counted.has(id) && cells.some(([x, y]) => x === pos[0] && y === pos[1])) {
        counted.add(id)
        dead = 3
        f.transact(() => { if (b.by !== me()) bump(B().kills, b.by); bump(B().deaths, me()) })
      }
      for (const [oid, o] of Object.entries(B().bombs)) if (fuse(oid) < FUSE && cells.some(([x, y]) => x === o.x && y === o.y)) chained.set(oid, performance.now())
      if (b.by === me() && t > FUSE + FLAME) f.transact(() => { for (const c of cells) delete B().bricks[c.join()]; delete B().bombs[id] })
    }

    g.clearRect(0, 0, W * CELL, H * CELL)
    const box = (x, y, color, inset = 1) => { g.fillStyle = color; g.fillRect(x * CELL + inset, y * CELL + inset, CELL - 2 * inset, CELL - 2 * inset) }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (pillar(x, y)) box(x, y, ink('foreground-passive'))
    g.globalAlpha = 0.45 // bricks: the pillars' grey, lighter, because they break
    for (const k of Object.keys(B().bricks)) box(...k.split(',').map(Number), ink('foreground-passive'), 2)
    g.globalAlpha = 1
    for (const b of Object.values(B().bombs)) { g.fillStyle = ink('foreground'); g.beginPath(); g.arc((b.x + 0.5) * CELL, (b.y + 0.5) * CELL, CELL * 0.32, 0, Math.PI * 2); g.fill() }
    for (const [x, y] of flames) box(x, y, ink('foreground-warning'), 3)
    const others = playing(f, 'bomber')
    for (const p of others) if (p.state.pos) { const at = smooth(p.id, ...p.state.pos, dt); box(at.x, at.y, p.color || ink('foreground-muted'), 6) }
    if (!dead) box(...pos, f.presence.self.color || ink('accent-9'), 6)
    const score = (id) => `${nameOf(id)} ${B().kills[id] ?? 0}/${B().deaths[id] ?? 0}`
    line.textContent = `${dead ? '复活中　' : ''}炸到/被炸　${[me(), ...others.map((p) => p.userId)].map(score).join('　')}`
    return { pos: dead ? null : pos }
  })
  return () => { stopLoop(); offDirs(); stop(); removeEventListener('keydown', space) }
}
