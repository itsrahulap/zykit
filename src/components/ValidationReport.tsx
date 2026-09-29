import type { CheckStatus, ValidationReport as Report } from '../features/validation/validation.service';
import { Card, Icon } from './ui';

const STATUS: Record<CheckStatus, { icon: 'check' | 'warn' | 'x' | 'minus'; cls: string; label: string }> = {
  pass: { icon: 'check', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', label: 'Passed' },
  warn: { icon: 'warn', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', label: 'Warning' },
  fail: { icon: 'x', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', label: 'Failed' },
  skipped: { icon: 'minus', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800', label: 'Skipped' },
};

export function ValidationReport({ report, log }: { report: Report; log: string[] }) {
  return (
    <Card title="Verification" subtitle="The cleaned file was re-parsed and checked independently of the sanitizer.">
      <ul className="space-y-3">
        {report.checks.map((c) => {
          const s = STATUS[c.status];
          return (
            <li key={c.id} className="flex gap-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.cls}`}>
                <Icon name={s.icon} className="h-4 w-4" />
                <span className="sr-only">{s.label}:</span>
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.label}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{c.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {log.length > 0 && (
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">Processing log ({log.length})</summary>
          <ul className="mt-2 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-400">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
