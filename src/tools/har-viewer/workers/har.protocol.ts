import type { HarDetail, HarRow, HarSummary } from '../features/har';

export type HarRequest =
  | { type: 'load'; id: number; file?: File; text?: string }
  | { type: 'detail'; id: number; index: number }
  | { type: 'redact'; id: number; bodies: boolean };

export type HarResponse =
  | { type: 'loaded'; id: number; rows: HarRow[]; summary: HarSummary }
  | { type: 'detail'; id: number; index: number; detail: HarDetail }
  | { type: 'redacted'; id: number; text: string }
  | { type: 'error'; id: number; message: string; line?: number; column?: number };
