// 每个自带测试的 App 跑它自己的测试:sources/<id>/package.json 里写了 scripts.test 的,在那个目录里 npm ci、npm test。
// 没写的(radar、day-calendar 这种一个目录就是整个 App 的)跳过。App 的 devDependencies 里有 playwright,说明它有真浏览器
// 的用例,先装 Chromium(CI 上连系统依赖一起装)。一个 App 红了照样跑完其余的,最后按红的个数退出。
//   node scripts/app-tests.mjs [<id>…]      不写 id = 全部
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sources = fileURLToPath(new URL('../sources/', import.meta.url));
const wanted = process.argv.slice(2);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const apps = readdirSync(sources, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && (wanted.length === 0 || wanted.includes(entry.name)))
  .map((entry) => entry.name)
  .sort();
for (const id of wanted) if (!apps.includes(id)) throw new Error(`sources/${id} 不存在`);

const failed = [];
let ran = 0;
for (const id of apps) {
  const dir = join(sources, id);
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) continue;
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  if (!pkg.scripts?.test) continue;
  ran += 1;
  console.log(`\n── ${id}: npm test ──`);
  try {
    const run = (command, args) => execFileSync(command, args, { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
    run(npm, ['ci', '--no-audit', '--no-fund']);
    if (pkg.devDependencies?.playwright) run(npx, ['playwright', 'install', ...(process.env.CI ? ['--with-deps'] : []), 'chromium']);
    run(npm, ['test']);
    console.log(`── ${id}: passed`);
  } catch (error) {
    failed.push(id);
    console.error(`── ${id}: FAILED (${error.status ?? error.message})`);
  }
}
console.log(`\n${ran} App(s) with their own tests; ${failed.length ? `failed: ${failed.join(', ')}` : 'all passed'}`);
process.exit(failed.length ? 1 : 0);
