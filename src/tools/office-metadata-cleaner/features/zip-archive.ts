// A minimal ZIP reader and rewriter for Office documents.
//  - Reads the central directory (no ZIP64, no encryption); entries can be stored (0) or deflated (8).
//  - Refuses unsafe entry names (zip-slip: `..`, absolute paths, backslashes, control characters),
//    duplicate names, too many entries and over-large parts.
//  - Inflates only the parts you ask for, with a hard output cap (decompression-bomb safe).
//  - Rewrites an archive by copying untouched entries byte for byte (still compressed) and
//    replacing the ones you changed.

import { crc32 } from '../../../shared/lib/crc32';

export const ZIP_LIMITS = {
  maxEntries: 5000,
  /** Largest part this tool will inflate (document.xml of a very large file). */
  maxPartBytes: 64 * 1024 * 1024,
  maxFileBytes: 500 * 1024 * 1024,
};

export type ZipErrorCode = 'not-zip' | 'zip64' | 'encrypted' | 'unsafe-name' | 'duplicate' | 'too-many' | 'too-large' | 'corrupt' | 'unsupported';

export class ZipError extends Error {
  code: ZipErrorCode;
  constructor(code: ZipErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface ZipEntry {
  name: string;
  flags: number;
  method: number;
  crc: number;
  compSize: number;
  size: number;
  dosTime: number;
  dosDate: number;
  external: number;
  /** Offset of the local file header. */
  offset: number;
}

export interface ZipArchive {
  bytes: Uint8Array;
  entries: ZipEntry[];
}

const u16 = (v: DataView, o: number) => v.getUint16(o, true);
const u32 = (v: DataView, o: number) => v.getUint32(o, true);

/** True for names that could escape the extraction folder or that no Office file uses. */
export function isUnsafeName(name: string): boolean {
  // oxlint-disable-next-line no-control-regex
  if (!name || name.length > 512 || /[\u0000-\u001f\\]/.test(name)) return true;
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) return true;
  return name.split('/').some((p) => p === '..');
}

export function openZip(bytes: Uint8Array): ZipArchive {
  if (bytes.length > ZIP_LIMITS.maxFileBytes) throw new ZipError('too-large', 'This file is too large to process here.');
  if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0)
    throw new ZipError('encrypted', 'This looks like a password-protected or legacy (.doc, .xls, .ppt) file, not a modern Office document. Remove the password in Office, or save it as .docx, .xlsx or .pptx, then add it again.');
  if (bytes.length < 22) throw new ZipError('not-zip', 'This file is not a ZIP-based Office document.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (u32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError('not-zip', 'This file is not a ZIP-based Office document.');
  const count = u16(view, eocd + 10);
  const cdSize = u32(view, eocd + 12);
  const cdOffset = u32(view, eocd + 16);
  if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) throw new ZipError('zip64', 'ZIP64 archives are not supported.');
  if (count > ZIP_LIMITS.maxEntries) throw new ZipError('too-many', `This file has ${count} parts; the limit is ${ZIP_LIMITS.maxEntries}.`);
  if (cdOffset + cdSize > eocd) throw new ZipError('corrupt', 'The ZIP directory is damaged.');

  const entries: ZipEntry[] = [];
  const seen = new Set<string>();
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (p + 46 > bytes.length || u32(view, p) !== 0x02014b50) throw new ZipError('corrupt', 'The ZIP directory is damaged.');
    const flags = u16(view, p + 8);
    const nameLen = u16(view, p + 28);
    const extraLen = u16(view, p + 30);
    const commentLen = u16(view, p + 32);
    if (p + 46 + nameLen > bytes.length) throw new ZipError('corrupt', 'The ZIP directory is damaged.');
    const raw = bytes.subarray(p + 46, p + 46 + nameLen);
    const name = new TextDecoder(flags & 0x800 ? 'utf-8' : 'latin1').decode(raw);
    if (isUnsafeName(name)) throw new ZipError('unsafe-name', `This file contains an unsafe part name (${JSON.stringify(name.slice(0, 60))}), so it was not opened.`);
    const key = name.toLowerCase();
    if (seen.has(key)) throw new ZipError('duplicate', 'This file lists the same part name twice, so it was not opened.');
    seen.add(key);
    const entry: ZipEntry = {
      name,
      flags,
      method: u16(view, p + 10),
      dosTime: u16(view, p + 12),
      dosDate: u16(view, p + 14),
      crc: u32(view, p + 16),
      compSize: u32(view, p + 20),
      size: u32(view, p + 24),
      external: u32(view, p + 38),
      offset: u32(view, p + 42),
    };
    if (entry.compSize === 0xffffffff || entry.size === 0xffffffff || entry.offset === 0xffffffff) throw new ZipError('zip64', 'ZIP64 archives are not supported.');
    entries.push(entry);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { bytes, entries };
}

/** The entry's stored (still compressed) bytes. */
export function rawData(zip: ZipArchive, e: ZipEntry): Uint8Array {
  const { bytes } = zip;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (e.offset + 30 > bytes.length || u32(view, e.offset) !== 0x04034b50) throw new ZipError('corrupt', `The part ${e.name} is damaged.`);
  const start = e.offset + 30 + u16(view, e.offset + 26) + u16(view, e.offset + 28);
  if (start + e.compSize > bytes.length) throw new ZipError('corrupt', `The part ${e.name} is truncated.`);
  return bytes.subarray(start, start + e.compSize);
}

async function inflateRaw(data: Uint8Array, max: number): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new ZipError('unsupported', "This browser can't decompress ZIP parts.");
  const reader = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > max) {
        await reader.cancel();
        throw new ZipError('too-large', 'A part of this file expands to more than the allowed size.');
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof ZipError) throw err;
    throw new ZipError('corrupt', 'A part of this file could not be decompressed.');
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') return data;
  const buf = await new Response(new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
  return new Uint8Array(buf);
}

/** Inflate one entry (capped), verifying its size and CRC. */
export async function readEntry(zip: ZipArchive, e: ZipEntry, max = ZIP_LIMITS.maxPartBytes): Promise<Uint8Array> {
  if (e.flags & 1) throw new ZipError('encrypted', `The part ${e.name} is encrypted.`);
  if (e.size > max) throw new ZipError('too-large', `The part ${e.name} is larger than the ${Math.round(max / 1048576)} MB limit.`);
  const raw = rawData(zip, e);
  let out: Uint8Array;
  if (e.method === 0) out = raw;
  else if (e.method === 8) out = await inflateRaw(raw, Math.min(max, e.size + 1));
  else throw new ZipError('unsupported', `The part ${e.name} uses an unsupported compression method.`);
  if (out.length !== e.size || crc32(out) !== e.crc) throw new ZipError('corrupt', `The part ${e.name} is damaged.`);
  return out;
}

export async function readText(zip: ZipArchive, name: string, max?: number): Promise<string | null> {
  const e = zip.entries.find((x) => x.name === name);
  return e ? new TextDecoder('utf-8').decode(await readEntry(zip, e, max)) : null;
}

export interface OutEntry {
  meta: ZipEntry;
  /** Payload exactly as stored (compressed for method 8). */
  data: Uint8Array;
}

/** Build an archive. Sizes go in the local headers (no data descriptors). */
export function writeZip(parts: OutEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const names = parts.map((p) => enc.encode(p.meta.name));
  let total = 22;
  parts.forEach((p, i) => (total += 30 + 46 + names[i].length * 2 + p.data.length));
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  const offsets: number[] = [];
  let p = 0;
  const flagsOf = (i: number) => ((parts[i].meta.flags & ~0x8 & ~0x800) | (/^[\x20-\x7e]*$/.test(parts[i].meta.name) ? 0 : 0x800));
  parts.forEach((part, i) => {
    const m = part.meta;
    offsets.push(p);
    v.setUint32(p, 0x04034b50, true);
    v.setUint16(p + 4, 20, true);
    v.setUint16(p + 6, flagsOf(i), true);
    v.setUint16(p + 8, m.method, true);
    v.setUint16(p + 10, m.dosTime, true);
    v.setUint16(p + 12, m.dosDate, true);
    v.setUint32(p + 14, m.crc, true);
    v.setUint32(p + 18, part.data.length, true);
    v.setUint32(p + 22, m.size, true);
    v.setUint16(p + 26, names[i].length, true);
    v.setUint16(p + 28, 0, true);
    out.set(names[i], p + 30);
    out.set(part.data, p + 30 + names[i].length);
    p += 30 + names[i].length + part.data.length;
  });
  const cd = p;
  parts.forEach((part, i) => {
    const m = part.meta;
    v.setUint32(p, 0x02014b50, true);
    v.setUint16(p + 4, 20, true);
    v.setUint16(p + 6, 20, true);
    v.setUint16(p + 8, flagsOf(i), true);
    v.setUint16(p + 10, m.method, true);
    v.setUint16(p + 12, m.dosTime, true);
    v.setUint16(p + 14, m.dosDate, true);
    v.setUint32(p + 16, m.crc, true);
    v.setUint32(p + 20, part.data.length, true);
    v.setUint32(p + 24, m.size, true);
    v.setUint16(p + 28, names[i].length, true);
    v.setUint32(p + 38, m.external, true);
    v.setUint32(p + 42, offsets[i], true);
    out.set(names[i], p + 46);
    p += 46 + names[i].length;
  });
  v.setUint32(p, 0x06054b50, true);
  v.setUint16(p + 8, parts.length, true);
  v.setUint16(p + 10, parts.length, true);
  v.setUint32(p + 12, p - cd, true);
  v.setUint32(p + 16, cd, true);
  return out.subarray(0, p + 22);
}

/** A replacement entry for changed text: deflated when the platform can, stored otherwise. */
export async function textEntry(old: ZipEntry, data: Uint8Array): Promise<OutEntry> {
  const packed = await deflateRaw(data);
  const deflated = packed !== data && packed.length < data.length;
  return { meta: { ...old, method: deflated ? 8 : 0, crc: crc32(data), size: data.length, compSize: deflated ? packed.length : data.length }, data: deflated ? packed : data };
}
