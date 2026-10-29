import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prepareDriver, unpackDriver, assertNativeArchitecture } from '../app/program/native-runtime.mjs';
import { mach, tar, zip } from './native-fixtures.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const release = (bytes, extra = {}) => ({ platform: 'darwin', arch: 'arm64', version: '0.36.0', revision: '0.36.0-gugu.1', url: 'https://example.invalid/pinned-driver', member: 'cua-driver', format: 'tar.gz', sha256: sha(bytes), ...extra });
test('pinned archives extract only their executable; links, traversal, duplicates and size limits refuse', () => {
  const bytes = mach();
  const good = tar([{ name: 'cua-driver', bytes }]);
  assert.deepEqual(unpackDriver(good, release(good)), bytes);
  for (const entries of [[{ name: '../cua-driver', bytes }], [{ name: 'cua-driver', bytes, type: '2' }], [{ name: 'cua-driver', bytes }, { name: 'cua-driver', bytes }]]) {
    const bad = tar(entries); assert.throws(() => unpackDriver(bad, release(bad)));
  }
  assert.throws(() => unpackDriver(good, release(good), 16));
  assert.throws(() => unpackDriver(good, { ...release(good), sha256: '0'.repeat(64) }), /integrity/);
  assert.throws(() => unpackDriver(good.subarray(0, good.length - 5), release(good)), /integrity/);
  const pax = (key, value) => {
    const body = ` ${key}=${value}\n`; let length = Buffer.byteLength(body) + 1;
    while (Buffer.byteLength(String(length) + body) !== length) length = Buffer.byteLength(String(length) + body);
    return Buffer.from(String(length) + body);
  };
  const metadata = tar([{ name: 'PaxHeader/cua-driver', type: 'x', bytes: pax('mtime', '123.456') }, { name: 'cua-driver', bytes }]);
  assert.deepEqual(unpackDriver(metadata, release(metadata)), bytes);
  for (const key of ['path', 'linkpath', 'size']) {
    const override = tar([{ name: 'PaxHeader/cua-driver', type: 'x', bytes: pax(key, '../outside') }, { name: 'cua-driver', bytes }]);
    assert.throws(() => unpackDriver(override, release(override)), /metadata/);
  }
  const compressed = zip('cua-driver.exe', bytes);
  assert.deepEqual(unpackDriver(compressed, release(compressed, { format: 'zip', member: 'cua-driver.exe' })), bytes);
  for (const bad of [zip('../cua-driver.exe', bytes), zip('cua-driver.exe', bytes, 0o120777), compressed.subarray(0, compressed.length - 5)]) {
    assert.throws(() => unpackDriver(bad, release(bad, { format: 'zip', member: 'cua-driver.exe' })));
  }
});
test('Mach-O and PE architecture mismatch is rejected before execution', () => {
  assert.doesNotThrow(() => assertNativeArchitecture(mach(), 'darwin', 'arm64'));
  assert.throws(() => assertNativeArchitecture(mach('x64'), 'darwin', 'arm64'), /architecture/);
  const bytes = Buffer.alloc(128); bytes.writeUInt32LE(64, 60); bytes.write('PE\0\0', 64); bytes.writeUInt16LE(0x8664, 68);
  assert.doesNotThrow(() => assertNativeArchitecture(bytes, 'win32', 'x64'));
  assert.throws(() => assertNativeArchitecture(bytes, 'win32', 'arm64'), /architecture/);
});
test('offline cache is verified, damaged executable is repaired, and missing execution bits are restored', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'computer-use-resource-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const archive = tar([{ name: 'cua-driver', bytes: mach() }]); const info = release(archive);
  let downloads = 0, verifications = 0;
  const options = { dataDir, platform: 'darwin', arch: 'arm64', releases: { 'darwin-arm64': info }, fetchArchive: async () => { downloads++; return archive; }, verify: async file => { verifications++; assert.deepEqual(await readFile(file), mach()); } };
  const first = await prepareDriver(options); assert.equal(downloads, 1);
  await writeFile(first.binary, 'corrupted'); await chmod(first.binary, 0o600);
  const second = await prepareDriver({ ...options, fetchArchive: async () => { throw new Error('offline'); } });
  assert.equal(second.binary, first.binary); assert.deepEqual(await readFile(second.binary), mach());
  assert.equal((await stat(second.binary)).mode & 0o777, 0o700); assert.equal(downloads, 1); assert.equal(verifications, 2);
});
test('bad archive, wrong architecture, failed signature and cancelled preparation never return an executable', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'computer-use-fail-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const archive = tar([{ name: 'cua-driver', bytes: mach('x64') }]);
  let executions = 0;
  const options = { dataDir, platform: 'darwin', arch: 'arm64', releases: { 'darwin-arm64': release(archive) }, fetchArchive: async () => archive, verify: async () => { executions++; } };
  await assert.rejects(prepareDriver(options), /architecture/); assert.equal(executions, 0);
  await assert.rejects(prepareDriver({ ...options, dataDir: dataDir + '/bad-sha', fetchArchive: async () => Buffer.from('wrong') }), /integrity/); assert.equal(executions, 0);
  const valid = tar([{ name: 'cua-driver', bytes: mach() }]);
  await assert.rejects(prepareDriver({ ...options, dataDir: dataDir + '/signature', releases: { 'darwin-arm64': release(valid) }, fetchArchive: async () => valid, verify: async () => { throw new Error('signature rejected'); } }), /signature/);
  const stop = new AbortController(); stop.abort(new Error('revoked'));
  await assert.rejects(prepareDriver({ ...options, signal: stop.signal }), /revoked/);
  await assert.rejects(prepareDriver({ ...options, dataDir: undefined }), /data directory/);
  await assert.rejects(prepareDriver({ ...options, platform: 'linux' }), /supported native/);
});

test('same-key preparation cancellation belongs to each subscriber, not the first caller', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'cu-prepare-shared-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const archive = tar([{ name: 'cua-driver', bytes: mach() }]);
  let downloading; const started = new Promise(resolve => { downloading = resolve; });
  let finish; const gate = new Promise(resolve => { finish = resolve; });
  let downloads = 0;
  const options = { dataDir, platform: 'darwin', arch: 'arm64', releases: { 'darwin-arm64': release(archive) }, verify: async () => {},
    fetchArchive: async (_url, { signal }) => {
      downloads++; downloading();
      await Promise.race([gate, new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))]);
      return archive;
    } };
  const a = new AbortController();
  const rejected = assert.rejects(prepareDriver({ ...options, signal: a.signal }), /A cancelled/);
  await started;
  const b = prepareDriver(options);
  const bOutcome = b.then(value => ({ value }), error => ({ error }));
  a.abort(new Error('A cancelled'));
  finish(); await rejected;
  const outcome = await bOutcome;
  assert.equal(outcome.error, undefined, 'B must not inherit A cancellation');
  assert(outcome.value.binary); assert.equal(downloads, 1);
});
test('a later subscriber cancels promptly while another subscriber completes preparation', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'cu-prepare-later-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const archive = tar([{ name: 'cua-driver', bytes: mach() }]);
  let downloading; const started = new Promise(resolve => { downloading = resolve; });
  let finish; const gate = new Promise(resolve => { finish = resolve; }); t.after(() => finish());
  const options = { dataDir, platform: 'darwin', arch: 'arm64', releases: { 'darwin-arm64': release(archive) }, verify: async () => {}, fetchArchive: async () => { downloading(); await gate; return archive; } };
  const b = prepareDriver(options); await started;
  const c = new AbortController();
  const cancelled = prepareDriver({ ...options, signal: c.signal }).then(() => 'resolved', () => 'cancelled');
  c.abort(new Error('C cancelled'));
  const result = await Promise.race([cancelled, new Promise(resolve => setTimeout(() => resolve('still waiting'), 250))]);
  finish(); await b;
  assert.equal(result, 'cancelled', 'C must not wait for B download');
});
test('mid-flight cancellation with no subscribers never verifies or executes a late archive', async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'cu-prepare-abandoned-')); t.after(() => rm(dataDir, { recursive: true, force: true }));
  const archive = tar([{ name: 'cua-driver', bytes: mach() }]);
  let downloading; const started = new Promise(resolve => { downloading = resolve; });
  let finish; const gate = new Promise(resolve => { finish = resolve; });
  let verifications = 0;
  const stop = new AbortController();
  const rejected = assert.rejects(prepareDriver({ dataDir, platform: 'darwin', arch: 'arm64', signal: stop.signal, releases: { 'darwin-arm64': release(archive) },
    fetchArchive: async () => { downloading(); await gate; return archive; }, verify: async () => { verifications++; } }), /mid-flight/);
  await started; stop.abort(new Error('mid-flight')); finish(); await rejected;
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(verifications, 0);
});
