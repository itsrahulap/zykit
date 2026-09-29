import { ascii, latin1, readU32BE } from '../../../../shared/lib/bytes';

const utf16be = new TextDecoder('utf-16be');

/** Returns the profile description ("sRGB IEC61966-2.1", "Display P3"…) if readable. */
export function parseIccDescription(p: Uint8Array): string | undefined {
  if (p.length < 132) return undefined;
  const count = Math.min(readU32BE(p, 128), 200);
  for (let i = 0; i < count; i++) {
    const t = 132 + i * 12;
    if (t + 12 > p.length) break;
    if (ascii(p, t, 4) !== 'desc') continue;
    const off = readU32BE(p, t + 4);
    const size = readU32BE(p, t + 8);
    if (off + size > p.length || size < 12) return undefined;
    const type = ascii(p, off, 4);
    if (type === 'desc') {
      const n = readU32BE(p, off + 8);
      if (off + 12 + n > p.length) return undefined;
      return latin1(p.subarray(off + 12, off + 12 + n)).replace(/\0[\s\S]*$/, '').trim() || undefined;
    }
    if (type === 'mluc' && size >= 28) {
      const records = readU32BE(p, off + 8);
      if (!records) return undefined;
      const recLen = readU32BE(p, off + 20);
      const recOff = readU32BE(p, off + 24);
      if (off + recOff + recLen > p.length) return undefined;
      return utf16be.decode(p.subarray(off + recOff, off + recOff + recLen)).replace(/\0+$/, '').trim() || undefined;
    }
    return undefined;
  }
  return undefined;
}

export function iccColorSpace(p: Uint8Array): string | undefined {
  if (p.length < 20) return undefined;
  const cs = ascii(p, 16, 4).trim();
  return /^[A-Za-z0-9 ]+$/.test(cs) ? cs : undefined;
}
