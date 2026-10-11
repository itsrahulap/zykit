import { describe, expect, it } from 'vitest';
import { imageName, MAX_PIXELS, renderScale, selectedPages } from '../../../src/tools/pdf-to-images/features/pdf-to-images';

describe('pdf to images helpers', () => {
  it('selects pages from a range spec, de-duplicated and in order', () => {
    expect(selectedPages('', 3)).toEqual([0, 1, 2]);
    expect(selectedPages('3, 1-2, 2', 5)).toEqual([0, 1, 2]);
    expect(selectedPages('4-', 5)).toEqual([3, 4]);
    expect(() => selectedPages('9', 5)).toThrow(/doesn't exist/);
  });

  it('turns DPI into a scale and caps huge pages', () => {
    expect(renderScale(612, 792, 144)).toBe(2);
    const s = renderScale(14400, 14400, 300); // 200-inch square page
    expect(14400 * s * 14400 * s).toBeLessThanOrEqual(MAX_PIXELS + 1);
  });

  it('names images with zero-padded page numbers', () => {
    expect(imageName('report', 4, 120, 'png')).toBe('report-page-005.png');
    expect(imageName('a', 0, 9, 'jpeg')).toBe('a-page-1.jpg');
  });
});
