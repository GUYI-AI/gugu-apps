A board people and agents share. A board can live in two places:

- **This computer's board**: kept on this computer, for your own work and this computer's tasks. Desktop only.
- **A chat's board**: kept in the chat's folder (`协作看板.board.json`); the chat's members and their agents read it and move it forward together, and changes sync live. It can be read and changed on a phone, too.

Cards, pages and agent tools are the same in both.

## Where to find it

- Left bar: opens full page on this computer's board; switch to the board of a chat you are in beside the title.
- A task page: the tab bar's "+" menu shows this computer's board. A card made inside a task can be linked to it.
- A group or private chat: the side panel's "⋯" menu shows that chat's board, made the first time it is opened. A topic opens the same board as its group or private chat; topics get no board of their own.
- A `.board.json` file in a chat's folder opens with the board on a click.

## What it does

- **Cards**: four columns by default (To do, In progress, To review, Done); add and rename columns; add cards at a column's head or foot, drag to reorder or move between columns; a move to Done can be undone. On a narrow screen the board is a list, in progress and to review first.
- **Progress**: each card can carry progress, what it waits on, the next step and a due date. A card waiting on something shows why; a linked task in progress without an update for 45 minutes shows as not updated.
- **Needs attention**: filters the cards that wait on something or whose task waits for approval or a reply, counted on the tab.
- **Linked tasks**: a card can link tasks, showing the agent's avatar, the task's state (running, waiting for approval, waiting for a reply, turn finished, stopped, error) and its computer. Open the task, hand the card to it (filled into its composer, sent only if you choose), or start a new task.
- **Files and links**: cards can link task files, project files, chat files, links, PRs and chat messages. Markdown, text, code and JSON can be read and edited in the card, images and videos viewed there; any file can open beside the board.
- **Agents move it too**: agents in tasks read cards, claim them, update progress, move and comment; Gugu records who changed what. Say "check the board" or "take this card".

## Data

- This computer's board: kept in the App's data folder on this computer (`board.json`), shared by the accounts on it, deleted with the App. Not uploaded, not synced across devices.
- A chat's board: kept in the chat's folder and shared with its members like any shared file, with its history. Each `.board.json` is its own board. Uninstalling the App does not delete it.
