import { describe, expect, it } from 'vitest';
import { applyTheme, clipEmoji, DEFAULT_DESIGN, FONTS, THEMES } from '../../../src/tools/og-image-generator/features/design';
import { alignX, breakWord, contain, ellipsize, fitText, safeArea, SIZES, sizeById, squareCrop, wrapText, type Measure } from '../../../src/tools/og-image-generator/features/layout';
import { escapeAttr, fileName, hostOf, isAbsoluteHttpUrl, ogMetaTags } from '../../../src/tools/og-image-generator/features/meta';

/** Every character is half the font size wide. */
const measure: Measure = (t, size) => Array.from(t).length * size * 0.5;

describe('wrapText', () => {
  it('wraps at word boundaries', () => {
    // 10px font -> 5px per char; 50px fits 10 chars
    expect(wrapText('hello world foo bar', 10, 50, measure)).toEqual(['hello', 'world foo', 'bar']);
  });
  it('keeps explicit newlines and drops blank lines', () => {
    expect(wrapText('a\n\n b  c', 10, 500, measure)).toEqual(['a', 'b c']);
  });
  it('breaks a word wider than the box', () => {
    expect(wrapText('abcdefghijkl', 10, 25, measure)).toEqual(['abcde', 'fghij', 'kl']);
    expect(breakWord('abcdef', 10, 15, measure)).toEqual(['abc', 'def']);
  });
  it('puts the next word on a fresh line after a broken word', () => {
    expect(wrapText('abcdefgh ij', 10, 25, measure)).toEqual(['abcde', 'fgh', 'ij']);
  });
  it('returns nothing for empty text and handles emoji as single characters', () => {
    expect(wrapText('   ', 10, 50, measure)).toEqual([]);
    expect(wrapText('😀😀😀😀', 10, 10, measure)).toEqual(['😀😀', '😀😀']);
  });
});

describe('ellipsize', () => {
  it('trims until the ellipsis fits', () => {
    expect(ellipsize('hello world', 10, 30, measure)).toBe('hello…');
  });
});

describe('fitText', () => {
  const base = { maxSize: 100, minSize: 20, maxWidth: 400, maxHeight: 200, lineHeight: 1, maxLines: 4, step: 2 };
  it('uses the maximum size when the text is short', () => {
    const r = fitText('Hi', base, measure);
    expect(r).toMatchObject({ size: 100, lines: ['Hi'], height: 100, truncated: false });
  });
  it('shrinks until the wrapped block fits both width and height', () => {
    const r = fitText('The quick brown fox jumps over the lazy dog', base, measure);
    expect(r.size).toBeLessThan(100);
    expect(r.size).toBeGreaterThanOrEqual(20);
    expect(r.height).toBeLessThanOrEqual(200);
    expect(r.lines.length).toBeLessThanOrEqual(4);
    expect(r.lines.every((l) => measure(l, r.size) <= 400)).toBe(true);
    expect(r.truncated).toBe(false);
    // one step larger would not have fit
    const bigger = wrapText('The quick brown fox jumps over the lazy dog', r.size + 2, 400, measure);
    expect(bigger.length > 4 || bigger.length * (r.size + 2) > 200).toBe(true);
  });
  it('respects maxLines', () => {
    const r = fitText('one two three four five six seven eight', { ...base, maxLines: 1, maxHeight: 1000, maxWidth: 2000 }, measure);
    expect(r.lines).toHaveLength(1);
  });
  it('truncates with an ellipsis at the minimum size when nothing fits', () => {
    const text = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ');
    const r = fitText(text, { ...base, maxHeight: 60, minSize: 20 }, measure);
    expect(r.size).toBe(20);
    expect(r.truncated).toBe(true);
    expect(r.lines).toHaveLength(3);
    expect(r.lines[2].endsWith('…')).toBe(true);
    expect(measure(r.lines[2], 20)).toBeLessThanOrEqual(400);
  });
  it('returns an empty block for empty text', () => {
    expect(fitText('  ', base, measure)).toEqual({ size: 100, lines: [], height: 0, truncated: false });
  });
  it('shrinks a single long word instead of overflowing when it can', () => {
    const r = fitText('Supercalifragilistic', { ...base, maxLines: 1, maxWidth: 200 }, measure);
    expect(r.lines).toEqual(['Supercalifragilistic']);
    expect(measure(r.lines[0], r.size)).toBeLessThanOrEqual(200);
  });
});

describe('geometry', () => {
  it('contains an image in a box without upscaling beyond maxScale', () => {
    expect(contain(200, 100, 100, 100)).toEqual({ w: 100, h: 50 });
    expect(contain(10, 10, 100, 100)).toEqual({ w: 10, h: 10 });
    expect(contain(10, 10, 100, 100, 4)).toEqual({ w: 40, h: 40 });
    expect(contain(0, 10, 100, 100)).toEqual({ w: 0, h: 0 });
  });
  it('aligns items inside the margins', () => {
    expect(alignX('left', 1200, 72, 100)).toBe(72);
    expect(alignX('right', 1200, 72, 100)).toBe(1028);
    expect(alignX('center', 1200, 72, 100)).toBe(550);
  });
  it('defines the three sizes with their safe areas and crops', () => {
    expect(SIZES.map((s) => [s.w, s.h])).toEqual([[1200, 630], [1200, 600], [1080, 1080]]);
    expect(safeArea(sizeById('og'))).toEqual({ x: 72, y: 72, w: 1056, h: 486 });
    expect(safeArea(sizeById('square'))).toEqual({ x: 90, y: 90, w: 900, h: 900 });
    expect(squareCrop(sizeById('og'))).toEqual({ x: 285, y: 0, w: 630, h: 630 });
    expect(squareCrop(sizeById('square'))).toBeNull();
    expect(sizeById('x').card).toBe('summary_large_image');
    expect(sizeById('square').card).toBe('summary');
  });
});

describe('design', () => {
  it('ships a Zykit palette and only system font stacks', () => {
    expect(THEMES.find((t) => t.id === 'zykit')).toMatchObject({ c1: '#f6f6f2', textColor: '#1a221e', accent: '#2f5f4b' });
    expect(THEMES.filter((t) => t.id.startsWith('zykit')).length).toBe(3);
    for (const f of FONTS) expect(f.stack).not.toMatch(/url\(|https?:|@font-face/);
  });
  it('applies a theme without touching the text content', () => {
    const d = applyTheme({ ...DEFAULT_DESIGN, title: 'Mine' }, 'ocean');
    expect(d).toMatchObject({ theme: 'ocean', bgKind: 'gradient', title: 'Mine', c1: '#0369a1' });
    expect(applyTheme(DEFAULT_DESIGN, 'nope')).toBe(DEFAULT_DESIGN);
  });
  it('every theme has valid hex colours', () => {
    for (const t of THEMES) for (const c of [t.c1, t.c2, t.textColor, t.accent]) expect(c, t.id).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('keeps at most two characters in the emoji field', () => {
    expect(clipEmoji('🚀')).toBe('🚀');
    expect(clipEmoji('🚀🔥✨')).toBe('🚀🔥');
    expect(clipEmoji('👩‍💻x')).toBe('👩‍💻x');
    expect(clipEmoji('abcdef')).toBe('ab');
  });
});

describe('meta tags', () => {
  const size = sizeById('og');
  const input = { title: 'A "great" <page>', description: 'Fish & chips', pageUrl: 'https://example.com/a', imageUrl: 'https://example.com/og.png', siteName: 'Example', alt: 'Alt text', size };
  it('writes Open Graph and Twitter tags with escaped values', () => {
    const out = ogMetaTags(input);
    expect(out).toContain('<meta property="og:title" content="A &quot;great&quot; &lt;page&gt;">');
    expect(out).toContain('<meta property="og:description" content="Fish &amp; chips">');
    expect(out).toContain('<meta property="og:image:width" content="1200">');
    expect(out).toContain('<meta property="og:image:height" content="630">');
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(out.split('\n')).toHaveLength(14);
  });
  it('omits empty values and uses the summary card for square images', () => {
    const out = ogMetaTags({ ...input, description: '', alt: '', pageUrl: '', size: sizeById('square') });
    expect(out).not.toContain('og:description');
    expect(out).not.toContain('og:url');
    expect(out).not.toContain('alt');
    expect(out).toContain('content="summary"');
    expect(out).toContain('og:image:width" content="1080"');
  });
  it('checks URLs, hosts and file names', () => {
    expect(isAbsoluteHttpUrl('https://a.com/x.png')).toBe(true);
    expect(isAbsoluteHttpUrl('/x.png')).toBe(false);
    expect(isAbsoluteHttpUrl('javascript:alert(1)')).toBe(false);
    expect(hostOf('https://www.example.com/p')).toBe('example.com');
    expect(hostOf('nope')).toBe('example.com');
    expect(fileName(size, 'png')).toBe('og-image-1200x630.png');
    expect(escapeAttr(`a&b"c<d>`)).toBe('a&amp;b&quot;c&lt;d&gt;');
  });
});
