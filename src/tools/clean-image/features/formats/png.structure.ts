import { ascii, ParseError, readU32BE } from '../../../../shared/lib/bytes';
import { crc32 } from '../../../../shared/lib/crc32';
import type { BlockAction, MetadataCategory } from '../metadata/metadata.types';

export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface PngChunk {
  type: string;
  start: number;
  end: number;
  dataStart: number;
  dataEnd: number;
  crcValid: boolean;
}

export interface PngStructure {
  chunks: PngChunk[];
  /** Offset just after IEND. */
  iendEnd: number;
  width?: number;
  height?: number;
  warnings: string[];
}

/** Chunks required to decode or render the image correctly. Never removed. */
const IMAGE_CHUNKS = new Set([
  'IHDR', 'PLTE', 'IDAT', 'IEND',
  'tRNS', 'bKGD', 'gAMA', 'cHRM', 'sRGB', 'sBIT', 'cICP', 'mDCV', 'cLLI', 'pHYs', 'hIST', 'sPLT',
  // APNG animation
  'acTL', 'fcTL', 'fdAT',
]);

export function walkPng(b: Uint8Array): PngStructure {
  if (b.length < 8 || !PNG_SIGNATURE.every((v, i) => b[i] === v)) throw new ParseError('Missing PNG signature');
  const chunks: PngChunk[] = [];
  const warnings: string[] = [];
  let o = 8;
  let iendEnd = -1;

  while (o + 12 <= b.length) {
    const len = readU32BE(b, o);
    const type = ascii(b, o + 4, 4);
    if (!/^[A-Za-z]{4}$/.test(type)) throw new ParseError(`Invalid PNG chunk type at offset ${o}`);
    const dataStart = o + 8;
    const dataEnd = dataStart + len;
    const end = dataEnd + 4;
    if (end > b.length) throw new ParseError(`Truncated PNG chunk "${type}"`);
    const crcValid = crc32(b.subarray(o + 4, dataEnd)) === readU32BE(b, dataEnd);
    chunks.push({ type, start: o, end, dataStart, dataEnd, crcValid });
    o = end;
    if (type === 'IEND') {
      iendEnd = end;
      break;
    }
  }

  if (!chunks.length || chunks[0].type !== 'IHDR') throw new ParseError('PNG is missing its IHDR header chunk');
  if (!chunks.some((c) => c.type === 'IDAT')) throw new ParseError('PNG contains no image data');
  if (iendEnd < 0) {
    warnings.push('PNG ends without an IEND chunk (file may be truncated).');
    iendEnd = o;
  }
  const bad = chunks.filter((c) => !c.crcValid).map((c) => c.type);
  if (bad.length) warnings.push(`Checksum mismatch in chunk(s): ${[...new Set(bad)].join(', ')}.`);

  const ihdr = chunks[0];
  const width = ihdr.dataEnd - ihdr.dataStart >= 8 ? readU32BE(b, ihdr.dataStart) : undefined;
  const height = ihdr.dataEnd - ihdr.dataStart >= 8 ? readU32BE(b, ihdr.dataStart + 4) : undefined;
  return { chunks, iendEnd, width, height, warnings };
}

export interface ChunkDescription {
  category: MetadataCategory;
  location: string;
  action: BlockAction;
  note?: string;
}

export const XMP_KEYWORD = 'XML:com.adobe.xmp';

/** Classifies a chunk as metadata, or null when it's needed for decoding. */
export function describePngChunk(b: Uint8Array, chunk: PngChunk): ChunkDescription | null {
  const t = chunk.type;
  if (IMAGE_CHUNKS.has(t)) return null;
  switch (t) {
    case 'tEXt':
    case 'zTXt':
      return { category: 'PNG_TEXT', location: `${t} chunk`, action: 'remove' };
    case 'iTXt': {
      const isXmp = ascii(b, chunk.dataStart, XMP_KEYWORD.length + 1) === `${XMP_KEYWORD}\0`;
      return isXmp
        ? { category: 'XMP', location: 'iTXt chunk (XMP)', action: 'remove' }
        : { category: 'PNG_TEXT', location: 'iTXt chunk', action: 'remove' };
    }
    case 'eXIf':
      return { category: 'EXIF', location: 'eXIf chunk', action: 'remove' };
    case 'iCCP':
      return {
        category: 'ICC',
        location: 'iCCP chunk',
        action: 'keep-in-privacy',
        note: 'Color profile; removing it can change how colors look.',
      };
    case 'tIME':
      return { category: 'OTHER', location: 'tIME chunk', action: 'remove', note: 'Last-modified timestamp.' };
    case 'caBX':
      return { category: 'C2PA', location: 'caBX chunk (C2PA)', action: 'remove' };
  }
  // Unknown critical chunks can't be removed safely; unknown ancillary chunks are private data.
  const ancillary = t.charCodeAt(0) >= 0x61;
  if (!ancillary) return null;
  return { category: 'OTHER', location: `${t} chunk (private)`, action: 'remove', note: 'Non-standard ancillary chunk.' };
}
