import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
const execute = promisify(execFile);

/** Protect the actual launch ancestry, including an Electron main above a runtime worker. */
export function createProtectedHost({ platform = process.platform, pid = process.pid, parent = process.ppid, run = execute, read = readFile } = {}) {
  return async () => {
    let processes;
    if (platform === 'win32') {
      const { stdout } = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,ExecutablePath | ConvertTo-Json -Compress'], { timeout: 5000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
      const rows = JSON.parse(stdout);
      processes = new Map((Array.isArray(rows) ? rows : [rows]).map(row => [row.ProcessId, { parent: row.ParentProcessId, executable: row.ExecutablePath ?? '' }]));
    } else {
      const { stdout } = await run('/bin/ps', ['-ww', '-axo', 'pid=,ppid=,comm='], { timeout: 5000, maxBuffer: 4 * 1024 * 1024 });
      processes = new Map(stdout.split('\n').flatMap(line => {
        const match = /^\s*(\d+)\s+(\d+)\s+(.+)$/.exec(line);
        return match ? [[Number(match[1]), { parent: Number(match[2]), executable: match[3] }]] : [];
      }));
    }
    if (processes.get(pid)?.parent !== parent || !processes.has(parent)) throw new Error('The program launch owner could not be verified.');
    const pids = new Set(), names = new Set(['gugu', '咕咕', '咕咕 beta']);
    let current = pid;
    while (current > 1 && !pids.has(current)) {
      const entry = processes.get(current);
      if (!entry) throw new Error('The program launch ancestry is unavailable.');
      pids.add(current);
      const basename = (platform === 'win32' ? path.win32 : path.posix).basename(entry.executable).replace(/\.exe$/i, '').trim().toLowerCase();
      if (basename) names.add(basename);
      const app = platform === 'darwin' ? entry.executable.match(/^(.+?\.app)(?:\/|$)/)?.[1] : null;
      if (app) {
        names.add(path.basename(app, '.app').toLowerCase());
        // The enclosing host App, not its helper bundle, owns its windows.
        const plistFile = path.join(app, 'Contents', 'Info.plist');
        const plist = await read(plistFile, 'utf8');
        let bundleId = /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/.exec(plist)?.[1];
        if (!bundleId) bundleId = (await run('/usr/bin/plutil', ['-extract', 'CFBundleIdentifier', 'raw', '-o', '-', plistFile], { timeout: 3000, maxBuffer: 4096 })).stdout.trim();
        if (!bundleId) throw new Error('The host bundle identity is unavailable.');
        names.add(bundleId.toLowerCase());
      }
      current = entry.parent;
    }
    return { pids, names };
  };
}
