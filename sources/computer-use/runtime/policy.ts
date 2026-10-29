// Migrated from OpenDCAI/gugu@1f8cd5f3a81df091d25a81f6838f186c33504a95: apps/desktop/electron/device-actions/families/computer.ts
import path from 'node:path'
import { num, str, type Args, type DeviceActionRisk, type SelfApp } from './types'

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** 一段文字最长留多少(get_window_state 的树很长)。 */
const TEXT_CAP = 100_000

const BACKGROUND = 'By default, runs in the background: it does not move the person\'s real pointer or take keyboard focus; an agent cursor drawn on screen shows where it acts.'

type Kind = 'look' | 'act'

export interface CuaTool {
  /** cua-driver 的工具名;咕咕的名字是 computer.<它>。 */
  cua: string
  title: string
  titleEn: string
  kind: Kind
  /** 默认 look = medium、act = high。 */
  risk?: DeviceActionRisk
  /** always:每次先问;on_conflict:前台投递时先问(动作自己回 needs_confirmation)。 */
  confirm?: 'always' | 'on_conflict'
  question?(args: Args): string
  /** 接在 cua 自己的说明后面的那句。 */
  note?: string
  /** 输入类:目标必须是一个窗口(pid / window target / element_token)。 */
  windowInput?: true
  timeoutMs?(args: Args): number
}

const WINDOW_ONLY = 'Target one window (pid with window_id, a window target, or an element_token from computer.get_window_state). Desktop-wide input (scope or target "desktop", or no window at all) moves the person\'s real pointer and is refused by 咕咕.'
const FOREGROUND = 'delivery_mode "foreground" briefly brings the target to the front and interrupts the person: the tool returns immediately so the agent can ask the person using its existing conversation, then retry with confirmed: true after explicit approval. Foreground HID mouse input moves the person\'s real pointer, including across displays. The person and agent share the pointer and keyboard focus; simultaneous input can interfere with clicks. Coordinate foreground work with the person; standing authorization does not isolate their concurrent desktop use.'
const NOT_GUGU = 'Operating 咕咕 itself is refused.'
const MENU_FOCUS = 'Some native menus need the app to remain active across calls. A foreground click immediately restores the previous app and can dismiss such a menu. After the person has authorized foreground work, record the previous active app with list_apps, use bring_to_front to keep the target active, read the menu and choose its item, then restore the previous app. Check fresh pixels and list_windows filtered by pid; a successful dispatch alone does not prove that a menu opened.'

export const TOOLS: readonly CuaTool[] = [
  // 看
  { cua: 'list_apps', title: '列出 App', titleEn: 'List apps', kind: 'look' },
  { cua: 'list_windows', title: '列出窗口', titleEn: 'List windows', kind: 'look', note: 'Menus and popovers can be separate windows. Filter by pid to include their window layers before concluding that a menu did not open.' },
  { cua: 'get_window_state', title: '看窗口', titleEn: 'Read a window', kind: 'look', note: 'Without Screen Recording permission pass include_screenshot: false to get the accessibility tree alone. On macOS, a post-input screenshot includes observation_stability from bounded pixel/geometry sampling; timeout is inconclusive, so read again before acting.' },
  { cua: 'get_accessibility_tree', title: '看桌面概况', titleEn: 'Desktop overview', kind: 'look' },
  { cua: 'get_desktop_state', title: '截整个屏幕', titleEn: 'Capture the screen', kind: 'look' },
  { cua: 'zoom', title: '放大看一块', titleEn: 'Zoom into a window', kind: 'look' },
  { cua: 'get_screen_size', title: '查屏幕尺寸', titleEn: 'Screen size', kind: 'look', risk: 'low' },
  { cua: 'get_cursor_position', title: '查鼠标位置', titleEn: 'Pointer position', kind: 'look', risk: 'low' },
  { cua: 'verify_state', title: '核对窗口状态', titleEn: 'Verify a window', kind: 'look' },
  // App 与窗口
  {
    cua: 'launch_app',
    title: '在后台打开 App',
    titleEn: 'Launch an app',
    kind: 'act',
    risk: 'medium',
    confirm: 'on_conflict',
    note: `On Windows an app may jump to the front as it starts (cua-driver cannot stop that for a normal launch): the tool returns immediately so the agent can ask the person using its existing conversation, then retry with confirmed: true after explicit approval — unless you pass start_minimized: true, which starts it without ever activating it, or refuses and starts nothing. If it still times out, the app may come up anyway — look with list_windows before launching it again. ${NOT_GUGU}`,
  },
  {
    cua: 'bring_to_front',
    title: '把 App 切到前台',
    titleEn: 'Bring an app to front',
    kind: 'act',
    confirm: 'always',
    question: () => '要把它正在操作的 App 切到前台吗？它会一直留在最前面，打断你正在用的窗口。',
    note: `Requires the person's consent; an applicable explicit standing authorization counts. Before activating, record the previous active app with list_apps and restore it after the interactions. ${NOT_GUGU}`,
  },
  { cua: 'set_window_frame', title: '调整窗口位置大小', titleEn: 'Move or resize a window', kind: 'act', risk: 'medium', note: NOT_GUGU },
  { cua: 'invoke_menu', title: '点菜单', titleEn: 'Use an app menu', kind: 'act', note: NOT_GUGU },
  {
    cua: 'kill_app',
    title: '强制退出 App',
    titleEn: 'Force-quit an app',
    kind: 'act',
    confirm: 'always',
    question: (args) => `要强制退出进程 ${num(args, 'pid') ?? '?'} 吗？它没保存的内容会丢。`,
    note: `Only processes this driver launched can be ended; requires the person’s prior explicit approval every time. ${NOT_GUGU}`,
  },
  // 操作
  { cua: 'click', title: '点击', titleEn: 'Click', kind: 'act', confirm: 'on_conflict', windowInput: true, note: MENU_FOCUS },
  { cua: 'double_click', title: '双击', titleEn: 'Double-click', kind: 'act', confirm: 'on_conflict', windowInput: true },
  { cua: 'right_click', title: '右键点击', titleEn: 'Right-click', kind: 'act', confirm: 'on_conflict', windowInput: true },
  { cua: 'drag', title: '拖动', titleEn: 'Drag', kind: 'act', confirm: 'on_conflict', windowInput: true },
  { cua: 'scroll', title: '滚动', titleEn: 'Scroll', kind: 'act', confirm: 'on_conflict', windowInput: true },
  {
    cua: 'move_cursor',
    title: '移动 agent 鼠标',
    titleEn: 'Move the agent cursor',
    kind: 'act',
    risk: 'medium',
    note: 'Without a target only the agent cursor moves (screen points); with a window target it may hover. A desktop target would move the person\'s real pointer and is refused.',
  },
  { cua: 'type_text', title: '输入文字', titleEn: 'Type text', kind: 'act', confirm: 'on_conflict', windowInput: true },
  { cua: 'press_key', title: '按键', titleEn: 'Press a key', kind: 'act', confirm: 'on_conflict', windowInput: true },
  { cua: 'hotkey', title: '按快捷键', titleEn: 'Press a shortcut', kind: 'act', confirm: 'on_conflict', windowInput: true },
  { cua: 'set_value', title: '设置值', titleEn: 'Set a value', kind: 'act', confirm: 'on_conflict', windowInput: true },
  {
    cua: 'run_steps',
    title: '连续做几步',
    titleEn: 'Run steps',
    kind: 'act',
    confirm: 'on_conflict',
    note: 'Every step must name its window (pid, or app — a window title alone is not enough); the same 咕咕 rules apply to each step.',
    timeoutMs: () => 75_000,
  },
]

/** 这些工具带 delivery_mode / target,要按「窗口输入」那套判。 */
const INPUT_TOOLS = new Set(['click', 'double_click', 'right_click', 'drag', 'scroll', 'type_text', 'press_key', 'hotkey', 'set_value', 'move_cursor'])

// ───────────────────────── 规矩:不碰咕咕、不动真鼠标、抢焦点先问 ─────────────────────────

const lower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')

function targetPid(args: Args): number | undefined {
  const target = isRecord(args.target) ? args.target : null
  if (target && isNum(target.pid)) return target.pid
  return isNum(args.pid) ? args.pid : undefined
}

function isDesktop(args: Args): boolean {
  const target = isRecord(args.target) ? args.target : null
  return lower(args.scope) === 'desktop' || lower(target?.kind) === 'desktop'
}

/** 一次调用(或 run_steps 里的一步)碰不碰得:回拒绝原因,能做回 null。 */
function refusal(tool: string, args: Args, self: SelfApp, inherited: { pid?: number; app?: string } = {}): string | null {
  const pid = targetPid(args) ?? inherited.pid
  if (pid !== undefined && self.pids.has(pid)) return 'That is 咕咕 itself: 咕咕 does not let an agent operate its own windows.'
  for (const key of ['bundle_id', 'app', 'name'] as const) {
    if (key === 'name' && tool !== 'launch_app' && tool !== 'bring_to_front') continue
    if (self.names.has(lower(args[key]))) return 'That is 咕咕 itself: 咕咕 does not let an agent operate its own windows.'
  }
  if (!INPUT_TOOLS.has(tool)) return null
  if (isDesktop(args)) return 'Desktop-wide input moves the person\'s real pointer / acts on whatever they are using: 咕咕 refuses it. Target one window (pid and window_id, or an element_token).'
  if (tool === 'move_cursor') return null
  const hasWindow = pid !== undefined || typeof args.element_token === 'string' || (inherited.app ?? str(args, 'app')) !== ''
  if (!hasWindow) {
    return typeof args.window === 'string'
      ? 'Name the app too (app or pid): a window title alone could match 咕咕 or a window the person is using.'
      : 'Name the window to act on (pid and window_id, or an element_token from computer.get_window_state): input without a window would land on whatever the person is using.'
  }
  return null
}

function stepsOf(args: Args): Array<{ tool: string; args: Args }> {
  const steps = Array.isArray(args.steps) ? args.steps : []
  return steps.flatMap((step): Array<{ tool: string; args: Args }> => {
    if (!isRecord(step)) return []
    if (typeof step.tool === 'string') return [{ tool: step.tool, args: isRecord(step.args) ? step.args : {} }]
    const key = Object.keys(step).find((k) => INPUT_TOOLS.has(k))
    return key ? [{ tool: key, args: isRecord(step[key]) ? (step[key] as Args) : {} }] : []
  })
}

/** Windows 上普通启动的 App 可能自己跳到前台(cua-driver 拦不住,只有 start_minimized 能保证不激活):先问人。 */
function launchQuestion(args: Args): string {
  const target = str(args, 'name') || path.win32.basename(str(args, 'path') || str(args, 'launch_path')) || str(args, 'bundle_id') || str(args, 'aumid') || '这个 App'
  return `要打开「${target}」吗？在 Windows 上它打开时可能会跳到最前面，打断你正在用的窗口。`
}

/** run_steps 每一步都过一遍;前台投递(自己的或继承的)记下来,回给外面去问。 */
export function checkCall(tool: string, args: Args, self: SelfApp, platform: NodeJS.Platform): { refused: string | null; foreground: boolean; question?: string } {
  if (tool === 'launch_app') {
    const refused = refusal(tool, args, self)
    return platform === 'win32' && args.start_minimized !== true
      ? { refused, foreground: true, question: launchQuestion(args) }
      : { refused, foreground: false }
  }
  if (tool !== 'run_steps') {
    return { refused: refusal(tool, args, self), foreground: (lower(args.delivery_mode) === 'foreground' || args.foreground_fallback === true) }
  }
  const inherited = { ...(isNum(args.pid) ? { pid: args.pid } : {}), ...(typeof args.app === 'string' ? { app: args.app } : {}) }
  if (self.names.has(lower(args.app))) return { refused: 'That is 咕咕 itself: 咕咕 does not let an agent operate its own windows.', foreground: false }
  if (inherited.pid !== undefined && self.pids.has(inherited.pid)) return { refused: 'That is 咕咕 itself: 咕咕 does not let an agent operate its own windows.', foreground: false }
  let foreground = lower(args.delivery_mode) === 'foreground' || args.foreground_fallback === true
  for (const [i, step] of stepsOf(args).entries()) {
    if (!INPUT_TOOLS.has(step.tool)) return { refused: `Step ${i + 1}: run_steps here only runs ${[...INPUT_TOOLS].join(', ')}.`, foreground }
    const problem = refusal(step.tool, step.args, self, inherited)
    if (problem) return { refused: `Step ${i + 1}: ${problem}`, foreground }
    if (lower(step.args.delivery_mode) === 'foreground' || step.args.foreground_fallback === true) foreground = true
  }
  if (isRecord(args.observe) && self.pids.has(targetPid(args.observe) ?? -1)) {
    return { refused: 'That is 咕咕 itself: 咕咕 does not let an agent operate its own windows.', foreground }
  }
  return { refused: null, foreground }
}


/** Retained native tool guidance; confirmation is asserted by the agent after asking the person. */
export function descriptionOf(tool: CuaTool, spec: { description?: string }): string {
  return [spec.description || tool.titleEn,
    tool.kind === 'act' && !['kill_app', 'bring_to_front', 'invoke_menu'].includes(tool.cua) ? BACKGROUND : '',
    tool.windowInput ? WINDOW_ONLY : '',
    tool.confirm === 'on_conflict' && tool.cua !== 'launch_app' ? FOREGROUND : '',
    tool.note || '',
  ].filter(Boolean).join('\n\n').replaceAll('computer.', '')
}
