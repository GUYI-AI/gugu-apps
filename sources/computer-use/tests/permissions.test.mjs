import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPermissionClient } from '../app/program/native-runtime.mjs';

const bundleDir = fileURLToPath(new URL('../app/program/native/', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
test('permission helper provenance matches the source and the bundled executable', async () => {
  const meta = JSON.parse(await readFile(path.join(bundleDir, 'permissions.json'), 'utf8'));
  assert.equal(meta.sourceSha256, sha(await readFile(new URL('../native/Permissions.swift', import.meta.url))));
  assert.equal(meta.sha256, sha(await readFile(path.join(bundleDir, 'mac-permissions'))));
  assert.equal(meta.signature, 'ad-hoc');
  assert.deepEqual(meta.architectures, ['arm64', 'x64']);
});
test('only the declared permission operations reach the bundled helper; a settings click grants nothing', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'computer-use-permissions-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const calls = [];
  const client = createPermissionClient({ bundleDir, dataDir, platform: 'darwin', arch: 'arm64', run: async (file, args, options) => {
    calls.push({ file, args, options });
    return { stdout: JSON.stringify({ ok: true, launchServicesAccepted: true, permissionGrantedByThisCall: false }) };
  } });
  const opened = await client.openSettings('accessibility'); assert.equal(opened.permissionGrantedByThisCall, false);
  assert.throws(() => client.openSettings('https://example.com'));
  assert.throws(() => client.openSettings('calendar'));
  await client.openSettings('screen');
  assert.deepEqual(calls.filter(call => call.args[0] !== '--verify').map(call => call.args), [['open', 'accessibility'], ['open', 'screen']]);
  assert.equal(calls.find(call => call.args[0] === 'open').options.env.GUGU_MCP_TOKEN, undefined);
});
test('damaged or mismatched permission helper cannot execute', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'computer-use-bad-helper-')); t.after(() => rm(root, { recursive: true, force: true }));
  await cp(bundleDir, root + '/bundle', { recursive: true });
  await writeFile(root + '/bundle/mac-permissions', 'damaged');
  let calls = 0;
  const client = createPermissionClient({ bundleDir: root + '/bundle', dataDir: root + '/data', platform: 'darwin', arch: 'arm64', run: async () => { calls++; return { stdout: '{}' }; } });
  await assert.rejects(client.openSettings('screen'), /integrity/); assert.equal(calls, 0);
  const unknown = createPermissionClient({ bundleDir, dataDir: root + '/data', platform: 'linux' });
  await assert.rejects(unknown.openSettings('screen'), /macOS system settings/);
});
test('the real macOS helper refuses old status and grant modes without opening anything', { skip: process.platform !== 'darwin' }, async () => {
  const execute = promisify(execFile);
  for (const mode of ['status', 'request']) {
    await assert.rejects(execute(path.join(bundleDir, 'mac-permissions'), [mode]), error => {
      assert.equal(error.code, 64);
      assert.deepEqual(JSON.parse(error.stdout), { ok: false, code: 'invalid_action' });
      return true;
    });
  }
});

test('the settings helper exposes no alternate permission status or grant API to pages', () => {
  const client = createPermissionClient({ bundleDir, dataDir: path.join(os.tmpdir(), 'cu-helper-api'), platform: 'darwin', arch: 'arm64' });
  assert.equal(client.status, undefined);
  assert.equal(client.requestFromPage, undefined);
  assert.deepEqual(Object.keys(client), ['openSettings']);
});
