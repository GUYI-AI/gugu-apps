import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLIENT_CONTRACT_COMMIT, clientContractUrl, loadClientContract } from './client-contract.mjs';

test('publication loads the exact client commit and executes its rules, without a local fallback', async () => {
  const requests = [];
  const contract = await loadClientContract(async (url) => {
    requests.push(url);
    // Transport fixtures, not the rules: they prove which upstream functions the publisher executes.
    return new Response(url.endsWith('app-platforms.ts')
      ? 'export function appPlatformProblems(manifest: { rejected?: boolean }): string[] { return manifest.rejected ? ["platform control refusal"] : []; }'
      : 'export function appListingProblems(input: { about: Record<string, string> }): string[] { return input.about.en ? [] : ["listing control refusal"]; }');
  });
  assert.deepEqual(requests, ['app-platforms.ts', 'app-listing.ts'].map(clientContractUrl));
  assert.equal(requests[0], `https://raw.githubusercontent.com/OpenDCAI/gugu/${CLIENT_CONTRACT_COMMIT}/apps/desktop/src/session/shared/extensions/app-platforms.ts`);
  assert.deepEqual(contract.appPlatformProblems({ rejected: true }), ['platform control refusal']);
  assert.deepEqual(contract.appListingProblems({ about: {} }), ['listing control refusal']);
});

test('an unavailable or incorrect pinned contract fails instead of allowing publication', async () => {
  await assert.rejects(loadClientContract(async () => new Response('', { status: 404 })), /HTTP 404/);
  await assert.rejects(loadClientContract(async () => new Response('export const unrelated = true;')), /no appPlatformProblems/);
  await assert.rejects(loadClientContract(async (url) => new Response(url.endsWith('app-platforms.ts') ? 'export function appPlatformProblems() { return []; }' : 'export const unrelated = true;')), /no appListingProblems \(app-listing.ts\)/);
});
