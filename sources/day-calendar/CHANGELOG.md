# Changelog

## 0.5.1

- Week view: entries side by side in a narrow day column spread over the whole column on hover or keyboard focus, with the full title and the time; where a column has room, they keep their check and agent mark.

## 0.5.0

- A time axis instead of a month and two lists: hour scale, an ink line and tag for now, each entry a block at its hour (to-do, checked to-do, memory), overlapping entries side by side, to-dos without a time in an all-day row.
- Side panel: one day with a week strip (the whole month folds out). Full tab: a week with a month rail and a legend; Day / Week switch.
- Click or drag on an empty time to add a to-do or a memory with a start and an end; the quick add at the bottom still adds an all-day to-do.
- Click an entry for its card: details, tags, when it was recorded, back to the task that recorded it, delete. An agent's entry carries the agent mark.
- `record` takes an optional `end` (HH:MM after `time`). Entries without it are drawn as half an hour; nothing is migrated. `time` and `end` must be real clock times (00:00–23:59).

## 0.4.6

- Declare desktop support (App API 12). Adding, checking and removing entries require the App's local program.

## 0.4.5

- Add promotional artwork as the first market image; preserve the existing screenshots.

## 0.4.4

- 更新 App 图标为正面月历与完成标记。

## 0.4.3

市场上名字下面加一句副标题，产品页加三张真实使用截图；App 协议版本改为 8（只发给支持副标题的咕咕）。

## 0.4.2

第一次上市场。任务页右侧栏里的日历：上面一个月，下面是选中那天的待办和记事；你自己在页面上加、勾、删，也可以让 agent 用 `record` 帮你记。

和 0.4.1 比：

- Windows 上，存的那一刻页面正好在读，也不会再「没存上」；
- 不存在的日期（比如 2 月 31 日）会被拒，不再记到一个页面上看不到的地方；
- 勾选或删除没存上时，页面回到文件里的样子，不再停在没存上的那个状态；
- 页面不在屏幕上时不去读；
- 英文界面下，翻月的两个按钮也说英文了；
- 补上了图标、作者和最低咕咕版本。

版本号升一位，已经装着 0.4.1 的人按同一个 id 收到这一版。
