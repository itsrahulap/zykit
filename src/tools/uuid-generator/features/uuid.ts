// UUID generation (v4, v7) and inspection. Pure logic, no DOM.

import { bytesToHex } from '../../../shared/lib/bytes';

export type UuidVersion = 4 | 7;

export interface FormatOptions {
  uppercase?: boolean;
  hyphens?: boolean;
  braces?: boolean;
}

export const MIN_COUNT = 1;
export const MAX_COUNT = 1000;

type RandomFill = (bytes: Uint8Array<ArrayBuffer>) => Uint8Array;
const defaultFill: RandomFill = (bytes) => crypto.getRandomValues(bytes);

function toHex(bytes: Uint8Array): string {
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Random UUID (RFC 9562 version 4). */
export function uuidV4(fill: RandomFill = defaultFill): string {
  if (fill === defaultFill && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = fill(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return toHex(b);
}

/**
 * Creates a v7 generator: 48-bit Unix ms timestamp, then a 12-bit counter (rand_a) that is
 * seeded randomly each millisecond and incremented for UUIDs created in the same millisecond,
 * so output is strictly increasing (RFC 9562 §6.2, method 1). If the counter overflows, or the
 * clock goes backwards, the timestamp is advanced by one millisecond instead.
 */
export function createV7Generator(now: () => number = Date.now, fill: RandomFill = defaultFill) {
  let lastMs = -1;
  let counter = 0;
  return function uuidV7(): string {
    let ms = Math.floor(now());
    if (ms > lastMs) {
      const r = fill(new Uint8Array(2));
      counter = ((r[0] << 8) | r[1]) & 0x7ff; // top bit clear leaves room to count upward
      lastMs = ms;
    } else {
      counter++;
      if (counter > 0xfff) {
        lastMs++;
        const r = fill(new Uint8Array(2));
        counter = ((r[0] << 8) | r[1]) & 0x7ff;
      }
      ms = lastMs;
    }
    const b = fill(new Uint8Array(16));
    // 48-bit big-endian timestamp (split to stay within safe integer bit ops).
    const hi = Math.floor(ms / 2 ** 32);
    const lo = ms >>> 0;
    b[0] = (hi >>> 8) & 0xff;
    b[1] = hi & 0xff;
    b[2] = (lo >>> 24) & 0xff;
    b[3] = (lo >>> 16) & 0xff;
    b[4] = (lo >>> 8) & 0xff;
    b[5] = lo & 0xff;
    b[6] = 0x70 | ((counter >>> 8) & 0x0f);
    b[7] = counter & 0xff;
    b[8] = (b[8] & 0x3f) | 0x80;
    return toHex(b);
  };
}

const sharedV7 = createV7Generator();

export function clampCount(n: number): number {
  if (!Number.isFinite(n)) return MIN_COUNT;
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.floor(n)));
}

export function generate(version: UuidVersion, count: number, gen: () => string = version === 7 ? sharedV7 : () => uuidV4()): string[] {
  const n = clampCount(count);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(gen());
  return out;
}

export function formatUuid(uuid: string, { uppercase = false, hyphens = true, braces = false }: FormatOptions = {}): string {
  let s = hyphens ? uuid : uuid.replace(/-/g, '');
  if (uppercase) s = s.toUpperCase();
  return braces ? `{${s}}` : s;
}

export type Variant = 'NCS (reserved)' | 'RFC 9562' | 'Microsoft (reserved)' | 'Future (reserved)';

export type Inspection =
  | { ok: false; error: string }
  | {
      ok: true;
      canonical: string;
      version: number;
      variant: Variant;
      kind: string;
      /** Embedded creation time for v1, v6 and v7, in Unix milliseconds. */
      timestampMs?: number;
    };

const VERSION_NAMES: Record<number, string> = {
  1: 'Time-based (Gregorian, MAC)',
  2: 'DCE Security',
  3: 'Name-based (MD5)',
  4: 'Random',
  5: 'Name-based (SHA-1)',
  6: 'Reordered time-based',
  7: 'Unix time-ordered',
  8: 'Custom',
};

/** 100-ns intervals between 1582-10-15 and 1970-01-01. */
const GREGORIAN_OFFSET = BigInt('122192928000000000');

export function inspectUuid(input: string): Inspection {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Paste a UUID to inspect it.' };
  const stripped = raw.replace(/^urn:uuid:/i, '').replace(/^\{(.*)\}$/, '$1');
  const hex = stripped.replace(/-/g, '');
  const hyphenOk = !stripped.includes('-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stripped);
  if (!/^[0-9a-f]{32}$/i.test(hex) || !hyphenOk) {
    return {
      ok: false,
      error: 'Not a valid UUID. Expected 32 hex digits, optionally as 8-4-4-4-12 with hyphens.',
    };
  }
  const h = hex.toLowerCase();
  const canonical = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  if (/^0{32}$/.test(h))
    return {
      ok: true,
      canonical,
      version: 0,
      variant: 'NCS (reserved)',
      kind: 'Nil UUID',
    };
  if (/^f{32}$/.test(h))
    return {
      ok: true,
      canonical,
      version: 15,
      variant: 'Future (reserved)',
      kind: 'Max UUID',
    };

  const version = parseInt(h[12], 16);
  const v = parseInt(h[16], 16);
  const variant: Variant = v < 8 ? 'NCS (reserved)' : v < 12 ? 'RFC 9562' : v < 14 ? 'Microsoft (reserved)' : 'Future (reserved)';
  const kind = variant === 'RFC 9562' ? (VERSION_NAMES[version] ?? 'Unknown version') : 'Non-RFC variant';

  let timestampMs: number | undefined;
  if (variant === 'RFC 9562') {
    if (version === 7) timestampMs = parseInt(h.slice(0, 12), 16);
    else if (version === 1 || version === 6) {
      const t60 = version === 1 ? BigInt(`0x${h.slice(13, 16)}${h.slice(8, 12)}${h.slice(0, 8)}`) : BigInt(`0x${h.slice(0, 12)}${h.slice(13, 16)}`);
      timestampMs = Number((t60 - GREGORIAN_OFFSET) / BigInt(10000));
    }
  }
  return { ok: true, canonical, version, variant, kind, timestampMs };
}
