// Migrated sampling algorithm; decoding is owned and supplied by the App.
/** The App supplies its decoder; this is the minimal image interface used by the retained sampler. */
export interface DecodedImage {
  isEmpty(): boolean
  getSize(): { width: number; height: number }
  resize(options: { width: number; height: number; quality: string }): DecodedImage
  toBitmap(): Buffer
}

/** The App decoder normalizes native captures before sampling.
 * A small bitmap compares visible content rather than PNG metadata/compression. */
export function sampleCuaImage(decode: (bytes: Buffer) => DecodedImage, base64: string): Uint8Array {
  const image = decode(Buffer.from(base64, 'base64'))
  if (image.isEmpty()) throw new Error('The native screenshot could not be decoded')
  const { width, height } = image.getSize()
  const scale = Math.min(1, 128 / Math.max(width, height))
  return (scale < 1 ? image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), quality: 'good' }) : image).toBitmap()
}

/** Color conversion between capture backends can round one 8-bit level.
 * Larger visible changes reset the quiet interval. */
export function sameCuaImageSample(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, i) => Math.abs(value - b[i]!) <= 1)
}
