import { describe, expect, it } from 'vitest';
import { FONT_STACKS, addPoint, padBounds, pressureFactor, strokeBounds, strokePaths, strokesToSvg, typedBounds, typedToSvg, type Pt, type Stroke } from '../../../src/tools/signature-pad/features/signature-pad';

const pt = (x: number, y: number, p = 0.5): Pt => ({ x, y, p });
const stroke = (pts: Pt[], width = 4, color = '#112233'): Stroke => ({ pts, width, color });

describe('addPoint', () => {
  it('drops points closer than the minimum distance', () => {
    const pts: Pt[] = [];
    expect(addPoint(pts, pt(10, 10))).toBe(true);
    expect(addPoint(pts, pt(10.5, 10.5))).toBe(false);
    expect(addPoint(pts, pt(13, 10))).toBe(true);
    expect(pts).toHaveLength(2);
  });
});

describe('pressureFactor', () => {
  it('is 1 for mouse/touch (0.5) and spans 0.5–1.5', () => {
    expect(pressureFactor(0.5)).toBe(1);
    expect(pressureFactor(0)).toBe(0.5);
    expect(pressureFactor(1)).toBe(1.5);
    expect(pressureFactor(9)).toBe(1.5);
    expect(pressureFactor(-1)).toBe(0.5);
  });
});

describe('strokePaths', () => {
  it('draws a single point as a round dot', () => {
    expect(strokePaths(stroke([pt(5, 6)]))).toEqual([{ d: 'M5 6h0', w: 4 }]);
  });
  it('draws two points as a line', () => {
    expect(strokePaths(stroke([pt(0, 0), pt(10, 0)]))).toEqual([{ d: 'M0 0L10 0', w: 4 }]);
  });
  it('smooths through midpoints with the points as control points', () => {
    const [p] = strokePaths(stroke([pt(0, 0), pt(10, 0), pt(10, 10)]));
    expect(p.d).toBe('M0 0Q10 0 10 5L10 10');
    expect(strokePaths(stroke([pt(0, 0), pt(10, 0), pt(20, 10), pt(30, 10)]))[0].d).toBe('M0 0Q10 0 15 5Q20 10 25 10L30 10');
  });
  it('is one path at constant pressure and splits when pressure changes the width', () => {
    const flat = Array.from({ length: 6 }, (_, i) => pt(i * 10, i % 2 ? 5 : 0));
    expect(strokePaths(stroke(flat))).toHaveLength(1);
    const varied = Array.from({ length: 6 }, (_, i) => pt(i * 10, 0, i < 3 ? 0.1 : 0.9));
    const parts = strokePaths(stroke(varied));
    expect(parts.length).toBe(2);
    expect(parts[0].w).toBeLessThan(parts[1].w);
    // the second piece starts where the first ended, so there is no gap
    expect(parts[1].d.startsWith('M')).toBe(true);
  });
  it('returns nothing for an empty stroke', () => {
    expect(strokePaths(stroke([]))).toEqual([]);
  });
});

describe('bounds and trimming', () => {
  it('includes half the widest line and handles empty input', () => {
    expect(strokeBounds([])).toBeNull();
    const b = strokeBounds([stroke([pt(10, 20), pt(30, 60)], 4)])!;
    // half of 4 × 1.5 = 3
    expect(b).toEqual({ x: 7, y: 17, w: 26, h: 46 });
  });
  it('pads, and clips to the canvas', () => {
    expect(padBounds({ x: 7, y: 17, w: 26, h: 46 }, 8)).toEqual({ x: -1, y: 9, w: 42, h: 62 });
    expect(padBounds({ x: 2, y: 2, w: 596, h: 236 }, 8, { w: 600, h: 240 })).toEqual({ x: 0, y: 0, w: 600, h: 240 });
  });
  it('never returns an empty box', () => {
    expect(padBounds({ x: 5, y: 5, w: 0, h: 0 }, 0).w).toBe(1);
  });
});

describe('SVG output', () => {
  it('has a transparent background and a cropped viewBox', () => {
    const svg = strokesToSvg([stroke([pt(10, 10), pt(20, 20)])], { x: 4, y: 4, w: 30, h: 30 });
    expect(svg).toContain('viewBox="4 4 30 30"');
    expect(svg).toContain('stroke="#112233"');
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('stroke-linecap="round"');
  });
  it('skips strokes with an invalid colour', () => {
    expect(strokesToSvg([stroke([pt(0, 0), pt(9, 9)], 4, 'red"><script>')], { x: 0, y: 0, w: 10, h: 10 })).not.toContain('<path');
  });
  it('writes typed text with escaping and a system font stack', () => {
    const box = typedBounds({ width: 100, ascent: 30, descent: 10 }, 5);
    expect(box).toEqual({ x: -5, y: -35, w: 110, h: 50 });
    const svg = typedToSvg('A & <B>', { css: FONT_STACKS[0].css, size: 40, color: '#000000' }, box);
    expect(svg).toContain('A &amp; &lt;B&gt;');
    expect(svg).toContain('font-family="&quot;Snell Roundhand&quot;');
    expect(svg).toContain('viewBox="-5 -35 110 50"');
    expect(typedToSvg('x', { css: 'a', size: 1, color: 'nope' }, box)).toBe('');
  });
  it('only uses local font families', () => {
    FONT_STACKS.forEach((f) => expect(f.css).not.toMatch(/https?:|url\(/));
  });
});
