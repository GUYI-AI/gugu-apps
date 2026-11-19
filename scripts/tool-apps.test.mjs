import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { inspectAppDir, packDir } from './lib.mjs';

// The listing and platform rules are the pinned client's (market.test.mjs runs them); these cells are about entries.
const passing = { appListingProblems: () => [], appPlatformProblems: () => [], safeParseExtensionManifest: () => ({ ok: true }) };

test('tool Apps package and inspect without HTML; HTML entry checks still reject broken pages', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gugu-tool-market-'));
  const raw = { id: 'tools', name: 'Tools', version: '0.1.0', apiVersion: 5, engines: { gugu: '>=0.2.56' },
    permissions: { capabilities: ['agents:tools'] }, contributes: { mcpServers: [{ name: 'browser-use', host: 'browser-use' }] } };
  const manifest = (patch = {}) => writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ ...raw, ...patch }));
  try {
    manifest();
    assert.equal(inspectAppDir(dir, 'tools', '0.1.0', passing).apiVersion, 5);
    assert.ok((await packDir(dir)).length > 0);
    manifest({ contributes: { tabs: [{ name: 'main', title: 'Main', entry: 'missing.html' }] } });
    assert.throws(() => inspectAppDir(dir, 'tools', '0.1.0', passing), /missing.html/);
    manifest({ entry: 'real.html', contributes: { tabs: [{ name: 'settings', title: 'Settings', hostPage: 'settings' }] } });
    assert.throws(() => inspectAppDir(dir, 'tools', '0.1.0', passing), /real.html/);
    writeFileSync(join(dir, 'real.html'), '<title>Real page</title>');
    assert.equal(inspectAppDir(dir, 'tools', '0.1.0', passing).manifest.entry, 'real.html');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('both first-party tool App sources are inspectable; only Computer Use has a page, one per task; Browser Use ships its program', async () => {
  const root = new URL('../sources/', import.meta.url);
  const tabs = {
    'browser-use': undefined,
    'computer-use': [
      { name: 'settings', title: 'Settings', entry: 'settings.html' },
      { name: 'preview', title: 'Computer', entry: 'preview.html', icon: 'icon.png', perSession: true },
    ],
  };
  // Both run their own programs (GUYI-AI/gugu#1607), not a program of the host.
  const programs = {
    'browser-use': [{ name: 'browser-use', command: 'node', args: ['program/lib/server.mjs'] }],
    'computer-use': [{ name: 'computer-use', command: 'node', args: ['program/server.mjs'] }],
  };
  for (const [id, expected] of Object.entries(tabs)) {
    const dir = new URL(`${id}/app/`, root).pathname;
    const { version } = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    const read = inspectAppDir(dir, id, version, passing);
    assert.equal(read.manifest.entry, undefined);
    assert.deepEqual(read.manifest.contributes.tabs, expected);
    assert.deepEqual(read.manifest.contributes.mcpServers, programs[id]);
    assert.deepEqual(read.manifest.permissions.capabilities, ['agents:tools']);
    assert.ok((await packDir(dir)).length > 0);
  }
});
