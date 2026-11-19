# Calendar

To-dos and notes by the hour

What people read about this App in the market is in `store/`: `about*.md`, `screenshots/` and `whats-new.md` (this version's changes). What agents read is `contributes.instructions` in `manifest.json`, its tools and its skills. This README and `CHANGELOG.md` are for the repository and are never shown in gugu.

The standing line asks an enabled agent to record definite personal plans/events it receives, without waiting for an explicit request to record. The program descriptions cover date resolution, deduplication and updates; only a successful tool result is a recorded entry.

- `record({kind,title,date?,time?,end?,detail?,tags?})` creates a to-do or memory. Resolve conversational dates in the user's timezone and pass `date`; preserve a vague time such as “afternoon” in `detail`.
- `query({from?,to?,text?,kind?})` finds existing IDs. `update({date,id,new_date?,done?,title?,detail?,time?,end?,tags?})` preserves the ID and original source when completing, changing or moving an item.
- `month`, `set_done` and `remove` are page-only. The time-axis UI and end-time behavior remain available.

Data lives in `days/YYYY/MM/YYYY-MM-DD.json`. First access migrates `journal.json` while preserving it as a backup. A marker prevents deleted items from returning; a persisted pending transaction recovers interrupted moves before reads. The page reads only the months shown by its week/day and month picker, with its existing three-second refresh.

The candidate requires App API 58. The source change does not publish a market version or change any existing market package.
