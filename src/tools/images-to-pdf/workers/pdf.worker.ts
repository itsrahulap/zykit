// pdf-lib off the main thread: embeds the prepared images and writes the PDF, reporting progress
// per page. Nothing in this worker performs network requests.

import { buildPdf } from '../features/images-to-pdf';
import type { BuildRequest, BuildResponse } from './pdf.protocol';

interface WorkerScope {
  postMessage(message: BuildResponse, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<BuildRequest>) => void) | null;
}
const ctx = self as unknown as WorkerScope;

ctx.onmessage = async (event: MessageEvent<BuildRequest>) => {
  const { id, items, layout, meta } = event.data;
  try {
    let last = 0;
    const bytes = await buildPdf(
      items.map((i) => ({ bytes: new Uint8Array(i.bytes), kind: i.kind, rotation: i.rotation })),
      layout,
      meta,
      (done, total) => {
        const now = performance.now();
        if (now - last > 80 || done === total) {
          last = now;
          ctx.postMessage({ id, type: 'progress', done, total });
        }
      },
    );
    ctx.postMessage({ id, type: 'built', bytes }, [bytes.buffer as ArrayBuffer]);
  } catch (err) {
    ctx.postMessage({ id, type: 'error', message: err instanceof Error ? err.message : 'Something went wrong while writing the PDF.' });
  }
};
