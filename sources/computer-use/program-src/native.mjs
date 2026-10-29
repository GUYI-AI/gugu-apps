import { prepareDriver, createCuaClient, createPermissionClient } from '../app/program/native-runtime.mjs';
import { PNG } from 'pngjs';

/** Compare pixels, not PNG compression or ancillary metadata. Native window captures are PNG. */
export function sampleNativePng(base64) {
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47) throw new Error('The native capture is not a PNG.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (!width || !height || width * height > 64 * 1024 * 1024) throw new Error('The native capture is too large.');
  const image = PNG.sync.read(bytes, { checkCRC: true });
  const scale = Math.min(1, 128 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  const sample = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const source = (Math.min(height - 1, Math.floor(y / scale)) * width + Math.min(width - 1, Math.floor(x / scale))) * 4;
    sample.set(image.data.subarray(source, source + 4), (y * w + x) * 4);
  }
  return sample;
}

/** Preparation subscribes per call; no caller's cancellation owns another caller's initialization. */
export function createProgramNative({ dataDir, bundleDir, platform = process.platform, arch = process.arch, log,
  prepare = prepareDriver, client = createCuaClient, settings = createPermissionClient }) {
  let native;
  let disposed = false;
  const lifetime = new AbortController();
  async function acquire(signal) {
    if (disposed || signal?.aborted) throw new Error('Computer Use has stopped.');
    if (native) return native;
    const activeSignal = signal ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal;
    const driver = await prepare({ dataDir, platform, arch, signal: activeSignal });
    if (disposed || activeSignal.aborted) throw new Error('Computer Use has stopped.');
    native ??= client({ binary: driver.binary, missingMessage: 'The Computer Use driver could not be prepared.', clientVersion: driver.revision,
      home: dataDir + '/driver-home', platform, sampleImage: sampleNativePng, log });
    return native;
  }
  return {
    settings: settings({ bundleDir, dataDir, platform, arch }),
    native: {
      async callTool(name, args, options = {}) {
        const driver = await acquire(options.signal);
        return driver.callTool(name, args, options);
      },
      dispose() { if (disposed) return; disposed = true; lifetime.abort(); native?.dispose(); },
    },
  };
}
