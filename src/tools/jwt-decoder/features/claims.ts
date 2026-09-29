// Registered claims (RFC 7519 §4.1): explanations, timing and token status relative to `now`.

import type { JsonObject } from './jwt';

export type TokenStatus = 'valid' | 'expired' | 'not-yet-valid';

export interface ClaimRow {
  name: string;
  label: string;
  description: string;
  /** Display value (JSON for non-strings). */
  value: string;
  /** For time claims holding a valid NumericDate. */
  time?: { ms: number; date: string; relative: string };
  note?: string;
}

export const KNOWN_CLAIMS: Record<string, { label: string; description: string; time?: boolean }> = {
  iss: { label: 'Issuer', description: 'Who created and signed the token.' },
  sub: { label: 'Subject', description: 'Who the token is about, usually a user ID.' },
  aud: { label: 'Audience', description: 'Who the token is intended for. Recipients should reject tokens not meant for them.' },
  exp: { label: 'Expires at', description: 'The token must not be accepted on or after this time.', time: true },
  nbf: { label: 'Not before', description: 'The token must not be accepted before this time.', time: true },
  iat: { label: 'Issued at', description: 'When the token was issued.', time: true },
  jti: { label: 'JWT ID', description: 'A unique identifier, often used to prevent replay.' },
};

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86400],
  ['month', 30 * 86400],
  ['week', 7 * 86400],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

/** "in 3 hours", "2 days ago". */
export function relativeTime(targetMs: number, nowMs: number): string {
  const diff = (targetMs - nowMs) / 1000;
  const abs = Math.abs(diff);
  if (abs < 1) return 'now';
  for (const [unit, secs] of UNITS) {
    if (abs >= secs || unit === 'second') return rtf.format(Math.round(diff / secs), unit);
  }
  return 'now';
}

const isNumericDate = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function describeClaims(payload: JsonObject, now: number): ClaimRow[] {
  const rows: ClaimRow[] = [];
  for (const [name, meta] of Object.entries(KNOWN_CLAIMS)) {
    if (!(name in payload)) continue;
    const raw = payload[name];
    const row: ClaimRow = { name, label: meta.label, description: meta.description, value: typeof raw === 'string' ? raw : JSON.stringify(raw) };
    if (meta.time) {
      if (isNumericDate(raw)) {
        const ms = raw * 1000;
        const d = new Date(ms);
        if (!Number.isNaN(d.getTime())) {
          row.time = { ms, date: d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'long' }), relative: relativeTime(ms, now) };
          if (raw > 1e11) row.note = 'This looks like milliseconds; JWT times should be in seconds.';
        }
      } else {
        row.note = 'Not a NumericDate (seconds since 1970) as the JWT spec requires.';
      }
    }
    rows.push(row);
  }
  return rows;
}

/** Status from exp/nbf. Tokens with no time claims are reported as valid. */
export function tokenStatus(payload: JsonObject, now: number): TokenStatus {
  const { exp, nbf } = payload;
  if (isNumericDate(exp) && now >= exp * 1000) return 'expired';
  if (isNumericDate(nbf) && now < nbf * 1000) return 'not-yet-valid';
  return 'valid';
}
