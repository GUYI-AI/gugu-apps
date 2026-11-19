# GitHub PR

A PR card for a chat: title, CI, approvals and the changes, and a merge button that merges as the person who clicks it.
GUYI-AI's PRs only (the App checks the repository before it reads anything).

- Send one: `widget_send { chat_id, app: "github-pr", view: "pr", text: "<one line with the PR URL>", data: { repo: "GUYI-AI/gugu", number: 3273, title: "<PR title>" } }`.
  `data` is untrusted: `repo`/`number` only locate the PR; `title` is shown only on a phone.
- Reads: when the card shows (PR, head check runs, reviews: 3 GETs; `mergeable: null` is read once more after 3 s),
  again after 60 s away, on 刷新, and before a merge. No timers.
- Merge: re-read, then the host's dialog shows the head, checks, account and method; confirming sends
  `PUT /repos/{repo}/pulls/{n}/merge { sha: <that head>, merge_method }`. A push in between is refused by GitHub (409).
  On a page an agent works the host does not merge (`gugu.github.write` answers `null`).
- Phone: no `gugu.github`; the card shows the repo, number and sent title, and opens GitHub.
- Needs gugu with App API 60 (`github` capability) and a GitHub account connected in Connectors.
