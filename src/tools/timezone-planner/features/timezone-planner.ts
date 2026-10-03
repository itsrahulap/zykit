// Meeting planner maths: hourly slots for a day, working-hour overlap across zones, a shareable
// text summary and an .ics file. Zone conversion (and so DST) reuses the Timestamp Converter's
// Intl-based helpers; nothing here uses the network.

import { civilIn, civilToMs, formatOffset, localZone, offsetMinutes, timeZones } from '../../timestamp-converter/features/timestamp';
import { CITIES, type City } from './cities';

export { CITIES, type City } from './cities';

export interface Place {
  zone: string;
  label: string;
  /** Working hours as whole hours in the zone's local time: [start, end). */
  start: number;
  end: number;
}

export const DEFAULT_START = 9;
export const DEFAULT_END = 17;
export const MAX_PLACES = 12;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
const HOUR = 3_600_000;

export function isValidZone(zone: string): boolean {
  if (typeof zone !== 'string' || !zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** "America/Argentina/Buenos_Aires" -> "Buenos Aires". */
export function zoneLabel(zone: string): string {
  return zone === 'UTC' ? 'UTC' : (zone.split('/').pop() ?? zone).replace(/_/g, ' ');
}

export function makePlace(zone: string, label?: string): Place {
  return { zone, label: label || zoneLabel(zone), start: DEFAULT_START, end: DEFAULT_END };
}

/** Repairs a place from untrusted input (shared link); null when its zone is unusable. */
export function cleanPlace(p: unknown): Place | null {
  if (typeof p !== 'object' || p === null) return null;
  const o = p as Record<string, unknown>;
  if (typeof o.zone !== 'string' || !isValidZone(o.zone)) return null;
  const hour = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : d);
  return {
    zone: o.zone,
    label: typeof o.label === 'string' && o.label.trim() ? o.label.slice(0, 60) : zoneLabel(o.zone),
    start: hour(o.start, DEFAULT_START, 0, 23),
    end: hour(o.end, DEFAULT_END, 1, 24),
  };
}

export interface SearchHit {
  zone: string;
  label: string;
  detail: string;
}

let zoneCache: string[] | null = null;
/** City names and IANA zone names matching `query`, cities first. */
export function searchPlaces(query: string, limit = 8): SearchHit[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits: SearchHit[] = [];
  const hayOf = (s: string) => s.toLowerCase().replace(/[_/]/g, ' ');
  const score = (name: string) => {
    const n = name.toLowerCase();
    return n === words.join(' ') ? 0 : n.startsWith(words[0]) ? 1 : 2;
  };
  const cities = CITIES.filter((c) => words.every((w) => hayOf(`${c.name} ${c.country}`).includes(w))).sort((a, b) => score(a.name) - score(b.name));
  for (const c of cities) hits.push({ zone: c.zone, label: c.name, detail: `${c.country} · ${c.zone}` });
  zoneCache ??= timeZones();
  for (const z of zoneCache) {
    if (hits.length >= limit * 3) break;
    if (words.every((w) => hayOf(z).includes(w)) && !hits.some((h) => h.zone === z && h.label === zoneLabel(z))) hits.push({ zone: z, label: zoneLabel(z), detail: z });
  }
  return hits.slice(0, limit);
}

export function defaultPlaces(local = localZone()): Place[] {
  const known = (zone: string, fallback: string): Place => {
    const c: City | undefined = CITIES.find((x) => x.zone === zone);
    return makePlace(zone, c?.name ?? fallback);
  };
  const base = [known('America/New_York', 'New York'), known('Europe/London', 'London'), known('Asia/Kolkata', 'Mumbai')];
  if (local && isValidZone(local) && !base.some((p) => p.zone === local) && local !== 'UTC') return [makePlace(local, CITIES.find((c) => c.zone === local)?.name), ...base];
  return base;
}

// ---- slots ----

export interface Cell {
  /** The instant this slot starts. */
  ms: number;
  hour: number;
  minute: number;
  /** Local weekday/day label, e.g. "Wed 4". */
  dayLabel: string;
  /** Local calendar day, "YYYY-MM-DD". */
  day: string;
  working: boolean;
}

export interface Row {
  place: Place;
  cells: Cell[];
  /** UTC offset (minutes) at the first and last slot of the grid. */
  offsetStart: number;
  offsetEnd: number;
}

export interface Grid {
  slots: number[];
  rows: Row[];
  /** Indexes of slots where every place is inside its working hours. */
  overlap: number[];
  /** Hours in the base zone's day: 23 or 25 on a clock-change day. */
  hours: number;
}

export function isWorking(minutes: number, start: number, end: number): boolean {
  const s = start * 60;
  const e = end * 60;
  if (s === e) return false;
  return s < e ? minutes >= s && minutes < e : minutes >= s || minutes < e;
}

/** One hourly slot per hour of `date` ("YYYY-MM-DD") in the first place's zone. */
export function buildGrid(places: Place[], date: string): Grid | null {
  if (!places.length) return null;
  const base = places[0].zone;
  const start = civilToMs(`${date}T00:00`, base);
  const next = nextDay(date);
  if (!start.ok || !next) return null;
  const end = civilToMs(`${next}T00:00`, base);
  if (!end.ok) return null;
  const hours = Math.max(1, Math.round((end.ms - start.ms) / HOUR));
  const slots = Array.from({ length: hours }, (_, i) => start.ms + i * HOUR);
  const rows: Row[] = places.map((place) => ({
    place,
    offsetStart: offsetMinutes(slots[0], place.zone),
    offsetEnd: offsetMinutes(slots[slots.length - 1], place.zone),
    cells: slots.map((ms) => {
      const c = civilIn(ms, place.zone);
      const wd = new Date(Date.UTC(c.year, c.month - 1, c.day)).getUTCDay();
      return {
        ms,
        hour: c.hour,
        minute: c.minute,
        dayLabel: `${WEEKDAYS[wd]} ${c.day}`,
        day: `${c.year}-${pad(c.month)}-${pad(c.day)}`,
        working: isWorking(c.hour * 60 + c.minute, place.start, place.end),
      };
    }),
  }));
  const overlap = slots.map((_, i) => i).filter((i) => rows.every((r) => r.cells[i].working));
  return { slots, rows, overlap, hours };
}

export function nextDay(date: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1));
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function validDate(date: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function todayIn(zone: string, now = Date.now()): string {
  const c = civilIn(now, zone);
  return `${c.year}-${pad(c.month)}-${pad(c.day)}`;
}

/** Contiguous runs of slot indexes, e.g. [2,3,4,7] -> [[2,4],[7,7]]. */
export function runs(indexes: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (const i of indexes) {
    const last = out[out.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else out.push([i, i]);
  }
  return out;
}

export function formatClock(hour: number, minute: number, hour12 = false): string {
  if (!hour12) return `${pad(hour)}:${pad(minute)}`;
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** Overlap in words, e.g. "14:00–16:00 in London (2 hours)", or null when there is none. */
export function describeOverlap(grid: Grid, hour12 = false): string | null {
  if (!grid.overlap.length) return null;
  const base = grid.rows[0];
  const parts = runs(grid.overlap).map(([a, b]) => {
    const from = base.cells[a];
    const toMs = grid.slots[b] + HOUR;
    const to = civilIn(toMs, base.place.zone);
    return `${formatClock(from.hour, from.minute, hour12)}–${formatClock(to.hour, to.minute, hour12)}`;
  });
  const n = grid.overlap.length;
  return `${parts.join(', ')} in ${base.place.label} (${n} hour${n === 1 ? '' : 's'})`;
}

// ---- a chosen moment ----

export interface MomentLine {
  place: Place;
  weekday: string;
  date: string;
  clock: string;
  offset: string;
  /** Whole days from the first place's date: -1, 0, +1. */
  dayShift: number;
  working: boolean;
}

export function momentLines(ms: number, places: Place[], hour12 = false): MomentLine[] {
  const dayNo = (c: { year: number; month: number; day: number }) => Date.UTC(c.year, c.month - 1, c.day) / 86_400_000;
  const first = places.length ? civilIn(ms, places[0].zone) : null;
  return places.map((place) => {
    const c = civilIn(ms, place.zone);
    return {
      place,
      weekday: WEEKDAYS[new Date(Date.UTC(c.year, c.month - 1, c.day)).getUTCDay()],
      date: `${c.day} ${MONTHS[c.month - 1]}`,
      clock: formatClock(c.hour, c.minute, hour12),
      offset: `UTC${formatOffset(offsetMinutes(ms, place.zone))}`,
      dayShift: first ? Math.round(dayNo(c) - dayNo(first)) : 0,
      working: isWorking(c.hour * 60 + c.minute, place.start, place.end),
    };
  });
}

/** "Tue 3 Oct, 15:00 London / 10:00 New York (Wed) / … (14:00 UTC)". */
export function momentText(ms: number, places: Place[], hour12 = false): string {
  if (!places.length) return '';
  const lines = momentLines(ms, places, hour12);
  const [head, ...rest] = lines;
  const utc = civilIn(ms, 'UTC');
  const parts = [`${head.weekday} ${head.date}, ${head.clock} ${head.place.label}`];
  for (const l of rest) parts.push(`${l.clock} ${l.place.label}${l.dayShift ? ` (${l.weekday} ${l.date})` : ''}`);
  return `${parts.join(' / ')} (${formatClock(utc.hour, utc.minute, hour12)} UTC)`;
}

// ---- ICS ----

const icsStamp = (ms: number) => {
  const c = civilIn(ms, 'UTC');
  return `${String(c.year).padStart(4, '0')}${pad(c.month)}${pad(c.day)}T${pad(c.hour)}${pad(c.minute)}${pad(c.second)}Z`;
};

export function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
}

/** Folds a content line at 75 octets with CRLF + space, never splitting a UTF-8 character. */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
      limit = 74; // continuation lines start with a space
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export interface IcsOptions {
  startMs: number;
  durationMin: number;
  title: string;
  places: Place[];
  hour12?: boolean;
  /** DTSTAMP; defaults to now. Pass a fixed value for reproducible output. */
  now?: number;
}

/** A single-event iCalendar file in UTC, with CRLF line endings. */
export function buildIcs(o: IcsOptions): string {
  const end = o.startMs + Math.max(1, o.durationMin) * 60_000;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zykit//Time Zone Meeting Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsStamp(o.startMs)}-${Math.abs(hash(o.title + o.places.map((p) => p.zone).join()))}@zykit.local`,
    `DTSTAMP:${icsStamp(o.now ?? Date.now())}`,
    `DTSTART:${icsStamp(o.startMs)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(o.title.trim() || 'Meeting')}`,
    `DESCRIPTION:${icsEscape(momentText(o.startMs, o.places, o.hour12))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(icsFold).join('\r\n') + '\r\n';
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
