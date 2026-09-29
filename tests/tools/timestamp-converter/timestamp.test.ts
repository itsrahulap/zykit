import { describe, expect, it } from 'vitest';
import {
  calendarInfo,
  civilToMs,
  detectUnit,
  formatInZone,
  fromMs,
  isoInZone,
  offsetMinutes,
  parseTimestamp,
  relativeTime,
  rfc2822,
  timeZones,
  toDatetimeLocal,
} from '../../../src/tools/timestamp-converter/features/timestamp';

const T = 1_700_000_000_000; // 2023-11-14T22:13:20Z

describe('parseTimestamp', () => {
  it('detects units by magnitude', () => {
    expect(detectUnit(1_700_000_000)).toBe('s');
    expect(detectUnit(T)).toBe('ms');
    expect(detectUnit(T * 1000)).toBe('us');
    expect(detectUnit(T * 1_000_000)).toBe('ns');
    expect(detectUnit(-1_700_000_000)).toBe('s');
  });
  it('converts every unit to ms', () => {
    expect(parseTimestamp('1700000000')).toMatchObject({
      ok: true,
      ms: T,
      unit: 's',
    });
    expect(parseTimestamp('1700000000000')).toMatchObject({
      ok: true,
      ms: T,
      unit: 'ms',
    });
    expect(parseTimestamp('1700000000000000')).toMatchObject({
      ok: true,
      ms: T,
      unit: 'us',
    });
    expect(parseTimestamp('1700000000000000000')).toMatchObject({
      ok: true,
      ms: T,
      unit: 'ns',
    });
    expect(parseTimestamp('1,700,000,000.5')).toMatchObject({
      ok: true,
      ms: T + 500,
    });
  });
  it('honours a manual override', () => {
    expect(parseTimestamp('1700000000', 'ms')).toMatchObject({
      ok: true,
      ms: 1_700_000_000,
      unit: 'ms',
      detected: 's',
    });
  });
  it('rejects bad input', () => {
    expect(parseTimestamp('').ok).toBe(false);
    expect(parseTimestamp('abc').ok).toBe(false);
    expect(parseTimestamp('12:30').ok).toBe(false);
    expect(parseTimestamp('9e20', 's').ok).toBe(false);
  });
  it('converts back', () => {
    expect(fromMs(T + 999, 's')).toBe('1700000000');
    expect(fromMs(T, 'ns')).toBe('1700000000000000000');
  });
});

describe('formatting', () => {
  it('formats in zones', () => {
    expect(formatInZone(T, 'UTC')).toBe('2023-11-14 22:13:20.000 (UTC+00:00)');
    expect(formatInZone(T, 'Asia/Kolkata')).toBe('2023-11-15 03:43:20.000 (UTC+05:30)');
    expect(isoInZone(T, 'UTC')).toBe('2023-11-14T22:13:20.000Z');
    expect(isoInZone(T, 'America/New_York')).toBe('2023-11-14T17:13:20.000-05:00');
    expect(rfc2822(T)).toBe('Tue, 14 Nov 2023 22:13:20 +0000');
    expect(rfc2822(T, 'Asia/Kolkata')).toBe('Wed, 15 Nov 2023 03:43:20 +0530');
    expect(toDatetimeLocal(T, 'UTC')).toBe('2023-11-14T22:13:20');
  });
  it('handles negative timestamps', () => {
    expect(formatInZone(-1, 'UTC')).toBe('1969-12-31 23:59:59.999 (UTC+00:00)');
  });
  it('computes calendar info (ISO weeks)', () => {
    expect(calendarInfo(T, 'UTC')).toEqual({
      dayOfWeek: 'Tuesday',
      dayOfYear: 318,
      isoWeek: 46,
      isoWeekYear: 2023,
    });
    // 2021-01-01 is in ISO week 53 of 2020.
    expect(calendarInfo(Date.UTC(2021, 0, 1), 'UTC')).toMatchObject({
      isoWeek: 53,
      isoWeekYear: 2020,
      dayOfYear: 1,
    });
    expect(calendarInfo(Date.UTC(2024, 11, 30), 'UTC')).toMatchObject({
      isoWeek: 1,
      isoWeekYear: 2025,
    });
  });
  it('describes relative time', () => {
    expect(relativeTime(T - 3 * 86_400_000, T)).toBe('3 days ago');
    expect(relativeTime(T + 2 * 3_600_000, T)).toBe('in 2 hours');
    expect(relativeTime(T, T)).toBe('now');
  });
});

describe('civilToMs', () => {
  it('converts wall time in a zone', () => {
    expect(civilToMs('2023-11-14T22:13:20', 'UTC')).toEqual({
      ok: true,
      ms: T,
    });
    expect(civilToMs('2023-11-14T17:13:20', 'America/New_York')).toEqual({
      ok: true,
      ms: T,
    });
    expect(civilToMs('2023-11-15 03:43:20.5', 'Asia/Kolkata')).toEqual({
      ok: true,
      ms: T + 500,
    });
    expect(civilToMs('2023-11-14', 'UTC')).toEqual({
      ok: true,
      ms: Date.UTC(2023, 10, 14),
    });
  });
  it('handles DST gaps and overlaps', () => {
    // 2024-03-10 02:30 does not exist in New York; it moves to 03:30 EDT.
    const gap = civilToMs('2024-03-10T02:30', 'America/New_York');
    expect(gap.ok && new Date(gap.ms).toISOString()).toBe('2024-03-10T07:30:00.000Z');
    // 2024-11-03 01:30 happens twice; the earlier (EDT) one is used.
    const overlap = civilToMs('2024-11-03T01:30', 'America/New_York');
    expect(overlap.ok && new Date(overlap.ms).toISOString()).toBe('2024-11-03T05:30:00.000Z');
    expect(offsetMinutes(Date.UTC(2024, 6, 1), 'Europe/Berlin')).toBe(120);
  });
  it('rejects invalid dates', () => {
    expect(civilToMs('2023-02-30', 'UTC').ok).toBe(false);
    expect(civilToMs('2023-13-01', 'UTC').ok).toBe(false);
    expect(civilToMs('yesterday', 'UTC').ok).toBe(false);
  });
});

it('lists time zones with UTC first', () => {
  const z = timeZones();
  expect(z[0]).toBe('UTC');
  expect(z).toContain('Europe/Berlin');
});
