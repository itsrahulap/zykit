import { EXTENSIONS, type ImageFormat } from '../types/image.types';

/** "holiday photo.JPG" → "holiday photo-clean.jpg"; the extension follows the real format. */
export function cleanFileName(original: string, format: ImageFormat): string {
  // eslint-disable-next-line no-control-regex -- strip control characters from file names
  const base = original.replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim() || 'image';
  const ext = EXTENSIONS[format];
  const originalExt = original.match(/\.([^./\\]+)$/)?.[1]?.toLowerCase();
  const keepExt = originalExt && (originalExt === ext || (format === 'jpeg' && originalExt === 'jpeg'));
  return `${base}-clean.${keepExt ? originalExt : ext}`;
}

export const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
