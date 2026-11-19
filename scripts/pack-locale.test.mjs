import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

test('packDir preserves published collation across system locales', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gugu-pack-locale-'));
  try {
    for (const name of ['中.txt', '阿.txt']) writeFileSync(join(dir, name), name);
    const script = `import {packDir,sha256} from ${JSON.stringify(new URL('./lib.mjs', import.meta.url).href)}; console.log(JSON.stringify({locale:Intl.Collator().resolvedOptions().locale,sha256:sha256(await packDir(process.argv[1]))}));`;
    const pack = (locale) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script, dir], {
      encoding: 'utf8', env: { ...process.env, LANG: locale, LC_ALL: locale },
    }));
    const english = pack('en_US.UTF-8');
    const chinese = pack('zh_CN.UTF-8');
    assert.notEqual(english.locale, chinese.locale);
    assert.equal(english.sha256, chinese.sha256);
  } finally {
    assert.ok(dir.startsWith(join(tmpdir(), 'gugu-pack-locale-')));
    console.log('removing fixture:', dir);
    rmSync(dir, { recursive: true, force: true });
  }
});
