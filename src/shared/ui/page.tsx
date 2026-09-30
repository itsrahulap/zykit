// Page-level building blocks shared by every tool.

import type { ReactNode } from 'react';
import { Icon, type IconName } from './ui';

/** Rounded icon tile used for the site logo and tool icons. */
export function IconTile({ icon, size = 'md' }: { icon: IconName; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-2xl sm:h-11 sm:w-11';
  return (
    <span className={`flex shrink-0 items-center justify-center bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge ${box}`}>
      <Icon name={icon} className="h-6 w-6" />
    </span>
  );
}

/** Headline with a serif italic accent word. */
export function Headline({ children, accent, as: Tag = 'h1' }: { children: ReactNode; accent?: string; as?: 'h1' | 'h2' }) {
  return (
    <Tag className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
      {children}
      {accent && <em className="font-serif font-normal italic text-emerald-600 dark:text-emerald-400">{accent}</em>}
      {accent && '.'}
    </Tag>
  );
}

/** Thin status strip under the page heading. */
export function StatusStrip({ status, tone = 'neutral' }: { status: string; tone?: 'neutral' | 'busy' | 'good' }) {
  const pill = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    busy: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    good: 'bg-primary text-primary-ink',
  }[tone];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-5 dark:border-slate-800">
      {/* Only the status text is a live region; the "Local processing" label never changes. */}
      <p aria-live="polite" className={`rounded-xl px-4 py-2.5 text-sm sm:text-base ${pill}`}>{status}</p>
      <p className="eyebrow flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon name="lock" className="h-3.5 w-3.5" /> Local processing
      </p>
    </div>
  );
}

export function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
      <Icon name="warn" className="h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} className="rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900" aria-label="Dismiss error">
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  );
}
