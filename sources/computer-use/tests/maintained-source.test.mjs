import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareMaintainedSource } from '../native/maintained-source.mjs';

test('maintenance reproduction includes new modules and rejects subsequent drift', t => {
  const source = mkdtempSync(path.join(os.tmpdir(), 'cu-source-'));
  t.after(() => rmSync(source, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: source, stdio: ['ignore', 'pipe', 'pipe'] });
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  git(['init', '-q']); git(['config', 'user.name', 'Source test']); git(['config', 'user.email', 'source@example.invalid']);
  writeFileSync(path.join(source, 'existing.rs'), 'before\n'); git(['add', 'existing.rs']); git(['commit', '-qm', 'base']);
  const upstreamCommit = git(['rev-parse', 'HEAD']).toString().trim();
  writeFileSync(path.join(source, 'existing.rs'), 'after\n'); writeFileSync(path.join(source, 'added.rs'), 'new module\n'); git(['add', '-N', 'added.rs']);
  const patch = git(['diff', '--binary', '--full-index', 'HEAD']);
  const metadata = { upstreamCommit, patch: 'candidate.patch', patchSha256: sha(patch), sourceHashes: Object.fromEntries(['existing.rs', 'added.rs'].map(f => [f, sha(readFileSync(path.join(source, f)))])) };
  git(['reset', '--hard', '-q', 'HEAD']); rmSync(path.join(source, 'added.rs'), { force: true });
  writeFileSync(path.join(source, metadata.patch), patch);
  prepareMaintainedSource({ source, metadata, metadataDir: source });
  assert.equal(readFileSync(path.join(source, 'added.rs'), 'utf8'), 'new module\n');
  assert.doesNotThrow(() => prepareMaintainedSource({ source, metadata, metadataDir: source }));
  writeFileSync(path.join(source, 'added.rs'), 'unexpected code\n');
  assert.throws(() => prepareMaintainedSource({ source, metadata, metadataDir: source }), /changes other/);
});
