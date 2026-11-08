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
