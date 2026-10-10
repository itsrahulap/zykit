// Schema-less Protocol Buffers wire-format decoder. Pure TypeScript.
// Shortcut: groups (wire types 3/4) are rejected, and a length-delimited field is guessed as
// message, then string, then bytes; the other readings are listed as alternatives.

import { base64ToBytes } from '../../../shared/lib/base64';
import { bytesToHex, readU32BE } from '../../../shared/lib/bytes';

export const LIMITS = { depth: 16, fields: 50_000, nestedFieldNumber: 100_000, listed: 16 };

export type Kind = 'varint' | 'fixed64' | 'fixed32' | 'message' | 'string' | 'bytes';
export interface Field {
  num: number;
  wire: number;
  /** Offset of the tag, and the end of the whole field, in the input bytes. */
  offset: number;
  end: number;
  kind: Kind;
  /** The most likely reading. */
  value: string;
  /** Other readings of the same bytes. */
  alts: string[];
  children?: Field[];
}
export interface Decoded {
  fields: Field[];
  error?: { message: string; offset: number };
}

class DecodeError extends Error {
  offset: number;
  fatal: boolean;
  constructor(message: string, offset: number, fatal = false) {
    super(message);
    this.offset = offset;
    this.fatal = fatal;
  }
}

export const WIRE_NAMES: Record<number, string> = { 0: 'varint', 1: 'fixed64', 2: 'len', 5: 'fixed32' };

function readVarint(b: Uint8Array, o: number, end: number): { v: bigint; next: number } {
  let v = 0n;
  for (let i = 0; i < 10; i++) {
    if (o + i >= end) throw new DecodeError(`Truncated varint at offset ${o}: the input ends before its last byte.`, o);
    const byte = b[o + i];
    v |= BigInt(byte & 0x7f) << BigInt(7 * i);
    if (!(byte & 0x80)) {
      if (i === 9 && byte > 1) throw new DecodeError(`Varint at offset ${o} is larger than 64 bits.`, o);
      return { v, next: o + i + 1 };
    }
  }
  throw new DecodeError(`Varint at offset ${o} is longer than 10 bytes.`, o);
}

const view = (b: Uint8Array, o: number, n: number) => new DataView(b.buffer, b.byteOffset + o, n);
const num = (x: number, digits: number) => String(Number(x.toPrecision(digits)));
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function asText(b: Uint8Array): string | null {
  try {
    const s = new TextDecoder('utf-8', { fatal: true }).decode(b);
    return CONTROL.test(s) ? null : s;
  } catch {
    return null;
  }
}

const hexOf = (b: Uint8Array) => bytesToHex(b.subarray(0, 32), ' ') + (b.length > 32 ? ` … (${b.length} bytes)` : '');
const q = (s: string) => JSON.stringify(s.length > 200 ? s.slice(0, 200) + '…' : s);

function packed(b: Uint8Array): string[] {
  const alts: string[] = [];
  const list = (name: string, vals: string[]) =>
    alts.push(`${name}: ${vals.slice(0, LIMITS.listed).join(', ')}${vals.length > LIMITS.listed ? ', …' : ''}`);
  try {
    const vals: string[] = [];
    for (let o = 0; o < b.length; ) {
      const r = readVarint(b, o, b.length);
      vals.push(r.v.toString());
      o = r.next;
    }
    if (vals.length > 1) list('packed varints', vals);
  } catch {
    /* not packed varints */
  }
  if (b.length >= 8 && b.length % 4 === 0) list('packed fixed32 (float)', Array.from({ length: b.length / 4 }, (_, i) => num(view(b, i * 4, 4).getFloat32(0, true), 9)));
  if (b.length >= 16 && b.length % 8 === 0) list('packed fixed64 (double)', Array.from({ length: b.length / 8 }, (_, i) => num(view(b, i * 8, 8).getFloat64(0, true), 17)));
  return alts;
}

interface State {
  count: number;
}

/** Parse b[start, end) into `out`. Throws DecodeError; fields read before the error stay in `out`. */
function parse(b: Uint8Array, start: number, end: number, depth: number, st: State, out: Field[], nested: boolean): void {
  let o = start;
  while (o < end) {
    if (++st.count > LIMITS.fields) throw new DecodeError(`More than ${LIMITS.fields} fields: stopped decoding here.`, o, true);
    const tag = readVarint(b, o, end);
    const wire = Number(tag.v & 7n);
    const n = tag.v >> 3n;
    if (n < 1n || n > 536870911n || (nested && n > BigInt(LIMITS.nestedFieldNumber))) throw new DecodeError(`Invalid field number ${n} at offset ${o}.`, o);
    if (wire === 3 || wire === 4) throw new DecodeError(`Wire type ${wire} (${wire === 3 ? 'start' : 'end'} group, deprecated) at offset ${o} is not supported.`, o);
    if (wire > 5 || wire === 3) throw new DecodeError(`Invalid wire type ${wire} at offset ${o}.`, o);
    const f: Field = { num: Number(n), wire, offset: o, end: 0, kind: 'varint', value: '', alts: [] };
    let p = tag.next;
    if (wire === 0) {
      const r = readVarint(b, p, end);
      p = r.next;
      const v = r.v;
      f.value = v.toString();
      const signed = BigInt.asIntN(64, v);
      if (signed < 0n) f.alts.push(`int64: ${signed}`);
      f.alts.push(`sint (zigzag): ${(v >> 1n) ^ -(v & 1n)}`);
      if (v <= 1n) f.alts.push(`bool: ${v === 1n}`);
    } else if (wire === 1 || wire === 5) {
      const size = wire === 1 ? 8 : 4;
      if (p + size > end) throw new DecodeError(`Truncated fixed${size * 8} field ${n} at offset ${o}: needs ${size} bytes but ${end - p} remain.`, o);
      const dv = view(b, p, size);
      p += size;
      f.kind = wire === 1 ? 'fixed64' : 'fixed32';
      if (wire === 1) {
        f.value = dv.getBigUint64(0, true).toString();
        f.alts.push(`int64: ${dv.getBigInt64(0, true)}`, `double: ${num(dv.getFloat64(0, true), 17)}`);
      } else {
        f.value = String(dv.getUint32(0, true));
        f.alts.push(`int32: ${dv.getInt32(0, true)}`, `float: ${num(dv.getFloat32(0, true), 9)}`);
      }
    } else {
      const len = readVarint(b, p, end);
      p = len.next;
      if (len.v > BigInt(end - p)) throw new DecodeError(`Truncated length-delimited field ${n} at offset ${o}: it declares ${len.v} bytes but ${end - p} remain.`, o);
      const dataStart = p;
      p += Number(len.v);
      const data = b.subarray(dataStart, p);
      const text = asText(data);
      let kids: Field[] | null = null;
      if (data.length && depth < LIMITS.depth) {
        const before = st.count;
        const tryKids: Field[] = [];
        try {
          parse(b, dataStart, p, depth + 1, st, tryKids, true);
          kids = tryKids;
        } catch (e) {
          if (e instanceof DecodeError && e.fatal) throw e;
          st.count = before;
        }
      }
      if (kids) {
        f.kind = 'message';
        f.children = kids;
        f.value = `message, ${kids.length} field${kids.length === 1 ? '' : 's'}`;
        if (text !== null) f.alts.push(`string: ${q(text)}`);
        f.alts.push(`bytes: ${hexOf(data)}`);
      } else if (text !== null) {
        f.kind = 'string';
        f.value = q(text);
        f.alts.push(`bytes: ${hexOf(data)}`, ...packed(data));
      } else {
        f.kind = 'bytes';
        f.value = hexOf(data);
        f.alts.push(...packed(data));
      }
    }
    f.end = p;
    out.push(f);
    o = p;
  }
}

/** Decode a message. A malformed or truncated tail gives `error` along with the fields read before it. */
export function decodeMessage(bytes: Uint8Array, start = 0, end = bytes.length): Decoded {
  const fields: Field[] = [];
  try {
    parse(bytes, start, end, 0, { count: 0 }, fields, false);
    return { fields };
  } catch (e) {
    if (e instanceof DecodeError) return { fields, error: { message: e.message, offset: e.offset } };
    throw e;
  }
}

export interface Frame {
  offset: number;
  compressed: boolean;
  length: number;
  result: Decoded;
}

/** Split gRPC / gRPC-Web length-prefixed frames (1 flag byte + 4-byte big-endian length) and decode each. */
export function decodeGrpc(bytes: Uint8Array): { frames: Frame[]; error?: { message: string; offset: number } } {
  const frames: Frame[] = [];
  for (let o = 0; o < bytes.length; ) {
    if (o + 5 > bytes.length) return { frames, error: { message: `Truncated gRPC frame header at offset ${o}: needs 5 bytes but ${bytes.length - o} remain.`, offset: o } };
    const flag = bytes[o];
    const length = readU32BE(bytes, o + 1);
    if (flag > 1) return { frames, error: { message: `Offset ${o} does not look like a gRPC frame (flag byte ${flag}, expected 0 or 1).`, offset: o } };
    if (o + 5 + length > bytes.length) return { frames, error: { message: `Truncated gRPC frame at offset ${o}: it declares ${length} bytes but ${bytes.length - o - 5} remain.`, offset: o } };
    frames.push({ offset: o, compressed: flag === 1, length, result: flag ? { fields: [] } : decodeMessage(bytes, o + 5, o + 5 + length) });
    o += 5 + length;
  }
  if (!frames.length) return { frames, error: { message: 'No gRPC frame found.', offset: 0 } };
  return { frames };
}

export type InputFormat = 'auto' | 'hex' | 'base64' | 'base64url';

/** Bytes from hex (spaces, `0x`, `:` and commas ignored), Base64 or Base64URL text. Throws Error with a readable message. */
export function bytesFromText(text: string, format: InputFormat = 'auto'): Uint8Array {
  const t = text.trim();
  const hexish = (s: string) => /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;
  const cleanHex = t.replace(/0x/gi, '').replace(/[\s:,]/g, '');
  const fmt = format !== 'auto' ? format : hexish(cleanHex) && /^[0-9a-fA-F\s:,x]+$/.test(t) ? 'hex' : /[-_]/.test(t) ? 'base64url' : 'base64';
  if (fmt === 'hex') {
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) throw new Error('Not valid hex: use only 0-9 and a-f.');
    if (cleanHex.length % 2) throw new Error('Hex needs an even number of digits.');
    return Uint8Array.from(cleanHex.match(/../g) ?? [], (h) => parseInt(h, 16));
  }
  return base64ToBytes(t, fmt === 'base64url');
}

/** Indented plain-text dump of a decoded tree. */
export function fieldsToText(fields: Field[], indent = ''): string {
  return fields
    .map((f) => {
      const head = `${indent}${f.num} (${WIRE_NAMES[f.wire]}, @${f.offset}): ${f.kind === 'message' ? 'message' : f.value}`;
      return f.children ? `${head}\n${fieldsToText(f.children, indent + '  ')}` : head;
    })
    .join('\n');
}
