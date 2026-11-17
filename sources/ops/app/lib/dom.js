export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') el.textContent = value
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value)
    else if (value !== undefined && value !== null) el.setAttribute(key, String(value))
  }
  for (const child of children) if (child !== null && child !== undefined) el.append(child)
  return el
}
export function say(el, message) { el.textContent = message; el.hidden = !message }
export function link(url, label) {
  if (!/^(https:\/\/|gugu-(?:chat|file|widget):\/\/)/.test(url)) return h('span', { text: label })
  return h('a', { href: url, text: label })
}
