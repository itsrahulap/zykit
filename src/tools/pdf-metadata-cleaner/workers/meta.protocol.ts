import type { CleanOptions, PdfMetaReport } from '../features/pdf-metadata-cleaner';

export type MetaRequest =
  | { id: number; type: 'inspect'; fileId: string; bytes: ArrayBuffer }
  | { id: number; type: 'clean'; fileId: string; options: CleanOptions }
  | { id: number; type: 'close'; fileId: string };

export type MetaResponse =
  | { id: number; type: 'inspected'; report: PdfMetaReport }
  | { id: number; type: 'cleaned'; bytes: Uint8Array; before: PdfMetaReport; after: PdfMetaReport; left: string[] }
  | { id: number; type: 'error'; code?: 'encrypted' | 'invalid'; message: string }
  | { id: number; type: 'closed' };
