// Base64 (RFC 4648) and Base64URL for bytes. Pure JS, so it works on any byte values, not just Latin-1 like btoa.

export class Base64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Base64Error';
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Standard Base64 with `=` padding, or Base64URL (`-` and `_`) without padding when `url` is set. */
export function bytesToBase64(bytes: Uint8Array, url = false): string {
  const abc = url ? B64URL : B64;
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += abc[n >> 18] + abc[(n >> 12) & 63] + abc[(n >> 6) & 63] + abc[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += abc[n >> 18] + abc[(n >> 12) & 63] + (url ? '' : '==');
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += abc[n >> 18] + abc[(n >> 12) & 63] + abc[(n >> 6) & 63] + (url ? '' : '=');
  }
  return out;
}

/** UTF-8 bytes of `text` as Base64 (or Base64URL). */
export function textToBase64(text: string, url = false): string {
  return bytesToBase64(new TextEncoder().encode(text), url);
}

/**
 * Strict decoder. Whitespace is ignored; padding is optional and, if present, must be correct.
 * Throws Base64Error with a message that points at the problem.
 */
export function base64ToBytes(input: string, url = false): Uint8Array {
  const abc = url ? B64URL : B64;
  const s = input.replace(/\s+/g, '');
  const pad = s.match(/=*$/)![0].length;
  const body = s.slice(0, s.length - pad);
  for (let i = 0; i < body.length; i++) {
    if (abc.indexOf(body[i]) < 0) {
      const other = url ? B64 : B64URL;
      const tip = other.includes(body[i])
        ? ` That character belongs to ${url ? 'standard Base64' : 'Base64URL'} — try that codec instead.`
        : '';
      throw new Base64Error(`Invalid ${url ? 'Base64URL' : 'Base64'} character "${body[i]}" at position ${i + 1}.${tip}`);
    }
  }
  if (pad > 2 || (pad > 0 && s.length % 4 !== 0)) throw new Base64Error('Invalid Base64 padding.');
  if (body.length % 4 === 1) throw new Base64Error('Invalid Base64 length: the input is truncated or has an extra character.');

  const out = new Uint8Array(Math.floor((body.length * 3) / 4));
  let o = 0;
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < body.length; i++) {
    buf = (buf << 6) | abc.indexOf(body[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buf >> bits) & 0xff;
    }
  }
  return out;
}

/** Same rules as base64ToBytes, but returns null instead of throwing. */
export function tryBase64ToBytes(input: string, url = false): Uint8Array | null {
  try {
    return base64ToBytes(input, url);
  } catch {
    return null;
  }
}
