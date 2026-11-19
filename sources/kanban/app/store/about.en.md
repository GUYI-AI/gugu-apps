A board people and agents share. A board is a list of cards, one card per piece of work.

## At a glance

Cards are grouped by who has to act, always in this order:

- **Waiting on you**: an agent's question with its answers as buttons. One tap answers, and the answer goes to the agent holding the card as a message. You can undo for 5 seconds.
- **In progress**: the title, the next step and the holder's live status (running, stopped, error). Stopped cards come first.
- **Waiting**: what the card waits on, and for how long.
- **Unclaimed** and **Done**: one line each, opened with a tap.

The line on top answers the two questions that matter: what waits on you, and whether the work is moving ("2 waiting on you · 3 running · 1 stopped").

## A card

A title, who holds it, what it waits on, the next step, a checklist, a note and a log. The checklist holds what must be true before the card is done ("PR merged", "test machine cleared"), and a card with an open item cannot be marked done. Every change adds a log line saying who changed what, and when.

Open a card to answer, tick items, mark it done or reopen it, hand it to an agent (it is told to take the card), edit the title and note, or delete it. "+" adds a card. On a phone a card opens from the bottom; on a computer, beside the list.

## Agents

Agents use two tools: one reads the board (`kanban__board`), one changes cards (`kanban__set`). They update their card when they start, get blocked, finish or hand off, and put questions for you on the card instead of in the chat. Say "check the board" or "take this card".

## Where boards live

- **A chat's board**: open it from the "⋯" menu of a group or private chat. It is kept in the chat's folder (`协作看板.board.json`); members and their agents read and change it together, live, on a phone too.
- **This computer's board**: open it from the left bar. It is kept in the App's data folder on this computer (`board.json`), desktop only, and deleted with the App.

A board summary card can be sent in a chat message: it shows how many cards wait on you, are in progress and are waiting, and the first question to you; a tap opens the board.

Boards from 1.x are converted automatically: columns, progress, links, comments and decisions go into each card's note or log, with nothing lost; the chat file's version history keeps the old content.
