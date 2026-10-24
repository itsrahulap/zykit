import type { Analysis } from '../features/typescript-type-explorer';

export interface TypeCheckRequest {
  id: number;
  code: string;
}

export type TypeCheckResponse = { id: number; ok: true; analysis: Analysis; version: string } | { id: number; ok: false; error: string };
