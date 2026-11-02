# Data Lens

Charts and tables from a chat's data files, as cards in the chat.

An agent looks at a `.csv`, `.tsv`, `.xlsx`, `.xls`, `.ods`, `.sqlite` or `.db` file in the chat, writes one read-only
SQL query and picks a view; the card it sends carries only that — a reference to the file pinned to a version, the
query and the view. Everyone who opens the card reads the file and runs the query on their own device.

- `card.html` — the card (a widget view, API 26), and as a tab, a list of the chat's data files.
- `explore.html` — a data file opened with Data Lens: tables, a query box, the same views.
- `tools.js` — `data_schema`, `data_query`, `data_card` for agents; `skills/data-lens/SKILL.md` tells them how.
- `lib/engine.js` — the engine, shared by the pages (in `lib/worker.js`) and the tools: SQLite (sql.js, its asm.js
  build: App pages may not run WebAssembly), workbooks and CSV through SheetJS.
- `vendor/` — built by `../vendor/build.mjs` from pinned packages; licences in `vendor/LICENSES.txt`.

Read-only: the App asks for `files:read` and never writes a file; it declares no network.
