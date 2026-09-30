// pdf-lib off the main thread: opens PDFs (kept here by id) and builds merged/split/edited
// outputs, reporting progress per page. Nothing in this worker performs network requests.

import type { PDFDocument } from 'pdf-lib';
import { composePdf, describePdf, openPdf, PdfOpenError } from '../features/pdf-ops';
import { createZip } from '../../../shared/lib/zip';
import type { PdfRequest, PdfResponse } from './pdf.protocol';

interface WorkerScope {
  postMessage(message: PdfResponse, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<PdfRequest>) => void) | null;
}
const ctx = self as unknown as WorkerScope;
const docs = new Map<string, PDFDocument>();

ctx.onmessage = async (event: MessageEvent<PdfRequest>) => {
  const req = event.data;
  const { id } = req;
  try {
    if (req.type === 'open') {
      const doc = await openPdf(new Uint8Array(req.bytes));
      docs.set(req.fileId, doc);
      ctx.postMessage({ id, type: 'opened', info: describePdf(doc) });
    } else if (req.type === 'close') {
      docs.delete(req.fileId);
      ctx.postMessage({ id, type: 'closed' });
    } else {
      const total = req.outputs.reduce((n, o) => n + o.pages.length, 0);
      let done = 0;
      let lastPost = 0;
      const onPage = () => {
        done++;
        const now = performance.now();
        if (now - lastPost > 80 || done === total) {
          lastPost = now;
          ctx.postMessage({ id, type: 'progress', done, total });
        }
      };
      const files: { name: string; data: Uint8Array }[] = [];
      for (const o of req.outputs) files.push({ name: o.name, data: await composePdf(docs, o.pages, { removeMetadata: req.removeMetadata, onPage }) });
      const single = files.length === 1;
      const bytes = single ? files[0].data : createZip(files);
      ctx.postMessage(
        { id, type: 'built', name: single ? files[0].name : req.zipName, mime: single ? 'application/pdf' : 'application/zip', bytes },
        [bytes.buffer as ArrayBuffer],
      );
    }
  } catch (err) {
    if (err instanceof PdfOpenError) ctx.postMessage({ id, type: 'error', code: err.code, message: err.message });
    else ctx.postMessage({ id, type: 'error', message: err instanceof Error ? err.message : 'Something went wrong while writing the PDF.' });
  }
};
