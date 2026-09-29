import type { CleanOutcome, ProcessingStage } from '../features/pipeline';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import type { SanitizeOptions } from '../features/sanitizer/sanitizer.types';
import type { SerializedError } from '../../../shared/lib/errors';

export type WorkerRequest =
  | { id: number; type: 'analyze'; file: Blob }
  | { id: number; type: 'clean'; file: Blob; options: SanitizeOptions };

export type CleanResponse = Omit<CleanOutcome, 'bytes'> & { buffer: ArrayBuffer };

export type WorkerResponse =
  | { id: number; type: 'progress'; stage: ProcessingStage }
  | { id: number; type: 'analyzed'; report: ImageMetadataReport }
  | { id: number; type: 'cleaned'; result: CleanResponse }
  | { id: number; type: 'error'; error: SerializedError };
