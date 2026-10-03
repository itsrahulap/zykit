// Pixel operations on RGBA data (Uint8ClampedArray), in place or returning a copy. No DOM, so they
// run in a worker and in Node tests. Order: denoise → blur → tone/colour → sharpen.

import { isNeutralAdjust, type Adjust } from './image-editor';

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** Per-channel 256-entry tables for everything that acts on one channel at a time. */
export function toneTables(a: Adjust): [Uint8ClampedArray, Uint8ClampedArray, Uint8ClampedArray] {
  const gain = Math.pow(2, a.exposure / 50); // ±2 stops, applied in linear light
  const rGain = 1 + (0.2 * a.temperature) / 100 + (0.05 * a.tint) / 100;
  const gGain = 1 - (0.2 * a.tint) / 100;
  const bGain = 1 - (0.2 * a.temperature) / 100 + (0.05 * a.tint) / 100;
  const add = a.brightness * 1.275;
  const cv = a.contrast * 2.55;
  const factor = (259 * (cv + 255)) / (255 * (259 - cv));
  const make = (chGain: number) => {
    const t = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      let v = i / 255;
      if (a.exposure) v = fromLinear(Math.min(1, toLinear(v) * gain));
      v = clamp255(v * 255 * chGain);
      v = clamp255(v + add);
      v = clamp255(factor * (v - 128) + 128);
      t[i] = Math.round(v);
    }
    return t;
  };
  return [make(rGain), make(gGain), make(bGain)];
}

/** Separable box blur with clamped edges; alpha is left alone. */
export function boxBlur(src: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const r = Math.round(radius);
  if (r < 1) return src.slice();
  const tmp = new Uint8ClampedArray(src.length);
  const out = new Uint8ClampedArray(src.length);
  const n = 2 * r + 1;
  const pass = (from: Uint8ClampedArray, to: Uint8ClampedArray, len: number, count: number, stride: number, lineStride: number) => {
    for (let line = 0; line < count; line++) {
      const base = line * lineStride;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) sum += from[base + Math.min(len - 1, Math.max(0, k)) * stride + c];
        for (let i = 0; i < len; i++) {
          to[base + i * stride + c] = sum / n;
          sum += from[base + Math.min(len - 1, i + r + 1) * stride + c] - from[base + Math.max(0, i - r) * stride + c];
        }
      }
    }
  };
  pass(src, tmp, w, h, 4, w * 4);
  pass(tmp, out, h, w, w * 4, 4);
  for (let i = 3; i < src.length; i += 4) out[i] = src[i];
  return out;
}

/** Median filter over a (2r+1)² window, per colour channel; edges are clamped. */
export function medianFilter(src: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const out = src.slice();
  const size = (2 * radius + 1) ** 2;
  const mid = size >> 1;
  const win = new Uint8Array(size);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let n = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const yy = Math.min(h - 1, Math.max(0, y + dy)) * w;
          for (let dx = -radius; dx <= radius; dx++) {
            const v = src[(yy + Math.min(w - 1, Math.max(0, x + dx))) * 4 + c];
            let j = n++;
            while (j > 0 && win[j - 1] > v) {
              win[j] = win[j - 1];
              j--;
            }
            win[j] = v;
          }
        }
        out[(y * w + x) * 4 + c] = win[mid];
      }
  return out;
}

/** Unsharp mask: adds `amount` (0…100 → 0…2) of the difference from a blurred copy. */
export function unsharp(data: Uint8ClampedArray, w: number, h: number, amount: number, radius: number): void {
  const blurred = boxBlur(boxBlur(data, w, h, radius), w, h, radius);
  const k = (amount / 100) * 2;
  for (let i = 0; i < data.length; i += 4)
    for (let c = 0; c < 3; c++) data[i + c] = clamp255(data[i + c] + k * (data[i + c] - blurred[i + c]));
}

export interface PixelScale {
  /** Preview scale (preview px per final px, ≤ 1): pixel radii shrink with it so the preview matches the export. */
  scale?: number;
}

/** Applies every adjustment to `data` (RGBA, w×h) and returns the result (a new array when a spatial filter ran). */
export function applyAdjustments(data: Uint8ClampedArray, w: number, h: number, a: Adjust, { scale = 1 }: PixelScale = {}): Uint8ClampedArray {
  if (isNeutralAdjust(a)) return data;
  const radius = (px: number) => (px > 0 ? Math.max(1, Math.round(px * scale)) : 0);
  let px = data;
  if (a.denoise) px = medianFilter(px, w, h, scale < 0.5 ? 1 : a.denoise);
  if (a.blur > 0) px = boxBlur(px, w, h, radius(a.blur));
  if (px === data) px = data.slice();

  const tone = a.exposure || a.brightness || a.contrast || a.temperature || a.tint;
  const [tr, tg, tb] = toneTables(tone ? a : { ...a, exposure: 0, brightness: 0, contrast: 0, temperature: 0, tint: 0 });
  const sat = 1 + a.saturation / 100;
  const sepia = a.sepia / 100;
  const colour = a.saturation || a.vibrance || a.grayscale || a.sepia;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i], g = px[i + 1], b = px[i + 2];
    if (tone) {
      r = tr[r];
      g = tg[g];
      b = tb[b];
    }
    if (colour) {
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (a.vibrance) {
        // Boost muted colours more than vivid ones (and soften vivid ones when negative).
        const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
        const k = 1 + (a.vibrance / 100) * (1 - chroma);
        r = l + (r - l) * k;
        g = l + (g - l) * k;
        b = l + (b - l) * k;
      }
      if (a.saturation) {
        const l2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = l2 + (r - l2) * sat;
        g = l2 + (g - l2) * sat;
        b = l2 + (b - l2) * sat;
      }
      if (a.grayscale) {
        const l3 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = g = b = l3;
      }
      if (sepia) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * sepia;
        g += (sg - g) * sepia;
        b += (sb - b) * sepia;
      }
    }
    px[i] = clamp255(r);
    px[i + 1] = clamp255(g);
    px[i + 2] = clamp255(b);
  }
  if (a.sharpen > 0) unsharp(px, w, h, a.sharpen, Math.max(1, Math.round(1.5 * scale)));
  return px;
}
