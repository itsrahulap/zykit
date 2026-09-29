// Runs the line diff off the main thread so large inputs never freeze the page.
// Nothing in this worker performs network requests.

import { diffTexts, unifiedDiff } from '../features/diff';
import type { DiffRequest, DiffResponse } from './diff.protocol';

interface WorkerScope {
  postMessage(message: DiffResponse): void;
  onmessage: ((event: MessageEvent<DiffRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<DiffRequest>) => {
  const { id, a, b, options } = event.data;
  try {
    const result = diffTexts(a, b, options);
    ctx.postMessage({ id, type: 'done', result, unified: unifiedDiff(result) });
  } catch (err) {
    ctx.postMessage({ id, type: 'error', message: err instanceof Error ? err.message : 'The comparison failed.' });
  }
};
