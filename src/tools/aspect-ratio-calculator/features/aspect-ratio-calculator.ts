// Pure logic for Aspect Ratio Calculator: no DOM, so it's unit-testable in Node.

export const MAX_SIDE = 100000;

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Parse a positive whole-or-decimal side; null if empty, not a number, or out of range. */
export function parseSide(s: string): number | null {
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isFinite(n) && n > 0 && n <= MAX_SIDE ? n : null;
}

export interface Ratio {
  w: number;
  h: number;
}

/** Exact ratio for whole-number sides; decimal sides are scaled by 10^k (k ≤ 4) first. */
export function simplify(w: number, h: number): Ratio {
  let k = 1;
  while ((!Number.isInteger(w * k) || !Number.isInteger(h * k)) && k < 10000) k *= 10;
  const a = Math.round(w * k);
  const b = Math.round(h * k);
  const g = gcd(a, b) || 1;
  return { w: a / g, h: b / g };
}

export const COMMON_RATIOS: Ratio[] = [
  [1, 1], [5, 4], [4, 3], [3, 2], [16, 10], [16, 9], [21, 9], [32, 9], [2, 1], [3, 1],
  [4, 5], [2, 3], [3, 4], [10, 16], [9, 16], [9, 21],
].map(([w, h]) => ({ w, h }));

/** The common ratio closest to w:h (compared on a log scale so 2:1 and 1:2 are equally far from 1:1). */
export function nearestCommon(w: number, h: number): { ratio: Ratio; exact: boolean } {
  const r = Math.log(w / h);
  let best = COMMON_RATIOS[0];
  for (const c of COMMON_RATIOS) if (Math.abs(Math.log(c.w / c.h) - r) < Math.abs(Math.log(best.w / best.h) - r)) best = c;
  const exact = Math.abs(Math.log(best.w / best.h) - r) < 1e-9;
  return { ratio: best, exact };
}

export const PRESETS: { id: string; label: string; ratio: Ratio }[] = [
  { id: '16:9', label: '16:9', ratio: { w: 16, h: 9 } },
  { id: '4:3', label: '4:3', ratio: { w: 4, h: 3 } },
  { id: '21:9', label: '21:9', ratio: { w: 21, h: 9 } },
  { id: '1:1', label: '1:1', ratio: { w: 1, h: 1 } },
  { id: '9:16', label: '9:16', ratio: { w: 9, h: 16 } },
  { id: '3:2', label: '3:2', ratio: { w: 3, h: 2 } },
  // √2 ≈ 1.41421356 and φ ≈ 1.61803399, rounded to 1.4142:1 and 1.6180:1.
  { id: 'a-paper', label: 'A-paper (√2)', ratio: { w: 7071, h: 5000 } },
  { id: 'golden', label: 'Golden (φ)', ratio: { w: 8090, h: 5000 } },
];

/** Height for a width at ratio rw:rh, rounded to a whole unit (at least 1). */
export function solveHeight(w: number, r: Ratio): number {
  return Math.max(1, Math.round((w * r.h) / r.w));
}
export function solveWidth(h: number, r: Ratio): number {
  return Math.max(1, Math.round((h * r.w) / r.h));
}

export function scaleBy(w: number, h: number, percent: number): { w: number; h: number } {
  return { w: Math.max(1, Math.round((w * percent) / 100)), h: Math.max(1, Math.round((h * percent) / 100)) };
}

export const RESOLUTIONS: { name: string; w: number; h: number }[] = [
  { name: 'VGA', w: 640, h: 480 }, { name: 'SVGA', w: 800, h: 600 }, { name: 'XGA', w: 1024, h: 768 },
  { name: 'HD 720p', w: 1280, h: 720 }, { name: 'WXGA', w: 1280, h: 800 }, { name: 'SXGA', w: 1280, h: 1024 },
  { name: 'HD+', w: 1600, h: 900 }, { name: 'UXGA', w: 1600, h: 1200 }, { name: 'Full HD 1080p', w: 1920, h: 1080 },
  { name: 'WUXGA', w: 1920, h: 1200 }, { name: 'UWHD', w: 2560, h: 1080 }, { name: 'QHD 1440p', w: 2560, h: 1440 },
  { name: 'WQXGA', w: 2560, h: 1600 }, { name: 'UWQHD', w: 3440, h: 1440 }, { name: '4K UHD', w: 3840, h: 2160 },
  { name: 'DCI 4K', w: 4096, h: 2160 }, { name: 'Super Ultrawide', w: 5120, h: 1440 }, { name: '5K', w: 5120, h: 2880 },
  { name: '8K UHD', w: 7680, h: 4320 }, { name: 'Square 1080', w: 1080, h: 1080 }, { name: 'Story 1080×1920', w: 1080, h: 1920 },
  { name: 'Photo 3:2', w: 3000, h: 2000 }, { name: 'Portrait 4:5', w: 1080, h: 1350 },
];

/** Listed resolutions whose ratio is within 1% of w:h. */
export function resolutionsFor(w: number, h: number) {
  const r = w / h;
  return RESOLUTIONS.filter((x) => Math.abs(x.w / x.h / r - 1) < 0.01);
}

export function cssSnippet(r: Ratio): string {
  return `aspect-ratio: ${r.w} / ${r.h};`;
}

export function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}
