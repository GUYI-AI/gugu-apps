import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { downloadDriverArchive, driverDownloadSources, DRIVER_TRANSFER_TIMEOUT_MS } from '../runtime/driver-download.mjs';

const bytes = Buffer.from('pinned driver archive '.repeat(1024));
const sha256 = createHash('sha256').update(bytes).digest('hex');

async function fixture(t, handler) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cu-download-'));
  const server = createServer((request, response) => { Promise.resolve(handler(request, response)).catch(error => response.destroy(error)); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, partialFile: path.join(directory, 'archive.part'), sha256 };
}

function send(response, data = bytes, status = 200, headers = {}) {
  response.writeHead(status, { 'Content-Length': data.length, ...headers });
  response.end(data);
}

test('only the pinned public driver repositories use the free service before the official URL', () => {
  const url = 'https://github.com/GUYI-AI/cua/releases/download/v1/driver.tar.gz';
  assert.deepEqual(driverDownloadSources(url), ['https://gh-proxy.org/' + url, url]);
  for (const url of ['https://github.com/other/private/releases/download/v1/file', 'https://github.com/GUYI-AI/cua/releases/download/v1/file?token=secret', 'https://name:secret@github.com/GUYI-AI/cua/releases/download/v1/file']) {
    assert.deepEqual(driverDownloadSources(url), [url]);
  }
  assert(DRIVER_TRANSFER_TIMEOUT_MS >= 15 * 60_000);
});

test('the mirror is used first; a verified saved archive also works offline', async t => {
  const requests = [];
  const f = await fixture(t, (request, response) => { requests.push(request.url); send(response); });
  const options = { ...f, sources: [f.url + '/mirror', f.url + '/official'] };
  assert.deepEqual(await downloadDriverArchive(f.url, options), bytes);
  assert.deepEqual(requests, ['/mirror']);
  assert.equal((await stat(f.partialFile)).mode & 0o777, 0o600);
  assert.deepEqual(await downloadDriverArchive(f.url, { ...options, fetchImpl: () => { throw new Error('offline'); } }), bytes);
});

test('mirror HTTP failure falls back to the official source', async t => {
  const requests = [];
  const f = await fixture(t, (request, response) => { requests.push(request.url); send(response, request.url === '/mirror' ? Buffer.alloc(0) : bytes, request.url === '/mirror' ? 503 : 200); });
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url + '/mirror', f.url + '/official'] }), bytes);
  assert.deepEqual(requests, ['/mirror', '/official']);
});

test('an interrupted mirror continues from its saved prefix on the official source', async t => {
  const requests = [];
  const f = await fixture(t, (request, response) => {
    requests.push([request.url, request.headers.range]);
    if (request.url === '/mirror') {
      response.writeHead(200, { 'Content-Length': bytes.length }); response.write(bytes.subarray(0, 4096));
      setTimeout(() => response.destroy(), 30);
    } else {
      const start = Number(/^bytes=(\d+)-$/.exec(request.headers.range)[1]);
      send(response, bytes.subarray(start), 206, { 'Content-Range': `bytes ${start}-${bytes.length - 1}/${bytes.length}` });
    }
  });
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url + '/mirror', f.url + '/official'] }), bytes);
  assert.deepEqual(requests, [['/mirror', undefined], ['/official', 'bytes=4096-']]);
});

test('interrupted bytes survive and a later call resumes from the saved offset with HTTP 206', async t => {
  let interrupted = true;
  const ranges = [];
  const f = await fixture(t, (request, response) => {
    ranges.push(request.headers.range);
    if (interrupted) {
      response.writeHead(200, { 'Content-Length': bytes.length }); response.write(bytes.subarray(0, 4096));
      setTimeout(() => response.destroy(), 30);
    } else {
      const start = Number(/^bytes=(\d+)-$/.exec(request.headers.range)[1]);
      send(response, bytes.subarray(start), 206, { 'Content-Range': `bytes ${start}-${bytes.length - 1}/${bytes.length}` });
    }
  });
  await assert.rejects(downloadDriverArchive(f.url, { ...f, sources: [f.url] }));
  const saved = (await stat(f.partialFile)).size;
  assert(saved > 0 && saved < bytes.length);
  interrupted = false;
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url] }), bytes);
  assert.deepEqual(ranges, [undefined, `bytes=${saved}-`]);
});

test('HTTP 200 ignoring Range replaces the prefix instead of appending a duplicate archive', async t => {
  let range;
  const f = await fixture(t, (request, response) => { range = request.headers.range; send(response); });
  await writeFile(f.partialFile, bytes.subarray(0, 1000));
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url] }), bytes);
  assert.equal(range, 'bytes=1000-');
  assert.deepEqual(await readFile(f.partialFile), bytes);
});

test('a server may cap each 206 response; every next request starts at its validated end', async t => {
  const starts = [];
  const f = await fixture(t, (request, response) => {
    const start = request.headers.range ? Number(/^bytes=(\d+)-$/.exec(request.headers.range)[1]) : 0;
    starts.push(start);
    const end = Math.min(bytes.length, start + 5000);
    send(response, bytes.subarray(start, end), 206, { 'Content-Range': `bytes ${start}-${end - 1}/${bytes.length}` });
  });
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url] }), bytes);
  assert.deepEqual(starts, [0, 5000, 10000, 15000, 20000]);
});

test('an invalid mirror Content-Range is discarded before official fallback', async t => {
  const requests = [];
  const f = await fixture(t, (request, response) => {
    requests.push([request.url, request.headers.range]);
    if (request.url === '/mirror') send(response, bytes.subarray(1000), 206, { 'Content-Range': `bytes 999-${bytes.length - 2}/${bytes.length}` });
    else send(response);
  });
  await writeFile(f.partialFile, bytes.subarray(0, 1000));
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url + '/mirror', f.url + '/official'] }), bytes);
  assert.deepEqual(requests, [['/mirror', 'bytes=1000-'], ['/official', undefined]]);
});

test('HTTP 416 discards a stale prefix and makes one fresh official attempt', async t => {
  const requests = [];
  const f = await fixture(t, (request, response) => {
    requests.push(request.headers.range);
    if (request.headers.range) send(response, Buffer.alloc(0), 416, { 'Content-Range': `bytes */${bytes.length}` });
    else send(response);
  });
  await writeFile(f.partialFile, Buffer.alloc(bytes.length + 4));
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url] }), bytes);
  assert.deepEqual(requests, [`bytes=${bytes.length + 4}-`, undefined]);
});

test('wrong mirror hash never poisons the official transfer', async t => {
  const requests = [];
  const f = await fixture(t, (request, response) => { requests.push([request.url, request.headers.range]); send(response, request.url === '/mirror' ? Buffer.alloc(bytes.length) : bytes); });
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url + '/mirror', f.url + '/official'] }), bytes);
  assert.deepEqual(requests, [['/mirror', undefined], ['/official', undefined]]);
});

test('a corrupt saved prefix is repaired by a fresh official transfer after checksum rejection', async t => {
  const ranges = [];
  const f = await fixture(t, (request, response) => {
    ranges.push(request.headers.range);
    if (request.headers.range) send(response, bytes.subarray(1000), 206, { 'Content-Range': `bytes 1000-${bytes.length - 1}/${bytes.length}` });
    else send(response);
  });
  await writeFile(f.partialFile, Buffer.alloc(1000));
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url] }), bytes);
  assert.deepEqual(ranges, ['bytes=1000-', undefined]);
});

test('stalled mirror headers are bounded before official fallback', async t => {
  const f = await fixture(t, (request, response) => { if (request.url !== '/mirror') send(response); });
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url + '/mirror', f.url + '/official'], headersTimeoutMs: 100 }), bytes);
});

test('a nested network error reports its concrete cause instead of an empty aggregate message', async t => {
  const f = await fixture(t, (_request, response) => send(response));
  await assert.rejects(downloadDriverArchive(f.url, { ...f, sources: [f.url], fetchImpl: async () => {
    throw new TypeError('fetch failed', { cause: new AggregateError([new Error('connect ECONNREFUSED')]) });
  } }), /connect ECONNREFUSED/);
});

test('an idle transfer reports one true cause and keeps its prefix', async t => {
  const f = await fixture(t, (_request, response) => { response.writeHead(200, { 'Content-Length': bytes.length }); response.write(bytes.subarray(0, 1000)); });
  await assert.rejects(downloadDriverArchive(f.url, { ...f, sources: [f.url], idleTimeoutMs: 100 }), error => {
    assert.match(error.message, /stalled.*1000 bytes are saved/);
    assert.doesNotMatch(error.message, /retry|reinstall/i);
    return true;
  });
  assert.equal((await stat(f.partialFile)).size, 1000);
});

test('a progressing slow body outlasts the idle interval without timing out', async t => {
  const f = await fixture(t, async (_request, response) => {
    response.writeHead(200, { 'Content-Length': bytes.length });
    for (let offset = 0; offset < bytes.length; offset += 2000) {
      response.write(bytes.subarray(offset, offset + 2000));
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    response.end();
  });
  assert.deepEqual(await downloadDriverArchive(f.url, { ...f, sources: [f.url], idleTimeoutMs: 150, transferTimeoutMs: 2000 }), bytes);
});

test('the transfer budget reports its own cause and preserves the downloaded prefix', async t => {
  const f = await fixture(t, (_request, response) => { response.writeHead(200, { 'Content-Length': bytes.length }); response.write(bytes.subarray(0, 1000)); });
  await assert.rejects(downloadDriverArchive(f.url, { ...f, sources: [f.url], idleTimeoutMs: 1000, transferTimeoutMs: 100 }), /exceeded 0.1 seconds/);
  assert.equal((await stat(f.partialFile)).size, 1000);
});

test('caller cancellation preserves progress and the next queued call can resume', async t => {
  let streaming;
  const started = new Promise(resolve => { streaming = resolve; });
  const f = await fixture(t, (request, response) => {
    if (!request.headers.range) {
      response.writeHead(200, { 'Content-Length': bytes.length }); response.write(bytes.subarray(0, 1000)); streaming();
    } else {
      const start = Number(/^bytes=(\d+)-$/.exec(request.headers.range)[1]);
      send(response, bytes.subarray(start), 206, { 'Content-Range': `bytes ${start}-${bytes.length - 1}/${bytes.length}` });
    }
  });
  const controller = new AbortController();
  const first = downloadDriverArchive(f.url, { ...f, sources: [f.url], signal: controller.signal });
  const rejected = assert.rejects(first, /cancelled by caller/);
  await started;
  // Wait for the persisted prefix, rather than assuming a socket write is already on disk.
  while (!(await stat(f.partialFile).catch(() => ({ size: 0 }))).size) await new Promise(resolve => setTimeout(resolve, 5));
  controller.abort(new Error('cancelled by caller'));
  const second = downloadDriverArchive(f.url, { ...f, sources: [f.url] });
  await rejected;
  assert.deepEqual(await second, bytes);
});

test('size limits and symlink cache entries refuse without touching an external target', async t => {
  const f = await fixture(t, (_request, response) => send(response));
  await assert.rejects(downloadDriverArchive(f.url, { ...f, sources: [f.url], maximum: 50 }), /size limit/);
  const target = f.partialFile + '.target'; await writeFile(target, 'do not change'); await symlink(target, f.partialFile);
  await assert.rejects(downloadDriverArchive(f.url, { ...f, sources: [f.url] }), /regular file/);
  assert.equal(await readFile(target, 'utf8'), 'do not change');
});
