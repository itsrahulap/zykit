// Bounded zlib inflate built on the platform DecompressionStream.
// The output cap protects against decompression bombs hidden in PNG text chunks.

export interface InflateResult {
  bytes: Uint8Array<ArrayBuffer>;
  truncated: boolean;
}

export async function inflateBounded(data: Uint8Array, maxOutput: number): Promise<InflateResult> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream is not available in this browser');
  }
  const stream = new Blob([data as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maxOutput - total;
    if (value.length > remaining) {
      chunks.push(value.subarray(0, remaining));
      total = maxOutput;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    total += value.length;
  }
  const bytes = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    bytes.set(c, o);
    o += c.length;
  }
  return { bytes, truncated };
}
