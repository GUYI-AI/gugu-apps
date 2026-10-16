#!/usr/bin/env node
// Rebuilds the search program the preinstalled 全能搜索 App runs —
// sources/omnisearch/app/server/server.mjs — from upstream, byte for byte.
//
//   node server-build/build.mjs            (from sources/omnisearch; needs git, pnpm and the network)
//   node server-build/build.mjs --check    (builds to a temp file and fails if it differs from the one in the repo)
//
// Upstream: spences10/mcp-omnisearch (MIT) at UPSTREAM_SHA, plus upstream.patch (Firecrawl web search, Context7
// library_docs). The bundle is one ES module with no node_modules: launch.mjs starts it on gugu's own runtime.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const UPSTREAM = 'https://github.com/spences10/mcp-omnisearch.git';
const UPSTREAM_SHA = '42ba490a90d48fc02ff036268049d1202ceda504';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, '../app');
const check = process.argv.includes('--check');
const work = mkdtempSync(path.join(tmpdir(), 'omnisearch-server-'));
const run = (command, args, cwd = work) => execFileSync(command, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });

try {
  run('git', ['init', '--quiet']);
  run('git', ['fetch', '--quiet', '--depth', '1', UPSTREAM, UPSTREAM_SHA]);
  run('git', ['checkout', '--quiet', 'FETCH_HEAD']);
  run('git', ['apply', path.join(here, 'upstream.patch')]);
  run('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts', '--silent']);
  const outfile = check ? path.join(work, 'server.mjs') : path.join(appDir, 'server', 'server.mjs');
  await build({
    // Paths in the bundle's comments are relative to this: the throwaway checkout, so they read the same every build.
    absWorkingDir: work,
    entryPoints: [path.join(work, 'src', 'index.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    // Some bundled CommonJS still calls require(); an ES module has none of its own.
    banner: { js: 'import { createRequire as __gugu_cr } from "node:module"; const require = __gugu_cr(import.meta.url);' },
    logLevel: 'warning',
  });
  if (check) {
    const same = readFileSync(outfile).equals(readFileSync(path.join(appDir, 'server', 'server.mjs')));
    console.log(same ? 'server.mjs: reproduced byte for byte' : 'server.mjs: DIFFERS from the one in the repo');
    if (!same) process.exitCode = 1;
  } else {
    copyFileSync(path.join(work, 'LICENSE'), path.join(appDir, 'server', 'LICENSE'));
    console.log(`server.mjs rebuilt from ${UPSTREAM_SHA.slice(0, 7)} + upstream.patch`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
