#!/usr/bin/env node
// Copies the PDF.js files the App ships — app/vendor/pdfjs/ — out of the pinned pdfjs-dist, byte for byte.
//
//   node vendor/build.mjs            (from sources/papers; needs npm and the network)
//   node vendor/build.mjs --check    (copies to a temp folder and fails if any file differs from the repo's)
//
// What goes in is pinned by package.json + package-lock.json beside this file (npm ci into a throwaway folder). PDF.js
// is prebuilt, so nothing is bundled: the legacy build is the one gugu's own preview uses (it runs on the phone's
// Chromium 113 WebView), and the page and the program (tools.js, in node) import the same pdf.min.mjs.
// The App's CSP has no 'wasm-unsafe-eval', so the .wasm decoders are left out; JPEG 2000 images use the JS fallback.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(here, '../app/vendor/pdfjs');
const check = process.argv.includes('--check');
const work = mkdtempSync(path.join(tmpdir(), 'papers-vendor-'));

/** Package path → path under app/vendor/pdfjs/. A folder copies every file in it. */
const FILES = [
  ['LICENSE', 'LICENSE'],
  ['legacy/build/pdf.min.mjs', 'pdf.min.mjs'],
  ['legacy/build/pdf.worker.min.mjs', 'pdf.worker.min.mjs'],
  ['cmaps', 'cmaps'],
  ['standard_fonts', 'standard_fonts'],
  ['wasm/openjpeg_nowasm_fallback.js', 'wasm/openjpeg_nowasm_fallback.js'],
  ['wasm/LICENSE_OPENJPEG', 'wasm/LICENSE_OPENJPEG'],
  ['wasm/LICENSE_PDFJS_OPENJPEG', 'wasm/LICENSE_PDFJS_OPENJPEG'],
];

const walk = (dir, base = '') =>
  readdirSync(path.join(dir, base), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(dir, path.join(base, e.name)) : [path.join(base, e.name)],
  );

try {
  for (const name of ['package.json', 'package-lock.json']) copyFileSync(path.join(here, name), path.join(work, name));
  execFileSync('npm', ['ci', '--ignore-scripts', '--omit=optional', '--no-audit', '--no-fund', '--silent'], { cwd: work, stdio: ['ignore', 'inherit', 'inherit'] });
  const pkg = path.join(work, 'node_modules/pdfjs-dist');
  const meta = JSON.parse(readFileSync(path.join(pkg, 'package.json'), 'utf8'));
  if (meta.license !== 'Apache-2.0') throw new Error(`pdfjs-dist ${meta.version} is ${meta.license}, not Apache-2.0`);
  const out = path.join(work, 'out');
  for (const [from, to] of FILES) {
    const files = statSync(path.join(pkg, from)).isDirectory() ? walk(path.join(pkg, from)) : [''];
    for (const f of files) {
      mkdirSync(path.dirname(path.join(out, to, f)), { recursive: true });
      copyFileSync(path.join(pkg, from, f), path.join(out, to, f));
    }
  }
  writeFileSync(path.join(out, 'VERSION'), `pdfjs-dist ${meta.version} (${meta.license}), from npm by vendor/build.mjs\n`);

  const built = walk(out).sort();
  if (check) {
    const have = walk(target).sort();
    const problems = [];
    for (const f of new Set([...built, ...have])) {
      if (!built.includes(f)) problems.push(`extra in app/vendor/pdfjs: ${f}`);
      else if (!have.includes(f)) problems.push(`missing from app/vendor/pdfjs: ${f}`);
      else if (!readFileSync(path.join(out, f)).equals(readFileSync(path.join(target, f)))) problems.push(`differs: ${f}`);
    }
    if (problems.length) throw new Error(`app/vendor/pdfjs is not what vendor/build.mjs builds:\n${problems.join('\n')}`);
    console.log(`app/vendor/pdfjs matches (${built.length} files)`);
  } else {
    rmSync(target, { recursive: true, force: true });
    for (const f of built) {
      mkdirSync(path.dirname(path.join(target, f)), { recursive: true });
      copyFileSync(path.join(out, f), path.join(target, f));
    }
    console.log(`wrote ${built.length} files to app/vendor/pdfjs`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
