// Shell for every /learn page: a sticky sidebar on large screens, a "Browse" drawer on
// smaller ones, and buttons for the site-wide search (the ⌘K / Ctrl K command palette).

import { useId, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { LearnNav } from './components/LearnNav';
import { useModal } from '../shared/hooks/useModal';
import { SearchButton } from '../shared/ui/CommandPaletteProvider';
import { useCommandPalette } from '../shared/ui/commandPaletteContext';
import { Icon } from '../shared/ui/ui';

function Drawer({ onClose }: { onClose: () => void }) {
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
          <SearchButton className="w-full" />
          <LearnNav />
        </div>
      </div>
    </div>
  );
}

export default function LearnLayout() {
  const { pathname } = useLocation();
  // The drawer remembers the page it was opened on, so navigating closes it.
  // Opening search (button or shortcut) closes it too, so only one modal is ever open.
  const palette = useCommandPalette();
  const [drawer, setDrawer] = useState<{ at: string; opens: number } | null>(null);
  const drawerOpen = drawer?.at === pathname && drawer.opens === palette.opens;

  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)]">
      {/* "Skip to content" lands on <main>, which starts with the ~40-link sidebar; this skips it. */}
      <a
        href="#lesson"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:text-slate-900 focus:shadow-lg dark:focus:bg-slate-900 dark:focus:text-white"
      >
        Skip to lesson
      </a>
      <aside
        aria-label="Learn sidebar"
        className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-6 lg:pr-1"
      >
        <SearchButton className="mb-6 w-full" />
        <LearnNav />
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 lg:hidden dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDrawer({ at: pathname, opens: palette.opens })}
            aria-expanded={drawerOpen}
            aria-controls="learn-drawer"
            aria-haspopup="dialog"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 pointer-coarse:min-h-11 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <Icon name="menu" className="h-4 w-4" /> Browse
          </button>
          <SearchButton className="ml-auto min-w-0 flex-1 sm:max-w-64 sm:flex-none" />
        </div>
        <div id="lesson">
          <Outlet />
        </div>
      </div>

      {drawerOpen && <Drawer onClose={() => setDrawer(null)} />}
    </div>
  );
}
