import { LIMITS } from '../../config/limits';
import { FORMAT_LABELS } from '../../types/image.types';
import { walkPng } from '../formats/png.structure';
import { formatOrientation } from '../metadata/exif.parser';
import { shouldRemove, type ImageMetadataReport, type SanitizeMode } from '../metadata/metadata.types';
import { imageDataIdentical } from './image-data';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skipped';

export interface ValidationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ValidationReport {
  ok: boolean;
  checks: ValidationCheck[];
}

export interface ValidationInput {
  original: ImageMetadataReport;
  cleaned: ImageMetadataReport;
  originalBytes: Uint8Array;
  cleanedBytes: Uint8Array;
  mode: SanitizeMode;
  /** Orientation value the sanitizer intentionally re-wrote, if any. */
  orientationPreserved?: number;
  /** Optional real decode test (browser only). Returns decoded width/height. */
  decode?: (bytes: Uint8Array, mime: string) => Promise<{ width: number; height: number }>;
}

export async function validateOutput(input: ValidationInput): Promise<ValidationReport> {
  const { original, cleaned, originalBytes, cleanedBytes, mode } = input;
  const checks: ValidationCheck[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail });

  add('structure', 'Output is a well-formed file', 'pass', `Re-parsed successfully as ${FORMAT_LABELS[cleaned.format]}.`);

  const sameDims = original.width === cleaned.width && original.height === cleaned.height;
  add(
    'dimensions',
    'Dimensions unchanged',
    sameDims ? 'pass' : 'fail',
    sameDims ? `${cleaned.width} × ${cleaned.height} pixels.` : `Expected ${original.width} × ${original.height}, got ${cleaned.width} × ${cleaned.height}.`,
  );

  let identical = false;
  try {
    identical = imageDataIdentical(original.format, originalBytes, cleanedBytes);
  } catch {
    identical = false;
  }
  add(
    'image-data',
    'Image data is byte-identical',
    identical ? 'pass' : 'fail',
    identical
      ? 'The compressed pixel data was copied unchanged — no re-encoding, no quality loss.'
      : 'The compressed pixel data differs from the original.',
  );

  const onlyOrientationExif =
    input.orientationPreserved !== undefined &&
    cleaned.entries.filter((e) => e.category === 'EXIF').every((e) => e.key === 'Orientation');
  const leftover = cleaned.blocks.filter(
    (b) => shouldRemove(b.action, mode) && !(b.category === 'EXIF' && onlyOrientationExif),
  );
  add(
    'metadata-removed',
    'Targeted metadata removed',
    leftover.length === 0 ? 'pass' : 'fail',
    leftover.length === 0
      ? 'No removable metadata containers remain.'
      : `Still present: ${leftover.map((b) => b.location).join(', ')}.`,
  );

  if (original.orientation && original.orientation !== 1) {
    const kept = cleaned.orientation === original.orientation;
    add(
      'orientation',
      'Orientation preserved',
      kept ? 'pass' : 'warn',
      kept
        ? `Orientation ${formatOrientation(original.orientation)} kept, so the image displays the same way.`
        : 'Orientation was removed; some viewers may now display this image rotated or mirrored.',
    );
  }

  if (cleaned.format === 'png') {
    const badCrc = walkPng(cleanedBytes).chunks.filter((c) => !c.crcValid);
    add(
      'png-crc',
      'PNG chunk checksums valid',
      badCrc.length ? 'warn' : 'pass',
      badCrc.length ? `Checksum mismatch in ${badCrc.map((c) => c.type).join(', ')} (inherited from the original).` : 'All chunk CRCs are valid.',
    );
  }

  const pixels = (cleaned.width ?? 0) * (cleaned.height ?? 0);
  if (!input.decode) {
    add('decode', 'Browser can decode the output', 'skipped', 'Decoding is not available in this environment.');
  } else if (pixels > LIMITS.MAX_DECODE_PIXELS) {
    add('decode', 'Browser can decode the output', 'skipped', 'Skipped for very large images to avoid excessive memory use.');
  } else {
    try {
      const { width, height } = await input.decode(cleanedBytes, cleaned.mimeType);
      // Decoders may apply EXIF orientation, so compare dimensions order-independently.
      const match =
        (width === cleaned.width && height === cleaned.height) || (width === cleaned.height && height === cleaned.width);
      add('decode', 'Browser can decode the output', match ? 'pass' : 'warn', match ? 'Decoded successfully.' : `Decoded to unexpected size ${width} × ${height}.`);
    } catch {
      add('decode', 'Browser can decode the output', 'fail', 'The browser could not decode the cleaned image.');
    }
  }

  return { ok: !checks.some((c) => c.status === 'fail'), checks };
}
