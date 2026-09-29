import type { DiffOptions, DiffResult } from '../features/diff';

export interface DiffRequest {
  id: number;
  a: string;
  b: string;
  options: DiffOptions;
}

export type DiffResponse =
  | { id: number; type: 'done'; result: DiffResult; unified: string }
  | { id: number; type: 'error'; message: string };
