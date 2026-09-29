import { decodeText, matchAscii } from '../../lib/bytes';
import { describeWebpChunk, walkWebp } from '../formats/webp.structure';
import { inspectC2pa } from './c2pa.inspector';
import { parseExif } from './exif.parser';
import { iccColorSpace, parseIccDescription } from './icc.parser';
import { webpTechnical } from './technical';
import type { FormatScan } from './metadata.types';
import { parseXmp } from './xmp.parser';

export function scanWebp(b: Uint8Array): FormatScan {
  const st = walkWebp(b);
  const scan: FormatScan = { width: st.width, height: st.height, blocks: [], entries: [], warnings: [...st.warnings], technical: webpTechnical(b, st) };

  for (const chunk of st.chunks) {
    const d = describeWebpChunk(chunk);
    if (!d) continue;
    scan.blocks.push({ category: d.category, location: d.location, size: chunk.end - chunk.start, action: d.action, note: d.note });
    const data = b.subarray(chunk.dataStart, chunk.dataStart + chunk.size);
    const loc = d.location;

    switch (chunk.fourcc) {
      case 'EXIF': {
        // The spec stores a bare TIFF header, but some writers prepend "Exif\0\0".
        const res = parseExif(matchAscii(data, 0, 'Exif\0\0') ? data.subarray(6) : data);
        scan.warnings.push(...res.warnings);
        if (scan.orientation === undefined) scan.orientation = res.orientation;
        for (const f of res.entries) scan.entries.push({ category: 'EXIF', key: f.key, value: f.value, location: loc });
        break;
      }
      case 'XMP ':
        for (const f of parseXmp(decodeText(data))) scan.entries.push({ category: 'XMP', key: f.key, value: f.value, location: loc });
        break;
      case 'ICCP': {
        const desc = parseIccDescription(data);
        const cs = iccColorSpace(data);
        scan.entries.push({
          category: 'ICC',
          key: 'ICCProfile',
          value: [desc, cs && `(${cs})`, `${data.length} bytes`].filter(Boolean).join(' '),
          location: loc,
        });
        break;
      }
      case 'C2PA':
        scan.c2pa = inspectC2pa(data);
        scan.entries.push({ category: 'C2PA', key: 'C2PAManifestStore', value: `Present (${data.length} bytes)`, location: loc });
        if (scan.c2pa.generator) scan.entries.push({ category: 'C2PA', key: 'claim_generator', value: scan.c2pa.generator, location: loc });
        break;
      default:
        scan.entries.push({ category: 'OTHER', key: `Chunk ${chunk.fourcc.trim()}`, value: `${chunk.size} bytes`, location: loc });
    }
  }

  const trailing = b.length - st.riffEnd;
  if (trailing > 0) {
    scan.blocks.push({ category: 'OTHER', location: 'Data after end of image', size: trailing, action: 'remove', note: 'Bytes appended after the RIFF container.' });
    scan.entries.push({ category: 'OTHER', key: 'TrailingData', value: `${trailing} bytes`, location: 'Data after end of image' });
  }
  return scan;
}
