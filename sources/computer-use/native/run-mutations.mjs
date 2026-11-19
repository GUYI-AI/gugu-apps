import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['native/check-boundaries.mjs'], { cwd: root, stdio: 'inherit' });
const mutations = [
  { name: 'remove in-flight revocation', file: 'control.ts', change: source => source.replace('for (const controllers of inFlight.values()) for (const controller of controllers) controller.abort(\'Computer Use App 已停止\')', ''), expected: 'FAIL revocation aborts' },
  { name: 'remove bound-task owner identity', file: 'tools.ts', change: source => source.replace("caller.agent + '\\0' + caller.session", 'caller.agent'), expected: 'FAIL two bound tasks' },
  { name: 'remove pinned archive checksum guards', file: 'driver-resources.mjs', change: source => source.replace(' || digest(bytes) !== release.sha256', '').replace('digest(bytes) !== release.sha256 || ', ''), expected: 'FAIL a well-formed foreign archive' },
];
for (const mutation of mutations) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'cu-native-mutant-'));
  try {
    const runtime = path.join(temporary, 'runtime'); await cp(path.join(root, 'runtime'), runtime, { recursive: true });
    const file = path.join(runtime, mutation.file), source = await readFile(file, 'utf8'), changed = mutation.change(source);
    if (source === changed) throw new Error('Mutation did not change its target.');
    await writeFile(file, changed);
    const output = path.join(temporary, 'runtime.mjs');
    await build({ entryPoints: [path.join(runtime, 'index.ts')], bundle: true, format: 'esm', platform: 'node', target: 'node24', outfile: output });
    const result = spawnSync(process.execPath, ['native/check-boundaries.mjs', output], { cwd: root, encoding: 'utf8' });
    const transcript = result.stdout + result.stderr;
    console.log(`MUTANT ${mutation.name}: exit ${result.status}`); process.stdout.write(transcript);
    if (result.status !== 1 || !transcript.includes(mutation.expected)) throw new Error('The expected positive case did not turn red.');
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
