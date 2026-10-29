import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
    return { stdout: JSON.stringify(args[0] === 'open' ? { ok: true, launchServicesAccepted: true, permissionGrantedByThisCall: false } : { ok: true, permissions: { accessibility: false, screen: false }, missing: ['accessibility', 'screen'], promptRequested: args[0] === 'request' }) };
  } });
  const status = await client.status(); assert.equal(status.promptRequested, false);
  const opened = await client.openSettings('accessibility'); assert.equal(opened.permissionGrantedByThisCall, false);
  assert.throws(() => client.openSettings('https://example.com'));
  assert.throws(() => client.openSettings('calendar'));
  assert.deepEqual(calls.filter(call => call.args[0] !== '--verify').map(call => call.args), [['status'], ['open', 'accessibility']]);
  assert.equal(calls.find(call => call.args[0] === 'status').options.env.GUGU_MCP_TOKEN, undefined);
  const request = await client.requestFromPage(); assert.equal(request.promptRequested, true);
});
test('damaged or mismatched permission helper cannot execute', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'computer-use-bad-helper-')); t.after(() => rm(root, { recursive: true, force: true }));
  await cp(bundleDir, root + '/bundle', { recursive: true });
  await writeFile(root + '/bundle/mac-permissions', 'damaged');
  let calls = 0;
  const client = createPermissionClient({ bundleDir: root + '/bundle', dataDir: root + '/data', platform: 'darwin', arch: 'arm64', run: async () => { calls++; return { stdout: '{}' }; } });
  await assert.rejects(client.status(), /integrity/); assert.equal(calls, 0);
  const unknown = createPermissionClient({ bundleDir, dataDir: root + '/data', platform: 'linux' });
  await assert.rejects(unknown.status(), /macOS permission/);
});
test('real macOS helper status reads both permissions without requesting either', { skip: process.platform !== 'darwin' }, async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'computer-use-real-permissions-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const value = await createPermissionClient({ bundleDir, dataDir }).status();
  assert.equal(value.promptRequested, false);
  assert.equal(typeof value.permissions.accessibility, 'boolean'); assert.equal(typeof value.permissions.screen, 'boolean');
  assert.deepEqual(value.missing, ['accessibility', 'screen'].filter(key => !value.permissions[key]));
  assert(value.authorizationScope.includes('not proof'));
});
