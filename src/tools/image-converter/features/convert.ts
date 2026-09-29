// Pure settings → job logic for the Image Converter.

import { isLossy, renameFile, supportsAlpha, type RenderJob } from '../../../shared/lib/image';

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export interface ConvertSettings {
  format: OutputFormat;
  quality: number;
  /** Colour under transparent pixels (always used for JPEG, which has no transparency). */
  background: string;
  /** Also flatten onto the background for formats that keep transparency. */
  flatten: boolean;
}

export const DEFAULT_SETTINGS: ConvertSettings = { format: 'image/jpeg', quality: 90, background: '#ffffff', flatten: false };

const HEX = /^#[0-9a-f]{6}$/i;

export function convertJob(s: ConvertSettings): RenderJob {
  const background = HEX.test(s.background) ? s.background : '#ffffff';
  return {
    type: s.format,
    quality: isLossy(s.format) ? Math.min(100, Math.max(1, s.quality)) / 100 : undefined,
    background: !supportsAlpha(s.format) || s.flatten ? background : null,
    resize: { mode: 'none' },
  };
}

export const convertedName = (name: string, type: string) => renameFile(name, type);

/** Formats the browser reads; the last group depends on the browser and is checked per file. */
export const READABLE = 'PNG, JPEG, WebP, GIF (first frame), BMP, ICO and SVG — plus AVIF, HEIC and JPEG XL where your browser can decode them';
