import { useEffect, useRef, useState } from 'react';
import { MAX_CODE_CHARS, TIMEOUT_MS, type Analysis } from '../features/typescript-type-explorer';
import type { TypeCheckRequest, TypeCheckResponse } from '../workers/type-explorer.protocol';

export type TypeCheckState =
  | { status: 'loading' }
  | { status: 'running' }
  | { status: 'done'; analysis: Analysis }
  | { status: 'error'; message: string }
  | { status: 'timeout' };

/**
 * Type-checks `code` in a Web Worker, debounced. "loading" means the worker hasn't answered yet, i.e. the
 * compiler is still downloading. A check that outlives TIMEOUT_MS terminates the worker; the next run makes a new one.
 */
export function useTypeCheck(code: string): { state: TypeCheckState; version: string; lastAnalysis: Analysis | null } {
  const [state, setState] = useState<TypeCheckState>({ status: 'loading' });
  const [version, setVersion] = useState('');
  // Kept while the next check runs, so results don't flash away on every keystroke.
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const ready = useRef(false);
  const seq = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    const debounce = setTimeout(() => {
      if (code.length > MAX_CODE_CHARS) {
        setState({ status: 'error', message: `Code is longer than ${MAX_CODE_CHARS.toLocaleString('en')} characters. Shorten it to check it.` });
        return;
      }
      setState({ status: ready.current ? 'running' : 'loading' });
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../workers/type-explorer.worker.ts', import.meta.url), { type: 'module' });
        ready.current = false;
      }
      const worker = workerRef.current;
      worker.onmessage = (e: MessageEvent<TypeCheckResponse>) => {
        ready.current = true;
        if (e.data.id !== seq.current) return;
        pending = false;
        clearTimeout(timer);
        if (e.data.ok) {
          setVersion(e.data.version);
          setLastAnalysis(e.data.analysis);
          setState({ status: 'done', analysis: e.data.analysis });
        } else setState({ status: 'error', message: e.data.error });
      };
      worker.onerror = (e) => {
        e.preventDefault();
        pending = false;
        clearTimeout(timer);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setState({ status: 'error', message: 'The TypeScript compiler could not be loaded. Reload the page to try again.' });
      };
      timer = setTimeout(() => {
        pending = false;
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        if (id === seq.current) setState({ status: 'timeout' });
      }, TIMEOUT_MS);
      const request: TypeCheckRequest = { id, code };
      pending = true;
      worker.postMessage(request);
    }, 250);
    return () => {
      clearTimeout(debounce);
      clearTimeout(timer);
      // Keep a worker that is still loading the compiler (its next answer is just as useful); drop one busy checking.
      if (pending && ready.current) {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  }, [code]);

  return { state, version, lastAnalysis };
}
