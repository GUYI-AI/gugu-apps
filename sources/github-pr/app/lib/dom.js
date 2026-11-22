/** An element with text set as text, never as HTML: everything shown comes from GitHub or a card's untrusted data. */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') el.textContent = value
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value)
    else if (value !== undefined && value !== null) el.setAttribute(key, String(value))
  }
  for (const child of children) if (child !== null && child !== undefined && child !== false) el.append(child)
  return el
}
