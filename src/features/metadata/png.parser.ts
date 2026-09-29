import { LIMITS } from '../../config/limits';
import { decodeText, indexOfByte, latin1, matchAscii, readU16BE } from '../../lib/bytes';
import { inflateBounded } from '../../lib/inflate';
import { describePngChunk, walkPng, XMP_KEYWORD } from '../formats/png.structure';
import { inspectC2pa } from './c2pa.inspector';
import { parseExif } from './exif.parser';
import { iccColorSpace, parseIccDescription } from './icc.parser';
import { pngTechnical } from './technical';
import type { FormatScan } from './metadata.types';
import { parseXmp } from './xmp.parser';

async function inflateText(data: Uint8Array, warnings: string[], label: string): Promise<Uint8Array | null> {
  try {
    const { bytes, truncated } = await inflateBounded(data, LIMITS.MAX_INFLATE_BYTES);
    if (truncated) warnings.push(`${label} is very large; only the first part was read.`);
    return bytes;
  } catch {
    warnings.push(`${label} could not be decompressed.`);
    return null;
  }
}

export async function scanPng(b: Uint8Array): Promise<FormatScan> {
  const st = walkPng(b);
  const scan: FormatScan = { width: st.width, height: st.height, blocks: [], entries: [], warnings: [...st.warnings], technical: pngTechnical(b, st) };

  for (const chunk of st.chunks) {
    const d = describePngChunk(b, chunk);
    if (!d) continue;
    scan.blocks.push({ category: d.category, location: d.location, size: chunk.end - chunk.start, action: d.action, note: d.note });
    const data = b.subarray(chunk.dataStart, chunk.dataEnd);
    const loc = d.location;

    switch (chunk.type) {
      case 'tEXt': {
        const nul = indexOfByte(data, 0);
        if (nul < 0) break;
        scan.entries.push({ category: 'PNG_TEXT', key: latin1(data.subarray(0, nul)), value: latin1(data.subarray(nul + 1)), location: loc });
        break;
      }
      case 'zTXt': {
        const nul = indexOfByte(data, 0);
        if (nul < 0) break;
        const key = latin1(data.subarray(0, nul));
        const text = await inflateText(data.subarray(nul + 2), scan.warnings, `Text chunk "${key}"`);
        scan.entries.push({ category: 'PNG_TEXT', key, value: text ? latin1(text) : '[compressed text]', location: loc });
        break;
      }
      case 'iTXt': {
        const nul = indexOfByte(data, 0);
        if (nul < 0 || nul + 3 > data.length) break;
        const key = latin1(data.subarray(0, nul));
        const compressed = data[nul + 1] === 1;
        const langEnd = indexOfByte(data, 0, nul + 3);
        const transEnd = langEnd < 0 ? -1 : indexOfByte(data, 0, langEnd + 1);
        if (transEnd < 0) break;
        let body: Uint8Array | null = data.subarray(transEnd + 1);
        if (compressed) body = await inflateText(body, scan.warnings, `Text chunk "${key}"`);
        if (!body) break;
        const text = decodeText(body);
        if (key === XMP_KEYWORD) {
          for (const f of parseXmp(text)) scan.entries.push({ category: 'XMP', key: f.key, value: f.value, location: loc });
        } else {
          scan.entries.push({ category: 'PNG_TEXT', key, value: text, location: loc });
        }
        break;
      }
      case 'eXIf': {
        const tiff = matchAscii(data, 0, 'Exif\0\0') ? data.subarray(6) : data;
        const res = parseExif(tiff);
        scan.warnings.push(...res.warnings);
        if (scan.orientation === undefined) scan.orientation = res.orientation;
        for (const f of res.entries) scan.entries.push({ category: 'EXIF', key: f.key, value: f.value, location: loc });
        break;
      }
      case 'iCCP': {
        const nul = indexOfByte(data, 0);
        if (nul < 0) break;
        const name = latin1(data.subarray(0, nul));
        const profile = await inflateText(data.subarray(nul + 2), scan.warnings, 'ICC profile');
        const desc = profile ? parseIccDescription(profile) : undefined;
        const cs = profile ? iccColorSpace(profile) : undefined;
        scan.entries.push({ category: 'ICC', key: 'ICCProfile', value: [desc ?? name, cs && `(${cs})`].filter(Boolean).join(' '), location: loc });
        break;
      }
      case 'tIME': {
        if (data.length < 7) break;
        const p = (n: number) => String(n).padStart(2, '0');
        const value = `${readU16BE(data, 0)}-${p(data[2])}-${p(data[3])} ${p(data[4])}:${p(data[5])}:${p(data[6])} UTC`;
        scan.entries.push({ category: 'OTHER', key: 'ModificationTime', value, location: loc });
        break;
      }
      case 'caBX': {
        scan.c2pa = inspectC2pa(data);
        scan.entries.push({ category: 'C2PA', key: 'C2PAManifestStore', value: `Present (${data.length} bytes)`, location: loc });
        if (scan.c2pa.generator) scan.entries.push({ category: 'C2PA', key: 'claim_generator', value: scan.c2pa.generator, location: loc });
        break;
      }
      default:
        scan.entries.push({ category: 'OTHER', key: `Chunk ${chunk.type}`, value: `${data.length} bytes`, location: loc });
    }
  }

  const trailing = b.length - st.iendEnd;
  if (trailing > 0) {
    scan.blocks.push({ category: 'OTHER', location: 'Data after end of image', size: trailing, action: 'remove', note: 'Bytes appended after the IEND chunk.' });
    scan.entries.push({ category: 'OTHER', key: 'TrailingData', value: `${trailing} bytes`, location: 'Data after end of image' });
  }
  return scan;
}
