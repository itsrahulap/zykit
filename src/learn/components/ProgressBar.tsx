/** Thin completion bar; `label` names what it measures for screen readers. */
export function ProgressBar({ value, label, showValue = true, className = '' }: { value: number; label: string; showValue?: boolean; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <div className="h-full rounded-full bg-emerald-600 transition-[width] motion-reduce:transition-none dark:bg-emerald-400" style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="w-10 shrink-0 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{pct}%</span>}
    </div>
  );
}
