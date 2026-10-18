# 海龟汤题库的授权

这个目录（`bank/`）是题目内容，**和 App 的代码分开授权**：App 代码是 MIT，这里的每道题按它自己 `source.license` 写的许可发布。许可不止一种，没有一条套在整个目录上。

| 合集 | 题 | 许可 | 出处 |
|---|---|---|---|
| 咕咕原创 | `gugu-*` 4 道 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)：咕咕放弃这些题的全部权利 | 本仓库 |
| Soupbase 原创 | `soupbase-doorbell-*`、`soupbase-lit-room-*`、`soupbase-blank-last-page-*`，中英共 6 份 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [spoonnotfound/soupbase@b36c2da2](https://github.com/spoonnotfound/soupbase/tree/b36c2da267023e6c580b1238edb787f3d4c99fb6/content)，声明见 `LICENSE-soupbase.md` |
| Soupbase 改编 | 其余 `soupbase-*`，47 个故事，中英共 94 份 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)；原作者、原作链接和原作许可写在每道题的 `source` 里 | 同上；原作来自小乌龟侦探社（ltda.wikidot.com）与 Puzzling Stack Exchange |
| haiguitang-coop 示例 | `coop-*` 5 道 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，作者 AZHi-xinxin | [AZHi-xinxin/haiguitang-coop@72dc96b1](https://github.com/AZHi-xinxin/haiguitang-coop/blob/72dc96b107d63bfcebedc503e3d57bbd416b8ffd/CONTENT_LICENSE.md)，声明见 `LICENSE-haiguitang-coop.md` |

**改动**：咕咕只把题目改成了自己的格式（字段名、难度档、去掉事实的 id），题目文字没有改。每道题的 `source.adaptation` 写明了改了什么。CC BY-SA 4.0 的题，连同改成咕咕格式之后的版本，仍按 CC BY-SA 4.0 发布。

**在 App 里**：每局结束时，结算页列出这道题的作者、许可和原作链接。

`puzzles.json` 是全文，只有主持人的程序读；`index.json` 是同一批题去掉汤底、事实和提示之后的版本，给页面列题目用。两者都由 `scripts/bank.mjs` 从 `bank-src/` 生成，不要手改。
