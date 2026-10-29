import { gzipSync, deflateRawSync } from 'node:zlib';
export function mach(arch = 'arm64') {
  const bytes = Buffer.alloc(64);
  bytes.writeUInt32LE(0xfeedfacf, 0);
  bytes.writeUInt32LE(arch === 'arm64' ? 0x0100000c : 0x01000007, 4);
  return bytes;
}
export function tar(entries) {
  const parts = [];
  for (const { name, bytes = Buffer.alloc(0), type = '0' } of entries) {
    const header = Buffer.alloc(512);
    header.write(name); header.write('0000700\0', 100); header.write(bytes.length.toString(8).padStart(11, '0') + '\0', 124);
    header.fill(32, 148, 156); header.write(type, 156); header.write('ustar\0', 257);
    header.write(header.reduce((a, b) => a + b, 0).toString(8).padStart(6, '0') + '\0 ', 148);
    parts.push(header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512));
  }
  return gzipSync(Buffer.concat([...parts, Buffer.alloc(1024)]));
}
export function zip(name, bytes, mode = 0o100700) {
  const filename = Buffer.from(name), data = deflateRawSync(bytes);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(8, 8); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(filename.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(0x0314, 4); central.writeUInt16LE(8, 10); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(bytes.length, 24); central.writeUInt16LE(filename.length, 28); central.writeUInt32LE((mode << 16) >>> 0, 38);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(central.length + filename.length, 12); end.writeUInt32LE(local.length + filename.length + data.length, 16);
  return Buffer.concat([local, filename, data, central, filename, end]);
}
