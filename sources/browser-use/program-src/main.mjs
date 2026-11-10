import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConnection } from '@playwright/mcp';
import { chromium } from 'playwright-core';
import { startBrowserUseStdio } from './core.mjs';

const log = (fields, message) => process.stderr.write(JSON.stringify({ message, ...fields }) + '\n');

try {
  const dataDir = process.env.GUGU_EXTENSION_DATA_DIR;
  if (process.env.GUGU_EXTENSION_ID !== 'browser-use' || !path.isAbsolute(dataDir ?? '')) {
    throw new Error('The host must supply the Browser Use App identity and data directory.');
  }
  const gugu = globalThis.gugu;
  if (typeof gugu?.withCall !== 'function' || typeof gugu.pages?.acquire !== 'function') {
    throw new Error('Browser Use needs task page leases from Gugu App interface 36.');
  }
  // program/lib/server.mjs → the App's manifest is two levels up.
  const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const manifest = JSON.parse(await readFile(path.join(appDir, 'manifest.json'), 'utf8'));
  const settings = JSON.parse(process.env.GUGU_APP_SETTINGS ?? '{}');
  await startBrowserUseStdio({ version: manifest.version, playwright: { createConnection, chromium }, gugu, dataDir, settings, log });
} catch (error) {
  log({ error: String(error) }, 'Browser Use startup failed');
  process.stderr.write('Browser Use could not start. Reinstall the App.\n');
  process.exit(1);
}
