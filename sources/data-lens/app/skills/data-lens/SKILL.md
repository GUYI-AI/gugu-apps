---
name: data-lens
description: Chart or tabulate a chat's data file (.csv, .tsv, .xlsx, .xls, .ods, .sqlite, .db) as an interactive card in the chat. Use when someone asks to analyse, summarise, chart, pivot or compare data in a file in the chat.
---

# Data Lens cards

A card is one view of one data file: a reference to the file (pinned to a version), one read-only SQL query and how to
draw its result. Everyone who opens the card reads the file and runs the query on their own device; the data never
goes into the message. Never paste the data itself into a message or the card.

## Steps

1. `data-lens__data_schema { file }` — tables, columns, row counts, first rows.
   - CSV/TSV: one table `t`. Workbook: a table per sheet (named as the sheet; quote it: `"Sales 2026"`) and a view `t`
     of the first sheet (`sheet` picks another). SQLite: its own tables.
2. `data-lens__data_query { file, sql }` — try the query; SQLite dialect, one `SELECT`/`WITH`. Check the numbers.
3. `data-lens__data_card { file, sql, view }` — checks the view against the query's columns and returns the exact
   `data` (file pinned to its current version, at most 4096 bytes).
4. `widget_send { chat_id, app: "data-lens", view: "card", text, data }` with that `data` as it is. `text` (1–200
   characters) says in words what the card shows and its key finding — it is what notifications and older clients show.

## Views

| kind | needs | good for |
|---|---|---|
| `bar` | `x` (category), `y` (number), optional `color` | comparing categories; `color` stacks series within each category, not side by side; many or long categories turn horizontal |
| `line` | `x` (date `YYYY-MM-DD` or number), `y`, optional `color` (one line per value) | change over time |
| `scatter` | `x`, `y`, optional `color` | relation between two numbers |
| `heatmap` | `x`, `y`, `value` | a pivot: two categories against one number |
| `table` | — | exact figures, at most a few hundred rows |
| `kpi` | — | the first row's columns as big figures (`SELECT sum(a) AS "Revenue", count(*) AS "Orders" …`) |

`title` (optional, ≤ 80 characters) heads the card; otherwise the file's name.

Side-by-side grouped bars are not supported. Describe a colored bar chart as stacked; do not promise side-by-side bars.

## Writing the query for a 420 px card

- Aggregate in SQL: `GROUP BY`, `ORDER BY … DESC LIMIT 12`. A card is small; ten bars read, a hundred do not.
- Name result columns as people should read them: `SUM(amount) AS "Revenue"`.
- A pivot for `heatmap`: `SELECT region, quarter, SUM(amount) AS total FROM t GROUP BY 1, 2`.
- Dates: `strftime('%Y-%m', date) AS month` for monthly lines.
- A card stays on the version it was sent with. If the file changes, send a new card.
