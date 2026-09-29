// Mounted once in the layout: "?" (outside text fields) opens the keyboard shortcuts dialog,
// which is fetched the first time it's needed. Other components can open it via the event.

import { lazy, Suspense, useEffect, useState } from 'react';
import { isTypingTarget, OPEN_SHORTCUTS_EVENT } from '../lib/shortcuts';

const ShortcutsHelp = lazy(() => import('./ShortcutsHelp'));


export function ShortcutsHelpHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      setOpen(true);
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    document.addEventListener(OPEN_SHORTCUTS_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpen);
    };
  }, []);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <ShortcutsHelp onClose={() => setOpen(false)} />
    </Suspense>
  );
}
