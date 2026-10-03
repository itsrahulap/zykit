import { describe, expect, it } from 'vitest';
import {
  contrastBadges,
  exportPalette,
  extractPalette,
  histogram,
  percent,
  seededRandom,
  slug,
  swatchValues,
  type PaletteOptions,
} from '../../../src/tools/color-palette-extractor/features/color-palette-extractor';

/** RGBA image made of solid runs: [r, g, b, count]. */
function image(runs: [number, number, number, number][], alpha = 255): Uint8ClampedArray {
  const total = runs.reduce((s, r) => s + r[3], 0);
  const out = new Uint8ClampedArray(total * 4);
  let o = 0;
  for (const [r, g, b, n] of runs) for (let i = 0; i < n; i++, o += 4) out.set([r, g, b, alpha], o);
  return out;
}

const THREE = image([[220, 30, 30, 500], [30, 200, 60, 300], [30, 60, 220, 200]]);
const opts = (p: Partial<PaletteOptions> = {}): PaletteOptions => ({ k: 3, method: 'kmeans', seed: 1, ...p });

const near = (hex: string, [r, g, b]: number[], tol = 8) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.abs(v[0] - r) <= tol && Math.abs(v[1] - g) <= tol && Math.abs(v[2] - b) <= tol;
};

describe.each(['kmeans', 'mediancut'] as const)('extractPalette (%s)', (method) => {
  it('finds the three dominant colours with their shares, largest first', () => {
    const sw = extractPalette(THREE, opts({ method }));
    expect(sw).toHaveLength(3);
    expect(near(sw[0].hex, [220, 30, 30])).toBe(true);
    expect(near(sw[1].hex, [30, 200, 60])).toBe(true);
    expect(near(sw[2].hex, [30, 60, 220])).toBe(true);
    expect(sw.map((s) => Math.round(s.share * 100))).toEqual([50, 30, 20]);
    expect(sw.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 6);
  });

  it('never returns more colours than distinct ones exist', () => {
    const sw = extractPalette(image([[10, 20, 30, 40], [200, 100, 50, 40]]), opts({ k: 8, method }));
    expect(sw).toHaveLength(2);
  });

  it('ignores transparent pixels and handles empty images', () => {
    expect(extractPalette(image([[255, 0, 0, 10]], 0), opts({ method }))).toEqual([]);
    expect(extractPalette(new Uint8ClampedArray(0), opts({ method }))).toEqual([]);
    const mixed = new Uint8ClampedArray([...image([[0, 0, 255, 5]]), ...image([[255, 0, 0, 5]], 10)]);
    expect(extractPalette(mixed, opts({ method }))).toHaveLength(1);
  });

  it('respects k between 3 and 12', () => {
    const noisy = new Uint8ClampedArray(4 * 2000);
    const rand = seededRandom(7);
    for (let i = 0; i < 2000; i++) noisy.set([rand() * 255, rand() * 255, rand() * 255, 255], i * 4);
    expect(extractPalette(noisy, opts({ k: 12, method }))).toHaveLength(12);
    expect(extractPalette(noisy, opts({ k: 1, method })).length).toBe(3);
    expect(extractPalette(noisy, opts({ k: 99, method })).length).toBe(12);
  });
});

describe('k-means seeding', () => {
  const noisy = new Uint8ClampedArray(4 * 1500);
  const rand = seededRandom(3);
  for (let i = 0; i < 1500; i++) noisy.set([rand() * 255, rand() * 255, rand() * 255, 255], i * 4);

  it('is deterministic for a seed', () => {
    const a = extractPalette(noisy, opts({ k: 6, seed: 42 })).map((s) => s.hex);
    const b = extractPalette(noisy, opts({ k: 6, seed: 42 })).map((s) => s.hex);
    expect(a).toEqual(b);
  });

  it('seededRandom is repeatable and in [0, 1)', () => {
    const r1 = seededRandom(5), r2 = seededRandom(5);
    for (let i = 0; i < 20; i++) {
      const v = r1();
      expect(v).toBe(r2());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('histogram', () => {
  it('merges nearby pixels into weighted points', () => {
    const pts = histogram(image([[100, 100, 100, 3], [101, 100, 100, 1]]));
    expect(pts).toHaveLength(1);
    expect(pts[0].w).toBe(4);
    expect(pts[0].r).toBeCloseTo(100.25, 5);
  });
});

describe('display helpers', () => {
  it('formats shares', () => {
    expect(percent(0.5)).toBe('50%');
    expect(percent(0.034)).toBe('3.4%');
    expect(percent(0.001)).toBe('<0.5%');
  });

  it('computes WCAG badges for white and black text', () => {
    const dark = contrastBadges({ r: 0, g: 0, b: 0, alpha: 1 });
    expect(dark.white).toMatchObject({ ratio: '21.00:1', level: 'AAA' });
    expect(dark.black.level).toBe('Fail');
    const mid = contrastBadges({ r: 0.46, g: 0.46, b: 0.46, alpha: 1 });
    expect(['AA', 'AA large']).toContain(mid.white.level);
    expect(['AA', 'AA large']).toContain(mid.black.level);
  });

  it('lists HEX, RGB, HSL and OKLCH', () => {
    const v = swatchValues({ r: 1, g: 0, b: 0, alpha: 1 });
    expect(v.map((x) => x.label)).toEqual(['HEX', 'RGB', 'HSL', 'OKLCH']);
    expect(v[0].value).toBe('#ff0000');
    expect(v[1].value).toBe('rgb(255 0 0)');
    expect(v[2].value).toBe('hsl(0 100% 50%)');
    expect(v[3].value).toBe('oklch(62.8% 0.2577 29.2)');
  });
});

describe('exportPalette', () => {
  const sw = extractPalette(THREE, opts());
  it('writes CSS variables, SCSS and a Tailwind theme', () => {
    expect(exportPalette(sw, 'css', 'Brand Colors')).toBe(`:root {\n  --brand-colors-1: ${sw[0].hex};\n  --brand-colors-2: ${sw[1].hex};\n  --brand-colors-3: ${sw[2].hex};\n}\n`);
    expect(exportPalette(sw, 'scss')).toBe(`$palette-1: ${sw[0].hex};\n$palette-2: ${sw[1].hex};\n$palette-3: ${sw[2].hex};\n`);
    expect(exportPalette(sw, 'tailwind')).toBe(`@theme {\n  --color-palette-1: ${sw[0].hex};\n  --color-palette-2: ${sw[1].hex};\n  --color-palette-3: ${sw[2].hex};\n}\n`);
  });
  it('writes JSON with every notation and the share', () => {
    const json = JSON.parse(exportPalette(sw, 'json', 'p'));
    expect(json.p).toHaveLength(3);
    expect(json.p[0]).toMatchObject({ name: 'p-1', hex: sw[0].hex, share: 0.5 });
    expect(Object.keys(json.p[0])).toEqual(['name', 'hex', 'rgb', 'hsl', 'oklch', 'share']);
  });
  it('slugs names', () => {
    expect(slug('  My Colors! ')).toBe('my-colors');
    expect(slug('###')).toBe('palette');
  });
});
