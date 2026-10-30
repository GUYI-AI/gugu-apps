## 0.2.1

- 关注列表的「不再关注」悬停时盖在档位上，不再常驻占宽，任务名能多显示一截。
- 市场截图换成 0.2 界面的客户端实拍。

## 0.2.0

- 提醒按天分组并支持筛选，集中显示关注列表、状态计数与后台心跳。

## 0.1.10

- 可关注同一账号别的电脑上的 agent；提醒带来源机器和读数时间。
- 复用咕咕的跨设备清单和投递，机器暂时离线时保留关注。
- 支持具备通用后台运行环境的无窗口 server。

# Changelog

## 0.1.9

- Dispatch background reminders to the subscribing agent through App API 15.
- Make watch discoverable as Radar/雷达 and explain how to subscribe to completion reminders.

## 0.1.8

- Declare desktop support for the human interface (App API 12).

## 0.1.7

- Add promotional artwork as the first market image; preserve the existing screenshots.

## 0.1.6

- 更新 App 图标，以节点连线与提醒铃铛表示 agent 的关注关系。

## 0.1.5

市场上名字下面加一句副标题，产品页加三张真实使用截图；App 协议版本改为 8（只发给支持副标题的咕咕）。

## 0.1.4

在手机上打开不再出错：手机上没有后台页，也读不到各个 agent 的状态，页面只显示「雷达仅支持在电脑上使用」。

## 0.1.3

盯着的 agent 不在了、这条关注也随之结束时，那条提醒末尾说「这条关注到此结束」，不再叫人去 unwatch 一条已经没了的关注。「做完了」的提醒里，跑在终端里的 agent 也能带上它最后说的话（要咕咕读得到它那家引擎的记录：claude、codex、opencode）；读不到时用一句中文或英文说清楚是哪种读不到。

## 0.1.2

盯着的 agent 跑在终端里时，「做完了」的提醒直接说「它跑在终端里，读不到它最后说的话」，不再夹一句英文。

## 0.1.1

钉在左栏、整页打开时排得像一页了：图占满左边，提醒是右边一栏（窗口窄了就落到图下面）；「这个任务 / 全部」那一行只在任务里出现；每条提醒一句话写全，没送到的才标红，原因用界面的语言说。从任务页签挪到整页后不再停在「这个任务」上。

## 0.1.0

首个版本：agent 用 watch / unwatch / watching 关注这台电脑上别的 agent，分三档：出问题时（默认）、出问题或者等人处理时、有任何动静时。提醒用人话写，不用回复。页签是一张图：线是提醒走的路，线上写送到了几次，没送到的线是红的；鼠标停在线上或点上会用一句话说明。
