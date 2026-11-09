# Sources

## 雪亭镇 — ES2 Mudlib (东方故事2), whole

The world of this App is the 雪亭镇 (Snow Pavilion Town) area of **ES2 Mudlib** by Annihilator (Ted Chang): all of it,
because it is all of the world ES2 has published. Its rooms, people, things, their words and their stories, and the
rules they run on (combat, stats, skills, money, the clock) are ES2's, turned from traditional into simplified Chinese.

- Repository: https://github.com/taedlar/es2_mudlib, taken at commit `7309240af1720b813cef3eb0ba135afc1f19c2ac`.
- Licence: MIT. The relicensing is stated in the repository's README ("Since 2022, Annihilator has released ES2 Mudlib
  on GitHub under the MIT License"), and the `LICENSE` file has been in the repository since its initial commit
  `66ac0c766dea95892beef447fff2e74fb53550c0` (2022-09-29):
  https://github.com/taedlar/es2_mudlib/blob/7309240af1720b813cef3eb0ba135afc1f19c2ac/LICENSE.
  The files used carry `author: Annihilator` or no author line, and the history has the one author.
- Only data and rules were taken. No LPC code and nothing of the Neolith driver (which does not allow commercial use)
  is in this App; the engine is this App's own JavaScript.

### Where each part comes from

| In this App | From ES2 (`mudlib/`) |
|---|---|
| `es2.js`: 43 rooms, 24 people, 44 things — names, descriptions, details, exits, doors, who and what is where, stats, skills, chat lines, wares | `d/snow/*.c`, `d/snow/npc/*.c`, `d/snow/npc/obj/*.c`, and the stock things they use: `obj/area/man.c`, `obj/area/obj/*.c`, `obj/food/*.c`, `obj/medication/*.c`, `obj/armor/fur_hat.c`, `obj/money/*.c`, `obj/bottle.c` |
| `story.js`: what each person and room does (climbing, the stories, the inn's hours, the school, wages, the map) | the `init`, `accept_object`, `relay_say`, `accept_fight`, `accept_apprentice`, `schedule`, `add_action` code of those files |
| `fight.js`: combat — who swings, hit and dodge, damage, wounds, sparring and killing, death, corpses, ghosts | `feature/char/attack.c`, `feature/char/combat.c`, `adm/daemons/combatd.c`, `std/char.c`, `adm/daemons/chard.c`, `obj/corpse.c`, `std/room/temple.c` |
| `world.js`: stats (精气神, 形体, food, water), regeneration, money, carrying | `feature/statistic.c`, `std/race/humanoid.c`, `daemon/race/human.c`, `feature/char/finance.c` |
| `text.js`: sword and fist moves, damage and status lines, death lines, the day's phases and clock, names of skills, stats and classes, emotes | `daemon/skill/sword.c`, `daemon/skill/unarmed.c`, `adm/daemons/combatd.c`, `adm/etc/nature/day_phase`, `adm/daemons/natured.c`, `data/chinese.o`, `data/emoted.o`, `daemon/class/*.c` |
| `game.js`: the commands and their answers | `cmds/std/*.c`, `cmds/usr/hp.c`, `score.lpc`, `skills.c`, `feature/npc/vendor.c`, `std/room/bank.c` (convert) |

### Left out, and why

- Places ES2 does not publish: the exits of 雪亭镇 to 雪吟山庄, 李家村, 野羊山, 老松林, the camp and the graveyard are
  commented out in ES2 itself. The guards at the bridge still take a 英雄帖; the narrator then says the manor is not
  in the published source.
- The 柳淳风 story of 阿宝 and 瞎眼老太婆 (`try/fon`): its steps happen in those missing places, so it cannot start.
- What belongs to the MUD server rather than the game: the post office's mail, the bug board and the 七彩石 that
  clears board records, wizards, saving and logging in. The bank keeps only `convert`.
- Rules no file in snow uses or that do not work in the published ES2: drunkenness and poison (no wine or poison in
  snow), 龙图心经's exercise (its file cannot load), sneaking and backstab, clans.

### Changed, where ES2 as published does not work

ES2's public release is a framework, and some rules are unfinished. The smallest working rule is used instead:

- Nobody levels in ES2 (no targets are set): here a level comes when 实战经验 reaches 50·L·(L+1), with ES2's 30%
  chance of a better attribute.
- Skills never rise in ES2 (only 龙图心经 has a rule): here a level comes when learned points reach (level+1)².
- Fists do no damage in ES2 (an unmapped 内功 zeroes it), and armor takes all of what is left: here fists do ES2's
  strength damage, and armor takes a random part of it, as it does of weapons.
- Only swords and fists have moves in ES2; other weapons never swing. Here they swing with three plain lines of this
  App's own (`text.js` ACTIONS.other).
- 纵跃闪躲之法 counts in defence (it has no file in ES2), and grows when one dodges.
- Teammates in the room join each other's fights to the death, as a guard would (ES2's teams are only a member list); a
  spar stays between the two who agreed to it.
- Players kill players as in ES2, but only someone who has the page open now: never an agent, never someone away, and
  nobody away or no agent is drawn into a fight as a teammate. 土地公庙, where ghosts come back to life, allows no
  fighting. A player robbed is told what went and who was near.
- What is paid at a shop leaves the world rather than piling up with the shopkeeper, so the shared
  file does not grow with every sale.
- A heap of coins (or any heap) not on you is taken whole, and a thief steals a whole heap of money rather than a part
  of it: only the one who holds a heap ever splits it, since two pages splitting one heap at once would make money.
- A spar is also lost when the one hit has no 精 left (ES2's rule is "any stat"; 精 runs out by attacking).
- Time: nothing happens unless someone types. Each command lets the town catch up a few heart beats (what the people
  in watched rooms say and do), the inn keeps its hours by the game's clock (ES2's: 60× real time), the town resets
  every 30 minutes, corpses rot in 3, 6 and 9 minutes, and a fight runs all its rounds at once.
- One fix of text: 「冲出几部」 in the sword moves is 「冲出几步」.

## 长安, 五庄观, 宝象国 and 平顶山 — 西游记 4.5

The second world (「西游」 / 「东归」, joined to 雪亭镇 by no exit) is a slice of **西游记 4.5** (神话世界·西游记, xyj450),
made on ES2 by snowcat, weiqi, mon and others in 1996–98: 长安城 without its gambling halls, club, marriage hall and
法宝 forge (72 rooms), the road west from 西门 to 嘉峪关 (14), 五庄观 whole (57), 宝象国 (44, without the palace's
inner rooms behind guards and the 落尺 trap loop) and 平顶山 (35, without the 瓜摊), with their people and things.
《西游记》 itself is in the public domain. The mudlib has no licence file (every file carries `<SecCrypt CPL V3R05>`);
the slice is carried as ES2's parts are, with its authors named here.

- Repository: https://github.com/MudRen/xyj450 (UTF-8 of https://github.com/mudchina/xyj45), `world/`.
- `xyj.js` (generated by `tools/build_xyj.py`): `d/city/*.c`, `d/westway/*.c`, `d/qujing/{wuzhuang,baoxiang,pingding}/*.c`, the people and
  things they place and sell (`d/*/npc`, `d/obj`, `d/ourhome/obj`, `d/moon/obj`), `d/obj/drug/renshen-guo.c`.
- `xyj-story.js`: the 八卦桥 (`wzgmaze1–8.c`), the key under 牡丹亭 (`anshi.c`), the orchard gate (`xiguadi.c`), the
  人参果 meeting (`renshenguo-yuan.c`, `npc/zhenyuan.c`), the fruit (`renshen-guo.c`), the masters of 五庄观
  (`npc/*.c attempt_apprentice`), and the rules `cmds/std/{learn,enable,exercise,meditate,fly,ask}.c`,
  `cmds/usr/{hp,obstacles}.c`, `include/obstacle.h`, `adm/daemons/race/human.c` (气血, 精神), `logind.c` (潜能 99).
- `xyj-road.js`: 宝象国 — 白骨精's three shapes on the 野路 (`yelu8.c`, `npc/{nuzi,furen,gonggong}.c`), the slab of the
  金塔 (`dongwai.c`), 百花羞's letter (`npc/baihua.c`), the pontoon bridge (`qiao1.c`, `qiao2.c`), the 阁门大使
  (`longfeng.c`), the king (`npc/king.c`); 平顶山 — 金角, 银角, 狐阿七大王, 老奶奶 and their 法宝 (`npc/{jinjiao,yinjiao,
  huaqi,laonai}.c`, `obj/*real.c`), 太上老君's 「done」 (`npc/taishang.c`), the 小妖 (`npc/yao1.c`, `yao2.c`).

Changed or left out in the slice:
- One character in both worlds; each world keeps its own 精气神 (「西游」 puts on XYJ's body of 100, 「东归」 takes back
  雪亭镇's). Fights and death are ES2's (fight.js), with XYJ's people read into it (道行 → level); a ghost goes 「东归」
  to 土地公庙. 法术 (`cast`), 内功 functions (`exert`, `perform`), 灵力 and the 地府 are not here.
- The key under 牡丹亭 is there once a town reset (XYJ: 15 hours after it was taken). The meeting's call reaches
  everyone in the chat; 「观礼」 is XYJ's `accept zhenyuan daxian`.
- A person placed in two rooms (the gate guards) is two people.
- The pace, changed after a playthrough: the meeting's two calls come at 30 s and a minute (XYJ: 3 and 6 minutes), and
  镇元大仙 stays 90 s after the fruit (XYJ: 5 s) so its eaters wake in time for 「回去」. `sleep.c` restores at once
  (XYJ: after 10–45 s asleep), still once in 90 s. 张果老 and the 八仙 do not `random_move`. The rule of the 八卦桥,
  which `wzgmaze*.c` leaves unsaid, is on a board at the south bank, each bridge tells how many are crossed, and a
  bridge crossed twice starts the count from itself. 「去 <地点>」 (not in XYJ) walks the shortest way, never over the
  八卦桥, into the rooms behind its puzzles or through a shut door. 疥顶小僧's book is his answer, not a thing to read.
- Numbers: XYJ's armour is divided by ten (its 35 against ES2's few), and the monsters of 宝象国 and 平顶山 keep their
  skills in proportion (×0.15–0.25) with 气血/精神 set outright (35–130) and their 道行 scaled with them, so that one
  back from 五庄观 with a friend, a newcomer will do, beats 黄袍怪, and two together 平顶山 (`xyj-road.js` TUNE;
  XYJ sets them for characters of hundreds of thousands of 道行). The gates scale too: the slab wants 内力 and 法力 30
  (XYJ 300), 百花羞 道行 2000 (XYJ 20000); 太上老君's 道行 10000 is dropped.
- Teams: a deed counts for the team in the room (the shapes killed, the letter got and given, the four of 平顶山, the
  princess home), not only the one with the last blow; the flags are kept, not XYJ's `temp` (lost on quitting).
- 法宝: one use takes the one it names out of the fight for 30 s, and then needs a minute, so a teammate can fight on;
  dropped by its owner, it is a thing, not yet usable.
- The slab stays open a minute (XYJ 10 s) so a team gets in; the bridge comes and goes every 20 s by the clock (XYJ:
  a call_out from when it was last used). The 野路 lets anyone by who
  has passed 宝象国 (XYJ: anyone past two obstacles). Words in （） are this game's hints, not XYJ's.
- A newcomer starts in 长安's inn (XYJ's start is 长安 too); 雪亭镇 stays a 「东归」 away.
- Time: XYJ's call_outs are at the mean of their random delays (the 马盗's warnings at 7, 12 and 17 s and his attack at
  27 s; 镇元大仙's sleeve every 5½ s; the robes of 碗子山 10–40 s, from the first who comes in), and a few are at once:
  the king reads the letter and hands over the 军令牌 on taking it (XYJ: 3 s and 3 s more).
- What create() draws at random is fixed: a skill level at its mean (`10*(random(9)+1)` is 50); a name drawn from
  lists (the 百姓 of `npc/people.c`, the 衙役, the food of 平顶山, the tables and chairs) is one per room, fixed by the
  room (XYJ draws again at each reset); a name of three lists (`npc/yayi.c`) is one of a diagonal of them. The robes'
  brothers (`already_ready`) and the 小妖's random weapon are left out.
- 腥风 of 碗子山 and the 野渡 fells who has under 20 道行 (XYJ: combat_exp 2000, as the gates scale). The cage under the
  石栈 opens at 300 of strength in all (XYJ: force_factor×5 + str, to 3000).
- A door is one door: opened or shut from one side, it is so from the other (XYJ: only if the other room is loaded).
- Left as ES2's, not XYJ's: the words and list layout of the common commands (`cmds/std`), skill names (徒手搏斗 for
  扑击格斗之技 and so on), a person's 头衔 not shown and 平民 for 普通百姓, the up/down exits (`northup`) named by their
  compass way, `learn` (several levels a time, 潜能 always spent), `drop all`/`get all` and `give X to Y` not read, a
  trailing 「to X」 ignored, a cheap thing dropped stays, a framed title at the head of a room's description dropped
  (the room's name is shown). Not carried over: the rooms' message boards and 张果老's
  donkey.

The ES2 licence, as it must accompany the copied parts:

```
MIT License

Copyright (c) 2022 "Annihilator", Ted Chang <taedlar@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## The pixel face — 精品点阵体 9×9 (BoutiqueBitmap9x9)

`px.woff2` is 精品点阵体 9×9 1.93 by 字言字語 (Luke Liu), from its author's release
(github.com/scott0107000/BoutiqueBitmap9x9, release 1.93), under the licence in `px-OFL.txt`: free to use, copy and
change, the changed font under the same licence. It is cut down (`../mkpx.mjs`) to the page's own words, the names
of rooms, townspeople and things, digits, Latin and GB2312's first level; nothing else in it is changed. The icons,
the HUD's pictures and the opening's 长安 are drawn by hand for this App (`../icon.svg`, `pixel.js`, `opening.svg`).
