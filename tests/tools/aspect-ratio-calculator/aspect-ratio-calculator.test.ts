import { describe, expect, it } from 'vitest';
import {
  cssSnippet, gcd, nearestCommon, parseSide, resolutionsFor, scaleBy, simplify, solveHeight, solveWidth,
} from '../../../src/tools/aspect-ratio-calculator/features/aspect-ratio-calculator';

describe('Aspect Ratio Calculator', () => {
  it('gcd and simplify', () => {
    expect(gcd(1920, 1080)).toBe(120);
    expect(simplify(1920, 1080)).toEqual({ w: 16, h: 9 });
    expect(simplify(1.5, 1)).toEqual({ w: 3, h: 2 });
  });
  it('finds nearest common ratio', () => {
    expect(nearestCommon(1920, 1080)).toEqual({ ratio: { w: 16, h: 9 }, exact: true });
    const n = nearestCommon(1366, 768);
    expect(n.ratio).toEqual({ w: 16, h: 9 });
    expect(n.exact).toBe(false);
  });
  it('solves sides and scales', () => {
    expect(solveHeight(1000, { w: 16, h: 9 })).toBe(563);
    expect(solveWidth(900, { w: 16, h: 9 })).toBe(1600);
    expect(scaleBy(1920, 1080, 50)).toEqual({ w: 960, h: 540 });
  });
  it('validates input', () => {
    expect(parseSide('0')).toBeNull();
    expect(parseSide('abc')).toBeNull();
    expect(parseSide('')).toBeNull();
    expect(parseSide('100001')).toBeNull();
    expect(parseSide(' 12.5 ')).toBe(12.5);
  });
  it('lists resolutions and css', () => {
    expect(resolutionsFor(16, 9).map((r) => r.name)).toContain('4K UHD');
    expect(cssSnippet({ w: 16, h: 9 })).toBe('aspect-ratio: 16 / 9;');
  });
});
