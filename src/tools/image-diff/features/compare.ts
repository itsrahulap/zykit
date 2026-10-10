// Browser side: draw both bitmaps onto a shared canvas size, read pixels, diff. Runs in a worker
// (OffscreenCanvas) or on the main thread.

import { makeCanvas } from '../../../shared/lib/image';
import { diffPixels, targetSize, type Align, type DiffOptions, type DiffResult } from './diff';

export interface CompareRequest extends DiffOptions {
  a: ImageBitmap;
  b: ImageBitmap;
  align: Align;
}
export interface CompareResult extends Omit<DiffResult, 'diff'> {
  width: number;
  height: number;
  a: Uint8ClampedArray<ArrayBuffer>;
  b: Uint8ClampedArray<ArrayBuffer>;
  diff: Uint8ClampedArray<ArrayBuffer>;
}

function pixels(img: ImageBitmap, width: number, height: number, scale: boolean) {
  const ctx = makeCanvas(width, height).getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  if (scale) ctx.drawImage(img, 0, 0, width, height);
  else ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, width, height).data;
}

export function compare({ a, b, align, ...opts }: CompareRequest): CompareResult {
  const { width, height } = targetSize(a, b, align);
  const pa = pixels(a, width, height, false);
  const pb = pixels(b, width, height, align === 'scale');
  return { width, height, a: pa, b: pb, ...diffPixels(pa, pb, width, height, opts) };
}
