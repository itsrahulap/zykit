// JWT parsing: base64url → UTF-8 → JSON for the header and payload. No verification here.

import { tryBase64ToBytes } from '../../../shared/lib/base64';

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtError';
  }
}

export type JsonObject = Record<string, unknown>;

export interface DecodedJwt {
  /** The three raw segments, as pasted. */
  parts: [string, string, string];
  header: JsonObject;
  payload: JsonObject;
  signature: Uint8Array;
  /** `header.payload`, the bytes the signature covers. */
  signingInput: string;
  alg: string | undefined;
  warnings: string[];
}

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

/** Strict base64url decode; trailing `=` padding is tolerated, whitespace is not. Returns null when invalid. */
export function base64UrlToBytes(input: string): Uint8Array | null {
  if (/\s/.test(input)) return null;
  return tryBase64ToBytes(input.replace(/=+$/, ''), true);
}

/** Trims whitespace (including line breaks inside the token) and a leading "Bearer ". */
export function cleanToken(input: string): string {
  return input.trim().replace(/^bearer\s+/i, '').replace(/\s+/g, '');
}

function decodeJsonSegment(seg: string, name: 'header' | 'payload'): JsonObject {
  const bytes = base64UrlToBytes(seg);
  if (!bytes) throw new JwtError(`The ${name} is not valid base64url. JWT segments use only A–Z, a–z, 0–9, - and _.`);
  let text: string;
  try {
    text = strictUtf8.decode(bytes);
  } catch {
    throw new JwtError(`The ${name} does not decode to UTF-8 text.`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new JwtError(`The ${name} is not valid JSON.`);
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new JwtError(`The ${name} must be a JSON object.`);
  return json as JsonObject;
}

export function decodeJwt(input: string): DecodedJwt {
  const token = cleanToken(input);
  if (!token) throw new JwtError('Paste a token to decode it.');
  const parts = token.split('.');
  if (parts.length === 5) {
    throw new JwtError('This is an encrypted token (JWE, five segments). Its contents cannot be decoded without the decryption key.');
  }
  if (parts.length !== 3) {
    throw new JwtError(`A JWT has three segments separated by dots (header.payload.signature); this one has ${parts.length}.`);
  }
  const header = decodeJsonSegment(parts[0], 'header');
  const payload = decodeJsonSegment(parts[1], 'payload');
  const signature = base64UrlToBytes(parts[2]);
  if (!signature) throw new JwtError('The signature is not valid base64url.');

  const alg = typeof header.alg === 'string' ? header.alg : undefined;
  const warnings: string[] = [];
  if (!alg) warnings.push('The header has no "alg" field.');
  else if (alg.toLowerCase() === 'none') {
    warnings.push('This token is unsigned ("alg": "none"). Anyone can create or change it, so never trust its contents.');
    if (signature.length) warnings.push('It uses "alg": "none" but still carries a signature, which is unusual.');
  }
  if (header.crit !== undefined) warnings.push('The header lists critical extensions ("crit") that this tool does not process.');

  return { parts: parts as [string, string, string], header, payload, signature, signingInput: `${parts[0]}.${parts[1]}`, alg, warnings };
}

/** Sample HS256 token for "Load example". Its secret is EXAMPLE_SECRET. */
export const EXAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Inp5a2l0LWRlbW8iLCJpYXQiOjE3NjcyMjU2MDAsIm5iZiI6MTc2NzIyNTYwMCwiZXhwIjo0MTAyNDQ0ODAwLCJqdGkiOiIzZjFjOWE3ZS1kZW1vIiwiYWRtaW4iOnRydWV9.-vlEFYfAmxhyMaibR5FTs0ZSavl8iYNVCi4WQezknis';
export const EXAMPLE_SECRET = 'your-256-bit-secret';
