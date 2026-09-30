import { describe, expect, it } from 'vitest';
import {
  apca,
  contrastRatio,
  formatAll,
  formatRatio,
  harmony,
  inSrgbGamut,
  nearestPassing,
  parseColor,
  shades,
  simulate,
  tints,
  toHex,
  toOklch,
  wcag,
  type Color,
} from '../../../src/tools/color-converter/features/color-converter';
import { NAMED_COLORS } from '../../../src/tools/color-converter/features/named';

const hexOf = (s: string) => {
  const r = parseColor(s);
  if (!r.ok) throw new Error(r.error);
  return toHex(r.color);
};
const color = (s: string): Color => {
  const r = parseColor(s);
  if (!r.ok) throw new Error(r.error);
  return r.color;
};
const fmt = (s: string, id: string) => formatAll(color(s)).find((f) => f.id === id)?.value;

describe('parseColor', () => {
  it('reads every hex length', () => {
    expect(hexOf('#f80')).toBe('#ff8800');
    expect(hexOf('#f808')).toBe('#ff880088');
    expect(hexOf('#FF8800')).toBe('#ff8800');
    expect(hexOf('#ff880080')).toBe('#ff880080');
    expect(hexOf('ff8800')).toBe('#ff8800');
    expect(parseColor('#ff88').ok).toBe(true);
    expect(parseColor('#ff8').ok).toBe(true);
    expect(parseColor('#ff88000').ok).toBe(false);
    expect(parseColor('#gg0000').ok).toBe(false);
  });

  it('knows all 148 named colours and transparent', () => {
    expect(NAMED_COLORS.size).toBe(148);
    expect(hexOf('rebeccapurple')).toBe('#663399');
    expect(hexOf('  Tomato; ')).toBe('#ff6347');
    expect(color('transparent').alpha).toBe(0);
  });

  it('reads rgb() in modern and legacy syntax', () => {
    expect(hexOf('rgb(255 136 0)')).toBe('#ff8800');
    expect(hexOf('rgb(255, 136, 0)')).toBe('#ff8800');
    expect(hexOf('rgba(255, 136, 0, 0.5)')).toBe('#ff880080');
    expect(hexOf('rgb(100% 0% 0% / 50%)')).toBe('#ff000080');
    expect(hexOf('rgb(none 0 0)')).toBe('#000000');
    expect(parseColor('rgb(1 2)').ok).toBe(false);
    expect(parseColor('rgb(1 2 3 / 4 / 5)').ok).toBe(false);
  });

  it('reads hsl() and hwb() with hue units', () => {
    expect(hexOf('hsl(0 100% 50%)')).toBe('#ff0000');
    expect(hexOf('hsl(120deg 100% 25%)')).toBe('#008000');
    expect(hexOf('hsla(240, 100%, 50%, 1)')).toBe('#0000ff');
    expect(hexOf('hsl(0.5turn 100% 50%)')).toBe('#00ffff');
    expect(hexOf('hsl(3.14159rad 100% 50%)')).toBe('#00ffff');
    expect(hexOf('hwb(0 0% 0%)')).toBe('#ff0000');
    expect(hexOf('hwb(0 60% 60%)')).toBe('#808080');
  });

  it('reads lab, lch, oklab and oklch', () => {
    expect(hexOf('lab(54.29% 80.8 69.89)')).toBe('#ff0000');
    expect(hexOf('lch(54.29% 106.84 40.85)')).toBe('#ff0000');
    expect(hexOf('oklab(62.8% 0.2249 0.1258)')).toBe('#ff0000');
    expect(hexOf('oklch(62.8% 0.2577 29.23)')).toBe('#ff0000');
    expect(hexOf('oklch(0.628 0.2577 29.23)')).toBe('#ff0000');
    expect(hexOf('oklch(100% 0 0)')).toBe('#ffffff');
  });

  it('reads color() spaces, including wide-gamut P3', () => {
    expect(hexOf('color(srgb 1 0 0)')).toBe('#ff0000');
    expect(hexOf('color(srgb-linear 0.2159 0.2159 0.2159)')).toBe('#808080');
    const p3red = color('color(display-p3 1 0 0)');
    expect(inSrgbGamut(p3red)).toBe(false);
    expect(inSrgbGamut(color('color(display-p3 0.5 0.5 0.5)'))).toBe(true);
    expect(parseColor('color(rec9999 1 0 0)').ok).toBe(false);
  });

  it('explains what is wrong', () => {
    const r = parseColor('blurple');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/isn't a colour/);
    expect(parseColor('').ok).toBe(false);
    expect(parseColor('foo(1 2 3)').ok).toBe(false);
  });
});

describe('formatAll', () => {
  it('lists every notation', () => {
    expect(fmt('#ff8800', 'rgb')).toBe('rgb(255 136 0)');
    expect(fmt('#ff8800', 'rgb-legacy')).toBe('rgb(255, 136, 0)');
    expect(fmt('#ff8800', 'hsl')).toBe('hsl(32 100% 50%)');
    expect(fmt('#ff8800', 'hwb')).toBe('hwb(32 0% 0%)');
    expect(fmt('red', 'named')).toBe('red');
    expect(fmt('#ff0000', 'oklch')).toBe('oklch(62.8% 0.2577 29.2)');
    expect(fmt('#ff0000', 'lab')).toBe('lab(54.29% 80.8 69.89)');
    expect(fmt('white', 'p3')).toBe('color(display-p3 1 1 1)');
    expect(fmt('#12345678', 'rgb')).toBe('rgb(18 52 86 / 0.471)');
    expect(fmt('#12345678', 'rgb-legacy')).toBe('rgba(18, 52, 86, 0.471)');
  });

  it('round-trips through each notation', () => {
    for (const hex of ['#ff8800', '#123456', '#000000', '#ffffff', '#7f7f7f', '#00ff00']) {
      for (const f of formatAll(color(hex))) {
        if (f.id === 'hsl' || f.id === 'hwb') continue; // rounded to 0.1 so a byte may differ
        expect(hexOf(f.value), `${hex} via ${f.label}`).toBe(hex);
      }
    }
  });

  it('gamut-maps sRGB formats for wide-gamut input', () => {
    const p3 = color('color(display-p3 1 0 0)');
    expect(toHex(p3)).toMatch(/^#ff[0-9a-f]{4}$/);
    expect(fmt('color(display-p3 1 0 0)', 'p3')).toBe('color(display-p3 1 0 0)');
  });
});

describe('contrast', () => {
  it('computes WCAG 2.1 ratios', () => {
    expect(contrastRatio(color('#000'), color('#fff'))).toBeCloseTo(21, 5);
    expect(contrastRatio(color('#fff'), color('#fff'))).toBeCloseTo(1, 5);
    expect(formatRatio(contrastRatio(color('#767676'), color('#fff')))).toBe('4.54:1');
    const r = wcag(color('#777'), color('#fff'));
    expect(r.normalAA).toBe(false); // 4.48
    expect(r.largeAA).toBe(true);
    expect(r.ui).toBe(true);
  });

  it('composites translucent text over the background', () => {
    expect(contrastRatio(color('#00000000'), color('#fff'))).toBeCloseTo(1, 5);
  });

  it('computes APCA Lc', () => {
    expect(apca(color('#000'), color('#fff'))).toBeCloseTo(106.04, 1);
    expect(apca(color('#fff'), color('#000'))).toBeCloseTo(-107.88, 1);
    expect(apca(color('#888'), color('#888'))).toBe(0);
  });

  it('suggests the nearest passing colour', () => {
    const fg = color('#777777');
    const bg = color('#ffffff');
    const aa = nearestPassing(fg, bg, 4.5)!;
    expect(contrastRatio(aa, bg)).toBeGreaterThanOrEqual(4.5);
    expect(toHex(aa)).toBe('#767676');
    const aaa = nearestPassing(fg, bg, 7)!;
    expect(contrastRatio(aaa, bg)).toBeGreaterThanOrEqual(7);
    expect(nearestPassing(color('#fff'), color('#fff'), 4.5)).not.toBeNull();
    // Already passing: unchanged.
    expect(toHex(nearestPassing(color('#000'), bg, 4.5)!)).toBe('#000000');
    // Background adjustment.
    const bg2 = nearestPassing(bg, fg, 4.5, 'bg')!;
    expect(contrastRatio(fg, bg2)).toBeGreaterThanOrEqual(4.5);
    // 21:1 is impossible except with black/white; 22:1 never.
    expect(nearestPassing(color('#808080'), bg, 22)).toBeNull();
  });
});

describe('palettes and simulation', () => {
  it('builds tints, shades and harmonies', () => {
    const red = color('#ff0000');
    expect(tints(red, 1).map((c) => toHex(c))).toEqual(['#ff8080']);
    expect(shades(red, 1).map((c) => toHex(c))).toEqual(['#800000']);
    expect(harmony(red, 'complementary').map((c) => toHex(c))).toEqual(['#ff0000', '#00ffff']);
    expect(harmony(red, 'triadic').map((c) => toHex(c))).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    expect(harmony(red, 'analogous')).toHaveLength(3);
    expect(harmony(red, 'tetradic')).toHaveLength(4);
  });

  it('simulates colour-vision deficiencies', () => {
    const red = color('#ff0000');
    const grey = simulate(red, 'achromatopsia');
    expect(grey.r).toBeCloseTo(grey.g, 6);
    expect(grey.g).toBeCloseTo(grey.b, 6);
    expect(toHex(simulate(color('#fff'), 'protanopia'))).toBe('#ffffff');
    expect(toHex(simulate(red, 'protanopia'))).not.toBe('#ff0000');
    expect(toHex(simulate(red, 'deuteranopia'))).not.toBe(toHex(simulate(red, 'tritanopia')));
  });

  it('keeps OKLCH hue for greys at 0', () => {
    expect(toOklch(color('#808080'))[2]).toBe(0);
  });
});
