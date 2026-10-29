import { spawnSync } from 'node:child_process';
import { cp, copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const root = fileURLToPath(new URL('../', import.meta.url));
const mutations = [
  { name: 'collapse the stamped task identity', change: text => text.replace("const session = meta['gugu/sessionId'];", "const session = '11111111-1111-4111-8111-111111111111';"), expected: 'FAIL program preserves the calling task' },
  { name: 'drop single-call cancellation', change: text => text.replace('const signal = extra.signal ? AbortSignal.any([lifetime.signal, extra.signal]) : lifetime.signal;', 'const signal = lifetime.signal;'), expected: 'FAIL program forwards the single call' },
  { name: 'skip native client disposal', change: text => text.replace('native.dispose();', ''), expected: 'FAIL program disposal terminates' },
];
for (const mutation of mutations) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'cu-program-mutant-'));
  try {
    const source = path.join(temporary, 'program-src'); await cp(path.join(root, 'program-src'), source, { recursive: true });
    const file = path.join(source, 'program.mjs'), before = await readFile(file, 'utf8'), after = mutation.change(before);
    if (before === after) throw new Error('Mutation did not change its target.'); await writeFile(file, after);
    const outfile = path.join(temporary, 'program-core.mjs');
    await copyFile(path.join(root, 'app/program/native-runtime.mjs'), path.join(temporary, 'native-runtime.mjs'));
    await build({ entryPoints: [path.join(source, 'core.mjs')], bundle: true, platform: 'node', format: 'esm', target: 'node24', outfile, nodePaths: [path.join(root, 'node_modules')],
      plugins: [{ name: 'native-sibling', setup(build) { build.onResolve({ filter: /native-runtime\.mjs$/ }, () => ({ path: './native-runtime.mjs', external: true })); } }],
      banner: { js: 'import { createRequire as __cuRequire } from "node:module"; const require = __cuRequire(import.meta.url);' } });
    const result = spawnSync(process.execPath, ['program-src/check-boundaries.mjs', outfile], { cwd: root, encoding: 'utf8', timeout: 10_000 });
    const output = result.stdout + result.stderr;
    console.log(`MUTANT ${mutation.name}: exit ${result.status}`); process.stdout.write(output);
    if (result.status !== 1 || !output.includes(mutation.expected)) throw new Error('The expected program boundary did not turn red.');
    if (mutation.name === 'drop single-call cancellation') {
      const sourceTest = await readFile(path.join(root, 'tests/program.test.mjs'), 'utf8');
      const boundedTest = path.join(temporary, 'bounded-cancellation.test.mjs');
      await writeFile(boundedTest, sourceTest.replace('../app/program/program-core.mjs', './program-core.mjs').replace('../app/program/native-runtime.mjs', './native-runtime.mjs'));
      const bounded = spawnSync(process.execPath, ['--test', '--test-name-pattern=single-call cancellation', boundedTest], { cwd: root, encoding: 'utf8', timeout: 6_000 });
      const said = bounded.stdout + bounded.stderr;
      console.log(`MUTANT cancellation test fails within its deadline: exit ${bounded.status}`);
      process.stdout.write(said);
      if (bounded.status !== 1 || !said.includes('The cancellation result did not arrive.')) throw new Error('The cancellation regression must fail explicitly instead of hanging.');
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
