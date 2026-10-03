// Canvas side of the editor: one geometry pass (rotate/straighten, crop, resize drawn in a single
// transform from the untouched original) then the pixel adjustments. Runs in a worker with
// OffscreenCanvas when available, otherwise on the main thread (see editorClient.ts).

import { AppError } from '../../../shared/lib/errors';
import { checkPixels, decodeImage, encodeCanvas, makeCanvas, supportsAlpha } from '../../../shared/lib/image';
import { finalSize, isNeutralAdjust, orientedSize, type EditState } from './image-editor';
import { applyAdjustments } from './pixels';

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface Loaded {
  width: number;
  height: number;
}

function context(c: Canvas): Ctx {
  const ctx = c.getContext('2d', { willReadFrequently: true }) as Ctx | null;
  if (!ctx) throw new AppError('TOO_LARGE', 'The browser could not create a drawing surface. Try a smaller image or size.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

export class EditSession {
  private bitmap: ImageBitmap | null = null;

  async load(file: Blob): Promise<Loaded> {
    this.bitmap?.close();
    this.bitmap = await decodeImage(file);
    return { width: this.bitmap.width, height: this.bitmap.height };
  }

  dispose() {
    this.bitmap?.close();
    this.bitmap = null;
  }

  /** Renders `state`. `maxSide` limits the longest side (preview); `background` fills transparency. */
  render(state: EditState, maxSide?: number, background?: string | null): Canvas {
    const src = this.bitmap;
    if (!src) throw new AppError('UNKNOWN', 'No image is loaded.');
    const full = finalSize(src.width, src.height, state);
    const k = maxSide ? Math.min(1, maxSide / Math.max(full.width, full.height)) : 1;
    const outW = Math.max(1, Math.round(full.width * k));
    const outH = Math.max(1, Math.round(full.height * k));
    checkPixels(outW, outH, 'The edited image');

    const o = orientedSize(src.width, src.height, state.rotate, state.angle);
    const crop = state.crop ?? { x: 0, y: 0, w: o.width, h: o.height };
    const canvas = makeCanvas(outW, outH);
    const ctx = context(canvas);
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, outW, outH);
    }
    // Map the crop rectangle of the rotated image onto the whole output, then place the rotated original.
    ctx.scale(outW / crop.w, outH / crop.h);
    ctx.translate(-crop.x, -crop.y);
    ctx.translate(o.width / 2, o.height / 2);
    // Shown order: quarter turn, then flip, then straighten (calls below run last-to-first on the picture).
    ctx.rotate((state.angle * Math.PI) / 180);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    ctx.rotate((state.rotate * Math.PI) / 180);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);

    if (!isNeutralAdjust(state.adjust)) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const img = ctx.getImageData(0, 0, outW, outH);
      const px = applyAdjustments(img.data, outW, outH, state.adjust, { scale: k });
      if (px !== img.data) img.data.set(px);
      ctx.putImageData(img, 0, 0);
    }
    return canvas;
  }

  async preview(state: EditState, maxSide: number): Promise<ImageBitmap> {
    return createImageBitmap(this.render(state, maxSide));
  }

  async export(state: EditState, type: string, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
    const canvas = this.render(state, undefined, supportsAlpha(type) ? null : '#ffffff');
    const blob = await encodeCanvas(canvas, type, quality);
    return { blob, width: canvas.width, height: canvas.height };
  }
}
