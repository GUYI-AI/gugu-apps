// gugu contribution, as data: which GitHub issues and pull requests count, whose they are, what they were scored, and the
// board. No DOM, no network: panel.js fetches, test/ checks this file in Node.

export const ORG = 'GUYI-AI'
/** The identity word. One word on purpose: GitHub's search splits `Gugu-Account` into "gugu account" and finds every
 *  issue about accounts, while `GuguAccount` stays one token, so the search and the review list hold only contributions. */
export const ACCOUNT_WORD = 'GuguAccount'
const ACCOUNT_LINE = new RegExp(`^${ACCOUNT_WORD}:[ \\t]*(\\d+)[ \\t]*$`, 'gm')
export const SCORES = [0, 1, 2, 3, 4, 5]
export const SEARCH_PAGES = 10 // GitHub's search answers at most 1000 rows: 10 pages of 100

/** The 咕咕号 a body names, or null: none, or two different ones (counted for nobody rather than guessed). */
export function accountOf(body) {
  const found = new Set([...String(body ?? '').matchAll(ACCOUNT_LINE)].map((m) => Number(m[1])))
  return found.size === 1 ? [...found][0] : null
}

/** `score:N` labels → { score } for exactly one, { conflict: true } for several, {} for none. */
export function scoreOf(labels) {
  const scores = new Set((labels ?? []).map((l) => /^score:([0-5])$/.exec(typeof l === 'string' ? l : l?.name ?? '')).filter(Boolean).map((m) => Number(m[1])))
  if (scores.size > 1) return { conflict: true }
  return scores.size === 1 ? { score: [...scores][0] } : {}
}

const repoOf = (row) => String(row.repository_url ?? '').split('/').pop()

/** One row of GitHub's issue search, as the panel shows it; null when it carries no identity line. */
export function itemOf(row) {
  const account = accountOf(row.body)
  if (account === null) return null
  const isPr = Boolean(row.pull_request)
  const state = isPr && row.pull_request.merged_at ? 'merged' : row.state === 'closed' ? 'closed' : 'open'
  const { score, conflict } = scoreOf(row.labels)
  const status = conflict ? 'conflict' : score !== undefined ? 'scored' : 'waiting'
  return {
    url: row.html_url,
    repo: repoOf(row),
    number: row.number,
    title: row.title,
    kind: isPr ? 'pr' : 'issue',
    state,
    status,
    ...(score !== undefined ? { score } : {}),
    account,
    login: row.user?.login ?? null,
    createdAt: row.created_at,
  }
}

/** Everything that counts, newest first. */
export function itemsOf(rows) {
  return rows.map(itemOf).filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

/** One person's contributions: waiting on a maintainer, scored, and the total. */
export function mineOf(items, account) {
  const mine = items.filter((item) => item.account === account)
  const waiting = mine.filter((item) => item.status !== 'scored')
  const scored = mine.filter((item) => item.status === 'scored')
  return { waiting, scored, points: scored.reduce((sum, item) => sum + item.score, 0) }
}

/** Everyone, by points; equal points share a rank. Logins are the ones each wrote under, most recent first. */
export function boardOf(items) {
  const by = new Map()
  for (const item of items) {
    const row = by.get(item.account) ?? { account: item.account, points: 0, scored: 0, waiting: 0, logins: [] }
    if (item.status === 'scored') { row.points += item.score; row.scored += 1 } else row.waiting += 1
    if (item.login && !row.logins.includes(item.login)) row.logins.push(item.login)
    by.set(item.account, row)
  }
  const rows = [...by.values()].sort((a, b) => b.points - a.points || b.scored - a.scored || a.account - b.account)
  rows.forEach((row, i) => { row.rank = i > 0 && rows[i - 1].points === row.points ? rows[i - 1].rank : i + 1 })
  return rows
}

/** An open issue a newcomer can take, as the panel shows it. */
export function starterOf(row) {
  return { url: row.html_url, repo: repoOf(row), number: row.number, title: row.title, comments: row.comments ?? 0, updatedAt: row.updated_at }
}

/** GitHub search queries (`/search/issues?q=`): everyone's, what can be claimed, and the maintainers' list of what is not scored yet. */
export const allQuery = () => `org:${ORG} "${ACCOUNT_WORD}" in:body`
export const startersQuery = () => `org:${ORG} is:issue is:open no:assignee label:"good first issue" sort:updated-desc`
export const reviewQuery = () => `${allQuery()} ${SCORES.map((n) => `-label:"score:${n}"`).join(' ')} sort:created-asc`
export const searchApi = (query, page, perPage = 100) => `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`
export const reviewUrl = () => `https://github.com/search?type=issues&q=${encodeURIComponent(reviewQuery())}`
export const STARTERS_LIMIT = 5
export const ALL_ISSUES_URL = `https://github.com/${ORG}/gugu/issues`
export const startersUrl = () => `https://github.com/${ORG}/gugu/issues?q=${encodeURIComponent('is:issue is:open label:"good first issue"')}`
export const CONTRIBUTING_URL = `https://github.com/${ORG}/gugu/blob/dev/CONTRIBUTING.md`
export const WRITE_APP_URL = `https://github.com/${ORG}/gugu/blob/dev/docs/guides/writing-a-tab-extension.md`

/** Every word of the page, in the two languages it speaks. Anything but Chinese reads English. Prompts go to agents through
 *  gugu's own sheet, where the person can still edit them; they must read fine sent untouched. */
export const TEXT = {
  zh: {
    tabs: { start: '开始贡献', mine: '我的贡献', board: '贡献榜' },
    who: (n) => `咕咕号 ${n}`,
    refresh: '刷新',
    refreshWait: '刚刷新过，一分钟后可以再刷新。',
    heading: '一起开发咕咕',
    intro: '咕咕是开源的，也是用咕咕自己开发的。你的 agent 会带你走完每一步，提交前都先给你看。',
    unsure: { action: '不知道从哪开始？问问 agent', prompt: '我想给咕咕做贡献，但不知道从哪开始。\n\n请读 skill gugu-contribution，问问我擅长什么、有多少时间，再推荐一件合适的事。' },
    report: { title: '报一个问题', body: '说说哪里不对，agent 查有没有人报过，去掉隐私信息，起草好给你看。', cost: '不用配开发环境。提交需要 GitHub 账号。', action: '交给 agent 起草', prompt: '我想给咕咕报一个问题。\n\n请读 skill gugu-contribution，先问我哪里不对，然后查重、脱敏，把草稿给我看，我同意后再提交。' },
    app: { title: '写一个 App', body: '想要的功能咕咕没有？不用改咕咕本身，做成 App，再提交上架给所有人用。', cost: '放在你自己的公开仓库里；上架要过一次审核。', action: '交给 agent 动手', guide: 'App 开发指南', prompt: '我想给咕咕写一个 App。\n\n请读 skill gugu-contribution 的「Building an App」一节，先问我它要做什么，然后带我做出来、在本机试用，再问我要不要提交上架。' },
    claim: { title: '认领一个 issue', body: '维护者挑出来适合第一次贡献的。选一个，agent 帮你认领、写修复、开 PR。', cost: '要跑代码和测试；很多修复只跑单元测试就够，不用自己搭后端。', action: '交给 agent', actionFor: (title) => `交给 agent：${title}`, none: '现在没有待认领的入门 issue。', unread: '读不到列表。', all: '在 GitHub 上看全部 issue', more: '查看全部 {n} 个', comments: (n) => (n ? `${n} 条评论，可能已有人在做` : '还没有人回复'), prompt: (s) => `我想认领这个咕咕 issue：${s.url}\n\n请读 skill gugu-contribution 的「Your first pull request」一节，先看有没有人在做，在 issue 下认领，再带我写修复、开 PR；发言和提交前都先问我。` },
    steps: { title: '第一个 PR 怎么走', items: ['在 issue 下留言认领（贡献指南要求先有 issue）', 'fork 仓库，从最新的 dev 开分支', '修好，跑相关测试', '向 dev 开 PR，写清改了什么、怎么验证的'], guide: '完整的贡献指南' },
    scoring: { title: '怎么计分', body: '维护者给每条 issue 和 PR 打 0–5 分，跟有没有合并无关。', identity: (line) => ['想记到自己名下，就在正文里单独写一行 ', line, '。这一行是公开的，写不写由你；不写也欢迎。'], line: (n) => `GuguAccount: ${n ?? '你的咕咕号'}` },
    loading: '正在读 GitHub…',
    readingNumber: '正在读取你的咕咕号…',
    noNumber: '暂时读不到你的咕咕号，一分钟后自动再试。',
    agentPage: '这个页面是 agent 打开的，看不到你的贡献；你自己打开时才有。',
    taskTitle: '给咕咕做贡献',
    handed: '已交给 agent，到它的对话里继续。',
    handFailed: (m) => `没有交出去：${m}`,
    stats: { points: '得分', scored: '已打分', waiting: '等打分' },
    waitingTitle: (n) => `等维护者打分 · ${n}`,
    scoredTitle: (n) => `已打分 · ${n}`,
    me: '（我）',
    points: (n) => `${n} 分`,
    noCredit: '已审阅，不计分',
    waiting: '等打分',
    conflict: '打分待修正',
    kind: { pr: 'PR', issue: 'issue' },
    state: { open: '未关闭', closed: '已关闭', merged: '已合并' },
    mineEmptyTitle: '还没有记在你名下的贡献',
    mineEmptyBody: '提交后，它会在这里等维护者打分。',
    mineEmptyAlready: (line) => ['已经提过了？在它的正文里单独加一行 ', line, '，十分钟内会出现在这里。'],
    startAction: '开始第一次贡献',
    boardNote: '已打分的分数相加，同分同名次。还没打分的不计入。',
    boardEmptyTitle: '榜上还没有人',
    boardEmptyBody: '第一条贡献打分后，就会出现在这里。',
    boardRow: (account, scored) => `咕咕号 ${account} · ${scored} 条已打分`,
    boardWaiting: (n) => `${n} 条等打分`,
    review: '维护者入口：待打分列表',
    updated: '更新于',
    showingFrom: '显示的是这个时间的结果：',
    partial: 'GitHub 只返回了部分结果',
    rateLimited: (reset) => `GitHub 限制了这个页面的查询频率。${reset ? `${reset} 后会自动再查。` : '稍后再刷新。'}`,
    httpFailed: (status) => `GitHub 搜索出错了（HTTP ${status}）。稍后再刷新。`,
    timedOut: (s) => `GitHub ${s} 秒没有回应。检查网络后再刷新。`,
    offline: '连不上 GitHub（api.github.com）。网络恢复后会自动再查。',
  },
  en: {
    tabs: { start: 'Get started', mine: 'My work', board: 'Leaderboard' },
    who: (n) => `Gugu ID ${n}`,
    refresh: 'Refresh',
    refreshWait: 'Just refreshed. You can refresh again in a minute.',
    heading: 'Help build gugu',
    intro: 'gugu is open source, and built in gugu itself. Your agent walks you through every step and shows you everything before it is submitted.',
    unsure: { action: 'Not sure where to start? Ask your agent', prompt: 'I want to contribute to gugu but do not know where to start.\n\nPlease read the skill gugu-contribution, ask what I am good at and how much time I have, then suggest something that fits.' },
    report: { title: 'Report a problem', body: 'Say what is wrong. The agent checks for an existing report, removes private details and shows you a draft.', cost: 'No dev setup. Submitting needs a GitHub account.', action: 'Have my agent draft it', prompt: 'I want to report a problem in gugu.\n\nPlease read the skill gugu-contribution, ask me what is wrong, search for duplicates, redact, and show me the draft. Submit only after I agree.' },
    app: { title: 'Build an App', body: 'Want something gugu lacks? No need to change gugu itself: build it as an App and submit it for listing, for everyone to use.', cost: 'Lives in your own public repository; listing is reviewed once.', action: 'Have my agent start', guide: 'App guide', prompt: 'I want to build an App for gugu.\n\nPlease read the "Building an App" section of the skill gugu-contribution, ask me what it should do, build it with me, try it locally, then ask whether to submit it for listing.' },
    claim: { title: 'Claim an issue', body: 'Picked by maintainers for a first contribution. Choose one; the agent claims it, writes the fix and opens the pull request with you.', cost: 'Means running code and tests. Many fixes need only unit tests, with no backend of your own.', action: 'Hand to my agent', actionFor: (title) => `Hand to my agent: ${title}`, none: 'No starter issues are waiting right now.', unread: 'Could not load the list.', all: 'See all issues on GitHub', more: 'See all {n}', comments: (n) => (n ? `${n} ${n === 1 ? 'comment' : 'comments'}; someone may be on it` : 'No replies yet'), prompt: (s) => `I want to take this gugu issue: ${s.url}\n\nPlease read the "Your first pull request" section of the skill gugu-contribution, check whether anyone is on it, claim it on the issue, then write the fix and open the pull request with me. Ask me before anything is posted or submitted.` },
    steps: { title: 'How a first pull request goes', items: ['Comment on the issue to claim it (the contributing guide asks for an issue first)', 'Fork the repository and branch from the latest dev', 'Fix it and run the related tests', 'Open a pull request to dev saying what changed and how you checked it'], guide: 'Full contributing guide' },
    scoring: { title: 'How points work', body: 'Maintainers score each issue and pull request 0–5, whether or not it was merged.', identity: (line) => ['To have one count for you, put ', line, ' on its own line in the body. That line is public and optional; contributions without it are just as welcome.'], line: (n) => `GuguAccount: ${n ?? '<your Gugu ID>'}` },
    loading: 'Reading GitHub…',
    readingNumber: 'Reading your Gugu ID…',
    noNumber: 'Cannot read your Gugu ID right now. Trying again in a minute.',
    agentPage: 'An agent opened this page, so your work is not shown here. It is when you open the page yourself.',
    taskTitle: 'Contribute to gugu',
    handed: 'Handed to the agent. Continue in its conversation.',
    handFailed: (m) => `Not handed over: ${m}`,
    stats: { points: 'Points', scored: 'Reviewed', waiting: 'Waiting' },
    waitingTitle: (n) => `Waiting for review · ${n}`,
    scoredTitle: (n) => `Reviewed · ${n}`,
    me: ' (me)',
    points: (n) => `${n} ${n === 1 ? 'point' : 'points'}`,
    noCredit: 'Reviewed, no points',
    waiting: 'Waiting',
    conflict: 'Score being fixed',
    kind: { pr: 'PR', issue: 'Issue' },
    state: { open: 'Open', closed: 'Closed', merged: 'Merged' },
    mineEmptyTitle: 'Nothing under your name yet',
    mineEmptyBody: 'Once you submit something, it waits here for a review.',
    mineEmptyAlready: (line) => ['Already opened one? Add ', line, ' on its own line in the body. It shows up here within 10 minutes.'],
    startAction: 'Start a first contribution',
    boardNote: 'Total points from reviewed contributions; equal points share a rank. Anything not reviewed yet does not count.',
    boardEmptyTitle: 'Nobody on the board yet',
    boardEmptyBody: 'The first contribution appears here once it is reviewed.',
    boardRow: (account, scored) => `Gugu ID ${account} · ${scored} reviewed`,
    boardWaiting: (n) => `${n} waiting`,
    review: 'For maintainers: waiting for a score',
    updated: 'Updated',
    showingFrom: 'Showing results from',
    partial: 'GitHub returned only part of the results',
    rateLimited: (reset) => `GitHub is limiting how often this page can search. ${reset ? `Trying again at ${reset}.` : 'Refresh again in a while.'}`,
    httpFailed: (status) => `GitHub search failed (HTTP ${status}). Refresh again in a while.`,
    timedOut: (s) => `GitHub did not answer for ${s} seconds. Check your network, then refresh.`,
    offline: 'Cannot reach GitHub (api.github.com). Trying again when your network is back.',
  },
}
export const textFor = (locale) => (/^zh/i.test(locale ?? '') ? TEXT.zh : TEXT.en)
