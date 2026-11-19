// 多人贪吃蛇: my snake lives in my presence and moves on my page; the food and the best scores are in the file.
// I die when my head hits a wall, myself, or anyone's body as I see it — judged here, by me.
import { PAL, board, directions, eyes, loop, playing, scanlines, slot, tile } from './net.js'

const W = 30, H = 22, CELL = 16, FOODS = 3

export const same = (a, b) => a[0] === b[0] && a[1] === b[1]
export const hits = (head, cells) => cells.some((c) => same(head, c))
export const outside = ([x, y]) => x < 0 || y < 0 || x >= W || y >= H
const anywhere = () => [Math.floor(Math.random() * W), Math.floor(Math.random() * H)]

export function mount(stage, { f, t, nameOf }) {
  const S = slot(f, 'snake', { food: {}, best: {} })
  const me = () => f.presence.self.userId
  const canvas = document.createElement('canvas')
  const line = document.createElement('p')
  const scores = document.createElement('ul')
  scores.className = 'list scores'
  stage.append(line, canvas, scores)
  const { g, stop } = board(canvas, W * CELL, H * CELL)

  let body = null, dir = [1, 0], next = dir, score = 0
  const spawn = () => {
    const [x, y] = [3 + Math.floor(Math.random() * (W - 10)), 2 + Math.floor(Math.random() * (H - 4))]
    body = [[x, y], [x - 1, y], [x - 2, y]]
    dir = next = [1, 0]
    score = 0
  }
  const die = () => {
    const best = Math.max(S().best[me()] ?? 0, score)
    if (best > (S().best[me()] ?? 0)) S().best[me()] = best
    body = null
  }
  const offKeys = directions(canvas, (d) => { if (d[0] !== -dir[0] || d[1] !== -dir[1]) next = d })
  const respawn = (e) => { if (!body && (e.type === 'click' || e.key === ' ' || e.key === 'Enter')) spawn() }
  canvas.addEventListener('click', respawn)
  addEventListener('keydown', respawn)

  const cell = ([x, y], color) => tile(g, x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2, color)
  const apple = ([x, y]) => {
    g.fillStyle = '#e8343c'; g.beginPath(); g.arc((x + 0.5) * CELL, (y + 0.58) * CELL, CELL * 0.36, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#ffb3b3'; g.fillRect(x * CELL + 5, y * CELL + 6, 2, 2)
    g.fillStyle = '#3fbf4a'; g.fillRect(x * CELL + 8, y * CELL + 1, 4, 3)
  }
  const snake = (cells, color) => {
    for (const c of cells) cell(c, color)
    if (cells.length > 1) eyes(g, (cells[0][0] + 0.5) * CELL, (cells[0][1] + 0.5) * CELL, [cells[0][0] - cells[1][0], cells[0][1] - cells[1][1]], CELL)
  }
  const draw = (others) => {
    g.fillStyle = PAL.screen; g.fillRect(0, 0, W * CELL, H * CELL)
    g.fillStyle = PAL.grid
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)
    for (const c of Object.values(S().food)) apple(c)
    for (const p of others) snake(p.state.body ?? [], p.color || PAL.them)
    snake(body ?? [], f.presence.self.color || PAL.me)
    if (!body && performance.now() % 1000 < 600) {
      g.font = '16px "Arcade Start", monospace'; g.textAlign = 'center'; g.fillStyle = PAL.me
      g.fillText('PRESS START', W * CELL / 2, H * CELL / 2)
    }
    scanlines(g, W * CELL, H * CELL)
    line.textContent = body ? t.snakeScore(score) : t.snakeStart
    const live = [{ id: me(), score: body ? score : null }, ...others.map((p) => ({ id: p.userId, score: p.state.body ? p.state.score : null }))]
    const rows = live.map(({ id, score }) => `${nameOf(id)}${t.sep}${score ?? '—'}${t.sep}${t.best} ${S().best[id] ?? 0}`)
    if (scores.textContent !== rows.join('')) scores.replaceChildren(...rows.map((t) => Object.assign(document.createElement('li'), { textContent: t })))
  }

  const stopLoop = loop(f, 'snake', 10, () => {
    const others = playing(f, 'snake')
    // Fixed keys: two pages seeding or eating at once write the same key, so the file keeps exactly FOODS foods.
    for (let i = 0; i < FOODS; i++) S().food[i] ??= anywhere()
    if (body) {
      dir = next
      const head = [body[0][0] + dir[0], body[0][1] + dir[1]]
      if (outside(head) || hits(head, body) || hits(head, others.flatMap((p) => p.state.body ?? []))) die()
      else {
        body.unshift(head)
        const eaten = Object.entries(S().food).find(([, c]) => same(c, head))
        if (eaten) { S().food[eaten[0]] = anywhere(); score++ }
        else body.pop()
      }
    }
    draw(others)
    return { body, score }
  })
  return () => { stopLoop(); offKeys(); stop(); removeEventListener('keydown', respawn) }
}
