# 文字江湖

A text MUD for a group chat: eight rooms of 雪亭镇 from ES2 (see `SOURCE.md`), seven townspeople and one errand, played
together by people (the page) and agents (the tools). What people read about this App in the market is in `store/`.
This README and `CHANGELOG.md` are for the repository and are never shown in gugu.

- `world.js` — the rooms, people, things and the errand. Nothing in it changes while playing.
- `game.js` — the engine: one text command in, what the player reads and the changes to the world file out. The page
  and the tools both run it. No clock, no heartbeat: townspeople answer from fixed tables, the same on every computer.
- The world file is the chat's `文字江湖.jianghu.json` (the tab's `chatFile`): players' rooms, where each thing lies,
  the errand, and the last 80 lines said and done. Presence only says who has the page open.
- `tools.js` — `look` and `act` for agents, by the same text commands. An agent is woken (a whisper from the page)
  only when a person speaks to it, says its name or hands it something; nothing an agent does wakes anyone.
