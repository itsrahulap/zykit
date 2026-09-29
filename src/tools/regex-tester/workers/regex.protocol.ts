import type { MatchResult } from '../features/regex';

export interface RegexRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  /** Present when the replacement preview is wanted. */
  replacement?: string;
}

export type RegexResponse = { id: number; result: MatchResult };
