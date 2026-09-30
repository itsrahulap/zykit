import { useEffect, useRef, useState } from 'react';
import type { QueryResult } from '../features/jsonpath-query';
import type { JsonPathRequest, JsonPathResponse } from '../workers/jsonpath.worker';

/** A query taking longer than this is stopped (the worker is terminated). */
export const TIMEOUT_MS = 3000;

export type JsonPathState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; result: QueryResult }
  | { status: 'timeout' }
  | { status: 'crash'; message: string };

/** Runs the query in a Web Worker, debounced, with a time limit. */
export function useJsonPath(json: string, query: string): JsonPathState {
  const [state, setState] = useState<JsonPathState>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++seq.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    const debounce = setTimeout(() => {
      if (!json.trim() || !query.trim()) {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'running' });
      if (!workerRef.current) workerRef.current = new Worker(new URL('../workers/jsonpath.worker.ts', import.meta.url), { type: 'module' });
      const worker = workerRef.current;
      worker.onmessage = (e: MessageEvent<JsonPathResponse>) => {
        if (e.data.id !== seq.current) return;
        pending = false;
        clearTimeout(timer);
        setState('crash' in e.data ? { status: 'crash', message: e.data.crash } : { status: 'done', result: e.data.result });
      };
      worker.onerror = () => {
        pending = false;
        clearTimeout(timer);
        setState({ status: 'crash', message: 'The query engine crashed.' });
      };
      timer = setTimeout(() => {
        pending = false;
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        if (id === seq.current) setState({ status: 'timeout' });
      }, TIMEOUT_MS);
      const req: JsonPathRequest = { id, json, query };
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
  }, [json, query]);

  return state;
}
