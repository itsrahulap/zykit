import { describe, expect, it } from 'vitest';
import { checkFileSize, checkPixels, planResize, readImageSize, renameFile, resolveOutputType, sniffImageType } from '../../src/shared/lib/image';

const u8 = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)));
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

const PNG = u8([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a], be32(13), 'IHDR', be32(640), be32(480), [8, 6, 0, 0, 0]);
const GIF = u8('GIF89a', [0x20, 0x03, 0x58, 0x02]);
const BMP = u8('BM', new Array(16).fill(0), [0x10, 0, 0, 0], [0xf0, 0xff, 0xff, 0xff]);
const JPEG = u8([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 17, 8, 0x01, 0xe0, 0x02, 0x80, 3]);
const WEBP_X = u8('RIFF', [0, 0, 0, 0], 'WEBP', 'VP8X', [10, 0, 0, 0], [0, 0, 0, 0], [0x7f, 0x07, 0], [0x37, 0x04, 0]);

describe('sniffImageType', () => {
  it('identifies formats by magic bytes', () => {
    expect(sniffImageType(PNG)?.mime).toBe('image/png');
    expect(sniffImageType(JPEG)?.mime).toBe('image/jpeg');
    expect(sniffImageType(GIF)?.mime).toBe('image/gif');
    expect(sniffImageType(WEBP_X)?.mime).toBe('image/webp');
    expect(sniffImageType(BMP)?.mime).toBe('image/bmp');
    expect(sniffImageType(u8([0, 0, 1, 0, 1, 0]))?.label).toBe('ICO');
    expect(sniffImageType(u8('II', [0x2a, 0])))?.toMatchObject({ label: 'TIFF' });
    expect(sniffImageType(u8(be32(24), 'ftypavif', be32(0), 'mif1miaf'))?.mime).toBe('image/avif');
    expect(sniffImageType(u8(be32(24), 'ftypheic', be32(0), 'mif1heic'))?.mime).toBe('image/heic');
    expect(sniffImageType(u8(be32(20), 'ftypmif1', be32(0), 'avif'))?.mime).toBe('image/avif');
    expect(sniffImageType(new TextEncoder().encode('\uFEFF<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"/>'))?.mime).toBe('image/svg+xml');
    expect(sniffImageType(u8('<html><svg></svg></html>'))).toBeNull();
    expect(sniffImageType(u8('hello'))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe('readImageSize', () => {
  it('reads dimensions from headers', () => {
    expect(readImageSize(PNG)).toEqual({ width: 640, height: 480 });
    expect(readImageSize(GIF)).toEqual({ width: 800, height: 600 });
    expect(readImageSize(BMP)).toEqual({ width: 16, height: 16 });
    expect(readImageSize(JPEG)).toEqual({ width: 640, height: 480 });
    expect(readImageSize(WEBP_X)).toEqual({ width: 1920, height: 1080 });
    expect(readImageSize(u8('hello'))).toBeNull();
    expect(readImageSize(JPEG.subarray(0, 8))).toBeNull();
  });
});

describe('limits', () => {
  it('rejects files over 50 MB and images over 100 megapixels', () => {
    expect(() => checkFileSize(50 * 1024 * 1024)).not.toThrow();
    expect(() => checkFileSize(50 * 1024 * 1024 + 1)).toThrow(/up to 50 MB/);
    expect(() => checkPixels(10_000, 10_000)).not.toThrow();
    expect(() => checkPixels(10_001, 10_000)).toThrow(/100 megapixels/);
    expect(() => checkPixels(20_000, 100)).toThrow(/wider or taller/);
  });
});

describe('planResize', () => {
  it('max never enlarges and keeps the ratio', () => {
    expect(planResize(4000, 3000, { mode: 'max', maxWidth: 1000 })).toMatchObject({ width: 1000, height: 750 });
    expect(planResize(4000, 3000, { mode: 'max', maxWidth: 1000, maxHeight: 500 })).toMatchObject({ width: 667, height: 500 });
    expect(planResize(400, 300, { mode: 'max', maxWidth: 1000 })).toMatchObject({ width: 400, height: 300 });
  });

  it('exact, scale and box modes', () => {
    expect(planResize(400, 300, { mode: 'exact', height: 600 })).toMatchObject({ width: 800, height: 600 });
    expect(planResize(400, 300, { mode: 'scale', percent: 0.1 })).toMatchObject({ width: 1, height: 1 });
    expect(planResize(1000, 2000, { mode: 'box', width: 500, height: 500, fit: 'cover' })).toEqual({ width: 500, height: 500, sx: 0, sy: 500, sw: 1000, sh: 1000 });
    expect(planResize(1000, 2000, { mode: 'box', width: 500, height: 500, fit: 'fill' })).toMatchObject({ width: 500, height: 500, sw: 1000, sh: 2000 });
    expect(() => planResize(100, 100, { mode: 'scale', percent: 20_000 })).toThrow(/resized image/);
  });
});

describe('names and output types', () => {
  it('renames and resolves "same"', () => {
    expect(renameFile('a.b.png', 'image/webp', '-small')).toBe('a.b-small.webp');
    expect(renameFile('noext', 'image/jpeg')).toBe('noext.jpg');
    expect(resolveOutputType('image/gif', 'same', ['image/png', 'image/jpeg'])).toBe('image/png');
    expect(resolveOutputType('image/webp', 'same', ['image/png', 'image/webp'])).toBe('image/webp');
    expect(resolveOutputType('image/png', 'image/jpeg', [])).toBe('image/jpeg');
  });
});
