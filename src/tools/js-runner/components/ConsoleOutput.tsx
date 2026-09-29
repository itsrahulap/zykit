import { Icon, type IconName } from '../../../shared/ui/ui';
import { formatTime, LEVEL_LABELS, type ConsoleEntry, type EntryLevel } from '../features/transcript';

const LEVELS: Record<EntryLevel, { icon: IconName | null; row: string; tag: string }> = {
  log: { icon: null, row: 'text-slate-800 dark:text-slate-200', tag: '' },
  debug: { icon: 'code', row: 'text-slate-500 dark:text-slate-400', tag: 'text-slate-500 dark:text-slate-400' },
  info: {
    icon: 'info',
    row: 'bg-sky-50/70 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100',
    tag: 'text-sky-700 dark:text-sky-300',
  },
  warn: {
    icon: 'warn',
    row: 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100',
    tag: 'text-amber-700 dark:text-amber-300',
  },
  error: {
    icon: 'x',
    row: 'bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100',
    tag: 'text-red-700 dark:text-red-300',
  },
  system: {
    icon: 'stop',
    row: 'italic text-slate-600 dark:text-slate-400',
    tag: 'text-slate-500 dark:text-slate-400',
  },
};

// Group nesting as static classes (Tailwind can't see computed class names).
const INDENT = ['pl-4', 'pl-9', 'pl-14', 'pl-19', 'pl-24', 'pl-29', 'pl-34'];

export function ConsoleOutput({ entries, timestamps }: { entries: ConsoleEntry[]; timestamps: boolean }) {
  if (entries.length === 0) {
    return <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Console output appears here when you run your code.</p>;
  }
  return (
    <ol className="divide-y divide-slate-100 font-mono text-[13px] leading-relaxed dark:divide-slate-800/70">
      {entries.map((e) => {
        const s = LEVELS[e.level];
        return (
          <li key={e.id} className={`flex gap-2 py-1.5 pr-4 ${INDENT[Math.min(e.depth, INDENT.length - 1)]} ${s.row}`}>
            {s.icon ? (
              <span className={`mt-0.5 flex shrink-0 items-center gap-1 text-xs font-sans font-semibold not-italic uppercase tracking-wide ${s.tag}`}>
                <Icon name={s.icon} className="h-3.5 w-3.5" />
                <span className={e.level === 'system' ? 'sr-only' : ''}>{LEVEL_LABELS[e.level]}</span>
              </span>
            ) : (
              <span className="sr-only">log:</span>
            )}
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{e.text}</span>
            {timestamps && e.at !== undefined && (
              <span className="shrink-0 font-sans text-xs tabular-nums text-slate-400 dark:text-slate-500">{formatTime(e.at)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
