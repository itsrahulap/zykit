// Date arithmetic in an IANA time zone: calendar differences, adding durations with month-end
// clamping, and business days with configurable weekends and holidays. Wall-clock conversion
// (and so DST handling) reuses the Timestamp Converter's Intl-based helpers.

import { civilIn, civilToMs } from '../../timestamp-converter/features/timestamp';

const DAY_MS = 86_400_000;

export interface Civil {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The civil fields as if they were UTC (for wall-clock arithmetic). */
function wallMs(c: Civil): number {
  const d = new Date(0);
  d.setUTCFullYear(c.year, c.month - 1, c.day);
  d.setUTCHours(c.hour, c.minute, c.second, 0);
  return d.getTime();
}

function fromWallMs(ms: number): Civil {
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() };
}

export function civilString(c: Civil): string {
  return `${pad(c.year, 4)}-${pad(c.month)}-${pad(c.day)}T${pad(c.hour)}:${pad(c.minute)}:${pad(c.second)}`;
}

/** Adds whole months, clamping the day to the target month's length (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(c: Civil, months: number): { civil: Civil; clampedFrom: number | null } {
  const idx = c.year * 12 + (c.month - 1) + months;
  const year = Math.floor(idx / 12);
  const month = idx - year * 12 + 1;
  const dim = daysInMonth(year, month);
  const day = Math.min(c.day, dim);
  return { civil: { ...c, year, month, day }, clampedFrom: day !== c.day ? c.day : null };
}

export interface Difference {
  sign: 1 | -1;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Exact elapsed time. */
  totalMs: number;
  /** Elapsed wall-clock time minus exact time, in minutes (non-zero across a DST change). */
  dstShiftMinutes: number;
}

/** Calendar difference between two instants as seen on the wall clock in `timeZone`. */
export function difference(startMs: number, endMs: number, timeZone: string): Difference {
  const sign = endMs < startMs ? -1 : 1;
  const [a, b] = sign === 1 ? [startMs, endMs] : [endMs, startMs];
  const ca = civilIn(a, timeZone);
  const cb = civilIn(b, timeZone);
  const wb = wallMs(cb);
  let months = (cb.year - ca.year) * 12 + (cb.month - ca.month);
  let anchor = addMonths(ca, months).civil;
  if (wallMs(anchor) > wb) anchor = addMonths(ca, --months).civil;
  let rem = Math.max(0, wb - wallMs(anchor));
  const days = Math.floor(rem / DAY_MS);
  rem -= days * DAY_MS;
  const hours = Math.floor(rem / 3_600_000);
  rem -= hours * 3_600_000;
  const minutes = Math.floor(rem / 60_000);
  rem -= minutes * 60_000;
  const totalMs = b - a;
  const wallDiff = wb - wallMs(ca) + (((b % 1000) + 1000) % 1000) - (((a % 1000) + 1000) % 1000);
  return {
    sign,
    years: Math.floor(months / 12),
    months: months % 12,
    days,
    hours,
    minutes,
    seconds: Math.floor(rem / 1000),
    totalMs: sign * totalMs,
    dstShiftMinutes: Math.round((wallDiff - totalMs) / 60_000),
  };
}

export function describeDifference(d: Difference): string {
  const parts: string[] = [];
  const add = (n: number, unit: string) => n && parts.push(`${n.toLocaleString('en-US')} ${unit}${n === 1 ? '' : 's'}`);
  add(d.years, 'year');
  add(d.months, 'month');
  add(d.days, 'day');
  add(d.hours, 'hour');
  add(d.minutes, 'minute');
  add(d.seconds, 'second');
  if (!parts.length) return 'The same moment';
  const text = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return d.sign < 0 ? `${text} earlier` : text;
}

export interface Duration {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const ZERO_DURATION: Duration = { years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

export type AddResult =
  | {
      ok: true;
      ms: number;
      /** Set when the day was clamped to the end of a shorter month. */
      clamp: { from: number; to: number; month: string } | null;
      /** Set when the wall time fell in a DST gap and moved forward. */
      gapShiftMinutes: number;
    }
  | { ok: false; error: string };

/**
 * Adds (sign 1) or subtracts (sign -1) a duration. Like Temporal: years and months move the
 * calendar date (clamping the day), weeks and days move whole wall-clock days (so 1 day across a
 * DST change is still "same time tomorrow"), and hours/minutes/seconds are exact elapsed time.
 */
export function addDuration(startMs: number, timeZone: string, dur: Duration, sign: 1 | -1): AddResult {
  const values = Object.values(dur);
  if (values.some((v) => !Number.isFinite(v) || !Number.isInteger(v))) return { ok: false, error: 'Use whole numbers for every unit.' };
  const start = civilIn(startMs, timeZone);
  const { civil: afterMonths, clampedFrom } = addMonths(start, sign * (dur.years * 12 + dur.months));
  const wall = fromWallMs(wallMs(afterMonths) + sign * (dur.weeks * 7 + dur.days) * DAY_MS);
  if (wall.year < 1 || wall.year > 9999) return { ok: false, error: 'The result is outside the years 1–9999.' };
  const conv = civilToMs(civilString(wall), timeZone);
  if (!conv.ok) return { ok: false, error: conv.error };
  const ms = conv.ms + (((startMs % 1000) + 1000) % 1000) + sign * (dur.hours * 3600 + dur.minutes * 60 + dur.seconds) * 1000;
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return { ok: false, error: 'The result is out of range.' };
  const back = civilIn(conv.ms, timeZone);
  const gapShiftMinutes = Math.round((wallMs(back) - wallMs(wall)) / 60_000);
  return {
    ok: true,
    ms,
    clamp: clampedFrom !== null ? { from: clampedFrom, to: afterMonths.day, month: `${MONTH_NAMES[afterMonths.month - 1]} ${afterMonths.year}` } : null,
    gapShiftMinutes,
  };
}

// ---- Date-only arithmetic (business days) ---------------------------------------------------

/** Days since 1970-01-01 for a YYYY-MM-DD string, or null if it's not a real date. */
export function parseDay(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return Math.round(t / DAY_MS);
}

export function formatDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export const weekday = (day: number) => new Date(day * DAY_MS).getUTCDay();

export type WeekendPreset = 'sat-sun' | 'fri-sat' | 'sun' | 'none';
export const WEEKENDS: Record<WeekendPreset, { label: string; days: number[] }> = {
  'sat-sun': { label: 'Sat–Sun', days: [6, 0] },
  'fri-sat': { label: 'Fri–Sat', days: [5, 6] },
  sun: { label: 'Sun only', days: [0] },
  none: { label: 'None', days: [] },
};

export interface HolidayList {
  days: Set<number>;
  invalid: string[];
}

/** Reads dates (YYYY-MM-DD), one per line or comma-separated; text after a date is a label. */
export function parseHolidays(text: string): HolidayList {
  const days = new Set<number>();
  const invalid: string[] = [];
  for (const raw of text.split(/[\n,;]/)) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    const m = /^(\d{4}-\d{2}-\d{2})(?:\s|$)/.exec(t);
    const d = m ? parseDay(m[1]) : null;
    if (d === null) invalid.push(t);
    else days.add(d);
  }
  return { days, invalid };
}

export interface BusinessOptions {
  weekend: number[];
  holidays: Set<number>;
}

const isWorkday = (day: number, o: BusinessOptions) => !o.weekend.includes(weekday(day)) && !o.holidays.has(day);

export const MAX_SPAN_DAYS = 366_000; // about 1,000 years

export interface BusinessCount {
  /** Working days from start to end, both included (negative if end is before start). */
  business: number;
  calendarDays: number;
  weekendDays: number;
  /** Holidays that fell on otherwise-working days. */
  holidays: number;
}

/** Counts working days in [start, end] inclusive, like a spreadsheet's NETWORKDAYS. */
export function businessDaysBetween(start: number, end: number, o: BusinessOptions): BusinessCount | null {
  const sign = end < start ? -1 : 1;
  const [a, b] = sign === 1 ? [start, end] : [end, start];
  if (b - a > MAX_SPAN_DAYS) return null;
  let business = 0;
  let weekendDays = 0;
  let holidays = 0;
  for (let d = a; d <= b; d++) {
    if (o.weekend.includes(weekday(d))) weekendDays++;
    else if (o.holidays.has(d)) holidays++;
    else business++;
  }
  return { business: sign * business, calendarDays: b - a + 1, weekendDays, holidays };
}

/**
 * Moves `n` working days from `start` (negative goes back), like a spreadsheet's WORKDAY:
 * the start day itself doesn't count, and n = 0 returns the start.
 */
export function addBusinessDays(start: number, n: number, o: BusinessOptions): number | null {
  if (!Number.isInteger(n) || Math.abs(n) > 100_000) return null;
  if (o.weekend.length >= 7) return null;
  const step = n < 0 ? -1 : 1;
  let d = start;
  let left = Math.abs(n);
  let guard = 0;
  while (left > 0) {
    d += step;
    if (isWorkday(d, o)) left--;
    if (++guard > MAX_SPAN_DAYS) return null; // e.g. every day is a holiday
  }
  return d;
}

/** ISO 8601 week number and week-year, and day of the year, for a date-only value. */
export function dayInfo(day: number): { isoWeek: number; isoYear: number; dayOfYear: number; weekday: string } {
  const date = new Date(day * DAY_MS);
  const y = date.getUTCFullYear();
  const dayOfYear = day - Math.round(Date.UTC(y, 0, 1) / DAY_MS) + 1;
  const dow = date.getUTCDay() || 7;
  const thursday = day + 4 - dow;
  const isoYear = new Date(thursday * DAY_MS).getUTCFullYear();
  const isoWeek = Math.floor((thursday - Math.round(Date.UTC(isoYear, 0, 1) / DAY_MS)) / 7) + 1;
  return { isoWeek, isoYear, dayOfYear, weekday: WEEKDAY_NAMES[date.getUTCDay()] };
}

/** The date part of an instant in a zone, as a day number. */
export function dayOf(ms: number, timeZone: string): number {
  const c = civilIn(ms, timeZone);
  return Math.round(Date.UTC(c.year, c.month - 1, c.day) / DAY_MS);
}
