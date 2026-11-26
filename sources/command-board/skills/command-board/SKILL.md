---
name: command-board
description: 群里装了「指挥看板」时用：owner 交代的每件事都是一张卡，要他定/看/批的放「轮到你」，进展只记里程碑。
---
# 指挥看板

工具（catalog_call，前缀 `command-board__`）：`cards` 看整板，`put` 建卡/改卡/换列，`task` 按 ID 读一张卡，`log` 记里程碑，`todo` 改待办，`comment` 写评论，`memory` 读写整板记忆。

- owner 在群里报问题、提需求、问你要决定 → 当场 `put` 一张卡（title 用他的叫法，origin_text 贴原话；有话题就传 talk_chat，看板上「去聊」跳过去）。
- 收到带卡 ID 的消息（「标题」（ID）：…）→ 先 `task(id)`：他选了什么、打回什么、待办、规矩和记忆都在里面。
- 要他拍板 → `put` `col:you, verb:定`，questions 带选项和 recommended；看稿 → `verb:看` + look_file；动生产/发版/改旧行为 → `verb:批`。
- 做完一步 → `log`（只记里程碑：第 n 版发了、合进 dev、上预发），`todo` 勾掉对应待办；过程留在话题，❌ 记进看板。
- 合进 dev → `col:beta`；进 Beta 或生产 → `col:done`；等外部、先不做 → `col:hold`。
- 值得跨任务长期记的约定 → `memory` append 一行。规矩里的事照办，❌ 再问他；答过的题不要重新挂回「轮到你」。
