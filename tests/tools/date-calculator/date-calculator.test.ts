import { describe, expect, it } from 'vitest';
import {
  addBusinessDays,
  addDuration,
  addMonths,
  businessDaysBetween,
  dayInfo,
  dayOf,
  daysInMonth,
  describeDifference,
  difference,
  formatDay,
  parseDay,
  parseHolidays,
  WEEKENDS,
  ZERO_DURATION,
} from '../../../src/tools/date-calculator/features/date-calculator';

const utc = (s: string) => Date.parse(s + 'Z');
const day = (s: string) => parseDay(s)!;

describe('months', () => {
  it('knows month lengths', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2024, 4)).toBe(30);
  });
  it('clamps to month end', () => {
    const c = { year: 2024, month: 1, day: 31, hour: 0, minute: 0, second: 0 };
    expect(addMonths(c, 1)).toEqual({ civil: { ...c, month: 2, day: 29 }, clampedFrom: 31 });
    expect(addMonths(c, 2).clampedFrom).toBeNull();
    expect(addMonths(c, -2).civil).toMatchObject({ year: 2023, month: 11, day: 30 });
    expect(addMonths(c, 12 * 3 + 1).civil).toMatchObject({ year: 2027, month: 2, day: 28 });
  });
});

describe('difference', () => {
  it('breaks a span into calendar units', () => {
    const d = difference(utc('2020-02-29T10:00:00'), utc('2024-03-01T12:30:15'), 'UTC');
    expect(d).toMatchObject({ sign: 1, years: 4, months: 0, days: 1, hours: 2, minutes: 30, seconds: 15, dstShiftMinutes: 0 });
    expect(describeDifference(d)).toBe('4 years, 1 day, 2 hours, 30 minutes and 15 seconds');
  });

  it('handles month ends and reversed order', () => {
    expect(difference(utc('2023-01-31T00:00:00'), utc('2023-02-28T00:00:00'), 'UTC')).toMatchObject({ months: 1, days: 0 });
    expect(difference(utc('2024-01-31T00:00:00'), utc('2024-03-01T00:00:00'), 'UTC')).toMatchObject({ months: 1, days: 1 });
    expect(difference(utc('2024-03-15T00:00:00'), utc('2024-03-14T23:00:00'), 'UTC')).toMatchObject({ months: 0, days: 0, hours: 1 });
    const back = difference(utc('2024-05-01T00:00:00'), utc('2024-01-01T00:00:00'), 'UTC');
    expect(back).toMatchObject({ sign: -1, months: 4 });
    expect(back.totalMs).toBe(-121 * 86_400_000);
    expect(describeDifference(back)).toBe('4 months earlier');
    expect(describeDifference(difference(0, 0, 'UTC'))).toBe('The same moment');
  });

  it('is DST-aware: a wall-clock day across spring-forward is 23 real hours', () => {
    // 2024-03-10 is the US spring-forward date.
    const start = Date.parse('2024-03-09T12:00:00-05:00');
    const end = Date.parse('2024-03-10T12:00:00-04:00');
    const d = difference(start, end, 'America/New_York');
    expect(d).toMatchObject({ days: 1, hours: 0 });
    expect(d.totalMs).toBe(23 * 3_600_000);
    expect(d.dstShiftMinutes).toBe(60);
  });
});

describe('addDuration', () => {
  it('adds calendar units with clamping', () => {
    const r = addDuration(utc('2024-01-31T09:00:00'), 'UTC', { ...ZERO_DURATION, months: 1 }, 1);
    expect(r.ok && new Date(r.ms).toISOString()).toBe('2024-02-29T09:00:00.000Z');
    expect(r.ok && r.clamp).toEqual({ from: 31, to: 29, month: 'February 2024' });
    const y = addDuration(utc('2024-02-29T00:00:00'), 'UTC', { ...ZERO_DURATION, years: 1 }, 1);
    expect(y.ok && new Date(y.ms).toISOString()).toBe('2025-02-28T00:00:00.000Z');
  });

  it('subtracts and mixes units', () => {
    const r = addDuration(utc('2024-03-31T00:00:00'), 'UTC', { years: 1, months: 1, weeks: 1, days: 1, hours: 1, minutes: 1, seconds: 1 }, -1);
    // 2024-03-31 − 1y1m → 2023-02-28 (clamped), − 8 days → 2023-02-20, − 1:01:01 → 2023-02-19T22:58:59
    expect(r.ok && new Date(r.ms).toISOString()).toBe('2023-02-19T22:58:59.000Z');
  });

  it('keeps wall time for days but uses exact time for hours across DST', () => {
    const start = Date.parse('2024-03-09T12:00:00-05:00');
    const day1 = addDuration(start, 'America/New_York', { ...ZERO_DURATION, days: 1 }, 1);
    expect(day1.ok && day1.ms).toBe(Date.parse('2024-03-10T12:00:00-04:00'));
    const h24 = addDuration(start, 'America/New_York', { ...ZERO_DURATION, hours: 24 }, 1);
    expect(h24.ok && h24.ms).toBe(Date.parse('2024-03-10T13:00:00-04:00'));
  });

  it('reports DST gaps', () => {
    const start = Date.parse('2024-03-09T02:30:00-05:00');
    const r = addDuration(start, 'America/New_York', { ...ZERO_DURATION, days: 1 }, 1);
    expect(r.ok && r.gapShiftMinutes).toBe(60);
    expect(r.ok && r.ms).toBe(Date.parse('2024-03-10T03:30:00-04:00'));
  });

  it('rejects fractional input and out-of-range results', () => {
    expect(addDuration(0, 'UTC', { ...ZERO_DURATION, days: 1.5 }, 1).ok).toBe(false);
    expect(addDuration(0, 'UTC', { ...ZERO_DURATION, years: 20000 }, 1).ok).toBe(false);
  });
});

describe('business days', () => {
  const satSun = { weekend: WEEKENDS['sat-sun'].days, holidays: new Set<number>() };

  it('parses dates strictly', () => {
    expect(parseDay('2024-02-29')).not.toBeNull();
    expect(parseDay('2023-02-29')).toBeNull();
    expect(parseDay('2024-13-01')).toBeNull();
    expect(formatDay(day('2024-07-04'))).toBe('2024-07-04');
  });

  it('counts inclusive working days (NETWORKDAYS)', () => {
    // Mon 2024-01-01 … Sun 2024-01-14: 10 working days.
    expect(businessDaysBetween(day('2024-01-01'), day('2024-01-14'), satSun)).toEqual({ business: 10, calendarDays: 14, weekendDays: 4, holidays: 0 });
    expect(businessDaysBetween(day('2024-01-14'), day('2024-01-01'), satSun)!.business).toBe(-10);
    const withHoliday = { ...satSun, holidays: parseHolidays('2024-01-01 New Year\n2024-01-06').days };
    expect(businessDaysBetween(day('2024-01-01'), day('2024-01-14'), withHoliday)).toMatchObject({ business: 9, holidays: 1, weekendDays: 4 });
    expect(businessDaysBetween(day('2024-01-05'), day('2024-01-06'), { weekend: WEEKENDS['fri-sat'].days, holidays: new Set() })!.business).toBe(0);
    expect(businessDaysBetween(day('2024-01-01'), day('2024-01-07'), { weekend: WEEKENDS.sun.days, holidays: new Set() })!.business).toBe(6);
  });

  it('adds working days (WORKDAY)', () => {
    // Fri 2024-01-05 + 1 → Mon 2024-01-08.
    expect(formatDay(addBusinessDays(day('2024-01-05'), 1, satSun)!)).toBe('2024-01-08');
    expect(formatDay(addBusinessDays(day('2024-01-08'), -1, satSun)!)).toBe('2024-01-05');
    expect(formatDay(addBusinessDays(day('2024-01-06'), 0, satSun)!)).toBe('2024-01-06');
    expect(formatDay(addBusinessDays(day('2024-01-01'), 10, satSun)!)).toBe('2024-01-15');
    const xmas = { ...satSun, holidays: parseHolidays('2024-12-25, 2024-12-26').days };
    expect(formatDay(addBusinessDays(day('2024-12-24'), 1, xmas)!)).toBe('2024-12-27');
    expect(addBusinessDays(0, 1.5, satSun)).toBeNull();
  });

  it('parses holiday lists and reports bad lines', () => {
    const h = parseHolidays('2024-12-25 Christmas\n# comment\n\n2024-02-30\nnot a date, 2025-01-01');
    expect([...h.days].map(formatDay)).toEqual(['2024-12-25', '2025-01-01']);
    expect(h.invalid).toEqual(['2024-02-30', 'not a date']);
  });
});

describe('calendar info', () => {
  it('computes ISO weeks and day of year', () => {
    expect(dayInfo(day('2024-01-01'))).toEqual({ isoWeek: 1, isoYear: 2024, dayOfYear: 1, weekday: 'Monday' });
    expect(dayInfo(day('2021-01-03'))).toMatchObject({ isoWeek: 53, isoYear: 2020 });
    expect(dayInfo(day('2024-12-30'))).toMatchObject({ isoWeek: 1, isoYear: 2025, dayOfYear: 365 });
    expect(dayInfo(day('2024-12-31')).dayOfYear).toBe(366);
  });
  it('takes the date in the chosen zone', () => {
    const t = utc('2024-06-01T02:00:00');
    expect(formatDay(dayOf(t, 'UTC'))).toBe('2024-06-01');
    expect(formatDay(dayOf(t, 'America/Los_Angeles'))).toBe('2024-05-31');
  });
});
