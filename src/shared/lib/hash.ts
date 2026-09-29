// File fingerprints shown in the Technical tab. Computed locally, never sent anywhere.

import { bytesToHex } from './bytes';
import { crc32 } from './crc32';

export interface FileChecksums {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  crc32: string;
  adler32: string;
}

export function adler32(b: Uint8Array): number {
  let a = 1;
  let s = 0;
  const MOD = 65521;
  // Process in blocks so sums stay within safe integer range before the modulo.
  for (let i = 0; i < b.length; ) {
    const end = Math.min(i + 3800, b.length);
    for (; i < end; i++) {
      a += b[i];
      s += a;
    }
    a %= MOD;
    s %= MOD;
  }
  return ((s << 16) | a) >>> 0;
}

// ---- MD5 (RFC 1321). WebCrypto doesn't provide it.
const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(input: Uint8Array): string {
  const bitLen = input.length * 8;
  const padded = new Uint8Array((((input.length + 8) >> 6) + 1) << 6);
  padded.set(input);
  padded[input.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLen >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const M = new Uint32Array(16);
  for (let off = 0; off < padded.length; off += 64) {
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  [a0, b0, c0, d0].forEach((v, i) => ov.setUint32(i * 4, v, true));
  return bytesToHex(out);
}

export async function computeChecksums(b: Uint8Array): Promise<FileChecksums> {
  const data = b as Uint8Array<ArrayBuffer>;
  const [sha1, sha256, sha512] = await Promise.all(
    ['SHA-1', 'SHA-256', 'SHA-512'].map(async (alg) => bytesToHex(new Uint8Array(await crypto.subtle.digest(alg, data)))),
  );
  return {
    md5: md5(b),
    sha1,
    sha256,
    sha512,
    crc32: crc32(b).toString(16).padStart(8, '0'),
    adler32: adler32(b).toString(16).padStart(8, '0'),
  };
}

export function headHex(b: Uint8Array, n = 64): string {
  return bytesToHex(b.subarray(0, n), ' ');
}

/** Printable ASCII with dots for everything else, 32 bytes per line. */
export function headAscii(b: Uint8Array, n = 128): string {
  const chars = Array.from(b.subarray(0, n), (x) => (x >= 0x20 && x < 0x7f ? String.fromCharCode(x) : '.'));
  const lines: string[] = [];
  for (let i = 0; i < chars.length; i += 32) lines.push(chars.slice(i, i + 32).join(''));
  return lines.join('\n');
}
