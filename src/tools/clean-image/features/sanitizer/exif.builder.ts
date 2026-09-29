// Builds the smallest valid EXIF/TIFF block carrying only the Orientation tag.
// Used to preserve visual orientation after all other EXIF data is removed.

export function buildOrientationTiff(orientation: number): Uint8Array<ArrayBuffer> {
  // Big-endian TIFF header, one IFD entry (0x0112 SHORT ×1), no next IFD.
  return new Uint8Array([
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation & 0xff, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
}

export function needsOrientation(orientation: number | undefined, preserve: boolean): orientation is number {
  return preserve && orientation !== undefined && orientation >= 2 && orientation <= 8;
}
