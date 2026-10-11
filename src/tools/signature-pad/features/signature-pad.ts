// Signature maths: point filtering, midpoint-quadratic smoothing, pressure-to-width, trim bounds
// and SVG/path output. Pure functions; the page draws the same path strings on canvas via Path2D.

export interface Pt {
  x: number;
  y: number;
  /** 0–1. Mouse and touch report a constant 0.5, which maps to the pen's nominal width. */
  p: number;
}

export interface Stroke {
  pts: Pt[];
  color: string;
  width: number;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CANVAS_W = 600;
export const CANVAS_H = 240;
export const MIN_DIST = 1.5;

/** Appends a point unless it is within MIN_DIST of the last one (kills jitter and duplicate events). */
export function addPoint(pts: Pt[], p: Pt): boolean {
  const last = pts[pts.length - 1];
  if (last && Math.hypot(p.x - last.x, p.y - last.y) < MIN_DIST) return false;
  pts.push(p);
  return true;
}

/** Pressure 0–1 → width multiplier 0.5–1.5; 0.5 (mouse/touch) gives exactly 1. */
export const pressureFactor = (p: number) => 0.5 + Math.max(0, Math.min(1, p));

const r = (n: number) => Math.round(n * 100) / 100;

/**
 * Smooths a stroke into path pieces. Each piece is a run of quadratic Béziers through the midpoints
 * of consecutive points (control point = the point itself), so the curve is continuous without
 * overshooting. Runs are split where the pressure-driven width changes.
 */
export function strokePaths(s: Stroke): { d: string; w: number }[] {
  const { pts } = s;
  if (!pts.length) return [];
  const w0 = (p: Pt) => r(s.width * pressureFactor(p.p));
  if (pts.length === 1) return [{ d: `M${r(pts[0].x)} ${r(pts[0].y)}h0`, w: w0(pts[0]) }];
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const out: { d: string; w: number }[] = [];
  let cur: { d: string; w: number } | null = null;
  const push = (from: { x: number; y: number }, seg: string, w: number) => {
    if (!cur || Math.abs(cur.w - w) > s.width * 0.06) {
      cur = { d: `M${r(from.x)} ${r(from.y)}`, w };
      out.push(cur);
    }
    cur.d += seg;
  };
  if (pts.length === 2) {
    push(pts[0], `L${r(pts[1].x)} ${r(pts[1].y)}`, w0(pts[0]));
    return out;
  }
  let start: { x: number; y: number } = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const end = mid(pts[i], pts[i + 1]);
    push(start, `Q${r(pts[i].x)} ${r(pts[i].y)} ${r(end.x)} ${r(end.y)}`, w0(pts[i]));
    start = end;
  }
  const last = pts[pts.length - 1];
  push(start, `L${r(last.x)} ${r(last.y)}`, w0(last));
  return out;
}

/** Bounding box of all strokes including half the widest line, or null when empty. */
export function strokeBounds(strokes: Stroke[]): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of strokes) {
    const half = (s.width * pressureFactor(1)) / 2;
    for (const p of s.pts) {
      minX = Math.min(minX, p.x - half);
      minY = Math.min(minY, p.y - half);
      maxX = Math.max(maxX, p.x + half);
      maxY = Math.max(maxY, p.y + half);
    }
  }
  return minX === Infinity ? null : { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Adds `pad` around the box and clamps it to the canvas (0,0,W,H) when `clip` is given. */
export function padBounds(b: Bounds, pad: number, clip?: { w: number; h: number }): Bounds {
  let x = b.x - pad;
  let y = b.y - pad;
  let x2 = b.x + b.w + pad;
  let y2 = b.y + b.h + pad;
  if (clip) {
    x = Math.max(0, x);
    y = Math.max(0, y);
    x2 = Math.min(clip.w, x2);
    y2 = Math.min(clip.h, y2);
  }
  return { x, y, w: Math.max(1, x2 - x), h: Math.max(1, y2 - y) };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const isHexColor = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

/** SVG with a transparent background, cropped to `box` (stroke coordinates are shifted by the viewBox). */
export function strokesToSvg(strokes: Stroke[], box: Bounds): string {
  const paths = strokes
    .filter((s) => isHexColor(s.color))
    .flatMap((s) => strokePaths(s).map((p) => `<path d="${p.d}" fill="none" stroke="${s.color}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`))
    .join('');
  const f = (n: number) => r(n);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(box.w)}" height="${f(box.h)}" viewBox="${f(box.x)} ${f(box.y)} ${f(box.w)} ${f(box.h)}">${paths}</svg>`;
}

// ---- Typed signature ---------------------------------------------------------------------------

/** System cursive stacks only; nothing is downloaded. Which one renders depends on the device. */
export const FONT_STACKS: { value: string; label: string; css: string }[] = [
  { value: 'script', label: 'Script', css: '"Snell Roundhand", "Apple Chancery", "Segoe Script", "Brush Script MT", cursive' },
  { value: 'formal', label: 'Formal', css: '"Zapfino", "Lucida Calligraphy", "Palace Script MT", "Apple Chancery", cursive' },
  { value: 'handwriting', label: 'Handwriting', css: '"Bradley Hand", "Segoe Print", "Lucida Handwriting", "Comic Sans MS", cursive' },
  { value: 'marker', label: 'Marker', css: '"Marker Felt", "Ink Free", "Chalkboard SE", "Comic Sans MS", cursive' },
];

export interface TypedMetrics {
  width: number;
  ascent: number;
  descent: number;
}

/** Box for typed text drawn at baseline y=0 starting at x=0, from canvas text metrics. */
export function typedBounds(m: TypedMetrics, pad: number): Bounds {
  return { x: -pad, y: -m.ascent - pad, w: m.width + pad * 2, h: m.ascent + m.descent + pad * 2 };
}

export function typedToSvg(text: string, o: { css: string; size: number; color: string }, box: Bounds): string {
  if (!isHexColor(o.color)) return '';
  const f = (n: number) => r(n);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(box.w)}" height="${f(box.h)}" viewBox="${f(box.x)} ${f(box.y)} ${f(box.w)} ${f(box.h)}"><text x="0" y="0" font-family="${esc(o.css)}" font-size="${o.size}" fill="${o.color}" xml:space="preserve">${esc(text)}</text></svg>`;
}
