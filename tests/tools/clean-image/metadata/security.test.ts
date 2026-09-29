import { describe, expect, it } from 'vitest';
import { analyzeImage } from '../../../../src/tools/clean-image/features/metadata/metadata.service';
import { parseExif } from '../../../../src/tools/clean-image/features/metadata/exif.parser';
import { parseXmp } from '../../../../src/tools/clean-image/features/metadata/xmp.parser';
import { AppError } from '../../../../src/shared/lib/errors';
import { buildJpeg, buildPng, buildPngChunkRaw, buildWebp, bytes, cat, jpegImageSegments, minimalPng, pngIhdr } from '../fixtures/builders';

async function errorCode(input: Uint8Array) {
  try {
    await analyzeImage(input);
    return 'OK';
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    return (e as AppError).code;
  }
}

describe('hostile and malformed input', () => {
  it('rejects unknown and unsupported formats by magic bytes', async () => {
    expect(await errorCode(bytes('not an image at all'))).toBe('UNSUPPORTED_FORMAT');
    expect(await errorCode(bytes('GIF89a......'))).toBe('UNSUPPORTED_FORMAT');
    expect(await errorCode(new Uint8Array(0))).toBe('UNSUPPORTED_FORMAT');
  });

  it('rejects truncated files of every format', async () => {
    const jpeg = buildJpeg();
    expect(await errorCode(jpeg.subarray(0, 40))).toBe('CORRUPT');
    expect(await errorCode(buildPng().subarray(0, 60))).toBe('CORRUPT');
    expect(await errorCode(buildWebp().subarray(0, 40))).toBe('CORRUPT');
  });

  it('rejects invalid segment lengths', async () => {
    expect(await errorCode(cat([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x01], ...jpegImageSegments()))).toBe('CORRUPT');
  });

  it('rejects images over the pixel limit using only the header', async () => {
    const huge = cat(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      pngIhdr(20000, 20000),
      buildPngChunkRaw('IDAT', new Uint8Array([0])),
      buildPngChunkRaw('IEND', new Uint8Array()),
    );
    expect(await errorCode(huge)).toBe('TOO_MANY_PIXELS');
  });

  it('survives EXIF IFD loops and out-of-bounds offsets', () => {
    // IFD0 at 8 with one entry whose next-IFD pointer points back to itself.
    const loop = cat([0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8], [0, 1], [0x01, 0x0f, 0, 2, 0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0], [0, 0, 0, 8]);
    const res = parseExif(loop);
    expect(res.entries.length).toBeLessThanOrEqual(1);
    expect(parseExif(new Uint8Array([0x49, 0x49, 0x2a, 0, 0xff, 0xff, 0xff, 0x7f])).entries).toEqual([]);
  });

  it('truncates enormous metadata values and strips control characters', async () => {
    const big = 'A'.repeat(100_000) + '\u0007';
    const r = await analyzeImage(minimalPng([buildPngChunkRaw('tEXt', cat(bytes('Comment\0'), bytes(big)))]));
    const v = r.entries[0].value;
    expect(v.length).toBeLessThan(2100);
    expect(v).toContain('100,000 characters total');
    expect(v).not.toContain('\u0007');
  });

  it('decodes XML entities without interpreting markup', () => {
    const fields = parseXmp('<x:xmpmeta><rdf:Description dc:title="&lt;img src=x onerror=alert(1)&gt;"/></x:xmpmeta>');
    expect(fields).toEqual([{ key: 'dc:title', value: '<img src=x onerror=alert(1)>' }]);
  });

  it('tolerates malformed XMP', () => {
    expect(() => parseXmp('<rdf:Description><dc:creator><rdf:Seq><rdf:li>x</dc:creator>')).not.toThrow();
  });
});

describe('WebP structure rules', () => {
  it('rejects a VP8X header that is not the first chunk', async () => {
    const { riff, u32le } = await import('../fixtures/builders');
    const body = cat(riff('ALPH', [0]), riff('VP8X', new Array(10).fill(0)), riff('VP8L', [0x2f, 0, 0, 0, 0]));
    expect(await errorCode(cat(bytes('RIFF'), u32le(body.length + 4), bytes('WEBP'), body))).toBe('CORRUPT');
  });
});

describe('hidden image warnings', () => {
  it('warns about an embedded EXIF thumbnail and removes it when cleaning', async () => {
    const { buildTiff, minimalPng, buildPngChunkRaw } = await import('../fixtures/builders');
    const tiff = buildTiff([{ tag: 0x0131, type: 2, value: 'Cam' }], [], [], true);
    const input = minimalPng([buildPngChunkRaw('eXIf', tiff)]);
    const r = await analyzeImage(input);
    expect(r.entries.find((e) => e.key === 'EmbeddedThumbnail')?.value).toBe('Present (1234 bytes)');
    expect(r.warnings.some((w) => w.includes('an EXIF thumbnail'))).toBe(true);

    const { cleanImage } = await import('../../../../src/tools/clean-image/features/pipeline');
    const res = await cleanImage(input, { mode: 'privacy', preserveOrientation: true });
    expect(res.cleaned.warnings).toEqual([]);
    expect(res.diff.removed.map((e) => e.key)).toContain('EmbeddedThumbnail');
  });

  it('does not warn when there is no hidden image', async () => {
    const { minimalPng } = await import('../fixtures/builders');
    expect((await analyzeImage(minimalPng())).warnings).toEqual([]);
  });
});
