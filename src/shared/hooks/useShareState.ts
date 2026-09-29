// Shareable links for a tool page: registers the page's current state with the share button
// (in the breadcrumb) and, on load, restores state from a "#s=…" fragment. The fragment is
// untrusted: only keys the page already has, with the same type (and allowed values), apply.

import { useContext, useEffect, useRef } from 'react';
import { decodeShare, sanitizeShare, shareFromHash, type ShareState } from '../lib/share';
import { ToolCtx } from '../ui/toolContext';

export function useShareState<T extends ShareState>(
  state: T,
  apply: (restored: Partial<T>) => void,
  choices?: Partial<Record<keyof T, readonly unknown[]>>,
) {
  const ctx = useContext(ToolCtx);
  const latest = useRef({ state, apply, choices });
  useEffect(() => {
    latest.current = { state, apply, choices };
  });

  useEffect(() => {
    if (!ctx) return;
    return ctx.registerShare(() => latest.current.state);
  }, [ctx]);

  useEffect(() => {
    const payload = shareFromHash(window.location.hash);
    if (!payload) return;
    let live = true;
    void decodeShare(payload).then((decoded) => {
      if (!live || !decoded) return;
      const { state: current, apply: set, choices: allowed } = latest.current;
      set(sanitizeShare(decoded, current, allowed));
    });
    return () => {
      live = false;
    };
  }, []);
}
