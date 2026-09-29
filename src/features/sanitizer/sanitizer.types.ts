import type { SanitizeMode } from '../metadata/metadata.types';

export interface SanitizeOptions {
  mode: SanitizeMode;
  /** Re-insert a minimal EXIF block with only the Orientation tag, if the original had one. */
  preserveOrientation: boolean;
}

export interface SanitizeResult {
  bytes: Uint8Array<ArrayBuffer>;
  /** Human-readable log of what was removed/kept. */
  log: string[];
  orientationPreserved?: number;
}
