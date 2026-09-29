import { describe, expect, it } from 'vitest';
import { walkWebp } from '../../src/features/formats/webp.structure';
import { analyzeImage } from '../../src/features/metadata/metadata.service';
import { cleanImage } from '../../src/features/pipeline';
import { sanitizeWebp } from '../../src/features/sanitizer/webp.sanitizer';
import { readU32LE } from '../../src/lib/bytes';
import { buildWebp } from '../fixtures/builders';

const flagsOf = (b: Uint8Array) => b[20];

describe('WebP', () => {
  it('reads canvas size and metadata chunks', async () => {
    const r = await analyzeImage(buildWebp());
    expect([r.width, r.height]).toEqual([100, 50]);
    expect(r.orientation).toBe(8);
    expect(r.blocks.map((b) => b.location)).toEqual(['ICCP chunk', 'EXIF chunk', 'XMP chunk', 'C2PA chunk', 'ABCD chunk (unknown)']);
    expect(r.entries.find((e) => e.key === 'claim_generator')?.value).toBe('WebpGen/3.0');
  });

  it('privacy mode updates VP8X flags and RIFF size', () => {
    const out = sanitizeWebp(buildWebp(), { mode: 'privacy', preserveOrientation: true }).bytes;
    expect(walkWebp(out).chunks.map((c) => c.fourcc)).toEqual(['VP8X', 'ICCP', 'ALPH', 'VP8L', 'EXIF']);
    expect(flagsOf(out)).toBe(0x20 | 0x10 | 0x08); // ICC, alpha, EXIF (orientation only)
    expect(readU32LE(out, 4)).toBe(out.length - 8);
  });

  it('all mode clears every metadata flag except alpha', () => {
    const out = sanitizeWebp(buildWebp(), { mode: 'all', preserveOrientation: false }).bytes;
    expect(walkWebp(out).chunks.map((c) => c.fourcc)).toEqual(['VP8X', 'ALPH', 'VP8L']);
    expect(flagsOf(out)).toBe(0x10);
  });

  it('leaves a metadata-free file unchanged', () => {
    const input = buildWebp({ withMeta: false });
    const out = sanitizeWebp(input, { mode: 'all', preserveOrientation: true }).bytes;
    expect(Array.from(out)).toEqual(Array.from(input));
  });

  it('pipeline passes verification', async () => {
    const res = await cleanImage(buildWebp(), { mode: 'privacy', preserveOrientation: true });
    expect(res.validation.ok).toBe(true);
    expect(res.cleaned.orientation).toBe(8);
  });
});
