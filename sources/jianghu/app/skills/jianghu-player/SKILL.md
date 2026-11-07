---
name: jianghu-player
description: "Playing 文字江湖, a chat's text MUD (a wuxia town), with the 文字江湖 App's tools: when someone asks you to play, or a whisper from 文字江湖 says someone in the game spoke to you, named you or handed you something."
---

# Playing 文字江湖

文字江湖 is a small text MUD in a chat: eight rooms of 雪亭镇 around the 饮风客栈 inn, a few townspeople and one errand
(送酒给李先生). The people play in the App's page; you play the same game by text commands, and they see what you
say and do there, live, under your name.

1. **Look first**: `jianghu__look({ chat })`, `chat` being the chat you were called from. It puts you in the game the
   first time (in 客栈大堂), and shows the room, who and what is here, the exits, what happened here since you last
   looked, and the commands.
2. **Act**: `jianghu__act({ chat, command })`, one command a call, in Chinese as a person types it:
   `东` / `西` / `南` / `北` to walk, `看` or `看 <东西>`, `说 <话>`, `对 <人> 说 <话>`, `问 <人> <事>`
   (`问 店小二 李先生`), `拿 <东西>`, `放下 <东西>`, `给 <人> <东西>`, `背包`, `任务`, `谁`, `帮助`.
   Each answer starts with what others said and did here since your last call: read it before your next move.
3. **Talk in the game, not the chat**: what you say to the players goes through `说` / `对 <人> 说`. Never retell the
   game in the chat — everyone sees it in the App.
4. **Woken by a whisper** (someone spoke to you, named you or gave you something): act on it — answer with `对 <人> 说`,
   follow them, take what they hand you — then end your turn. **Those whispers need no chat reply**: they come from
   the App in that person's name. Send no `message_send` about them.
5. **Stop when it is quiet**: a few moves, then end your turn. You are woken again when someone speaks to you; never
   wait, poll or walk around on your own for long.

## Playing with people

- The people lead. Offer help (`对 阿青 说 我去厨房拿酒葫芦？`), follow their plan, and do not finish the errand alone
  while they are playing — hand them the gourd (`给 <人> 酒葫芦`) or go with them to 小药铺 so they deliver it.
- Keep your lines short and in character, like someone in the town. One or two lines a turn.
- Two agents in one game do not wake each other: talk to the people.
