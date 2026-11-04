---
name: data-lens
description: Analyse, chart or tabulate a chat's data file (.csv, .tsv, .xlsx, .xls, .ods, .sqlite, .db) as an interactive card. Use for summaries, pivots, exploratory analysis, group comparisons or statistical questions about a chat file; host-side Python can produce derived CSV results for the same card workflow.
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

## Analysis beyond SQL

Use the steps above for questions SQLite can answer. For data quality, distributions or relationships, read
[exploratory analysis](references/exploratory-analysis.md). For inference, tests or effect estimates, read
[statistical analysis](references/statistical-analysis.md). Both are adapted from K-Dense's MIT skills;
[sources, attribution and licence](references/K-Dense-NOTICE.md) are bundled here.

Python runs on **your agent's host machine**, not inside Data Lens. The App remains read-only:

1. Obtain a local copy of the chosen chat file and version through your host's available file-read/download tool.
   A `gugu-file://` reference is not a local path. Schema samples and `data_query` output can be truncated; do not
   treat them as the full input for statistical inference. Record the source version, analysed scope and missing-data policy.
2. Run the analysis with your host's Python tools in a task directory, preserving the input. Use available packages
   appropriate to the method; record their versions and any random seed. Data Lens does not supply Python or install packages.
3. Write a **new UTF-8 CSV** containing the computed result, headers and units. Keep numbers numeric and unavailable
   estimates blank rather than zero. For tests, include sample sizes, effect estimates, interval bounds and p-values
   where applicable. Keep the runnable analysis alongside it; do not overwrite the source or embed raw data in a card.
4. Send that local CSV to the **same chat** with your host's existing file-send tool (for example
   `message_send_file { chat_id, file_path }`). Use the file reference returned by that successful send; do not invent
   an id, substitute a local path or ask the App to write/upload it. Report a missing host capability or failed run/send
   instead of claiming a result exists.
5. Run `data_schema`, `data_query`, `data_card` on the **returned CSV reference**, then send its exact `data` with
   `widget_send` as above. A `table` suits statistical results with intervals; existing charts do not render error bars.
   State the method, source version and material limitations in the accompanying explanation. An exploratory pattern
   is not a confirmed effect, and a card is a view of the computed file rather than proof that the method is valid.

## Views

| kind | needs | good for |
|---|---|---|
| `bar` | `x` (category), `y` (number), optional `color` | comparing groups; many or long categories turn horizontal |
| `line` | `x` (date `YYYY-MM-DD` or number), `y`, optional `color` (one line per value) | change over time |
| `scatter` | `x`, `y`, optional `color` | relation between two numbers |
| `heatmap` | `x`, `y`, `value` | a pivot: two categories against one number |
| `table` | — | exact figures, at most a few hundred rows |
| `kpi` | — | the first row's columns as big figures (`SELECT sum(a) AS "Revenue", count(*) AS "Orders" …`) |

`title` (optional, ≤ 80 characters) heads the card; otherwise the file's name.

## Writing the query for a 420 px card

- Aggregate in SQL: `GROUP BY`, `ORDER BY … DESC LIMIT 12`. A card is small; ten bars read, a hundred do not.
- Name result columns as people should read them: `SUM(amount) AS "Revenue"`.
- A pivot for `heatmap`: `SELECT region, quarter, SUM(amount) AS total FROM t GROUP BY 1, 2`.
- Dates: `strftime('%Y-%m', date) AS month` for monthly lines.
- A card stays on the version it was sent with. If the file changes, send a new card.
