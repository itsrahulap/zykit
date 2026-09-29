// Minimal, strict DER (ASN.1) reader. Input is treated as hostile: every length is checked
// against the enclosing buffer, indefinite lengths are rejected and nesting is capped.

export class Asn1Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Asn1Error';
  }
}

export type TagClass = 'universal' | 'application' | 'context' | 'private';

export interface Asn1Node {
  cls: TagClass;
  tag: number;
  constructed: boolean;
  /** Offset of the tag byte in the source buffer. */
  start: number;
  /** Offset just past the value. */
  end: number;
  /** Header (tag + length) size in bytes. */
  headerLength: number;
  /** The value bytes (a view into the source buffer). */
  value: Uint8Array;
  /** Parsed children for constructed nodes. */
  children: Asn1Node[];
}

export const TAG = {
  BOOLEAN: 1,
  INTEGER: 2,
  BIT_STRING: 3,
  OCTET_STRING: 4,
  NULL: 5,
  OID: 6,
  ENUMERATED: 10,
  UTF8_STRING: 12,
  SEQUENCE: 16,
  SET: 17,
  NUMERIC_STRING: 18,
  PRINTABLE_STRING: 19,
  T61_STRING: 20,
  IA5_STRING: 22,
  UTC_TIME: 23,
  GENERALIZED_TIME: 24,
  VISIBLE_STRING: 26,
  UNIVERSAL_STRING: 28,
  BMP_STRING: 30,
} as const;

export const MAX_DEPTH = 32;
const MAX_NODES = 100_000;
const CLASSES: TagClass[] = ['universal', 'application', 'context', 'private'];

interface State {
  nodes: number;
}

function readNode(buf: Uint8Array, pos: number, limit: number, depth: number, state: State): Asn1Node {
  if (depth > MAX_DEPTH) throw new Asn1Error(`ASN.1 nesting is deeper than ${MAX_DEPTH} levels.`);
  if (++state.nodes > MAX_NODES) throw new Asn1Error('Too many ASN.1 elements.');
  const start = pos;
  if (pos >= limit) throw new Asn1Error(`Unexpected end of data at byte ${pos}.`);
  const first = buf[pos++];
  const cls = CLASSES[first >> 6];
  const constructed = (first & 0x20) !== 0;
  let tag = first & 0x1f;
  if (tag === 0x1f) {
    // High tag number form: base-128, at most 4 bytes.
    tag = 0;
    for (let i = 0; ; i++) {
      if (pos >= limit) throw new Asn1Error('Truncated ASN.1 tag.');
      if (i >= 4) throw new Asn1Error('ASN.1 tag number is too large.');
      const b = buf[pos++];
      if (i === 0 && b === 0x80) throw new Asn1Error('Non-minimal ASN.1 tag encoding.');
      tag = tag * 128 + (b & 0x7f);
      if (!(b & 0x80)) break;
    }
  }
  if (pos >= limit) throw new Asn1Error('Truncated ASN.1 length.');
  let len = buf[pos++];
  if (len === 0x80) throw new Asn1Error('Indefinite-length encoding is not allowed in DER.');
  if (len > 0x80) {
    const n = len & 0x7f;
    if (n > 4) throw new Asn1Error('ASN.1 length is too large.');
    if (pos + n > limit) throw new Asn1Error('Truncated ASN.1 length.');
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + buf[pos++];
    if (buf[pos - n] === 0 || len < 0x80) throw new Asn1Error('Non-minimal ASN.1 length encoding.');
  }
  const headerLength = pos - start;
  const end = pos + len;
  if (end > limit) throw new Asn1Error(`ASN.1 element at byte ${start} claims ${len} bytes but only ${limit - pos} remain.`);
  const value = buf.subarray(pos, end);
  const children: Asn1Node[] = [];
  if (constructed) {
    let p = pos;
    while (p < end) {
      const child = readNode(buf, p, end, depth + 1, state);
      children.push(child);
      p = child.end;
    }
  }
  return { cls, tag, constructed, start, end, headerLength, value, children };
}

/** Parses one DER element that must span the whole buffer. */
export function parseDer(buf: Uint8Array): Asn1Node {
  const node = readNode(buf, 0, buf.length, 0, { nodes: 0 });
  if (node.end !== buf.length) throw new Asn1Error(`${buf.length - node.end} unexpected bytes after the ASN.1 data.`);
  return node;
}

/** Parses the content of a primitive node (e.g. an OCTET STRING or BIT STRING wrapping DER). */
export function parseInner(bytes: Uint8Array): Asn1Node {
  return parseDer(bytes);
}

export const isUniversal = (n: Asn1Node | undefined, tag: number): n is Asn1Node => !!n && n.cls === 'universal' && n.tag === tag;
export const isContext = (n: Asn1Node | undefined, tag: number): n is Asn1Node => !!n && n.cls === 'context' && n.tag === tag;

/** Asserts `n` is the given universal type and returns it. */
export function expectType(n: Asn1Node | undefined, tag: number, what: string): Asn1Node {
  if (!isUniversal(n, tag)) throw new Asn1Error(`Expected ${what}.`);
  if ((tag === TAG.SEQUENCE || tag === TAG.SET) !== n.constructed) throw new Asn1Error(`Malformed ${what}.`);
  return n;
}

export function readOid(n: Asn1Node | undefined): string {
  const v = expectType(n, TAG.OID, 'an object identifier').value;
  if (!v.length) throw new Asn1Error('Empty object identifier.');
  const parts: number[] = [];
  let acc = 0;
  let digits = 0;
  for (let i = 0; i < v.length; i++) {
    if (digits === 0 && v[i] === 0x80) throw new Asn1Error('Non-minimal object identifier.');
    acc = acc * 128 + (v[i] & 0x7f);
    digits++;
    if (acc > Number.MAX_SAFE_INTEGER / 128) throw new Asn1Error('Object identifier component is too large.');
    if (!(v[i] & 0x80)) {
      parts.push(acc);
      acc = 0;
      digits = 0;
    }
  }
  if (digits) throw new Asn1Error('Truncated object identifier.');
  const first = parts[0];
  const head = first < 40 ? [0, first] : first < 80 ? [1, first - 40] : [2, first - 80];
  return [...head, ...parts.slice(1)].join('.');
}

export const toHex = (b: Uint8Array, sep = ''): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(sep);

/** INTEGER value bytes with a single leading sign-padding zero removed. */
export function integerBytes(n: Asn1Node | undefined): Uint8Array {
  const v = expectType(n, TAG.INTEGER, 'an integer').value;
  if (!v.length) throw new Asn1Error('Empty integer.');
  return v.length > 1 && v[0] === 0 ? v.subarray(1) : v;
}

/** Small non-negative INTEGER as a number. */
export function readSmallInt(n: Asn1Node | undefined): number {
  const v = expectType(n, TAG.INTEGER, 'an integer').value;
  if (!v.length || v.length > 6) throw new Asn1Error('Integer is out of range.');
  if (v[0] & 0x80) throw new Asn1Error('Negative integer where a positive one was expected.');
  let x = 0;
  for (const b of v) x = x * 256 + b;
  return x;
}

/** Bit length of an unsigned big-endian integer. */
export function bitLength(b: Uint8Array): number {
  let i = 0;
  while (i < b.length && b[i] === 0) i++;
  if (i === b.length) return 0;
  return (b.length - i - 1) * 8 + (32 - Math.clz32(b[i]));
}

export function readBoolean(n: Asn1Node | undefined): boolean {
  const v = expectType(n, TAG.BOOLEAN, 'a boolean').value;
  if (v.length !== 1) throw new Asn1Error('Malformed boolean.');
  return v[0] !== 0;
}

/** BIT STRING content without the unused-bits byte. */
export function readBitString(n: Asn1Node | undefined): { bytes: Uint8Array; unused: number } {
  const v = expectType(n, TAG.BIT_STRING, 'a bit string').value;
  if (!v.length || v[0] > 7 || (v.length === 1 && v[0] !== 0)) throw new Asn1Error('Malformed bit string.');
  return { bytes: v.subarray(1), unused: v[0] };
}

const latin1 = (v: Uint8Array) => Array.from(v, (c) => String.fromCharCode(c)).join('');

/** Decodes any ASN.1 string type to text. */
export function readString(n: Asn1Node | undefined): string {
  if (!n || n.cls !== 'universal' || n.constructed) throw new Asn1Error('Expected a string.');
  const v = n.value;
  switch (n.tag) {
    case TAG.UTF8_STRING:
      return new TextDecoder('utf-8', { fatal: false }).decode(v);
    case TAG.BMP_STRING: {
      let s = '';
      for (let i = 0; i + 1 < v.length; i += 2) s += String.fromCharCode((v[i] << 8) | v[i + 1]);
      return s;
    }
    case TAG.UNIVERSAL_STRING: {
      let s = '';
      for (let i = 0; i + 3 < v.length; i += 4) {
        const cp = ((v[i] << 24) | (v[i + 1] << 16) | (v[i + 2] << 8) | v[i + 3]) >>> 0;
        s += cp <= 0x10ffff ? String.fromCodePoint(cp) : '�';
      }
      return s;
    }
    case TAG.PRINTABLE_STRING:
    case TAG.IA5_STRING:
    case TAG.NUMERIC_STRING:
    case TAG.VISIBLE_STRING:
    case TAG.T61_STRING:
      return latin1(v);
    default:
      throw new Asn1Error('Unsupported string type.');
  }
}

/** UTCTime or GeneralizedTime (Z form, as DER requires). */
export function readTime(n: Asn1Node | undefined): Date {
  if (!n || n.cls !== 'universal' || (n.tag !== TAG.UTC_TIME && n.tag !== TAG.GENERALIZED_TIME)) throw new Asn1Error('Expected a time.');
  const s = latin1(n.value);
  const m =
    n.tag === TAG.UTC_TIME ? s.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/) : s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.\d+)?Z$/);
  if (!m) throw new Asn1Error(`Malformed time "${s}".`);
  let year = Number(m[1]);
  if (n.tag === TAG.UTC_TIME) year += year < 50 ? 2000 : 1900;
  const d = new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)));
  if (Number.isNaN(d.getTime())) throw new Asn1Error(`Invalid time "${s}".`);
  return d;
}
