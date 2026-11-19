// Register an already reviewed compiled directory committed to this public index repository.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fetchSource, rebuildVersion, sha256, validateApp } from './lib.mjs';
import { loadClientContract } from './client-contract.mjs';

const [id, version, commit, keyId] = process.argv.slice(2);
if (!id || !version || !commit || !keyId) throw new Error('Usage: node scripts/add-release.mjs <app-id> <version> <public-distribution-commit> <trusted-key-id>');
const record = { version, repo: 'GUYI-AI/gugu-apps', path: `releases/${id}/${version}`, commit, sha256: '0'.repeat(64), bytes: 1, yanked: null, release: { keyId } };
validateApp({ id, unlisted: false, deprecated: null, versions: [record] });
const source = fetchSource(record);
try {
  const bytes = readFileSync(join(source.dir, 'app.zip'));
  record.sha256 = sha256(bytes); record.bytes = bytes.length;
} finally { source.cleanup(); }
await rebuildVersion({ id }, record, await loadClientContract());
const path = join('apps', `${id}.json`);
const app = existsSync(path) ? validateApp(JSON.parse(readFileSync(path)), `${id}.json`) : { id, unlisted: false, deprecated: null, versions: [] };
if (app.versions.some((item) => item.version === version)) throw new Error('An existing version cannot be reused');
app.versions.push(record); validateApp(app, `${id}.json`);
writeFileSync(path, `${JSON.stringify(app, null, 2)}\n`);
console.log(`Registered compiled ${id}@${version}; submit the index change for non-author review.`);
