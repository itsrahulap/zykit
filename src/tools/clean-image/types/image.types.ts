export type ImageFormat = 'jpeg' | 'png' | 'webp';

export type DetectedFormat = ImageFormat | 'gif' | 'heic' | 'avif' | 'tiff' | 'bmp' | 'unknown';

export const MIME_TYPES: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const EXTENSIONS: Record<ImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export const FORMAT_LABELS: Record<DetectedFormat, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  gif: 'GIF',
  heic: 'HEIC/HEIF',
  avif: 'AVIF',
  tiff: 'TIFF',
  bmp: 'BMP',
  unknown: 'Unknown',
};
