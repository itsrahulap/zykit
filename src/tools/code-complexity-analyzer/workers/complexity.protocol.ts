import type { Analysis, Language } from '../features/code-complexity-analyzer';

export interface ComplexityRequest {
  id: number;
  code: string;
  language: Language;
}

/** `started` means the compiler has loaded and parsing began, so the page switches to the analysis time limit. */
export type ComplexityResponse =
  | { id: number; type: 'started' }
  | { id: number; type: 'done'; analysis: Analysis }
  | { id: number; type: 'error'; error: string };
