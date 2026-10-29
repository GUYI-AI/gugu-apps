import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const check = process.argv.includes('--check');
const files = [ ['core.mjs', 'program-core.mjs'], ['main.mjs', 'server.mjs'] ];
for (const [entry, target] of files) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(entry, import.meta.url))], platform: 'node', format: 'esm', target: 'node24', bundle: true, write: false,
    plugins: [{ name: 'app-runtime-siblings', setup(build) {
      build.onResolve({ filter: /(?:native-runtime|program-core)\.mjs$/ }, args => ({ path: './' + args.path.split('/').at(-1), external: true }));
    } }], banner: { js: 'import { createRequire as __cuRequire } from "node:module"; const require = __cuRequire(import.meta.url);' } });
  const url = new URL('../app/program/' + target, import.meta.url);
  if (check) { if (await readFile(url, 'utf8') !== result.outputFiles[0].text) throw new Error('Rebuild the Computer Use program.'); }
  else { await mkdir(new URL('../app/program/', import.meta.url), { recursive: true }); await writeFile(url, result.outputFiles[0].text); }
}
for (const [source, target] of [['../native/tool-specs.json', 'tool-specs.json'], ['../node_modules/@modelcontextprotocol/sdk/LICENSE', 'MCP-SDK-LICENSE'], ['../node_modules/pngjs/LICENSE', 'PNGJS-LICENSE']]) {
  const bytes = await readFile(new URL(source, import.meta.url));
  const url = new URL('../app/program/' + target, import.meta.url);
  if (check) { if (!(await readFile(url)).equals(bytes)) throw new Error('Rebuild the Computer Use program resources.'); }
  else await writeFile(url, bytes);
}
console.log('Computer Use MCP program matches source.');
