import type { Report } from '../features/jsonld';
import { Icon } from '../../../shared/ui/ui';

function Block({ title, items, tone, icon }: { title: string; items: string[]; tone: string; icon: 'x' | 'warn' | 'info' }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className={`mb-1 text-sm font-semibold ${tone}`}>
        {title} ({items.length})
      </h4>
      <ul className="space-y-1">
        {items.map((m, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Icon name={icon} className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
            <span className="min-w-0 break-words">{m}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportView({ r }: { r: Report }) {
  const clean = !r.missingRequired.length && !r.invalid.length;
  return (
    <div className="space-y-3">
      <Block title="Missing required" items={r.missingRequired} tone="text-red-700 dark:text-red-400" icon="x" />
      <Block title="Invalid values" items={r.invalid} tone="text-red-700 dark:text-red-400" icon="x" />
      <Block title="Missing recommended" items={r.missingRecommended} tone="text-amber-700 dark:text-amber-400" icon="warn" />
      {clean && !r.missingRecommended.length && (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <Icon name="check" className="h-4 w-4" /> All required and recommended properties are present.
        </p>
      )}
      {clean && r.missingRecommended.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <Icon name="check" className="h-4 w-4" /> All required properties are present.
        </p>
      )}
    </div>
  );
}
