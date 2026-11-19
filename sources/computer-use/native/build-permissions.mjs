import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') throw new Error('Build the macOS permission helper on macOS.');
const source = fileURLToPath(new URL('./Permissions.swift', import.meta.url));
const out = fileURLToPath(new URL('../app/program/native/', import.meta.url));
const temporary = mkdtempSync(path.join(os.tmpdir(), 'computer-use-permissions-'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(out, { recursive: true });
try {
  for (const arch of ['arm64', 'x86_64']) execFileSync('/usr/bin/xcrun', ['swiftc', '-O', '-target', `${arch}-apple-macos11.0`, source, '-o', path.join(temporary, arch)], { stdio: 'inherit' });
  const target = path.join(out, 'mac-permissions');
  execFileSync('/usr/bin/lipo', ['-create', path.join(temporary, 'arm64'), path.join(temporary, 'x86_64'), '-output', target], { stdio: 'inherit' });
  // Ad-hoc identity only. Do not borrow the owner's Developer ID or claim notarization.
  execFileSync('/usr/bin/codesign', ['--force', '--sign', '-', '--identifier', 'app.computer-use.permissions', target], { stdio: 'inherit' });
  execFileSync('/usr/bin/codesign', ['--verify', '--strict', target], { stdio: 'inherit' });
  writeFileSync(path.join(out, 'permissions.json'), JSON.stringify({ platform: 'darwin', architectures: ['arm64', 'x64'], sha256: sha(readFileSync(target)), sourceSha256: sha(readFileSync(source)), signature: 'ad-hoc', identity: 'app.computer-use.permissions' }, null, 2) + '\n');
} finally { rmSync(temporary, { recursive: true, force: true }); }
