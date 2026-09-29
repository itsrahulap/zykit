// All parsing and sanitization runs here, off the main thread.
// Nothing in this worker performs network requests.

import { cleanImage, type ProcessingStage } from '../features/pipeline';
import { analyzeImage } from '../features/metadata/metadata.service';
import { serializeError } from '../../../shared/lib/errors';
import type { WorkerRequest, WorkerResponse } from './worker.protocol';

interface WorkerScope {
  postMessage(message: unknown, transfer: Transferable[]): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;
const post = (msg: WorkerResponse, transfer: Transferable[] = []) => ctx.postMessage(msg, transfer);

async function decode(bytes: Uint8Array, mime: string) {
  if (typeof createImageBitmap !== 'function') throw new Error('Decoding unavailable');
  const bitmap = await createImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }));
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  const stage = (s: ProcessingStage) => post({ id: msg.id, type: 'progress', stage: s });
  try {
    stage('reading');
    const bytes = new Uint8Array(await msg.file.arrayBuffer());

    if (msg.type === 'analyze') {
      stage('analyzing');
      post({ id: msg.id, type: 'analyzed', report: await analyzeImage(bytes) });
      return;
    }

    const { bytes: out, ...rest } = await cleanImage(bytes, msg.options, { onStage: stage, decode });
    post({ id: msg.id, type: 'cleaned', result: { ...rest, buffer: out.buffer } }, [out.buffer]);
  } catch (err) {
    post({ id: msg.id, type: 'error', error: serializeError(err) });
  }
};
