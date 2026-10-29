// Opt-in real-driver verification. Captures only the window this script creates.
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createCuaClient, createPermissionClient, prepareDriver } from '../app/program/native-runtime.mjs';

if (process.platform !== 'darwin' || process.env.GUGU_TEST_NATIVE_MAC !== '1') throw new Error('Opt in to real macOS driver verification.');
for (const key of ['GUGU_HOME', 'GUGU_USER_DATA_DIR', 'GUGU_EXTENSION_DATA_DIR']) if (!path.isAbsolute(process.env[key] ?? '')) throw new Error(`Supply an isolated ${key}.`);
const dataDir = process.env.GUGU_EXTENSION_DATA_DIR;
const output = path.join(dataDir, 'verification'); await mkdir(output, { recursive: true });
const execute = promisify(execFile);
const binary = path.join(output, 'permission-window');
await execute('/usr/bin/xcrun', ['swiftc', fileURLToPath(new URL('./fixtures/PermissionWindow.swift', import.meta.url)), '-o', binary], { timeout: 60_000 });
const fixture = spawn(binary, [], { env: { ...process.env, GUGU_HOME: process.env.GUGU_HOME, GUGU_USER_DATA_DIR: process.env.GUGU_USER_DATA_DIR }, stdio: ['pipe', 'pipe', 'pipe'] });
const fixtureExit = new Promise(resolve => fixture.once('exit', resolve));
let cua;
try {
  await new Promise((resolve, reject) => {
    fixture.once('error', reject);
    fixture.stdout.once('data', resolve);
    fixture.once('exit', () => reject(new Error('The owned fixture did not open.')));
  });
  const driver = await prepareDriver({ dataDir });
  const log = { info(fields, message) { console.error(JSON.stringify({ message, fields })); }, warn(fields, message) { console.error(JSON.stringify({ message, fields })); } };
  const socket = path.join(os.tmpdir(), `cu-app-check-${process.pid}.sock`);
  cua = createCuaClient({ binary: driver.binary, missingMessage: 'driver missing', clientVersion: 'native-check', home: path.join(dataDir, 'verification-driver-home'), socketPath: socket, laneIdleMs: 1000, log });
  const helper = await createPermissionClient({ bundleDir: fileURLToPath(new URL('../app/program/native/', import.meta.url)), dataDir }).status();
  const native = await cua.callTool('check_permissions', { prompt: false }, { lane: 'verification', timeoutMs: 20_000 });
  const windows = await cua.callTool('list_windows', { pid: fixture.pid }, { lane: 'verification', timeoutMs: 20_000 });
  await writeFile(path.join(output, 'owned-windows.json'), JSON.stringify(windows, null, 2));
  function findWindow(value) {
    if (!value || typeof value !== 'object') return null;
    if (value.pid === fixture.pid && Number.isInteger(value.window_id)) return value;
    for (const nested of Object.values(value)) { const found = findWindow(nested); if (found) return found; }
    return null;
  }
  const window = findWindow(windows.structuredContent) ?? findWindow(JSON.parse(windows.content?.find(block => block.type === 'text')?.text ?? '{}'));
  assert(window, 'only a window belonging to the owned fixture may be captured');
  const capture = await cua.callTool('get_window_state', { pid: fixture.pid, window_id: window.window_id, include_screenshot: true, include_accessibility_tree: false }, { lane: 'verification', timeoutMs: 20_000 });
  const image = capture.content?.find(block => block.type === 'image' && ['image/png', 'image/jpeg'].includes(block.mimeType));
  const permissionBlocks = { ...native, content: native.content?.filter(block => block.type === 'text') };
  const report = { at: new Date().toISOString(), launchChain: 'SSH Node -> App-owned embedded driver; not the installed App MCP launch chain', fixturePid: fixture.pid, socket, driver, helper, native: permissionBlocks, capture: { isError: capture.isError === true, imageBytes: image?.data ? Buffer.from(image.data, 'base64').length : 0, state: capture.structuredContent, error: capture.isError ? capture.content : undefined }, promptsRequested: false };
  await writeFile(path.join(output, 'native-permissions.json'), JSON.stringify(report, null, 2));
  if (image?.data) await writeFile(path.join(output, image.mimeType === 'image/jpeg' ? 'owned-window.jpg' : 'owned-window.png'), Buffer.from(image.data, 'base64'));
  console.log(JSON.stringify(report));
  assert.notEqual(native.isError, true, 'driver permission check must succeed');
  assert.notEqual(capture.isError, true, 'driver must actually capture the owned window');
  assert(image?.data && Buffer.from(image.data, 'base64').length > 100, 'driver must return actual pixels, not only helper grants');
} finally {
  cua?.dispose();
  fixture.stdin.end();
  await fixtureExit;
}
