import { ascii, matchAscii } from '../../lib/bytes';
import type { DetectedFormat } from '../../types/image.types';

/** Identifies a file by its magic bytes — never by extension or MIME type alone. */
export function detectFormat(b: Uint8Array): DetectedFormat {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    matchAscii(b, 1, 'PNG') &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return 'png';
  if (b.length >= 12 && matchAscii(b, 0, 'RIFF') && matchAscii(b, 8, 'WEBP')) return 'webp';
  if (matchAscii(b, 0, 'GIF87a') || matchAscii(b, 0, 'GIF89a')) return 'gif';
  if (matchAscii(b, 0, 'II*\0') || matchAscii(b, 0, 'MM\0*')) return 'tiff';
  if (matchAscii(b, 0, 'BM')) return 'bmp';
  if (b.length >= 12 && matchAscii(b, 4, 'ftyp')) {
    const brand = ascii(b, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].includes(brand)) return 'heic';
  }
  return 'unknown';
}
