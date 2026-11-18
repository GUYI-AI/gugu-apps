import { MotionPlayer } from './cursor.js';
const gugu = window.gugu, canvas = document.getElementById('cursor'), caption = document.getElementById('caption');
let player, clicked = '', current, version = 0, revision;
function render(context) {
  current = context.surface?.data;
  if (current?.revision !== revision) { player?.destroy(); player = null; clicked = ''; revision = current?.revision; }
  caption.hidden = !current?.action;
  caption.textContent = current?.action?.label ?? '';
  if (!current?.cursor) { canvas.style.visibility = 'hidden'; return; }
  player ??= new MotionPlayer(canvas);
  player.place({ x: current.cursor.x, y: current.cursor.y }); canvas.style.visibility = 'visible';
  if (current.cursor.click && clicked !== current.cursor.click) { clicked = current.cursor.click; player.click(); }
}
gugu.onContextChanged(context => { version++; render(context); });
const started = version;
void gugu.getContext().then(context => { if (started === version) render(context); }, () => { caption.hidden = true; canvas.style.visibility = 'hidden'; });
