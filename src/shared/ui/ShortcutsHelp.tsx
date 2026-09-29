// The "?" keyboard shortcuts dialog. Lazily loaded by ShortcutsHelpHost the first time it opens.

import { useId, useRef } from 'react';
import { useModal } from '../hooks/useModal';
import { shortcutText } from '../lib/shortcuts';
import { Icon } from './ui';

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Anywhere',
    rows: [
      [shortcutText('mod+k'), 'Search tools, lessons and posts'],
      ['/', 'Focus the tool search (home page)'],
      ['?', 'Show these shortcuts'],
    ],
  },
  {
    title: 'On a tool page',
    rows: [
      [shortcutText('mod+enter'), 'Run or convert (tools with a run button)'],
      [shortcutText('mod+shift+c'), 'Copy the main output'],
      [shortcutText('mod+s'), 'Download the main output'],
    ],
  },
];

export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useModal(true, panel, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[10vh] sm:p-6 sm:pt-[14vh]">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 pointer-coarse:h-11 pointer-coarse:w-11 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        {GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title} className="mt-5">
            <h3 className="eyebrow mb-2 text-slate-500 dark:text-slate-400">{g.title}</h3>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              {g.rows.map(([keys, what]) => (
                <div key={what} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <dt className="text-slate-700 dark:text-slate-300">{what}</dt>
                  <dd>
                    <kbd className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 font-sans text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">Shortcuts with a modifier key also work while you type in a field.</p>
      </div>
    </div>
  );
}
