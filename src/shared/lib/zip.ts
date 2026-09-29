// Minimal ZIP writer: "stored" entries only (no compression — images are already compressed),
// UTF-8 file names, no ZIP64. Enough for "Download all" buttons.

import { crc32 } from './crc32';

export interface ZipEntry {
  name: string;
  data: Uint8Array;
  /** Modification time; defaults to now. */
  date?: Date;
}

/** Archives above this size would need ZIP64, which this writer doesn't produce. */
export const ZIP_MAX_BYTES = 0xffff_ffff - 1024 * 1024;
const MAX_ENTRIES = 0xffff;

function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.min(Math.max(d.getFullYear(), 1980), 2107);
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** Make a name safe for an archive: forward slashes only, no absolute or parent paths. */
export function safeZipName(name: string): string {
  const parts = name
    .replace(/\\/g, '/')
    .split('/')
    .filter((p) => p && p !== '.' && p !== '..');
  // oxlint-disable-next-line no-control-regex
  const clean = parts.join('/').replace(/[\u0000-\u001f]/g, '');
  return clean || 'file';
}

/** Rename duplicates: photo.jpg, photo (2).jpg, photo (3).jpg… (case-insensitive, as most file systems are). */
export function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map((raw) => {
    const name = safeZipName(raw);
    let candidate = name;
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    for (let n = 2; seen.has(candidate.toLowerCase()); n++) candidate = `${base} (${n})${ext}`;
    seen.add(candidate.toLowerCase());
    return candidate;
  });
}

/** Build a ZIP archive. Names are deduplicated and sanitised. */
export function createZip(entries: ZipEntry[]): Uint8Array {
  if (entries.length > MAX_ENTRIES) throw new RangeError(`A ZIP can hold at most ${MAX_ENTRIES} files.`);
  const encoder = new TextEncoder();
  const names = uniqueNames(entries.map((e) => e.name)).map((n) => encoder.encode(n));

  let total = 22;
  entries.forEach((e, i) => (total += 30 + 46 + names[i].length * 2 + e.data.length));
  if (total > ZIP_MAX_BYTES) throw new RangeError('These files are too large to put in one ZIP (4 GB limit).');

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  const central: { offset: number; crc: number; size: number; time: number; date: number }[] = [];
  let p = 0;

  entries.forEach((e, i) => {
    const name = names[i];
    const crc = crc32(e.data);
    const { time, date } = dosDateTime(e.date ?? new Date());
    central.push({ offset: p, crc, size: e.data.length, time, date });
    view.setUint32(p, 0x04034b50, true); // local file header
    view.setUint16(p + 4, 20, true); // version needed: 2.0
    view.setUint16(p + 6, 0x0800, true); // flags: UTF-8 names
    view.setUint16(p + 8, 0, true); // method: stored
    view.setUint16(p + 10, time, true);
    view.setUint16(p + 12, date, true);
    view.setUint32(p + 14, crc, true);
    view.setUint32(p + 18, e.data.length, true);
    view.setUint32(p + 22, e.data.length, true);
    view.setUint16(p + 26, name.length, true);
    view.setUint16(p + 28, 0, true);
    out.set(name, p + 30);
    out.set(e.data, p + 30 + name.length);
    p += 30 + name.length + e.data.length;
  });

  const cdStart = p;
  entries.forEach((_, i) => {
    const name = names[i];
    const c = central[i];
    view.setUint32(p, 0x02014b50, true); // central directory header
    view.setUint16(p + 4, 0x0314, true); // made by: Unix, 2.0
    view.setUint16(p + 6, 20, true);
    view.setUint16(p + 8, 0x0800, true);
    view.setUint16(p + 10, 0, true);
    view.setUint16(p + 12, c.time, true);
    view.setUint16(p + 14, c.date, true);
    view.setUint32(p + 16, c.crc, true);
    view.setUint32(p + 20, c.size, true);
    view.setUint32(p + 24, c.size, true);
    view.setUint16(p + 28, name.length, true);
    view.setUint16(p + 30, 0, true); // extra
    view.setUint16(p + 32, 0, true); // comment
    view.setUint16(p + 34, 0, true); // disk
    view.setUint16(p + 36, 0, true); // internal attrs
    view.setUint32(p + 38, (0o100644 << 16) >>> 0, true); // external attrs: regular file, rw-r--r--
    view.setUint32(p + 42, c.offset, true);
    out.set(name, p + 46);
    p += 46 + name.length;
  });

  view.setUint32(p, 0x06054b50, true); // end of central directory
  view.setUint16(p + 4, 0, true);
  view.setUint16(p + 6, 0, true);
  view.setUint16(p + 8, entries.length, true);
  view.setUint16(p + 10, entries.length, true);
  view.setUint32(p + 12, p - cdStart, true);
  view.setUint32(p + 16, cdStart, true);
  view.setUint16(p + 20, 0, true);
  return out.subarray(0, p + 22);
}
