// Inspect only the pinned, verified driver. Never starts a daemon or operates a window.
import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { prepareDriver, cuaEnvironment, TOOLS } from '../app/program/native-runtime.mjs';
if (!path.isAbsolute(process.env.GUGU_EXTENSION_DATA_DIR ?? '')) throw new Error('Supply an isolated App data directory.');
const driver = await prepareDriver({ dataDir: process.env.GUGU_EXTENSION_DATA_DIR });
const { stdout } = await promisify(execFile)(driver.binary, ['dump-docs', '--type', 'mcp'], { timeout: 60_000, maxBuffer: 16 * 1024 * 1024, env: cuaEnvironment({ home: path.join(process.env.GUGU_EXTENSION_DATA_DIR, 'docs-home') }) });
const document = JSON.parse(stdout), names = new Set(TOOLS.map(tool => tool.cua));
if (document.version !== driver.version || !Array.isArray(document.tools)) throw new Error('The driver documentation does not match the pinned version.');
const tools = document.tools.filter(tool => names.has(tool.name));
if (tools.length !== names.size) throw new Error('The pinned driver is missing an exposed tool schema.');
await writeFile(new URL('./tool-specs.json', import.meta.url), JSON.stringify({ version: driver.version, revision: driver.revision, inspectedPlatform: process.platform, inspectedArchitecture: process.arch, executableSha256: driver.sha256, tools }, null, 2) + '\n');
console.log('Computer Use tool schemas inspected from the verified driver.');
