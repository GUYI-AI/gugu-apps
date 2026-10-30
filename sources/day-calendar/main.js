// A time axis: one day in a narrow panel, a week (or one day) in a wide tab. Timed entries are blocks at their hour,
// entries without a time sit in the all-day row. Everything lives in the App's data folder (journal.json); agents add to
// it with the `record` tool, the page changes it through the same program.
(function () {
  const api = window.gugu
  const $ = (id) => document.getElementById(id)
  const FILE = 'journal.json'

  function el(tag, props, ...kids) {
    const n = document.createElement(tag)
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue
        if (k === 'class') n.className = v
        else if (k === 'text') n.textContent = v
        else if (k === 'style') n.style.cssText = v
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v)
        else n.setAttribute(k, v === true ? '' : String(v))
      }
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c)
    return n
  }
  const icon = (name, label) => el('gugu-icon', { name, label })

  const pad = (n) => String(n).padStart(2, '0')
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const dateOf = (k) => {
    const [y, m, d] = k.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const addDays = (k, n) => {
    const d = dateOf(k)
    return keyOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n))
  }
  const minsOf = (hm) => {
    const [h, m] = hm.split(':').map(Number)
    return h * 60 + m
  }
  const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
  const nowMins = () => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }
  // Monday first.
  const weekOf = (k) => {
    const lead = (dateOf(k).getDay() + 6) % 7
    return Array.from({ length: 7 }, (_, i) => addDays(k, i - lead))
  }
  function isoWeek(d) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const w1 = new Date(t.getFullYear(), 0, 4)
    return 1 + Math.round(((t - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7)
  }

  // ---- words ----------------------------------------------------------------
  let en = false
  const W = {
    zh: {
      weekdays: ['一', '二', '三', '四', '五', '六', '日'],
      week: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      wd: ['日', '一', '二', '三', '四', '五', '六'],
      month: (y, m) => `${y}年${m + 1}月`,
      md: (d) => `${d.getMonth() + 1}月${d.getDate()}日`,
      day: (d) => `${d.getMonth() + 1}月${d.getDate()}日 ${W.zh.week[d.getDay()]}`,
      weekRange: (a, b, n) => `第 ${n} 周 · ${W.zh.md(a)} – ${W.zh.md(b)}`,
      rel: { '-1': '昨天', '0': '今天', '1': '明天' },
      today: '今天', allDay: '全天',
      prevMonth: '上个月', nextMonth: '下个月', prevDay: '前一天', nextDay: '后一天', prevWeek: '上一周', nextWeek: '下一周',
      expandMonth: '展开整月', dayMode: '日', weekMode: '周',
      todo: '待办', memory: '记事', doneTodo: '勾掉的待办', agentLegend: 'agent 记的，点开回到那个任务', legend: '图例',
      emptyDay: '这一天还没有记录', emptyWeek: '这一周还没有记录',
      emptyHint: '点时间轴上的空白处加一条，或者在任务里让 agent 帮你记',
      slot: (t) => `${t} 点一下加一条`,
      add: '加一条待办，回车', addHint: '不写时间的待办放在「全天」那一行',
      titlePh: '写一行，回车加上', start: '开始', end: '结束', cancel: '取消', save: '加上', untitled: '新的一条',
      recorded: '记下于', byAgent: 'agent 记的',
      del: '删掉', toggle: '勾选', jump: '回到记下它的任务', close: '关上',
      endAfter: '结束要晚于开始',
      readFail: (m) => `读不到日历：${m}`,
      saveFail: (m) => `没存上：${m}`,
      jumpGone: '任务列表里找不到记下它的那个任务了',
      jumpFail: (m) => `去不了那个任务：${m}`,
    },
    en: {
      weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      wd: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      month: (y, m) => new Date(y, m, 1).toLocaleDateString('en', { year: 'numeric', month: 'long' }),
      md: (d) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      day: (d) => d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
      weekRange: (a, b, n) => `Week ${n} · ${W.en.md(a)} – ${W.en.md(b)}`,
      rel: { '-1': 'Yesterday', '0': 'Today', '1': 'Tomorrow' },
      today: 'Today', allDay: 'All day',
      prevMonth: 'Previous month', nextMonth: 'Next month', prevDay: 'Previous day', nextDay: 'Next day', prevWeek: 'Previous week', nextWeek: 'Next week',
      expandMonth: 'Show the month', dayMode: 'Day', weekMode: 'Week',
      todo: 'To-do', memory: 'Memory', doneTodo: 'Checked to-do', agentLegend: 'Recorded by an agent; opens its task', legend: 'Legend',
      emptyDay: 'Nothing recorded this day', emptyWeek: 'Nothing recorded this week',
      emptyHint: 'Click an empty time to add one, or ask an agent in a task to record it',
      slot: (t) => `${t} click to add`,
      add: 'Add a to-do, press Enter', addHint: 'To-dos without a time go in the all-day row',
      titlePh: 'One line, Enter to add', start: 'Start', end: 'End', cancel: 'Cancel', save: 'Add', untitled: 'New entry',
      recorded: 'Recorded', byAgent: 'Recorded by an agent',
      del: 'Delete', toggle: 'Toggle', jump: 'Go to the task that recorded it', close: 'Close',
      endAfter: 'The end must be after the start',
      readFail: (m) => `Could not read the calendar: ${m}`,
      saveFail: (m) => `Not saved: ${m}`,
      jumpGone: 'The task that recorded it is not in your task list any more',
      jumpFail: (m) => `Could not go to that task: ${m}`,
    },
  }
  const t = () => (en ? W.en : W.zh)

  // ---- state ----------------------------------------------------------------
  let selected = keyOf(new Date())
  let days = {}
  let raw
  let rawOk = true
  // Whether this page is on screen (gugu's layout.visible: a hidden App page still reads its document as visible).
  let shown = true
  // What the bar says: a read error goes once a read succeeds, a save error once a change does.
  let errKind = null
  let errText = ''
  // A wide page shows a week unless the person picked one day.
  let wideMode = 'week'
  let monthOpen = false
  let monthView = null
  // The open card: a new entry being written ({ date, start, end, kind, title }) or an entry shown ({ date, id }).
  let draft = null
  let shownEntry = null
  // The time axis keeps its scroll across redraws; a new range scrolls to its own place.
  let scrollTop = null
  let scrollRange = ''

  const wide = () => window.innerWidth >= 720
  const mode = () => (wide() ? wideMode : 'day')
  const range = () => (mode() === 'week' ? weekOf(selected) : [selected])
  const HOUR = () => (wide() ? 44 : 48)
  const GUTTER = () => (wide() ? 52 : 48)
  // One day's column in pixels: the page less the month rail (wide), the gutter, over the days shown.
  const dayWidth = () => (window.innerWidth - (wide() ? 245 : 0) - GUTTER()) / range().length

  function showErr(msg, kind) {
    errKind = msg ? kind : null
    errText = msg || ''
    const bar = $('err')
    if (bar) {
      bar.hidden = !msg
      bar.textContent = errText
    }
  }

  async function load() {
    let next
    try {
      next = await api.readData(FILE)
    } catch (e) {
      showErr(t().readFail((e && e.message) || String(e)), 'read')
      return false
    }
    if (errKind === 'jump') showErr('')
    if (next === raw) {
      if (errKind === 'read' && rawOk) showErr('')
      return false
    }
    raw = next
    try {
      const v = next ? JSON.parse(next) : null
      days = (v && v.days) || {}
    } catch (e) {
      rawOk = false
      showErr(t().readFail(`${FILE}: ${e.message}`), 'read')
      return false
    }
    rawOk = true
    if (errKind === 'read') showErr('')
    return true
  }

  // Every change goes through the App's own program, the one writer of journal.json, so an agent's
  // record landing at the same moment is never overwritten by this page's copy.
  async function change(tool, args) {
    try {
      const res = await api.callProgram(tool, args)
      if (res && res.isError) {
        const text = (res.content || []).map((c) => c.text || '').join(' ').trim()
        throw new Error(text || tool)
      }
      if (errKind === 'save') showErr('')
    } catch (e) {
      showErr(t().saveFail((e && e.message) || String(e)), 'save')
      // The page already showed the change; draw the file as it is instead.
      raw = undefined
    }
    if (await load()) render()
  }

  // An agent's entry knows its session: a click takes the person there, as a click on it in the task list would.
  const canJump = (e) => !!e.session && typeof api.showSession === 'function'
  function jump(e) {
    api.showSession(e.session).then(() => { if (errKind === 'jump') showErr('') }, (err) => {
      showErr(err && err.code === 'not-found' ? t().jumpGone : t().jumpFail((err && err.message) || String(err)), 'jump')
    })
  }

  function toggleDone(date, e) {
    e.done = !e.done
    render()
    change('set_done', { date, id: e.id, done: e.done })
  }
  function remove(date, e) {
    days[date] = (days[date] || []).filter((x) => x.id !== e.id)
    if (!days[date].length) delete days[date]
    shownEntry = null
    render()
    change('remove', { date, id: e.id })
  }

  // A day's small marks: an open ring while a to-do is left, a filled dot once all are checked, an info dot for memories.
  function marks(k) {
    const list = days[k] || []
    const todos = list.filter((e) => e.kind === 'todo')
    return el('span', { class: 'marks' },
      todos.length ? el('i', { class: todos.some((e) => !e.done) ? 'todo' : 'done' }) : null,
      list.some((e) => e.kind !== 'todo') ? el('i', { class: 'memory' }) : null)
  }

  // ---- the time axis ----------------------------------------------------------
  // Overlapping entries share their day's width side by side: each cluster of overlaps gets as many columns as it needs.
  // An entry without `end` takes half an hour.
  function layout(list) {
    const items = list.filter((e) => e.time).map((e) => {
      const s = minsOf(e.time)
      const end = e.end ? Math.max(minsOf(e.end), s + 15) : s + 30
      return { e, s, end }
    }).sort((a, b) => a.s - b.s || b.end - a.end)
    const clusters = []
    for (const it of items) {
      const c = clusters[clusters.length - 1]
      if (c && it.s < c.end) {
        c.items.push(it)
        c.end = Math.max(c.end, it.end)
      } else clusters.push({ items: [it], end: it.end })
    }
    for (const c of clusters) {
      const cols = []
      for (const it of c.items) {
        let i = cols.findIndex((last) => last <= it.s)
        if (i < 0) { i = cols.length; cols.push(0) }
        cols[i] = it.end
        it.col = i
      }
      for (const it of c.items) it.n = cols.length
    }
    return items
  }

  function block(date, it) {
    const { e, s, end } = it
    const H = HOUR()
    const top = (s / 60) * H
    const height = Math.max(((end - s) / 60) * H - 2, 20)
    const w = 100 / it.n
    const range = e.end ? `${e.time}–${e.end}` : e.time
    // Side by side in a week column too narrow for a check and a few words, a block shows its title only (the check and
    // the agent mark are in its card); hovered or focused it spreads over the whole column with the full title and time.
    const narrow = wide() && mode() === 'week' && it.n > 1 && dayWidth() / it.n < 110
    const oneLine = narrow || height < 34 || it.n > 2
    const check = e.kind === 'todo' && !narrow
      ? el('input', { type: 'checkbox', checked: !!e.done, 'aria-label': t().toggle, onclick: (ev) => { ev.stopPropagation(); toggleDone(date, e) } })
      : null
    const agent = e.by && !narrow ? icon('zap', t().byAgent) : null
    const showTime = !(wide() && mode() === 'week') && it.n === 1
    const kids = narrow
      ? [el('span', { class: 'line' }, el('span', { class: 'title', text: e.title })), el('span', { class: 'sub', text: range })]
      : oneLine
      ? [el('span', { class: 'line' }, check, el('span', { class: 'title', text: e.title }), agent, showTime ? el('span', { class: 'at', text: e.time }) : null)]
      : [el('span', { class: 'line' }, check, el('span', { class: 'title', text: e.title }), agent),
        el('span', { class: 'sub', text: [range, ...(Array.isArray(e.tags) ? e.tags : [])].join(' · ') })]
    const cls = ['ev', e.kind === 'todo' ? 'todo' : 'memory', e.done ? 'done' : '', oneLine ? 'short' : '', narrow ? 'narrow' : '', shownEntry && shownEntry.id === e.id ? 'open' : ''].join(' ')
    return el('div', {
      class: cls, role: 'button', tabindex: '0', 'data-id': e.id, title: `${range} ${e.title}`,
      style: `top:${top + 1}px;height:${height}px;--h:${height}px;left:calc(${it.col * w}% + 2px);width:calc(${w}% - 4px)`,
      onclick: (ev) => { ev.stopPropagation(); openEntry(date, e) },
      onkeydown: (ev) => { if (ev.key === 'Enter' && ev.target === ev.currentTarget) openEntry(date, e) },
      onpointerdown: (ev) => ev.stopPropagation(),
    }, kids)
  }

  function draftBlock() {
    const H = HOUR()
    const s = minsOf(draft.start), end = minsOf(draft.end)
    return el('div', { class: 'ev draft', style: `top:${(s / 60) * H + 1}px;height:${Math.max(((end - s) / 60) * H - 2, 20)}px;left:2px;right:2px` },
      el('span', { class: 'line' }, el('span', { class: 'title', text: draft.title || t().untitled })),
      el('span', { class: 'sub', text: `${draft.start}–${draft.end}` }))
  }

  // Where on the axis a pointer is, in minutes, snapped to `step`.
  function minuteAt(col, ev, step) {
    const y = ev.clientY - col.getBoundingClientRect().top
    return Math.max(0, Math.min(24 * 60 - step, Math.floor(((y / HOUR()) * 60) / step) * step))
  }

  function column(k, keys) {
    const H = HOUR()
    const col = el('div', { class: `col${k === keyOf(new Date()) && keys.length > 1 ? ' today-col' : ''}`, 'data-day': k })
    for (let i = 1; i < 24; i++) col.append(el('div', { class: 'hline', style: `top:${i * H}px` }))
    for (const it of layout(days[k] || [])) col.append(block(k, it))
    if (draft && draft.date === k) col.append(draftBlock())
    if (k === keyOf(new Date())) col.append(el('div', { class: 'now', style: `top:${(nowMins() / 60) * H}px` }))
    // Hover shows where a click lands; pressing and dragging sets the length (mouse); a tap opens an hour (touch).
    const hint = el('div', { class: 'slot-hint', hidden: true, style: `height:${H / 2 - 4}px` }, icon('plus'), el('span'))
    col.append(hint)
    col.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse' || draft || shownEntry || ev.target !== col && !ev.target.classList.contains('hline')) { hint.hidden = true; return }
      const m = minuteAt(col, ev, 30)
      hint.hidden = false
      hint.style.top = `${(m / 60) * H + 2}px`
      hint.lastChild.textContent = t().slot(hm(m))
    })
    col.addEventListener('pointerleave', () => { hint.hidden = true })
    col.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || ev.pointerType !== 'mouse') return
      if (draft || shownEntry) { closeCards(); return }
      ev.preventDefault()
      hint.hidden = true
      const start = minuteAt(col, ev, 30)
      draft = { date: k, start: hm(start), end: hm(Math.min(start + 60, 24 * 60 - 1)), kind: 'todo', title: '' }
      // While the mouse is down only the draft block moves; the page redraws once, when it is let go.
      let live = col.appendChild(draftBlock())
      let moved = false
      const move = (mv) => {
        if (!moved && Math.abs(mv.clientY - ev.clientY) < 4) return
        moved = true
        draft.end = hm(Math.min(Math.max(start + 15, minuteAt(col, mv, 15) + 15), 24 * 60 - 1))
        live.replaceWith(live = draftBlock())
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        render()
        focusDraft()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    })
    col.addEventListener('click', (ev) => {
      if (ev.target !== col && !ev.target.classList.contains('hline')) return
      if (ev.pointerType !== 'touch' && ev.pointerType !== 'pen') return
      if (draft || shownEntry) { closeCards(); return }
      const start = minuteAt(col, ev, 30)
      draft = { date: k, start: hm(start), end: hm(Math.min(start + 60, 24 * 60 - 1)), kind: 'todo', title: '' }
      render()
      focusDraft()
    })
    return col
  }

  // The card beside a block: a new entry's title, time and kind, or an entry's details.
  function cardPlace(keys, date, startMin) {
    const H = HOUR(), gw = GUTTER()
    const top = (startMin / 60) * H
    if (!wide() || keys.length === 1) return `top:${top + H + 6}px;left:${gw + 8}px;right:8px`
    const i = keys.indexOf(date)
    const colW = `(100% - ${gw}px) / ${keys.length}`
    return i >= 2
      ? `top:${top}px;left:calc(${gw}px + ${colW} * ${i} - 296px)`
      : `top:${top}px;left:calc(${gw}px + ${colW} * ${i + 1} + 8px)`
  }

  function draftCard(keys) {
    const tabs = el('div', { role: 'tablist', class: 'kinds' }, ['todo', 'memory'].map((kind) => el('button', {
      type: 'button', role: 'tab', 'aria-selected': String(draft.kind === kind), text: t()[kind],
      onclick: () => { draft.kind = kind; render(); focusDraft() },
    })))
    const timeInput = (key) => el('input', {
      type: 'time', value: draft[key], 'aria-label': t()[key], step: '300',
      onchange: (ev) => { if (ev.target.value) { draft[key] = ev.target.value; render() } },
    })
    const bad = minsOf(draft.end) <= minsOf(draft.start)
    return el('form', {
      class: 'card pop', style: cardPlace(keys, draft.date, minsOf(draft.start)),
      onsubmit: (ev) => {
        ev.preventDefault()
        const title = draft.title.trim()
        if (!title || minsOf(draft.end) <= minsOf(draft.start)) return
        const d = draft
        draft = null
        render()
        change('record', { kind: d.kind, title, date: d.date, time: d.start, end: d.end })
      },
      onkeydown: (ev) => { if (ev.key === 'Escape') closeCards() },
      onpointerdown: (ev) => ev.stopPropagation(),
      onclick: (ev) => ev.stopPropagation(),
    },
    el('input', {
      type: 'text', id: 'draft-title', placeholder: t().titlePh, value: draft.title, autocomplete: 'off',
      oninput: (ev) => {
        draft.title = ev.target.value
        const live = document.querySelector('.ev.draft .title')
        if (live) live.textContent = draft.title || t().untitled
      },
    }),
    el('div', { class: 'when' }, icon('clock'), el('span', { class: 'date', text: t().day(dateOf(draft.date)) }), timeInput('start'), el('span', { text: '–' }), timeInput('end')),
    bad ? el('small', { class: 'danger', text: t().endAfter }) : null,
    tabs,
    el('div', { class: 'row' },
      el('button', { type: 'button', text: t().cancel, onclick: closeCards }),
      el('button', { type: 'submit', class: 'primary', text: t().save, disabled: bad })))
  }

  function entryCard(keys) {
    const e = (days[shownEntry.date] || []).find((x) => x.id === shownEntry.id)
    if (!e) { shownEntry = null; return null }
    const date = shownEntry.date
    const range = e.time ? (e.end ? `${e.time} – ${e.end}` : e.time) : t().allDay
    const tags = Array.isArray(e.tags) ? e.tags : []
    return el('div', {
      class: 'card pop', style: e.time ? cardPlace(keys, date, minsOf(e.time)) : `top:8px;left:${GUTTER() + 8}px;right:8px`, role: 'dialog', 'aria-label': e.title,
      onkeydown: (ev) => { if (ev.key === 'Escape') closeCards() },
      onpointerdown: (ev) => ev.stopPropagation(),
      onclick: (ev) => ev.stopPropagation(),
    },
    el('div', { class: 'pop-head' },
      e.kind === 'todo' ? el('input', { type: 'checkbox', checked: !!e.done, 'aria-label': t().toggle, onclick: () => toggleDone(date, e) }) : el('i', { class: 'kind-dot' }),
      el('strong', { class: e.done ? 'done' : '', text: e.title }),
      el('button', { type: 'button', 'aria-label': t().close, onclick: closeCards }, icon('x'))),
    el('div', { class: 'when' }, icon('clock'), el('span', { text: `${t().day(dateOf(date))} · ${range}` })),
    tags.length || e.detail ? el('div', { class: 'more' }, tags.map((tag) => el('em', { class: 'tag', text: tag })), e.detail ? el('p', { text: e.detail }) : null) : null,
    e.at ? el('small', { class: 'recorded' }, e.by ? icon('zap') : null, `${t().recorded} `, el('gugu-time', { datetime: String(e.at) })) : null,
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'danger-text', onclick: () => remove(date, e) }, icon('trash-2'), t().del),
      canJump(e) ? el('button', { type: 'button', onclick: () => jump(e) }, icon('arrow-up-right'), t().jump) : null))
  }

  function openEntry(date, e) {
    draft = null
    shownEntry = { date, id: e.id }
    render()
  }
  function closeCards() {
    if (!draft && !shownEntry) return
    draft = null
    shownEntry = null
    render()
  }
  function focusDraft() {
    const input = $('draft-title')
    if (input) input.focus()
  }

  function allDay(keys, tpl) {
    const row = el('div', { class: 'allday', style: `grid-template-columns:${tpl}` }, el('div', { class: 'gutter-label', text: t().allDay }))
    for (const k of keys) {
      const list = (days[k] || []).filter((e) => !e.time)
      row.append(el('div', { class: 'cell' }, list.map((e) => el('div', { class: `chip ${e.kind === 'todo' ? 'todo' : 'memory'}${e.done ? ' done' : ''}` },
        e.kind === 'todo' ? el('input', { type: 'checkbox', checked: !!e.done, 'aria-label': t().toggle, onclick: () => toggleDone(k, e) }) : null,
        el('button', { type: 'button', class: 'plain chip-title', text: e.title, onclick: () => openEntry(k, e) }),
        e.by ? icon('zap', t().byAgent) : null))))
    }
    return row
  }

  function timeline(keys) {
    const H = HOUR(), gw = GUTTER()
    const tpl = `${gw}px repeat(${keys.length}, minmax(0, 1fr))`
    const today = keyOf(new Date())
    const now = nowMins()
    const hours = el('div', { class: 'hours' })
    for (let i = 1; i < 24; i++) {
      // The hour's label steps aside for the time of now.
      if (keys.includes(today) && Math.abs(i * 60 - now) < 14) continue
      hours.append(el('span', { style: `top:${i * H}px`, text: `${pad(i)}:00` }))
    }
    const grid = el('div', { class: 'grid', style: `grid-template-columns:${tpl};height:${24 * H}px` }, hours, keys.map((k) => column(k, keys)))
    if (keys.includes(today)) {
      if (keys.length > 1) grid.append(el('div', { class: 'now-all', style: `top:${(now / 60) * H}px;left:${gw}px` }))
      grid.append(el('span', { class: 'now-label', style: `top:${(now / 60) * H}px;width:${gw - 6}px`, text: hm(now) }))
    }
    if (draft && keys.includes(draft.date)) grid.append(draftCard(keys))
    if (shownEntry && keys.includes(shownEntry.date)) {
      const card = entryCard(keys)
      if (card) grid.append(card)
    }
    if (!keys.some((k) => (days[k] || []).length) && !draft) {
      grid.append(el('div', { class: 'empty-over', style: `top:${(Math.max(now / 60 - 3.5, 1) | 0) * H + H / 2}px;left:${gw + 12}px` },
        el('gugu-empty', { icon: 'calendar-clock' }, el('strong', { text: keys.length > 1 ? t().emptyWeek : t().emptyDay }), el('small', { text: t().emptyHint }))))
    }
    const scroller = el('div', { class: 'scroller', id: 'scroller', onscroll: (ev) => { scrollTop = ev.target.scrollTop } }, grid)
    return { scroller, tpl, keys }
  }

  // Where a range opens: a little before now when today is in it, else an hour before its first timed entry, else 08:00.
  function homeScroll(keys) {
    const today = keyOf(new Date())
    if (keys.includes(today)) return Math.max(0, Math.floor(nowMins() / 60) - 5.5) * HOUR()
    const first = keys.flatMap((k) => (days[k] || []).filter((e) => e.time).map((e) => minsOf(e.time)))
    return (first.length ? Math.max(0, Math.min(...first) / 60 - 1) : 8) * HOUR()
  }

  // ---- months ---------------------------------------------------------------
  function monthGrid(small) {
    const mv = monthView || (() => { const d = dateOf(selected); return { y: d.getFullYear(), m: d.getMonth() } })()
    const today = keyOf(new Date())
    const shownWeek = small && mode() === 'week' ? weekOf(selected) : []
    const lead = (new Date(mv.y, mv.m, 1).getDay() + 6) % 7
    const count = small ? 42 : lead + new Date(mv.y, mv.m + 1, 0).getDate()
    const g = el('div', { class: small ? 'mini-grid' : 'month-grid' }, t().weekdays.map((w) => el('span', { class: 'wd', text: w })))
    for (let i = 0; i < count; i++) {
      const d = new Date(mv.y, mv.m, 1 - lead + i)
      const k = keyOf(d)
      if (!small && d.getMonth() !== mv.m) { g.append(el('span')); continue }
      const wi = shownWeek.indexOf(k)
      const cls = ['plain', 'mday', d.getMonth() !== mv.m ? 'out' : '', k === today ? 'is-today' : '', wi >= 0 ? 'inweek' : '', wi === 0 ? 'first' : '', wi === 6 ? 'last' : ''].join(' ')
      g.append(el('button', { type: 'button', class: cls, 'aria-pressed': String(k === selected), 'data-day': k, onclick: () => select(k) },
        el('span', { class: 'num', text: String(d.getDate()) }), small ? null : marks(k)))
    }
    const shift = (n) => {
      const d = new Date(mv.y, mv.m + n, 1)
      monthView = { y: d.getFullYear(), m: d.getMonth() }
      render()
    }
    return el('div', { class: small ? 'mini' : 'month' },
      el('div', { class: 'mh' },
        el('strong', { text: t().month(mv.y, mv.m) }),
        el('button', { type: 'button', 'aria-label': t().prevMonth, onclick: () => shift(-1) }, icon('chevron-left')),
        el('button', { type: 'button', 'aria-label': t().nextMonth, onclick: () => shift(1) }, icon('chevron-right'))),
      g)
  }

  // ---- render ---------------------------------------------------------------
  function quickAdd() {
    const input = el('input', { type: 'text', id: 'add-input', autocomplete: 'off', placeholder: t().add })
    return el('form', {
      class: 'add', id: 'add',
      onsubmit: (ev) => {
        ev.preventDefault()
        const title = input.value.trim()
        if (!title) return
        input.value = ''
        change('record', { kind: 'todo', title, date: selected })
      },
    }, input, wide() ? el('small', { class: 'hint', text: t().addHint }) : null)
  }

  function errBar() {
    return el('p', { id: 'err', role: 'alert', hidden: !errText, text: errText })
  }

  function step(n) {
    select(addDays(selected, n * (mode() === 'week' ? 7 : 1)))
  }

  function navButtons() {
    const week = mode() === 'week'
    return [
      el('button', { type: 'button', 'aria-label': week ? t().prevWeek : t().prevDay, onclick: () => step(-1) }, icon('chevron-left')),
      el('button', { type: 'button', 'aria-label': week ? t().nextWeek : t().nextDay, onclick: () => step(1) }, icon('chevron-right')),
    ]
  }

  function renderNarrow(app) {
    const d = dateOf(selected)
    const t0 = new Date()
    const diff = Math.round((d - new Date(t0.getFullYear(), t0.getMonth(), t0.getDate())) / 864e5)
    const rel = t().rel[String(diff)]
    const head = el('header', { class: 'head' },
      el('h3', {}, t().day(d), rel ? el('small', { class: 'muted', text: rel }) : null),
      diff !== 0 ? el('button', { type: 'button', class: 'today-btn', text: t().today, onclick: () => select(keyOf(new Date())) }) : null,
      navButtons(),
      el('button', { type: 'button', 'aria-label': t().expandMonth, 'aria-expanded': String(monthOpen), onclick: () => { monthOpen = !monthOpen; monthView = null; render() } }, icon('layout-grid')))
    const today = keyOf(new Date())
    const strip = monthOpen ? monthGrid(false) : el('div', { class: 'strip' }, weekOf(selected).map((k) => {
      const dk = dateOf(k)
      return el('button', { type: 'button', class: `plain${k === today ? ' is-today' : ''}`, 'aria-pressed': String(k === selected), 'data-day': k, onclick: () => select(k) },
        el('span', { class: 'wd', text: t().wd[dk.getDay()] }), el('span', { class: 'num', text: String(dk.getDate()) }), marks(k))
    }))
    const tl = timeline([selected])
    app.replaceChildren(el('div', { class: 'main' }, head, strip, errBar(), allDay(tl.keys, tl.tpl), tl.scroller, quickAdd()))
    return tl
  }

  function renderWide(app) {
    const keys = range()
    const week = mode() === 'week'
    const first = dateOf(keys[0]), last = dateOf(keys[keys.length - 1])
    const today = keyOf(new Date())
    const title = week
      ? el('h3', {}, t().month(first.getFullYear(), first.getMonth()), el('small', { class: 'muted', text: t().weekRange(first, last, isoWeek(first)) }))
      : el('h3', {}, t().day(first), first && keys[0] === today ? el('small', { class: 'muted', text: t().today }) : null)
    const modes = el('div', { role: 'tablist', class: 'modes' }, [['day', t().dayMode], ['week', t().weekMode]].map(([m, label]) => el('button', {
      type: 'button', role: 'tab', 'aria-selected': String(wideMode === m), text: label,
      onclick: () => { wideMode = m; draft = null; shownEntry = null; render() },
    })))
    const head = el('header', { class: 'head' }, title, modes,
      el('button', { type: 'button', class: 'today-btn', text: t().today, onclick: () => select(today) }), navButtons())
    const gw = GUTTER()
    const dayhead = week ? el('div', { class: 'dayhead', style: `grid-template-columns:${gw}px repeat(7, minmax(0, 1fr))` }, el('div'), keys.map((k) => {
      const d = dateOf(k)
      return el('button', { type: 'button', class: `plain${k === today ? ' is-today' : ''}${[0, 6].includes(d.getDay()) ? ' weekend' : ''}`, 'aria-pressed': String(k === selected), onclick: () => { selected = k; wideMode = 'day'; render() } },
        el('span', { text: t().week[d.getDay()] }), el('span', { class: 'num', text: String(d.getDate()) }))
    })) : null
    const tl = timeline(keys)
    const legend = el('div', { class: 'legend' },
      el('h5', { text: t().legend }),
      el('div', {}, el('i', { class: 'sw' }), t().todo),
      el('div', {}, el('i', { class: 'sw done' }), t().doneTodo),
      el('div', {}, el('i', { class: 'sw memory' }), t().memory),
      el('div', {}, icon('zap'), t().agentLegend))
    app.replaceChildren(
      el('aside', { class: 'rail' }, monthGrid(true), legend, quickAdd()),
      el('div', { class: 'main' }, head, errBar(), dayhead, allDay(tl.keys, tl.tpl), tl.scroller))
    return tl
  }

  function render() {
    const app = $('app')
    // Keep what the person is typing in the quick add across a redraw.
    const typing = $('add-input')
    const kept = typing ? { value: typing.value, focused: document.activeElement === typing } : null
    const draftFocused = document.activeElement && document.activeElement.id === 'draft-title'
    app.classList.toggle('wide', wide())
    const tl = wide() ? renderWide(app) : renderNarrow(app)
    if (kept) {
      const input = $('add-input')
      input.value = kept.value
      if (kept.focused) input.focus()
    }
    if (draftFocused) focusDraft()
    const key = `${mode()}:${tl.keys[0]}:${wide()}`
    const top = key === scrollRange && scrollTop != null ? scrollTop : homeScroll(tl.keys)
    scrollRange = key
    tl.scroller.scrollTop = top
    scrollTop = tl.scroller.scrollTop
  }

  function select(k) {
    selected = k
    monthView = null
    draft = null
    shownEntry = null
    render()
  }

  // ---- wiring ---------------------------------------------------------------
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeCards() })
  document.addEventListener('pointerdown', (ev) => {
    if (!ev.target.closest('.pop, .ev, .col')) closeCards()
  })
  let wasWide = wide()
  window.addEventListener('resize', () => {
    if (wide() === wasWide) return
    wasWide = wide()
    draft = null
    shownEntry = null
    render()
  })

  // Coming back on screen reads at once: what an agent recorded meanwhile shows without waiting for the next tick.
  function noteLayout(ctx) {
    const was = shown
    shown = !(ctx && ctx.layout && ctx.layout.visible === false)
    if (shown && !was) load().then((changed) => { if (changed && !draft) render() })
  }

  async function start() {
    try {
      const ctx = await api.getContext()
      en = !!(ctx && ctx.locale && /^en/i.test(ctx.locale))
      noteLayout(ctx)
    } catch (e) {
      showErr(`getContext: ${(e && e.message) || e}`, 'context')
    }
    if (typeof api.onContextChanged === 'function') {
      api.onContextChanged((next) => {
        if (next && errKind === 'context') showErr('')
        noteLayout(next)
        if (!next || !next.locale) return
        const was = en
        en = /^en/i.test(next.locale)
        if (was !== en) render()
      })
    }
    await load()
    render()
    // Agents write through the `record` tool at any time; pick it up while the panel is on screen.
    // A new entry being written is not redrawn under the person's hands: the read waits until the card closes.
    setInterval(async () => {
      if (!shown || document.visibilityState === 'hidden') return
      if (await load() && !draft) render()
    }, 3000)
    // The minute moves the line of now; a new day moves "today" along.
    let today = keyOf(new Date())
    let minute = nowMins()
    setInterval(() => {
      const k = keyOf(new Date())
      const m = nowMins()
      if (k === today && m === minute) return
      if (k !== today && selected === today) selected = k
      today = k
      minute = m
      if (!draft) render()
    }, 15 * 1000)
  }
  start()
})()
