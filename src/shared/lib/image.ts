// Image helpers shared by the image tools: size caps, type sniffing, resize planning (pure, unit-tested)
// and decode → resample → encode in the browser (main thread or a worker with OffscreenCanvas).

import { AppError } from './errors';

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 100_000_000;
/** Longest side we'll create a canvas for; browsers refuse (or silently fail) above this. */
export const MAX_CANVAS_SIDE = 16_384;

/* ---------------------------------------------------------------- limits */

export function checkFileSize(size: number) {
  if (size > MAX_IMAGE_BYTES)
    throw new AppError('TOO_LARGE', `This file is ${(size / 1024 / 1024).toFixed(1)} MB. Images up to 50 MB are supported.`);
}

export function checkPixels(width: number, height: number, what = 'This image') {
  if (width * height > MAX_IMAGE_PIXELS)
    throw new AppError(
      'TOO_MANY_PIXELS',
      `${what} is ${width.toLocaleString('en-US')} × ${height.toLocaleString('en-US')} pixels (${Math.round((width * height) / 1e6)} megapixels). Up to 100 megapixels are supported.`,
    );
  if (width > MAX_CANVAS_SIDE || height > MAX_CANVAS_SIDE)
    throw new AppError('TOO_MANY_PIXELS', `${what} would be wider or taller than ${MAX_CANVAS_SIDE.toLocaleString('en-US')} pixels, which browsers can't draw.`);
}

/* ---------------------------------------------------------------- type sniffing */

export interface SniffedType {
  mime: string;
  ext: string;
  label: string;
}

const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));

/** Identify an image format from its first bytes (magic numbers). Returns null for anything else. */
export function sniffImageType(b: Uint8Array): SniffedType | null {
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG' && b[4] === 0x0d && b[5] === 0x0a) return { mime: 'image/png', ext: 'png', label: 'PNG' };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' };
  if (b.length >= 6 && (ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a')) return { mime: 'image/gif', ext: 'gif', label: 'GIF' };
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return { mime: 'image/webp', ext: 'webp', label: 'WebP' };
  if (b.length >= 14 && b[0] === 0x42 && b[1] === 0x4d) return { mime: 'image/bmp', ext: 'bmp', label: 'BMP' };
  if (b.length >= 6 && b[0] === 0 && b[1] === 0 && (b[2] === 1 || b[2] === 2) && b[3] === 0 && (b[4] | b[5]) !== 0)
    return b[2] === 1 ? { mime: 'image/x-icon', ext: 'ico', label: 'ICO' } : { mime: 'image/x-icon', ext: 'cur', label: 'CUR' };
  if (b.length >= 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a)))
    return { mime: 'image/tiff', ext: 'tiff', label: 'TIFF' };
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0x0a) return { mime: 'image/jxl', ext: 'jxl', label: 'JPEG XL' };
  if (b.length >= 12 && ascii(b, 4, 8) === 'JXL \r\n\x87\n') return { mime: 'image/jxl', ext: 'jxl', label: 'JPEG XL' };
  if (b.length >= 12 && ascii(b, 4, 4) === 'ftyp') {
    const boxSize = Math.min(b.length, ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0, 256);
    const brands: string[] = [ascii(b, 8, 4)];
    for (let i = 16; i + 4 <= boxSize; i += 4) brands.push(ascii(b, i, 4));
    if (brands.some((x) => x === 'avif' || x === 'avis')) return { mime: 'image/avif', ext: 'avif', label: 'AVIF' };
    if (brands.some((x) => ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'].includes(x)))
      return { mime: 'image/heic', ext: 'heic', label: 'HEIC' };
  }
  // SVG: text that starts with an XML declaration, comment, doctype or <svg, and has an <svg element early on.
  const head = new TextDecoder('utf-8', { fatal: false }).decode(b.subarray(0, 2048)).replace(/^﻿/, '').trimStart();
  if (/^<(\?xml|!--|!DOCTYPE|svg)/i.test(head) && /<svg[\s>]/i.test(head)) return { mime: 'image/svg+xml', ext: 'svg', label: 'SVG' };
  return null;
}

/** Width and height read from the file header without decoding, or null if unknown. */
export function readImageSize(b: Uint8Array): { width: number; height: number } | null {
  const type = sniffImageType(b)?.mime;
  const u16be = (i: number) => (b[i] << 8) | b[i + 1];
  const u16le = (i: number) => b[i] | (b[i + 1] << 8);
  const u24le = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const u32be = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const i32le = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);
  if (type === 'image/png' && b.length >= 24 && ascii(b, 12, 4) === 'IHDR') return { width: u32be(16), height: u32be(20) };
  if (type === 'image/gif' && b.length >= 10) return { width: u16le(6), height: u16le(8) };
  if (type === 'image/bmp' && b.length >= 26) return { width: Math.abs(i32le(18)), height: Math.abs(i32le(22)) };
  if (type === 'image/webp' && b.length >= 30) {
    const chunk = ascii(b, 12, 4);
    if (chunk === 'VP8X') return { width: 1 + u24le(24), height: 1 + u24le(27) };
    if (chunk === 'VP8L' && b[20] === 0x2f) {
      const b0 = b[21], b1 = b[22], b2 = b[23], b3 = b[24];
      return { width: 1 + (b0 | ((b1 & 0x3f) << 8)), height: 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)) };
    }
    if (chunk === 'VP8 ') return { width: u16le(26) & 0x3fff, height: u16le(28) & 0x3fff };
    return null;
  }
  if (type === 'image/jpeg') {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) return { width: u16be(i + 7), height: u16be(i + 5) };
      if (marker === 0xda || marker === 0xd9) return null;
      i += 2 + u16be(i + 2);
    }
  }
  return null;
}

/* ---------------------------------------------------------------- names and output types */

export const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/svg+xml': 'svg',
};

export const MIME_LABEL: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/gif': 'GIF',
  'image/bmp': 'BMP',
  'image/x-icon': 'ICO',
  'image/svg+xml': 'SVG',
  'image/heic': 'HEIC',
  'image/tiff': 'TIFF',
};

/** Formats that store an alpha channel; anything else needs a background colour. */
export const supportsAlpha = (mime: string) => mime !== 'image/jpeg';
/** Formats whose encoder takes a quality setting. */
export const isLossy = (mime: string) => mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/avif';

/** Replace a file name's extension (and optionally add a suffix before it). */
export function renameFile(name: string, mime: string, suffix = ''): string {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name) || 'image';
  return `${base}${suffix}.${MIME_EXT[mime] ?? 'img'}`;
}

/**
 * The type to encode to: the requested one, or for "same" the input type when the browser can
 * encode it, falling back to PNG (e.g. for GIF, BMP or ICO input, which canvases can't write).
 */
export function resolveOutputType(inputMime: string, requested: string, encodable: readonly string[]): string {
  if (requested !== 'same') return requested;
  const input = inputMime === 'image/jpg' ? 'image/jpeg' : inputMime;
  return encodable.includes(input) ? input : 'image/png';
}

/* ---------------------------------------------------------------- resize planning */

export type FitMode = 'contain' | 'cover' | 'fill';

export type ResizeSpec =
  | { mode: 'none' }
  /** Shrink to fit inside max width/height; never enlarges. */
  | { mode: 'max'; maxWidth?: number; maxHeight?: number }
  /** Exact size; a missing side follows the aspect ratio. */
  | { mode: 'exact'; width?: number; height?: number }
  | { mode: 'scale'; percent: number }
  /** contain: scale to fit inside the box · cover: fill the box and crop the overflow · fill: stretch to the box. */
  | { mode: 'box'; width: number; height: number; fit: FitMode };

export interface ResizePlan {
  width: number;
  height: number;
  /** Source rectangle to draw (a crop for "cover"). */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const side = (n: number) => Math.max(1, Math.round(n));

/** Output size and source crop for a resize. Pure; throws for sizes browsers can't draw. */
export function planResize(srcW: number, srcH: number, spec: ResizeSpec): ResizePlan {
  const full = { sx: 0, sy: 0, sw: srcW, sh: srcH };
  let plan: ResizePlan;
  switch (spec.mode) {
    case 'none':
      plan = { width: srcW, height: srcH, ...full };
      break;
    case 'max': {
      const k = Math.min(1, spec.maxWidth ? spec.maxWidth / srcW : 1, spec.maxHeight ? spec.maxHeight / srcH : 1);
      plan = { width: side(srcW * k), height: side(srcH * k), ...full };
      break;
    }
    case 'exact': {
      const { width, height } = spec;
      if (!width && !height) plan = { width: srcW, height: srcH, ...full };
      else if (width && height) plan = { width: side(width), height: side(height), ...full };
      else if (width) plan = { width: side(width), height: side((width * srcH) / srcW), ...full };
      else plan = { width: side((height! * srcW) / srcH), height: side(height!), ...full };
      break;
    }
    case 'scale':
      plan = { width: side((srcW * spec.percent) / 100), height: side((srcH * spec.percent) / 100), ...full };
      break;
    case 'box': {
      const bw = side(spec.width);
      const bh = side(spec.height);
      if (spec.fit === 'fill') plan = { width: bw, height: bh, ...full };
      else if (spec.fit === 'contain') {
        const k = Math.min(bw / srcW, bh / srcH);
        plan = { width: side(srcW * k), height: side(srcH * k), ...full };
      } else {
        // cover: crop the source to the box's aspect ratio, centred.
        const k = Math.max(bw / srcW, bh / srcH);
        const sw = Math.min(srcW, bw / k);
        const sh = Math.min(srcH, bh / k);
        plan = { width: bw, height: bh, sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
      }
      break;
    }
  }
  checkPixels(plan.width, plan.height, 'The resized image');
  return plan;
}

/* ---------------------------------------------------------------- browser: decode, resample, encode */

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function context(c: AnyCanvas): Ctx2D {
  const ctx = c.getContext('2d') as Ctx2D | null;
  if (!ctx) throw new AppError('TOO_LARGE', 'The browser could not create a drawing surface for this image. Try a smaller image.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

/** Encode a canvas. Rejects if the browser silently fell back to another type (it does that for unsupported ones). */
export async function encodeCanvas(canvas: AnyCanvas, type: string, quality?: number): Promise<Blob> {
  const q = isLossy(type) ? quality : undefined;
  const blob =
    'convertToBlob' in canvas
      ? await canvas.convertToBlob({ type, quality: q })
      : await new Promise<Blob | null>((resolve) => (canvas as HTMLCanvasElement).toBlob(resolve, type, q));
  if (!blob) throw new AppError('TOO_LARGE', 'The browser could not encode this image. Try a smaller size.');
  if (blob.type !== type) throw new AppError('UNSUPPORTED_FORMAT', `This browser can't save ${MIME_LABEL[type] ?? type} images.`);
  return blob;
}

let encodable: Promise<string[]> | null = null;
/** Output types this browser's canvas can encode (PNG always; JPEG, WebP and AVIF when supported). */
export function detectEncodableTypes(): Promise<string[]> {
  encodable ??= (async () => {
    const out: string[] = [];
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/avif']) {
      try {
        const c = makeCanvas(2, 2);
        context(c).fillRect(0, 0, 1, 1);
        await encodeCanvas(c, type, 0.8);
        out.push(type);
      } catch {
        /* not supported */
      }
    }
    return out;
  })();
  return encodable;
}

function formatName(bytes: Uint8Array, declared: string) {
  return sniffImageType(bytes)?.label ?? MIME_LABEL[declared] ?? 'this';
}

async function decodeWithElement(source: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    // SVGs without intrinsic size report 0×0; give them a sensible default.
    const w = img.naturalWidth || 512;
    const h = img.naturalHeight || 512;
    return await createImageBitmap(img, { resizeWidth: w, resizeHeight: h });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Decode a file to an ImageBitmap with EXIF orientation applied. Checks the 50 MB and 100 MP caps
 * (from the header before decoding when possible). Falls back to an <img> on the main thread, which
 * also handles SVG and anything else the browser can display.
 */
export async function decodeImage(source: Blob): Promise<ImageBitmap> {
  checkFileSize(source.size);
  const head = new Uint8Array(await source.slice(0, 256 * 1024).arrayBuffer());
  const size = readImageSize(head);
  if (size) checkPixels(size.width, size.height);
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    if (typeof document !== 'undefined') bitmap = await decodeWithElement(source).catch(() => null);
  }
  if (!bitmap) {
    const name = formatName(head, source.type);
    const heic = name === 'HEIC' ? ' Safari can open HEIC photos; Chrome and Firefox can’t yet.' : '';
    throw new AppError('UNSUPPORTED_FORMAT', `Your browser can't decode ${name === 'this' ? 'this file' : `${name} images`}. The file may be damaged or in an unsupported format.${heic}`);
  }
  checkPixels(bitmap.width, bitmap.height);
  return bitmap;
}

/** Draw `plan`'s crop of `src` into a new canvas at the planned size, with high-quality downscaling. */
export async function resample(src: ImageBitmap, plan: ResizePlan, background?: string | null): Promise<AnyCanvas> {
  const { width, height } = plan;
  let source: CanvasImageSource = src;
  let { sx, sy, sw, sh } = plan;
  const shrinking = width < sw || height < sh;
  if (shrinking) {
    try {
      source = await createImageBitmap(src, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh), {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high',
      });
      [sx, sy, sw, sh] = [0, 0, width, height];
    } catch {
      // Stepwise halving: repeated 2× reductions avoid the aliasing of one big bilinear step.
      while (sw / 2 >= width && sh / 2 >= height) {
        const nw = Math.round(sw / 2);
        const nh = Math.round(sh / 2);
        const step = makeCanvas(nw, nh);
        context(step).drawImage(source, sx, sy, sw, sh, 0, 0, nw, nh);
        [source, sx, sy, sw, sh] = [step, 0, 0, nw, nh];
      }
    }
  }
  const out = makeCanvas(width, height);
  const ctx = context(out);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  if (source !== src && 'close' in source && typeof source.close === 'function') source.close();
  return out;
}

export interface RenderJob {
  resize: ResizeSpec;
  /** Output MIME type (already resolved, not "same"). */
  type: string;
  /** 0–1, for lossy types. */
  quality?: number;
  /** Fill colour under transparent pixels. JPEG output always gets one (white by default). */
  background?: string | null;
}

export interface RenderResult {
  blob: Blob;
  width: number;
  height: number;
  srcWidth: number;
  srcHeight: number;
}

/** Decode → resize → encode. Works in a worker (OffscreenCanvas) or on the main thread. */
export async function renderImage(source: Blob, job: RenderJob): Promise<RenderResult> {
  const bitmap = await decodeImage(source);
  try {
    const plan = planResize(bitmap.width, bitmap.height, job.resize);
    const background = job.background ?? (supportsAlpha(job.type) ? null : '#ffffff');
    const canvas = await resample(bitmap, plan, background);
    const blob = await encodeCanvas(canvas, job.type, job.quality);
    return { blob, width: plan.width, height: plan.height, srcWidth: bitmap.width, srcHeight: bitmap.height };
  } finally {
    bitmap.close();
  }
}
