// Cron expression parser, plain-English describer and next-run calculator. Pure logic, no dependencies.
//
// Supports the standard 5 fields (minute hour day-of-month month day-of-week), an optional leading
// seconds field (6 fields, as in Quartz/Spring), names (JAN-DEC, SUN-SAT), lists, ranges, steps,
// Quartz-style `?`, `L`, `L-n`, `LW`, `nW` (day-of-month), `nL` and `n#k` (day-of-week) and the
// @yearly/@monthly/@weekly/@daily/@hourly/@reboot macros.
//
// Day-of-week numbers follow standard cron (0 or 7 = Sunday), not Quartz (1 = Sunday).

export type FieldName = 'second' | 'minute' | 'hour' | 'dom' | 'month' | 'dow';

export interface FieldDef {
  name: FieldName;
  label: string;
  min: number;
  max: number;
  /** Three-letter names, index 0 = `min` (months) or 0 = Sunday (days). */
  names?: string[];
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FIELD_DEFS: Record<FieldName, FieldDef> = {
  second: { name: 'second', label: 'Second', min: 0, max: 59 },
  minute: { name: 'minute', label: 'Minute', min: 0, max: 59 },
  hour: { name: 'hour', label: 'Hour', min: 0, max: 23 },
  dom: { name: 'dom', label: 'Day of month', min: 1, max: 31 },
  month: { name: 'month', label: 'Month', min: 1, max: 12, names: MONTH_NAMES.map((m) => m.slice(0, 3).toUpperCase()) },
  dow: { name: 'dow', label: 'Day of week', min: 0, max: 7, names: DAY_NAMES.map((d) => d.slice(0, 3).toUpperCase()) },
};

export const FIELD_ORDER_5: FieldName[] = ['minute', 'hour', 'dom', 'month', 'dow'];
export const FIELD_ORDER_6: FieldName[] = ['second', ...FIELD_ORDER_5];

export type Item =
  | { kind: 'any' }
  | { kind: 'value'; value: number }
  /** `a-b`, `a-b/s`, `*\/s` (star) or `a/s` (open: runs to the field maximum). */
  | { kind: 'range'; from: number; to: number; step: number; star?: boolean; open?: boolean }
  | { kind: 'lastDay'; offset: number }
  | { kind: 'lastWeekday' }
  | { kind: 'nearestWeekday'; day: number }
  | { kind: 'lastDow'; dow: number }
  | { kind: 'nthDow'; dow: number; nth: number };

export interface Field {
  text: string;
  items: Item[];
  /** `*` or `?`: no restriction. */
  any: boolean;
  /** values[v] is true when a numeric item matches v (day-of-week normalised to 0–6). */
  values: boolean[];
}

export interface Cron {
  hasSeconds: boolean;
  fields: Record<FieldName, Field>;
  /** The macro used (e.g. "@daily"), if any. */
  macro?: string;
  /** Normalised expression (macros expanded). */
  expression: string;
}

export interface FieldError {
  field: FieldName | 'expression';
  message: string;
}

export type ParseResult = { ok: true; cron: Cron } | { ok: true; reboot: true; macro: '@reboot' } | { ok: false; errors: FieldError[] };

export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

function parseNumber(s: string, def: FieldDef): number | string {
  const up = s.toUpperCase();
  let n: number;
  if (/^\d+$/.test(s)) n = Number(s);
  else if (def.names && def.names.includes(up)) n = def.names.indexOf(up) + (def.name === 'month' ? 1 : 0);
  else if (def.names) return `"${s}" isn't a number or a ${def.name === 'month' ? 'month name (JAN–DEC)' : 'day name (SUN–SAT)'}`;
  else return `"${s}" isn't a number`;
  if (n < def.min || n > def.max) return `${n} is out of range (${def.min}–${def.max})`;
  return n;
}

function parseItem(raw: string, def: FieldDef): Item | string {
  const s = raw.trim();
  if (s === '') return 'Empty list item';
  if (s === '*') return { kind: 'any' };
  if (s === '?') return def.name === 'dom' || def.name === 'dow' ? { kind: 'any' } : '? is only allowed in day-of-month and day-of-week';

  if (def.name === 'dom') {
    const up = s.toUpperCase();
    if (up === 'L') return { kind: 'lastDay', offset: 0 };
    if (up === 'LW') return { kind: 'lastWeekday' };
    const lm = /^L-(\d+)$/i.exec(s);
    if (lm) {
      const n = Number(lm[1]);
      return n >= 1 && n <= 30 ? { kind: 'lastDay', offset: n } : `L-${n}: the offset must be 1–30`;
    }
    const wm = /^(\d+)W$/i.exec(s);
    if (wm) {
      const n = Number(wm[1]);
      return n >= 1 && n <= 31 ? { kind: 'nearestWeekday', day: n } : `${n}W: the day must be 1–31`;
    }
  }
  if (def.name === 'dow') {
    if (s.toUpperCase() === 'L') return 'L alone in day-of-week is not supported; use 6 or SAT for Saturday';
    const lm = /^(\w+?)L$/i.exec(s);
    if (lm) {
      const n = parseNumber(lm[1], def);
      return typeof n === 'string' ? n : { kind: 'lastDow', dow: n % 7 };
    }
    const hm = /^(\w+)#(\d+)$/.exec(s);
    if (hm) {
      const n = parseNumber(hm[1], def);
      if (typeof n === 'string') return n;
      const nth = Number(hm[2]);
      return nth >= 1 && nth <= 5 ? { kind: 'nthDow', dow: n % 7, nth } : `#${nth}: the week number must be 1–5`;
    }
  }
  if (/[LW#]/i.test(s) && !(def.names && /^[A-Z]{3}/i.test(s))) {
    return def.name === 'dom' || def.name === 'dow' ? `"${s}" isn't a valid ${def.label.toLowerCase()} value` : `L, W and # are only allowed in the day fields`;
  }

  const m = /^([^-/]+)(?:-([^/]+))?(?:\/(.*))?$/.exec(s);
  if (!m) return `"${s}" isn't valid`;
  const [, a, b, stepText] = m;
  let step = 1;
  if (stepText !== undefined) {
    if (!/^\d+$/.test(stepText)) return `Step "${stepText}" must be a whole number`;
    step = Number(stepText);
    const span = def.max - def.min + 1;
    if (step < 1 || step > span) return `Step ${step} must be 1–${span}`;
  }
  if (a === '*') {
    if (b !== undefined) return `"${s}" isn't valid`;
    if (stepText === undefined) return { kind: 'any' };
    return { kind: 'range', from: def.min, to: def.name === 'dow' ? 6 : def.max, step, star: true };
  }
  const from = parseNumber(a, def);
  if (typeof from === 'string') return from;
  if (b === undefined) {
    if (stepText === undefined) return { kind: 'value', value: from };
    return { kind: 'range', from, to: def.name === 'dow' ? 6 : def.max, step, open: true };
  }
  const to = parseNumber(b, def);
  if (typeof to === 'string') return to;
  if (from > to) return `Range ${a}-${b} goes backwards`;
  return { kind: 'range', from, to, step };
}

export function parseField(text: string, def: FieldDef): { ok: true; field: Field } | { ok: false; error: string } {
  const items: Item[] = [];
  for (const part of text.split(',')) {
    const it = parseItem(part, def);
    if (typeof it === 'string') return { ok: false, error: it };
    items.push(it);
  }
  const values = new Array<boolean>(def.max + 1).fill(false);
  const set = (v: number) => {
    values[def.name === 'dow' ? v % 7 : v] = true;
  };
  for (const it of items) {
    if (it.kind === 'any') for (let v = def.min; v <= def.max; v++) set(v);
    else if (it.kind === 'value') set(it.value);
    else if (it.kind === 'range') for (let v = it.from; v <= it.to; v += it.step) set(v);
  }
  return { ok: true, field: { text, items, any: items.some((i) => i.kind === 'any'), values } };
}

export function parseCron(input: string): ParseResult {
  const expr = input.trim().replace(/\s+/g, ' ');
  if (!expr) return { ok: false, errors: [{ field: 'expression', message: 'Enter a cron expression.' }] };
  let macro: string | undefined;
  let body = expr;
  if (expr.startsWith('@')) {
    const key = expr.toLowerCase();
    if (key === '@reboot') return { ok: true, reboot: true, macro: '@reboot' };
    if (!MACROS[key]) return { ok: false, errors: [{ field: 'expression', message: `Unknown macro ${expr}. Use @yearly, @monthly, @weekly, @daily, @hourly or @reboot.` }] };
    macro = key;
    body = MACROS[key];
  }
  const parts = body.split(' ');
  if (parts.length === 7) return { ok: false, errors: [{ field: 'expression', message: 'A 7th (year) field is not supported. Use 5 fields, or 6 with seconds first.' }] };
  if (parts.length !== 5 && parts.length !== 6)
    return { ok: false, errors: [{ field: 'expression', message: `Expected 5 fields (or 6 with seconds first), got ${parts.length}.` }] };
  const hasSeconds = parts.length === 6;
  const order = hasSeconds ? FIELD_ORDER_6 : FIELD_ORDER_5;
  const errors: FieldError[] = [];
  const fields = {} as Record<FieldName, Field>;
  order.forEach((name, i) => {
    const r = parseField(parts[i], FIELD_DEFS[name]);
    if (r.ok) fields[name] = r.field;
    else errors.push({ field: name, message: r.error });
  });
  if (errors.length) return { ok: false, errors };
  if (!hasSeconds) fields.second = (parseField('0', FIELD_DEFS.second) as { ok: true; field: Field }).field;
  return { ok: true, cron: { hasSeconds, fields, macro, expression: body } };
}

// ---------- Description ----------

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

const NTH_WORDS = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
const pad = (n: number) => String(n).padStart(2, '0');
const isSingle = (f: Field) => f.items.length === 1 && f.items[0].kind === 'value';
const single = (f: Field) => (f.items[0] as { value: number }).value;

/** "every 15 minutes", "minutes 0 and 30", "every minute from 9 through 17". */
function timePhrase(f: Field, unit: string, max: number): string {
  if (f.any) return `every ${unit}`;
  const values = f.items.filter((i) => i.kind === 'value').map((i) => String((i as { value: number }).value));
  const parts: string[] = [];
  if (values.length) parts.push(values.length === 1 ? `${unit} ${values[0]}` : `${unit}s ${list(values)}`);
  for (const it of f.items) {
    if (it.kind !== 'range') continue;
    const every = it.step === 1 ? `every ${unit}` : `every ${it.step} ${unit}s`;
    parts.push(it.star ? every : `${every} from ${it.from} through ${it.open ? max : it.to}`);
  }
  return list(parts);
}

function domPhrase(f: Field): string {
  const values = f.items.filter((i) => i.kind === 'value').map((i) => String((i as { value: number }).value));
  const parts: string[] = [];
  if (values.length) parts.push(`day-of-month ${list(values)}`);
  for (const it of f.items) {
    if (it.kind === 'range') {
      if (it.step === 1) parts.push(`day-of-month ${it.from} through ${it.to}`);
      else parts.push(`every ${ordinal(it.step)} day-of-month${it.star ? '' : ` from ${it.from} through ${it.to}`}`);
    } else if (it.kind === 'lastDay') parts.push(it.offset ? `${it.offset} day${it.offset > 1 ? 's' : ''} before the last day of the month` : 'the last day of the month');
    else if (it.kind === 'lastWeekday') parts.push('the last weekday of the month');
    else if (it.kind === 'nearestWeekday') parts.push(`the weekday nearest day ${it.day} of the month`);
  }
  return `on ${list(parts)}`;
}

function dowPhrase(f: Field): string {
  const parts: string[] = [];
  const values = f.items.filter((i) => i.kind === 'value').map((i) => DAY_NAMES[(i as { value: number }).value % 7]);
  if (values.length) parts.push(list(values));
  for (const it of f.items) {
    if (it.kind === 'range') {
      if (it.step === 1) parts.push(`${DAY_NAMES[it.from % 7]} through ${DAY_NAMES[it.to % 7]}`);
      else parts.push(`every ${ordinal(it.step)} day-of-week${it.star ? '' : ` from ${DAY_NAMES[it.from % 7]} through ${DAY_NAMES[it.to % 7]}`}`);
    } else if (it.kind === 'lastDow') parts.push(`the last ${DAY_NAMES[it.dow]} of the month`);
    else if (it.kind === 'nthDow') parts.push(`the ${NTH_WORDS[it.nth]} ${DAY_NAMES[it.dow]} of the month`);
  }
  return `on ${list(parts)}`;
}

function monthPhrase(f: Field): string {
  const parts: string[] = [];
  const values = f.items.filter((i) => i.kind === 'value').map((i) => MONTH_NAMES[(i as { value: number }).value - 1]);
  if (values.length) parts.push(list(values));
  for (const it of f.items) {
    if (it.kind !== 'range') continue;
    if (it.step === 1) parts.push(`${MONTH_NAMES[it.from - 1]} through ${MONTH_NAMES[it.to - 1]}`);
    else parts.push(`every ${it.step} months${it.star ? '' : ` from ${MONTH_NAMES[it.from - 1]} through ${MONTH_NAMES[it.to - 1]}`}`);
  }
  return `in ${list(parts)}`;
}

export function describeCron(cron: Cron): string {
  const { second, minute, hour, dom, month, dow } = cron.fields;
  const secSingle = isSingle(second);
  const showSec = cron.hasSeconds && !(secSingle && single(second) === 0);
  let time: string;
  const hourValuesOnly = !hour.any && hour.items.every((i) => i.kind === 'value');
  if (secSingle && isSingle(minute) && hourValuesOnly && hour.items.length <= 8) {
    const clock = (h: number) => `${pad(h)}:${pad(single(minute))}${showSec ? `:${pad(single(second))}` : ''}`;
    time = `At ${list(hour.items.map((i) => clock((i as { value: number }).value)))}`;
  } else {
    const pieces: string[] = [];
    if (showSec) pieces.push(timePhrase(second, 'second', 59));
    if (!(minute.any && pieces.length)) pieces.push(timePhrase(minute, 'minute', 59));
    if (!hour.any) pieces.push(timePhrase(hour, 'hour', 23));
    time = pieces.join(' past ');
    time = time.startsWith('every') ? `E${time.slice(1)}` : `At ${time}`;
  }
  const out = [time];
  if (!dom.any && !dow.any) out.push(`${domPhrase(dom)} or ${dowPhrase(dow)}`);
  else if (!dom.any) out.push(domPhrase(dom));
  else if (!dow.any) out.push(dowPhrase(dow));
  if (!month.any) out.push(monthPhrase(month));
  return out.join(' ');
}

// ---------- Matching ----------

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
const weekday = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

function domMatches(f: Field, y: number, m: number, d: number): boolean {
  if (f.values[d]) return true;
  const last = daysInMonth(y, m);
  for (const it of f.items) {
    if (it.kind === 'lastDay' && d === last - it.offset) return true;
    if (it.kind === 'lastWeekday') {
      const wd = weekday(y, m, last);
      if (d === last - (wd === 6 ? 1 : wd === 0 ? 2 : 0)) return true;
    }
    if (it.kind === 'nearestWeekday' && it.day <= last) {
      const wd = weekday(y, m, it.day);
      let t = it.day;
      if (wd === 6) t = it.day === 1 ? 3 : it.day - 1;
      else if (wd === 0) t = it.day === last ? it.day - 2 : it.day + 1;
      if (d === t) return true;
    }
  }
  return false;
}

function dowMatches(f: Field, y: number, m: number, d: number): boolean {
  const wd = weekday(y, m, d);
  if (f.values[wd]) return true;
  for (const it of f.items) {
    if (it.kind === 'lastDow' && it.dow === wd && d + 7 > daysInMonth(y, m)) return true;
    if (it.kind === 'nthDow' && it.dow === wd && Math.ceil(d / 7) === it.nth) return true;
  }
  return false;
}

/** Classic cron: when both day fields are restricted, a day matches if EITHER matches. */
export function dayMatches(cron: Cron, y: number, m: number, d: number): boolean {
  const { dom, dow } = cron.fields;
  if (dom.any && dow.any) return true;
  if (dom.any) return dowMatches(dow, y, m, d);
  if (dow.any) return domMatches(dom, y, m, d);
  return domMatches(dom, y, m, d) || dowMatches(dow, y, m, d);
}

// ---------- Time zones ----------

const formatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(tz, f);
  }
  return f;
}

export interface Wall {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

export function wallTime(t: number, tz: string): Wall {
  const p: Record<string, number> = {};
  for (const part of partsFormatter(tz).formatToParts(new Date(t))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour % 24, mi: p.minute, s: p.second };
}

/** Offset (ms) of `tz` at instant `t`: wall clock minus UTC. */
function offsetAt(t: number, tz: string): number {
  const w = wallTime(t, tz);
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - Math.floor(t / 1000) * 1000;
}

/** The first instant whose wall clock in `tz` is the given time, or null if it falls in a DST gap. */
export function resolveWall(w: Wall, tz: string): number | null {
  const guess = Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s);
  const offsets = new Set([offsetAt(guess - 86_400_000, tz), offsetAt(guess, tz), offsetAt(guess + 86_400_000, tz)]);
  let best: number | null = null;
  for (const o of offsets) {
    const c = guess - o;
    if (offsetAt(c, tz) === o && (best === null || c < best)) best = c;
  }
  return best;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface NextRuns {
  runs: Date[];
  /** False when fewer than `count` runs were found within the search window. */
  complete: boolean;
}

const sortedValues = (f: Field, min: number, max: number) => {
  const out: number[] = [];
  for (let v = min; v <= max; v++) if (f.values[v]) out.push(v);
  return out;
};

/**
 * Next `count` run times strictly after `from`, evaluated on the wall clock of `tz`.
 * Wall times skipped by a DST jump don't run; wall times repeated when clocks go back run once (the first time).
 */
export function nextRuns(cron: Cron, from: Date, tz: string, count = 10, years = 8): NextRuns {
  const runs: Date[] = [];
  const start = from.getTime();
  const fw = wallTime(start, tz);
  const fromWallSecs = Date.UTC(fw.y, fw.m - 1, fw.d, fw.h, fw.mi, fw.s) / 1000;
  const secs = sortedValues(cron.fields.second, 0, 59);
  const mins = sortedValues(cron.fields.minute, 0, 59);
  const hours = sortedValues(cron.fields.hour, 0, 23);
  const days = years * 366;
  for (let off = -1; off <= days; off++) {
    const day = new Date(Date.UTC(fw.y, fw.m - 1, fw.d + off));
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    if (!cron.fields.month.values[m] || !dayMatches(cron, y, m, d)) continue;
    const dayStart = day.getTime() / 1000;
    for (const h of hours) {
      // Wall times before `from`'s wall time can't come later (the first-occurrence mapping is monotonic),
      // so skip them without the (slow) time-zone lookups.
      if (dayStart + h * 3600 + 3599 < fromWallSecs) continue;
      for (const mi of mins) {
        for (const s of secs) {
          if (dayStart + h * 3600 + mi * 60 + s < fromWallSecs) continue;
          const t = resolveWall({ y, m, d, h, mi, s }, tz);
          if (t === null || t <= start) continue;
          runs.push(new Date(t));
          if (runs.length >= count) return { runs, complete: true };
        }
      }
    }
  }
  return { runs, complete: false };
}

const displayFormatters = new Map<string, Intl.DateTimeFormat>();
/** "Mon 2026-09-28 09:30 GMT+2" in `tz`. */
export function formatRun(date: Date, tz: string, withSeconds: boolean): string {
  let f = displayFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
    displayFormatters.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(date)) p[part.type] = part.value;
  const hh = String(Number(p.hour) % 24).padStart(2, '0');
  return `${p.weekday} ${p.year}-${p.month}-${p.day} ${hh}:${p.minute}${withSeconds ? `:${p.second}` : ''} ${p.timeZoneName}`;
}

// ---------- Visual builder ----------

export type BuilderMode = 'every' | 'specific' | 'range' | 'step' | 'custom';
export interface BuilderState {
  mode: BuilderMode;
  values: number[];
  from: number;
  to: number;
  start: number;
  step: number;
}

/** Reads a field's text into the visual builder's state ("custom" for anything it can't show). */
export function fieldToBuilder(text: string, def: FieldDef): BuilderState {
  const base: BuilderState = { mode: 'custom', values: [], from: def.min, to: def.name === 'dow' ? 6 : def.max, start: def.min, step: 1 };
  const r = parseField(text, def);
  if (!r.ok) return base;
  const items = r.field.items;
  if (items.length === 1 && items[0].kind === 'any') return { ...base, mode: 'every' };
  if (items.every((i) => i.kind === 'value')) {
    const vals = [...new Set(items.map((i) => (i as { value: number }).value % (def.name === 'dow' ? 7 : 1000)))].sort((a, b) => a - b);
    return { ...base, mode: 'specific', values: vals };
  }
  if (items.length === 1 && items[0].kind === 'range') {
    const it = items[0];
    if (it.step === 1 && !it.star && !it.open) return { ...base, mode: 'range', from: it.from, to: it.to };
    if (it.star || it.open) return { ...base, mode: 'step', start: it.from, step: it.step };
  }
  return base;
}

export function builderToField(state: BuilderState, def: FieldDef): string {
  switch (state.mode) {
    case 'every':
      return '*';
    case 'specific':
      return state.values.length ? state.values.join(',') : '*';
    case 'range':
      return `${Math.min(state.from, state.to)}-${Math.max(state.from, state.to)}`;
    case 'step':
      return state.start === def.min ? `*/${state.step}` : `${state.start}/${state.step}`;
    default:
      return '*';
  }
}

/** Replaces one field of an expression (macros are expanded first). */
export function setField(expression: string, name: FieldName, value: string): string {
  let body = expression.trim().replace(/\s+/g, ' ');
  if (MACROS[body.toLowerCase()]) body = MACROS[body.toLowerCase()];
  const parts = body.split(' ');
  const order = parts.length === 6 ? FIELD_ORDER_6 : FIELD_ORDER_5;
  if (parts.length !== 5 && parts.length !== 6) return expression;
  const i = order.indexOf(name);
  if (i < 0) return expression;
  parts[i] = value;
  return parts.join(' ');
}

/** Field texts by name for a 5- or 6-field expression (macros expanded), or null. */
export function splitFields(expression: string): Partial<Record<FieldName, string>> | null {
  let body = expression.trim().replace(/\s+/g, ' ');
  if (MACROS[body.toLowerCase()]) body = MACROS[body.toLowerCase()];
  const parts = body.split(' ');
  if (parts.length !== 5 && parts.length !== 6) return null;
  const order = parts.length === 6 ? FIELD_ORDER_6 : FIELD_ORDER_5;
  return Object.fromEntries(order.map((n, i) => [n, parts[i]]));
}

export const PRESETS: { label: string; expression: string }[] = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every 15 minutes', expression: '*/15 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Every day at midnight', expression: '0 0 * * *' },
  { label: 'Weekdays at 09:30', expression: '30 9 * * 1-5' },
  { label: 'Every Sunday at 03:00', expression: '0 3 * * 0' },
  { label: 'First day of the month', expression: '0 0 1 * *' },
  { label: 'Last day of the month', expression: '0 0 L * *' },
  { label: 'Every quarter', expression: '0 0 1 */3 *' },
  { label: 'Every 30 seconds', expression: '*/30 * * * * *' },
];
