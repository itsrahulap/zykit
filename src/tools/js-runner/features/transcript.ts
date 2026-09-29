// Plain-text helpers for the console panel.

export type EntryLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'system';

export interface ConsoleEntry {
  id: number;
  level: EntryLevel;
  text: string;
  /** console.group nesting depth. */
  depth: number;
  /** ms since the run started (worker clock); undefined for system notes. */
  at?: number;
}

export const LEVEL_LABELS: Record<EntryLevel, string> = {
  log: 'log',
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
  system: 'note',
};

export function formatTime(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

/** Plain-text transcript for the copy button: non-log entries get a "[level]" tag, groups are indented. */
export function entriesToText(entries: ConsoleEntry[]): string {
  return entries
    .map((e) => {
      const pad = '  '.repeat(e.depth);
      const tag = e.level === 'log' ? '' : `[${LEVEL_LABELS[e.level]}] `;
      return pad + tag + e.text.replace(/\n/g, '\n' + pad);
    })
    .join('\n');
}
