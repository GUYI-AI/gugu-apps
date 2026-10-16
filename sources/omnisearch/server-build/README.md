# The search program of the preinstalled 全能搜索 App

`app/server/server.mjs` is built, not written: one ES module bundling
[spences10/mcp-omnisearch](https://github.com/spences10/mcp-omnisearch) (MIT, `server/LICENSE`) and its dependencies,
so the App needs no `node_modules` and runs on gugu's own runtime (`launch.mjs` starts it with `process.execPath`).

| | |
|---|---|
| Upstream | `42ba490a90d48fc02ff036268049d1202ceda504` (main, 2026-10) |
| Patch | `upstream.patch`: Firecrawl as a `web_search` provider, Context7 `library_docs`. Upstream's own checks passed on it (`vp check`, 40 files / 125 tests, 2026-10-06). Not sent upstream: that is publishing and waits for the owner. |
| Build | `node server-build/build.mjs` (git, pnpm, network; esbuild from sources/omnisearch's devDependencies) |
| Check | `node server-build/build.mjs --check` — rebuilds to a temp file and fails if it differs from the committed one |

To move to a newer upstream: change `UPSTREAM_SHA`, refresh the patch against it, rebuild, and test the App
(`test/omnisearchLaunch.test.ts`, then a real search through an agent).
