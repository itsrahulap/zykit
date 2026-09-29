// Shell for every /learn page: a sticky sidebar on large screens, a "Browse" drawer on
// smaller ones, and site-wide search (button or ⌘K / Ctrl K).

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { LearnNav } from './components/LearnNav';
import { SearchDialog } from './components/SearchDialog';
import { useModal } from './hooks/useModal';
import { Icon } from '../shared/ui/ui';

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function SearchButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts="Meta+K Control+K"
      className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:border-slate-300 hover:text-slate-900 pointer-coarse:min-h-11 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white ${className}`}
    >
      <Icon name="search" className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search</span>
      <kbd className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 font-sans text-xs font-medium text-slate-500 sm:inline dark:bg-slate-800 dark:text-slate-400">
        {isMac() ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
}

function Drawer({ onClose, onSearch }: { onClose: () => void; onSearch: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModal(true, panel, onClose);
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/40 dark:bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        id="learn-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 id={titleId} className="font-semibold text-slate-900 dark:text-white">
            Browse Learn
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 pointer-coarse:h-11 pointer-coarse:w-11 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
          <SearchButton onClick={onSearch} className="w-full" />
          <LearnNav />
        </div>
      </div>
    </div>
  );
}

export default function LearnLayout() {
  const { pathname } = useLocation();
  // The drawer remembers the page it was opened on, so navigating closes it.
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const drawerOpen = drawerAt === pathname;
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => {
    setDrawerAt(null);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openSearch]);

  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        aria-label="Learn sidebar"
        className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-6 lg:pr-1"
      >
        <SearchButton onClick={openSearch} className="mb-6 w-full" />
        <LearnNav />
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 lg:hidden dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDrawerAt(pathname)}
            aria-expanded={drawerOpen}
            aria-controls="learn-drawer"
            aria-haspopup="dialog"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 pointer-coarse:min-h-11 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <Icon name="menu" className="h-4 w-4" /> Browse
          </button>
          <SearchButton onClick={openSearch} className="ml-auto min-w-0 flex-1 sm:max-w-64 sm:flex-none" />
        </div>
        <Outlet />
      </div>

      {drawerOpen && <Drawer onClose={() => setDrawerAt(null)} onSearch={openSearch} />}
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
