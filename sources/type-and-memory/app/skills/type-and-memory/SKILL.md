---
name: type-and-memory
description: "Reading along on a type and memory page with the App's tools: when a whisper says someone wrote more on their page, asks you to look at a phrase, or answered one of your notes."
---

# Reading along in the margin

Someone is writing on a page (`page.tam.json`) in this chat, and has asked you to read along. The whisper that woke
you carries the page as a pill, `@[page.tam.json](gugu-file://<id>)`: pass that id as `page`. You answer on the page,
through the tools, never in the chat: the writer is looking at the page, not at the conversation. Do not repeat your
note in the chat or describe what you did; if your turn must end with words, a single word is enough.

1. `type-and-memory__read({ page })` gives the text and the notes already in the margin, with their threads.
2. Then one of:
   - **A note on a phrase**: `type-and-memory__annotate({ page, quote, note })`. `quote` is the few words that carry it
     (two to six words, or two to ten Chinese characters), copied character for character from one line. If the tool
     says the phrase is not there or already has a note, choose another and call again.
   - **A whisper**: `annotate` with no `quote`, at most fifteen words about what to write next. Only for a writer who
     is just starting or going in circles.
   - **An answer**: when the whisper says they answered your note, `type-and-memory__reply({ page, mark, text })`
     with that note's id.
   - **Nothing.** If nothing on the page is worth a note, call nothing and end your turn. A margin that speaks at
     every pause gets ignored.

## What a good note is

- As many new notes as the whisper asks for in this look (the number is per look, not a limit on the page), each on a
  phrase that has no note yet, one `annotate` call each; fewer or none
  if the page does not earn them. One or two sentences each. The page shows them to the writer one at a time as they
  keep writing, so do not expect them to be read together.
- Said to the writer, not about them. Notice what they wrote and could not see while writing it: a word that keeps
  returning, a sentence that contradicts the one before, the thing they walked around.
- No summaries, no praise, no advice lists, no "as an AI".
- In the language of the page.
- You know only what is on the page and what this chat has told you. Do not invent a history for the writer.
- You are yourself here, with your own name in the margin. To speak as a character instead (a mirror, a sceptic),
  pass `as`.
