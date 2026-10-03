// pdf-lib off the main thread: keeps each opened PDF's bytes by id, reads its metadata and
// writes a cleaned copy. Nothing in this worker performs network requests.

import { cleanPdf, inspectPdf, leftovers, PdfMetaError } from '../features/pdf-metadata-cleaner';
import type { MetaRequest, MetaResponse } from './meta.protocol';

interface WorkerScope {
  postMessage(message: MetaResponse, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<MetaRequest>) => void) | null;
}
const ctx = self as unknown as WorkerScope;
const files = new Map<string, Uint8Array>();

ctx.onmessage = async (event: MessageEvent<MetaRequest>) => {
  const req = event.data;
  const { id } = req;
  try {
    if (req.type === 'inspect') {
      const bytes = new Uint8Array(req.bytes);
      const report = await inspectPdf(bytes);
      files.set(req.fileId, bytes);
      ctx.postMessage({ id, type: 'inspected', report });
    } else if (req.type === 'close') {
      files.delete(req.fileId);
      ctx.postMessage({ id, type: 'closed' });
    } else {
      const src = files.get(req.fileId);
      if (!src) throw new Error('This file is no longer open. Add it again.');
      const { bytes, before, after } = await cleanPdf(src, req.options);
      ctx.postMessage({ id, type: 'cleaned', bytes, before, after, left: leftovers(after, req.options) }, [bytes.buffer as ArrayBuffer]);
    }
  } catch (err) {
    if (err instanceof PdfMetaError) ctx.postMessage({ id, type: 'error', code: err.code, message: err.message });
    else ctx.postMessage({ id, type: 'error', message: err instanceof Error ? err.message : 'Something went wrong while reading the PDF.' });
  }
};
