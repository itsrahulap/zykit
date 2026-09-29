// "Send to…": hands text from one tool's output to another tool's main input. Stored in
// sessionStorage so it survives the navigation but not the tab, and consumed exactly once by
// the target (see useIncomingText). Anything older than HANDOFF_TTL_MS is ignored.

import type { DataKind } from '../../tools/types';

export const HANDOFF_KEY = 'zykit-handoff';
export const HANDOFF_TTL_MS = 10 * 60 * 1000;

export interface TextHandoff {
  /** Target tool id. */
  to: string;
  text: string;
  /** Sender: a tool id, or e.g. 'learn'. */
  from: string;
  /** Epoch ms when it was written. */
  at: number;
  /** What the text is, when the sender knows (lets a two-way converter pick its direction). */
  kind?: DataKind;
  /** Source language hint, e.g. 'ts' for the JS Runner. */
  lang?: string;
}

export function sendText(h: Omit<TextHandoff, 'at'>, now = Date.now()): boolean {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ ...h, at: now } satisfies TextHandoff));
    return true;
  } catch {
    return false;
  }
}

/** Parses a stored handoff; anything malformed or stale gives null. */
export function parseHandoff(raw: string | null, now = Date.now()): TextHandoff | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<TextHandoff> | null;
    if (!v || typeof v !== 'object') return null;
    if (typeof v.to !== 'string' || typeof v.text !== 'string' || !v.text || typeof v.at !== 'number') return null;
    if (now - v.at > HANDOFF_TTL_MS || v.at - now > 60_000) return null;
    return {
      to: v.to,
      text: v.text,
      from: typeof v.from === 'string' ? v.from : '',
      at: v.at,
      ...(typeof v.kind === 'string' ? { kind: v.kind } : {}),
      ...(typeof v.lang === 'string' ? { lang: v.lang } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Returns the handoff addressed to `toolId` and removes it. A handoff for another tool is left
 * alone; a malformed or stale one is removed.
 */
export function takeHandoff(toolId: string, now = Date.now()): TextHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const h = parseHandoff(raw, now);
    if (h && h.to !== toolId) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    return h;
  } catch {
    return null;
  }
}
