import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { until } from '../support/awaitCondition';
import officeCss from '../../app/style.css?raw';

/**
 * 咕咕办公's sheet ⓘ (xlsx-view.js infotip) in a real Chromium, with the page's own CSS: the browser's popover
 * (popover="auto" + popovertarget) that also opens on a mouse resting 150 ms. A click and that countdown must not
 * race: a click closing it while a hover still counts down would see it open again (review of 2ab5185db2). jsdom has
 * no popover and no real pointer, so the race cannot show there. The sheet: xlsx-sales-pending.xlsx (D3 a formula
 * with no stored result — the ⓘ has something to say).
 */

type View = { destroy(): void };
type XlsxView = { mountXlsx(host: HTMLElement, bytes: Uint8Array, options: { t: Record<string, string>; onPicks: () => void }): Promise<View | null> };
// @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
const xlsx = (await import('../../app/xlsx-view.js')) as XlsxView;
const t = {
  xlsxLocale: 'zh_CN', xlsxNoSheets: '没有工作表', unpick: '去掉这一处', xlsxAbout: '关于这张表',
  xlsxPending: '有 {n} 个公式还没算出结果，用 Excel 或 WPS 打开时会算。', xlsxNotDrawn: '这张表里有 {what} 没画出来。', xlsxCharts: '{n} 张图表', xlsxPictures: '{n} 张图片', xlsxAnd: '、',
};
let bytes: Uint8Array;
let mounted: { host: HTMLElement; view: View } | null = null;

beforeAll(async () => {
  // The default viewport (414 wide) would leave the ⓘ at the end of a 640-wide sheet outside it.
  await page.viewport(1000, 720);
  const style = document.createElement('style');
  style.textContent = officeCss;
  document.head.append(style);
  const url = new URL('../fixtures/xlsx-sales-pending.xlsx', import.meta.url);
  bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
});
afterEach(() => {
  vi.useRealTimers();
  mounted?.view.destroy();
  mounted?.host.remove();
  mounted = null;
});

async function mount() {
  const host = document.body.appendChild(document.createElement('div'));
  host.className = 'preview';
  // Absolute, not fixed: like the page's own panel it must not be a stacking context of its own, or it would hide the
  // very overlap the pick bar case is about (a fixed box keeps the sheet's layers under any bar).
  host.style.cssText = 'position: absolute; left: 0; top: 0; width: 640px; height: 480px;';
  const view = (await xlsx.mountXlsx(host, bytes, { t, onPicks: () => {} }))!;
  mounted = { host, view };
  const about = host.querySelector<HTMLButtonElement>('.xlsx-about')!;
  const text = host.querySelector<HTMLElement>('.xlsx-about-text')!;
  expect(about.hidden).toBe(false);
  expect(text.textContent).toBe('有 1 个公式还没算出结果，用 Excel 或 WPS 打开时会算。');
  return { about, open: () => text.matches(':popover-open'), text, flagged: () => text.dataset.open === '1' };
}

describe('咕咕办公 · the sheet ⓘ, a click and the hover countdown', () => {
  it('opens on a click, above the ⓘ; away and back, a click closes it — and the countdown that pointer started never reopens it', async () => {
    const { about, open, text, flagged } = await mount();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await userEvent.click(about);
    expect(open()).toBe(true);
    const bubble = text.getBoundingClientRect();
    const icon = about.getBoundingClientRect();
    expect(bubble.bottom).toBeLessThanOrEqual(icon.top);
    expect(Math.round(bubble.right)).toBe(Math.round(icon.right));
    await userEvent.unhover(about);
    // Back on the ⓘ: pointerenter starts the 150 ms countdown, the click closes it.
    await userEvent.click(about);
    expect(open()).toBe(false);
    await until('the page has taken the close in (toggle event)', () => !flagged());
    // Everything still counting down runs now; a countdown the click left would open it again.
    vi.advanceTimersByTime(1000);
    expect(open()).toBe(false);
  });

  // The A/B (10-14) drew the page's pick bar under the sheet's row numbers: the sheet's sticky layers (z-index up to 7)
  // stacked with the page's bar (5). The sheet keeps its layers to itself.
  it('the page\'s pick bar is drawn over the sheet, row numbers and all', async () => {
    await mount();
    // Without the bar, a row number is at that point (what the bar must cover).
    expect(document.elementFromPoint(12, 118)?.closest('.xlsx-rowhead')).toBeTruthy();
    const bar = document.body.appendChild(document.createElement('div'));
    bar.className = 'pick-bar on';
    bar.style.cssText = 'left: 4px; top: 100px; width: 220px; height: 36px; transition: none;';
    const hit = document.elementFromPoint(12, 118);
    bar.remove();
    expect(hit).toBe(bar);
  });

  it('opens on a resting mouse; a click keeps it; away and back, a click closes it — and the countdown never reopens it', async () => {
    const { about, open, flagged } = await mount();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await userEvent.hover(about);
    await until('the pointer is on the ⓘ', () => about.matches(':hover'));
    vi.advanceTimersByTime(149);
    expect(open()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(open()).toBe(true);
    await until('the page has taken the open in (toggle event)', flagged);
    await userEvent.click(about);
    await userEvent.unhover(about);
    expect(open()).toBe(true);
    await userEvent.click(about);
    expect(open()).toBe(false);
    await until('the page has taken the close in (toggle event)', () => !flagged());
    vi.advanceTimersByTime(1000);
    expect(open()).toBe(false);
  });
});
