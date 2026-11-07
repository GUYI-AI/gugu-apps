// 联机小游戏: one page, one file per group (its chatFile). Each tab is a game module that mounts on the stage;
// how they share the file and presence is all in net.js.
import * as gomoku from './gomoku.js'
import * as snake from './snake.js'
import * as tanks from './tanks.js'
import * as bomber from './bomber.js'

const GAMES = { gomoku, snake, tanks, bomber }
const tabs = document.querySelector('[role=tablist]')
const stage = document.querySelector('#stage')
const ctx = await window.gugu.getContext()

if (!ctx.file) {
  stage.innerHTML = '<gugu-empty icon="gamepad-2"><strong>在群里打开</strong><small>群聊 → 应用 → 联机小游戏，群里的人一起玩</small></gugu-empty>'
} else {
  const f = await window.gugu.files.open(ctx.file)
  const names = new Map((ctx.chat?.members ?? []).map((m) => [m.id, m.name]))
  const here = (id) => (id === f.presence.self.userId ? f.presence.self : f.presence.others.find((p) => p.userId === id))
  const room = { f, nameOf: (id) => here(id)?.name ?? names.get(id) ?? '已离开的成员' }
  let current = null
  let stop = () => {}
  const show = (name) => {
    stop()
    current = name
    localStorage.setItem('game', name)
    f.presence.set({ game: name })
    stage.replaceChildren()
    stop = GAMES[name].mount(stage, room)
    drawTabs()
  }
  const drawTabs = () => tabs.replaceChildren(...Object.entries(GAMES).map(([name, game]) => {
    const here = f.presence.others.filter((p) => p.state?.game === name).length + (name === current ? 1 : 0)
    const b = document.createElement('button')
    b.setAttribute('role', 'tab')
    b.setAttribute('aria-selected', String(name === current))
    b.textContent = here ? `${game.title} · ${here}` : game.title
    b.onclick = () => show(name)
    return b
  }))
  setInterval(drawTabs, 1000)
  f.onStatus(() => { document.body.dataset.file = f.status })
  show(GAMES[localStorage.getItem('game')] ? localStorage.getItem('game') : 'snake')
}
