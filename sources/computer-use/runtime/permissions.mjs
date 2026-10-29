import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { assertNativeArchitecture } from './driver-resources.mjs';

const execute = promisify(execFile);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const choices = new Set(['accessibility', 'screen']);

/** The App supplies its own bundled helper, never the desktop's mac-helper path. */
export function createPermissionClient({ bundleDir, dataDir, platform = process.platform, arch = process.arch, run = execute }) {
  if (!bundleDir || !dataDir || !path.isAbsolute(bundleDir) || !path.isAbsolute(dataDir)) throw new Error('App bundle and data directories are required.');
  let ready;
  async function prepare() {
    if (platform !== 'darwin') throw new Error('macOS permission checks are not available on this platform.');
    ready ??= (async () => {
      const meta = JSON.parse(await readFile(path.join(bundleDir, 'permissions.json'), 'utf8'));
      if (meta.platform !== platform || !meta.architectures.includes(arch) || !/^[a-f0-9]{64}$/.test(meta.sha256)) throw new Error('The permission helper does not match this computer.');
      const bytes = await readFile(path.join(bundleDir, 'mac-permissions'));
      if (digest(bytes) !== meta.sha256) throw new Error('The permission helper failed its integrity check.');
      assertNativeArchitecture(bytes, platform, arch);
      const directory = path.join(dataDir, 'native', 'permissions', meta.sha256);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const file = path.join(directory, 'mac-permissions');
      const temporary = file + '.' + randomUUID() + '.part';
      try { await writeFile(temporary, bytes, { mode: 0o700, flag: 'wx' }); await rename(temporary, file); }
      finally { await rm(temporary, { force: true }); }
      await chmod(file, 0o700);
      await run('/usr/bin/codesign', ['--verify', '--strict', file], { timeout: 15_000 });
      return file;
    })().catch(error => { ready = undefined; throw error; });
    return ready;
  }
  async function call(args, signal) {
    if (signal?.aborted) throw signal.reason;
    const file = await prepare();
    const keep = ['PATH', 'HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL'];
    const { stdout } = await run(file, args, { signal, timeout: args[0] === 'request' ? 120_000 : 15_000, maxBuffer: 64 * 1024, env: Object.fromEntries(keep.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]])) });
    const result = JSON.parse(stdout);
    if (!result.ok) throw new Error('The permission operation could not be completed.');
    return result;
  }
  return {
    status: signal => call(['status'], signal),
    // Wire only to the page's explicit grant/connect action, never an agent operation.
    requestFromPage: signal => call(['request'], signal),
    openSettings(permission, signal) {
      if (!choices.has(permission)) throw new Error('Choose Accessibility or Screen Recording.');
      return call(['open', permission], signal);
    },
  };
}
