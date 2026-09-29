import { useEffect, useRef, useState } from 'react';
import type { DiffOptions, DiffResult } from '../features/diff';
import { DEBOUNCE_MS, MAX_CHARS, MAX_LINES } from '../config/limits';
import type { DiffRequest, DiffResponse } from '../workers/diff.protocol';

export interface DiffState {
  result: DiffResult | null;
  unified: string;
  busy: boolean;
  error: string | null;
  /** Changes whenever a new result arrives (useful as a React key). */
  version: number;
}

function countLines(s: string): number {
  let n = 1;
  for (let i = s.indexOf('\n'); i !== -1; i = s.indexOf('\n', i + 1)) n++;
  return n;
}

/** Why an input can't be compared, or null when it is within limits. */
export function sizeProblem(text: string, label: string): string | null {
  if (text.length > MAX_CHARS) return `${label} is too large to compare here (limit: about 2 MB per side).`;
  if (countLines(text) > MAX_LINES) return `${label} has more than ${MAX_LINES.toLocaleString('en-US')} lines, the limit per side.`;
  return null;
}

/** Diffs `a` against `b` in a Web Worker, debounced. A newer request cancels a running one. */
export function useDiff(a: string, b: string, options: DiffOptions): DiffState {
  const [state, setState] = useState<DiffState>({ result: null, unified: '', busy: false, error: null, version: 0 });
  const workerRef = useRef<Worker | null>(null);
  const busyRef = useRef(false);
  const idRef = useRef(0);
  const { trim, ignoreWhitespace, ignoreCase } = options;

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++idRef.current;
    const problem = sizeProblem(a, 'Original') ?? sizeProblem(b, 'Changed');
    if (problem || (!a && !b)) {
      const t = setTimeout(() => setState({ result: null, unified: '', busy: false, error: problem, version: id }), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      // A still-running diff is stale now: stop it rather than wait for it.
      if (busyRef.current && workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (!workerRef.current) {
        const worker = new Worker(new URL('../workers/diff.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<DiffResponse>) => {
          if (e.data.id !== idRef.current) return;
          busyRef.current = false;
          if (e.data.type === 'done') setState({ result: e.data.result, unified: e.data.unified, busy: false, error: null, version: e.data.id });
          else setState({ result: null, unified: '', busy: false, error: e.data.message, version: e.data.id });
        };
        worker.onerror = () => {
          busyRef.current = false;
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          setState((s) => ({ ...s, result: null, unified: '', busy: false, error: 'The comparison stopped unexpectedly.' }));
        };
        workerRef.current = worker;
      }
      busyRef.current = true;
      setState((s) => ({ ...s, busy: true, error: null }));
      const req: DiffRequest = { id, a, b, options: { trim, ignoreWhitespace, ignoreCase } };
      workerRef.current.postMessage(req);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [a, b, trim, ignoreWhitespace, ignoreCase]);

  return state;
}
