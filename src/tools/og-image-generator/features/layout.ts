// Text wrapping and auto-fit for the canvas. The measuring function is injected, so this is
// pure and testable without a canvas.

export type Measure = (text: string, fontSize: number) => number;

export const ELLIPSIS = '…';

/** Splits a single word that is wider than maxWidth into pieces that each fit. */
export function breakWord(word: string, fontSize: number, maxWidth: number, measure: Measure): string[] {
  const chars = Array.from(word);
  const out: string[] = [];
  let cur = '';
  for (const ch of chars) {
    if (cur && measure(cur + ch, fontSize) > maxWidth) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Greedy word wrap. Newlines are kept as breaks; blank lines are dropped; long words are split. */
export function wrapText(text: string, fontSize: number, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = '';
    for (const w of words) {
      const pieces = measure(w, fontSize) > maxWidth ? breakWord(w, fontSize, maxWidth, measure) : [w];
      for (const [i, piece] of pieces.entries()) {
        const attempt = cur && i === 0 ? `${cur} ${piece}` : piece;
        if (cur && measure(attempt, fontSize) > maxWidth) {
          lines.push(cur);
          cur = piece;
        } else if (i > 0 && cur) {
          lines.push(cur);
          cur = piece;
        } else cur = attempt;
      }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

/** Shortens a line (by whole characters) so that it plus an ellipsis fits. */
export function ellipsize(line: string, fontSize: number, maxWidth: number, measure: Measure): string {
  const chars = Array.from(line.trimEnd());
  while (chars.length && measure(chars.join('') + ELLIPSIS, fontSize) > maxWidth) chars.pop();
  return chars.join('').trimEnd() + ELLIPSIS;
}

export interface FitOptions {
  maxSize: number;
  minSize: number;
  maxWidth: number;
  maxHeight: number;
  lineHeight: number;
  maxLines: number;
  step?: number;
}
export interface Fit {
  size: number;
  lines: string[];
  /** Total block height in px (lines x size x lineHeight). */
  height: number;
  /** True when the text had to be cut at the smallest size. */
  truncated: boolean;
}

/** Largest font size (within min and max) at which the wrapped text fits the box. Cuts with an ellipsis as a last resort. */
export function fitText(text: string, o: FitOptions, measure: Measure): Fit {
  if (!text.trim()) return { size: o.maxSize, lines: [], height: 0, truncated: false };
  const step = o.step ?? 2;
  const fits = (lines: string[], size: number) => lines.length <= o.maxLines && lines.length * size * o.lineHeight <= o.maxHeight;
  for (let size = o.maxSize; size >= o.minSize; size -= step) {
    const lines = wrapText(text, size, o.maxWidth, measure);
    if (fits(lines, size)) return { size, lines, height: lines.length * size * o.lineHeight, truncated: false };
  }
  const size = o.minSize;
  const all = wrapText(text, size, o.maxWidth, measure);
  const allowed = Math.max(1, Math.min(o.maxLines, Math.floor(o.maxHeight / (size * o.lineHeight))));
  const lines = all.slice(0, allowed);
  if (all.length > allowed) lines[allowed - 1] = ellipsize(lines[allowed - 1] + ' ' + all.slice(allowed).join(' '), size, o.maxWidth, measure);
  else if (lines[0] && measure(lines[0], size) > o.maxWidth) lines[0] = ellipsize(lines[0], size, o.maxWidth, measure);
  return { size, lines, height: lines.length * size * o.lineHeight, truncated: all.length > allowed };
}

/** Scales (w, h) to fit inside (boxW, boxH) without enlarging past `maxScale` times the source. */
export function contain(w: number, h: number, boxW: number, boxH: number, maxScale = 1): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: 0, h: 0 };
  const s = Math.min(boxW / w, boxH / h, maxScale);
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

export type Align = 'left' | 'center' | 'right';

/** Left edge of an item of width `itemW` placed in [margin, canvasW - margin]. */
export function alignX(align: Align, canvasW: number, margin: number, itemW: number): number {
  if (align === 'left') return margin;
  if (align === 'right') return canvasW - margin - itemW;
  return Math.round((canvasW - itemW) / 2);
}

/* ------------------------------------------------------------------- sizes */

export type SizeId = 'og' | 'x' | 'square';
export interface SizeDef {
  id: SizeId;
  label: string;
  short: string;
  w: number;
  h: number;
  card: 'summary_large_image' | 'summary';
}
export const SIZES: SizeDef[] = [
  { id: 'og', label: '1200 × 630 (Facebook, LinkedIn, Slack)', short: '1200×630', w: 1200, h: 630, card: 'summary_large_image' },
  { id: 'x', label: '1200 × 600 (X / Twitter)', short: '1200×600', w: 1200, h: 600, card: 'summary_large_image' },
  { id: 'square', label: '1080 × 1080 (square)', short: '1080×1080', w: 1080, h: 1080, card: 'summary' },
];
export const sizeById = (id: SizeId): SizeDef => SIZES.find((s) => s.id === id) ?? SIZES[0];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const marginFor = (s: SizeDef) => (s.w === s.h ? 90 : 72);

/** Area where text should stay so that platform crops and rounded corners never clip it. */
export function safeArea(s: SizeDef): Rect {
  const m = marginFor(s);
  return { x: m, y: m, w: s.w - 2 * m, h: s.h - 2 * m };
}

/** Centre square that survives a 1:1 crop (WhatsApp, some chat apps); null for square images. */
export function squareCrop(s: SizeDef): Rect | null {
  return s.w === s.h ? null : { x: (s.w - s.h) / 2, y: 0, w: s.h, h: s.h };
}
