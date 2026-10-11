// Pure logic for the Placeholder Image Generator: no DOM, so it's unit-testable in Node.

export const MAX_SIDE = 8000;
export const MAX_BATCH = 30;

export interface Size {
  w: number;
  h: number;
}

export function parseSide(s: string): number | null {
  const t = s.trim();
  const n = Number(t);
  return /^\d+$/.test(t) && n >= 1 && n <= MAX_SIDE ? n : null;
}

/** Parse "800x600, 400×300, 256" (commas, spaces or new lines; a single number is a square). */
export function parseSizes(input: string): { sizes: Size[]; invalid: string[] } {
  const sizes: Size[] = [];
  const invalid: string[] = [];
  for (const tok of input.split(/[\s,;]+/).filter(Boolean)) {
    const m = /^(\d+)(?:[x×*](\d+))?$/i.exec(tok);
    const w = m ? parseSide(m[1]) : null;
    const h = m ? parseSide(m[2] ?? m[1]) : null;
    if (w && h) sizes.push({ w, h });
    else invalid.push(tok);
  }
  return { sizes, invalid };
}

/** Normalise #rgb / #rrggbb (with or without #) to lower-case #rrggbb; null if invalid. */
export function normalizeColor(s: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return `#${h.toLowerCase()}`;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Largest font that fits: at most 30% of the height and 90% of the width (average glyph about 0.58em wide). Minimum 8. */
export function autoFontSize(w: number, h: number, text: string): number {
  const len = Math.max(1, [...text].length);
  return Math.max(8, Math.floor(Math.min(h * 0.3, (w * 0.9) / (len * 0.58))));
}

export const defaultText = (s: Size) => `${s.w}×${s.h}`;

export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
}

export interface SvgOptions extends Size {
  bg: string;
  fg: string;
  text: string;
  fontSize: number;
}

export function buildSvg(o: SvgOptions): string {
  const label = o.text
    ? `<text x="50%" y="50%" fill="${o.fg}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="${o.fontSize}" font-weight="600" text-anchor="middle" dominant-baseline="central">${escapeXml(o.text)}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}"><rect width="100%" height="100%" fill="${o.bg}"/>${label}</svg>`;
}

export const svgDataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
