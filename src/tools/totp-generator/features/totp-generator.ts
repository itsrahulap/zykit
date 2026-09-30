// RFC 4226 HOTP and RFC 6238 TOTP on WebCrypto HMAC, plus RFC 4648 Base32 and otpauth:// URIs.
// Pure logic (no DOM): runs in the browser and in Node's WebCrypto for tests.

export type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';
export type OtpType = 'totp' | 'hotp';

export const ALGORITHMS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-512'];

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class Base32Error extends Error {}

/** RFC 4648 Base32, tolerant of spaces, hyphens, lowercase and (optional) '=' padding. */
export function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.replace(/[\s-]/g, '').toUpperCase().replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let o = 0;
  for (let i = 0; i < clean.length; i++) {
    const v = B32.indexOf(clean[i]);
    if (v < 0) {
      throw new Base32Error(
        clean[i] === '='
          ? 'Padding "=" is only allowed at the end.'
          : `"${clean[i]}" is not a Base32 character (use A–Z and 2–7).`,
      );
    }
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (value >>> bits) & 0xff;
    }
  }
  // A valid length leaves 0, 2, 3, 4 or 7 characters' worth of partial bits (never 1, 3 or 6 chars).
  const rem = clean.length % 8;
  if (rem === 1 || rem === 3 || rem === 6) throw new Base32Error('The secret has an invalid length for Base32.');
  return out;
}

export function base32Encode(bytes: Uint8Array, pad = false): string {
  let out = '';
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(value >>> bits) & 31];
    }
    value &= 0xff; // keep only the unread bits (at most 4 remain after the loop)
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  if (pad) while (out.length % 8) out += '=';
  return out;
}

export interface OtpParams {
  algorithm: Algorithm;
  digits: number;
}

/** 8-byte big-endian counter (safe for counters up to 2^53). */
function counterBytes(counter: number): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(8);
  const hi = Math.floor(counter / 2 ** 32);
  const lo = counter >>> 0;
  new DataView(b.buffer).setUint32(0, hi);
  new DataView(b.buffer).setUint32(4, lo);
  return b;
}

const keyCache = new WeakMap<Uint8Array, Map<Algorithm, Promise<CryptoKey>>>();

function hmacKey(key: Uint8Array<ArrayBuffer>, algorithm: Algorithm): Promise<CryptoKey> {
  let byAlg = keyCache.get(key);
  if (!byAlg) keyCache.set(key, (byAlg = new Map()));
  let k = byAlg.get(algorithm);
  if (!k) {
    k = crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: algorithm }, false, ['sign']);
    byAlg.set(algorithm, k);
  }
  return k;
}

/** RFC 4226 HOTP: HMAC(key, counter) → dynamic truncation → `digits` decimal digits. */
export async function hotp(key: Uint8Array<ArrayBuffer>, counter: number, { algorithm, digits }: OtpParams): Promise<string> {
  if (!Number.isSafeInteger(counter) || counter < 0) throw new RangeError('The counter must be a non-negative integer.');
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(key, algorithm), counterBytes(counter)));
  const off = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

/** RFC 6238 time step for a Unix time in milliseconds. */
export function timeCounter(ms: number, period: number, t0 = 0): number {
  return Math.floor((Math.floor(ms / 1000) - t0) / period);
}

export function secondsRemaining(ms: number, period: number): number {
  return period - (Math.floor(ms / 1000) % period);
}

export async function totp(key: Uint8Array<ArrayBuffer>, ms: number, params: OtpParams & { period: number }): Promise<string> {
  return hotp(key, timeCounter(ms, params.period), params);
}

/**
 * Checks `code` against counters `counter - window … counter + window`.
 * Returns the matching offset (0 = current step), or null.
 */
export async function verifyCode(
  key: Uint8Array<ArrayBuffer>,
  code: string,
  counter: number,
  window: number,
  params: OtpParams,
): Promise<number | null> {
  const c = code.replace(/\s/g, '');
  if (!/^\d+$/.test(c) || c.length !== params.digits) return null;
  // Current step first, then outward, so the closest match wins.
  const offsets = [0];
  for (let i = 1; i <= window; i++) offsets.push(-i, i);
  for (const o of offsets) {
    if (counter + o < 0) continue;
    if ((await hotp(key, counter + o, params)) === c) return o;
  }
  return null;
}

export interface OtpAuth {
  type: OtpType;
  secret: string;
  issuer: string;
  account: string;
  algorithm: Algorithm;
  digits: number;
  period: number;
  counter: number;
}

export const DEFAULT_OTP: OtpAuth = {
  type: 'totp',
  secret: '',
  issuer: '',
  account: '',
  algorithm: 'SHA-1',
  digits: 6,
  period: 30,
  counter: 0,
};

export type ParsedUri = { ok: true; value: OtpAuth; warnings: string[] } | { ok: false; error: string };

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Parses otpauth://totp/Issuer:account?secret=…&issuer=…&algorithm=…&digits=…&period=…(&counter=…). */
export function parseOtpauth(uri: string): ParsedUri {
  const m = /^otpauth:\/\/([a-z]+)\/([^?#]*)(?:\?([^#]*))?/i.exec(uri.trim());
  if (!m) return { ok: false, error: 'Not an otpauth:// URI.' };
  const type = m[1].toLowerCase();
  if (type !== 'totp' && type !== 'hotp') return { ok: false, error: `Unknown OTP type "${m[1]}" (expected totp or hotp).` };
  const warnings: string[] = [];
  const label = safeDecode(m[2]);
  const colon = label.indexOf(':');
  const labelIssuer = colon >= 0 ? label.slice(0, colon).trim() : '';
  const account = (colon >= 0 ? label.slice(colon + 1) : label).trim();
  const q = new URLSearchParams(m[3] ?? '');
  const secret = (q.get('secret') ?? '').replace(/\s/g, '');
  if (!secret) return { ok: false, error: 'The URI has no secret parameter.' };
  try {
    base32Decode(secret);
  } catch (e) {
    return { ok: false, error: `The secret is not valid Base32: ${(e as Error).message}` };
  }
  const issuer = q.get('issuer')?.trim() || labelIssuer;
  if (labelIssuer && q.get('issuer') && q.get('issuer')!.trim() !== labelIssuer)
    warnings.push(`The label issuer "${labelIssuer}" differs from the issuer parameter "${q.get('issuer')}".`);

  const algRaw = (q.get('algorithm') ?? 'SHA1').toUpperCase().replace('-', '');
  const algorithm = ({ SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' } as Record<string, Algorithm>)[algRaw];
  if (!algorithm) return { ok: false, error: `Unsupported algorithm "${q.get('algorithm')}".` };
  if (algorithm !== 'SHA-1') warnings.push(`Many authenticator apps ignore algorithm=${algRaw} and always use SHA1.`);

  const digits = q.has('digits') ? Number(q.get('digits')) : 6;
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) return { ok: false, error: 'digits must be 6, 7 or 8.' };
  const period = q.has('period') ? Number(q.get('period')) : 30;
  if (!Number.isInteger(period) || period < 1 || period > 3600) return { ok: false, error: 'period must be a whole number of seconds.' };
  const counter = q.has('counter') ? Number(q.get('counter')) : 0;
  if (!Number.isSafeInteger(counter) || counter < 0) return { ok: false, error: 'counter must be a non-negative integer.' };
  if (type === 'hotp' && !q.has('counter')) warnings.push('HOTP URIs should include a counter parameter; using 0.');

  return { ok: true, value: { type, secret: secret.toUpperCase(), issuer, account, algorithm, digits, period, counter }, warnings };
}

/** Builds an otpauth:// URI (Key Uri Format) that authenticator apps can import. */
export function buildOtpauth(o: OtpAuth): string {
  const label = o.issuer ? `${encodeURIComponent(o.issuer)}:${encodeURIComponent(o.account)}` : encodeURIComponent(o.account);
  const params = [`secret=${o.secret.replace(/[\s=-]/g, '').toUpperCase()}`];
  if (o.issuer) params.push(`issuer=${encodeURIComponent(o.issuer)}`);
  params.push(`algorithm=${o.algorithm.replace('-', '')}`, `digits=${o.digits}`);
  if (o.type === 'totp') params.push(`period=${o.period}`);
  else params.push(`counter=${o.counter}`);
  return `otpauth://${o.type}/${label}?${params.join('&')}`;
}

/** A new random 160-bit secret (the RFC 4226 recommended length), Base32-encoded. */
export function generateSecret(bytes = 20): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Groups a Base32 secret in blocks of four for easier reading. */
export function groupSecret(secret: string): string {
  return secret.replace(/[\s=-]/g, '').toUpperCase().replace(/(.{4})(?=.)/g, '$1 ');
}
