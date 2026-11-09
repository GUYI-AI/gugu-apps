import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLIENT_CONTRACT_COMMIT, clientContractUrl, loadClientContract } from './client-contract.mjs';

test('publication loads the exact client commit and executes its rules, without a local fallback', async () => {
  const requests = [];
  // Transport fixtures, not the rules: they prove which upstream functions the publisher executes, and that the
  // manifest schema runs with what it imports (its siblings, the workspace's packages, JSON) as the client builds it.
  const sources = {
    'app-platforms.ts': 'export function appPlatformProblems(manifest: { rejected?: boolean }): string[] { return manifest.rejected ? ["platform control refusal"] : []; }',
    'app-listing.ts': 'export const INSTRUCTIONS_MAX_CHARS = 3;\nexport function appListingProblems(input: { about: Record<string, string> }): string[] { return input.about.en ? [] : ["listing control refusal"]; }',
    'manifest.ts': [
      "import { INSTRUCTIONS_MAX_CHARS } from './app-listing';",
      "import { type Limits, limits } from '@gugu/core/shared/limits.mjs';",
      "import table from './table.json';",
      'class Refusal { constructor(public readonly issues: string[]) {} }',
      'export function safeParseExtensionManifest(raw: { instructions: string }) {',
      '  const l: Limits = limits;',
      '  if (raw.instructions.length > INSTRUCTIONS_MAX_CHARS) return { ok: false, issues: new Refusal([`instructions: ${table.too} ${l.unit}`]).issues };',
      '  return { ok: true };',
      '}',
    ].join('\n'),
  };
  const upstream = {
    ...Object.fromEntries(Object.entries(sources).map(([file, text]) => [clientContractUrl(file), text])),
    [clientContractUrl('table.json')]: '{ "too": "too long" }',
    [`https://raw.githubusercontent.com/GUYI-AI/gugu/${CLIENT_CONTRACT_COMMIT}/packages/core/src/shared/limits.mjs`]: 'export const limits = { unit: "characters" };',
  };
  const contract = await loadClientContract(async (url) => {
    requests.push(url);
    return url in upstream ? new Response(upstream[url]) : new Response('', { status: 404 });
  });
  assert.deepEqual(requests.slice(0, 3), ['app-platforms.ts', 'app-listing.ts', 'manifest.ts'].map(clientContractUrl));
  assert.equal(requests.length, 5, 'every module is fetched once');
  assert.equal(requests[0], `https://raw.githubusercontent.com/GUYI-AI/gugu/${CLIENT_CONTRACT_COMMIT}/apps/desktop/src/session/shared/extensions/app-platforms.ts`);
  assert.deepEqual(contract.appPlatformProblems({ rejected: true }), ['platform control refusal']);
  assert.deepEqual(contract.appListingProblems({ about: {} }), ['listing control refusal']);
  assert.deepEqual(contract.safeParseExtensionManifest({ instructions: 'four' }), { ok: false, issues: ['instructions: too long characters'] });
  assert.deepEqual(contract.safeParseExtensionManifest({ instructions: 'ok' }), { ok: true });
});

test('a client import we cannot resolve fails publication with what to add', async () => {
  const contract = (url) => url.endsWith('manifest.ts') ? "import { z } from 'not-a-package-here';\nexport function safeParseExtensionManifest() { return z; }"
    : url.endsWith('app-platforms.ts') ? 'export function appPlatformProblems() { return []; }' : 'export function appListingProblems() { return []; }';
  await assert.rejects(loadClientContract(async (url) => new Response(contract(url))), /imports not-a-package-here \(apps\/desktop\/src\/session\/shared\/extensions\/manifest\.ts\): add it to package\.json/);
});

test('an unavailable or incorrect pinned contract fails instead of allowing publication', async () => {
  await assert.rejects(loadClientContract(async () => new Response('', { status: 404 })), /HTTP 404/);
  await assert.rejects(loadClientContract(async () => new Response('export const unrelated = true;')), /no appPlatformProblems/);
  await assert.rejects(loadClientContract(async (url) => new Response(url.endsWith('app-platforms.ts') ? 'export function appPlatformProblems() { return []; }' : 'export const unrelated = true;')), /no appListingProblems \(app-listing.ts\)/);
  await assert.rejects(loadClientContract(async (url) => new Response(url.endsWith('manifest.ts') ? 'export const unrelated = true;' : url.endsWith('app-platforms.ts') ? 'export function appPlatformProblems() { return []; }' : 'export function appListingProblems() { return []; }')), /no safeParseExtensionManifest \(manifest.ts\)/);
});
