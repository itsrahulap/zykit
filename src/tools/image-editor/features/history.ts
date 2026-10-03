// Undo/redo for the edit stack. Rapid changes with the same `group` (a slider being dragged)
// are merged into one step.

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  group: string | null;
  at: number;
}

export const MAX_HISTORY = 100;
export const GROUP_MS = 700;

export const createHistory = <T>(present: T): History<T> => ({ past: [], present, future: [], group: null, at: 0 });

export function pushState<T>(h: History<T>, next: T, group: string | null = null, now = Date.now()): History<T> {
  if (Object.is(next, h.present)) return h;
  if (group && h.group === group && now - h.at < GROUP_MS) return { ...h, present: next, future: [], at: now };
  return { past: [...h.past, h.present].slice(-MAX_HISTORY), present: next, future: [], group, at: now };
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future], group: null, at: 0 };
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), group: null, at: 0 };
}
