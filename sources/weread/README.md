# 微信读书 (WeRead)

The person's WeRead reading — what they read now, their highlights and thoughts — for gugu's agents and in a side-pane page,
through WeRead's official Agent API (the 「微信读书 Skill」, [Tencent/WeChatReading](https://github.com/Tencent/WeChatReading),
Apache-2.0): one gateway `POST https://i.weread.qq.com/api/agent/gateway`, `Authorization: Bearer wrk-…`, business
parameters flat beside `api_name` and `skill_version`. Field meanings follow that repository's `skills/*.md`.

- `app/server.mjs` is the App's program (MCP over stdio, no dependencies). The key is `key` in `settings.json` in the App's
  data folder (`GUGU_EXTENSION_DATA_DIR`), written by the page and read again on every call. `gateway_url` there points the
  program at another gateway (the fake one below).
- Agent tools: `weread_reading`, `weread_recent_notes`, `weread_notebooks`, `weread_book_notes` (by bookId or title),
  `weread_progress`, `weread_shelf`, `weread_api` (any other official call; `/_list` lists them). Page-only tools
  (`_meta.ui.visibility: ["app"]`): `page_home`, `page_book`, `page_status`.
- `app/weread.mjs` reads and reshapes: a thought written on a highlight hangs under it (same `range`, or its `abstract` is the
  highlight's text); chapters in reading order; `/user/notebooks` paged by `lastSort`, `/review/list/mine` by `synckey`.
- The page (`app/app.js`) draws 正在读 / 刚划的线 / 也在读 and one book's notes by chapter. A highlight's 解释这段 /
  换个角度 / 展开联想 drafts it into the conversation with `gugu.dispatch(text, { draft: true })`; nothing is sent. It
  refreshes on open, on 刷新, and every 2 minutes while visible.
- `test/fake-gateway.mjs` answers in the documented shapes (`node test/fake-gateway.mjs 8787`, key `wrk-fixture`); `npm test`
  runs the program against it.
