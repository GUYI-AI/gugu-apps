import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const target = new URL('../app/program/native-runtime.mjs', import.meta.url);
const result = await build({
  entryPoints: [fileURLToPath(new URL('./index.ts', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', target: 'node24', write: false,
  banner: { js: '// Computer Use App native runtime. See native/PROVENANCE.md for migrated source and licenses.' },
});
const output = result.outputFiles[0].text;
const copies = [
  ['../native/PROVENANCE.md', '../app/program/PROVENANCE.md'],
  ['../native/driver/LICENSE.md', '../app/program/CUA-DRIVER-LICENSE.md'],
  ['../native/driver/THIRD_PARTY_NOTICES.md', '../app/program/CUA-DRIVER-THIRD-PARTY-NOTICES.md'],
];
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== output) throw new Error('Rebuild the App native runtime with node runtime/build.mjs.');
  for (const [source, target] of copies) if (!(await readFile(new URL(source, import.meta.url))).equals(await readFile(new URL(target, import.meta.url)))) throw new Error('Rebuild the App native runtime license/provenance files.');
} else {
  await mkdir(new URL('../app/program/', import.meta.url), { recursive: true });
  await writeFile(target, output);
  for (const [source, target] of copies) await writeFile(new URL(target, import.meta.url), await readFile(new URL(source, import.meta.url)));
}
console.log('Computer Use native runtime matches source.');
