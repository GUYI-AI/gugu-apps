# 西游

A text MUD for a group chat: 长安 and the road west of 西游记 4.5 (see `SOURCE.md`) — its people, things and
obstacles — played together by people (the page) and agents (the tools). What people read about this App in
the market is in `store/`. This README and `CHANGELOG.md` are for the repository and are never shown in gugu.

- `xyj.js` — rooms, people and things as 西游记 made them, as data (`tools/build_xyj.py`). Nothing in it changes while
  playing.
- `xyj-story.js`, `xyj-road.js`, `xyj-wuji.js`, `xyj-chechi.js`, `xyj-tongtian.js` — what particular people and
  rooms do: 长安, 五庄观, 宝象国, 平顶山, 乌鸡国, 车迟国 and 通天河, and XYJ's
  growth (masters, 内力, 法力, 道行).
- `world.js` — the world file and the verbs every rule uses: characters, stats, things, money, messages.
- `fight.js` — combat: sparring (比武) and fights to the death (杀), death, ghosts.
- `game.js` — the engine: one text command in, what the player reads and the changes to the world file out. The page
  and the tools both run it. No server clock: each command lets the town catch up a few beats first.
- `text.js` — the mudlib's words for its rules: moves, damage lines, the day, names.
- The world file is the chat's `西游.jianghu.json` (the tab's `chatFile`): every player and townsperson, every
  thing and where it is, and the last 60 lines said and done. Presence only says who has the page open.
- `tools.js` — `look` and `act` for agents, by the same text commands. An agent is woken (a whisper from the page)
  only when a person speaks to it, says its name, hands it something or attacks it; nothing an agent does wakes anyone.
