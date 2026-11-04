import { startPageContext } from './page-context.js';

const gugu = window.gugu;
const $ = id => document.getElementById(id);
const ui = { permissions: $('permissions'), intro: $('intro'), refresh: $('refresh'), notice: $('notice'),
  accessibility: $('accessibility-state'), screen: $('screen-state') };
const copy = {
  en: { intro: 'The running Computer Use driver checks its own system permissions.', accessibility: 'Accessibility', screen: 'Screen Recording',
    open: 'Open Settings', refresh: 'Refresh', checking: 'Checking…', allowed: 'Allowed', denied: 'Not allowed', unknown: 'Could not check',
    opened: 'System Settings opened. Refresh after changing access.', other: 'This computer does not use the macOS permission panels.' },
  zh: { intro: '由实际运行的 Computer Use 驱动检查系统权限。', accessibility: '辅助功能', screen: '屏幕录制',
    open: '打开系统设置', refresh: '刷新', checking: '正在检查…', allowed: '已允许', denied: '未允许', unknown: '未能检查',
    opened: '系统设置已打开。更改权限后，请刷新。', other: '这台电脑不使用 macOS 权限设置。' },
};
let text = copy.en, generation = 0;
const message = result => result.content?.find(block => block.type === 'text')?.text || text.unknown;
function unavailable() { ui.accessibility.textContent = text.unknown; ui.screen.textContent = text.unknown; }
async function refresh() {
  const own = ++generation;
  ui.refresh.disabled = true; ui.notice.textContent = '';
  ui.accessibility.textContent = ui.screen.textContent = text.checking;
  try {
    const result = await gugu.callProgram('permissions_state', {});
    if (own !== generation) return;
    if (result.isError) {
      unavailable();
      const unsupported = result.structuredContent?.code === 'unsupported';
      ui.permissions.hidden = unsupported;
      ui.notice.textContent = unsupported ? text.other : message(result);
      return;
    }
    const state = result.structuredContent;
    if (typeof state?.accessibility !== 'boolean' || typeof state?.screen_recording !== 'boolean') throw new Error(text.unknown);
    ui.permissions.hidden = false;
    ui.accessibility.textContent = state.accessibility ? text.allowed : text.denied;
    ui.screen.textContent = state.screen_recording ? text.allowed : text.denied;
  } catch (error) {
    if (own === generation) { unavailable(); ui.notice.textContent = String(error); }
  } finally { if (own === generation) ui.refresh.disabled = false; }
}
for (const permission of ['accessibility', 'screen']) {
  $(permission + '-open').addEventListener('click', async event => {
    const own = generation;
    event.currentTarget.disabled = true;
    try {
      const result = await gugu.callProgram('open_system_settings', { permission });
      if (own === generation) ui.notice.textContent = result.isError ? message(result) : text.opened;
    } catch (error) { if (own === generation) ui.notice.textContent = String(error); }
    finally { $(permission + '-open').disabled = false; }
  });
}
ui.refresh.addEventListener('click', () => void refresh());
void startPageContext({ read: () => gugu.getContext(), subscribe: receive => gugu.onContextChanged(receive),
  accept(context) {
    text = String(context.locale).startsWith('zh') ? copy.zh : copy.en;
    ui.intro.textContent = text.intro;
    for (const permission of ['accessibility', 'screen']) {
      $(permission + '-title').textContent = text[permission];
      $(permission + '-open').textContent = text.open;
      $(permission + '-open').setAttribute('aria-label', `${text.open} · ${text[permission]}`);
    }
    ui.refresh.querySelector('span').textContent = text.refresh;
    void refresh();
  }, reject(error) { unavailable(); ui.notice.textContent = String(error); } });
