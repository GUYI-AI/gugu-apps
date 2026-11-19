import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compiledFile, digest, RELEASE_LIMIT, releasePath, verifyReleaseSignature } from './release-contract.mjs';

export function directoryFiles(root) {
  const files = new Map();
  let total = 0;
  const walk = (relative = '') => {
    for (const name of readdirSync(join(root, relative)).sort()) {
      const path = releasePath(relative ? `${relative}/${name}` : name);
      const full = join(root, path), stat = lstatSync(full);
      if (stat.isSymbolicLink()) throw new Error('Release: symbolic links are forbidden');
      if (stat.isDirectory()) { walk(path); continue; }
      if (!stat.isFile() || stat.size > RELEASE_LIMIT || files.size >= 2002) throw new Error('Release: invalid file');
      total += stat.size;
      if (total > RELEASE_LIMIT + 512 * 1024) throw new Error('Release: directory exceeds size limit');
      files.set(path, readFileSync(full));
    }
  };
  if (!lstatSync(root).isDirectory()) throw new Error('Release: expected a directory');
  walk();
  return files;
}

export async function inspectReleaseDirectory(root, app, version, keys, packDir, inspectAppDir, contract) {
  const files = directoryFiles(root);
  const raw = files.get('release.json'), signature = files.get('release.sig');
  if (!raw || !signature) throw new Error('Release: missing release.json or release.sig');
  const release = verifyReleaseSignature(raw, signature, version.release.keyId, keys, { appId: app.id, version: version.version });
  const actualPaths = [...files.keys()].filter((path) => !['release.json', 'release.sig'].includes(path)).sort();
  if (JSON.stringify(actualPaths) !== JSON.stringify(release.files.map((file) => file.path).sort())) throw new Error('Release: unsigned or missing file');
  for (const item of release.files) {
    const bytes = files.get(item.path);
    if (bytes.length !== item.bytes || digest(bytes) !== item.sha256) throw new Error(`Release: hash mismatch for ${item.path}`);
    if (item.path !== 'app.zip') {
      if (!item.path.startsWith('app/') && !item.path.startsWith('artifacts/')) throw new Error('Release: unexpected top-level file');
      compiledFile(item.path, bytes);
    }
  }
  const bytes = files.get('app.zip');
  if (bytes.length !== version.bytes || digest(bytes) !== version.sha256
    || !(await packDir(join(root, 'app'))).equals(bytes)) throw new Error('Release: app.zip differs from the compiled directory or index');
  const manifest = JSON.parse(files.get('app/manifest.json'));
  const c = release.compatibility;
  if (!Number.isSafeInteger(manifest.apiVersion) || manifest.apiVersion < c.api.min || manifest.apiVersion > c.api.max
    || !['>=', '^'].some((prefix) => manifest.engines?.gugu === prefix + c.desktop.min)) throw new Error('Release: manifest compatibility differs from signed compatibility');
  const artifacts = release.artifacts.map((artifact) => ({ ...artifact, content: files.get(artifact.path) }));
  return { bytes, inspected: contract ? inspectAppDir(join(root, 'app'), app.id, version.version, contract) : null, release, raw, signature, artifacts };
}
