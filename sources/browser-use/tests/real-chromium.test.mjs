import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createConnection } from '@playwright/mcp';
import { chromium as playwrightChromium } from 'playwright-core';
import { createBrowserUse } from '../program-src/core.mjs';
import { chromiumPages, connectChromium, withCall } from './support/cdp-lease.mjs';

/**
 * Opt-in: GUGU_TEST_CDP=http://127.0.0.1:<port> of a running Chromium. The program's real Playwright drives a real
 * page through a lease that enforces the host's call and maintenance rules.
 */
const endpoint = process.env.GUGU_TEST_CDP;

test('Playwright tools drive the leased page through the task call, and nothing else', { skip: !endpoint, timeout: 120_000 }, async () => {
  const chromium = await connectChromium(endpoint);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'browser-use-data-'));
  const workspace = await mkdtemp(path.join(tmpdir(), 'browser-use-work-'));
  const log = [];
  const browserUse = createBrowserUse({
    playwright: { createConnection, chromium: playwrightChromium },
    gugu: { pages: chromiumPages(chromium, log), withCall },
    dataDir, settings: { startUrl: 'about:blank' }, log: () => {},
  });
  let serial = 0;
  const call = (name, args = {}) => browserUse.callTool({ name, arguments: args,
    _meta: { 'gugu/sessionId': 'task-1', 'gugu/workspace': workspace, 'gugu/call': `call-${++serial}` } });
  const text = (result) => result.content.map((part) => part.text ?? '').join('\n');
  try {
    const page = 'data:text/html,' + encodeURIComponent('<title>Form</title><label>Name <input id=n></label><button onclick="document.title=\'Sent \'+n.value">Send</button><iframe srcdoc="<p>inside</p>"></iframe>');
    const navigated = await call('browser_navigate', { url: page });
    assert.equal(navigated.isError, undefined, text(navigated));
    const snapshot = await call('browser_snapshot');
    assert.match(text(snapshot), /Send/);
    const ref = /button "Send" \[ref=(\w+)\]/.exec(text(snapshot))?.[1];
    const field = /textbox "Name" \[ref=(\w+)\]/.exec(text(snapshot))?.[1];
    assert.ok(ref && field, text(snapshot));
    const typed = await call('browser_type', { target: field, element: 'Name', text: 'Ada' });
    assert.equal(typed.isError, undefined, text(typed));
    const clicked = await call('browser_click', { target: ref, element: 'Send' });
    assert.equal(clicked.isError, undefined, text(clicked));
    assert.match(text(await call('browser_snapshot')), /Sent Ada/);

    // Tools that reach beyond the one page are answered here; the person's page stays open.
    assert.equal((await call('browser_tabs', { action: 'list' })).isError, true);
    assert.match(text(await call('browser_close')), /nothing was closed/);
    assert.match(text(await call('browser_snapshot')), /Sent Ada/);

    // A file outside the task's working folder is refused before Playwright sees it.
    const outside = path.join(tmpdir(), 'browser-use-outside.txt');
    await writeFile(outside, 'x');
    assert.match(text(await call('browser_file_upload', { paths: [outside] })), /outside this task's working folder/);

    // Every command outside a call was maintenance; every action ran inside a call.
    assert.deepEqual(log.filter(([, , inCall]) => !inCall).filter(([channel]) => channel === 'send'), []);
    assert.ok(log.some(([channel]) => channel === 'maintain'));
    assert.equal(browserUse.browsers.size, 1);
  } finally {
    await browserUse.closeAll();
    chromium.close();
    await rm(dataDir, { recursive: true, force: true });
    await rm(workspace, { recursive: true, force: true });
  }
});
