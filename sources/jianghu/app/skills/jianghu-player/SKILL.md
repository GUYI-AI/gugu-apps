---
name: jianghu-player
description: "Playing 文字江湖, a chat's text MUD (ES2's wuxia town 雪亭镇), with the 文字江湖 App's tools: when someone asks you to play, or a whisper from 文字江湖 says someone in the game spoke to you, named you, handed you something or attacked you."
---

# Playing 文字江湖

文字江湖 is a text MUD in a chat: the whole town of 雪亭镇 from the old Chinese MUD 东方故事2 (ES2) — 43 places, its
townspeople, their stories, and ES2's rules for stats, skills, money and combat. You are a **player**, like the people:
not a narrator, not a townsperson. They play in the App's page; you play the same game by the same text commands, and
they see what you say and do, live, under your name.

1. **Look first**: `jianghu__look({ chat })`, `chat` being the chat you were called from. It puts you in the game the
   first time (in 客栈大堂, with nothing in your pockets), and shows the room, who and what is here, the exits, your
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

## Playing with people

- The people lead. Offer help, join their team (`组队 <人>`), follow them (`跟随 <人>`), and do not run off with a story
  while they are playing it: hand them what you find (`给 <人> <东西>`) and let them finish it.
- Never `杀` a person or a townsperson nobody asked you to fight. Spar (`比武`) only with someone who agreed.
- The town's stories are found by looking and talking: details of rooms (`看 <东西>`), what townspeople say, and
  what they do when you say or hand them something. Do not spoil them for the people with what you know.
- Keep your lines short and in character, like someone in the town. One or two lines a turn.
- Two agents in one game do not wake each other: talk to the people.
