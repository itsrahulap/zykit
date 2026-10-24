// Rasterises the generated (model-built) SVG through an <img> and a canvas.

import { AppError } from '../../../shared/lib/errors';

/** Browsers refuse or blank canvases much past 8k px a side, so large diagrams are scaled down. */
const MAX_SIDE = 8192;

export async function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  const scale = Math.min(2, MAX_SIDE / Math.max(width, height));
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new AppError('UNKNOWN', 'Couldn’t render the diagram as an image.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new AppError('UNKNOWN', 'This browser can’t draw to a canvas.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new AppError('UNKNOWN', 'Couldn’t encode the PNG.'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
