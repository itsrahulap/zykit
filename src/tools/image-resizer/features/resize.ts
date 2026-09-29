// Pure settings → job logic for the Image Resizer.

import { isLossy, renameFile, resolveOutputType, type FitMode, type RenderJob, type ResizeSpec } from '../../../shared/lib/image';

export type ResizeMode = 'pixels' | 'percent' | 'box';

export interface ResizeSettings {
  mode: ResizeMode;
  width: number | '';
  height: number | '';
  /** Pixels mode: the side the user typed last drives the other one. */
  lock: boolean;
  driver: 'width' | 'height';
  percent: number;
  boxWidth: number;
  boxHeight: number;
  fit: FitMode;
  format: 'same' | 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';
  quality: number;
}

export const DEFAULT_SETTINGS: ResizeSettings = {
  mode: 'pixels',
  width: 1280,
  height: '',
  lock: true,
  driver: 'width',
  percent: 50,
  boxWidth: 1080,
  boxHeight: 1080,
  fit: 'cover',
  format: 'same',
  quality: 90,
};

export interface Preset {
  label: string;
  width: number;
  height: number;
}

export const PRESETS: Preset[] = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '4K', width: 3840, height: 2160 },
  { label: '720p', width: 1280, height: 720 },
  { label: 'Instagram square', width: 1080, height: 1080 },
  { label: 'Instagram portrait', width: 1080, height: 1350 },
  { label: 'Instagram story', width: 1080, height: 1920 },
  { label: 'Twitter/X header', width: 1500, height: 500 },
  { label: 'Twitter/X post', width: 1600, height: 900 },
  { label: 'Facebook cover', width: 820, height: 312 },
  { label: 'LinkedIn banner', width: 1584, height: 396 },
  { label: 'YouTube thumbnail', width: 1280, height: 720 },
  { label: 'Open Graph', width: 1200, height: 630 },
  { label: 'Favicon 16', width: 16, height: 16 },
  { label: 'Favicon 32', width: 32, height: 32 },
  { label: 'Favicon 48', width: 48, height: 48 },
  { label: 'Apple touch 180', width: 180, height: 180 },
  { label: 'Android 192', width: 192, height: 192 },
  { label: 'Android 512', width: 512, height: 512 },
];

export function resizeSpec(s: ResizeSettings): ResizeSpec {
  if (s.mode === 'percent') return { mode: 'scale', percent: Math.min(1000, Math.max(1, s.percent)) };
  if (s.mode === 'box') return { mode: 'box', width: s.boxWidth || 1, height: s.boxHeight || 1, fit: s.fit };
  if (s.lock) return s.driver === 'width' ? { mode: 'exact', width: s.width || undefined } : { mode: 'exact', height: s.height || undefined };
  return { mode: 'exact', width: s.width || undefined, height: s.height || undefined };
}

/** With the aspect ratio locked, the other side for a given source size (shown in the UI). */
export function lockedSide(value: number, from: number, to: number): number {
  return Math.max(1, Math.round((value * to) / from));
}

export function resizeJob(inputType: string, s: ResizeSettings, encodable: readonly string[]): RenderJob {
  const type = resolveOutputType(inputType, s.format, encodable);
  return { type, quality: isLossy(type) ? s.quality / 100 : undefined, resize: resizeSpec(s) };
}

export const resizedName = (name: string, type: string, width: number, height: number) => renameFile(name, type, `-${width}x${height}`);
