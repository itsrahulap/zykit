// Decodes, resizes and encodes images off the main thread with OffscreenCanvas.

import { serializeError, type SerializedError } from './errors';
import { renderImage, sniffImageType, type RenderJob, type RenderResult } from './image';

export type ImageWorkerRequest = { id: number; file: Blob; job: RenderJob };
export type ImageWorkerResponse = { id: number; ok: true; result: RenderResult } | { id: number; ok: false; error: SerializedError; fallback: boolean };

self.onmessage = async (e: MessageEvent<ImageWorkerRequest>) => {
  const { id, file, job } = e.data;
  try {
    const result = await renderImage(file, job);
    self.postMessage({ id, ok: true, result } satisfies ImageWorkerResponse);
  } catch (err) {
    // SVG needs an <img> (main thread only); unexpected failures get a second try there too.
    const error = serializeError(err);
    const isSvg = sniffImageType(new Uint8Array(await file.slice(0, 2048).arrayBuffer()))?.mime === 'image/svg+xml';
    self.postMessage({ id, ok: false, error, fallback: isSvg || error.code === 'UNKNOWN' } satisfies ImageWorkerResponse);
  }
};
