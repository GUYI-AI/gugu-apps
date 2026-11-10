import { startPageContext } from './page-context.js';

const gugu = window.gugu;
const $ = selector => document.querySelector(selector);
const ui = { bar: $('.bar'), identity: $('.identity'), agent: $('.agent'), task: $('.task'), button: $('button'), label: $('.button-label'), stop: $('.stop-icon'), resume: $('.resume-icon') };
const mask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236 44"><path d="M0 44C6 44 10 40 10 33V17C10 7 18 2 30 2H116C128 2 138 5 147 9C153 12 160 12 169 12H203C217 12 226 19 226 30V33C226 41 229 44 236 44Z"/></svg>';
document.documentElement.style.setProperty('--control-mask', `url("data:image/svg+xml,${encodeURIComponent(mask)}")`);
let shown;

function render(context) {
  const view = context.surface?.data;
  if (!view || !Number.isSafeInteger(view.generation)) { ui.bar.hidden = true; shown = undefined; return; }
  const zh = String(context.locale).startsWith('zh');
  const agent = view.callerName?.trim() || (zh ? '助理' : 'Agent');
  const title = view.taskTitle?.trim() === agent ? '' : view.taskTitle?.trim() || '';
  const paused = view.state === 'paused';
  const action = paused ? 'resume' : 'stop';
  const button = zh ? paused ? '继续' : '停止' : paused ? 'Continue' : 'Stop';
  const description = zh ? `${agent}${title ? ' · ' + title : ''}${paused ? ' 已暂停' : ' 正在操作'}`
    : `${agent}${title ? ' · ' + title : ''}${paused ? ' is paused' : ' is operating'}`;
  document.documentElement.lang = zh ? 'zh-CN' : 'en';
  document.body.dataset.attachment = view.attachment || 'above';
  ui.bar.hidden = false; ui.bar.dataset.state = view.state; ui.bar.setAttribute('aria-label', description);
  ui.identity.dataset.task = String(Boolean(title)); ui.identity.title = description;
  ui.agent.textContent = agent; ui.agent.title = agent;
  ui.task.hidden = !title; ui.task.textContent = title; ui.task.title = title;
  ui.label.textContent = button; ui.button.setAttribute('aria-label', `${button} · ${agent}`);
  ui.stop.hidden = paused; ui.resume.hidden = !paused;
  shown = { generation: view.generation, action };
}
ui.button.addEventListener('click', async () => {
  if (!shown) return;
  try { await gugu.surfaces.post(shown); }
  catch (error) { ui.bar.setAttribute('aria-label', String(error)); }
});
void startPageContext({ read: () => gugu.getContext(), subscribe: receive => gugu.onContextChanged(receive),
  accept: render, reject: () => { ui.bar.hidden = true; } });
