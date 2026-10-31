// 索引仓的共用件:读 / 校验 apps/*.json、照提交取源码、打包、从包里取市场要的东西。
// verify(PR 上)、sync(合并后)、add-version(作者本地)三处用的是这同一份 —— 尤其是打包器:
// 同一份源码必须打出同一份字节,sha256 才说得上话。
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';
import JSZip from 'jszip';

// 与咕咕客户端同值(apps/desktop/src/session/shared/extensions/market.ts):客户端装的时候还会再判一遍。
export const MAX_BUNDLE_BYTES = 25 * 1024 * 1024;
export const MAX_BUNDLE_ENTRIES = 2000;
export const BUNDLE_SKIP_NAMES = new Set(['.DS_Store', '.git', 'node_modules', '.gugu-market.json']);
// 与客户端 app-listing.ts 的 STORE_DIR 同名:源码顶层的这个目录是市场的产品页内容,❌ 进包(客户端打 .guguext 时也跳过它)。
export const STORE_DIR = 'store';
const MEDIA_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

// 本仓自己:代码就在这里(sources/)的 App 是 gugu 自己的。首启默认组(firstRun)只对它们生效 —— 咕咕客户端照这一个名字判,
// 这里的 verify 也照它判(客户端 apps/desktop/src/session/shared/extensions/first-run.ts 的 GUGU_APPS_REPO)。
export const INDEX_REPO = 'shuxueshuxue/gugu-apps';

const APP_ID = /^[a-z0-9][a-z0-9-]*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const ENGINES_RANGE = /^(>=|\^)(\d+\.\d+\.\d+)$/;

export function fail(message) {
  throw new Error(message);
}

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// ── apps/<id>.json ────────────────────────────────────────────────────────

function exactKeys(object, keys, where) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) fail(`${where}: 不是对象`);
  const extra = Object.keys(object).filter((key) => !keys.includes(key));
  const missing = keys.filter((key) => !(key in object));
  if (extra.length || missing.length) fail(`${where}: 字段对不上(多了 ${extra.join(', ') || '无'};少了 ${missing.join(', ') || '无'})`);
}

/** 一个 App 的记录。形状不对就抛,并说清是哪一处。 */
export function validateApp(app, fileName) {
  const where = fileName;
  // featured(官方精选,市场页顶上那一张)、firstRun(新用户第一次启动时装上的那一组)可写可不写;写了只能是 true / false。
  const { featured, firstRun, ...rest } = app;
  exactKeys(rest, ['id', 'unlisted', 'deprecated', 'versions'], where);
  if (featured !== undefined && typeof featured !== 'boolean') fail(`${where}: featured 是 true / false`);
  if (firstRun !== undefined && typeof firstRun !== 'boolean') fail(`${where}: firstRun 是 true / false`);
  if (!APP_ID.test(app.id)) fail(`${where}: id 只能是小写字母、数字、连字符`);
  if (fileName && fileName !== `${app.id}.json`) fail(`${where}: 文件名必须是 ${app.id}.json`);
  if (typeof app.unlisted !== 'boolean') fail(`${where}: unlisted 是 true / false`);
  if (app.deprecated !== null) {
    exactKeys(app.deprecated, ['note', 'replacedBy'], `${where} deprecated`);
    for (const key of ['note', 'replacedBy']) {
      if (app.deprecated[key] !== null && typeof app.deprecated[key] !== 'string') fail(`${where} deprecated.${key}: 字符串或 null`);
    }
  }
  if (!Array.isArray(app.versions) || app.versions.length === 0) fail(`${where}: versions 至少一版`);
  const seen = new Set();
  for (const version of app.versions) {
    const at = `${where} ${version?.version ?? '?'}`;
    exactKeys(version, ['version', 'repo', 'path', 'commit', 'sha256', 'bytes', 'yanked'], at);
    if (!SEMVER.test(version.version)) fail(`${at}: version 要是 x.y.z`);
    if (seen.has(version.version)) fail(`${at}: 同一个版本号写了两次`);
    seen.add(version.version);
    if (!REPO.test(version.repo)) fail(`${at}: repo 要是 GitHub 的 owner/name`);
    if (typeof version.path !== 'string' || version.path === '' || version.path.startsWith('/') || version.path.split('/').includes('..')) {
      fail(`${at}: path 是仓里的相对目录,仓根写 "."`);
    }
    if (!/^[0-9a-f]{40}$/.test(version.commit)) fail(`${at}: commit 要写完整 40 位`);
    if (!/^[0-9a-f]{64}$/.test(version.sha256)) fail(`${at}: sha256 要是 64 位小写十六进制`);
    if (!Number.isInteger(version.bytes) || version.bytes <= 0) fail(`${at}: bytes 是正整数`);
    if (version.yanked !== null) {
      exactKeys(version.yanked, ['reason'], `${at} yanked`);
      if (typeof version.yanked.reason !== 'string' || !version.yanked.reason.trim()) fail(`${at}: 撤回要写原因`);
    }
  }
  return app;
}

export function readApps(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => validateApp(JSON.parse(readFileSync(join(dir, name), 'utf8')), name));
}

/** 下载站上这一版的包:按 sha 命名,同一个名字永远是同一份字节。 */
export const bundleKey = (id, version) => `bundles/${id}/${version.version}-${version.sha256}.zip`;
export const metaKey = (id, version) => `meta/${id}/${version.version}.json`;

// ── 源码 ──────────────────────────────────────────────────────────────────

/**
 * 把 repo@commit 取到一个临时目录,回 { root, dir, cleanup }:dir 是那一版的 App 目录。
 * 这个提交必须在 repo 默认分支的历史里:GitHub 按 sha 也给同一 fork 网络里别人仓的提交,
 * 不核的话一个只在 fork 里的提交也会被当成「代码在 owner/repo」(复核 96 R5,10-08 实测 octocat/Hello-World 取得到)。
 * 有 GITHUB_TOKEN / GH_TOKEN 就带上(索引仓自己是私有的);公开仓不需要。
 * `GUGU_APPS_GIT_BASE` 只给测试换成本地仓,默认就是 GitHub。
 */
export function fetchSource(version) {
  const root = mkdtempSync(join(tmpdir(), 'gugu-apps-src-'));
  const cleanup = () => rmSync(root, { recursive: true, force: true });
  try {
    const base = process.env.GUGU_APPS_GIT_BASE ?? 'https://github.com/';
    const url = base.startsWith('https://') ? `${base}${version.repo}.git` : join(base, version.repo);
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const auth = token && url.startsWith('https://github.com/')
      ? ['-c', `http.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`]
      : [];
    const git = (...args) => execFileSync('git', [...auth, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q');
    git('remote', 'add', 'origin', url);
    // 只取提交(tree:0),文件在 checkout 时按需取;本地仓不认过滤就整份取,结果一样。
    git('fetch', '-q', '--filter=tree:0', 'origin', 'HEAD');
    const defaultTip = git('rev-parse', 'FETCH_HEAD').toString().trim();
    git('fetch', '-q', '--filter=tree:0', 'origin', version.commit);
    try {
      git('merge-base', '--is-ancestor', version.commit, defaultTip);
    } catch {
      fail(`${version.commit} 不在 ${version.repo} 默认分支的历史里(只在某个 fork 或别的分支上)`);
    }
    git('checkout', '-q', version.commit);
    const dir = resolve(root, version.path);
    if (dir !== root && !dir.startsWith(root + sep)) fail(`path 越出仓外: ${version.path}`);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(`${version.repo}@${version.commit} 里没有目录 ${version.path}`);
    return { root, dir, cleanup };
  } catch (error) {
    cleanup();
    throw new Error(`取不到 ${version.repo}@${version.commit}: ${error.stderr?.toString().trim() || error.message}`);
  }
}

// ── 打包 ──────────────────────────────────────────────────────────────────

/** 目录里的所有文件,相对路径升序 —— 顺序固定,同一份源码才会打出同一份字节。 */
function collectFiles(root) {
  const out = [];
  const walk = (dir) => {
    // Published bundles use the release runner's en-US collation, regardless of this machine's locale.
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en-US'))) {
      if (BUNDLE_SKIP_NAMES.has(entry.name) || (dir === root && entry.name === STORE_DIR)) continue;
      const full = join(dir, entry.name);
      // 符号链接不进包:包要自足。跟随它等于把链接指向的东西打进 App。
      if (entry.isSymbolicLink()) fail(`包里有符号链接,拒绝打包: ${relative(root, full)}`);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  walk(root);
  return out;
}

export async function packDir(dir) {
  const files = collectFiles(dir);
  if (files.length > MAX_BUNDLE_ENTRIES) fail(`包里文件太多:${files.length} > ${MAX_BUNDLE_ENTRIES}`);
  const zip = new JSZip();
  for (const file of files) {
    // 固定时间戳:zip 会把 mtime 写进去,不固定的话同一份源码每次打包 sha256 都不同。
    // createFolders: false —— jszip 默认替子目录补一条目录条目,而那一条的时间戳是「现在」(固定不了):
    // 带子目录的 App 隔两秒再打就是另一份字节(测试实撞)。不要目录条目,解包时按文件路径建目录。
    zip.file(relative(dir, file).split(sep).join('/'), readFileSync(file), { date: new Date(0), createFolders: false });
  }
  const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  if (bytes.byteLength > MAX_BUNDLE_BYTES) fail(`包超过 25 MiB: ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MiB`);
  return bytes;
}

// ── 包里的东西 ────────────────────────────────────────────────────────────

/** 包内相对路径 → 真实文件,并且必须真的在包里(❌ `..`、❌ 软链出去)。 */
function bundleFile(root, relativePath) {
  const full = resolve(root, relativePath);
  if (!full.startsWith(resolve(root) + sep)) fail(`路径越出包外: ${relativePath}`);
  if (!existsSync(full) || !statSync(full).isFile()) fail(`包里没有这个文件: ${relativePath}`);
  if (lstatSync(full).isSymbolicLink()) fail(`不能是符号链接: ${relativePath}`);
  return full;
}

/** 源码顶层 store/ 里的一个文件;没有就 null。 */
function storeFile(dir, name) {
  const full = join(dir, STORE_DIR, name);
  return existsSync(full) ? readFileSync(bundleFile(join(dir, STORE_DIR), name)) : null;
}

/**
 * 一版 App 目录里市场要的全部东西,并照钉住的客户端提交里的规矩(app-listing.ts、app-platforms.ts)判过:
 * 回 { manifest, apiVersion, minAppVersion, releaseNotes, icon, about, screenshots }。
 * releaseNotes = store/whats-new.md(这一版改了什么);about = { 语言: 文本 }(store/about.md 记在 defaultLocale 下);
 * icon / screenshots 的 key 是下载站 media/ 下按内容命名的地址。README.md、CHANGELOG.md 是仓库的,这里 ❌ 读。
 */
export function inspectAppDir(dir, id, version, contract) {
  const manifestPath = join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) fail('包里没有 manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.id !== id || manifest.version !== version) {
    fail(`manifest 写的是 ${manifest.id}@${manifest.version},索引里是 ${id}@${version}`);
  }
  if (!Number.isInteger(manifest.apiVersion)) fail('manifest.apiVersion 要是整数');
  const minAppVersion = ENGINES_RANGE.exec(manifest.engines?.gugu ?? '')?.[2];
  if (!minAppVersion) fail('manifest 缺 engines.gugu(例如 ">=0.2.40"):市场靠它替每台机器挑能装的版本');
  if (manifest.entry) bundleFile(dir, manifest.entry);
  for (const tab of manifest.contributes?.tabs ?? []) if (tab.hostPage !== 'settings') bundleFile(dir, tab.entry ?? manifest.entry ?? 'index.html');
  const about = {};
  const storeDir = join(dir, STORE_DIR);
  const storeNames = existsSync(storeDir) ? readdirSync(storeDir) : [];
  for (const name of storeNames) {
    const tag = /^about(?:\.([A-Za-z0-9-]+))?\.md$/.exec(name);
    if (tag) about[tag[1] ?? manifest.defaultLocale] = storeFile(dir, name).toString('utf8').trim();
  }
  const shotsDir = join(storeDir, 'screenshots');
  const screenshots = (existsSync(shotsDir) ? readdirSync(shotsDir).sort((a, b) => a.localeCompare(b, 'en-US')) : [])
    .map((name) => ({ name, bytes: readFileSync(bundleFile(shotsDir, name)) }));
  const whatsNew = storeFile(dir, 'whats-new.md')?.toString('utf8').trim() ?? null;
  const icon = manifest.icon ? readFileSync(bundleFile(dir, manifest.icon)) : null;
  const problems = [...contract.appListingProblems({ manifest, about, screenshots, whatsNew, icon }), ...contract.appPlatformProblems(manifest)];
  if (problems.length) fail(problems.join('; '));
  return {
    manifest,
    apiVersion: manifest.apiVersion,
    minAppVersion,
    releaseNotes: whatsNew,
    about,
    icon: icon ? { key: `media/${id}/${sha256(icon)}.png`, bytes: icon } : null,
    screenshots: screenshots.map(({ name, bytes }) => {
      const ext = extname(name).toLowerCase();
      return { key: `media/${id}/${sha256(bytes)}${ext}`, bytes, contentType: MEDIA_TYPES[ext] };
    }),
  };
}

/**
 * 照记录把这一版重新打一遍,核 sha256 与字节数;给了 `contract` 就再从源码目录里取市场要的东西,照它判过(新登记的版本)。
 * 已发布的版本只核字节:它们的 meta 早已写好、❌ 改写,新规矩只管新登记的。回 { bytes, inspected };对不上就抛,写出期望值与实际值。
 */
export async function rebuildVersion(app, version, contract = null) {
  const source = fetchSource(version);
  try {
    const bytes = await packDir(source.dir);
    const actual = { sha256: sha256(bytes), bytes: bytes.byteLength };
    if (actual.sha256 !== version.sha256 || actual.bytes !== version.bytes) {
      fail(
        `${app.id}@${version.version}: 照 ${version.repo}@${version.commit.slice(0, 12)} · ${version.path} 重打的包对不上 —— ` +
          `记录 sha256=${version.sha256} bytes=${version.bytes},实际 sha256=${actual.sha256} bytes=${actual.bytes}`
      );
    }
    return { bytes, inspected: contract ? inspectAppDir(source.dir, app.id, version.version, contract) : null };
  } finally {
    source.cleanup();
  }
}
