import type { ProvenanceSignal } from '../features/metadata/metadata.types';
import { Badge, Card, Icon } from './ui';

const LEVEL = {
  declared: { tone: 'amber', label: 'Declared in file' },
  present: { tone: 'blue', label: 'Present' },
  hint: { tone: 'neutral', label: 'Hint' },
} as const;

export function SignalsPanel({ signals }: { signals: ProvenanceSignal[] }) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Icon name="sparkle" className="h-4 w-4 text-violet-500" /> AI &amp; provenance metadata
        </span>
      }
      subtitle="What the file says about how it was made. These are labels, not a detection verdict."
    >
      {signals.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No AI or provenance-related metadata detected. Note that missing metadata doesn't tell you how an image was made.
        </p>
      ) : (
        <ul className="space-y-3">
          {signals.map((s, i) => (
            <li key={i} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={LEVEL[s.level].tone}>{LEVEL[s.level].label}</Badge>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.title}</span>
              </div>
              <p className="mt-1.5 break-words text-sm text-slate-600 dark:text-slate-400">{s.detail}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Removing metadata doesn't change how AI detectors score an image: they analyze the pixels, which CleanImage leaves untouched.
      </p>
    </Card>
  );
}
