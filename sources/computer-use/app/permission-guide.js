// Shows whether macOS really lets the running driver see and use this computer, and walks the person through
// the missing switches. The driver's own check is the only source; nothing here grants anything.
export const PERMISSION_TEXT = {
  zh: { accessibility: '辅助功能', accessibilityWhy: '用来点按和输入', screen: '屏幕录制', screenWhy: '用来看到屏幕',
    allow: '去允许', allowed: '已允许', denied: '未允许', checking: '正在检查…', unknown: '未能检查',
    missing: 'Agent 还不能在这台 Mac 上操作。点「去允许」，在打开的系统设置里打开「咕咕」的开关；这里会自己更新。',
    ready: '都已允许，Agent 可以操作这台 Mac 了。',
    opened: '系统设置已打开：找到「咕咕」，打开它的开关。',
    other: '这台电脑不需要 macOS 权限设置。' },
  en: { accessibility: 'Accessibility', accessibilityWhy: 'to click and type', screen: 'Screen Recording', screenWhy: 'to see the screen',
    allow: 'Allow', allowed: 'Allowed', denied: 'Not allowed', checking: 'Checking…', unknown: 'Could not check',
    missing: 'Agents cannot use this Mac yet. Click Allow, then turn on Gugu in the System Settings that opens; this updates by itself.',
    ready: 'Both are allowed. Agents can use this Mac.',
    opened: 'System Settings is open: find Gugu and turn it on.',
    other: 'This computer does not use macOS permission settings.' },
};
const KINDS = ['accessibility', 'screen'];
const POLL_MS = 2000;

/** Renders into `root` and keeps itself current. `onState` receives 'ready' | 'missing' | 'unsupported' | 'unknown'. */
export function createPermissionGuide(root, { gugu, onState = () => {} }) {
  let text = PERMISSION_TEXT.en, generation = 0, timer = null, state = null, status = 'unknown', stopped = false;
  root.classList.add('permission-guide');
  root.innerHTML = '<p class="permission-summary" aria-live="polite"></p><div class="permission-rows"></div><p class="permission-notice" aria-live="polite"></p>';
  const summary = root.querySelector('.permission-summary'), notice = root.querySelector('.permission-notice');
  const rows = Object.fromEntries(KINDS.map(kind => {
    const row = document.createElement('div'); row.className = 'permission';
    row.innerHTML = '<div><strong></strong><p></p></div><span class="permission-state"></span><button type="button"></button>';
    root.querySelector('.permission-rows').append(row);
    const button = row.querySelector('button');
    button.id = `${kind}-open`;
    button.addEventListener('click', () => void open(kind, button));
    return [kind, { row, title: row.querySelector('strong'), why: row.querySelector('p'), chip: row.querySelector('.permission-state'), button }];
  }));
  const message = result => result.content?.find(block => block.type === 'text')?.text || text.unknown;
  function render() {
    for (const kind of KINDS) {
      const { title, why, chip, button } = rows[kind];
      title.textContent = text[kind]; why.textContent = text[`${kind}Why`];
      button.textContent = text.allow; button.setAttribute('aria-label', `${text.allow} · ${text[kind]}`);
      const granted = state ? (kind === 'accessibility' ? state.accessibility : state.screen_recording) : null;
      chip.textContent = granted === null ? (status === 'unknown' && state === null ? text.checking : text.unknown) : granted ? text.allowed : text.denied;
      chip.dataset.granted = String(granted);
      // A granted switch needs nothing from the person; only missing ones offer the way there.
      button.hidden = granted !== false;
    }
    root.querySelector('.permission-rows').hidden = status === 'unsupported';
    summary.textContent = status === 'ready' ? text.ready : status === 'missing' ? text.missing : status === 'unsupported' ? text.other : '';
    if (status === 'ready') notice.textContent = '';
  }
  function schedule() {
    clearTimeout(timer); timer = null;
    // Keep watching only while something is missing and someone can see it, so the switch shows up here by itself.
    if (!stopped && status === 'missing' && document.visibilityState === 'visible') timer = setTimeout(() => void check(), POLL_MS);
  }
  async function check() {
    stopped = false;
    const own = ++generation;
    try {
      const result = await gugu.callProgram('permissions_state', {});
      if (own !== generation) return status;
      if (result.isError) {
        state = null;
        status = result.structuredContent?.code === 'unsupported' ? 'unsupported' : 'unknown';
        if (status === 'unknown') notice.textContent = message(result);
      } else {
        const value = result.structuredContent;
        if (typeof value?.accessibility !== 'boolean' || typeof value?.screen_recording !== 'boolean') throw new Error(text.unknown);
        state = value;
        status = value.accessibility && value.screen_recording ? 'ready' : 'missing';
      }
    } catch (error) {
      if (own !== generation) return status;
      state = null; status = 'unknown'; notice.textContent = String(error?.message ?? error);
    }
    render(); onState(status); schedule();
    return status;
  }
  async function open(kind, button) {
    button.disabled = true;
    try {
      const result = await gugu.callProgram('open_system_settings', { permission: kind });
      notice.textContent = result.isError ? message(result) : text.opened;
    } catch (error) { notice.textContent = String(error?.message ?? error); }
    finally { button.disabled = false; void check(); }
  }
  const onVisible = () => { if (!stopped && document.visibilityState === 'visible' && status === 'missing') void check(); };
  document.addEventListener('visibilitychange', onVisible);
  render();
  return {
    setLocale(locale) { text = String(locale).startsWith('zh') ? PERMISSION_TEXT.zh : PERMISSION_TEXT.en; render(); },
    check,
    get status() { return status; },
    stop() { stopped = true; generation++; clearTimeout(timer); timer = null; },
  };
}
