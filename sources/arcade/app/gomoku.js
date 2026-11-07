// 五子棋: turn-based, so the file is the whole game — stones keyed by cell, whose turn follows from how many.
// Presence only shows where the other player is hovering.
import { board, slot } from './net.js'

export const title = '五子棋'
const N = 15, CELL = 28, PAD = CELL / 2

export const turn = (stones) => (Object.keys(stones).length % 2 ? 'w' : 'b')

/** Whether colour `c` can be taken: nobody sits there, or whoever sat there has left (`here` says who is still in). */
export const open = (seats, c, here) => !seats[c] || !here(seats[c])

/** The next game's seats: the colours swap, and whoever has left gets up. */
export const swapped = ({ b, w }, here) => Object.fromEntries([['b', w], ['w', b]].filter(([, id]) => id && here(id)))

/** Whether the stone at x,y completes five (or more) in a row. */
export function fiveInRow(stones, x, y) {
  const c = stones[`${x},${y}`]
  return [[1, 0], [0, 1], [1, 1], [1, -1]].some(([dx, dy]) => {
    let n = 1
    for (const s of [1, -1]) for (let k = 1; stones[`${x + dx * k * s},${y + dy * k * s}`] === c; k++) n++
    return n >= 5
  })
}

export function mount(stage, { f, nameOf }) {
  const G = slot(f, 'gomoku', { stones: {}, seats: {}, winner: null })
  const me = () => f.presence.self.userId
  const here = (id) => id === me() || f.presence.others.some((p) => p.userId === id)
  const canvas = document.createElement('canvas')
  const line = document.createElement('p')
  const actions = document.createElement('div')
  actions.className = 'row'
  stage.append(line, canvas, actions)
  const { g, stop } = board(canvas, N * CELL, N * CELL, () => draw())

  const cellAt = (e) => {
    const r = canvas.getBoundingClientRect(), s = r.width / (N * CELL)
    const x = Math.floor((e.clientX - r.left) / s / CELL), y = Math.floor((e.clientY - r.top) / s / CELL)
    return x >= 0 && y >= 0 && x < N && y < N ? [x, y] : null
  }
  canvas.onpointermove = (e) => f.presence.set({ game: 'gomoku', hover: cellAt(e) })
  canvas.onclick = (e) => {
    const game = G(), at = cellAt(e), c = turn(game.stones)
    if (!at || game.winner || game.seats[c] !== me() || game.stones[at.join()]) return
    f.transact(() => {
      game.stones[at.join()] = c
      if (fiveInRow(game.stones, ...at)) game.winner = me()
    })
  }

  const button = (text, onclick, primary) => {
    const b = document.createElement('button')
    b.textContent = text
    b.onclick = onclick
    if (primary) b.className = 'primary'
    return b
  }
  const seat = (c) => G().seats[c] === me()
    ? button(c === 'b' ? '离开黑座' : '离开白座', () => f.transact(() => { delete G().seats[c] }))
    : open(G().seats, c, here) ? button(c === 'b' ? '执黑' : '执白', () => f.transact(() => { G().seats[c] = me() }), true) : null
  const again = () => f.transact(() => {
    const game = G()
    game.stones = {}
    game.winner = null
    game.seats = swapped(game.seats, here)
  })

  const stone = (x, y, c, alpha = 1) => {
    const cx = PAD + x * CELL, cy = PAD + y * CELL, r = CELL * 0.43
    const shine = g.createRadialGradient(cx - r / 3, cy - r / 3, r / 6, cx, cy, r) // stones are black and white in either theme
    shine.addColorStop(0, c === 'b' ? '#5a5d63' : '#ffffff')
    shine.addColorStop(1, c === 'b' ? '#0e0f11' : '#c9c6bd')
    g.globalAlpha = alpha
    g.beginPath()
    g.arc(cx, cy, r, 0, Math.PI * 2)
    g.fillStyle = shine
    g.fill()
    g.globalAlpha = 1
  }
  const draw = () => {
    const game = G()
    g.fillStyle = '#dcae5f' // a wooden board in either theme
    g.fillRect(0, 0, N * CELL, N * CELL)
    g.strokeStyle = '#5b3d16'
    g.globalAlpha = 0.75
    for (let i = 0; i < N; i++) {
      g.beginPath(); g.moveTo(PAD, PAD + i * CELL); g.lineTo(PAD + (N - 1) * CELL, PAD + i * CELL); g.stroke()
      g.beginPath(); g.moveTo(PAD + i * CELL, PAD); g.lineTo(PAD + i * CELL, PAD + (N - 1) * CELL); g.stroke()
    }
    g.fillStyle = '#5b3d16'
    for (const [x, y] of [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]) g.fillRect(PAD + x * CELL - 2.5, PAD + y * CELL - 2.5, 5, 5)
    g.globalAlpha = 1
    for (const [key, c] of Object.entries(game.stones)) stone(...key.split(',').map(Number), c)
    for (const p of f.presence.others) if (p.state?.game === 'gomoku' && p.state.hover && !game.stones[p.state.hover.join()]) stone(...p.state.hover, turn(game.stones), 0.4)
    const c = turn(game.stones), who = (k) => (!game.seats[k] ? '空位' : here(game.seats[k]) ? nameOf(game.seats[k]) : `${nameOf(game.seats[k])}（已离开）`)
    line.textContent = game.winner
      ? `${nameOf(game.winner)} 赢了`
      : `黑：${who('b')}　白：${who('w')}　· 轮到${c === 'b' ? '黑' : '白'}${game.seats[c] === me() ? '（你）' : ''}`
    actions.replaceChildren(...[seat('b'), seat('w'), game.winner || Object.keys(game.stones).length ? button('再来一局', again) : null].filter(Boolean))
  }
  const offs = [f.onChange(draw), f.presence.onChange(draw)]
  draw()
  return () => { offs.forEach((off) => off()); stop() }
}
