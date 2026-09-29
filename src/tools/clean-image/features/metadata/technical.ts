// Structural facts about how the image is encoded. These describe the image
// data itself, so they are reported separately from removable metadata.

import { matchAscii, readU16BE, readU16LE, readU32BE, readU32LE } from '../../../../shared/lib/bytes';
import type { JpegStructure } from '../formats/jpeg.structure';
import type { PngStructure } from '../formats/png.structure';
import type { WebpStructure } from '../formats/webp.structure';
import type { TechnicalField } from './metadata.types';

const SOF_NAMES: Record<number, string> = {
  0xc0: 'Baseline DCT, Huffman coding',
  0xc1: 'Extended sequential DCT, Huffman coding',
  0xc2: 'Progressive DCT, Huffman coding',
  0xc3: 'Lossless, Huffman coding',
  0xc5: 'Differential sequential DCT, Huffman coding',
  0xc6: 'Differential progressive DCT, Huffman coding',
  0xc7: 'Differential lossless, Huffman coding',
  0xc9: 'Extended sequential DCT, arithmetic coding',
  0xca: 'Progressive DCT, arithmetic coding',
  0xcb: 'Lossless, arithmetic coding',
  0xcd: 'Differential sequential DCT, arithmetic coding',
  0xce: 'Differential progressive DCT, arithmetic coding',
  0xcf: 'Differential lossless, arithmetic coding',
};

function subsampling(h: number, v: number): string {
  if (h === 1 && v === 1) return '4:4:4 (1 1)';
  if (h === 2 && v === 1) return '4:2:2 (2 1)';
  if (h === 2 && v === 2) return '4:2:0 (2 2)';
  if (h === 4 && v === 1) return '4:1:1 (4 1)';
  return `${h} ${v}`;
}

export function jpegTechnical(b: Uint8Array, st: JpegStructure): TechnicalField[] {
  const out: TechnicalField[] = [];
  const add = (group: string, key: string, value: string) => out.push({ group, key, value });

  const sof = st.segments.find((s) => SOF_NAMES[s.marker]);
  if (sof && sof.dataEnd - sof.dataStart >= 6) {
    const d = sof.dataStart;
    const components = b[d + 5];
    add('Encoding', 'Encoding process', SOF_NAMES[sof.marker]);
    add('Encoding', 'Bits per sample', String(b[d]));
    add('Encoding', 'Color components', String(components));
    if (components >= 3 && d + 6 + 3 <= sof.dataEnd) {
      const hv = b[d + 7];
      add('Encoding', 'YCbCr subsampling', subsampling(hv >> 4, hv & 0x0f));
    }
  }
  const scans = st.segments.filter((s) => s.marker === 0xda).length;
  if (scans > 1) add('Encoding', 'Scans', String(scans));

  let seenJfif = false;
  for (const s of st.segments) {
    const d = s.dataStart;
    if (!seenJfif && s.marker === 0xe0 && matchAscii(b, d, 'JFIF\0') && s.dataEnd - d >= 14) {
      seenJfif = true;
      const units = ['None (aspect ratio only)', 'Pixels per inch', 'Pixels per centimeter'][b[d + 7]] ?? `Unknown (${b[d + 7]})`;
      add('JFIF', 'JFIF version', `${b[d + 5]}.${String(b[d + 6]).padStart(2, '0')}`);
      add('JFIF', 'Resolution unit', units);
      add('JFIF', 'X resolution', String(readU16BE(b, d + 8)));
      add('JFIF', 'Y resolution', String(readU16BE(b, d + 10)));
      add('JFIF', 'Thumbnail size', `${b[d + 12]} × ${b[d + 13]}`);
    }
    if (s.marker === 0xee && matchAscii(b, d, 'Adobe') && s.dataEnd - d >= 12) {
      const t = b[d + 11];
      add('Color', 'Adobe color transform', ['None (RGB or CMYK)', 'YCbCr', 'YCCK'][t] ?? String(t));
    }
    if (s.marker === 0xdd && s.dataEnd - d >= 2) add('Encoding', 'Restart interval', String(readU16BE(b, d)));
  }
  return out;
}

const PNG_COLOR_TYPES: Record<number, string> = {
  0: 'Grayscale',
  2: 'RGB',
  3: 'Palette',
  4: 'Grayscale with alpha',
  6: 'RGB with alpha',
};

const SRGB_INTENTS = ['Perceptual', 'Relative colorimetric', 'Saturation', 'Absolute colorimetric'];

export function pngTechnical(b: Uint8Array, st: PngStructure): TechnicalField[] {
  const out: TechnicalField[] = [];
  const add = (group: string, key: string, value: string) => out.push({ group, key, value });
  const ihdr = st.chunks[0];
  const d = ihdr.dataStart;
  if (ihdr.dataEnd - d >= 13) {
    add('Encoding', 'Bit depth', String(b[d + 8]));
    add('Encoding', 'Color type', PNG_COLOR_TYPES[b[d + 9]] ?? `Unknown (${b[d + 9]})`);
    add('Encoding', 'Compression', b[d + 10] === 0 ? 'Deflate' : `Unknown (${b[d + 10]})`);
    add('Encoding', 'Interlace', b[d + 12] === 1 ? 'Adam7' : 'None');
  }
  const idat = st.chunks.filter((c) => c.type === 'IDAT');
  add('Encoding', 'Image data chunks', `${idat.length} (${idat.reduce((n, c) => n + c.dataEnd - c.dataStart, 0).toLocaleString('en-US')} bytes)`);

  for (const c of st.chunks) {
    const cd = c.dataStart;
    const len = c.dataEnd - cd;
    if (c.type === 'acTL' && len >= 8) {
      add('Animation', 'Frames', String(readU32BE(b, cd)));
      const loops = readU32BE(b, cd + 4);
      add('Animation', 'Loop count', loops === 0 ? 'Infinite' : String(loops));
    }
    if (c.type === 'gAMA' && len >= 4) add('Color', 'Gamma', (readU32BE(b, cd) / 100000).toFixed(5));
    if (c.type === 'sRGB' && len >= 1) add('Color', 'sRGB rendering intent', SRGB_INTENTS[b[cd]] ?? String(b[cd]));
    if (c.type === 'cICP') add('Color', 'Coding-independent code points', 'Present (HDR / wide-gamut signalling)');
    if (c.type === 'tRNS') add('Color', 'Transparency chunk', 'Present');
    if (c.type === 'pHYs' && len >= 9) {
      const x = readU32BE(b, cd);
      const y = readU32BE(b, cd + 4);
      if (b[cd + 8] === 1) add('Resolution', 'Pixels per inch', x === y ? String(Math.round(x * 0.0254)) : `${Math.round(x * 0.0254)} × ${Math.round(y * 0.0254)}`);
      else add('Resolution', 'Pixel aspect ratio', `${x}:${y}`);
    }
  }
  return out;
}

export function webpTechnical(b: Uint8Array, st: WebpStructure): TechnicalField[] {
  const out: TechnicalField[] = [];
  const add = (group: string, key: string, value: string) => out.push({ group, key, value });
  const has = (f: string) => st.chunks.some((c) => c.fourcc === f);
  const vp8x = st.chunks[0]?.fourcc === 'VP8X' ? st.chunks[0] : undefined;
  const frames = st.chunks.filter((c) => c.fourcc === 'ANMF').length;

  add('Encoding', 'Container', vp8x ? 'Extended (VP8X)' : 'Simple');
  const vp8l = st.chunks.find((c) => c.fourcc === 'VP8L');
  if (has('VP8 ')) add('Encoding', 'Compression', 'Lossy (VP8)');
  else if (vp8l) add('Encoding', 'Compression', 'Lossless (VP8L)');
  else if (frames) add('Encoding', 'Compression', 'Per-frame (animated)');

  let alpha = has('ALPH') || (vp8x ? (b[vp8x.dataStart] & 0x10) !== 0 : false);
  if (vp8l && vp8l.size >= 5) alpha ||= ((readU32LE(b, vp8l.dataStart + 1) >>> 28) & 1) === 1;
  add('Color', 'Alpha channel', alpha ? 'Yes' : 'No');

  if (frames) {
    add('Animation', 'Frames', String(frames));
    const anim = st.chunks.find((c) => c.fourcc === 'ANIM');
    if (anim && anim.size >= 6) {
      const loops = readU16LE(b, anim.dataStart + 4);
      add('Animation', 'Loop count', loops === 0 ? 'Infinite' : String(loops));
    }
  }
  return out;
}
