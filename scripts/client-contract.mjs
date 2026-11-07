// The rules a published App is held to belong to the client: its platform table (app-platforms.ts), what a listing
// needs (app-listing.ts) and the schema every client parses a manifest with (manifest.ts) — a manifest it refuses
// takes the whole App out of its market. Import the exact pinned public sources and what they import; no copied rule
// lives here.
import { mkdirSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const pin = JSON.parse(readFileSync(new URL('../.github/gugu-app-contract.json', import.meta.url), 'utf8'));
export const CLIENT_CONTRACT_COMMIT = pin.commit;
const DIR = 'apps/desktop/src/session/shared/extensions';
/** Each module, by the function publication runs from it. */
const MODULES = { 'app-platforms.ts': 'appPlatformProblems', 'app-listing.ts': 'appListingProblems', 'manifest.ts': 'safeParseExtensionManifest' };
/** The client's workspace packages, by import prefix; any other bare import is a package of ours (package.json pins zod as the client's lockfile does). */
const WORKSPACE = { '@gugu/core/': 'packages/core/src/' };
const sourceUrl = (path) => `https://raw.githubusercontent.com/GUYI-AI/gugu/${CLIENT_CONTRACT_COMMIT}/${path}`;
export const clientContractUrl = (file) => sourceUrl(`${DIR}/${file}`);
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"]+)\2/g;

/** A client import, as the client's bundler resolves it: a file of the pinned tree, or a package of ours. */
function resolveImport(specifier, from) {
  const prefix = Object.keys(WORKSPACE).find((key) => specifier.startsWith(key));
  let path;
  if (prefix) path = WORKSPACE[prefix] + specifier.slice(prefix.length);
  else if (specifier.startsWith('.')) path = posix.join(posix.dirname(from), specifier);
  else {
    try { return { url: import.meta.resolve(specifier) }; } catch {
      throw new Error(`The pinned client App contract imports ${specifier} (${from}): add it to package.json at the client's version`);
    }
  }
  return { path: /\.(ts|mts|mjs|js|json)$/.test(path) ? path : `${path}.ts` };
}

/** Node 24 removes the types (and turns the few TypeScript-only constructs into JavaScript); none of these modules touches the renderer. */
export async function loadClientContract(request = fetch) {
  if (!/^[0-9a-f]{40}$/.test(CLIENT_CONTRACT_COMMIT)) throw new Error('The client App contract must pin a full commit SHA');
  const dir = mkdtempSync(join(tmpdir(), 'gugu-app-contract-'));
  const written = [];
  const outOf = (path) => join(dir, ...path.replace(/\.m?ts$/, '.mjs').split('/'));
  const loaded = new Set();
  async function load(path) {
    if (loaded.has(path)) return;
    loaded.add(path);
    const response = await request(sourceUrl(path));
    if (!response.ok) throw new Error(`Cannot read the pinned client App contract: HTTP ${response.status} (${sourceUrl(path)})`);
    let text = await response.text();
    const out = outOf(path);
    if (!path.endsWith('.json')) {
      if (/\.m?ts$/.test(path)) text = stripTypeScriptTypes(text, { mode: 'transform' });
      const imports = [];
      text = text.replace(SPECIFIER, (match, lead, quote, specifier, offset, whole) => {
        const target = resolveImport(specifier, path);
        if (target.url) return `${lead}${quote}${target.url}${quote}`;
        imports.push(target.path);
        const rel = relative(dirname(out), outOf(target.path)).split(sep).join('/');
        const json = target.path.endsWith('.json') && !/^\s*with\b/.test(whole.slice(offset + match.length));
        return `${lead}${quote}${rel.startsWith('.') ? rel : `./${rel}`}${quote}${json ? " with { type: 'json' }" : ''}`;
      });
      for (const target of imports) await load(target);
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);
    written.push(out);
  }
  try {
    for (const file of Object.keys(MODULES)) await load(`${DIR}/${file}`);
    const contract = {};
    for (const [file, required] of Object.entries(MODULES)) {
      const module = await import(pathToFileURL(outOf(`${DIR}/${file}`)).href);
      if (typeof module[required] !== 'function') throw new Error(`The pinned client App contract has no ${required} (${file})`);
      Object.assign(contract, module);
    }
    return contract;
  } finally {
    // Only the files written above, then their now empty directories; never recursively remove a shared temporary tree.
    for (const file of written) unlinkSync(file);
    const dirs = new Set();
    for (const file of written) for (let at = dirname(file); at.startsWith(dir) && at !== dir; at = dirname(at)) dirs.add(at);
    for (const at of [...dirs].sort((a, b) => b.length - a.length)) rmdirSync(at);
    rmdirSync(dir);
  }
}
