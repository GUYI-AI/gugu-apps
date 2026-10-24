# Changelog

## 1.0.6

- Let agents address a specific shared board by file ID. Renamed boards stay independent; a supplied chat must match the file’s source chat.

## 1.0.5

- Declare desktop and phone support for the human interface (App API 12).

## 1.0.4

- Create cards in the host App dialog on desktop and phone. The draft stays open when saving fails; it uses the board's existing save path and can include a note and the current task.

## 1.0.3

- Show unavailable linked tasks and working copies beside their links instead of raising a board-wide error.
- Let people dismiss other errors.

## 1.0.2

- Add promotional artwork as the first market image; preserve the existing screenshots.

## 1.0.1

- 卡片详情改为先阅读、点击才编辑：标题、说明在原处编辑；属性排成标题下的一行，点击某一项只编辑这一项，回车或离开即保存，Esc 放弃。
- 关联操作收进「添加」菜单；行上的操作在鼠标悬停时显示（触屏上始终显示）。
- 属性名称调整为：状态、负责人、进度、等待、下一步、截止日期、更新时间。

## 1.0.0

看板与车道面板合并为「协作看板」。

- 群看板：在群、私聊、话题的右栏打开，看板保存在群文件夹中，群成员和各自的 agent 共同推进，修改实时同步；手机上也可以查看和修改。左侧栏可在本机看板和各群看板之间切换。
- 进度：卡片新增进度、在等、下一步、截止；显示等待原因；关联了任务、处于进行中且超过 45 分钟未更新的卡片显示为未更新。
- 「需要处理」筛选：有等待事项或关联任务待批准、待回复的卡片。
- 卡片显示 agent 头像、任务所在电脑和更新时间；任务状态包括你其他电脑上的任务。
- 在每列底部添加卡片；删除卡片移入「更多」菜单；窄屏下各列纵向排列，进行中和待验收在前，待办和完成默认收起。
- agent 工具新增 `update`（进度、在等、下一步、截止）；所有工具可传 `chat` 操作群看板；`link` 可关联群文件。
- 权限：读取 agent 状态的范围扩大到你的所有电脑（`agents:read:all-machines`）。

## 0.2.1

市场上名字下面加一句副标题，产品页加三张真实使用截图；App 协议版本改为 8（只发给支持副标题的咕咕）。

## 0.2.0

- 在旁边打开：卡片关联的文件和任务可在看板旁边打开，关闭后看板保持原样。Markdown、文本、图片、视频仍可在卡片内直接查看。
- 关联项目文件：可从本机项目文件夹中选择文件关联到卡片。
- agent 通过工具所做的修改会立即显示在看板上。

## 0.1.2

- 在手机上打开不再出错：手机上没有后台页，看板读不到也改不了，页面只显示「看板仅支持在电脑上使用」。

## 0.1.1

- 界面文案改为规范用语：任务状态显示为运行中、后台运行、待批准、待回复、本轮完成、已停止；按钮改为关联任务、关联任务文件、关联群文件、转给任务、新建任务、打开任务。
- 删除界面上关于平台后续能力的说明；暂不支持在卡片内预览的文件类型，显示「此类文件暂不支持在卡片内预览」。
- 市场描述、示例和 README 同步调整。

## 0.1.0

- 本机任务看板：默认四列（待办、进行中、待验收、完成），可添加列、重命名列；卡片可拖拽排序，窄屏下逐列显示。
- 可在左侧栏、任务页标签、群、私聊、话题右栏中打开，各入口数据同步；数据仅由 App 自身的程序写入，多处同时修改不会丢失。
- 卡片可关联本机任务并显示任务状态，待处理的卡片数显示在标签角标上。
- 卡片可关联任务文件、群文件、链接、PR、群消息；Markdown、文本、图片、视频可在卡片内查看，Markdown 和文本可在卡片内编辑。
- agent 工具 `list`、`get`、`create`、`claim`、`move`、`comment`、`link`，以及 skill `kanban`。
