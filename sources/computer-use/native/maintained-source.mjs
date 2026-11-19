import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function prepareMaintainedSource({ source, metadata, metadataDir }) {
  const git = args => execFileSync('git', args, { cwd: source, stdio: ['ignore', 'pipe', 'pipe'] });
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  if (git(['rev-parse', 'HEAD']).toString().trim() !== metadata.upstreamCommit) throw new Error(`Cua checkout must be exactly ${metadata.upstreamCommit}`);
  const patchPath = path.join(metadataDir, metadata.patch);
  const patch = fs.readFileSync(patchPath);
  if (sha(patch) !== metadata.patchSha256) throw new Error('Maintained source patch checksum mismatch');
  const diff = () => git(['diff', '--binary', '--full-index', 'HEAD']);
  if (diff().length === 0) {
    git(['apply', '--check', patchPath]);
    git(['apply', patchPath]);
  }
  // git apply leaves added modules untracked. Intent-to-add makes the *entire*
  // source patch participate in the same exact-diff check as modified files.
  for (const file of Object.keys(metadata.sourceHashes)) {
    try { git(['ls-files', '--error-unmatch', '--', file]); }
    catch { git(['add', '--intent-to-add', '--', file]); }
  }
  if (sha(diff()) !== metadata.patchSha256) throw new Error('Cua checkout contains changes other than the maintained patch');
  for (const [file, expected] of Object.entries(metadata.sourceHashes)) {
    if (sha(fs.readFileSync(path.join(source, file))) !== expected) throw new Error(`Source checksum mismatch: ${file}`);
  }
}
