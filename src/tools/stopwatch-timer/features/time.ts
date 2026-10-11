// Pure time math for Stopwatch & Timer: no DOM, so it's unit-testable in Node.
// Everything is computed from timestamps (performance.now), never by counting ticks, so a
// throttled background tab shows the right time as soon as it wakes up.

export const MAX_TIMER_MS = (99 * 3600 + 59 * 60 + 59) * 1000;

export const clampInt = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min);
const pad = (n: number) => String(n).padStart(2, '0');

/** Time elapsed: what was banked before plus the current run (if running). */
export function elapsedMs(banked: number, startedAt: number | null, now: number): number {
  return banked + (startedAt === null ? 0 : Math.max(0, now - startedAt));
}

/** "MM:SS.cc", or "H:MM:SS.cc" from one hour. Centiseconds are truncated, like a real stopwatch. */
export function formatStopwatch(ms: number, centis = true): string {
  const cs = Math.floor(Math.max(0, ms) / 10);
  const h = Math.floor(cs / 360000);
  const m = Math.floor(cs / 6000) % 60;
  const s = Math.floor(cs / 100) % 60;
  const base = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return centis ? `${base}.${pad(cs % 100)}` : base;
}

/** Countdown text, rounded up so it shows 00:01 until the last instant and 00:00 only when done. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor(total / 60) % 60;
  return `${h > 0 ? `${h}:${pad(m)}` : pad(m)}:${pad(total % 60)}`;
}

export function hmsToMs(h: number, m: number, s: number): number {
  return Math.min(MAX_TIMER_MS, (clampInt(h, 0, 99) * 3600 + clampInt(m, 0, 59 * 60) * 60 + clampInt(s, 0, 59 * 3600)) * 1000);
}

export function msToHms(ms: number): { h: number; m: number; s: number } {
  const t = Math.round(ms / 1000);
  return { h: Math.floor(t / 3600), m: Math.floor(t / 60) % 60, s: t % 60 };
}

export interface Lap {
  n: number;
  /** Time since the previous lap. */
  lap: number;
  /** Total time at this lap. */
  split: number;
}

export function addLap(laps: Lap[], total: number): Lap[] {
  const prev = laps.length ? laps[laps.length - 1].split : 0;
  return [...laps, { n: laps.length + 1, lap: Math.max(0, total - prev), split: total }];
}

/** Lap numbers of the fastest and slowest laps; null until there are two laps to compare. */
export function lapExtremes(laps: Lap[]): { fastest: number | null; slowest: number | null } {
  if (laps.length < 2) return { fastest: null, slowest: null };
  let fastest = laps[0];
  let slowest = laps[0];
  for (const l of laps) {
    if (l.lap < fastest.lap) fastest = l;
    if (l.lap > slowest.lap) slowest = l;
  }
  return { fastest: fastest.n, slowest: slowest.n };
}

export function lapsToText(laps: Lap[]): string {
  return ['Lap\tLap time\tSplit', ...laps.map((l) => `${l.n}\t${formatStopwatch(l.lap)}\t${formatStopwatch(l.split)}`)].join('\n');
}

export type Phase = 'work' | 'short' | 'long';

export const PHASE_LABEL: Record<Phase, string> = { work: 'Focus', short: 'Short break', long: 'Long break' };

/** After `phase` ends: a finished work session leads to a long break every `cycles` sessions, otherwise a short one. */
export function nextPhase(phase: Phase, sessions: number, cycles: number): { phase: Phase; sessions: number } {
  if (phase !== 'work') return { phase: 'work', sessions };
  const done = sessions + 1;
  return { phase: done % Math.max(1, cycles) === 0 ? 'long' : 'short', sessions: done };
}
