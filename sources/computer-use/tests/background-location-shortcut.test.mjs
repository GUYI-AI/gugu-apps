import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComputerTools, TOOLS } from '../app/program/native-runtime.mjs';

const caller = { agent: 'user:agent-a', session: 'task-a' };
const browser = { pid: 44, name: 'Google Chrome', bundle_id: 'com.google.Chrome', running: true };
const xcode = { pid: 77, name: 'Xcode', bundle_id: 'com.apple.dt.Xcode', running: true };
const inputs = new Set(['hotkey', 'click', 'run_steps', 'bring_to_front']);
function fixture({ platform = 'darwin', inventory = [browser, xcode], readApps } = {}) {
  const calls = [];
  const tools = createComputerTools({ platform,
    protectedHost: () => ({ pids: new Set([10]), names: new Set(['gugu']) }),
    specs: TOOLS.map(tool => ({ name: tool.cua, input_schema: { type: 'object', properties: { session: { type: 'string' } } } })),
    cua: { async callTool(name, args, options) {
      calls.push({ name, args, options });
      if (name === 'check_permissions') return { structuredContent: { accessibility: true, screen_recording: true } };
      if (name === 'list_apps') return readApps ? readApps(options) : { structuredContent: { apps: inventory } };
      if (name === 'list_windows') {
        const selected = args.app ? inventory.filter(app => [app.name, app.bundle_id].some(value => value.toLowerCase().includes(args.app.toLowerCase()))) : inventory;
        return { structuredContent: { windows: selected.map(app => ({ pid: app.pid, window_id: app.pid + 1, title: app.name + ' window', app_name: app.name })) } };
      }
      if (name === 'get_window_state') return { structuredContent: { pid: args.pid, window_id: args.window_id, snapshot_id: 'shot' } };
      return { content: [], structuredContent: { ok: true } };
    } },
  });
  return { tools, calls, inputCalls: () => calls.filter(call => inputs.has(call.name)) };
}
async function refused(f, name, args) {
  const value = await f.tools.call(name, args, caller);
  assert.equal(value.structuredContent?.code, 'background_unavailable');
  assert.match(value.structuredContent.message, /Browser Use/);
  assert.match(value.structuredContent.message, /foreground/);
  assert.equal(f.inputCalls().length, 0, 'the entire call must refuse before native input');
  return value;
}

for (const keys of [['cmd', 'l'], ['command', 'L'], ['CMD', 'l'], ['meta', 'l'], ['super', 'l'], ['win', 'l'], ['cmd', 'command', 'l'], ['cmd', 'ignored', 'l']]) {
  test(`verified Chromium background ${keys.join('+')} refuses before dispatch`, async () => {
    const f = fixture();
    await refused(f, 'hotkey', { pid: 44, window_id: 45, keys });
    assert(f.calls.some(call => call.name === 'list_apps'), 'identity must come from the native process inventory');
  });
}
for (const bundle_id of ['com.google.Chrome.forTesting', 'org.chromium.Chromium', 'com.microsoft.edgemac.Beta', 'com.brave.Browser', 'com.vivaldi.Vivaldi', 'com.operasoftware.Opera', 'org.chromium.Thorium', 'company.thebrowser.Browser']) {
  test(`native Chromium identity ${bundle_id} does not depend on the displayed app name`, async () => {
    const f = fixture({ inventory: [{ ...browser, name: 'Not a browser name', bundle_id }] });
    await refused(f, 'hotkey', { pid: 44, keys: ['cmd', 'l'], app: 'Xcode' });
  });
}
test('the process bundle overrides agent-provided browser names and bundle claims', async () => {
  const f = fixture({ inventory: [{ ...xcode, name: 'Google Chrome' }] });
  const args = { pid: 77, app: 'Google Chrome', bundle_id: 'com.google.Chrome', keys: ['cmd', 'l'] };
  assert.notEqual((await f.tools.call('hotkey', args, caller)).isError, true);
  assert.deepEqual(f.inputCalls()[0].args, { ...args, session: f.inputCalls()[0].args.session });
});
test('app-name and element-token addressing use a native-verified process', async () => {
  const named = fixture();
  await refused(named, 'hotkey', { app: 'Google Chrome', keys: ['cmd', 'l'] });
  const token = fixture();
  await token.tools.call('get_window_state', { pid: 44, window_id: 45, include_screenshot: false }, caller);
  await refused(token, 'hotkey', { element_token: 'shot:1', keys: ['cmd', 'l'] });
});
test('pixel-addressed background location shortcuts cannot bypass admission', async () => {
  await refused(fixture(), 'hotkey', { pid: 44, window_id: 45, x: 80, y: 90, keys: ['cmd', 'l'], confirmed: true });
});
for (const shorthand of [false, true]) {
  test(`a later Chromium shortcut refuses the entire ${shorthand ? 'shorthand' : 'tool/args'} batch`, async () => {
    const f = fixture();
    const hotkey = { pid: 44, keys: ['command', 'l'] };
    await refused(f, 'run_steps', { steps: [{ click: { pid: 77 } }, shorthand ? { hotkey } : { tool: 'hotkey', args: hotkey }] });
  });
}
test('batch default targets, target changes and delivery overrides are checked before any step', async () => {
  for (const args of [
    { pid: 44, steps: [{ click: {} }, { hotkey: { keys: ['cmd', 'l'] } }] },
    { app: 'Google Chrome', steps: [{ click: {} }, { hotkey: { keys: ['cmd', 'l'] } }] },
    { pid: 77, steps: [{ click: { pid: 44 } }, { hotkey: { keys: ['cmd', 'l'] } }] },
    { pid: 77, steps: [{ click: { app: 'Google Chrome' } }, { hotkey: { keys: ['cmd', 'l'] } }] },
    { pid: 44, delivery_mode: 'foreground', confirmed: true, steps: [{ click: {} }, { hotkey: { keys: ['cmd', 'l'], delivery_mode: 'background' } }] },
    { pid: 44, foreground_fallback: true, confirmed: true, steps: [{ click: {} }, { hotkey: { keys: ['cmd', 'l'] } }] },
  ]) await refused(fixture(), 'run_steps', args);
});
test('a wait target participates in batch preflight without performing the preceding click', async () => {
  await refused(fixture(), 'run_steps', { pid: 77, steps: [{ click: {} }, { tool: 'hotkey', wait_for: { app: 'Google Chrome' }, args: { keys: ['cmd', 'l'] } }] });
});
test('actionless expect target changes are included in the complete batch preflight', async () => {
  await refused(fixture(), 'run_steps', { pid: 77, steps: [{ click: {} }, { expect: [{ app: 'Google Chrome' }] }, { hotkey: { keys: ['cmd', 'l'] } }] });
});
test('a non-Chromium batch target override is not classified from the batch default', async () => {
  const f = fixture();
  assert.notEqual((await f.tools.call('run_steps', { pid: 44, steps: [{ hotkey: { pid: 77, keys: ['cmd', 'l'] } }] }, caller)).isError, true);
  assert.equal(f.inputCalls().length, 1);
});
test('verified non-Chromium Cmd+L and nonmatching shortcuts retain native dispatch', async () => {
  const f = fixture();
  for (const args of [{ pid: 77, keys: ['cmd', 'l'] }, { pid: 44, keys: ['cmd', 'shift', 'l'] }, { pid: 44, keys: ['cmd', 'd'] }]) {
    assert.notEqual((await f.tools.call('hotkey', args, caller)).isError, true);
  }
  assert.equal(f.inputCalls().length, 3);
});
test('foreground delivery, bring_to_front and unrelated input do not acquire the new identity probe', async () => {
  const f = fixture();
  for (const [name, args] of [
    ['hotkey', { pid: 44, keys: ['cmd', 'l'], delivery_mode: 'foreground', confirmed: true }],
    ['bring_to_front', { pid: 44, confirmed: true }],
    ['click', { pid: 44 }],
    ['run_steps', { pid: 44, delivery_mode: 'foreground', confirmed: true, steps: [{ hotkey: { keys: ['cmd', 'l'] } }] }],
  ]) assert.notEqual((await f.tools.call(name, args, caller)).isError, true);
  assert.equal(f.calls.filter(call => call.name === 'list_apps').length, 0);
  assert.equal(f.inputCalls().length, 4);
});
test('other platforms keep their existing shortcut behavior', async () => {
  const f = fixture({ platform: 'win32' });
  assert.notEqual((await f.tools.call('hotkey', { pid: 44, keys: ['cmd', 'l'] }, caller)).isError, true);
  assert.equal(f.calls.filter(call => call.name === 'list_apps').length, 0);
});
test('native identity is refreshed for each matching call instead of trusting a cached PID', async () => {
  let bundle_id = 'com.apple.dt.Xcode';
  const f = fixture({ readApps: async () => ({ structuredContent: { apps: [{ ...browser, bundle_id }] } }) });
  assert.notEqual((await f.tools.call('hotkey', { pid: 44, keys: ['cmd', 'l'] }, caller)).isError, true);
  bundle_id = 'com.google.Chrome';
  f.calls.length = 0;
  await refused(f, 'hotkey', { pid: 44, keys: ['cmd', 'l'] });
});
test('failed or missing native identity cannot let a matching shortcut reach input', async () => {
  for (const readApps of [async () => ({ isError: true }), async () => { throw Error('inventory unavailable'); }, async () => ({ structuredContent: { apps: [] } }), async () => ({ structuredContent: { apps: [{ pid: 44, name: 'Google Chrome' }] } })]) {
    const f = fixture({ readApps });
    const result = await f.tools.call('hotkey', { pid: 44, keys: ['cmd', 'l'] }, caller);
    assert.equal(result.isError, true);
    assert.equal(f.inputCalls().length, 0);
  }
});
test('conflicting native bundle identities for one PID cannot authorize a shortcut', async () => {
  const f = fixture({ inventory: [browser, { ...xcode, pid: browser.pid }] });
  assert.equal((await f.tools.call('hotkey', { pid: 44, keys: ['cmd', 'l'] }, caller)).isError, true);
  assert.equal(f.inputCalls().length, 0);
});
