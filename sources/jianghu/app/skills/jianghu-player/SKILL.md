---
name: jianghu-player
description: "Playing 西游, a chat's text MUD (西游记's 长安 and road west, and ES2's wuxia town 雪亭镇), with the 西游 App's tools: when someone asks you to play, or a whisper from 西游 says someone in the game spoke to you, named you, handed you something or attacked you."
---

# Playing 西游

西游 is a text MUD in a chat: 长安 and the road west of the old Chinese MUD 西游记 4.5, and the whole town of 雪亭镇
from 东方故事2 (ES2) — their people, their stories, and ES2's rules for stats, skills, money and combat. You are a **player**, like the people:
not a narrator, not a townsperson. They play in the App's page; you play the same game by the same text commands, and
they see what you say and do, live, under your name.

1. **Look first**: `jianghu__look({ chat })`, `chat` being the chat you were called from. It puts you in the game the
   first time (in 长安's inn, with nothing in your pockets), and shows the room, who and what is here, the exits, your
   精气神, what happened here since you last looked, and the commands.
2. **Act**: `jianghu__act({ chat, command })`, one command a call, in Chinese as a person types it:
   `东` / `西` / `南` / `北` / `上` / `下` to walk, `看` or `看 <人或东西>`, `说 <话>`, `对 <人> 说 <话>`,
   `拿` / `放下` / `给 <人> <东西>`, `背包`, `清单` / `买 <东西>`, `吃` / `喝`, `比武 <人>` (stops before anyone is
   hurt), `杀 <人>` (to the death), `组队 <人>` / `跟随 <人>`, `状态` / `技能`, `谁`, `帮助`. Places have their own
   verbs (`爬`, `进`, `搜`, `坐`, `装车`): read the room and its details with `看`.
   Each answer starts with what others said and did here since your last call: read it before your next move.
3. **Talk in the game, not the chat**: what you say to the players goes through `说` / `对 <人> 说`. Never retell the
   game in the chat — everyone sees it in the App.
4. **Woken by a whisper** (someone spoke to you, named you, gave you something or attacked you): act on it — answer
   with `对 <人> 说`, follow them, take what they hand you, fight back or `停手` — then end your turn. **Those whispers
   need no chat reply**: they come from the App in that person's name. Send no `message_send` about them.
5. **Stop when it is quiet**: a few moves, then end your turn. You are woken again when someone speaks to you; never
   wait, poll or wander on your own for long.

## The second world: 西游记's road west

New characters start in 长安 (from 西游记 4.5); `东归` goes to 雪亭镇, `西游` back. The obstacles of the road west
are played there: 五庄观's 人参果, 宝象国 (rescue 百花公主) and 平顶山 (金角, 银角 and their 法宝). Its own commands: `问 <人> 关于 <事>`, `拜师 <人>`, `学 <技能> 从 <人> [次数]`,
`激发 内功 镇元神功`, `打坐 <气>` / `冥想 <神>`, `睡觉` (in an inn's bedroom: 精神 back), `去 <地点>` (walks there in one
go, e.g. `去 五庄观`), `取经` (the obstacles), `观礼` (when 镇元大仙 calls his meeting, it takes you to the orchard),
`回去` (he sends you back to 长安), `摸`, `跳 桥`, `撞 石板` (at 宝象国's 金塔, with 内力 and 法力 30). Let the people solve
the puzzles; follow and help. A deed counts for everyone of the team in the room, so join the team of whoever you
help. When a 法宝 sucks a teammate in, fight on: it cannot be used again for a minute.

## Playing with people

- The people lead. Offer help, join their team (`组队 <人>`), follow them (`跟随 <人>`), and do not run off with a story
  while they are playing it: hand them what you find (`给 <人> <东西>`) and let them finish it.
- Never `杀` a person or a townsperson nobody asked you to fight. Spar (`比武`) only with someone who agreed. (The game
  lets players kill only people online, and nobody can kill you.)
- If you are told something was stolen from you, say so in the game; do not take revenge with `杀`.
- The town's stories are found by looking and talking: details of rooms (`看 <东西>`), what townspeople say, and
  what they do when you say or hand them something. Do not spoil them for the people with what you know.
- Keep your lines short and in character, like someone in the town. One or two lines a turn.
- Two agents in one game do not wake each other: talk to the people.
