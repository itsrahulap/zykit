// Digests and HMACs. SHA comes from WebCrypto; MD5 from the shared pure-JS implementation.

import { bytesToBase64 } from '../../../shared/lib/base64';
import { bytesToHex } from '../../../shared/lib/bytes';
import { md5 } from '../../../shared/lib/hash';

export type HashAlg = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
export type OutputFormat = 'hex' | 'HEX' | 'base64';

export const HASH_ALGS: HashAlg[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
/** Algorithms offered in HMAC mode (WebCrypto HMAC). */
export const HMAC_ALGS: HashAlg[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

/** 200 MB: large enough for most files, small enough to hash in memory. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

const hexToBytes = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16));

export async function digest(alg: HashAlg, data: Uint8Array): Promise<Uint8Array> {
  if (alg === 'MD5') return hexToBytes(md5(data));
  return new Uint8Array(await crypto.subtle.digest(alg, data as Uint8Array<ArrayBuffer>));
}

export async function hmac(alg: Exclude<HashAlg, 'MD5'>, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as Uint8Array<ArrayBuffer>, { name: 'HMAC', hash: alg }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data as Uint8Array<ArrayBuffer>));
}

export function formatDigest(bytes: Uint8Array, format: OutputFormat): string {
  if (format === 'base64') return bytesToBase64(bytes);
  const hex = bytesToHex(bytes);
  return format === 'HEX' ? hex.toUpperCase() : hex;
}

export interface HashRequest {
  data: Uint8Array;
  /** When set, compute HMACs with this key instead of plain digests. */
  hmacKey?: Uint8Array;
}

/** Computes every applicable algorithm. MD5 is omitted in HMAC mode. */
export async function computeAll({ data, hmacKey }: HashRequest): Promise<Partial<Record<HashAlg, Uint8Array>>> {
  const algs = hmacKey ? HMAC_ALGS : HASH_ALGS;
  const values = await Promise.all(
    algs.map((a) => (hmacKey ? hmac(a as Exclude<HashAlg, 'MD5'>, hmacKey, data) : digest(a, data))),
  );
  return Object.fromEntries(algs.map((a, i) => [a, values[i]]));
}
