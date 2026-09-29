// Keyboard shortcuts every tool page shares:
//   Ctrl/⌘+Enter        run / convert (tools with an explicit action)
//   Ctrl/⌘+Shift+C      copy the main output
//   Ctrl/⌘+S            download the main output
// They use a modifier, so they work while typing in a field. When several components register
// (e.g. OutputPanel and its page), the first to handle a key wins.

import { useEffect, useRef } from 'react';
import { matchShortcut } from '../lib/shortcuts';
import { announce } from '../utils/announce';

export interface ToolShortcuts {
  onRun?: () => void;
  /** The main output's text; empty means nothing to copy. */
  getOutput?: () => string;
  onDownload?: () => void;
  /** Turn the shortcuts off (e.g. no output yet). */
  disabled?: boolean;
}

export function useToolShortcuts(handlers: ToolShortcuts) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current;
      if (e.defaultPrevented || h.disabled) return;
      if (h.onRun && matchShortcut(e, 'mod+enter')) {
        e.preventDefault();
        h.onRun();
      } else if (h.getOutput && matchShortcut(e, 'mod+shift+c')) {
        const text = h.getOutput();
        e.preventDefault();
        if (!text) return announce('Nothing to copy yet');
        navigator.clipboard.writeText(text).then(
          () => announce('Output copied'),
          () => announce('Copy failed'),
        );
      } else if (h.onDownload && matchShortcut(e, 'mod+s')) {
        e.preventDefault();
        h.onDownload();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
