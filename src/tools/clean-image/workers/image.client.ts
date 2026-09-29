import type { ProcessingStage } from '../features/pipeline';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import type { SanitizeOptions } from '../features/sanitizer/sanitizer.types';
import { AppError } from '../../../shared/lib/errors';
import type { CleanResponse, WorkerRequest, WorkerResponse } from './worker.protocol';

type Pending = {
  resolve: (v: WorkerResponse) => void;
  reject: (e: unknown) => void;
  onStage?: (s: ProcessingStage) => void;
};

type RequestBody = WorkerRequest extends infer R ? (R extends WorkerRequest ? Omit<R, 'id'> : never) : never;

/** Promise wrapper around the image worker. Cancelling terminates the worker outright. */
export class ImageWorkerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      if (e.data.type === 'progress') {
        p.onStage?.(e.data.stage);
        return;
      }
      this.pending.delete(e.data.id);
      if (e.data.type === 'error') p.reject(new AppError(e.data.error.code, e.data.error.message));
      else p.resolve(e.data);
    };
    worker.onerror = () => this.failAll(new AppError('UNKNOWN', 'The image processor stopped unexpectedly.'));
    this.worker = worker;
    return worker;
  }

  private failAll(err: AppError) {
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  private request(body: RequestBody, signal?: AbortSignal, onStage?: Pending['onStage']): Promise<WorkerResponse> {
    if (signal?.aborted) return Promise.reject(new AppError('CANCELLED', 'Processing was cancelled.'));
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject, onStage });
      signal?.addEventListener('abort', () => this.failAll(new AppError('CANCELLED', 'Processing was cancelled.')), { once: true });
      this.getWorker().postMessage({ ...body, id } as WorkerRequest);
    });
  }

  async analyze(file: Blob, opts: { signal?: AbortSignal; onStage?: Pending['onStage'] } = {}): Promise<ImageMetadataReport> {
    const res = await this.request({ type: 'analyze', file }, opts.signal, opts.onStage);
    if (res.type !== 'analyzed') throw new AppError('UNKNOWN', 'Unexpected response from image processor.');
    return res.report;
  }

  async clean(
    file: Blob,
    options: SanitizeOptions,
    opts: { signal?: AbortSignal; onStage?: Pending['onStage'] } = {},
  ): Promise<CleanResponse> {
    const res = await this.request({ type: 'clean', file, options }, opts.signal, opts.onStage);
    if (res.type !== 'cleaned') throw new AppError('UNKNOWN', 'Unexpected response from image processor.');
    return res.result;
  }

  dispose() {
    this.failAll(new AppError('CANCELLED', 'Processing was cancelled.'));
  }
}
