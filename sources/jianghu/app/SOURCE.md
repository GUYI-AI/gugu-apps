# Sources

## 雪亭镇 — from ES2 Mudlib (东方故事2)

The rooms, their descriptions and details, and the townspeople's descriptions and most of their lines in `world.js` are
taken from the 雪亭镇 (Snow Pavilion Town) area of **ES2 Mudlib** by Annihilator (Ted Chang), turned from traditional
into simplified Chinese, trimmed and lightly edited.

- Repository: https://github.com/taedlar/es2_mudlib — taken at commit `7309240af1720b813cef3eb0ba135afc1f19c2ac`
  (files under `mudlib/d/snow/`: `inn_kitchen.c`, `inn_hall.c`, `square_w.c`, `square.c`, `square_n.c`,
  `square_e.c`, `epath.c`, `herb_shop.c`, `npc/waiter.c`, `npc/innkeeper.c`, `npc/gammer.c`, `npc/junkman.c`,
  `npc/child1.c`, `npc/herbalist.c`).
- Licence: MIT. The relicensing is stated in the repository's README ("Since 2022, Annihilator has released ES2 Mudlib
  on GitHub under the MIT License"), and the `LICENSE` file has been in the repository since its initial commit
  `66ac0c766dea95892beef447fff2e74fb53550c0` (2022-09-29):
  https://github.com/taedlar/es2_mudlib/blob/7309240af1720b813cef3eb0ba135afc1f19c2ac/LICENSE
- Only data was taken. No LPC code and nothing of the Neolith driver (which does not allow commercial use) is in this
  App; the engine (`game.js`) is this App's own.
- This App's own additions: 说书的李先生 as a character in the herb shop (ES2 only mentions him, in a line of the
  waiter's), the gourd of wine, the errand around them, the lines about it, and a few details (水缸, 石板, 药草, 躺椅…).

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
