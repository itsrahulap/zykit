import { useCallback, useEffect, useRef } from 'react';
import type { MetaRequest, MetaResponse } from '../workers/meta.protocol';

type Req = MetaRequest extends infer R ? (R extends MetaRequest ? Omit<R, 'id'> : never) : never;

/** A lazily started pdf-lib worker with request/response matching and progress callbacks. */
export function usePdfMetaWorker() {
  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(0);
  const pending = useRef(new Map<number, { resolve: (r: MetaResponse) => void }>());

  useEffect(() => () => workerRef.current?.terminate(), []);

  const worker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('../workers/meta.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<MetaResponse>) => {
      const p = pending.current.get(e.data.id);
      if (!p) return;
      pending.current.delete(e.data.id);
      p.resolve(e.data);
    };
    w.onerror = (e) => {
      e.preventDefault();
      for (const [id, p] of pending.current) p.resolve({ id, type: 'error', message: 'The PDF reader stopped unexpectedly (the files may be too large for this device).' });
      pending.current.clear();
      w.terminate();
      if (workerRef.current === w) workerRef.current = null;
    };
    workerRef.current = w;
    return w;
  }, []);

  return useCallback(
    (req: Req, transfer: Transferable[] = []) =>
      new Promise<MetaResponse>((resolve) => {
        const id = ++nextId.current;
        pending.current.set(id, { resolve });
        worker().postMessage({ ...req, id }, transfer);
      }),
    [worker],
  );
}
