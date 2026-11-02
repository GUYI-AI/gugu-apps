// The App's own words, in the person's language (zh or en): everything else on the page is their data.
const WORDS = {
  zh: {
    open: '展开', ask: '问 agent', rows: (n) => `${n} 行`, truncated: (n) => `只取前 ${n} 行`, newer: (v) => `文件已有 v${v}`,
    loading: '正在读取…', querying: '正在计算…', pick: '选一个数据文件', none: '这个群还没有 .csv / .xlsx / .sqlite 文件',
    noneHint: '把数据文件发到群里，再让 agent 发一张数据卡片', run: '运行', table: '表', view: '视图', sql: 'SQL',
    askDraft: (name, sql) => `关于 ${name}，查询：\n${sql}\n`, cardDraft: (name, data) => `用 data-lens 把这个视图发成卡片（${name}）：\n${data}`,
    send: '让 agent 发成卡片', gone: '这个文件不在了，或者你看不到它', badCard: '这张卡片的数据有问题', failed: '出错了',
  },
  en: {
    open: 'Open', ask: 'Ask an agent', rows: (n) => `${n} rows`, truncated: (n) => `first ${n} rows only`, newer: (v) => `file now at v${v}`,
    loading: 'Reading…', querying: 'Calculating…', pick: 'Pick a data file', none: 'No .csv / .xlsx / .sqlite files in this chat yet',
    noneHint: 'Send a data file to the chat, then ask an agent for a data card', run: 'Run', table: 'Table', view: 'View', sql: 'SQL',
    askDraft: (name, sql) => `About ${name}, query:\n${sql}\n`, cardDraft: (name, data) => `Send this view as a data-lens card (${name}):\n${data}`,
    send: 'Ask an agent to send it as a card', gone: 'This file is gone, or you cannot see it', badCard: 'This card’s data is not valid', failed: 'Something went wrong',
  },
}

let lang = 'zh'
export const setLocale = (locale) => { lang = String(locale ?? '').toLowerCase().startsWith('zh') ? 'zh' : 'en' }
export const t = (key, ...args) => {
  const word = WORDS[lang][key]
  return typeof word === 'function' ? word(...args) : word
}
