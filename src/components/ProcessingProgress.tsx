import type { ProcessingStage } from '../features/pipeline';
import { Button } from './ui';

const LABELS: Record<ProcessingStage, string> = {
  reading: 'Reading file',
  analyzing: 'Analyzing metadata',
  sanitizing: 'Removing metadata',
  validating: 'Verifying output',
};

export function ProcessingProgress({ stage, stages, onCancel }: { stage: ProcessingStage; stages: ProcessingStage[]; onCancel: () => void }) {
  const index = Math.max(0, stages.indexOf(stage));
  const pct = Math.round(((index + 0.5) / stages.length) * 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-slate-900 dark:text-slate-100">{LABELS[stage]}…</p>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-label="Processing progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={LABELS[stage]}
      >
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        {stages.map((s, i) => (
          <li key={s} className={i <= index ? 'font-medium text-slate-800 dark:text-slate-200' : ''}>
            {i < index ? '✓ ' : ''}
            {LABELS[s]}
          </li>
        ))}
      </ol>
    </div>
  );
}
