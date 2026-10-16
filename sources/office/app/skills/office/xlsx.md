# A .xlsx: scripts/xlsx.mjs

People pick cells, ranges, rows or columns in 咕咕办公 and send them as pills; the link's `#` says where: `range=` and
the address as Excel writes it — `range=销售!B2:D4`, `range=销售!C:E` (whole columns), `range=销售!3:5` (whole rows),
`range=销售` (the whole sheet), `range='2024%20预算'!A1` (a merged area by its top-left cell). Characters a link cannot
hold come percent-encoded (`%20` a space, `%26` `&`, `%2B` `+`): decode them once, then pass the address as it is. The
pill's words are the same address, but may be cut short: the link's `range` is the place.

Run `gugu-node <this folder>/scripts/xlsx.mjs <command> …`. It prints one JSON; a refusal is one sentence on stderr,
exit code 1, and nothing written. `<book>` below is the path the download gave (`saved_to`); its folder is yours alone,
so keep every file of this change in it — never in the current directory, which other agents share.

1. `read <book>`: each sheet — its used range, rows, columns, frozen panes, merged cells, tables, first row — and the
   workbook's names.
2. `read <book> '<range>'`: a range in quotes (`'销售!A1:D20'`, `'销售!C:C'`, `'销售!3:5'`, `"'2024 预算'!B2"`, or a
   sheet's name; the sheet can be left out when the workbook has one). You get:
   - `cells`: rows of values as a person would type them — numbers, text, `true`/`false`, `null` (empty),
     `"=SUM(B2:C2)"` (a formula), `{ "date": "2024-03-01" }` / `{ "date": "2024-03-01T08:30" }` / `{ "date": "08:30" }`
     (a number with a date format), `{ "error": "#DIV/0!" }`. Text that starts with `=` or `'` comes with a `'` before it.
   - `shown`: what the sheet shows where that differs from `cells` — a formula's stored result, `1,200` for 1200, `13%`.
   - `merged`, and `was` (like `销售!A1:D20@3fa9c2d1`): give it back to change cells in that range.
   - `more`: a read gives at most 2,000 cells; `more` is the next range to read.
3. Write the edits to a file in `<book>`'s folder, `[{ "range": "销售!D2:D4", "was": "…", "cells": … }]`, several
   ranges at once, and `apply <book> <that file>`: it changes `<book>` in place, the file you save back. Only the
   written cells and the stored results of the formulas reading them change; every zip entry it did not touch is copied
   byte for byte.
   - `cells`: a 2-D array the range's shape, or one value for all of it. One formula for a range moves cell by cell as
     Excel's Ctrl+Enter moves it: `{ "range": "销售!D2:D100", "cells": "=B2*C2" }` gives D3 `=B3*C3` and so on.
   - Write what a person would type: `1500`, `"华东"`, `true`, `null` (clears; the cell's format stays), `"=B2*C2"`,
     `{ "date": "2024-03-01" }`. Text that should start with `=` is written `"'=…"`. Write functions as Excel shows them
     (`XLOOKUP`, `FILTER`): the file's prefixes are added for you.
   - `was`: the one `read` gave for a range containing this one. If someone changed a cell of that range after you read
     it, the edit is refused (content-changed): read it again and redo the change on what is there now. Others changing
     other cells meanwhile does not stop yours. Writing into cells that are all empty (appending rows below a table)
     needs no `was`.
   - The formulas reading what you changed, and the ones you write, are recalculated and their results stored:
     咕咕办公, Excel and phones show the new numbers. One that cannot be — a volatile function (NOW, TODAY, RAND…),
     another workbook's cells, a function or name the calculator does not have, or one it calculates differently from
     Excel — loses its stored result, and so does every formula reading it: the sheet shows the formula until Excel or
     WPS opens the file. In a workbook too big to calculate here, every formula reading what you changed does
     (`recalc.skipped` says why). On a big workbook this takes up to a minute. The answer says how many (`recalc`, and
     `notCalculated` with why): if some could not be, say so in the chat.
   - The answer gives each range's `was` now (to change it again without reading), and notes (a table column renamed, a
     date format given to a cell, a protected sheet).
   Refused, said why: a range changed since you read it; cells not the range's shape; a cell inside a merged area but
   its top-left; part of an array formula (change all of it or none); a table's header renamed while a formula names
   that column (`Table1[单价]` — leave the header, or change that formula first); a formula with an unclosed quote or
   bracket; a .xlsm (read only here); a workbook too big for this script (more than 100 MB of XML unpacked, shared
   strings and all — 50 MB to change one with formulas; `read` refuses it too), or one whose zip says a part is smaller
   than it is: use Excel or WPS.
4. Save the workbook back: SKILL.md, "Download and save back". Say in the chat what you changed, by address.

Not in this version: formats (colours, fonts, number formats), inserting or deleting rows and columns (append by writing
below; clear a row with `null`), and spilling formulas — `=SORT(…)`, `=FILTER(…)`, `=UNIQUE(…)` are written as one
cell's formula and Excel calculates only that cell; write a whole column's results cell by cell if you need them.

Another tool: for sums, filters or charts over a big table, read `<book>` with your own (python, pandas). openpyxl also
changes formats and inserts rows, but saves the whole workbook again and stores no formula's result: every formula then
shows as its formula in 咕咕办公 and on phones until Excel or WPS opens the file — say so in the chat if you use it, and
have it write into `<book>`'s folder too.
