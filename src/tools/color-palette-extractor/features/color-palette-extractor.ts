// Dominant-colour extraction (seeded k-means++ in OKLab, or median cut in sRGB) and export formats.
// Pure logic on RGBA pixel data, so it's unit-testable in Node. Colour maths comes from the Color Converter.

import {
  clampColor,
  formatAll,
  formatRatio,
  fromOklab,
  toHex,
  toOklab,
  wcag,
  type Color,
} from '../../color-converter/features/color-converter';

export type Method = 'kmeans' | 'mediancut';

export interface PaletteOptions {
  /** Number of colours, 3–12. */
  k: number;
  method: Method;
  /** Seed for the k-means++ starting points (same image + seed = same palette). */
  seed: number;
}

export interface Swatch {
  color: Color;
  hex: string;
  /** Fraction of the (opaque) pixels in this colour's cluster, 0–1. */
  share: number;
}

export const MIN_K = 3;
export const MAX_K = 12;
/** Longest side the image is downscaled to before extraction. */
export const SAMPLE_SIDE = 128;
const ALPHA_CUTOFF = 128;

interface Point {
  r: number;
  g: number;
  b: number;
  /** Pixels represented. */
  w: number;
}

/** Groups pixels into 5-bit-per-channel buckets (keeping each bucket's exact mean) so later steps run on a few thousand points. */
export function histogram(rgba: ArrayLike<number>): Point[] {
  const sums = new Map<number, { r: number; g: number; b: number; w: number }>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < ALPHA_CUTOFF) continue;
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const e = sums.get(key);
    if (e) {
      e.r += r;
      e.g += g;
      e.b += b;
      e.w++;
    } else sums.set(key, { r, g, b, w: 1 });
  }
  return [...sums.values()].map((e) => ({ r: e.r / e.w, g: e.g / e.w, b: e.b / e.w, w: e.w }));
}

/** Small deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgbColor = (r: number, g: number, b: number): Color => ({ r: r / 255, g: g / 255, b: b / 255, alpha: 1 });

function kmeans(points: Point[], k: number, rand: () => number): { color: Color; weight: number }[] {
  const n = points.length;
  const lab = points.map((p) => toOklab(rgbColor(p.r, p.g, p.b)));
  const L = Float64Array.from(lab, (v) => v[0]);
  const A = Float64Array.from(lab, (v) => v[1]);
  const B = Float64Array.from(lab, (v) => v[2]);
  const W = Float64Array.from(points, (p) => p.w);
  const dist = (i: number, cl: number, ca: number, cb: number) => (L[i] - cl) ** 2 + (A[i] - ca) ** 2 + (B[i] - cb) ** 2;
  const pickWeighted = (weights: Float64Array): number => {
    let total = 0;
    for (let i = 0; i < n; i++) total += weights[i];
    if (total <= 0) return Math.floor(rand() * n);
    let t = rand() * total;
    for (let i = 0; i < n; i++) {
      t -= weights[i];
      if (t <= 0) return i;
    }
    return n - 1;
  };

  // k-means++ seeding, weighted by pixel count.
  const cL: number[] = [], cA: number[] = [], cB: number[] = [];
  const first = pickWeighted(W);
  cL.push(L[first]); cA.push(A[first]); cB.push(B[first]);
  const d2 = new Float64Array(n);
  for (let i = 0; i < n; i++) d2[i] = dist(i, cL[0], cA[0], cB[0]);
  while (cL.length < k) {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = d2[i] * W[i];
    const next = pickWeighted(w);
    cL.push(L[next]); cA.push(A[next]); cB.push(B[next]);
    const c = cL.length - 1;
    for (let i = 0; i < n; i++) d2[i] = Math.min(d2[i], dist(i, cL[c], cA[c], cB[c]));
  }

  // Lloyd iterations.
  const assign = new Int32Array(n).fill(-1);
  for (let iter = 0; iter < 40; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist(i, cL[c], cA[c], cB[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (assign[i] !== best) {
        assign[i] = best;
        changed = true;
      }
    }
    if (!changed) break;
    const sL = new Float64Array(k), sA = new Float64Array(k), sB = new Float64Array(k), sW = new Float64Array(k);
    for (let i = 0; i < n; i++) {
      const c = assign[i];
      sL[c] += L[i] * W[i]; sA[c] += A[i] * W[i]; sB[c] += B[i] * W[i]; sW[c] += W[i];
    }
    for (let c = 0; c < k; c++) {
      if (sW[c] > 0) {
        cL[c] = sL[c] / sW[c]; cA[c] = sA[c] / sW[c]; cB[c] = sB[c] / sW[c];
      } else {
        // Empty cluster: restart it on the point farthest from its centre.
        let far = 0, farD = -1;
        for (let i = 0; i < n; i++) {
          const d = dist(i, cL[assign[i]], cA[assign[i]], cB[assign[i]]) * W[i];
          if (d > farD) {
            farD = d;
            far = i;
          }
        }
        cL[c] = L[far]; cA[c] = A[far]; cB[c] = B[far];
      }
    }
  }
  const weight = new Float64Array(k);
  for (let i = 0; i < n; i++) weight[assign[i]] += W[i];
  return cL
    .map((l, c) => ({ color: clampColor(fromOklab([l, cA[c], cB[c]])), weight: weight[c] }))
    .filter((c) => c.weight > 0);
}

function medianCut(points: Point[], k: number): { color: Color; weight: number }[] {
  type Box = { pts: Point[]; weight: number };
  const total = (pts: Point[]) => pts.reduce((s, p) => s + p.w, 0);
  const range = (pts: Point[]) => {
    const lo = [255, 255, 255], hi = [0, 0, 0];
    for (const p of pts) {
      const v = [p.r, p.g, p.b];
      for (let c = 0; c < 3; c++) {
        lo[c] = Math.min(lo[c], v[c]);
        hi[c] = Math.max(hi[c], v[c]);
      }
    }
    const spans = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
    const channel = spans.indexOf(Math.max(...spans));
    return { channel, span: spans[channel] };
  };
  const boxes: Box[] = [{ pts: points, weight: total(points) }];
  while (boxes.length < k) {
    let pick = -1, bestScore = 0;
    boxes.forEach((b, i) => {
      if (b.pts.length < 2) return;
      const score = b.weight * range(b.pts).span;
      if (score > bestScore) {
        bestScore = score;
        pick = i;
      }
    });
    if (pick < 0) break;
    const box = boxes[pick];
    const key = (['r', 'g', 'b'] as const)[range(box.pts).channel];
    const sorted = [...box.pts].sort((p, q) => p[key] - q[key]);
    let acc = 0, cut = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      acc += sorted[i].w;
      cut = i + 1;
      if (acc >= box.weight / 2) break;
    }
    const a = sorted.slice(0, cut), b = sorted.slice(cut);
    boxes.splice(pick, 1, { pts: a, weight: total(a) }, { pts: b, weight: total(b) });
  }
  return boxes.map((b) => {
    let r = 0, g = 0, bl = 0;
    for (const p of b.pts) {
      r += p.r * p.w; g += p.g * p.w; bl += p.b * p.w;
    }
    return { color: rgbColor(r / b.weight, g / b.weight, bl / b.weight), weight: b.weight };
  });
}

/** Extracts up to `k` dominant colours from RGBA pixel data, largest share first. Fully transparent pixels are ignored. */
export function extractPalette(rgba: ArrayLike<number>, options: PaletteOptions): Swatch[] {
  const k = Math.min(MAX_K, Math.max(MIN_K, Math.round(options.k)));
  const points = histogram(rgba);
  if (!points.length) return [];
  const total = points.reduce((s, p) => s + p.w, 0);
  const wanted = Math.min(k, points.length);
  const clusters = options.method === 'mediancut' ? medianCut(points, wanted) : kmeans(points, wanted, seededRandom(options.seed));
  return clusters
    .map((c) => ({ color: c.color, hex: toHex(c.color), share: c.weight / total }))
    .sort((a, b) => b.share - a.share || (a.hex < b.hex ? -1 : 1));
}

/* ---------------------------------------------------------------- display and export */

export const percent = (share: number) => (share >= 0.1 ? `${Math.round(share * 100)}%` : share < 0.005 ? '<0.5%' : `${(share * 100).toFixed(1)}%`);

export interface Contrast {
  label: string;
  ratio: string;
  level: 'AAA' | 'AA' | 'AA large' | 'Fail';
}

const WHITE: Color = { r: 1, g: 1, b: 1, alpha: 1 };
const BLACK: Color = { r: 0, g: 0, b: 0, alpha: 1 };

function level(ratio: number): Contrast['level'] {
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large' : 'Fail';
}

/** WCAG contrast of white and of black text on this colour. */
export function contrastBadges(color: Color): { white: Contrast; black: Contrast } {
  const make = (label: string, text: Color): Contrast => {
    const { ratio } = wcag(text, color);
    return { label, ratio: formatRatio(ratio), level: level(ratio) };
  };
  return { white: make('White text', WHITE), black: make('Black text', BLACK) };
}

/** The four notations shown on each swatch. */
export function swatchValues(color: Color): { id: string; label: string; value: string }[] {
  const all = formatAll(color);
  return ['hex', 'rgb', 'hsl', 'oklch'].map((id) => {
    const f = all.find((x) => x.id === id)!;
    return { id, label: f.label, value: f.value };
  });
}

export type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json';

/** Slug for variable names: lower-case letters, digits and hyphens. */
export function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'palette';
}

export function exportPalette(swatches: Swatch[], format: ExportFormat, name = 'palette'): string {
  const n = slug(name);
  const items = swatches.map((s, i) => ({ id: i + 1, s }));
  switch (format) {
    case 'css':
      return `:root {\n${items.map(({ id, s }) => `  --${n}-${id}: ${s.hex};`).join('\n')}\n}\n`;
    case 'scss':
      return `${items.map(({ id, s }) => `$${n}-${id}: ${s.hex};`).join('\n')}\n`;
    case 'tailwind':
      return `@theme {\n${items.map(({ id, s }) => `  --color-${n}-${id}: ${s.hex};`).join('\n')}\n}\n`;
    case 'json': {
      const all = (s: Swatch) => Object.fromEntries(swatchValues(s.color).map((v) => [v.id, v.value]));
      return (
        JSON.stringify(
          { [n]: items.map(({ id, s }) => ({ name: `${n}-${id}`, ...all(s), share: Math.round(s.share * 10000) / 10000 })) },
          null,
          2,
        ) + '\n'
      );
    }
  }
}

export const EXPORT_FORMATS: { value: ExportFormat; label: string; ext: string; mime: string }[] = [
  { value: 'css', label: 'CSS variables', ext: 'css', mime: 'text/css' },
  { value: 'scss', label: 'SCSS', ext: 'scss', mime: 'text/x-scss' },
  { value: 'tailwind', label: 'Tailwind theme', ext: 'css', mime: 'text/css' },
  { value: 'json', label: 'JSON', ext: 'json', mime: 'application/json' },
];
