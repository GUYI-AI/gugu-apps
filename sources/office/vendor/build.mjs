#!/usr/bin/env node
// Rebuilds the libraries the 咕咕办公 App bundles — sources/office/app/skills/office/vendor/
// (in its skill's folder: the page and the skill's scripts both import them): one file
// per library (BUNDLES) and one LICENSES.txt for them all — from npm, byte for byte.
//
//   node vendor/build.mjs            (from sources/office; needs npm and the network)
//   node vendor/build.mjs --check    (builds to a temp folder and fails if any file differs from the repo's)
//
// What goes in is pinned by package.json + package-lock.json beside this file (npm ci into a throwaway folder), one set
// for every library. Every package that ends up in a bundle must carry a permissive licence (licences.mjs): one that is
// not — MPL, GPL, AGPL, none — stops the build, naming it, nested dependencies included. pptx-glimpse's PNG path
// (@resvg/resvg-wasm, MPL-2.0) is never imported, so it is never bundled; this gate is what says so every time.
//
// Another library (another kind of Office file): its package in package.json (npm install here updates the lock), and a
// line in BUNDLES — the file it becomes and what the App imports from it.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { packagesOf } from './licences.mjs';

/** Each library: the file in vendor/, and its entry — only what the App imports, so only that is bundled. */
const BUNDLES = [
  // Drawing only: the page draws each slide with convertPptxToSvg (the shapes, and where they sit, it reads itself with
  // pptx-read.js), and the skill's script (scripts/pptx.mjs apply / check) draws changed slides with it and reads its
  // diagnostics before a change is written.
  { file: 'pptx-glimpse.js', entry: "export { convertPptxToSvg } from 'pptx-glimpse';\n" },
  // A workbook's numbers as its number formats show them (#,##0.00, yyyy"年"m"月", [Red]…): the page draws cells with
  // it and the skill's script says what a cell shows (xlsx-read.js). The only library a workbook needs: the rest is read
  // by hand.
  { file: 'numfmt.js', entry: "export { format, formatColor, isDateFormat } from 'numfmt';\n" },
  // Calculating a workbook's formulas after an agent's edit (xlsx-calc.mjs, the script's side in node — the page never
  // loads it): IronCalc's engine, a WebAssembly file beside its glue (`assets`, copied from the package as it is).
  { file: 'ironcalc.js', entry: "export { initSync, Model } from '@ironcalc/wasm';\n", assets: [{ from: '@ironcalc/wasm/wasm_bg.wasm', file: 'ironcalc.wasm' }] },
];

const here = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.resolve(here, '../app/skills/office/vendor');
const check = process.argv.includes('--check');
const work = mkdtempSync(path.join(tmpdir(), 'office-vendor-'));

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
      // Paths in the bundle's comments are relative to this: the throwaway folder, so they read the same every build.
      absWorkingDir: work,
      entryPoints: [entry],
      outfile: path.join(out, bundle.file),
      bundle: true,
      platform: 'browser',
      format: 'esm',
      // The phone's WebView is Chromium 113 (Android 14 system image, measured 10-11).
      target: 'chrome113',
      minify: true,
      legalComments: 'none',
      metafile: true,
      logLevel: 'warning',
    });
    // Which packages are in it, and under what licence: refused unless every one is permissive.
    const [bundled] = Object.entries(result.metafile.outputs).filter(([name]) => name.endsWith(bundle.file));
    if (!bundled) throw new Error(`esbuild wrote no ${bundle.file}: ${Object.keys(result.metafile.outputs).join(', ')}`);
    for (const p of packagesOf(work, Object.keys(bundled[1].inputs), path.join(here, 'notices'))) {
      const seen = inBundles.get(`${p.name}@${p.version}`) ?? { ...p, bundles: [] };
      seen.bundles.push(bundle.file);
      inBundles.set(`${p.name}@${p.version}`, seen);
    }
    // A file the bundle loads at run time, as its package has it — under the package's licence, checked above.
    for (const asset of bundle.assets ?? []) copyFileSync(path.join(work, 'node_modules', asset.from), path.join(out, asset.file));
  }
  const notices = [...inBundles.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => `${p.name}@${p.version} — ${p.license} — in ${p.bundles.join(', ')}\n\n${p.text.trim()}\n`)
    .join(`\n${'='.repeat(78)}\n\n`);
  writeFileSync(path.join(out, 'LICENSES.txt'), `Bundled into vendor/ by sources/office/vendor/build.mjs.\n\n${notices}`);

  const files = [...BUNDLES.flatMap((b) => [b.file, ...(b.assets ?? []).map((a) => a.file)]), 'LICENSES.txt'];
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
    console.log(`vendor rebuilt: ${[...inBundles.values()].map((p) => p.name).join(', ')}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
