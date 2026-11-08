// 文字江湖's page: the chat's world (its chatFile) as a MUD screen — where you stand, what was said and done here, a
// line to type in. Every command goes through game.js, as the agents' do through tools.js; what lasts goes into the
// file, presence only says who has the page open. A person speaking to an agent, naming it, handing it something or
// attacking it wakes it with a whisper (game.js wakes); nothing else does.
import { missing, apply, join, run, parse, lookText, linesSince, lastKey, wakes, wakeText, START } from './game.js'
import { ROOMS, peopleIn, thingGroups, nameOf, isNpc, npcData } from './world.js'

const $ = (sel) => document.querySelector(sel)
const ctx = await window.gugu.getContext()

/** An element with text (never markup: others wrote it) and children; the host's own elements read attributes. */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) tag.includes('-') ? el.setAttribute(k, v) : (el[k] = v)
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false))
  return el
}

function fail(what, e) {
  const message = `${what}：${e?.message ?? e}`
  $('#status').setAttribute('role', 'alert')
  $('#status').textContent = message
  window.gugu.reportError(message).catch((err) => console.error('reportError failed', err))
}

if (!ctx.file) {
  $('#world').replaceChildren(h('gugu-empty', { icon: 'compass' }, h('strong', {}, '在群里打开'), h('small', {}, '群聊 → 应用 → 文字江湖：群里的人和 agent 一起在东方故事 2 的雪亭镇闯荡。')))
} else {
  const f = await window.gugu.files.open(ctx.file)
  // Names as the chat shows them now (the context's copy can be older: a task renamed since).
  const fresh = await window.gugu.chats.members({ chat: f.entry.chat }).then((r) => r.members, () => ctx.chat?.members ?? [])
  const members = new Map(fresh.map((m) => [m.id, m.name]))
  let me = f.presence.self.userId || null
  // The last log line this page has shown: what comes after it is new.
  let shown = ''
  let joined = false

  const lacking = missing(f.data)
  if (lacking.length) f.transact(() => apply(f.data, lacking))

  /** A line in the scroll: `kind` cmd (what I typed), me (my result), ev (others), sys. */
  const log = $('#log')
  function say(text, kind) {
    for (const part of String(text).split('\n')) log.append(h('p', { className: kind }, part))
    while (log.childElementCount > 300) log.firstElementChild.remove()
    log.scrollTop = log.scrollHeight
  }

  function enter() {
    me ||= f.presence.self.userId || null
    if (!me || joined) return
    joined = true
    shown = '\uffff' // the join's own change shows nothing: the room and its recent lines follow below
    const name = f.presence.self.name || members.get(me) || null
    const ops = join(f.toJSON(), me, { name })
    // An agent renamed since it last played shows under its new name.
    for (const [id, p] of Object.entries(f.data.players ?? {})) if (id !== me && members.get(id) && members.get(id) !== p.name) ops.push([['players', id, 'name'], members.get(id)])
    if (ops.length) f.transact(() => apply(f.data, ops))
    const s = f.toJSON()
    say(lookText(s, me, Date.now()), 'me')
    const room = s.players[me]?.room ?? START
    const recent = linesSince(s, me, room, '', 8)
    if (recent.length) {
      say('—— 刚才这里：', 'sys')
      for (const l of recent) say(l.text, 'ev')
    }
    shown = lastKey(s)
    draw()
  }

  /** What others did since this page last looked, where I stand. */
  function catchUp() {
    if (!joined) return
    const s = f.toJSON()
    const room = s.players[me]?.room ?? START
    for (const l of linesSince(s, me, room, shown)) say(l.text, 'ev')
    shown = lastKey(s)
  }

  async function command(line) {
    if (!joined) return
    // A line that is no command is something said: people chat, agents type commands.
    const text = parse(line).verb === null && line.trim() ? `说 ${line.trim()}` : line
    catchUp()
    say(`> ${line}`, 'cmd')
    const r = run(f.toJSON(), me, text)
    f.transact(() => apply(f.data, r.ops))
    say(r.reply, 'me')
    shown = lastKey(f.toJSON())
    draw()
    const s = f.toJSON()
    for (const ev of r.events) {
      for (const agent of wakes(s, ev)) {
        window.gugu.dispatch(wakeText(s, ev, agent), { to: { chat: f.entry.chat, member: agent }, refs: [{ file: f.entry }] })
          .catch((e) => fail(`没叫醒${s.players[agent]?.name ?? 'agent'}`, e))
      }
    }
  }

  const QUICK = ['看', '背包', '状态', '技能', '时间', '谁', '帮助']
  const go = (line) => () => command(line).catch((e) => fail('没做成', e))
  const fill = (text) => () => { $('#line').value = text; $('#line').focus() }
  const bar = (label, [cur, eff, max = eff]) => h('span', { className: 'stat', title: `${label} ${cur}/${eff}/${max}` },
    label, h('meter', { min: 0, max, low: max * 0.3, high: max * 0.6, optimum: max, value: cur }), `${cur}`)

  function draw() {
    const s = f.toJSON()
    const p = s.players?.[me]
    const room = p?.room in ROOMS ? p.room : START
    const r = ROOMS[room]
    $('#room').textContent = r.name
    $('#exits').replaceChildren(...Object.entries(r.exits).map(([d, to]) => h('button', { type: 'button', onclick: go(d), title: ROOMS[to].name }, `${d} · ${ROOMS[to].name}`)))
    $('#stats').replaceChildren(...(p ? [bar('精', p.gin), bar('气', p.kee), bar('神', p.sen), bar('形体', p.hp)] : []), ...(p?.ghost ? [h('strong', {}, '鬼魂')] : []))
    const shop = peopleIn(s, room).some((id) => isNpc(id) && npcData(id).sells)
    $('#here').replaceChildren(
      ...peopleIn(s, room).filter((id) => id !== me).map((id) => isNpc(id)
        ? h('button', { type: 'button', className: 'chip npc', onclick: go(`看 ${npcData(id).name}`) }, h('gugu-icon', { name: 'user' }), npcData(id).name)
        : h('button', { type: 'button', className: 'chip', onclick: fill(`对 ${s.players[id].name} 说 `) }, h('gugu-avatar', { user: id, size: 'xs' }), nameOf(s, id))),
      ...thingGroups(s, room).map(([tid, text]) => h('button', { type: 'button', className: 'chip item', onclick: go(`看 ${nameOf(s, tid)}`) }, h('gugu-icon', { name: 'archive' }), text)),
    )
    $('#quick').replaceChildren(...[...QUICK.slice(0, 4), ...(shop ? ['清单'] : []), ...QUICK.slice(4)].map((w) => h('button', { type: 'button', onclick: go(w) }, w)))
    const online = new Set([me, ...f.presence.others.map((q) => q.userId)])
    $('#people').replaceChildren(...Object.entries(s.players ?? {})
      .sort(([a, pa], [b, pb]) => Number(online.has(b) || !!pb.agent) - Number(online.has(a) || !!pa.agent) || (pb.at ?? 0) - (pa.at ?? 0))
      .map(([id, q]) => h('li', {},
        h('gugu-avatar', { user: id }),
        h('div', {}, h('strong', {}, id === me ? `${q.name}（你）` : q.name), h('span', {}, `${ROOMS[q.room]?.name ?? ''}${q.ghost ? ' · 鬼魂' : ''}`)),
        h('small', { className: online.has(id) ? 'on' : 'muted' }, q.agent ? 'agent' : online.has(id) ? '在线' : '离开'))))
  }

  $('#say').onsubmit = (ev) => {
    ev.preventDefault()
    const line = $('#line').value
    $('#line').value = ''
    command(line).catch((e) => fail('没做成', e))
  }

  f.onChange(() => { enter(); catchUp(); draw() })
  f.presence.onChange(() => { enter(); draw() })
  f.onStatus(() => {
    document.body.dataset.file = f.status
    if (f.status === 'gone') $('#status').textContent = '江湖的文件不在了'
  })
  window.gugu.setTabTitle('文字江湖').catch(() => {}) // only the tab's name
  enter()
  draw()
}
