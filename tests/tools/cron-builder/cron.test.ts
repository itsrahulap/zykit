import { describe, expect, it } from 'vitest';
import {
  builderToField,
  describeCron,
  FIELD_DEFS,
  fieldToBuilder,
  formatRun,
  nextRuns,
  parseCron,
  resolveWall,
  setField,
  type Cron,
} from '../../../src/tools/cron-builder/features/cron';

function cron(expr: string): Cron {
  const r = parseCron(expr);
  if (!r.ok || !('cron' in r)) throw new Error(`parse failed: ${JSON.stringify(r)}`);
  return r.cron;
}
const iso = (expr: string, from: string, tz = 'UTC', count = 10) => nextRuns(cron(expr), new Date(from), tz, count).runs.map((d) => d.toISOString());

describe('parseCron', () => {
  it('parses 5 and 6 fields, names, lists, ranges and steps', () => {
    const c = cron('*/15 9-17 1,15 JAN-MAR mon-fri');
    expect(c.hasSeconds).toBe(false);
    expect(c.fields.minute.values.flatMap((v, i) => (v ? [i] : []))).toEqual([0, 15, 30, 45]);
    expect(c.fields.month.values.flatMap((v, i) => (v ? [i] : []))).toEqual([1, 2, 3]);
    expect(c.fields.dow.values.flatMap((v, i) => (v ? [i] : []))).toEqual([1, 2, 3, 4, 5]);
    expect(cron('30 0 12 * * *').hasSeconds).toBe(true);
  });
  it('treats 7 as Sunday and tolerates ?', () => {
    expect(cron('0 0 * * 7').fields.dow.values[0]).toBe(true);
    expect(cron('0 0 ? * MON').fields.dom.any).toBe(true);
  });
  it('expands macros and recognises @reboot', () => {
    expect(cron('@daily').expression).toBe('0 0 * * *');
    expect(cron('@weekly').macro).toBe('@weekly');
    expect(parseCron('@reboot')).toEqual({ ok: true, reboot: true, macro: '@reboot' });
  });
  it('reports errors per field', () => {
    const r = parseCron('60 24 0 13 8');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.field)).toEqual(['minute', 'hour', 'dom', 'month', 'dow']);
    expect(r.errors[0].message).toBe('60 is out of range (0–59)');
  });
  it('rejects bad syntax with clear messages', () => {
    const msg = (e: string) => {
      const r = parseCron(e);
      return r.ok ? '' : r.errors[0].message;
    };
    expect(msg('')).toBe('Enter a cron expression.');
    expect(msg('* * *')).toMatch(/Expected 5 fields/);
    expect(msg('0 0 1 1 * 2030 x')).toMatch(/7th \(year\) field is not supported/);
    expect(msg('5-1 * * * *')).toBe('Range 5-1 goes backwards');
    expect(msg('*/0 * * * *')).toBe('Step 0 must be 1–60');
    expect(msg('? * * * *')).toMatch(/only allowed in day-of-month/);
    expect(msg('0 0 * * FOO')).toMatch(/day name/);
    expect(msg('@often')).toMatch(/Unknown macro/);
    expect(msg('0 0 * * L')).toMatch(/not supported/);
    expect(msg('0 0 * * 1#6')).toMatch(/1–5/);
    expect(msg('0 0,,1 * * *')).toBe('Empty list item');
  });
});

describe('describeCron', () => {
  const d = (e: string) => describeCron(cron(e));
  it('describes common schedules', () => {
    expect(d('30 9 * * 1-5')).toBe('At 09:30 on Monday through Friday');
    expect(d('* * * * *')).toBe('Every minute');
    expect(d('*/5 * * * *')).toBe('Every 5 minutes');
    expect(d('0 * * * *')).toBe('At minute 0');
    expect(d('0 9,17 * * *')).toBe('At 09:00 and 17:00');
    expect(d('0 9-17 * * *')).toBe('At minute 0 past every hour from 9 through 17');
    expect(d('0 0 1 */3 *')).toBe('At 00:00 on day-of-month 1 in every 3 months');
    expect(d('0 0 1,15 * 1')).toBe('At 00:00 on day-of-month 1 and 15 or on Monday');
    expect(d('0 12 * JAN,JUL *')).toBe('At 12:00 in January and July');
    expect(d('@yearly')).toBe('At 00:00 on day-of-month 1 in January');
  });
  it('describes seconds and Quartz-style specials', () => {
    expect(d('*/10 * * * * *')).toBe('Every 10 seconds');
    expect(d('15 30 9 * * *')).toBe('At 09:30:15');
    expect(d('0 0 L * *')).toBe('At 00:00 on the last day of the month');
    expect(d('0 0 LW * *')).toBe('At 00:00 on the last weekday of the month');
    expect(d('0 0 15W * *')).toBe('At 00:00 on the weekday nearest day 15 of the month');
    expect(d('0 0 ? * 5L')).toBe('At 00:00 on the last Friday of the month');
    expect(d('0 0 ? * MON#2')).toBe('At 00:00 on the second Monday of the month');
  });
});

describe('nextRuns', () => {
  it('lists the next runs in UTC', () => {
    expect(iso('30 9 * * 1-5', '2026-09-25T10:00:00Z', 'UTC', 3)).toEqual([
      '2026-09-28T09:30:00.000Z',
      '2026-09-29T09:30:00.000Z',
      '2026-09-30T09:30:00.000Z',
    ]);
  });
  it('finds Feb 29 in leap years only', () => {
    expect(iso('0 0 29 2 *', '2026-09-29T00:00:00Z', 'UTC', 2)).toEqual(['2028-02-29T00:00:00.000Z', '2032-02-29T00:00:00.000Z']);
  });
  it('handles the last day of the month', () => {
    expect(iso('0 0 L * *', '2026-09-29T00:00:00Z', 'UTC', 6)).toEqual([
      '2026-09-30T00:00:00.000Z',
      '2026-10-31T00:00:00.000Z',
      '2026-11-30T00:00:00.000Z',
      '2026-12-31T00:00:00.000Z',
      '2027-01-31T00:00:00.000Z',
      '2027-02-28T00:00:00.000Z',
    ]);
  });
  it('handles nW, LW, nL and n#k', () => {
    // Aug 2026: the 15th is a Saturday → Friday 14th. Nov 2026: the 1st is a Sunday → Monday 2nd.
    expect(iso('0 0 15W 8 *', '2026-01-01T00:00:00Z', 'UTC', 1)).toEqual(['2026-08-14T00:00:00.000Z']);
    expect(iso('0 0 1W 11 *', '2026-01-01T00:00:00Z', 'UTC', 1)).toEqual(['2026-11-02T00:00:00.000Z']);
    // Oct 2026 ends on a Saturday → last weekday is Friday 30th.
    expect(iso('0 0 LW 10 *', '2026-01-01T00:00:00Z', 'UTC', 1)).toEqual(['2026-10-30T00:00:00.000Z']);
    expect(iso('0 0 * * 5L', '2026-09-01T00:00:00Z', 'UTC', 1)).toEqual(['2026-09-25T00:00:00.000Z']);
    expect(iso('0 0 * * 1#2', '2026-09-01T00:00:00Z', 'UTC', 1)).toEqual(['2026-09-14T00:00:00.000Z']);
  });
  it('uses OR semantics when both day fields are restricted', () => {
    // 13th of the month OR a Friday.
    expect(iso('0 0 13 * 5', '2026-09-01T00:00:00Z', 'UTC', 3)).toEqual([
      '2026-09-04T00:00:00.000Z',
      '2026-09-11T00:00:00.000Z',
      '2026-09-13T00:00:00.000Z',
    ]);
  });
  it('supports seconds', () => {
    expect(iso('*/20 * * * * *', '2026-01-01T00:00:05Z', 'UTC', 3)).toEqual([
      '2026-01-01T00:00:20.000Z',
      '2026-01-01T00:00:40.000Z',
      '2026-01-01T00:01:00.000Z',
    ]);
  });
  it('skips wall times that fall in a spring-forward gap', () => {
    // New York jumps from 02:00 EST to 03:00 EDT on 2026-03-08.
    expect(iso('30 2 * * *', '2026-03-07T00:00:00Z', 'America/New_York', 2)).toEqual(['2026-03-07T07:30:00.000Z', '2026-03-09T06:30:00.000Z']);
  });
  it('runs a repeated fall-back wall time once, at the first occurrence', () => {
    // New York falls back from 02:00 EDT to 01:00 EST on 2026-11-01.
    expect(iso('30 1 * * *', '2026-10-31T12:00:00Z', 'America/New_York', 2)).toEqual(['2026-11-01T05:30:00.000Z', '2026-11-02T06:30:00.000Z']);
    expect(iso('0 * * * *', '2026-11-01T04:30:00Z', 'America/New_York', 3)).toEqual([
      '2026-11-01T05:00:00.000Z',
      '2026-11-01T07:00:00.000Z',
      '2026-11-01T08:00:00.000Z',
    ]);
  });
  it('keeps local time across DST in another zone', () => {
    expect(iso('0 9 * * *', '2026-10-24T12:00:00Z', 'Europe/Berlin', 2)).toEqual(['2026-10-25T08:00:00.000Z', '2026-10-26T08:00:00.000Z']);
  });
  it('reports an impossible schedule as incomplete', () => {
    const r = nextRuns(cron('0 0 30 2 *'), new Date('2026-01-01T00:00:00Z'), 'UTC');
    expect(r).toEqual({ runs: [], complete: false });
  });
  it('resolveWall returns null inside a gap', () => {
    expect(resolveWall({ y: 2026, m: 3, d: 8, h: 2, mi: 30, s: 0 }, 'America/New_York')).toBeNull();
  });
  it('formats runs in the chosen zone', () => {
    expect(formatRun(new Date('2026-09-28T09:30:00Z'), 'UTC', false)).toBe('Mon 2026-09-28 09:30 UTC');
    expect(formatRun(new Date('2026-09-28T09:30:05Z'), 'Asia/Kolkata', true)).toBe('Mon 2026-09-28 15:00:05 GMT+5:30');
  });
});

describe('builder', () => {
  it('round-trips field text', () => {
    const def = FIELD_DEFS.minute;
    expect(fieldToBuilder('*', def).mode).toBe('every');
    expect(fieldToBuilder('1,5,3', def)).toMatchObject({ mode: 'specific', values: [1, 3, 5] });
    expect(fieldToBuilder('10-20', def)).toMatchObject({ mode: 'range', from: 10, to: 20 });
    expect(fieldToBuilder('*/15', def)).toMatchObject({ mode: 'step', start: 0, step: 15 });
    expect(fieldToBuilder('5/15', def)).toMatchObject({ mode: 'step', start: 5, step: 15 });
    expect(fieldToBuilder('1-5,7', def).mode).toBe('custom');
    expect(builderToField({ mode: 'step', values: [], from: 0, to: 59, start: 0, step: 10 }, def)).toBe('*/10');
    expect(builderToField({ mode: 'range', values: [], from: 20, to: 10, start: 0, step: 1 }, def)).toBe('10-20');
  });
  it('sets one field and expands macros', () => {
    expect(setField('0 0 * * *', 'dow', '1-5')).toBe('0 0 * * 1-5');
    expect(setField('@hourly', 'minute', '30')).toBe('30 * * * *');
    expect(setField('0 0 0 * * *', 'second', '*/5')).toBe('*/5 0 0 * * *');
  });
});
