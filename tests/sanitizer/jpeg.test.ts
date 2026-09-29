import { describe, expect, it } from 'vitest';
import { walkJpeg } from '../../src/features/formats/jpeg.structure';
import { analyzeImage } from '../../src/features/metadata/metadata.service';
import { cleanImage } from '../../src/features/pipeline';
import { sanitizeJpeg } from '../../src/features/sanitizer/jpeg.sanitizer';
import { imageDataIdentical } from '../../src/features/validation/image-data';
import { buildJpeg, bytes, cat, jpegImageSegments, jpegSegment } from '../fixtures/builders';

const find = (r: Awaited<ReturnType<typeof analyzeImage>>, key: string) => r.entries.find((e) => e.key === key);

describe('JPEG inspection', () => {
  it('reads dimensions, orientation and every metadata container', async () => {
    const r = await analyzeImage(buildJpeg());
    expect(r.format).toBe('jpeg');
    expect([r.width, r.height]).toEqual([640, 480]);
    expect(r.orientation).toBe(6);
    expect(r.summary).toMatchObject({ hasExif: true, hasXmp: true, hasIptc: true, hasC2pa: true, hasGeneratorRelatedData: true });
    expect(r.blocks.map((b) => b.location)).toEqual([
      'APP0 (JFIF header)',
      'APP1 (EXIF)',
      'APP1 (XMP)',
      'APP2 (ICC profile)',
      'APP13 (Photoshop IRB)',
      'APP11 (JUMBF / C2PA)',
      'COM segment',
      'APP14 (Adobe color transform)',
      'Data after end of image',
    ]);
  });

  it('parses EXIF, GPS, XMP, IPTC, ICC, comments and C2PA', async () => {
    const r = await analyzeImage(buildJpeg());
    expect(find(r, 'Make')).toMatchObject({ value: 'ExampleCam', sensitive: true });
    expect(find(r, 'Software')).toMatchObject({ value: 'Example Editor 2.0', generatorRelated: true });
    expect(find(r, 'Orientation')?.value).toBe('6 (Rotated 90° CW)');
    expect(find(r, 'GPSLatitude')?.value).toBe(`48° 51' 29.4" (48.858167)`);
    expect(find(r, 'DateTimeOriginal')?.value).toBe('2024:05:01 10:20:30');
    expect(find(r, 'xmp:CreatorTool')).toMatchObject({ value: 'Example AI Tool', generatorRelated: true });
    expect(find(r, 'dc:creator')?.value).toBe('Jane Doe; John Roe');
    expect(find(r, 'By-line')).toMatchObject({ category: 'IPTC', value: 'Jane Doe' });
    expect(find(r, 'Keywords')?.value).toBe('kw1; kw2');
    expect(find(r, 'City')?.value).toBe('Paris');
    expect(find(r, 'ICCProfile')?.value).toContain('Test RGB Profile');
    expect(find(r, 'Comment')?.value).toBe('Generated using Example Generator');
    expect(find(r, 'claim_generator')?.value).toBe('TestGen/1.0');
  });

  it('reports explicit AI declarations only from standardized fields', async () => {
    const r = await analyzeImage(buildJpeg());
    const declared = r.signals.filter((s) => s.level === 'declared').map((s) => s.title);
    expect(declared).toContain('Digital source type declared');
    expect(declared).toContain('Content Credentials (C2PA) present');
  });

  it('keeps metadata values as inert text', async () => {
    const r = await analyzeImage(buildJpeg());
    expect(find(r, 'dc:description')?.value).toBe('<script>alert(1)</script>');
  });
});

describe('JPEG sanitization', () => {
  it('privacy mode removes everything except ICC, JFIF, Adobe and orientation', async () => {
    const input = buildJpeg();
    const { bytes: out } = sanitizeJpeg(input, { mode: 'privacy', preserveOrientation: true });
    const r = await analyzeImage(out);
    expect(r.blocks.map((b) => b.location)).toEqual([
      'APP0 (JFIF header)',
      'APP1 (EXIF)',
      'APP2 (ICC profile)',
      'APP14 (Adobe color transform)',
    ]);
    expect(r.entries.filter((e) => e.category === 'EXIF').map((e) => e.key)).toEqual(['Orientation']);
    expect(r.orientation).toBe(6);
    expect(r.signals).toEqual([]);
    expect(imageDataIdentical('jpeg', input, out)).toBe(true);
    expect(walkJpeg(out).eoiEnd).toBe(out.length); // trailing data gone
  });

  it('all mode removes ICC too, and orientation can be dropped', async () => {
    const out = sanitizeJpeg(buildJpeg(), { mode: 'all', preserveOrientation: false }).bytes;
    const r = await analyzeImage(out);
    expect(r.blocks.map((b) => b.location)).toEqual(['APP0 (JFIF header)', 'APP14 (Adobe color transform)']);
    expect(r.entries.filter((e) => e.removable)).toEqual([]);
  });

  it('output equals SOI + kept segments exactly', () => {
    const out = sanitizeJpeg(buildJpeg({ trailing: false }), { mode: 'all', preserveOrientation: false }).bytes;
    const jfif = jpegSegment(0xe0, cat(bytes('JFIF\0'), [1, 1, 0, 0, 1, 0, 1, 0, 0]));
    const adobe = jpegSegment(0xee, cat(bytes('Adobe'), [0, 100, 0, 0, 0, 0, 1]));
    expect(Array.from(out)).toEqual(Array.from(cat([0xff, 0xd8], jfif, adobe, ...jpegImageSegments())));
  });

  it('does not add orientation when the original is upright', async () => {
    const out = sanitizeJpeg(buildJpeg({ orientation: 1 }), { mode: 'privacy', preserveOrientation: true }).bytes;
    expect((await analyzeImage(out)).summary.hasExif).toBe(false);
  });

  it('is idempotent', () => {
    const opts = { mode: 'privacy' as const, preserveOrientation: true };
    const once = sanitizeJpeg(buildJpeg(), opts).bytes;
    const twice = sanitizeJpeg(once, opts).bytes;
    expect(Array.from(twice)).toEqual(Array.from(once));
  });

  it('full pipeline verifies its own output', async () => {
    const res = await cleanImage(buildJpeg(), { mode: 'privacy', preserveOrientation: true });
    expect(res.validation.ok).toBe(true);
    const status = Object.fromEntries(res.validation.checks.map((c) => [c.id, c.status]));
    expect(status).toMatchObject({ dimensions: 'pass', 'image-data': 'pass', 'metadata-removed': 'pass', orientation: 'pass', decode: 'skipped' });
    expect(res.diff.removed.some((e) => e.key === 'GPSLatitude')).toBe(true);
    expect(res.diff.retained.map((e) => e.key).sort()).toEqual(['ICCProfile', 'Orientation']);
    expect(res.diff.added).toEqual([]);
  });

  it('warns when orientation is dropped on purpose', async () => {
    const res = await cleanImage(buildJpeg(), { mode: 'all', preserveOrientation: false });
    expect(res.validation.checks.find((c) => c.id === 'orientation')?.status).toBe('warn');
    expect(res.validation.ok).toBe(true);
  });
});
