// The fleet's words, for the org page and the message card. A wait kind, a lane state, a check: each worded once here.
export const FLEET_WORDS = {
  zh: {
    title: '舰队', you: '你', live: '实时', machines: (on, all) => `${on}/${all} 台机器在线`, refresh: '刷新',
    views: { org: '组织图', ledger: '账本' },
    waits: { owner: '等你拍板', review: '等研发审', ci: '等 CI', merge: '等合并', lane: '等别的车道', quota: '等额度', error: '出错', other: '在等' },
    waitShort: { owner: '等你', review: '等审', ci: '等 CI', merge: '等合并', lane: '等车道', quota: '额度', error: '出错', other: '在等' },
    states: { running: '运行中', parked: '后台运行', approval: '待批准', answer: '待回复', done: '本轮完成', stopped: '已停止', error: '出错', gone: '不可用', none: '无状态' },
    counts: { running: '在跑', owner: '等你拍板', external: '等 CI/审/合', error: '出错' },
    asksTitle: '等你拍板', asksNone: '没有等你拍板的事', others: '在等别人', allLanes: '全部',
    say: '写一句…', reply: '回复', send: '发送', sent: '已发送', toTask: '去处理', decidedNote: (n) => `已记入账本 D-${n}，并发给车道`,
    supervisor: '主管', locked: '主管不可归档', offline: '失联', offlineSince: '显示上次读数', noSupervisor: '这台机器还没有主管',
    unplaced: '没挂在主管下', crossMachine: '跨机器挂', ended: (n) => `已结束 ${n}`, stale: '超过 45 分钟没更新', drift: '车道写的已过时',
    loose: '列表里找不到的车道', noBoard: '没有看板：只显示会话，车道填的字段与账本不可用', pickBoard: '选择看板',
    lanes: (n) => `${n} 条`, waitingN: (n) => `${n} 条在等`,
    // the open lane
    on: (machine, parent) => `${machine} · 挂在 ${parent}`, rootOn: (machine) => `${machine} · 根会话`,
    fields: { state: '状态', wait: '在等', head: '头 sha', pr: 'PR', dest: '去向', next: '进展', updated: '更新', engine: '引擎', machine: '机器' },
    from: { lane: '车道填', pr: 'PR 同步', task: '自动', decision: '账本' },
    pr: { pending: 'CI 在跑', green: 'CI 绿', red: 'CI 红', required: '待审', approved: '已批准', changes: '要求修改', merged: '已合并', closed: '已关闭', mismatch: '头 sha 与车道写的不一致' },
    message: '发消息', messagePlaceholder: (name) => `给「${name}」的消息`, transcript: '看对话', openPr: (n) => `打开 PR #${n}`,
    more: '更多', less: '收起', details: '详细字段', decisionsHere: '作用到这条车道的决定', none: '没有',
    reparent: '改挂主管', reparentHint: '只列同一台机器上的会话（不跨机器挂）', reparentGo: '交给主管执行', current: '当前',
    handoff: '交接', handoffTo: '接手方', handoffGo: '发起交接', handoffWait: (who) => `等「${who}」确认接手`, handoffDone: (who) => `「${who}」已接手`, cancelHandoff: '撤回交接',
    archive: '归档', archiveWarn: '归档后不能恢复，这个会话也再收不到消息。', archiveType: '输入车道名确认', archiveGo: '交给主管执行归档',
    checks: { notSupervisor: '不是主管', handedOver: '接手方已确认，或 PR 已开出', noChildren: '下面没有挂着的会话' },
    markSupervisor: '设为这台机器的主管', pinSupervisor: '固定为这台机器的主管', unmarkSupervisor: '取消主管标记',
    noCard: '这条车道还没有看板卡：先让车道在这块看板上 claim 一张卡', noSup: '这台机器没有主管可以执行',
    asked: (who) => `已发给「${who}」执行`,
    // instructions sent to agents
    toSupervisorParent: (lane, parent, card) => `请用 session_set_parent 把 session:${lane.sessionId}（${lane.title ?? ''}）改挂到 session:${parent.sessionId}（${parent.title ?? ''}）下面。这是在舰队组织图上点的。${card}`,
    toSupervisorArchive: (lane, card) => `请归档 session:${lane.sessionId}（${lane.title ?? ''}）：先确认它的交接已被接手或 PR 已开出，再用 session_archive。这是在舰队组织图上点的，页面已核对过：不是主管、下面没有会话。${card}`,
    toHandoff: (lane, card, board) => `请接手车道「${lane.title ?? ''}」（session:${lane.sessionId}）。先把它的对话里发出和收到的消息全部读完，再调 kanban__handoff_accept { board: "${board}", card: "${card}" } 确认接手。`,
    toDecision: (d) => `Owner 拍板 D-${d.n}：${d.question} → ${d.answer}`,
    cardNote: (board, card) => (card ? `完成后在看板卡上留一句：kanban__comment { board: "${board}", card: "${card}" }。` : ''),
    // ledger
    ledger: { pending: '待拍板', live: '生效中', all: '全部', add: '记一条决定', question: '事项', answer: '决定（空着就是待拍板）', scope: '范围', ref: '机器 / 版本 / 卡片', save: '记下', withdraw: '作废', decide: '拍板', source: '原话', none: '账本是空的' },
    scopes: { fleet: '全舰队', machine: '机器', lane: '车道', release: '版本' },
    statuses: { pending: '待拍板', decided: '已决', superseded: '已替代', withdrawn: '已作废' },
    // the message card
    open: '点开处理', cardEmpty: '没有找到舰队看板', cardGone: '看板已删除，或你不在这个对话里',
  },
  en: {
    title: 'Fleet', you: 'You', live: 'Live', machines: (on, all) => `${on}/${all} machines online`, refresh: 'Refresh',
    views: { org: 'Org chart', ledger: 'Decisions' },
    waits: { owner: 'Waiting on you', review: 'Waiting on review', ci: 'Waiting on CI', merge: 'Waiting to merge', lane: 'Waiting on a lane', quota: 'Out of quota', error: 'Failing', other: 'Waiting' },
    waitShort: { owner: 'You', review: 'Review', ci: 'CI', merge: 'Merge', lane: 'Lane', quota: 'Quota', error: 'Error', other: 'Waiting' },
    states: { running: 'Running', parked: 'In background', approval: 'Awaiting approval', answer: 'Awaiting reply', done: 'Turn complete', stopped: 'Stopped', error: 'Error', gone: 'Unavailable', none: 'No status' },
    counts: { running: 'running', owner: 'on you', external: 'CI/review/merge', error: 'failing' },
    asksTitle: 'Waiting on you', asksNone: 'Nothing waits on you', others: 'Waiting on others', allLanes: 'All',
    say: 'Write a line…', reply: 'Reply', send: 'Send', sent: 'Sent', toTask: 'Open', decidedNote: (n) => `Recorded as D-${n} and sent to the lane`,
    supervisor: 'Supervisor', locked: 'Supervisors are never archived', offline: 'Offline', offlineSince: 'last known', noSupervisor: 'No supervisor on this machine',
    unplaced: 'Not under a supervisor', crossMachine: 'Parent on another machine', ended: (n) => `${n} ended`, stale: 'Not updated for over 45 minutes', drift: 'The lane’s word is out of date',
    loose: 'Lanes not in the task list', noBoard: 'No board: sessions only; lane fields and decisions are unavailable', pickBoard: 'Board',
    lanes: (n) => `${n}`, waitingN: (n) => `${n} waiting`,
    on: (machine, parent) => `${machine} · under ${parent}`, rootOn: (machine) => `${machine} · root`,
    fields: { state: 'State', wait: 'Waiting', head: 'Head', pr: 'PR', dest: 'Going to', next: 'Progress', updated: 'Updated', engine: 'Engine', machine: 'Machine' },
    from: { lane: 'lane', pr: 'PR sync', task: 'auto', decision: 'ledger' },
    pr: { pending: 'CI running', green: 'CI green', red: 'CI red', required: 'review required', approved: 'approved', changes: 'changes requested', merged: 'merged', closed: 'closed', mismatch: 'head differs from the lane’s' },
    message: 'Message', messagePlaceholder: (name) => `Message to “${name}”`, transcript: 'Transcript', openPr: (n) => `Open PR #${n}`,
    more: 'More', less: 'Less', details: 'All fields', decisionsHere: 'Decisions for this lane', none: 'None',
    reparent: 'Move under…', reparentHint: 'Only sessions on the same machine (never across machines)', reparentGo: 'Ask the supervisor', current: 'current',
    handoff: 'Hand over', handoffTo: 'To', handoffGo: 'Start handoff', handoffWait: (who) => `Waiting for “${who}” to accept`, handoffDone: (who) => `“${who}” took over`, cancelHandoff: 'Cancel handoff',
    archive: 'Archive', archiveWarn: 'Archived sessions cannot be restored and receive no more messages.', archiveType: 'Type the lane’s name to confirm', archiveGo: 'Ask the supervisor to archive',
    checks: { notSupervisor: 'Not a supervisor', handedOver: 'Handoff accepted, or a PR is open', noChildren: 'No sessions under it' },
    markSupervisor: 'Make supervisor of this machine', pinSupervisor: 'Keep as this machine’s supervisor', unmarkSupervisor: 'Remove supervisor mark',
    noCard: 'This lane has no card: have it claim one on this board first', noSup: 'No supervisor on this machine to do it',
    asked: (who) => `Sent to “${who}”`,
    toSupervisorParent: (lane, parent, card) => `Please move session:${lane.sessionId} (${lane.title ?? ''}) under session:${parent.sessionId} (${parent.title ?? ''}) with session_set_parent. Asked from the fleet org chart. ${card}`,
    toSupervisorArchive: (lane, card) => `Please archive session:${lane.sessionId} (${lane.title ?? ''}): confirm its handoff was accepted or its PR is open, then session_archive. Asked from the fleet org chart, which checked it is not a supervisor and has no sessions under it. ${card}`,
    toHandoff: (lane, card, board) => `Please take over the lane “${lane.title ?? ''}” (session:${lane.sessionId}). Read every message it sent and received first, then confirm with kanban__handoff_accept { board: "${board}", card: "${card}" }.`,
    toDecision: (d) => `Owner decided D-${d.n}: ${d.question} → ${d.answer}`,
    cardNote: (board, card) => (card ? `When done, leave a line on the card: kanban__comment { board: "${board}", card: "${card}" }.` : ''),
    ledger: { pending: 'Pending', live: 'In force', all: 'All', add: 'Record a decision', question: 'Question', answer: 'Decision (empty: pending)', scope: 'Scope', ref: 'Machine / release / card', save: 'Record', withdraw: 'Withdraw', decide: 'Decide', source: 'Source', none: 'No decisions yet' },
    scopes: { fleet: 'Fleet', machine: 'Machine', lane: 'Lane', release: 'Release' },
    statuses: { pending: 'Pending', decided: 'Decided', superseded: 'Superseded', withdrawn: 'Withdrawn' },
    open: 'Open', cardEmpty: 'No fleet board found', cardGone: 'The board was deleted, or you left this chat',
  },
}

export const wordsFor = (locale) => FLEET_WORDS[String(locale ?? '').startsWith('zh') ? 'zh' : 'en']

/** An engine's short name from listAgents' providerId. */
export const engineOf = (agent) => {
  const p = String(agent?.providerId ?? '').toLowerCase()
  if (p.includes('claude')) return 'Claude'
  if (p.includes('codex')) return 'Codex'
  return p ? p[0].toUpperCase() + p.slice(1) : null
}
