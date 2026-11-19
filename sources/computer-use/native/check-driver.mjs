import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createComputerTools, prepareDriver } from '../app/program/native-runtime.mjs';

if (!process.env.GUGU_EXTENSION_DATA_DIR) throw new Error('Supply an isolated App data directory.');
const driver = await prepareDriver({ dataDir: process.env.GUGU_EXTENSION_DATA_DIR });
const execute = promisify(execFile);
const keep = ['PATH', 'HOME', 'TMPDIR', 'SystemRoot', 'USERPROFILE', 'TEMP', 'TMP'];
const env = { ...Object.fromEntries(keep.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]])), CUA_DRIVER_EMBEDDED: '1', CUA_DRIVER_RS_HOME: path.join(process.env.GUGU_EXTENSION_DATA_DIR, 'driver-home'), CUA_DRIVER_RS_TELEMETRY_ENABLED: 'false', CUA_DRIVER_RS_UPDATE_CHECK: 'false' };
const { stdout } = await execute(driver.binary, ['dump-docs', '--type', 'mcp'], { env, timeout: 60_000, maxBuffer: 16 * 1024 * 1024 });
const document = JSON.parse(stdout);
if (document.version !== driver.version || !Array.isArray(document.tools)) throw new Error('Native tool documentation does not match the driver.');
const registry = createComputerTools({ cua: {}, specs: document.tools, platform: process.platform, protectedHost: () => { throw new Error('This check never operates a window.'); } });
console.log(JSON.stringify({ revision: driver.revision, version: driver.version, executableSha256: driver.sha256, tools: registry.list().map(tool => tool.name), operation: 'version-and-documentation-only', daemonStarted: false }));
