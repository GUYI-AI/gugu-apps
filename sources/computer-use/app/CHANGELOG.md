# Changelog

## 0.5.0 (unreleased)

- Move native tools, permission checks, driver preparation and target-specific Stop into the ordinary App program (App interface 36).
- Accept direct window-picture clicks, committed Chinese input and paste through the authorized projection channel. Stale frames and changed targets reject input; uncertain native results are never replayed.
- Show on the settings page and the task page whether macOS really allows Gugu Accessibility and Screen Recording. Only a missing permission offers Allow (macOS then asks and lists Gugu), and the page updates by itself once it is on. A call refused for a missing permission opens the task page beside the task.
- The task page says it is getting a new window's picture in its own language, instead of an English line.
- Keep human input lanes separate from agent calls and other viewers. Disconnect cancels only that viewer's pending input, without leaving native keys or buttons held.

## 0.4.1

The task page's tab is titled Computer in English (it read 电脑 to everyone); Chinese keeps 电脑 through `localized.zh-CN`.

## 0.4.0

App interface 25: the preview follows `ctx.workspace.sessionId` (was `ctx.session.id`).

## 0.3.0

App model v2 (App interface 24): `description` gives way to `subtitle` and `contributes.instructions`; the market page reads `store/` (about, screenshots, whats-new); README.md and this file are for the repository only.

## 0.2.5

- The market images show the current settings page in Chinese: `screenshots/settings.jpg` is retaken in 0.2.4, and the promo frames it in place of the 0.2.1 English page.

## 0.2.4

- Declare desktop support for the human interface (App API 12).

## 0.2.3

- Add promotional artwork as the first market image; preserve the existing screenshots.

## 0.2.2

- Add a screenshot of the installed App to the market page.

## 0.2.1

市场上名字下面加一句副标题；App 协议版本改为 8（只发给支持副标题的咕咕）。

## 0.2.0

本 App 成为电脑控制的开关：装着、启用着，Agent 才能经咕咕自带的电脑控制操作这台电脑；停用或卸载就没有。系统授权在本 App 的页面里办。不再托管外部 Computer Use 程序，「MCP 程序」「启动参数」两项设置随之去掉。新增「电脑」页签：每个任务一份，agent 第一次操作电脑时自动出现在那个任务旁边，显示它正在操作的窗口的真实画面、它的光标和每一步。

## 0.1.3

找不到 Computer Use 客户端时，说明缺的是哪个客户端、去哪里安装，以及如何改填本机其他 MCP 程序。

## 0.1.2

换用轻透玻璃质感图标，保留渐变、高光与折射层次。

## 0.1.1

增加正式 App 图标：深青色显示器与指针。

## 0.1.0

首次发布：本机 Computer Use MCP 程序托管、自动发现已安装客户端、统一配置与真实错误状态。
