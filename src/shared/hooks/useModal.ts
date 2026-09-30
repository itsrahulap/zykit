// Shared modal behaviour (command palette, Learn navigation drawer, shortcuts dialog): keeps Tab
// focus inside the panel, makes the rest of the page inert (so a screen reader's virtual cursor
// can't wander behind the dialog), closes on Escape, locks page scroll and hands focus back on close.

import { useEffect, useRef, type RefObject } from 'react';

/** Sets `inert` on every sibling of `el` and of each of its ancestors; returns an undo function. */
function inertOthers(el: HTMLElement): () => void {
  const changed: Element[] = [];
  for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
    for (const sib of node.parentElement?.children ?? []) {
      // aria-hidden siblings are the dialog's own click-to-close backdrop, which must keep pointer events.
      if (sib === node || sib.hasAttribute('inert') || sib.getAttribute('aria-hidden') === 'true' || sib.tagName === 'SCRIPT') continue;
      sib.setAttribute('inert', '');
      changed.push(sib);
    }
  }
  return () => changed.forEach((n) => n.removeAttribute('inert'));
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function useModal(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const el = panel.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const restoreInert = el ? inertOthers(el) : () => {};
    (initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      restoreInert();
      // Hand focus back unless it has already moved somewhere else (e.g. into another dialog).
      const now = document.activeElement;
      const lost = !now || now === document.body || Boolean(el?.contains(now));
      if (lost && previous?.isConnected) previous.focus();
    };
  }, [open, panel, initialFocus]);
}
