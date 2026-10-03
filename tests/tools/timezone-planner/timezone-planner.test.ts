import { describe, expect, it } from 'vitest';
import {
  buildGrid,
  buildIcs,
  CITIES,
  cleanPlace,
  defaultPlaces,
  describeOverlap,
  formatClock,
  icsEscape,
  icsFold,
  isValidZone,
  isWorking,
  makePlace,
  momentLines,
  momentText,
  nextDay,
  runs,
  searchPlaces,
  todayIn,
  validDate,
  zoneLabel,
} from '../../../src/tools/timezone-planner/features/timezone-planner';

const london = makePlace('Europe/London', 'London');
const ny = makePlace('America/New_York', 'New York');
const tokyo = makePlace('Asia/Tokyo', 'Tokyo');
const delhi = makePlace('Asia/Kolkata', 'Mumbai');
const T = Date.UTC(2023, 9, 3, 14); // Tue 3 Oct 2023, 14:00 UTC

describe('places and search', () => {
  it('bundles about 200+ cities with valid zones', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(200);
    for (const c of CITIES) expect(isValidZone(c.zone), `${c.name}: ${c.zone}`).toBe(true);
  });
  it('searches cities first, then IANA zones', () => {
    expect(searchPlaces('london')[0]).toMatchObject({ label: 'London', zone: 'Europe/London' });
    expect(searchPlaces('new york')[0].zone).toBe('America/New_York');
    expect(searchPlaces('Mumbai')[0].zone).toBe('Asia/Kolkata');
    expect(searchPlaces('argentina').some((h) => h.zone === 'America/Argentina/Buenos_Aires')).toBe(true);
    expect(searchPlaces('')).toEqual([]);
    expect(searchPlaces('zzzzqq')).toEqual([]);
  });
  it('labels zones and validates them', () => {
    expect(zoneLabel('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(isValidZone('Nope/Zone')).toBe(false);
    expect(isValidZone('')).toBe(false);
  });
  it('repairs places from a shared link', () => {
    expect(cleanPlace({ zone: 'Nope/Zone' })).toBeNull();
    expect(cleanPlace(null)).toBeNull();
    expect(cleanPlace({ zone: 'Europe/Paris', start: 99, end: 'x', label: ' ' })).toEqual({ zone: 'Europe/Paris', label: 'Paris', start: 9, end: 17 });
    expect(cleanPlace({ zone: 'Europe/Paris', start: 8, end: 20, label: 'HQ' })).toMatchObject({ start: 8, end: 20, label: 'HQ' });
  });
  it('defaults include the local zone once', () => {
    const d = defaultPlaces('Australia/Perth');
    expect(d[0].zone).toBe('Australia/Perth');
    expect(defaultPlaces('Europe/London').filter((p) => p.zone === 'Europe/London')).toHaveLength(1);
  });
});

describe('working hours', () => {
  it('start inclusive, end exclusive, with overnight windows', () => {
    expect(isWorking(9 * 60, 9, 17)).toBe(true);
    expect(isWorking(17 * 60, 9, 17)).toBe(false);
    expect(isWorking(23 * 60, 22, 6)).toBe(true);
    expect(isWorking(3 * 60, 22, 6)).toBe(true);
    expect(isWorking(12 * 60, 22, 6)).toBe(false);
    expect(isWorking(5, 0, 24)).toBe(true);
    expect(isWorking(5, 9, 9)).toBe(false);
  });
});

describe('grid and overlap', () => {
  it('aligns every row to the base zone day', () => {
    const g = buildGrid([ny, london], '2023-10-03')!;
    expect(g.hours).toBe(24);
    expect(g.rows[0].cells[0]).toMatchObject({ hour: 0, working: false });
    expect(g.rows[1].cells[0]).toMatchObject({ hour: 5, day: '2023-10-03' }); // 00:00 EDT = 05:00 BST
    expect(g.rows[1].cells[23]).toMatchObject({ hour: 4, day: '2023-10-04', dayLabel: 'Wed 4' });
  });
  it('finds the overlap of working hours', () => {
    const g = buildGrid([ny, london], '2023-10-03')!;
    expect(g.overlap).toEqual([9, 10, 11]);
    expect(describeOverlap(g)).toBe('09:00–12:00 in New York (3 hours)');
    expect(describeOverlap(g, true)).toBe('9:00 AM–12:00 PM in New York (3 hours)');
  });
  it('reports no overlap when ranges never meet', () => {
    const g = buildGrid([ny, tokyo], '2023-10-03')!;
    expect(g.overlap).toEqual([]);
    expect(describeOverlap(g)).toBeNull();
  });
  it('respects edited working hours and half-hour zones', () => {
    const wide = { ...ny, start: 6, end: 22 };
    const g = buildGrid([wide, delhi], '2023-10-03')!;
    expect(g.rows[1].cells[0]).toMatchObject({ hour: 9, minute: 30 });
    expect(g.overlap.length).toBeGreaterThan(0);
    expect(buildGrid([], '2023-10-03')).toBeNull();
    expect(buildGrid([ny], 'bad')).toBeNull();
  });
  it('handles DST days: 23 and 25 hour days', () => {
    expect(buildGrid([ny], '2023-03-12')!.hours).toBe(23);
    expect(buildGrid([ny], '2023-11-05')!.hours).toBe(25);
    expect(buildGrid([london], '2023-03-26')!.hours).toBe(23);
    expect(buildGrid([london], '2023-10-29')!.hours).toBe(25);
    expect(buildGrid([makePlace('Asia/Kolkata')], '2023-03-12')!.hours).toBe(24);
  });
  it('shows the offset change across a DST day', () => {
    const g = buildGrid([ny, london], '2023-03-12')!;
    expect(g.rows[0].offsetStart).toBe(-300);
    expect(g.rows[0].offsetEnd).toBe(-240);
    expect(g.rows[1].offsetStart).toBe(0); // London changes two weeks later
    expect(g.rows[1].offsetEnd).toBe(0);
    // the 23-hour day skips local 02:00 in New York
    expect(g.rows[0].cells.map((c) => c.hour)).not.toContain(2);
  });
  it('uses the day count of the base zone for rows in other zones', () => {
    const g = buildGrid([london, ny], '2023-10-29')!; // London falls back
    expect(g.slots).toHaveLength(25);
    expect(g.rows[0].cells.map((c) => c.hour).filter((h) => h === 1)).toHaveLength(2);
  });
});

describe('helpers', () => {
  it('computes dates', () => {
    expect(nextDay('2023-02-28')).toBe('2023-03-01');
    expect(nextDay('2024-12-31')).toBe('2025-01-01');
    expect(nextDay('nope')).toBeNull();
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('2023-02-29')).toBe(false);
    expect(todayIn('Pacific/Auckland', Date.UTC(2023, 9, 3, 12))).toBe('2023-10-04');
    expect(todayIn('Pacific/Honolulu', Date.UTC(2023, 9, 3, 5))).toBe('2023-10-02');
  });
  it('groups runs and formats clocks', () => {
    expect(runs([2, 3, 4, 7])).toEqual([[2, 4], [7, 7]]);
    expect(runs([])).toEqual([]);
    expect(formatClock(0, 5, true)).toBe('12:05 AM');
    expect(formatClock(13, 0, true)).toBe('1:00 PM');
    expect(formatClock(7, 30)).toBe('07:30');
  });
});

describe('moment text', () => {
  it('converts one instant everywhere', () => {
    const l = momentLines(T, [london, ny, tokyo, delhi]);
    expect(l.map((x) => x.clock)).toEqual(['15:00', '10:00', '23:00', '19:30']);
    expect(l.map((x) => x.offset)).toEqual(['UTC+01:00', 'UTC-04:00', 'UTC+09:00', 'UTC+05:30']);
    expect(l.every((x) => x.dayShift === 0)).toBe(true);
  });
  it('writes the share text with day shifts', () => {
    expect(momentText(T, [london, ny])).toBe('Tue 3 Oct, 15:00 London / 10:00 New York (14:00 UTC)');
    expect(momentText(Date.UTC(2023, 9, 3, 16), [london, tokyo])).toBe('Tue 3 Oct, 17:00 London / 01:00 Tokyo (Wed 4 Oct) (16:00 UTC)');
    expect(momentText(T, [])).toBe('');
  });
  it('is right on DST boundaries', () => {
    // New York 2023-03-12: 01:59 EST then 03:00 EDT
    const before = Date.UTC(2023, 2, 12, 6, 59);
    const after = Date.UTC(2023, 2, 12, 7, 0);
    expect(momentLines(before, [ny])[0]).toMatchObject({ clock: '01:59', offset: 'UTC-05:00' });
    expect(momentLines(after, [ny])[0]).toMatchObject({ clock: '03:00', offset: 'UTC-04:00' });
  });
});

describe('ICS', () => {
  const ics = buildIcs({ startMs: T, durationMin: 45, title: 'Sync, weekly; team', places: [london, ny], now: Date.UTC(2023, 9, 1, 8, 30, 5) });
  it('writes a UTC event with CRLF lines', () => {
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
    expect(ics.replace(/\r\n/g, '').includes('\n')).toBe(false);
    expect(ics).toContain('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n');
    expect(ics).toContain('DTSTART:20231003T140000Z\r\n');
    expect(ics).toContain('DTEND:20231003T144500Z\r\n');
    expect(ics).toContain('DTSTAMP:20231001T083005Z\r\n');
    expect(ics).toContain('SUMMARY:Sync\\, weekly\\; team\r\n');
  });
  it('puts the multi-zone text in the description, escaped', () => {
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('DESCRIPTION:Tue 3 Oct\\, 15:00 London / 10:00 New York (14:00 UTC)\r\n');
  });
  it('is deterministic for fixed input and falls back to a default title', () => {
    expect(buildIcs({ startMs: T, durationMin: 45, title: 'Sync, weekly; team', places: [london, ny], now: Date.UTC(2023, 9, 1, 8, 30, 5) })).toBe(ics);
    expect(buildIcs({ startMs: T, durationMin: 30, title: '  ', places: [london], now: 0 })).toContain('SUMMARY:Meeting');
  });
  it('escapes and folds per RFC 5545', () => {
    expect(icsEscape('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
    const long = 'DESCRIPTION:' + 'é'.repeat(80);
    const folded = icsFold(long);
    for (const l of folded.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe(long);
    expect(icsFold('short')).toBe('short');
  });
});
