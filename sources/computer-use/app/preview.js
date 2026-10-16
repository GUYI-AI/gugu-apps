// 预览:这条会话的 agent 用 Computer Use 时,它正在操作的那个窗口和它的每一步。
// 画面只来自程序交回来的真截图(preview_state);没有就是空的,❌ 画一张假的。
// 会话由咕咕盖章:callProgram 带的是这张页此刻所在的会话,页面拿不到别的会话的东西。
import { MotionPlayer } from './cursor.js';

const gugu = window.gugu;
const $ = (id) => document.getElementById(id);
const ui = {
  stage: $('stage'), shot: $('shot'), frame: $('frame'), canvas: $('cursor'), what: $('what'), when: $('when'),
  empty: $('empty'), emptyTitle: $('empty-title'), emptyHint: $('empty-hint'), alert: $('alert'),
};
const LIVE_EVERY_MS = 700;
const CHANGED = 'notifications/computer-use/changed';

const TEXT = {
  'zh-CN': {
    outside: ['放到一条会话旁边', '预览只显示它旁边那条会话的 agent 在操作什么。'],
    idle: ['还没有操作', '这条会话的 agent 用 Computer Use 时，它操作的窗口会出现在这里。'],
    noFrame: '还没有画面',
    failedHint: '刚才那一步没成功，原因在对话里这一步的工具结果。',
    failed: '没能',
    verbs: { click: '点击', double_click: '双击', right_click: '右键点击', drag: '拖动', scroll: '滚动', type_text: '输入',
      press_key: '按键', hotkey: '按键', set_value: '填写', invoke_menu: '选择菜单', launch_app: '打开', set_window_frame: '调整窗口',
      get_window_state: '查看窗口', get_accessibility_tree: '查看窗口', list_apps: '查看 App', list_windows: '查看窗口', zoom: '放大查看' },
    other: '操作',
  },
  'en-US': {
    outside: ['Put it beside a session', 'The preview shows what the agent of the session next to it is operating.'],
    idle: ['Nothing yet', 'When this session\'s agent uses Computer Use, the window it works in shows here.'],
    noFrame: 'No picture yet',
    failedHint: 'The last step did not work; the tool result in the conversation says why.',
    failed: 'Could not',
    verbs: { click: 'Click', double_click: 'Double-click', right_click: 'Right-click', drag: 'Drag', scroll: 'Scroll', type_text: 'Type',
      press_key: 'Press', hotkey: 'Press', set_value: 'Fill in', invoke_menu: 'Choose menu', launch_app: 'Open', set_window_frame: 'Move window',
      get_window_state: 'Look at window', get_accessibility_tree: 'Look at window', list_apps: 'List apps', list_windows: 'List windows', zoom: 'Zoom in' },
    other: 'Act',
  },
};

let context = null;
let text = TEXT['zh-CN'];
let shown = 0;
let animated = '';
let live = false;
let liveTimer = null;
let player = null;
let pending = null;

const visible = () => context?.layout?.visible !== false;
const sessionId = () => context?.session?.id ?? null;

function describe(action) {
  const verb = text.verbs[action.tool] ?? text.other;
  const detail = action.args.text ?? action.args.key ?? (Array.isArray(action.args.keys) ? action.args.keys.join('+') : null)
    ?? action.args.value ?? action.args.direction ?? (action.tool === 'launch_app' ? action.args.app ?? action.args.bundle_id : null);
  const said = detail === null || detail === undefined ? verb : `${verb}「${detail}」`;
  // 失败的原话在对话里那一步的工具结果和 App 页(owner 10-16:统一页不再播报失败),这里只说没做成。
  return action.status === 'failed' ? `${text.failed}${said}` : said;
}

function showEmpty(title, hint) {
  ui.stage.hidden = true;
  ui.empty.hidden = false;
  ui.emptyTitle.textContent = title;
  ui.emptyHint.textContent = hint;
}

function showError(error) {
  ui.alert.hidden = false;
  ui.alert.textContent = error instanceof Error ? error.message : String(error);
}

/**
 * Where a point is on the cursor canvas, or null when the frame is not drawn yet. A point is in the pixels of the
 * screenshot the agent acted on (`space`); the frame on screen may be a smaller live picture of the same window.
 * No space, no cursor: drawn on another picture it would point somewhere else.
 */
function onCanvas(point, space) {
  const { frame, canvas } = ui;
  if (!space || !frame.naturalWidth || !frame.clientWidth) return null;
  const { width, height } = space;
  const box = frame.getBoundingClientRect();
  const origin = canvas.getBoundingClientRect();
  return { x: box.left - origin.left + (point.x * box.width) / width, y: box.top - origin.top + (point.y * box.height) / height };
}

/** The agent's cursor goes where the latest action pointed, on the frame the agent was looking at: flies there when the
 *  action happens while someone watches, simply sits there when the page opens on it. No point, no cursor. */
async function animate(action) {
  const key = `${action.at}|${action.tool}`;
  if (key === animated || !action.point || action.status === 'running') return;
  await ui.frame.decode().catch(() => {});
  const at = onCanvas(action.point, action.space);
  const from = action.from && onCanvas(action.from, action.space);
  if (!at || key === animated) return;
  animated = key;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!player) {
    player = new MotionPlayer(ui.canvas);
    player.place(at);
    return;
  }
  // A drag starts where it grabbed: go there first, then carry it to where it let go.
  if (from) await player.moveTo(from, { reducedMotion: reduced });
  await player.moveTo(at, { reducedMotion: reduced });
  if (/click/.test(action.tool)) player?.click();
}

function apply(state) {
  if (!state.session) { showEmpty(...text.outside); return; }
  live = state.live && state.target?.pid !== undefined && state.target?.window_id !== undefined;
  const latest = state.actions.at(-1);
  const app = typeof state.target?.app === 'string' ? state.target.app : null;
  const said = [app, latest && describe(latest)].filter(Boolean).join(' · ');
  if (state.frame) {
    shown = state.frame.seq;
    ui.frame.src = `data:${state.frame.mimeType};base64,${state.frame.data}`;
    ui.when.setAttribute('datetime', state.frame.at);
  }
  if (shown === 0) {
    if (latest?.status === 'failed') showEmpty(text.noFrame, text.failedHint);
    else if (latest) showEmpty(text.noFrame, said);
    else showEmpty(...text.idle);
    return;
  }
  ui.empty.hidden = true;
  ui.stage.hidden = false;
  ui.what.textContent = said;
  const pointed = state.actions.findLast((action) => action.point && action.status !== 'running');
  if (pointed) void animate(pointed);
}

/** One read at a time; a change that arrives during a read asks for one more afterwards. */
async function refresh(options = {}) {
  if (pending) { pending.again = true; return; }
  pending = { again: false };
  try {
    if (!sessionId()) { showEmpty(...text.outside); return; }
    const result = await gugu.callProgram('preview_state', { since: shown, live: Boolean(options.live) });
    if (result.isError) throw new Error(result.content?.find((block) => block.type === 'text')?.text ?? 'preview_state failed');
    ui.alert.hidden = true;
    apply(result.structuredContent);
  } catch (error) {
    // 空态和「桥断了」长得一样 —— 让第二种看得见。
    showError(error);
  } finally {
    const again = pending.again;
    pending = null;
    if (again) void refresh();
    schedule();
  }
}

/** Fresh frames only while someone is looking at this session's preview, and only when the program can take them. */
async function schedule() {
  clearTimeout(liveTimer);
  liveTimer = null;
  if (!live || !visible()) return;
  const app = await gugu.getAppState().catch(() => null);
  if (app && app.activeSessionId !== sessionId()) return;
  liveTimer = setTimeout(() => void refresh({ live: true }), LIVE_EVERY_MS);
}

function reset() {
  shown = 0;
  animated = '';
  ui.frame.removeAttribute('src');
  player?.destroy();
  player = null;
}

async function start() {
  try {
    context = await gugu.getContext();
  } catch (error) {
    showError(error);
    return;
  }
  text = TEXT[context.locale] ?? (String(context.locale).startsWith('zh') ? TEXT['zh-CN'] : TEXT['en-US']);
  gugu.onContextChanged((next) => {
    const moved = next.session?.id !== undefined && next.session.id !== sessionId();
    context = { ...context, ...next };
    if (moved) reset();
    void refresh();
  });
  gugu.onProgramNotification((notification) => {
    if (notification.method === CHANGED) void refresh();
  });
  await refresh();
}

void start();
