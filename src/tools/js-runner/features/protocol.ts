// Messages the worker runtime posts to the page, and limits shared by both sides.

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type WorkerMessage =
  /** One console entry. `t` is ms since the run started, `depth` the console.group nesting. */
  | { t: 'log'; level: LogLevel; text: string; depth: number; at: number }
  | { t: 'clear' }
  /** The main (top-level async) body settled. Timers it started may still be pending. */
  | { t: 'done'; ok: boolean; ms: number }
  /** Main body settled and no timers or fetches are pending: the run is over. */
  | { t: 'idle' }
  /** Output caps were reached; further output is dropped. */
  | { t: 'truncated' };

export interface RuntimeOptions {
  maxEntries: number;
  maxChars: number;
  /** Quiet period after the last timer before the run counts as finished. */
  idleGraceMs: number;
}

export const DEFAULT_RUNTIME_OPTIONS: RuntimeOptions = {
  maxEntries: 2000,
  maxChars: 1_000_000,
  idleGraceMs: 30,
};
