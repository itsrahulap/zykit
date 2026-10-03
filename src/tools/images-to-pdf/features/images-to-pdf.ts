// Pure logic for Images to PDF: page layout, EXIF handling, how each image is embedded, and the
// pdf-lib build. No DOM, so it runs in the tool's worker and in unit tests.

import { degrees, clip, endPath, PDFDocument, popGraphicsState, pushGraphicsState, rectangle } from 'pdf-lib';
import { sniffImageType } from '../../../shared/lib/image';

export const MAX_IMAGES = 200;
export const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
/** PDF viewers cap pages at 200 inches (14 400 pt). */
export const MAX_PAGE_PT = 14_400;
/** Images are placed at 96 dpi when the page fits the image (1 px = 0.75 pt). */
export const PX_TO_PT = 0.75;

export type PageSize = 'a4' | 'letter' | 'legal' | 'fit';
export type Orientation = 'auto' | 'portrait' | 'landscape';
export type Fit = 'contain' | 'cover';
export type Margin = 'none' | 'small' | 'medium' | 'large';
export type Rotation = 0 | 90 | 180 | 270;
export type ConvertFormat = 'jpeg' | 'png';

export const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};
/** Margins in points (10, 20 and 30 mm). */
export const MARGINS: Record<Margin, number> = { none: 0, small: 28.35, medium: 56.69, large: 85.04 };

export interface LayoutOptions {
  size: PageSize;
  orientation: Orientation;
  margin: Margin;
  fit: Fit;
}

export const DEFAULT_LAYOUT: LayoutOptions = { size: 'a4', orientation: 'auto', margin: 'small', fit: 'contain' };

export const normRotation = (deg: number): Rotation => ((((Math.round(deg / 90) * 90) % 360) + 360) % 360) as Rotation;

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ---------------------------------------------------------------- layout */

export interface PagePlan {
  pageW: number;
  pageH: number;
  /** Origin and size to pass to drawImage (before pdf-lib's counter-clockwise `rotate`). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Counter-clockwise rotation for drawImage, in degrees. */
  rotate: number;
  /** Visible area to clip to (cover mode), in page coordinates. */
  clip?: { x: number; y: number; w: number; h: number };
}

/**
 * Where an image goes on its page. `rotation` is clockwise, as the user sees it. imgW/imgH are the
 * image's own pixel size. The drawn image is centred inside the margins.
 */
export function planPage(imgW: number, imgH: number, rotation: Rotation, o: LayoutOptions): PagePlan {
  const odd = rotation === 90 || rotation === 270;
  const ew = odd ? imgH : imgW;
  const eh = odd ? imgW : imgH;
  const m = MARGINS[o.margin];

  let pageW: number;
  let pageH: number;
  if (o.size === 'fit') {
    pageW = ew * PX_TO_PT + 2 * m;
    pageH = eh * PX_TO_PT + 2 * m;
    const k = Math.min(1, MAX_PAGE_PT / Math.max(pageW, pageH));
    pageW *= k;
    pageH *= k;
  } else {
    const [bw, bh] = PAGE_SIZES[o.size];
    const landscape = o.orientation === 'landscape' || (o.orientation === 'auto' && ew > eh);
    [pageW, pageH] = landscape ? [bh, bw] : [bw, bh];
  }
  const mm = Math.min(m, Math.max(0, Math.min(pageW, pageH) / 2 - 1));
  const aw = pageW - 2 * mm;
  const ah = pageH - 2 * mm;

  const fill = o.size === 'fit';
  const s = fill ? Math.min(aw / ew, ah / eh) : o.fit === 'cover' ? Math.max(aw / ew, ah / eh) : Math.min(aw / ew, ah / eh);
  const dw = ew * s;
  const dh = eh * s;
  const x = mm + (aw - dw) / 2;
  const y = mm + (ah - dh) / 2;

  // Pre-rotation size, and the corner pdf-lib rotates around, for each quarter turn.
  const width = odd ? dh : dw;
  const height = odd ? dw : dh;
  const origin: Record<Rotation, [number, number, number]> = {
    0: [x, y, 0],
    90: [x, y + dh, 270],
    180: [x + dw, y + dh, 180],
    270: [x + dw, y, 90],
  };
  const [ox, oy, rotate] = origin[rotation];
  const plan: PagePlan = { pageW, pageH, x: ox, y: oy, width, height, rotate };
  if (!fill && o.fit === 'cover') plan.clip = { x: mm, y: mm, w: aw, h: ah };
  return plan;
}

/* ---------------------------------------------------------------- EXIF and format */

/** EXIF orientation (1–8) of a JPEG, or 1 when absent or unreadable. */
export function exifOrientation(b: Uint8Array): number {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return 1;
  let p = 2;
  while (p + 4 <= b.length && b[p] === 0xff) {
    const marker = b[p + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const len = (b[p + 2] << 8) | b[p + 3];
    if (len < 2) break;
    if (marker === 0xe1 && len >= 16 && b[p + 4] === 0x45 && b[p + 5] === 0x78 && b[p + 6] === 0x69 && b[p + 7] === 0x66) {
      const t = p + 10; // TIFF header
      const le = b[t] === 0x49;
      const u16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
      const u32 = (o: number) => (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
      if (t + 8 > b.length) return 1;
      const ifd = t + u32(t + 4);
      if (ifd + 2 > b.length) return 1;
      const n = u16(ifd);
      for (let i = 0; i < n; i++) {
        const e = ifd + 2 + i * 12;
        if (e + 12 > b.length) break;
        if (u16(e) === 0x0112) {
          const v = u16(e + 8);
          return v >= 1 && v <= 8 ? v : 1;
        }
      }
      return 1;
    }
    p += 2 + len;
  }
  return 1;
}

/** Clockwise rotation that displays an EXIF-oriented image upright, and whether it is also mirrored. */
export function orientationTransform(o: number): { rotation: Rotation; mirrored: boolean } {
  switch (o) {
    case 2: return { rotation: 0, mirrored: true };
    case 3: return { rotation: 180, mirrored: false };
    case 4: return { rotation: 180, mirrored: true };
    case 5: return { rotation: 90, mirrored: true };
    case 6: return { rotation: 90, mirrored: false };
    case 7: return { rotation: 270, mirrored: true };
    case 8: return { rotation: 270, mirrored: false };
    default: return { rotation: 0, mirrored: false };
  }
}

export interface ImageKind {
  /** `jpeg` and `png` go into the PDF as they are; anything else is redrawn through a canvas. */
  mode: 'jpeg' | 'png' | 'convert';
  mime: string;
  label: string;
  /** Rotation from the EXIF tag, added to the user's. */
  baseRotation: Rotation;
}

/** How to embed an image, judged from its first bytes (at least the first 64 KB for JPEG EXIF). */
export function classifyImage(head: Uint8Array): ImageKind | null {
  const t = sniffImageType(head);
  if (!t) return null;
  if (t.mime === 'image/jpeg') {
    const { rotation, mirrored } = orientationTransform(exifOrientation(head));
    return mirrored ? { mode: 'convert', mime: t.mime, label: t.label, baseRotation: 0 } : { mode: 'jpeg', mime: t.mime, label: t.label, baseRotation: rotation };
  }
  if (t.mime === 'image/png') return { mode: 'png', mime: t.mime, label: t.label, baseRotation: 0 };
  return { mode: 'convert', mime: t.mime, label: t.label, baseRotation: 0 };
}

/* ---------------------------------------------------------------- output name */

// oxlint-disable-next-line no-control-regex
const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g;
export function outputName(raw: string): string {
  const base = raw.trim().replace(UNSAFE, '_').replace(/\.pdf$/i, '').replace(/^\.+/, '').slice(0, 120);
  return `${base || 'images'}.pdf`;
}

/* ---------------------------------------------------------------- build */

export interface BuildItem {
  bytes: Uint8Array;
  kind: 'jpeg' | 'png';
  /** Total clockwise rotation (user + EXIF). */
  rotation: Rotation;
}

export interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}
export const EMPTY_METADATA: Metadata = { title: '', author: '', subject: '', keywords: '' };

export class BuildError extends Error {
  index: number;
  constructor(index: number, message: string) {
    super(message);
    this.index = index;
  }
}

/**
 * Builds the PDF: one page per image. The document is created without pdf-lib's default Producer,
 * Creator or date entries, so only the metadata you typed ends up in the file.
 */
export async function buildPdf(items: BuildItem[], layout: LayoutOptions, meta: Metadata, onPage?: (done: number, total: number) => void): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let image;
    try {
      image = it.kind === 'jpeg' ? await doc.embedJpg(it.bytes) : await doc.embedPng(it.bytes);
    } catch {
      throw new BuildError(i, `Image ${i + 1} couldn't be added to the PDF. The file may be damaged.`);
    }
    const plan = planPage(image.width, image.height, it.rotation, layout);
    const page = doc.addPage([plan.pageW, plan.pageH]);
    if (plan.clip) page.pushOperators(pushGraphicsState(), rectangle(plan.clip.x, plan.clip.y, plan.clip.w, plan.clip.h), clip(), endPath());
    page.drawImage(image, { x: plan.x, y: plan.y, width: plan.width, height: plan.height, rotate: degrees(plan.rotate) });
    if (plan.clip) page.pushOperators(popGraphicsState());
    onPage?.(i + 1, items.length);
  }
  if (meta.title.trim()) doc.setTitle(meta.title.trim());
  if (meta.author.trim()) doc.setAuthor(meta.author.trim());
  if (meta.subject.trim()) doc.setSubject(meta.subject.trim());
  const keywords = meta.keywords.split(',').map((k) => k.trim()).filter(Boolean);
  if (keywords.length) doc.setKeywords(keywords);
  return doc.save();
}
