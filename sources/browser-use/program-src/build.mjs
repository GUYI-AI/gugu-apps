import { build } from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * One esbuild bundle of the program with @playwright/mcp and playwright-core inside (an App ships no node_modules).
 * playwright-core finds itself at `__dirname/..`: the bundle sits in `app/program/lib/` next to its package.json and
 * browsers.json, exactly as in its own package. `--check` fails when the committed program is stale.
 */
const check = process.argv.includes('--check');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'app', 'program');
const modules = path.join(here, '..', 'node_modules');

const result = await build({
  entryPoints: [path.join(here, 'main.mjs')], platform: 'node', format: 'esm', target: 'node24', bundle: true, write: false, metafile: true,
  legalComments: 'none',
  // WebDriver BiDi is never used: this program only connects over CDP.
  external: ['chromium-bidi/*'],
  banner: { js: [
    'import { createRequire as __buRequire } from "node:module";',
    'import { fileURLToPath as __buPath } from "node:url";',
    'import { dirname as __buDir } from "node:path";',
    'const require = __buRequire(import.meta.url);',
    'const __filename = __buPath(import.meta.url);',
    'const __dirname = __buDir(__filename);',
  ].join(' ') },
});

const files = new Map([['lib/server.mjs', Buffer.from(result.outputFiles[0].text)]]);
const core = JSON.parse(await readFile(path.join(modules, 'playwright-core', 'package.json'), 'utf8'));
// playwright-core reads only these two files of its package at runtime.
files.set('package.json', Buffer.from(JSON.stringify({ name: core.name, version: core.version, license: core.license }, null, 2) + '\n'));
files.set('browsers.json', await readFile(path.join(modules, 'playwright-core', 'browsers.json')));

// Every package actually bundled, transitives included: a new dependency cannot silently lose its license.
const packages = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.replaceAll('\\', '/').includes('node_modules/')) continue;
  let directory = path.dirname(path.resolve(input));
  while (path.dirname(directory) !== directory) {
    try {
      const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
      if (manifest.name && manifest.version) { packages.set(`${manifest.name}@${manifest.version}`, { directory, manifest }); break; }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    directory = path.dirname(directory);
  }
}
let notices = 'Browser Use program bundled third-party notices\n';
for (const [name, { directory, manifest }] of [...packages].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
  const licenses = (await readdir(directory)).filter((file) => /^(licen[cs]e|copying|notice)([._-].*)?$/i.test(file)).sort();
  if (!licenses.length) throw new Error(`No license text found for bundled dependency ${name}`);
  notices += `\n===== ${name} (${manifest.license ?? 'see license text'}) =====\n`;
  for (const license of licenses) notices += `\n--- ${license} ---\n${await readFile(path.join(directory, license), 'utf8')}\n`;
}
files.set('THIRD-PARTY-NOTICES.txt', Buffer.from(notices));

for (const [name, bytes] of files) {
  const target = path.join(out, name);
  if (check) {
    const current = await readFile(target).catch(() => null);
    if (!current || !current.equals(bytes)) throw new Error(`Rebuild the Browser Use program (${name} is stale): npm run build:program`);
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
}
if (!check) console.log(`Browser Use program: ${(files.get('lib/server.mjs').length / 1024 / 1024).toFixed(1)} MiB, ${packages.size} bundled packages`);
