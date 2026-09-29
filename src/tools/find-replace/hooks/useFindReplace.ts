import { useEffect, useRef, useState } from 'react';
import { TIMEOUT_MS, type FindOptions, type FindReplaceResult, type Rule } from '../features/findReplace';
import type { FindReplaceRequest, FindReplaceResponse } from '../workers/findReplace.protocol';

export type FindReplaceState =
  | { status: 'idle' }
  | { status: 'running'; last?: FindReplaceResult }
  | { status: 'done'; result: FindReplaceResult }
  | { status: 'error'; error: string }
  | { status: 'timeout' };

/**
 * Same approach as the Regex Tester: runs in a Web Worker, debounced. If the worker doesn't answer within
 * TIMEOUT_MS it is terminated (the only way to stop a backtracking regex) and a fresh one is made next time.
 */
export function useFindReplace(text: string, rules: Rule[], options: FindOptions, active: number): FindReplaceState {
  const [state, setState] = useState<FindReplaceState>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const lastResult = useRef<FindReplaceResult | undefined>(undefined);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    const debounce = setTimeout(() => {
      setState({ status: 'running', last: lastResult.current });
      if (!workerRef.current) workerRef.current = new Worker(new URL('../workers/findReplace.worker.ts', import.meta.url), { type: 'module' });
      const worker = workerRef.current;
      worker.onmessage = (e: MessageEvent<FindReplaceResponse>) => {
        if (e.data.id !== seq.current) return;
        pending = false;
        clearTimeout(timer);
        if (e.data.ok) {
          lastResult.current = e.data.result;
          setState({ status: 'done', result: e.data.result });
        } else setState({ status: 'error', error: e.data.error });
      };
      worker.onerror = () => {
        pending = false;
        clearTimeout(timer);
        setState({ status: 'error', error: 'The matcher crashed.' });
      };
      timer = setTimeout(() => {
        pending = false;
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        if (id === seq.current) setState({ status: 'timeout' });
      }, TIMEOUT_MS);
      const req: FindReplaceRequest = { id, text, rules, options, active };
      pending = true;
      worker.postMessage(req);
    }, 120);
    return () => {
      clearTimeout(debounce);
      clearTimeout(timer);
      // A newer input arrived while this one was still running: drop the busy worker.
      if (pending) {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  }, [text, rules, options, active]);

  return state;
}
