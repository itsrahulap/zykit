import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { walkPng } from '../../src/features/formats/png.structure';
import { analyzeImage } from '../../src/features/metadata/metadata.service';
import { cleanImage } from '../../src/features/pipeline';
import { sanitizePng } from '../../src/features/sanitizer/png.sanitizer';
import { buildPng, buildPngChunkRaw, bytes, cat, minimalPng } from '../fixtures/builders';

describe('PNG inspection', () => {
  it('reads text, compressed text, XMP, eXIf, iCCP, tIME, C2PA and private chunks', async () => {
    const r = await analyzeImage(buildPng());
    expect([r.width, r.height]).toEqual([2, 2]);
    expect(r.orientation).toBe(3);
    const get = (k: string) => r.entries.find((e) => e.key === k);
    expect(get('parameters')).toMatchObject({ category: 'PNG_TEXT', generatorRelated: true });
    expect(get('Comment')?.value).toBe('made with a secret tool');
    expect(get('Author')?.value).toBe('Jöhn Dœ');
    expect(get('xmp:CreatorTool')?.category).toBe('XMP');
    expect(get('GPSLongitude')?.category).toBe('EXIF');
    expect(get('ICCProfile')?.value).toContain('Test RGB Profile');
    expect(get('ModificationTime')?.value).toBe('2024-05-01 10:20:30 UTC');
    expect(get('claim_generator')?.value).toBe('PngGen/2.0');
    expect(get('Chunk vpAg')).toBeDefined();
    expect(get('TrailingData')?.value).toBe('8 bytes');
    expect(r.signals.map((s) => s.title)).toContain('Image-generation parameters found');
  });

  it('caps decompression of oversized compressed text chunks', async () => {
    const bomb = buildPngChunkRaw('zTXt', cat(bytes('Comment\0'), [0], deflateSync(new Uint8Array(20 * 1024 * 1024))));
    const r = await analyzeImage(minimalPng([bomb]));
    expect(r.warnings.some((w) => w.includes('only the first part'))).toBe(true);
    expect(r.entries[0].value.length).toBeLessThan(2100);
  });
});

describe('PNG sanitization', () => {
  it('privacy mode keeps only image chunks, iCCP and an orientation eXIf', async () => {
    const input = buildPng();
    const { bytes: out } = sanitizePng(input, { mode: 'privacy', preserveOrientation: true });
    const st = walkPng(out);
    expect(st.chunks.map((c) => c.type)).toEqual(['IHDR', 'eXIf', 'iCCP', 'gAMA', 'IDAT', 'IEND']);
    expect(st.chunks.every((c) => c.crcValid)).toBe(true);
    expect(st.iendEnd).toBe(out.length);
    const r = await analyzeImage(out);
    expect(r.entries.map((e) => e.key).sort()).toEqual(['ICCProfile', 'Orientation']);
  });

  it('all mode leaves only decoding-critical chunks', () => {
    const out = sanitizePng(buildPng(), { mode: 'all', preserveOrientation: false }).bytes;
    expect(walkPng(out).chunks.map((c) => c.type)).toEqual(['IHDR', 'gAMA', 'IDAT', 'IEND']);
  });

  it('returns a byte-identical file when there is nothing to remove', () => {
    const input = minimalPng();
    const out = sanitizePng(input, { mode: 'all', preserveOrientation: true }).bytes;
    expect(Array.from(out)).toEqual(Array.from(input));
  });

  it('pipeline passes verification', async () => {
    const res = await cleanImage(buildPng(), { mode: 'privacy', preserveOrientation: true });
    expect(res.validation.ok).toBe(true);
    expect(res.validation.checks.find((c) => c.id === 'png-crc')?.status).toBe('pass');
    expect(res.validation.checks.find((c) => c.id === 'image-data')?.status).toBe('pass');
  });
});
