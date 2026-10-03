// Runs the editor's pixel work off the main thread. Messages: load (decode and keep the original),
// preview (render a downscaled bitmap) and export (render at full size and encode).

import { serializeError, type SerializedError } from '../../../shared/lib/errors';
import type { EditState } from './image-editor';
import { EditSession } from './render';

export type EditorRequest =
  | { id: number; op: 'load'; file: Blob }
  | { id: number; op: 'preview'; state: EditState; maxSide: number }
  | { id: number; op: 'export'; state: EditState; type: string; quality: number };

export type EditorResponse =
  | { id: number; ok: true; width?: number; height?: number; bitmap?: ImageBitmap; blob?: Blob }
  | { id: number; ok: false; error: SerializedError };

const session = new EditSession();

self.onmessage = async (e: MessageEvent<EditorRequest>) => {
  const m = e.data;
  try {
    if (m.op === 'load') {
      const { width, height } = await session.load(m.file);
      (self as unknown as Worker).postMessage({ id: m.id, ok: true, width, height } satisfies EditorResponse);
    } else if (m.op === 'preview') {
      const bitmap = await session.preview(m.state, m.maxSide);
      (self as unknown as Worker).postMessage({ id: m.id, ok: true, bitmap } satisfies EditorResponse, [bitmap]);
    } else {
      const { blob, width, height } = await session.export(m.state, m.type, m.quality);
      (self as unknown as Worker).postMessage({ id: m.id, ok: true, blob, width, height } satisfies EditorResponse);
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: m.id, ok: false, error: serializeError(err) } satisfies EditorResponse);
  }
};
