// Decoders for X.509 certificates, PKCS#10 CSRs, SubjectPublicKeyInfo and private key containers,
// built on the strict DER reader in asn1.ts.

import {
  Asn1Error,
  bitLength,
  expectType,
  integerBytes,
  isContext,
  isUniversal,
  parseInner,
  readBitString,
  readBoolean,
  readOid,
  readSmallInt,
  readString,
  readTime,
  TAG,
  toHex,
  type Asn1Node,
} from './asn1';
import { CURVE_BITS, oidName } from './oids';

export interface DnAttribute {
  oid: string;
  name: string;
  value: string;
}
export interface DistinguishedName {
  attributes: DnAttribute[];
  /** "CN=example.com, O=Example" (most specific first, as usually displayed). */
  text: string;
  /** Raw DER, for comparing issuer/subject exactly. */
  der: Uint8Array;
}

export interface AlgorithmId {
  oid: string;
  name: string;
  /** Hash, MGF, salt for RSA-PSS; curve for EC keys. */
  params?: string;
}

export interface PublicKeyInfo {
  algorithm: AlgorithmId;
  /** "RSA", "EC", "Ed25519"… */
  type: string;
  /** Key size in bits (RSA modulus, EC curve order size, 256 for Ed25519…). */
  bits?: number;
  curve?: string;
  exponent?: number;
  /** Raw SPKI DER (for importing into WebCrypto). */
  der: Uint8Array;
}

export interface GeneralName {
  type: 'DNS' | 'IP' | 'email' | 'URI' | 'DirName' | 'other';
  value: string;
}

export interface Extension {
  oid: string;
  name: string;
  critical: boolean;
  /** Decoded details, or null when this extension type isn't decoded. */
  decoded: DecodedExtension | null;
  error?: string;
}

export type DecodedExtension =
  | { kind: 'names'; names: GeneralName[] }
  | { kind: 'keyUsage'; usages: string[] }
  | { kind: 'eku'; purposes: { oid: string; name: string }[] }
  | { kind: 'basicConstraints'; ca: boolean; pathLen?: number }
  | { kind: 'keyId'; hex: string }
  | { kind: 'aki'; keyId?: string; issuer?: GeneralName[]; serial?: string }
  | { kind: 'crlDp'; urls: GeneralName[] }
  | { kind: 'aia'; entries: { method: string; location: GeneralName }[] }
  | { kind: 'policies'; policies: { oid: string; name: string; cps?: string[] }[] }
  | { kind: 'sct'; count: number | null }
  | { kind: 'flag'; text: string };

export interface Certificate {
  kind: 'certificate';
  version: number;
  serialHex: string;
  signatureAlgorithm: AlgorithmId;
  issuer: DistinguishedName;
  subject: DistinguishedName;
  notBefore: Date;
  notAfter: Date;
  publicKey: PublicKeyInfo;
  extensions: Extension[];
  selfIssued: boolean;
  /** For signature verification. */
  tbs: Uint8Array;
  signature: Uint8Array;
  der: Uint8Array;
}

export interface CertificateRequest {
  kind: 'csr';
  version: number;
  subject: DistinguishedName;
  publicKey: PublicKeyInfo;
  signatureAlgorithm: AlgorithmId;
  extensions: Extension[];
  otherAttributes: { oid: string; name: string }[];
  der: Uint8Array;
}

export interface PublicKeyBlock {
  kind: 'public-key';
  publicKey: PublicKeyInfo;
  format: 'SPKI' | 'PKCS#1';
  der: Uint8Array;
}

/** Only metadata: private key material is never surfaced. */
export interface PrivateKeyBlock {
  kind: 'private-key';
  format: 'PKCS#8' | 'PKCS#1 RSA' | 'SEC1 EC' | 'Encrypted PKCS#8' | 'OpenSSH' | 'Unknown';
  type: string;
  bits?: number;
  curve?: string;
  encrypted: boolean;
}

// ---------- helpers ----------

const seq = (n: Asn1Node | undefined, what: string) => expectType(n, TAG.SEQUENCE, what);

const IPV4 = (b: Uint8Array) => Array.from(b).join('.');
function ipv6(b: Uint8Array): string {
  const groups: string[] = [];
  for (let i = 0; i < 16; i += 2) groups.push(((b[i] << 8) | b[i + 1]).toString(16));
  // Compress the longest run of zero groups.
  let best = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== '0') {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === '0') j++;
    if (j - i > bestLen && j - i > 1) {
      best = i;
      bestLen = j - i;
    }
    i = j;
  }
  if (best < 0) return groups.join(':');
  return `${groups.slice(0, best).join(':')}::${groups.slice(best + bestLen).join(':')}`;
}

function readName(n: Asn1Node | undefined): DistinguishedName {
  const name = seq(n, 'a distinguished name');
  const attributes: DnAttribute[] = [];
  for (const rdn of name.children) {
    expectType(rdn, TAG.SET, 'a relative distinguished name');
    for (const atv of rdn.children) {
      const s = seq(atv, 'a name attribute');
      const oid = readOid(s.children[0]);
      let value: string;
      try {
        value = readString(s.children[1]);
      } catch {
        value = `#${toHex(s.children[1]?.value ?? new Uint8Array())}`;
      }
      attributes.push({ oid, name: oidName(oid), value });
    }
  }
  const text = [...attributes]
    .reverse()
    .map((a) => `${a.name}=${a.value}`)
    .join(', ');
  return { attributes, text, der: name.value };
}

function readAlgorithm(n: Asn1Node | undefined): AlgorithmId {
  const s = seq(n, 'an algorithm identifier');
  const oid = readOid(s.children[0]);
  const alg: AlgorithmId = { oid, name: oidName(oid) };
  const p = s.children[1];
  if (oid === '1.2.840.10045.2.1' && isUniversal(p, TAG.OID)) alg.params = oidName(readOid(p));
  if (oid === '1.2.840.113549.1.1.10' && isUniversal(p, TAG.SEQUENCE)) {
    // RSASSA-PSS-params: [0] hash, [1] mgf, [2] salt length. Defaults: SHA-1, MGF1-SHA1, 20.
    let hash = 'SHA-1';
    let salt = 20;
    for (const c of p.children) {
      if (isContext(c, 0) && c.children[0]) hash = oidName(readOid(c.children[0].children[0]));
      if (isContext(c, 2) && c.children[0]) salt = readSmallInt(c.children[0]);
    }
    alg.params = `${hash}, salt ${salt}`;
  }
  return alg;
}

export function readPublicKeyInfo(n: Asn1Node | undefined, src?: Uint8Array): PublicKeyInfo {
  const s = seq(n, 'a SubjectPublicKeyInfo');
  const algorithm = readAlgorithm(s.children[0]);
  const { bytes } = readBitString(s.children[1]);
  const der = src ? src.subarray(s.start, s.end) : new Uint8Array();
  const info: PublicKeyInfo = { algorithm, type: algorithm.name, der };
  switch (algorithm.oid) {
    case '1.2.840.113549.1.1.1':
    case '1.2.840.113549.1.1.10': {
      info.type = algorithm.oid === '1.2.840.113549.1.1.10' ? 'RSA-PSS' : 'RSA';
      const rsa = seq(parseInner(bytes), 'an RSA public key');
      info.bits = bitLength(integerBytes(rsa.children[0]));
      const e = integerBytes(rsa.children[1]);
      if (e.length <= 6) info.exponent = e.reduce((a, b) => a * 256 + b, 0);
      break;
    }
    case '1.2.840.10045.2.1':
      info.type = 'EC';
      info.curve = algorithm.params;
      info.bits = info.curve ? CURVE_BITS[info.curve] : undefined;
      break;
    case '1.3.101.112':
    case '1.3.101.110':
      info.bits = 256;
      break;
    case '1.3.101.113':
      info.bits = 456;
      break;
    case '1.3.101.111':
      info.bits = 448;
      break;
    case '1.2.840.10040.4.1': {
      const params = s.children[0].children[1];
      if (isUniversal(params, TAG.SEQUENCE)) info.bits = bitLength(integerBytes(params.children[0]));
      break;
    }
  }
  return info;
}

function readGeneralName(n: Asn1Node): GeneralName {
  if (n.cls !== 'context') return { type: 'other', value: '(unrecognised name)' };
  const text = () => Array.from(n.value, (c) => String.fromCharCode(c)).join('');
  switch (n.tag) {
    case 1:
      return { type: 'email', value: text() };
    case 2:
      return { type: 'DNS', value: text() };
    case 6:
      return { type: 'URI', value: text() };
    case 7:
      if (n.value.length === 4) return { type: 'IP', value: IPV4(n.value) };
      if (n.value.length === 16) return { type: 'IP', value: ipv6(n.value) };
      if (n.value.length === 8) return { type: 'IP', value: `${IPV4(n.value.subarray(0, 4))}/${IPV4(n.value.subarray(4))}` };
      if (n.value.length === 32) return { type: 'IP', value: `${ipv6(n.value.subarray(0, 16))}/${ipv6(n.value.subarray(16))}` };
      return { type: 'IP', value: `#${toHex(n.value)}` };
    case 4:
      return { type: 'DirName', value: n.children[0] ? readName(n.children[0]).text : '' };
    case 0:
      return { type: 'other', value: n.children[0] ? `otherName ${oidName(readOid(n.children[0]))}` : 'otherName' };
    default:
      return { type: 'other', value: `[${n.tag}] #${toHex(n.value)}` };
  }
}

const readGeneralNames = (n: Asn1Node | undefined) => seq(n, 'general names').children.map(readGeneralName);

const KEY_USAGES = [
  'Digital signature',
  'Non-repudiation',
  'Key encipherment',
  'Data encipherment',
  'Key agreement',
  'Certificate signing',
  'CRL signing',
  'Encipher only',
  'Decipher only',
];

function decodeExtension(oid: string, value: Uint8Array): DecodedExtension | null {
  const root = () => parseInner(value);
  switch (oid) {
    case '2.5.29.17':
    case '2.5.29.18':
      return { kind: 'names', names: readGeneralNames(root()) };
    case '2.5.29.15': {
      const { bytes } = readBitString(root());
      const usages = KEY_USAGES.filter((_, i) => (bytes[i >> 3] ?? 0) & (0x80 >> (i & 7)));
      return { kind: 'keyUsage', usages };
    }
    case '2.5.29.37':
      return {
        kind: 'eku',
        purposes: seq(root(), 'extended key usages').children.map((c) => {
          const o = readOid(c);
          return { oid: o, name: oidName(o) };
        }),
      };
    case '2.5.29.19': {
      const s = seq(root(), 'basic constraints');
      let i = 0;
      let ca = false;
      if (isUniversal(s.children[0], TAG.BOOLEAN)) ca = readBoolean(s.children[i++]);
      const pathLen = isUniversal(s.children[i], TAG.INTEGER) ? readSmallInt(s.children[i]) : undefined;
      return { kind: 'basicConstraints', ca, pathLen };
    }
    case '2.5.29.14':
      return { kind: 'keyId', hex: toHex(expectType(root(), TAG.OCTET_STRING, 'a key identifier').value, ':') };
    case '2.5.29.35': {
      const out: DecodedExtension = { kind: 'aki' };
      for (const c of seq(root(), 'an authority key identifier').children) {
        if (isContext(c, 0)) out.keyId = toHex(c.value, ':');
        if (isContext(c, 1)) out.issuer = c.children.map(readGeneralName);
        if (isContext(c, 2)) out.serial = toHex(c.value, ':');
      }
      return out;
    }
    case '2.5.29.31': {
      const urls: GeneralName[] = [];
      for (const dp of seq(root(), 'CRL distribution points').children) {
        const name = seq(dp, 'a distribution point').children.find((c) => isContext(c, 0));
        const full = name?.children.find((c) => isContext(c, 0));
        if (full) urls.push(...full.children.map(readGeneralName));
      }
      return { kind: 'crlDp', urls };
    }
    case '1.3.6.1.5.5.7.1.1':
    case '1.3.6.1.5.5.7.1.11':
      return {
        kind: 'aia',
        entries: seq(root(), 'access descriptions').children.map((ad) => {
          const s = seq(ad, 'an access description');
          const m = readOid(s.children[0]);
          if (!s.children[1]) throw new Asn1Error('Access description without a location.');
          return { method: oidName(m), location: readGeneralName(s.children[1]) };
        }),
      };
    case '2.5.29.32':
      return {
        kind: 'policies',
        policies: seq(root(), 'certificate policies').children.map((pi) => {
          const s = seq(pi, 'a policy');
          const o = readOid(s.children[0]);
          const cps: string[] = [];
          if (isUniversal(s.children[1], TAG.SEQUENCE)) {
            for (const q of s.children[1].children) {
              if (readOid(q.children[0]) === '1.3.6.1.5.5.7.2.1') {
                try {
                  cps.push(readString(q.children[1]));
                } catch {
                  /* non-string qualifier */
                }
              }
            }
          }
          return { oid: o, name: oidName(o), cps: cps.length ? cps : undefined };
        }),
      };
    case '1.3.6.1.4.1.11129.2.4.2': {
      // OCTET STRING containing a TLS-encoded SignedCertificateTimestampList.
      const inner = expectType(root(), TAG.OCTET_STRING, 'an SCT list').value;
      if (inner.length < 2) return { kind: 'sct', count: null };
      const total = (inner[0] << 8) | inner[1];
      if (total !== inner.length - 2) return { kind: 'sct', count: null };
      let count = 0;
      for (let p = 2; p + 2 <= inner.length; ) {
        const len = (inner[p] << 8) | inner[p + 1];
        p += 2 + len;
        if (p > inner.length) return { kind: 'sct', count: null };
        count++;
      }
      return { kind: 'sct', count };
    }
    case '1.3.6.1.4.1.11129.2.4.3':
      return { kind: 'flag', text: 'This is a precertificate for Certificate Transparency, not a usable certificate.' };
    case '1.3.6.1.5.5.7.1.24':
      return { kind: 'flag', text: 'OCSP Must-Staple: servers must staple an OCSP response.' };
    default:
      return null;
  }
}

function readExtensions(list: Asn1Node): Extension[] {
  return seq(list, 'extensions').children.map((e) => {
    const s = seq(e, 'an extension');
    const oid = readOid(s.children[0]);
    let i = 1;
    let critical = false;
    if (isUniversal(s.children[1], TAG.BOOLEAN)) {
      critical = readBoolean(s.children[1]);
      i = 2;
    }
    const value = expectType(s.children[i], TAG.OCTET_STRING, 'an extension value').value;
    const ext: Extension = { oid, name: oidName(oid), critical, decoded: null };
    try {
      ext.decoded = decodeExtension(oid, value);
    } catch (err) {
      ext.error = err instanceof Asn1Error ? err.message : 'Could not decode this extension.';
    }
    return ext;
  });
}

// ---------- top-level decoders ----------

export function decodeCertificate(der: Uint8Array, root: Asn1Node): Certificate {
  const cert = seq(root, 'a certificate');
  if (cert.children.length !== 3) throw new Asn1Error('A certificate has three parts: TBS, algorithm and signature.');
  const tbs = seq(cert.children[0], 'the TBSCertificate');
  const c = tbs.children;
  let i = 0;
  let version = 1;
  if (isContext(c[0], 0)) {
    version = readSmallInt(c[0].children[0]) + 1;
    i++;
  }
  const serialNode = expectType(c[i++], TAG.INTEGER, 'a serial number');
  const serialHex = toHex(serialNode.value.length > 1 && serialNode.value[0] === 0 ? serialNode.value.subarray(1) : serialNode.value, ':');
  readAlgorithm(c[i++]); // inner signature algorithm (must match the outer one)
  const issuer = readName(c[i++]);
  const validity = seq(c[i++], 'the validity period');
  const notBefore = readTime(validity.children[0]);
  const notAfter = readTime(validity.children[1]);
  const subject = readName(c[i++]);
  const publicKey = readPublicKeyInfo(c[i++], der);
  let extensions: Extension[] = [];
  for (; i < c.length; i++) {
    if (isContext(c[i], 3) && c[i].children[0]) extensions = readExtensions(c[i].children[0]);
  }
  const signatureAlgorithm = readAlgorithm(cert.children[1]);
  const { bytes: signature } = readBitString(cert.children[2]);
  return {
    kind: 'certificate',
    version,
    serialHex,
    signatureAlgorithm,
    issuer,
    subject,
    notBefore,
    notAfter,
    publicKey,
    extensions,
    selfIssued: bytesEqual(issuer.der, subject.der),
    tbs: der.subarray(tbs.start, tbs.end),
    signature,
    der,
  };
}

export function decodeCsr(der: Uint8Array, root: Asn1Node): CertificateRequest {
  const req = seq(root, 'a certificate request');
  const info = seq(req.children[0], 'the CertificationRequestInfo');
  const version = readSmallInt(info.children[0]) + 1;
  const subject = readName(info.children[1]);
  const publicKey = readPublicKeyInfo(info.children[2], der);
  let extensions: Extension[] = [];
  const otherAttributes: { oid: string; name: string }[] = [];
  const attrs = info.children[3];
  if (isContext(attrs, 0)) {
    for (const a of attrs.children) {
      const s = seq(a, 'an attribute');
      const oid = readOid(s.children[0]);
      if (oid === '1.2.840.113549.1.9.14') {
        const set = expectType(s.children[1], TAG.SET, 'attribute values');
        if (set.children[0]) extensions = readExtensions(set.children[0]);
      } else otherAttributes.push({ oid, name: oidName(oid) });
    }
  }
  return { kind: 'csr', version, subject, publicKey, signatureAlgorithm: readAlgorithm(req.children[1]), extensions, otherAttributes, der };
}

export function decodePublicKey(der: Uint8Array, root: Asn1Node): PublicKeyBlock {
  return { kind: 'public-key', format: 'SPKI', publicKey: readPublicKeyInfo(root, der), der };
}

/** PKCS#1 "RSA PUBLIC KEY". */
export function decodeRsaPublicKey(der: Uint8Array, root: Asn1Node): PublicKeyBlock {
  const s = seq(root, 'an RSA public key');
  const e = integerBytes(s.children[1]);
  return {
    kind: 'public-key',
    format: 'PKCS#1',
    publicKey: {
      algorithm: { oid: '1.2.840.113549.1.1.1', name: 'RSA' },
      type: 'RSA',
      bits: bitLength(integerBytes(s.children[0])),
      exponent: e.length <= 6 ? e.reduce((a, b) => a * 256 + b, 0) : undefined,
      der: new Uint8Array(),
    },
    der,
  };
}

/** Reads only the algorithm and size of a private key. The key material is never returned. */
export function decodePrivateKey(root: Asn1Node, format: 'PKCS#8' | 'PKCS#1 RSA' | 'SEC1 EC'): PrivateKeyBlock {
  const s = seq(root, 'a private key');
  if (format === 'PKCS#1 RSA') return { kind: 'private-key', format, type: 'RSA', bits: bitLength(integerBytes(s.children[1])), encrypted: false };
  if (format === 'SEC1 EC') {
    const params = s.children.find((c) => isContext(c, 0));
    const curve = params?.children[0] && isUniversal(params.children[0], TAG.OID) ? oidName(readOid(params.children[0])) : undefined;
    return { kind: 'private-key', format, type: 'EC', curve, bits: curve ? CURVE_BITS[curve] : undefined, encrypted: false };
  }
  readSmallInt(s.children[0]);
  const alg = readAlgorithm(s.children[1]);
  const out: PrivateKeyBlock = { kind: 'private-key', format, type: alg.name, encrypted: false };
  if (alg.oid === '1.2.840.10045.2.1') {
    out.type = 'EC';
    out.curve = alg.params;
    out.bits = alg.params ? CURVE_BITS[alg.params] : undefined;
  } else if (alg.oid === '1.2.840.113549.1.1.1' || alg.oid === '1.2.840.113549.1.1.10') {
    const inner = seq(parseInner(expectType(s.children[2], TAG.OCTET_STRING, 'the private key').value), 'an RSA private key');
    out.bits = bitLength(integerBytes(inner.children[1]));
  } else if (alg.oid === '1.3.101.112' || alg.oid === '1.3.101.110') out.bits = 256;
  return out;
}

export const bytesEqual = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Guesses what a DER structure is from its shape. */
export function sniffDer(root: Asn1Node): 'certificate' | 'csr' | 'public-key' | 'private-key' | 'rsa-private-key' | 'ec-private-key' | 'encrypted-private-key' | null {
  if (!isUniversal(root, TAG.SEQUENCE)) return null;
  const [a, b, c] = root.children;
  if (root.children.length === 3 && isUniversal(a, TAG.SEQUENCE) && isUniversal(b, TAG.SEQUENCE) && isUniversal(c, TAG.BIT_STRING)) {
    const inner = a.children;
    if (isContext(inner[0], 0) || inner.length >= 6) return 'certificate';
    if (inner.length >= 3 && isUniversal(inner[0], TAG.INTEGER) && isUniversal(inner[2], TAG.SEQUENCE)) return 'csr';
  }
  if (root.children.length === 2 && isUniversal(a, TAG.SEQUENCE) && isUniversal(b, TAG.BIT_STRING)) return 'public-key';
  if (root.children.length === 2 && isUniversal(a, TAG.SEQUENCE) && isUniversal(b, TAG.OCTET_STRING)) return 'encrypted-private-key';
  if (isUniversal(a, TAG.INTEGER) && isUniversal(b, TAG.SEQUENCE) && isUniversal(c, TAG.OCTET_STRING)) return 'private-key';
  if (root.children.length >= 9 && root.children.every((x) => isUniversal(x, TAG.INTEGER))) return 'rsa-private-key';
  if (isUniversal(a, TAG.INTEGER) && isUniversal(b, TAG.OCTET_STRING)) return 'ec-private-key';
  return null;
}
