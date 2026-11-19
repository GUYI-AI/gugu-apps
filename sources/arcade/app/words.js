// The arcade's words: Chinese for a zh client, English for any other.
const WORDS = {
  zh: {
    app: '联机小游戏', gamesLabel: '游戏', openInGroup: '在群里打开', openHint: '群聊 → 应用 → 联机小游戏，群里的人一起玩', left: '已离开的成员',
    gomoku: '五子棋', snake: '贪吃蛇', tanks: '坦克大战', bomber: '炸弹人',
    sit: { b: '执黑', w: '执白' }, stand: { b: '离开黑座', w: '离开白座' }, colour: { b: '黑', w: '白' },
    empty: '空位', gone: (n) => `${n}（已离开）`, won: (n) => `${n} 赢了`, you: '（你）', again: '再来一局',
    seats: (b, w, c, mine) => `黑：${b}　白：${w}　· 轮到${c}${mine ? '（你）' : ''}`,
    respawn: '复活中　', sep: '　', fire: '开火', tankScore: '击毁/被毁', drop: '放炸弹', fresh: '新的一局', bombScore: '炸到/被炸',
    snakeScore: (n) => `${n} 分 · 方向键 / WASD / 滑动`, snakeStart: '点一下或按空格开始', best: '最佳',
  },
  en: {
    app: 'Arcade', gamesLabel: 'Games', openInGroup: 'Open it in a group', openHint: 'Group chat → Apps → Arcade, and everyone in the group plays', left: 'A member who left',
    gomoku: 'Gomoku', snake: 'Snake', tanks: 'Tanks', bomber: 'Bomber',
    sit: { b: 'Play black', w: 'Play white' }, stand: { b: 'Leave black', w: 'Leave white' }, colour: { b: 'Black', w: 'White' },
    empty: 'open', gone: (n) => `${n} (left)`, won: (n) => `${n} wins`, you: ' (you)', again: 'Play again',
    seats: (b, w, c, mine) => `Black: ${b}  White: ${w}  · ${c} to move${mine ? ' (you)' : ''}`,
    respawn: 'Respawning  ', sep: '  ', fire: 'Fire', tankScore: 'Kills/deaths', drop: 'Drop bomb', fresh: 'New round', bombScore: 'Kills/deaths',
    snakeScore: (n) => `${n} pts · arrows / WASD / swipe`, snakeStart: 'Tap or press Space to start', best: 'best',
  },
}

export const wordsFor = (locale) => WORDS[String(locale ?? '').startsWith('zh') ? 'zh' : 'en']
