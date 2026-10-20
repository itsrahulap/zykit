// Header menu for picking a design style. Same menu-button pattern as SendToMenu:
// arrow keys, Home/End, Escape; focus returns to the button when the menu closes.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { applyDesign, DESIGN_STYLES, getStoredDesign } from '../utils/design';
import { Icon } from './ui';

export function DesignMenu() {
  const id = useId();
  const [style, setStyle] = useState(getStoredDesign);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) items.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const openAt = (i: number) => {
    setActive((i + DESIGN_STYLES.length) % DESIGN_STYLES.length);
    setOpen(true);
  };
  const current = Math.max(0, DESIGN_STYLES.findIndex((s) => s.id === style));

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAt(current);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openAt(DESIGN_STYLES.length - 1);
    }
  };
  const onMenuKey = (e: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: DESIGN_STYLES.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      openAt(moves[e.key]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={root} className="relative inline-flex">
      <button
        ref={button}
        type="button"
        id={`${id}-button`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label="Design style"
        title="Design style"
        onClick={() => (open ? close() : openAt(current))}
        onKeyDown={onButtonKey}
        className="inline-flex items-center justify-center rounded-xl p-2.5 text-slate-600 pointer-coarse:h-11 pointer-coarse:w-11 ring-1 ring-inset ring-slate-200 hover:bg-white dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-900"
      >
        <Icon name="palette" className="h-5 w-5" />
      </button>
      <div
        id={`${id}-menu`}
        role="menu"
        aria-labelledby={`${id}-button`}
        hidden={!open}
        onKeyDown={onMenuKey}
        className="absolute right-0 top-full z-30 mt-1.5 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
      >
        {DESIGN_STYLES.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={s.id === style}
            tabIndex={i === active ? 0 : -1}
            onPointerMove={() => i !== active && setActive(i)}
            onClick={() => {
              applyDesign(s.id);
              setStyle(s.id);
              close();
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left focus:outline-none ${
              i === active ? 'bg-primary text-primary-ink dark:bg-slate-800 dark:text-white' : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{s.label}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{s.description}</span>
            </span>
            {s.id === style && <Icon name="check" className="h-4 w-4 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
