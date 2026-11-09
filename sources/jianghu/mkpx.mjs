// app/px.woff2: the pixel face (精品点阵体 9×9 1.93, OFL: app/px-OFL.txt) cut to what the page sets in it — its own words,
// the names of rooms, townspeople and things, digits, Latin and GB2312 level 1 (players' names). Rebuild after new areas:
// npm i subset-font && node mkpx.mjs app BoutiqueBitmap9x9_1.93.ttf app/px.woff2 --gb1
import fs from 'node:fs'; import path from 'node:path'; import subsetFont from 'subset-font'
const [app, ttf, out, gb1] = process.argv.slice(2)
await import(path.resolve(app, 'game.js'))
const { ROOMS, NPCS, ITEMS } = await import(path.resolve(app, 'world.js'))
let text = ''
for (const f of ['main.js', 'main.html', 'pixel.js']) text += fs.readFileSync(path.join(app, f), 'utf8')
for (const r of Object.values(ROOMS)) text += r.name ?? ''
for (const n of Object.values(NPCS)) text += (n.name ?? '') + (n.title ?? '')
for (const i of Object.values(ITEMS)) text += (i.name ?? '') + (i.unit ?? '')
text += '一二三四五六七八九十百千两个只把件块张根条头匹辆串碗壶包本双颗粒枚支朵片瓶袋文钱银金两（）：·，。！？「」—…'
for (let c = 0x20; c < 0x7f; c++) text += String.fromCharCode(c)
if (gb1) { const d = new TextDecoder('gb18030'); for (let a = 0xb0; a <= 0xd7; a++) for (let b = 0xa1; b <= 0xfe; b++) text += d.decode(new Uint8Array([a, b])) }
const chars = [...new Set(text)].filter((c) => c.codePointAt(0) >= 0x20).join('')
const buf = await subsetFont(fs.readFileSync(ttf), chars, { targetFormat: 'woff2' })
fs.writeFileSync(out, buf)
console.log(`${[...chars].length} chars → ${(buf.length / 1024).toFixed(0)} KB`)
