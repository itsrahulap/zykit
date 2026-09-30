// Validates off the main thread; the page terminates this worker if validation takes too long
// (e.g. a catastrophic "pattern"). Nothing in this worker performs network requests.

import { validate, type Draft, type ValidateResult } from '../features/json-schema';

export interface ValidateRequest {
  id: number;
  schema: string;
  instance: string;
  draft: Draft | 'auto';
  assertFormat: boolean;
}
export type ValidateResponse = { id: number; result: ValidateResult } | { id: number; crash: string };

interface WorkerScope {
  postMessage(message: ValidateResponse): void;
  onmessage: ((event: MessageEvent<ValidateRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<ValidateRequest>) => {
  const { id, schema, instance, draft, assertFormat } = event.data;
  try {
    const result = validate(JSON.parse(schema) as unknown, JSON.parse(instance) as unknown, { draft, assertFormat });
    ctx.postMessage({ id, result });
  } catch (err) {
    ctx.postMessage({ id, crash: err instanceof Error ? err.message : 'Validation failed.' });
  }
};
