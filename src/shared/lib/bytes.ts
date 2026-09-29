// Low-level helpers for reading binary image containers.
// Every reader is bounds-checked by its caller; these helpers assume valid offsets.

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export const readU16BE = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
export const readU16LE = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
export const readU24LE = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
export const readU32BE = (b: Uint8Array, o: number) =>
  ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
export const readU32LE = (b: Uint8Array, o: number) =>
  b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0);

export function writeU32BE(b: Uint8Array, o: number, v: number) {
  b[o] = (v >>> 24) & 0xff;
  b[o + 1] = (v >>> 16) & 0xff;
  b[o + 2] = (v >>> 8) & 0xff;
  b[o + 3] = v & 0xff;
}

export function writeU32LE(b: Uint8Array, o: number, v: number) {
  b[o] = v & 0xff;
  b[o + 1] = (v >>> 8) & 0xff;
  b[o + 2] = (v >>> 16) & 0xff;
  b[o + 3] = (v >>> 24) & 0xff;
}

/** Reads `len` bytes as an ASCII/Latin-1 string (for FourCCs and signatures). */
export function ascii(b: Uint8Array, start: number, len: number): string {
  let s = '';
  const end = Math.min(b.length, start + len);
  for (let i = start; i < end; i++) s += String.fromCharCode(b[i]);
  return s;
}

export function matchAscii(b: Uint8Array, o: number, sig: string): boolean {
  if (o + sig.length > b.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (b[o + i] !== sig.charCodeAt(i)) return false;
  }
  return true;
}

export function indexOfByte(b: Uint8Array, value: number, from = 0, to = b.length): number {
  for (let i = from; i < Math.min(to, b.length); i++) if (b[i] === value) return i;
  return -1;
}

/** Latin-1 decode in chunks so huge buffers don't blow the argument limit. */
export function latin1(b: Uint8Array): string {
  const CHUNK = 0x8000;
  let s = '';
  for (let i = 0; i < b.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + CHUNK)));
  }
  return s;
}

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

/** Decodes as UTF-8 when valid, otherwise falls back to Latin-1. */
export function decodeText(b: Uint8Array): string {
  try {
    return strictUtf8.decode(b);
  } catch {
    return latin1(b);
  }
}

export function concat(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function containsAscii(b: Uint8Array, needle: string): boolean {
  const first = needle.charCodeAt(0);
  for (let i = 0; i <= b.length - needle.length; i++) {
    if (b[i] === first && matchAscii(b, i, needle)) return true;
  }
  return false;
}

/** Lowercase hex, two digits per byte, joined with `sep`. */
export function bytesToHex(b: Uint8Array, sep = ''): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(sep);
}

/** Space-separated hex of the first `max` bytes, with an ellipsis when truncated. */
export function toHex(b: Uint8Array, max = 16): string {
  return bytesToHex(b.subarray(0, max), ' ') + (b.length > max ? ' …' : '');
}
