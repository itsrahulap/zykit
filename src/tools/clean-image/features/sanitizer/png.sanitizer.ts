import { concat, matchAscii, writeU32BE } from '../../../../shared/lib/bytes';
import { crc32 } from '../../../../shared/lib/crc32';
import { formatBytes } from '../../../../shared/utils/format.utils';
import { describePngChunk, PNG_SIGNATURE, walkPng } from '../formats/png.structure';
import { parseExif } from '../metadata/exif.parser';
import { shouldRemove } from '../metadata/metadata.types';
import { buildOrientationTiff, needsOrientation } from './exif.builder';
import type { SanitizeOptions, SanitizeResult } from './sanitizer.types';

export function buildPngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  writeU32BE(out, 0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  writeU32BE(out, 8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export function sanitizePng(b: Uint8Array, opts: SanitizeOptions): SanitizeResult {
  const st = walkPng(b);
  const log: string[] = [];
  const parts: Uint8Array[] = [PNG_SIGNATURE];
  let orientation: number | undefined;
  let exifRemoved = false;

  for (const chunk of st.chunks) {
    const d = describePngChunk(b, chunk);
    if (d && shouldRemove(d.action, opts.mode)) {
      if (chunk.type === 'eXIf') {
        exifRemoved = true;
        const data = b.subarray(chunk.dataStart, chunk.dataEnd);
        orientation ??= parseExif(matchAscii(data, 0, 'Exif\0\0') ? data.subarray(6) : data).orientation;
      }
      log.push(`Removed ${d.location} (${formatBytes(chunk.end - chunk.start)})`);
      continue;
    }
    parts.push(b.subarray(chunk.start, chunk.end));
  }

  const trailing = b.length - st.iendEnd;
  if (trailing > 0) log.push(`Removed data after end of image (${formatBytes(trailing)})`);

  const addOrientation = exifRemoved && needsOrientation(orientation, opts.preserveOrientation);
  if (addOrientation) {
    // Insert right after IHDR (eXIf must precede IDAT).
    parts.splice(2, 0, buildPngChunk('eXIf', buildOrientationTiff(orientation!)));
    log.push(`Kept orientation only (value ${orientation}) in a minimal eXIf chunk`);
  }
  return { bytes: concat(parts), log, orientationPreserved: addOrientation ? orientation : undefined };
}
