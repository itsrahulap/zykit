import { concat, containsAscii, decodeText, latin1, matchAscii } from '../../lib/bytes';
import { describeJpegSegment, walkJpeg, XMP_EXT_NS, XMP_NS } from '../formats/jpeg.structure';
import { inspectC2pa } from './c2pa.inspector';
import { parseExif } from './exif.parser';
import { iccColorSpace, parseIccDescription } from './icc.parser';
import { parsePhotoshopIrb } from './iptc.parser';
import { jpegTechnical } from './technical';
import type { FormatScan, RawEntry } from './metadata.types';
import { parseXmp } from './xmp.parser';

export function scanJpeg(b: Uint8Array): FormatScan {
  const st = walkJpeg(b);
  const scan: FormatScan = { width: st.width, height: st.height, blocks: [], entries: [], warnings: [...st.warnings], technical: jpegTechnical(b, st) };
  const push = (e: RawEntry) => scan.entries.push(e);
  const iccParts: Uint8Array[] = [];
  const jumbfParts: Uint8Array[] = [];
  const extXmp: string[] = [];

  for (const seg of st.segments) {
    const d = describeJpegSegment(b, seg);
    if (!d) continue;
    const data = b.subarray(seg.dataStart, seg.dataEnd);
    scan.blocks.push({ category: d.category, location: d.location, size: seg.end - seg.start, action: d.action, note: d.note });

    switch (d.kind) {
      case 'exif': {
        const tiffStart = matchAscii(data, 0, 'Exif\0\0') ? 6 : 5;
        const res = parseExif(data.subarray(tiffStart));
        scan.warnings.push(...res.warnings);
        if (scan.orientation === undefined && res.orientation !== undefined) scan.orientation = res.orientation;
        for (const f of res.entries) push({ category: 'EXIF', key: f.key, value: f.value, location: d.location });
        break;
      }
      case 'xmp':
        for (const f of parseXmp(decodeText(data.subarray(XMP_NS.length))))
          push({ category: 'XMP', key: f.key, value: f.value, location: d.location });
        break;
      case 'xmp-ext':
        // namespace, 32-byte GUID, 4-byte full length, 4-byte offset, then a slice of the packet
        extXmp.push(decodeText(data.subarray(XMP_EXT_NS.length + 40)));
        break;
      case 'icc':
        iccParts.push(data.subarray(14));
        break;
      case 'photoshop':
        for (const f of parsePhotoshopIrb(data)) push({ category: 'IPTC', key: f.key, value: f.value, location: d.location });
        break;
      case 'comment': {
        const text = decodeText(data).replace(/\0+$/, '').trim();
        if (text) push({ category: 'JPEG_COMMENT', key: 'Comment', value: text, location: d.location });
        break;
      }
      case 'jumbf':
        jumbfParts.push(data);
        break;
    }
  }

  if (extXmp.length) {
    for (const f of parseXmp(extXmp.join('')))
      push({ category: 'XMP', key: f.key, value: f.value, location: 'APP1 (Extended XMP)' });
  }
  if (iccParts.length) {
    const profile = concat(iccParts);
    const desc = parseIccDescription(profile);
    const cs = iccColorSpace(profile);
    push({
      category: 'ICC',
      key: 'ICCProfile',
      value: [desc, cs && `(${cs})`, `${profile.length} bytes`].filter(Boolean).join(' '),
      location: 'APP2 (ICC profile)',
    });
  }
  if (jumbfParts.length) {
    const payload = concat(jumbfParts);
    scan.c2pa = inspectC2pa(payload);
    push({ category: 'C2PA', key: 'C2PAManifestStore', value: `Present (${payload.length} bytes)`, location: 'APP11 (JUMBF / C2PA)' });
    if (scan.c2pa.generator)
      push({ category: 'C2PA', key: 'claim_generator', value: scan.c2pa.generator, location: 'APP11 (JUMBF / C2PA)' });
  }

  const trailing = b.length - st.eoiEnd;
  if (trailing > 0) {
    const tail = b.subarray(st.eoiEnd);
    const hasImage = containsAscii(tail, '\xff\xd8\xff') || /Exif|JFIF/.test(latin1(tail.subarray(0, 4096)));
    scan.blocks.push({
      category: 'OTHER',
      location: 'Data after end of image',
      size: trailing,
      action: 'remove',
      note: hasImage ? 'Contains additional embedded image data (e.g. depth map, preview or original).' : 'Unrecognized trailing bytes.',
    });
    push({ category: 'OTHER', key: 'TrailingData', value: `${trailing} bytes${hasImage ? ' (embedded image)' : ''}`, location: 'Data after end of image' });
  }
  return scan;
}
