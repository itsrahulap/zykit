// Talks to the editor worker, or runs the same EditSession on the main thread when Worker or
// OffscreenCanvas is missing (and for SVG, which only an <img> can decode).

import { AppError } from '../../../shared/lib/errors';
import type { EditorRequest, EditorResponse } from './editor.worker';
import type { EditState } from './image-editor';
import { EditSession, type Loaded } from './render';

const workerSupported = () =>
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && 'convertToBlob' in OffscreenCanvas.prototype;

type Pending = { resolve: (r: EditorResponse & { ok: true }) => void; reject: (e: unknown) => void };
type Distribute<T> = T extends unknown ? Omit<T, 'id'> : never;

export class EditorClient {
  private worker: Worker | null = null;
  private session: EditSession | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  /** Preview request waiting for the one in flight; only the newest is kept. */
  private queued: { state: EditState; maxSide: number; resolve: (b: ImageBitmap | null) => void; reject: (e: unknown) => void } | null = null;
  private previewing = false;

  get usesWorker() {
    return this.worker !== null;
  }

  private send(req: Distribute<EditorRequest>): Promise<EditorResponse & { ok: true }> {
    const worker = this.worker!;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ ...req, id });
    });
  }

  private spawn(): Worker {
    const w = new Worker(new URL('./editor.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<EditorResponse>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      this.pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data);
      else p.reject(new AppError(e.data.error.code, e.data.error.message));
    };
    w.onerror = () => this.failAll(new AppError('UNKNOWN', 'The image editor stopped unexpectedly.'));
    return w;
  }

  private failAll(err: unknown) {
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
  }

  async load(file: Blob): Promise<Loaded> {
    this.worker?.terminate();
    this.worker = null;
    this.session?.dispose();
    this.session = null;
    if (workerSupported()) {
      this.worker = this.spawn();
      try {
        const r = await this.send({ op: 'load', file });
        return { width: r.width!, height: r.height! };
      } catch (e) {
        // SVG (and anything the worker can't decode) gets a second try on the main thread.
        if (!(e instanceof AppError) || e.code !== 'UNKNOWN') throw e;
        this.worker.terminate();
        this.worker = null;
      }
    }
    this.session = new EditSession();
    return this.session.load(file);
  }

  /** Renders a downscaled preview. If a render is already running, only the newest request is kept (older ones resolve to null). */
  preview(state: EditState, maxSide: number): Promise<ImageBitmap | null> {
    return new Promise((resolve, reject) => {
      this.queued?.resolve(null);
      this.queued = { state, maxSide, resolve, reject };
      void this.pump();
    });
  }

  private async pump() {
    if (this.previewing) return;
    this.previewing = true;
    try {
      while (this.queued) {
        const job = this.queued;
        this.queued = null;
        try {
          if (this.worker) job.resolve((await this.send({ op: 'preview', state: job.state, maxSide: job.maxSide })).bitmap ?? null);
          else {
            await new Promise((r) => setTimeout(r, 0)); // let the page paint between renders
            job.resolve(await this.session!.preview(job.state, job.maxSide));
          }
        } catch (e) {
          job.reject(e);
        }
      }
    } finally {
      this.previewing = false;
    }
  }

  async export(state: EditState, type: string, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
    if (this.worker) {
      const r = await this.send({ op: 'export', state, type, quality });
      return { blob: r.blob!, width: r.width!, height: r.height! };
    }
    await new Promise((r) => setTimeout(r, 0));
    return this.session!.export(state, type, quality);
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.session?.dispose();
    this.session = null;
    this.queued?.resolve(null);
    this.queued = null;
    this.failAll(new AppError('CANCELLED', 'Cancelled.'));
  }
}
