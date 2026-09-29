import { concat, matchAscii, writeU32LE } from '../../lib/bytes';
import { formatBytes } from '../../utils/format.utils';
import { describeWebpChunk, VP8X_FLAG, walkWebp } from '../formats/webp.structure';
import { parseExif } from '../metadata/exif.parser';
import { shouldRemove } from '../metadata/metadata.types';
import { buildOrientationTiff, needsOrientation } from './exif.builder';
import type { SanitizeOptions, SanitizeResult } from './sanitizer.types';

function riffChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const pad = data.length & 1;
  const out = new Uint8Array(8 + data.length + pad);
  for (let i = 0; i < 4; i++) out[i] = fourcc.charCodeAt(i);
  writeU32LE(out, 4, data.length);
  out.set(data, 8);
  return out;
}

export function sanitizeWebp(b: Uint8Array, opts: SanitizeOptions): SanitizeResult {
  const st = walkWebp(b);
  const log: string[] = [];
  const parts: Uint8Array[] = [];
  const present = { EXIF: false, 'XMP ': false, ICCP: false };
  let orientation: number | undefined;
  let exifRemoved = false;
  let vp8xIndex = -1;

  for (const chunk of st.chunks) {
    const d = describeWebpChunk(chunk);
    if (d && shouldRemove(d.action, opts.mode)) {
      if (chunk.fourcc === 'EXIF') {
        exifRemoved = true;
        const data = b.subarray(chunk.dataStart, chunk.dataStart + chunk.size);
        orientation ??= parseExif(matchAscii(data, 0, 'Exif\0\0') ? data.subarray(6) : data).orientation;
      }
      log.push(`Removed ${d.location} (${formatBytes(chunk.end - chunk.start)})`);
      continue;
    }
    if (chunk.fourcc in present) present[chunk.fourcc as keyof typeof present] = true;
    if (chunk.fourcc === 'VP8X') {
      vp8xIndex = parts.length;
      parts.push(b.slice(chunk.start, chunk.end)); // copy: flags are rewritten below
    } else {
      parts.push(b.subarray(chunk.start, chunk.end));
    }
  }

  const trailing = b.length - st.riffEnd;
  if (trailing > 0) log.push(`Removed data after end of image (${formatBytes(trailing)})`);

  // EXIF/XMP chunks are only valid in the extended (VP8X) format.
  const addOrientation = exifRemoved && vp8xIndex >= 0 && needsOrientation(orientation, opts.preserveOrientation);
  if (addOrientation) {
    parts.push(riffChunk('EXIF', buildOrientationTiff(orientation!)));
    present.EXIF = true;
    log.push(`Kept orientation only (value ${orientation}) in a minimal EXIF chunk`);
  }

  if (vp8xIndex >= 0) {
    const vp8x = parts[vp8xIndex];
    let flags = vp8x[8];
    if (!present.EXIF) flags &= ~VP8X_FLAG.EXIF;
    if (!present['XMP ']) flags &= ~VP8X_FLAG.XMP;
    if (!present.ICCP) flags &= ~VP8X_FLAG.ICC;
    vp8x[8] = flags;
  }

  const body = concat(parts);
  const header = new Uint8Array(12);
  header.set([0x52, 0x49, 0x46, 0x46]); // RIFF
  writeU32LE(header, 4, body.length + 4);
  header.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  return { bytes: concat([header, body]), log, orientationPreserved: addOrientation ? orientation : undefined };
}
