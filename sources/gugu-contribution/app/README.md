# gugu contribution（咕咕贡献）

A skill that tells agents when and how to report gugu's own problems upstream (a Discussions post, a pull request, or an App proposal),
and a panel that takes newcomers to a first contribution and reads public GitHub search for merged pull requests carrying a `GuguAccount: <咕咕号>` line, scored by
maintainers with `score:0`–`score:5` labels.

- `app/` is what the market installs: `manifest.json`, `panel.html|js|css`, `core.js` (pure), `skills/gugu-contribution/SKILL.md`.
- `npm test` checks `core.js`.
- Maintainers' review list: merged pull requests in `org:GUYI-AI` with the line and no `score:*` label (`reviewQuery()` in `core.js`).
