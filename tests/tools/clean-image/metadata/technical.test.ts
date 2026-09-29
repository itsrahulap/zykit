import { describe, expect, it } from 'vitest';
import { analyzeImage } from '../../../../src/tools/clean-image/features/metadata/metadata.service';
import { adler32, computeChecksums, headAscii, md5 } from '../../../../src/shared/lib/hash';
import { crc32 } from '../../../../src/shared/lib/crc32';
import { buildJpeg, buildPng, buildWebp, bytes } from '../fixtures/builders';

describe('checksums', () => {
  it('match published test vectors', async () => {
    expect(md5(bytes(''))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5(bytes('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5(bytes('a'.repeat(1000)))).toBe('cabe45dcc9ae5b66ba86600cca6b8ba8');
    expect(adler32(bytes('Wikipedia')).toString(16)).toBe('11e60398');
    expect(crc32(bytes('123456789')).toString(16)).toBe('cbf43926');
    const c = await computeChecksums(bytes('abc'));
    expect(c.sha1).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(c.sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('renders an ASCII preview with dots for non-printable bytes', () => {
    expect(headAscii(new Uint8Array([0xff, 0xd8, 0x4a, 0x46, 0x49, 0x46, 0x00]))).toBe('..JFIF.');
  });

  it('are attached to every report', async () => {
    const r = await analyzeImage(buildJpeg());
    expect(r.file.checksums.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.file.headHex.startsWith('ff d8 ff e0')).toBe(true);
  });
});

describe('technical details', () => {
  const tech = async (b: Uint8Array) => Object.fromEntries((await analyzeImage(b)).technical.map((t) => [t.key, t.value]));

  it('describes JPEG encoding and JFIF header', async () => {
    expect(await tech(buildJpeg())).toMatchObject({
      'Encoding process': 'Baseline DCT, Huffman coding',
      'Bits per sample': '8',
      'Color components': '3',
      'YCbCr subsampling': '4:2:0 (2 2)',
      'JFIF version': '1.01',
      'Resolution unit': 'None (aspect ratio only)',
      'Adobe color transform': 'YCbCr',
    });
  });

  it('describes PNG encoding', async () => {
    expect(await tech(buildPng())).toMatchObject({ 'Bit depth': '8', 'Color type': 'RGB with alpha', Interlace: 'None', Gamma: '0.45455' });
  });

  it('describes WebP encoding', async () => {
    expect(await tech(buildWebp())).toMatchObject({ Container: 'Extended (VP8X)', Compression: 'Lossless (VP8L)', 'Alpha channel': 'Yes' });
  });
});

describe('AI disclosure labels', () => {
  it('reports human-readable AI labels as declared', async () => {
    const { minimalPng, buildPngChunkRaw, cat } = await import('../fixtures/builders');
    const r = await analyzeImage(minimalPng([buildPngChunkRaw('tEXt', cat(bytes('Credit\0'), bytes('Made with Google AI')))]));
    expect(r.signals.find((s) => s.title === 'AI disclosure label found')?.level).toBe('declared');
    expect(r.entries[0].generatorRelated).toBe(true);
  });
});
