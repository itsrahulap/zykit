// Calendar-date age maths. Dates are plain YYYY-MM-DD values handled in UTC, so time zones and DST never shift a day.

export interface YMD {
  y: number;
  m: number; // 1–12
  d: number;
}

export interface Age {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  totalHours: number;
  bornOn: string; // weekday name
  nextBirthday: { date: string; daysUntil: number; turning: number };
}

const DAY = 86_400_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function parseDate(s: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const v = { y: +m[1], m: +m[2], d: +m[3] };
  return v.m >= 1 && v.m <= 12 && v.d >= 1 && v.d <= daysInMonth(v.y, v.m) ? v : null;
}

export const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const utc = (v: YMD) => Date.UTC(v.y, v.m - 1, v.d);
const fmt = (v: YMD) => `${v.y}-${String(v.m).padStart(2, '0')}-${String(v.d).padStart(2, '0')}`;

/** Birthday in a given year. A 29 February birthday falls on 28 February in non-leap years. */
export function birthdayIn(birth: YMD, year: number): YMD {
  return birth.m === 2 && birth.d === 29 && !isLeap(year) ? { y: year, m: 2, d: 28 } : { y: year, m: birth.m, d: birth.d };
}

export function age(birth: YMD, at: YMD): Age | null {
  if (utc(at) < utc(birth)) return null;
  let years = at.y - birth.y;
  let months = at.m - birth.m;
  let days = at.d - birth.d;
  if (days < 0) {
    // Count from the birth day in the month before "at", clamped to that month's length,
    // so 31 Jan → 1 Mar is 1 month 1 day (31 Jan → 28 Feb → 1 Mar).
    months -= 1;
    const dim = daysInMonth(at.m === 1 ? at.y - 1 : at.y, at.m === 1 ? 12 : at.m - 1);
    days = at.d + Math.max(dim - birth.d, 0);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.round((utc(at) - utc(birth)) / DAY);
  let next = birthdayIn(birth, at.y);
  if (utc(next) < utc(at)) next = birthdayIn(birth, at.y + 1);
  return {
    years,
    months,
    days,
    totalMonths: years * 12 + months,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    totalHours: totalDays * 24,
    bornOn: WEEKDAYS[new Date(utc(birth)).getUTCDay()],
    nextBirthday: { date: fmt(next), daysUntil: Math.round((utc(next) - utc(at)) / DAY), turning: next.y - birth.y },
  };
}

export const todayISO = (now = new Date()) =>
  fmt({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
