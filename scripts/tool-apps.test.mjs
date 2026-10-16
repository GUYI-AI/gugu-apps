import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { inspectAppDir, packDir } from './lib.mjs';

test('API 5 tool Apps package and inspect without HTML; HTML entry checks still reject broken pages', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gugu-tool-market-'));
  const raw = { id: 'tools', name: 'Tools', version: '0.1.0', apiVersion: 5, engines: { gugu: '>=0.2.56' },
    permissions: { capabilities: ['agents:tools'] }, contributes: { mcpServers: [{ name: 'browser-use', host: 'browser-use' }] } };
  const manifest = (patch = {}) => writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ ...raw, ...patch }));
  try {
    writeFileSync(join(dir, 'CHANGELOG.md'), '## 0.1.0\n\nFirst release.');
    manifest();
    assert.equal(inspectAppDir(dir, 'tools', '0.1.0', '').apiVersion, 5);
    assert.ok((await packDir(dir)).length > 0);
    manifest({ apiVersion: 4 });
    assert.throws(() => inspectAppDir(dir, 'tools', '0.1.0', ''), /index.html|API 5/);
    manifest({ permissions: {} });
    assert.throws(() => inspectAppDir(dir, 'tools', '0.1.0', ''), /index.html|agents:tools/);
    manifest({ contributes: { tabs: [{ name: 'main', title: 'Main', entry: 'missing.html' }] } });
    assert.throws(() => inspectAppDir(dir, 'tools', '0.1.0', ''), /missing.html/);
    manifest({ entry: 'real.html', contributes: { tabs: [{ name: 'settings', title: 'Settings', hostPage: 'settings' }] } });
    assert.throws(() => inspectAppDir(dir, 'tools', '0.1.0', ''), /real.html/);
    writeFileSync(join(dir, 'real.html'), '<title>Real page</title>');
    assert.equal(inspectAppDir(dir, 'tools', '0.1.0', '').manifest.entry, 'real.html');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('both first-party tool App sources are inspectable and contain no business HTML', async () => {
  const root = new URL('../sources/', import.meta.url);
  for (const id of ['browser-use', 'computer-use']) {
    const dir = new URL(`${id}/app/`, root).pathname;
    const read = inspectAppDir(dir, id, '0.1.0', '');
    assert.equal(read.manifest.entry, undefined);
    assert.equal(read.manifest.contributes.tabs, undefined);
    assert.deepEqual(read.manifest.permissions.capabilities, ['agents:tools']);
    assert.ok((await packDir(dir)).length > 0);
  }
});
