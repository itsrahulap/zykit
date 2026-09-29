// Runs the regex off the main thread; the page terminates this worker if it takes too long
// (catastrophic backtracking). Nothing in this worker performs network requests.

import { findMatches, replacePreview } from '../features/regex';
import type { RegexRequest, RegexResponse } from './regex.protocol';

interface WorkerScope {
  postMessage(message: RegexResponse): void;
  onmessage: ((event: MessageEvent<RegexRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, text, replacement } = event.data;
  try {
    const result = findMatches(pattern, flags, text);
    if (result.ok && replacement !== undefined) result.replaced = replacePreview(pattern, flags, text, replacement);
    ctx.postMessage({ id, result });
  } catch (err) {
    ctx.postMessage({
      id,
      result: {
        ok: false,
        error: err instanceof Error ? err.message : 'Matching failed.',
      },
    });
  }
};
