// 指挥看板：agent 用这几个工具把 owner 交代的事写成卡、推进卡。
const NAME = '.command-board.json' // 文件名形如 指挥看板.command-board.json
const COLS = ['todo', 'doing', 'you', 'beta', 'done', 'hold']
const where = {
  board: { type: 'string', format: 'gugu-file', description: '看板文件（有就传，没有就传 chat）' },
  chat: { type: 'string', format: 'gugu-chat', description: '看板所在的群，例如 206258' },
}
async function openBoard({ board, chat }) {
  if (board) return gugu.files.open({ id: board })
  if (!chat) throw new Error('传 board 或 chat')
  // 先按约定名直接开，不用列整个群（群里上万个文件）
  try { return await gugu.files.open({ chat, name: '指挥看板' + NAME }) } catch (err) { if (err?.code !== 'not-found') throw err }
  const r = await gugu.files.list({ chat, folder: '' })
  const list = Array.isArray(r) ? r : Array.isArray(r?.entries) ? r.entries : Object.values(r?.entries || {})
  const e = list.find((x) => x?.name?.endsWith(NAME))
  if (!e) throw new Error('这个群里还没有指挥看板（' + NAME + '）')
  return gugu.files.open(e)
}
const now = () => new Date().toISOString()
const line = (id, c) => `${id} [${c.col}${c.verb ? '/要你' + c.verb : ''}] ${c.title}` +
  (c.next ? ` 下一步:${c.next}${c.due ? '@' + c.due : ''}` : '') +
  (c.ans && Object.keys(c.ans).length ? ' 已答:' + (c.qs || []).map((q, i) => c.ans[i] != null ? q.opts[c.ans[i]] : '?').join('/') : '')

export const cards = {
  description: '列出指挥看板上的卡（默认不含已交付）。每轮开工前先看：owner 在看板上点的选项、打回、说的话都在这里。',
  inputSchema: { type: 'object', properties: { ...where, col: { type: 'string', enum: COLS } } },
  async run(a) {
    const f = await openBoard(a)
    const all = Object.entries(f.data.cards || {}).filter(([, c]) => (a.col ? c.col === a.col : c.col !== 'done'))
    const rules = Object.values(f.data.rules || {}).map((r) => '- ' + r.text).join('\n')
    return `board=${f.entry.id}\n${all.map(([id, c]) => line(id, c)).join('\n') || '（没有卡）'}\n\nowner 立过的规矩（照办，别再问他）：\n${rules || '（无）'}`
  },
}

export const put = {
  description: '新建或更新一张卡。owner 每说一件事（报问题、提需求、要决定）就建一张；要他定/看/批时把 col 设成 you 并给 verb；进展到里程碑时写 event。不传 id 就是新建，负责人是你。',
  inputSchema: {
    type: 'object', required: ['title'],
    properties: {
      ...where,
      id: { type: 'string', description: '要更新的卡 id；新建不传' },
      title: { type: 'string', description: '一句话，owner 认得的叫法' },
      col: { type: 'string', enum: COLS, description: 'todo=待开工，doing=在做，you=轮到 owner，beta=合进 dev 等下一版 Beta，done=已交付，hold=搁置' },
      verb: { type: 'string', enum: ['定', '看', '批', ''], description: 'col=you 时必填：定=选择题，看=看稿说行/打回，批=动生产/发版/改旧行为' },
      p0: { type: 'boolean', description: '影响生产用户' },
      desc: { type: 'string', description: '一两句背景，不写黑话' },
      questions: { type: 'array', description: '定/批 的题：[{q, options:[..], recommended: 下标}]', items: { type: 'object', properties: { q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, recommended: { type: 'number' } } } },
      look_note: { type: 'string', description: '看 的稿是什么' },
      look_file: { type: 'string', format: 'gugu-file', description: '看 的稿（群文件）' },
      next: { type: 'string', description: '你承诺的下一步' },
      due: { type: 'string', description: '下一步几点给，如 21:30' },
      origin_text: { type: 'string', description: 'owner 起头的原话' },
      origin_at: { type: 'string', description: '原话时间 ISO' },
      rework: { type: 'number', description: '第几版' },
      event: { type: 'string', description: '记一笔经过（只记里程碑）' },
      talk_chat: { type: 'string', format: 'gugu-chat', description: '这件事在哪个话题里聊（看板上「去聊」跳过去）；不传时默认是你这个会话' },
    },
  },
  async run(a, { agent, session }) {
    const f = await openBoard(a)
    if (!f.data.cards) f.data.cards = {}
    const id = a.id || crypto.randomUUID().slice(0, 8)
    const old = f.data.cards[id]
    if (a.id && !old) throw new Error('没有这张卡：' + a.id)
    const c = old ? {} : { createdAt: now(), who: agent, tl: {} }
    for (const k of ['title', 'col', 'p0', 'desc', 'next', 'due', 'rework']) if (a[k] !== undefined) c[k] = a[k]
    if (a.verb !== undefined) c.verb = a.verb || null
    if (a.col && a.col !== 'you' && a.verb === undefined) c.verb = null
    if (a.questions) { c.qs = a.questions.map((q) => ({ q: q.q || '', opts: q.options || [], rec: q.recommended ?? 0 })); c.ans = {} }
    if (a.look_note !== undefined || a.look_file !== undefined) c.look = { note: a.look_note ?? old?.look?.note, file: a.look_file ?? old?.look?.file }
    if (a.talk_chat) c.talk = { chat: a.talk_chat }
    else if (!old && session) c.talk = { session }
    if (a.origin_text) c.origin = { text: a.origin_text, at: a.origin_at || now() }
    c.lastAt = now(); c.updatedAt = now()
    if (c.col === 'you' && !(c.verb || old?.verb)) throw new Error('col=you 要给 verb（定/看/批）')
    f.transact(() => {
      f.data.cards[id] = old ? { ...f.toJSON().cards[id], ...c } : c
      if (a.event) f.data.cards[id].tl = { ...(f.data.cards[id].tl || {}), [crypto.randomUUID().slice(0, 8)]: { at: now(), kind: a.col === 'done' || a.col === 'beta' ? 'ms' : '', text: a.event } }
    })
    return `ok ${id}`
  },
}

// —— 按卡 ID 读写（第 3 版加的，cards / put 不变）——
const byId = { ...where, id: { type: 'string', description: '卡的 ID（看板上「复制 ID」拿到的那串）' } }
const rid = () => crypto.randomUUID().slice(0, 8)
async function openCard(a) {
  const f = await openBoard(a)
  const c = f.data.cards?.[a.id]
  if (!c) throw new Error('没有这张卡：' + a.id + '。先用 command-board__cards 看 ID')
  return { f, c }
}
// 卡没挂聊天时，挂上负责 agent 自己的会话，看板上「去聊」就能跳过来
const linkMe = (c, agent, session) => (!c.talk && session && c.who === agent ? { session } : c.talk)
const vals = (m) => Object.entries(m || {}).sort((x, y) => String(x[1].at).localeCompare(String(y[1].at)))
const hm = (iso) => { const d = new Date(iso), z = (n) => String(n).padStart(2, '0'); return `${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}` }
const NAMES = { todo: '待开工', doing: '在做', you: '轮到 owner', beta: '进下一版 Beta', done: '已交付', hold: '搁置' }

export const task = {
  description: '按 ID 读一张卡：描述、待办、时间线、owner 的决定、评论，连同整板规矩和记忆。接手或接着做一件事，先调它。',
  inputSchema: { type: 'object', required: ['id'], properties: byId },
  async run(a) {
    const { f, c } = await openCard(a)
    const L = [`卡 ${a.id}：${c.title}`, `列：${NAMES[c.col] || c.col}${c.verb ? '（要 owner ' + c.verb + '）' : ''}${c.p0 ? '，紧急' : ''}${c.rework ? '，第 ' + c.rework + ' 版' : ''}`]
    if (c.desc) L.push('描述：' + c.desc)
    if (c.origin?.text) L.push('owner 原话：' + c.origin.text)
    if (c.next) L.push('下一步：' + c.next + (c.due ? '（承诺 ' + c.due + '）' : ''))
    if (c.col === 'you' && c.qs?.length) L.push('等 owner 答：' + c.qs.map((q, i) => `${q.q}（${q.opts.join(' / ')}）${c.ans?.[i] != null ? '→ 已选 ' + q.opts[c.ans[i]] : ''}`).join('；'))
    L.push('待办：', ...(vals(c.todos).map(([id, t]) => `  [${t.done ? 'x' : ' '}] ${t.text}  (${id})`)), ...(Object.keys(c.todos || {}).length ? [] : ['  （无）']))
    const tl = vals(c.tl).slice(-20)
    L.push('时间线：', ...(tl.map(([, t]) => `  ${hm(t.at)} ${t.text}`)), ...(tl.length ? [] : ['  （无）']))
    const ds = vals(c.decs)
    L.push('owner 的决定：', ...(ds.map(([, d]) => `  ${d.q} → ${d.a}`)), ...(ds.length ? [] : ['  （无）']))
    const cs = vals(c.cmts).slice(-10)
    if (cs.length) L.push('评论：', ...cs.map(([, m]) => `  ${m.by === 'owner' ? 'owner' : 'agent'}：${m.text}`))
    L.push('', '整板规矩（照办，别再问 owner）：', ...(Object.values(f.data.rules || {}).map((r) => '  - ' + r.text)))
    if (f.data.memory) L.push('', '整板记忆：', f.data.memory)
    let out = L.join('\n')
    if (out.length > 7800) out = out.slice(0, 7800) + '\n……（太长截断）'
    return out
  },
}

export const log = {
  description: '往卡的时间线记一个里程碑（合进 dev、第 n 版发了、上了预发……）。过程细节留在话题里，别记。',
  inputSchema: { type: 'object', required: ['id', 'text'], properties: { ...byId, text: { type: 'string', description: '一句话，owner 看得懂' }, kind: { type: 'string', enum: ['', 'ms', 'rework'], description: 'ms=合入/上线/交付，rework=打回重做，空=一般进展' } } },
  async run(a, { agent, session }) {
    const { f } = await openCard(a)
    f.transact(() => {
      const c = f.data.cards[a.id]
      c.tl = { ...(c.tl || {}), [rid()]: { at: now(), kind: a.kind || '', text: a.text } }
      c.lastAt = now(); c.updatedAt = now()
      const t = linkMe(c, agent, session); if (t) c.talk = t
    })
    return 'ok'
  },
}

export const todo = {
  description: '改卡上的待办：add 加一条；done 传待办 ID（task 里括号中的）或原文，勾掉；undo 同理取消勾。',
  inputSchema: { type: 'object', required: ['id'], properties: { ...byId, add: { type: 'string' }, done: { type: 'string' }, undo: { type: 'string' } } },
  async run(a, { agent, session }) {
    const { f, c } = await openCard(a)
    const find = (k) => Object.entries(c.todos || {}).find(([id, t]) => id === k || t.text === k)?.[0]
    const hit = a.done ?? a.undo
    const key = hit != null ? find(hit) : null
    if (hit != null && !key) throw new Error('没有这条待办：' + hit)
    if (a.add == null && hit == null) throw new Error('传 add、done 或 undo')
    const nid = rid()
    f.transact(() => {
      const x = f.data.cards[a.id]
      const m = { ...(x.todos || {}) }
      if (a.add) m[nid] = { text: a.add, done: false, at: now() }
      if (key) m[key] = { ...m[key], done: a.done != null }
      x.todos = m; x.lastAt = now(); x.updatedAt = now()
      const t = linkMe(x, agent, session); if (t) x.talk = t
    })
    return a.add ? 'ok ' + nid : 'ok'
  },
}

export const comment = {
  description: '在卡上写一条评论（给 owner 看的说明、问题）。要他拍板别用评论，用 put 把卡挪到 you 并写 questions。',
  inputSchema: { type: 'object', required: ['id', 'text'], properties: { ...byId, text: { type: 'string' } } },
  async run(a, { agent }) {
    const { f } = await openCard(a)
    f.transact(() => {
      const c = f.data.cards[a.id]
      c.cmts = { ...(c.cmts || {}), [rid()]: { text: a.text, at: now(), by: agent } }
      c.updatedAt = now()
    })
    return 'ok'
  },
}

export const memory = {
  description: '读或改整板记忆（跨任务的约定和结论）。不传 set/append 就是读，返回规矩和记忆；发现值得长期记的事用 append 加一行。',
  inputSchema: { type: 'object', properties: { ...where, append: { type: 'string', description: '加一行' }, set: { type: 'string', description: '整段替换，慎用' } } },
  async run(a) {
    const f = await openBoard(a)
    if (a.set != null) f.data.memory = a.set
    else if (a.append) f.data.memory = ((f.data.memory || '').trimEnd() + '\n- ' + a.append).trim()
    const rules = Object.values(f.data.rules || {}).map((r) => '- ' + r.text).join('\n')
    return `规矩：\n${rules || '（无）'}\n\n记忆：\n${f.data.memory || '（无）'}`
  },
}
