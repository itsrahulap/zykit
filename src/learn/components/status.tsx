import type { ProgressStatus, TopicLevel } from '../types/content';
import { LEVEL_LABELS, PROGRESS_LABELS } from '../hooks/useLearnState';
import { Badge } from '../../shared/ui/ui';

const DOT: Record<ProgressStatus, string> = {
  'not-started': 'border border-slate-300 bg-transparent dark:border-slate-600',
  learning: 'bg-amber-400',
  completed: 'bg-emerald-600 dark:bg-emerald-400',
  'needs-review': 'bg-sky-500',
};

/** Small coloured dot with a screen-reader label (colour is never the only signal where it matters). */
export function StatusDot({ status, className = '' }: { status: ProgressStatus; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${DOT[status]}`} />
      <span className="sr-only">{PROGRESS_LABELS[status]}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const tone = ({ 'not-started': 'neutral', learning: 'amber', completed: 'green', 'needs-review': 'blue' } as const)[status];
  return <Badge tone={tone}>{PROGRESS_LABELS[status]}</Badge>;
}

export function LevelBadge({ level }: { level: TopicLevel }) {
  return <Badge tone={level === 'beginner' ? 'green' : level === 'intermediate' ? 'blue' : 'violet'}>{LEVEL_LABELS[level]}</Badge>;
}

export function DifficultyBadge({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  return <Badge tone={difficulty === 'Easy' ? 'green' : difficulty === 'Medium' ? 'amber' : 'red'}>{difficulty}</Badge>;
}
