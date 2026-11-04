import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startComputerStdio, createProgramNative, createProtectedHost, createComputerSurfaceView } from './program-core.mjs';
import { createComputerControl } from './native-runtime.mjs';

try {
  const dataDir = process.env.GUGU_EXTENSION_DATA_DIR;
  if (process.env.GUGU_EXTENSION_ID !== 'computer-use' || !path.isAbsolute(dataDir ?? '')) throw new Error('The host must supply the Computer Use App identity and data directory.');
  const bundle = path.dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(await readFile(path.join(bundle, '..', 'manifest.json'), 'utf8'));
  const document = JSON.parse(await readFile(path.join(bundle, 'tool-specs.json'), 'utf8'));
  if (document.version !== '0.36.0' || !Array.isArray(document.tools)) throw new Error('The bundled Computer Use tool documentation is invalid.');
  const log = { info(fields, message) { process.stderr.write(JSON.stringify({ message, fields }) + '\n'); }, warn(fields, message) { process.stderr.write(JSON.stringify({ message, fields }) + '\n'); } };
  const { native, settings } = createProgramNative({ dataDir, bundleDir: path.join(bundle, 'native'), log });
  const host = globalThis.gugu;
  if (typeof host?.withCall !== 'function' || typeof host.surfaces?.open !== 'function' || typeof host.surfaces?.screen !== 'function' || typeof host.projection?.create !== 'function' || typeof host.showTaskPages !== 'function') {
    throw new Error('Computer Use needs the App presentation and task-call APIs from Gugu API 30.');
  }
  let control;
  const view = createComputerSurfaceView({ surfaces: host.surfaces, native, log,
    onStop: () => control.stop(), onResume: () => control.resume() });
  control = createComputerControl({ view, onViewError: error => log.warn({ error: String(error) }, 'Computer Use display failed') });
  await startComputerStdio({ version: manifest.version, native, settings, control, projection: host.projection, specs: document.tools,
    protectedHost: createProtectedHost(), log, showTaskPages: () => host.showTaskPages(), withCall: (meta, work) => host.withCall(meta, work) });
} catch (error) {
  process.stderr.write(JSON.stringify({ message: 'Computer Use startup failed', error: String(error) }) + '\n');
  process.stderr.write('Computer Use could not start. Reinstall the App.\n');
  process.exit(1);
}
