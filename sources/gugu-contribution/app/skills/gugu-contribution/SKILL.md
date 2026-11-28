---
name: gugu-contribution
description: 咕咕贡献 (gugu contribution). Read this when the person wants to contribute to gugu or does not know how to start; or when gugu itself is at fault (an error that is not the person's input, behavior that contradicts gugu's own docs or skills, a complaint about gugu that turns out to be real) or lacks a feature they want. Covers reporting a problem in Discussions, a first pull request, and building an App.
---

# 咕咕贡献: report gugu's problems, fix them, or build what is missing

gugu is open source (GitHub org `GUYI-AI`). Help the person report its problems properly, fix them, or build what is
missing as an App. Maintainers score each merged pull request 0–5 and it shows in this App's panel under the person's 咕咕号.

**Nothing leaves without the person's yes.** That covers every outward step, each asked for on its own: a comment, a fork,
a push, a discussion post, a pull request. Show the exact text first. Never in the background, never several at once.

## 1. Don't know where to start?

Ask two things: what do they want to do (report something that bothered them, fix code, build an App), and what do they
have (a GitHub account, Node and pnpm, how much time). Then:
- no code → section 3 onward;
- fix code → "Your first pull request";
- build something → "Building an App".

## 2. Is it gugu's?

Yes: any surface of gugu, meaning the desktop or phone client, the server, the official Apps, gugu's docs and skills.
- a gugu tool or screen fails, and not because of what the person typed or chose;
- gugu behaves differently from what its own docs, skills or prompts say;
- the person complains about or is confused by gugu, and after checking it is not a usage mistake;
- the person wants something gugu cannot do.

No, leave it alone:
- the person's own code, machine, network or configuration;
- a model provider's overload, 429 or outage;
- a third-party App: that belongs to its author's repository (the App's `source.repo` in the market), not to gugu;
- anything the person said not to report.

Unsure? Ask once: "This looks like a problem in gugu itself. Shall I write it up?" Do not decide for them.

## 3. Which way

| Situation | Do |
|---|---|
| Reproducible defect or confusion, cause not located, or the fix spans modules / touches permissions, migrations, billing | **post in Discussions, Q&A** (the default) |
| Cause located in the source, fix small and inside one module, the related tests run locally; or a typo/doc fix | **pull request**, linking the discussion if there is one |
| A missing feature that does not touch message delivery, accounts, permissions or sync, and the App API can do it (tabs, tools, skills, files, network) | **propose an App**: "This could be a small App, 「…」. Want me to build it?" |
| A missing feature only gugu's core can provide | **post in Discussions, Ideas**, saying why an App cannot do it |

Repositories: client, server and docs in `GUYI-AI/gugu` (Issues are off there; reports go to its Discussions); community backend in `GUYI-AI/gugu-supabase`; official Apps and
the market in `GUYI-AI/gugu-apps`; the documentation site in `GUYI-AI/gugu-docs`.

## 4. Before writing: look for it

Search unquoted words (quotes search an exact phrase and miss reports), two or three wordings:
`gh api graphql -f query='{ search(type: DISCUSSION, first: 20, query: "repo:GUYI-AI/gugu scroll tab") { nodes { ... on Discussion { title url closed } } } }'`,
then `gh search prs --repo GUYI-AI/gugu scroll tab`. Without `gh`, give the person
`https://github.com/GUYI-AI/gugu/discussions?discussions_q=scroll+tab`.

A match is the same behavior on the same surface. Open match: add new evidence there as a comment (with their yes; it
needs a GitHub account and earns no panel credit), do not open a second one. Answered or closed match: tell them it may be
fixed, and ask them to update and try again first.

Ask for what is missing (steps, version, whether it reproduces). Never invent steps.

## 5. Redact

Before showing the draft, remove and replace with a placeholder:
- tokens, keys, cookies, anything after `Bearer`, `sk-`, `ghp_`, `eyJ`; passwords; signed URLs;
- emails, phone numbers, real names other than the person's own GitHub login;
- absolute paths with a user name (write `~`); host names, IP addresses;
- session, chat, message and device ids;
- what other people said in a chat: describe the behavior instead; screenshots with names or avatars.

Environment: OS, gugu version (Settings → About), harness. Nothing else from the machine.

## 6. The identity line

The panel and the maintainers find a pull request by this line, alone on its own line in the body, digits only:

```
GuguAccount: <咕咕号>
```

`GuguAccount` is one word: `Gugu-Account` or `Gugu Account` is not found. Read the 咕咕号 with `profile_whoami` (your
owner's number, not yours); never guess it. The line is public, so ask first: "This puts your 咕咕号 on GitHub so it counts
for you. OK?" Without it the contribution is just as welcome; it does not count in the panel. Only the body counts, not
comments. The panel counts merged pull requests only: a discussion post or an unmerged pull request is welcome but not
counted, and a discussion post needs no identity line.

## 7. Writing it

- **Discussion post**: a title that names the behavior, then for a problem `### What happened` (expected vs. actual),
  `### Steps to reproduce`, `### Environment`; for a feature, what it is for and what it would do. English is preferred;
  Chinese is fine.
- **Pull request**: follow `.github/pull_request_template.md`: the change, a link to the discussion if there is one, what
  you ran and saw, that the new test fails on the parent commit, remaining limits, how a
  reviewer can try it. No AI signature lines in the body or in commits, no credentials or private details.

## 8. Submitting (after the person's yes)

- `gh auth status` shows the person's own login: `gh` has no discussion command, so read the ids once with
  `gh api graphql -f query='{ repository(owner: "GUYI-AI", name: "gugu") { id discussionCategories(first: 20) { nodes { id slug } } } }'`
  and post with `gh api graphql -f query='mutation($r: ID!, $c: ID!, $t: String!, $b: String!) { createDiscussion(input: {repositoryId: $r, categoryId: $c, title: $t, body: $b}) { discussion { url } } }' -f r=<repository id> -f c=<q-a or ideas id> -f t="…" -F b=@<file>`.
- No `gh`, someone else's login, or no GitHub account: give a prefilled link, which the person opens and submits:
  - problem: `https://github.com/GUYI-AI/gugu/discussions/new?category=q-a&title=<…>&body=<…>`
  - feature: `https://github.com/GUYI-AI/gugu/discussions/new?category=ideas&title=<…>&body=<…>`

  URL-encode each and keep the link under 8 KB, shortening the steps if needed. Be honest: GitHub needs an account to
  submit, so someone without one signs up first.

Then send them the link.

## Your first pull request

Start from a problem the person hit, or one in Discussions they want to fix.

1. **Check nobody fixed it.** `gh search prs --repo <repo> <words>`, open and merged. If a pull request covers it, say so
   and stop.
2. **Set up.** With their yes, `gh repo fork <repo> --clone`, then `git fetch upstream dev && git switch -c <branch>
   upstream/dev`. Follow `CONTRIBUTING.md`: its toolchain, `pnpm install --frozen-lockfile`. Say before starting that
   running the app needs `pnpm rebuild:native` and their own development backend; many fixes need only a focused unit
   test (`pnpm exec vitest run <file>`), which needs neither. Never test against official services.
3. **Fix.** The smallest change that removes the cause, with a test that fails without it.
4. **Open it.** Show the diff and the body first, and push with their yes. `gh pr create --repo <repo> --base dev --head
   <login>:<branch> --title "…" --body-file <file>`, with the identity line at the end of the body if they agreed. Then
   maintainers review it; never merge it yourself.

## Building an App

Ask what it should do. Read the host's App guides (`guide_topics`, the `apps-*` topics); `app_create` (through
`catalog_call`) starts one. Keep it in the person's own public repository and install it locally to try it. To list it, with
their yes, open a pull request to `GUYI-AI/gugu-apps` (`node scripts/add-version.mjs …`, see its README), with the identity
line at the end of the body. Once merged, it is scored like any other pull request.

## Scores

Only merged pull requests count. Maintainers label each `score:0`–`score:5` (0 = reviewed, no points). Do not ask for a
score in the pull request, and never add score labels yourself.
