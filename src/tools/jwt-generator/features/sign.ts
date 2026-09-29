// JWS signing with WebCrypto. Keys are imported, generated and used only on this device.

import { bytesToBase64, textToBase64, tryBase64ToBytes } from '../../../shared/lib/base64';

export class SignError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignError';
  }
}

export const ALGORITHMS = [
  'HS256', 'HS384', 'HS512',
  'RS256', 'RS384', 'RS512',
  'PS256', 'PS384', 'PS512',
  'ES256', 'ES384', 'ES512',
  'EdDSA',
] as const;
export type Alg = (typeof ALGORITHMS)[number];

type Family = 'HS' | 'RS' | 'PS' | 'ES' | 'Ed';
type Hash = 'SHA-256' | 'SHA-384' | 'SHA-512';

export interface AlgInfo {
  family: Family;
  hash: Hash;
  bytes: number;
  curve?: 'P-256' | 'P-384' | 'P-521';
}

export function algInfo(alg: Alg): AlgInfo {
  if (alg === 'EdDSA') return { family: 'Ed', hash: 'SHA-512', bytes: 64 };
  const family = alg.slice(0, 2) as Family;
  const bits = alg.slice(2) as '256' | '384' | '512';
  const curve = family === 'ES' ? ({ '256': 'P-256', '384': 'P-384', '512': 'P-521' } as const)[bits] : undefined;
  return { family, hash: `SHA-${bits}` as Hash, bytes: Number(bits) / 8, curve };
}

export const describeAlg = (alg: Alg): string => {
  const i = algInfo(alg);
  switch (i.family) {
    case 'HS':
      return `HMAC with ${i.hash}`;
    case 'RS':
      return `RSA PKCS#1 v1.5 with ${i.hash}`;
    case 'PS':
      return `RSA-PSS with ${i.hash}`;
    case 'ES':
      return `ECDSA ${i.curve} with ${i.hash}`;
    default:
      return 'Ed25519';
  }
};

// ---------- base64 ----------

const bytesToBase64Url = (b: Uint8Array) => bytesToBase64(b, true);
const textToBase64Url = (s: string) => textToBase64(s, true);

/** Standard or URL-safe Base64, padding optional. Null when invalid. */
export function base64ToBytes(input: string): Uint8Array | null {
  const s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  return tryBase64ToBytes(s);
}

// ---------- keys ----------

export type SignKey = { kind: 'secret'; secret: string; base64: boolean } | { kind: 'private'; text: string };

const PEM = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/;

function importParams(alg: Alg): RsaHashedImportParams | EcKeyImportParams | Algorithm {
  const i = algInfo(alg);
  if (i.family === 'ES') return { name: 'ECDSA', namedCurve: i.curve! };
  if (i.family === 'Ed') return { name: 'Ed25519' };
  return { name: i.family === 'RS' ? 'RSASSA-PKCS1-v1_5' : 'RSA-PSS', hash: i.hash };
}

const expectedKty = (alg: Alg) => ({ RS: 'RSA', PS: 'RSA', ES: 'EC', Ed: 'OKP', HS: 'oct' })[algInfo(alg).family];

export async function importPrivateKey(text: string, alg: Alg): Promise<CryptoKey> {
  const t = text.trim();
  const i = algInfo(alg);
  if (!t) throw new SignError('Paste a private key (PKCS#8 PEM or JWK), or generate a key pair.');
  const params = importParams(alg);
  const curveHint = i.curve ? ` (expected curve ${i.curve})` : '';
  if (t.startsWith('{')) {
    let jwk: JsonWebKey;
    try {
      jwk = JSON.parse(t);
    } catch {
      throw new SignError('The key looks like JSON but could not be parsed.');
    }
    if (typeof jwk !== 'object' || jwk === null || Array.isArray(jwk)) throw new SignError('The JWK must be a JSON object.');
    if (jwk.kty !== expectedKty(alg)) throw new SignError(`${alg} needs a "${expectedKty(alg)}" key, but this JWK is "${jwk.kty ?? 'unknown'}".`);
    if (!jwk.d) throw new SignError('This JWK has no private part ("d"). Paste the private key to sign.');
    if (jwk.alg && jwk.alg !== alg) throw new SignError(`This key is for ${jwk.alg}, but the selected algorithm is ${alg}.`);
    const clean: JsonWebKey = { ...jwk, alg: undefined, key_ops: undefined, use: undefined, ext: true };
    try {
      return await crypto.subtle.importKey('jwk', clean, params, false, ['sign']);
    } catch {
      throw new SignError(`Could not import this JWK as a ${alg} private key${curveHint}.`);
    }
  }
  const m = t.match(PEM);
  if (!m) throw new SignError('Paste the private key as PEM ("-----BEGIN PRIVATE KEY-----") or as JWK JSON.');
  const label = m[1];
  if (label === 'RSA PRIVATE KEY' || label === 'EC PRIVATE KEY')
    throw new SignError(`This is a ${label === 'EC PRIVATE KEY' ? 'SEC1' : 'PKCS#1'} key. Convert it to PKCS#8 ("BEGIN PRIVATE KEY"), e.g. with: openssl pkcs8 -topk8 -nocrypt -in key.pem`);
  if (label === 'ENCRYPTED PRIVATE KEY') throw new SignError('Encrypted keys are not supported. Decrypt it first, e.g. with: openssl pkcs8 -in key.pem -nocrypt');
  if (label === 'PUBLIC KEY' || label === 'CERTIFICATE') throw new SignError('Signing needs the private key, not the public key or certificate.');
  if (label !== 'PRIVATE KEY') throw new SignError(`Unsupported PEM type "${label}". Use "BEGIN PRIVATE KEY" (PKCS#8).`);
  const der = base64ToBytes(m[2]);
  if (!der) throw new SignError('The PEM body is not valid Base64.');
  try {
    return await crypto.subtle.importKey('pkcs8', der as Uint8Array<ArrayBuffer>, params, false, ['sign']);
  } catch {
    throw new SignError(`Could not import this PEM as a ${alg} private key${curveHint}.`);
  }
}

export function toPem(der: ArrayBuffer, label: string): string {
  const b64 = bytesToBase64(new Uint8Array(der)).replace(/.{1,64}/g, '$&\n');
  return `-----BEGIN ${label}-----\n${b64}-----END ${label}-----`;
}

export interface KeyPair {
  privatePem: string;
  privateJwk: string;
  publicPem: string;
  publicJwk: string;
}

export async function generateKeyPair(alg: Alg, rsaBits = 2048): Promise<KeyPair> {
  const i = algInfo(alg);
  if (i.family === 'HS') throw new SignError('HMAC algorithms use a shared secret, not a key pair.');
  const params =
    i.family === 'ES'
      ? { name: 'ECDSA', namedCurve: i.curve! }
      : i.family === 'Ed'
        ? { name: 'Ed25519' }
        : { name: i.family === 'RS' ? 'RSASSA-PKCS1-v1_5' : 'RSA-PSS', hash: i.hash, modulusLength: rsaBits, publicExponent: new Uint8Array([1, 0, 1]) };
  let pair: CryptoKeyPair;
  try {
    pair = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
  } catch {
    throw new SignError(`This browser can't generate ${alg} keys.`);
  }
  const [pkcs8, spki, priv, pub] = await Promise.all([
    crypto.subtle.exportKey('pkcs8', pair.privateKey),
    crypto.subtle.exportKey('spki', pair.publicKey),
    crypto.subtle.exportKey('jwk', pair.privateKey),
    crypto.subtle.exportKey('jwk', pair.publicKey),
  ]);
  const tidy = (j: JsonWebKey) => {
    const { key_ops: _o, ext: _e, ...rest } = j;
    return JSON.stringify({ ...rest, alg, use: 'sig' }, null, 2);
  };
  return { privatePem: toPem(pkcs8, 'PRIVATE KEY'), privateJwk: tidy(priv), publicPem: toPem(spki, 'PUBLIC KEY'), publicJwk: tidy(pub) };
}

let edSupport: Promise<boolean> | null = null;
/** Whether WebCrypto here supports Ed25519. */
export function supportsEd25519(): Promise<boolean> {
  edSupport ??= crypto.subtle
    .generateKey({ name: 'Ed25519' }, false, ['sign', 'verify'])
    .then(() => true)
    .catch(() => false);
  return edSupport;
}

// ---------- signing ----------

export interface SignResult {
  token: string;
  warnings: string[];
}

/** Signs `header` and `payload` (JSON text or objects). The header's "alg" is set to `alg`. */
export async function signJwt(header: Record<string, unknown>, payload: unknown, alg: Alg, key: SignKey): Promise<SignResult> {
  const warnings: string[] = [];
  if (header.alg !== undefined && header.alg !== alg) warnings.push(`The header said "alg": ${JSON.stringify(header.alg)}; it was set to "${alg}" to match the selected algorithm.`);
  const h = { ...header, alg };
  const input = `${textToBase64Url(JSON.stringify(h))}.${textToBase64Url(JSON.stringify(payload))}`;
  const data = new TextEncoder().encode(input);
  const i = algInfo(alg);
  let sig: ArrayBuffer;
  if (i.family === 'HS') {
    if (key.kind !== 'secret') throw new SignError(`${alg} needs a shared secret.`);
    if (!key.secret) throw new SignError('Enter a secret to sign the token.');
    const raw = key.base64 ? base64ToBytes(key.secret) : new TextEncoder().encode(key.secret);
    if (!raw) throw new SignError('The secret is not valid Base64. Turn off "Secret is Base64" if it is plain text.');
    if (!raw.length) throw new SignError('The secret decodes to zero bytes.');
    if (raw.length < i.bytes) warnings.push(`The secret is ${raw.length} bytes; ${alg} should use at least ${i.bytes} bytes (RFC 7518 §3.2).`);
    const k = await crypto.subtle.importKey('raw', raw as Uint8Array<ArrayBuffer>, { name: 'HMAC', hash: i.hash }, false, ['sign']);
    sig = await crypto.subtle.sign('HMAC', k, data);
  } else {
    if (key.kind !== 'private') throw new SignError(`${alg} needs a private key.`);
    const k = await importPrivateKey(key.text, alg);
    const params =
      i.family === 'RS'
        ? { name: 'RSASSA-PKCS1-v1_5' }
        : i.family === 'PS'
          ? { name: 'RSA-PSS', saltLength: i.bytes }
          : i.family === 'ES'
            ? { name: 'ECDSA', hash: i.hash }
            : { name: 'Ed25519' };
    // WebCrypto ECDSA returns raw r||s (IEEE P1363), which is exactly the JWS format.
    sig = await crypto.subtle.sign(params, k, data);
  }
  return { token: `${input}.${bytesToBase64Url(new Uint8Array(sig))}`, warnings };
}

// ---------- claim helpers ----------

export const nowSeconds = (now = Date.now()) => Math.floor(now / 1000);

export type DurationUnit = 'minutes' | 'hours' | 'days';
const UNIT_SECONDS: Record<DurationUnit, number> = { minutes: 60, hours: 3600, days: 86400 };
export const secondsFromNow = (amount: number, unit: DurationUnit, now = Date.now()) => nowSeconds(now) + Math.round(amount * UNIT_SECONDS[unit]);

export function randomJti(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return bytesToBase64Url(b);
}

/** Sets claims on a JSON object text, keeping it pretty-printed. Throws SignError for invalid JSON. */
export function setClaims(payloadText: string, claims: Record<string, unknown>): string {
  const obj = parseJsonObject(payloadText, 'Payload');
  return JSON.stringify({ ...obj, ...claims }, null, 2);
}

export function parseJsonObject(text: string, what: string): Record<string, unknown> {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch (e) {
    throw new SignError(`${what} is not valid JSON: ${(e as Error).message}`);
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SignError(`${what} must be a JSON object.`);
  return v as Record<string, unknown>;
}
