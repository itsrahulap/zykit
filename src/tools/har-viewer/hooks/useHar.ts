import { useCallback, useEffect, useRef, useState } from 'react';
import type { HarDetail, HarRow, HarSummary } from '../features/har';
import type { HarRequest, HarResponse } from '../workers/har.protocol';

export interface HarState {
  rows: HarRow[] | null;
  summary: HarSummary | null;
  busy: boolean;
  error: string | null;
  detail: { index: number; data: HarDetail } | null;
}

/** Loads a HAR in a Web Worker; `load` replaces any previous file. */
export function useHar() {
  const [state, setState] = useState<HarState>({ rows: null, summary: null, busy: false, error: null, detail: null });
  const worker = useRef<Worker | null>(null);
  const id = useRef(0);
  const pending = useRef<((text: string) => void) | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const load = useCallback((src: { file?: File; text?: string } | null) => {
    worker.current?.terminate();
    worker.current = null;
    const mine = ++id.current;
    if (!src) return setState({ rows: null, summary: null, busy: false, error: null, detail: null });
    const w = new Worker(new URL('../workers/har.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (e: MessageEvent<HarResponse>) => {
      const m = e.data;
      if (m.id !== id.current) return;
      if (m.type === 'loaded') setState({ rows: m.rows, summary: m.summary, busy: false, error: null, detail: null });
      else if (m.type === 'detail') setState((s) => ({ ...s, detail: { index: m.index, data: m.detail } }));
      else if (m.type === 'redacted') {
        pending.current?.(m.text);
        pending.current = null;
      }
      else setState({ rows: null, summary: null, busy: false, error: m.line ? `${m.message} (line ${m.line}, column ${m.column})` : m.message, detail: null });
    };
    w.onerror = () => setState({ rows: null, summary: null, busy: false, error: 'Parsing stopped unexpectedly (the file may be too large).', detail: null });
    setState({ rows: null, summary: null, busy: true, error: null, detail: null });
    w.postMessage({ type: 'load', id: mine, ...src } satisfies HarRequest);
  }, []);

  const open = useCallback((index: number) => {
    worker.current?.postMessage({ type: 'detail', id: id.current, index } satisfies HarRequest);
  }, []);

  /** The loaded HAR with secrets replaced (built in the worker, which holds the full document). */
  const redacted = useCallback(
    (bodies: boolean) =>
      new Promise<string>((resolve) => {
        pending.current = resolve;
        worker.current?.postMessage({ type: 'redact', id: id.current, bodies } satisfies HarRequest);
      }),
    [],
  );

  return { ...state, load, open, redacted };
}
