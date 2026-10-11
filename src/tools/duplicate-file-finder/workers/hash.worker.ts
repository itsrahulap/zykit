// SHA-256 off the main thread. crypto.subtle can't hash a stream, so each file is read whole
// (the page caps files at 2 GB). Nothing in this worker performs network requests.

import { toHex } from '../features/duplicate-file-finder';
import type { HashRequest, HashResponse } from './hash.protocol';

interface WorkerScope {
  postMessage(message: HashResponse): void;
  onmessage: ((event: MessageEvent<HashRequest>) => void) | null;
}
const ctx = self as unknown as WorkerScope;

ctx.onmessage = async (event: MessageEvent<HashRequest>) => {
  for (const { id, file } of event.data.files) {
    try {
      ctx.postMessage({ type: 'hash', id, hash: toHex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), bytes: file.size });
    } catch {
      ctx.postMessage({ type: 'fail', id, message: `${file.name} couldn't be read (it may have changed, or be too large for this device).`, bytes: file.size });
    }
  }
  ctx.postMessage({ type: 'done' });
};
