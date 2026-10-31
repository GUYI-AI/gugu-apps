// The rules a published App is held to belong to the client: its platform table (app-platforms.ts) and what a listing
// needs (app-listing.ts). Import the exact pinned public sources; no copied rule lives here.
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const pin = JSON.parse(readFileSync(new URL('../.github/gugu-app-contract.json', import.meta.url), 'utf8'));
export const CLIENT_CONTRACT_COMMIT = pin.commit;
const DIR = 'apps/desktop/src/session/shared/extensions';
/** Each module, by the function publication runs from it. */
const MODULES = { 'app-platforms.ts': 'appPlatformProblems', 'app-listing.ts': 'appListingProblems' };
export const clientContractUrl = (file) => `https://raw.githubusercontent.com/OpenDCAI/gugu/${CLIENT_CONTRACT_COMMIT}/${DIR}/${file}`;

/** Node 24 strips these standalone modules' types. They have no runtime imports and no dependency on the renderer. */
export async function loadClientContract(request = fetch) {
  if (!/^[0-9a-f]{40}$/.test(CLIENT_CONTRACT_COMMIT)) throw new Error('The client App contract must pin a full commit SHA');
  const contract = {};
  for (const [file, required] of Object.entries(MODULES)) {
    const url = clientContractUrl(file);
    const response = await request(url);
    if (!response.ok) throw new Error(`Cannot read the pinned client App contract: HTTP ${response.status} (${url})`);
    const dir = mkdtempSync(join(tmpdir(), 'gugu-app-contract-'));
    const path = join(dir, file.replace(/\.ts$/, '.mts'));
    try {
      writeFileSync(path, await response.text());
      const module = await import(pathToFileURL(path).href);
      if (typeof module[required] !== 'function') throw new Error(`The pinned client App contract has no ${required} (${file})`);
      Object.assign(contract, module);
    } finally {
      // Only the one file created above, and then its empty directory; never recursively remove a shared temporary tree.
      try { unlinkSync(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      rmdirSync(dir);
    }
  }
  return contract;
}
