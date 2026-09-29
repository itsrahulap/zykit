// Runs the find/replace rules off the main thread; the page terminates this worker if it takes too long
// (catastrophic backtracking). Nothing in this worker performs network requests.

import { runRules } from '../features/findReplace';
import type { FindReplaceRequest, FindReplaceResponse } from './findReplace.protocol';

interface WorkerScope {
  postMessage(message: FindReplaceResponse): void;
  onmessage: ((event: MessageEvent<FindReplaceRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<FindReplaceRequest>) => {
  const { id, text, rules, options, active } = event.data;
  try {
    ctx.postMessage({ id, ok: true, result: runRules(text, rules, options, active) });
  } catch (err) {
    ctx.postMessage({ id, ok: false, error: err instanceof Error ? err.message : 'Matching failed.' });
  }
};
