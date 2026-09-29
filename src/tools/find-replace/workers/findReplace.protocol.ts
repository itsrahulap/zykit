import type { FindOptions, FindReplaceResult, Rule } from '../features/findReplace';

export interface FindReplaceRequest {
  id: number;
  text: string;
  rules: Rule[];
  options: FindOptions;
  active: number;
}

export type FindReplaceResponse = { id: number; ok: true; result: FindReplaceResult } | { id: number; ok: false; error: string };
