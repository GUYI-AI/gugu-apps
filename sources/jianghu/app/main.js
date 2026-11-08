// 文字江湖's page: the chat's world (its chatFile) as a MUD screen — where you stand, what was said and done here, a
// line to type in. Every command goes through game.js, as the agents' do through tools.js; what lasts goes into the
// file, presence only says who has the page open. A person speaking to an agent, naming it, handing it something or
// attacking it wakes it with a whisper (game.js wakes); nothing else does.
import { missing, apply, join, run, parse, lookText, linesSince, lastKey, wakes, wakeText, hintFor, hintStep, wayTo, START } from './game.js'
import { ROOMS, peopleIn, thingGroups, nameOf, isNpc, npcData } from './world.js'
import { gameTime, phaseOf } from './text.js'

// One page, two widths (style.css): a phone gets one column with a small compass by the line to type; a wide window
// gets a side column with the compass, who and what is here, and who is in the town.
const ROOM_TITLES = new Set(Object.values(ROOMS).map((r) => `【${r.name}】`))
const SHICHEN = '子丑寅卯辰巳午未申酉戌亥'
const STATS = [['精', 'gin'], ['气', 'kee'], ['神', 'sen'], ['体', 'hp'], ['食', 'food'], ['水', 'water']]
const COMPASS = ['西北', '北', '东北', '西', null, '东', '西南', '南', '东南']
const EXTRA = ['上', '下', '出去']

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
    // A room's title line says what the header already says.
    for (const part of String(text).split('\n')) if (!ROOM_TITLES.has(part)) log.append(h('p', { className: kind }, part))
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
    markHere()
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

  const go = (line) => () => command(line).catch((e) => fail('没做成', e))
  const fill = (text) => () => { $('#line').value = text; $('#line').focus() }
  const button = (text, onclick, className = '') => h('button', { type: 'button', className, onclick }, text)

  /** 精气神, body, food and water: each a short bar, green, then yellow below 60%, red below 30%. */
  const bar = (p, [label, k]) => {
    const { cur, max } = p[k]
    const r = max ? cur / max : 0
    return h('span', { className: `bar ${r > 0.6 ? 'ok' : r > 0.3 ? 'warn' : 'bad'}`, title: `${label} ${cur}/${max}` },
      h('b', {}, label), h('i', {}, h('u', { style: `width:${Math.round(Math.min(1, r) * 100)}%` })), h('small', {}, `${cur}`))
  }
  /** The exits as a compass around 看 (the names of where they lead when there is room), up, down and out below. */
  const compass = (r, named) => [
    ...COMPASS.map((d) => d === null ? button('看', go('看'), 'center')
      : r.exits[d] ? h('button', { type: 'button', className: 'dir', onclick: go(d), title: ROOMS[r.exits[d]].name }, h('b', {}, d), named ? h('small', {}, ROOMS[r.exits[d]].name) : null)
        : h('span', { className: 'dir off' }, d)),
    ...EXTRA.filter((d) => r.exits[d]).map((d) => h('button', { type: 'button', className: 'dir extra', onclick: go(d) }, h('b', {}, d), named ? h('small', {}, ROOMS[r.exits[d]].name) : null)),
  ]
  /** What one can do with someone or something here, by a click. */
  const actions = (s, id) => isNpc(id)
    ? [['看', go(`看 ${npcData(id).name}`)], ['说话', fill(`对 ${npcData(id).name} 说 `)], ...(npcData(id).sells ? [['买', go('清单')]] : [])]
    : [['说话', fill(`对 ${s.players[id].name} 说 `)], ['组队', go(`组队 ${s.players[id].name}`)], ['比武', go(`比武 ${s.players[id].name}`)]]
  const mark = (s, id) => (isNpc(id) ? h('gugu-icon', { name: 'user' }) : h('gugu-avatar', { user: id, size: 'xs' }))
  const tag = (s, id) => (s.players[id]?.agent ? h('em', {}, 'agent') : null)

  /** The 下一步 line, tapped: its step done. */
  const step = () => { const c = hintStep(f.toJSON(), me); if (c) go(c)() }
  $('#next').onclick = step
  // On a phone, a tapped chip shows what one can do with it, in a row under the chips.
  let picked = null
  const pick = (id) => () => { picked = picked === id ? null : id; draw() }

  /** A newcomer's card on top of the log, until they put it away (theirs to keep, in the file). */
  function guide(p, hint) {
    // Only while the starting errand is still ahead: a player from before this card has no use for it.
    if (!p || p.agent || p.guided || !hint) return null
    const done = () => f.transact(() => { f.data.players[me].guided = true })
    const first = wayTo(p.room, 'store')
    return h('section', { className: 'guide' },
      h('h4', {}, '初到雪亭镇'),
      h('p', {}, '这是群里大家一起玩的文字江湖，群友和 agent 都是江湖中人。'),
      h('ol', {}, h('li', {}, '点方向键走动，点「看」看看四周。'), h('li', {}, '点人物：看看他、跟他说话；有钱了可以买东西。'), h('li', {}, '直接打字就是说话；指令见「帮助」。')),
      h('div', { className: 'row' },
        first ? button('去货栈打工', () => { done(); step() }, 'primary') : null,
        button('看看四周', () => { done(); go('看')() }),
        button('知道了', done)))
  }

  function draw() {
    // The hint and the chips change height under the log; a log read to its end stays at its end.
    const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 8
    const s = f.toJSON()
    const p = s.players?.[me]
    const room = p?.room in ROOMS ? p.room : START
    const r = ROOMS[room]
    const now = Date.now()
    $('#room').textContent = r.name
    $('#clock').textContent = `${SHICHEN[Math.floor(((gameTime(now).hour + 1) % 24) / 2)]}时 · ${phaseOf(now)[2]}`
    $('#stats').replaceChildren(...(p ? STATS.filter(([, k]) => p[k]).map((st) => bar(p, st)) : []), ...(p?.ghost ? [h('strong', {}, '鬼魂')] : []))
    const hint = p ? hintFor(s, me) : null
    // Above the log, not in it: the log scrolls to its newest line, and the card must stay in sight.
    const card = guide(p, hint)
    if (!card) $('#guide').replaceChildren()
    else if (!$('#guide').firstChild) $('#guide').replaceChildren(card)
    $('#next').hidden = !hint
    $('#next').replaceChildren(...(hint ? [h('gugu-icon', { name: 'compass' }), h('span', {}, `下一步：${hint}`)] : []))
    $('#pad').replaceChildren(...compass(r, false))
    $('#compass').replaceChildren(...compass(r, true))
    const others = peopleIn(s, room).filter((id) => id !== me)
    const things = thingGroups(s, room)
    const thingActs = (tid) => [['看', go(`看 ${nameOf(s, tid)}`)], ['拿', go(`拿 ${nameOf(s, tid)}`)]]
    if (picked && !others.includes(picked) && !things.some(([tid]) => tid === picked)) picked = null
    const pickedActs = picked ? (others.includes(picked) ? actions(s, picked) : thingActs(picked)) : []
    $('#here').replaceChildren(
      ...others.map((id) => h('button', { type: 'button', className: `chip${picked === id ? ' on' : ''}`, onclick: pick(id) }, mark(s, id), nameOf(s, id), tag(s, id))),
      ...things.map(([tid, text]) => h('button', { type: 'button', className: `chip${picked === tid ? ' on' : ''}`, onclick: pick(tid) }, h('gugu-icon', { name: 'archive' }), text)),
      ...(picked ? [h('div', { className: 'picked' }, h('span', {}, `${nameOf(s, picked)}：`), pickedActs.map(([a, fn]) => button(a, () => { picked = null; fn() }, 'mini')))] : []))
    $('#here-list').replaceChildren(
      ...others.map((id) => h('li', {}, mark(s, id), h('span', { className: 'who' }, nameOf(s, id), tag(s, id)), h('span', { className: 'acts' }, actions(s, id).map(([a, fn]) => button(a, fn, 'mini'))))),
      ...things.map(([tid, text]) => h('li', {}, h('gugu-icon', { name: 'archive' }), h('span', { className: 'who' }, text),
        h('span', { className: 'acts' }, thingActs(tid).map(([a, fn]) => button(a, fn, 'mini'))))),
      ...(others.length || things.length ? [] : [h('li', { className: 'muted' }, '这里没有别人。')]))
    const shop = others.some((id) => isNpc(id) && npcData(id).sells)
    $('#quick').replaceChildren(...['背包', '状态', '技能', ...(shop ? ['清单'] : []), '帮助'].map((w) => button(w, go(w), 'mini')))
    const online = new Set([me, ...f.presence.others.map((q) => q.userId)])
    const players = Object.entries(s.players ?? {})
      .sort(([a, pa], [b, pb]) => Number(online.has(b) || !!pb.agent) - Number(online.has(a) || !!pa.agent) || (pb.at ?? 0) - (pa.at ?? 0))
    $('#crowd').replaceChildren(...players.slice(0, 3).map(([id]) => h('gugu-avatar', { user: id, size: 'xs' })), `${players.length} 人在江湖`)
    $('#people').replaceChildren(...players.map(([id, q]) => h('li', {},
      h('gugu-avatar', { user: id, size: 'xs' }),
      h('span', { className: 'who' }, id === me ? `${q.name}（你）` : q.name, tag(s, id)),
      h('small', {}, `${ROOMS[q.room]?.name ?? ''}${q.ghost ? ' · 鬼魂' : ''}`),
      h('i', { className: `dot ${q.agent ? 'agent' : online.has(id) ? 'on' : ''}`, title: q.agent ? 'agent' : online.has(id) ? '在线' : '离开' }))))
    if (atEnd) log.scrollTop = log.scrollHeight
  }

  // On a phone the people are a sheet over the page, opened from the header.
  $('#crowd').onclick = () => {
    const open = document.body.dataset.sheet !== 'people'
    document.body.dataset.sheet = open ? 'people' : ''
    $('#crowd').setAttribute('aria-expanded', String(open))
  }

  $('#say').onsubmit = (ev) => {
    ev.preventDefault()
    const line = $('#line').value
    $('#line').value = ''
    command(line).catch((e) => fail('没做成', e))
  }

  f.onChange(() => { enter(); catchUp(); draw() })
  f.presence.onChange(() => { enter(); draw() })
  // Marked here while the page is open (world.js online): only people here can be killed or drawn into a fight.
  function markHere() { if (joined && f.data.players?.[me]) f.transact(() => { f.data.players[me].here = Date.now() }) }
  setInterval(() => { markHere(); draw() }, 60_000) // the clock in the header moves too
  f.onStatus(() => {
    document.body.dataset.file = f.status
    if (f.status === 'gone') $('#status').textContent = '江湖的文件不在了'
  })
  window.gugu.setTabTitle('文字江湖').catch(() => {}) // only the tab's name
  enter()
  draw()
}
