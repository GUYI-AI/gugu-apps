import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { packDir, rebuildVersion, sha256, validateApp } from './lib.mjs';
import { sync, INDEX_KEY } from './sync.mjs';
import { verifyReleaseSignature } from './release-contract.mjs';
import { inspectReleaseDirectory } from './release-directory.mjs';

const work = mkdtempSync(join(tmpdir(), 'compiled-release-'));
after(() => rmSync(work, { recursive: true, force: true }));
const commit = 'a'.repeat(40), id = 'release-fixture', version = '0.0.1';
const { privateKey, publicKey } = generateKeyPairSync('ed25519'); // Ephemeral fixture keys never leave memory.
const trust = [{ id: 'fixture', appId: id, sourceRepo: 'GUYI-AI/gugu-assistant', publicKey: publicKey.export({ type: 'spki', format: 'pem' }) }];
const contract = { appListingProblems: () => [], appPlatformProblems: () => [] };
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let n = 0;
async function fixture() {
  const root = join(work, `fixture-${n++}`), repo = join(root, 'GUYI-AI/gugu-apps');
  const path = `releases/${id}/${version}`, dir = join(repo, path);
  mkdirSync(join(dir, 'app/store'), { recursive: true });
  mkdirSync(join(dir, 'artifacts'));
  const items = {
    'app/manifest.json': Buffer.from(JSON.stringify({ id, version, apiVersion: 12, engines: { gugu: '>=0.2.40' }, entry: 'index.html' })),
    'app/index.html': Buffer.from('<!doctype html><p>Compiled release fixture</p>'),
    'app/LICENSE': Buffer.from('Fixture only.'), 'app/THIRD_PARTY_NOTICES.md': Buffer.from('Fixture only.'),
    'app/store/about.md': Buffer.from('Fixture listing.'), 'app/store/whats-new.md': Buffer.from('Fixture release.'),
    'artifacts/server-rules.json': Buffer.from('{"fixture":true}'),
  };
  for (const [name, content] of Object.entries(items)) writeFileSync(join(dir, name), content);
  items['app.zip'] = await packDir(join(dir, 'app')); writeFileSync(join(dir, 'app.zip'), items['app.zip']);
  const files = Object.entries(items).map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) }));
  const release = { schemaVersion: 1, appId: id, productId: id, version, keyId: 'fixture', source: { repo: 'GUYI-AI/gugu-assistant', commit },
    build: { repo: 'GUYI-AI/gugu-assistant', commit, workflow: '.github/workflows/release-candidate.yml', runId: '1', lockSha256: 'b'.repeat(64), node: 'v24.14.0' },
    review: { url: 'https://github.com/GUYI-AI/gugu-assistant/pull/1#pullrequestreview-1', author: 'author', reviewer: 'reviewer', commit },
    compatibility: { desktop: { min: '0.2.40', maxExclusive: '0.3.0' }, server: { min: '0.2.40', maxExclusive: '0.3.0' }, api: { min: 12, max: 30 }, data: { read: { min: 1, max: 1 }, write: { min: 1, max: 1 } } },
    rulesVersion: '1.0.0', artifacts: [{ role: 'app', ...files.find((file) => file.path === 'app.zip') },
      { role: 'server-rules', ...files.find((file) => file.path === 'artifacts/server-rules.json') }], files };
  const raw = Buffer.from(JSON.stringify(release)), signature = sign(null, raw, privateKey);
  writeFileSync(join(dir, 'release.json'), raw); writeFileSync(join(dir, 'release.sig'), signature);
  git(repo, 'init', '-q'); git(repo, 'add', '.'); git(repo, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Compiled fixture');
  const record = { version, repo: 'GUYI-AI/gugu-apps', path, commit: git(repo, 'rev-parse', 'HEAD'), sha256: sha256(items['app.zip']), bytes: items['app.zip'].length, yanked: null, release: { keyId: 'fixture' } };
  return { root, repo, dir, record, release, raw, signature, bytes: items['app.zip'] };
}
test('market reads only the public compiled directory and preserves original ZIP bytes', async () => {
  const f = await fixture(); process.env.GUGU_APPS_GIT_BASE = f.root;
  const result = await rebuildVersion({ id }, f.record, contract, { releaseKeys: trust });
  assert.deepEqual(result.bytes, f.bytes); assert.equal(result.release.source.commit, commit);
  assert.equal(result.inspected.manifest.id, id);
  await assert.rejects(rebuildVersion({ id }, f.record, contract), /untrusted/); // Empty production trust fails closed.
  assert.equal(validateApp({ id, unlisted: false, deprecated: null, versions: [f.record] }).versions[0].repo, 'GUYI-AI/gugu-apps');
});
test('mirror publishes exact package and proof before metadata; repeat changes only index', async () => {
  const f = await fixture(); process.env.GUGU_APPS_GIT_BASE = f.root;
  const app = { id, unlisted: false, deprecated: null, versions: [f.record] }, indexDir = join(f.root, 'apps');
  mkdirSync(indexDir); writeFileSync(join(indexDir, `${id}.json`), JSON.stringify(app));
  const objects = new Map(), writes = [];
  const missing = () => Object.assign(new Error('missing'), { status: 404 });
  const client = { get: async (key) => { if (!objects.has(key)) throw missing(); return { content: objects.get(key) }; },
    head: async (key) => { if (!objects.has(key)) throw missing(); return { res: { headers: { etag: createHash('md5').update(objects.get(key)).digest('hex') } } }; },
    put: async (key, bytes) => { writes.push(key); objects.set(key, Buffer.from(bytes)); } };
  const options = { client, dir: indexDir, log: () => {}, loadContract: async () => contract,
    rebuild: (app, version, contract) => rebuildVersion(app, version, contract, { releaseKeys: trust }) };
  const index = await sync(options), entry = index.apps[0].versions[0];
  assert.deepEqual(objects.get(`market/${entry.bundle}`), f.bytes);
  assert.deepEqual(objects.get(`market/${entry.release.manifest}`), f.raw);
  assert.deepEqual(objects.get(`market/${entry.release.signature}`), f.signature);
  const proofPrefix = `market/${entry.release.manifest}`.replace(/release\.json$/, '');
  assert.deepEqual(objects.get(`${proofPrefix}app.zip`), f.bytes);
  assert.deepEqual(objects.get(`${proofPrefix}artifacts/server-rules.json`), readFileSync(join(f.dir, 'artifacts/server-rules.json')));
  assert.ok(writes.indexOf(`market/${entry.release.signature}`) < writes.indexOf(`market/meta/${id}/${version}.json`));
  assert.equal(writes.at(-1), INDEX_KEY);
  writes.length = 0; await sync(options); assert.deepEqual(writes, [INDEX_KEY]);
});
test('changed signature/compatibility, unsigned file and changed app bytes reject import', async () => {
  const f = await fixture();
  const expected = { appId: id, version };
  assert.throws(() => verifyReleaseSignature(Buffer.from(f.raw.toString().replace('0.3.0', '0.4.0')), f.signature, 'fixture', trust, expected), /signature/);
  assert.throws(() => verifyReleaseSignature(f.raw, f.signature, 'fixture', [{ ...trust[0], revoked: true }], expected), /untrusted/);
  writeFileSync(join(f.dir, 'extra.txt'), 'unsigned');
  await assert.rejects(inspectReleaseDirectory(f.dir, { id }, f.record, trust, packDir, null, null), /unsigned/);
  rmSync(join(f.dir, 'extra.txt')); writeFileSync(join(f.dir, 'app/index.html'), 'tampered');
  await assert.rejects(inspectReleaseDirectory(f.dir, { id }, f.record, trust, packDir, null, null), /hash mismatch/);
});
test('only an omitted or boolean-false revoked flag authorizes a trusted key', async () => {
  const f = await fixture(), expected = { appId: id, version };
  for (const revoked of [true, 'true', 'false', 1, 0, null, {}, [], undefined]) {
    assert.throws(() => verifyReleaseSignature(f.raw, f.signature, 'fixture', [{ ...trust[0], revoked }], expected), /untrusted/);
  }
  assert.doesNotThrow(() => verifyReleaseSignature(f.raw, f.signature, 'fixture', [{ ...trust[0], revoked: false }], expected));
  assert.doesNotThrow(() => verifyReleaseSignature(f.raw, f.signature, 'fixture', trust, expected));
});
