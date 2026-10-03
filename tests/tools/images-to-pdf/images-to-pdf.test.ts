import { deflateSync } from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { crc32 } from '../../../src/shared/lib/crc32';
import {
  buildPdf,
  BuildError,
  classifyImage,
  DEFAULT_LAYOUT,
  EMPTY_METADATA,
  exifOrientation,
  MARGINS,
  moveItem,
  normRotation,
  orientationTransform,
  outputName,
  PAGE_SIZES,
  planPage,
  PX_TO_PT,
  type LayoutOptions,
} from '../../../src/tools/images-to-pdf/features/images-to-pdf';

/** A solid-colour RGB PNG. */
function makePng(w: number, h: number): Uint8Array {
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const v = new DataView(out.buffer);
    v.setUint32(0, data.length);
    out.set(new TextEncoder().encode(type), 4);
    out.set(data, 8);
    v.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
    return out;
  };
  const ihdr = new Uint8Array(13);
  const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, w);
  iv.setUint32(4, h);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w * 3; x++) raw[y * (w * 3 + 1) + 1 + x] = 200;
  const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())];
  return Uint8Array.from(parts.flatMap((p) => [...p]));
}

/** A JPEG skeleton (headers only) that pdf-lib can embed; `orientation` adds an EXIF tag. */
function makeJpeg(w: number, h: number, orientation?: number): Uint8Array {
  const sof = [0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0];
  let exif: number[] = [];
  if (orientation) {
    const tiff = [0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, orientation, 0, 0, 0, 0, 0, 0, 0];
    const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
    exif = [0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 255, ...body];
  }
  return new Uint8Array([0xff, 0xd8, ...exif, ...sof, 0xff, 0xd9]);
}

const layout = (o: Partial<LayoutOptions> = {}): LayoutOptions => ({ ...DEFAULT_LAYOUT, ...o });

describe('helpers', () => {
  it('normalises rotation and moves items', () => {
    expect(normRotation(-90)).toBe(270);
    expect(normRotation(450)).toBe(90);
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
  });

  it('names the output file', () => {
    expect(outputName('')).toBe('images.pdf');
    expect(outputName('Trip photos.PDF')).toBe('Trip photos.pdf');
    expect(outputName('a/b:c')).toBe('a_b_c.pdf');
    expect(outputName('..hidden')).toBe('hidden.pdf');
  });
});

describe('EXIF and format', () => {
  it('reads the orientation tag', () => {
    expect(exifOrientation(makeJpeg(4, 2))).toBe(1);
    expect(exifOrientation(makeJpeg(4, 2, 6))).toBe(6);
    expect(exifOrientation(makeJpeg(4, 2, 9))).toBe(1);
    expect(exifOrientation(new Uint8Array([1, 2, 3]))).toBe(1);
    expect(orientationTransform(6)).toEqual({ rotation: 90, mirrored: false });
    expect(orientationTransform(8)).toEqual({ rotation: 270, mirrored: false });
    expect(orientationTransform(4).mirrored).toBe(true);
  });

  it('embeds JPEG and PNG directly and converts the rest', () => {
    expect(classifyImage(makeJpeg(4, 2))).toMatchObject({ mode: 'jpeg', baseRotation: 0 });
    expect(classifyImage(makeJpeg(4, 2, 6))).toMatchObject({ mode: 'jpeg', baseRotation: 90 });
    expect(classifyImage(makeJpeg(4, 2, 2))?.mode).toBe('convert');
    expect(classifyImage(makePng(2, 2))?.mode).toBe('png');
    expect(classifyImage(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))?.mode).toBe('convert');
    expect(classifyImage(new TextEncoder().encode('GIF89a......'))?.mode).toBe('convert');
    expect(classifyImage(new TextEncoder().encode('hello world, not an image'))).toBeNull();
  });
});

describe('planPage', () => {
  it('fits a landscape image on an A4 landscape page, centred inside the margins', () => {
    const p = planPage(2000, 1000, 0, layout());
    expect([p.pageW, p.pageH]).toEqual([PAGE_SIZES.a4[1], PAGE_SIZES.a4[0]]);
    const m = MARGINS.small;
    expect(p.width).toBeCloseTo(p.pageW - 2 * m);
    expect(p.height).toBeCloseTo(p.width / 2);
    expect(p.x).toBeCloseTo(m);
    expect(p.y).toBeCloseTo((p.pageH - p.height) / 2);
    expect(p.clip).toBeUndefined();
  });

  it('honours orientation and page size', () => {
    expect(planPage(2000, 1000, 0, layout({ orientation: 'portrait' })).pageH).toBeCloseTo(PAGE_SIZES.a4[1]);
    expect(planPage(1000, 2000, 0, layout({ orientation: 'landscape', size: 'letter' })).pageW).toBe(792);
    expect(planPage(1000, 2000, 0, layout({ size: 'legal' })).pageH).toBe(1008);
  });

  it('cover fills the page area and clips', () => {
    const p = planPage(2000, 1000, 0, layout({ fit: 'cover', orientation: 'portrait', margin: 'none' }));
    expect(p.height).toBeCloseTo(p.pageH);
    expect(p.width).toBeGreaterThan(p.pageW);
    expect(p.clip).toEqual({ x: 0, y: 0, w: p.pageW, h: p.pageH });
  });

  it('fit-to-image makes the page the image plus margins at 96 dpi', () => {
    const p = planPage(800, 400, 0, layout({ size: 'fit', margin: 'none' }));
    expect(p.pageW).toBeCloseTo(800 * PX_TO_PT);
    expect(p.pageH).toBeCloseTo(400 * PX_TO_PT);
    expect(p.x).toBeCloseTo(0);
    const huge = planPage(100_000, 50_000, 0, layout({ size: 'fit', margin: 'none' }));
    expect(Math.max(huge.pageW, huge.pageH)).toBeLessThanOrEqual(14_400.001);
  });

  it('rotation swaps the shape and places the rotation origin at the right corner', () => {
    const l = layout({ size: 'fit', margin: 'none' });
    const r90 = planPage(800, 400, 90, l);
    expect(r90.pageW).toBeCloseTo(400 * PX_TO_PT);
    expect(r90.pageH).toBeCloseTo(800 * PX_TO_PT);
    expect(r90.rotate).toBe(270);
    expect(r90.x).toBeCloseTo(0);
    expect(r90.y).toBeCloseTo(r90.pageH); // top-left corner; drawn image is wide, turned to tall
    expect(r90.width).toBeCloseTo(r90.pageH);
    const r180 = planPage(800, 400, 180, l);
    expect([r180.x, r180.y]).toEqual([r180.pageW, r180.pageH]);
    const r270 = planPage(800, 400, 270, l);
    expect(r270.rotate).toBe(90);
    expect(r270.x).toBeCloseTo(r270.pageW);
    expect(r270.y).toBeCloseTo(0);
  });
});

describe('buildPdf', () => {
  it('writes one page per image, with no producer or dates', async () => {
    const out = await buildPdf(
      [
        { bytes: makePng(40, 20), kind: 'png', rotation: 0 },
        { bytes: makeJpeg(20, 40), kind: 'jpeg', rotation: 90 },
        { bytes: makePng(10, 10), kind: 'png', rotation: 0 },
      ],
      layout(),
      EMPTY_METADATA,
    );
    const doc = await PDFDocument.load(out, { updateMetadata: false });
    expect(doc.getPageCount()).toBe(3);
    expect(doc.getProducer()).toBeUndefined();
    expect(doc.getCreator()).toBeUndefined();
    expect(doc.getCreationDate()).toBeUndefined();
    expect(doc.getTitle()).toBeUndefined();
    const text = new TextDecoder('latin1').decode(out);
    expect(text).not.toMatch(/pdf-lib|\/Producer|\/Author/i);
    const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
    expect(w).toBeCloseTo(PAGE_SIZES.a4[1]);
    expect(h).toBeCloseTo(PAGE_SIZES.a4[0]);
  });

  it('adds only the metadata that was typed and reports progress', async () => {
    const seen: number[] = [];
    const out = await buildPdf([{ bytes: makePng(4, 4), kind: 'png', rotation: 0 }, { bytes: makePng(4, 4), kind: 'png', rotation: 0 }], layout({ size: 'fit' }), { title: ' Trip ', author: '', subject: '', keywords: 'a, b,,c' }, (d) => seen.push(d));
    const doc = await PDFDocument.load(out, { updateMetadata: false });
    expect(doc.getTitle()).toBe('Trip');
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getKeywords()).toBe('a b c');
    expect(seen).toEqual([1, 2]);
  });

  it('draws cover images inside a clip', async () => {
    const out = await buildPdf([{ bytes: makePng(40, 20), kind: 'png', rotation: 0 }], layout({ fit: 'cover' }), EMPTY_METADATA);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
  });

  it('names the image that could not be embedded', async () => {
    await expect(buildPdf([{ bytes: makePng(4, 4), kind: 'png', rotation: 0 }, { bytes: new Uint8Array([1, 2, 3]), kind: 'png', rotation: 0 }], layout(), EMPTY_METADATA)).rejects.toMatchObject({ index: 1 });
    expect(BuildError).toBeDefined();
  });
});
