// Batch image processing plumbing: a worker-backed render client and download helpers.

import { AppError } from './errors';
import { renderImage, type RenderJob, type RenderResult } from './image';
import type { ImageWorkerRequest, ImageWorkerResponse } from './image.worker';
import { createZip } from './zip';

export const MAX_BATCH_FILES = 100;

export const isImageFile = (f: File) => f.type.startsWith('image/') || /\.(avif|heic|heif|ico|cur|svg|bmp|jxl|webp)$/i.test(f.name);

export function savedPercent(before: number, after: number): number {
  return before > 0 ? Math.round((1 - after / before) * 1000) / 10 : 0;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadZip(files: { name: string; blob: Blob }[], zipName: string) {
  const entries = await Promise.all(files.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.blob.arrayBuffer()) })));
  downloadBlob(new Blob([createZip(entries) as BlobPart], { type: 'application/zip' }), zipName);
}

const workerSupported = () =>
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && 'convertToBlob' in OffscreenCanvas.prototype;

const yieldToBrowser = () => new Promise((r) => setTimeout(r, 0));

/** Runs render jobs in a worker when OffscreenCanvas is available, otherwise on the main thread. */
export class ImageClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve: (r: RenderResult) => void; reject: (e: unknown) => void; file: Blob; job: RenderJob }>();

  async run(file: Blob, job: RenderJob): Promise<RenderResult> {
    if (!workerSupported()) {
      await yieldToBrowser();
      return renderImage(file, job);
    }
    const worker = this.getWorker();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, file, job });
      worker.postMessage({ id, file, job } satisfies ImageWorkerRequest);
    });
  }

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const w = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<ImageWorkerResponse>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      this.pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data.result);
      else if (e.data.fallback) renderImage(p.file, p.job).then(p.resolve, p.reject);
      else p.reject(new AppError(e.data.error.code, e.data.error.message));
    };
    w.onerror = () => this.cancel(new AppError('UNKNOWN', 'The image processor stopped unexpectedly.'));
    this.worker = w;
    return w;
  }

  /** Stop everything in flight (terminates the worker). */
  cancel(reason = new AppError('CANCELLED', 'Cancelled.')) {
    this.worker?.terminate();
    this.worker = null;
    for (const p of this.pending.values()) p.reject(reason);
    this.pending.clear();
  }
}
