import { f, me, $, html, render } from '/_gugu/1/glue.js'

// 数据：f.data = { v, cards: { id: Card }, rules: { id: { text, when, at } }, memory: '' }
// Card（旧字段不变，第 3 版只加字段）：{ title, col: todo|doing|you|beta|done|hold, verb: 定|看|批|null, p0, who, desc,
//   qs:[{q,opts,rec}], ans:{i:o}, look:{note,file}, rework, next, due, lastAt, origin:{text,at},
//   tl:{id:{at,kind,text}}, todos:{id:{text,done,at}}, decs:{id:{q,a,at}}, cmts:{id:{text,at,by}},
//   talk:{chat}|{session}, createdAt, updatedAt }
const ctx = await window.gugu.getContext()
const COLS = [['todo', '待开工'], ['doing', '在做'], ['you', '轮到你'], ['beta', '进下一版 Beta'], ['done', '已交付']]
const ALL = [...COLS, ['hold', '搁置']]
const VERBS = ['定', '看', '批']
const ui = { col: 'you', scope: 'active', mine: false, q: '', open: null, reject: null, set: 'rules', drag: null }
let members = []
window.gugu.chats.members({ chat: ctx.chat.id }).then((r) => { members = r.members || []; draw() })
  .catch((e) => window.gugu.reportError('读不到群成员：' + e.message))

const now = () => new Date().toISOString()
const rid = () => crypto.randomUUID().slice(0, 8)
const cards = () => Object.entries(f.data.cards || {}).map(([id, c]) => ({ id, ...c }))
const get = (id) => id && f.data.cards?.[id] && { id, ...f.data.cards[id] }
const nameOf = (c) => members.find((m) => m.id === c.who)?.name || (c.who ? '负责 agent' : '还没人接')
const colName = (k) => ALL.find((x) => x[0] === k)?.[1] || k
const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString()
const vals = (m) => Object.entries(m || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => String(a.at).localeCompare(String(b.at)))
const order = (a, b) => (b.p0 ? 1 : 0) - (a.p0 ? 1 : 0) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
const wide = () => innerWidth >= 900

function patch(id, p) { f.transact(() => Object.assign(f.data.cards[id], p, { updatedAt: now() })) }
function add(id, key, v) { f.transact(() => { const c = f.data.cards[id]; c[key] = { ...(c[key] || {}), [rid()]: { at: now(), ...v } } }) }
const log = (id, kind, text) => add(id, 'tl', { kind, text })

async function tell(c, text) {
  const body = `「${c.title}」（${c.id}）：${text}`
  try {
    if (c.who) await window.gugu.dispatch(body, { to: { chat: ctx.chat.id, member: c.who }, visible: true, refs: [{ file: f.entry, label: c.title }] })
    else await window.gugu.dispatch(body, { refs: [{ file: f.entry, label: c.title }] })
    flash('已发给 ' + nameOf(c))
  } catch (e) {
    flash('没发出去：' + e.message, true)
    window.gugu.reportError('发送失败：' + e.message)
  }
}
function flash(t, bad) {
  const s = $('#note'); s.textContent = t; s.setAttribute('role', bad ? 'alert' : 'status')
  clearTimeout(flash.t); flash.t = setTimeout(() => (s.textContent = ''), 4000)
}

// —— 你的动作 ——
function answer(c, qi, oi) {
  c = get(c.id)
  const ans = { ...(c.ans || {}), [qi]: oi }
  patch(c.id, { ans })
  if (Object.keys(ans).length < (c.qs || []).length) return
  c.qs.forEach((q, i) => add(c.id, 'decs', { q: q.q || c.title, a: q.opts[ans[i]] }))
  const said = c.qs.map((q, i) => (c.qs.length > 1 ? q.q + '→' : '') + q.opts[ans[i]]).join('；')
  patch(c.id, { col: 'doing', verb: null, lastAt: now(), next: '按你选的做' })
  log(c.id, 'you', '你定了：' + said)
  tell(c, said)
}
function approve(c) {
  add(c.id, 'decs', { q: c.rework ? `第 ${c.rework} 版` : c.title, a: '行' })
  patch(c.id, { col: 'doing', verb: null, lastAt: now(), next: '跑 CI 后合入' })
  log(c.id, 'you', '你看了说行')
  tell(c, '行')
}
function reject(c, text) {
  const r = c.rework || 1, n = r + 1
  add(c.id, 'decs', { q: `第 ${r} 版`, a: '打回：' + text })
  patch(c.id, { col: 'doing', verb: null, rework: n, lastAt: now(), next: `改第 ${n} 版给你看` })
  log(c.id, 'rework', `第 ${r} 版打回：` + text)
  tell(c, '打回：' + text)
}
function allByAdvice(c) {
  c = get(c.id)
  c.qs.forEach((q, i) => c.ans?.[i] == null && answer(c, i, q.rec ?? 0))
}
function move(c, col) {
  if (c.col === col) return
  patch(c.id, { col, ...(col !== 'you' ? { verb: null } : {}) })
  if (c.who) tell(c, `你把它挪到了「${colName(col)}」`)
}
async function goChat(c) {
  try {
    if (c.talk?.chat) return await window.gugu.openLink(await window.gugu.linkTo({ kind: 'chat', chat: c.talk.chat }))
    if (c.talk?.session) return await window.gugu.showSession(c.talk.session)
    // 还没挂聊天：把卡交给 gugu 的发送面板，你选发给谁
    await window.gugu.dispatch(`「${c.title}」（${c.id}）：`, { refs: [{ file: f.entry, label: c.title }] })
  } catch (e) { flash('跳不过去：' + e.message, true) }
}

const hm = (iso) => { const d = new Date(iso), z = (n) => String(n).padStart(2, '0'); return `${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}` }
// Agent 调 command-board__task 拿到的内容（与 tools.js 的 task 同一格式）
function taskText(c) {
  const L = [`卡 ${c.id}：${c.title}`, `列：${colName(c.col)}${c.verb ? '（要 owner ' + c.verb + '）' : ''}${c.p0 ? '，紧急' : ''}${c.rework ? '，第 ' + c.rework + ' 版' : ''}`]
  if (c.desc) L.push('描述：' + c.desc)
  if (c.origin?.text) L.push('owner 原话：' + c.origin.text)
  if (c.next) L.push('下一步：' + c.next + (c.due ? '（承诺 ' + c.due + '）' : ''))
  if (c.col === 'you' && c.qs?.length) L.push('等 owner 答：' + c.qs.map((q, i) => `${q.q}（${q.opts.join(' / ')}）${c.ans?.[i] != null ? '→ 已选 ' + q.opts[c.ans[i]] : ''}`).join('；'))
  const td = vals(c.todos), tl = vals(c.tl).slice(-20), ds = vals(c.decs), cs = vals(c.cmts).slice(-10)
  L.push('待办：', ...(td.length ? td.map((t) => `  [${t.done ? 'x' : ' '}] ${t.text}  (${t.id})`) : ['  （无）']))
  L.push('时间线：', ...(tl.length ? tl.map((t) => `  ${hm(t.at)} ${t.text}`) : ['  （无）']))
  L.push('owner 的决定：', ...(ds.length ? ds.map((d) => `  ${d.q} → ${d.a}`) : ['  （无）']))
  if (cs.length) L.push('评论：', ...cs.map((m) => `  ${m.by === 'owner' ? 'owner' : 'agent'}：${m.text}`))
  L.push('', '整板规矩（照办，别再问 owner）：', ...Object.values(f.data.rules || {}).map((r) => '  - ' + r.text))
  if (f.data.memory) L.push('', '整板记忆：', f.data.memory)
  return L.join('\n')
}

// —— 画看板 ——
function cardView(c) {
  const td = vals(c.todos)
  return html`<article class=${'card c' + (ui.open === c.id ? ' on' : '')} data-key=${c.id} data-act="open" data-id=${c.id}
      draggable=${wide() ? 'true' : 'false'} aria-labelledby=${'t-' + c.id} tabindex="0">
    <code class="cid">${c.id}</code>
    <h3 id=${'t-' + c.id}>${c.title}</h3>
    ${c.desc ? html`<p class="muted d">${c.desc}</p>` : ''}
    <div class="meta">
      ${c.p0 ? html`<span class="tag p0">紧急</span>` : ''}
      ${c.verb ? html`<span class="tag" data-v=${String(VERBS.indexOf(c.verb))}>要你${c.verb}</span>` : ''}
      ${c.rework > 1 ? html`<span class="tag">第 ${c.rework} 版</span>` : ''}
      ${c.due ? html`<span class="tag">${c.due}</span>` : ''}
      ${td.length ? html`<span><gugu-icon name="square-check"></gugu-icon>${td.filter((t) => t.done).length}/${td.length}</span>` : ''}
      <span class="sp"></span>
      ${c.who ? html`<gugu-avatar user=${c.who} size="xs"></gugu-avatar>` : html`<small>没人接</small>`}
    </div>
  </article>`
}

function draw() {
  const all = cards()
  const q = ui.q.trim()
  const ok = (c) => (!q || c.title.includes(q) || (c.desc || '').includes(q) || c.id.includes(q)) && (!ui.mine || c.col === 'you')
  const cols = ui.scope === 'all' ? ALL : COLS
  const by = (k) => all.filter((c) => c.col === k && ok(c)).sort(order)
  const today = all.filter((c) => isToday(c.createdAt)).length
  if (!wide() && !cols.some(([k]) => k === ui.col)) ui.col = 'you'
  window.gugu.setTabBadge(all.filter((c) => c.col === 'you').length)
  render($('#shared'), html`
    <header class="top" data-key="top">
      <div class="row ttl"><h2>指挥看板</h2><small class="muted">今天你提了 <strong>${today}</strong> 件</small><span class="sp"></span>
        <button class="icon" aria-label="看板设置" data-act="settings"><gugu-icon name="settings"></gugu-icon></button></div>
      <div class="row filters">
        <div role="tablist" class="seg"><button role="tab" data-act="scope" data-v="active" aria-selected=${String(ui.scope === 'active')}>进行中</button><button role="tab" data-act="scope" data-v="all" aria-selected=${String(ui.scope === 'all')}>全部</button></div>
        <div role="tablist" class="seg"><button role="tab" data-act="mine" data-v="0" aria-selected=${String(!ui.mine)}>团队</button><button role="tab" data-act="mine" data-v="1" aria-selected=${String(ui.mine)}>等我的</button></div>
        <input type="search" id="q" placeholder="搜索任务或 ID" value=${ui.q}>
        <form id="newForm" class="row"><input id="newText" placeholder="新任务，一句话"><button class="primary" aria-label="新任务"><gugu-icon name="plus"></gugu-icon></button></form>
      </div>
      <div role="tablist" class="tally">${cols.map(([k, l]) => html`<button role="tab" data-act="col" data-col=${k} aria-selected=${String(ui.col === k)}>${l} <strong>${by(k).length}</strong></button>`)}</div>
    </header>
    <div class="board" data-key="board">
      ${cols.map(([k, l]) => html`<section class=${'col k-' + k} data-key=${'col-' + k} data-col=${k} data-show=${String(ui.col === k)}>
        <h5><span class=${'dot d-' + k}></span>${l} <span class="muted">${by(k).length}</span></h5>
        <div class="body">
          ${by(k).map(cardView)}
          ${!by(k).length ? html`<small class="muted empty">${k === 'you' ? '没有等你的事' : '空'}</small>` : ''}
        </div>
      </section>`)}
    </div>`)
  drawDetail()
}

// —— 右侧任务面板 ——
function decideView(c) {
  if (c.verb === '看') return html`<div class="decide" data-key="dec">
    <h5>要你看${c.rework ? `（第 ${c.rework} 版）` : ''}</h5>
    ${c.look?.note ? html`<small class="muted">${c.look.note}</small>` : ''}
    <div class="row">${c.look?.file ? html`<button data-act="file" data-id=${c.id}><gugu-icon name="eye"></gugu-icon>打开稿</button>` : ''}
      <button class="primary" data-act="ok" data-id=${c.id}>行</button><button data-act="rej" data-id=${c.id}>打回</button></div></div>`
  return html`<div class="decide" data-key="dec"><h5>要你${c.verb}</h5>
    ${(c.qs || []).map((q, qi) => html`<div class="q" data-key=${'q' + qi}><small class="muted">${q.q}</small>
      <div class="row">${q.opts.map((o, oi) => html`<button data-act="ans" data-id=${c.id} data-q=${qi} data-o=${oi}
        class=${[oi === q.rec ? 'rec' : '', c.ans?.[qi] === oi ? 'primary' : ''].join(' ')}>${o}${oi === q.rec ? html`<small class="tip">建议</small>` : ''}</button>`)}</div></div>`)}
    ${(c.qs || []).length > 1 ? html`<div class="row"><button data-act="allrec" data-id=${c.id}>全按建议</button></div>` : ''}
    ${!(c.qs || []).length ? html`<small class="muted">agent 还没写选项，去聊里问它</small>` : ''}
  </div>`
}
function drawDetail() {
  const c = get(ui.open)
  const d = $('#detail')
  d.hidden = !c
  document.body.classList.toggle('panel', !!c)
  if (!c) return
  $('#dId').textContent = c.id
  const tl = vals(c.tl).reverse(), td = vals(c.todos), ds = vals(c.decs), cs = vals(c.cmts)
  const talk = c.talk?.chat ? '去聊：这件事的话题' : c.talk?.session ? `去聊：${nameOf(c)} 的会话` : '去聊：还没有话题'
  render($('#detailBody'), html`
    <div class="row props" data-key="props">
      <button data-act="status" data-id=${c.id}><gugu-icon name="circle-dot" class=${'d-' + c.col}></gugu-icon>${colName(c.col)}</button>
      <button data-act="p0" data-id=${c.id} aria-pressed=${String(!!c.p0)}>${c.p0 ? '紧急' : '普通'}</button>
      <button data-act="who" data-id=${c.id}><gugu-icon name="user"></gugu-icon>${nameOf(c)}</button>
    </div>
    <input class="title" data-edit="title" data-id=${c.id} value=${c.title} aria-label="标题" data-key="title">
    <textarea class="desc" data-edit="desc" data-id=${c.id} rows="2" placeholder="一两句背景，agent 读卡时会看到" aria-label="描述" data-key="desc">${c.desc || ''}</textarea>
    <div class="talk" role="button" tabindex="0" aria-label=${talk} data-act="talk" data-id=${c.id} data-key="talk"><gugu-icon name="message-circle"></gugu-icon>
      <span class="tx"><span>${talk}</span><small class="muted">${c.talk ? '跳到咕咕里，和 ' + nameOf(c) + ' 说' : '选一个人或 agent，把这张卡发过去'}</small></span><gugu-icon name="chevron-right"></gugu-icon></div>
    ${c.col === 'you' ? decideView(c) : ''}
    ${c.next ? html`<div class="next" data-key="next">下一步：${c.next}${c.due ? html`<span class="muted">，承诺 ${c.due}</span>` : ''}</div>` : ''}
    ${c.origin?.text ? html`<blockquote data-key="origin">${c.origin.text}${c.origin.at ? html` <gugu-time datetime=${c.origin.at}></gugu-time>` : ''}</blockquote>` : ''}
    <section class="sec" data-key="s-tl"><h5>时间线 <span class="muted">${tl.length}</span><small class="muted r">只记里程碑</small></h5>
      ${tl.length ? html`<ol class="tl">${tl.map((t) => html`<li data-key=${t.id} class=${'k-' + (t.kind || 'x')}><gugu-time datetime=${t.at}></gugu-time> ${t.text}</li>`)}</ol>`
        : html`<small class="muted">agent 做完一步会用 log 记到这里</small>`}</section>
    <section class="sec" data-key="s-todo"><h5>待办 <span class="muted">${td.filter((t) => t.done).length}/${td.length}</span></h5>
      ${td.map((t) => html`<label class="todo" data-key=${t.id}>${t.done ? html`<input type="checkbox" checked data-act="todo" data-id=${c.id} data-t=${t.id}>` : html`<input type="checkbox" data-act="todo" data-id=${c.id} data-t=${t.id}>`} <span class=${t.done ? 'done' : ''}>${t.text}</span></label>`)}
      <form class="row" id="todoForm"><input id="todoText" placeholder="加一条待办"><button aria-label="加待办"><gugu-icon name="plus"></gugu-icon></button></form></section>
    <section class="sec" data-key="s-dec"><h5>决定 <span class="muted">${ds.length}</span></h5>
      ${ds.length ? html`<ul class="decs">${ds.map((x) => html`<li data-key=${x.id}><small class="muted">${x.q} · <gugu-time datetime=${x.at}></gugu-time></small><span>你定：${x.a}</span></li>`)}</ul>`
        : html`<small class="muted">你在这张卡上拍的板会留在这里</small>`}</section>
    <section class="sec" data-key="s-cmt"><h5>评论 <span class="muted">${cs.length}</span></h5>
      ${cs.map((m) => html`<div class="cmt" data-key=${m.id}><small class="muted"><strong>${m.by === 'owner' ? '你' : members.find((x) => x.id === m.by)?.name || 'agent'}</strong> <gugu-time datetime=${m.at}></gugu-time></small><p>${m.text}</p></div>`)}
      <form class="stack" id="cmtForm"><textarea id="cmtText" rows="2" placeholder="写评论，会同时发给负责的 agent"></textarea><div class="row"><span class="sp"></span><button class="primary">发送</button></div></form></section>`)
}

// —— 设置：规矩 / 记忆 / 工具 ——
const TOOLS = [['cards', '读整板，可按列筛', '原有'], ['put', '建卡、改卡、换列、写问题和建议', '原有'],
  ['task', '按 ID 读一张卡：描述、待办、时间线、决定、评论，连同整板规矩和记忆', '新'], ['log', '往时间线记一个里程碑', '新'],
  ['todo', '加待办、勾掉待办', '新'], ['comment', '写评论', '新'], ['memory', '读写整板记忆', '新']]
function drawSettings() {
  document.querySelectorAll('#setTabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.st === ui.set)))
  const rules = Object.entries(f.data.rules || {}).sort((a, b) => String(a[1].at).localeCompare(String(b[1].at)))
  render($('#setBody'), ui.set === 'rules' ? html`<div class="stack" data-key="rules">
      <small class="muted">每个 agent 读任何一张卡都会先读到这里，照办，不再问你。</small>
      <ul class="rules">${rules.map(([id, r]) => html`<li data-key=${id}><span>${r.text}</span><small class="muted">${r.when || ''}</small>
        <button class="icon" aria-label="删掉这条" data-act="unrule" data-id=${id}><gugu-icon name="x"></gugu-icon></button></li>`)}</ul>
      <form id="ruleForm" class="row"><input id="ruleText" placeholder="加一条规矩"><button>加</button></form></div>`
    : ui.set === 'memory' ? html`<div class="stack" data-key="memory">
      <small class="muted">跨任务的约定和结论；agent 发现值得长期记的事会用 memory 自己补进来。</small>
      <textarea id="memText" rows="10">${f.data.memory || ''}</textarea>
      <div class="row"><button class="primary" data-act="memsave">保存</button></div></div>`
    : html`<div class="stack" data-key="tools"><small class="muted">看板装在群里，群里的 agent 就有这些工具，名字前缀 <code>command-board__</code>；都按卡的 ID 读写。</small>
      <table><tbody>${TOOLS.map(([n, d, s]) => html`<tr data-key=${n}><td><code>${n}</code></td><td>${d}</td><td><small class="muted">${s}</small></td></tr>`)}</tbody></table></div>`)
}

// —— 事件（委托一次）——
async function pick(b, items) {
  const r = b.getBoundingClientRect()
  return window.gugu.showContextMenu({ x: r.left, y: r.bottom + 4, items })
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return
  const c = get(b.dataset.id)
  switch (b.dataset.act) {
    case 'col': ui.col = b.dataset.col; return draw()
    case 'scope': ui.scope = b.dataset.v; return draw()
    case 'mine': ui.mine = b.dataset.v === '1'; return draw()
    case 'open': ui.open = c.id; return draw()
    case 'close': ui.open = null; return draw()
    case 'copyid': {
      const id = ui.open
      try { await window.gugu.clipboard.writeText(id); flash('已复制 ' + id + '：任何 agent 拿到它都能读写这张卡') } catch (er) { flash('复制不了：' + er.message, true) }
      return
    }
    case 'peek': $('#peekText').textContent = taskText(get(ui.open)); return $('#peekDlg').showModal()
    case 'peekclose': return $('#peekDlg').close()
    case 'settings': drawSettings(); return $('#setDlg').showModal()
    case 'setclose': return $('#setDlg').close()
    case 'talk': return goChat(c)
    case 'ans': return answer(c, +b.dataset.q, +b.dataset.o)
    case 'allrec': return allByAdvice(c)
    case 'ok': return approve(c)
    case 'rej': ui.reject = c.id; $('#rejFor').textContent = c.title; $('#rejDlg').showModal(); $('#rejText').focus(); return
    case 'file': return window.gugu.files.openWith({ id: c.look.file, chat: ctx.chat.id }, { intent: 'beside' }).catch((er) => flash('打不开稿：' + er.message, true))
    case 'todo': return f.transact(() => { const t = f.data.cards[c.id].todos[b.dataset.t]; t.done = b.checked })
    case 'p0': return patch(c.id, { p0: !c.p0 })
    case 'status': { const k = await pick(b, ALL.map(([v, l]) => ({ id: v, label: l, checked: v === c.col }))); if (k) move(c, k); return }
    case 'who': {
      const ags = members.filter((m) => m.kind === 'agent')
      const k = await pick(b, ags.length ? ags.map((m) => ({ id: m.id, label: m.name, checked: m.id === c.who })) : [{ id: 'none', label: '群里没有 agent', enabled: false }])
      if (k && k !== 'none' && k !== c.who) { patch(c.id, { who: k }); tell(get(c.id), '交给你了。先用 command-board__task 读这张卡') }
      return
    }
    case 'unrule': { const r = { ...f.data.rules }; delete r[b.dataset.id]; f.data.rules = r; return drawSettings() }
    case 'memsave': f.data.memory = $('#memText').value; return flash('记忆已保存')
  }
})
document.addEventListener('click', (e) => { const t = e.target.closest('#setTabs [role=tab]'); if (t) { ui.set = t.dataset.st; drawSettings() } })
document.addEventListener('change', (e) => {
  const ed = e.target.dataset?.edit; if (!ed) return
  const v = e.target.value.trim(); if (ed === 'title' && !v) return
  patch(e.target.dataset.id, { [ed]: v })
})
document.addEventListener('input', (e) => { if (e.target.id === 'q') { ui.q = e.target.value; draw(); $('#q').focus() } })
document.addEventListener('submit', (e) => {
  e.preventDefault()
  const id = e.target.id
  if (id === 'newForm') {
    const t = $('#newText').value.trim(); if (!t) return
    const nid = rid()
    f.transact(() => { f.data.cards[nid] = { title: t, col: 'todo', verb: null, who: null, tl: {}, createdAt: now(), updatedAt: now(), origin: { text: t, at: now() } } })
    $('#newText').value = ''; ui.open = nid; ui.col = 'todo'; draw(); flash('建好了，点负责人把它交给一个 agent')
  }
  if (id === 'todoForm') { const t = $('#todoText').value.trim(); if (t) { add(ui.open, 'todos', { text: t, done: false }); $('#todoText').value = '' } }
  if (id === 'cmtForm') {
    const t = $('#cmtText').value.trim(); const c = get(ui.open); if (!t || !c) return
    add(c.id, 'cmts', { text: t, by: 'owner' }); $('#cmtText').value = ''; tell(c, t)
  }
  if (id === 'ruleForm') {
    const t = $('#ruleText').value.trim(); if (!t) return
    const d = new Date(); const when = `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    f.data.rules = { ...(f.data.rules || {}), [crypto.randomUUID()]: { text: t, when, at: now(), by: me } }
    drawSettings()
  }
})
$('#rejSend').addEventListener('click', (e) => {
  e.preventDefault()
  const t = $('#rejText').value.trim(); if (!t) return $('#rejText').setAttribute('aria-invalid', 'true')
  const c = get(ui.reject); $('#rejDlg').close(); $('#rejText').value = ''
  if (c) reject(c, t)
})
$('#rejCancel').addEventListener('click', () => $('#rejDlg').close())
// 宽屏拖卡换列
document.addEventListener('dragstart', (e) => { const a = e.target.closest?.('article.c'); if (a) ui.drag = a.dataset.id })
document.addEventListener('dragover', (e) => { if (ui.drag && e.target.closest?.('section.col')) e.preventDefault() })
document.addEventListener('drop', (e) => {
  const s = e.target.closest?.('section.col'); const c = get(ui.drag); ui.drag = null
  if (s && c) { e.preventDefault(); move(c, s.dataset.col) }
})
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches?.('article.c, .talk')) e.target.click() })

if (!f.data.cards) f.transact(() => { f.data.v = 1; f.data.cards = {}; f.data.rules = f.data.rules || {} })
f.onChange(() => { draw(); if ($('#setDlg').open && ui.set !== 'memory') drawSettings() })
try { draw() } catch (e) { window.gugu.reportError('画不出看板：' + e.message); throw e }
addEventListener('resize', () => draw())
