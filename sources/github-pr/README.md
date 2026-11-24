# GitHub PR

A PR card for a chat: title, CI, approvals and the changes, and a merge button that merges as the person who clicks it.
Any repository's PRs: whatever the chosen credential can read, the card shows, and it can merge where that credential may.
Opened as a tab (no card behind it), it asks for a PR link or `owner/repo#123`.

- Send one: `widget_send { chat_id, app: "github-pr", view: "pr", text: "<one line with the PR URL>", data: { repo: "owner/repo", number: 3273, title: "<PR title>" } }`.
  `data` is untrusted: `repo`/`number` only locate the PR; `title` is shown only on a phone.
- Reads: one round of GETs at once when the card opens (the PR, its reviews, and the check runs of `pull/N/head`; the
  person's login the first time, then kept), again before a merge or review, and when the person presses 刷新. No timers;
  `mergeable: null` is shown as "still computing" until one of those reads.
- Merge: re-read, then the dialog shows the full `owner/repo#n`, the full head sha, checks, account and method; confirming sends
  `PUT /repos/{repo}/pulls/{n}/merge { sha: <that head>, merge_method }`. A push in between is refused by GitHub (409).
  On a page an agent works the host sends nothing (`gugu.credentials.read` is refused there, `write` answers `null`).
- Reviews, as GitHub counts them: each reviewer's latest approval or change request (comments change nothing, a dismissed
  review clears it, the author's own is ignored); an approval on an earlier head is marked as such. Change requests come
  first in the status line. The head row says 请你评审 when GitHub requested the person's review, or their own verdict.
- Review: anyone but the author, while the PR is open (drafts too). 评审 re-reads, then the dialog offers approve, request
  changes or comment with a summary (required unless approving) and sends `POST /repos/{repo}/pulls/{n}/reviews
  { commit_id: <that head>, event, body }`. A push since the card was drawn is said instead of reviewed.
- Credentials: `permissions.credentials` asks for one github.com credential from the person's password vault: by default
  the one behind the GitHub connector's default account (or the only one saved), changed in the App's permissions. The
  host puts it in the `Authorization` header of each request to api.github.com; the App never sees it.
- No credential, or GitHub refuses the chosen one (401): the card says what to make (a fine-grained token with Pull requests
  read/write and Contents read, linked to GitHub's page) and 设置凭据 opens the host's dialog (`gugu.credentials.choose`,
  App API 64) with the same words; a choice reloads the card. An older host has no `choose`: the card says where to pick one.
- Phone: no `gugu.credentials`; the card shows the repo, number and sent title, and opens GitHub.
- Needs gugu 0.3.8 or later (App API 61): `engines.gugu` is `>=0.3.8`, so the market does not offer it to older clients.
