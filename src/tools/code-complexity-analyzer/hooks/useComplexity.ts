import { useEffect, useRef, useState } from 'react';
import { ANALYZE_TIMEOUT_MS, LOAD_TIMEOUT_MS, type Analysis, type Language } from '../features/code-complexity-analyzer';
import type { ComplexityRequest, ComplexityResponse } from '../workers/complexity.protocol';

export type ComplexityState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'running' }
  | { status: 'done'; analysis: Analysis; code: string }
  | { status: 'error'; error: string }
  | { status: 'timeout' };

/**
 * Analyzes in a Web Worker, debounced. The first run waits up to LOAD_TIMEOUT_MS for the compiler
 * chunk; once the worker reports `started`, parsing gets ANALYZE_TIMEOUT_MS before the worker is
 * terminated (the only way to stop it) and a fresh one is made for the next run.
 */
export function useComplexity(code: string, language: Language): ComplexityState {
  const [state, setState] = useState<ComplexityState>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // True only while parsing: a superseded run that is still loading the compiler is left to finish
    // loading (its result is ignored by id), so typing during the first load doesn't restart the download.
    let parsing = false;
    const debounce = setTimeout(() => {
      if (!code.trim()) {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'loading' });
      if (!workerRef.current) workerRef.current = new Worker(new URL('../workers/complexity.worker.ts', import.meta.url), { type: 'module' });
      const worker = workerRef.current;
      const finish = (next: ComplexityState) => {
        parsing = false;
        clearTimeout(timer);
        setState(next);
      };
      const stopAfter = (ms: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          parsing = false;
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          if (id === seq.current) setState({ status: 'timeout' });
        }, ms);
      };
      worker.onmessage = (e: MessageEvent<ComplexityResponse>) => {
        if (e.data.id !== seq.current) return;
        if (e.data.type === 'started') {
          parsing = true;
          setState({ status: 'running' });
          stopAfter(ANALYZE_TIMEOUT_MS);
        } else if (e.data.type === 'done') finish({ status: 'done', analysis: e.data.analysis, code });
        else finish({ status: 'error', error: e.data.error });
      };
      worker.onerror = (e) => {
        e.preventDefault();
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        finish({ status: 'error', error: 'The analyzer crashed. Try again or reload the page.' });
      };
      stopAfter(LOAD_TIMEOUT_MS);
      const request: ComplexityRequest = { id, code, language };
      worker.postMessage(request);
    }, 250);
    return () => {
      clearTimeout(debounce);
      clearTimeout(timer);
      // A newer input arrived while this one was still running: drop the busy worker.
      if (parsing) {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  }, [code, language]);

  return state;
}
