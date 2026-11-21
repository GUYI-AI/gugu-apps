# GitHub PR

A PR card for a chat: title, CI, approvals and the changes, and a merge button that merges as the person who clicks it.
GUYI-AI's PRs only (the App checks the repository before it reads anything).

- Send one: `widget_send { chat_id, app: "github-pr", view: "pr", text: "<one line with the PR URL>", data: { repo: "GUYI-AI/gugu", number: 3273, title: "<PR title>" } }`.
  `data` is untrusted: `repo`/`number` only locate the PR; `title` is shown only on a phone.
- Reads: once when the card opens (PR, head check runs, reviews: 3 GETs), once before a merge, and when the person presses
  刷新. No timers; `mergeable: null` is shown as "still computing" until one of those reads.
- Merge: re-read, then the host's dialog shows the head, checks, account and method; confirming sends
  `PUT /repos/{repo}/pulls/{n}/merge { sha: <that head>, merge_method }`. A push in between is refused by GitHub (409).
  On a page an agent works the host sends nothing (`gugu.credentials.read` is refused there, `write` answers `null`).
- Credentials: `permissions.credentials` asks for one github.com credential from the person's password vault: by default
  the one behind the GitHub connector's default account (or the only one saved), changed in the App's permissions. The
  host puts it in the `Authorization` header of each request to api.github.com; the App never sees it.
- Phone: no `gugu.credentials`; the card shows the repo, number and sent title, and opens GitHub.
- Needs gugu with App API 61.
