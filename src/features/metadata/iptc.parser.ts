// Photoshop Image Resource Block (APP13) and IPTC-IIM reader.

import { decodeText, matchAscii, readU16BE, readU32BE } from '../../lib/bytes';

export interface IptcField {
  key: string;
  value: string;
}

const IIM_RECORD2: Record<number, string> = {
  5: 'ObjectName', 7: 'EditStatus', 10: 'Urgency', 15: 'Category', 20: 'SupplementalCategories',
  25: 'Keywords', 26: 'ContentLocationCode', 27: 'ContentLocationName', 40: 'SpecialInstructions',
  55: 'DateCreated', 60: 'TimeCreated', 62: 'DigitalCreationDate', 63: 'DigitalCreationTime',
  65: 'OriginatingProgram', 70: 'ProgramVersion', 80: 'By-line', 85: 'By-lineTitle', 90: 'City',
  92: 'Sub-location', 95: 'Province-State', 100: 'Country-PrimaryLocationCode',
  101: 'Country-PrimaryLocationName', 103: 'OriginalTransmissionReference', 105: 'Headline',
  110: 'Credit', 115: 'Source', 116: 'CopyrightNotice', 118: 'Contact', 120: 'Caption-Abstract',
  122: 'Writer-Editor', 135: 'LanguageIdentifier',
};

const RESOURCE_NAMES: Record<number, string> = {
  0x03ed: 'Resolution info', 0x0409: 'Thumbnail (legacy)', 0x040c: 'Thumbnail', 0x040f: 'ICC profile',
  0x0422: 'EXIF data', 0x0424: 'XMP data', 0x0425: 'IPTC digest', 0x0421: 'Version info',
  0x0bb7: 'Clipping path name', 0x041a: 'Slices', 0x0426: 'Print scale', 0x0428: 'Pixel aspect ratio',
};

export const PHOTOSHOP_HEADER = 'Photoshop 3.0\0';

export function parsePhotoshopIrb(b: Uint8Array): IptcField[] {
  const fields: IptcField[] = [];
  const otherResources: string[] = [];
  let o = matchAscii(b, 0, PHOTOSHOP_HEADER) ? PHOTOSHOP_HEADER.length : 0;

  while (o + 12 <= b.length && matchAscii(b, o, '8BIM')) {
    const id = readU16BE(b, o + 4);
    const nameLen = b[o + 6];
    let p = o + 7 + nameLen;
    if ((nameLen + 1) % 2) p++; // Pascal string is padded to an even length
    if (p + 4 > b.length) break;
    const size = readU32BE(b, p);
    p += 4;
    const end = p + size;
    if (end > b.length) break;

    if (id === 0x0404) fields.push(...parseIim(b.subarray(p, end)));
    else if (id === 0x040c || id === 0x0409) fields.push({ key: 'PhotoshopThumbnail', value: `Present (${size} bytes)` });
    else otherResources.push(RESOURCE_NAMES[id] ?? `#${id}`);
    o = end + (size & 1);
  }
  if (otherResources.length) fields.push({ key: 'PhotoshopResources', value: [...new Set(otherResources)].join(', ') });
  return fields;
}

export function parseIim(b: Uint8Array): IptcField[] {
  const values = new Map<string, string[]>();
  let o = 0;
  while (o + 5 <= b.length && b[o] === 0x1c) {
    const record = b[o + 1];
    const dataset = b[o + 2];
    const len = readU16BE(b, o + 3);
    if (len & 0x8000) break; // extended datasets aren't used for textual fields
    const start = o + 5;
    const end = start + len;
    if (end > b.length) break;
    if (record === 2 && dataset !== 0) {
      const key = IIM_RECORD2[dataset] ?? `IIM2:${dataset}`;
      const value = decodeText(b.subarray(start, end)).replace(/\0+$/, '').trim();
      if (value) values.set(key, [...(values.get(key) ?? []), value]);
    }
    o = end;
  }
  return [...values].map(([key, list]) => ({ key, value: list.join('; ') }));
}
