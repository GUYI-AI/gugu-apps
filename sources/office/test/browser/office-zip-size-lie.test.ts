import { afterEach, describe, expect, it } from 'vitest';

/**
 * 咕咕办公's page reads a .pptx / .xlsx's parts itself (skills/office/lib/ooxml-read.js, partTexts / openParts), each
 * entry inflated by the browser's DecompressionStream to no more than the size the zip says. In a real Chromium (review
 * of 83b1a43159): its DecompressionStream inflates a chunk it is given whole and queues all of it before a reader has the
 * first piece — fed an entry at once, a 1 GiB entry whose zip says 100 bytes took +1.2 GB in the renderer before the page
 * refused it. Fed 16 KiB at a time as it is read, the refusal comes after the first slices. Proved here by what was fed:
 * the bytes DecompressionStream was given before the page refused (the renderer's memory itself is read by pid outside
 * the test, as the review did). jsdom and node cannot show this: node's DecompressionStream keeps to backpressure.
 */

type Lib = { partTexts(bytes: Uint8Array, wanted: RegExp): Promise<(name: string) => string | null> };
// @ts-expect-error — 内置 App 是不经构建的纯 ES module,没有类型;运行时 import 可用。
const lib = (await import('../../app/skills/office/lib/ooxml-read.js')) as Lib;

/** Deflated (raw): `size` bytes of `byte`, made a MiB at a time — or the bytes given. */
type Bytes = Uint8Array<ArrayBuffer>;
async function deflate(what: { size: number; byte: number } | Bytes): Promise<Bytes> {
  let source: ReadableStream<Bytes>;
  if (what instanceof Uint8Array) source = new Blob([what]).stream();
  else {
    let at = 0;
    source = new ReadableStream<Bytes>({
      pull(controller) {
        if (at >= what.size) return controller.close();
        const n = Math.min(1 << 20, what.size - at);
        controller.enqueue(new Uint8Array(n).fill(what.byte));
        at += n;
      },
    });
  }
  return new Uint8Array(await new Response(source.pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
}

/** A zip of one deflated entry `name`, its directory saying it unpacks to `said` bytes (its CRC not checked here). */
function zipOf(name: string, data: Bytes, said: number): Bytes {
  const file = new TextEncoder().encode(name);
  const local = new DataView(new ArrayBuffer(30));
  local.setUint32(0, 0x04034b50, true);
  local.setUint16(4, 20, true);
  local.setUint16(8, 8, true);
  local.setUint32(18, data.length, true);
  local.setUint32(22, said, true);
  local.setUint16(26, file.length, true);
  const central = new DataView(new ArrayBuffer(46));
  central.setUint32(0, 0x02014b50, true);
  central.setUint16(4, 20, true);
  central.setUint16(6, 20, true);
  central.setUint16(10, 8, true);
  central.setUint32(20, data.length, true);
  central.setUint32(24, said, true);
  central.setUint16(28, file.length, true);
  const cdAt = 30 + file.length + data.length;
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, 1, true);
  end.setUint16(10, 1, true);
  end.setUint32(12, 46 + file.length, true);
  end.setUint32(16, cdAt, true);
  const parts = [new Uint8Array(local.buffer), file, data, new Uint8Array(central.buffer), file, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** The browser's DecompressionStream, counting the deflate data it is given (the page makes one per entry). */
const Original = globalThis.DecompressionStream;
let fed = 0;
function countFed() {
  fed = 0;
  globalThis.DecompressionStream = class {
    readonly readable: ReadableStream<Bytes>;
    readonly writable: WritableStream<Bytes>;
    constructor(format: CompressionFormat) {
      const inner = new Original(format);
      const counting = new TransformStream<Bytes, Bytes>({
        transform(chunk, controller) {
          fed += chunk.byteLength;
          controller.enqueue(chunk);
        },
      });
      counting.readable.pipeTo(inner.writable).catch(() => {});
      this.readable = inner.readable;
      this.writable = counting.writable;
    }
  } as unknown as typeof DecompressionStream;
}
afterEach(() => {
  globalThis.DecompressionStream = Original;
});

describe('咕咕办公 · a part whose zip lies about its size, in Chromium', () => {
  it('1 GiB said to be 100 bytes: refused, naming it — after a few slices of its deflate data, not all of it', async () => {
    const data = await deflate({ size: 1 << 30, byte: 0x20 });
    expect(data.length).toBeGreaterThan(32 * 16384);
    const zip = zipOf('big.xml', data, 100);
    countFed();
    await expect(lib.partTexts(zip, /^big\.xml$/)).rejects.toThrow(/^big\.xml unpacks to more than the 100 bytes its zip says: the file is damaged or forged$/);
    // Fed whole (as before), `fed` is all of it: about 1 MB.
    expect(fed).toBeLessThanOrEqual(4 * 16384);
  });

  it('an honest part bigger than a slice reads whole, the same text', async () => {
    // Letters at random (xorshift32): little to compress, so its deflate data runs to several slices.
    const plain = new Uint8Array(300_000);
    let state = 2463534242;
    for (let i = 0; i < plain.length; i += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      plain[i] = 0x61 + ((state >>> 0) % 26);
    }
    const data = await deflate(plain);
    expect(data.length).toBeGreaterThan(3 * 16384);
    countFed();
    const text = (await lib.partTexts(zipOf('part.xml', data, plain.length), /^part\.xml$/))('part.xml')!;
    expect(fed).toBe(data.length);
    expect(text).toBe(new TextDecoder().decode(plain));
  });
});
