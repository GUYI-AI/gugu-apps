# 指挥看板 (command-board)

A group-chat board for handing out work to agents and making calls. Data lives in the chat file `*.command-board.json`; the tab opens it (`opensFiles.chat`).

- `app.js` / `main.html` / `style.css` — the board and the card panel.
- `tools.js` — agent tools: `cards`, `put` (list / create / move cards), `task` (read one card by ID with the board's rules and memory), `log`, `todo`, `comment`, `memory`.
- `skills/command-board/SKILL.md` — how agents should use the board.

Layout of the board and card panel is modelled on vibe-kanban (BloopAI, Apache-2.0) and reading/writing cards by ID on AgentKanban; no code was copied from either.
