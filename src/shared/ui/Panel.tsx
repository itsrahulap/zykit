import type { ReactNode } from 'react';
import { Icon } from './ui';

export function Panel({ eyebrow, icon = 'info', children, className = '' }: { eyebrow: string; icon?: Parameters<typeof Icon>[0]['name']; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <h2 className="eyebrow mb-5 flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon name={icon} className="h-4 w-4" /> {eyebrow}
      </h2>
      {children}
    </section>
  );
}

export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm sm:text-base dark:divide-slate-800">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-6 py-2.5">
          <dt className="shrink-0 text-slate-600 dark:text-slate-400">{k}</dt>
          <dd className="min-w-0 break-words text-right text-slate-900 dark:text-slate-100">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
