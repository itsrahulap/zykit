// Pure settings → job logic for the Image Compressor.

import { renameFile, type RenderJob } from '../../../shared/lib/image';

export type CompressFormat = 'auto' | 'image/jpeg' | 'image/webp' | 'image/avif';

export interface CompressSettings {
  format: CompressFormat;
  /** 1–100 */
  quality: number;
  maxWidth: number | '';
  maxHeight: number | '';
}

export const DEFAULT_SETTINGS: CompressSettings = { format: 'auto', quality: 75, maxWidth: '', maxHeight: '' };

const LOSSY = ['image/jpeg', 'image/webp', 'image/avif'];

/**
 * "Auto" keeps JPEG, WebP and AVIF in their own format and turns everything else (PNG, GIF, BMP…)
 * into WebP, or JPEG where the browser can't encode WebP.
 */
export function compressedType(inputType: string, format: CompressFormat, encodable: readonly string[]): string {
  if (format !== 'auto') return format;
  const input = inputType === 'image/jpg' ? 'image/jpeg' : inputType;
  if (LOSSY.includes(input) && encodable.includes(input)) return input;
  return encodable.includes('image/webp') ? 'image/webp' : 'image/jpeg';
}

export function compressJob(inputType: string, s: CompressSettings, encodable: readonly string[]): RenderJob {
  const type = compressedType(inputType, s.format, encodable);
  return {
    type,
    quality: Math.min(100, Math.max(1, s.quality)) / 100,
    resize: s.maxWidth || s.maxHeight ? { mode: 'max', maxWidth: s.maxWidth || undefined, maxHeight: s.maxHeight || undefined } : { mode: 'none' },
  };
}

export const compressedName = (name: string, type: string) => renameFile(name, type, '-compressed');

/**
 * What to hand the user: the compressed file, or the original when re-encoding made a same-format
 * file bigger without resizing it (there's nothing to gain).
 */
export function pickOutput(
  original: { size: number; type: string; name: string },
  result: { size: number; type: string; name: string; resized: boolean },
  keepOriginalIfLarger: boolean,
): 'original' | 'compressed' {
  const sameType = (original.type === 'image/jpg' ? 'image/jpeg' : original.type) === result.type;
  return keepOriginalIfLarger && sameType && !result.resized && result.size >= original.size ? 'original' : 'compressed';
}
