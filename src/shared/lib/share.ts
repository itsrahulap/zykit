// Shareable links: a tool's input and options, as JSON, compressed (deflate-raw) and
// Base64URL-encoded into the URL fragment: #s=<tag><data>. Fragments are never sent to a
// server. The tag is 'd' for deflate-raw, 'j' for plain JSON (no CompressionStream).
// Decoding treats the fragment as hostile: size-capped, and any failure gives null.

import { bytesToBase64, tryBase64ToBytes } from './base64';

export const SHARE_PARAM = 's';
/** Longest fragment we produce or accept (characters after "#s="). */
export const MAX_SHARE_CHARS = 16 * 1024;
/** Cap on the decompressed JSON, so a tiny fragment can't inflate into something huge. */
export const MAX_SHARE_JSON_BYTES = 1024 * 1024;

export type ShareState = Record<string, unknown>;

const canCompress = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

async function pipe(bytes: Uint8Array, stream: TransformStream<Uint8Array, Uint8Array>, limit: number): Promise<Uint8Array | null> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** Encodes state for the fragment (without "#s="). */
export async function encodeShare(state: ShareState, { compress = canCompress() } = {}): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(state));
  if (compress) {
    const packed = await pipe(json, new CompressionStream('deflate-raw') as TransformStream<Uint8Array, Uint8Array>, Infinity);
    if (packed) return 'd' + bytesToBase64(packed, true);
  }
  return 'j' + bytesToBase64(json, true);
}

/** Decodes a fragment payload; null for anything malformed, oversized or not a plain object. */
export async function decodeShare(payload: string): Promise<ShareState | null> {
  try {
    if (!payload || payload.length > MAX_SHARE_CHARS + 1) return null;
    const bytes = tryBase64ToBytes(payload.slice(1), true);
    if (!bytes) return null;
    let json: Uint8Array | null;
    if (payload[0] === 'd') {
      if (!canCompress()) return null;
      json = await pipe(bytes, new DecompressionStream('deflate-raw') as TransformStream<Uint8Array, Uint8Array>, MAX_SHARE_JSON_BYTES);
    } else if (payload[0] === 'j') {
      json = bytes.length <= MAX_SHARE_JSON_BYTES ? bytes : null;
    } else return null;
    if (!json) return null;
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as ShareState;
  } catch {
    return null;
  }
}

/** The share payload in a location hash ("#s=…"), if any. */
export function shareFromHash(hash: string): string | null {
  const m = /^#?s=([A-Za-z0-9_-]+)$/.exec(hash);
  return m ? m[1] : null;
}

export type ShareLink = { ok: true; url: string } | { ok: false; reason: 'too-large' };

export async function buildShareLink(state: ShareState, base: string): Promise<ShareLink> {
  const payload = await encodeShare(state);
  if (payload.length > MAX_SHARE_CHARS) return { ok: false, reason: 'too-large' };
  const url = new URL(base);
  url.hash = `${SHARE_PARAM}=${payload}`;
  return { ok: true, url: url.href };
}

/**
 * Keeps only the fields of `incoming` whose type matches the page's current value for that key
 * (and, for keys listed in `choices`, one of the allowed values). Unknown keys are dropped.
 */
export function sanitizeShare<T extends ShareState>(incoming: ShareState, current: T, choices: Partial<Record<keyof T, readonly unknown[]>> = {}): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T & string)[]) {
    if (!Object.prototype.hasOwnProperty.call(incoming, key)) continue;
    const v = incoming[key];
    const cur = current[key];
    const sameType = Array.isArray(cur) ? Array.isArray(v) : typeof v === typeof cur && (v === null) === (cur === null);
    if (!sameType) continue;
    const allowed = choices[key];
    if (allowed && !allowed.includes(v)) continue;
    out[key] = v as T[typeof key];
  }
  return out;
}
