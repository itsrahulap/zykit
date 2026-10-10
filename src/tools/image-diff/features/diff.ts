// Pure pixel diff on RGBA arrays (same width and height).

export interface DiffOptions {
  /** 0-255: a pixel is "changed" when any channel (incl. alpha) differs by more than this. */
  tolerance: number;
  /** Skip changed pixels that look like anti-aliased edges in both images. */
  ignoreAntiAlias: boolean;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiffResult {
  /** Heatmap RGBA: faded copy of A with changed pixels in red (anti-aliasing skipped: yellow). */
  diff: Uint8ClampedArray<ArrayBuffer>;
  changed: number;
  skippedAntiAlias: number;
  total: number;
  percent: number;
  bbox: Box | null;
}

const lumaOf = (d: Uint8ClampedArray, w: number, h: number) => {
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  return out;
};

/** An edge-blend pixel: strictly between a darker and a lighter neighbour, across a real edge. */
function blendsEdge(l: Float32Array, w: number, h: number, x: number, y: number): boolean {
  const v = l[y * w + x];
  let lo = Infinity, hi = -Infinity;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < w && ny < h) {
        const n = l[ny * w + nx];
        if (n < lo) lo = n;
        if (n > hi) hi = n;
      }
    }
  return lo < v && v < hi && hi - lo > 24;
}

export function diffPixels(a: Uint8ClampedArray, b: Uint8ClampedArray, width: number, height: number, opts: DiffOptions): DiffResult {
  const total = width * height;
  const diff = new Uint8ClampedArray(total * 4);
  const la = opts.ignoreAntiAlias ? lumaOf(a, width, height) : null;
  const lb = opts.ignoreAntiAlias ? lumaOf(b, width, height) : null;
  let changed = 0, skipped = 0, x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    const delta = Math.max(Math.abs(a[p] - b[p]), Math.abs(a[p + 1] - b[p + 1]), Math.abs(a[p + 2] - b[p + 2]), Math.abs(a[p + 3] - b[p + 3]));
    let rgb = [0, 0, 0];
    const x = i % width, y = (i - x) / width;
    if (delta <= opts.tolerance) {
      const v = 200 + 0.2 * (0.299 * a[p] + 0.587 * a[p + 1] + 0.114 * a[p + 2]);
      rgb = [v, v, v];
    } else if (la && lb && blendsEdge(la, width, height, x, y) && blendsEdge(lb, width, height, x, y)) {
      skipped++;
      rgb = [250, 204, 21];
    } else {
      changed++;
      rgb = [239, 68, 68];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    diff[p] = rgb[0]; diff[p + 1] = rgb[1]; diff[p + 2] = rgb[2]; diff[p + 3] = 255;
  }
  return {
    diff,
    changed,
    skippedAntiAlias: skipped,
    total,
    percent: total ? (changed / total) * 100 : 0,
    bbox: changed ? { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } : null,
  };
}

export type Align = 'topleft' | 'scale';

/** Size of the comparison canvas: top-left uses the larger of each side, scale uses A's size. */
export function targetSize(a: { width: number; height: number }, b: { width: number; height: number }, align: Align) {
  return align === 'scale' ? { width: a.width, height: a.height } : { width: Math.max(a.width, b.width), height: Math.max(a.height, b.height) };
}

export const sameSize = (a: { width: number; height: number }, b: { width: number; height: number }) => a.width === b.width && a.height === b.height;
