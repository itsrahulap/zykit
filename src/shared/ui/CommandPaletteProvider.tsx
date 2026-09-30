// Site-wide search: ⌘K / Ctrl K on every page, plus buttons that open it. Only this small
// trigger ships in the main bundle; the palette itself is fetched the first time it opens.

import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PaletteCtx, shortcutLabel, useCommandPalette } from './commandPaletteContext';
import { Icon } from './ui';

const CommandPalette = lazy(() => import('./CommandPalette'));
const preload = () => void import('./CommandPalette');

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [{ isOpen, opens }, setState] = useState({ isOpen: false, opens: 0 });
  const setOpen = useCallback((next: boolean | ((was: boolean) => boolean)) => {
    setState((s) => {
      const now = typeof next === 'function' ? next(s.isOpen) : next;
      return now === s.isOpen ? s : { isOpen: now, opens: s.opens + (now ? 1 : 0) };
    });
  }, []);
  const open = useCallback(() => setOpen(true), [setOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const value = useMemo(() => ({ open, isOpen, opens }), [open, isOpen, opens]);
  return (
    <PaletteCtx.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </PaletteCtx.Provider>
  );
}

/** Opens the palette. `compact` shows just the icon below the `sm` breakpoint (site header). */
export function SearchButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      onPointerEnter={preload}
      onFocus={preload}
      aria-keyshortcuts="Meta+K Control+K"
      aria-haspopup="dialog"
      aria-label={compact ? 'Search' : undefined}
      className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500 hover:border-slate-300 hover:text-slate-900 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white ${
        compact ? 'p-2.5 sm:px-3 sm:py-2' : 'px-3 py-2'
      } ${className}`}
    >
      <Icon name="search" className={`shrink-0 ${compact ? 'h-5 w-5 sm:h-4 sm:w-4' : 'h-4 w-4'}`} />
      <span className={`flex-1 text-left ${compact ? 'hidden sm:inline' : ''}`}>Search</span>
      <kbd className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 font-sans text-xs font-medium text-slate-500 sm:inline dark:bg-slate-800 dark:text-slate-400">
        {shortcutLabel()}
      </kbd>
    </button>
  );
}
