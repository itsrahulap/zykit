// Parses the HAR and keeps the raw entries here, so only lean rows reach the page.
// Nothing in this worker performs network requests.

import { buildRows, entryDetail, parseHar, redactHar, summarize } from '../features/har';
import type { HarRequest, HarResponse } from './har.protocol';

const ctx = self as unknown as { postMessage(m: HarResponse): void; onmessage: ((e: MessageEvent<HarRequest>) => void) | null };
let entries: unknown[] = [];
let doc: unknown = null;

ctx.onmessage = async (event) => {
  const req = event.data;
  try {
    if (req.type === 'detail') {
      ctx.postMessage({ type: 'detail', id: req.id, index: req.index, detail: entryDetail(entries[req.index]) });
      return;
    }
    if (req.type === 'redact') {
      ctx.postMessage({ type: 'redacted', id: req.id, text: redactHar(doc, req.bodies) });
      return;
    }
    const parsed = parseHar(req.file ? await req.file.text() : (req.text ?? ''));
    if (!parsed.ok) {
      const e = parsed.error as { message: string; line?: number; column?: number };
      ctx.postMessage({ type: 'error', id: req.id, message: e.message, line: e.line, column: e.column });
      return;
    }
    entries = parsed.entries;
    doc = parsed.doc;
    const rows = buildRows(entries);
    ctx.postMessage({ type: 'loaded', id: req.id, rows, summary: summarize(rows) });
  } catch (err) {
    ctx.postMessage({ type: 'error', id: req.id, message: err instanceof Error ? err.message : 'The file could not be read.' });
  }
};
