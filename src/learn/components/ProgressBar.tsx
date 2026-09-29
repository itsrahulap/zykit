interface ProgressBarProps {
  value: number;
  /** Defaults to 100, so `value` is a percentage. */
  max?: number;
  /** Accessible name. Omit when the numbers are already shown as text next to the bar; the bar is then hidden from assistive tech. */
  label?: string;
  /** Show the percentage beside the bar. On by default for percentage bars (no `max`). */
  showValue?: boolean;
  className?: string;
}

/** Thin completion bar, either a percentage (`value` 0–100) or a count out of `max`. */
export function ProgressBar({ value, max, label, showValue = max === undefined, className = '' }: ProgressBarProps) {
  const total = max ?? 100;
  const pct = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  const a11y = label
    ? {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': total,
        'aria-valuenow': max === undefined ? pct : value,
        'aria-valuetext': max === undefined ? undefined : `${value} of ${max}`,
      }
    : { 'aria-hidden': true };

  const bar = (
    <div {...a11y} className={`h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${showValue ? 'flex-1' : className}`}>
      <div className="h-full rounded-full bg-emerald-600 transition-[width] motion-reduce:transition-none dark:bg-emerald-400" style={{ width: `${pct}%` }} />
    </div>
  );
  if (!showValue) return bar;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {bar}
      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{pct}%</span>
    </div>
  );
}
