// Value validators for the structured-data fields. Pure functions, no DOM.

export type Kind =
  | 'text' | 'textarea' | 'url' | 'urls' | 'lines' | 'date' | 'datetime' | 'duration' | 'number' | 'price'
  | 'currency' | 'select' | 'email' | 'tel' | 'time' | 'days' | 'bool';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function isUrl(s: string): boolean {
  if (/\s/.test(s)) return false;
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname;
  } catch {
    return false;
  }
}

function validDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** ISO 8601 calendar date: YYYY-MM-DD, checked against the real calendar. */
export function isIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return !!m && validDate(+m[1], +m[2], +m[3]);
}

/** ISO 8601 date or date-time (seconds, fraction and zone optional). */
export function isIsoDateTime(s: string): boolean {
  if (isIsoDate(s)) return true;
  const m = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,9})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.exec(s);
  return !!m && validDate(+m[1], +m[2], +m[3]);
}

/** ISO 8601 duration such as PT1H30M, P1DT12H or P2W. */
export function isIsoDuration(s: string): boolean {
  return s !== 'P' && /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/.test(s);
}

export const isPrice = (s: string) => /^\d+(?:\.\d{1,6})?$/.test(s);
export const isCurrency = (s: string) => /^[A-Z]{3}$/.test(s);
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isTime = (s: string) => /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(s);
export const isTel = (s: string) => /^\+?[\d\s().-]{5,25}$/.test(s) && (s.match(/\d/g)?.length ?? 0) >= 5;
export const isNumber = (s: string) => s.trim() !== '' && Number.isFinite(Number(s));

/** Returns an error message for one value of the given kind, or null when it is fine. */
export function validateValue(kind: Kind, v: string): string | null {
  switch (kind) {
    case 'url':
    case 'urls':
      return isUrl(v) ? null : 'must be a full http(s) URL such as https://example.com/page';
    case 'date':
      return isIsoDate(v) ? null : 'use the ISO date format YYYY-MM-DD, e.g. 2025-03-31';
    case 'datetime':
      return isIsoDateTime(v) ? null : 'use ISO 8601, e.g. 2025-03-31 or 2025-03-31T09:00:00+01:00';
    case 'duration':
      return isIsoDuration(v) ? null : 'use an ISO 8601 duration such as PT30M, PT1H30M or P1DT2H';
    case 'number':
      return isNumber(v) ? null : 'must be a number';
    case 'price':
      return isPrice(v) ? null : 'must be a plain number with a dot decimal, like 19.99 (no currency symbol or thousands separator)';
    case 'currency':
      return isCurrency(v) ? null : 'must be a 3-letter ISO 4217 code in capitals, like USD';
    case 'email':
      return isEmail(v) ? null : 'must be an email address';
    case 'tel':
      return isTel(v) ? null : 'must be a phone number, e.g. +1-555-010-1234';
    case 'time':
      return isTime(v) ? null : 'use 24-hour HH:MM, e.g. 09:00';
    case 'days':
      return DAYS.includes(v) ? null : `must be a weekday name (${DAYS[0]}…${DAYS[6]}), comma-separated for several`;
    case 'bool':
      return v === 'true' || v === 'false' ? null : 'must be true or false';
    default:
      return null;
  }
}

/** Splits a field's raw text into its separate values. */
export function splitValues(kind: Kind, raw: string): string[] {
  const parts = kind === 'urls' || kind === 'lines' ? raw.split(/\r?\n/) : kind === 'days' ? raw.split(',') : [raw];
  return parts.map((p) => p.trim()).filter(Boolean);
}
