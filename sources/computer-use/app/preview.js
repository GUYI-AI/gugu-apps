// Pictures use the task-authorized shared viewer; only task metadata is read over MCP.
import { MotionPlayer } from './cursor.js';
import { createPaintedCursor } from './painted-cursor.js';
import { startPageContext } from './page-context.js';
import { createPermissionGuide } from './permission-guide.js';
const gugu = window.gugu;
const $ = id => document.getElementById(id);
const ui = { stage: $('stage'), frame: $('frame'), canvas: $('cursor'), what: $('what'), when: $('when'),
  empty: $('empty'), emptyTitle: $('empty-title'), alert: $('alert'), place: $('place'), target: $('target'), pause: $('pause') };
const TEXT = {
  'zh-CN': {
    outside: '在任务里打开，才能看到 agent 的操作',
    local: '本机', remote: '远端', pause: '暂停操作', resume: '继续操作', noTarget: '尚未观察到窗口',
    idle: 'agent 操作电脑时，画面会显示在这里',
    loading: '正在获取画面…',
    unseen: '暂时看不到画面',
    stale: '没有新画面：',
    waiting: '正在获取这个窗口的画面…',
    cursorStale: '光标暂不可用：',
    failed: '没能',
    verbs: { click: '点击', double_click: '双击', right_click: '右键点击', drag: '拖动', scroll: '滚动', type_text: '输入',
      press_key: '按键', hotkey: '按键', set_value: '填写', invoke_menu: '选择菜单', launch_app: '打开', set_window_frame: '调整窗口',
      get_window_state: '查看窗口', get_accessibility_tree: '查看窗口', list_apps: '查看打开的 App', list_windows: '查看窗口', zoom: '放大查看',
      run_steps: '连续操作' },
    other: '操作',
  },
  'en-US': {
    outside: 'Open it in a task to see what the agent does',
    local: 'Local', remote: 'Remote', pause: 'Pause operation', resume: 'Continue operation', noTarget: 'No observed window',
    idle: 'When the agent uses the computer, it shows here',
    loading: 'Getting the picture…',
    unseen: 'Cannot see the screen right now',
    stale: 'No fresh picture: ',
    waiting: 'Getting this window’s picture…',
    cursorStale: 'Cursor unavailable: ',
    failed: 'Could not',
    verbs: { click: 'Click', double_click: 'Double-click', right_click: 'Right-click', drag: 'Drag', scroll: 'Scroll', type_text: 'Type',
      press_key: 'Press', hotkey: 'Press', set_value: 'Fill in', invoke_menu: 'Choose menu', launch_app: 'Open', set_window_frame: 'Move window',
      get_window_state: 'Look at window', get_accessibility_tree: 'Look at window', list_apps: 'See open apps', list_windows: 'Look at windows', zoom: 'Zoom in',
      run_steps: 'Do steps' },
    other: 'Act',
  },
};

let context = null, text = TEXT['zh-CN'], player = null, pending = null, timer = null;
let generation = 0, resource = null, view = null, live = false;
let controlTask = null, controlRevision = null, paused = false, controlling = false;
// On this Mac, a missing system permission is why nothing shows or works: say so here, with the way to fix it.
const permit = createPermissionGuide($('permit'), { gugu, onState(status) { $('permit').hidden = status !== 'missing'; document.body.classList.toggle('blocked', status === 'missing'); } });
const local = () => !context?.workspace?.deviceId;
const sessionId = () => context?.workspace?.sessionId ?? null;
const visible = () => context?.layout?.visible !== false;
const cursor = createPaintedCursor({
  hide() { ui.canvas.style.visibility = 'hidden'; },
  show(point, frame, click) {
    const box = ui.frame.getBoundingClientRect();
    const scale = Math.min(box.width / frame.width, box.height / frame.height);
    if (!(scale > 0)) { ui.canvas.style.visibility = 'hidden'; return; }
    player ??= new MotionPlayer(ui.canvas);
    player.place({ x: (box.width - frame.width * scale) / 2 + point.x * scale,
      y: (box.height - frame.height * scale) / 2 + point.y * scale });
    ui.canvas.style.visibility = 'visible';
    if (click) player.click();
  },
});
function empty(title) { ui.stage.hidden = resource === null; ui.empty.hidden = false; ui.emptyTitle.textContent = title; }
function error(reason) { ui.alert.hidden = false; ui.alert.textContent = reason instanceof Error ? reason.message : String(reason); }
function describe(action) {
  const verb = text.verbs[action.tool] ?? text.other;
  const detail = action.args.text ?? action.args.key ?? (Array.isArray(action.args.keys) ? action.args.keys.join('+') : null)
    ?? action.args.value ?? action.args.direction ?? (action.tool === 'launch_app' ? action.args.app ?? action.args.name ?? action.args.bundle_id : null);
  const said = detail === null || detail === undefined ? verb : `${verb}「${detail}」`;
  return action.status === 'failed' ? `${text.failed}${said}` : said;
}
function reset() {
  generation++; resource = null; live = false; clearTimeout(timer); timer = null;
  controlTask = null; controlRevision = null; ui.pause.disabled = true;
  if (view) void view.close().catch(() => {});
  view = null; ui.frame.replaceChildren(); cursor.reset();
  player?.destroy(); player = null;
}
async function mount(id) {
  if (resource === id) return;
  reset(); resource = id;
  const epoch = generation;
  if (!id) return;
  ui.stage.hidden = false;
  // The shared surface handles pointer, committed IME text and paste in the picture.
  // The App validates the acknowledged target frame and applies native input.
  const mounted = await gugu.projection.mount(ui.frame, id, {
    painted(frame) {
      if (epoch !== generation) return;
      cursor.painted(frame);
      if (frame) { ui.stage.hidden = false; ui.empty.hidden = true; }
    },
    state(state, reason) { if (epoch === generation && state === 'closed') { cursor.painted(null); if (reason) error(reason); } },
    error(reason) { if (epoch === generation) error(reason); },
  });
  if (epoch !== generation) { void mounted.close().catch(() => {}); return; }
  view = mounted;
}
async function apply(state) {
  if (!state.session) { reset(); empty(text.outside); return; }
  const latest = state.actions.at(-1);
  if (local() && latest?.status === 'failed' && permit.status !== 'missing') void permit.check();
  const said = [state.target?.app, latest && describe(latest), state.liveProblem ? `${text.stale}${state.liveProblem}` : state.waiting && text.waiting].filter(Boolean).join(' · ');
  ui.what.textContent = said;
  await mount(state.projection);
  controlTask = state.target?.pid && state.projection ? sessionId() : null;
  controlRevision = state.targetRevision;
  paused = state.paused === true;
  ui.place.textContent = `Computer Use · ${context?.workspace?.deviceId ? text.remote : text.local}`;
  ui.target.textContent = state.target?.app ?? (state.target?.pid ? `PID ${state.target.pid}` : text.noTarget);
  ui.pause.textContent = paused ? text.resume : text.pause;
  ui.pause.disabled = !controlTask || controlling;
  cursor.frames(state.frames);
  const last = state.frames.at(-1);
  if (last) ui.when.setAttribute('datetime', last.at);
  if (!last) empty(!latest ? text.idle : latest.status === 'running' ? text.loading : text.unseen);
  live = state.live;
}
async function refresh(options = {}) {
  if (pending) { pending.again = true; return; }
  const request = { again: false }; pending = request;
  const requested = sessionId(), epoch = generation;
  try {
    if (!requested) { empty(text.outside); return; }
    const result = await gugu.callProgram('preview_state', { live: options.live === true });
    if (requested !== sessionId() || epoch !== generation) return;
    if (result.isError) throw new Error(result.content?.find(block => block.type === 'text')?.text ?? 'preview_state failed');
    ui.alert.hidden = true;
    await apply(result.structuredContent);
  } catch (reason) { if (requested === sessionId()) error(reason); }
  finally {
    pending = null;
    if (request.again) void refresh();
    clearTimeout(timer); timer = null;
    if (live && visible()) timer = setTimeout(() => void refresh({ live: true }), 700);
  }
}
async function start() {
  ui.pause.addEventListener('click', async () => {
    if (controlling || !controlTask || controlTask !== sessionId()) return;
    const task = controlTask, epoch = generation;
    controlling = true; ui.pause.disabled = true;
    try {
      const result = await gugu.callProgram('preview_control', { action: paused ? 'resume' : 'pause', projection: resource, targetRevision: controlRevision });
      if (task !== sessionId() || epoch !== generation) return;
      if (result.isError) throw new Error(result.content?.find(block => block.type === 'text')?.text ?? 'Control failed');
      if (paused && result.structuredContent?.paused) error(result.structuredContent.reason ?? 'This computer is still paused.');
      void refresh({ live: result.structuredContent?.paused !== true });
    } catch (reason) { if (task === sessionId() && epoch === generation) error(reason); }
    finally { controlling = false; ui.pause.disabled = !controlTask || controlTask !== sessionId(); }
  });
  new ResizeObserver(() => cursor.resize()).observe(ui.frame);
  gugu.onProgramNotification(notification => {
    if (context && notification.method === 'notifications/computer-use/changed') void refresh();
  });
  await startPageContext({ read: () => gugu.getContext(), subscribe: receive => gugu.onContextChanged(receive),
    accept(next) {
      const moved = (next.workspace?.sessionId ?? null) !== sessionId();
      context = next;
      text = String(next.locale).startsWith('zh') ? TEXT['zh-CN'] : TEXT['en-US'];
      if (moved) reset();
      permit.setLocale(next.locale);
      if (local()) void permit.check(); else { permit.stop(); $('permit').hidden = true; document.body.classList.remove('blocked'); }
      void refresh();
    }, reject: error });
}
void start();
