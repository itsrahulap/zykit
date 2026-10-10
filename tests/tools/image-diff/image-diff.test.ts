import { describe, expect, it } from 'vitest';
import { diffPixels, sameSize, targetSize } from '../../../src/tools/image-diff/features/diff';

const img = (w: number, h: number, f: (x: number, y: number) => number[]) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.set(f(x, y), (y * w + x) * 4);
  return d;
};
const gray = (v: number) => [v, v, v, 255];
const off = { tolerance: 0, ignoreAntiAlias: false };

describe('diffPixels', () => {
  const a = img(4, 3, () => gray(100));

  it('reports no change for identical images', () => {
    const r = diffPixels(a, a.slice(), 4, 3, off);
    expect(r).toMatchObject({ changed: 0, percent: 0, bbox: null, total: 12 });
  });

  it('counts changed pixels, percent and bounding box', () => {
    const b = img(4, 3, (x, y) => (x >= 1 && x <= 2 && y === 1 ? gray(200) : gray(100)));
    const r = diffPixels(a, b, 4, 3, off);
    expect(r.changed).toBe(2);
    expect(r.percent).toBeCloseTo(16.667, 2);
    expect(r.bbox).toEqual({ x: 1, y: 1, width: 2, height: 1 });
    expect(Array.from(r.diff.slice((1 * 4 + 1) * 4, (1 * 4 + 1) * 4 + 4))).toEqual([239, 68, 68, 255]);
  });

  it('applies tolerance (delta equal to tolerance is unchanged) and counts alpha', () => {
    const b = img(4, 3, (x) => (x === 0 ? [110, 100, 100, 255] : x === 1 ? [100, 100, 100, 200] : gray(100)));
    expect(diffPixels(a, b, 4, 3, { tolerance: 10, ignoreAntiAlias: false }).changed).toBe(3); // alpha delta 55 on column 1 only
    expect(diffPixels(a, b, 4, 3, { tolerance: 9, ignoreAntiAlias: false }).changed).toBe(6);
  });

  it('skips anti-aliased edge pixels only when asked', () => {
    const edge = (mid: number) => img(3, 3, (x) => gray(x === 0 ? 0 : x === 1 ? mid : 255));
    const A = edge(128), B = edge(100);
    expect(diffPixels(A, B, 3, 3, { tolerance: 10, ignoreAntiAlias: false }).changed).toBe(3);
    const r = diffPixels(A, B, 3, 3, { tolerance: 10, ignoreAntiAlias: true });
    expect(r.changed).toBe(0);
    expect(r.skippedAntiAlias).toBe(3);
  });

  it('does not skip a real change inside a flat area', () => {
    const B = img(3, 3, (x, y) => (x === 1 && y === 1 ? gray(255) : gray(0)));
    const r = diffPixels(img(3, 3, () => gray(0)), B, 3, 3, { tolerance: 0, ignoreAntiAlias: true });
    expect(r.changed).toBe(1);
  });
});

describe('sizes', () => {
  it('chooses the comparison canvas', () => {
    const A = { width: 10, height: 20 }, B = { width: 30, height: 5 };
    expect(targetSize(A, B, 'topleft')).toEqual({ width: 30, height: 20 });
    expect(targetSize(A, B, 'scale')).toEqual(A);
    expect(sameSize(A, { ...A })).toBe(true);
    expect(sameSize(A, B)).toBe(false);
  });
});
