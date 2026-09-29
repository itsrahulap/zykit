// Small presentational pieces shared by the problem bank pages.

import { Link } from 'react-router';
import type { ProblemDifficulty } from '../../types/problem';
import { Icon } from '../../../shared/ui/ui';
import { DIFFICULTIES, percent } from './practice';

/** Horizontal progress bar with an accessible value. */
export function ProgressBar({
  value,
  max,
  label,
  className = '',
}: {
  value: number;
  max: number;
  /** Omit when the numbers are already shown as text next to the bar; the bar is then hidden from assistive tech. */
  label?: string;
  className?: string;
}) {
  const pct = percent(value, max);
  const a11y = label
    ? { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-valuetext': `${value} of ${max}` }
    : { 'aria-hidden': true };
  return (
    <div
      {...a11y}
      className={`h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
    >
      <div className="h-full rounded-full bg-emerald-600 transition-[width] dark:bg-emerald-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

const MIX_DOT: Record<ProblemDifficulty, string> = {
  Easy: 'bg-emerald-500',
  Medium: 'bg-amber-400',
  Hard: 'bg-red-500',
};

/** "3 Easy · 5 Medium · 2 Hard" with coloured dots (the text carries the meaning). */
export function DifficultyMix({ mix }: { mix: Record<ProblemDifficulty, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
      {DIFFICULTIES.filter((d) => mix[d] > 0).map((d) => (
        <li key={d} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${MIX_DOT[d]}`} />
          {mix[d]} {d}
        </li>
      ))}
    </ul>
  );
}

/** Round check mark showing whether a problem is solved. */
export function SolvedMark({ solved }: { solved: boolean }) {
  return solved ? (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
      <Icon name="check" className="h-4 w-4" />
      <span className="sr-only">Solved</span>
    </span>
  ) : (
    <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600">
      <span className="sr-only">Not solved</span>
    </span>
  );
}

type NavLinkDef = { to: string; title: string };

/** Previous / next links at the bottom of a detail page. */
export function PrevNext({ prev, next, label }: { prev?: NavLinkDef; next?: NavLinkDef; label: string }) {
  if (!prev && !next) return null;
  const box =
    'group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500';
  return (
    <nav aria-label={label} className="flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link to={prev.to} rel="prev" className={box}>
          <Icon name="chevron-left" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-emerald-600" />
          <span className="min-w-0">
            <span className="eyebrow block text-slate-500 dark:text-slate-400">Previous</span>
            <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">{prev.title}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
      {next ? (
        <Link to={next.to} rel="next" className={`${box} justify-end text-right`}>
          <span className="min-w-0">
            <span className="eyebrow block text-slate-500 dark:text-slate-400">Next</span>
            <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">{next.title}</span>
          </span>
          <Icon name="chevron-right" className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-emerald-600" />
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
    </nav>
  );
}
