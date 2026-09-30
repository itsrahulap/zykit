import type { PageRef, PdfInfo } from '../features/pdf-ops';

export interface OutputSpec {
  name: string;
  pages: PageRef[];
}

export type PdfRequest =
  | { id: number; type: 'open'; fileId: string; bytes: ArrayBuffer }
  | { id: number; type: 'close'; fileId: string }
  /** One output → a PDF; several → a ZIP named `zipName`. */
  | { id: number; type: 'build'; outputs: OutputSpec[]; zipName: string; removeMetadata: boolean };

export type PdfResponse =
  | { id: number; type: 'opened'; info: PdfInfo }
  | { id: number; type: 'progress'; done: number; total: number }
  | { id: number; type: 'built'; name: string; mime: string; bytes: Uint8Array }
  | { id: number; type: 'error'; code?: 'encrypted' | 'invalid' | 'too-large'; message: string }
  | { id: number; type: 'closed' };
