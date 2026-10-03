// Passphrase encryption: PBKDF2-SHA-256 → HKDF → AES-256-GCM, all via Web Crypto.
//
// Envelope (binary, big-endian):
//   kind u8 (0 = text, 1 = file) | iterations u32 | salt 16 | iv 12 | check 8 | ciphertext + 16-byte GCM tag
// The header (everything before the ciphertext) is the GCM additional data, so it can't be edited.
// `check` is an HKDF output separate from the AES key; it lets decryption tell a wrong passphrase
// apart from a modified ciphertext without weakening the key.
// Text form: "zykit:v1:" + Base64URL(envelope). File form (.zyk): "ZYK1" + envelope, and the
// plaintext is u16 name length | UTF-8 file name | file bytes.

import { base64ToBytes, bytesToBase64 } from '../../../shared/lib/base64';

export const TEXT_PREFIX = 'zykit:v1:';
export const FILE_MAGIC = 'ZYK1';
export const DEFAULT_ITERATIONS = 600_000;
export const MIN_ITERATIONS = 100_000;
export const MAX_ITERATIONS = 10_000_000;
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
const SALT_LEN = 16;
const IV_LEN = 12;
const CHECK_LEN = 8;
const TAG_LEN = 16;
const HEADER_LEN = 1 + 4 + SALT_LEN + IV_LEN + CHECK_LEN;

export type DecryptErrorCode = 'format' | 'corrupt' | 'passphrase';

export class DecryptError extends Error {
  code: DecryptErrorCode;
  constructor(code: DecryptErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'DecryptError';
  }
}

const enc = new TextEncoder();

type Bytes = Uint8Array<ArrayBuffer>;
const copy = (b: Uint8Array): Bytes => new Uint8Array(b);

async function deriveKeys(passphrase: string, salt: Bytes, iterations: number): Promise<{ key: CryptoKey; check: Bytes }> {
  const pass = await crypto.subtle.importKey('raw', enc.encode(passphrase.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const master = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, pass, 256);
  const hk = await crypto.subtle.importKey('raw', master, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const hkdf = (info: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) });
  const key = await crypto.subtle.deriveKey(hkdf('zykit v1 aes-256-gcm'), hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const check = new Uint8Array(await crypto.subtle.deriveBits(hkdf('zykit v1 passphrase check'), hk, CHECK_LEN * 8));
  return { key, check };
}

async function seal(kind: 0 | 1, plaintext: Bytes, passphrase: string, iterations: number): Promise<Bytes> {
  if (!passphrase) throw new Error('Enter a passphrase.');
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS)
    throw new Error(`Iterations must be between ${MIN_ITERATIONS.toLocaleString('en')} and ${MAX_ITERATIONS.toLocaleString('en')}.`);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const { key, check } = await deriveKeys(passphrase, salt, iterations);
  const header = new Uint8Array(HEADER_LEN);
  header[0] = kind;
  new DataView(header.buffer).setUint32(1, iterations);
  header.set(salt, 5);
  header.set(iv, 5 + SALT_LEN);
  header.set(check, 5 + SALT_LEN + IV_LEN);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: header }, key, plaintext));
  const out = new Uint8Array(HEADER_LEN + ct.length);
  out.set(header);
  out.set(ct, HEADER_LEN);
  return out;
}

export interface EnvelopeInfo {
  kind: 'text' | 'file';
  iterations: number;
}

/** Reads the header without decrypting. Throws DecryptError('corrupt') on a malformed envelope. */
export function readEnvelope(env: Uint8Array): EnvelopeInfo {
  if (env.length < HEADER_LEN + TAG_LEN) throw new DecryptError('corrupt', 'The encrypted data is truncated: it is shorter than the header and authentication tag.');
  if (env[0] !== 0 && env[0] !== 1) throw new DecryptError('corrupt', 'The encrypted data is corrupted: unknown content type in the header.');
  const iterations = new DataView(env.buffer, env.byteOffset).getUint32(1);
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS)
    throw new DecryptError('corrupt', `The encrypted data is corrupted: the iteration count (${iterations}) is outside the allowed range.`);
  return { kind: env[0] === 0 ? 'text' : 'file', iterations };
}

async function open(env: Uint8Array, passphrase: string): Promise<{ info: EnvelopeInfo; plaintext: Uint8Array }> {
  const info = readEnvelope(env);
  if (!passphrase) throw new DecryptError('passphrase', 'Enter the passphrase.');
  const header = copy(env.subarray(0, HEADER_LEN));
  const salt = copy(env.subarray(5, 5 + SALT_LEN));
  const iv = copy(env.subarray(5 + SALT_LEN, 5 + SALT_LEN + IV_LEN));
  const stored = env.subarray(5 + SALT_LEN + IV_LEN, HEADER_LEN);
  const { key, check } = await deriveKeys(passphrase, salt, info.iterations);
  if (!check.every((b, i) => b === stored[i]))
    throw new DecryptError('passphrase', 'Wrong passphrase. (If you are sure it is right, the header was damaged.)');
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: header }, key, copy(env.subarray(HEADER_LEN)));
    return { info, plaintext: new Uint8Array(pt) };
  } catch {
    throw new DecryptError('corrupt', 'The passphrase is right, but the encrypted data was modified or truncated, so it failed the integrity check.');
  }
}

export async function encryptText(text: string, passphrase: string, iterations = DEFAULT_ITERATIONS): Promise<string> {
  return TEXT_PREFIX + bytesToBase64(await seal(0, enc.encode(text), passphrase, iterations), true);
}

/** Decodes the text form to its envelope, with format errors that say what's wrong. */
export function parseText(input: string): Uint8Array {
  const s = input.replace(/\s+/g, '');
  if (!s) throw new DecryptError('format', 'Paste the encrypted text first.');
  const m = /^zykit:v(\d+):/i.exec(s);
  if (!m) {
    if (/^U2FsdGVkX1/.test(s)) throw new DecryptError('format', 'This looks like OpenSSL "Salted__" output, which this tool does not read. Use `openssl enc -d` instead.');
    throw new DecryptError('format', 'Unknown format: encrypted text from this tool starts with "zykit:v1:".');
  }
  if (m[1] !== '1') throw new DecryptError('format', `Unsupported format version v${m[1]}: this tool reads v1 only.`);
  try {
    return base64ToBytes(s.slice(m[0].length), true);
  } catch {
    throw new DecryptError('corrupt', 'The encrypted text is corrupted: it is not valid Base64URL after the "zykit:v1:" prefix.');
  }
}

export async function decryptText(input: string, passphrase: string): Promise<string> {
  const env = parseText(input);
  if (readEnvelope(env).kind === 'file') throw new DecryptError('format', 'This is an encrypted file, not text. Use the File mode.');
  const { plaintext } = await open(env, passphrase);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  } catch {
    throw new DecryptError('corrupt', 'Decrypted, but the result is not valid UTF-8 text.');
  }
}

export function isEncryptedFile(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && String.fromCharCode(...bytes.subarray(0, 4)) === FILE_MAGIC;
}

export async function encryptFile(name: string, data: Uint8Array, passphrase: string, iterations = DEFAULT_ITERATIONS): Promise<Bytes> {
  if (data.length > MAX_FILE_BYTES) throw new Error('Files up to 100 MB can be encrypted.');
  const nameBytes = enc.encode(name).subarray(0, 1024);
  const pt = new Uint8Array(2 + nameBytes.length + data.length);
  new DataView(pt.buffer).setUint16(0, nameBytes.length);
  pt.set(nameBytes, 2);
  pt.set(data, 2 + nameBytes.length);
  const env = await seal(1, pt, passphrase, iterations);
  const out = new Uint8Array(4 + env.length);
  out.set(enc.encode(FILE_MAGIC));
  out.set(env, 4);
  return out;
}

export async function decryptFile(bytes: Uint8Array, passphrase: string): Promise<{ name: string; data: Uint8Array }> {
  if (!isEncryptedFile(bytes)) throw new DecryptError('format', 'Unknown format: this is not a .zyk file made by this tool (it should start with "ZYK1").');
  const env = bytes.subarray(4);
  if (readEnvelope(env).kind !== 'file') throw new DecryptError('corrupt', 'The .zyk header says it holds text, not a file.');
  const { plaintext } = await open(env, passphrase);
  const len = new DataView(plaintext.buffer, plaintext.byteOffset).getUint16(0);
  const name = new TextDecoder().decode(plaintext.subarray(2, 2 + len)) || 'decrypted';
  return { name, data: plaintext.subarray(2 + len) };
}

/** "secret.txt.zyk" → "secret.txt"; anything else gets ".decrypted". */
export function decryptedName(zykName: string, inner: string): string {
  return inner || (zykName.toLowerCase().endsWith('.zyk') ? zykName.slice(0, -4) : `${zykName}.decrypted`);
}

// ---------- passphrase strength ----------

export type Strength = 'empty' | 'very weak' | 'weak' | 'fair' | 'strong' | 'very strong';

const COMMON = ['password', 'passw0rd', '123456', 'qwerty', 'letmein', 'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'secret', 'abc123', '111111', 'zykit'];

/** Rough entropy estimate (character pool × length, with penalties). A hint, not a guarantee. */
export function passphraseStrength(p: string): { level: Strength; bits: number; hint: string } {
  if (!p) return { level: 'empty', bits: 0, hint: 'Choose a long passphrase: four or more random words, or 16+ random characters.' };
  const words = p.trim().split(/[\s\-_.]+/).filter((w) => w.length >= 3);
  let pool = 0;
  if (/[a-z]/.test(p)) pool += 26;
  if (/[A-Z]/.test(p)) pool += 26;
  if (/\d/.test(p)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(p)) pool += 33;
  const unique = new Set(p).size;
  let bits = Math.log2(Math.max(pool, 2)) * Math.min(p.length, unique * 2);
  // Several words: assume a ~7,776-word list (diceware) when that beats the character estimate.
  if (words.length >= 3) bits = Math.max(bits * 0.6, words.length * 12.9);
  else bits *= 0.6;
  const lower = p.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) bits = Math.min(bits, 20);
  if (/^(.)\1*$/.test(p) || /^(?:0123|1234|abcd)/i.test(p)) bits = Math.min(bits, 10);
  bits = Math.round(bits);
  const level: Strength = bits < 28 ? 'very weak' : bits < 40 ? 'weak' : bits < 56 ? 'fair' : bits < 72 ? 'strong' : 'very strong';
  const hint =
    level === 'very weak' || level === 'weak'
      ? 'Easy to guess offline. Anyone with the ciphertext can try passphrases as fast as their hardware allows.'
      : level === 'fair'
        ? 'Usable, but longer is better for anything sensitive. Add another word or more characters.'
        : 'Good. Store it somewhere safe: there is no way to recover data without it.';
  return { level, bits, hint };
}
