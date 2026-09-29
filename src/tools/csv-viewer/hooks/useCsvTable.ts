import { useEffect, useRef, useState } from 'react';
import type { CsvDelimiter } from '../../../shared/lib/csv';
import type { Table } from '../features/table';
import type { CsvRequest, CsvResponse } from '../workers/csv.protocol';

export interface CsvTableState {
  table: Table | null;
  busy: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 200;

/** Parses `text` into a table in a Web Worker. A newer request terminates a running one. */
export function useCsvTable(text: string, delimiter: CsvDelimiter | 'auto', header: boolean): CsvTableState {
  const [state, setState] = useState<CsvTableState>({ table: null, busy: false, error: null });
  const workerRef = useRef<Worker | null>(null);
  const busyRef = useRef(false);
  const idRef = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    const id = ++idRef.current;
    if (!text.trim()) {
      const t = setTimeout(() => setState({ table: null, busy: false, error: null }), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (busyRef.current && workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (!workerRef.current) {
        const worker = new Worker(new URL('../workers/csv.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<CsvResponse>) => {
          if (e.data.id !== idRef.current) return;
          busyRef.current = false;
          if (e.data.type === 'done') setState({ table: e.data.table, busy: false, error: null });
          else setState({ table: null, busy: false, error: e.data.message });
        };
        worker.onerror = () => {
          busyRef.current = false;
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          setState({ table: null, busy: false, error: 'Parsing stopped unexpectedly (the file may be too large).' });
        };
        workerRef.current = worker;
      }
      busyRef.current = true;
      setState((s) => ({ ...s, busy: true, error: null }));
      const req: CsvRequest = { id, text, delimiter, header };
      workerRef.current.postMessage(req);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, delimiter, header]);

  return state;
}
