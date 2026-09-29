import { bytesEqual, concat } from '../../../../shared/lib/bytes';
import type { ImageFormat } from '../../types/image.types';
import { describeJpegSegment, walkJpeg } from '../formats/jpeg.structure';
import { describePngChunk, walkPng } from '../formats/png.structure';
import { describeWebpChunk, walkWebp } from '../formats/webp.structure';

/**
 * Concatenates every non-metadata container (quantization tables, frame headers,
 * compressed scans, IDAT, VP8 bitstreams…). If these bytes are identical before and
 * after sanitization, the image was not re-encoded and pixels cannot have changed.
 */
export function extractImageData(format: ImageFormat, b: Uint8Array): Uint8Array {
  if (format === 'jpeg') {
    const st = walkJpeg(b);
    return concat(st.segments.filter((s) => describeJpegSegment(b, s) === null).map((s) => b.subarray(s.start, s.end)));
  }
  if (format === 'png') {
    const st = walkPng(b);
    return concat(st.chunks.filter((c) => describePngChunk(b, c) === null).map((c) => b.subarray(c.start, c.end)));
  }
  const st = walkWebp(b);
  // VP8X is excluded because its metadata flags are legitimately rewritten.
  return concat(
    st.chunks
      .filter((c) => c.fourcc !== 'VP8X' && describeWebpChunk(c) === null)
      .map((c) => b.subarray(c.dataStart, c.dataStart + c.size)),
  );
}

export function imageDataIdentical(format: ImageFormat, a: Uint8Array, b: Uint8Array): boolean {
  return bytesEqual(extractImageData(format, a), extractImageData(format, b));
}
