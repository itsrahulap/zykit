// Small presentational pieces shared by the Learn home, subject, progress and bookmarks pages.

import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../../shared/ui/ui';

export const primaryLinkClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink ring-1 ring-inset ring-primary-edge hover:bg-primary-hover pointer-coarse:min-h-11 sm:text-base';
export const secondaryLinkClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800';
export const cardClass = 'rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';
export const cardLinkClass = `${cardClass} transition-shadow hover:border-primary-edge hover:shadow-lg hover:shadow-slate-900/5 motion-reduce:transition-none dark:hover:border-slate-700`;

export function SectionHeading({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
      <h2 id={id} className="eyebrow text-slate-600 dark:text-slate-400">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className={`${cardClass} px-5 py-4`}>
      <dt className="eyebrow text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</dd>
      {hint && <dd className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{hint}</dd>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: { to: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {children && <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">{children}</p>}
      {action && (
        <Link to={action.to} className={`${primaryLinkClass} mt-6`}>
          {action.label} <Icon name="arrow" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
