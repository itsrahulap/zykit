// Log parsing and filtering: NDJSON / JSON Lines and plain text ("<ISO timestamp> LEVEL message").

export const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'other'] as const;
export type Level = (typeof LEVELS)[number];

export interface LogEntry {
  /** 0-based position among entries. */
  i: number;
  raw: string;
  /** Parsed JSON object for JSON lines, else null. */
  fields: Record<string, unknown> | null;
  level: Level;
  /** Epoch ms, or null when the line has no usable timestamp. */
  time: number | null;
  timeText: string;
  message: string;
}

const LEVEL_NAMES: Record<string, Level> = {
  trace: 'trace', debug: 'debug', dbg: 'debug', info: 'info', notice: 'info', warn: 'warn', warning: 'warn', error: 'error', err: 'error',
  fatal: 'fatal', critical: 'fatal', crit: 'fatal', panic: 'fatal',
};
const LEVEL_KEYS = ['level', 'lvl', 'severity', 'loglevel', 'log.level'];
const TIME_KEYS = ['time', 'timestamp', 'ts', '@timestamp', 't', 'datetime', 'date'];
const MSG_KEYS = ['msg', 'message', 'event', 'text'];
const NAMES = 'trace|debug|dbg|info|notice|warning|warn|error|err|fatal|critical|crit|panic';
const TEXT_LINE = new RegExp(`^(\\d{4}-\\d\\d-\\d\\d[T ]\\d\\d:\\d\\d:\\d\\d(?:[.,]\\d+)?(?:Z|[+-]\\d\\d:?\\d\\d)?)\\s*(?:[\\[(<]?(${NAMES})[\\])>]?:?(?:\\s+|$))?(.*)$`, 'i');
const LEVEL_FIRST = new RegExp(`^[\\[(<]?(${NAMES})[\\])>]?:?\\s+(.*)$`, 'i');

function levelOf(v: unknown): Level {
  if (typeof v === 'number') return v <= 10 ? 'trace' : v <= 20 ? 'debug' : v <= 30 ? 'info' : v <= 40 ? 'warn' : v <= 50 ? 'error' : 'fatal'; // pino numbers
  return typeof v === 'string' ? (LEVEL_NAMES[v.toLowerCase()] ?? 'other') : 'other';
}

export function parseTime(v: unknown): number | null {
  if (typeof v === 'number') return v > 1e12 ? v : v > 1e9 ? v * 1000 : null;
  if (typeof v !== 'string') return null;
  const t = Date.parse(v.replace(/^(\d{4}-\d\d-\d\d) /, '$1T').replace(/,(\d)/, '.$1'));
  return Number.isNaN(t) ? null : t;
}

const pick = (o: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined) return o[k];
  return undefined;
};

/** One line per entry; a text line with no timestamp or level joins the entry above it (stack traces). */
export function parseLog(text: string): LogEntry[] {
  const out: LogEntry[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim()) continue;
    const base = { i: out.length, raw: line, fields: null, level: 'other' as Level, time: null, timeText: '', message: line };
    if (line.trimStart().startsWith('{')) {
      try {
        const o = JSON.parse(line) as unknown;
        if (o && typeof o === 'object' && !Array.isArray(o)) {
          const f = o as Record<string, unknown>;
          const t = pick(f, TIME_KEYS);
          const m = pick(f, MSG_KEYS);
          out.push({ ...base, fields: f, level: levelOf(pick(f, LEVEL_KEYS)), time: parseTime(t), timeText: t === undefined ? '' : String(t), message: m === undefined ? '' : typeof m === 'string' ? m : JSON.stringify(m) });
          continue;
        }
      } catch {
        /* plain text that happens to start with "{" */
      }
    }
    const tm = TEXT_LINE.exec(line);
    if (tm) {
      out.push({ ...base, level: tm[2] ? (LEVEL_NAMES[tm[2].toLowerCase()] ?? 'other') : 'other', time: parseTime(tm[1]), timeText: tm[1], message: tm[3] });
      continue;
    }
    const lm = LEVEL_FIRST.exec(line);
    if (lm) {
      out.push({ ...base, level: LEVEL_NAMES[lm[1].toLowerCase()] ?? 'other', message: lm[2] });
      continue;
    }
    const prev = out[out.length - 1];
    if (prev && !prev.fields && /^\s/.test(line)) {
      prev.raw += `\n${line}`;
      prev.message += `\n${line}`;
    } else out.push(base);
  }
  return out;
}

/** Dotted paths to scalar values (nested objects to depth 3). */
export function flatten(o: Record<string, unknown>, prefix = '', depth = 0, into: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && depth < 3) flatten(v as Record<string, unknown>, `${prefix}${k}.`, depth + 1, into);
    else into[`${prefix}${k}`] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return into;
}

export interface FieldInfo {
  name: string;
  count: number;
}

export function detectFields(entries: LogEntry[], limit = 40): FieldInfo[] {
  const m = new Map<string, number>();
  for (const e of entries.slice(0, 5000)) if (e.fields) for (const k of Object.keys(flatten(e.fields))) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
}

export function levelCounts(entries: LogEntry[]): Record<Level, number> {
  const c = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>;
  for (const e of entries) c[e.level]++;
  return c;
}

export interface LogFilter {
  /** Empty means every level. */
  levels: Set<Level>;
  text: string;
  /** Space-separated `field=value` pairs, all of which must match (value case-insensitive). */
  fields: string;
  /** Epoch ms; entries without a timestamp are excluded when either is set. */
  from: number | null;
  to: number | null;
}

export const EMPTY_FILTER: LogFilter = { levels: new Set(), text: '', fields: '', from: null, to: null };

export function filterLog(entries: LogEntry[], f: LogFilter): number[] {
  const text = f.text.toLowerCase();
  const pairs = f.fields
    .split(/\s+/)
    .map((p) => p.split('='))
    .filter((p) => p.length >= 2 && p[0])
    .map(([k, ...v]) => [k, v.join('=').toLowerCase()] as const);
  const out: number[] = [];
  for (const e of entries) {
    if (f.levels.size && !f.levels.has(e.level)) continue;
    if (text && !e.raw.toLowerCase().includes(text)) continue;
    if ((f.from !== null || f.to !== null) && (e.time === null || (f.from !== null && e.time < f.from) || (f.to !== null && e.time > f.to))) continue;
    if (pairs.length) {
      if (!e.fields) continue;
      const flat = flatten(e.fields);
      if (!pairs.every(([k, v]) => flat[k]?.toLowerCase() === v)) continue;
    }
    out.push(e.i);
  }
  return out;
}

/** Filtered entries as NDJSON; plain-text lines become {time, level, message} objects. */
export function toNdjson(entries: LogEntry[], indices: number[]): string {
  return indices.map((i) => entries[i]).map((e) => (e.fields ? e.raw : JSON.stringify({ time: e.timeText || undefined, level: e.level, message: e.message }))).join('\n') + (indices.length ? '\n' : '');
}

export const prettyEntry = (e: LogEntry) => (e.fields ? JSON.stringify(e.fields, null, 2) : e.raw);
