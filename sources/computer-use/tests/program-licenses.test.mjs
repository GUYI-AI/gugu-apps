import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
test('the packaged notices include licenses for SDK and PNG transitive bundle dependencies', async () => {
  const notices = await readFile(new URL('../app/program/THIRD-PARTY-NOTICES.txt', import.meta.url), 'utf8');
  for (const name of ['@modelcontextprotocol/sdk', 'pngjs', 'ajv', 'zod', 'zod-to-json-schema', 'fast-uri', 'ajv-formats', 'json-schema-traverse', 'fast-deep-equal']) {
    const manifest = JSON.parse(await readFile(new URL(`../node_modules/${name}/package.json`, import.meta.url), 'utf8'));
    assert(notices.includes(`${name}@${manifest.version}`), `missing bundled license: ${name}`);
    const root = new URL(`../node_modules/${name}/`, import.meta.url);
    const files = (await readdir(root)).filter(name => /^(licen[cs]e|copying|notice)([._-].*)?$/i.test(name));
    assert(files.length, `no source license for ${name}`);
    for (const file of files) assert(notices.includes(await readFile(new URL(file, root), 'utf8')), `missing license body: ${name}/${file}`);
  }
});
