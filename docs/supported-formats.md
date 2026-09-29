# Supported formats

Only rows covered by automated tests are marked ✓.

## Metadata support matrix

| Metadata | JPEG | PNG | WebP | Default mode | "Remove all" mode |
|---|:-:|:-:|:-:|---|---|
| EXIF (incl. GPS, thumbnail) | ✓ APP1 | ✓ `eXIf` | ✓ `EXIF` | Removed (orientation optionally kept) | Removed |
| XMP | ✓ APP1 + Extended XMP | ✓ `iTXt` XML:com.adobe.xmp | ✓ `XMP ` | Removed | Removed |
| IPTC / Photoshop IRB | ✓ APP13 | – | – | Removed | Removed |
| Comments / text | ✓ COM | ✓ `tEXt` `zTXt` `iTXt` | – | Removed | Removed |
| Modification time | – | ✓ `tIME` | – | Removed | Removed |
| C2PA / JUMBF | ✓ APP11 | ✓ `caBX` | ✓ `C2PA` | Removed (detected, not validated) | Removed |
| ICC color profile | ✓ APP2 | ✓ `iCCP` | ✓ `ICCP` | **Kept** | Removed |
| Multi-Picture / FlashPix / other APPn | ✓ | – | – | Removed | Removed |
| Unknown ancillary / unknown chunks | – | ✓ | ✓ | Removed | Removed |
| Data after end of image | ✓ | ✓ | ✓ | Removed | Removed |

## Always kept (needed for correct decoding)

- **JPEG:** SOF/DQT/DHT/SOS/DRI/scan data, APP0 JFIF header, APP14 Adobe (color transform).
- **PNG:** `IHDR PLTE IDAT IEND tRNS bKGD gAMA cHRM sRGB sBIT cICP mDCV cLLI pHYs hIST sPLT` and APNG `acTL fcTL fdAT`.
- **WebP:** `VP8X` (flags rewritten to match remaining chunks), `VP8 `, `VP8L`, `ALPH`, `ANIM`, `ANMF`.

## Orientation

If the original EXIF orientation is not `1`, the sanitizer can write a new 26-byte TIFF block containing **only** the Orientation tag. It's on by default and can be turned off. For WebP this only happens when the file already uses the extended (VP8X) format.

## Planned

HEIC/HEIF, AVIF, TIFF (inspect → sanitize → verify, in that order).
