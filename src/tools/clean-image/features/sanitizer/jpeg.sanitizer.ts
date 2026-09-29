import { concat, matchAscii } from '../../../../shared/lib/bytes';
import { formatBytes } from '../../../../shared/utils/format.utils';
import { describeJpegSegment, walkJpeg, type JpegSegment } from '../formats/jpeg.structure';
import { parseExif } from '../metadata/exif.parser';
import { shouldRemove } from '../metadata/metadata.types';
import { buildOrientationTiff, needsOrientation } from './exif.builder';
import type { SanitizeOptions, SanitizeResult } from './sanitizer.types';

function orientationOf(b: Uint8Array, segments: JpegSegment[]): number | undefined {
  for (const seg of segments) {
    if (seg.marker === 0xe1 && matchAscii(b, seg.dataStart, 'Exif\0')) {
      const o = parseExif(b.subarray(seg.dataStart + 6, seg.dataEnd)).orientation;
      if (o !== undefined) return o;
    }
  }
  return undefined;
}

function orientationSegment(orientation: number): Uint8Array {
  const tiff = buildOrientationTiff(orientation);
  const len = 2 + 6 + tiff.length;
  return concat([new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff]), new TextEncoder().encode('Exif\0\0'), tiff]);
}

export function sanitizeJpeg(b: Uint8Array, opts: SanitizeOptions): SanitizeResult {
  const st = walkJpeg(b);
  const log: string[] = [];
  const kept: { seg: JpegSegment; jfif: boolean }[] = [];
  let exifRemoved = false;

  for (const seg of st.segments) {
    const d = describeJpegSegment(b, seg);
    if (d && shouldRemove(d.action, opts.mode)) {
      log.push(`Removed ${d.location} (${formatBytes(seg.end - seg.start)})`);
      if (d.kind === 'exif') exifRemoved = true;
      continue;
    }
    kept.push({ seg, jfif: d?.kind === 'jfif' });
  }
  const trailing = b.length - st.eoiEnd;
  if (trailing > 0) log.push(`Removed data after end of image (${formatBytes(trailing)})`);

  const parts: Uint8Array[] = [b.subarray(0, 2)]; // SOI
  const orientation = orientationOf(b, st.segments);
  const addOrientation = exifRemoved && needsOrientation(orientation, opts.preserveOrientation);
  // EXIF APP1 goes right after SOI, or after the JFIF APP0 when present.
  const insertAt = addOrientation ? (kept[0]?.jfif ? 1 : 0) : -1;

  kept.forEach(({ seg }, i) => {
    if (i === insertAt) parts.push(orientationSegment(orientation!));
    parts.push(b.subarray(seg.start, seg.end));
  });
  if (addOrientation) log.push(`Kept orientation only (value ${orientation}) in a minimal EXIF block`);

  return { bytes: concat(parts), log, orientationPreserved: addOrientation ? orientation : undefined };
}
