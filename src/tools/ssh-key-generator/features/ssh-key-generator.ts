// SSH key pairs from Web Crypto, serialised to OpenSSH formats by hand:
// - public key line: "<type> <base64 blob> <comment>" (RFC 4253 §6.6, RFC 5656 §3.1, RFC 8709)
// - private key: openssh-key-v1 (PROTOCOL.key in OpenSSH), unencrypted ("none" cipher and KDF)
// - fingerprints: SHA256:<base64, no padding> and legacy MD5 colon hex
// plus PKCS#8 / SPKI PEM straight from Web Crypto.

import { base64ToBytes, bytesToBase64 } from '../../../shared/lib/base64';
import { concat } from '../../../shared/lib/bytes';
import { md5 } from '../../../shared/lib/hash';

export type KeyType = 'ed25519' | 'ecdsa-p256' | 'ecdsa-p384' | 'ecdsa-p521' | 'rsa-2048' | 'rsa-3072' | 'rsa-4096';

export const KEY_TYPES: { value: KeyType; label: string }[] = [
  { value: 'ed25519', label: 'Ed25519 (recommended)' },
  { value: 'ecdsa-p256', label: 'ECDSA P-256' },
  { value: 'ecdsa-p384', label: 'ECDSA P-384' },
  { value: 'ecdsa-p521', label: 'ECDSA P-521' },
  { value: 'rsa-2048', label: 'RSA 2048' },
  { value: 'rsa-3072', label: 'RSA 3072' },
  { value: 'rsa-4096', label: 'RSA 4096' },
];

const CURVES = {
  'ecdsa-p256': { named: 'P-256', ssh: 'nistp256', bits: 256 },
  'ecdsa-p384': { named: 'P-384', ssh: 'nistp384', bits: 384 },
  'ecdsa-p521': { named: 'P-521', ssh: 'nistp521', bits: 521 },
} as const;

export interface SshKeyPair {
  type: KeyType;
  /** SSH algorithm name, e.g. "ssh-ed25519". */
  algorithm: string;
  bits: number;
  comment: string;
  publicBlob: Uint8Array;
  publicLine: string;
  privateOpenSsh: string;
  privatePkcs8Pem: string;
  publicSpkiPem: string;
  fingerprintSha256: string;
  fingerprintMd5: string;
  /** Same layout as `ssh-keygen -l`: "256 SHA256:… comment (ED25519)". */
  keygenLine: string;
  /** "id_ed25519", "id_ecdsa" or "id_rsa". */
  fileBase: string;
}

export class SshKeyError extends Error {
  name = 'SshKeyError';
}

// ---------- SSH wire encoding ----------

const enc = new TextEncoder();

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}

export function sshString(data: Uint8Array | string): Uint8Array {
  const b = typeof data === 'string' ? enc.encode(data) : data;
  return concat([u32(b.length), b]);
}

/** RFC 4251 mpint from an unsigned big-endian magnitude. */
export function sshMpint(magnitude: Uint8Array): Uint8Array {
  let i = 0;
  while (i < magnitude.length && magnitude[i] === 0) i++;
  const m = magnitude.subarray(i);
  return sshString(m.length && m[0] & 0x80 ? concat([new Uint8Array([0]), m]) : m);
}

export class SshReader {
  private o = 0;
  private b: Uint8Array;
  constructor(b: Uint8Array) {
    this.b = b;
  }
  get done() {
    return this.o >= this.b.length;
  }
  get offset() {
    return this.o;
  }
  rest(): Uint8Array {
    const r = this.b.subarray(this.o);
    this.o = this.b.length;
    return r;
  }
  uint32(): number {
    if (this.o + 4 > this.b.length) throw new SshKeyError('Unexpected end of key data.');
    const v = new DataView(this.b.buffer, this.b.byteOffset + this.o, 4).getUint32(0);
    this.o += 4;
    return v;
  }
  bytes(): Uint8Array {
    const n = this.uint32();
    if (this.o + n > this.b.length) throw new SshKeyError('A length field points past the end of the key data.');
    const r = this.b.subarray(this.o, this.o + n);
    this.o += n;
    return r;
  }
  text(): string {
    return new TextDecoder().decode(this.bytes());
  }
  /** mpint → unsigned magnitude (leading zero stripped). */
  mpint(): Uint8Array {
    const b = this.bytes();
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    return b.subarray(i);
  }
}

// ---------- helpers ----------

const b64 = (b: Uint8Array) => bytesToBase64(b);
const b64url = (s: string) => base64ToBytes(s, true);

function wrap(body: string, width: number): string {
  return body.match(new RegExp(`.{1,${width}}`, 'g'))!.join('\n');
}

export function pem(label: string, der: Uint8Array, width = 64): string {
  return `-----BEGIN ${label}-----\n${wrap(b64(der), width)}\n-----END ${label}-----\n`;
}

export function cleanComment(c: string): string {
  return c.replace(/[\r\n\t]+/g, ' ').trim();
}

export async function fingerprintSha256(blob: Uint8Array): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(blob)));
  return 'SHA256:' + b64(h).replace(/=+$/, '');
}

export function fingerprintMd5(blob: Uint8Array): string {
  return 'MD5:' + md5(blob).match(/../g)!.join(':');
}

let edSupport: Promise<boolean> | undefined;
/** Whether this browser's Web Crypto can generate Ed25519 keys. */
export function supportsEd25519(): Promise<boolean> {
  edSupport ??= Promise.resolve()
    .then(() => crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']))
    .then(() => true)
    .catch(() => false);
  return edSupport;
}

// ---------- OpenSSH private key (openssh-key-v1, unencrypted) ----------

const MAGIC = enc.encode('openssh-key-v1\0');

export function buildOpenSshPrivateKey(publicBlob: Uint8Array, privateFields: Uint8Array, comment: string, checkint?: number): string {
  const check = checkint ?? crypto.getRandomValues(new Uint32Array(1))[0];
  const body = [u32(check), u32(check), privateFields, sshString(cleanComment(comment))];
  let len = body.reduce((n, p) => n + p.length, 0);
  const pad: number[] = [];
  for (let i = 1; len % 8 !== 0; i++, len++) pad.push(i);
  const priv = concat([...body, new Uint8Array(pad)]);
  const der = concat([MAGIC, sshString('none'), sshString('none'), sshString(new Uint8Array(0)), u32(1), sshString(publicBlob), sshString(priv)]);
  return pem('OPENSSH PRIVATE KEY', der, 70);
}

export interface ParsedPrivateKey {
  cipher: string;
  kdf: string;
  publicBlob: Uint8Array;
  keyType: string;
  /** The key-type-specific fields after the type name, raw. */
  fields: Uint8Array[];
  comment: string;
}

const FIELD_COUNT: Record<string, ('s' | 'm')[]> = {
  'ssh-ed25519': ['s', 's'],
  'ssh-rsa': ['m', 'm', 'm', 'm', 'm', 'm'],
  'ecdsa-sha2-nistp256': ['s', 's', 'm'],
  'ecdsa-sha2-nistp384': ['s', 's', 'm'],
  'ecdsa-sha2-nistp521': ['s', 's', 'm'],
};

function pemBody(text: string, label: string): Uint8Array {
  const m = new RegExp(`-----BEGIN ${label}-----([\\s\\S]*?)-----END ${label}-----`).exec(text);
  if (!m) throw new SshKeyError(`Missing "BEGIN ${label}" block.`);
  return base64ToBytes(m[1].replace(/\s+/g, ''));
}

/** Parses an unencrypted openssh-key-v1 private key and checks its structure (checkints, padding). */
export function parseOpenSshPrivateKey(text: string): ParsedPrivateKey {
  const der = pemBody(text, 'OPENSSH PRIVATE KEY');
  if (!MAGIC.every((b, i) => der[i] === b)) throw new SshKeyError('Not an openssh-key-v1 key.');
  const r = new SshReader(der.subarray(MAGIC.length));
  const cipher = r.text();
  const kdf = r.text();
  r.bytes(); // kdf options
  if (r.uint32() !== 1) throw new SshKeyError('Expected exactly one key.');
  const publicBlob = r.bytes();
  const priv = r.bytes();
  if (!r.done) throw new SshKeyError('Trailing data after the private section.');
  if (cipher !== 'none') return { cipher, kdf, publicBlob, keyType: new SshReader(publicBlob).text(), fields: [], comment: '' };
  if (priv.length % 8) throw new SshKeyError('Private section is not a multiple of the 8-byte block size.');
  const p = new SshReader(priv);
  if (p.uint32() !== p.uint32()) throw new SshKeyError('Check integers differ.');
  const keyType = p.text();
  const layout = FIELD_COUNT[keyType];
  if (!layout) throw new SshKeyError(`Unsupported key type ${keyType}.`);
  const fields = layout.map((t) => (t === 'm' ? p.mpint() : p.bytes()));
  const comment = p.text();
  const pad = p.rest();
  if (!pad.every((b, i) => b === i + 1)) throw new SshKeyError('Bad padding.');
  return { cipher, kdf, publicBlob, keyType, fields, comment };
}

export interface ParsedPublicKey {
  algorithm: string;
  blob: Uint8Array;
  comment: string;
  /** Fields after the algorithm name in the blob, raw (mpints keep their sign byte). */
  fields: Uint8Array[];
}

/** Parses "type base64 [comment]", checking the algorithm inside the blob matches. */
export function parseOpenSshPublicKey(line: string): ParsedPublicKey {
  const m = /^(\S+)\s+([A-Za-z0-9+/=]+)(?:\s+(.*))?$/.exec(line.trim());
  if (!m) throw new SshKeyError('Not an OpenSSH public key line.');
  const blob = base64ToBytes(m[2]);
  const r = new SshReader(blob);
  const algorithm = r.text();
  if (algorithm !== m[1]) throw new SshKeyError(`Key type mismatch: line says ${m[1]}, blob says ${algorithm}.`);
  const fields: Uint8Array[] = [];
  while (!r.done) fields.push(r.bytes());
  return { algorithm, blob, comment: m[3] ?? '', fields };
}

// ---------- generation ----------

function publicLine(algorithm: string, blob: Uint8Array, comment: string) {
  return `${algorithm} ${b64(blob)}${comment ? ' ' + comment : ''}`;
}

async function exportPems(pair: CryptoKeyPair) {
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  return { privatePkcs8Pem: pem('PRIVATE KEY', pkcs8), publicSpkiPem: pem('PUBLIC KEY', spki), pkcs8 };
}

async function finish(
  type: KeyType,
  algorithm: string,
  bits: number,
  blob: Uint8Array,
  privateFields: Uint8Array,
  comment: string,
  pems: { privatePkcs8Pem: string; publicSpkiPem: string },
  label: string,
  fileBase: string,
): Promise<SshKeyPair> {
  const fp = await fingerprintSha256(blob);
  return {
    type,
    algorithm,
    bits,
    comment,
    publicBlob: blob,
    publicLine: publicLine(algorithm, blob, comment),
    privateOpenSsh: buildOpenSshPrivateKey(blob, concat([sshString(algorithm), privateFields]), comment),
    privatePkcs8Pem: pems.privatePkcs8Pem,
    publicSpkiPem: pems.publicSpkiPem,
    fingerprintSha256: fp,
    fingerprintMd5: fingerprintMd5(blob),
    keygenLine: `${bits} ${fp} ${comment || 'no comment'} (${label})`,
    fileBase,
  };
}

export async function generateSshKey(type: KeyType, rawComment = ''): Promise<SshKeyPair> {
  const comment = cleanComment(rawComment);
  if (type === 'ed25519') {
    if (!(await supportsEd25519())) throw new SshKeyError('This browser’s Web Crypto doesn’t support Ed25519. Update your browser, or choose ECDSA or RSA.');
    const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const pems = await exportPems(pair);
    const seed = pems.pkcs8.subarray(pems.pkcs8.length - 32); // PKCS#8 ends with OCTET STRING(32-byte seed)
    const blob = concat([sshString('ssh-ed25519'), sshString(pub)]);
    const fields = concat([sshString(pub), sshString(concat([seed, pub]))]);
    return finish(type, 'ssh-ed25519', 256, blob, fields, comment, pems, 'ED25519', 'id_ed25519');
  }
  if (type in CURVES) {
    const c = CURVES[type as keyof typeof CURVES];
    const algorithm = `ecdsa-sha2-${c.ssh}`;
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: c.named }, true, ['sign', 'verify']);
    const q = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const pems = await exportPems(pair);
    const blob = concat([sshString(algorithm), sshString(c.ssh), sshString(q)]);
    const fields = concat([sshString(c.ssh), sshString(q), sshMpint(b64url(jwk.d!))]);
    return finish(type, algorithm, c.bits, blob, fields, comment, pems, 'ECDSA', 'id_ecdsa');
  }
  const bits = Number(type.slice(4));
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const [n, e, d, p, q, qi] = [jwk.n, jwk.e, jwk.d, jwk.p, jwk.q, jwk.qi].map((v) => b64url(v!));
  const pems = await exportPems(pair);
  const blob = concat([sshString('ssh-rsa'), sshMpint(e), sshMpint(n)]);
  const fields = concat([sshMpint(n), sshMpint(e), sshMpint(d), sshMpint(qi), sshMpint(p), sshMpint(q)]);
  return finish(type, 'ssh-rsa', bits, blob, fields, comment, pems, 'RSA', 'id_rsa');
}

// ---------- authorized_keys ----------

export interface AuthorizedKeyOptions {
  restrict?: boolean;
  noPortForwarding?: boolean;
  noAgentForwarding?: boolean;
  noX11Forwarding?: boolean;
  noPty?: boolean;
  /** Comma-separated host patterns, e.g. "10.0.0.0/8,*.example.com". */
  from?: string;
  command?: string;
  /** YYYYMMDD or YYYYMMDDHHMM[SS]. */
  expiryTime?: string;
}

const quote = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Options string for authorized_keys (sshd(8) AUTHORIZED_KEYS FILE FORMAT). */
export function authorizedKeysOptions(o: AuthorizedKeyOptions): string {
  const parts: string[] = [];
  if (o.restrict) parts.push('restrict');
  if (o.from?.trim()) parts.push(`from=${quote(o.from.replace(/\s+/g, ''))}`);
  if (o.command?.trim()) parts.push(`command=${quote(o.command.trim())}`);
  if (o.expiryTime?.trim()) parts.push(`expiry-time=${quote(o.expiryTime.trim())}`);
  if (!o.restrict) {
    if (o.noPortForwarding) parts.push('no-port-forwarding');
    if (o.noAgentForwarding) parts.push('no-agent-forwarding');
    if (o.noX11Forwarding) parts.push('no-X11-forwarding');
    if (o.noPty) parts.push('no-pty');
  }
  return parts.join(',');
}

export function authorizedKeysLine(publicKeyLine: string, o: AuthorizedKeyOptions): string {
  const opts = authorizedKeysOptions(o);
  return opts ? `${opts} ${publicKeyLine}` : publicKeyLine;
}

/** Returns an error message for a bad expiry-time value, or null. */
export function checkExpiry(v: string): string | null {
  if (!v.trim()) return null;
  return /^\d{8}(\d{4}(\d{2})?)?Z?$/.test(v.trim()) ? null : 'Use YYYYMMDD or YYYYMMDDHHMM[SS], e.g. 20271231.';
}
