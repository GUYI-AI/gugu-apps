# Changelog

## 0.1.2

- Dates in CSV output and query results are written in local time, as the workbook shows them; a date with no time of
  day is written as a date only. Before, they came out in UTC and could fall on the day before or after.
- Files are read in pieces of 512 KiB into one buffer, and the bytes are handed to the data engine instead of copied:
  a large file is held once, not three times.
- When a long query stops the data engine, the explore page reads the same file version again instead of keeping a
  copy of it.

## 0.1.1

- A sheet or CSV with hundreds of thousands of rows no longer fails with "Maximum call stack size exceeded".

## 0.1.0

- First version: cards (table, bar, line, scatter, heatmap, KPI) from CSV, workbooks and SQLite files in a chat, pinned
  to a file version; an explore page for a data file; agent tools `data_schema`, `data_query`, `data_card` and skill
  `data-lens`.
