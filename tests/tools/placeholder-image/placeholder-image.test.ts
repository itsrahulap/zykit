import { describe, expect, it } from 'vitest';
import {
  autoFontSize, buildSvg, contrastRatio, escapeXml, normalizeColor, parseSide, parseSizes, svgDataUri,
} from '../../../src/tools/placeholder-image/features/placeholder-image';

describe('Placeholder Image', () => {
  it('builds an SVG with escaped text', () => {
    const svg = buildSvg({ w: 300, h: 200, bg: '#ffffff', fg: '#000000', text: 'A & <B>', fontSize: 40 });
    expect(svg).toContain('width="300" height="200" viewBox="0 0 300 200"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('>A &amp; &lt;B&gt;</text>');
    expect(buildSvg({ w: 1, h: 1, bg: '#fff', fg: '#000', text: '', fontSize: 8 })).not.toContain('<text');
    expect(escapeXml(`"'`)).toBe('&quot;&apos;');
  });
  it('makes a data URI', () => {
    expect(svgDataUri('<svg/>')).toBe('data:image/svg+xml,%3Csvg%2F%3E');
  });
  it('auto font size fits the box and has a floor', () => {
    expect(autoFontSize(800, 600, '800×600')).toBe(Math.floor(Math.min(180, (800 * 0.9) / (7 * 0.58))));
    expect(autoFontSize(100, 1000, 'x'.repeat(50))).toBe(8);
    expect(autoFontSize(10000, 100, 'A')).toBe(30);
    const s = autoFontSize(200, 200, 'Hello placeholder');
    expect(s * 0.58 * 17).toBeLessThanOrEqual(200 * 0.9 + 1);
  });
  it('validates sizes and colours', () => {
    expect(parseSide('8000')).toBe(8000);
    expect(parseSide('8001')).toBeNull();
    expect(parseSide('0')).toBeNull();
    expect(parseSide('1.5')).toBeNull();
    expect(normalizeColor('ABC')).toBe('#aabbcc');
    expect(normalizeColor('#334155')).toBe('#334155');
    expect(normalizeColor('red')).toBeNull();
    expect(parseSizes('1200x630, 150 40×20 9000x1 junk')).toEqual({
      sizes: [{ w: 1200, h: 630 }, { w: 150, h: 150 }, { w: 40, h: 20 }],
      invalid: ['9000x1', 'junk'],
    });
  });
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(contrastRatio('#ffffff', '#cccccc')).toBeLessThan(4.5);
  });
});
