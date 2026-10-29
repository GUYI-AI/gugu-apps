import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { chmod, lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { gunzipSync, inflateRawSync } from 'node:zlib';

const execute = promisify(execFile);
const MAX_ARCHIVE = 64 * 1024 * 1024;
const MAX_NATIVE = 256 * 1024 * 1024;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const active = new Map();

// The first migration retains these immutable upstream/maintained source bytes.
// Publishing the App's own immutable assets is a separate release operation.
export const DRIVER_RELEASES = Object.freeze({
  'darwin-arm64': { platform: 'darwin', arch: 'arm64', version: '0.36.0', revision: '0.36.0-gugu.1', format: 'tar.gz', member: 'cua-driver', sha256: '3a9e5ddfc3078bdc09ab1eb708d8bc49964a306b31f0251689fda8da69fae9c6', url: 'https://github.com/OpenDCAI/gugu/releases/download/assets/cua-driver-rs-0.36.0-gugu.1-darwin-universal-binary.tar.gz' },
  'darwin-x64': { platform: 'darwin', arch: 'x64', version: '0.36.0', revision: '0.36.0-gugu.1', format: 'tar.gz', member: 'cua-driver', sha256: '3a9e5ddfc3078bdc09ab1eb708d8bc49964a306b31f0251689fda8da69fae9c6', url: 'https://github.com/OpenDCAI/gugu/releases/download/assets/cua-driver-rs-0.36.0-gugu.1-darwin-universal-binary.tar.gz' },
  'win32-x64': { platform: 'win32', arch: 'x64', version: '0.36.0', revision: '0.36.0', format: 'zip', member: 'cua-driver.exe', sha256: 'f8c47024b626f4e0e70f8428d2998df39e4879110c5722a29d5fd03e367353ad', url: 'https://github.com/trycua/cua/releases/download/cua-driver-rs-v0.36.0/cua-driver-rs-0.36.0-windows-x86_64-binary.zip' },
  'win32-arm64': { platform: 'win32', arch: 'arm64', version: '0.36.0', revision: '0.36.0', format: 'zip', member: 'cua-driver.exe', sha256: '520ea584cf11c074bccc4fd2328e8f2b34ec43de9328d97afb7fd03f761b55ee', url: 'https://github.com/trycua/cua/releases/download/cua-driver-rs-v0.36.0/cua-driver-rs-0.36.0-windows-arm64-binary.zip' },
});

function safeName(name) {
  const normalized = name.replace(/^\.\//, '').replace(/\/$/, '');
  if (!normalized || normalized.includes('\\') || normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)
      || normalized.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe native archive path.');
  return normalized;
}
function field(bytes, start, size) {
  return bytes.subarray(start, start + size).toString('utf8').split('\0')[0];
}
function octal(bytes, start, size) {
  const value = field(bytes, start, size).trim();
  if (!/^[0-7]*$/.test(value)) throw new Error('Invalid tar number.');
  return value ? Number.parseInt(value, 8) : 0;
}
function verifyPaxMetadata(bytes) {
  if (bytes.length > 64 * 1024) throw new Error('Oversized tar metadata.');
  for (let offset = 0; offset < bytes.length;) {
    const space = bytes.indexOf(32, offset);
    if (space < 0 || space - offset > 8) throw new Error('Invalid tar metadata record.');
    const lengthText = bytes.subarray(offset, space).toString('ascii');
    if (!/^[1-9][0-9]*$/.test(lengthText)) throw new Error('Invalid tar metadata length.');
    const end = offset + Number(lengthText), equal = bytes.indexOf(61, space + 1);
    if (end > bytes.length || end <= space + 1 || equal < 0 || equal >= end - 1 || bytes[end - 1] !== 10) throw new Error('Truncated tar metadata.');
    const key = bytes.subarray(space + 1, equal).toString('ascii');
    // These are ignored, never restored. Path/size/link overrides are not supported.
    if (!['mtime', 'atime', 'ctime'].includes(key) && !key.startsWith('LIBARCHIVE.xattr.') && !key.startsWith('SCHILY.xattr.')) throw new Error('Unsupported tar metadata override.');
    offset = end;
  }
}
function untar(bytes, member, maximum) {
  const tar = gunzipSync(bytes, { maxOutputLength: maximum });
  let selected;
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const sum = header.reduce((total, byte, index) => total + (index >= 148 && index < 156 ? 32 : byte), 0);
    if (sum !== octal(header, 148, 8)) throw new Error('Invalid tar header checksum.');
    const prefix = field(header, 345, 155);
    const name = safeName((prefix ? prefix + '/' : '') + field(header, 0, 100));
    const type = field(header, 156, 1);
    if (!['', '0', '5', 'x'].includes(type)) throw new Error('Native archives may not contain links or special files.');
    const size = octal(header, 124, 12);
    const start = offset + 512;
    if (size > maximum || start + size > tar.length) throw new Error('Truncated or oversized tar member.');
    if (type === 'x') verifyPaxMetadata(tar.subarray(start, start + size));
    if (name === member && ['', '0'].includes(type)) {
      if (selected) throw new Error('Duplicate native archive member.');
      selected = Buffer.from(tar.subarray(start, start + size));
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  if (!selected) throw new Error('Pinned native archive member is missing.');
  return selected;
}
function unzip(bytes, member, maximum) {
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65_557); at--) {
    if (bytes.readUInt32LE(at) === 0x06054b50 && at + 22 + bytes.readUInt16LE(at + 20) === bytes.length) { end = at; break; }
  }
  if (end < 0 || bytes.readUInt32LE(end + 4) !== 0 || bytes.readUInt16LE(end + 8) !== bytes.readUInt16LE(end + 10)) throw new Error('Invalid or split zip archive.');
  const count = bytes.readUInt16LE(end + 10);
  const centralSize = bytes.readUInt32LE(end + 12);
  let at = bytes.readUInt32LE(end + 16);
  if (count > 10_000 || at + centralSize !== end) throw new Error('Unsupported zip directory.');
  let selected;
  for (let i = 0; i < count; i++) {
    if (at + 46 > end || bytes.readUInt32LE(at) !== 0x02014b50) throw new Error('Truncated zip directory.');
    const flags = bytes.readUInt16LE(at + 8), method = bytes.readUInt16LE(at + 10);
    const compressed = bytes.readUInt32LE(at + 20), size = bytes.readUInt32LE(at + 24);
    const length = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32);
    const local = bytes.readUInt32LE(at + 42);
    if (at + 46 + length + extra + comment > end) throw new Error('Truncated zip entry.');
    const rawName = bytes.subarray(at + 46, at + 46 + length).toString('utf8');
    const name = safeName(rawName);
    const mode = bytes.readUInt32LE(at + 38) >>> 16;
    if ((mode & 0xf000) === 0xa000 || flags & 1) throw new Error('Native archives may not contain links or encrypted files.');
    if (name === member && !rawName.endsWith('/')) {
      if (selected || size > maximum || local + 30 > at || ![0, 8].includes(method)) throw new Error('Unsupported native zip member.');
      if (bytes.readUInt32LE(local) !== 0x04034b50 || bytes.readUInt16LE(local + 8) !== method) throw new Error('Invalid local zip header.');
      const nameLength = bytes.readUInt16LE(local + 26), extraLength = bytes.readUInt16LE(local + 28);
      const start = local + 30 + nameLength + extraLength;
      if (start + compressed > at || safeName(bytes.subarray(local + 30, local + 30 + nameLength).toString('utf8')) !== member) throw new Error('Truncated or mismatched zip member.');
      const input = bytes.subarray(start, start + compressed);
      selected = method === 0 ? Buffer.from(input) : inflateRawSync(input, { maxOutputLength: maximum });
      if (selected.length !== size) throw new Error('Incorrect uncompressed native size.');
    }
    at += 46 + length + extra + comment;
  }
  if (!selected || at !== end) throw new Error('Pinned native archive member is missing.');
  return selected;
}

export function unpackDriver(bytes, release, maximum = MAX_NATIVE) {
  if (!Buffer.isBuffer(bytes) || bytes.length > MAX_ARCHIVE || digest(bytes) !== release.sha256) throw new Error('Native archive integrity check failed.');
  const member = safeName(release.member);
  if (member.includes('/')) throw new Error('The native executable must be a root archive member.');
  if (release.format === 'tar.gz') return untar(bytes, member, maximum);
  if (release.format === 'zip') return unzip(bytes, member, maximum);
  throw new Error('Unsupported native archive format.');
}

export function assertNativeArchitecture(bytes, platform, arch) {
  if (platform === 'win32') {
    const offset = bytes.length >= 64 ? bytes.readUInt32LE(60) : -1;
    const expected = { arm64: 0xaa64, x64: 0x8664 }[arch];
    if (!expected || offset < 64 || offset + 6 > bytes.length || bytes.toString('latin1', offset, offset + 4) !== 'PE\0\0' || bytes.readUInt16LE(offset + 4) !== expected) throw new Error('Incorrect native PE architecture.');
    return;
  }
  if (platform !== 'darwin' || bytes.length < 8) throw new Error('This platform has no supported native driver.');
  const expected = { arm64: 0x0100000c, x64: 0x01000007 }[arch];
  const magic = bytes.readUInt32BE(0);
  if (magic === 0xcafebabe || magic === 0xcafebabf) {
    const count = bytes.readUInt32BE(4), stride = magic === 0xcafebabe ? 20 : 32;
    if (count > 16 || 8 + count * stride > bytes.length) throw new Error('Invalid native Mach-O header.');
    for (let i = 0; i < count; i++) if (expected && bytes.readUInt32BE(8 + i * stride) === expected) return;
  } else if (magic === 0xcffaedfe && expected && bytes.readUInt32LE(4) === expected) return;
  throw new Error('Incorrect native Mach-O architecture.');
}

async function download(url, { signal }) {
  const response = await fetch(url, { signal });
  if (!response.ok || Number(response.headers.get('content-length') ?? 0) > MAX_ARCHIVE) throw new Error('Native download was not available.');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_ARCHIVE) throw new Error('Native download exceeds the size limit.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
async function regular(file) {
  try { const value = await lstat(file); if (!value.isFile() || value.isSymbolicLink()) throw new Error('Native cache entry is not a regular file.'); return await readFile(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function environment(home) {
  const names = ['PATH', 'HOME', 'USER', 'LOGNAME', 'TMPDIR', 'SystemRoot', 'windir', 'USERPROFILE', 'TEMP', 'TMP'];
  return { ...Object.fromEntries(names.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]])), CUA_DRIVER_EMBEDDED: '1', CUA_DRIVER_RS_TELEMETRY_ENABLED: 'false', CUA_DRIVER_RS_UPDATE_CHECK: 'false', CUA_DRIVER_RS_HOME: home };
}
async function verifyExecutable(file, release, dataDir, signal) {
  if (release.platform === 'darwin') await execute('/usr/bin/codesign', ['--verify', '--strict', file], { signal, timeout: 15_000 });
  const { stdout } = await execute(file, ['--version'], { signal, timeout: 15_000, maxBuffer: 8192, env: environment(path.join(dataDir, 'driver-home')) });
  if (stdout.trim() !== `cua-driver ${release.version}`) throw new Error('Incorrect native driver version.');
}

/** No host-native lookup, default data directory or unverified execution path. */
export async function prepareDriver({ dataDir, platform = process.platform, arch = process.arch, signal, fetchArchive = download, verify = verifyExecutable, releases = DRIVER_RELEASES }) {
  if (!dataDir || !path.isAbsolute(dataDir)) throw new Error('The App data directory is required.');
  const release = releases[`${platform}-${arch}`];
  if (!release || release.platform !== platform || release.arch !== arch) throw new Error('This platform has no supported native driver.');
  if (signal?.aborted) throw signal.reason;
  const key = path.join(dataDir, 'native', release.sha256);
  const identity = key + '\0' + platform + '\0' + arch;
  let job = active.get(identity);
  if (!job) {
    job = { controller: new AbortController(), subscribers: new Set(), settled: false };
    active.set(identity, job);
    job.task = prepare(job.controller.signal).finally(() => {
      job.settled = true;
      if (active.get(identity) === job) active.delete(identity);
    });
  }
  return new Promise((resolve, reject) => {
    const subscriber = {};
    job.subscribers.add(subscriber);
    const leave = () => {
      signal?.removeEventListener('abort', abort);
      job.subscribers.delete(subscriber);
      if (!job.settled && job.subscribers.size === 0) {
        if (active.get(identity) === job) active.delete(identity);
        job.controller.abort(new Error('Native preparation has no remaining callers.'));
      }
    };
    const abort = () => { leave(); reject(signal.reason); };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    // Also consumes a late rejection when all subscribers have cancelled.
    job.task.then(value => { leave(); resolve(value); }, error => { leave(); reject(error); });
  });

  async function prepare(signal) {
    await mkdir(key, { recursive: true, mode: 0o700 });
    signal.throwIfAborted();
    const archive = path.join(key, 'archive');
    let bytes = await regular(archive);
    signal.throwIfAborted();
    if (!bytes || digest(bytes) !== release.sha256) {
      bytes = await fetchArchive(release.url, { signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(120_000)]) });
      signal.throwIfAborted();
      if (digest(bytes) !== release.sha256 || bytes.length > MAX_ARCHIVE) throw new Error('Native archive integrity check failed.');
      const temporary = archive + '.' + randomUUID() + '.part';
      try { await writeFile(temporary, bytes, { mode: 0o600, flag: 'wx' }); await rename(temporary, archive); }
      finally { await rm(temporary, { force: true }); }
    }
    if (signal?.aborted) throw signal.reason;
    const executableBytes = unpackDriver(bytes, release);
    assertNativeArchitecture(executableBytes, platform, arch);
    const file = path.join(key, release.member);
    const cached = await regular(file);
    signal.throwIfAborted();
    if (!cached || digest(cached) !== digest(executableBytes)) {
      const temporary = file + '.' + randomUUID() + '.part';
      try { await writeFile(temporary, executableBytes, { mode: 0o700, flag: 'wx' }); await rename(temporary, file); }
      finally { await rm(temporary, { force: true }); }
    }
    if (platform !== 'win32') await chmod(file, 0o700);
    if (signal?.aborted) throw signal.reason;
    await verify(file, release, dataDir, signal);
    signal.throwIfAborted();
    return { binary: file, version: release.version, revision: release.revision, sha256: digest(executableBytes) };
  }
}
