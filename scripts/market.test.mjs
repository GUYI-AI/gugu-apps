// node --test scripts/ —— 源码仓用本地 git 仓代替 GitHub(GUGU_APPS_GIT_BASE),下载站用内存里的假 OSS。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { CLIENT_CONTRACT_URL } from './app-platforms.mjs';
import { packDir, sha256 } from './lib.mjs';
import { INDEX_KEY, putObject, sync } from './sync.mjs';

const work = mkdtempSync(join(tmpdir(), 'gugu-apps-test-'));
const sources = join(work, 'sources');
const index = join(work, 'index');
const scripts = new URL('.', import.meta.url).pathname;
const contractTransport = join(work, 'client-contract-transport.mjs');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const PNG_1x1 = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');

/** 一个源码仓 owner/probe:App 目录 apps/probe,每次 commit 回 sha。 */
function commitProbe(version, extra = {}) {
  const dir = join(sources, 'owner', 'probe', 'apps', 'probe');
  mkdirSync(join(dir, 'shots'), { recursive: true });
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ apiVersion: 11, platforms: ['desktop'], id: 'probe', name: 'Probe', version, entry: 'index.html', icon: 'icon.png', engines: { gugu: '>=0.2.40' }, contributes: { tabs: [{ name: 'main', title: 'Main' }] }, ...extra }));
  writeFileSync(join(dir, 'index.html'), `<!doctype html><p>${version}</p>`);
  writeFileSync(join(dir, 'icon.png'), PNG_1x1);
  writeFileSync(join(dir, 'shots', 'main.png'), PNG_1x1);
  writeFileSync(join(dir, 'README.md'), '# Probe\n\n![main](shots/main.png)\n');
  writeFileSync(join(dir, 'CHANGELOG.md'), `## ${version}\n\n第 ${version} 版\n\n## 0.0.1\n\nold\n`);
  const repo = join(sources, 'owner', 'probe');
  git(repo, 'add', '-A');
  git(repo, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', version);
  return git(repo, 'rev-parse', 'HEAD');
}

async function recordFor(commit, version) {
  const dir = mkdtempSync(join(work, 'co-'));
  git(dir, 'init', '-q');
  git(dir, 'fetch', '-q', join(sources, 'owner', 'probe'), commit);
  git(dir, 'checkout', '-q', 'FETCH_HEAD');
  const bytes = await packDir(join(dir, 'apps', 'probe'));
  rmSync(dir, { recursive: true, force: true });
  return { version, repo: 'owner/probe', path: 'apps/probe', commit, sha256: sha256(bytes), bytes: bytes.byteLength, yanked: null };
}

function writeIndex(app) {
  writeFileSync(join(index, 'apps', `${app.id}.json`), `${JSON.stringify(app, null, 2)}\n`);
}
function commitIndex(message) {
  git(index, 'add', '-A');
  git(index, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', message);
  return git(index, 'rev-parse', 'HEAD');
}
function runScript(name, args) {
  try {
    const out = execFileSync('node', [join(scripts, name), ...args], {
      cwd: index,
      env: { ...process.env, GUGU_APPS_GIT_BASE: sources, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${pathToFileURL(contractTransport).href}`.trim() },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, out: out.toString() };
  } catch (error) {
    return { ok: false, out: `${error.stdout}${error.stderr}` };
  }
}
const verify = (base) => runScript('verify.mjs', base ? ['--base', base] : []);

/** 内存里的 OSS:只认 forbid-overwrite 与 ETag(=MD5)这两件 sync 依赖的事。 */
class FakeOss {
  objects = new Map();
  puts = [];
  requests = [];
  async put(key, bytes, { headers }) {
    this.requests.push(['PUT', key]);
    if (headers['x-oss-forbid-overwrite'] === 'true' && this.objects.has(key)) {
      throw Object.assign(new Error('exists'), { code: 'FileAlreadyExists', status: 409 });
    }
    this.puts.push(key);
    this.objects.set(key, Buffer.from(bytes));
  }
  async head(key) {
    this.requests.push(['HEAD', key]);
    if (!this.objects.has(key)) throw Object.assign(new Error('no'), { code: 'NoSuchKey', status: 404 });
    return { res: { headers: { etag: `"${createHash('md5').update(this.objects.get(key)).digest('hex').toUpperCase()}"` } } };
  }
  async get(key) {
    if (!this.objects.has(key)) throw Object.assign(new Error('no'), { code: 'NoSuchKey', status: 404 });
    return { content: this.objects.get(key) };
  }
}

let v1;
let v2;
before(async () => {
  // Fetch the pinned client source once. Every CLI process executes those exact bytes; there is no test capability table.
  const response = await fetch(CLIENT_CONTRACT_URL);
  assert.equal(response.ok, true, `pinned client contract: HTTP ${response.status}`);
  const source = await response.text();
  writeFileSync(contractTransport, `globalThis.fetch = async (url) => { if (String(url) !== ${JSON.stringify(CLIENT_CONTRACT_URL)}) throw new Error('unexpected contract URL'); return new Response(${JSON.stringify(source)}); };\n`);
  mkdirSync(join(sources, 'owner', 'probe'), { recursive: true });
  git(join(sources, 'owner', 'probe'), 'init', '-q');
  v1 = await recordFor(commitProbe('0.1.0', { apiVersion: 3, platforms: undefined }), '0.1.0');
  v2 = await recordFor(commitProbe('0.2.0'), '0.2.0');
  mkdirSync(join(index, 'apps'), { recursive: true });
  git(index, 'init', '-q');
  process.env.GUGU_APPS_GIT_BASE = sources;
});
after(() => rmSync(work, { recursive: true, force: true }));

test('打包可重复:隔几秒、换 mtime 再打(App 带子目录),sha256 不变', async () => {
  const dir = join(sources, 'owner', 'probe', 'apps', 'probe');
  const first = sha256(await packDir(dir));
  utimesSync(join(dir, 'index.html'), new Date(2001, 1, 1), new Date(2001, 1, 1));
  await new Promise((resolve) => setTimeout(resolve, 2100)); // zip 的时间精度是 2 秒
  assert.equal(sha256(await packDir(dir)), first);
});

test('verify:记录对得上就过;sha 错一位就红,并写出期望值与实际值', () => {
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [v1] });
  const base = commitIndex('probe 0.1.0');
  assert.equal(verify().ok, true);
  const wrong = { ...v2, sha256: v2.sha256.slice(0, -1) + (v2.sha256.endsWith('0') ? '1' : '0') };
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [v1, wrong] });
  const red = verify(base);
  assert.equal(red.ok, false);
  assert.match(red.out, new RegExp(`记录 sha256=${wrong.sha256}.*实际 sha256=${v2.sha256}`));
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [v1, v2] });
  assert.equal(verify(base).ok, true);
});

test('verify:上过线的版本改 commit / 删掉 / 收回撤回都红;只加 yanked 可以', () => {
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [{ ...v1, yanked: { reason: '坏了' } }] });
  const base = commitIndex('probe 0.1.0 yanked');
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [{ ...v1, commit: v2.commit, yanked: { reason: '坏了' } }] });
  assert.match(verify(base).out, /上过线的版本不可变/);
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [v2] });
  assert.match(verify(base).out, /上过线的版本不能删/);
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [v1] });
  assert.match(verify(base).out, /撤回不能收回/);
  writeIndex({ id: 'probe', unlisted: false, deprecated: null, versions: [{ ...v1, yanked: { reason: '坏了' } }, v2] });
  assert.equal(verify(base).ok, true);
  commitIndex('probe 0.2.0');
});

test('verify:提交不在源码仓默认分支的历史里(只在 fork / 别的分支上)就红;默认分支上的照常绿', async () => {
  const repo = join(sources, 'owner', 'probe');
  const main = git(repo, 'rev-parse', '--abbrev-ref', 'HEAD');
  git(repo, 'checkout', '-q', '-b', 'side');
  const sideOnly = await recordFor(commitProbe('0.3.0'), '0.3.0');
  git(repo, 'checkout', '-q', main);
  const app = JSON.parse(readFileSync(join(index, 'apps', 'probe.json'), 'utf8'));
  const base = git(index, 'rev-parse', 'HEAD');
  writeIndex({ ...app, versions: [...app.versions, sideOnly] });
  const red = verify(base);
  assert.equal(red.ok, false);
  assert.match(red.out, /不在 owner\/probe 默认分支的历史里/);
  writeIndex(app);
  assert.equal(verify(base).ok, true);
});

test('verify:description 的第一句在 <gugu_apps> 里会被截成半句就红(说出那一行和字数);写短了绿', async () => {
  const app = JSON.parse(readFileSync(join(index, 'apps', 'probe.json'), 'utf8'));
  const base = git(index, 'rev-parse', 'HEAD');
  // 「- Probe (probe): 」17 字 + 第一句 104 字 = 121:多一字。第二句再长也不算(只有第一句进那一行)。
  const long = await recordFor(commitProbe('0.4.0', { description: `${'a'.repeat(103)}. ${'b'.repeat(300)}.` }), '0.4.0');
  writeIndex({ ...app, versions: [...app.versions, long] });
  const red = verify(base);
  assert.equal(red.ok, false);
  assert.match(red.out, /description 的第一句太长:agent 在 <gugu_apps> 里读到的那一行有 121 字,超过 120/);
  const fits = await recordFor(commitProbe('0.4.1', { description: `${'a'.repeat(102)}. ${'b'.repeat(300)}.` }), '0.4.1');
  writeIndex({ ...app, versions: [...app.versions, fits] });
  assert.equal(verify(base).ok, true, '对照:120 字整,不截');
  writeIndex(app);
});

test('verify:subtitle(含 localized 里的)超过 30 字就红,说出是哪一处;没写 apiVersion 8 也红;30 字整绿', async () => {
  const app = JSON.parse(readFileSync(join(index, 'apps', 'probe.json'), 'utf8'));
  const base = git(index, 'rev-parse', 'HEAD');
  const old = await recordFor(commitProbe('0.4.9', { apiVersion: 7, subtitle: '一句话' }), '0.4.9');
  writeIndex({ ...app, versions: [...app.versions, old] });
  assert.match(verify(base).out, /写了 subtitle 就要 apiVersion 8/);
  const long = await recordFor(commitProbe('0.5.0', { apiVersion: 8, subtitle: '一'.repeat(30), localized: { en: { subtitle: 'x'.repeat(31) } } }), '0.5.0');
  writeIndex({ ...app, versions: [...app.versions, long] });
  const red = verify(base);
  assert.equal(red.ok, false);
  assert.match(red.out, /localized\.en\.subtitle 要是 1–30 字的一句话/);
  const fits = await recordFor(commitProbe('0.5.1', { subtitle: '一'.repeat(30), localized: { en: { subtitle: 'x'.repeat(30) } } }), '0.5.1');
  writeIndex({ ...app, versions: [...app.versions, fits] });
  assert.equal(verify(base).ok, true, '对照:30 字整');
  writeIndex(app);
});

test('verify:firstRun 标在代码不在本仓里的 App 上就红;不标绿', () => {
  const app = JSON.parse(readFileSync(join(index, 'apps', 'probe.json'), 'utf8'));
  const base = git(index, 'rev-parse', 'HEAD');
  writeIndex({ ...app, firstRun: true });
  const red = verify(base);
  assert.equal(red.ok, false);
  assert.match(red.out, /probe: firstRun 只能标在代码就在本仓\(shuxueshuxue\/gugu-apps\)里的 App 上;0\.1\.0 在 owner\/probe/);
  writeIndex(app);
  assert.equal(verify(base).ok, true);
});

test('publication: add-version and verify execute the same pinned platform rule; historical packages stay valid', async () => {
  const app = JSON.parse(readFileSync(join(index, 'apps', 'probe.json'), 'utf8'));
  const base = git(index, 'rev-parse', 'HEAD');
  const cases = [
    [{ platforms: undefined }, /declare desktop, phone, or both/],
    [{ apiVersion: 10 }, /requires apiVersion 11/],
    [{ platforms: ['phone'], permissions: { capabilities: ['notifications'] } }, /phone does not support notifications/],
    [{ platforms: ['phone'], permissions: { capabilities: ['agents:tools'] } }, null],
    [{ platforms: ['desktop'], permissions: { capabilities: ['notifications'] } }, null],
  ];
  try {
    for (const [i, [extra, refusal]] of cases.entries()) {
      const version = `0.6.${i}`;
      const record = await recordFor(commitProbe(version, extra), version);
      writeIndex({ ...app, versions: [...app.versions, record] });
      const checked = verify(base);
      writeIndex(app);
      const added = runScript('add-version.mjs', ['owner/probe', record.commit, 'apps/probe']);
      for (const result of [checked, added]) {
        assert.equal(result.ok, refusal === null, result.out);
        if (refusal) assert.match(result.out, refusal);
      }
      writeIndex(app);
    }
    assert.equal(verify(base).ok, true, 'the immutable API 3 package has no platforms and is still accepted as history');
  } finally {
    writeIndex(app);
  }
});

test('putObject:market/ 以外一律拒绝,一个字节都不写', async () => {
  const oss = new FakeOss();
  for (const key of ['releases/desktop/latest/latest-mac.yml', 'market/../releases/x', 'marketing/x']) {
    await assert.rejects(putObject(oss, key, Buffer.from('x'), 'text/plain'), /拒绝写 market\/ 以外/);
  }
  assert.equal(oss.puts.length, 0);
});

test('putObject:同名同字节算写过;同名不同字节报红,❌ 覆盖;只有 index.json 能覆盖', async () => {
  const oss = new FakeOss();
  assert.equal(await putObject(oss, 'market/bundles/a/1.zip', Buffer.from('one'), 'application/zip'), 'written');
  assert.equal(await putObject(oss, 'market/bundles/a/1.zip', Buffer.from('one'), 'application/zip'), 'same');
  await assert.rejects(putObject(oss, 'market/bundles/a/1.zip', Buffer.from('two'), 'application/zip'), /字节不同/);
  assert.equal(oss.objects.get('market/bundles/a/1.zip').toString(), 'one');
  await putObject(oss, INDEX_KEY, Buffer.from('{"apps":[]}'), 'application/json');
  await putObject(oss, INDEX_KEY, Buffer.from('{"apps":[1]}'), 'application/json');
  assert.equal(oss.objects.get(INDEX_KEY).toString(), '{"apps":[1]}');
});

test('putObject:已存在的共享图片先 HEAD 核 ETag,同字节跳过、不同字节拒绝,都不发 PUT', async () => {
  const oss = new FakeOss();
  const key = 'market/media/office/shared.jpg';
  oss.objects.set(key, Buffer.from('shared image'));
  assert.equal(await putObject(oss, key, Buffer.from('shared image'), 'image/jpeg'), 'same');
  await assert.rejects(putObject(oss, key, Buffer.from('changed image'), 'image/jpeg'), /字节不同/);
  assert.deepEqual(oss.requests, [['HEAD', key], ['HEAD', key]]);
  assert.equal(oss.objects.get(key).toString(), 'shared image');
});

test('putObject:HEAD 404 才 PUT;index.json 直接 PUT;dry-run 不访问 OSS', async () => {
  const oss = new FakeOss();
  const key = 'market/media/office/new.jpg';
  // HEAD 的 404 响应没有错误正文,不一定带 NoSuchKey。
  oss.head = async (name) => {
    oss.requests.push(['HEAD', name]);
    throw Object.assign(new Error('missing'), { status: 404 });
  };
  assert.equal(await putObject(oss, key, Buffer.from('new image'), 'image/jpeg'), 'written');
  assert.equal(await putObject(oss, INDEX_KEY, Buffer.from('{}'), 'application/json'), 'written');
  assert.equal(await putObject(oss, 'market/dry-run', Buffer.from('x'), 'text/plain', true), 'written');
  assert.deepEqual(oss.requests, [['HEAD', key], ['PUT', key], ['PUT', INDEX_KEY]]);
});

test('putObject:HEAD 后才被别人写入时,PUT 仍禁止覆盖,再核 ETag 判断同字节或冲突', async () => {
  for (const racedBytes of ['same', 'different']) {
    const oss = new FakeOss();
    const key = 'market/media/office/race.jpg';
    const head = oss.head.bind(oss);
    oss.head = async (name) => {
      try {
        return await head(name);
      } catch (error) {
        oss.objects.set(name, Buffer.from(racedBytes));
        throw error;
      }
    };
    const result = putObject(oss, key, Buffer.from('same'), 'image/jpeg');
    if (racedBytes === 'same') assert.equal(await result, 'same');
    else await assert.rejects(result, /字节不同/);
    assert.deepEqual(oss.requests, [['HEAD', key], ['PUT', key], ['HEAD', key]]);
    assert.equal(oss.objects.get(key).toString(), racedBytes);
    assert.deepEqual(oss.puts, []);
  }
});

test('putObject:HEAD 权限 / 网络错误直接报错,不 PUT、不重试', async () => {
  for (const error of [Object.assign(new Error('forbidden'), { status: 403 }), new Error('socket hang up')]) {
    const oss = new FakeOss();
    const key = 'market/media/office/shared.jpg';
    oss.head = async (name) => {
      oss.requests.push(['HEAD', name]);
      throw error;
    };
    await assert.rejects(putObject(oss, key, Buffer.from('image'), 'image/jpeg'), (actual) => actual === error);
    assert.deepEqual(oss.requests, [['HEAD', key]]);
  }
});

test('sync:写齐包 / 图标 / README 与图 / meta / index;重跑除 index 外 0 次写入;下架的不进 index', async () => {
  const appsDir = join(index, 'apps');
  const oss = new FakeOss();
  const quiet = () => {};
  const first = await sync({ client: oss, dir: appsDir, log: quiet });
  const keys = [...oss.objects.keys()].sort();
  assert.ok(keys.includes(`market/bundles/probe/0.2.0-${v2.sha256}.zip`));
  assert.ok(keys.some((key) => /^market\/media\/probe\/[0-9a-f]{64}\.png$/.test(key)));
  assert.ok(keys.some((key) => /^market\/media\/probe\/readme-[0-9a-f]{64}\.md$/.test(key)));
  assert.ok(keys.includes('market/meta/probe/0.1.0.json') && keys.includes(INDEX_KEY));
  const zip = oss.objects.get(`market/bundles/probe/0.2.0-${v2.sha256}.zip`);
  assert.equal(sha256(zip), v2.sha256);
  const readmeKey = keys.find((key) => key.includes('/readme-'));
  assert.match(oss.objects.get(readmeKey).toString(), /!\[main\]\(https:\/\/download\.gugu\.nextmind\.space\/market\/media\/probe\/[0-9a-f]{64}\.png\)/);
  assert.deepEqual(first.apps[0].versions.map((version) => [version.version, version.yanked]), [['0.1.0', { reason: '坏了' }], ['0.2.0', null]]);
  assert.equal(first.apps[0].versions[1].minAppVersion, '0.2.40');

  oss.puts = [];
  await sync({ client: oss, dir: appsDir, log: quiet });
  assert.deepEqual(oss.puts, [INDEX_KEY]);

  const app = JSON.parse(readFileSync(join(appsDir, 'probe.json'), 'utf8'));
  writeIndex({ ...app, unlisted: true });
  const unlisted = await sync({ client: oss, dir: appsDir, log: quiet });
  assert.deepEqual(unlisted.apps, []);
  assert.ok(oss.objects.has(`market/bundles/probe/0.2.0-${v2.sha256}.zip`), '下架不删文件');
  writeIndex(app);
});

test('sync:标了 firstRun 的在 index 里带 firstRun: true;没标 / 标 false 的不写这一键;写成别的值报红', async () => {
  const appsDir = join(index, 'apps');
  const oss = new FakeOss();
  const quiet = () => {};
  const app = JSON.parse(readFileSync(join(appsDir, 'probe.json'), 'utf8'));
  try {
    writeIndex({ ...app, firstRun: true });
    assert.equal((await sync({ client: oss, dir: appsDir, log: quiet })).apps[0].firstRun, true);
    writeIndex({ ...app, firstRun: false });
    assert.equal('firstRun' in (await sync({ client: oss, dir: appsDir, log: quiet })).apps[0], false);
    writeIndex(app);
    assert.equal('firstRun' in (await sync({ client: oss, dir: appsDir, log: quiet })).apps[0], false);
    writeIndex({ ...app, firstRun: 'yes' });
    await assert.rejects(sync({ client: oss, dir: appsDir, log: quiet }), /firstRun 是 true \/ false/);
  } finally {
    writeIndex(app);
  }
});

test('sync:标了 featured 的在 index 里带 featured: true;没标 / 标 false 的不写这一键;写成别的值报红', async () => {
  const appsDir = join(index, 'apps');
  const oss = new FakeOss();
  const quiet = () => {};
  const app = JSON.parse(readFileSync(join(appsDir, 'probe.json'), 'utf8'));
  try {
    writeIndex({ ...app, featured: true });
    assert.equal((await sync({ client: oss, dir: appsDir, log: quiet })).apps[0].featured, true);
    writeIndex({ ...app, featured: false });
    assert.equal('featured' in (await sync({ client: oss, dir: appsDir, log: quiet })).apps[0], false);
    writeIndex(app);
    assert.equal('featured' in (await sync({ client: oss, dir: appsDir, log: quiet })).apps[0], false);
    writeIndex({ ...app, featured: 'yes' });
    await assert.rejects(sync({ client: oss, dir: appsDir, log: quiet }), /featured 是 true \/ false/);
  } finally {
    writeIndex(app);
  }
});

test('sync:下载站上同名文件字节不同 → 报红,❌ 覆盖', async () => {
  const oss = new FakeOss();
  const key = `market/bundles/probe/0.1.0-${v1.sha256}.zip`;
  oss.objects.set(key, Buffer.from('somebody else'));
  await assert.rejects(sync({ client: oss, dir: join(index, 'apps'), log: () => {} }), /字节不同/);
  assert.equal(oss.objects.get(key).toString(), 'somebody else');
  assert.equal(oss.objects.has(INDEX_KEY), false);
});
