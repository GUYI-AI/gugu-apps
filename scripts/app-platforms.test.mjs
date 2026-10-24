import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertPublishedPlatforms, CLIENT_CONTRACT_COMMIT, loadAppPlatformContract } from './app-platforms.mjs';

test('publication loads the exact client commit and executes its platform rule, without a local fallback', async () => {
  const requests = [];
  const contract = await loadAppPlatformContract(async (url) => {
    requests.push(url);
    // The transport fixture contains no capability table: it proves which upstream function the publisher executes.
    return new Response('export function appPlatformProblems(manifest: { rejected?: boolean }): string[] { return manifest.rejected ? ["platform control refusal"] : []; }');
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0], `https://raw.githubusercontent.com/OpenDCAI/gugu/${CLIENT_CONTRACT_COMMIT}/apps/desktop/src/session/shared/extensions/app-platforms.ts`);
  assert.doesNotThrow(() => assertPublishedPlatforms({ id: 'probe', version: '1.0.0' }, contract));
  assert.throws(() => assertPublishedPlatforms({ id: 'probe', version: '1.0.0', rejected: true }, contract), /probe@1.0.0: platform control refusal/);
});

test('an unavailable or incorrect pinned contract fails instead of allowing publication', async () => {
  await assert.rejects(loadAppPlatformContract(async () => new Response('', { status: 404 })), /HTTP 404/);
  await assert.rejects(loadAppPlatformContract(async () => new Response('export const unrelated = true;')), /no appPlatformProblems/);
});
