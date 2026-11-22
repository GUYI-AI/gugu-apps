// The PR's changes, file by file, in the host's xl dialog: one page of GitHub's file list at a time (100 files), each
// patch drawn line by line with the host's tokens. Read when the dialog opens, never again on its own.
import { read } from './lib/github.js'
import { h } from './lib/dom.js'

const g = window.gugu
const { data } = (await g.getContext()).modal ?? {}
const root = document.getElementById('dlg')
/** A patch past this many lines starts folded: opening it is the person's choice. */
const FOLD_LINES = 400
const pages = Math.max(1, Math.ceil((data?.files ?? 0) / 100))
let page = 0

function patchOf(text) {
  const pre = h('pre', { class: 'diff' })
  for (const line of text.split('\n')) {
    const kind = line.startsWith('@@') ? 'hunk' : line[0] === '+' ? 'ins' : line[0] === '-' ? 'rem' : 'ctx'
    pre.append(h('span', { class: kind, text: line || ' ' }))
  }
  return pre
}

function fileRow(file) {
  const parts = file.filename.split('/')
  const lines = file.patch ? file.patch.split('\n').length : 0
  const details = h('details', {},
    h('summary', {}, h('gugu-icon', { name: 'file-diff' }),
      h('span', { class: 'path', title: file.filename }, h('strong', { text: parts.pop() }), ' ', h('small', { class: 'muted', text: parts.join('/') })),
      file.status === 'renamed' ? h('small', { class: 'muted', text: '改名' }) : null,
      h('small', { class: 'add', text: `+${file.additions}` }), h('small', { class: 'del', text: `−${file.deletions}` })),
    h('div', { class: 'patch' }))
  const body = details.querySelector('.patch')
  const fill = () => {
    if (body.childElementCount) return
    body.append(file.patch ? patchOf(file.patch) : h('small', { class: 'muted', text: file.status === 'removed' ? '整个文件删除' : '二进制文件或改动太大，GitHub 没给出 diff' }))
  }
  details.addEventListener('toggle', () => { if (details.open) fill() })
  if (lines && lines <= FOLD_LINES) { details.open = true; fill() }
  return details
}

const list = h('div', { class: 'files' })
const more = h('button', { onclick: () => next() }, '再读 100 个文件')
async function next() {
  page += 1
  more.disabled = true
  try {
    const files = await read(`/repos/${data.repo}/pulls/${data.number}/files?per_page=100&page=${page}`)
    for (const file of files) list.append(fileRow(file))
    more.hidden = page >= pages || files.length < 100
  } catch (error) {
    list.append(h('p', { role: 'alert', class: 'bad', text: error.message }))
  } finally { more.disabled = false }
}

if (!data?.repo) {
  root.replaceChildren(h('p', { role: 'alert', text: '从 PR 卡片打开这里' }))
} else {
  root.replaceChildren(
    h('div', { class: 'bar' }, h('h3', {}, `#${data.number} · ${data.files} 个文件 `, h('span', { class: 'add', text: `+${data.additions}` }), ' ', h('span', { class: 'del', text: `−${data.deletions}` })),
      h('button', { 'aria-label': '在 GitHub 打开', onclick: () => g.openBrowserTab(`https://github.com/${data.repo}/pull/${data.number}/files`).catch((e) => g.reportError(e.message)) }, h('gugu-icon', { name: 'external-link' }))),
    h('small', { class: 'muted', text: `head ${String(data.head).slice(0, 7)}` }),
    list, more)
  await next()
}
