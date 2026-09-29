// Resource limits. Tune these based on real-device testing.

export const LIMITS = {
  /** Maximum accepted input file size in bytes. */
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Maximum pixel count (width × height) read from the image header. */
  MAX_PIXELS: 100_000_000,
  /** Largest image we'll fully decode for output verification and preview. */
  MAX_DECODE_PIXELS: 60_000_000,
  /** Cap on decompressed size of a single compressed text/profile chunk. */
  MAX_INFLATE_BYTES: 4 * 1024 * 1024,
  /** Longest metadata value shown in the UI; longer values are truncated. */
  MAX_VALUE_LENGTH: 2000,
  /** Maximum metadata entries collected per file. */
  MAX_ENTRIES: 5000,
} as const;
