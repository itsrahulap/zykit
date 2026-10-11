// Pure helpers for PDF → images: page selection, output names and a pixel cap per page.

import { parseRanges } from '../../pdf-tools/features/pdf-tools';

export const MAX_FILE_BYTES = 200 * 1024 * 1024;
/** Largest page we render (width × height in pixels), so a huge page at 300 DPI can't exhaust memory. */
export const MAX_PIXELS = 40_000_000;

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export const MIME: Record<ImageFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
export const EXT: Record<ImageFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };

/** Pages to render, 0-based and in order, from a spec like "1-3, 5". Empty means every page. */
export function selectedPages(spec: string, pageCount: number): number[] {
  if (!spec.trim()) return Array.from({ length: pageCount }, (_, i) => i);
  return [...new Set(parseRanges(spec, pageCount).flat())].sort((a, b) => a - b);
}

/** PDF points are 1/72 inch, so DPI / 72 is the render scale; reduced if the page would exceed MAX_PIXELS. */
export function renderScale(widthPt: number, heightPt: number, dpi: number): number {
  const scale = dpi / 72;
  const pixels = widthPt * scale * heightPt * scale;
  return pixels > MAX_PIXELS ? Math.sqrt(MAX_PIXELS / (widthPt * heightPt)) : scale;
}

/** "report" + page index 4 of 120 → "report-page-005.png". */
export function imageName(base: string, index: number, pageCount: number, format: ImageFormat): string {
  return `${base}-page-${String(index + 1).padStart(String(pageCount).length, '0')}.${EXT[format]}`;
}
