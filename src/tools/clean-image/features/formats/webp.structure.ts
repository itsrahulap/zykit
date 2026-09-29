import { ascii, matchAscii, ParseError, readU16LE, readU24LE, readU32LE } from '../../../../shared/lib/bytes';
import type { BlockAction, MetadataCategory } from '../metadata/metadata.types';

export interface RiffChunk {
  fourcc: string;
  start: number;
  /** Exclusive end including the pad byte. */
  end: number;
  dataStart: number;
  size: number;
}

export interface WebpStructure {
  chunks: RiffChunk[];
  /** End of the RIFF container; bytes beyond are trailing data. */
  riffEnd: number;
  width?: number;
  height?: number;
  warnings: string[];
}

export const VP8X_FLAG = { ICC: 0x20, ALPHA: 0x10, EXIF: 0x08, XMP: 0x04, ANIMATION: 0x02 } as const;

const IMAGE_CHUNKS = new Set(['VP8X', 'VP8 ', 'VP8L', 'ALPH', 'ANIM', 'ANMF']);

export function walkWebp(b: Uint8Array): WebpStructure {
  if (b.length < 12 || !matchAscii(b, 0, 'RIFF') || !matchAscii(b, 8, 'WEBP')) throw new ParseError('Missing WebP RIFF header');
  const warnings: string[] = [];
  const declared = readU32LE(b, 4) + 8;
  let riffEnd = declared;
  if (declared > b.length) {
    warnings.push('WebP container is shorter than its declared size (file may be truncated).');
    riffEnd = b.length;
  }
  const chunks: RiffChunk[] = [];
  let o = 12;
  while (o + 8 <= riffEnd) {
    const fourcc = ascii(b, o, 4);
    const size = readU32LE(b, o + 4);
    const dataStart = o + 8;
    const end = dataStart + size + (size & 1);
    if (dataStart + size > riffEnd) throw new ParseError(`Truncated WebP chunk "${fourcc.trim()}"`);
    chunks.push({ fourcc, start: o, end: Math.min(end, riffEnd), dataStart, size });
    o = end;
  }
  if (chunks.some((c, i) => c.fourcc === 'VP8X' && i !== 0)) throw new ParseError('WebP extended header (VP8X) must be the first chunk');
  if (!chunks.some((c) => c.fourcc === 'VP8 ' || c.fourcc === 'VP8L' || c.fourcc === 'ANMF'))
    throw new ParseError('WebP contains no image data');

  let width: number | undefined;
  let height: number | undefined;
  const first = chunks[0];
  const d = first.dataStart;
  if (first.fourcc === 'VP8X' && first.size >= 10) {
    width = readU24LE(b, d + 4) + 1;
    height = readU24LE(b, d + 7) + 1;
  } else if (first.fourcc === 'VP8 ' && first.size >= 10 && b[d + 3] === 0x9d && b[d + 4] === 0x01 && b[d + 5] === 0x2a) {
    width = readU16LE(b, d + 6) & 0x3fff;
    height = readU16LE(b, d + 8) & 0x3fff;
  } else if (first.fourcc === 'VP8L' && first.size >= 5 && b[d] === 0x2f) {
    const bits = readU32LE(b, d + 1);
    width = (bits & 0x3fff) + 1;
    height = ((bits >>> 14) & 0x3fff) + 1;
  }
  return { chunks, riffEnd, width, height, warnings };
}

export interface RiffChunkDescription {
  category: MetadataCategory;
  location: string;
  action: BlockAction;
  note?: string;
}

export function describeWebpChunk(chunk: RiffChunk): RiffChunkDescription | null {
  if (IMAGE_CHUNKS.has(chunk.fourcc)) return null;
  switch (chunk.fourcc) {
    case 'EXIF':
      return { category: 'EXIF', location: 'EXIF chunk', action: 'remove' };
    case 'XMP ':
      return { category: 'XMP', location: 'XMP chunk', action: 'remove' };
    case 'ICCP':
      return {
        category: 'ICC',
        location: 'ICCP chunk',
        action: 'keep-in-privacy',
        note: 'Color profile; removing it can change how colors look.',
      };
    case 'C2PA':
      return { category: 'C2PA', location: 'C2PA chunk', action: 'remove' };
  }
  return { category: 'OTHER', location: `${chunk.fourcc.trim()} chunk (unknown)`, action: 'remove' };
}
