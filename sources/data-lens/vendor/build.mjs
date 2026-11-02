#!/usr/bin/env node
// Rebuilds the libraries the Data Lens App bundles — sources/data-lens/app/vendor/ — from npm, byte for byte:
// one file per library (BUNDLES) and one LICENSES.txt for them all.
//
//   node vendor/build.mjs            (from sources/data-lens; needs npm and the network)
//   node vendor/build.mjs --check    (builds to a temp folder and fails if any file differs from the repo's)
//
// What goes in is pinned by package.json + package-lock.json beside this file (npm ci into a throwaway folder). Every
// package that ends up in a bundle must carry a permissive licence (licences.mjs, shared with 咕咕办公's gate).
//
// No WebAssembly: an App page's Content-Security-Policy has no 'wasm-unsafe-eval', so the page can only run JavaScript.
// sql.js ships an asm.js build of SQLite for exactly that — the same engine, compiled to plain JavaScript.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { packagesOf } from './licences.mjs';

/** Each library: the file in vendor/, and its entry — only what the App imports, so only that is bundled. */
const BUNDLES = [
  // SQLite, the one query engine: CSV and workbook sheets are loaded into an in-memory database, a .sqlite file is opened
  // as it is. Its Node branch (fs, path, crypto) never runs in a page; in tools.js the App gives it `require`.
  { file: 'sql.js', entry: "export { default as initSqlJs } from 'sql.js/dist/sql-asm.js';\n", external: ['node:fs', 'node:path', 'node:crypto', 'fs', 'path', 'crypto'] },
  // Reading .xlsx / .xls / .csv into rows.
  { file: 'xlsx.js', entry: "export { read, utils } from 'xlsx';\n" },
  // Charts: bar, line, dot, cell (heatmap), with its own tips on hover and tap.
  { file: 'plot.js', entry: "export * as Plot from '@observablehq/plot';\n" },
];

const here = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.resolve(here, '../app/vendor');
const check = process.argv.includes('--check');
const work = mkdtempSync(path.join(tmpdir(), 'data-lens-vendor-'));

try {
  for (const name of ['package.json', 'package-lock.json']) copyFileSync(path.join(here, name), path.join(work, name));
  execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--silent'], { cwd: work, stdio: ['ignore', 'inherit', 'inherit'] });
  const out = path.join(work, 'out');
  /** Package folder → the package and the bundles it is in. */
  const inBundles = new Map();
  for (const bundle of BUNDLES) {
    const entry = path.join(work, `entry-${bundle.file.replace(/\.js$/, '')}.mjs`);
    writeFileSync(entry, bundle.entry);
    const result = await build({
      absWorkingDir: work,
      entryPoints: [entry],
      outfile: path.join(out, bundle.file),
      bundle: true,
      platform: 'browser',
      format: 'esm',
      external: bundle.external ?? [],
      // The phone's WebView is Chromium 113 (Android 14 system image).
      target: 'chrome113',
      minify: true,
      legalComments: 'none',
      metafile: true,
      logLevel: 'warning',
    });
    const [bundled] = Object.entries(result.metafile.outputs).filter(([name]) => name.endsWith(bundle.file));
    if (!bundled) throw new Error(`esbuild wrote no ${bundle.file}: ${Object.keys(result.metafile.outputs).join(', ')}`);
    for (const p of packagesOf(work, Object.keys(bundled[1].inputs), path.join(here, 'notices'))) {
      const seen = inBundles.get(`${p.name}@${p.version}`) ?? { ...p, bundles: [] };
      seen.bundles.push(bundle.file);
      inBundles.set(`${p.name}@${p.version}`, seen);
    }
  }
  const notices = [...inBundles.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => `${p.name}@${p.version} — ${p.license} — in ${p.bundles.join(', ')}\n\n${p.text.trim()}\n`)
    .join(`\n${'='.repeat(78)}\n\n`);
  writeFileSync(path.join(out, 'LICENSES.txt'), `Bundled into vendor/ by sources/data-lens/vendor/build.mjs.\n\n${notices}`);

  const files = [...BUNDLES.map((b) => b.file), 'LICENSES.txt'];
  if (check) {
    let same = true;
    for (const name of files) {
      const theirs = path.join(vendorDir, name);
      const ok = existsSync(theirs) && readFileSync(path.join(out, name)).equals(readFileSync(theirs));
      console.log(`${name}: ${ok ? 'reproduced byte for byte' : 'DIFFERS from the one in the repo'}`);
      same &&= ok;
    }
    if (!same) process.exitCode = 1;
  } else {
    mkdirSync(vendorDir, { recursive: true });
    for (const name of files) copyFileSync(path.join(out, name), path.join(vendorDir, name));
    console.log(`vendor rebuilt: ${[...inBundles.values()].map((p) => `${p.name}@${p.version}`).join(', ')}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
