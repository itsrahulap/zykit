// Message protocol between a lesson page and the DOM sandbox (public/sandbox/dom.js).

import type { LogLevel } from '../../tools/js-runner/features/protocol';

// Production (Vercel cleanUrls) and `vite preview` serve dom.html at the clean URL. The dev server
// doesn't: it answers /sandbox/dom with the app's index.html, whose dev scripts the sandbox can't load.
export const SANDBOX_URL = import.meta.env.DEV ? '/sandbox/dom.html' : '/sandbox/dom';
export const SANDBOX_TAG = 'zykit-dom-sandbox';
export const PARENT_TAG = 'zykit-learn';
/** Defined (read-only) by the sandbox page; see loopGuard.ts. */
export const LOOP_GUARD = '__zykitLoopGuard';

export type SandboxMessage =
  | { source: typeof SANDBOX_TAG; type: 'ready' }
  | { source: typeof SANDBOX_TAG; type: 'log'; level: LogLevel; text: string; depth?: number }
  | { source: typeof SANDBOX_TAG; type: 'done'; ok: boolean; ms: number }
  | { source: typeof SANDBOX_TAG; type: 'truncated' };

const LEVELS: readonly string[] = ['log', 'info', 'warn', 'error', 'debug'];

/**
 * Accepts a message only if it comes from our sandbox frame's window, from an opaque origin
 * (the frame has no allow-same-origin, so its origin is "null"), and has the expected shape.
 */
export function parseSandboxMessage(event: Pick<MessageEvent, 'data' | 'origin' | 'source'>, frame: Window | null | undefined): SandboxMessage | null {
  if (!frame || event.source !== frame || event.origin !== 'null') return null;
  const d = event.data as Record<string, unknown> | null;
  if (!d || typeof d !== 'object' || d.source !== SANDBOX_TAG) return null;
  switch (d.type) {
    case 'ready':
    case 'truncated':
      return { source: SANDBOX_TAG, type: d.type };
    case 'log':
      if (typeof d.text !== 'string' || typeof d.level !== 'string' || !LEVELS.includes(d.level)) return null;
      return {
        source: SANDBOX_TAG,
        type: 'log',
        level: d.level as LogLevel,
        text: d.text.slice(0, 200_000),
        depth: typeof d.depth === 'number' && d.depth >= 0 ? Math.min(Math.floor(d.depth), 10) : 0,
      };
    case 'done':
      return { source: SANDBOX_TAG, type: 'done', ok: d.ok === true, ms: typeof d.ms === 'number' ? d.ms : 0 };
    default:
      return null;
  }
}
