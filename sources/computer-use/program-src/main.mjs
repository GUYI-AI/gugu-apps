import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startComputerStdio, createProgramNative, createProtectedHost } from './program-core.mjs';

try {
  const dataDir = process.env.GUGU_EXTENSION_DATA_DIR;
  if (process.env.GUGU_EXTENSION_ID !== 'computer-use' || !path.isAbsolute(dataDir ?? '')) throw new Error('The host must supply the Computer Use App identity and data directory.');
  const bundle = path.dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(await readFile(path.join(bundle, '..', 'manifest.json'), 'utf8'));
  const document = JSON.parse(await readFile(path.join(bundle, 'tool-specs.json'), 'utf8'));
  if (document.version !== '0.36.0' || !Array.isArray(document.tools)) throw new Error('The bundled Computer Use tool documentation is invalid.');
  const log = { info(fields, message) { process.stderr.write(JSON.stringify({ message, fields }) + '\n'); }, warn(fields, message) { process.stderr.write(JSON.stringify({ message, fields }) + '\n'); } };
  const { native, settings } = createProgramNative({ dataDir, bundleDir: path.join(bundle, 'native'), log });
  await startComputerStdio({ version: manifest.version, native, settings, specs: document.tools, protectedHost: createProtectedHost(), log });
} catch (error) {
  process.stderr.write(JSON.stringify({ message: 'Computer Use startup failed', error: String(error) }) + '\n');
  process.stderr.write('Computer Use could not start. Reinstall the App.\n');
  process.exit(1);
}
