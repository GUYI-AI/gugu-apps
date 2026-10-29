import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { sampleNativePng } from '../app/program/program-core.mjs';
test('sampling compares actual pixels independent of PNG compression and rejects malformed captures', () => {
  const image = new PNG({ width: 256, height: 128 }); image.data.fill(128);
  const encode = level => PNG.sync.write(image, { deflateLevel: level }).toString('base64');
  const original = sampleNativePng(encode(1));
  assert.equal(original.length, 128 * 64 * 4); assert.deepEqual(original, sampleNativePng(encode(9)));
  image.data[0] = 0; assert.notDeepEqual(original, sampleNativePng(encode(1)));
  assert.throws(() => sampleNativePng(Buffer.from('invalid').toString('base64')), /PNG/);
});
