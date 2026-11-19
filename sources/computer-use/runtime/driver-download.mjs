import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, lstat, open, readFile, rm } from 'node:fs/promises';

export const MAX_DRIVER_ARCHIVE = 64 * 1024 * 1024;
export const DRIVER_TRANSFER_TIMEOUT_MS = 15 * 60_000;
const transfers = new Map();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export class DriverDownloadError extends Error {
  constructor(message, kind = 'download') { super(message); this.name = 'DriverDownloadError'; this.kind = kind; }
}

/** Only public, pinned driver assets use the free service. Never forward credentials or arbitrary URLs. */
export function driverDownloadSources(url) {
  const source = new URL(url);
  const publicDriver = source.origin === 'https://github.com'
    && /^\/(GUYI-AI|trycua)\/cua\/releases\/download\//.test(source.pathname)
    && !source.username && !source.password && !source.search && !source.hash;
  return publicDriver ? ['https://gh-proxy.org/' + url, url] : [url];
}

async function partialSize(file, maximum) {
  try {
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new DriverDownloadError('Driver download cache is not a regular file.', 'cache');
    if (stat.size > maximum) { await rm(file); return 0; }
    return stat.size;
  } catch (error) {
    if (error.code === 'ENOENT') return 0;
    if (error instanceof DriverDownloadError) throw error;
    throw new DriverDownloadError(`Driver download could not read its cache: ${causeText(error)}.`, 'cache');
  }
}

function causeText(error) {
  let reason = error;
  while (reason?.cause instanceof Error || (reason instanceof AggregateError && reason.errors[0] instanceof Error)) {
    reason = reason.cause instanceof Error ? reason.cause : reason.errors[0];
  }
  return String(reason?.message || reason?.code || reason).replace(/[\r\n]+/g, ' ');
}

/** Persist only an untrusted prefix; the complete archive must match its pinned hash before use. */
export async function downloadDriverArchive(url, options) {
  const previous = transfers.get(options.partialFile);
  const task = (previous ?? Promise.resolve()).catch(() => {}).then(() => download(url, options));
  transfers.set(options.partialFile, task);
  try { return await task; }
  finally { if (transfers.get(options.partialFile) === task) transfers.delete(options.partialFile); }
}

async function download(url, {
  partialFile, sha256, signal, sources = driverDownloadSources(url), fetchImpl = fetch,
  maximum = MAX_DRIVER_ARCHIVE, headersTimeoutMs = 20_000, idleTimeoutMs = 30_000,
  transferTimeoutMs = DRIVER_TRANSFER_TIMEOUT_MS,
}) {
  signal?.throwIfAborted();
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new DriverDownloadError('Driver download has no valid pinned checksum.', 'integrity');
  let offset = await partialSize(partialFile, maximum);
  if (offset > 0) {
    const bytes = await readFile(partialFile);
    if (sha(bytes) === sha256) return bytes;
  }
  let failure;
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    let freshRecovery = false;
    for (;;) {
      signal?.throwIfAborted();
      offset = await partialSize(partialFile, maximum);
      try {
        const bytes = await transfer(source, offset);
        if (sha(bytes) !== sha256) throw new DriverDownloadError(`Driver download from ${new URL(source).hostname} failed its pinned SHA-256 check.`, 'integrity');
        return bytes;
      } catch (error) {
        signal?.throwIfAborted();
        failure = error instanceof DriverDownloadError ? error
          : new DriverDownloadError(`Driver download from ${new URL(source).hostname} failed: ${causeText(error)}.`);
        if (failure.kind === 'cache') throw failure;
        if (failure.kind === 'integrity' || failure.kind === 'range') {
          await rm(partialFile, { force: true });
          // A prefix left by an earlier interrupted process may be corrupt. The official
          // source gets one fresh attempt; a bad mirror moves directly to the official URL.
          if (index === sources.length - 1 && offset > 0 && !freshRecovery) { freshRecovery = true; continue; }
        }
        break;
      }
    }
  }
  throw failure ?? new DriverDownloadError('Driver download has no available source.');

  async function transfer(source, offset) {
    const host = new URL(source).hostname;
    const controller = new AbortController();
    const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    const deadline = setTimeout(() => controller.abort(new DriverDownloadError(`Driver download from ${host} exceeded ${transferTimeoutMs / 1000} seconds.`)), transferTimeoutMs);
    let headerTimer, idleTimer, handle, reader;
    let total;
    try {
      for (;;) {
        combined.throwIfAborted();
        headerTimer = setTimeout(() => controller.abort(new DriverDownloadError(`Driver download from ${host} did not respond within ${headersTimeoutMs / 1000} seconds.`)), headersTimeoutMs);
        const response = await fetchImpl(source, {
          signal: combined, headers: { 'Accept-Encoding': 'identity', ...(offset > 0 ? { Range: `bytes=${offset}-` } : {}) },
        });
        clearTimeout(headerTimer);
        const reject = async (message, kind) => {
          await response.body?.cancel();
          throw new DriverDownloadError(message, kind);
        };
        if (response.status === 416) return reject(`Driver download from ${host} rejected the saved byte range (HTTP 416).`, 'range');
        if (![200, 206].includes(response.status)) return reject(`Driver download from ${host} returned HTTP ${response.status}.`);
        const encoding = response.headers.get('content-encoding');
        if (encoding && encoding !== 'identity') return reject(`Driver download from ${host} returned an encoded byte range.`, 'range');
        const lengthHeader = response.headers.get('content-length');
        const length = lengthHeader === null ? undefined : Number(lengthHeader);
        if (length !== undefined && (!Number.isSafeInteger(length) || length < 0 || length > maximum)) return reject('Driver download exceeds the archive size limit.', 'integrity');
        let end;
        if (response.status === 206) {
          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range') ?? '');
          const values = match?.slice(1).map(Number);
          if (!values || values.some(value => !Number.isSafeInteger(value)) || values[0] !== offset
              || values[1] < offset || values[2] <= values[1] || values[2] > maximum
              || (total !== undefined && total !== values[2])
              || (length !== undefined && length !== values[1] - offset + 1)) {
            return reject(`Driver download from ${host} returned an invalid Content-Range.`, 'range');
          }
          [, end, total] = values;
        } else {
          // Ignoring Range is legal. Replace the prefix instead of appending a second archive.
          offset = 0;
          total = length;
          end = length === undefined ? undefined : length - 1;
        }
        if (!response.body) throw new DriverDownloadError(`Driver download from ${host} returned no body.`);
        const flags = constants.O_WRONLY | constants.O_CREAT | (constants.O_NOFOLLOW ?? 0)
          | (offset > 0 ? constants.O_APPEND : constants.O_TRUNC);
        try {
          handle = await open(partialFile, flags, 0o600);
          if (!(await handle.stat()).isFile()) throw new Error('not a regular file');
          await chmod(partialFile, 0o600);
        } catch (error) {
          await response.body.cancel();
          throw new DriverDownloadError(`Driver download could not open its cache: ${causeText(error)}.`, 'cache');
        }
        reader = response.body.getReader();
        for (;;) {
          idleTimer = setTimeout(() => controller.abort(new DriverDownloadError(`Driver download from ${host} stalled for ${idleTimeoutMs / 1000} seconds; ${offset} bytes are saved.`)), idleTimeoutMs);
          const { done, value } = await reader.read();
          clearTimeout(idleTimer);
          if (done) break;
          combined.throwIfAborted();
          if (offset + value.byteLength > maximum || (end !== undefined && offset + value.byteLength > end + 1)) {
            throw new DriverDownloadError(`Driver download from ${host} exceeded its declared size.`, 'integrity');
          }
          try { await handle.writeFile(value); }
          catch (error) { throw new DriverDownloadError(`Driver download could not save its cache: ${causeText(error)}.`, 'cache'); }
          offset += value.byteLength;
        }
        await handle.close(); handle = undefined;
        reader.releaseLock(); reader = undefined;
        if (end !== undefined && offset !== end + 1) throw new DriverDownloadError(`Driver download from ${host} ended early; ${offset} bytes are saved.`);
        if (response.status === 200 || offset === total) return await readFile(partialFile);
        // Some servers cap the size of each 206 response. Continue from its validated end.
      }
    } catch (error) {
      if (combined.aborted) throw combined.reason;
      throw error;
    } finally {
      clearTimeout(deadline); clearTimeout(headerTimer); clearTimeout(idleTimer);
      await reader?.cancel().catch(() => {});
      await handle?.close();
    }
  }
}
