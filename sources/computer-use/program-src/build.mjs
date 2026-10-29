import { build } from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const check = process.argv.includes('--check');
const files = [ ['core.mjs', 'program-core.mjs'], ['main.mjs', 'server.mjs'] ];
const packages = new Map();
for (const [entry, target] of files) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(entry, import.meta.url))], platform: 'node', format: 'esm', target: 'node24', bundle: true, write: false, metafile: true,
    plugins: [{ name: 'app-runtime-siblings', setup(build) {
      build.onResolve({ filter: /(?:native-runtime|program-core)\.mjs$/ }, args => ({ path: './' + args.path.split('/').at(-1), external: true }));
    } }], banner: { js: 'import { createRequire as __cuRequire } from "node:module"; const require = __cuRequire(import.meta.url);' } });
  const url = new URL('../app/program/' + target, import.meta.url);
  if (check) { if (await readFile(url, 'utf8') !== result.outputFiles[0].text) throw new Error('Rebuild the Computer Use program.'); }
  else { await mkdir(new URL('../app/program/', import.meta.url), { recursive: true }); await writeFile(url, result.outputFiles[0].text); }
  // Read the packages actually bundled, including transitives; a new bundle dependency cannot silently lose its license.
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
}
for (const [source, target] of [['../native/tool-specs.json', 'tool-specs.json'], ['../node_modules/@modelcontextprotocol/sdk/LICENSE', 'MCP-SDK-LICENSE'], ['../node_modules/pngjs/LICENSE', 'PNGJS-LICENSE']]) {
  const bytes = await readFile(new URL(source, import.meta.url));
  const url = new URL('../app/program/' + target, import.meta.url);
  if (check) { if (!(await readFile(url)).equals(bytes)) throw new Error('Rebuild the Computer Use program resources.'); }
  else await writeFile(url, bytes);
}
let notices = 'Computer Use program bundled third-party notices\n';
for (const [name, { directory, manifest }] of [...packages].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
  const licenses = (await readdir(directory)).filter(name => /^(licen[cs]e|copying|notice)([._-].*)?$/i.test(name)).sort();
  if (!licenses.length) throw new Error(`No license text found for bundled dependency ${name}`);
  notices += `\n===== ${name} (${manifest.license ?? 'see license text'}) =====\n`;
  for (const license of licenses) notices += `\n--- ${license} ---\n${await readFile(path.join(directory, license), 'utf8')}\n`;
}
const noticeFile = new URL('../app/program/THIRD-PARTY-NOTICES.txt', import.meta.url);
if (check) { if (await readFile(noticeFile, 'utf8') !== notices) throw new Error('Rebuild the Computer Use third-party notices.'); }
else await writeFile(noticeFile, notices);
console.log('Computer Use MCP program matches source.');
