import { useEffect, useRef, useState } from 'react';
import type { Draft, ValidateResult } from '../features/json-schema';
import type { ValidateRequest, ValidateResponse } from '../workers/validate.worker';

/** Validation taking longer than this is stopped (the worker is terminated). */
export const TIMEOUT_MS = 3000;

export type ValidationState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; result: ValidateResult }
  | { status: 'timeout' }
  | { status: 'crash'; message: string };

/** Validates in a Web Worker, debounced, with a time limit. Pass null texts to stay idle. */
export function useValidation(schema: string | null, instance: string | null, draft: Draft | 'auto', assertFormat: boolean): ValidationState {
  const [state, setState] = useState<ValidationState>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    const debounce = setTimeout(() => {
      if (schema === null || instance === null) {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'running' });
      if (!workerRef.current) workerRef.current = new Worker(new URL('../workers/validate.worker.ts', import.meta.url), { type: 'module' });
      const worker = workerRef.current;
      worker.onmessage = (e: MessageEvent<ValidateResponse>) => {
        if (e.data.id !== seq.current) return;
        pending = false;
        clearTimeout(timer);
        setState('crash' in e.data ? { status: 'crash', message: e.data.crash } : { status: 'done', result: e.data.result });
      };
      worker.onerror = () => {
        pending = false;
        clearTimeout(timer);
        setState({ status: 'crash', message: 'The validator crashed.' });
      };
      timer = setTimeout(() => {
        pending = false;
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        if (id === seq.current) setState({ status: 'timeout' });
      }, TIMEOUT_MS);
      const req: ValidateRequest = { id, schema, instance, draft, assertFormat };
      pending = true;
      worker.postMessage(req);
    }, 150);
    return () => {
      clearTimeout(debounce);
      clearTimeout(timer);
      if (pending) {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  }, [schema, instance, draft, assertFormat]);

  return state;
}
