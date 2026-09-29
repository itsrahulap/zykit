// Parses CSV and computes column stats off the main thread so 100k-row files never freeze
// the page. Nothing in this worker performs network requests.

import { buildTable } from '../features/table';
import type { CsvRequest, CsvResponse } from './csv.protocol';

interface WorkerScope {
  postMessage(message: CsvResponse): void;
  onmessage: ((event: MessageEvent<CsvRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<CsvRequest>) => {
  const { id, text, delimiter, header } = event.data;
  try {
    ctx.postMessage({ id, type: 'done', table: buildTable(text, { delimiter, header }) });
  } catch (err) {
    ctx.postMessage({ id, type: 'error', message: err instanceof Error ? err.message : 'The file could not be read.' });
  }
};
