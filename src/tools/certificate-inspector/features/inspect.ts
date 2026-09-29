// Turns pasted PEM text or a DER file into decoded items, and checks how certificates chain.

import { tryBase64ToBytes } from '../../../shared/lib/base64';
import { Asn1Error, parseDer, isUniversal, TAG, toHex } from './asn1';
import {
  bytesEqual,
  decodeCertificate,
  decodeCsr,
  decodePrivateKey,
  decodePublicKey,
  decodeRsaPublicKey,
  sniffDer,
  type Certificate,
  type CertificateRequest,
  type PrivateKeyBlock,
  type PublicKeyBlock,
} from './x509';

export const MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const MAX_BLOCKS = 50;

export type Decoded = Certificate | CertificateRequest | PublicKeyBlock | PrivateKeyBlock;
export interface Item {
  /** PEM label ("CERTIFICATE") or "DER". */
  label: string;
  result: Decoded | null;
  error?: string;
}

export interface InspectResult {
  items: Item[];
  notices: string[];
}

const PEM_BLOCK = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END ([A-Z0-9 ]+)-----/g;

/** Standard Base64 decode (whitespace ignored). Padding may be partial but not excessive. Returns null if invalid. */
export function decodeBase64(text: string): Uint8Array | null {
  const s = text.replace(/\s+/g, '');
  const body = s.replace(/=+$/, '');
  const padding = s.length - body.length;
  if (!s || padding > (4 - (body.length % 4)) % 4) return null;
  return tryBase64ToBytes(body);
}

function describeError(e: unknown): string {
  return e instanceof Asn1Error ? e.message : 'The data could not be decoded.';
}

/** Decodes one DER blob. `label` is the PEM label, or undefined to guess from the structure. */
export function decodeDer(der: Uint8Array, label?: string): Item {
  const shown = label ?? 'DER';
  try {
    const root = parseDer(der);
    const kind = (() => {
      switch (label) {
        case 'CERTIFICATE':
        case 'TRUSTED CERTIFICATE':
        case 'X509 CERTIFICATE':
          return 'certificate';
        case 'CERTIFICATE REQUEST':
        case 'NEW CERTIFICATE REQUEST':
          return 'csr';
        case 'PUBLIC KEY':
          return 'public-key';
        case 'RSA PUBLIC KEY':
          return 'rsa-public-key';
        case 'PRIVATE KEY':
          return 'private-key';
        case 'RSA PRIVATE KEY':
          return 'rsa-private-key';
        case 'EC PRIVATE KEY':
          return 'ec-private-key';
        case 'ENCRYPTED PRIVATE KEY':
          return 'encrypted-private-key';
        case undefined:
          return sniffDer(root);
        default:
          return 'unsupported';
      }
    })();
    switch (kind) {
      case 'certificate':
        return { label: shown, result: decodeCertificate(der, root) };
      case 'csr':
        return { label: shown, result: decodeCsr(der, root) };
      case 'public-key':
        return { label: shown, result: decodePublicKey(der, root) };
      case 'rsa-public-key':
        return { label: shown, result: decodeRsaPublicKey(der, root) };
      case 'private-key':
        return { label: shown, result: decodePrivateKey(root, 'PKCS#8') };
      case 'rsa-private-key':
        return { label: shown, result: decodePrivateKey(root, 'PKCS#1 RSA') };
      case 'ec-private-key':
        return { label: shown, result: decodePrivateKey(root, 'SEC1 EC') };
      case 'encrypted-private-key':
        return { label: shown, result: { kind: 'private-key', format: 'Encrypted PKCS#8', type: 'Unknown (encrypted)', encrypted: true } };
      case 'unsupported':
        return { label: shown, result: null, error: `"${label}" blocks are not supported. Paste certificates, CSRs, public or private keys.` };
      default:
        return { label: shown, result: null, error: 'This DER data is not a certificate, CSR or key this tool recognises.' };
    }
  } catch (e) {
    return { label: shown, result: null, error: describeError(e) };
  }
}

/** Finds PEM blocks in text; falls back to bare Base64 DER. */
export function inspectText(text: string): InspectResult {
  const items: Item[] = [];
  const notices: string[] = [];
  let found = 0;
  for (const m of text.matchAll(PEM_BLOCK)) {
    found++;
    if (items.length >= MAX_BLOCKS) {
      notices.push(`Only the first ${MAX_BLOCKS} blocks are shown.`);
      break;
    }
    const [, begin, body, end] = m;
    if (begin !== end) {
      items.push({ label: begin, result: null, error: `BEGIN ${begin} does not match END ${end}.` });
      continue;
    }
    if (begin === 'OPENSSH PRIVATE KEY') {
      items.push({ label: begin, result: { kind: 'private-key', format: 'OpenSSH', type: 'OpenSSH key', encrypted: false } });
      continue;
    }
    if (/^Proc-Type:/m.test(body)) {
      items.push({ label: begin, result: { kind: 'private-key', format: begin === 'EC PRIVATE KEY' ? 'SEC1 EC' : 'PKCS#1 RSA', type: begin.split(' ')[0], encrypted: true } });
      continue;
    }
    const der = decodeBase64(body);
    if (!der) {
      items.push({ label: begin, result: null, error: 'The block body is not valid Base64.' });
      continue;
    }
    items.push(decodeDer(der, begin));
  }
  if (!found) {
    if (/-----BEGIN /.test(text)) notices.push('Found a "-----BEGIN" line but no matching "-----END" line.');
    else {
      const der = decodeBase64(text);
      if (der && der[0] === 0x30) items.push(decodeDer(der));
      else if (text.trim()) notices.push('No PEM blocks found. Paste text that starts with "-----BEGIN CERTIFICATE-----", or open a .der file.');
    }
  }
  return { items, notices };
}

/** Decodes a file: PEM text, or binary DER. */
export function inspectBytes(bytes: Uint8Array): InspectResult {
  if (bytes.length > MAX_INPUT_BYTES) return { items: [], notices: ['This file is larger than 5 MB, which is too big for a certificate.'] };
  if (bytes[0] === 0x30) {
    const item = decodeDer(bytes);
    if (item.result) return { items: [item], notices: [] };
  }
  return inspectText(new TextDecoder().decode(bytes));
}

// ---------- validity and chains ----------

export type Validity = { state: 'expired' | 'not-yet-valid' | 'valid'; days: number };

/** Whole days until expiry (negative once expired), or until it becomes valid. */
export function validity(cert: Pick<Certificate, 'notBefore' | 'notAfter'>, now: number): Validity {
  const day = 86_400_000;
  if (now < cert.notBefore.getTime()) return { state: 'not-yet-valid', days: Math.ceil((cert.notBefore.getTime() - now) / day) };
  if (now > cert.notAfter.getTime()) return { state: 'expired', days: -Math.floor((now - cert.notAfter.getTime()) / day) };
  return { state: 'valid', days: Math.floor((cert.notAfter.getTime() - now) / day) };
}

const keyIdOf = (c: Certificate, kind: 'keyId' | 'aki') => {
  for (const e of c.extensions) {
    if (kind === 'keyId' && e.decoded?.kind === 'keyId') return e.decoded.hex;
    if (kind === 'aki' && e.decoded?.kind === 'aki') return e.decoded.keyId;
  }
  return undefined;
};

/** True when `issuer`'s subject matches `child`'s issuer (and key identifiers agree, when both are present). */
export function issuedBy(child: Certificate, issuer: Certificate): boolean {
  if (!bytesEqual(child.issuer.der, issuer.subject.der)) return false;
  const aki = keyIdOf(child, 'aki');
  const ski = keyIdOf(issuer, 'keyId');
  return !aki || !ski || aki === ski;
}

export interface ChainLink {
  cert: Certificate;
  /** Index into the input order. */
  index: number;
  /** How this cert relates to the next one up the chain. */
  link: 'issued-by-next' | 'self-signed' | 'issuer-missing';
}

export interface ChainReport {
  ordered: ChainLink[];
  /** True when the pasted order was already leaf → root. */
  inOrder: boolean;
  /** Certificates that don't belong to the chain built from the leaf. */
  unrelated: number[];
}

/** Orders certificates from leaf to root by matching issuer and subject names. */
export function buildChain(certs: Certificate[]): ChainReport {
  const issuers = certs.map((c) => certs.findIndex((o) => o !== c && issuedBy(c, o)));
  // The leaf is a cert that issued none of the others.
  const isIssuerOfSomething = new Set(issuers.filter((i) => i >= 0));
  let leaf = certs.findIndex((c, i) => !isIssuerOfSomething.has(i) && !c.selfIssued);
  if (leaf < 0) leaf = certs.findIndex((_, i) => !isIssuerOfSomething.has(i));
  if (leaf < 0) leaf = 0;
  const ordered: ChainLink[] = [];
  const seen = new Set<number>();
  for (let i = leaf; i >= 0 && !seen.has(i); ) {
    seen.add(i);
    const c = certs[i];
    const next = c.selfIssued ? -1 : issuers[i];
    ordered.push({ cert: c, index: i, link: c.selfIssued ? 'self-signed' : next >= 0 && !seen.has(next) ? 'issued-by-next' : 'issuer-missing' });
    i = next;
  }
  const unrelated = certs.map((_, i) => i).filter((i) => !seen.has(i));
  const inOrder = ordered.every((l, k) => l.index === k);
  return { ordered, inOrder, unrelated };
}

// ---------- WebCrypto: fingerprints and signature checks ----------

export async function fingerprint(der: Uint8Array, hash: 'SHA-1' | 'SHA-256'): Promise<string> {
  const d = await crypto.subtle.digest(hash, der as Uint8Array<ArrayBuffer>);
  return toHex(new Uint8Array(d), ':').toUpperCase();
}

const SIG_ALGS: Record<string, { family: 'RSA' | 'ECDSA' | 'Ed25519'; hash?: string }> = {
  '1.2.840.113549.1.1.5': { family: 'RSA', hash: 'SHA-1' },
  '1.2.840.113549.1.1.11': { family: 'RSA', hash: 'SHA-256' },
  '1.2.840.113549.1.1.12': { family: 'RSA', hash: 'SHA-384' },
  '1.2.840.113549.1.1.13': { family: 'RSA', hash: 'SHA-512' },
  '1.2.840.10045.4.3.2': { family: 'ECDSA', hash: 'SHA-256' },
  '1.2.840.10045.4.3.3': { family: 'ECDSA', hash: 'SHA-384' },
  '1.2.840.10045.4.3.4': { family: 'ECDSA', hash: 'SHA-512' },
  '1.3.101.112': { family: 'Ed25519' },
};

/** DER ECDSA-Sig-Value → raw r||s with each half padded to the curve size. */
function ecdsaDerToRaw(sig: Uint8Array, size: number): Uint8Array | null {
  try {
    const s = parseDer(sig);
    if (!isUniversal(s, TAG.SEQUENCE) || s.children.length !== 2) return null;
    const out = new Uint8Array(size * 2);
    for (let k = 0; k < 2; k++) {
      let v = s.children[k].value;
      while (v.length > size && v[0] === 0) v = v.subarray(1);
      if (v.length > size) return null;
      out.set(v, k * size + (size - v.length));
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Checks `child`'s signature with `issuer`'s public key. Returns null when the algorithm
 * isn't supported by WebCrypto here (e.g. RSA-PSS with parameters, DSA, brainpool curves).
 */
export async function verifySignature(child: Certificate, issuer: Certificate): Promise<boolean | null> {
  const alg = SIG_ALGS[child.signatureAlgorithm.oid];
  const key = issuer.publicKey;
  if (!alg || !key.der.length) return null;
  try {
    const spki = key.der as Uint8Array<ArrayBuffer>;
    const data = child.tbs as Uint8Array<ArrayBuffer>;
    if (alg.family === 'RSA') {
      if (key.type !== 'RSA') return false;
      const k = await crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: alg.hash! }, false, ['verify']);
      return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, child.signature as Uint8Array<ArrayBuffer>, data);
    }
    if (alg.family === 'ECDSA') {
      if (key.type !== 'EC') return false;
      if (!key.curve || !['P-256', 'P-384', 'P-521'].includes(key.curve)) return null;
      const raw = ecdsaDerToRaw(child.signature, Math.ceil((key.bits ?? 256) / 8));
      if (!raw) return false;
      const k = await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: key.curve }, false, ['verify']);
      return await crypto.subtle.verify({ name: 'ECDSA', hash: alg.hash! }, k, raw as Uint8Array<ArrayBuffer>, data);
    }
    if (key.type !== 'Ed25519') return false;
    const k = await crypto.subtle.importKey('spki', spki, { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'Ed25519' }, k, child.signature as Uint8Array<ArrayBuffer>, data);
  } catch {
    return null;
  }
}

