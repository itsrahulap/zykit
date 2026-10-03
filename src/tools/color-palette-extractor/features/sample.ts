// Browser side: decode an image (EXIF orientation applied) and read a small downscaled copy as RGBA.

import { decodeImage, planResize, resample } from '../../../shared/lib/image';
import { SAMPLE_SIDE } from './color-palette-extractor';

export interface Sample {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** Size of the original image. */
  srcWidth: number;
  srcHeight: number;
}

export async function samplePixels(file: Blob): Promise<Sample> {
  const bitmap = await decodeImage(file);
  try {
    const plan = planResize(bitmap.width, bitmap.height, { mode: 'max', maxWidth: SAMPLE_SIDE, maxHeight: SAMPLE_SIDE });
    const canvas = await resample(bitmap, plan);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    const { data } = ctx.getImageData(0, 0, plan.width, plan.height);
    return { data, width: plan.width, height: plan.height, srcWidth: bitmap.width, srcHeight: bitmap.height };
  } finally {
    bitmap.close();
  }
}
