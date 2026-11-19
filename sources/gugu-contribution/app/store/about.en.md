gugu is open source. With this App installed, when your agent runs into a problem in gugu itself, it helps you turn it into a proper contribution:

- **Report a bug**: when gugu errs, contradicts its own docs, or what you complain about really is gugu's fault, the agent searches GitHub for an existing report, strips keys, paths and other people's words from the logs, and drafts an issue for you to read.
- **Fix it**: when the cause is located in the source and the fix is small, the agent writes a pull request.
- **Make it an App**: when you want something gugu lacks and it does not need gugu itself changed, the agent offers to build it as an App you can publish.

**Nothing is sent without your yes.** The agent only drafts; it submits after you have read it and agreed. Without a GitHub account, you get a prefilled link to open and submit yourself.

## The panel

- **Get started**: not sure where to begin? Ask your agent. Or report a problem, build an App, or claim a starter issue picked by maintainers, handed to your agent in one click.
- **My work**: issues and pull requests whose body carries your Gugu ID (`GuguAccount: <id>` on its own line; public and optional), waiting for a score or scored.
- **Leaderboard**: every contributor, by points.

Maintainers score each 0–5, whether or not it was merged; 0 means reviewed, no points. The panel reads only public GitHub data, and gugu tells it your Gugu ID, so there is nothing to type in.

## Limits

- Needs gugu 0.3.2 or later.
- Anonymous GitHub search allows 10 requests a minute. The panel reads at most every 10 minutes, and its refresh button waits a minute after use.
- Counts public repositories under GUYI-AI only; GitHub returns at most 1000 results.
