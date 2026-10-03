import { useCallback, useEffect, useRef } from 'react';
import type { BuildRequest, BuildResponse } from '../workers/pdf.protocol';

type Req = BuildRequest extends infer R ? (R extends BuildRequest ? Omit<R, 'id'> : never) : never;

/** A lazily started pdf-lib worker with request/response matching and progress callbacks. */
export function useBuildWorker() {
  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(0);
  const pending = useRef(new Map<number, { resolve: (r: BuildResponse) => void; onProgress?: (done: number, total: number) => void }>());

  useEffect(() => () => workerRef.current?.terminate(), []);

  const worker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<BuildResponse>) => {
      const p = pending.current.get(e.data.id);
      if (!p) return;
      if (e.data.type === 'progress') return p.onProgress?.(e.data.done, e.data.total);
      pending.current.delete(e.data.id);
      p.resolve(e.data);
    };
    w.onerror = (e) => {
      e.preventDefault();
      for (const [id, p] of pending.current) p.resolve({ id, type: 'error', message: 'The PDF writer stopped unexpectedly (the files may be too large for this device).' });
      pending.current.clear();
      w.terminate();
      if (workerRef.current === w) workerRef.current = null;
    };
    workerRef.current = w;
    return w;
  }, []);

  return useCallback(
    (req: Req, onProgress?: (done: number, total: number) => void, transfer: Transferable[] = []) =>
      new Promise<BuildResponse>((resolve) => {
        const id = ++nextId.current;
        pending.current.set(id, { resolve, onProgress });
        worker().postMessage({ ...req, id }, transfer);
      }),
    [worker],
  );
}
