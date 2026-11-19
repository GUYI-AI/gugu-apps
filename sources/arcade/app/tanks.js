// 坦克大战: my tank and my shells are in my presence. A shell is its launch point and velocity, so every page flies it
// on its own clock from when it arrived. A shell that reaches me is judged here: the shooter's kill goes in the file.
import { PAL, ages, board, brickwork, bump, loop, near, playing, scanlines, slot, smoother, tile } from './net.js'

const W = 480, H = 320, SPEED = 90, TURN = 3, SHELL = 260, LIFE = 1.4, RELOAD = 0.4, R = 11
const WALLS = [[100, 60, 20, 90], [360, 170, 20, 90], [200, 150, 80, 20], [60, 250, 90, 16], [330, 50, 90, 16]]

export const inWall = (x, y, pad = 0) => x < pad || y < pad || x > W - pad || y > H - pad ||
  WALLS.some(([wx, wy, ww, wh]) => x > wx - pad && x < wx + ww + pad && y > wy - pad && y < wy + wh + pad)

const bearing = (from, to) => Math.atan2(to.y - from.y, to.x - from.x)

/** Where a shell is `t` seconds after launch, or null once it hit a wall or ran out. */
export function flight(s, t) {
  if (t > LIFE) return null
  for (let k = 0; k <= t; k += 0.02) if (inWall(s.x + s.vx * k, s.y + s.vy * k)) return null
  return { x: s.x + s.vx * t, y: s.y + s.vy * t }
}

export function mount(stage, { f, t, nameOf }) {
  const T = slot(f, 'tanks', { kills: {}, deaths: {} })
  const me = () => f.presence.self.userId
  const canvas = document.createElement('canvas')
  const fire = Object.assign(document.createElement('button'), { className: 'primary', textContent: t.fire })
  const line = document.createElement('p')
  stage.append(line, canvas, fire)
  const { g, stop } = board(canvas, W, H)
  const age = ages(), smooth = smoother(120)

  const free = () => { let x, y; do { x = 20 + Math.random() * (W - 40); y = 20 + Math.random() * (H - 40) } while (inWall(x, y, R + 4)); return { x, y } }
  let tank = { ...free(), a: 0 }, shells = [], dead = 0, reload = 0, counted = new Set()
  const held = new Set()
  let aim = null // a finger or the mouse held on the field: drive there
  const KEYS = { ArrowUp: 'up', w: 'up', ArrowDown: 'back', s: 'back', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ' ': 'fire' }
  const key = (e) => { const k = KEYS[e.key]; if (k) { e.preventDefault(); e.type === 'keydown' ? held.add(k) : held.delete(k) } }
  addEventListener('keydown', key)
  addEventListener('keyup', key)
  const point = (e) => { const r = canvas.getBoundingClientRect(); aim = e.buttons ? { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height } : null }
  canvas.onpointerdown = canvas.onpointermove = point
  canvas.onpointerup = () => { aim = null }
  const shoot = () => {
    if (dead || reload > 0) return
    reload = RELOAD
    shells.push({ id: crypto.randomUUID().slice(0, 8), x: tank.x + Math.cos(tank.a) * R, y: tank.y + Math.sin(tank.a) * R, vx: Math.cos(tank.a) * SHELL, vy: Math.sin(tank.a) * SHELL })
  }
  fire.onclick = shoot

  const drawTank = ({ x, y, a }, color) => {
    g.save(); g.translate(x, y); g.rotate(a)
    g.fillStyle = '#2a2d33' // treads, with their links
    g.fillRect(-R, -R, R * 2, 6); g.fillRect(-R, R - 6, R * 2, 6)
    g.fillStyle = '#5c616b'
    for (let k = -R + 1; k < R; k += 4) { g.fillRect(k, -R + 1, 2, 4); g.fillRect(k, R - 5, 2, 4) }
    tile(g, -R + 2, -R + 5, R * 2 - 4, R * 2 - 10, color)
    g.fillStyle = color; g.fillRect(0, -2.5, R * 1.5, 5)
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0.5, R * 1.5, 2)
    g.beginPath(); g.arc(0, 0, R * 0.45, 0, Math.PI * 2); g.fill()
    g.restore()
  }
  const stopLoop = loop(f, 'tanks', 20, (dt) => {
    const others = playing(f, 'tanks')
    reload -= dt
    if (dead && (dead -= dt) <= 0) { dead = 0; tank = { ...free(), a: tank.a } }
    if (!dead) {
      let turn = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0)
      let go = held.has('up') ? 1 : held.has('back') ? -0.6 : 0
      if (aim) {
        const off = bearing(tank, aim) - tank.a, d = Math.atan2(Math.sin(off), Math.cos(off))
        turn = Math.max(-1, Math.min(1, d * 4))
        go = Math.abs(d) < 0.6 && !near(aim, tank, 14) ? 1 : 0
      }
      tank.a += turn * TURN * dt
      const nx = tank.x + Math.cos(tank.a) * SPEED * go * dt, ny = tank.y + Math.sin(tank.a) * SPEED * go * dt
      if (!inWall(nx, ny, R)) Object.assign(tank, { x: nx, y: ny })
      if (held.has('fire')) shoot()
      for (const p of others) for (const s of p.state.shells ?? []) {
        const at = flight(s, age(s.id))
        if (at && near(at, tank, R) && !counted.has(s.id)) {
          counted.add(s.id)
          dead = 1.5
          f.transact(() => { bump(T().kills, p.userId); bump(T().deaths, me()) })
        }
      }
    }
    const shown = others.map((p) => ({ p, at: p.state.tank && smooth(p.id, p.state.tank.x, p.state.tank.y, dt) }))
    shells = shells.filter((s) => { const at = flight(s, age(s.id)); return at && !shown.some(({ at: t }) => t && near(at, t, R)) })

    g.fillStyle = PAL.screen; g.fillRect(0, 0, W, H)
    g.fillStyle = PAL.grid
    for (let x = 0; x < W; x += 32) g.fillRect(x, 0, 1, H)
    for (let y = 0; y < H; y += 32) g.fillRect(0, y, W, 1)
    for (const [x, y, w, h] of WALLS) brickwork(g, x, y, w, h)
    for (const { p, at } of shown) if (at) drawTank({ ...at, a: p.state.tank.a }, p.color || PAL.them)
    if (!dead) drawTank(tank, f.presence.self.color || PAL.me)
    g.fillStyle = PAL.shot
    for (const s of [...shells, ...others.flatMap((p) => p.state.shells ?? [])]) { const at = flight(s, age(s.id)); if (at) g.fillRect(at.x - 2, at.y - 2, 4, 4) }
    scanlines(g, W, H)
    const score = (id) => `${nameOf(id)} ${T().kills[id] ?? 0}/${T().deaths[id] ?? 0}`
    line.textContent = `${dead ? t.respawn : ''}${t.tankScore}${t.sep}${[me(), ...others.map((p) => p.userId)].map(score).join(t.sep)}`
    return { tank: dead ? null : tank, shells }
  })
  return () => { stopLoop(); stop(); removeEventListener('keydown', key); removeEventListener('keyup', key) }
}
