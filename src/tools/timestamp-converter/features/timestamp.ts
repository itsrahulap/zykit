// Unix timestamp ⇄ date conversions. Pure logic; time zones come from Intl.

export type Unit = 's' | 'ms' | 'us' | 'ns';

export const UNIT_LABELS: Record<Unit, string> = {
  s: 'Seconds',
  ms: 'Milliseconds',
  us: 'Microseconds',
  ns: 'Nanoseconds',
};
const PER_MS: Record<Unit, number> = {
  s: 1 / 1000,
  ms: 1,
  us: 1000,
  ns: 1_000_000,
};
/** Largest time value a JavaScript Date can hold (±100,000,000 days). */
export const MAX_DATE_MS = 8.64e15;

/**
 * Guesses the unit from the number of integer digits: up to 11 → seconds (until year 5138),
 * up to 14 → milliseconds, up to 17 → microseconds, more → nanoseconds.
 */
export function detectUnit(value: number): Unit {
  const a = Math.abs(value);
  if (a < 1e11) return 's';
  if (a < 1e14) return 'ms';
  if (a < 1e17) return 'us';
  return 'ns';
}

export type ParsedTimestamp = { ok: true; ms: number; unit: Unit; detected: Unit } | { ok: false; error: string };

export function parseTimestamp(input: string, override?: Unit): ParsedTimestamp {
  const s = input.trim().replace(/[_,\s]/g, '');
  if (!s) return { ok: false, error: 'Enter a Unix timestamp.' };
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(s))
    return {
      ok: false,
      error: 'Not a number. Use digits only, e.g. 1700000000.',
    };
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, error: 'That number is too large.' };
  const detected = detectUnit(n);
  const unit = override ?? detected;
  const ms = n / PER_MS[unit];
  if (Math.abs(ms) > MAX_DATE_MS)
    return {
      ok: false,
      error: `Out of range: dates must be within ±275,760 years of 1970 (read as ${UNIT_LABELS[unit].toLowerCase()}).`,
    };
  return { ok: true, ms, unit, detected };
}

export function fromMs(ms: number, unit: Unit): string {
  const v = ms * PER_MS[unit];
  return unit === 's' ? String(Math.floor(v)) : String(Math.round(v));
}

interface Civil {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock date and time in `timeZone` for the instant `ms`. */
export function civilIn(ms: number, timeZone: string): Civil {
  const p: Record<string, string> = {};
  for (const part of partsFormatter(timeZone).formatToParts(new Date(ms))) p[part.type] = part.value;
  const y = Number(p.year);
  return {
    year: p.era === 'BC' || p.era === 'B' ? 1 - y : y,
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

function utcOf(c: Civil, msPart = 0): number {
  const d = new Date(0);
  d.setUTCFullYear(c.year, c.month - 1, c.day);
  d.setUTCHours(c.hour, c.minute, c.second, msPart);
  return d.getTime();
}

/** Offset of `timeZone` from UTC at instant `ms`, in minutes. */
export function offsetMinutes(ms: number, timeZone: string): number {
  const whole = Math.floor(ms / 1000) * 1000;
  return Math.round((utcOf(civilIn(whole, timeZone)) - whole) / 60000);
}

export function formatOffset(minutes: number, colon = true): string {
  const sign = minutes < 0 ? '-' : '+';
  const a = Math.abs(minutes);
  const hh = String(Math.floor(a / 60)).padStart(2, '0');
  const mm = String(a % 60).padStart(2, '0');
  return `${sign}${hh}${colon ? ':' : ''}${mm}`;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const padYear = (y: number) => (y >= 0 && y <= 9999 ? pad(y, 4) : (y < 0 ? '-' : '+') + pad(Math.abs(y), 6));

/** "2024-03-10 14:05:09.123 (UTC+01:00)" style wall time in a zone. */
export function formatInZone(ms: number, timeZone: string): string {
  const c = civilIn(ms, timeZone);
  const frac = pad((((ms % 1000) + 1000) % 1000) | 0, 3);
  return `${padYear(c.year)}-${pad(c.month)}-${pad(c.day)} ${pad(c.hour)}:${pad(c.minute)}:${pad(c.second)}.${frac} (UTC${formatOffset(offsetMinutes(ms, timeZone))})`;
}

/** ISO 8601 with the zone's offset, e.g. 2024-03-10T14:05:09.123+01:00. */
export function isoInZone(ms: number, timeZone: string): string {
  const c = civilIn(ms, timeZone);
  const off = offsetMinutes(ms, timeZone);
  const frac = pad((((ms % 1000) + 1000) % 1000) | 0, 3);
  return `${padYear(c.year)}-${pad(c.month)}-${pad(c.day)}T${pad(c.hour)}:${pad(c.minute)}:${pad(c.second)}.${frac}${off === 0 ? 'Z' : formatOffset(off)}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** RFC 2822 date (as used in email headers) in the given zone. */
export function rfc2822(ms: number, timeZone = 'UTC'): string {
  const c = civilIn(ms, timeZone);
  const dow = new Date(utcOf({ ...c, hour: 12, minute: 0, second: 0 })).getUTCDay();
  return `${DAYS[dow]}, ${pad(c.day)} ${MONTHS[c.month - 1]} ${c.year} ${pad(c.hour)}:${pad(c.minute)}:${pad(c.second)} ${formatOffset(offsetMinutes(ms, timeZone), false)}`;
}

/** Day of week, day of year and ISO 8601 week for the date as seen in `timeZone`. */
export function calendarInfo(ms: number, timeZone: string) {
  const c = civilIn(ms, timeZone);
  const noon = utcOf({ ...c, hour: 12, minute: 0, second: 0 });
  const date = new Date(noon);
  const dow = date.getUTCDay();
  const jan1 = utcOf({
    year: c.year,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0,
  });
  const dayOfYear = Math.round((noon - jan1) / 86_400_000) + 1;
  // ISO week: the week containing this date's Thursday.
  const isoDow = dow === 0 ? 7 : dow;
  const thursday = noon + (4 - isoDow) * 86_400_000;
  const thursdayYear = new Date(thursday).getUTCFullYear();
  const isoJan1 = utcOf({
    year: thursdayYear,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0,
  });
  const isoWeek = Math.floor(Math.round((thursday - isoJan1) / 86_400_000) / 7) + 1;
  return {
    dayOfWeek: DAY_NAMES[dow],
    dayOfYear,
    isoWeek,
    isoWeekYear: thursdayYear,
  };
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365.2425 * 86_400_000],
  ['month', 30.436875 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000],
];

export function relativeTime(ms: number, now: number, locale = 'en'): string {
  const diff = ms - now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= size || unit === 'second') return rtf.format(Math.trunc(diff / size), unit);
  }
  return rtf.format(0, 'second');
}

export type ParsedDate = { ok: true; ms: number } | { ok: false; error: string };

/**
 * Converts a wall-clock "YYYY-MM-DDTHH:mm[:ss[.sss]]" in `timeZone` to a Unix ms instant.
 * In a DST gap the time is shifted forward; in an overlap the earlier instant is used.
 */
export function civilToMs(value: string, timeZone: string): ParsedDate {
  const m = /^(-?\d{4,6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(value.trim());
  if (!m)
    return {
      ok: false,
      error: 'Enter a date like 2024-03-10 or 2024-03-10T14:30:00.',
    };
  const c: Civil = {
    year: +m[1],
    month: +m[2],
    day: +m[3],
    hour: +(m[4] ?? 0),
    minute: +(m[5] ?? 0),
    second: +(m[6] ?? 0),
  };
  const msPart = m[7] ? Number(m[7].padEnd(3, '0')) : 0;
  if (c.month < 1 || c.month > 12 || c.day < 1 || c.day > 31 || c.hour > 23 || c.minute > 59 || c.second > 59) {
    return { ok: false, error: 'That date or time is out of range.' };
  }
  const guess = utcOf(c, msPart);
  const check = new Date(guess);
  if (check.getUTCDate() !== c.day) return { ok: false, error: 'That day does not exist in that month.' };
  if (!Number.isFinite(guess) || Math.abs(guess) > MAX_DATE_MS) return { ok: false, error: 'That date is out of range.' };
  // Try both offsets around the guess and keep the earliest one that maps back to the wall time.
  const o1 = offsetMinutes(guess - offsetMinutes(guess, timeZone) * 60000, timeZone);
  const o2 = offsetMinutes(guess, timeZone);
  const candidates = [...new Set([o1, o2])].map((o) => guess - o * 60000).sort((a, b) => a - b);
  for (const t of candidates) if (utcOf(civilIn(t, timeZone), msPart) === guess) return { ok: true, ms: t };
  // Wall time falls in a DST gap: move forward by the gap size.
  return { ok: true, ms: guess - Math.min(o1, o2) * 60000 };
}

/** Wall-clock string suitable for <input type="datetime-local" step="1">. */
export function toDatetimeLocal(ms: number, timeZone: string): string {
  const c = civilIn(ms, timeZone);
  return `${padYear(c.year)}-${pad(c.month)}-${pad(c.day)}T${pad(c.hour)}:${pad(c.minute)}:${pad(c.second)}`;
}

export const FALLBACK_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function timeZones(): string[] {
  let list: string[] = [];
  try {
    list = Intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    list = [];
  }
  if (list.length === 0) list = FALLBACK_ZONES;
  return ['UTC', ...list.filter((z) => z !== 'UTC')];
}

export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
