// Opt-in CLI/stdio integration. Uses synthetic host-shaped metadata, not an installed Gugu session.
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
if (process.platform !== 'darwin' || process.env.GUGU_TEST_NATIVE_MAC !== '1') throw new Error('Opt in to real macOS program verification.');
for (const key of ['GUGU_HOME', 'GUGU_USER_DATA_DIR', 'GUGU_EXTENSION_DATA_DIR']) if (!path.isAbsolute(process.env[key] ?? '')) throw new Error(`Supply an isolated ${key}.`);
const require = createRequire(process.env.GUGU_TEST_HOST_SDK_ROOT ? path.join(process.env.GUGU_TEST_HOST_SDK_ROOT, 'package.json') : import.meta.url);
const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href);
const sdkRoot = path.resolve(path.dirname(require.resolve('@modelcontextprotocol/sdk/client/index.js')), '../../..');
const clientVersion = JSON.parse(await readFile(path.join(sdkRoot, 'package.json'), 'utf8')).version;
const dataDir = process.env.GUGU_EXTENSION_DATA_DIR, output = path.join(dataDir, 'program-verification'); await mkdir(output, { recursive: true });
const fixtureFile = path.join(output, 'permission-window');
await promisify(execFile)('/usr/bin/xcrun', ['swiftc', fileURLToPath(new URL('./fixtures/PermissionWindow.swift', import.meta.url)), '-o', fixtureFile], { timeout: 60_000 });
const fixture = spawn(fixtureFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
const fixtureExit = new Promise(resolve => fixture.once('exit', resolve));
const client = new Client({ name: 'computer-program-verification', version: '1' });
let nativePid;
try {
  await new Promise((resolve, reject) => { fixture.once('error', reject); fixture.stdout.once('data', resolve); fixture.once('exit', () => reject(new Error('The fixture did not open.'))); });
  const app = fileURLToPath(new URL('../app/', import.meta.url));
  const keep = ['PATH', 'HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL'];
  const env = { ...Object.fromEntries(keep.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]])), GUGU_EXTENSION_ID: 'computer-use', GUGU_EXTENSION_DATA_DIR: dataDir, GUGU_HOME: process.env.GUGU_HOME, GUGU_USER_DATA_DIR: process.env.GUGU_USER_DATA_DIR };
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(app, 'program/server.mjs')], cwd: app, env, stderr: 'pipe' });
  transport.stderr?.on('data', chunk => process.stderr.write(chunk));
  const start = Date.now(); await client.connect(transport);
  const definitions = (await client.listTools()).tools;
  assert.equal(definitions.length, 27);
  const cold = Date.now();
  const permission = await client.callTool({ name: 'permissions_state', _meta: { 'gugu/caller': 'app' } });
  assert.notEqual(permission.isError, true);
  nativePid = permission.structuredContent.source.pid;
  const permissionRoundtripMs = Date.now() - cold;
  const _meta = { 'gugu/agent': 'user:33333333-3333-4333-8333-333333333333', 'gugu/sessionId': '11111111-1111-4111-8111-111111111111' };
  const windows = await client.callTool({ name: 'list_windows', arguments: { pid: fixture.pid }, _meta });
  function findWindow(value) {
    if (!value || typeof value !== 'object') return null;
    if (value.pid === fixture.pid && Number.isInteger(value.window_id)) return value;
    for (const nested of Object.values(value)) { const found = findWindow(nested); if (found) return found; }
    return null;
  }
  const window = findWindow(windows.structuredContent) ?? findWindow(JSON.parse(windows.content.find(block => block.type === 'text')?.text ?? '{}'));
  assert(window, 'capture must target the owned fixture');
  const capture = await client.callTool({ name: 'get_window_state', arguments: { pid: fixture.pid, window_id: window.window_id, include_screenshot: true, include_accessibility_tree: false }, _meta });
  assert.notEqual(capture.isError, true);
  const image = capture.content.find(block => block.type === 'image'); assert(image?.data);
  const report = { at: new Date().toISOString(), clientSdk: clientVersion, serverSdk: '1.32.2', toolCount: definitions.length, permissionRoundtripMs, initializationMs: cold - start, nativePid, fixturePid: fixture.pid,
    callerStamps: 'synthetic metadata on trusted stdio; this does not verify the installed Gugu gateway or independent TCC attribution', permission: permission.structuredContent,
    image: { bytes: Buffer.from(image.data, 'base64').length, mimeType: image.mimeType, width: capture.structuredContent.screenshot_width, height: capture.structuredContent.screenshot_height }, settingsOpened: false, promptsRequested: false };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(output, 'owned-window.png'), Buffer.from(image.data, 'base64'));
  console.log(JSON.stringify(report));
} finally {
  await client.close(); fixture.stdin.end(); await fixtureExit;
  if (nativePid) {
    const end = Date.now() + 2000;
    let alive = true;
    while (Date.now() < end) { try { process.kill(nativePid, 0); } catch { alive = false; break; } await new Promise(resolve => setTimeout(resolve, 25)); }
    assert.equal(alive, false, 'closing the program must terminate its owned native daemon');
  }
}
