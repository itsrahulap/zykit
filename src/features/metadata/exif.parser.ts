// Minimal, defensive TIFF/EXIF reader. Handles both byte orders, guards against
// out-of-bounds offsets and IFD loops, and never trusts counts from the file.

export interface ExifField {
  key: string;
  value: string;
}

export interface ExifResult {
  entries: ExifField[];
  orientation?: number;
  warnings: string[];
}

const IFD0_TAGS: Record<number, string> = {
  0x0100: 'ImageWidth', 0x0101: 'ImageLength', 0x0103: 'Compression', 0x010e: 'ImageDescription',
  0x010f: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x011a: 'XResolution', 0x011b: 'YResolution',
  0x0128: 'ResolutionUnit', 0x0131: 'Software', 0x0132: 'DateTime', 0x013b: 'Artist', 0x013c: 'HostComputer',
  0x0213: 'YCbCrPositioning', 0x4746: 'Rating', 0x8298: 'Copyright',
  0x9c9b: 'XPTitle', 0x9c9c: 'XPComment', 0x9c9d: 'XPAuthor', 0x9c9e: 'XPKeywords', 0x9c9f: 'XPSubject',
  0xc4a5: 'PrintImageMatching',
};

const EXIF_TAGS: Record<number, string> = {
  0x829a: 'ExposureTime', 0x829d: 'FNumber', 0x8822: 'ExposureProgram', 0x8827: 'ISOSpeedRatings',
  0x8830: 'SensitivityType', 0x9000: 'ExifVersion', 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized',
  0x9010: 'OffsetTime', 0x9011: 'OffsetTimeOriginal', 0x9012: 'OffsetTimeDigitized', 0x9101: 'ComponentsConfiguration',
  0x9201: 'ShutterSpeedValue', 0x9202: 'ApertureValue', 0x9203: 'BrightnessValue', 0x9204: 'ExposureBiasValue',
  0x9205: 'MaxApertureValue', 0x9207: 'MeteringMode', 0x9208: 'LightSource', 0x9209: 'Flash', 0x920a: 'FocalLength',
  0x9214: 'SubjectArea', 0x927c: 'MakerNote', 0x9286: 'UserComment', 0x9290: 'SubSecTime',
  0x9291: 'SubSecTimeOriginal', 0x9292: 'SubSecTimeDigitized', 0xa000: 'FlashpixVersion', 0xa001: 'ColorSpace',
  0xa002: 'PixelXDimension', 0xa003: 'PixelYDimension', 0xa217: 'SensingMethod', 0xa300: 'FileSource',
  0xa301: 'SceneType', 0xa401: 'CustomRendered', 0xa402: 'ExposureMode', 0xa403: 'WhiteBalance',
  0xa404: 'DigitalZoomRatio', 0xa405: 'FocalLengthIn35mmFilm', 0xa406: 'SceneCaptureType', 0xa420: 'ImageUniqueID',
  0xa430: 'CameraOwnerName', 0xa431: 'BodySerialNumber', 0xa432: 'LensSpecification', 0xa433: 'LensMake',
  0xa434: 'LensModel', 0xa435: 'LensSerialNumber', 0xa460: 'CompositeImage',
};

const GPS_TAGS: Record<number, string> = {
  0: 'GPSVersionID', 1: 'GPSLatitudeRef', 2: 'GPSLatitude', 3: 'GPSLongitudeRef', 4: 'GPSLongitude',
  5: 'GPSAltitudeRef', 6: 'GPSAltitude', 7: 'GPSTimeStamp', 8: 'GPSSatellites', 9: 'GPSStatus',
  10: 'GPSMeasureMode', 11: 'GPSDOP', 12: 'GPSSpeedRef', 13: 'GPSSpeed', 14: 'GPSTrackRef', 15: 'GPSTrack',
  16: 'GPSImgDirectionRef', 17: 'GPSImgDirection', 18: 'GPSMapDatum', 23: 'GPSDestBearingRef',
  24: 'GPSDestBearing', 27: 'GPSProcessingMethod', 29: 'GPSDateStamp', 31: 'GPSHPositioningError',
};

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 13: 4 };

export const ORIENTATION_LABELS: Record<number, string> = {
  1: 'Normal',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored + rotated 270° CW',
  6: 'Rotated 90° CW',
  7: 'Mirrored + rotated 90° CW',
  8: 'Rotated 270° CW',
};

const MAX_ENTRIES = 2000;
const utf16le = new TextDecoder('utf-16le');
const utf16be = new TextDecoder('utf-16be');
const utf8 = new TextDecoder('utf-8');

export function parseExif(tiff: Uint8Array): ExifResult {
  const result: ExifResult = { entries: [], warnings: [] };
  const len = tiff.length;
  if (len < 8) {
    result.warnings.push('EXIF block is too short to be valid.');
    return result;
  }
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d;
  if (!le && !be) {
    result.warnings.push('EXIF block has an invalid byte-order header.');
    return result;
  }
  const dv = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const u16 = (o: number) => dv.getUint16(o, le);
  const u32 = (o: number) => dv.getUint32(o, le);
  if (u16(2) !== 42) {
    result.warnings.push('EXIF block has an invalid TIFF header.');
    return result;
  }

  const visited = new Set<number>();
  const queue: { offset: number; table: Record<number, string>; ifd: 'IFD0' | 'EXIF' | 'GPS' | 'IFD1' }[] = [
    { offset: u32(4), table: IFD0_TAGS, ifd: 'IFD0' },
  ];

  const rational = (o: number, signed: boolean) => {
    const num = signed ? dv.getInt32(o, le) : u32(o);
    const den = signed ? dv.getInt32(o + 4, le) : u32(o + 4);
    return den === 0 ? 0 : num / den;
  };

  const formatValue = (tag: number, name: string, ifd: string, type: number, count: number, off: number): string => {
    const bytes = tiff.subarray(off, off + count * TYPE_SIZE[type]);

    if (tag >= 0x9c9b && tag <= 0x9c9f && ifd === 'IFD0') return utf16le.decode(bytes).replace(/\0+$/, '');
    if (type === 2) return utf8.decode(bytes).replace(/\0[\s\S]*$/, '').trim();
    if (type === 7) {
      if (name === 'UserComment' || name === 'GPSProcessingMethod') return decodeUserComment(bytes, le);
      if (name === 'ExifVersion' || name === 'FlashpixVersion') return String.fromCharCode(...bytes);
      if (name === 'MakerNote') return `[manufacturer data, ${count} bytes]`;
      return count <= 16 ? Array.from(bytes, (x) => x.toString(16).padStart(2, '0')).join(' ') : `[binary, ${count} bytes]`;
    }

    const n = Math.min(count, 16);
    const values: number[] = [];
    const size = TYPE_SIZE[type];
    for (let i = 0; i < n; i++) {
      const p = off + i * size;
      switch (type) {
        case 1: values.push(tiff[p]); break;
        case 6: values.push(dv.getInt8(p)); break;
        case 3: values.push(u16(p)); break;
        case 8: values.push(dv.getInt16(p, le)); break;
        case 4: case 13: values.push(u32(p)); break;
        case 9: values.push(dv.getInt32(p, le)); break;
        case 5: values.push(rational(p, false)); break;
        case 10: values.push(rational(p, true)); break;
        case 11: values.push(dv.getFloat32(p, le)); break;
        case 12: values.push(dv.getFloat64(p, le)); break;
      }
    }

    if (ifd === 'GPS' && (tag === 2 || tag === 4) && values.length === 3) {
      const [d, m, s] = values;
      return `${d}° ${m}' ${round(s, 2)}" (${round(d + m / 60 + s / 3600, 6)})`;
    }
    if (ifd === 'GPS' && tag === 7 && values.length === 3) {
      return values.map((v) => String(Math.floor(v)).padStart(2, '0')).join(':');
    }
    if (name === 'Orientation' && values.length) return formatOrientation(values[0]);
    if (name === 'ExposureTime' && values[0] > 0 && values[0] < 1) return `1/${Math.round(1 / values[0])} s`;
    const text = values.map((v) => String(round(v, 4))).join(', ');
    return count > n ? `${text}, … (${count} values)` : text;
  };

  let total = 0;
  while (queue.length) {
    const { offset, table, ifd } = queue.shift()!;
    if (offset < 8 || offset + 2 > len || visited.has(offset)) continue;
    visited.add(offset);
    const count = u16(offset);
    if (offset + 2 + count * 12 > len) {
      result.warnings.push(`EXIF ${ifd} directory is truncated.`);
      continue;
    }

    if (ifd === 'IFD1') {
      // IFD1 describes the embedded thumbnail — report it as one privacy-relevant item.
      let thumbLen = 0;
      for (let i = 0; i < count; i++) {
        const e = offset + 2 + i * 12;
        if (u16(e) === 0x0202) thumbLen = u32(e + 8);
      }
      result.entries.push({ key: 'EmbeddedThumbnail', value: thumbLen ? `Present (${thumbLen} bytes)` : 'Present' });
      continue;
    }

    for (let i = 0; i < count && total < MAX_ENTRIES; i++, total++) {
      const e = offset + 2 + i * 12;
      const tag = u16(e);
      const type = u16(e + 2);
      const n = u32(e + 4);
      const size = TYPE_SIZE[type];
      if (!size || n === 0 || n > len) continue;
      const byteLen = size * n;
      const valOff = byteLen <= 4 ? e + 8 : u32(e + 8);
      if (valOff + byteLen > len) continue;

      if (ifd === 'IFD0' && tag === 0x8769) { queue.push({ offset: u32(valOff), table: EXIF_TAGS, ifd: 'EXIF' }); continue; }
      if (ifd === 'IFD0' && tag === 0x8825) { queue.push({ offset: u32(valOff), table: GPS_TAGS, ifd: 'GPS' }); continue; }
      if (tag === 0xa005 || tag === 0x0201 || tag === 0x0202) continue; // interop pointer / thumbnail offsets

      const name = table[tag] ?? `${ifd}Tag0x${tag.toString(16).padStart(4, '0')}`;
      const value = formatValue(tag, name, ifd, type, n, valOff);
      if (value !== '') result.entries.push({ key: name, value });
      if (ifd === 'IFD0' && tag === 0x0112 && type === 3) result.orientation = u16(valOff);
    }

    if (ifd === 'IFD0') {
      const nextPtr = offset + 2 + count * 12;
      if (nextPtr + 4 <= len) {
        const next = u32(nextPtr);
        if (next) queue.push({ offset: next, table: IFD0_TAGS, ifd: 'IFD1' });
      }
    }
  }
  return result;
}

export function formatOrientation(v: number): string {
  return `${v} (${ORIENTATION_LABELS[v] ?? 'Unknown'})`;
}

function decodeUserComment(bytes: Uint8Array, le: boolean): string {
  if (bytes.length < 8) return '';
  const code = String.fromCharCode(...bytes.subarray(0, 8)).replace(/\0/g, '');
  const body = bytes.subarray(8);
  let text: string;
  if (code === 'UNICODE') text = (le ? utf16le : utf16be).decode(body);
  else text = utf8.decode(body);
  return text.replace(/\0+$/g, '').trim();
}

function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
