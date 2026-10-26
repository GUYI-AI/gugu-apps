# 上下文 / Context

按项目查看 Claude 和 Codex 的任务热度、上下文健康和加载容量。项目卡使用同一套像素角色视觉；浅色和深色随咕咕主题变化。

- 自动发现本机配置根，按 realpath 去重；worktree 并到主仓，同一远程仓库跨机器合并。
- 21 条程序检查直接读取文件和宿主的上下文摘要，不消耗模型额度。3 条语义检查只提供复制提示。
- 修复先显示完整改动。确认后保存改前快照，再比文件哈希、realpath 和修改时间；文件改变就拒绝。近重复、description/type 缺项和规则含义不会自动推断。
- 任务热度与跨机器读数使用 App API 17 的宿主程序调用及任务索引/读取接口。需要在每台参与的机器安装并启用同一版本的 App。索引更新或无法读取时明确显示未测。

在 App 的「设置」页补充配置根或项目路径，每行一个。配置根自动包含 `CLAUDE_CONFIG_DIR`、`~/.claude`、`~/.rec/claude/accounts/*/config`、`CODEX_HOME` 和 `~/.codex`。

`pixel-kit.css` 和 `pixel-kit.js` 集中定义角色卡、稳定的项目像素头像、格子能力条和硬描边按钮。中性色、字体、语义色全部取宿主 token；粉彩仅用于头像、卡片色条及能力格子。

## 命令行

```sh
node tools.js --diagnose /absolute/path/to/memory
node tools.js --diagnose /absolute/path/to/project
node tools.js --diagnose /absolute/path/to/memory --context-export /absolute/path/to/context-export.json
```

CLI 不解析 transcript。导出文件支持宿主 `sessions.read({view:'context'})` 的单份投影、投影数组或 `{sessions:[…]}`；没有导出时只报告静态检查，历史检查显示待测。热度还需要导出带宿主首条消息时间计算出的 `hot` / `sources`；未提供则显示未知。输出全部为 JSONL，最后一行是 `type: "summary"`。R17 仅输出唯一路径、涉及文件及分类计数，逐项证据在 App 的分页工具中读取。

Codex 容量只累计仓库根到工作目录的项目指令（每层优先 AGENTS.override.md），全局指令单独列出，不占项目的 32 KiB。R19 从 MEMORY.md 直接收录的 feedback 索引文字提词，拆分连字符标识符，以语料频率过滤；共享至少两个词的条目相连，三条以上给出待判断的一组，不预置主题词表。

程序不读取凭据或认证文件，不发送消息，不派 agent。修复快照保存在 App 数据夹 `snapshots/`，保留原始字节、路径和时间；同一项目的诊断报告刷新覆盖，原始 transcript 始终由宿主管理。
