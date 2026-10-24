// The capability table and platform rule belong to the client. Import the exact pinned public source; no copied list.
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const pin = JSON.parse(readFileSync(new URL('../.github/gugu-app-contract.json', import.meta.url), 'utf8'));
export const CLIENT_CONTRACT_COMMIT = pin.commit;
const CONTRACT_PATH = 'apps/desktop/src/session/shared/extensions/app-platforms.ts';
export const CLIENT_CONTRACT_URL = `https://raw.githubusercontent.com/OpenDCAI/gugu/${CLIENT_CONTRACT_COMMIT}/${CONTRACT_PATH}`;

/** Node 24 strips this standalone module's types. It has no runtime imports or dependency on the renderer. */
export async function loadAppPlatformContract(request = fetch) {
  if (!/^[0-9a-f]{40}$/.test(CLIENT_CONTRACT_COMMIT)) throw new Error('The client App contract must pin a full commit SHA');
  const url = CLIENT_CONTRACT_URL;
  const response = await request(url);
  if (!response.ok) throw new Error(`Cannot read the pinned client App contract: HTTP ${response.status} (${url})`);
  const dir = mkdtempSync(join(tmpdir(), 'gugu-app-platforms-'));
  const file = join(dir, 'app-platforms.mts');
  try {
    writeFileSync(file, await response.text());
    const contract = await import(pathToFileURL(file).href);
    if (typeof contract.appPlatformProblems !== 'function') throw new Error('The pinned client App contract has no appPlatformProblems');
    return contract;
  } finally {
    // Only the one file created above, and then its empty directory; never recursively remove a shared temporary tree.
    try { unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    rmdirSync(dir);
  }
}

export function assertPublishedPlatforms(manifest, contract) {
  const problems = contract.appPlatformProblems(manifest);
  if (problems.length) throw new Error(`${manifest.id}@${manifest.version}: ${problems.join('; ')}`);
}
