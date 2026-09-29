// Decodes, resizes and encodes images off the main thread with OffscreenCanvas.

import { serializeError, type SerializedError } from './errors';
import { renderImage, type RenderJob, type RenderResult } from './image';

export type ImageWorkerRequest = { id: number; file: Blob; job: RenderJob };
export type ImageWorkerResponse = { id: number; ok: true; result: RenderResult } | { id: number; ok: false; error: SerializedError; fallback: boolean };

self.onmessage = async (e: MessageEvent<ImageWorkerRequest>) => {
  const { id, file, job } = e.data;
  try {
    const result = await renderImage(file, job);
    self.postMessage({ id, ok: true, result } satisfies ImageWorkerResponse);
  } catch (err) {
    // Formats only an <img> can decode (e.g. SVG) are retried on the main thread.
    const error = serializeError(err);
    self.postMessage({ id, ok: false, error, fallback: error.code === 'UNSUPPORTED_FORMAT' || error.code === 'UNKNOWN' } satisfies ImageWorkerResponse);
  }
};
