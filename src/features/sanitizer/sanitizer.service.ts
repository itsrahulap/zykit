import { ParseError } from '../../lib/bytes';
import { AppError } from '../../lib/errors';
import type { ImageFormat } from '../../types/image.types';
import { sanitizeJpeg } from './jpeg.sanitizer';
import { sanitizePng } from './png.sanitizer';
import type { SanitizeOptions, SanitizeResult } from './sanitizer.types';
import { sanitizeWebp } from './webp.sanitizer';

const SANITIZERS: Record<ImageFormat, (b: Uint8Array, o: SanitizeOptions) => SanitizeResult> = {
  jpeg: sanitizeJpeg,
  png: sanitizePng,
  webp: sanitizeWebp,
};

export function sanitizeImage(format: ImageFormat, bytes: Uint8Array, opts: SanitizeOptions): SanitizeResult {
  try {
    return SANITIZERS[format](bytes, opts);
  } catch (err) {
    if (err instanceof ParseError) throw new AppError('SANITIZE_FAILED', `The image could not be cleaned: ${err.message}.`);
    throw err;
  }
}
