import { useEffect, useRef, useState } from 'react';
import { TIMEOUT_MS, type MatchResult } from '../features/regex';
import type { RegexRequest, RegexResponse } from '../workers/regex.protocol';

export type RegexState = { status: 'idle' } | { status: 'running' } | { status: 'done'; result: MatchResult } | { status: 'timeout' };

/**
 * Runs the regex in a Web Worker, debounced. If it doesn't answer within TIMEOUT_MS the worker is
 * terminated (the only way to stop a backtracking regex) and a fresh one is made for the next run.
 */
export function useRegex(pattern: string, flags: string, text: string, replacement: string | undefined): RegexState {
  const [state, setState] = useState<RegexState>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    const debounce = setTimeout(() => {
      if (!pattern) {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'running' });
      if (!workerRef.current) workerRef.current = new Worker(new URL('../workers/regex.worker.ts', import.meta.url), { type: 'module' });
      const worker = workerRef.current;
      worker.onmessage = (e: MessageEvent<RegexResponse>) => {
        if (e.data.id !== seq.current) return;
        pending = false;
        clearTimeout(timer);
        setState({ status: 'done', result: e.data.result });
      };
      worker.onerror = () => {
        pending = false;
        clearTimeout(timer);
        setState({
          status: 'done',
          result: { ok: false, error: 'The matcher crashed.' },
        });
      };
      timer = setTimeout(() => {
        pending = false;
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        if (id === seq.current) setState({ status: 'timeout' });
      }, TIMEOUT_MS);
      const req: RegexRequest = { id, pattern, flags, text, replacement };
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
  }, [pattern, flags, text, replacement]);

  return state;
}
