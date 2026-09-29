import { describe, expect, it } from 'vitest';
import { crc32 } from '../../src/shared/lib/crc32';
import { createZip, safeZipName, uniqueNames } from '../../src/shared/lib/zip';

interface Parsed {
  name: string;
  data: Uint8Array;
  crc: number;
  flags: number;
  method: number;
}

/** Re-read an archive through its central directory, cross-checking the local headers. */
function readZip(zip: Uint8Array): Parsed[] {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const eocd = zip.length - 22;
  expect(v.getUint32(eocd, true)).toBe(0x06054b50);
  const count = v.getUint16(eocd + 10, true);
  const cdSize = v.getUint32(eocd + 12, true);
  const cdStart = v.getUint32(eocd + 16, true);
  expect(cdStart + cdSize).toBe(eocd);
  const out: Parsed[] = [];
  let p = cdStart;
  for (let i = 0; i < count; i++) {
    expect(v.getUint32(p, true)).toBe(0x02014b50);
    const flags = v.getUint16(p + 8, true);
    const method = v.getUint16(p + 10, true);
    const crc = v.getUint32(p + 16, true);
    const size = v.getUint32(p + 20, true);
    expect(v.getUint32(p + 24, true)).toBe(size);
    const nameLen = v.getUint16(p + 28, true);
    const extra = v.getUint16(p + 30, true);
    const comment = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(zip.subarray(p + 46, p + 46 + nameLen));
    // Local header must agree.
    expect(v.getUint32(local, true)).toBe(0x04034b50);
    expect(v.getUint32(local + 14, true)).toBe(crc);
    expect(v.getUint32(local + 18, true)).toBe(size);
    const lNameLen = v.getUint16(local + 26, true);
    const lExtra = v.getUint16(local + 28, true);
    expect(new TextDecoder().decode(zip.subarray(local + 30, local + 30 + lNameLen))).toBe(name);
    const start = local + 30 + lNameLen + lExtra;
    out.push({ name, data: zip.subarray(start, start + size), crc, flags, method });
    p += 46 + nameLen + extra + comment;
  }
  expect(p).toBe(eocd);
  return out;
}

describe('ZIP writer', () => {
  it('writes stored entries that read back with matching CRCs', () => {
    const a = new TextEncoder().encode('hello zip');
    const b = new Uint8Array(70_000).map((_, i) => (i * 31) & 0xff);
    const files = readZip(createZip([{ name: 'a.txt', data: a }, { name: 'dir/b.bin', data: b }, { name: 'empty', data: new Uint8Array() }]));
    expect(files.map((f) => f.name)).toEqual(['a.txt', 'dir/b.bin', 'empty']);
    expect([...files[0].data]).toEqual([...a]);
    expect(files[1].data.length).toBe(70_000);
    for (const f of files) {
      expect(f.crc).toBe(crc32(f.data));
      expect(f.method).toBe(0);
      expect(f.flags & 0x0800).toBe(0x0800);
    }
  });

  it('stores UTF-8 names and deduplicates them', () => {
    const files = readZip(createZip(['café 📷.jpg', 'photo.jpg', 'PHOTO.jpg', 'photo.jpg'].map((name) => ({ name, data: new Uint8Array([1]) }))));
    expect(files.map((f) => f.name)).toEqual(['café 📷.jpg', 'photo.jpg', 'PHOTO (2).jpg', 'photo (3).jpg']);
  });

  it('encodes the DOS date', () => {
    const zip = createZip([{ name: 'a', data: new Uint8Array(), date: new Date(2024, 4, 17, 13, 45, 30) }]);
    const v = new DataView(zip.buffer);
    expect(v.getUint16(10, true)).toBe((13 << 11) | (45 << 5) | 15);
    expect(v.getUint16(12, true)).toBe(((2024 - 1980) << 9) | (5 << 5) | 17);
  });

  it('writes a valid empty archive', () => {
    const zip = createZip([]);
    expect(zip.length).toBe(22);
    expect(readZip(zip)).toEqual([]);
  });

  it('sanitises paths', () => {
    expect(safeZipName('../../etc/passwd')).toBe('etc/passwd');
    expect(safeZipName('C:\\Users\\x.png')).toBe('C:/Users/x.png');
    expect(safeZipName('/abs/./a\u0000b.png')).toBe('abs/ab.png');
    expect(safeZipName('..')).toBe('file');
    expect(uniqueNames(['a', 'a', 'a'])).toEqual(['a', 'a (2)', 'a (3)']);
  });
});
