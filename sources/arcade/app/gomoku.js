// 五子棋: turn-based, so the file is the whole game — stones keyed by cell, whose turn follows from how many.
// Presence only shows where the other player is hovering.
import { board, slot } from './net.js'

export const title = '五子棋'
const N = 15, CELL = 28, PAD = CELL / 2

export const turn = (stones) => (Object.keys(stones).length % 2 ? 'w' : 'b')

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
  const canvas = document.createElement('canvas')
  const line = document.createElement('p')
  const actions = document.createElement('div')
  actions.className = 'row'
  stage.append(line, canvas, actions)
  const { g, ink, stop } = board(canvas, N * CELL, N * CELL)

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
  const seat = (c) => G().seats[c]
    ? null
    : button(c === 'b' ? '执黑' : '执白', () => { G().seats[c] ??= me() }, true)
  const again = () => f.transact(() => {
    const game = G(), { b, w } = game.seats
    game.stones = {}
    game.winner = null
    game.seats = Object.fromEntries([['b', w], ['w', b]].filter(([, id]) => id)) // swap colours each game
  })

  const stone = (x, y, c, alpha = 1) => {
    g.globalAlpha = alpha
    g.beginPath()
    g.arc(PAD + x * CELL, PAD + y * CELL, CELL * 0.42, 0, Math.PI * 2)
    g.fillStyle = c === 'b' ? '#1a1c1f' : '#fafafa' // stones are black and white in either theme
    g.fill()
    g.strokeStyle = ink('foreground-muted')
    g.stroke()
    g.globalAlpha = 1
  }
  const draw = () => {
    const game = G()
    g.clearRect(0, 0, N * CELL, N * CELL)
    g.strokeStyle = ink('foreground-passive')
    g.globalAlpha = 0.5
    for (let i = 0; i < N; i++) {
      g.beginPath(); g.moveTo(PAD, PAD + i * CELL); g.lineTo(PAD + (N - 1) * CELL, PAD + i * CELL); g.stroke()
      g.beginPath(); g.moveTo(PAD + i * CELL, PAD); g.lineTo(PAD + i * CELL, PAD + (N - 1) * CELL); g.stroke()
    }
    g.globalAlpha = 1
    for (const [key, c] of Object.entries(game.stones)) stone(...key.split(',').map(Number), c)
    for (const p of f.presence.others) if (p.state?.game === 'gomoku' && p.state.hover && !game.stones[p.state.hover.join()]) stone(...p.state.hover, turn(game.stones), 0.3)
    const c = turn(game.stones), who = (k) => (game.seats[k] ? nameOf(game.seats[k]) : '空位')
    line.textContent = game.winner
      ? `${nameOf(game.winner)} 赢了`
      : `黑：${who('b')}　白：${who('w')}　· 轮到${c === 'b' ? '黑' : '白'}${game.seats[c] === me() ? '（你）' : ''}`
    actions.replaceChildren(...[seat('b'), seat('w'), game.winner || Object.keys(game.stones).length ? button('再来一局', again) : null].filter(Boolean))
  }
  const offs = [f.onChange(draw), f.presence.onChange(draw)]
  draw()
  return () => { offs.forEach((off) => off()); stop() }
}
