import { containsAscii, matchAscii, ParseError, readU16BE } from '../../../../shared/lib/bytes';
import type { BlockAction, MetadataCategory } from '../metadata/metadata.types';

export interface JpegSegment {
  marker: number;
  /** Offset of the first 0xFF (including fill bytes). */
  start: number;
  /** Exclusive end. For SOS this includes the entropy-coded scan data. */
  end: number;
  /** Start of the payload after the 2-byte length field. */
  dataStart: number;
  /** End of the payload (for SOS: end of header, not of scan data). */
  dataEnd: number;
}

export interface JpegStructure {
  segments: JpegSegment[];
  /** Offset just after EOI; bytes beyond this are trailing data. */
  eoiEnd: number;
  width?: number;
  height?: number;
  warnings: string[];
}

export const MARKER_SOS = 0xda;
export const MARKER_EOI = 0xd9;
export const MARKER_COM = 0xfe;

const isSof = (m: number) => m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
const isStandalone = (m: number) => (m >= 0xd0 && m <= 0xd7) || m === 0x01;

export const XMP_NS = 'http://ns.adobe.com/xap/1.0/\0';
export const XMP_EXT_NS = 'http://ns.adobe.com/xmp/extension/\0';

/** Walks JPEG markers from SOI to EOI. Throws ParseError on structural corruption. */
export function walkJpeg(b: Uint8Array): JpegStructure {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) throw new ParseError('Missing JPEG start-of-image marker');
  const segments: JpegSegment[] = [];
  const warnings: string[] = [];
  let width: number | undefined;
  let height: number | undefined;
  let eoiEnd = -1;
  let o = 2;

  while (o < b.length) {
    if (b[o] !== 0xff) throw new ParseError(`Expected JPEG marker at offset ${o}`);
    let p = o;
    while (p < b.length && b[p] === 0xff) p++;
    if (p >= b.length) break;
    const marker = b[p++];

    if (marker === MARKER_EOI) {
      segments.push({ marker, start: o, end: p, dataStart: p, dataEnd: p });
      eoiEnd = p;
      break;
    }
    if (isStandalone(marker)) {
      segments.push({ marker, start: o, end: p, dataStart: p, dataEnd: p });
      o = p;
      continue;
    }
    if (p + 2 > b.length) throw new ParseError('Truncated JPEG segment header');
    const len = readU16BE(b, p);
    if (len < 2) throw new ParseError(`Invalid JPEG segment length at offset ${p}`);
    const end = p + len;
    if (end > b.length) throw new ParseError('Truncated JPEG segment');
    const seg: JpegSegment = { marker, start: o, end, dataStart: p + 2, dataEnd: end };

    if (isSof(marker) && len >= 7 && width === undefined) {
      height = readU16BE(b, p + 3);
      width = readU16BE(b, p + 5);
    }

    if (marker === MARKER_SOS) {
      // Skip entropy-coded data: stop at the first marker that isn't byte stuffing or a restart marker.
      let q = end;
      let found = false;
      while (q < b.length - 1) {
        if (b[q] === 0xff) {
          const n = b[q + 1];
          if (n === 0x00 || (n >= 0xd0 && n <= 0xd7)) {
            q += 2;
            continue;
          }
          if (n === 0xff) {
            q += 1;
            continue;
          }
          found = true;
          break;
        }
        q++;
      }
      if (!found) {
        warnings.push('Image data ends without an end-of-image marker (file may be truncated).');
        seg.end = b.length;
        segments.push(seg);
        o = b.length;
        break;
      }
      seg.end = q;
    }

    segments.push(seg);
    o = seg.end;
  }

  if (eoiEnd < 0) {
    if (!warnings.length) warnings.push('Missing JPEG end-of-image marker.');
    eoiEnd = b.length;
  }
  return { segments, eoiEnd, width, height, warnings };
}

export interface SegmentDescription {
  category: MetadataCategory;
  location: string;
  action: BlockAction;
  kind:
    | 'exif'
    | 'xmp'
    | 'xmp-ext'
    | 'icc'
    | 'photoshop'
    | 'comment'
    | 'jumbf'
    | 'jfif'
    | 'adobe'
    | 'other';
  note?: string;
}

/** Classifies a segment as metadata. Returns null for image-data segments (DQT, SOF, DHT, SOS…). */
export function describeJpegSegment(b: Uint8Array, seg: JpegSegment): SegmentDescription | null {
  const m = seg.marker;
  const d = seg.dataStart;
  if (m === MARKER_COM) return { category: 'JPEG_COMMENT', location: 'COM segment', action: 'remove', kind: 'comment' };
  if (m < 0xe0 || m > 0xef) return null;
  const n = m - 0xe0;
  const app = `APP${n}`;

  switch (n) {
    case 0:
      if (matchAscii(b, d, 'JFIF\0'))
        return { category: 'OTHER', location: 'APP0 (JFIF header)', action: 'keep', kind: 'jfif', note: 'Basic image header; kept for compatibility.' };
      if (matchAscii(b, d, 'JFXX\0'))
        return { category: 'OTHER', location: 'APP0 (JFIF thumbnail)', action: 'remove', kind: 'other', note: 'Embedded thumbnail image.' };
      break;
    case 1:
      if (matchAscii(b, d, 'Exif\0')) return { category: 'EXIF', location: 'APP1 (EXIF)', action: 'remove', kind: 'exif' };
      if (matchAscii(b, d, XMP_NS)) return { category: 'XMP', location: 'APP1 (XMP)', action: 'remove', kind: 'xmp' };
      if (matchAscii(b, d, XMP_EXT_NS))
        return { category: 'XMP', location: 'APP1 (Extended XMP)', action: 'remove', kind: 'xmp-ext' };
      break;
    case 2:
      if (matchAscii(b, d, 'ICC_PROFILE\0'))
        return {
          category: 'ICC',
          location: 'APP2 (ICC profile)',
          action: 'keep-in-privacy',
          kind: 'icc',
          note: 'Color profile; removing it can change how colors look.',
        };
      if (matchAscii(b, d, 'MPF\0'))
        return { category: 'OTHER', location: 'APP2 (Multi-Picture index)', action: 'remove', kind: 'other', note: 'Index of additional embedded images.' };
      break;
    case 11: {
      const payload = b.subarray(d, seg.dataEnd);
      if (containsAscii(payload, 'c2pa'))
        return { category: 'C2PA', location: 'APP11 (JUMBF / C2PA)', action: 'remove', kind: 'jumbf' };
      return { category: 'OTHER', location: 'APP11 (JUMBF)', action: 'remove', kind: 'other' };
    }
    case 13:
      if (matchAscii(b, d, 'Photoshop 3.0\0'))
        return { category: 'IPTC', location: 'APP13 (Photoshop IRB)', action: 'remove', kind: 'photoshop' };
      break;
    case 14:
      if (matchAscii(b, d, 'Adobe'))
        return { category: 'OTHER', location: 'APP14 (Adobe color transform)', action: 'keep', kind: 'adobe', note: 'Needed to decode colors correctly; always kept.' };
      break;
  }
  return { category: 'OTHER', location: `${app} segment`, action: 'remove', kind: 'other' };
}
