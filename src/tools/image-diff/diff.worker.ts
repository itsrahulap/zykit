// Pixel diff off the main thread.
import { compare, type CompareRequest, type CompareResult } from './features/compare';

export type Req = { id: number } & CompareRequest;
export type Res = { id: number; ok: true; result: CompareResult } | { id: number; ok: false; error: string };

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, ...req } = e.data;
  try {
    const result = compare(req);
    self.postMessage({ id, ok: true, result } satisfies Res, { transfer: [result.a.buffer, result.b.buffer, result.diff.buffer] });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err instanceof Error ? err.message : 'Comparison failed' } satisfies Res);
  }
};
