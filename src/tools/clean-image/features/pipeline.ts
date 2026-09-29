// Environment-independent processing pipeline shared by the Web Worker and tests.

import { AppError } from '../../../shared/lib/errors';
import { analyzeImage } from './metadata/metadata.service';
import type { ImageMetadataReport } from './metadata/metadata.types';
import { sanitizeImage } from './sanitizer/sanitizer.service';
import type { SanitizeOptions } from './sanitizer/sanitizer.types';
import { diffMetadata, type MetadataDiff } from './validation/metadata.diff';
import { validateOutput, type ValidationInput, type ValidationReport } from './validation/validation.service';

export type ProcessingStage = 'reading' | 'analyzing' | 'sanitizing' | 'validating';

export interface CleanOutcome {
  bytes: Uint8Array<ArrayBuffer>;
  original: ImageMetadataReport;
  cleaned: ImageMetadataReport;
  diff: MetadataDiff;
  validation: ValidationReport;
  log: string[];
}

export async function cleanImage(
  bytes: Uint8Array,
  options: SanitizeOptions,
  hooks: { onStage?: (s: ProcessingStage) => void; decode?: ValidationInput['decode'] } = {},
): Promise<CleanOutcome> {
  hooks.onStage?.('analyzing');
  const original = await analyzeImage(bytes);

  hooks.onStage?.('sanitizing');
  const result = sanitizeImage(original.format, bytes, options);

  hooks.onStage?.('validating');
  let cleaned: ImageMetadataReport;
  try {
    cleaned = await analyzeImage(result.bytes);
  } catch {
    throw new AppError('VALIDATION_FAILED', 'The cleaned file failed verification, so it was discarded. Your original is unchanged.');
  }
  if (cleaned.format !== original.format)
    throw new AppError('VALIDATION_FAILED', 'The cleaned file changed format unexpectedly, so it was discarded.');

  const validation = await validateOutput({
    original,
    cleaned,
    originalBytes: bytes,
    cleanedBytes: result.bytes,
    mode: options.mode,
    orientationPreserved: result.orientationPreserved,
    decode: hooks.decode,
  });

  return { bytes: result.bytes, original, cleaned, diff: diffMetadata(original.entries, cleaned.entries), validation, log: result.log };
}
