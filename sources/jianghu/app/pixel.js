// The pixel pieces of the page: the status HUD (hearts, bolts, drumsticks, drops in rows of ten; 内力 and 法力 as thin
// bars) and the icons it draws with. All drawn here, 9×9, one letter a colour; '.' is clear.
const SVG = 'http://www.w3.org/2000/svg'
const ICONS = {
  hp: { rows: ['.KK...KK.', 'KrrK.KrrK', 'KrwrKrrrK', 'KrrrrrrrK', 'KrrrrrrrK', '.KrrrrrK.', '..KrrrK..', '...KrK...', '....K....'],
    on: { K: '#3a0b0d', r: '#e0262f', w: '#ffd2d2' }, off: { K: '#2a2a2a', r: '#5b2a2c', w: '#6e3a3c' } },
  sen: { rows: ['.....KKK.', '....KyyK.', '...KyyK..', '..KywyKK.', '.KyyyyyyK', '.KKKyyyK.', '...KyyK..', '..KyyK...', '..KKK....'],
    on: { K: '#3d2a00', y: '#ffd23a', w: '#fff6c4' }, off: { K: '#2a2a2a', y: '#5a4c1e', w: '#6a5c2e' } },
  food: { rows: ['......KK.', '.....KwwK', '....KwwK.', '..KKKKK..', '.KbbbbK..', 'KbhbbbK..', 'KbbbbK...', 'KbbbK....', '.KKK.....'],
    on: { K: '#3b1e08', b: '#c8742c', h: '#f0b070', w: '#f4ece0' }, off: { K: '#2a2a2a', b: '#5a3e26', h: '#6a4e36', w: '#6a6a6a' } },
  water: { rows: ['....K....', '...KbK...', '...KbK...', '..KbbbK..', '.KbwbbbK.', '.KbwbbbK.', '.KbbbbbK.', '..KbbbK..', '...KKK...'],
    on: { K: '#0b2140', b: '#3a8ef0', w: '#cfe6ff' }, off: { K: '#2a2a2a', b: '#24405e', w: '#34506e' } },
  force: { rows: ['....K....', '...KoK...', '..KoyoK..', '..KoyoK.K', '.KoyyyoKK', '.KoyyyyoK', 'KoyywyyoK', '.KoyyyoK.', '..KKKKK..'],
    on: { K: '#3b1300', o: '#f06a1a', y: '#ffc23a', w: '#fff4c0' } },
  mana: { rows: ['....K....', '...KpK...', 'KKKKpKKKK', 'KppppwppK', '.KpppppK.', '..KpppK..', '.KppKppK.', '.KpK.KpK.', '.KK...KK.'],
    on: { K: '#24093b', p: '#a04af0', w: '#f0d8ff' } },
}

/** One icon as an <svg>, in its own colours or greyed (`off`); `half` shows only its left half. */
function icon(key, look = 'on', half = false) {
  const { rows, ...looks } = ICONS[key]
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('viewBox', '0 0 9 9')
  svg.setAttribute('shape-rendering', 'crispEdges')
  if (half) svg.style.clipPath = 'inset(0 50% 0 0)'
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return
    const px = document.createElementNS(SVG, 'rect')
    for (const [k, v] of Object.entries({ x, y, width: 1, height: 1, fill: looks[look][c] })) px.setAttribute(k, v)
    svg.append(px)
  }))
  return svg
}

const el = (tag, className, ...children) => { const e = document.createElement(tag); e.className = className; e.append(...children); return e }

/** A row of ten, each a tenth of the whole, in halves; low when three or fewer are left. */
function row([label, { cur, max }, key]) {
  const halves = max ? Math.max(0, Math.min(20, Math.round((cur / max) * 20))) : 0
  const cells = Array.from({ length: 10 }, (_, i) => el('i', '', icon(key, 'off'),
    ...(halves >= (i + 1) * 2 ? [icon(key)] : halves === i * 2 + 1 ? [icon(key, 'on', true)] : [])))
  const r = el('div', `hud-row ${key}${halves <= 6 ? ' low' : ''}`, ...cells)
  r.title = `${label} ${cur}/${max}`
  return r
}

/** A thin bar with its icon and number, for 内力 and 法力. */
function thin([label, { cur, max }, key]) {
  const fill = el('u', '')
  fill.style.width = `${Math.round(Math.min(1, max ? cur / max : 0) * 100)}%`
  const b = el('div', `hud-thin ${key}`, icon(key), el('i', '', fill), el('b', '', `${label} ${cur}`))
  b.title = `${label} ${cur}/${max}`
  return b
}

/** statBars(p) as the HUD: hearts and bolts on the left, food and water on the right (from the right), thin bars below. */
export function hud(bars) {
  const by = (keys) => bars.filter(([, , k]) => keys.includes(k))
  const thins = by(['force', 'mana'])
  return [el('div', 'hud-l', ...by(['hp', 'sen']).map(row)), el('div', 'hud-r', ...by(['food', 'water']).map(row)),
    ...(thins.length ? [el('div', 'hud-x', ...thins.map(thin))] : [])]
}
